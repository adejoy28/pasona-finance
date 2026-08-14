import { useEffect, useState } from "react";
import { auth as authApi, type UserDto } from "@/lib/api";

/**
 * Hook to get the current user. Replaces the TanStack Query-based useMe().
 * Caches the result in memory so navigating between pages doesn't refetch.
 */

let cachedUser: UserDto | null = null;
let fetchPromise: Promise<UserDto> | null = null;

export function useMe() {
  const [data, setData] = useState<UserDto | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedUser) {
      setData(cachedUser);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        if (!fetchPromise) {
          fetchPromise = authApi.me();
        }
        const user = await fetchPromise;
        cachedUser = user;
        if (!cancelled) {
          setData(user);
          setIsLoading(false);
        }
      } catch (err) {
        fetchPromise = null;
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

/**
 * Invalidate the cached user, forcing the next useMe() mount to refetch.
 */
export function invalidateMe(): void {
  cachedUser = null;
  fetchPromise = null;
}
