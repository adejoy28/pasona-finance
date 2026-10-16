# OPay Bank Statement Import — Implementation Instructions

## Differences from Kuda (read this first)

| | Kuda | OPay |
|---|---|---|
| Date format | `01/01/26 00:58:17` | `04 Jan 2026 21:57:28` |
| Amount columns | Money In / Money Out | Debit(₦) / Credit(₦) |
| Empty amount | blank cell | `--` string |
| Reference column | none | Column 8 (Transaction Reference) |
| Description | plain text | Pipe-separated: `Name \| Bank \| AcctNo \| Note` |
| Duplicate key | date+type+amount | reference number (more reliable) |
| Special type | cash_withdrawal, interbank | cash_withdrawal, `owealth` (internal savings transfer) |

---

## BACKEND

### Step 1: Controller
Copy `OpayImportController.php` to:
```
backend/app/Http/Controllers/API/OpayImportController.php
```

### Step 2: Add routes
In `backend/routes/api.php`, inside the `auth:sanctum` group, add alongside the Kuda routes:

```php
Route::post('/import/opay/preview', [App\Http\Controllers\API\OpayImportController::class, 'preview']);
Route::post('/import/opay/store',   [App\Http\Controllers\API\OpayImportController::class, 'store']);
```

---

## FRONTEND

The frontend component is identical in structure to Kuda import. The only differences are:

### 1. Endpoint URLs
- Preview: `POST /api/import/opay/preview`
- Store: `POST /api/import/opay/store`

### 2. Account selector
Filter to accounts where name contains "Opay" or type is `mobile`.

### 3. Transfer suggestion labels
OPay introduces a third suggestion type — handle it in the Action Needed column:

| `transfer_suggestion` value | Show to user |
|---|---|
| `null` | — |
| `cash_withdrawal` | 💬 "Cash withdrawal? Change to Transfer" |
| `interbank` | 💬 "Bank transfer? Change to Transfer" |
| `owealth` | 💬 "OWealth savings withdrawal — mark as Transfer (internal)?" |

OWealth rows are money moving from OPay savings back to the OPay wallet. They are not real income — they should be logged as Transfer with `to_account_id` pointing to the same OPay account, or simply excluded. Give the user both options.

### 4. Description display
The `raw_description` field contains the original pipe-separated string — show this in a tooltip or expandable row detail so the user can see the full counterparty info (name, bank, account number) when reviewing.

The `description` field contains the cleaned version — use this as the display value in the main table column.

### 5. Reference field
Include `reference` in the payload sent to the store endpoint. The `transactions` table has a `reference` column — this improves future duplicate detection significantly since OPay reference numbers are unique per transaction.

---

## BANK SELECTOR ON UPLOAD SCREEN

Now that you have two banks, update the upload screen to include a bank selector:

```
[ Select bank: Kuda ▼ / OPay ▼ ]
[ Select account: ... ]
[ Choose file ]
[ Preview ]
```

Route the preview/store calls based on selected bank:
- Kuda → `/api/import/kuda/preview` and `/api/import/kuda/store`
- OPay → `/api/import/opay/preview` and `/api/import/opay/store`

---

## EDGE CASES SPECIFIC TO OPAY

| Scenario | Handle by |
|---|---|
| OWealth deposit rows (Credit from savings) | `transfer_suggestion: 'owealth'` — prompt user to exclude or mark as internal transfer |
| Pipe-separated description has fewer than 4 parts | `parseOpayDescription()` handles this gracefully — falls back to available parts |
| `--` in debit or credit column | `parseAmount()` treats `--` as 0 — already handled |
| Duplicate reference numbers across imports | Reference-based duplicate detection catches these before preview even renders |

---

## ADDING STERLING AND PALMPAY

Same pattern. When you have their export formats:
1. Identify: header row location, date format, amount column names, reference column if any
2. Create `SterlingImportController.php` / `PalmpayImportController.php`
3. Only `parseXlsx()`, `parseDate()`, `looksLikeDate()`, and `detectTransferType()` change
4. `store()` is copy-paste identical — consider extracting to `ImportService` at that point

---

## REFACTOR OPPORTUNITY (after all banks are done)

Extract shared logic into `app/Services/ImportService.php`:

```php
class ImportService {
    public function fetchExisting(array $parsed, int $userId): Collection { ... }
    public function store(array $transactions, int $userId): int { ... }
    public function parseAmount($value): float { ... }
}
```

Each bank controller then only owns its `parseXlsx()` method. Inject `ImportService` via the constructor.
