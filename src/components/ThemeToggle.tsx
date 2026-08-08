'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'zephryx-theme';

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private/blocked storage — theme just won't persist across visits.
  }
}

/**
 * Sun/moon toggle. The inline script in layout.tsx already sets data-theme
 * on <html> before paint (avoiding a flash of the wrong theme); this just
 * mirrors that into state on mount and flips it on click.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  if (theme === null) {
    // Pre-hydration: render an inert placeholder rather than guess the icon.
    return <span className={`inline-block h-9 w-9 border border-line ${className}`} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`flex h-9 w-9 items-center justify-center border border-line text-ink-dim transition-colors duration-300 hover:border-red-deep/60 hover:text-red-blood ${className}`}
    >
      {theme === 'light' ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <path
            d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
