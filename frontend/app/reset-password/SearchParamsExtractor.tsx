'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Component that extracts search parameters and provides them to parent
 */
export function SearchParamsExtractor({
  onTokenChange,
  onEmailChange,
}: {
  onTokenChange: (token: string | null) => void;
  onEmailChange: (email: string | null) => void;
}) {
  const searchParams = useSearchParams();

  // Extract and set token and email from search params
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Call parent callbacks on mount
  useEffect(() => {
    onTokenChange(token);
    onEmailChange(email);
  }, [token, email, onTokenChange, onEmailChange]);

  return null;
}

