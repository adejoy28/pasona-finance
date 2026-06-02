'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Wrapper component that handles OAuth callback parameters
 */
export function SearchParamsHandler() {
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

  return null; // This component doesn't render anything
}
