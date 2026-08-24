import { Skeleton } from "@/components/ui/skeleton";

// Reusable skeleton blocks for the finance app. Match the real card
// silhouettes so the layout doesn't jump on load.

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Top Header Section */}
      <header className="px-6 pt-8 pb-10 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-28 bg-white/20 rounded-lg" />
          <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
        </div>

        {/* Hero Card */}
        <div className="bg-white/10 rounded-2xl p-5 border border-white/15 space-y-3">
          <div className="flex justify-between items-center gap-2">
            <Skeleton className="h-3.5 w-24 bg-white/20 shrink-0" />
            <Skeleton className="h-7 w-28 rounded-full bg-white/30 shrink-0" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-9 w-48 bg-white/30" />
            <Skeleton className="h-3.5 w-36 bg-white/20" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-6 space-y-6 pt-4">
        {/* Month Selector Row */}
        <div className="flex justify-center items-center gap-3">
          <Skeleton className="w-7 h-7 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-32 rounded-md bg-slate-200" />
          <Skeleton className="w-7 h-7 rounded-full bg-slate-200" />
        </div>

        {/* Cashflow (Income & Expenses) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-50 space-y-4 h-32 flex flex-col justify-between">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-50 space-y-4 h-32 flex flex-col justify-between">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>

        {/* My Accounts */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3.5 w-14" />
          </div>
          <div className="flex gap-4 overflow-hidden pb-2">
            <Skeleton className="h-32 w-44 rounded-2xl shrink-0" />
            <Skeleton className="h-32 w-44 rounded-2xl shrink-0" />
            <Skeleton className="h-32 w-44 rounded-2xl shrink-0" />
          </div>
        </div>

        {/* Spending */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="px-6 pt-8 pb-10 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
            <Skeleton className="h-6 w-24 bg-white/20 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
              <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 shadow-inner">
            <div className="flex justify-between items-center gap-2">
              <Skeleton className="h-3.5 w-24 bg-white/20 shrink-0" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full bg-white/20" />
                <Skeleton className="h-5 w-16 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-9 w-44 bg-white/30" />
              <Skeleton className="h-3.5 w-36 bg-white/20" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 space-y-6 pt-4 w-full">
        <div className="space-y-2">
          <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1 border border-slate-200/40">
            <Skeleton className="h-8 flex-1 rounded-lg bg-slate-200" />
            <Skeleton className="h-8 flex-1 rounded-lg bg-slate-200" />
            <Skeleton className="h-8 flex-1 rounded-lg bg-slate-200" />
            <Skeleton className="h-8 flex-1 rounded-lg bg-slate-200" />
          </div>
          <Skeleton className="h-9 w-full rounded-xl bg-slate-200" />
        </div>

        <div className="bg-white px-4 py-3.5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>

        <TransactionsSkeleton />
      </main>
    </div>
  );
}
