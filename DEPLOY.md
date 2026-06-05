# Deployment Guide - Pasona Finance Tracker

This document provides instructions for deploying the Pasona Finance Tracker to **cPanel** and using **Google CLI** if necessary.

## Backend (Laravel API)

### 1. Preparation

- Zip the `backend` folder (excluding `node_modules`, `vendor`, and `storage/framework/cache`).
- Upload to cPanel File Manager.
- Recommended subdomain: `pasona-api.adebayosystems.com.ng`.

### 2. cPanel Configuration

- **Database:** Create a PostgreSQL database via "PostgreSQL Databases" in cPanel.
- **PHP Version:** Ensure PHP 8.2 or 8.3 is active.
- **Environment:** Copy `.env.example` to `.env` and update:
  - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
  - `APP_URL` (your subdomain URL)
- **Commands:** Run via SSH (if available) or via cPanel Terminal:
  ```bash
  composer install --optimize-autoloader --no-dev
  php artisan key:generate
  php artisan migrate --force
  php artisan db:seed --class=CategorySeeder
  ```
- **Storage:** Symlink the storage directory:
  ```bash
  php artisan storage:link
  ```

## Frontend (Next.js PWA)

### 1. Static Export (Recommended for cPanel)

Next.js can be exported as a static site if you don't use dynamic server-side features.

- Update `next.config.ts`:
  ```typescript
  const nextConfig = {
    output: "export",
  };
  ```
- Run Build:
  ```bash
  npm run build
  ```
- Upload the contents of the `out` directory to your primary domain's `public_html`.

### 2. Node.js App (Alternative)

If you prefer a Node server:

- Use cPanel "Setup Node.js App".
- Select Application root and URL.
- Upload the `frontend` directory.
- Run `npm install` and `npm run build`.

## PWA & SSL

- **SSL is Mandatory:** PWA features (Service Workers) and Push Notifications only work over HTTPS. Ensure AutoSSL is active in cPanel.
- **Manifest:** Verify `/manifest.json` is accessible via browser.

## Google Cloud CLI (Optional Deployment)

If deploying via Google Cloud SDK:

```bash
gcloud app deploy
```

(Requires an `app.yaml` file in the root of each folder).

---

_Created by Adebayosystems - Personal Finance Tracker PWA_
