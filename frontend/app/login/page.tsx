'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Premium Dark Mode Login Page
 * 
 * Blends modern fintech functionality with luxury glassmorphic design.
 * Features email/password authentication and Google OAuth integration.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');
    if (token && user) {
      localStorage.setItem('auth_token', token);
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { email, password });
      localStorage.setItem('auth_token', response.data.access_token);
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/auth/google');
      window.location.href = response.data.url;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      {/* Background texture - animated gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)`,
        }}
      />

      {/* Grid lines - subtle */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top bar with logo */}
      <header className="relative z-10 px-6 pt-14 pb-0 flex items-center gap-3">
        <div
          className="w-8 h-8 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
          }}
        >
          <span style={{ color: 'white', fontSize: '16px', lineHeight: 1, fontFamily: 'Georgia, serif' }}>₦</span>
        </div>
        <span
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '18px',
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          Pasona
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-12">

        {/* Hero text section */}
        <div className="mb-12">
          <div className="badge-pill mb-6 bg-white/10 border-white/15 text-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.45)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-200">Smart Finance</span>
          </div>

          <h2 className="section-heading text-white leading-tight mb-3">
            Sign in to<br />
            <span className="text-gradient">your account.</span>
          </h2>

          <p className="section-copy text-slate-300">
            Track income, expenses, and account balances — all in one secure place.
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-3xl p-8 space-y-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error message */}
            {error && (
              <div
                className="p-3 text-sm rounded-2xl flex items-center gap-2 border"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Email input */}
            <div className="space-y-2">
              <label
                style={{
                  fontFamily: 'Geist, system-ui, sans-serif',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                  size={18}
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="form-field pl-12 bg-slate-950/90 text-white border-white/10 placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label
                style={{
                  fontFamily: 'Geist, system-ui, sans-serif',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                  size={18}
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-field pl-12 bg-slate-950/90 text-white border-white/10 placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: loading
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            }}
          />

          {/* Google login button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl relative overflow-hidden transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span style={{ fontFamily: 'Geist, system-ui, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* Terms text */}
          <p
            style={{
              fontFamily: 'Geist, system-ui, sans-serif',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.25)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            By continuing, you agree to our Terms of Service<br />and Privacy Policy.
          </p>
        </div>

        {/* Bottom links */}
        <div className="mt-8 text-center space-y-3">
          <Link
            href="/forgot-password"
            style={{
              fontFamily: 'Geist, system-ui, sans-serif',
              fontSize: '12px',
              color: 'rgba(99,102,241,0.8)',
              textDecoration: 'none',
            }}
            className="block hover:opacity-100 transition-opacity"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(99,102,241,1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(99,102,241,0.8)')}
          >
            Forgot your password?
          </Link>
          <p
            style={{
              fontFamily: 'Geist, system-ui, sans-serif',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              style={{
                color: 'rgba(99,102,241,0.9)',
                textDecoration: 'none',
              }}
              className="font-semibold hover:opacity-80 transition-opacity"
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(99,102,241,1)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(99,102,241,0.9)')}
            >
              Register now
            </Link>
          </p>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
        
        input::placeholder {
          color: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}