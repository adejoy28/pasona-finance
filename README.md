# 💰 Pasona — A Personal Finance Tracker

A simple, fast, offline-first personal finance tracker built with **Laravel 12** (REST API) and **TanStack Start** (PWA), wrapped in **Capacitor** for iOS/Android while the native APK is in progress. Designed for daily expense logging across multiple bank accounts, with bank-statement import, smart-skip daily nudges, and spending breakdowns.

---

## 📁 Project Structure

```
pasona-finance/
├── backend/                # Laravel 12 REST API
│   ├── app/
│   │   ├── Console/Commands/   # artisans, incl. reminders:send-daily
│   │   ├── Http/Controllers/   # API + EmailVerificationController
│   │   ├── Jobs/               # ProcessSync, SendTransactionReminder
│   │   ├── Mail/               # TransactionReminderMail
│   │   ├── Models/             # User (MustVerifyEmail), Account, …
│   │   └── Notifications/      # VerifyEmailNotification, ResetPasswordNotification
│   ├── database/migrations/    # incl. users.reminder_last_sent_at
│   ├── resources/views/emails/ # verify-email, reset-password, transaction-reminder
│   └── routes/{api,console}.php
└── (frontend lives outside this repo — see “Frontend” section below)
```

---

## ✨ Features

- Log income, expenses, and transfers in seconds
- Track multiple accounts (Bank, Mobile Money, Cash)
- Transfers between your own accounts don't count as expenses
- Works **offline** — syncs automatically when back online
- Import bank statements via CSV to bulk-load transactions (Kuda, OPay, generic)
- Duplicate detection before any import
- Monthly summary: income vs expenses vs savings
- Spending breakdown by category
- **Opt-in email verification** — register and use the app immediately, with a dismissible banner until confirmed. Only sensitive bulk writers (CSV import, transaction batch sync) require a verified email
- **Daily reminder email** at each user’s chosen time (default 21:10). Smart-skips if the user already logged something today, dedupes to one send per day
- **Catchy password-reset email** with a one-click link to the SPA reset form
- Mobile-first, installable as a home screen PWA and wrapped in Capacitor for iOS/Android

---

## 🛠 Tech Stack

| Layer           | Technology                              |
| --------------- | --------------------------------------- |
| Backend         | Laravel 12, PHP 8.2+                    |
| Frontend        | TanStack Start, React 19, Vite          |
| Native shell    | Capacitor (iOS + Android)               |
| Database        | PostgreSQL 15+                          |
| Auth            | Laravel Sanctum (bearer tokens)         |
| Mail            | Markdown mailables, queued, pluggable SMTP/Resend/Postmark |
| Offline Storage | IndexedDB (browser)                     |
| Hosting         | cPanel (shared/VPS)                     |
| PWA             | Service Worker + Web App Manifest       |

---

## 🚀 Quick Start

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- npm or yarn
- PostgreSQL 15+
- A cPanel hosting account with Node.js support

### 1. Clone the repository

```bash
git clone https://github.com/adejoy/Pasona FinTrack.git
cd Pasona FinTrack
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
# Edit .env with your PostgreSQL credentials
php artisan migrate --seed
php artisan serve
# In another terminal — required for the daily-reminder job + queued mail:
php artisan queue:listen
php artisan schedule:work     # picks up the every-5-minutes reminder tick
```

See [`backend/README.md`](./backend/README.md) for full backend setup.

### 3. Set up the frontend

The TanStack Start app lives in its own repo. The three pages it needs are:

- `src/routes/_auth/email/verify.tsx` — handles the verification link
- `src/routes/_auth/forgot-password.tsx` + `reset-password.tsx` — password reset flow
- `src/routes/settings/reminders.tsx` — let the user change their reminder time
- `<VerifyEmailBanner />` mounted in `__root.tsx`
- A typed `apiFetch` wrapper that surfaces the `requires_verified_email` 403 from the bulk-write endpoints

Create a `.env` with `VITE_API_URL=http://localhost:8000/api`, then `pnpm dev`.

### 4. Catching emails in dev

The repo ships with `MAIL_MAILER=log`, which means every email (verification, reset, reminder) is written to `backend/storage/logs/laravel.log` instead of being sent. That’s the fastest way to develop locally — open the log, copy the link, paste it in your browser. When you’re ready to send real mail, see the **Mailing system** section below.

---

## 📬 Mailing system

Three transactional emails, all queued, all Markdown templates, all driven by the same `MAIL_MAILER` setting.

| Email                | Class                                              | Blade template                                  | When it fires                                                                  |
| -------------------- | -------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Email verification   | `App\Notifications\VerifyEmailNotification`        | `resources/views/emails/verify-email.blade.php` | On register (non-blocking). Resendable via `POST /api/email/verification-notification` |
| Password reset       | `App\Notifications\ResetPasswordNotification`      | `resources/views/emails/reset-password.blade.php` | On `POST /api/forgot-password` (built-in broker + 60-min token)             |
| Daily reminder       | `App\Mail\TransactionReminderMail`                 | `resources/views/emails/transaction-reminder.blade.php` | `reminders:send-daily` artisan, scheduled every 5 min in `routes/console.php` |

### Daily reminder, in detail

- Each user has `users.reminder_time` (default `21:10`, app timezone UTC) and `users.reminder_last_sent_at`.
- `routes/console.php` schedules `reminders:send-daily` `everyFiveMinutes()` with `withoutOverlapping(10) onOneServer()`.
- The command finds users whose `reminder_time` is within ±2 min of now (split into two ranges when the window crosses midnight), then:
  1. **Smart-skips** anyone who already logged a transaction today (toggle with `--no-smart-skip`)
  2. **Dedupe-skips** anyone whose `reminder_last_sent_at` is today
  3. Dispatches `App\Jobs\SendTransactionReminder` for the rest
- The job re-checks the dedupe window at handle time and stamps `reminder_last_sent_at` after a successful send. 3 tries, 60s backoff, failed→log.
- The mailable personalises the email with the user’s own today-stats (income, expense, account count) and switches the subject between the cold-open and a “Quick gut-check” variant when the user has already logged something.

```bash
# Manual / one-shot (great for debugging)
php artisan reminders:send-daily --dry-run
php artisan reminders:send-daily --user=42 --no-smart-skip
```

### Email verification, in detail

- The `User` model implements `MustVerifyEmail`. Verification is **opt-in** — no global `verified` middleware is applied to the API. Users can register, log in, and log transactions immediately.
- The only endpoints that require a verified email are the **sensitive bulk writers**: `POST /api/transactions/sync`, `POST /api/import/store`, `POST /api/import/kuda/store`. The middleware is registered as the `verified` alias in `backend/bootstrap/app.php`; the `AuthorizationException` it throws is converted to a JSON `{ requires_verified_email: true, message }` envelope so the SPA can act.
- `GET /api/email/verification-status` lets the SPA render a dismissible banner without a page reload.
- Google OAuth auto-flips `email_verified_at` on first login (Google already proved the email).

### Going from `log` to real mail

`MAIL_MAILER=log` writes to `storage/logs/laravel.log` — perfect for dev, useless for users. To send real mail, set in `.env`:

```env
MAIL_MAILER=resend                     # or: smtp, postmark, ses, sendmail
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_SCHEME=smtps
MAIL_USERNAME=resend
MAIL_PASSWORD=re_xxx
MAIL_FROM_ADDRESS="hello@yourdomain.com"
MAIL_FROM_NAME="Pasona"
```

All three mail classes pick it up automatically — no code change. Examples for every provider are commented in `backend/.env.example`.

---

## 🌍 Deployment

See [`DEPLOY.md`](./DEPLOY.md) for step-by-step instructions to deploy on cPanel with PostgreSQL.

---

## 💳 Default Accounts (from your setup)

On first run, you can add these accounts manually or seed them:

- Sterling (Bank)
- Opay (Mobile)
- Kuda (Mobile)
- Palmpay (Mobile)
- Money Master (Mobile)
- Cash at Hand (Cash)
- ALAT (Bank)

---

## 🏷 Default Categories

**Income:** Salary, Freelance, Gift Received, Business Income, Other Income

**Expense:** Food & Groceries, Transport, Utilities, Rent/Housing, Airtime & Data, Healthcare, Education, Shopping, Entertainment, Loan Payment, Savings, Tithe, Bank Charges

---

## 📌 Key Concepts

### Transaction Types

| Type     | Description                        | Affects Balance       |
| -------- | ---------------------------------- | --------------------- |
| Income   | Money arriving into an account     | Increases account     |
| Expense  | Money leaving for goods/services   | Decreases account     |
| Transfer | Money moving between YOUR accounts | No net change overall |

### Balance Formula

```
Current Balance = Starting Balance + Total In − Total Out
```

Transfers cancel out — money leaving one account enters another, so your total net worth stays the same.

---

## 🔒 Assumptions

1. Single user per installation — no multi-user team features
2. Nigerian Naira (₦) as the only currency
3. No charts or graphs — clean text/number summaries only
4. Authentication: email + password (or Google OAuth) via Laravel Sanctum bearer tokens
5. **Email verification is opt-in.** Unverified users can do everything except CSV import + batch transaction sync
6. Daily nudges are delivered by **email**, not push — until the Capacitor APK is shipped, this is the only reliable channel on mobile
7. Bank statement import expects CSV: Date, Description, Amount, Dr/Cr columns
8. Offline sync uses IndexedDB — no third-party sync service needed
9. cPanel hosting supports Node.js runner for TanStack Start / Vite SSR
10. PostgreSQL credentials are set manually via `.env`
11. No budget limits or alerts — pure tracking only
12. App is in English only

---

## 🤝 Contributing

This project is personal-use focused. Fork it, adapt it, make it yours.

---

## 📄 License

MIT — free to use and modify.
