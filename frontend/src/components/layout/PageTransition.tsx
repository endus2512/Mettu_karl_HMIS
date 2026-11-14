/**
 * Mettu Karl Comprehensive Specialized Hospital
 * PageTransition — Fluid Route & Page Transition Wrapper.
 *
 * Automatically triggers smooth entrance animations on route change
 * using an Apple/Vercel-grade cubic-bezier easing curve without layout shift.
 */
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps): React.ReactElement {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className={`animate-route-transition w-full will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
