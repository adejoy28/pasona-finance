<?php

namespace App\Http\Controllers\API\Import;

/**
 * ImportController File
 *
 * Handles parsing and importing bank statements from a raw CSV string.
 * CSV format: Date, Description, Amount, Dr/Cr
 */

use Illuminate\Http\Request;

/**
 * ImportController Class
 *
 * Generic CSV importer. The preview/store/dedupe pipeline lives in
 * BaseImportController; this subclass only defines the CSV row parser.
 */
class ImportController extends BaseImportController
{
    /**
     * Parse CSV data and return a preview with duplicate flags.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function preview(Request $request)
    {
        $request->validate([
            'csv_content' => 'required|string|max:100000',
            'account_id'  => 'required|exists:accounts,id',
        ]);

        return $this->buildPreviewResponse($request, $this->parseRows($request));
    }

    /**
     * Parse a raw CSV string into normalised rows.
     */
    protected function parseRows(Request $request): array
    {
        $rows   = str_getcsv($request->csv_content, "\n");
        $header = str_getcsv(array_shift($rows)); // First row is header

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

        return $parsed;
    }
}
