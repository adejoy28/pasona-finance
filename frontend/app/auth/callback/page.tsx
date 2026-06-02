'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      const authToken = token;
      async function handleAuth() {
        try {
          await login(authToken);
          router.push('/dashboard');
        } catch (error) {
          console.error('Authentication failed:', error);
          router.push('/login?error=auth_failed');
        }
      }
      handleAuth();
    } else {
      router.push('/login?error=no_token');
    }
  }, [router, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#0a0a0f' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p style={{
          fontFamily: 'Geist, system-ui, sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
