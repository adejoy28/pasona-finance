# Bank Import System

## Overview

Each supported bank has its own controller under
`backend/app/Http/Controllers/API/Import/`. All bank controllers extend
`BaseImportController`, which provides the shared write path, dedup
pipeline, and amount/date helpers.

| Bank | Endpoint prefix | Input format | Notes |
|---|---|---|---|
| Generic CSV | `/api/import/...` | raw CSV string | No transfer suggestions, no file upload |
| Kuda | `/api/import/kuda/...` | .xlsx (multipart) | Transfer suggestions: `cash_withdrawal`, `interbank` |
| OPay | `/api/import/opay/...` | .xlsx (multipart) | Transfer suggestions: `owealth`, `cash_withdrawal`. Reference-based dedup. |

## What `BaseImportController` provides

| Member | Visibility | Purpose |
|---|---|---|
| `store(Request)` | public | Shared write path. DB transaction + 100-row chunks. |
| `buildPreviewResponse(Request, array)` | protected | Empty check → dedup → decorate → respond. |
| `decoratePreviewRow(array, Collection, Request)` | protected | Adds `account_id` + `is_duplicate`. Override to add bank-specific fields. |
| `fetchExisting(array, int)` | protected | Default dedup via single OR-WHERE on `(date, type, amount)`. |
| `duplicateKey(array)` | protected | Default key: `date:type:amount`. |
| `parseAmount($value)` | protected | Strips `₦`, commas, whitespace. |
| `parseDate($value)` | protected | Carbon::parse with logged fallback. |

## What each subclass implements

Every bank controller must implement:

```php
abstract protected function parseRows(Request $request): array;
```

Each row must include at least:
- `transaction_date` (Y-m-d)
- `description`
- `amount` (float)
- `type` (`income`, `expense`, or `transfer`)

Subclasses MAY also override:
- `decoratePreviewRow()` — to add bank-specific preview fields
- `parseDate()` / `parseAmount()` — for bank-specific formats
- `fetchExisting()` — for bank-specific dedup strategies (e.g. reference-based)

## Adding a new bank

1. Drop the bank's xlsx/pdf sample into a working folder for reference.
2. Create `XxxImportController extends BaseImportController` in
   `backend/app/Http/Controllers/API/Import/`.
3. Implement `parseRows(Request): array` for that bank's file format.
4. (Optional) Override `decoratePreviewRow()` to add bank-specific fields.
5. (Optional) Override `parseDate()` / `parseAmount()` for the bank's format.
6. (Optional) Override `fetchExisting()` if the bank has a better dedup key
   than `date+type+amount` (e.g. transaction reference).
7. Register the two routes in `backend/routes/api.php`:
   ```php
   Route::post('import/xxx/preview', [XxxImportController::class, 'preview']);
   Route::post('import/xxx/store',   [XxxImportController::class, 'store']);
   ```
8. Add a row to the bank table above.
9. Update the frontend's bank selector (see frontend `BANKS.md` once written).

## Preview response contract

Every bank's preview endpoint returns a JSON array of objects. All rows
share these common fields:

| Field | Source | Always present? |
|---|---|---|
| `transaction_date` | parser | yes |
| `description` | parser | yes |
| `amount` | parser | yes |
| `type` | parser | yes |
| `account_id` | request | yes (added by `decoratePreviewRow`) |
| `is_duplicate` | `fetchExisting` | yes (added by `decoratePreviewRow`) |

Bank-specific extras passed through unchanged:

| Bank | Extra fields |
|---|---|
| Kuda | `transfer_suggestion` (null/`cash_withdrawal`/`interbank`), `raw_to_from` |
| OPay | `transfer_suggestion` (null/`owealth`/`cash_withdrawal`), `raw_description`, `reference` |

## Store request contract

```json
POST /api/import/{bank}/store
{
  "transactions": [
    {
      "transaction_date": "2026-01-01",
      "description": "...",
      "amount": 100.00,
      "type": "expense",
      "account_id": 3,
      "to_account_id": null,
      "category_id": null,
      "reference": null
    }
  ]
}
```

All fields except `transaction_date`, `amount`, `type`, `account_id` are
optional. The `reference` field is included so banks that use it (OPay)
can round-trip the value; banks that don't (Kuda, generic) simply pass
null.
