'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

import { Skeleton } from '@/components/Skeleton';
import { ErrorMessage } from '@/components/ErrorMessage';

type Account = {
  id: number;
  name: string;
};

type PreviewRow = {
  transaction_date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | string;
  is_duplicate: boolean;
};

/**
 * Enhanced Bank Statement Import Page
 */
export default function ImportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
      if (res.data.length > 0) setAccountId(res.data[0].id.toString());
    } catch {
      setError('Connection failed.');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchAccounts();
    };

    void initialize();
  }, []);

  const handlePreview = async () => {
    if (!csvContent || !accountId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/import/preview', {
        csv_content: csvContent,
        account_id: parseInt(accountId),
      });
      setPreview(res.data);
      setStep('preview');
    } catch {
      setError('CSV parsing failed. Check format.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'input') return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );

  if (error && step === 'input') return (
    <div className="min-h-screen flex items-center justify-center">
      <ErrorMessage message={error} onRetry={fetchAccounts} />
    </div>
  );

  const handleImport = async () => {
    const toImport = preview.filter(p => !p.is_duplicate);
    if (toImport.length === 0) {
      alert('No new transactions to import.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/import/store', { transactions: toImport });
      alert('Import successful!');
      setStep('input');
      setCsvContent('');
      setPreview([]);
    } catch {
      alert('Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Bank Import</h2>

      {step === 'input' ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500">Select Account</label>
            <select
              className="w-full p-4 rounded-2xl border border-slate-200 bg-white"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500">Paste CSV Content</label>
            <textarea
              className="w-full h-64 p-4 rounded-2xl border border-slate-200 font-mono text-xs outline-none focus:border-blue-500"
              placeholder="Date,Description,Amount,Dr/Cr&#10;2026-05-20,Groceries,5000,Dr&#10;2026-05-21,Salary,200000,Cr"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
            />
          </div>

          <button
            onClick={handlePreview}
            disabled={loading || !csvContent}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            {loading ? 'Processing...' : 'Preview Import'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Found <span className="font-bold text-slate-800">{preview.length}</span> rows
            </p>
            <button
              onClick={() => setStep('input')}
              className="text-xs font-bold text-blue-600"
            >
              Back to Input
            </button>
          </div>

          <div className="space-y-3">
            {preview.map((row, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${row.is_duplicate ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400">{row.transaction_date}</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{row.description}</p>
                  </div>
                  <p className={`font-bold ${row.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
                  </p>
                </div>
                {row.is_duplicate && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase">
                    <AlertCircle size={10} /> Potential Duplicate
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={loading || preview.every(p => p.is_duplicate)}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            {loading ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      )}

      <Navbar />
    </div>
  );
}
