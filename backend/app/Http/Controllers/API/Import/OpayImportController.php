<?php

namespace App\Http\Controllers\API\Import;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * OpayImportController Class
 *
 * Imports OPay statements exported as .xlsx.
 * Inherits the standard preview/store/dedupe pipeline from BaseImportController
 * and adds:
 *   - xlsx parsing (via PhpSpreadsheet) with header detection
 *   - pipe-separated description cleanup
 *   - OWealth (OPay internal savings) and cash-withdrawal detection
 *   - bank-specific date format ("04 Jan 2026 21:57:28")
 *   - reference-based dedup (uses transaction ref where available,
 *     falls back to date+type+amount for rows without one)
 */
class OpayImportController extends BaseImportController
{
    // OWealth is OPay's internal savings feature — these are wallet → savings transfers
    private const OWEALTH_KEYWORDS = ['owealth'];

    // Cash withdrawal patterns
    private const CASH_KEYWORDS = ['wdrw', 'atm', 'pos', 'withdrawal', 'cash out'];

    /**
     * Preview parsed OPay .xlsx and flag duplicates + transfer suggestions.
     *
     * Expects multipart upload: file (xlsx), account_id
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file'       => 'required|file|mimes:xlsx,xls|max:5120',
            'account_id' => 'required|exists:accounts,id',
        ]);

        return $this->buildPreviewResponse($request, $this->parseRows($request));
    }

    /**
     * OPay duplicates by reference (most reliable) but falls back to
     * date+type+amount for rows without a reference. Two queries instead of the
     * base's single OR-WHERE on tuples.
     */
    protected function fetchExisting(array $parsed, int $userId): Collection
    {
        $refs    = array_values(array_filter(array_column($parsed, 'reference')));
        $nonRefs = array_values(array_filter($parsed, fn ($p) => empty($p['reference'])));

        $existing = collect();

        if (! empty($refs)) {
            $existing = $existing->merge(
                Transaction::where('user_id', $userId)
                    ->whereIn('reference', $refs)
                    ->pluck('reference')
                    ->mapWithKeys(fn ($r) => ['ref:' . $r => true])
            );
        }

        if (! empty($nonRefs)) {
            $existing = $existing->merge(
                Transaction::where('user_id', $userId)
                    ->where(function ($q) use ($nonRefs) {
                        foreach ($nonRefs as $p) {
                            $q->orWhere(function ($sub) use ($p) {
                                $sub->where('transaction_date', $p['transaction_date'])
                                    ->where('type', $p['type'])
                                    ->where('amount', $p['amount']);
                            });
                        }
                    })
                    ->select(['transaction_date', 'type', 'amount'])
                    ->get()
                    ->mapWithKeys(fn ($t) => [
                        $t->transaction_date . ':' . $t->type . ':' . (string) $t->amount => true,
                    ])
            );
        }

        return $existing;
    }

    /**
     * Compute the right lookup key per row — ref-based if available,
     * otherwise the standard date:type:amount key from the base.
     * Also attaches OPay-specific preview fields.
     */
    protected function decoratePreviewRow(array $row, Collection $existing, Request $request): array
    {
        $key = ! empty($row['reference'])
            ? 'ref:' . $row['reference']
            : $this->duplicateKey($row);

        return array_merge($row, [
            'account_id'          => $request->account_id,
            'is_duplicate'        => $existing->has($key),
            'transfer_suggestion' => $row['transfer_suggestion'] ?? null,
            'raw_description'     => $row['raw_description'] ?? null,
        ]);
    }

    /**
     * OPay date format: "04 Jan 2026 21:57:28"
     */
    protected function parseDate($value): string
    {
        try {
            return Carbon::createFromFormat('d M Y H:i:s', trim((string) $value))->format('Y-m-d');
        } catch (\Exception $e) {
            return parent::parseDate($value);
        }
    }

    /**
     * OPay amounts may be the placeholder "--" for the inactive side of a row.
     */
    protected function parseAmount($value): float
    {
        if (empty($value) || trim((string) $value) === '--') {
            return 0.0;
        }
        return parent::parseAmount($value);
    }

    /**
     * OPay parses xlsx — entry point for the base's preview pipeline.
     */
    protected function parseRows(Request $request): array
    {
        return $this->parseOpayXlsx($request->file('file'));
    }

    // -------------------------------------------------------------------------
    // OPay-specific parsing
    // -------------------------------------------------------------------------

    /**
     * Parse an OPay .xlsx file and return normalised rows.
     *
     * OPay format:
     * Row 0: Account Type | Wallet Account | Period | ...   ← skip
     * Row 1: Opening Balance | ... Total Debit | ...        ← skip
     * Row 2: Closing Balance | ...                          ← skip
     * Row 3: (empty)                                        ← skip
     * Row 4: Trans. Date | Value Date | Description | Debit(₦) | Credit(₦) | Balance After(₦) | Channel | Transaction Reference
     * Row 5+: data
     */
    private function parseOpayXlsx($file): array
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet       = $spreadsheet->getActiveSheet();
        $rows        = $sheet->toArray(null, true, true, false);

        // Find header row — look for "Trans. Date" in first column + "Description"
        $headerIndex = null;
        foreach ($rows as $i => $row) {
            if (isset($row[0]) && stripos((string) $row[0], 'Trans') !== false
                && isset($row[2]) && stripos((string) $row[2], 'Description') !== false) {
                $headerIndex = $i;
                break;
            }
        }

        if ($headerIndex === null) {
            return [];
        }

        $parsed   = [];
        $dataRows = array_slice($rows, $headerIndex + 1);

        foreach ($dataRows as $row) {
            // Skip empty or summary rows
            if (empty($row[0]) || !$this->looksLikeDate($row[0])) {
                continue;
            }

            $debit  = $this->parseAmount($row[3] ?? '');
            $credit = $this->parseAmount($row[4] ?? '');

            // Skip rows where both debit and credit are zero (e.g. blank rows)
            if ($debit == 0 && $credit == 0) {
                continue;
            }

            $description = trim((string) ($row[2] ?? ''));
            $reference   = trim((string) ($row[7] ?? ''));
            $type        = $credit > 0 ? 'income' : 'expense';
            $amount      = $credit > 0 ? $credit : $debit;

            // OPay descriptions are pipe-separated: "Transfer to Name | Bank | AccountNo | Note"
            $cleanDescription   = $this->parseOpayDescription($description);
            $transferSuggestion = $this->detectTransferType($description);

            $parsed[] = [
                'transaction_date'    => $this->parseDate($row[0]),
                'description'         => $cleanDescription,
                'amount'              => $amount,
                'type'                => $type,
                'reference'           => $reference ?: null,
                'transfer_suggestion' => $transferSuggestion, // null | 'owealth' | 'cash_withdrawal'
                'raw_description'     => $description, // keep original for frontend display
            ];
        }

        return $parsed;
    }

    /**
     * OPay descriptions follow a pipe pattern:
     * "Transfer to Name | Bank | AccountNo | Note"
     * "OWealth Withdrawal(Transaction Payment)"
     *
     * Returns a cleaner string: "Transfer to Name — Note" or original if no pipes.
     */
    private function parseOpayDescription(string $raw): string
    {
        if (! str_contains($raw, '|')) {
            return trim($raw);
        }

        $parts = array_map('trim', explode('|', $raw));

        // parts[0] = "Transfer to Name", parts[1] = bank, parts[2] = acct, parts[3] = note
        $base = $parts[0] ?? '';
        $note = isset($parts[3]) && $parts[3] !== '' ? $parts[3] : null;

        return $note ? "{$base} — {$note}" : $base;
    }

    /**
     * Detect transfer types specific to OPay.
     *   'owealth'          → OPay's internal savings → wallet transfer
     *   'cash_withdrawal'  → ATM/POS/cash-out patterns
     */
    private function detectTransferType(string $description): ?string
    {
        $lower = strtolower($description);

        foreach (self::OWEALTH_KEYWORDS as $kw) {
            if (str_contains($lower, $kw)) {
                return 'owealth';
            }
        }

        foreach (self::CASH_KEYWORDS as $kw) {
            if (str_contains($lower, $kw)) {
                return 'cash_withdrawal';
            }
        }

        return null;
    }

    /**
     * Quick check: does this cell value look like an OPay date?
     */
    private function looksLikeDate($value): bool
    {
        return (bool) preg_match('/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/', (string) $value);
    }
}
