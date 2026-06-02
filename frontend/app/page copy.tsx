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
    }, 800); // Small delay for "ease" and splash feel
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-6">
      <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 animate-bounce">
        <RefreshCw size={40} />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Pasona.</h1>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Loading your world</p>
      </div>
    </div>
  );
}
