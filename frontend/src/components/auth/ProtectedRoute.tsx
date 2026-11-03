/**
 * Reusable Role-Based Access Control (RBAC) Protected Route Guard.
 * Enforces strict 403 Forbidden barriers when a user attempts unauthorized navigation.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/types';
import { ShieldAlert, AlertTriangle, User as UserIcon } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  moduleName?: string;
  category?: 'clinical' | 'financial' | 'administrative' | 'biomedical';
}

export function ProtectedRoute({
  children,
  allowedRoles,
  moduleName = 'Workstation',
  category = 'administrative',
}: ProtectedRouteProps): React.ReactElement {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
            Mettu Karl HIS • Eeyyama Qorachuu...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return <div />;
  }

  // Super admin and Hospital Administrator have full oversight and governance across all hospital workstations
  if (user.role === 'super_admin' || user.role === 'admin') {
    return <>{children}</>;
  }

  // Check if role is authorized
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleName = user.role.replace('_', ' ').toUpperCase();

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white select-none">
        <div className="w-full max-w-xl rounded-2xl border border-rose-500/50 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-md">
          {/* Security Shield Icon */}
          <div className="flex items-center gap-4 border-b border-rose-500/30 pb-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-400">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-950/60 px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-rose-300 mb-1">
                403 Forbidden • Security Access Barrier
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Gara Kutaa Kanaatti Seenuuf Eeyyama Hin Qabdan
              </h2>
            </div>
          </div>

          {/* Details Body */}
          <div className="py-6 space-y-4">
            <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Workstation Gaafatame:</span>
                <span className="font-semibold text-white">{moduleName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Gahee Keessan (Active Role):</span>
                <span className="font-mono text-xs font-semibold text-teal-400 bg-teal-950/70 border border-teal-600/40 px-2 py-0.5 rounded-md">
                  {roleName}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Roolii Eeyyamaman (Allowed Roles):</span>
                <span className="font-semibold text-amber-300 font-mono">
                  {allowedRoles.map((r) => r.replace('_', ' ').toUpperCase()).join(', ')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Imaammata nageenya odeeffannoo fi eegumsa iccitii Mettu Karl Referral Hospital tiin,
              ogeessi gahee <span className="font-semibold text-teal-300">{roleName}</span> qabu gara{' '}
              <span className="font-semibold text-white">{moduleName}</span> seenuuf heeyyama hin qabu.
            </p>

            {user.role === 'doctor' && (category === 'financial' || moduleName.toLowerCase().includes('account') || moduleName.toLowerCase().includes('billing')) && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-amber-300">Ogeessa Yaalaa (Doctor):</strong> Herrega baankii, kaffaltii fi faayinaansii hospitaalaa bulchuun ogeessota faayinaansii fi bulchiinsaa qofaaf hayyamama.
                </p>
              </div>
            )}

            {user.role === 'patient' && (
              <div className="flex items-start gap-2.5 rounded-xl border border-sky-500/40 bg-sky-950/40 p-3 text-xs text-sky-200">
                <UserIcon className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-sky-300">Dhukkubsataa (Patient):</strong> Kutaaleen kun ogeessota hospitaalaatiif qofa qophaa'an. Ragaa yaala keessanii, dabaree OPD fi kaffaltii ilaaluuf Patient Portal fayyadamaa.
                </p>
              </div>
            )}
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center gap-3 border-t border-slate-700/80 pt-6">
            <Link
              href={user.role === 'patient' ? '/patient-portal' : '/dashboard'}
              className="w-full sm:w-auto flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-center text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              {user.role === 'patient' ? '← Gara Patient Portal Deebi\'aa' : '← Gara Dashboard Deebi\'aa'}
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Gahee Jijjiiruuf Bahuu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
