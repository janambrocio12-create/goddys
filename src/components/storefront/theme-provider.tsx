'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'goddys-theme';

/**
 * Storefront-only light/dark toggle. Renders the themed root div itself
 * (data-theme="dark" | "light") so every bg-ink/text-bone/etc class inside
 * it resolves against the right CSS variables - see globals.css. The admin
 * panel never mounts this provider, so it's always on the dark default.
 *
 * Defaults to dark (the brand default) on first paint, then syncs from
 * localStorage after mount - a returning visitor who picked light sees a
 * brief flash of dark before it switches, which we accept as a fair
 * trade-off for not needing a blocking inline script just for this.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      }
    } catch {
      // Storage unavailable - just stick with the dark default.
    }
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage full or unavailable - the choice just won't persist.
      }
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        data-theme={theme}
        className="flex min-h-screen flex-col bg-ink text-bone transition-colors duration-300"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
