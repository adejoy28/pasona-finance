'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Enhanced Error Message Component
 * 
 * Provides a clear, actionable error state for the user.
 */
export function ErrorMessage({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void; 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-slide-up">
      <div className="w-16 h-16 rounded-[2rem] bg-red-50 text-red-500 flex items-center justify-center shadow-lg shadow-red-100">
        <AlertCircle size={32} />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-900">Oops! Something went wrong</h3>
        <p className="text-sm font-medium text-slate-500 max-w-[200px] mx-auto">
          {message || 'We couldn\'t load your data right now.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:scale-[1.05] transition-all active:scale-95"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}
