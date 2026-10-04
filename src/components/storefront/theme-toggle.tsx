'use client';

import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="border border-concrete/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-concrete transition-colors hover:border-bone hover:text-bone"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
