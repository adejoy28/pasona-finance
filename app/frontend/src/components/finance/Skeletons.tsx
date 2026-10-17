import { Skeleton } from "@/components/ui/skeleton";

// Reusable skeleton blocks for the finance app. Match the real card
// silhouettes so the layout doesn't jump on load.

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">
      {/* Sticky Fixed Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-3 sm:px-5 lg:px-6 border-b border-white/5 text-white">
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between items-center gap-3">
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-5 w-32 bg-white/20 rounded-[4px]" />
              <Skeleton className="h-3 w-40 bg-white/10 rounded-[4px]" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-8 w-28 bg-white/10 rounded-[4px] hidden sm:block" />
              <Skeleton className="w-9 h-9 rounded-full bg-white/15" />
              <Skeleton className="w-9 h-9 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area: Matching 2-column layout */}
      <main className="w-full px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-5 items-start">
          {/* Column A (Left) */}
          <div className="flex flex-col gap-4 min-w-0 order-2 lg:order-1">
            {/* Balance Hero Card */}
            <div className="bg-[#0b1434] rounded-[6px] p-4 sm:p-5 border border-white/10 shadow-[var(--lift)] space-y-4 text-white">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-24 bg-white/20 rounded-[4px]" />
                <Skeleton className="h-4 w-20 bg-white/20 rounded-[4px]" />
              </div>
              <Skeleton className="h-8 w-44 bg-white/30 rounded-[4px]" />
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-12 bg-white/15 rounded-[4px]" />
                  <Skeleton className="h-4 w-16 bg-white/25 rounded-[4px]" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-12 bg-white/15 rounded-[4px]" />
                  <Skeleton className="h-4 w-16 bg-white/25 rounded-[4px]" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-12 bg-white/15 rounded-[4px]" />
                  <Skeleton className="h-4 w-16 bg-white/25 rounded-[4px]" />
                </div>
              </div>
            </div>

            {/* Tasks to be done */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] space-y-3">
              <Skeleton className="h-4 w-32 bg-[var(--chip)] rounded-[4px]" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-8 w-full bg-[var(--chip)] rounded-[4px]" />
              </div>
            </div>

            {/* Where It Went Donut */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 shadow-[var(--lift)] space-y-3">
              <Skeleton className="h-4 w-28 bg-[var(--chip)] rounded-[4px]" />
              <div className="flex items-center justify-center py-4">
                <Skeleton className="w-32 h-32 rounded-full bg-[var(--chip)]" />
              </div>
            </div>

            {/* Spending Trend Line Chart */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 shadow-[var(--lift)] space-y-3">
              <Skeleton className="h-4 w-32 bg-[var(--chip)] rounded-[4px]" />
              <Skeleton className="h-36 w-full bg-[var(--chip)] rounded-[4px]" />
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 shadow-[var(--lift)] space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28 bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-3 w-16 bg-[var(--chip)] rounded-[4px]" />
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-10 w-full bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-10 w-full bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-10 w-full bg-[var(--chip)] rounded-[4px]" />
              </div>
            </div>
          </div>

          {/* Column B (Right) */}
          <div className="flex flex-col gap-4 min-w-0 order-1 lg:order-2">
            {/* Quick Log Card */}
            <div className="bg-[var(--surface)] border border-[var(--primary)]/30 rounded-[6px] p-4 shadow-[var(--lift)] space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-36 bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-5 w-20 bg-[var(--chip)] rounded-[4px]" />
              </div>
              <Skeleton className="h-9 w-full bg-[var(--chip)] rounded-[4px]" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-24 bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-6 w-24 bg-[var(--chip)] rounded-[4px]" />
              </div>
            </div>

            {/* Monthly Budget Snap */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-32 bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-3 w-12 bg-[var(--chip)] rounded-[4px]" />
              </div>
              <Skeleton className="h-6 w-40 bg-[var(--chip)] rounded-[4px]" />
              <Skeleton className="h-2 w-full bg-[var(--chip)] rounded-full" />
            </div>

            {/* Coming Up */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28 bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-3 w-16 bg-[var(--chip)] rounded-[4px]" />
              </div>
              <Skeleton className="h-8 w-full bg-[var(--chip)] rounded-[4px]" />
            </div>

            {/* Goals Preview */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 shadow-[var(--lift)] space-y-3">
              <Skeleton className="h-4 w-24 bg-[var(--chip)] rounded-[4px]" />
              <Skeleton className="h-12 w-full bg-[var(--chip)] rounded-[4px]" />
            </div>

            {/* Accounts */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 shadow-[var(--lift)] space-y-3">
              <Skeleton className="h-4 w-24 bg-[var(--chip)] rounded-[4px]" />
              <div className="flex gap-2.5 overflow-hidden">
                <Skeleton className="h-20 w-32 bg-[var(--chip)] rounded-[4px] shrink-0" />
                <Skeleton className="h-20 w-32 bg-[var(--chip)] rounded-[4px] shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-50 card-shadow space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
      <div className="pt-6 border-t border-slate-50 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-36" />
      </div>
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="bg-white p-4 rounded-2xl border-l-[5px] border-l-slate-100 card-shadow flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, day) => (
        <div key={day} className="space-y-3">
          <div className="flex justify-between px-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <TransactionRowSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AccountsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="px-6 pt-8 pb-10 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
            <Skeleton className="h-6 w-28 bg-white/20 rounded-lg" />
            <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 shadow-inner">
            <div className="flex justify-between items-center gap-2">
              <Skeleton className="h-3.5 w-28 bg-white/20 shrink-0" />
              <Skeleton className="h-7 w-28 rounded-full bg-white/30 shrink-0" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-9 w-44 bg-white/30" />
              <Skeleton className="h-3.5 w-36 bg-white/20" />
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-4 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AccountCardSkeleton />
          <AccountCardSkeleton />
          <AccountCardSkeleton />
        </div>
      </main>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="px-6 pt-8 pb-10 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
            <Skeleton className="h-6 w-28 bg-white/20 rounded-lg" />
            <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 shadow-inner">
            <div className="flex justify-between items-center gap-2">
              <Skeleton className="h-3.5 w-20 bg-white/20 shrink-0" />
              <Skeleton className="h-7 w-28 rounded-full bg-white/30 shrink-0" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-9 w-32 bg-white/30" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-full bg-white/20" />
                <Skeleton className="h-5 w-20 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="space-y-4">
          <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1 border border-slate-200/40">
            <Skeleton className="h-9 flex-1 rounded-lg bg-slate-200" />
            <Skeleton className="h-9 flex-1 rounded-lg bg-slate-200" />
          </div>
          <div className="bg-white rounded-2xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">
      {/* Sticky Fixed Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-3 sm:px-5 lg:px-6 shadow-sm border-b border-white/5 text-white">
        <div className="w-full flex justify-between items-center gap-3">
          <Skeleton className="h-5 w-28 bg-white/20 rounded-[4px]" />
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-9 rounded-xl bg-white/10" />
            <Skeleton className="h-9 w-9 rounded-xl bg-white/10" />
            <Skeleton className="h-9 w-9 rounded-full bg-white/20" />
          </div>
        </div>
      </header>

      {/* Main Content Area: Mockup 2-column layout (.hist) */}
      <main className="w-full px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
          {/* Column 1 (Left on desktop): Transactions Listwrap */}
          <div className="order-2 lg:order-1 bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-4 shadow-[var(--lift)] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <Skeleton className="h-4 w-28 bg-[var(--chip)] rounded-[4px]" />
              <Skeleton className="h-4 w-20 bg-[var(--chip)] rounded-[4px]" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-t border-[var(--line)]">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-[11px] bg-[var(--chip)] shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-36 bg-[var(--chip)] rounded-[4px]" />
                      <Skeleton className="h-2.5 w-24 bg-[var(--chip)] rounded-[4px]" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16 bg-[var(--chip)] rounded-[4px]" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 (Right on desktop): Aside Controls */}
          <div className="order-1 lg:order-2 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-1.5">
              <Skeleton className="h-14 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]" />
              <Skeleton className="h-14 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]" />
              <Skeleton className="h-14 bg-[var(--surface)] border border-[var(--line)] rounded-[12px]" />
            </div>

            <Skeleton className="h-9 w-full bg-[var(--surface)] border border-[var(--line)] rounded-[6px]" />

            <div className="flex gap-1.5 overflow-hidden">
              <Skeleton className="h-7 w-14 rounded-full bg-[var(--chip)] shrink-0" />
              <Skeleton className="h-7 w-20 rounded-full bg-[var(--chip)] shrink-0" />
              <Skeleton className="h-7 w-16 rounded-full bg-[var(--chip)] shrink-0" />
              <Skeleton className="h-7 w-18 rounded-full bg-[var(--chip)] shrink-0" />
            </div>

            <Skeleton className="h-36 w-full bg-[var(--surface)] border border-[var(--line)] rounded-[16px]" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function BudgetsSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">
      {/* Sticky Fixed Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-3 sm:px-5 lg:px-6 border-b border-white/5 text-white">
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between items-center gap-3">
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-5 w-28 bg-white/20 rounded-[4px]" />
              <Skeleton className="h-3 w-48 bg-white/10 rounded-[4px]" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-8 w-28 bg-white/10 rounded-[4px] hidden sm:block" />
              <Skeleton className="h-8 w-24 bg-white/15 rounded-[4px]" />
              <Skeleton className="w-9 h-9 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full px-3 sm:px-5 lg:px-6 pt-3 sm:pt-4 max-w-[1560px] mx-auto">
        {/* Tab Bar Skeleton */}
        <div className="flex bg-[var(--chip)] p-1 rounded-[6px] gap-1 max-w-md mb-4 border border-[var(--line)]/50">
          <Skeleton className="h-7 flex-1 rounded-[4px] bg-[var(--surface)]" />
          <Skeleton className="h-7 flex-1 rounded-[4px] bg-[var(--chip)]" />
          <Skeleton className="h-7 flex-1 rounded-[4px] bg-[var(--chip)]" />
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 sm:gap-5 items-start">
          {/* Column A (Left): Summary Card, Pace Chart, Next Month Plan */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Left to spend summary card */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 sm:p-5 shadow-[var(--lift)] space-y-3">
              <Skeleton className="h-3 w-28 bg-[var(--chip)] rounded-[4px]" />
              <Skeleton className="h-8 w-44 bg-[var(--chip)] rounded-[4px]" />
              <Skeleton className="h-3.5 w-36 bg-[var(--chip)] rounded-[4px]" />
              <Skeleton className="h-2 w-full bg-[var(--chip)] rounded-full" />
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--line)]">
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-12 bg-[var(--chip)] rounded-[4px]" />
                  <Skeleton className="h-4 w-16 bg-[var(--chip)] rounded-[4px]" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-16 bg-[var(--chip)] rounded-[4px]" />
                  <Skeleton className="h-4 w-20 bg-[var(--chip)] rounded-[4px]" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-12 bg-[var(--chip)] rounded-[4px]" />
                  <Skeleton className="h-4 w-16 bg-[var(--chip)] rounded-[4px]" />
                </div>
              </div>
            </div>

            {/* Pace Chart Card */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-4 shadow-[var(--lift)] space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-36 bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-6 w-16 bg-[var(--chip)] rounded-[4px]" />
              </div>
              <Skeleton className="h-44 w-full bg-[var(--chip)] rounded-[4px]" />
            </div>

            {/* Next Month Plan Card */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-[6px] bg-[var(--chip)] shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-4 w-32 bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-3 w-48 bg-[var(--chip)] rounded-[4px]" />
              </div>
              <Skeleton className="h-7 w-20 bg-[var(--chip)] rounded-[4px] shrink-0" />
            </div>
          </div>

          {/* Column B (Right): By Category Card */}
          <div className="flex flex-col gap-4 min-w-0">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[6px] p-3.5 sm:p-4 shadow-[var(--lift)] space-y-3">
              <div>
                <Skeleton className="h-4 w-28 bg-[var(--chip)] rounded-[4px]" />
                <Skeleton className="h-3 w-48 bg-[var(--chip)] rounded-[4px] mt-1" />
              </div>

              <div className="divide-y divide-[var(--line)] pt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-3 flex flex-col gap-2 px-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-2.5 h-2.5 rounded-[2px] bg-[var(--chip)]" />
                        <Skeleton className="h-4 w-28 bg-[var(--chip)] rounded-[4px]" />
                      </div>
                      <Skeleton className="h-4 w-20 bg-[var(--chip)] rounded-[4px]" />
                    </div>
                    <Skeleton className="h-1.5 w-full bg-[var(--chip)] rounded-full" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-16 bg-[var(--chip)] rounded-[4px]" />
                      <Skeleton className="h-3 w-14 bg-[var(--chip)] rounded-[4px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-[6px] bg-[var(--chip)]" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 bg-[var(--chip)] rounded-[4px]" />
                  <Skeleton className="h-3 w-40 bg-[var(--chip)] rounded-[4px]" />
                </div>
              </div>
              <Skeleton className="w-4 h-4 bg-[var(--chip)] rounded-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
