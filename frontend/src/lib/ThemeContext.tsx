"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "violet" | "sunset" | "ocean" | "mint";

export const THEMES: Theme[] = ["violet", "sunset", "ocean", "mint"];

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const STORAGE_KEY = "toonymous-theme";

// Inline script in layout.tsx already stamps data-theme on <html> before
// paint (no flash); this just keeps React state and the DOM attribute in
// sync once the app hydrates, and persists explicit choices. Light-only:
// "violet" is the default accent theme, not a color-scheme fallback.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("violet");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    // Syncing React state to the DOM attribute the pre-hydration inline script set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (current && (THEMES as string[]).includes(current)) setThemeState(current as Theme);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing / storage disabled - theme just won't persist.
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Runs synchronously in <head> before hydration so the first paint already
// has the right theme (no flash of the wrong accent palette).
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var valid = ${JSON.stringify(THEMES)};
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = valid.indexOf(stored) !== -1 ? stored : 'violet';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;
