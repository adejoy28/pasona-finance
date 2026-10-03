# Audit: Feature & API Gap Analysis

This document audits every feature from the approved mockup (`pasona-redesign.html`) and implementation brief (`pasona-gemini-brief.md`), evaluating status across the frontend and backend API.

---

| Feature / Mockup Component | Frontend Status | API Status | Notes |
| :--- | :--- | :--- | :--- |
| **Home: Cash flow only hero** | Partial | Exists (`GET /api/summary`) | Hero exists with balance and cashflow. Needs strict alignment where spent excludes savings. |
| **Home: Monthly budget card** | Partial | Missing (`budgets` table/endpoints) | Card scaffold exists on dashboard; needs backend `budgets` endpoint and limit metrics. |
| **Home: Savings isolation ("Savings are not spending")** | Missing | Missing (`kind` on categories/summary) | Backend treats all expenses equally; needs category `kind` (`spending` vs `saving`) & summary calculation. |
| **Home: "Coming up" bills strip** | Partial | Missing (`recurring_bills` endpoints) | UI strip scaffold exists; needs backend `recurring_bills` table and mark-paid flow. |
| **Home: "Where it went" category stack & list** | Exists | Exists (`GET /api/summary`) | Rendered via category stack bar and breakdown list. |
| **Home: 6-month trend chart** | Exists | Exists (`GET /api/summary`) | Renders cashflow trend line chart. |
| **Home: Goals summary card** | Missing | Missing (`goals` table/endpoints) | Not rendered on dashboard. Needs new backend tables and UI card. |
| **Home: Duplicate Guard badge strip** | Exists | Exists (`GET /api/transactions`) | Checks and displays potential duplicate count with link to review. |
| **History: Day-grouped list with net daily totals** | Exists | Exists (`GET /api/transactions`) | Groups transactions by date with `+₦...`/`-₦...` header badges. |
| **History: Multi-facet filter drawer** | Partial | Exists | Supports search, category, type, date range. Needs tag, has-note, and amount range filters. |
| **History: Saved filter chips** | Exists | Exists (Client `localStorage`) | `pasona.saved_filters` stores active and custom filters. |
| **Transaction Detail: Modal (desktop) / Sheet (mobile)** | Exists | Exists (`GET /api/transactions/{id}`) | Displays full record details and metadata. |
| **Transaction Detail: Note & Tags** | Partial | Missing (`note`, `tags` DB columns) | Handled client-side via `pasona.tx_meta:{id}`. Migration allowed in Phase 5. |
| **Transaction Detail: Split flow** | Exists | Missing (`split_group_id` column) | Operates client-side via atomic dual write with rollback; needs `split_group_id` backend link. |
| **Transaction Detail: Receipt slot** | Missing | Missing | Needs UI slot for receipt upload/preview. |
| **Add: Single transaction** | Exists | Exists (`POST /api/transactions`) | Supports income, expense, and transfer with account selectors. |
| **Add: Paste alert tab** | Partial | Missing dedicated parser endpoint | Client AI chat can parse alerts; needs dedicated tab in Add screen with empty-field error fallback. |
| **Add: Bulk import tab** | Exists | Exists (`POST /api/import/*`) | Full statement parser with preview, duplicate check, and batch persistence. |
| **Duplicate Review: Side-by-side resolution** | Partial | Exists (`409` conflict & `?flag=duplicates`) | Currently filtered in History list; needs side-by-side comparison screen (Keep both, Remove one, Link as transfer). |
| **Accounts: List with share of balance bar** | Exists | Exists (`GET /api/accounts`) | Renders account cards with balance proportion bars. |
| **Account Detail: In / Out / Entries KPIs** | Exists | Exists (`GET /api/accounts/{id}`) | Displays account level metrics on detail card. |
| **Account Detail: Balance-over-time chart** | Missing | Missing (or derived client-side) | Needs area/line chart of cumulative account balance over time. |
| **Account Detail: Balance check reconciliation** | Exists | Exists (`POST /api/transactions`) | Full two-state reconciliation modal with difference calculation and adjustment entry. |
| **Categories: Expense / Income tabs & activity bars** | Exists | Exists (`GET /api/categories`) | Shows categories with horizontal spend activity bars relative to max category. |
| **Categories: Kind toggle (spending vs saving)** | Missing | Missing (`kind` column on `categories`) | Needs backend migration adding `kind` and UI toggle in category dialog. |
| **Categories: Color picker and icon selector** | Partial | Missing | Basic color assignment exists; needs full interactive palette and icon picker. |
| **Budgets: Dedicated planner & ok/near/over meters** | Missing | Missing (`POST/GET /api/budgets`) | Needs dedicated screen, rollover from last month, and progress meters. |
| **Goals: Target savings, date & ring visualizer** | Missing | Missing (`/api/goals`) | Needs new feature set across both frontend and backend. |
| **Recurring Bills: Calendar, frequency & mark paid** | Missing | Missing (`/api/recurring_bills`) | Needs new feature set across both frontend and backend. |
| **Settings: Profile editor (name, email, password)** | Exists | Exists (`PATCH /api/me`) | Supports profile updates, email verification check, and account deletion. |
| **Settings: Theme switcher (skin & mode)** | Missing | Exists (Client `localStorage`) | Needs skin (`original`/`fresh`) and mode (`light`/`dark`/`system`) controls. |
| **Settings: Import history with Undo batch** | Exists | Exists (`POST /api/import/batches/{id}/undo`) | Reads `pasona.import_history` and supports batch undo. |
| **Notifications: In-app drawer with actionable suggestions** | Exists | Exists (`GET /api/notifications`) | Combines client suggestions (unreconciled accounts, duplicates) with server notifications. |
| **Feedback System: useToast with Undo & network bar** | Partial | Exists | `useUndoToast` exists; needs integration with offline queue and top network status bar. |
