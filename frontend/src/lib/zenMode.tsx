/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Zen Mode & Cognitive Calming State Provider (Filannoo 1 & 4).
 *
 * Zen Mode Principles:
 * - Active by default (Simplicity-First): Calms visual noise, softens border contrast.
 * - Distraction-Free: Primary action cards and active workflows take center stage.
 * - Progressive Disclosure: Deep metrics, complex raw logs, and secondary tables unfold on-demand.
 * - Persisted seamlessly in localStorage ('mkh_zen_mode').
 */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ZenModeContextType {
  isZenMode: boolean;
  toggleZenMode: () => void;
  setZenMode: (enabled: boolean) => void;
}

const ZenModeContext = createContext<ZenModeContextType>({
  isZenMode: true,
  toggleZenMode: () => {},
  setZenMode: () => {},
});

export function ZenModeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [isZenMode, setIsZenModeState] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mkh_zen_mode');
      if (stored !== null) {
        setIsZenModeState(stored === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleZenMode = useCallback(() => {
    setIsZenModeState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mkh_zen_mode', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setZenMode = useCallback((enabled: boolean) => {
    setIsZenModeState(enabled);
    try {
      localStorage.setItem('mkh_zen_mode', String(enabled));
    } catch {
      // ignore
    }
  }, []);

  return (
    <ZenModeContext.Provider value={{ isZenMode, toggleZenMode, setZenMode }}>
      {children}
    </ZenModeContext.Provider>
  );
}

export function useZenMode(): ZenModeContextType {
  return useContext(ZenModeContext);
}
