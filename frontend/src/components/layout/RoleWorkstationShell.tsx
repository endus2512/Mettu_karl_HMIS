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
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            {lang === 'om'
              ? "Mettu Karl HIS • Wiirtuu Hojii Fe'aa Jira..."
              : lang === 'am'
              ? 'መቱ ካርል ሆስፒታል • የስራ ክፍሉን በመጫን ላይ...'
              : 'Mettu Karl HIS • Loading Dedicated Workstation...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#0b0f17]" />;
  }

  return (
    <div className={`flex min-h-screen text-white transition-colors duration-300 ${isZenMode ? 'bg-[#080d16]' : 'bg-[#0b0f17]'}`}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className={`flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto transition-all duration-300 ${isZenMode ? 'selection:bg-teal-500/30' : ''}`}>
          {/* Executive Supervisory Inspection Banner */}
          {isInspectingAsAdmin && (
            <div className="bg-gradient-to-r from-amber-500/20 via-[#161f30] to-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {lang === 'om' ? "To'annoo Hoggansaa (Executive Oversight Active)" : "Executive Supervisor Oversight Active"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                      SUPERVISOR MODE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {lang === 'om'
                      ? `Akka Hospitaala Daarektaraatti wiirtuu hojii ${workstationRoleName} daawwachaa fi to'achaa jirta.`
                      : `You are supervising the ${workstationRoleName} operational portal with administrative authority.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/portal/admin"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
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
