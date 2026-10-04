# Home Screen Restructuring Audit & Sign-off

**Date:** October 4, 2026  
**Branch:** `phase-4-dashboard`  
**Governing Rule:** ONE FACT, ONE HOME  

---

## 1. Metric Audit: One Fact, One Home

| Fact / Metric | Single Home Widget | Verification & Removal from Elsewhere |
| :--- | :--- | :--- |
| **Total Balance & Accounts Count** | Cash Flow Hero (`CashFlowHeroCard`) | Accounts card shows individual account breakdown; no duplicate total balance hero banner. |
| **Income / Spent / Net Cash Flow** | Cash Flow Hero (`CashFlowHeroCard`) | Where It Went, Spending Trend, and Budget do not display net flow or duplicate income totals. |
| **Spent Change vs Last Month** | Cash Flow Hero change chip (`-12% vs last month`) | Removed from Spending Trend card subtitle and table. |
| **Streak Days** | Quick Log single streak chip (`QuickLogCard`) | Removed from This Week card (This Week card removed entirely from Home). |
| **Duplicates Alert** | Needs Attention row (`NeedsAttentionCard`) | Standalone orange duplicate banner completely removed from Home. |
| **Overdue / Upcoming Bills** | Needs Attention (overdue) / Coming Up (`ComingUpCard`) | No red alert rows or duplicate bill banners. Empty state merged into Finish Setting Up. |
| **Budget Limit Status** | Monthly Budget (`MonthlyBudgetSnap`) | Removed near/over limit count text from budget card; handled in Needs Attention. |
| **Uncategorized Spending Warning** | Where It Went donut footer note | Only displayed if uncategorized expenses > 30% of total spending. |
| **Savings Rate** | Goals card header chip (`GoalsPreviewCard`) | Standalone savings rate card removed from Home. |

---

## 2. Layout & Viewport Sizing

### 2.1 Desktop (Width ≥ 960px)
- **Row 1:** Balance (`CashFlowHeroCard`) in Col 1, Quick Log (`QuickLogCard`) in Col 2. Configured with `items-stretch` so both cards maintain equal height.
- **Row 2:** Needs Attention (`NeedsAttentionCard`) spanning both columns. Collapses cleanly when 0 items require attention.
- **Row 3:** Recent Activity (`RecentTransactionsCard`) in Col 1 | Stacked column of Budget (`MonthlyBudgetSnap`), Coming Up (`ComingUpCard`), and Finish Setting Up (`FinishSettingUpCard`) in Col 2.
- **Row 4:** Where It Went (`WhereItWentDonut`) in Col 1 | Spending Trend (`SpendingTrendCard`) in Col 2.
- **Row 5:** Goals (`GoalsPreviewCard`) in Col 1 | Accounts (`AccountsCard`) in Col 2.

### 2.2 Mobile (Width < 960px)
Single column sequential order:
1. **Quick Log** (`order-1` — immediate access without scrolling)
2. **Balance Hero** (`order-2`)
3. **Needs Attention** (if any active items)
4. **Recent Activity**
5. **Monthly Budget**
6. **Coming Up** (if bills present)
7. **Finish Setting Up** (if setup incomplete)
8. **Where It Went** (if spending > 0)
9. **Spending Trend**
10. **Goals** (if goals exist)
11. **Accounts**

### 2.3 Spacing, Padding, and Sidebar Alignment
- Fixed `--sidebar-w: 220px` in `styles.css` and `.pf-side-nav` in `Navbar.tsx` to match `body.has-app-nav` padding-left exactly at all screen sizes.
- Eliminated previous gap between the desktop sidebar and the main content.
- Expanded main content and header padding from `px-4 sm:px-6 lg:px-8 xl:px-10` down to `px-3 sm:px-5 lg:px-6`, removing auto-centering margins (`max-w-[1560px] mx-auto`) so content breathes and expands across the viewport without feeling boxed up.

---

## 3. Data Integrity & Financial Math

- **Single Hook Data Source:** `useDashboardData(monthDate)` powers the entire screen. Widgets receive primitive values or view models as props; no widget fetches or computes totals independently.
- **In-Memory Cache (SWR):** Instant 0ms page loads with zero layout jumps.
- **Financial Math Equality Assertion:** Verified via `dashboard-math.test.ts`:
  $$\text{net} = \text{income} - \text{spent} - \text{saved}$$
  $$\text{net} == \Delta\text{balance (without transfers)}$$
  All 4 test suites pass cleanly.

---

## 4. Verification Checkpoints

- [x] `npm run build`: Succeeded without warnings or TypeScript errors (`dist` built in 21.43s).
- [x] `node --test src/__tests__/dashboard-math.test.ts`: 4/4 passing tests.
- [x] Zero duplicate metrics or competing visual banners across the dashboard.
- [x] Equal height stretch on Desktop Row 1 (Hero & Quick Log).
- [x] Smooth mobile order with Quick Log pinned to top.
