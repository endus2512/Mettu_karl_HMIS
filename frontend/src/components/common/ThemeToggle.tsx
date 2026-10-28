/**
 * Single Interchangeable Light / Dark Mode Theme Toggle Button.
 *
 * Designed with clinical ergonomics:
 * - Single button switching between Sun (Light) and Moon (Dark).
 * - Persists choice to localStorage ('theme': 'dark' | 'light').
 * - Updates documentElement.classList ('dark') and data-mantine-color-scheme.
 * - Broadcasts 'theme-change' custom event to keep all open components in sync.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  variant?: 'cockpit' | 'glass' | 'minimal';
  className?: string;
}

export function ThemeToggle({ variant = 'cockpit', className = '' }: ThemeToggleProps): React.ReactElement {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync with current DOM state & localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    }

    // Listen to theme-change event from other tabs/toggles
    const handleThemeChange = () => {
      const isNowDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isNowDark);
    };

    window.addEventListener('theme-change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);

    if (typeof window !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
        localStorage.setItem('theme', 'light');
      }
      window.dispatchEvent(new Event('theme-change'));
    }
  };

  // Base styling depending on variant
  const getButtonStyles = () => {
    if (variant === 'glass') {
      return 'flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-white/25 bg-white/20 hover:bg-white/30 text-white shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95';
    }
    if (variant === 'minimal') {
      return 'flex items-center justify-center w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs hover:border-blue-400 transition-all cursor-pointer hover:scale-105 active:scale-95';
    }
    // Default cockpit style for header cockpits
    return 'flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl border border-slate-700/90 bg-slate-800/90 hover:bg-slate-700 text-white shadow-xs backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shrink-0';
  };

  if (!mounted) {
    // Avoid hydration mismatch by rendering placeholder with matching size
    return (
      <div className={`w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-slate-800/50 ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${getButtonStyles()} ${className}`}
      title={isDarkMode ? 'Gara Ifaatti Jijjiiri (Switch to Light Mode)' : 'Gara Dukkanaatti Jijjiiri (Switch to Dark Mode)'}
      aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-sky-200 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
