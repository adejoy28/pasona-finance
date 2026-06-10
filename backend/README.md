# 🔧 Pasona API — Laravel Backend

The REST API powering Pasona FinTrack. Built with **Laravel 12** and **PostgreSQL**. Handles authentication, account management, transaction logging, CSV import, daily-reminder emails, password resets, and financial summaries.

---

## 📁 Folder Structure

```
pasona-api/                         # actually `backend/` in the repo
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AuthController.php              # Login, register, logout, check-email
│   │       ├── EmailVerificationController.php # send / verify / status
│   │       ├── ForgotPasswordController.php
│   │       ├── ResetPasswordController.php
│   │       ├── SocialAuthController.php        # Google OAuth
│   │       ├── AccountController.php           # CRUD for bank/mobile/cash accounts
│   │       ├── TransactionController.php       # CRUD + offline batch sync
│   │       ├── CategoryController.php          # CRUD for expense/income categories
│   │       ├── ImportController.php            # Generic CSV import + duplicate check
│   │       ├── KudaImportController.php        # Kuda bank-statement import
│   │       └── SummaryController.php           # Monthly summary + category breakdown
│   ├── Console/Commands/
│   │   ├── BackfillDefaultCategories.php
│   │   └── SendDailyReminders.php              # `artisan reminders:send-daily`
│   ├── Jobs/
│   │   ├── ProcessSync.php                     # Offline batch insert
│   │   └── SendTransactionReminder.php         # Per-user daily nudge
│   ├── Mail/
│   │   └── TransactionReminderMail.php
│   ├── Notifications/
│   │   ├── VerifyEmailNotification.php
│   │   └── ResetPasswordNotification.php
│   ├── Models/
│   │   ├── User.php                            # implements MustVerifyEmail
│   │   ├── Account.php
│   │   ├── Transaction.php
│   │   └── Category.php
│   └── Providers/AppServiceProvider.php
├── database/
│   ├── migrations/                             # incl. users.reminder_last_sent_at
│   └── seeders/
│       └── DatabaseSeeder.php
├── resources/
│   └── views/emails/                           # verify-email, reset-password, transaction-reminder
├── routes/
│   ├── api.php                                 # All API route definitions
│   └── console.php                             # Schedule (reminders:send-daily every 5 min)
├── .env.example                                # Environment variable template
└── README.md                                   # This file
```

---

## ⚙️ Requirements

- PHP 8.2 or higher
- Composer 2+
- PostgreSQL 15+
- Laravel 12

---

## 🚀 Installation

### Step 1 — Clone and install dependencies

```bash
cd fintrack-api
composer install
```

### Step 2 — Copy and configure environment

```bash
cp .env.example .env
```

Open `.env` and update these values:

```env
APP_NAME=FinTrack
APP_ENV=production
APP_KEY=                        # Will be generated in next step
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1               # Usually localhost on cPanel
DB_PORT=5432
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com

SESSION_DRIVER=cookie
SESSION_DOMAIN=.yourdomain.com
```

### Step 3 — Generate app key

```bash
php artisan key:generate
```

### Step 4 — Run migrations

This creates all the database tables.

```bash
php artisan migrate
```

### Step 5 — Start the local dev server

```bash
php artisan serve
# API will be available at http://localhost:8000
```

---

## 🗄 Database Schema

### `users`

| Column                 | Type      | Description                                                                |
| ---------------------- | --------- | -------------------------------------------------------------------------- |
| id                     | bigint    | Primary key                                                                |
| name                   | string    | User's full name                                                           |
| email                  | string    | Login email (unique)                                                       |
| email_verified_at      | timestamp | Set when the user clicks the verification link (or by Google OAuth)        |
| password               | string    | Hashed password (nullable for OAuth-only users)                            |
| google_id              | string    | Google account id (for OAuth linking)                                      |
| avatar                 | string    | Avatar URL from OAuth                                                      |
| reminder_time          | string    | Daily reminder time in `HH:MM` (user's local timezone)                             |
| timezone               | string    | IANA timezone (default `Africa/Lagos`); reminder matches user's local clock        |
| reminder_last_sent_at  | timestamp | Wall-clock of the last reminder send; used to dedupe                        |
| created_at             | timestamp | Record creation time                                                       |
| updated_at             | timestamp | Last update time                                                           |

### `accounts`

| Column           | Type              | Description                             |
| ---------------- | ----------------- | --------------------------------------- |
| id               | bigint            | Primary key                             |
| user_id          | bigint            | Foreign key → users                     |
| name             | string            | Account name (e.g. "Kuda")              |
| type             | enum              | bank / mobile / cash                    |
| starting_balance | decimal(15,2)     | Balance before any tracked transactions |
| notes            | string (nullable) | Optional description                    |
| created_at       | timestamp         |                                         |
| updated_at       | timestamp         |                                         |

### `categories`

| Column     | Type      | Description                              |
| ---------- | --------- | ---------------------------------------- |
| id         | bigint    | Primary key                              |
| user_id    | bigint    | Owner of the category                    |
| name       | string    | Category label (e.g. "Food & Groceries") |
| type       | enum      | income / expense                         |
| created_at | timestamp |                                          |
| updated_at | timestamp |                                          |

### `transactions`

| Column           | Type              | Description                                           |
| ---------------- | ----------------- | ----------------------------------------------------- |
| id               | bigint            | Primary key                                           |
| user_id          | bigint            | Foreign key → users                                   |
| account_id       | bigint            | The account money came FROM (or TO for income)        |
| to_account_id    | bigint (nullable) | Destination account — only used for transfers         |
| type             | enum              | income / expense / transfer                           |
| category_id      | bigint (nullable) | Foreign key → categories (not required for transfers) |
| amount           | decimal(15,2)     | Transaction amount in Naira                           |
| description      | string            | Short note about the transaction                      |
| reference        | string (nullable) | Bank transaction ID or receipt number                 |
| transaction_date | date              | The actual date of the transaction                    |
| is_synced        | boolean           | True once synced from offline queue                   |
| created_at       | timestamp         |                                                       |
| updated_at       | timestamp         |                                                       |

---

## 🌐 API Endpoints

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer {token}` header.

### Authentication

| Method | Route                              | Description                                                                                       |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| POST   | `/api/register`                    | Create a new account. Returns `{ access_token, token_type, user, email_verified, email_verified_at }` |
| POST   | `/api/login`                       | Login and get token                                                                               |
| POST   | `/api/logout`                      | Invalidate current token                                                                          |
| GET    | `/api/me`                          | Get current user profile                                                                          |
| GET    | `/api/auth/check-email`            | Email-availability probe (rate-limited; same response shape whether the email exists or not)      |
| GET    | `/api/auth/google`                 | Start Google OAuth — returns `{ url }`                                                            |
| GET    | `/api/auth/google/callback`        | Finish Google OAuth; 302-redirects to SPA with `?token=…` and flips `email_verified_at`           |

### Password reset

| Method | Route                       | Description                                                                  |
| ------ | --------------------------- | ---------------------------------------------------------------------------- |
| POST   | `/api/forgot-password`      | Queue a reset email (built-in broker; 60s throttle, 60-min token)            |
| POST   | `/api/reset-password`       | Accepts `{ token, email, password, password_confirmation }` and updates hash |

### Email verification (opt-in)

| Method | Route                                                                | Auth | Description                                                                                                                  |
| ------ | -------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/email/verify/{id}/{hash}` (temporarily signed, 60 min expiry)  | —    | Click target from the email. 302-redirects to `FRONTEND_URL/dashboard?verified=1` on success, or `FRONTEND_URL/email/verify?error=expired\|invalid_hash` on failure |
| POST   | `/api/email/verification-notification`                               | ✓    | Resend the verification email (throttled 6/min)                                                                              |
| GET    | `/api/email/verification-status`                                     | ✓    | Returns `{ email_verified, email }` for the SPA banner                                                                       |

Sensitive bulk writers are gated by the `verified` middleware (see the **Mailing system** section below).

### Accounts

| Method | Route                | Description                          |
| ------ | -------------------- | ------------------------------------ |
| GET    | `/api/accounts`      | List all accounts with live balances |
| POST   | `/api/accounts`      | Create a new account                 |
| GET    | `/api/accounts/{id}` | Get a single account                 |
| PUT    | `/api/accounts/{id}` | Update account details               |
| DELETE | `/api/accounts/{id}` | Delete an account                    |

### Transactions

| Method | Route                    | Description                                   |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `/api/transactions`      | List all transactions (paginated, filterable) |
| POST   | `/api/transactions`      | Log a new transaction                         |
| GET    | `/api/transactions/{id}` | Get a single transaction                      |
| PUT    | `/api/transactions/{id}` | Update a transaction                          |
| DELETE | `/api/transactions/{id}` | Delete a transaction                          |
| POST   | `/api/transactions/bulk` | Sync offline batch (array of transactions)    |

### Categories

| Method | Route                  | Description                                    |
| ------ | ---------------------- | ---------------------------------------------- |
| GET    | `/api/categories`      | List all categories (defaults + user's custom) |
| POST   | `/api/categories`      | Create a custom category                       |
| PUT    | `/api/categories/{id}` | Rename a custom category                       |
| DELETE | `/api/categories/{id}` | Delete a custom category (not defaults)        |

### Import

| Method | Route                       | Verified | Description                                                    |
| ------ | --------------------------- | -------- | -------------------------------------------------------------- |
| POST   | `/api/import/preview`       | —        | Parse CSV and return rows with duplicate flags                 |
| POST   | `/api/import/store`         | ✓        | Save only the non-duplicate rows to transactions               |
| POST   | `/api/import/kuda/preview`  | —        | Kuda-specific bank-statement preview                            |
| POST   | `/api/import/kuda/store`    | ✓        | Kuda-specific bank-statement ingest                             |

### Summary

| Method | Route                     | Description                                                |
| ------ | ------------------------- | ---------------------------------------------------------- |
| GET    | `/api/summary/monthly`    | Monthly income, expenses, savings, savings rate            |
| GET    | `/api/summary/categories` | Expense totals grouped by category (filterable by quarter) |

---

## 🔐 Authentication Flow

1. User registers or logs in via `/api/login`
2. API returns a Sanctum token
3. Frontend stores token in `localStorage`
4. Every subsequent request sends `Authorization: Bearer {token}` header
5. On logout, token is deleted from database and `localStorage`

---

## 📦 Key Laravel Packages Used

| Package                        | Purpose                               |
| ------------------------------ | ------------------------------------- |
| `laravel/sanctum`              | Token-based API authentication        |
| `league/csv`                   | CSV parsing for bank statement import |
| `spatie/laravel-query-builder` | Filterable, sortable API queries      |

Install them:

```bash
composer require laravel/sanctum league/csv spatie/laravel-query-builder
```

---

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run only API tests
php artisan test --filter=Api
```

---

## 🗂 Environment Variables Reference

```env
# App
APP_NAME=Pasona
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com   # used in email links

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pasona_db
DB_USERNAME=pasona_user
DB_PASSWORD=secret

# Auth
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DRIVER=cookie
SESSION_DOMAIN=.yourdomain.com

# Queue (for import jobs + mail)
QUEUE_CONNECTION=database

# Mail (default = log; switch to smtp/resend/postmark to send real mail)
MAIL_MAILER=log
MAIL_FROM_ADDRESS="hello@yourdomain.com"
MAIL_FROM_NAME="Pasona"
# When you switch to real mail, also set:
# MAIL_HOST, MAIL_PORT, MAIL_SCHEME, MAIL_USERNAME, MAIL_PASSWORD
```

---

## 📬 Mailing system

Three transactional emails, all queued, all Markdown templates in `resources/views/emails/`.

| Email                | Class                                              | Blade template                                  | When it fires                                                                 |
| -------------------- | -------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Email verification   | `App\Notifications\VerifyEmailNotification`        | `emails/verify-email.blade.php`                 | On register (non-blocking). Resendable via `POST /api/email/verification-notification` |
| Password reset       | `App\Notifications\ResetPasswordNotification`      | `emails/reset-password.blade.php`               | On `POST /api/forgot-password` (built-in broker + 60-min token)               |
| Daily reminder       | `App\Mail\TransactionReminderMail`                 | `emails/transaction-reminder.blade.php`         | `reminders:send-daily` artisan, scheduled every 5 min in `routes/console.php` |

### Daily reminder

- `routes/console.php` schedules `reminders:send-daily` `everyFiveMinutes()` with `withoutOverlapping(10) onOneServer()`.
- The command groups users by their `timezone` column (default `Africa/Lagos`), computes `now()` per timezone group, and matches `reminder_time` within ±2 min of their local time (split into two ranges when the window crosses midnight), then:
  1. **Smart-skips** anyone who already logged a transaction today (toggle with `--no-smart-skip`)
  2. **Dedupe-skips** anyone whose `reminder_last_sent_at` is today
  3. Dispatches `App\Jobs\SendTransactionReminder` for the rest
- The job re-checks the dedupe window at handle time and stamps `reminder_last_sent_at` after a successful send. 3 tries, 60s backoff.
- The mailable personalises the email with the user’s own today-stats (income, expense, account count) and switches the subject between the cold-open and a “Quick gut-check” variant when the user has already logged something.

```bash
# Manual / one-shot
php artisan reminders:send-daily --dry-run
php artisan reminders:send-daily --user=42 --no-smart-skip
```

### Email verification

- The `User` model implements `MustVerifyEmail`. Verification is **opt-in** — no global `verified` middleware is applied to the API. Users can register, log in, and log transactions immediately.
- The only endpoints that require a verified email are the **sensitive bulk writers**: `POST /api/transactions/sync`, `POST /api/import/store`, `POST /api/import/kuda/store`. The middleware is registered as the `verified` alias in `bootstrap/app.php`; the `AuthorizationException` it throws is converted to a JSON `{ requires_verified_email: true, message }` envelope so the SPA can act.
- `GET /api/email/verification-status` lets the SPA render a dismissible banner without a page reload.
- Google OAuth auto-flips `email_verified_at` on first login (Google already proved the email).

#### Verification flow

1. The notification generates a **temporarily signed URL** (`URL::temporarySignedRoute`) with a 60-minute expiry — the URL includes `?expires=...&signature=...` query params.
2. The email link points at the SPA (`{FRONTEND_URL}/email/verify?verify_url=...`), which then redirects the browser to the signed backend URL.
3. Backend validates the signature via `$request->hasValidSignature()`. On success, `email_verified_at` is set and the browser is redirected to `{FRONTEND_URL}/dashboard?verified=1`.
4. On failure (expired link, invalid hash, user not found), the backend **redirects to the frontend with a descriptive `?error=` param** instead of returning a bare 403 — the SPA shows a friendly error page with a "Sign in" button.
5. The SPA `/email/verify` route renders appropriate error pages for: expired links, invalid hashes, and generic failures. No authentication is required to access this page (users clicking the link from email may not be logged in).
6. The dashboard handles `?verified=1` (success), `?verified=already` (already verified), and `?verified=error` (generic failure) toasts.

### Catching emails in dev

`MAIL_MAILER=log` writes every email (verification, reset, reminder) to `storage/logs/laravel.log`. Open the log, copy the link, paste it in your browser — no SMTP setup needed for local development.

To send real mail, switch `MAIL_MAILER` to `smtp` / `resend` / `postmark` and set the matching `MAIL_HOST/PORT/USERNAME/PASSWORD`. All three mail classes pick it up automatically — no code change.

---

## ⚠️ Common Issues

**Migration fails on PostgreSQL**
Make sure `pgsql` extension is enabled in your `php.ini`:

```
extension=pdo_pgsql
extension=pgsql
```

**CORS errors from frontend**
Update `config/cors.php` (`allowed_origins`) or set `CORS_ALLOWED_ORIGINS` in `.env` to include your frontend domain. The defaults already include `FRONTEND_URL` and `http://localhost:8080`.

**Token not working**
Make sure your request includes the header:

```
Accept: application/json
Authorization: Bearer your-token-here
```

**Reminder emails aren’t firing**
Run `php artisan schedule:work` (dev) or add `* * * * * cd /path/to/backend && php artisan schedule:run` to crontab (prod). Verify the schedule is registered with `php artisan schedule:list`. Manual one-shot: `php artisan reminders:send-daily --dry-run`.

**Verification email never arrives**
- In dev with `MAIL_MAILER=log`, the message is in `storage/logs/laravel.log` — search for `Subject: Confirm your Pasona email`.
- For real mail, check `MAIL_HOST/PORT/USERNAME/PASSWORD` and the `MAIL_FROM_ADDRESS` is on a domain you control (SPF/DKIM).

---

## 📄 License

MIT
