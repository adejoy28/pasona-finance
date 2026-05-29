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
        
        $preview = [];

        foreach ($rows as $row) {
            $data = str_getcsv($row);
            if (count($data) < 4) continue;

            $date = $this->parseDate($data[0]);
            $description = $data[1];
            $amount = abs(floatval(str_replace(',', '', $data[2])));
            $type = strtolower($data[3]) === 'cr' ? 'income' : 'expense';

            // Check for potential duplicate in DB
            $isDuplicate = Transaction::where('user_id', $request->user()->id)
                ->where('transaction_date', $date)
                ->where('amount', $amount)
                ->where('type', $type)
                ->exists();

            $preview[] = [
                'transaction_date' => $date,
                'description' => $description,
                'amount' => $amount,
                'type' => $type,
                'is_duplicate' => $isDuplicate,
                'account_id' => $request->account_id,
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

        $importedCount = 0;
        foreach ($request->transactions as $item) {
            $request->user()->transactions()->create($item);
            $importedCount++;
        }

        return response()->json([
            'message' => "Successfully imported $importedCount transactions."
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
