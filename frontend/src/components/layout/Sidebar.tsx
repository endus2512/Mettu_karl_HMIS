/**
 * Navigation sidebar for clinical, enterprise ERP, specialized niche/IoMT,
 * and national regulations / resilience modules.
 *
 * User Request: All sidebar text in pure crisp white, with responsive
 * rectangular spotlight highlighting on hover across all navigation items.
 */
'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/types';

interface NavItem {
  key: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  allowedRoles?: UserRole[];
}

const clinicalItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: '📊' },
  { key: 'patients', href: '/patients', icon: '👥', badge: 'FHIR', badgeColor: 'bg-teal-500/30 text-white border border-teal-400/50', allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'] },
  { key: 'queue_system', href: '/queue', icon: '🎫', badge: 'TV', badgeColor: 'bg-amber-500/30 text-white border border-amber-400/50', allowedRoles: ['doctor', 'nurse', 'receptionist', 'super_admin'] },
  { key: 'billing', href: '/billing', icon: '💳', allowedRoles: ['billing', 'insurance_officer', 'admin', 'super_admin'] },
  { key: 'pharmacy', href: '/pharmacy', icon: '💊', allowedRoles: ['pharmacist', 'doctor', 'super_admin'] },
  { key: 'telemedicine', href: '/telemed', icon: '🩺', allowedRoles: ['doctor', 'super_admin'] },
  { key: 'executive_bi', href: '/analytics', icon: '📈', allowedRoles: ['admin', 'doctor', 'super_admin'] },
];

const erpItems: NavItem[] = [
  { key: 'hrm', href: '/hrm', icon: '👔', allowedRoles: ['admin', 'super_admin'] },
  { key: 'assets', href: '/assets', icon: '🔬', allowedRoles: ['technician', 'admin', 'super_admin'] },
  { key: 'ot_cssd', href: '/ot', icon: '🔪', allowedRoles: ['doctor', 'nurse', 'super_admin'] },
  { key: 'pacs', href: '/pacs', icon: '🩻', allowedRoles: ['doctor', 'technician', 'super_admin'] },
  { key: 'accounting', href: '/accounting', icon: '📑', allowedRoles: ['billing', 'admin', 'super_admin'] },
];

const specializedItems: NavItem[] = [
  { key: 'blood_bank', href: '/blood-bank', icon: '🩸', allowedRoles: ['doctor', 'nurse', 'technician', 'super_admin'] },
  { key: 'ems_dispatch', href: '/ems', icon: '🚑', badge: '907', badgeColor: 'bg-rose-500/30 text-white border border-rose-400/50', allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'] },
  { key: 'iomt_telemetry', href: '/iomt', icon: '📡', allowedRoles: ['doctor', 'nurse', 'technician', 'super_admin'] },
  { key: 'dietary_kitchen', href: '/dietary', icon: '🍲', allowedRoles: ['nurse', 'admin', 'super_admin'] },
  { key: 'mortuary', href: '/mortuary', icon: '⚰️', allowedRoles: ['doctor', 'admin', 'super_admin'] },
  { key: 'patient_crm', href: '/crm', icon: '🤝', allowedRoles: ['admin', 'insurance_officer', 'super_admin'] },
  { key: 'academic_research', href: '/academic', icon: '🎓', allowedRoles: ['doctor', 'admin', 'super_admin'] },
  { key: 'waste_management', href: '/waste', icon: '☣️', allowedRoles: ['technician', 'admin', 'super_admin'] },
  { key: 'procurement_tenders', href: '/procurement', icon: '📦', allowedRoles: ['admin', 'pharmacist', 'super_admin'] },
];

const resilienceItems: NavItem[] = [
  { key: 'national_id_fayda', href: '/fayda', icon: '🆔', badge: 'FIN', badgeColor: 'bg-emerald-500/30 text-white border border-emerald-400/50', allowedRoles: ['insurance_officer', 'admin', 'receptionist', 'super_admin'] },
  { key: 'efda_compliance', href: '/efda', icon: '⚖️', allowedRoles: ['pharmacist', 'admin', 'super_admin'] },
  { key: 'mci_disaster_triage', href: '/mci', icon: '🚨', badge: 'START', badgeColor: 'bg-rose-500/30 text-white border border-rose-400/50', allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'] },
  { key: 'infection_epidemiology', href: '/infection', icon: '🧫', allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'] },
  { key: 'insurance_claims', href: '/insurance', icon: '🧾', allowedRoles: ['insurance_officer', 'admin', 'billing', 'super_admin'] },
  { key: 'clinical_audit_ehstg', href: '/audit', icon: '📋', allowedRoles: ['admin', 'doctor', 'super_admin'] },
  { key: 'power_resilience', href: '/power', icon: '⚡', allowedRoles: ['technician', 'admin', 'super_admin'] },
  { key: 'sms_ussd_gateway', href: '/sms-ussd', icon: '📱', badge: '*907#', badgeColor: 'bg-emerald-500/30 text-white border border-emerald-400/50', allowedRoles: ['doctor', 'nurse', 'receptionist', 'billing', 'pharmacist', 'admin', 'super_admin'] },
  { key: 'barcode_qr_scanner', href: '/scanner', icon: '📷', badge: 'GS1/QR', badgeColor: 'bg-teal-500/30 text-white border border-teal-400/50', allowedRoles: ['doctor', 'nurse', 'pharmacist', 'billing', 'technician', 'admin', 'super_admin'] },
];

export function Sidebar(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useAuth();

  const filterByRole = (items: NavItem[]): NavItem[] => {
    if (!user?.role || user.role === 'super_admin') return items;
    return items.filter((item) => !item.allowedRoles || item.allowedRoles.includes(user.role));
  };

  const filteredClinical = useMemo(() => filterByRole(clinicalItems), [user?.role]);
  const filteredErp = useMemo(() => filterByRole(erpItems), [user?.role]);
  const filteredSpecialized = useMemo(() => filterByRole(specializedItems), [user?.role]);
  const filteredResilience = useMemo(() => filterByRole(resilienceItems), [user?.role]);

  // Instantaneous route pre-warming on mount for spontaneous transitions
  useEffect(() => {
    const allRoutes = [
      ...clinicalItems,
      ...erpItems,
      ...specializedItems,
      ...resilienceItems,
    ].map((i) => i.href);
    allRoutes.forEach((href) => {
      try {
        router.prefetch(href);
      } catch {
        // ignore
      }
    });
  }, [router]);

  const renderNavGroup = (title: string, items: NavItem[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div>
        <span className="px-3 text-[10px] font-black uppercase tracking-wider text-teal-300 block mb-1">
          {title}
        </span>
        <div className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? 'bg-teal-600/35 text-white border-l-4 border-teal-400 font-black shadow-sm ring-1 ring-teal-400/40'
                    : 'text-white font-medium hover:bg-teal-500/25 hover:text-white hover:ring-1 hover:ring-teal-400/50 hover:border-l-4 hover:border-teal-400/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="truncate text-white group-hover:text-teal-200 transition-colors">
                    {t(item.key)}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                      item.badgeColor || 'bg-slate-800 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const roleLabel = user?.role ? user.role.replace('_', ' ').toUpperCase() : 'DOCTOR';

  return (
    <aside className="w-80 lg:w-[330px] flex-shrink-0 border-r border-slate-800 bg-[#0f172a] text-white flex flex-col h-screen sticky top-0 shadow-2xl select-none z-20">
      {/* Brand Header: Mettu Karl Referral Hospital (All letters visible, no truncation) */}
      <Link
        href="/dashboard"
        className="flex h-16 items-center gap-3 border-b border-slate-800 px-4 flex-shrink-0 bg-[#0b1120] hover:bg-slate-900/90 transition-colors group cursor-pointer"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 border-2 border-teal-400/60 text-teal-300 text-lg shadow-sm shrink-0 group-hover:scale-105 transition-transform">
          🏥
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[13px] sm:text-sm font-black text-white tracking-tight leading-tight block group-hover:text-teal-200 transition-colors">
            {t('hospital_name')}
          </span>
        </div>
      </Link>

      {/* Navigation Groups - Conditionally Rendered by User Role */}
      <nav className="flex-1 overflow-y-auto space-y-5 p-3.5 custom-scrollbar">
        {renderNavGroup('Clinical & Patients', filteredClinical)}
        {renderNavGroup('Enterprise ERP', filteredErp)}
        {renderNavGroup('Specialized & IoMT', filteredSpecialized)}
        {renderNavGroup('Regulations & Resilience', filteredResilience)}
      </nav>

      {/* Hospital Footer status & Active RBAC Scope */}
      <div className="p-3 border-t border-slate-800 bg-[#0b1120] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-300">RBAC:</span>
          <span className="text-[11px] font-black text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-700/50">
            {roleLabel}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 font-bold">HIS 2026</span>
      </div>
    </aside>
  );
}
