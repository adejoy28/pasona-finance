<?php

namespace App\Http\Controllers\API;

/**
 * ImportController File
 * 
 * Handles parsing and importing bank statements (CSV).
 */

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * ImportController Class
 * 
 * Provides logic to parse CSV data and identify potential duplicates.
 */
class ImportController extends Controller
{
    /**
     * Parse CSV data and return a preview with duplicate flags.
     * 
     * Expects CSV with columns: Date, Description, Amount, Dr/Cr
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function preview(Request $request)
    {
        $request->validate([
            'csv_content' => 'required|string',
            'account_id' => 'required|exists:accounts,id',
        ]);

        $rows = str_getcsv($request->csv_content, "\n");
        $header = str_getcsv(array_shift($rows)); // Assuming first row is header

        $parsed = [];
        foreach ($rows as $row) {
            $data = str_getcsv($row);
            if (count($data) < 4) continue;

            $parsed[] = [
                'transaction_date' => $this->parseDate($data[0]),
                'description'      => $data[1],
                'amount'           => abs(floatval(str_replace(',', '', $data[2]))),
                'type'             => strtolower($data[3]) === 'cr' ? 'income' : 'expense',
            ];
        }

        // One query for the whole batch — builds a set of (date, type, amount) keys
        // that already exist for this user, then each preview row checks the set.
        $existing = collect();
        if (! empty($parsed)) {
            $existing = Transaction::where('user_id', $request->user()->id)
                ->where(function ($q) use ($parsed) {
                    foreach ($parsed as $p) {
                        $q->orWhere(function ($sub) use ($p) {
                            $sub->where('transaction_date', $p['transaction_date'])
                                ->where('type', $p['type'])
                                ->where('amount', $p['amount']);
                        });
                    }
                })
                ->select(['transaction_date', 'type', 'amount'])
                ->get();

            $existing = $existing->mapWithKeys(fn ($t) => [
                $t->transaction_date.':'.$t->type.':'.(string) $t->amount => true,
            ]);
        }

        $preview = [];
        foreach ($parsed as $p) {
            $key = $p['transaction_date'].':'.$p['type'].':'.(string) $p['amount'];
            $preview[] = [
                'transaction_date' => $p['transaction_date'],
                'description'      => $p['description'],
                'amount'           => $p['amount'],
                'type'             => $p['type'],
                'is_duplicate'     => $existing->has($key),
                'account_id'       => $request->account_id,
            ];
        }

        return response()->json($preview);
    }

    /**
     * Finalize the import of selected rows.
     */
    public function store(Request $request)
    {
        $request->validate([
            'transactions' => 'required|array',
            'transactions.*.account_id' => 'required|exists:accounts,id',
            'transactions.*.transaction_date' => 'required|date',
            'transactions.*.amount' => 'required|numeric',
            'transactions.*.type' => 'required|in:income,expense',
        ]);

        $now = now();
        $userId = $request->user()->id;

        $rows = array_map(fn ($item) => array_merge($item, [
            'user_id'    => $userId,
            'is_synced'  => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]), $request->transactions);

        Transaction::insert($rows);

        $count = count($rows);

        return response()->json([
            'message' => "Successfully imported {$count} transactions."
        ]);
    }

    /**
     * Helper to parse various date formats.
     */
    private function parseDate($dateString)
    {
        try {
            return Carbon::parse($dateString)->format('Y-m-d');
        } catch (\Exception $e) {
            return Carbon::now()->format('Y-m-d'); // Fallback
        }
    }
}
