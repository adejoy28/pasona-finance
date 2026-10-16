import { useState, useEffect, useCallback } from "react";

/**
 * Hook for persisting and retrieving namespaced entity metadata in localStorage.
 * Storage key format: `pasona.${namespace}:${id}`
 */
export function useLocalMeta<T>(
  namespace: string,
  id: number | string | null | undefined,
  defaultValue: T | null = null
): [T | null, (val: T) => void, () => void] {
  const key = id !== null && id !== undefined ? `pasona.${namespace}:${id}` : null;

  const readValue = useCallback((): T | null => {
    if (!key || typeof window === "undefined") return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const [meta, setMetaState] = useState<T | null>(readValue);

  useEffect(() => {
    setMetaState(readValue());
  }, [readValue]);

  const setMeta = useCallback(
    (val: T) => {
      if (!key || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, JSON.stringify(val));
        setMetaState(val);
      } catch (err) {
        console.error(`Failed to save metadata to ${key}`, err);
      }
    },
    [key]
  );

  const clearMeta = useCallback(() => {
    if (!key || typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
      setMetaState(defaultValue);
    } catch (err) {
      console.error(`Failed to clear metadata from ${key}`, err);
    }
  }, [key, defaultValue]);

  return [meta, setMeta, clearMeta];
}
