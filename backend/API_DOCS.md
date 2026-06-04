# Pasona Finance API

> A RESTful JSON API for personal finance tracking — manage accounts, log transactions, import bank statements, and view monthly summaries.

**Base URL**

```
http://localhost:8000/api
```

**Production**

```
https://api.yourdomain.com/api
```

---

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
  - [Register](#register)
  - [Login](#login)
  - [Logout](#logout)
  - [Get Current User](#get-current-user)
  - [Forgot Password](#forgot-password)
  - [Reset Password](#reset-password)
  - [Google OAuth](#google-oauth)
- [Accounts](#accounts)
- [Categories](#categories)
- [Transactions](#transactions)
- [Import](#import)
- [Summary](#summary)
- [Errors](#errors)
- [Data Models](#data-models)

---

## Getting Started

The Pasona Finance API is built on **Laravel 11** and uses **Laravel Sanctum** for token-based authentication. All requests and responses are JSON.

### Required Headers

Every request must include:

```http
Accept: application/json
Content-Type: application/json
```

Authenticated routes additionally require:

```http
Authorization: Bearer {your_access_token}
```

### Quick Start

```bash
# 1. Register a new user
curl -X POST http://localhost:8000/api/register \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "[email protected]",
    "password": "secret123",
    "password_confirmation": "secret123"
  }'

# 2. Use the returned access_token for subsequent requests
curl http://localhost:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

---

## Authentication

The API uses **Bearer token** authentication via Laravel Sanctum. Tokens are returned on registration or login and must be passed in the `Authorization` header for protected endpoints.

---

### Register

Create a new user account and receive an access token.

```
POST /api/register
```

**Authentication:** Not required

#### Request Body

| Field                   | Type   | Required | Description                                      |
| ----------------------- | ------ | -------- | ------------------------------------------------ |
| `name`                  | string | Yes      | Full name (max 255 chars)                        |
| `email`                 | string | Yes      | Valid, unique email address                      |
| `password`              | string | Yes      | Minimum 8 characters                             |
| `password_confirmation` | string | Yes      | Must match `password`                            |

#### Example Request

```bash
curl -X POST http://localhost:8000/api/register \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "[email protected]",
    "password": "secret123",
    "password_confirmation": "secret123"
  }'
```

```javascript
const response = await fetch('http://localhost:8000/api/register', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Jane Doe',
    email: '[email protected]',
    password: 'secret123',
    password_confirmation: 'secret123',
  }),
});
const data = await response.json();
```

#### Response — `200 OK`

```json
{
  "access_token": "1|aB3cD4eF5gH6iJ7kL8mN9oP0qR...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "[email protected]",
    "created_at": "2026-06-03T12:00:00.000000Z",
    "updated_at": "2026-06-03T12:00:00.000000Z"
  }
}
```

---

### Login

Authenticate an existing user and receive an access token.

```
POST /api/login
```

**Authentication:** Not required

#### Request Body

| Field      | Type   | Required | Description       |
| ---------- | ------ | -------- | ----------------- |
| `email`    | string | Yes      | Registered email  |
| `password` | string | Yes      | User's password   |

#### Example Request

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "[email protected]",
    "password": "secret123"
  }'
```

#### Response — `200 OK`

```json
{
  "access_token": "2|xY1zA2bC3dE4fG5hI6jK7lM8nO9p...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "[email protected]"
  }
}
```

#### Response — `422 Unprocessable Entity`

```json
{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}
```

---

### Logout

Revoke the current access token.

```
POST /api/logout
```

**Authentication:** Required

#### Example Request

```bash
curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Response — `200 OK`

```json
{
  "message": "Successfully logged out"
}
```

---

### Get Current User

Retrieve the authenticated user's profile.

```
GET /api/me
```

**Authentication:** Required

#### Example Request

```bash
curl http://localhost:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Response — `200 OK`

```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "[email protected]",
  "google_id": null,
  "avatar": null,
  "reminder_time": null,
  "email_verified_at": null,
  "created_at": "2026-06-03T12:00:00.000000Z",
  "updated_at": "2026-06-03T12:00:00.000000Z"
}
```

---

### Forgot Password

Send a password reset link to the user's email.

```
POST /api/forgot-password
```

**Authentication:** Not required

#### Request Body

| Field   | Type   | Required | Description                |
| ------- | ------ | -------- | -------------------------- |
| `email` | string | Yes      | Registered email address   |

#### Example Request

```bash
curl -X POST http://localhost:8000/api/forgot-password \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{ "email": "[email protected]" }'
```

#### Response — `200 OK`

```json
{
  "message": "We have emailed your password reset link."
}
```

---

### Reset Password

Set a new password using the reset token from the email.

```
POST /api/reset-password
```

**Authentication:** Not required

#### Request Body

| Field                   | Type   | Required | Description                            |
| ----------------------- | ------ | -------- | -------------------------------------- |
| `token`                 | string | Yes      | Reset token from email                 |
| `email`                 | string | Yes      | User's email                           |
| `password`              | string | Yes      | New password (min 8 chars)             |
| `password_confirmation` | string | Yes      | Must match `password`                  |

#### Example Request

```bash
curl -X POST http://localhost:8000/api/reset-password \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123resettoken",
    "email": "[email protected]",
    "password": "newsecret123",
    "password_confirmation": "newsecret123"
  }'
```

#### Response — `200 OK`

```json
{
  "message": "Your password has been reset."
}
```

---

### Google OAuth

#### Get Redirect URL

```
GET /api/auth/google
```

**Authentication:** Not required

Returns the Google OAuth URL for the user to authenticate against.

#### Response — `200 OK`

```json
{
  "url": "https://accounts.google.com/o/oauth2/auth?..."
}
```

#### Callback

```
GET /api/auth/google/callback
```

Handled automatically by Google. On success, the user is redirected to the frontend URL with `token` and `user` query parameters. On failure, an `error` query parameter is included.

**Frontend redirect example:**

```
http://localhost:3000/login?token=3|abc...&user=1
```

---

## Accounts

Manage the user's financial accounts (Bank, Mobile Money, Cash).

> All Account endpoints require authentication.

---

### List Accounts

Retrieve all accounts for the authenticated user, with calculated live balances.

```
GET /api/accounts
```

#### Example Request

```bash
curl http://localhost:8000/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Response — `200 OK`

```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Kuda Bank",
    "type": "bank",
    "starting_balance": "50000.00",
    "notes": "Main salary account",
    "created_at": "2026-06-01T10:00:00.000000Z",
    "updated_at": "2026-06-01T10:00:00.000000Z",
    "balance": 73250.00
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "Opay Wallet",
    "type": "mobile",
    "starting_balance": "5000.00",
    "notes": null,
    "balance": 12480.50
  }
]
```

> The `balance` field is calculated as:
> `starting_balance + income − expense − transfers_out + transfers_in`

---

### Create Account

```
POST /api/accounts
```

#### Request Body

| Field              | Type   | Required | Description                          |
| ------------------ | ------ | -------- | ------------------------------------ |
| `name`             | string | Yes      | Account name (max 255 chars)         |
| `type`             | enum   | Yes      | `bank`, `mobile`, or `cash`          |
| `starting_balance` | number | Yes      | Initial balance                      |
| `notes`            | string | No       | Optional description                 |

#### Example Request

```bash
curl -X POST http://localhost:8000/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GTBank Savings",
    "type": "bank",
    "starting_balance": 100000,
    "notes": "Emergency fund"
  }'
```

#### Response — `201 Created`

```json
{
  "id": 3,
  "user_id": 1,
  "name": "GTBank Savings",
  "type": "bank",
  "starting_balance": "100000.00",
  "notes": "Emergency fund",
  "created_at": "2026-06-03T12:30:00.000000Z",
  "updated_at": "2026-06-03T12:30:00.000000Z"
}
```

---

### Get Account

```
GET /api/accounts/{id}
```

#### Example Request

```bash
curl http://localhost:8000/api/accounts/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Response — `200 OK`

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Kuda Bank",
  "type": "bank",
  "starting_balance": "50000.00",
  "notes": "Main salary account",
  "balance": 73250.00
}
```

---

### Update Account

```
PUT /api/accounts/{id}
PATCH /api/accounts/{id}
```

All fields are optional, but at least one must be present.

#### Request Body

| Field              | Type   | Description                          |
| ------------------ | ------ | ------------------------------------ |
| `name`             | string | Account name                         |
| `type`             | enum   | `bank`, `mobile`, or `cash`          |
| `starting_balance` | number | Initial balance                      |
| `notes`            | string | Optional description                 |

#### Example Request

```bash
curl -X PUT http://localhost:8000/api/accounts/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Kuda — Main", "notes": "Primary account" }'
```

#### Response — `200 OK`

Returns the updated account object.

---

### Delete Account

```
DELETE /api/accounts/{id}
```

#### Example Request

```bash
curl -X DELETE http://localhost:8000/api/accounts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response — `204 No Content`

---

## Categories

Manage transaction categories. The system includes default categories that cannot be modified or deleted; users can also create their own custom categories.

> All Category endpoints require authentication.

---

### List Categories

Returns both default system categories and the user's custom categories.

```
GET /api/categories
```

#### Response — `200 OK`

```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Food & Groceries",
    "type": "expense"
  },
  {
    "id": 2,
    "user_id": 1,
    "name": "Salary",
    "type": "income"
  },
  {
    "id": 15,
    "user_id": 1,
    "name": "Hobbies",
    "type": "expense"
  }
]
```

---

### Create Category

```
POST /api/categories
```

#### Request Body

| Field  | Type   | Required | Description                  |
| ------ | ------ | -------- | ---------------------------- |
| `name` | string | Yes      | Category name (max 255)      |
| `type` | enum   | Yes      | `income` or `expense`        |

#### Example Request

```bash
curl -X POST http://localhost:8000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Subscriptions", "type": "expense" }'
```

#### Response — `201 Created`

```json
{
  "id": 16,
  "user_id": 1,
  "name": "Subscriptions",
  "type": "expense"
}
```

---

### Get Category

```
GET /api/categories/{id}
```

Returns a single category.

---

### Update Category

```
PUT /api/categories/{id}
```

> Default seeded categories are owned by the user and can be updated like any other category. Duplicate `(name, type)` pairs are blocked by a unique key and will return `422 Unprocessable Entity`.

#### Request Body

| Field  | Type   | Description                  |
| ------ | ------ | ---------------------------- |
| `name` | string | New category name            |
| `type` | enum   | `income` or `expense`        |

#### Response — `422 Unprocessable Entity` (duplicate)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name has already been taken."]
  }
}
```

---

### Delete Category

```
DELETE /api/categories/{id}
```

> All of the authenticated user's categories (including the seeded defaults) can be deleted.

#### Response — `204 No Content`

---

## Transactions

Log income, expenses, and transfers between accounts. Includes automatic duplicate detection.

> All Transaction endpoints require authentication.

---

### List Transactions

Returns a paginated list of transactions (50 per page), sorted by `transaction_date` descending. Includes related `account`, `toAccount`, and `category` data.

```
GET /api/transactions
```

#### Query Parameters

| Parameter | Type    | Description                |
| --------- | ------- | -------------------------- |
| `page`    | integer | Page number (default `1`)  |

#### Example Request

```bash
curl "http://localhost:8000/api/transactions?page=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Response — `200 OK`

```json
{
  "current_page": 1,
  "data": [
    {
      "id": 101,
      "user_id": 1,
      "account_id": 1,
      "to_account_id": null,
      "type": "expense",
      "category_id": 1,
      "amount": "2500.00",
      "description": "Groceries at Shoprite",
      "reference": null,
      "transaction_date": "2026-06-03",
      "is_synced": false,
      "created_at": "2026-06-03T14:00:00.000000Z",
      "account": { "id": 1, "name": "Kuda Bank", "type": "bank" },
      "to_account": null,
      "category": { "id": 1, "name": "Food & Groceries", "type": "expense" }
    }
  ],
  "first_page_url": "http://localhost:8000/api/transactions?page=1",
  "from": 1,
  "last_page": 4,
  "per_page": 50,
  "to": 50,
  "total": 187
}
```

---

### Create Transaction

```
POST /api/transactions
```

#### Request Body

| Field              | Type    | Required | Description                                                 |
| ------------------ | ------- | -------- | ----------------------------------------------------------- |
| `account_id`       | integer | Yes      | Source account ID                                           |
| `to_account_id`    | integer | No       | Destination account ID (required for `type: transfer`)      |
| `type`             | enum    | Yes      | `income`, `expense`, or `transfer`                          |
| `category_id`      | integer | No       | Category ID (not needed for transfers)                      |
| `amount`           | number  | Yes      | Positive amount                                             |
| `description`      | string  | No       | Short note (max 255)                                        |
| `reference`        | string  | No       | Bank reference / receipt number                             |
| `transaction_date` | date    | Yes      | Format `YYYY-MM-DD`                                         |
| `force`            | boolean | No       | Set `true` to bypass duplicate detection                    |

> **Note:** Creating a transaction requires at least one existing account, otherwise `403 Forbidden` is returned.

#### Example Request

```bash
curl -X POST http://localhost:8000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": 1,
    "type": "expense",
    "category_id": 1,
    "amount": 2500,
    "description": "Groceries at Shoprite",
    "transaction_date": "2026-06-03"
  }'
```

#### Response — `201 Created`

```json
{
  "id": 101,
  "user_id": 1,
  "account_id": 1,
  "type": "expense",
  "category_id": 1,
  "amount": "2500.00",
  "description": "Groceries at Shoprite",
  "transaction_date": "2026-06-03",
  "is_synced": false
}
```

#### Response — `409 Conflict` (Duplicate detected)

When a transaction with the same date, type, amount, and account already exists:

```json
{
  "message": "Potential duplicate detected.",
  "is_duplicate": true
}
```

To bypass, resend with `"force": true`.

#### Response — `403 Forbidden` (No accounts)

```json
{
  "message": "You must create at least one account before adding transactions."
}
```

---

### Get Transaction

```
GET /api/transactions/{id}
```

Returns a single transaction with `account`, `toAccount`, and `category` relations loaded.

---

### Update Transaction

```
PUT /api/transactions/{id}
```

#### Request Body

All fields are optional. Same schema as [Create Transaction](#create-transaction), but the `force` flag is not used.

#### Response — `200 OK`

Returns the updated transaction.

---

### Delete Transaction

```
DELETE /api/transactions/{id}
```

#### Response — `204 No Content`

---

### Sync Transactions (Offline Batch)

Bulk-create transactions queued while the client was offline. The request is dispatched to a background queue job for processing.

```
POST /api/transactions/sync
```

#### Request Body

| Field          | Type  | Required | Description                       |
| -------------- | ----- | -------- | --------------------------------- |
| `transactions` | array | Yes      | Array of transaction objects      |

Each item in `transactions` must include `account_id`, `type`, `amount`, and `transaction_date`.

#### Example Request

```bash
curl -X POST http://localhost:8000/api/transactions/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "account_id": 1,
        "type": "expense",
        "amount": 1200,
        "transaction_date": "2026-06-01",
        "description": "Bus fare"
      },
      {
        "account_id": 1,
        "type": "expense",
        "amount": 500,
        "transaction_date": "2026-06-02",
        "description": "Coffee"
      }
    ]
  }'
```

#### Response — `200 OK`

```json
{
  "message": "Sync process started in the background."
}
```

> Synced transactions are marked with `is_synced: true` once processed.

---

## Import

Import transactions from a CSV bank statement.

> All Import endpoints require authentication.

The expected CSV format has the following columns (with header row):

```
Date, Description, Amount, Dr/Cr
2026-05-01, Salary, 250000, Cr
2026-05-02, ATM Withdrawal, 5000, Dr
```

- `Cr` (credit) is mapped to `income`
- `Dr` (debit) is mapped to `expense`

---

### Preview Import

Parse the CSV and return each row with a `is_duplicate` flag. No transactions are saved at this stage.

```
POST /api/import/preview
```

#### Request Body

| Field         | Type    | Required | Description                       |
| ------------- | ------- | -------- | --------------------------------- |
| `csv_content` | string  | Yes      | Full CSV content as a string      |
| `account_id`  | integer | Yes      | Target account ID                 |

#### Example Request

```bash
curl -X POST http://localhost:8000/api/import/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": 1,
    "csv_content": "Date,Description,Amount,Dr/Cr\n2026-05-01,Salary,250000,Cr\n2026-05-02,ATM,5000,Dr"
  }'
```

#### Response — `200 OK`

```json
[
  {
    "transaction_date": "2026-05-01",
    "description": "Salary",
    "amount": 250000,
    "type": "income",
    "is_duplicate": false,
    "account_id": 1
  },
  {
    "transaction_date": "2026-05-02",
    "description": "ATM",
    "amount": 5000,
    "type": "expense",
    "is_duplicate": true,
    "account_id": 1
  }
]
```

---

### Store Import

Persist the reviewed transactions to the database.

```
POST /api/import/store
```

#### Request Body

| Field          | Type  | Required | Description                                   |
| -------------- | ----- | -------- | --------------------------------------------- |
| `transactions` | array | Yes      | Array of transaction objects to import        |

Each item must include `account_id`, `transaction_date`, `amount`, and `type` (`income` or `expense`).

#### Example Request

```bash
curl -X POST http://localhost:8000/api/import/store \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "account_id": 1,
        "transaction_date": "2026-05-01",
        "amount": 250000,
        "type": "income",
        "description": "Salary"
      }
    ]
  }'
```

#### Response — `200 OK`

```json
{
  "message": "Successfully imported 1 transactions."
}
```

---

## Summary

Get aggregated dashboard data for the current month.

> Requires authentication.

---

### Dashboard Summary

```
GET /api/summary
```

Returns total balances across all accounts, monthly income vs expense, and an expense breakdown by category — all scoped to the current calendar month.

#### Example Request

```bash
curl http://localhost:8000/api/summary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Response — `200 OK`

```json
{
  "total_balance": 85730.50,
  "accounts": [
    {
      "id": 1,
      "name": "Kuda Bank",
      "type": "bank",
      "starting_balance": "50000.00",
      "balance": 73250.00
    },
    {
      "id": 2,
      "name": "Opay Wallet",
      "type": "mobile",
      "starting_balance": "5000.00",
      "balance": 12480.50
    }
  ],
  "monthly_summary": {
    "income": 250000.00,
    "expense": 87520.00,
    "net": 162480.00
  },
  "category_breakdown": [
    { "category_name": "Food & Groceries", "total": 35000 },
    { "category_name": "Transport", "total": 12000 },
    { "category_name": "Uncategorized", "total": 40520 }
  ]
}
```

---

## Errors

The API uses standard HTTP status codes and returns errors as JSON.

| Status | Meaning                                                   |
| ------ | --------------------------------------------------------- |
| `200`  | OK — request succeeded                                    |
| `201`  | Created — resource successfully created                   |
| `204`  | No Content — successful, no body returned                 |
| `401`  | Unauthenticated — missing or invalid token                |
| `403`  | Forbidden — authenticated but not allowed                 |
| `404`  | Not Found — resource doesn't exist                        |
| `409`  | Conflict — e.g. duplicate transaction                     |
| `422`  | Unprocessable — validation failed                         |
| `500`  | Server Error                                              |

### Validation Error Format — `422`

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Authentication Error — `401`

```json
{ "message": "Unauthenticated." }
```

### Authorization Error — `403`

Returned when attempting to view, update, or delete a resource owned by another user.

```json
{ "message": "This action is unauthorized." }
```

---

## Data Models

### User

| Field               | Type     | Notes                            |
| ------------------- | -------- | -------------------------------- |
| `id`                | bigint   | Primary key                      |
| `name`              | string   |                                  |
| `email`             | string   | Unique                           |
| `password`          | string   | Hashed, never returned           |
| `google_id`         | string?  | Set when registered via Google   |
| `avatar`            | string?  | Google profile picture URL       |
| `reminder_time`     | time?    | Daily notification time          |
| `email_verified_at` | datetime |                                  |
| `created_at`        | datetime |                                  |
| `updated_at`        | datetime |                                  |

### Account

| Field              | Type           | Notes                              |
| ------------------ | -------------- | ---------------------------------- |
| `id`               | bigint         | Primary key                        |
| `user_id`          | bigint         | Owner                              |
| `name`             | string         |                                    |
| `type`             | enum           | `bank` / `mobile` / `cash`         |
| `starting_balance` | decimal(15,2)  |                                    |
| `notes`            | string?        |                                    |
| `balance`          | decimal        | **Computed** — not stored          |

### Category

| Field      | Type    | Notes                                  |
| ---------- | ------- | -------------------------------------- |
| `id`       | bigint  | Primary key                            |
| `user_id`  | bigint  | Owner of the category                  |
| `name`     | string  |                                        |
| `type`     | enum    | `income` / `expense`                   |

### Transaction

| Field              | Type           | Notes                                          |
| ------------------ | -------------- | ---------------------------------------------- |
| `id`               | bigint         | Primary key                                    |
| `user_id`          | bigint         | Owner                                          |
| `account_id`       | bigint         | Source account                                 |
| `to_account_id`    | bigint?        | Destination account (transfers only)           |
| `type`             | enum           | `income` / `expense` / `transfer`              |
| `category_id`      | bigint?        | Not required for transfers                     |
| `amount`           | decimal(15,2)  | Always positive                                |
| `description`      | string?        |                                                |
| `reference`        | string?        | Bank ref / receipt number                      |
| `transaction_date` | date           | `YYYY-MM-DD`                                   |
| `is_synced`        | boolean        | `true` when processed via offline sync         |

---

## Versioning

This is **v1** of the API. There is currently no explicit version prefix in the URL — all routes are served under `/api`.

## Support

For issues or questions, open a ticket at the project repository.
