# Agent Runbook — Pasona Backend

## Safety rules

- **NEVER run `migrate:rollback`, `migrate:fresh`, `migrate:refresh`, or `db:wipe`** against the production database. These commands are blocked at the application level by `AppServiceProvider` unless `DESTRUCTIVE_COMMANDS_ALLOWED=true` is set in `.env`.
- **NEVER use `--force` with any migrate command** in production. Laravel's production prompt exists for a reason.
- **NEVER modify `.env`** to add secrets or change database credentials without explicit user instruction.
- **ALWAYS run `php artisan migrate --force` instead of `migrate`** only when the user explicitly confirms it's safe (e.g. a schema-only change with no production traffic).

## Allowed commands (safe to run anytime)

- `php artisan migrate:status` — check migration state
- `php artisan route:list` — inspect routes
- `php artisan queue:work` — process queued jobs
- `php artisan schedule:run` — run scheduled tasks
- `php artisan test` — runs against in-memory SQLite (safe)
- `php artisan tinker` — REPL for debugging
- `php artisan make:*` — creating new files (migrations, commands, etc.)
- `composer *` — dependency management

## Backup before schema changes

Before any schema-altering operation, ask the user to run:
```bash
php artisan db:backup
```
This dumps the database to `storage/backups/`. Backups are also scheduled daily at 04:00 UTC.

## Queue worker

The email reminder system requires a running queue worker:
```bash
php artisan queue:work --sleep=3 --tries=3
```
Without it, `SendTransactionReminder` jobs sit in the `jobs` table unprocessed.

## Status (as of 2026-06-10)

### Completed features
- Privacy policy updated: mentions in-app account deletion, updated date
- Account deletion (soft-delete) with `DELETE /me` endpoint
  - Added `deleted_at` to users, accounts, categories, transactions (2 migrations)
  - `SoftDeletes` trait on all four models
  - Destroy method: revokes tokens, soft-deletes transactions → accounts → categories → user
  - Sanctum automatically rejects requests from soft-deleted users
- Re-registration / re-login restores a soft-deleted account
  - Google OAuth: `withTrashed()` lookup + `restore()` before updating profile
  - Register: validation ignores soft-deleted rows (`unique:...,deleted_at,NULL`), `onlyTrashed()` restore
  - Login: `withTrashed()` lookup + `restore()` on successful password check
  - `checkEmail` correctly reports soft-deleted emails as available (SoftDeletes global scope)
- "Delete Account" button in Settings with two-field confirmation (email + "delete this account")
- "Import transactions" button shows "Feature under development" on production, works locally
- Removed "Replay product tour" from settings and disabled the `replayTour` route parameter
- Reminder toggle uses optimistic update: flips immediately, reverts on failure
- Account update dialog sends only changed fields (diff-based payload)
- Transaction filtering by `account_id` works
- Composite indexes on transactions table
- ProcessSyncJob: chunked (100), batched duplicate checks, bulk insert
- PATCH `/me` endpoint for profile updates (name, reminder_time)
- Settings reminder toggle works (enable/disable) — backed by nullable column migration
- Transaction edit dialog (TransactionDialog.tsx) with pre-filled fields + comments
- Dashboard account cards link to `/accounts/$accountId`
- Backend regex validation uses array syntax for `reminder_time`

## Common issues

| Symptom | Likely cause | Fix |
|---------|-------------|------|
| `column "google_id" does not exist` | Missing migration | `php artisan migrate --force` |
| Emails not sending | Queue worker not running | `php artisan queue:work` |
| `Destructive commands are blocked` | Rollback/fresh blocked | Set `DESTRUCTIVE_COMMANDS_ALLOWED=true` in `.env` after user confirmation |
| `null value in column "reminder_time" ... violates not-null constraint` | Old migration has NOT NULL | Run migration `2026_06_10_103111_make_reminder_time_nullable_on_users_table` |
| `duplicate key value violates unique constraint "users_email_unique"` | Soft-deleted user re-registering | Migration `2026_06_10_124929`, `2026_06_10_124944` already applied; restore logic in auth flows handles this |
