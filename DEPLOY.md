# Deployment Guide - Pasona Finance Tracker

This document provides instructions for deploying the Pasona Finance Tracker to **cPanel** and using **Google CLI** if necessary.

## Backend (Laravel API)

### 1. Preparation

- Zip the `app/backend` folder (excluding `node_modules`, `vendor`, and `storage/framework/cache`).
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

## Frontend (React + Vite PWA)

### 1. Vercel Deployment (Recommended for Web)

- If linking GitHub to Vercel:
  - Set **Root Directory** in Vercel Project Settings to `app/frontend` (or leave as root `/` with the provided root `vercel.json`).
  - Output directory: `dist`
  - Build command: `pnpm build`
  - Add environment variables (`VITE_API_BASE_URL`, `VITE_BACKEND_ORIGIN`).

### 2. Static Hosting / cPanel

- Navigate to `app/frontend`:
  ```bash
  cd app/frontend
  pnpm install
  pnpm build
  ```
- Upload the contents of the `app/frontend/dist` directory to your primary domain's `public_html`.
- Ensure your `.htaccess` or server redirects all non-file requests to `index.html` for SPA routing.

## Android APK Deployment (GitHub Actions to Cloudflare R2)

- Tag and publish a new Release on GitHub.
- The `.github/workflows/deploy-android.yml` workflow automatically builds, signs, and deploys the APK to Cloudflare R2.

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
