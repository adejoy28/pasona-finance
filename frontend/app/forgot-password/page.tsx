'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset link.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/forgot-password', { email });
      setMessage(response.data.message || 'Password reset link sent to your email!');
    } catch (err: unknown) {
      const errorResponse = err as {
        response?: {
          data?: {
            email?: string[];
            message?: string;
          };
        };
      };

      setError(
        errorResponse.response?.data?.email?.[0] ??
        errorResponse.response?.data?.message ??
        'Failed to send reset link. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-slate-50">
      <div className="w-full max-w-sm space-y-8 animate-slide-up">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to Login
          </Link>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Forgot Password?
          </h1>
          <p className="text-slate-500 font-medium">Enter your email to receive a reset link</p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-100 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl flex items-center gap-2 border border-red-100">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            {message && (
              <div className="p-4 text-sm text-green-600 bg-green-50 rounded-2xl flex items-center gap-2 border border-green-100">
                <Mail size={18} />
                {message}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none input-focus text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 premium-gradient text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <>
                  <Mail size={20} />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
