import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from "@/lib/finance";

const PRIVACY_MODE_KEY = 'pasona_privacy_mode_default';

let globalIsPrivacyMode = localStorage.getItem(PRIVACY_MODE_KEY) === 'true';
let globalIsRevealed = !globalIsPrivacyMode;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function usePrivacyMode() {
  const [state, setState] = useState({
    isPrivacyModeEnabled: globalIsPrivacyMode,
    isRevealed: globalIsRevealed,
  });

  useEffect(() => {
    const listener = () => {
      setState({
        isPrivacyModeEnabled: globalIsPrivacyMode,
        isRevealed: globalIsRevealed,
      });
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setPrivacyMode = useCallback((enabled: boolean) => {
    globalIsPrivacyMode = enabled;
    if (enabled) {
      localStorage.setItem(PRIVACY_MODE_KEY, 'true');
      globalIsRevealed = false;
    } else {
      localStorage.removeItem(PRIVACY_MODE_KEY);
      globalIsRevealed = true;
    }
    notify();
  }, []);

  const toggleReveal = useCallback(() => {
    globalIsRevealed = !globalIsRevealed;
    notify();
  }, []);

  const renderAmount = useCallback(
    (amount: number | string | null | undefined, currency: string) => {
      if (!state.isRevealed) {
        return "****";
      }
      const num = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
      return formatCurrency(num, currency);
    },
    [state.isRevealed]
  );

  return {
    isPrivacyModeEnabled: state.isPrivacyModeEnabled,
    setPrivacyMode,
    isRevealed: state.isRevealed,
    isMasked: !state.isRevealed,
    toggleReveal,
    renderAmount,
  };
}
