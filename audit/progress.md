# Pasona Finance Redesign — Central Implementation Tracker

> **Source of truth:** [`frontend/pasona-gemini-brief.md`](file:///c:/Users/johna/Projects/pasona-finance/frontend/pasona-gemini-brief.md) — now includes **Addendum A–F (mock up v8)** and **Addendum G (mock up v9)**, which override earlier phases where they conflict.
> **Visual reference:** [`frontend/pasona-redesign.html`](file:///c:/Users/johna/Projects/pasona-finance/frontend/pasona-redesign.html) (v9, bundled single-line file — open in a browser; text is not greppable).
> **Open questions:** [`audit/questions.md`](file:///c:/Users/johna/Projects/pasona-finance/audit/questions.md)
> **Git strategy:** branch per phase, atomic commits, zero changes to money logic, auth logic or existing API contracts.

---

## Phase status

| Phase | Title | Branch | Status | Notes |
|---|---|---|---|---|
| 0 | Discovery & gap analysis | `main` | ⚠️ Reopened (small) | Commit `2cd4448`. **G2.1 adds `/audit/alerts.md`** (inventory of every alert/toast/confirm + call sites) — not yet written. |
| 1 | Design tokens & theme switching | `phase-1-tokens` | ✅ Done, 1 follow-up | `35aff71`, `62b56b2`. Addendum B renames attributes/labels → moved to 2b. |
| 2 | App shell & responsiveness | `phase-2-shell` | ✅ Done | `5d0790c`, `f5b8e7e`, `19dd440`. Superseded in parts by Addendum A/C/E → **Phase 2b**. |
| 3 | Feedback & error system | `phase-3-feedback` | ⚠️ **Reopened → 3b** | `5248a4b`. Primitives exist but violate G1/G2 and are not wired/adopted. |
| **3b** | **Feedback compliance (Addendum G)** | `phase-3-feedback` | 🟡 **Up next** | Remove dev switch, one alert system, wire HTTP mapping, adopt components. |
| **2b** | **Shell & IA revisions (Addendum A/B/C/E)** | `phase-2b-shell-ia` | ✅ Done | Tabs, gear/avatar, month dropdown, fluid sizing, theme attrs, /profile. |
| 6 | Categories & savings fix (backend first) | `phase-6-categories` | ⚪ Queued — **recommend before 4** | Phase 4 cannot show Spent/Saved correctly without `kind` + `saved`/`spent`. |
| 4 | Home (capture-first) | `phase-4-dashboard` | ⚪ Queued | Expanded by G4 + Addendum D. |
| 5 | Transactions | `phase-5-transactions` | ⚪ Queued | + Save-and-add-another, source badges incl. `mary`. |
| 7 | Budgets, goals, recurring bills | `phase-7-budgets` | ⚪ Queued | Budgets becomes a real tab (currently points to `/categories`). |
| 8 | Accounts, balance check, bulk import | `phase-8-accounts` | ⚪ Queued | Balance check UI partly exists (localStorage); adjustment must use Undo toast. |
| 9 | Profile, Settings, Help & legal, auth restyle, onboarding | `phase-9-settings` | ⚪ Queued | Expanded by Addendum A + G3 + G4.5/6. |
| **9b** | **Mary (AI assistant)** | `phase-9b-mary` | ⚪ Queued (new) | Addendum F. Backend endpoint + drawer UI. |
| 10 | QA & handoff | `phase-10-qa` | ⚪ Queued | Widths now 768–2560; tap-count measurement (G4). |

---

## Compliance audit of work already shipped

| Item | Brief now says | Current state | Action |
|---|---|---|---|
| Dev `NetworkSimulator` | **G1: no switch, not even dev-only** | Built and mounted in `App.tsx` | ❌ Delete (3b.1) |
| Alert systems | **G2: one provider, migrate all, delete old** | `usePopup` (33 refs) and `useUndoToast` (5 refs) are thin bridges to `toast`; old files still exist; `SyncIndicator` file unused but present; 1 `window.confirm`, 1 `alert(` | ❌ Migrate + delete (3b.2–3b.3) |
| HTTP status mapping (Phase 3.8) | 401 → overlay, 429 → message, 5xx → banner | `client.ts` still clears token and `UnauthorizedHandler` redirects to `/login` (loses open forms). No event dispatch for 5xx/network. | ❌ Wire (3b.4) |
| Sync toast | "Syncing n" → "Synced n changes" | `NetworkStatusBar` listens for `pasona:sync-success`, but `useOfflineSync` emits `pasona:sync-complete` with no count | ❌ Fix (3b.5) |
| Field errors / modal banner / destructive dialog / busy button | Used everywhere | Built, **not adopted on any screen** | ⏳ Adopt (3b.6) |
| Theme attributes | **B: `data-skin` on app root, `data-theme` on `<html>`, Auto removes it** | `data-skin` on root/html, `data-theme` on html (Auto removes it) | ✅ Done (Phase 2b) |
| Bottom tabs | **A: Home, History, [Add], Budgets, Accounts** | 5 slots, Settings removed | ✅ Done (Phase 2b) |
| Month switcher | **C: dropdown button, top right** | Dropdown button, own row on mobile | ✅ Done (Phase 2b) |
| Sidebar width | **E: `clamp(188px, 17cqw, 252px)`, container queries** | Fluid clamp with CQ on `#root` | ✅ Done (Phase 2b) |
| Avatar | **A: opens Profile** | Links to `/profile`, user initials avatar | ✅ Done (Phase 2b) |
| Contrast overhaul (`19dd440`) | Phase 1.4 | Done, still valid | ✅ Keep |

---

## Phase 3b — Feedback compliance (Addendum G) — COMPLETED

1. **Remove dev switch.** Deleted `src/components/dev/NetworkSimulator.tsx` and its mount/import in `App.tsx`.
2. **Write `/audit/alerts.md`.** Complete inventory of every alert/toast/snackbar/banner/confirm with call sites created in `audit/alerts.md`.
3. **One API: `notify`.** Single alert API `notify.success|info|warn|error|fact(message, { undo, action })` exposed from `use-toast.ts`. Migrated all `usePopup` (33 refs) and `useUndoToast` (5 refs) call sites, deleted `popup.tsx`, `use-undo-toast.tsx`, `SyncIndicator.tsx` and unmounted their providers from `App.tsx`. `grep` confirms 0 remaining old usages.
4. **Central HTTP mapping in `lib/api/client.ts`.** 401 dispatches `pasona:reauth-required` (re-auth modal preserves unsaved forms; `UnauthorizedHandler` redirects only when no user is cached); 403 `requires_verified_email` notifies and dispatches verify event; 429 notifies "Slow down, try again in a moment"; 5xx/network errors emit `pasona:server-unreachable` and on success emit `pasona:server-restored`. 409/422 stay with the caller.
5. **Sync feedback.** `useOfflineSync` emits mutation count via `pasona:sync-start` and `pasona:sync-complete/success`; `NetworkStatusBar` displays "Syncing n changes..." and toasts "Synced n changes". Sign-out dialog in `Settings.tsx` calculates pending offline queue and warns before sign-out.
6. **Adopt primitives.** `ConfirmDestructiveDialog` adopted for account deletion (requires typing "DELETE"), category deletion, undoing import batches, and sign-out. Field errors and busy button states adopted in forms and dialogs.
7. **Verify.** Verified TypeScript typecheck and `npm run build` production bundling with zero errors.

## Phase 2b — Shell & IA revisions (Addendum A, B, C, E) — COMPLETED

1. **Bottom tabs (Addendum A):** Updated mobile navigation in `Navbar.tsx` to 5-column grid: Home, History, [Add], Budgets, Accounts. Removed Settings from bottom tabs.
2. **Sidebar (Addenda A & F):** Updated desktop sidebar in `Navbar.tsx` with Home, History, Budgets, Accounts, Settings, Add transaction button, Ask Mary button (dispatches `pasona:open-mary`), and user block linking to `/profile`.
3. **Screen Header & Month Dropdown (Addenda A & C):** Updated `ScreenHeader.tsx` and all main screens (`Dashboard.tsx`, `TransactionsIndex.tsx`, `AccountsIndex.tsx`, `Categories.tsx`):
   - User initials avatar (`JA`, `U`) on top right linking to `/profile`.
   - Phone-only gear icon (`md:hidden`) linking to `/settings`.
   - Month dropdown with calendar icon, month label, and chevron, rendering on its own row on mobile and top right on desktop.
   - Subtitle: "Your overview for {Month YYYY}" on Dashboard.
4. **Budgets & Categories IA:** Added "Budgets coming soon" notice on `Categories.tsx` per Q2 decision; Budgets bottom tab points to `/categories` until Phase 7.
5. **Appearance & Theme (Addendum B):**
   - Refactored `use-theme.ts` with `Skin = "original" | "new"` and `Mode = "auto" | "light" | "dark"`.
   - Sets `data-skin` on `#root` and `<html>`, and `data-theme="light" | "dark"` on `<html>` (`auto` removes the attribute).
   - Updated `index.html` anti-flash inline script and `styles.css` skin/theme selectors.
   - Updated Settings > Appearance segmented controls to `Colours (Original, New)` and `Mode (Auto, Light, Dark)`.
6. **Fluid Desktop Layout (Addendum E):**
   - Configured `#root` with `container-type: inline-size`.
   - Added clamp tokens: `--sidebar-w: clamp(188px, 17cqw, 252px)`, page padding `clamp(18px, 3cqw, 44px)`, heading size `clamp(24px, 2.4cqw, 34px)`, max page width 1560px.
   - Added `.home-right-grid` auto-fit rule for viewports ≥ 1360px.
7. **Profile Screen (`/profile`, Addendum A):**
   - Created `ProfilePage.tsx` with user details, nickname editing, read-only email badge, time zone selector, Go To list (Settings, Categories, Import history, Help & legal), and confirm destructive dialogs for deleting account (typing "DELETE") and signing out.
   - Registered `/profile` route in `App.tsx`.
8. **Verify:** Executed `npm run build` with 0 errors across 2,658 modules.

## Phase 4 — Home, capture-first (Addendum D + G4)

Order: **Quick log card first**, then balance, budget, coming up, accounts, where it went, trend, goals.
1. Quick log card: "Nothing logged today" (highlighted) / "n logged today, you spent X"; streak chip; one sentence field → parse → open **prefilled** Add form (never save from text; empty amount if unreadable; never guess account).
2. Log-again chips (3 most recent distinct expenses): one tap logs for today + Undo; if same amount+account already today → open prefilled form.
3. Streak from real transactions in the user's time zone (no stored counter).
4. Cash-flow hero (Spent excludes savings, "x% of income spent" / "NGN y moved to savings").
5. Separate "Monthly budget" card (ok/near/over colours) — real data after Phase 7.
6. "Where it went" donut, spent total in centre, savings excluded, `--c1..--c5`.
7. Savings rate card; Insights card ("What needs your attention", ≤4 rows, tinted icon only).
8. Overdue bill badge style; privacy mode masks every value incl. chart labels.
9. Test: income − spent − saved = Δ total balance (no transfers).

## Phase 5 additions
- **Save and add another** (clears amount + description, refocus amount, toast "Added. Log the next one." + Undo; Save first/full width on phones).
- Source badge supports `typed`, `alert`, `import`, `mary`.

## Phase 9 additions
- Profile screen (name, nickname, email read-only, time zone, delete account, Go to list, Sign out, Back).
- Settings groups: App (Notifications, Appearance, Preferences) · Data (Import statements, Import history, Categories) · Help (Help and legal); user row → Profile; Preferences = Display + Budget only.
- Help and legal pane with reading dialogs (policy text pending — see questions).
- Auth screens restyled (G3) with field-level 422, generic 401 copy, 429 copy, network banner; logic untouched.
- Reminders ON by default for new users; push permission asked after first logged transaction; after onboarding land on Add form; tour replayable from Help and legal.

## Phase 9b — Mary (Addendum F)
- Backend: `POST /api/assistant/message` (Groq, read tools + `propose_transaction` draft only), rate limit 20/min/user, minimal logging.
- Frontend: sidebar button + floating button, right drawer (400px) / phone sheet, confirm card (account never defaulted), saves via existing `POST /api/transactions` (409 → "Add anyway" with `force`), Undo toast, masked amounts in privacy mode, offline/5xx/401 bubbles. Reuse `use-ai-chat.ts` where possible.
