'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * RootTemplate — App Router Global Route Transition Wrapper.
 *
 * Provides smooth glassmorphic blur-dissolve, opacity, and scale transitions
 * whenever navigating between any page or dashboard across the application.
 */
export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="animate-route-transition w-full max-w-full overflow-x-hidden min-h-screen"
    >
      {children}
    </div>
  );
}
