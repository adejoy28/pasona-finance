# Pasona Finance — Backend Architecture

## 1. Tech stack
- **PHP 8.2+**, **Laravel 12**
- **Laravel Sanctum 4** — bearer-token API auth (no SPA cookie flow currently)
- **Laravel Socialite 5** — Google OAuth
- **SQLite** for local dev / **PostgreSQL** configured (the `.env` is set to `pgsql` pointing at a local PostgreSQL instance at `127.0.0.1:5432`)
- **Cache driver:** `redis` via `predis/predis` (pure-PHP, no extension required). Falls back to `file` on shared cPanel. `failover` store configured as `['redis', 'file']`.
- **Queue driver: `database`** (uses the `jobs` table, processed by `php artisan queue:listen`)
- **Mail driver: `resend`** (Resend API via `RESEND_API_KEY`; `config/mail.php` defaults to `log` as fallback)
- **Frontend assets:** Vite, but the actual docs site ships pre-built CSS/JS in `public/css/docs.css` and `public/js/docs.js` (no live Vite serving needed)
- **Test stack:** PHPUnit 11, placeholder `ExampleTest` only (no feature tests written)

## 2. Directory layout (source only)
```
backend/
├── app/
│   ├── Http/Controllers/
│   │   ├── Controller.php
│   │   ├── EmailPreviewController.php       (dev-only browser preview of email templates)
│   │   ├── Admin/
│   │   │   └── AdminController.php          (session-based admin panel)
│   │   └── API/
│   │       ├── AuthController.php
│   │       ├── AccountController.php
│   │       ├── CategoryController.php
│   │       ├── TransactionController.php
│   │       ├── SummaryController.php
│   │       ├── EmailVerificationController.php
│   │       ├── ForgotPasswordController.php
│   │       ├── ResetPasswordController.php
│   │       ├── SocialAuthController.php
│   │       └── Import/
│   │           ├── BaseImportController.php  (shared scaffolding for all importers)
│   │           ├── ImportController.php      (generic CSV importer)
│   │           ├── KudaImportController.php
│   │           └── OpayImportController.php
│   ├── Http/Middleware/
│   │   └── AdminMiddleware.php              (session-based admin guard)
│   ├── Jobs/
│   │   ├── ProcessSync.php                  (offline transaction batch processing)
│   │   └── SendTransactionReminder.php      (daily reminder to a single user)
│   ├── Mail/
│   │   ├── WelcomeMail.php
│   │   └── TransactionReminderMail.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Account.php
│   │   ├── Category.php
│   │   ├── Transaction.php
│   │   ├── Announcement.php
│   │   ├── AnnouncementUser.php
│   │   └── EmailLog.php                     (tracks every email sent by the system)
│   ├── Notifications/
│   │   ├── ResetPasswordNotification.php    (fully implemented — builds SPA reset URL)
│   │   └── VerifyEmailNotification.php      (fully implemented — builds SPA verify URL)
│   ├── Policies/
│   │   ├── AccountPolicy.php
│   │   ├── CategoryPolicy.php
│   │   └── TransactionPolicy.php
│   └── Providers/
│       └── AppServiceProvider.php           (rate limiters, CSS inliner, mail logger)
├── config/         api, app, auth, cache, cors, database, filesystems, logging, mail, queue, sanctum, services, session
├── database/
│   ├── migrations/   (23 files — see section 5 for full list)
│   ├── seeders/      DatabaseSeeder, UserSeeder
│   └── factories/    UserFactory
├── public/        docs.css, docs.js, index.php, .htaccess
├── resources/
│   ├── views/
│   │   ├── admin/       login, dashboard, users/*, emails/*
│   │   ├── docs/        API docs site + email preview chrome
│   │   ├── emails/      welcome, verify-email, reset-password, transaction-reminder, reminder-announcement, democracy_day
│   │   └── layouts/     docs.blade.php
│   ├── css/app.css, js/app.js, js/bootstrap.js
│   └── views/welcome.blade.php
├── routes/
│   ├── api.php
│   ├── web.php        (docs site + admin panel + email preview)
│   └── console.php   (schedule: reminders, backup, announcements:send-due)
└── tests/Feature, tests/Unit (placeholders only)
```

## 3. API surface (all under `/api`)

### Public
| Method | URI | Controller@method |
|---|---|---|
| GET | `/` | inline closure → welcome message |
| POST | `/register` | `AuthController@register` |
| POST | `/login` | `AuthController@login` |
| GET | `/auth/check-email` | `AuthController@checkEmail` (throttle `check-email` = 30/min/IP) |
| GET | `/auth/google` | `SocialAuthController@redirectToGoogle` |
| GET | `/auth/google/callback` | `SocialAuthController@handleGoogleCallback` |
| POST | `/forgot-password` | `ForgotPasswordController@sendResetLinkEmail` |
| POST | `/reset-password` | `ResetPasswordController@reset` |
| GET | `/email/verify/{id}/{hash}` (temporarily signed) | `EmailVerificationController@verify` |

### Protected (`auth:sanctum` + `throttle:api` = 60/min/user)
| Method | URI | Controller@method | Extra |
|---|---|---|---|
| GET | `/me` | `AuthController@me` | |
| PATCH | `/me` | `AuthController@updateProfile` | name, reminder_time, timezone, password |
| DELETE | `/me` | `AuthController@destroy` | soft-deletes user + all data |
| POST | `/logout` | `AuthController@logout` | |
| GET | `/email/verification-status` | `EmailVerificationController@status` | |
| POST | `/email/verification-notification` | `EmailVerificationController@send` | throttle `6,1` |
| GET/POST/PUT/DELETE | `/accounts[/{id}]` | `AccountController` (apiResource) | |
| GET/POST/PUT/DELETE | `/categories[/{id}]` | `CategoryController` (apiResource) | |
| GET/POST/PUT/DELETE | `/transactions[/{id}]` | `TransactionController` (apiResource) | |
| POST | `/transactions/sync` | `TransactionController@sync` | `verified` middleware |
| POST | `/import/preview` | `ImportController@preview` | |
| POST | `/import/store` | `ImportController@store` | `verified` |
| POST | `/import/kuda/preview` | `KudaImportController@preview` | |
| POST | `/import/kuda/store` | `KudaImportController@store` | `verified` |
| POST | `/import/opay/preview` | `OpayImportController@preview` | |
| POST | `/import/opay/store` | `OpayImportController@store` | `verified` |
| GET | `/summary` | `SummaryController@index` | |

### Admin Panel (session-based, `/admin/*`)
| Method | URI | Controller@method | Extra |
|---|---|---|---|
| GET | `/admin/login` | `AdminController@login` | |
| POST | `/admin/login` | `AdminController@authenticate` | |
| POST | `/admin/logout` | `AdminController@logout` | `admin` middleware |
| GET | `/admin/` | `AdminController@dashboard` | `admin` middleware |
| GET | `/admin/users` | `AdminController@users` | `admin` middleware |
| GET | `/admin/users/{user}` | `AdminController@showUser` | `admin` middleware |
| POST | `/admin/users/{user}/update` | `AdminController@updateUser` | `admin` middleware |
| POST | `/admin/users/{user}/send-reset-link` | `AdminController@sendResetLink` | `admin` middleware |
| POST | `/admin/users/{user}/verify-email` | `AdminController@verifyEmail` | `admin` middleware |
| POST | `/admin/users/{user}/set-password` | `AdminController@setPassword` | `admin` middleware |
| POST | `/admin/users/{user}/impersonate` | `AdminController@impersonateUser` | `admin` middleware |
| POST | `/admin/users/{user}/delete` | `AdminController@deleteUser` | `admin` middleware |
| POST | `/admin/users/{user}/restore` | `AdminController@restoreUser` | `admin` middleware |
| GET | `/admin/emails` | `AdminController@emails` | `admin` middleware |
| GET | `/admin/announce/{name}` | inline closure | protected by `ADMIN_KEY` env |

### Email Preview (dev-only, `/email-preview/*`)
| Method | URI | Controller@method |
|---|---|---|
| GET | `/email-preview` | `EmailPreviewController@index` |
| GET | `/email-preview/{template}` | `EmailPreviewController@show` |

Only registered when `APP_ENV !== 'production'`. Previews: welcome, verify-email, reset-password, transaction-reminder, reminder-announcement, democracy-day.

## 4. Authentication
- **Sanctum personal access tokens** issued by `AuthController::register` and `AuthController::login` via `$user->createToken('auth_token')->plainTextToken`. Returned as `{ access_token, token_type: "Bearer", user, email_verified }`.
- `auth:sanctum` middleware applied as a group on protected routes in `routes/api.php:55`.
- **Logout** (`AuthController:89`) deletes only the current token (`currentAccessToken()->delete()`) — other sessions stay alive.
- **Register** supports soft-deleted account restoration: if the email matches a trashed user, the account is restored and the password updated instead of failing with a unique constraint error.
- **Google OAuth** (`SocialAuthController`): `stateless()->redirect()->getTargetUrl()` returns a JSON `{url}` to the SPA. The callback creates a user if `email` doesn't exist (or links the Google ID to existing user by email, restoring trashed accounts), mints a Sanctum token, **flips `email_verified_at` on the user** (Google already proved the email is theirs), and 302-redirects to `FRONTEND_URL/login?token=...`.
- **Password reset** uses Laravel's built-in `Password` broker and our queued `ResetPasswordNotification` (Blade template at `resources/views/emails/reset-password.blade.php`). The link points at the SPA reset form (`FRONTEND_URL/reset-password?token=...&email=...`); the SPA POSTs it back to `/api/reset-password`. Throttle 60 sec, token expiry 60 min.
- **Email verification** is OPT-IN — no global `verified` middleware is applied to the API. The user can register, log in, list accounts, and log transactions without verifying. A dismissible banner can be driven by `GET /api/email/verification-status`; resend is `POST /api/email/verification-notification` (throttled 6/min). The verify URL is a `URL::temporarySignedRoute()` with 60-min expiry at `GET /api/email/verify/{id}/{hash}`. On success it 302s to `FRONTEND_URL/dashboard?verified=1`; on failure it redirects to `FRONTEND_URL/email/verify?error=expired|invalid_hash|user_not_found`. The SPA `/email/verify` route renders friendly error pages for each failure mode.
- The only endpoints that require `verified` are the "sensitive" bulk writers: `POST /api/transactions/sync`, `POST /api/import/store`, `POST /api/import/kuda/store`, `POST /api/import/opay/store`. The middleware is registered as the `verified` alias in `bootstrap/app.php`; `AuthorizationException` is converted to a JSON `{ requires_verified_email: true }` envelope for API clients.
- `App\Notifications\VerifyEmailNotification` and `App\Notifications\ResetPasswordNotification` both implement `ShouldQueue` so SMTP never blocks an HTTP request. Both add `X-Email-Type` and `X-User-Id` headers for the mail logger.
- **No policies or gates are auto-registered** for the AuthController/Social flow, but the resource controllers call `$this->authorize('view|update|delete', $model)` on show/update/destroy.

## 5. Data model

### `users`
- Fields: `id, name, email (unique), email_verified_at, password (nullable, hashed), google_id, avatar, reminder_time (default '21:10'), timezone (default 'Africa/Lagos'), currency (varchar(3), default 'NGN'), reminder_last_sent_at (nullable), reminder_announced_at (nullable), is_admin (bool, default false), remember_token, timestamps`
- Soft deletes: `deleted_at` (nullable)
- Relations: `accounts()`, `categories()`, `transactions()` — all `hasMany`; `announcements()` — `belongsToMany`
- Implements `MustVerifyEmail`. Custom `sendEmailVerificationNotification()` dispatches `App\Notifications\VerifyEmailNotification`. Custom `sendPasswordResetNotification($token)` dispatches `App\Notifications\ResetPasswordNotification`.
- Uses `HasApiTokens` (Sanctum), `HasFactory`, `Notifiable`, `SoftDeletes`
- Casts: `email_verified_at → datetime`, `reminder_last_sent_at → datetime`, `reminder_announced_at → datetime`, `password → hashed`
- `User::DEFAULT_CATEGORIES` — 16 categories (12 expense, 4 income) seeded on `User::created` event. Each user gets their own editable copy.
- `is_admin` grants access to the admin panel (`/admin/*`). No API-level admin roles exist.

### `accounts`
- Fields: `id, user_id, name, type (enum: bank|mobile|cash), currency (varchar(3), default 'NGN'), starting_balance (decimal 15,2, default 0), notes (text nullable), timestamps`
- Soft deletes: `deleted_at` (nullable)
- Relations: `user()` (belongsTo), `transactions()` (hasMany), `receivedTransfers()` (hasMany via `to_account_id`)
- Unique key on `(user_id, name)` — enforced via migration `2026_06_04_120000`.
- **Batched balance accessor `balancesFor()`** at `Account.php:117`: runs a single UNION ALL query for all accounts (debits from source + credits to destination), then adds `starting_balance`. Replaces the old per-account N+1 accessor.
- **Legacy accessor `getBalanceAttribute()`** still exists at `Account.php:79` for single-account views (`show()` endpoint). Runs 1 query per call (optimized from 4 in earlier version).
- **Cascades on delete** with user.

### `categories`
- Fields: `id, user_id, name, type (enum: income|expense), timestamps`
- Soft deletes: `deleted_at` (nullable)
- Relations: `user()` (belongsTo), `transactions()` (hasMany)
- Unique key on `(user_id, name, type)` — a user cannot have two categories with the same `(name, type)` pair. Same name across different types is allowed.
- `is_default` column was **dropped** in migration `2026_06_04_191731`. Default categories are now seeded per-user via `User::created` and are fully owned/editable.
- Every new user is seeded with a default set of categories via `User::DEFAULT_CATEGORIES`.

### `transactions`
- Fields: `id, user_id, account_id, to_account_id (nullable), type (enum: income|expense|transfer), category_id (nullable), amount (decimal 15,2), description, reference, transaction_date (date), is_synced (bool, default true), timestamps`
- Soft deletes: `deleted_at` (nullable)
- Relations: `user()`, `account()`, `toAccount()` (custom FK `to_account_id`), `category()`
- Foreign-key behaviour: `account_id` and `to_account_id` cascade on delete; `category_id` set-null on delete.
- Indexes: composite `(user_id, type, transaction_date)`, `(user_id, account_id, transaction_date)`, `to_account_id`
- **No custom cast** on `amount` — the database returns it as a 2-decimal string in some Laravel versions.
- **Transfer validation**: `to_account_id` is `required_if:type,transfer`, `different:account_id`, and scoped to the user's accounts via `Rule::exists()->where('user_id', ...)` on store/update/sync.

### `announcements`
- Fields: `id, name, subject, template, template_vars (json nullable), scheduled_at (timestamp nullable), sent_at (timestamp nullable), timestamps`

### `announcement_user` (pivot)
- Fields: `announcement_id, user_id, delivered_at (timestamp nullable)`
- Model: `AnnouncementUser` (uses `Pivot` base)

### `email_logs`
- Fields: `id, user_id (nullable FK), email_type, recipient_email, subject (nullable), sent_at (timestamp), meta (json nullable), timestamps`
- Indexes: `email_type`, `sent_at`, `(user_id, sent_at)`
- Written automatically by the `MessageSent` event listener in `AppServiceProvider::registerMailLogger()`. Tracks every email sent by the system.

### `personal_access_tokens` (Sanctum)
- Standard Laravel Sanctum table.

### `jobs` / `failed_jobs` / `cache`
- Standard Laravel tables for queue processing and caching.

## 6. Validation
- All inline via `$request->validate(...)` — **no FormRequest classes**.
- Common rules:
  - `name` → `required|string|max:255`
  - `type` → `required|in:...` (enum-validated)
  - `currency` → `required|string|size:3|alpha:alpha` (3-letter ISO 4217 code; required on account create, optional on update)
  - `starting_balance` / `amount` → `required|numeric`
  - `email` → `required|email|unique:users` (register only; uses `Rule::unique()->ignore()` for updates)
  - `password` → `required|string|min:8|confirmed`
  - Foreign keys → `required|exists:table,id` (scoped to user via `Rule::exists()->where('user_id', ...)`)
- **Transaction transfer rules** (`store`/`update`/`sync`/`import`):
  - `to_account_id` → `required_if:type,transfer` (must be present for transfers)
  - `to_account_id` → `different:account_id` (no self-transfers)
  - Both `account_id` and `to_account_id` → ownership-scoped via `Rule::exists('accounts', 'id')->where('user_id', ...)`
  - Batch endpoints (`sync`, `import/store`) use `Validator::after()` callbacks to enforce the per-row transfer checks.
- Validation failures return Laravel's standard 422 `{ message, errors: { field: [msgs] } }`.

## 7. Controllers (line references)

### `AuthController` (`app/Http/Controllers/API/AuthController.php`)
- `register` (30-83): validates, checks for soft-deleted account (restores if found), creates user, sends verification email + welcome email via queue, mints Sanctum token, returns `{access_token, token_type, user, email_verified}`.
- `login` (93-117): validates credentials (supports `withTrashed()`), restores trashed accounts on success, mints token, returns `{access_token, token_type, user}`.
- `logout` (125-133): deletes only the current token.
- `me` (141-144): returns `$request->user()`.
- `updateProfile` (153-187): validates optional fields (`name`, `reminder_time`, `timezone`, `currency`, `password`), saves only provided fields. Setting `reminder_time` to null disables daily reminders.
- `destroy` (195-208): soft-deletes everything — revokes tokens → transactions → accounts → categories → user.
- `checkEmail` (219-236): validates email, returns `{ available: bool }`. Rate-limited per IP via `check-email` named limiter (30/min). Always returns same 200 shape to prevent user enumeration.

### `AccountController` (`AccountController.php`)
- `index` (29-46): **Cached** for 1h under `user:{id}:accounts:balances`. Returns `$user->accounts` + `Account::balancesFor()` (single batched query) + appends `balance` to each. Cache busted on every account/transaction write. **No pagination** — could become large.
- `store` (54-74): validates with `Rule::unique('accounts', 'name')->where('user_id', ...)` and `currency` (`required|string|size:3|alpha:alpha`). Creates account owned by user. Busts accounts + summary cache. Returns 201.
- `show` (82-87): `authorize('view')` + appends `balance` (uses per-account `getBalanceAttribute()` accessor).
- `update` (95-122): `authorize('update')` + validates optional fields including `currency` with unique-ignore rule. Busts accounts + summary cache.
- `destroy` (128-140): `authorize('delete')` + soft-delete. Busts accounts + summary cache. **Cascades** to all transactions on that account (per migration FK).

### `CategoryController` (`CategoryController.php`)
- `index`: **Cached** for 1h under `user:{id}:categories`. Returns `$request->user()->categories()->get()`. Cache busted on store/update/destroy.
- `store`: validates with `Rule::unique('categories', 'name')->where('user_id', ...)->where('type', ...)` and creates category owned by the user. Busts categories + summary cache. Returns 201.
- `show`/`update`/`destroy`: all call `authorize`. `update` and `destroy` bust categories cache; `destroy` also busts summary cache. Duplicate prevention is enforced by the DB unique key and the validation rule — not by a default flag.

### `TransactionController` (`TransactionController.php`)
- `index` (32-48): eager-loads `account`, `toAccount`, `category`; orders by `transaction_date DESC, created_at DESC`; paginates 50. Supports `account_id` filter (shows both source and destination transactions for the account).
- `store` (56-106):
  - Returns 403 if user has zero accounts.
  - Validates `account_id` and `to_account_id` with ownership-scoped `Rule::exists`.
  - Validates `to_account_id` is `required_if:type,transfer`, `different:account_id`.
  - Duplicate detection at 85-92: same user + same date + same type + same amount + same `account_id` ⇒ returns 409 `{message: "Potential duplicate detected.", is_duplicate: true}`. Bypass with `"force": true`.
  - **Busts accounts + summary cache** after successful create.
- `sync` (110-154): uses `Validator::make` with `after()` callbacks for per-row transfer validation. Stamps `user_id` and `is_synced = true` on every row, then `ProcessSync::dispatch($transactions)`. The job runs asynchronously and busts caches per affected user.
- `show` (159-163): eager-loads relations.
- `update` (168-203): validates with ownership-scoped rules + transfer validation. Busts accounts + summary cache.
- `destroy` (200-219): `authorize` + soft-delete. Busts accounts + summary cache.

### `ImportController` (`Import/ImportController.php`)
- Extends `BaseImportController`. Implements `parseRows()` for generic CSV format.
- `preview` (inherited from `BaseImportController::buildPreviewResponse`): parses CSV rows, deduplicates against existing transactions, returns preview array.
- `store` (inherited from `BaseImportController::store`): validates batch, wraps in `DB::transaction`, inserts in 100-row chunks.

### `KudaImportController` (`Import/KudaImportController.php`)
- Extends `BaseImportController`. Implements `parseRows()` for Kuda bank CSV format (DD/MM/YYYY HH:MM:SS dates, specific column positions).
- Overrides `parseDate()` to try `d/m/y H:i:s` format first.

### `OpayImportController` (`Import/OpayImportController.php`)
- Extends `BaseImportController`. Implements `parseRows()` for Opay CSV format (DD Mon YYYY HH:MM:SS dates, transfer_suggestion hints).
- Overrides `parseDate()` to try `d M Y H:i:s` format first.
- `decoratePreviewRow()` adds `transfer_suggestion` field for bank-detected transfers.
- `fetchExisting()` adds reference-based dedup in addition to the standard (date, type, amount) key.

### `BaseImportController` (`Import/BaseImportController.php`)
- Abstract base class for all import controllers.
- `store` (46-105): validates with ownership-scoped `Rule::exists`, `Validator::after()` for per-row transfer checks (`required_if:type,transfer`, `different:account_id`). Wraps inserts in `DB::transaction` with 100-row chunks. **Busts accounts + summary cache** per affected user after insert.
- `buildPreviewResponse` (112-126): deduplicates → decorates → returns preview. Passes `account_id` to `fetchExisting()` for unified fingerprint.
- `fetchExisting` (147-165): builds a lookup set of `(date, type, amount, account_id)` keys in a single query (filtered by `account_id`), then each preview row checks the set. **Now matches `Transaction::isPotentialDuplicate()`** — same 5-column fingerprint.
- `duplicateKey` (170-173): builds `"YYYY-MM-DD:type:amount:account_id"` string key. Includes `account_id` so the same amount on a different account is not flagged.
- `parseDate` (182-197): wraps `Carbon::parse` in try/catch, **logs warning and falls back to today's date** on failure (known data corruption risk — documented in `KUDA_IMPORT_SETUP.md`).

### `SummaryController` (`SummaryController.php`)
- `index` (29-81):
  - **Cached** for 60s under `user:{id}:summary:{YYYY-MM}`. Key includes month for auto-roll. Cache busted on every transaction/account/category write.
  - `accounts` — collects all, uses `Account::balancesFor()` (single batched query), sums to `totalBalance`.
  - `monthly_summary.income` / `.expense` — single SUM queries scoped to current calendar month.
  - `monthly_summary.net = income - expense`.
  - `category_breakdown` — `groupBy('category_id')` joined with category, falls back to `"Uncategorized"` when `category_id` is null.

### `SocialAuthController` (`SocialAuthController.php`)
- `redirectToGoogle` (17-22): returns `{url: ...}` JSON — frontend navigates the user.
- `handleGoogleCallback` (28-65): upserts user by email (restores trashed), mints token, 302 to `FRONTEND_URL/login?token=...`. The user data is intentionally omitted from the URL — the frontend must call `GET /api/me`.

### `EmailVerificationController` (`EmailVerificationController.php`)
- `verify` (39-69): public signed-URL endpoint. Validates hash, checks signature, marks verified, 302s to SPA dashboard. Handles expired/invalid/user-not-found gracefully.
- `send` (74-88): resends verification email. Throttled 6/min.
- `status` (93-100): returns `{ email_verified: bool, email: string }` for SPA banner.

### `ForgotPasswordController` / `ResetPasswordController`
- Standard Laravel password broker wrappers; return `{ message: __($status) }` on success or `{ email: [__($status)] }` / 422 on failure.

### `AdminController` (`Admin/AdminController.php`)
- Session-based admin panel with `AdminMiddleware` guard.
- `login`/`authenticate`/`logout`: session auth with `is_admin` check.
- `dashboard`: shows total users, verified users, trashed users, active today, emails today, recent users.
- `users`: paginated list with search and trashed filter.
- `showUser`: user detail with 60-day activity heatmap, streaks, email logs.
- `updateUser`: update name/email/timezone/reminder_time/is_admin/verify status.
- `verifyEmail`/`sendResetLink`/`setPassword`: admin actions on user accounts.
- `impersonateUser`: generates a Sanctum token for the target user (deletes existing tokens first).
- `deleteUser`/`restoreUser`: soft-delete/restore with full cascade.

### `EmailPreviewController` (`EmailPreviewController.php`)
- Dev-only (only registered when `APP_ENV !== 'production'`).
- `index`: lists all email templates with preview links.
- `show`: renders a template with realistic sample data in a chrome layout.
- Previews: welcome, verify-email, reset-password, transaction-reminder, reminder-announcement, democracy-day.

## 8. Jobs
- **`ProcessSync`** (`app/Jobs/ProcessSync.php`): receives an array, validates `user_id` presence on each row, chunks to 100, wraps each chunk in `DB::transaction`. `uniqueInBatch()` deduplicates within the batch. `filterExistingInDb()` runs a single bulk SELECT to exclude existing transactions. Bulk `Transaction::insert()` for performance. **Busts accounts + summary cache** per affected user after all chunks are inserted.
- **`SendTransactionReminder`** (`app/Jobs/SendTransactionReminder.php`): queues `App\Mail\TransactionReminderMail` to a single user's email, then stamps `users.reminder_last_sent_at = now()`. Re-checks the dedupe window at handle-time in case the command and another worker race. `$tries = 3`, `$backoff = 60`. `failed()` logs the user id and error.

## 8.1 Mailing system
- **Announcement system** — generic broadcast email tool for feature announcements. Create & schedule announcements from the CLI; the scheduler worker sends them:
  - `announcement:schedule` — schedule a broadcast email. Usage:
    - `php artisan announcement:schedule reminder-announcement --at="2026-06-11 18:00" --subject="Daily reminders are now live"`
    - `php artisan announcement:schedule account-deletion --at="2026-06-12 10:00" --template="emails.account-deletion" --subject="Account deletion is here"`
  - `announcements:send-due` — picks up due announcements every minute and mails them to users who haven't received that announcement yet. Tracks delivery in `announcement_user` pivot table.
  - Tables: `announcements` (name, subject, template, template_vars, scheduled_at, sent_at), `announcement_user` (announcement_id, user_id, delivered_at)
- **Six mail templates** in `resources/views/emails/`:
  - `welcome.blade.php` — Welcome email with dashboard link
  - `verify-email.blade.php` — "Confirm your Pasona email" with the SPA confirm URL
  - `reset-password.blade.php` — "Reset your Pasona password" with the SPA reset URL (rich HTML template)
  - `transaction-reminder.blade.php` — "It's {reminder_time} — log today's transactions" with today's income/expense/account count baked in. Subject switches between the cold-open and a "Quick gut-check" variant when the user has already logged something today.
  - `reminder-announcement.blade.php` — Generic feature announcement
  - `democracy_day.blade.php` — Holiday announcement
- **CSS inliner**: `AppServiceProvider::registerMailCssInliner()` listens to `MessageSending` events and runs `<style>` blocks through `CssToInlineStyles` to ensure email client compatibility. Strips `<style>` blocks after inlining.
- **Mail logger**: `AppServiceProvider::registerMailLogger()` listens to `MessageSent` events and writes to the `email_logs` table. Extracts `X-Email-Type` and `X-User-Id` headers from the message.
- **Daily reminder flow**: `routes/console.php` schedules `reminders:send-daily` every 5 minutes (`withoutOverlapping`, `onOneServer`, `runInBackground`). The command:
  1. Pulls users whose `reminder_time` (HH:MM, app timezone `Africa/Lagos`, UTC+1) is within ±2 minutes of `now` (split into two ranges when the window crosses midnight).
  2. Smart-skips users who already have any transaction dated today (toggle with `--no-smart-skip`).
  3. Dedupe-skips users whose `reminder_last_sent_at` is today.
  4. Dispatches `SendTransactionReminder` for the rest.
  5. Logs a single summary line; supports `--dry-run` and `--user=ID` for testing.
- The `reminder_time` field is in the user's own timezone (stored in `users.timezone`, default `Africa/Lagos`). The `SendDailyReminders` command groups users by timezone and compares `reminder_time` against each group's local `now()`. Timestamps (`created_at`, `updated_at`, `email_verified_at`) are stored as UTC in the database (Laravel default).
- **Active mail driver: Resend** (`MAIL_MAILER=resend` in `.env`). `config/mail.php` defines the `resend` mailer with `'transport' => 'resend'`. Fallback to `log` if no API key is configured.

## 9. Import / CSV handling
- **No `league/csv` installed** — controller uses raw `str_getcsv` with `"\n"` delimiter.
- Header row is assumed (first row shifted off) but never validated against an expected schema.
- Row parsing is positional: `$data[0]` = date, `$data[1]` = description, `$data[2]` = amount, `$data[3]` = Dr/Cr.
- `Dr/Cr` → `expense`/`income`. There's no support for `Dr/Cr` variations (`DR`/`CR`/whitespace) — relies on `strtolower`.
- `parseDate` uses `Carbon::parse` (very lenient — accepts many formats) but silently defaults to "today" on failure. Bank-specific parsers (Kuda, Opay) try their formats first.
- **Import is wrapped in `DB::transaction`** with 100-row chunks (fixed — see `BaseImportController::store`).
- **Ownership checks**: `account_id` and `to_account_id` are validated against the user's accounts via `Rule::exists()->where('user_id', ...)`.
- **Transfer validation in imports**: `Validator::after()` callbacks enforce `required_if:type,transfer` and `different:account_id` per row.

## 10. Summary aggregation
- Time window: current calendar month (`Carbon::now()->startOfMonth()` → `endOfMonth()`).
- **All accounts loaded via `Account::balancesFor()`** — single batched UNION ALL query instead of per-account N+1. Adds `starting_balance` in PHP.
- `category_breakdown` runs a grouped `select(category_id, SUM(amount))` then maps. Null `category_id` rows produce a row with `category_name = "Uncategorized"`.
- **Cached** for 60s under `user:{id}:summary:{YYYY-MM}`. Cache busted on every transaction/account/category write. On cache miss, runs 4 queries (accounts, balances, income sum, expense sum) plus category breakdown.

## 11. Config (key points)
- **`config/api.php`**: `base_url` → `env('API_BASE_URL', '/api')`, `name` → `env('API_DISPLAY_NAME', 'Pasona Finance Tracker API')`, `version` → `v1`. Surfaced in docs via `config('api.base_url')`.
- **`config/cors.php`**: paths `['api/*', 'sanctum/csrf-cookie', 'auth/*', 'up']`, origins from `CORS_ALLOWED_ORIGINS` env (default: `FRONTEND_URL` + `http://localhost:8080`), `supports_credentials: true`.
- **`config/sanctum.php`**: `stateful` includes localhost/3000/8000; `guard: ['web']`; token expiry driven by `SANCTUM_TOKEN_EXPIRY_MINUTES` env (default 10080 = 7 days); token_prefix env-driven.
- **`config/auth.php`**: default guard `web`, no API guard defined — Sanctum uses the bearer-token guard automatically.
- **`config/queue.php`**: default `database`; failed jobs go to `failed_jobs` table with `database-uuids` driver.
- **`config/mail.php`**: defines `resend` mailer with `'transport' => 'resend'`. Default fallback is `log`.
- **`config/services.php`**: Google OAuth keys (`GOOGLE_CLIENT_ID/SECRET/REDIRECT`).
- **`bootstrap/app.php`**: registers `HandleCors` prepended in the global stack. Aliases `verified` and `admin` middleware. Converts `AuthorizationException` to JSON with `requires_verified_email` flag.

## 12. `.env` (current values)
- `APP_ENV=local`, `APP_DEBUG=true`
- `DB_CONNECTION=pgsql` → **Local PostgreSQL** at `127.0.0.1:5432` (database: `pasona_finance`)
- `CACHE_DRIVER=file` (local dev); `.env.example` defaults to `CACHE_STORE=redis` with `REDIS_CLIENT=predis`
- `QUEUE_CONNECTION=database`
- `MAIL_MAILER=resend` → **Resend API** with `RESEND_API_KEY` set
- `SESSION_DRIVER=database`
- `FRONTEND_URL=http://localhost:8080`
- `SANCTUM_TOKEN_EXPIRY_MINUTES=10080` (7 days)
- `DESTRUCTIVE_COMMANDS_ALLOWED=false`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set; `GOOGLE_REDIRECT_URL=http://localhost:8000/api/auth/google/callback`
- `GOOGLE_CLIENT_ID` is duplicated on lines 59 and 62 (known cleanup item)

## 13. Migrations (25 files)
| File | Purpose |
|---|---|
| `0001_01_01_000000_create_users_table.php` | Core users table |
| `0001_01_01_000001_create_cache_table.php` | Cache table |
| `0001_01_01_000002_create_jobs_table.php` | Jobs/failed_jobs tables |
| `2026_05_29_080615_create_personal_access_tokens_table.php` | Sanctum tokens |
| `2026_05_29_081306_create_accounts_table.php` | Accounts |
| `2026_05_29_081307_create_categories_table.php` | Categories |
| `2026_05_29_081308_create_transactions_table.php` | Transactions |
| `2026_05_29_101220_add_google_id_to_users_table.php` | Google OAuth fields |
| `2026_06_04_120000_add_unique_user_name_to_accounts_table.php` | Unique `(user_id, name)` on accounts |
| `2026_06_04_120001_add_unique_user_name_type_to_categories_table.php` | Unique `(user_id, name, type)` on categories |
| `2026_06_04_191731_drop_is_default_from_categories_table.php` | Drops `is_default` from categories |
| `2026_06_04_221638_add_composite_indexes_to_transactions_table.php` | Composite indexes on transactions |
| `2026_06_06_120000_add_reminder_last_sent_at_to_users_table.php` | Reminder dedupe field |
| `2026_06_08_074748_add_to_account_id_index_to_transactions_table.php` | Index on `to_account_id` |
| `2026_06_10_101207_add_timezone_to_users_table.php` | User timezone |
| `2026_06_10_103111_make_reminder_time_nullable_on_users_table.php` | Nullable reminder_time |
| `2026_06_10_124929_add_soft_deletes_to_users_table.php` | Soft deletes on users |
| `2026_06_10_124944_add_soft_deletes_to_related_tables.php` | Soft deletes on accounts, categories, transactions |
| `2026_06_10_125112_add_reminder_announced_at_to_users_table.php` | Announcement dedupe field |
| `2026_06_10_125438_create_announcements_table.php` | Announcements |
| `2026_06_10_125552_create_announcement_user_table.php` | Announcement-user pivot |
| `2026_06_12_162918_add_is_admin_to_users_table.php` | Admin flag on users |
| `2026_06_12_164927_create_email_logs_table.php` | Email log tracking |
| `2026_06_14_081756_add_currency_to_accounts_table.php` | Currency on accounts (default NGN) |
| `2026_06_14_081756_add_currency_to_users_table.php` | Currency on users (default NGN) |

## 14. Docs site (Blade, not React)
- All docs pages live under `resources/views/docs/` and are served by `routes/web.php` (no auth required).
- Layout: `resources/views/layouts/docs.blade.php` — includes the global try-it sidebar on every page.
- Partials: `navbar`, `sidebar`, `code-block`, `code-tabs`, `method-badge`, `try-it` (request builder form), `tryit-trigger` (per-endpoint button).
- Endpoint pages: `auth`, `accounts`, `categories`, `transactions`, `import`, `summary`.
- Getting-started pages: `overview`, `authentication`, `errors`, `rate-limiting`.
- Other: `guides`, `changelog`.
- Assets: `public/css/docs.css` and `public/js/docs.js` (vanilla JS, no Vite output needed at runtime).

## 15. Scalability to-fix (1000 concurrent users)

### P0 — Must fix before scaling

- **No caching on summary/accounts** — FIXED: `Cache::remember()` with user-scoped keys. Categories cached 1h, accounts cached 1h, summary cached 60s (month-scoped key). Cache busted on every write across all controllers and the ProcessSync job.
- **`ProcessSync` per-row SELECT+INSERT** — FIXED: `app/Jobs/ProcessSync.php` now uses `uniqueInBatch()` + `filterExistingInDb()` for bulk dedup, then `Transaction::insert()` in 100-row chunks within `DB::transaction`.
- **Missing index on `transactions.to_account_id`** — FIXED: added in migration `2026_06_08_074748`.

### P1 — High priority

- **No payload limits on sync/import** — `TransactionController::sync()` and all import endpoints accept unbounded arrays/files. Add `max:5000` on arrays, `max:10240` on file uploads.
- **`BaseImportController::fetchExisting()` OR-where explosion** — builds 500-OR-group SQL from CSV rows. PostgreSQL may refuse to plan. Batch OR groups or use reference-based dedup.
- **No IP rate limits on login/register/forgot-password** — `AppServiceProvider.php` only throttles the API group at 60/min and `check-email` at 30/min. Add `Limit::perMinute(5)` per IP for auth endpoints.
- **`SummaryController::category_breakdown` eager-loads per group row** — replace `->with('category')` with a JOIN to eliminate extra query.

### P2 — Medium priority

- **Missing index on `transactions.reference`** — used by `OpayImportController::fetchExisting()`. Add `$table->index('reference')`.
- **Sanctum token expiry & cleanup** — 7-day expiry with no garbage collection. Set shorter expiry + scheduled purge job for `personal_access_tokens`.
- **`AccountController` unique validation extra query** — `Rule::unique` fires a SELECT before the DB constraint catches it. Consider removing validation and catching `QueryException` with code `23505`.

### P3 — Low priority

- **`BaseImportController::parseDate()` silently defaults to today** — on parse failure, corrupts transaction dates. Logs a warning but still falls through. Return a validation error instead.
- **Duplicate `GOOGLE_CLIENT_ID` in `.env`** — lines 59 and 62 have duplicates. Clean up.
- **Database `sslmode`** — `config/database.php:99` defaults to `prefer`. For local PostgreSQL this is fine; set to `require` when connecting to remote/cloud databases.
- **`ImportController::store` per-row inserts** — FIXED: now uses `BaseImportController::store` with `DB::transaction` wrapping.
- **`SendDailyReminder` job is a stub** — FIXED: fully implemented as `SendTransactionReminder`.
- **`ResetPasswordNotification` is a stub** — FIXED: fully implemented with Blade template and SPA URL builder.

## 16. Noteworthy issues / things to know
- **`Account::getBalanceAttribute`** now runs 1 query per call (optimized from 4). Used only in `AccountController::show()`. The list endpoints (`index`, `SummaryController`) use `Account::balancesFor()` (single batched query).
- **Caching layer** — Three cache keys per user: `user:{id}:categories` (1h), `user:{id}:accounts:balances` (1h), `user:{id}:summary:{YYYY-MM}` (60s). All busted on write. `predis/predis` installed for Redis; `file` fallback for cPanel. Failover store: `['redis', 'file']`.
- **Multi-currency support** — `currency` column (varchar(3), default 'NGN') on both `accounts` and `users`. Validated as `required|string|size:3|alpha:alpha` on account create; optional on update and profile update. Frontend sends/reads it with NGN fallback.
- **Unified duplicate detection** — `BaseImportController::duplicateKey()` now includes `account_id`, matching `Transaction::isPotentialDuplicate()`. Same amount on a different account is not flagged as duplicate.
- **`BaseImportController::parseDate`** silently coerces unparseable dates to today — logs warning but still imports. Known data corruption risk.
- **`ProcessSync` job** now has proper transaction wrapping, chunking, and dedup (both in-batch and against DB). Busts caches per affected user after insert.
- **`ResetPasswordNotification`** is fully implemented with custom Blade template, SPA URL builder, and queued delivery.
- **`VerifyEmailNotification`** is fully implemented with custom Blade template, SPA URL builder, and queued delivery. Both notifications add `X-Email-Type` and `X-User-Id` headers for mail logging.
- **Test coverage is zero** — only `ExampleTest` placeholders. 3 pre-existing test failures (auth status codes, redirect).
- **`web.php` has admin panel routes** — session-based with `AdminMiddleware` guard. Dashboard shows user stats, email stats, activity heatmap. User management includes search, verify, reset password, impersonate, delete/restore.
- **Email logging is automatic** — `AppServiceProvider::registerMailLogger()` writes every sent email to `email_logs` via the `MessageSent` event.
- **CSS inliner** is registered as a safety net — converts any `<style>` blocks to inline styles for email client compatibility.
- **Transfer validation is enforced at all entry points** — `store`, `update`, `sync`, and import endpoints all validate `required_if:type,transfer`, `different:account_id`, and ownership via `Rule::exists()->where('user_id', ...)`.
- **Soft-delete restoration** — register and login paths automatically restore soft-deleted accounts. The Google OAuth callback also restores trashed users.
- **`docs.sdks` route was removed** — no SDK references remain in the codebase.
