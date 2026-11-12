/**
 * Mettu Karl Comprehensive Specialized Hospital
 * RoleWorkstationShell — Strict Role-Isolated Workstation Wrapper with Supervisor Oversight.
 *
 * Guarantees:
 * - Dedicated per-role workspace isolation: Staff only view their assigned tools.
 * - Executive Supervisory Authority: Admins/Directors can inspect any staff workstation with an active banner.
 * - Automatic unauthorized bounce: Non-admins trying to access other portals are returned to their own workstation.
 */
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import type { UserRole } from '@/types';
import { useZenMode } from '@/lib/zenMode';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageTransition } from '@/components/layout/PageTransition';
import { getRoleDisplayName, getRolePortalPath, isAdminRole, isRoleAllowed } from '@/lib/roleRoutes';
import { notifications } from '@mantine/notifications';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Eye,
  Sliders,
} from 'lucide-react';

interface RoleWorkstationShellProps {
  allowedRoles: UserRole[];
  workstationRoleName: string;
  children: React.ReactNode;
}

export function RoleWorkstationShell({
  allowedRoles,
  workstationRoleName,
  children,
}: RoleWorkstationShellProps): React.ReactElement {
  const { isAuthenticated, isLoading, user, activeRole } = useAuth();
  const { language } = useTranslation();
  const { isZenMode } = useZenMode();
  const router = useRouter();

  const lang = (language === 'om' || language === 'am' || language === 'en') ? language : 'en';
  const realRole = user?.role;
  const isSupervisor = isAdminRole(realRole);
  const adminOnlyPortal = allowedRoles.every((r) => isAdminRole(r));
  const effectiveRole: UserRole = (isSupervisor ? activeRole : realRole) || 'patient';

  const isAuthorized = Boolean(
    isAuthenticated &&
      user &&
      realRole &&
      (adminOnlyPortal ? isSupervisor : isRoleAllowed(realRole, allowedRoles) || isSupervisor),
  );
  const isInspectingAsAdmin = Boolean(
    isSupervisor && !adminOnlyPortal && realRole && !isRoleAllowed(realRole, allowedRoles),
  );

  // Auth & RBAC Guard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
        return;
      }

      if (!isAuthorized) {
        notifications.show({
          title: lang === 'om' ? 'Qajeelfama Nageenyaa' : lang === 'am' ? 'የደህንነት ማስጠንቀቂያ' : 'Access Restricted',
          message:
            lang === 'om'
              ? 'Wiirtuun kun qooda keessaniin aladha. Gara wiirtuu hojii keessaniitti qajeeltaniittu.'
              : 'This workstation is restricted to assigned personnel. Returning to your dedicated portal.',
          color: 'amber',
          icon: <ShieldAlert className="w-4 h-4" />,
        });
        router.replace(getRolePortalPath(realRole));
      }
    }
  }, [isLoading, isAuthenticated, user, isAuthorized, realRole, router, lang]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50/70 to-indigo-50/60 dark:from-[#080d17] dark:via-[#0d1526] dark:to-[#09101d]" />
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50/70 to-indigo-50/60 dark:from-[#080d17] dark:via-[#0d1526] dark:to-[#09101d]" />
    );
  }

  return (
    <div
      className={`flex min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 ${
        isZenMode
          ? 'bg-gradient-to-br from-slate-100 via-sky-50/50 to-teal-50/40 dark:from-[#060a12] dark:via-[#0a1220] dark:to-[#070d18]'
          : 'bg-gradient-to-br from-slate-100 via-sky-50/70 to-indigo-50/50 dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#09101f]'
      }`}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className={`flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto transition-all duration-300 ${isZenMode ? 'selection:bg-teal-500/30' : ''}`}>
          {/* Executive Supervisory Inspection Banner */}
          {isInspectingAsAdmin && (
            <div className="bg-gradient-to-r from-amber-100/90 via-white/90 to-sky-50/90 dark:from-amber-500/20 dark:via-[#161f30] dark:to-amber-500/10 backdrop-blur-md border-2 border-amber-400/70 dark:border-amber-500/45 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {lang === 'om' ? "To'annoo Hoggansaa (Executive Oversight Active)" : "Executive Supervisor Oversight Active"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border border-amber-400/60 font-extrabold uppercase">
                      SUPERVISOR MODE
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                    {lang === 'om'
                      ? `Akka Hospitaala Daarektaraatti wiirtuu hojii ${workstationRoleName} daawwachaa fi to'achaa jirta.`
                      : `You are supervising the ${workstationRoleName} operational portal with administrative authority.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/portal/admin"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition-all hover:scale-[1.03] active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'om' ? 'Gara Command Center' : 'Command Center'}</span>
                </Link>
              </div>
            </div>
          )}

          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
