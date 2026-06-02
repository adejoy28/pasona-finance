# 📱 FinTrack Web — Next.js PWA Frontend

The mobile-first Progressive Web App for FinTrack. Built with **Next.js 14** and **React 18**. Works offline, installs to your home screen like a native app, and syncs data with the Laravel API when you're back online.

---

## 📁 Folder Structure

```
fintrack-web/
├── app/                            # Next.js 14 App Router pages
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.jsx            # Login screen
│   │   └── register/
│   │       └── page.jsx            # Registration screen
│   ├── (app)/
│   │   ├── layout.jsx              # Shared app shell (nav bar, offline banner)
│   │   ├── dashboard/
│   │   │   └── page.jsx            # Account balances + monthly summary
│   │   ├── add/
│   │   │   └── page.jsx            # Quick add transaction (main daily screen)
│   │   ├── transactions/
│   │   │   └── page.jsx            # Full transaction list with filters
│   │   ├── accounts/
│   │   │   └── page.jsx            # Account list + add new account
│   │   ├── import/
│   │   │   └── page.jsx            # CSV bank statement import
│   │   └── settings/
│   │       └── page.jsx            # Categories, reminder time, profile
│   ├── offline/
│   │   └── page.jsx                # Shown by service worker when truly offline
│   └── layout.jsx                  # Root layout with PWA meta tags
├── components/
│   ├── TransactionForm.jsx         # Reusable form: Amount, Category, Account, Type
│   ├── AccountCard.jsx             # Displays one account with live balance
│   ├── TransactionItem.jsx         # Single transaction row in a list
│   ├── OfflineBanner.jsx           # "You are offline" top banner
│   ├── SyncStatus.jsx              # Shows pending offline transactions count
│   └── BottomNav.jsx               # Mobile bottom navigation bar
├── hooks/
│   ├── useOfflineSync.js           # Detects online/offline, flushes IndexedDB queue
│   ├── useAccounts.js              # Fetches and caches account list
│   └── useTransactions.js          # Fetches paginated transactions
├── lib/
│   ├── api.js                      # Axios instance with base URL + auth token
│   ├── db.js                       # IndexedDB setup for offline transaction queue
│   ├── formatters.js               # Currency formatting (₦), date formatting
│   └── auth.js                     # Login, logout, token storage helpers
├── public/
│   ├── manifest.json               # PWA manifest (name, icons, theme color)
│   ├── sw.js                       # Service worker (offline caching + background sync)
│   ├── offline.html                # Fallback page shown when offline
│   └── icons/                      # App icons in various sizes (192x192, 512x512)
├── styles/
│   └── globals.css                 # Base styles, CSS variables for colors/spacing
├── .env.local.example              # Environment variable template
├── next.config.js                  # Next.js config with PWA headers
└── README.md                       # This file
```

---

## ⚙️ Requirements

- Node.js 18+
- npm 9+ or yarn
- A running instance of the FinTrack API (see `fintrack-api/README.md`)
- HTTPS domain (required for PWA install + push notifications)

---

## 🚀 Installation

### Step 1 — Install dependencies

```bash
cd fintrack-web
npm install
```

### Step 2 — Configure environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set:

```env
# The full URL of your Laravel API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Your app's public URL (used for PWA manifest)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 3 — Run in development mode

```bash
npm run dev
# App runs at http://localhost:3000
```

### Step 4 — Build for production

```bash
npm run build
npm start
```

---

## 📲 PWA — Installing to Your Phone

1. Open the app in **Chrome on Android** (or Safari on iOS)
2. Tap the browser menu → **"Add to Home Screen"**
3. The app installs like a native app — no app store needed
4. It works offline and shows a notification badge when you have unsynced transactions

---

## 🔌 Offline Mode — How It Works

When you lose internet connection:

1. The **offline banner** appears at the top of every page
2. You can still **add transactions** — they save to **IndexedDB** on your device
3. When you come back online, the `useOfflineSync` hook automatically:
   - Detects `navigator.onLine === true`
   - Reads all pending transactions from IndexedDB
   - Sends them in a batch to `POST /api/transactions/bulk`
   - Clears the local queue once the server confirms

No data is lost. Transactions are always saved locally first.

---

## 🧩 Key Components Explained

### `TransactionForm.jsx`

The heart of the app. Used on the Add Transaction page. Shows:

- Amount input (number keyboard on mobile)
- Type selector (Income / Expense / Transfer)
- Category dropdown (filtered by type)
- From Account dropdown
- To Account dropdown (only visible for Transfer type)
- Optional: Description, Date (defaults to today), Reference

### `useOfflineSync.js`

A React hook that:

- Listens for `window.addEventListener('online', ...)` events
- When triggered, reads the IndexedDB `pending_transactions` store
- Posts the batch to the API
- On success, marks each entry as synced and removes it from the queue

### `lib/db.js`

Sets up the IndexedDB database with one object store: `pending_transactions`.
Each entry has: `id`, `data` (full transaction object), `created_at`, `synced`.

### `public/sw.js`

The service worker handles:

- **Cache-first** strategy for static assets (app shell, icons, CSS)
- **Network-first** strategy for API calls
- **Offline fallback** — serves `offline.html` when a page can't load
- **Push notifications** — receives the daily reminder notification

---

## 📅 Daily Reminder Notification

The app sends a push notification at your chosen time (default 9:10 PM) to remind you to log your expenses.

**How to enable:**

1. Go to **Settings → Reminder Time**
2. Set your preferred time
3. Tap **Enable Notifications** — your browser will ask for permission
4. Accept — notifications will fire daily at that time

Note: Push notifications only work over **HTTPS**. They will not work on `http://localhost`.

---

## 📥 Bank Statement Import

1. Download your bank statement as **CSV** from your banking app
2. In the app, go to **Import**
3. Upload or paste your CSV
4. The app parses each row and checks for duplicates (same date + amount already in your transactions)
5. Rows marked ✅ NEW are safe to import — rows marked ⚠️ EXISTS are skipped
6. Tap **Import Selected** to add the new rows to your transaction history

Expected CSV columns (order does not matter, headers required):

```
Date, Description, Amount, Dr/Cr
```

---

## 🎨 Design Decisions

- **No UI component library** — plain Tailwind CSS only, keeps the bundle small and fast on mobile data
- **Bottom navigation bar** on mobile (like a native app)
- **Sidebar navigation** on desktop
- **Large tap targets** — all buttons and inputs are minimum 48px tall for easy finger tapping
- **Number keyboard** — amount field uses `inputMode="decimal"` so mobile keyboards show numbers automatically
- **No modals for simple actions** — forms open as new pages to avoid keyboard/scroll issues on mobile

---

## 🧪 Running Tests

```bash
# Unit tests
npm run test

# End-to-end tests (requires running API)
npm run test:e2e
```

---

## 🗂 Environment Variables Reference

```env
# Required
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Required for PWA manifest
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: override app name shown in PWA install prompt
NEXT_PUBLIC_APP_NAME=FinTrack
```

---

## ⚠️ Common Issues

**PWA not installing (no "Add to Home Screen" prompt)**

- Must be served over **HTTPS**
- `manifest.json` must be linked in `<head>` — check `app/layout.jsx`
- Service worker must be registered — check browser DevTools → Application tab

**Offline transactions not syncing**

- Open browser DevTools → Application → IndexedDB → check `pending_transactions` store
- Make sure the API URL in `.env.local` is correct and reachable
- Check the browser console for sync errors

**API calls blocked (CORS error)**

- Make sure your domain is added to `allowed_origins` in the Laravel `config/cors.php`
- The `Authorization: Bearer` header must be sent — check `lib/api.js`

**Notification permission denied**

- Go to browser Settings → Site permissions → Notifications → allow your domain
- On Android, make sure the app is installed to home screen for best notification support

---

## 📦 Key Dependencies

| Package       | Purpose                                         |
| ------------- | ----------------------------------------------- |
| `next`        | React framework with App Router                 |
| `react`       | UI library                                      |
| `axios`       | HTTP client for API calls                       |
| `idb`         | Lightweight IndexedDB wrapper for offline queue |
| `tailwindcss` | Utility CSS for styling                         |
| `next-pwa`    | Service worker and PWA config for Next.js       |

Install:

```bash
npm install axios idb tailwindcss next-pwa
```

---

## 📄 License

MIT
