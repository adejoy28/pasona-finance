'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { DashboardSkeleton } from '@/components/Skeleton';
import { ErrorMessage } from '@/components/ErrorMessage';

type Account = {
  id: number;
  name: string;
  type: 'bank' | 'mobile' | 'cash' | string;
  balance: number;
};

type CategoryItem = {
  category_name: string;
  total: number;
};

type SummaryData = {
  total_balance: number;
  monthly_summary: {
    income: number;
    expense: number;
  };
  accounts: Account[];
  category_breakdown: CategoryItem[];
};

/**
 * Enhanced Dashboard Page
 * 
 * Features a modern, high-contrast fintech interface with card-based layouts
 * and skeleton loading states.
 */
export default function Dashboard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isOnline, isSyncing } = useOfflineSync();

  const fetchSummary = async () => {
    setError(false);
    setLoading(true);
    try {
      const response = await api.get('/summary');
      setData(response.data);
    } catch {
      console.error('Failed to fetch summary');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchSummary();
    };

    void initialize();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <ErrorMessage message="Could not sync your latest data." onRetry={fetchSummary} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Header Section */}
      <header className="px-6 pt-10 pb-20 premium-gradient text-white rounded-b-[3rem] shadow-2xl shadow-blue-100">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h1 className="text-lg font-bold opacity-80">Dashboard</h1>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold uppercase">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                Online
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold uppercase">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                Offline
              </div>
            )}
            {isSyncing && (
              <RefreshCw size={14} className="animate-spin opacity-80" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium opacity-80">Total Balance</p>
          <h2 className="text-4xl font-black tracking-tight leading-none">
            {formatCurrency(data?.total_balance || 0)}
          </h2>
        </div>
      </header>

      <div className="px-6 -mt-12 space-y-8 animate-slide-up">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] card-shadow border border-slate-50 flex flex-col justify-between h-32">
            <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
              <ArrowDownLeft size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Income</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(data?.monthly_summary?.income || 0)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[2rem] card-shadow border border-slate-50 flex flex-col justify-between h-32">
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expenses</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(data?.monthly_summary?.expense || 0)}</p>
            </div>
          </div>
        </div>

        {/* Accounts Selection */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-lg font-black text-slate-900 leading-none">My Accounts</h3>
            <Link href="/accounts" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2 scrollbar-hide">
            {data?.accounts?.map((account) => (
              <div
                key={account.id}
                className="flex-shrink-0 w-44 bg-white p-5 rounded-[2.2rem] card-shadow border border-slate-50 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className={`p-2.5 rounded-2xl ${account.type === 'bank' ? 'bg-blue-50 text-blue-600' :
                    account.type === 'mobile' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                    {account.type === 'bank' ? <CreditCard size={18} /> : <Wallet size={18} />}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{account.name}</p>
                  <p className="text-base font-black text-slate-800 truncate">{formatCurrency(account.balance)}</p>
                </div>
              </div>
            ))}
            {data?.accounts?.length === 0 && (
              <div className="flex-shrink-0 w-full p-8 text-center bg-white rounded-[2.2rem] border-2 border-dashed border-slate-100 text-slate-300 text-xs font-bold">
                No accounts found.
              </div>
            )}
          </div>
        </section>

        {/* Category Spending Breakdown */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-lg font-black text-slate-900 leading-none">Spending</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">This Month</p>
          </div>
          <div className="bg-white rounded-[2.5rem] card-shadow border border-slate-50 p-6 space-y-4">
            {(data?.category_breakdown ?? []).map((item, idx) => {
              const maxTotal = Math.max(...(data?.category_breakdown?.map((i) => i.total) ?? [1]), 1);
              const percentage = (item.total / maxTotal) * 100;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-700">{item.category_name}</span>
                    <span className="text-xs font-black text-slate-900">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(data?.category_breakdown?.length ?? 0) === 0 && (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm font-medium">No expenses recorded yet.</p>
              </div>
            )}
            {(data?.category_breakdown?.length ?? 0) > 0 && (
              <Link
                href="/transactions"
                className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-300 uppercase tracking-widest pt-4 border-t border-slate-50 hover:text-blue-600 transition-colors"
              >
                Full History <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </section>
      </div>

      <Navbar />
    </div>
  );
}
