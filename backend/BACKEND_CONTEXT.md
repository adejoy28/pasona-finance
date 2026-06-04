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
│   ├── seeders/      DatabaseSeeder, CategorySeeder (16 default categories), UserSeeder (john/jane)
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
| GET | `/auth/google` | `SocialAuthController@redirectToGoogle` |
| GET | `/auth/google/callback` | `SocialAuthController@handleGoogleCallback` |
| POST | `/forgot-password` | `ForgotPasswordController@sendResetLinkEmail` |
| POST | `/reset-password` | `ResetPasswordController@reset` |

### Protected (`auth:sanctum`)
| Method | URI | Controller@method |
|---|---|---|
| GET | `/me` | `AuthController@me` |
| POST | `/logout` | `AuthController@logout` |
| GET/POST/PUT/DELETE | `/accounts[/{id}]` | `AccountController` (apiResource) |
| GET/POST/PUT/DELETE | `/categories[/{id}]` | `CategoryController` (apiResource) |
| GET/POST/PUT/DELETE | `/transactions[/{id}]` | `TransactionController` (apiResource) |
| POST | `/transactions/sync` | `TransactionController@sync` |
| POST | `/import/preview` | `ImportController@preview` |
| POST | `/import/store` | `ImportController@store` |
| GET | `/summary` | `SummaryController@index` |

## 4. Authentication
- **Sanctum personal access tokens** issued by `AuthController::register` and `AuthController::login` via `$user->createToken('auth_token')->plainTextToken`. Returned as `{ access_token, token_type: "Bearer", user }`.
- `auth:sanctum` middleware applied as a group on protected routes in `routes/api.php:38`.
- **Logout** (`AuthController:90`) deletes only the current token (`currentAccessToken()->delete()`) — other sessions stay alive.
- **Google OAuth** (`SocialAuthController`): `stateless()->redirect()->getTargetUrl()` returns a JSON `{url}` to the SPA. The callback creates a user if `email` doesn't exist (or links the Google ID to existing user by email), mints a Sanctum token, and 302-redirects to `FRONTEND_URL/login?token=...&user=...`.
- **Password reset** uses Laravel's built-in `Password` broker:
  - `ForgotPasswordController` calls `Password::sendResetLink($request->only('email'))` — needs `App\Notifications\ResetPasswordNotification` to be wired up (currently a stub).
  - `ResetPasswordController` calls `Password::broker()->reset(...)` and updates via a closure.
  - Token table is the default `password_reset_tokens`; expiry 60 min, throttle 60 sec.
- **No policies or gates are auto-registered** for the AuthController/Social flow, but the resource controllers call `$this->authorize('view|update|delete', $model)` on show/update/destroy.

## 5. Data model

### `users`
- Fields: `id, name, email (unique), email_verified_at, password (nullable, hashed), google_id, avatar, reminder_time (default '21:10'), remember_token, timestamps`
- Relations: `accounts()`, `categories()`, `transactions()` — all `hasMany`
- Uses `HasApiTokens` (Sanctum), `HasFactory`, `Notifiable`
- Casts: `email_verified_at → datetime`, `password → hashed`

### `accounts`
- Fields: `id, user_id, name, type (enum: bank|mobile|cash), starting_balance (decimal 15,2, default 0), notes (text nullable), timestamps`
- Relations: `user()` (belongsTo), `transactions()` (hasMany), `receivedTransfers()` (hasMany via `to_account_id`)
- **Custom accessor `getBalanceAttribute()`** at `Account.php:73`: `starting_balance + income_sum - expense_sum - transfers_out_sum + transfers_in_sum` — runs 4 queries on each access (a known N+1 risk; mitigated in controllers by calling `$account->append('balance')` after the relation is already loaded).
- **Cascades on delete** with user.

### `categories`
- Fields: `id, user_id (nullable), name, type (enum: income|expense), is_default (bool), timestamps`
- Relations: `user()` (belongsTo), `transactions()` (hasMany)
- `is_default = true` rows are system-wide and cannot be modified or deleted (enforced both in `CategoryPolicy` and inline checks in `CategoryController`).
- `user_id` is nullable for default categories.

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
- `index` (28-35): `Category::where('is_default', true)->orWhere('user_id', $user->id)->get()` — note this uses `orWhere` without parameter grouping, so it expands to `WHERE is_default = true OR user_id = X`. Works as intended.
- `store` (43-57): creates with `is_default = false`.
- `show`/`update`/`destroy` (62-103): all call `authorize`, and `update`/`destroy` short-circuit with 403 if `is_default = true`.

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
- **`SendDailyReminder`** (`app/Jobs/SendDailyReminder.php`): scaffold only — the `handle()` method is a comment. The `reminder_time` column on `users` exists, so the intent is clear but the implementation isn't done.

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

## 14. Noteworthy issues / things to know
- **`Account::getBalanceAttribute`** issues 4 queries per call → O(4N) on the summary endpoint. With many accounts this is the obvious performance hotspot.
- **`ImportController::parseDate`** silently coerces unparseable dates to today.
- **`ImportController::store`** doesn't wrap inserts in a DB transaction — a single failure mid-loop leaves partial data.
- **`ProcessSync` job** has no transaction, no chunking, and no duplicate detection (unlike the single-transaction store path).
- **`SendDailyReminder` job** is a stub — `handle()` does nothing.
- **`ResetPasswordNotification`** is a stub — Laravel's default reset link won't render properly until the notification's `toMail` is replaced with a real reset URL builder.
- **Test coverage is zero** — only `ExampleTest` placeholders.
- **`web.php` has a `docs.sdks` route** pointing to a `docs/sdks.blade.php` view that still ships in the sidebar — flagged previously as not matching the "no SDK references anywhere" constraint.
- **No API guard or `throttle:api` middleware** — rate limiting is mentioned in `config/cache.php` and a docs page exists, but no `RateLimiter::for(...)` is registered.
