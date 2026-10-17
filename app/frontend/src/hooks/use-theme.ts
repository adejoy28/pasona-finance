import { useEffect, useState, useCallback } from "react";

export type Skin = "original" | "new";
export type Mode = "auto" | "light" | "dark";

export interface ThemeConfig {
  skin: Skin;
  mode: Mode;
}

const STORAGE_KEY = "pasona.theme";
const DEFAULT_THEME: ThemeConfig = {
  skin: "original",
  mode: "auto",
};

export function readStoredTheme(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw);
    const skin: Skin =
      parsed.skin === "new" || parsed.skin === "fresh" ? "new" : "original";
    let mode: Mode = "auto";
    if (parsed.mode === "light" || parsed.theme === "light") mode = "light";
    else if (parsed.mode === "dark" || parsed.theme === "dark") mode = "dark";
    else mode = "auto";
    return { skin, mode };
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyThemeToDom(theme: ThemeConfig): "light" | "dark" {
  if (typeof document === "undefined") return "light";

  const root = document.documentElement;
  const appRoot = document.getElementById("root");

  // Addendum B: data-skin on app root and on <html> for full-page coverage
  if (appRoot) {
    appRoot.setAttribute("data-skin", theme.skin);
  }
  root.setAttribute("data-skin", theme.skin);

  // Addendum B: data-theme on <html> (auto removes it)
  if (theme.mode === "auto") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme.mode);
  }

  // Backward compatibility alias for any lingering data-mode selectors
  root.setAttribute("data-mode", theme.mode === "auto" ? "system" : theme.mode);

  const isSystemDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark =
    theme.mode === "dark" || (theme.mode === "auto" && isSystemDark);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  return isDark ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeConfig>(readStoredTheme);
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(() =>
    applyThemeToDom(readStoredTheme())
  );

  const updateTheme = useCallback((update: Partial<ThemeConfig>) => {
    setThemeState((prev) => {
      const next: ThemeConfig = { ...prev, ...update };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Safe localStorage write fallback
      }
      const active = applyThemeToDom(next);
      setResolvedMode(active);
      window.dispatchEvent(new Event("pasona-theme-change"));
      return next;
    });
  }, []);

  const setSkin = useCallback(
    (skin: Skin) => updateTheme({ skin }),
    [updateTheme]
  );

  const setMode = useCallback(
    (mode: Mode) => updateTheme({ mode }),
    [updateTheme]
  );

  // Sync with system theme changes if mode is 'system'
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const current = readStoredTheme();
      if (current.mode === "system") {
        const active = applyThemeToDom(current);
        setResolvedMode(active);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  // Listen for changes from other tabs / components
  useEffect(() => {
    const handleSync = () => {
      const current = readStoredTheme();
      setThemeState(current);
      setResolvedMode(applyThemeToDom(current));
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("pasona-theme-change", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("pasona-theme-change", handleSync);
    };
  }, []);

  return {
    theme,
    skin: theme.skin,
    mode: theme.mode,
    resolvedMode,
    setSkin,
    setMode,
    updateTheme,
  };
}
