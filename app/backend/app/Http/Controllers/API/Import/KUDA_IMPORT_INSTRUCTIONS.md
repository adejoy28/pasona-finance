# Kuda Bank Statement Import — Full Implementation Instructions

## Overview
Build a two-step import flow: upload Kuda .xlsx → preview with duplicate/transfer flags → user confirms → store to DB.

---

## BACKEND

### Step 1: Install PhpSpreadsheet
```bash
cd backend
composer require phpoffice/phpspreadsheet
```

### Step 2: Create the controller
Create `backend/app/Http/Controllers/API/KudaImportController.php` with the full contents already provided in the separate `KudaImportController.php` file delivered in this session.

### Step 3: Register routes
In `backend/routes/api.php`, inside the existing `auth:sanctum` middleware group, add:

```php
Route::post('/import/kuda/preview', [App\Http\Controllers\API\KudaImportController::class, 'preview']);
Route::post('/import/kuda/store',   [App\Http\Controllers\API\KudaImportController::class, 'store']);
```

### Step 4: Allow xlsx file uploads
In `backend/config/cors.php`, confirm `api/*` is in the paths array — it already is per the backend context.

Ensure your server's `php.ini` has:
```
upload_max_filesize = 10M
post_max_size = 10M
```
Kuda statements are small but set this to be safe.

---

## FRONTEND (PWA)

### Component: `KudaImport.vue` or `KudaImport.jsx` (match your PWA stack)

Build a single page/component with three states:

---

### STATE 1: Upload screen

UI elements:
- Page title: "Import Kuda Statement"
- Account selector dropdown — fetches from `GET /api/accounts`, filters to show only accounts where `type === 'mobile'` or name contains "Kuda". Pre-select if only one match.
- File upload input — accept `.xlsx` only (`accept=".xlsx"`)
- A clear instruction line: "Download your statement from the Kuda app → Statement → Export"
- Submit button: "Preview Transactions"

On submit:
```
POST /api/import/kuda/preview
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [selected file]
account_id: [selected account id]
```

Show a loading spinner while waiting. On error show the API error message.

---

### STATE 2: Preview table

Display the array returned from the preview endpoint as a table with these columns:

| Column | Source field | Notes |
|---|---|---|
| Date | `transaction_date` | Format as DD/MM/YYYY for display |
| Description | `description` | |
| Amount (₦) | `amount` | Format with commas e.g. ₦10,009.00 |
| Type | `type` | Show as badge: green=income, red=expense |
| Action needed | computed | See logic below |
| Include? | checkbox | Default checked if not duplicate |

**Action needed column logic:**

| Condition | Show |
|---|---|
| `is_duplicate: true` | ⚠️ Already exists — uncheck by default |
| `transfer_suggestion: 'cash_withdrawal'` | 💬 "Cash withdrawal? Change to Transfer" — show a toggle |
| `transfer_suggestion: 'interbank'` | 💬 "Bank transfer? Change to Transfer" — show a toggle |
| neither | — (empty) |

**Transfer toggle behaviour:**
When user toggles a row to Transfer:
- Change `type` to `transfer`
- Show a second dropdown in that row: "To account" — populated from `GET /api/accounts`, excluding the current import account
- This `to_account_id` value must be included when storing that row

**Summary bar above the table (update live as checkboxes change):**
- Total selected: N transactions
- Total income: ₦X
- Total expenses: ₦X  
- Duplicates skipped: N

**Buttons:**
- "Select all" / "Deselect all"
- "Import Selected" — only active if at least one row is checked

---

### STATE 3: Confirm and store

On "Import Selected" click:

1. Collect all checked rows
2. For each row, build the transaction object:
```json
{
  "transaction_date": "2026-01-01",
  "description": "the earing.",
  "amount": 10009.00,
  "type": "expense",
  "account_id": 3,
  "category_id": null,
  "to_account_id": null
}
```
For transfer rows include `to_account_id`. Strip frontend-only fields (`is_duplicate`, `transfer_suggestion`, `raw_to_from`).

3. POST to store endpoint:
```
POST /api/import/kuda/store
Content-Type: application/json
Authorization: Bearer {token}

{
  "transactions": [ ...array of confirmed rows... ]
}
```

4. On success: show "✅ {N} transactions imported" and a button to go to Transactions list.
5. On error: show the error message, keep the user on the preview so they don't lose their work.

---

## EDGE CASES TO HANDLE IN THE UI

| Scenario | Handle by |
|---|---|
| File is not a valid Kuda xlsx | Backend returns 422 — show "Could not parse this file. Make sure you exported directly from the Kuda app." |
| All rows are duplicates | Show "No new transactions found — everything in this statement is already logged." |
| User marks a row as Transfer but doesn't pick a To account | Disable "Import Selected" and highlight the incomplete row in amber |
| Empty file / file with only the summary block | Backend returns empty array — show "No transactions found in this file." |

---

## ADDING MORE BANKS LATER

When Palmpay and Sterling export formats are available:

1. Create `PalmpayImportController.php` and `SterlingImportController.php`
2. Only the `parseXlsx()` private method changes per bank — the `store()` method is identical
3. Add routes: `POST /import/palmpay/preview`, `/import/palmpay/store` etc.
4. On the frontend, add a "Bank" selector on the upload screen that routes to the correct endpoint

Eventually refactor the shared `store()` logic into an `ImportService` class to avoid duplication across controllers.

---

## KNOWN ISSUES IN THE OLD ImportController (do not use for Kuda)

| Issue | Risk |
|---|---|
| Parses raw CSV string, not file upload | Breaks on xlsx |
| Silent date fallback to today on parse failure | Wrong dates imported silently |
| No DB transaction wrapping on store | Partial import on failure |
| Duplicate check ignores account_id | Cross-account false negatives |

All four are fixed in `KudaImportController`.
