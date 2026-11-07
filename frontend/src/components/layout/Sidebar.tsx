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
  FlaskConical,
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
  ChevronLeft,
  ShieldCheck,
  LogOut,
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
  { key: 'laboratory', href: '/laboratory', icon: FlaskConical, badge: 'LIS', badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40', allowedRoles: ['doctor', 'nurse', 'technician', 'admin', 'super_admin'] },
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
  const { t, language } = useTranslation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSidebarLogout = () => {
    void logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    } else {
      router.replace('/login');
    }
  };

  // Restore collapsed state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mkh_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mkh_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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

  const renderNavGroup = (title: string, items: NavItem[], collapsed = false) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-1">
        {!collapsed ? (
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            {title}
          </span>
        ) : (
          <div className="my-2 border-t border-slate-800/80 mx-2" title={title} />
        )}
        <div className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            const itemLabel = t(item.key);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setIsMobileOpen(false)}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                title={collapsed ? itemLabel : undefined}
                className={`group relative flex items-center ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
                } rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#141b29] font-medium'
                }`}
              >
                <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'min-w-0'}`}>
                  <IconComponent
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{itemLabel}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md shrink-0 ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Floating tooltip for collapsed mode on hover */}
                {collapsed && (
                  <div className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl border border-slate-700">
                    <span>{itemLabel}</span>
                    {item.badge && (
                      <span className="font-mono text-[10px] text-teal-300">({item.badge})</span>
                    )}
                  </div>
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
      {/* 1. DESKTOP / PC SIDEBAR (PERMANENTLY VISIBLE ON LG+ SCREENS, COLLAPSIBLE) */}
      <aside
        className={`hidden lg:flex ${
          isCollapsed ? 'w-18' : 'w-72 lg:w-76'
        } flex-shrink-0 border-r border-[#1a2233] bg-[#0b0f17] text-white flex-col h-screen sticky top-0 shadow-2xl select-none z-20 transition-all duration-200`}
      >
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className={`flex h-16 items-center ${
            isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
          } border-b border-[#1a2233] flex-shrink-0 bg-[#080c14] hover:bg-[#101622] transition-colors group cursor-pointer`}
          title={t('hospital_name')}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shrink-0 group-hover:scale-105 shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight block group-hover:text-amber-300 transition-colors truncate">
                {t('hospital_name')}
              </span>
              <span className="text-[10px] font-medium text-amber-500/80 block truncate">
                Enterprise Core Command
              </span>
            </div>
          )}
        </Link>

        {/* Navigation Groups */}
        <nav className={`flex-1 overflow-y-auto space-y-4 ${isCollapsed ? 'p-1.5' : 'p-3'} custom-scrollbar`}>
          {renderNavGroup('Clinical & Patients', filteredClinical, isCollapsed)}
          {renderNavGroup('Enterprise ERP', filteredErp, isCollapsed)}
          {renderNavGroup('Specialized & IoMT', filteredSpecialized, isCollapsed)}
          {renderNavGroup('Regulations & Resilience', filteredResilience, isCollapsed)}
        </nav>

        {/* Hospital Footer status & Collapse Toggle */}
        <div className={`p-2.5 border-t border-[#1a2233] bg-[#080c14] space-y-2 text-xs`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-600/30 truncate">
                    {roleLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  title="Collapse sidebar to icon mode"
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Prominent Sidebar Logout Button */}
              <button
                type="button"
                onClick={handleSidebarLogout}
                title={language === 'om' ? "Sirna Keessaa Ba'i (Logout)" : language === 'am' ? 'ከስርዓቱ ውጣ (Logout)' : 'Sign out of HMIS'}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-2 px-3 text-xs shadow-md shadow-rose-950/50 hover:shadow-rose-600/30 active:scale-[0.98] transition-all cursor-pointer border border-rose-400/30"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>{language === 'om' ? "Ba'i" : language === 'am' ? 'ውጣ' : 'Logout'}</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleSidebarLogout}
                title={language === 'om' ? "Sirna Keessaa Ba'i (Logout)" : language === 'am' ? 'ከስርዓቱ ውጣ (Logout)' : 'Sign out of HMIS'}
                className="p-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md active:scale-95 transition-all cursor-pointer border border-rose-400/30"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleCollapse}
                title="Expand sidebar"
                className="p-1.5 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
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
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#0b0f17] text-white shadow-2xl flex flex-col lg:hidden transform transition-transform duration-200 ease-out border-r border-[#1a2233] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header with Brand & Close Button */}
        <div className="flex h-16 items-center justify-between border-b border-[#1a2233] px-4 bg-[#080c14] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shrink-0">
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

        {/* Mobile Drawer Footer with Logout Button */}
        <div className="p-3 border-t border-[#1a2233] bg-[#080c14] shrink-0">
          <button
            type="button"
            onClick={handleSidebarLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-2.5 px-4 text-sm shadow-md shadow-rose-950/50 active:scale-95 transition-all cursor-pointer border border-rose-400/30"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{language === 'om' ? "Ba'i (Logout)" : language === 'am' ? 'ውጣ (Logout)' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
