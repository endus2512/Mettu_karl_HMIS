/**
 * Navigation sidebar for clinical, enterprise ERP, specialized niche/IoMT,
 * and national regulations / resilience modules.
 *
 * Enterprise Healthcare Design System:
 * - Professional Navy & Teal palette
 * - Modern Lucide SVG icons across all 29 navigation routes
 * - Clear active states with subtle hairline indicators
 * - Responsive desktop sidebar and mobile slide-over drawer
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  Ticket,
  CreditCard,
  Pill,
  Stethoscope,
  TrendingUp,
  Briefcase,
  Microscope,
  Syringe,
  Scan,
  FileSpreadsheet,
  Droplets,
  Ambulance,
  Activity,
  UtensilsCrossed,
  Archive,
  HeartHandshake,
  GraduationCap,
  Flame,
  PackageCheck,
  Fingerprint,
  Scale,
  AlertOctagon,
  ShieldAlert,
  BadgeCheck,
  ClipboardCheck,
  Zap,
  Smartphone,
  QrCode,
  Building2,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  allowedRoles?: UserRole[];
}

const clinicalItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'patients', href: '/patients', icon: Users, badge: 'FHIR', badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/40', allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'] },
  { key: 'queue_system', href: '/queue', icon: Ticket, badge: 'TV', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/40', allowedRoles: ['doctor', 'nurse', 'receptionist', 'super_admin'] },
  { key: 'billing', href: '/billing', icon: CreditCard, allowedRoles: ['billing', 'insurance_officer', 'admin', 'super_admin'] },
  { key: 'pharmacy', href: '/pharmacy', icon: Pill, allowedRoles: ['pharmacist', 'doctor', 'super_admin'] },
  { key: 'telemedicine', href: '/telemed', icon: Stethoscope, allowedRoles: ['doctor', 'super_admin'] },
  { key: 'executive_bi', href: '/analytics', icon: TrendingUp, allowedRoles: ['admin', 'doctor', 'super_admin'] },
];

const erpItems: NavItem[] = [
  { key: 'hrm', href: '/hrm', icon: Briefcase, allowedRoles: ['admin', 'super_admin'] },
  { key: 'assets', href: '/assets', icon: Microscope, allowedRoles: ['technician', 'admin', 'super_admin'] },
  { key: 'ot_cssd', href: '/ot', icon: Syringe, allowedRoles: ['doctor', 'nurse', 'super_admin'] },
  { key: 'pacs', href: '/pacs', icon: Scan, allowedRoles: ['doctor', 'technician', 'super_admin'] },
  { key: 'accounting', href: '/accounting', icon: FileSpreadsheet, allowedRoles: ['billing', 'admin', 'super_admin'] },
];

const specializedItems: NavItem[] = [
  { key: 'blood_bank', href: '/blood-bank', icon: Droplets, allowedRoles: ['doctor', 'nurse', 'technician', 'super_admin'] },
  { key: 'ems_dispatch', href: '/ems', icon: Ambulance, badge: '907', badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-400/40', allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'] },
  { key: 'iomt_telemetry', href: '/iomt', icon: Activity, allowedRoles: ['doctor', 'nurse', 'technician', 'super_admin'] },
  { key: 'dietary_kitchen', href: '/dietary', icon: UtensilsCrossed, allowedRoles: ['nurse', 'admin', 'super_admin'] },
  { key: 'mortuary', href: '/mortuary', icon: Archive, allowedRoles: ['doctor', 'admin', 'super_admin'] },
  { key: 'patient_crm', href: '/crm', icon: HeartHandshake, allowedRoles: ['admin', 'insurance_officer', 'super_admin'] },
  { key: 'academic_research', href: '/academic', icon: GraduationCap, allowedRoles: ['doctor', 'admin', 'super_admin'] },
  { key: 'waste_management', href: '/waste', icon: Flame, allowedRoles: ['technician', 'admin', 'super_admin'] },
  { key: 'procurement_tenders', href: '/procurement', icon: PackageCheck, allowedRoles: ['admin', 'pharmacist', 'super_admin'] },
];

const resilienceItems: NavItem[] = [
  { key: 'national_id_fayda', href: '/fayda', icon: Fingerprint, badge: 'FIN', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40', allowedRoles: ['insurance_officer', 'admin', 'receptionist', 'super_admin'] },
  { key: 'efda_compliance', href: '/efda', icon: Scale, allowedRoles: ['pharmacist', 'admin', 'super_admin'] },
  { key: 'mci_disaster_triage', href: '/mci', icon: AlertOctagon, badge: 'START', badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-400/40', allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'] },
  { key: 'infection_epidemiology', href: '/infection', icon: ShieldAlert, allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'] },
  { key: 'insurance_claims', href: '/insurance', icon: BadgeCheck, allowedRoles: ['insurance_officer', 'admin', 'billing', 'super_admin'] },
  { key: 'clinical_audit_ehstg', href: '/audit', icon: ClipboardCheck, allowedRoles: ['admin', 'doctor', 'super_admin'] },
  { key: 'power_resilience', href: '/power', icon: Zap, allowedRoles: ['technician', 'admin', 'super_admin'] },
  { key: 'sms_ussd_gateway', href: '/sms-ussd', icon: Smartphone, badge: '*907#', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40', allowedRoles: ['doctor', 'nurse', 'receptionist', 'billing', 'pharmacist', 'admin', 'super_admin'] },
  { key: 'barcode_qr_scanner', href: '/scanner', icon: QrCode, badge: 'GS1/QR', badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/40', allowedRoles: ['doctor', 'nurse', 'pharmacist', 'billing', 'technician', 'admin', 'super_admin'] },
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
    if (!user?.role || user.role === 'super_admin' || user.role === 'admin') return items;
    return items.filter((item) => !item.allowedRoles || item.allowedRoles.includes(user.role));
  };

  const filteredClinical = useMemo(() => filterByRole(clinicalItems), [user?.role]);
  const filteredErp = useMemo(() => filterByRole(erpItems), [user?.role]);
  const filteredSpecialized = useMemo(() => filterByRole(specializedItems), [user?.role]);
  const filteredResilience = useMemo(() => filterByRole(resilienceItems), [user?.role]);

  // Pre-warm all workstation routes on idle
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
      <div className="space-y-1">
        <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
          {title}
        </span>
        <div className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setIsMobileOpen(false)}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 font-semibold border-l-2 border-teal-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComponent className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="truncate">
                    {t(item.key)}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md shrink-0 ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
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
      <aside className="hidden lg:flex w-72 lg:w-76 flex-shrink-0 border-r border-slate-800 bg-[#0b1329] text-white flex-col h-screen sticky top-0 shadow-lg select-none z-20">
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="flex h-16 items-center gap-3 border-b border-slate-800 px-4 flex-shrink-0 bg-[#080e1e] hover:bg-slate-900/90 transition-colors group cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight block group-hover:text-teal-200 transition-colors truncate">
              {t('hospital_name')}
            </span>
            <span className="text-[10px] font-medium text-slate-400 block truncate">
              HMIS Enterprise Platform
            </span>
          </div>
        </Link>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto space-y-4 p-3 custom-scrollbar">
          {renderNavGroup('Clinical & Patients', filteredClinical)}
          {renderNavGroup('Enterprise ERP', filteredErp)}
          {renderNavGroup('Specialized & IoMT', filteredSpecialized)}
          {renderNavGroup('Regulations & Resilience', filteredResilience)}
        </nav>

        {/* Hospital Footer status */}
        <div className="p-3 border-t border-slate-800 bg-[#080e1e] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-medium">Role:</span>
            <span className="text-[10px] font-mono font-semibold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-700/40">
              {roleLabel}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v0.1.0</span>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY (FOR SMARTPHONES & TABLETS - LG:HIDDEN) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 3. MOBILE SLIDE-OVER DRAWER PANEL */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#0b1329] text-white shadow-2xl flex flex-col lg:hidden transform transition-transform duration-200 ease-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header with Brand & Close Button */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 bg-[#080e1e] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 shrink-0">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-white truncate">
              {t('hospital_name')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Workstation Links */}
        <nav className="flex-1 overflow-y-auto space-y-4 p-3 custom-scrollbar">
          {renderNavGroup('Clinical & Patients', filteredClinical)}
          {renderNavGroup('Enterprise ERP', filteredErp)}
          {renderNavGroup('Specialized & IoMT', filteredSpecialized)}
          {renderNavGroup('Regulations & Resilience', filteredResilience)}
        </nav>
      </div>
    </>
  );
}
