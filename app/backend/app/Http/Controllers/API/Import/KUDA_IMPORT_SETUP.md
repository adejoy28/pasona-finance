# Kuda Bank Import — Setup Guide

## 1. Install PhpSpreadsheet

Run this in your `backend/` directory:

```bash
composer require phpoffice/phpspreadsheet
```

---

## 2. Add the controller

Copy `KudaImportController.php` to:
```
backend/app/Http/Controllers/API/KudaImportController.php
```

---

## 3. Add routes

In `backend/routes/api.php`, inside the `auth:sanctum` middleware group, add:

```php
// Bank-specific import routes
Route::post('/import/kuda/preview', [App\Http\Controllers\API\KudaImportController::class, 'preview']);
Route::post('/import/kuda/store',   [App\Http\Controllers\API\KudaImportController::class, 'store']);
```

---

## 4. API Usage

### Preview (parse + duplicate detection)

```
POST /api/import/kuda/preview
Authorization: Bearer {token}
Content-Type: multipart/form-data

file:       [your Kuda .xlsx file]
account_id: [your Kuda account ID from /api/accounts]
```

**Response — array of parsed rows:**
```json
[
  {
    "transaction_date": "2026-01-01",
    "description": "the earing.",
    "amount": 10009.00,
    "type": "expense",
    "account_id": 3,
    "is_duplicate": false,
    "transfer_suggestion": null,
    "raw_to_from": "name of customer/7032367050/Opay Digital Services Limited"
  },
  {
    "transaction_date": "2026-03-06",
    "description": "sterling/john ayomide adeba/onebank transfer",
    "amount": 130000.00,
    "type": "income",
    "account_id": 3,
    "is_duplicate": false,
    "transfer_suggestion": "interbank",
    "raw_to_from": "kip:sterling/john ayomide adeba/onebank transfer"
  },
  {
    "transaction_date": "2026-01-01",
    "description": "wdrw",
    "amount": 5100.00,
    "type": "expense",
    "account_id": 3,
    "is_duplicate": true,
    "transfer_suggestion": "cash_withdrawal",
    "raw_to_from": ""
  }
]
```

**transfer_suggestion values:**
| Value | Meaning | What frontend should show |
|---|---|---|
| `null` | Normal income/expense | No suggestion needed |
| `cash_withdrawal` | Likely ATM/POS withdrawal | "This looks like a cash withdrawal — log as Transfer to Cash?" |
| `interbank` | Likely transfer between your accounts | "This looks like a bank transfer — mark as Transfer?" |

---

### Store (final import)

Only send rows the user confirmed — exclude `is_duplicate: true` rows unless user explicitly includes them.

```
POST /api/import/kuda/store
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactions": [
    {
      "transaction_date": "2026-01-01",
      "description": "the earing.",
      "amount": 10009.00,
      "type": "expense",
      "account_id": 3,
      "category_id": null,
      "to_account_id": null
    },
    {
      "transaction_date": "2026-03-06",
      "description": "wdrw",
      "amount": 5100.00,
      "type": "transfer",
      "account_id": 3,
      "to_account_id": 7,
      "category_id": null
    }
  ]
}
```

---

## 5. Transfer handling in the frontend

For any row where `transfer_suggestion` is not null, the frontend should:

1. Show a prompt: *"This looks like a [cash withdrawal / bank transfer]. Change type to Transfer?"*
2. If user says yes → show a `to_account_id` selector so they can pick the destination account
3. If user says no → keep as expense/income

**Never auto-apply the transfer suggestion.** Always user-confirmed.

---

## 6. Adding more banks later

When you get the Palmpay and Sterling export formats, create:
- `PalmpayImportController.php`
- `SterlingImportController.php`

Each follows the same pattern — only the `parseXlsx()` method changes to match that bank's column layout.

The `store()` method is identical for all banks — you can eventually extract it to a shared `ImportService` class to avoid duplication.

---

## 7. Known issues in current ImportController.php (pre-existing, not introduced here)

| Issue | Location | Risk |
|---|---|---|
| Silent date fallback to today | `parseDate()` | Data corruption — wrong dates get imported silently |
| No DB transaction on store | `store()` | Partial import on failure leaves dirty data |
| Duplicate check ignores `account_id` | `preview()` | Cross-account false negatives |

The new `KudaImportController` fixes all three of these.
