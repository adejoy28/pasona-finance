# Audit: Screen & Architecture Map

## 1. Entry Point Verification Proof

### The Entry Chain
1. **HTML Root**: [`frontend/index.html`](file:///c:/Users/johna/Projects/pasona-finance/frontend/index.html)
   - Contains `<div id="root">` with initial splash screen and script tag `<script type="module" src="/src/main.tsx"></script>`.
2. **Client Bootstrap**: [`frontend/src/main.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/main.tsx)
   - Mounts `<StrictMode><App /></StrictMode>` to DOM root `#root` after importing `./styles.css`.
3. **App Router**: [`frontend/src/App.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/App.tsx)
   - Wraps application in `BrowserRouter`, `ErrorBoundary`, `PopupProvider`, and `UndoToastProvider`.
   - Defines client routes including `<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />`.
4. **Target Dashboard Component**: [`frontend/src/pages/Dashboard.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/Dashboard.tsx)
   - Responsible for rendering the primary Home/Dashboard interface.

### The Proof Test
- **Marker String**: `<div id="phase0-entrypoint-marker" style={{ display: "none" }}>PHASE0_DISCOVERY_ENTRYPOINT_VERIFIED</div>`
- **Execution**:
  - Injected marker string into `frontend/src/pages/Dashboard.tsx` above line 250.
  - Queried active Vite dev server at `http://localhost:5173/src/pages/Dashboard.tsx` via `Invoke-RestMethod`.
  - Vite HMR picked up the file and served the transformed module containing `PHASE0_DISCOVERY_ENTRYPOINT_VERIFIED`.
  - Removed marker string from `frontend/src/pages/Dashboard.tsx` and restored file to clean state.
- **Result**: Confirmed `Dashboard.tsx` is the true entry point for `/dashboard`.

---

## 2. Screen Mapping Table

| Mockup Screen | Existing File | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Home (Dashboard)** | [`frontend/src/pages/Dashboard.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/Dashboard.tsx) | Exists (Partial) | Has balance hero, cashflow stats, recent list, category stack. Needs strict Phase 4 layout alignment (cash flow only top card, separate monthly budget card, savings exclusion). |
| **History** | [`frontend/src/pages/TransactionsIndex.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/TransactionsIndex.tsx) | Exists (Partial) | Has day grouping, search, saved filter chips, net totals. Needs full multi-facet filter panel (account, amount range, tag, has-note). |
| **Transaction detail** | [`frontend/src/pages/TransactionDetail.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/TransactionDetail.tsx)<br>[`frontend/src/components/finance/TransactionDialog.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/components/finance/TransactionDialog.tsx) | Exists (Partial) | Detail page & modal exist. Has split flow and local tag/note support. Needs responsive full sheet on mobile vs modal on wide, receipt slot UI. |
| **Add: Single** | [`frontend/src/pages/TransactionsAdd.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/TransactionsAdd.tsx)<br>[`frontend/src/components/finance/TransactionDialog.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/components/finance/TransactionDialog.tsx) | Exists | Supports income, expense, and transfer creation with account selection. |
| **Add: Paste alert** | [`frontend/src/components/finance/AiChat.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/components/finance/AiChat.tsx) | Partial / Missing tab | Bank alert parsing currently triggered via AI chat modal rather than a dedicated first-class tab in the Add screen. |
| **Add: Bulk import** | [`frontend/src/pages/ImportPage.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/ImportPage.tsx) | Exists | Full multi-step statement parser (CSV, XLSX, PDF) with preview, category suggestion, and batch store. |
| **Accounts** | [`frontend/src/pages/AccountsIndex.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/AccountsIndex.tsx) | Exists | Account list with balances, account creation dialog, and total balance card. |
| **Account page** | [`frontend/src/pages/AccountDetail.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/AccountDetail.tsx) | Exists (Partial) | Has KPI block (In/Out/Entries), recent transactions, balance check strip. Needs balance-over-time chart. |
| **Balance check** | [`frontend/src/pages/AccountDetail.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/AccountDetail.tsx) | Exists | Implemented as integrated `ReconciliationModal` with State A (bank input) and State B (match / diff / adjustment). |
| **Budgets** | `frontend/src/pages/Categories.tsx` | Partial / Does not exist as standalone | Categories page currently hosts budget limits. Needs dedicated `/budgets` view with monthly rollover and ok/near/over meters. |
| **Categories** | [`frontend/src/pages/Categories.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/Categories.tsx) | Exists (Partial) | Has Expense/Income tabs, spend relative bars, edit/delete. Needs `kind` toggle (spending vs saving), color picker, re-assignment prompt on delete. |
| **Goals** | Does not exist | Missing | Needs new UI (target amount, target date, ring visualizer, contribution flow) and backend support. |
| **Recurring bills** | Does not exist | Missing | Needs "Coming up" bills strip with overdue badges and "Mark paid" flow. |
| **Duplicate review** | [`frontend/src/pages/TransactionsIndex.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/TransactionsIndex.tsx) | Partial | Currently filtered via query param `?flag=duplicates`. Needs dedicated side-by-side comparison screen (Keep both, Remove one, Link as transfer). |
| **Notifications** | [`frontend/src/components/finance/NotificationPanel.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/components/finance/NotificationPanel.tsx) | Exists | Right side sheet with unread count, client-generated suggestions, and server notification stream. |
| **Settings (profile, notifications, preferences)** | [`frontend/src/pages/Settings.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/Settings.tsx) | Exists (Partial) | Has Profile, Biometrics, Notifications schedule, Import history. Needs theme switcher (skin: original/fresh, mode: light/dark/system). |
| **About** | [`frontend/src/pages/PrivacyPage.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/PrivacyPage.tsx)<br>[`frontend/src/pages/TermsPage.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/TermsPage.tsx) | Partial | Privacy policy and Terms pages exist. Dedicated in-app "About Pasona" card needs to be wired into Settings navigation. |
| **Onboarding** | [`frontend/src/components/finance/OnboardingTour.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/components/finance/OnboardingTour.tsx)<br>[`frontend/src/pages/SplashPage.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/pages/SplashPage.tsx) | Exists | Splash presentation and step tour for accounts setup. |
| **Empty states** | Distributed across list pages | Partial | Basic empty strings exist. Needs rich, uniform empty states matching mockup with clear call-to-action buttons. |

---

## 3. Reused Components and Shared Abstractions

- **Navigation Shell**: [`frontend/src/components/finance/Navbar.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/components/finance/Navbar.tsx)
- **Notification Drawer**: [`frontend/src/components/finance/NotificationPanel.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/components/finance/NotificationPanel.tsx) & [`NotificationBell.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/components/finance/NotificationBell.tsx)
- **Local Metadata Persistence**: [`frontend/src/hooks/use-local-meta.ts`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/hooks/use-local-meta.ts)
- **Undo Toast Provider & Hook**: [`frontend/src/hooks/use-undo-toast.tsx`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/hooks/use-undo-toast.tsx)
- **Number Animation**: [`frontend/src/hooks/use-count-up.ts`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/hooks/use-count-up.ts)
- **Privacy Masking**: [`frontend/src/hooks/use-privacy-mode.ts`](file:///c:/Users/johna/Projects/pasona-finance/frontend/src/hooks/use-privacy-mode.ts)
- **Form Controls & Modals**: Radix-based UI wrappers in `frontend/src/components/ui/` (`sheet.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `popup.tsx`).
