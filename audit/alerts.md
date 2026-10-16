# Pasona Finance — Alert & Feedback Inventory (Phase 0 / Phase 3b Audit)

This document provides a comprehensive inventory of all notifications, alerts, modals, dialogs, banners, and confirmations across the application, with their respective call sites and migration mapping to the unified feedback system.

---

## 1. Floating Alerts & Toasts

### 1.1 `usePopup` (Legacy Custom Popup System)
*Location:* `src/components/ui/popup.tsx` (To be migrated to `notify` and deleted)

| Call Site File | Location | Trigger / Context | Severity / Type | Action / Migration Target |
|---|---|---|---|---|
| `pages/TransactionsIndex.tsx` | Delete transaction error | Network / API failure | Error | `notify.error(msg)` |
| `pages/TransactionsIndex.tsx` | Delete transaction success | Transaction removed | Success | `notify.success(msg)` |
| `pages/TransactionsIndex.tsx` | Duplicate conflict (409) | Duplicate hash detected | Warn / Error | `notify.warn(msg)` |
| `pages/TransactionsAdd.tsx` | Amount missing | Form validation error | Error / FieldError | Inline `FieldError` + `notify.error` |
| `pages/TransactionsAdd.tsx` | Account missing | Form validation error | Error / FieldError | Inline `FieldError` + `notify.error` |
| `pages/TransactionsAdd.tsx` | Create transaction success | Transaction logged | Success | `notify.success("Transaction added", { undo })` |
| `pages/TransactionsAdd.tsx` | Duplicate transaction (409) | Duplicate check | Warn | `notify.warn("Possible duplicate")` |
| `pages/TransactionsAdd.tsx` | Server error | Submission failure | Error | `notify.error(msg)` |
| `pages/TransactionDetail.tsx` | Record load error | 404 / 500 on fetch | Error | `notify.error(msg)` |
| `pages/TransactionDetail.tsx` | Record update error | Save changes failure | Error | `notify.error(msg)` |
| `pages/TransactionDetail.tsx` | Record update success | Changes saved | Success | `notify.success("Saved")` |
| `pages/Settings.tsx` | Profile update | Saved profile info | Success | `notify.success("Profile updated")` |
| `pages/Settings.tsx` | Password change | Password updated | Success | `notify.success("Password changed")` |
| `pages/Settings.tsx` | Preference saved | Currency / theme / budget saved | Success | `notify.success("Settings saved")` |
| `pages/Settings.tsx` | Clear cache | Local cache cleared | Info | `notify.info("Cache cleared")` |
| `pages/Settings.tsx` | Undo import error | Failed to revert batch | Error | `notify.error(msg)` |
| `pages/Settings.tsx` | Undo import success | Statement batch removed | Success | `notify.success("Import undone")` |
| `pages/ImportPage.tsx` | Missing account | File uploaded without account | Error | `notify.error("Select an account")` |
| `pages/ImportPage.tsx` | Parsing failure | Malformed CSV / statement | Error | `notify.error(msg)` |
| `pages/ImportPage.tsx` | Import completed | Transactions imported | Success | `notify.success(msg)` |
| `pages/Dashboard.tsx` | Quick-log error | Incomplete quick log | Error | `notify.error(msg)` |
| `pages/Dashboard.tsx` | Refresh / load failure | Failed to fetch overview | Error | `notify.error(msg)` |
| `pages/Categories.tsx` | Delete category error | Has dependencies or API error | Error | `notify.error(msg)` |
| `pages/Categories.tsx` | Delete category success | Category deleted | Success | `notify.success("Category deleted")` |
| `pages/Categories.tsx` | Save category | Category created/updated | Success | `notify.success("Category saved")` |
| `pages/AccountsIndex.tsx` | Delete account error | Linked transactions or API error | Error | `notify.error(msg)` |
| `pages/AccountsIndex.tsx` | Delete account success | Account deleted | Success | `notify.success("Account deleted")` |
| `pages/AccountDetail.tsx` | Balance adjustment success | Balance corrected | Success | `notify.success("Balance updated", { undo })` |
| `pages/AccountDetail.tsx` | Balance adjustment error | API failure | Error | `notify.error(msg)` |
| `components/finance/AccountDialog.tsx` | Create / edit account | Validation / API result | Success / Error | `notify.success` / `notify.error` |
| `components/finance/CategoryDialog.tsx` | Create / edit category | Validation / API result | Success / Error | `notify.success` / `notify.error` |
| `components/finance/TransactionDialog.tsx` | Create / edit transaction | Validation / API result | Success / Error | `notify.success` / `notify.error` |
| `components/finance/NativeNotificationListener.tsx` | Push notification received | Background push arriving in app | Info | `notify.info(msg, { action })` |
| `components/finance/NotificationPanel.tsx` | Notifications cleared | Clear all pressed | Success | `notify.success("Notifications cleared")` |
| `components/finance/VerifyEmailBanner.tsx` | Verification link resent | Resend clicked | Success / Error | `notify.success` / `notify.error` |
| `components/finance/SyncIndicator.tsx` | Sync status | Offline sync events | Info | To be deleted (absorbed by `NetworkStatusBar`) |

### 1.2 `useUndoToast` (Legacy Undo Toast System)
*Location:* `src/hooks/use-undo-toast.tsx` (To be migrated to `notify` and deleted)

| Call Site File | Location | Context | Action / Migration Target |
|---|---|---|---|
| `pages/TransactionDetail.tsx` | Delete transaction | User deletes record | `notify.success("Transaction deleted", { undo })` |
| `pages/AccountDetail.tsx` | Balance adjustment / delete | User adjusts or deletes | `notify.success("Account updated", { undo })` |

---

## 2. In-App Banners & Overlays

| Component | File Path | Trigger / Condition | Placement / Behavior |
|---|---|---|---|
| `NetworkStatusBar` | `src/components/finance/NetworkStatusBar.tsx` | Network offline, reconnecting, syncing | Floating top-centre status bar |
| `SessionExpiredModal` | `src/components/finance/SessionExpiredModal.tsx` | 401 Unauthorized API response | Modal overlay preserving open state & forms |
| `VerifyEmailBanner` | `src/components/finance/VerifyEmailBanner.tsx` | User email unverified (`email_verified_at === null`) | Sticky top banner on authenticated shell |
| `AppInstallBanner` | `src/components/finance/AppInstallBanner.tsx` | PWA `beforeinstallprompt` event | Bottom banner with install prompt |
| `BiometricPromptBanner`| `src/components/finance/BiometricPromptBanner.tsx` | Device supports WebAuthn/biometrics | In-app banner prompting setup |
| `NewLookBanner` | `src/components/finance/NewLookBanner.tsx` | Welcome / new redesign release | Dismissible notice banner |
| `SubtlePopups` | `src/components/finance/SubtlePopups.tsx` | Habit nudges, streaks, milestone popups | Bottom floating bubble |

---

## 3. Native Browser Dialogs (To be eliminated)

| Type | File Path | Current Code | Replacement |
|---|---|---|---|
| `confirm()` | `src/pages/Settings.tsx:134` | `confirm("Undo import of \"${entry.file}\" (${entry.added} transactions)?")` | `ConfirmDestructiveDialog` |
| `confirm()` | `src/pages/Categories.tsx:117` | `confirm("Are you sure you want to delete \"${categoryToDelete.name}\"?")` | `ConfirmDestructiveDialog` |
| `confirm()` | `src/pages/AccountsIndex.tsx:155` | `confirm("Are you sure you want to delete this account?...")` | `ConfirmDestructiveDialog` (type "DELETE") |
| `confirm()` | `src/components/finance/NotificationPanel.tsx:291` | `window.confirm("Remove all notifications?")` | `ConfirmDestructiveDialog` |
| `alert()` | `src/pages/DownloadPage.tsx:147` | `alert("Download link is currently a placeholder.")` | `notify.info("Download link is currently a placeholder.")` |

---

## 4. Modal Confirmations (`AlertDialog` & `ConfirmDestructiveDialog`)

| File Path | Dialog Purpose | Destructive? | Current Component | Target Component |
|---|---|---|---|---|
| `pages/TransactionsIndex.tsx` | Delete transaction | Yes | `AlertDialog` | `ConfirmDestructiveDialog` |
| `pages/TransactionDetail.tsx` | Delete record | Yes | `AlertDialog` | `ConfirmDestructiveDialog` |
| `pages/Settings.tsx` | Sign out | Yes | `AlertDialog` | `ConfirmDestructiveDialog` (with pending offline sync warning) |
| `pages/Settings.tsx` | Delete account | High (irreversible) | Custom inline / prompt | `ConfirmDestructiveDialog` (requires typing DELETE) |
| `pages/Settings.tsx` | Reset local data / clear cache | Moderate | `AlertDialog` | `ConfirmDestructiveDialog` |
| `pages/AccountsIndex.tsx` | Delete account | High | `confirm()` | `ConfirmDestructiveDialog` (requires typing DELETE) |
| `pages/Categories.tsx` | Delete category | Moderate | `confirm()` | `ConfirmDestructiveDialog` |
| `pages/Settings.tsx` | Undo import batch | Moderate | `confirm()` | `ConfirmDestructiveDialog` |

---

## 5. Form Field Error Feedback

| Form / Modal | Current Error Presentation | Target Presentation |
|---|---|---|
| `TransactionDialog.tsx` | Toast popup on submit | `ModalErrorBanner` (top) + `FieldError` (under input) |
| `TransactionsAdd.tsx` | Toast popup on submit | `ModalErrorBanner` (top) + `FieldError` (under input) |
| `CategoryDialog.tsx` | Toast popup on submit | `ModalErrorBanner` (top) + `FieldError` (under input) |
| `AccountDialog.tsx` | Toast popup on submit | `ModalErrorBanner` (top) + `FieldError` (under input) |
| Auth forms (`Login`, `Register`) | Generic banner or toast | Field-level 422 mapping (`FieldError`) + Auth banner |
