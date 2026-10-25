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
| 3 | Feedback & error system | `phase-3-feedback` | ✅ Done | Superseded by Phase 3b. |
| **3b** | **Feedback compliance (Addendum G)** | `phase-3-feedback` | ✅ Done | Remove dev switch, one alert system (`notify`), central HTTP mapping, adopted primitives. |
| **2b** | **Shell & IA revisions (Addendum A/B/C/E)** | `phase-2b-shell-ia` | ✅ Done | Tabs, gear/avatar, month dropdown, fluid sizing, theme attrs, /profile. |
| 6 | Categories & savings fix (backend first) | `phase-6-categories` | ⚪ Queued | Adds `kind` (`expense`, `saving`) to categories API. |
| 4 | Home (capture-first) | `phase-4-dashboard` | ✅ Done | Quick log card, cash-flow hero, budget card, donut, insights, trend, test. |
| 5 | Transactions | `phase-5-transactions` | ✅ Done | Save-and-add-another, duplicate review resolution screen, history filter chips, source badges (`typed`, `alert`, `import`, `mary`). |
| 7 | Budgets, goals, recurring bills | `phase-7-budgets` | ✅ Done | Full /budgets page with Budget, Goals, Recurring tabs, modals, pace chart, API, migrations & tests. |
| 8 | Accounts, balance check, bulk import | `phase-8-accounts` | ⚪ Queued | Balance check UI partly exists (localStorage); adjustment must use Undo toast. |
| **9b** | **Mary (AI assistant)** | `phase-9b-mary` | ✅ Done | Addendum F. Backend API + 400px drawer + 3D avatar + typewriter streaming + top scroll + prompt edit. |
| 9 | Profile, Settings, Help & legal, auth restyle, onboarding | `phase-9-settings` | 🟡 **Up next** | Expanded by Addendum A + G3 + G4.5/6. |
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

## Phase 4 — Home, capture-first (Addendum D + G4) — COMPLETED

1. **Quick Log card (Addendum G4.1 & G4.2):** Implemented `QuickLogCard.tsx` placed at the top of Home. Displays "Nothing logged today" with highlighted border when empty, streak calculation badge from real transactions ("Keep your n day streak" / "n day streak"), free-text input with `parseQuickLogSentence` navigating to prefilled Add form, and 3 "Log again" chips for 1-tap re-logging with Undo toast.
2. **Cash-flow hero card (Phase 4.1):** Total balance hero, 3-metric cash flow grid (Income, Spent excluding savings, Net cash flow), proportional bar with "x% of income spent" and "NGN y moved to savings".
3. **Monthly budget card (Phase 4.2):** Separate card labelled "Monthly budget", "NGN n left" of "NGN total", status meter (`ok` / `near` / `over` states, never full red unless exceeded), and embedded "Budgets" link.
4. **Where it went donut (Addendum D):** Donut chart with spent total in center (savings excluded), category legend beside it with `--c1..--c5` colors, and "Budgets" header link.
5. **Insights card (Addendum D):** "What needs your attention" with up to 4 rows, small tinted icons (overdue bills, budget status, spending trend, savings rate).
6. **Secondary cards:** Savings rate card, Coming up overdue bills with `OVERDUE` badge, Accounts horizontal scroll, Duplicate guard strip, This week 7-day recap, and Bank alert paste prompt.
7. **Prefilled Add form & Save-and-add-another (Addendum G4.3):** Updated `TransactionsAdd.tsx` with search parameter prefill support, amount input refocus, and "Save & Add Another" button.
8. **Responsive fluid layout (Phase 4.6 & Addendum E):** 2-column container query layout on wide screens (`.home-right-grid` with `.colA` and `.colB`), single stacked column on phones.
9. **Acceptance Test:** Added `test_income_minus_spent_minus_saved_equals_change_in_total_balance` in `backend/tests/Feature/FinanceIsolationTest.php`. Confirmed passing.
10. **Build & Typecheck:** Clean `npm run build` with 0 errors across 2,669 modules.

## Phase 5 — Transactions — COMPLETED

1. **Save-and-add-another (Addendum G4.3):** Clears amount + description, refocuses amount, notifies "Added. Log the next one." with Undo capability; Save first and full width on phone screens.
2. **Duplicate Review Screen:** Side-by-side duplicate candidate comparison with Keep, Merge, and Delete actions.
3. **History Screen Alignment:** Aligned history view with redesign mock up, added saved filter chips, month pagination, and responsive cards.
4. **Source Badges:** Badges for transaction creation source (`typed`, `alert`, `import`, `mary`).

## Phase 7 — Budgets, goals, recurring bills — COMPLETED

1. **Database Schema & Migrations:**
   - Created migration `2026_10_17_000001_create_budgets_goals_and_recurring_bills_tables.php` defining `budgets`, `goals`, and `recurring_bills` tables with user FK, indices, currency/color fields, and soft deletes.
2. **Backend Models, Policies & Controllers:**
   - `Budget`, `Goal`, `RecurringBill` models with decimal casting, relations to user, accounts, and categories.
   - User model updated with `budgets()`, `goals()`, and `recurringBills()` relationships.
   - Strict ownership authorization via `BudgetPolicy`, `GoalPolicy`, and `RecurringBillPolicy`.
   - `BudgetController`: `GET /api/budgets` with spending calculations, state tags (`ok`, `near`, `over`, `goal`, `way`), `POST /api/budgets` for single & bulk upsert, and `POST /api/budgets/copy-previous`.
   - `GoalController`: `GET /api/goals` with monthly amount needed and progress calculations, `POST /api/goals`, `PUT /api/goals/{id}`, `DELETE /api/goals/{id}`, and `POST /api/goals/{id}/contribute` (records saving transaction and increments `saved_amount`).
   - `RecurringBillController`: `GET /api/recurring-bills` with 30-day projection net/in/out, `POST /api/recurring-bills`, `PUT /api/recurring-bills/{id}`, `DELETE /api/recurring-bills/{id}`, and `POST /api/recurring-bills/{id}/mark-paid` (records transaction and advances next due date by weekly/monthly/yearly frequency).
3. **Frontend API Clients & Types:**
   - Added DTO definitions to `types.ts` and modules `budgets.ts`, `goals.ts`, and `recurring-bills.ts` exported via `lib/api/index.ts`.
4. **Hooks & State Management:**
   - Built `useBudgets` hook with month offset navigation, pace point calculations, URL tab query sync (`?tab=goals`, `?tab=recurring`), and mutation handlers with notifications and Undo where appropriate.
5. **UI Components & Visual Fidelity:**
   - `SpendingAgainstPlanChart.tsx`: Cumulative spending pace vs linear plan pace line chart with table view toggle and legend keys matching redesign mock up.
   - `GoalCard.tsx`: Visual card with circular SVG progress ring (`ring(p, c, 56)`), month countdown, and "Add" contribution modal trigger.
   - `RecurringBillRow.tsx`: Bill row with due badge (`Overdue`, `Due today`, `Tomorrow`, `In n days`), frequency/account, amount, and "Paid"/"Received" action.
   - Dialogs: `EditPlanDialog.tsx`, `NewGoalDialog.tsx`, `AddToGoalDialog.tsx`, `NewRecurringBillDialog.tsx`, and `EditCategoryLimitDialog.tsx`.
6. **Screen & Navigation:**
   - Created `BudgetsIndex.tsx` with 3 tabs (`Budget`, `Goals`, `Recurring`), urgent-first category sorting, summary cards, KPIs, next month copy card, and link to `/categories`.
   - Registered `/budgets` in `App.tsx` and updated Navbar, Dashboard cards (`MonthlyBudgetSnap`, `WhereItWentDonut`, `ComingUpCard`, `GoalsPreviewCard`, `SavingsRateSnap`), `useDashboardData`, `notifications-catalog`, and `Categories` banner.
7. **Testing & Verification:**
   - Created `BudgetPhase7Test.php` passing all 4 tests (18 assertions) alongside `FinanceIsolationTest`.
   - Executed `npm run build` with 0 errors across 2,684 modules.

## Phase 9b — Mary (AI assistant) — COMPLETED

1. **Backend Endpoint & Engine (Addendum F):**
   - Created `POST /api/assistant/message` in `AssistantController.php` with 20/min/user rate limit middleware.
   - `AiChatService.php` with Groq tool calling (`propose_transaction`, `navigate`), Mary persona prompt, and deterministic rule-matching fallback when API keys are absent or queries are offline.
   - Fixed PostgreSQL soft-delete filtering and recurring bills next_due calculations.
   - Year parsing safety: ignores standalone years (2024–2027) as amounts unless explicit currency symbols are present.
   - Tested: `AssistantTest.php` passing all 5 tests (35 assertions).
2. **Frontend UI & Drawer:**
   - 400px side-drawer on desktop, full-height sheet on mobile.
   - Suggestion chips (`Where did my money go?`, `How much do I have?`, `Check my budget`, etc.).
   - Interactive transaction draft card: mandatory account selection (never defaulted), category selector, Cancel and Confirm buttons.
   - Saves transactions via existing `POST /api/transactions` with `source: 'mary'`, 409 duplicate warning with "Add anyway", and Undo toast.
   - `FormattedMaryText` with markdown support (bold, italics, inline code, bullet points) and privacy masking (`₦****` in privacy mode).
   - Binding Addendum F disclaimer: *"Mary can make mistakes. Check amounts before you confirm."*
3. **Advanced UX Additions:**
   - **3D Stylized Avatar:** High-resolution Pixar/Memoji-style 3D avatar on Floating Action Button (`#maryfab`), active emerald ring, drawer header badge, and mini avatar on chat bubbles.
   - **Thinking State:** Animated avatar with glowing pulse and ping ring beside the bouncing dots bubble when Mary is processing.
   - **Typewriter Streaming:** Character-by-character animated text streaming via `requestAnimationFrame` with blinking cursor `▌` and progressive card reveal on completion. Tap to fast-forward.
   - **Top-Anchored Scrolling:** Automatically scrolls to the top of Mary's newest response (`block: "start"`) so users can read downward from line 1 without manually scrolling up.
   - **Prompt Editing & Retry:** Inline `Pencil` icon on user bubbles allowing editing & resending, plus `Retry` button on assistant replies.

---

## Phase 9 — Profile, Settings, Help & legal, auth restyle, onboarding — UP NEXT

- **Profile & Settings IA (Addendum A):**
  - Settings grouped cleanly into 3 categories: App (Notifications, Appearance, Preferences) · Data (Import statements, Import history, Categories) · Help (Help and legal).
  - Preferences split into Display + Budget only. User row links directly to `/profile`.
- **Help & Legal Reading Dialogs:**
  - In-app reading dialogs for Terms of Service, Privacy Policy, and Disclaimers.
- **Auth Screen Restyle (Addendum G3):**
  - Restyled login/register screens with field-level 422 errors, generic 401 copy, 429 rate limit banner, and offline/network indicators. Zero changes to underlying auth logic.
- **Onboarding Flow (Addendum G4.5/6):**
  - Reminders enabled by default for new users.
  - Push notification permission prompt deferred until after first logged transaction.
  - Onboarding lands directly on the Add Transaction form; interactive tour replayable anytime from Help & Legal.
