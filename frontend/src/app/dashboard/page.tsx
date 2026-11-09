/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Smart Workstation Traffic Controller (/dashboard).
 *
 * Automatically resolves the authenticated user's role and redirects them
 * to their dedicated, isolated operational portal:
 * - Doctor: /portal/doctor
 * - Nurse: /portal/nurse
 * - Pharmacist: /portal/pharmacy
 * - Lab Technician: /portal/lab
 * - Billing & Cashier: /portal/billing
 * - Receptionist: /portal/reception
 * - Executive Administrator: /portal/admin
 * - Patient: /patient-portal
 */
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { getRolePortalPath, getRoleDisplayName } from '@/lib/roleRoutes';
import type { UserRole } from '@/types';

export default function DashboardSmartRouterPage(): React.ReactElement {
  const { isAuthenticated, isLoading, user, activeRole, simulatedRole } = useAuth();
  const { language } = useTranslation();
  const router = useRouter();

  const lang = (language === 'om' || language === 'am' || language === 'en') ? language : 'en';
  const effectiveRole: UserRole = activeRole || user?.role || 'doctor';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !simulatedRole) {
        router.replace('/login');
        return;
      }

      const targetPortal = getRolePortalPath(effectiveRole);
      router.replace(targetPortal);
    }
  }, [isLoading, isAuthenticated, simulatedRole, effectiveRole, router]);

  const roleName = getRoleDisplayName(effectiveRole, lang);

  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">
            {lang === 'om'
              ? 'Gara Wiirtuu Hojii Dhuunfaa Keessaniitti Qajeelaa Jira...'
              : lang === 'am'
              ? 'ወደ እርስዎ የስራ ክፍል በመሄድ ላይ...'
              : 'Launching Your Dedicated Workstation...'}
          </h2>
          <p className="text-xs text-amber-300 font-medium mt-1">
            {roleName}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            {lang === 'om'
              ? 'Sirni kun qajeelatti gara poortaalii hojii dhuunfaa keessaniitti isin dabarsa.'
              : 'Redirecting to your isolated role-dedicated workspace.'}
          </p>
        </div>
      </div>
    </div>
  );
}
