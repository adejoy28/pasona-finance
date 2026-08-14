import { Skeleton } from "@/components/ui/skeleton";

// Reusable skeleton blocks for the finance app. Match the real card
// silhouettes so the layout doesn't jump on load.

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="px-6 pt-10 pb-20 premium-gradient text-white rounded-b-[3rem] shadow-2xl shadow-blue-100">
        <div className="flex justify-between items-start mb-8">
          <Skeleton className="h-6 w-32 bg-white/20" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 bg-white/20" />
          <Skeleton className="h-10 w-56 bg-white/30" />
        </div>
      </header>
      <div className="px-6 -mt-12 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-4 overflow-hidden">
            <Skeleton className="h-32 w-44 rounded-2xl shrink-0" />
            <Skeleton className="h-32 w-44 rounded-2xl shrink-0" />
            <Skeleton className="h-32 w-44 rounded-2xl shrink-0" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
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
