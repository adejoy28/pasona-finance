# 💰 Pasona Finance

> **Fast, Offline-First, Multi-Wallet Personal Finance Tracker**  
> Seamlessly track income, expenses, and transfers across multiple bank accounts, mobile money wallets, and cash — available on **Web (PWA)**, **Android (Capacitor)**, and **Desktop (Electron)**.

---

## 🎯 The Problem We Are Solving

Managing personal finances in today's multi-wallet economy is fragmented and frustrating:

1. **Fragmented Accounts & Wallets**: Modern earners hold money across traditional commercial banks, fintech neo-banks (OPay, Kuda, PalmPay, Moniepoint), mobile money wallets, and physical cash. Tracking total net worth and cashflow across multiple apps without manual reconciliation is difficult.
2. **Fragile Connectivity & Online Dependency**: Most modern finance apps fail completely when internet access is spotty or unavailable. If an expense isn't logged the moment it happens (e.g. paying cash in a market or taxi), it gets forgotten, leading to inaccurate records.
3. **Tedious, Repetitive Manual Logging**: Manually typing every single card purchase or bank transfer is exhausting. Users need automated statement imports (CSV/Excel) without spending hours formatting files or worrying about duplicate transactions.
4. **Privacy Exposure in Public**: Opening standard banking or budgeting apps in public transit, open offices, or crowded spaces exposes sensitive balances and financial history to nearby onlookers.
5. **Annoying, Dumb Notification Spam**: Most apps send static, annoying reminders regardless of whether you've already logged your transactions, training users to ignore or disable notifications entirely.
6. **Platform Inflexibility**: Users want their financial records accessible anywhere — whether working at a desk on a PC/Mac, browsing the web, or on the move with an Android phone.

**Pasona** solves these problems with a unified, offline-first, privacy-conscious platform that puts speed, simplicity, and user control first.

---

## ✨ Current Features (What Users Can Do Right Now)

### 🏦 Multi-Account & Multi-Currency Management
- **Multi-Wallet Tracking**: Manage accounts across **Bank Accounts**, **Mobile Money** (Kuda, OPay, PalmPay, etc.), **Cash at Hand**, and **Savings**.
- **Accurate Real-Time Balances**: Real-time balance calculations derived from initial balances and logged activity.
- **Zero-Sum Internal Transfers**: Move funds between your own accounts without distorting income or expense reports.
- **Multi-Currency Support**: Choose your preferred global or local base currency (NGN, USD, EUR, GBP, XOF, etc.) with per-account currency support.

### ⚡ Rapid Transaction Logging & Categorization
- **Instant Entry**: Log Income, Expenses, and Account Transfers in seconds with minimal clicks.
- **Smart Categorization**: Organize transactions with default and custom categories, custom colors, and icons.
- **Metadata & Notes**: Attach transaction dates, descriptions, payment methods, and optional receipt references.
- **Duplicate Detection**: Built-in fingerprinting alerts users before creating identical transactions on the same account and date.

### 📴 Offline-First Architecture & Background Sync
- **Full Offline Capabilities**: Browse accounts, review history, and log transactions completely offline using local client-side storage (**Dexie.js / IndexedDB**).
- **Optimistic UI Updates**: Transactions reflect in the UI immediately without waiting for server responses.
- **Automatic Bi-Directional Queue Sync**: When internet connectivity returns, local drafts and changes automatically synchronize with the backend API via background queue workers.

### 📄 Bank Statement CSV Ingestion
- **Automated Statement Importer**: Import transactions directly from bank CSV exports.
- **Dedicated Bank Parsers**: Native parsing templates for **Kuda Bank**, **OPay**, and **Generic CSV** layouts (Date, Description, Amount, Debit/Credit).
- **Interactive Import Preview**: Review, edit, select/deselect rows, and inspect duplicate detection flags before saving transactions.

### 📊 Visual Dashboard & Financial Insights
- **Monthly Cashflow Summary**: High-level visual indicators for Total Income, Total Expenses, and Net Savings.
- **Category Spending Breakdowns**: Interactive visual breakdown charts (powered by Recharts) showing where money goes each month.
- **Date Range Navigation**: Quickly jump between months and inspect historical cash flow trends.

### 🛡️ Privacy Mode & Biometric Security
- **Privacy Mode (Anti-Shoulder Surfing)**: One-click toggle (with hotkey support) that masks/blurs all currency values, account balances, and amounts on screen for safe usage in public.
- **Biometric Authentication**: Sign in with **Fingerprint** or **Face ID** on supported mobile devices via native biometric authentication (`@aparajita/capacitor-biometric-auth`).
- **Flexible Auth**: Sign in via Email & Password, Google OAuth, or Sanctum Bearer Tokens.
- **Non-Blocking Email Verification**: Opt-in verification flow allowing immediate app usage upon registration, reserving verified email requirements only for sensitive bulk-write operations (CSV import & batch sync).

### 🔔 Smart Daily Reminders
- **Customizable Reminder Schedule**: Choose your daily reminder time (default 21:00).
- **Smart-Skip Algorithm**: The reminder service checks if you have already recorded transactions today — if you did, the nudge is automatically skipped so you are never spammed.
- **Multi-Channel Delivery**: Delivered via transactional email (Markdown Blade templates) and device-level native push / local notifications.

### 📱 Cross-Platform Accessibility
- **Web Progressive Web App (PWA)**: Installable directly to your home screen or desktop with service worker caching.
- **Native Android App**: Packaged with **Capacitor** for Android with native push, status bar control, and secure credential storage.
- **Desktop Application**: Cross-platform desktop builds for Windows, macOS, and Linux powered by **Electron**.

---

## 🔮 Roadmap (What Users Will Be Able to Do Over Time)

- [ ] **AI-Powered Receipt Scanning (OCR)**: Snap a photo of physical receipts or invoices to automatically parse the merchant, total, date, and line items into draft transactions.
- [ ] **Automated Bank Feed Integration (Open Banking)**: Connect directly to financial APIs (e.g., Mono, Stitch, Plaid) for automated real-time transaction fetching and account balance updates.
- [ ] **Advanced Budgeting & Envelope System**: Set monthly category spending limits with rollover budgets, progress bars, and proactive overspending warnings.
- [ ] **Debt & Loan Amortization Tracker**: Track loans given to friends or debts owed, with payback schedules, payment logging, and installment reminders.
- [ ] **Multi-Asset Investment & Net Worth Tracking**: Monitor investment portfolios, stocks, mutual funds, and crypto assets alongside cash accounts to visualize total net worth over time.
- [ ] **Custom Financial Reports & Tax Exports**: Generate formatted monthly PDF balance sheets, income statements, and tax-ready CSV/Excel spreadsheets.
- [ ] **Shared Household & Split Wallets**: Create shared ledgers for couples, families, or roommates to split household expenses and manage joint budgets.
- [ ] **Recurring Subscriptions & Bills Calendar**: Track recurring subscriptions (Netflix, Spotify, internet, rent) with automatic forecasting and renewal notifications.
- [ ] **Asynchronous Background Processing for Bulk Ingestion**: Queue-backed background jobs for processing multi-year bank statements without blocking browser sessions.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend API** | **Laravel 12 (PHP 8.2+)** | REST API, Sanctum authentication, Eloquent ORM, queued jobs & mailables |
| **Frontend Framework** | **React 19 + TypeScript + Vite 7** | Client-side SPA with reactive state, modern hooks, and fast HMR |
| **UI & Styling** | **Tailwind CSS v4 + Radix UI + Framer Motion** | Accessible UI primitives, smooth micro-interactions, responsive design |
| **Data Visualization** | **Recharts** | Interactive spending breakdowns and financial charts |
| **Offline Storage** | **Dexie.js / IndexedDB** | Client-side database for instant offline read/write and sync queuing |
| **Mobile Shell** | **Capacitor 8** | Native Android integration with biometric auth, local notifications, and splash screen |
| **Desktop Shell** | **Electron 37 + electron-builder** | Native desktop packaging for Windows (`.exe`), macOS, and Linux |
| **Database** | **PostgreSQL 15+** | Relational data store with composite indexes for fast ledger queries |
| **Caching & Queue** | **Redis / Predis (fallback to File/DB)** | High-performance response caching, lock management, and background worker queues |
| **Mailing** | **Symfony Mailer / Resend / Postmark / SMTP** | Queued Markdown transactional emails |

---

## 📁 Repository Structure

```
pasona-finance/
├── backend/                        # Laravel 12 REST API
│   ├── app/
│   │   ├── Console/Commands/       # Artisan commands (reminders:send-daily, etc.)
│   │   ├── Http/Controllers/API/   # Auth, Accounts, Transactions, Categories, Imports
│   │   ├── Jobs/                   # Background jobs (ProcessSync, SendTransactionReminder)
│   │   ├── Mail/                   # TransactionReminderMail
│   │   ├── Models/                 # User, Account, Transaction, Category
│   │   └── Notifications/          # VerifyEmailNotification, ResetPasswordNotification
│   ├── config/                     # Application configurations
│   ├── database/                   # Migrations & Seeders
│   ├── resources/views/emails/     # Markdown email templates
│   ├── routes/                     # api.php, console.php
│   └── tests/                      # Feature and Unit test suites
├── frontend/                       # React 19 + Vite Application
│   ├── android/                    # Capacitor Android native project
│   ├── electron/                   # Electron main & preload scripts
│   ├── public/                     # Static assets, icons, manifest
│   ├── src/
│   │   ├── components/             # Reusable UI primitives & finance components
│   │   ├── hooks/                  # Custom hooks (useMe, useOnline, useLocalNotifications, etc.)
│   │   ├── lib/                    # API client, Dexie offline DB, biometric auth, utilities
│   │   ├── pages/                  # Dashboard, Transactions, Accounts, Categories, Import, Settings
│   │   └── styles.css              # Global styling & Tailwind directives
│   ├── capacitor.config.ts         # Capacitor native configuration
│   ├── electron-builder.yml        # Electron packaging configuration
│   └── vite.config.ts              # Vite bundler, PWA plugin, API proxy setup
├── DEPLOY.md                       # Deployment guide for cPanel / VPS / Docker
├── whatNext.md                     # Technical backlog & optimization tasks
└── README.md                       # Project documentation (this file)
```

---

## 🚀 Quick Start & Local Development

### Prerequisites

Ensure you have installed:
- **PHP 8.2+** & **Composer**
- **Node.js 18+** & **pnpm** (or npm)
- **PostgreSQL 15+** (or MySQL/SQLite for quick testing)
- **Redis** *(optional, recommended for production caching)*
- **Android Studio & SDK** *(optional, for Android APK builds)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/adejoy/pasona-finance.git
cd pasona-finance
```

---

### 2. Backend Setup (Laravel 12 API)

```bash
# Navigate into backend directory
cd backend

# Install PHP dependencies
composer install

# Create environment configuration
cp .env.example .env

# Generate application encryption key
php artisan key:generate

# Configure your database credentials in .env (DB_DATABASE, DB_USERNAME, DB_PASSWORD)
# Then run database migrations and initial seeders:
php artisan migrate --seed

# Start the local development API server
php artisan serve
```

In separate terminals, start the queue worker and scheduler for smart daily reminders:
```bash
# Process queued jobs (emails, sync)
php artisan queue:listen

# Run the task scheduler (picks up reminders:send-daily every 5 minutes)
php artisan schedule:work
```

---

### 3. Frontend Setup (React 19 + Vite)

```bash
# Navigate into frontend directory
cd ../frontend

# Install dependencies
pnpm install

# Create environment configuration
cp .env.example .env

# Start the Vite development server (proxies /api to http://localhost:8000)
pnpm dev
```

Your app will be running at `http://localhost:5173`.

---

### 4. Running as Desktop App (Electron)

To develop and test Pasona inside an Electron desktop window:

```bash
cd frontend
pnpm electron:dev
```

To package a production Windows installer (`.exe`):
```bash
pnpm electron:build
```

---

### 5. Running on Android (Capacitor)

```bash
cd frontend

# Build frontend production bundle and synchronize with Capacitor
pnpm android:build

# Open the project in Android Studio
npx cap open android
```

---

## 📬 Transactional Email & Notifications

Pasona includes three transactional email flows built with Markdown Blade templates:

| Email Type | Trigger Event | Mechanism |
|---|---|---|
| **Email Verification** | User registration | Non-blocking signed URL link |
| **Password Reset** | `POST /api/forgot-password` | 60-minute signed reset token with SPA link |
| **Daily Nudge Reminder** | `reminders:send-daily` cron | Evaluates user's reminder time with **Smart-Skip** |

### Local Email Testing
By default, `.env` is configured with `MAIL_MAILER=log`. All outgoing verification links, reset tokens, and reminder emails are logged directly into `backend/storage/logs/laravel.log`.

To connect real email services (Resend, Postmark, Mailgun, Amazon SES, or custom SMTP), configure your provider credentials in `backend/.env`:

```env
MAIL_MAILER=resend
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_SCHEME=smtps
MAIL_USERNAME=resend
MAIL_PASSWORD=re_your_api_key
MAIL_FROM_ADDRESS="hello@pasona.app"
MAIL_FROM_NAME="Pasona Finance"
```

---

## ⚙️ Environment Configuration Reference

### Backend (`backend/.env`)
- `APP_URL`: Base URL of the API (e.g. `http://localhost:8000`).
- `FRONTEND_URL`: Base URL of the client SPA (e.g. `http://localhost:5173`).
- `DB_CONNECTION`: `pgsql` (recommended) or `mysql` / `sqlite`.
- `CACHE_STORE`: `redis`, `file`, or `database`.
- `QUEUE_CONNECTION`: `database` or `redis`.
- `SANCTUM_STATEFUL_DOMAINS`: Allowed stateful domains for session cookies.

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL`: `/api` (for local Vite proxy) or `https://api.yourdomain.com/api`.
- `VITE_BACKEND_ORIGIN`: `http://localhost:8000` (target backend during local dev).
- `VITE_APP_NAME`: `Pasona`.
- `VITE_ANDROID_APK_URL`: Optional download link for the compiled APK.

---

## 🌍 Production Deployment

For detailed production deployment instructions (cPanel shared hosting, VPS with Docker, Nginx reverse proxy, and SSL setup), refer to [`DEPLOY.md`](./DEPLOY.md).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/adejoy/pasona-finance/issues) or review [`whatNext.md`](./whatNext.md) for current engineering backlog items.

---

## 📄 License

This project is open-source software licensed under the [MIT License](https://opensource.org/licenses/MIT).
