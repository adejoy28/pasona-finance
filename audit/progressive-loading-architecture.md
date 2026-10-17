# Progressive & Independent Section Loading Architecture

## Objective
Enable independent, progressive data loading across the Budgets & Planning views (Budgets, Goals, Recurring Bills) and Dashboard so that fast sections render immediately without being blocked by slower queries, avoiding jarring all-at-once layout shifts.

## Architectural Design

### 1. Decoupled Query Architecture
Instead of a single monolithic `Promise.all([budgets, goals, recurring, accounts, categories, summary])`:
- **`useCategoryBudgets(monthKey)`**: Loads budget limits and category spend for the selected month.
- **`useGoals()`**: Loads savings goals and targets independently.
- **`useRecurringBills()`**: Loads recurring income and expense items.
- **`useMonthlyPace(monthKey)`**: Loads daily transaction history for the spending against plan pace curve.

### 2. Fine-Grained Loading States & Skeletons
Each section will have its own loading state:
```tsx
const { data: budgetData, loading: budgetLoading } = useCategoryBudgets(monthKey);
const { data: goalsData, loading: goalsLoading } = useGoals();
const { data: billsData, loading: billsLoading } = useRecurringBills();
const { data: paceData, loading: paceLoading } = useMonthlyPace(monthKey);
```

### 3. Component-Level Boundaries
- **Left-to-Spend KPI Card**: Renders as soon as `budgetData` resolves.
- **Pace Chart**: Shows lightweight chart skeleton while `paceData` computes, transitions smoothly without blocking the summary card.
- **By Category Card**: Renders with 5 skeleton rows if category budget is loading, then pops in rows with staggered micro-transitions.
- **Next Month Planning Card**: Renders dynamically based on `nextMonthBudgetData`.

### 4. Smooth Visual Transitions (Framer Motion)
Use React Suspense or `AnimatePresence` with `mode="wait"` and staggered row fade-in (`fadeSlideUp` or `opacity: 0 -> 1` with 150ms ease) to prevent sudden pop-in jarring.

### 5. Stale-While-Revalidate (SWR) Caching
Cache month responses in an in-memory `Map<string, CacheEntry>` so switching back and forth between months or tabs is instantaneous (0ms render from cache, background revalidation).
