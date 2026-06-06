<?php

namespace App\Http\Controllers\API\Import;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * KudaImportController Class
 *
 * Imports Kuda Bank statements exported as .xlsx.
 * Inherits the standard preview/store/dedupe pipeline from BaseImportController
 * and adds:
 *   - xlsx parsing (via PhpSpreadsheet)
 *   - cash-withdrawal / inter-bank transfer detection (suggestion only)
 *   - bank-specific date format (DD/MM/YY HH:MM:SS)
 */
class KudaImportController extends BaseImportController
{
    // Keywords that suggest a transaction is a cash withdrawal (Transfer to Cash)
    private const TRANSFER_KEYWORDS = ['wdrw', 'atm', 'pos', 'withdrawal', 'cash'];

    // Keywords that suggest inter-bank transfer
    private const INTERBANK_KEYWORDS = ['kip:', 'nip transfer', 'transfer from', 'transfer to'];

    /**
     * Preview parsed Kuda .xlsx and flag duplicates + transfer suggestions.
     *
     * Expects multipart upload: file (xlsx), account_id
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file'       => 'required|file|mimes:xlsx,xls',
            'account_id' => 'required|exists:accounts,id',
        ]);

        return $this->buildPreviewResponse($request, $this->parseRows($request));
    }

    /**
     * Add transfer_suggestion to each preview row on top of the base fields.
     * transfer_suggestion is set by the parser and just passed through here.
     */
    protected function decoratePreviewRow(array $row, Collection $existing, Request $request): array
    {
        return array_merge(parent::decoratePreviewRow($row, $existing, $request), [
            'transfer_suggestion' => $row['transfer_suggestion'],
        ]);
    }

    /**
     * Kuda uses DD/MM/YY HH:MM:SS. Try that first, then fall through to the
     * generic Carbon::parse fallback in the base.
     */
    protected function parseDate($value): string
    {
        try {
            // Kuda uses DD/MM/YY HH:MM:SS
            return Carbon::createFromFormat('d/m/y H:i:s', trim((string) $value))->format('Y-m-d');
        } catch (\Exception $e) {
            return parent::parseDate($value);
        }
    }

    /**
     * Kuda parses xlsx — entry point for the base's preview pipeline.
     */
    protected function parseRows(Request $request): array
    {
        return $this->parseKudaXlsx($request->file('file'));
    }

    // -------------------------------------------------------------------------
    // Kuda-specific parsing
    // -------------------------------------------------------------------------

    /**
     * Parse a Kuda .xlsx file and return normalised rows.
     *
     * Kuda format (after summary block):
     * Date/Time | Money In | Money Out | Category | To/From | Description | Balance
     */
    private function parseKudaXlsx($file): array
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet       = $spreadsheet->getActiveSheet();
        $rows        = $sheet->toArray(null, true, true, false);

        // Find the header row — look for a row that contains "Date/Time"
        $headerIndex = null;
        foreach ($rows as $i => $row) {
            if (isset($row[0]) && stripos((string) $row[0], 'Date') !== false
                && isset($row[2]) && stripos((string) $row[2], 'Money') !== false) {
                $headerIndex = $i;
                break;
            }
        }

        if ($headerIndex === null) {
            return []; // Could not find data table
        }

        $parsed = [];
        $dataRows = array_slice($rows, $headerIndex + 1); // skip header row itself

        foreach ($dataRows as $row) {
            // Skip empty or summary rows
            if (empty($row[0]) || !$this->looksLikeDate($row[0])) {
                continue;
            }

            $moneyIn  = $this->parseAmount($row[1] ?? '');
            $moneyOut = $this->parseAmount($row[2] ?? '');

            // Skip rows where both money in and out are zero (e.g. blank rows)
            if ($moneyIn == 0 && $moneyOut == 0) {
                continue;
            }

            $description = trim((string) ($row[5] ?? ''));
            $toFrom      = trim((string) ($row[4] ?? ''));
            $type        = $moneyIn > 0 ? 'income' : 'expense';
            $amount      = $moneyIn > 0 ? $moneyIn : $moneyOut;

            // Suggest transfer type based on description keywords
            $transferSuggestion = $this->detectTransferType($description, $toFrom, $type);

            $parsed[] = [
                'transaction_date'    => $this->parseDate($row[0]),
                'description'         => $description ?: $toFrom,
                'amount'              => $amount,
                'type'                => $type,
                'transfer_suggestion' => $transferSuggestion, // null | 'cash_withdrawal' | 'interbank'
                'raw_to_from'         => $toFrom, // useful for frontend to show context
            ];
        }

        return $parsed;
    }

    /**
     * Detect if a transaction is likely a cash withdrawal or inter-bank transfer.
     * Returns a suggestion string for the frontend to show the user — never auto-applies.
     */
    private function detectTransferType(string $description, string $toFrom, string $type): ?string
    {
        $combined = strtolower($description . ' ' . $toFrom);

        foreach (self::TRANSFER_KEYWORDS as $keyword) {
            if (str_contains($combined, $keyword)) {
                return 'cash_withdrawal'; // Suggest: Transfer → Cash
            }
        }

        foreach (self::INTERBANK_KEYWORDS as $keyword) {
            if (str_contains($combined, $keyword)) {
                return 'interbank'; // Suggest: Transfer between bank accounts
            }
        }

        return null;
    }

    /**
     * Quick check: does this cell value look like a date?
     */
    private function looksLikeDate($value): bool
    {
        return (bool) preg_match('/\d{1,2}\/\d{1,2}\/\d{2,4}/', (string) $value);
    }
}
