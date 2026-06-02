'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { Plus, CreditCard, Smartphone, Wallet, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';

import { Skeleton } from '@/components/Skeleton';
import { ErrorMessage } from '@/components/ErrorMessage';

/**
 * Enhanced Accounts Management Page
 * 
 * Create and list bank, mobile money, and cash accounts with
 * polished states and skeleton loaders.
 */
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setError(false);
    setLoading(true);
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounts', {
        name,
        type,
        starting_balance: parseFloat(balance || '0'),
      });
      setShowAdd(false);
      setName('');
      setBalance('');
      fetchAccounts();
    } catch (err) {
      alert('Failed to add account');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? All transactions for this account will be deleted.')) return;
    try {
      await api.delete(`/accounts/${id}`);
      fetchAccounts();
    } catch (err) {
      alert('Failed to delete account');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank': return <CreditCard className="text-blue-600" />;
      case 'mobile': return <Smartphone className="text-purple-600" />;
      default: return <Wallet className="text-amber-600" />;
    }
  };

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Accounts</h2>
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <ErrorMessage message="We couldn't retrieve your accounts." onRetry={fetchAccounts} />
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-slide-up">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Accounts</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={cn(
            "p-3 rounded-2xl shadow-lg transition-all active:scale-95",
            showAdd ? "bg-slate-900 text-white" : "bg-blue-600 text-white shadow-blue-100"
          )}
        >
          {showAdd ? <ArrowLeft size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-[2.5rem] card-shadow border border-blue-50 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
              <input
                type="text"
                placeholder="e.g. Zenith Savings"
                required
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
              <select
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="bank">Bank Account</option>
                <option value="mobile">Mobile Money</option>
                <option value="cash">Physical Cash</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Starting Balance</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-4 premium-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100"
          >
            Create Account
          </button>
        </form>
      )}

      <div className="space-y-4">
        {accounts.map((account) => (
          <div 
            key={account.id} 
            className="relative bg-white p-6 rounded-[2.5rem] card-shadow border border-slate-50 overflow-hidden group"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3.5 rounded-2xl",
                  account.type === 'bank' ? 'bg-blue-50' : account.type === 'mobile' ? 'bg-purple-50' : 'bg-amber-50'
                )}>
                  {getIcon(account.type)}
                </div>
                <div>
                  <p className="font-black text-slate-900 leading-tight">{account.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{account.type}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(account.id)}
                className="p-2 text-slate-100 group-hover:text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="relative mt-6 pt-6 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Available Balance</p>
                <p className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(account.balance)}</p>
              </div>
              <ChevronRight size={20} className="text-slate-200" />
            </div>
          </div>
        ))}

        {accounts.length === 0 && !showAdd && (
          <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No accounts found</p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
}
