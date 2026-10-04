# Audit: Home Component and Widget Map (Step 0)

Date: 2026-10-04
Verification Status: **VERIFIED via Step 0 Marker Test**

## 1. Verified Route Entry
- **HTML Entry**: `frontend/index.html`
- **Application Bootstrap**: `frontend/src/main.tsx`
- **Router Root**: `frontend/src/App.tsx`
- **Home Route**: `<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />`
- **Active Component File**: `frontend/src/pages/Dashboard.tsx`
- **Marker Test**: Injected `<div id="home-marker-check">STEP-0-HOME-MARKER-VERIFIED</div>`, loaded via Vite dev server at `http://localhost:5173/src/pages/Dashboard.tsx`, confirmed compiled and rendered, and cleaned up.

---

## 2. Widget Components Currently Rendered on Home

| Component Name | Source Path | Reused on Other Screens? | Retention / Removal Plan for Home |
| :--- | :--- | :--- | :--- |
| **`CashFlowHeroCard`** | `frontend/src/components/finance/CashFlowHeroCard.tsx` | No | Retain on Home (Hero Balance Card). Remove internal Add button and budget text per spec 5.1. |
| **`QuickLogCard`** | `frontend/src/components/finance/QuickLogCard.tsx` | No | Retain on Home. Remove dismiss (x) button; retain streak chip as sole location on page per spec 5.2. |
| **`RecentTransactionsCard`** | `frontend/src/components/finance/RecentTransactionsCard.tsx` | No | Retain on Home. Update rows and empty state to exact spec 5.4. |
| **`WhereItWentDonut`** | `frontend/src/components/finance/WhereItWentDonut.tsx` | No | Retain on Home. Update title, legend (amount first), uncategorized link, and conditional render per spec 5.7. |
| **`SpendingTrendCard`** | `frontend/src/components/finance/SpendingTrendCard.tsx` | No | Retain on Home. Subtitle "Last 6 months, savings not included", chart/table toggle, no insight text per spec 5.9. |
| **`MonthlyBudgetSnap`** | `frontend/src/components/finance/MonthlyBudgetSnap.tsx` | No | Retain on Home as Budget card. Link to Budgets; remove over/near limit counts per spec 5.5. |
| **`ComingUpCard`** | `frontend/src/components/finance/ComingUpCard.tsx` | No | Retain on Home. Max 3 bills due in 14 days or overdue; not rendered when empty per spec 5.6. |
| **`GoalsPreviewCard`** | `frontend/src/components/finance/GoalsPreviewCard.tsx` | No | Retain on Home. Only rendered when user has goals; add savings rate header chip per spec 5.10. |
| **`InsightsCard`** | `frontend/src/components/finance/InsightsCard.tsx` | **Yes** (referenced by `AiInsightsCard.tsx`) | **REMOVE from Home** entirely per spec 5.3 & 5.12. Do NOT delete file because other module references it. |
| **`SavingsRateSnap`** | `frontend/src/components/finance/SavingsRateSnap.tsx` | No | **REMOVE from Home** as standalone card. Savings rate is moved to Goals card header per spec 5.10. |
| **`ThisWeekCard`** | `frontend/src/components/finance/ThisWeekCard.tsx` | No | **REMOVE from Home** entirely per spec 5.12. |
| **Duplicate Guard Banner** | Inline in `Dashboard.tsx` | No | **REMOVE standalone banner**. Replaced by Needs attention row #2 per spec 5.3. |
| **Paste Bank Alert Banner** | Inline in `Dashboard.tsx` | No | **REMOVE from Home** (not listed in new layout/widgets per spec 4 and 5). |
| **`NeedsAttentionCard`** | New widget to create | No | **ADD to Home** per spec 5.3. Max 3 ranked rows; not rendered when empty. Spans both columns on desktop. |
| **`FinishSettingUpCard`**| New widget to create | No | **ADD to Home** per spec 5.8. Collapses empty states for Budget, Recurring, Goals, Accounts; disappears when all done. |
| **Accounts Section** | Inline in `Dashboard.tsx` | No | Retain on Home as Accounts widget with "Add account" tile per spec 5.11. |
| **`ScreenHeader` / `MonthDropdown`** | `frontend/src/components/finance/ScreenHeader.tsx` | **Yes** (`Categories.tsx`, `TransactionsIndex.tsx`) | Retain top navigation/month header bar. |
| **`VerifyEmailBanner`** | `frontend/src/components/finance/VerifyEmailBanner.tsx` | **Yes** (reusable email verification) | Retained as page banner; email verification is also ranked in Needs attention row #5 when applicable. |
| **`NotificationBell`** | `frontend/src/components/finance/NotificationBell.tsx` | **Yes** (Header bar) | Retain in header. |
| **`FinanceNavbar`** | `frontend/src/components/finance/Navbar.tsx` | **Yes** (global navigation) | Retain global nav. |
| **`OnboardingTour`** | `frontend/src/components/finance/OnboardingTour.tsx` | No | Retain helper modal. |
| **`DashboardSkeleton`** | `frontend/src/components/finance/Skeletons.tsx` | **Yes** | Retain fallback loader. |

---

## 3. Preservation Safeguards
Per specification section 2.3:
- Any component used on another screen (e.g. `InsightsCard`, `VerifyEmailBanner`, `MonthDropdown`, `FinanceNavbar`) **MUST NOT be deleted from the repository**. It is simply removed from `Dashboard.tsx`.
