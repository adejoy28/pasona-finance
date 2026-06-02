# 💰 Pasona FinTrack — Personal Finance Tracker

A simple, fast, offline-first personal finance tracker built with **Laravel** (backend API) and **Next.js** (frontend PWA). Designed for daily expense logging across multiple bank accounts, with bank statement import and spending breakdowns.

---

## 📁 Project Structure

```
Pasona FinTrack/
├── Pasona FinTrack-api/        # Laravel backend (REST API)
├── Pasona FinTrack-web/        # Next.js frontend (PWA)
├── DEPLOY.md            # Deployment instructions for cPanel
└── README.md            # This file
```

---

## ✨ Features

- Log income, expenses, and transfers in seconds
- Track multiple accounts (Bank, Mobile Money, Cash)
- Transfers between your own accounts don't count as expenses
- Works **offline** — syncs automatically when back online
- Import bank statements via CSV to bulk-load transactions
- Duplicate detection before any import
- Monthly summary: income vs expenses vs savings
- Spending breakdown by category
- Daily push notification reminder to log expenses (PWA)
- Mobile-first, installable as a home screen app (PWA)

---

## 🛠 Tech Stack

| Layer           | Technology                        |
| --------------- | --------------------------------- |
| Backend         | Laravel 11, PHP 8.2+              |
| Frontend        | Next.js 14, React 18              |
| Database        | PostgreSQL 15+                    |
| Auth            | Laravel Sanctum                   |
| Offline Storage | IndexedDB (browser)               |
| Hosting         | cPanel (shared/VPS)               |
| PWA             | Service Worker + Web App Manifest |

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
git clone https://github.com/yourusername/Pasona FinTrack.git
cd Pasona FinTrack
```

### 2. Set up the backend

```bash
cd Pasona FinTrack-api
cp .env.example .env
composer install
php artisan key:generate
# Edit .env with your PostgreSQL credentials
php artisan migrate --seed
php artisan serve
```

See [`Pasona FinTrack-api/README.md`](./Pasona FinTrack-api/README.md) for full backend setup.

### 3. Set up the frontend

```bash
cd Pasona FinTrack-web
cp .env.local.example .env.local
npm install
# Edit .env.local with your API URL
npm run dev
```

See [`Pasona FinTrack-web/README.md`](./Pasona FinTrack-web/README.md) for full frontend setup.

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
4. Authentication: email + password via Laravel Sanctum
5. Push notifications require HTTPS on your hosting domain
6. Bank statement import expects CSV: Date, Description, Amount, Dr/Cr columns
7. Offline sync uses IndexedDB — no third-party sync service needed
8. cPanel hosting supports Node.js runner for Next.js
9. PostgreSQL credentials are set manually via `.env`
10. No budget limits or alerts — pure tracking only
11. App is in English only

---

## 🤝 Contributing

This project is personal-use focused. Fork it, adapt it, make it yours.

---

## 📄 License

MIT — free to use and modify.
