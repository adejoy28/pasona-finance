# Pasona Finance Redesign — Central Implementation Tracker

> **Source of Truth:** [`frontend/pasona-gemini-brief.md`](file:///c:/Users/johna/Projects/pasona-finance/frontend/pasona-gemini-brief.md)  
> **Visual Reference:** [Pasona Redesign Prototype v7](file:///c:/Users/johna/Projects/pasona-finance/Pasona%20Redesign.html)  
> **Git Strategy:** Branch per phase, atomic commits, zero breaking changes to money logic or API contracts.

---

## Phase Status Summary

| Phase | Title | Branch | Status | Commit / Notes |
|---|---|---|---|---|
| **Phase 0** | Discovery & Gap Analysis | `main` | ✅ **Completed** | Commit `2cd4448` (`/audit/map.md`, `/audit/tokens.md`, `/audit/gaps.md`) |
| **Phase 1** | Design Tokens & Theme Switching | `phase-1-tokens` | ✅ **Completed** | Commit `35aff71`, `62b56b2` (`/audit/contrast.md`, anti-flash, 4-theme engine) |
| **Phase 2** | App Shell & Responsiveness | `phase-2-shell` | ✅ **Completed** | Commit `5d0790c`, `f5b8e7e`, `19dd440` (ScreenHeader, 200px nav, 5-tab bar, contrast overhaul) |
| **Phase 3** | Feedback & Error System | `phase-3-feedback` | 🟡 **Up Next** | Toast queue with Undo, destructive dialogs, field errors, network bar, offline queue |
| **Phase 4** | Dashboard (Review Fixes) | `phase-4-dashboard` | ⚪ Queued | Cashflow-only hero, separate monthly budget, spending stack bar |
| **Phase 5** | Transactions | `phase-5-transactions` | ⚪ Queued | Day-group net totals, search/filters, duplicate review, paste alert |
| **Phase 6** | Categories & Savings Fix | `phase-6-categories` | ⚪ Queued | `kind` (spending/saving), exclude savings from spent, category modal |
| **Phase 7** | Budgets, Goals, Bills | `phase-7-budgets` | ⚪ Queued | Monthly category budgets, goal rings, recurring bills |
| **Phase 8** | Accounts, Balance Check, Bulk Import | `phase-8-accounts` | ⚪ Queued | Account detail KPIs, balance check & reconcile, CSV/PDF import fixes |
| **Phase 9** | Settings, Notifications, Onboarding | `phase-9-settings` | ⚪ Queued | Preferences, reminder schedule, welcome tour, empty states |
| **Phase 10** | QA, Accessibility & Handoff | `phase-10-qa` | ⚪ Queued | Responsive audits (390/768/1280), keyboard traps, contrast sign-off |

---

## Detailed Plan: Phase 3 — Feedback and Error System
> **Goal:** Build reusable feedback primitives once, ensuring consistent, accessible behavior and zero silent failures across the entire application.

### Task 3.1 — Toast Notification Engine (`useToast` + Undo Action)
- **Files to create/modify:** `frontend/src/hooks/use-toast.ts`, `frontend/src/components/ui/toast.tsx`, `frontend/src/components/ui/toaster.tsx`
- **Specification:**
  - Types: `success`, `info`, `warn`, `error`.
  - Max visible toasts stacked: 3.
  - Auto-dismiss: 5 seconds for `success`, `info`, and `warn`. `error` toasts persist until manually dismissed by user.
  - Optional `undo`: Callback function that reverses local state and triggers corresponding API mutation (e.g., delete created row, restore deleted row).
  - ARIA: Announced politely via `aria-live="polite"` (`aria-live="assertive"` for errors).

### Task 3.2 — Field-Level Validation & Error Highlighting
- **Files to create/modify:** `frontend/src/components/ui/field-error.tsx`, `frontend/src/lib/api.ts` (error mapper)
- **Specification:**
  - Automatically parse Laravel 422 `errors: { [field]: string[] }` responses.
  - Apply red border, `aria-invalid="true"`, and accessible error message beneath the input label.
  - Automatically move keyboard focus to the first invalid field upon form submission failure.
  - Clear field error as soon as user types or edits that input.

### Task 3.3 — Destructive Action Confirmation Dialog
- **Files to create/modify:** `frontend/src/components/ui/confirm-destructive-dialog.tsx`
- **Specification:**
  - Used for irreversible actions: deleting an account, deleting a category, undoing an import batch, or signing out with pending offline changes.
  - For high-consequence deletion (e.g., Delete Account): require explicitly typing `"DELETE"` into an input to enable the confirm button.
  - Visuals: Red destructive CTA, clear warning text of what will be lost, Cancel button with automatic focus on mount.

### Task 3.4 — Busy Buttons & Form Modal Error Banners
- **Files to create/modify:** `frontend/src/components/ui/button.tsx`, `frontend/src/components/ui/modal-error-banner.tsx`
- **Specification:**
  - Busy state: Show inline spinner, disable pointer events, lock fixed width/height so button does not jump or shift layout while saving.
  - Modal error banner: When a modal save fails, display a dismissible banner inside the modal: *"We could not save this. Nothing was lost."* with a `"Try again"` button. Form input state is preserved intact.

### Task 3.5 — Network Bar & Offline Sync Queue
- **Files to create/modify:** `frontend/src/components/finance/NetworkStatusBar.tsx`, `frontend/src/lib/offline-sync.ts`
- **Specification:**
  - Mounted at top of application shell:
    - **Offline:** Amber/slate pill: *"Offline — changes saved on this device"* with badge showing pending transaction count.
    - **Server Unreachable:** Warning pill with *"Server unreachable"* and `"Try again"` action.
    - **Session Expired:** Pill prompting *"Session expired — Sign in to sync"*.
  - Offline transactions stored in IndexedDB queue (`pasona-offline-ops`).
  - When connection is restored: flushes automatically through existing `POST /api/transactions/sync`. Displays *"Syncing n changes"* banner, followed by a *"Synced n changes"* toast.

### Task 3.6 — Unified HTTP Status Handling & Session Re-Auth Overlay
- **Files to create/modify:** `frontend/src/lib/api-client.ts`, `frontend/src/components/finance/SessionExpiredModal.tsx`
- **Specification:**
  - Intercept HTTP errors centrally:
    - `401 Unauthorized` $\rightarrow$ Open non-destructive session re-auth modal without unmounting current page or clearing dirty form inputs.
    - `403 requires_verified_email` $\rightarrow$ Show verification alert banner.
    - `409 Conflict` $\rightarrow$ Trigger duplicate transaction review prompt.
    - `422 Unprocessable` $\rightarrow$ Map directly to field errors.
    - `429 Too Many Requests` $\rightarrow$ Toast: *"Slow down, please try again in a moment."*
    - `5xx / Network Error` $\rightarrow$ Persistent error toast or modal banner with `"Try again"`.

### Task 3.7 — Dev-Only Network State Switcher
- **Files to create/modify:** `frontend/src/components/dev/NetworkSimulator.tsx`
- **Specification:**
  - Float pill in development mode allowing instant simulation of: `Online`, `Offline`, `Server 500`, `Session Expired (401)`.
  - Verifies all Phase 3 acceptance criteria directly without needing manual DevTools throttling.
