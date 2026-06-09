# Pasona Finance — Backend Architecture

## 1. Tech stack
- **PHP 8.2+**, **Laravel 12**
- **Laravel Sanctum 4** — bearer-token API auth (no SPA cookie flow currently)
- **Laravel Socialite 5** — Google OAuth
- **SQLite** for local dev / **PostgreSQL** configured (the `.env` is set to `pgsql` pointing at a Supabase pooler in `eu-central-1`)
- **Queue driver: `database`** (uses the `jobs` table, processed by `php artisan queue:listen`)
- **Mail driver: `log`** (writes emails to `storage/logs` — no real SMTP configured)
- **Frontend assets:** Vite, but the actual docs site ships pre-built CSS/JS in `public/css/docs.css` and `public/js/docs.js` (no live Vite serving needed)
- **Test stack:** PHPUnit 11, no feature tests written yet (just placeholder `ExampleTest`)

## 2. Directory layout (source only)
```
backend/
├── app/
│   ├── Http/Controllers/Controller.php
│   ├── Http/Controllers/API/
│   │   ├── AuthController.php
│   │   ├── AccountController.php
│   │   ├── CategoryController.php
│   │   ├── TransactionController.php
│   │   ├── ImportController.php
│   │   ├── SummaryController.php
│   │   ├── ForgotPasswordController.php
│   │   ├── ResetPasswordController.php
│   │   └── SocialAuthController.php
│   ├── Jobs/
│   │   ├── ProcessSync.php          (offline transaction batch processing)
│   │   └── SendDailyReminder.php    (stub — PWA push not implemented)
│   ├── Models/
│   │   ├── User.php
│   │   ├── Account.php
│   │   ├── Category.php
│   │   └── Transaction.php
│   ├── Notifications/
│   │   └── ResetPasswordNotification.php   (only used if you wire it up)
│   ├── Policies/
│   │   ├── AccountPolicy.php
│   │   ├── CategoryPolicy.php
│   │   └── TransactionPolicy.php
│   └── Providers/AppServiceProvider.php
├── config/         api, app, auth, cache, cors, database, filesystems, logging, mail, queue, sanctum, services, session
├── database/
│   ├── migrations/   (8 files: users, cache, jobs, personal_access_tokens, accounts, categories, transactions, google_id addition)
│   ├── seeders/      DatabaseSeeder, UserSeeder (john/jane); default categories are seeded per-user via the User::created event
│   └── factories/    UserFactory
├── public/        docs.css, docs.js, index.php, .htaccess
├── resources/
│   ├── views/     layouts/docs, partials/*, docs/index, docs/getting-started/*, docs/endpoints/*
│   ├── css/app.css, js/app.js, js/bootstrap.js
│   └── views/welcome.blade.php
├── routes/
│   ├── api.php
│   ├── web.php        (the docs site lives here)
│   └── console.php
└── tests/Feature, tests/Unit (placeholders only)
```

## 3. API surface (all under `/api`)

### Public
| Method | URI | Controller@method |
|---|---|---|
| GET | `/` | inline closure → welcome message |
| POST | `/register` | `AuthController@register` |
| POST | `/login` | `AuthController@login` |
| GET | `/auth/check-email` | `AuthController@checkEmail` |
| GET | `/auth/google` | `SocialAuthController@redirectToGoogle` |
| GET | `/auth/google/callback` | `SocialAuthController@handleGoogleCallback` |
| POST | `/forgot-password` | `ForgotPasswordController@sendResetLinkEmail` |
| POST | `/reset-password` | `ResetPasswordController@reset` |
| GET | `/email/verify/{id}/{hash}` (temporarily signed) | `EmailVerificationController@verify` |

### Protected (`auth:sanctum`)
| Method | URI | Controller@method | Extra |
|---|---|---|---|
| GET | `/me` | `AuthController@me` | |
| POST | `/logout` | `AuthController@logout` | |
| GET | `/email/verification-status` | `EmailVerificationController@status` | |
| POST | `/email/verification-notification` | `EmailVerificationController@send` | throttle `6,1` |
| GET/POST/PUT/DELETE | `/accounts[/{id}]` | `AccountController` (apiResource) | |
| GET/POST/PUT/DELETE | `/categories[/{id}]` | `CategoryController` (apiResource) | |
| GET/POST/PUT/DELETE | `/transactions[/{id}]` | `TransactionController` (apiResource) | |
| POST | `/transactions/sync` | `TransactionController@sync` | `verified` |
| POST | `/import/preview` | `ImportController@preview` | |
| POST | `/import/store` | `ImportController@store` | `verified` |
| POST | `/import/kuda/preview` | `KudaImportController@preview` | |
| POST | `/import/kuda/store` | `KudaImportController@store` | `verified` |
| GET | `/summary` | `SummaryController@index` | |

## 4. Authentication
- **Sanctum personal access tokens** issued by `AuthController::register` and `AuthController::login` via `$user->createToken('auth_token')->plainTextToken`. Returned as `{ access_token, token_type: "Bearer", user, email_verified }`.
- `auth:sanctum` middleware applied as a group on protected routes in `routes/api.php:38`.
- **Logout** (`AuthController:90`) deletes only the current token (`currentAccessToken()->delete()`) — other sessions stay alive.
- **Google OAuth** (`SocialAuthController`): `stateless()->redirect()->getTargetUrl()` returns a JSON `{url}` to the SPA. The callback creates a user if `email` doesn't exist (or links the Google ID to existing user by email), mints a Sanctum token, **flips `email_verified_at` on the user** (Google already proved the email is theirs), and 302-redirects to `FRONTEND_URL/login?token=...`.
- **Password reset** uses Laravel's built-in `Password` broker and our queued `ResetPasswordNotification` (Markdown template at `resources/views/emails/reset-password.blade.php`). The link points at the SPA reset form; the SPA POSTs it back to `/api/reset-password`. Throttle 60 sec, token expiry 60 min.
- **Email verification** is OPT-IN — no global `verified` middleware is applied to the API. The user can register, log in, list accounts, and log transactions without verifying. A dismissible banner can be driven by `GET /api/email/verification-status`; resend is `POST /api/email/verification-notification` (throttled 6/min). The verify URL is a `URL::temporarySignedRoute()` with 60-min expiry at `GET /api/email/verify/{id}/{hash}`. On success it 302s to `FRONTEND_URL/dashboard?verified=1`; on failure it redirects to `FRONTEND_URL/email/verify?error=expired|invalid_hash` instead of returning a bare 403. The SPA `/email/verify` route renders friendly error pages for each failure mode.
- The only endpoints that require `verified` are the "sensitive" bulk writers: `POST /api/transactions/sync`, `POST /api/import/store`, `POST /api/import/kuda/store`. The middleware is registered as the `verified` alias in `bootstrap/app.php`; `AuthorizationException` is converted to a JSON `{ requires_verified_email: true }` envelope for API clients.
- `App\Notifications\VerifyEmailNotification` and `App\Notifications\ResetPasswordNotification` both implement `ShouldQueue` so SMTP never blocks an HTTP request.
- **No policies or gates are auto-registered** for the AuthController/Social flow, but the resource controllers call `$this->authorize('view|update|delete', $model)` on show/update/destroy.

## 5. Data model

### `users`
- Fields: `id, name, email (unique), email_verified_at, password (nullable, hashed), google_id, avatar, reminder_time (default '21:10'), reminder_last_sent_at (nullable), remember_token, timestamps`
- Relations: `accounts()`, `categories()`, `transactions()` — all `hasMany`
- Implements `MustVerifyEmail`. Custom `sendEmailVerificationNotification()` dispatches `App\Notifications\VerifyEmailNotification`. Custom `sendPasswordResetNotification($token)` dispatches `App\Notifications\ResetPasswordNotification`.
- Uses `HasApiTokens` (Sanctum), `HasFactory`, `Notifiable`
- Casts: `email_verified_at → datetime`, `reminder_last_sent_at → datetime`, `password → hashed`

### `accounts`
- Fields: `id, user_id, name, type (enum: bank|mobile|cash), starting_balance (decimal 15,2, default 0), notes (text nullable), timestamps`
- Relations: `user()` (belongsTo), `transactions()` (hasMany), `receivedTransfers()` (hasMany via `to_account_id`)
- **Custom accessor `getBalanceAttribute()`** at `Account.php:73`: `starting_balance + income_sum - expense_sum - transfers_out_sum + transfers_in_sum` — runs 4 queries on each access (a known N+1 risk; mitigated in controllers by calling `$account->append('balance')` after the relation is already loaded).
- **Cascades on delete** with user.

### `categories`
- Fields: `id, user_id, name, type (enum: income|expense), timestamps`
- Relations: `user()` (belongsTo), `transactions()` (hasMany)
- Unique key on `(user_id, name, type)` — a user cannot have two categories with the same `(name, type)` pair. Same name across different types is allowed.
- Every new user is seeded with a default set of categories via the `User::created` model event (see `User::DEFAULT_CATEGORIES`). The seeded rows are owned by the user and can be edited or deleted freely; duplicates are still blocked by the unique key.

### `transactions`
- Fields: `id, user_id, account_id, to_account_id (nullable), type (enum: income|expense|transfer), category_id (nullable), amount (decimal 15,2), description, reference, transaction_date (date), is_synced (bool, default true), timestamps`
- Relations: `user()`, `account()`, `toAccount()` (custom FK `to_account_id`), `category()`
- Foreign-key behaviour: `account_id` and `to_account_id` cascade; `category_id` set-null on delete.
- **No custom cast** on `amount` — the database returns it as a 2-decimal string in some Laravel versions (this is why the docs show `"25.50"` for `amount` in some places).

## 6. Validation
- All inline via `$request->validate(...)` — **no FormRequest classes**.
- Common rules:
  - `name` → `required|string|max:255`
  - `type` → `required|in:...` (enum-validated)
  - `starting_balance` / `amount` → `required|numeric`
  - `email` → `required|email|unique:users` (register only)
  - `password` → `required|string|min:8|confirmed`
  - Foreign keys → `required|exists:table,id`
- Validation failures return Laravel's standard 422 `{ message, errors: { field: [msgs] } }`.

## 7. Controllers (line references)

### `AuthController` (`app/Http/Controllers/API/AuthController.php`)
- `register` (30-51): validates, creates user, mints Sanctum token, returns `{access_token, token_type, user}`.
- `login` (60-82): validates credentials, throws `ValidationException` on bad creds (with `email` field error).
- `logout` (90-97): deletes only the current token.
- `me` (105-108): returns `$request->user()`.

### `AccountController` (`AccountController.php`)
- `index` (28-38): `accounts = $user->accounts; $each->append('balance')`. **No pagination** — could become large.
- `store` (46-58): validates, `accounts()->create()`, returns 201.
- `show` (66-71): `authorize('view')` + appends `balance`.
- `update` (80-94): `authorize('update')` + validates optional fields.
- `destroy` (102-108): `authorize('delete')` + delete. **Cascades** to all transactions on that account (per migration FK).

### `CategoryController` (`CategoryController.php`)
- `index`: returns `$request->user()->categories()->get()`.
- `store`: validates with `Rule::unique(...)->where('user_id', ...)->where('type', ...)` and creates a category owned by the user.
- `show`/`update`/`destroy`: all call `authorize`. Duplicate prevention is enforced by the DB unique key and the validation rule — not by a default flag.

### `TransactionController` (`TransactionController.php`)
- `index` (30-39): eager-loads `account`, `toAccount`, `category`; orders by `transaction_date DESC, created_at DESC`; paginates 50.
- `store` (47-88):
  - Returns 403 if user has zero accounts.
  - Duplicate detection at 70-75: same user + same date + same type + same amount + same `account_id` ⇒ returns 409 `{message: "Potential duplicate detected.", is_duplicate: true}`. Bypass with `"force": true`.
- `sync` (96-118): validates the batch, stamps `user_id` and `is_synced = true` on every row, then `ProcessSync::dispatch($transactions)`. The job runs asynchronously.
- `show` (123-127): eager-loads relations.
- `update`/`destroy`: straightforward, both call `authorize`.

### `ImportController` (`ImportController.php`)
- `preview` (31-70): splits raw CSV by `\n`, treats first row as header (never validated as such), parses each row by index (Date, Description, Amount, Dr/Cr).
  - `parseDate` (99-106) wraps `Carbon::parse` in try/catch and **falls back to today's date** on parse failure (silent data corruption risk).
  - `is_duplicate` checked by `(user_id, date, amount, type)` — does NOT consider `account_id`, unlike the per-transaction duplicate check.
  - Returns an array (not wrapped in `{ data: ... }`).
- `store` (75-94): loops and `$user->transactions()->create($item)` one by one (no transaction wrapping, so partial failures leave the DB inconsistent).

### `SummaryController` (`SummaryController.php`)
- `index` (29-76):
  - `accounts` — collects all, appends `balance`, sums to `totalBalance`. **`balance` accessor runs once per account** and queries 4 tables each time = 4N queries. Could be N+1 in disguise even though `accounts` is a relation.
  - `monthly_summary.income` / `.expense` — single SUM queries scoped to current calendar month.
  - `monthly_summary.net = income - expense`.
  - `category_breakdown` — `groupBy('category_id')` joined with category, falls back to `"Uncategorized"` when `category_id` is null (using a PHP-side `map` that doesn't actually produce a row for nulls — see issue).
- No caching; recalculated on every dashboard load.

### `SocialAuthController` (`SocialAuthController.php`)
- `redirectToGoogle` (17-22): returns `{url: ...}` JSON — frontend navigates the user.
- `handleGoogleCallback` (28-59): upserts user by email, mints token, 302 to `FRONTEND_URL/login?token=...&user=...` (or `?error=...` on failure). The user data is encoded as `id` only — the frontend would need to fetch `/me` for full details.

### `ForgotPasswordController` / `ResetPasswordController`
- Standard Laravel password broker wrappers; return `{ message: __($status) }` on success or `{ email: [__($status)] }` / 422 on failure.

## 8. Jobs
- **`ProcessSync`** (`app/Jobs/ProcessSync.php`): receives an array, iterates and calls `Transaction::create($data)`. No transaction wrapping, no per-row validation, no `user_id` enforcement at job level (it was stamped in the controller). No batching, no chunking — a 10k-row payload would do 10k inserts in one job run.
- **`SendTransactionReminder`** (`app/Jobs/SendTransactionReminder.php`): queues `App\Mail\TransactionReminderMail` to a single user's email, then stamps `users.reminder_last_sent_at = now()`. Re-checks the dedupe window at handle-time in case the command and another worker race. `$tries = 3`, `$backoff = 60`. `failed()` logs the user id and error.

## 8.1 Mailing system
- **Three mail classes, all queued, all Markdown templates** in `resources/views/emails/`:
  - `verify-email.blade.php` — "Confirm your Pasona email" with the SPA confirm URL
  - `reset-password.blade.php` — "Reset your Pasona password" with the SPA reset URL
  - `transaction-reminder.blade.php` — "It's {reminder_time} — log today's transactions" with today's income/expense/account count baked in. Subject switches between the cold-open and a "Quick gut-check" variant when the user has already logged something today.
- **Daily reminder flow**: `routes/console.php` schedules `reminders:send-daily` every 5 minutes (`withoutOverlapping`, `onOneServer`). The command:
  1. Pulls users whose `reminder_time` (HH:MM, app timezone UTC) is within ±2 minutes of `now` (split into two ranges when the window crosses midnight).
  2. Smart-skips users who already have any transaction dated today (toggle with `--no-smart-skip`).
  3. Dedupe-skips users whose `reminder_last_sent_at` is today.
  4. Dispatches `SendTransactionReminder` for the rest.
  5. Logs a single summary line; supports `--dry-run` and `--user=ID` for testing.
- The `reminder_time` field is currently in app timezone (UTC). If/when per-user timezone is added, the command's `whereBetween` should pivot on `users.timezone`.
- Mail driver defaults to `log` (writes to `storage/logs/laravel.log`). To send real mail, set `MAIL_MAILER=smtp|resend|postmark` and the matching `MAIL_HOST/PORT/USERNAME/PASSWORD/FROM_*` — examples are commented in `.env.example`.

## 9. Import / CSV handling
- **No `league/csv` installed** — controller uses raw `str_getcsv` with `"\n"` delimiter.
- Header row is assumed (first row shifted off) but never validated against an expected schema.
- Row parsing is positional: `$data[0]` = date, `$data[1]` = description, `$data[2]` = amount, `$data[3]` = Dr/Cr.
- `Dr/Cr` → `expense`/`income`. There's no support for `Dr/Cr` variations (`DR`/`CR`/whitespace) — relies on `strtolower`.
- `parseDate` uses `Carbon::parse` (very lenient — accepts many formats) but silently defaults to "today" on failure.

## 10. Summary aggregation
- Time window: current calendar month (`Carbon::now()->startOfMonth()` → `endOfMonth()`).
- All `accounts` are loaded once and the `balance` accessor fires per account. With many accounts this is the slowest query in the system.
- `category_breakdown` runs a grouped `select(category_id, SUM(amount))` then maps. **Null `category_id` rows would produce a row with `category_name = "Uncategorized"`** only if the loaded relation is null — but the `groupBy('category_id')` includes the nulls.

## 11. Config (key points)
- **`config/api.php`**: `base_url` → `env('API_BASE_URL', '/api')`, `name` → `env('API_DISPLAY_NAME', 'Pasona Finance Tracker API')`, `version` → `v1`. Surfaced in docs via `config('api.base_url')`.
- **`config/cors.php`**: paths `['api/*', 'sanctum/csrf-cookie', 'auth/*', 'up']`, origins from `CORS_ALLOWED_ORIGINS` env (default: `FRONTEND_URL` + `http://localhost:8080`), `supports_credentials: true`.
- **`config/sanctum.php`**: `stateful` includes localhost/3000/8000; `guard: ['web']`; **no token expiration** (`expiration: null`); token_prefix env-driven.
- **`config/auth.php`**: default guard `web`, no API guard defined — Sanctum uses the bearer-token guard automatically.
- **`config/queue.php`**: default `database`; failed jobs go to `failed_jobs` table with `database-uuids` driver.
- **`config/mail.php`**: default `log` driver (writes to `storage/logs/laravel.log`).
- **`config/services.php`**: Google OAuth keys (`GOOGLE_CLIENT_ID/SECRET/REDIRECT`).
- **`bootstrap/app.php`**: registers `HandleCors` prepended in the global stack. That's it for middleware — no `throttle:api`, no `EnsureFrontendRequestsAreStateful`, no API middleware group beyond Sanctum.

## 12. `.env` (current values)
- `DB_CONNECTION=pgsql` → **Supabase Postgres** at `aws-1-eu-central-1.pooler.supabase.com:5432`
- `QUEUE_CONNECTION=database`
- `MAIL_MAILER=log`
- `SESSION_DRIVER=database`
- `GOOGLE_CLIENT_ID` and `GOOGLE_REDIRECT_URL` both set (the secret is in `services.php` config but blank in `.env` — actually I see `GOOGLE_CLIENT_SECRET` is in `.env` lines 51-52, then duplicated `GOOGLE_CLIENT_ID` on line 54)
- `FRONTEND_URL=http://localhost:8080`

## 13. Docs site (Blade, not React)
- All docs pages live under `resources/views/docs/` and are served by `routes/web.php` (no auth required).
- Layout: `resources/views/layouts/docs.blade.php` — includes the global try-it sidebar on every page.
- Partials: `navbar`, `sidebar`, `code-block`, `code-tabs`, `method-badge`, `try-it` (request builder form), `tryit-trigger` (per-endpoint button).
- Endpoint pages: `auth`, `accounts`, `categories`, `transactions`, `import`, `summary`.
- Getting-started pages: `overview`, `authentication`, `errors`, `rate-limiting`.
- Other: `guides`, `changelog`, `sdks` (the last still exists from previous work even though the user wanted no SDK references anywhere — flagged earlier).
- Assets: `public/css/docs.css` and `public/js/docs.js` (vanilla JS, no Vite output needed at runtime).

## 14. Scalability to-fix (1000 concurrent users)

### P0 — Must fix before scaling

- **No caching on summary/accounts** — `SummaryController` and `AccountController` recalculate balances, income, expense totals from scratch on every request. Add Redis + `Cache::remember()` with 1–2min TTL.
- **`ProcessSync` per-row SELECT+INSERT** — `app/Jobs/ProcessSync.php` runs a duplicate-check SELECT + INSERT per row. Batch with single `WHERE IN` + `Transaction::insert()`, chunk to 100.
- **Missing index on `transactions.to_account_id`** — used in `balancesFor()` and `TransactionController::index()`. Full table scan as data grows.

### P1 — High priority

- **No payload limits on sync/import** — `TransactionController::sync()` and all import endpoints accept unbounded arrays/files. Add `max:5000` on arrays, `max:10240` on file uploads.
- **`BaseImportController::fetchExisting()` OR-where explosion** — builds 500-OR-group SQL from CSV rows. PostgreSQL may refuse to plan. Batch OR groups or use reference-based dedup.
- **No IP rate limits on login/register/forgot-password** — `AppServiceProvider.php` only throttles the API group at 60/min. Add `Limit::perMinute(5)` per IP for auth endpoints.
- **`SummaryController::category_breakdown` eager-loads per group row** — replace `->with('category')` with a JOIN to eliminate extra query.

### P2 — Medium priority

- **Missing index on `transactions.reference`** — used by `OpayImportController::fetchExisting()`. Add `$table->index('reference')`.
- **Sanctum token expiry & cleanup** — 7-day expiry with no garbage collection. Set shorter expiry + scheduled purge job for `personal_access_tokens`.
- **`AccountController` unique validation extra query** — `Rule::unique` fires a SELECT before the DB constraint catches it. Consider removing validation and catching `QueryException` with code `23505`.

### P3 — Low priority

- **`ImportController::parseDate()` silently defaults to today** — on parse failure, corrupts transaction dates. Log warning and return sentinel.
- **Duplicate `GOOGLE_CLIENT_ID` in `.env`** — lines 58-62 have duplicates. Clean up.
- **Database `sslmode` should be `require` for Supabase** — `config/database.php:99` defaults to `prefer`, should be `require`.

## 15. Noteworthy issues / things to know
- **`Account::getBalanceAttribute`** issues 4 queries per call → O(4N) on the summary endpoint. With many accounts this is the obvious performance hotspot.
- **`ImportController::parseDate`** silently coerces unparseable dates to today.
- **`ImportController::store`** doesn't wrap inserts in a DB transaction — a single failure mid-loop leaves partial data.
- **`ProcessSync` job** has no transaction, no chunking, and no duplicate detection (unlike the single-transaction store path).
- **`SendDailyReminder` job** is a stub — `handle()` does nothing.
- **`ResetPasswordNotification`** is a stub — Laravel's default reset link won't render properly until the notification's `toMail` is replaced with a real reset URL builder.
- **Test coverage is zero** — only `ExampleTest` placeholders.
- **`web.php` has a `docs.sdks` route** pointing to a `docs/sdks.blade.php` view that still ships in the sidebar — flagged previously as not matching the "no SDK references anywhere" constraint.
- **No API guard or `throttle:api` middleware** — rate limiting is mentioned in `config/cache.php` and a docs page exists, but no `RateLimiter::for(...)` is registered.
