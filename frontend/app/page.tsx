'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { RefreshCw } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setTimeout(() => {
      if (token) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 800);
  }, [router]);

  return (
    <div className="page-shell">
      <div className="w-24 h-24 rounded-4xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-[0_30px_75px_-30px_rgba(59,130,246,0.75)] flex items-center justify-center text-white">
        <RefreshCw size={36} className="animate-spin" />
      </div>

      <div className="text-center space-y-3">
        <h1 className="section-heading text-white">Pasona.</h1>
        <p className="section-copy uppercase tracking-[0.35em] text-slate-400">Loading your world</p>
      </div>
    </div>
  );
}
