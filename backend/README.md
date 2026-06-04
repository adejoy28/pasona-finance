# 🔧 FinTrack API — Laravel Backend

The REST API powering FinTrack. Built with **Laravel 11** and **PostgreSQL**. Handles authentication, account management, transaction logging, CSV import, and financial summaries.

---

## 📁 Folder Structure

```
fintrack-api/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AuthController.php          # Login, register, logout
│   │       ├── AccountController.php       # CRUD for bank/mobile/cash accounts
│   │       ├── TransactionController.php   # CRUD for all transactions
│   │       ├── CategoryController.php      # CRUD for expense/income categories
│   │       ├── ImportController.php        # CSV bank statement import + duplicate check
│   │       └── SummaryController.php       # Monthly summary + category breakdown
│   ├── Models/
│   │   ├── User.php
│   │   ├── Account.php
│   │   ├── Transaction.php
│   │   └── Category.php
│   └── Services/
│       ├── BalanceService.php              # Calculates live account balances
│       ├── ImportService.php               # Parses CSV and checks duplicates
│       └── SummaryService.php             # Aggregates monthly and category totals
├── database/
│   ├── migrations/                         # All table definitions
│   └── seeders/
│       └── DatabaseSeeder.php
├── routes/
│   └── api.php                             # All API route definitions
├── .env.example                            # Environment variable template
└── README.md                               # This file
```

---

## ⚙️ Requirements

- PHP 8.2 or higher
- Composer 2+
- PostgreSQL 15+
- Laravel 11

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

| Column        | Type      | Description                             |
| ------------- | --------- | --------------------------------------- |
| id            | bigint    | Primary key                             |
| name          | string    | User's full name                        |
| email         | string    | Login email (unique)                    |
| password      | string    | Hashed password                         |
| reminder_time | time      | Daily notification time (default 21:10) |
| created_at    | timestamp | Record creation time                    |
| updated_at    | timestamp | Last update time                        |

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

| Method | Route           | Description              |
| ------ | --------------- | ------------------------ |
| POST   | `/api/register` | Create a new account     |
| POST   | `/api/login`    | Login and get token      |
| POST   | `/api/logout`   | Invalidate current token |
| GET    | `/api/user`     | Get current user profile |

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

| Method | Route                 | Description                                      |
| ------ | --------------------- | ------------------------------------------------ |
| POST   | `/api/import/preview` | Parse CSV and return rows with duplicate flags   |
| POST   | `/api/import/confirm` | Save only the non-duplicate rows to transactions |

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
APP_NAME=FinTrack
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fintrack_db
DB_USERNAME=fintrack_user
DB_PASSWORD=secret

# Auth
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DRIVER=cookie
SESSION_DOMAIN=.yourdomain.com

# Queue (for import jobs)
QUEUE_CONNECTION=database
```

---

## ⚠️ Common Issues

**Migration fails on PostgreSQL**
Make sure `pgsql` extension is enabled in your `php.ini`:

```
extension=pdo_pgsql
extension=pgsql
```

**CORS errors from frontend**
Update `config/cors.php` to include your frontend domain:

```php
'allowed_origins' => ['https://yourdomain.com'],
```

**Token not working**
Make sure your request includes the header:

```
Accept: application/json
Authorization: Bearer your-token-here
```

---

## 📄 License

MIT
