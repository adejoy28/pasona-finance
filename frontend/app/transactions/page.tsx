'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { Trash2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, ReceiptText } from 'lucide-react';

import { Skeleton } from '@/components/Skeleton';
import { ErrorMessage } from '@/components/ErrorMessage';

/**
 * Enhanced Transactions List Page
 * 
 * Shows a paginated list of all transactions with polished styling,
 * skeleton loading, and actionable error states.
 */
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setError(false);
    setLoading(true);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowDownLeft className="text-green-500" />;
      case 'expense': return <ArrowUpRight className="text-red-500" />;
      default: return <ArrowRightLeft className="text-blue-500" />;
    }
  };

  if (loading) return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">History</h2>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <ErrorMessage message="Failed to load your history." onRetry={fetchTransactions} />
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-slide-up">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">History</h2>

      <div className="space-y-4">
        {transactions.map((t) => (
          <div 
            key={t.id} 
            className={cn(
              "bg-white p-5 rounded-[2rem] card-shadow border-l-[6px] flex items-center justify-between group transition-all hover:scale-[1.01]",
              t.type === 'income' ? 'border-l-green-500' : t.type === 'expense' ? 'border-l-red-500' : 'border-l-blue-500'
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl",
                t.type === 'income' ? 'bg-green-50 text-green-600' : t.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              )}>
                {getIcon(t.type)}
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">{t.description || t.category?.name || 'Unlabeled'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.transaction_date}</p>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[80px]">{t.account?.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-right">
              <p className={cn(
                "font-black text-sm",
                t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : 'text-blue-600'
              )}>
                {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}{formatCurrency(t.amount)}
              </p>
              <button 
                onClick={() => handleDelete(t.id)} 
                className="p-2 text-slate-100 group-hover:text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <ReceiptText size={48} className="mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">No activity yet</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
}
