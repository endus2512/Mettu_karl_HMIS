/**
 * Navigation sidebar for clinical, enterprise ERP, specialized niche/IoMT,
 * and national regulations / resilience modules.
 *
 * User Request: All sidebar text in pure crisp white, with responsive
 * rectangular spotlight highlighting on hover across all navigation items.
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Listen for mobile drawer toggle events from Header
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleClose = () => setIsMobileOpen(false);
    window.addEventListener('toggle-mkh-sidebar', handleToggle);
    window.addEventListener('close-mkh-sidebar', handleClose);
    return () => {
      window.removeEventListener('toggle-mkh-sidebar', handleToggle);
      window.removeEventListener('close-mkh-sidebar', handleClose);
    };
  }, []);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

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
                onClick={() => setIsMobileOpen(false)}
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
    <>
      {/* 1. DESKTOP / PC SIDEBAR (PERMANENTLY VISIBLE ON LG+ SCREENS) */}
      <aside className="hidden lg:flex w-80 lg:w-[320px] flex-shrink-0 border-r border-slate-800 bg-[#0f172a] text-white flex-col h-screen sticky top-0 shadow-2xl select-none z-20">
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="flex h-16 items-center gap-3 border-b border-slate-800 px-4 flex-shrink-0 bg-[#0b1120] hover:bg-slate-900/90 transition-colors group cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 border-2 border-teal-400/60 text-teal-300 text-lg shadow-sm shrink-0 group-hover:scale-105 transition-transform">
            🏥
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[13px] sm:text-sm font-black text-white tracking-tight leading-tight block group-hover:text-teal-200 transition-colors truncate">
              {t('hospital_name')}
            </span>
          </div>
        </Link>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto space-y-5 p-3.5 custom-scrollbar">
          {renderNavGroup('Clinical & Patients', filteredClinical)}
          {renderNavGroup('Enterprise ERP', filteredErp)}
          {renderNavGroup('Specialized & IoMT', filteredSpecialized)}
          {renderNavGroup('Regulations & Resilience', filteredResilience)}
        </nav>

        {/* Hospital Footer status */}
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

      {/* 2. MOBILE DRAWER OVERLAY (FOR SMARTPHONES & TABLETS - LG:HIDDEN) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 3. MOBILE SLIDE-OVER DRAWER PANEL */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#0f172a] text-white shadow-2xl flex flex-col lg:hidden transform transition-transform duration-300 ease-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header with Brand & Close Button */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 bg-[#0b1120] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-400 text-teal-300 text-base shrink-0">
              🏥
            </div>
            <span className="text-xs sm:text-sm font-black text-white truncate">
              {t('hospital_name')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Workstation Links */}
        <nav className="flex-1 overflow-y-auto space-y-4 p-3.5 custom-scrollbar">
          {renderNavGroup('Clinical & Patients', filteredClinical)}
          {renderNavGroup('Enterprise ERP', filteredErp)}
          {renderNavGroup('Specialized & IoMT', filteredSpecialized)}
          {renderNavGroup('Regulations & Resilience', filteredResilience)}
        </nav>

        {/* Mobile Drawer Footer with Role Badge */}
        <div className="p-3 border-t border-slate-800 bg-[#0b1120] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300">RBAC:</span>
            <span className="text-[10px] font-black text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-700/50">
              {roleLabel}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Mobile Edition</span>
        </div>
      </div>

      {/* 4. MOBILE BOTTOM QUICK NAVIGATION BAR (PORTABLE PHONE CONVENIENCE) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            pathname === '/dashboard' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-base">📊</span>
          <span>Dash</span>
        </Link>
        <Link
          href="/patients"
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            pathname === '/patients' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-base">👥</span>
          <span>Patients</span>
        </Link>
        <Link
          href="/queue"
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            pathname === '/queue' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-base">🎫</span>
          <span>Queue</span>
        </Link>
        <Link
          href="/scanner"
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            pathname === '/scanner' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-base">📷</span>
          <span>Scan</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold text-teal-300 hover:text-white"
        >
          <span className="text-base">☰</span>
          <span>Menu</span>
        </button>
      </div>
    </>
  );
}
