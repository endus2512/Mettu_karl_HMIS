'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { resolveClinicalRouteAccess } from '@/lib/roleRoutes';

export default function ClinicalRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const rule = resolveClinicalRouteAccess(pathname);

  return (
    <ProtectedRoute
      allowedRoles={[...rule.allowedRoles]}
      moduleName={rule.moduleName}
      category={rule.category}
    >
      {children}
    </ProtectedRoute>
  );
}
