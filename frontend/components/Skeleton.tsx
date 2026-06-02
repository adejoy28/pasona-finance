'use client';

import { cn } from '@/lib/utils';

/**
 * Reusable Skeleton Loader
 * 
 * Provides a shimmering animation effect for loading states.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-slate-200 rounded-lg", className)} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-8">
      {/* Header Skeleton */}
      <div className="h-48 w-full bg-slate-100 rounded-[3rem] p-8 space-y-4">
        <Skeleton className="h-4 w-24 bg-slate-200/50" />
        <Skeleton className="h-10 w-48 bg-slate-200/50" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-50 h-32 space-y-4">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-50 h-32 space-y-4">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 ml-2" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex gap-4 items-center">
                <Skeleton className="w-10 h-10 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
