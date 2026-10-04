# Audit Decisions Log

This document records all specification readings and engineering choices made for the Home dashboard restructuring per Section 0 and Section 1 of the spec.

## Decision 1: Single Hook `useDashboardData(month)`
- **Spec requirement**: "Create a single hook, for example `useDashboardData(month)`, that returns one view model. Widgets receive their numbers from it as props. No widget may fetch or compute totals itself."
- **Choice**: Implemented in `frontend/src/hooks/use-dashboard-data.ts`. It fetches summary, accounts, categories, transactions, bills/subscriptions, and goals. It computes all view model fields deterministically and caches in memory with SWR for instant navigation.

## Decision 2: Definitions for `spent`, `saved`, `net`
- **Spec requirement**:
  - `spent` = sum of expense transactions in month whose category kind is `spending`. Excludes saving-kind categories and transfers.
  - `saved` = sum of expense transactions in saving-kind categories.
  - `net` = `income - spent - saved`. Equals the change in total balance for a month with no transfers.
- **Choice**: Category model has `type` ("income" / "expense") and optional `kind` ("spending" / "saving") or matching by name ("Savings"). Any expense with category kind === "saving" or category name === "Savings" is assigned to `saved`, and all other expenses to `spent`. Transfers are excluded.
- **Unit test**: Created in `frontend/src/__tests__/dashboard-math.test.ts` testing `net = income - spent - saved` and equality to total balance delta without transfers.

## Decision 3: Subtitle and Links in Widgets
- **Spec requirement**: Exactly match sections 5.1 through 5.11.
- **Choice**:
  - Balance: No Add button, no budget text. Eye button and accounts count link.
  - Quick Log: No dismiss (X) button. Single streak chip.
  - Needs Attention: Max 3 ranked rows, conditional render (collapsed if 0 rows).
  - Recent Activity: 5 rows, newly added transaction highlighted for 1.5s.
  - Budget: No near/over limit text.
  - Where It Went: Amount first in bold, muted percent.
  - Spending Trend: Subtitle "Last 6 months, savings not included".
  - Finish setting up: Handles empty states for Budget, Recurring, Goals, Accounts; collapses when empty.
