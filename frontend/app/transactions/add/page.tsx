'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { db, type OfflineTransaction } from '@/lib/db';
import { Navbar } from '@/components/Navbar';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { AlertCircle, ArrowLeft, Check, ChevronDown } from 'lucide-react';

type Account = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'transfer' | string;
};

/**
 * Enhanced Add Transaction Page
 * 
 * Modern, card-based entry form with polished inputs and animations.
 */
export default function AddTransaction() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useOfflineSync();
  const router = useRouter();

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const fetchMetadata = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories'),
      ]);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      if (accRes.data.length > 0) setAccountId(accRes.data[0].id.toString());
    } catch {
      console.error('Failed to load metadata');
      setError('Connection failed. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchMetadata();
    };

    void initialize();
  }, []);

  const handleSave = async (force = false) => {
    if (!amount || !accountId) {
      setError('Please enter an amount and select an account');
      return;
    }

    const transactionData: Omit<OfflineTransaction, 'id' | 'created_at'> = {
      account_id: parseInt(accountId),
      to_account_id: toAccountId ? parseInt(toAccountId) : undefined,
      type,
      category_id: categoryId ? parseInt(categoryId) : undefined,
      amount: parseFloat(amount),
      description,
      transaction_date: date,
    };

    if (isOnline) {
      try {
        await api.post('/transactions', { ...transactionData, force });
        router.push('/dashboard');
      } catch (error: unknown) {
        const errResponse = error as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        if (errResponse.response?.status === 409) {
          setDuplicateWarning(true);
        } else {
          setError(errResponse.response?.data?.message || 'Failed to save transaction');
        }
      }
    } else {
      try {
        await db.transactions.add({ ...transactionData, created_at: Date.now() });
        router.push('/dashboard');
      } catch {
        setError('Storage error');
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-400">
      <RefreshCw size={32} className="animate-spin text-blue-500 mb-2" />
      <p className="text-xs font-bold tracking-widest uppercase">Preparing Form...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="px-6 py-8 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Add Transaction</h2>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="p-6 space-y-6 animate-slide-up">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {duplicateWarning && (
          <div className="bg-white p-6 rounded-4xl card-shadow border border-amber-100 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle size={20} />
              <p className="font-black text-sm uppercase tracking-tight">Possible Duplicate</p>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">This looks like a transaction you already logged. Do you want to save it anyway?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleSave(true)}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs"
              >
                Yes, Save
              </button>
              <button
                onClick={() => setDuplicateWarning(false)}
                className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Amount Section */}
        <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-50 space-y-4 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enter Amount</p>
          <div className="relative inline-block w-full">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₦</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full text-center text-5xl font-black text-slate-900 bg-transparent outline-none placeholder:text-slate-100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Type Selector */}
        <div className="flex bg-white p-1.5 rounded-3xl card-shadow border border-slate-50">
          {(['expense', 'income', 'transfer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${type === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Transaction Details Form */}
        <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-50 space-y-6">
          {/* Account Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <div className="relative">
              <select
                className="w-full p-4.5 appearance-none rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Target Account (Transfers) */}
          {type === 'transfer' && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">To Account</label>
              <div className="relative">
                <select
                  className="w-full p-4.5 appearance-none rounded-2xl bg-blue-50/50 border border-blue-100 outline-none text-sm font-bold text-blue-900"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                >
                  <option value="">Select Destination</option>
                  {accounts.filter(a => a.id.toString() !== accountId).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
              </div>
            </div>
          )}

          {/* Category Selector */}
          {type !== 'transfer' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <div className="relative">
                <select
                  className="w-full p-4.5 appearance-none rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Uncategorized</option>
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>
          )}

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
              <input
                type="date"
                className="w-full p-4.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference</label>
              <input
                type="text"
                placeholder="Optional"
                className="w-full p-4.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800 placeholder:text-slate-200"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => handleSave()}
            className="w-full py-5 premium-gradient text-white rounded-2xl font-black text-base shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
          >
            <Check size={24} strokeWidth={3} />
            Complete
          </button>
        </div>
      </div>

      <Navbar />
    </div>
  );
}

// Minimal CSS helper for RefreshCw
const RefreshCw = ({ size, className }: { size: number, className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);
