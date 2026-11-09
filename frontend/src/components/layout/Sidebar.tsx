/**
 * Mettu Karl Comprehensive Specialized Hospital — Unified Clinical Operating System Sidebar.
 *
 * Domain-Driven Architecture (Filannoo 1ffaa):
 * - Domain 1: Tajaajila Yaalaa (Clinical Journey & Patient Care)
 * - Domain 2: Qorannoo & Qoricha (Diagnostics & Pharmacy)
 * - Domain 3: Sochii & Qabeenya Hospitaalaa (Operations & Facilities)
 * - Domain 4: Faayinaansii & Nageenya INSA (Finance & Governance)
 *
 * Key Capabilities:
 * - Strict Role-Based Visibility: Doctors, Nurses, Pharmacists, and Lab Techs see ONLY their relevant tools.
 * - Administrative Supervisory Authority: Admins have complete oversight over all 4 domains with collapsible accordions.
 * - Integrated Workstation Inspector: Admins can inspect and preview any staff role workstation with 1 click.
 * - Full Tri-Lingual Localization: Afaan Oromoo ('om'), Amharic ('am'), English ('en').
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
  Bed,
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
  ChevronDown,
  ShieldCheck,
  LogOut,
  HeartPulse,
  Eye,
  Sliders,
  RotateCcw,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  allowedRoles: UserRole[];
}

interface NavDomain {
  id: string;
  titleKey: string;
  fallbackTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

/** 1. DOMAIN: CLINICAL JOURNEY & PATIENT CARE */
const clinicalJourneyItems: NavItem[] = [
  {
    key: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['doctor', 'nurse', 'pharmacist', 'technician', 'lab_tech', 'lab_technician', 'billing', 'insurance_officer', 'receptionist', 'admin', 'super_admin'],
  },
  {
    key: 'patients',
    href: '/patients',
    icon: Users,
    badge: 'FHIR',
    badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/40',
    allowedRoles: ['doctor', 'nurse', 'receptionist', 'admin', 'super_admin'],
  },
  {
    key: 'queue_system',
    href: '/queue',
    icon: Ticket,
    badge: 'OPD',
    badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
    allowedRoles: ['receptionist', 'nurse', 'doctor', 'admin', 'super_admin'],
  },
  {
    key: 'inpatient_wards',
    href: '/wards',
    icon: Bed,
    badge: 'IPD',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    allowedRoles: ['nurse', 'doctor', 'admin', 'super_admin'],
  },
  {
    key: 'ot_cssd',
    href: '/ot',
    icon: Syringe,
    badge: 'OT',
    badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-400/40',
    allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'ems_dispatch',
    href: '/ems',
    icon: Ambulance,
    badge: '907',
    badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-400/40',
    allowedRoles: ['nurse', 'receptionist', 'admin', 'super_admin'],
  },
  {
    key: 'mci_disaster_triage',
    href: '/mci',
    icon: AlertOctagon,
    badge: 'START',
    badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-400/40',
    allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'telemedicine',
    href: '/telemed',
    icon: Stethoscope,
    allowedRoles: ['doctor', 'admin', 'super_admin'],
  },
];

/** 2. DOMAIN: DIAGNOSTICS & PHARMACY */
const diagnosticsPharmaItems: NavItem[] = [
  {
    key: 'laboratory',
    href: '/laboratory',
    icon: FlaskConical,
    badge: 'LIS',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40',
    allowedRoles: ['technician', 'lab_technician', 'lab_tech', 'doctor', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'blood_bank',
    href: '/blood-bank',
    icon: Droplets,
    badge: 'SafeBlood',
    badgeColor: 'bg-red-500/20 text-red-300 border border-red-400/40',
    allowedRoles: ['technician', 'lab_technician', 'lab_tech', 'doctor', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'pacs',
    href: '/pacs',
    icon: Scan,
    badge: 'DICOM',
    badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-400/40',
    allowedRoles: ['doctor', 'technician', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'pharmacy',
    href: '/pharmacy',
    icon: Pill,
    badge: 'FEFO',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    allowedRoles: ['pharmacist', 'doctor', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'efda_compliance',
    href: '/efda',
    icon: Scale,
    allowedRoles: ['pharmacist', 'admin', 'super_admin'],
  },
];

/** 3. DOMAIN: OPERATIONS & FACILITIES */
const operationsFacilitiesItems: NavItem[] = [
  {
    key: 'hrm',
    href: '/hrm',
    icon: Briefcase,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'assets',
    href: '/assets',
    icon: Microscope,
    allowedRoles: ['technician', 'admin', 'super_admin'],
  },
  {
    key: 'iomt_telemetry',
    href: '/iomt',
    icon: Activity,
    badge: 'IoT',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40',
    allowedRoles: ['doctor', 'nurse', 'technician', 'admin', 'super_admin'],
  },
  {
    key: 'dietary_kitchen',
    href: '/dietary',
    icon: UtensilsCrossed,
    allowedRoles: ['nurse', 'admin', 'super_admin'],
  },
  {
    key: 'mortuary',
    href: '/mortuary',
    icon: Archive,
    allowedRoles: ['doctor', 'admin', 'super_admin'],
  },
  {
    key: 'infection_epidemiology',
    href: '/infection',
    icon: ShieldAlert,
    allowedRoles: ['nurse', 'doctor', 'admin', 'super_admin'],
  },
  {
    key: 'waste_management',
    href: '/waste',
    icon: Flame,
    allowedRoles: ['technician', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'power_resilience',
    href: '/power',
    icon: Zap,
    badge: 'EEU',
    badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
    allowedRoles: ['technician', 'admin', 'super_admin'],
  },
  {
    key: 'procurement_tenders',
    href: '/procurement',
    icon: PackageCheck,
    allowedRoles: ['admin', 'pharmacist', 'super_admin'],
  },
  {
    key: 'academic_research',
    href: '/academic',
    icon: GraduationCap,
    allowedRoles: ['doctor', 'admin', 'super_admin'],
  },
  {
    key: 'patient_crm',
    href: '/crm',
    icon: HeartHandshake,
    allowedRoles: ['insurance_officer', 'admin', 'super_admin'],
  },
];

/** 4. DOMAIN: FINANCE & INSA GOVERNANCE */
const financeGovernanceItems: NavItem[] = [
  {
    key: 'billing',
    href: '/billing',
    icon: CreditCard,
    badge: 'Telebirr',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    allowedRoles: ['billing', 'insurance_officer', 'admin', 'super_admin'],
  },
  {
    key: 'insurance_claims',
    href: '/insurance',
    icon: BadgeCheck,
    badge: 'CBHI',
    badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/40',
    allowedRoles: ['insurance_officer', 'billing', 'admin', 'super_admin'],
  },
  {
    key: 'accounting',
    href: '/accounting',
    icon: FileSpreadsheet,
    allowedRoles: ['billing', 'admin', 'super_admin'],
  },
  {
    key: 'national_id_fayda',
    href: '/fayda',
    icon: Fingerprint,
    badge: 'FIN',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    allowedRoles: ['receptionist', 'nurse', 'insurance_officer', 'billing', 'admin', 'super_admin'],
  },
  {
    key: 'clinical_audit_ehstg',
    href: '/audit',
    icon: ClipboardCheck,
    badge: 'INSA',
    badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
    allowedRoles: ['admin', 'auditor', 'super_admin'],
  },
  {
    key: 'executive_bi',
    href: '/analytics',
    icon: TrendingUp,
    badge: 'KPI',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40',
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'sms_ussd_gateway',
    href: '/sms-ussd',
    icon: Smartphone,
    badge: '*907#',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    allowedRoles: ['admin', 'nurse', 'doctor', 'receptionist', 'super_admin'],
  },
  {
    key: 'barcode_qr_scanner',
    href: '/scanner',
    icon: QrCode,
    badge: 'GS1',
    badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/40',
    allowedRoles: ['doctor', 'nurse', 'pharmacist', 'billing', 'technician', 'admin', 'super_admin'],
  },
];

const patientItems: NavItem[] = [
  {
    key: 'patient_portal',
    href: '/patient-portal',
    icon: HeartPulse,
    badge: 'PORTAL',
    badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-400/40',
    allowedRoles: ['patient'],
  },
];

export function Sidebar(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const { user, logout, activeRole, simulatedRole, setSimulatedRole } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Collapsible Accordion State for the 4 Domains
  const [openDomains, setOpenDomains] = useState<{ [key: string]: boolean }>({
    clinical: true,
    diagnostics: true,
    operations: true,
    finance: true,
  });

  const toggleDomain = (domainId: string) => {
    setOpenDomains((prev) => ({
      ...prev,
      [domainId]: !prev[domainId],
    }));
  };

  const effectiveRole: UserRole = activeRole || user?.role || 'doctor';
  const isPatientRole = effectiveRole === 'patient';
  const isSupervisorRole = effectiveRole === 'admin' || effectiveRole === 'super_admin';

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

  // Strict Role Filtering
  const filterByRole = (items: NavItem[]): NavItem[] => {
    if (effectiveRole === 'super_admin' || effectiveRole === 'admin') return items;
    if (effectiveRole === 'patient') return [];

    return items.filter((item) => {
      if (!item.allowedRoles) return true;
      const roles: string[] = [...item.allowedRoles];
      if (roles.includes('technician') && !roles.includes('lab_technician')) {
        roles.push('lab_technician');
        roles.push('lab_tech');
      }
      return roles.includes(effectiveRole);
    });
  };

  const filteredClinical = useMemo(() => filterByRole(clinicalJourneyItems), [effectiveRole]);
  const filteredDiagnostics = useMemo(() => filterByRole(diagnosticsPharmaItems), [effectiveRole]);
  const filteredOperations = useMemo(() => filterByRole(operationsFacilitiesItems), [effectiveRole]);
  const filteredFinance = useMemo(() => filterByRole(financeGovernanceItems), [effectiveRole]);

  // All structured domains
  const domains: NavDomain[] = useMemo(() => [
    {
      id: 'clinical',
      titleKey: 'domain_clinical_care',
      fallbackTitle: 'Clinical Journey & Care',
      icon: Stethoscope,
      items: filteredClinical,
    },
    {
      id: 'diagnostics',
      titleKey: 'domain_diagnostics_pharma',
      fallbackTitle: 'Diagnostics & Pharmacy',
      icon: FlaskConical,
      items: filteredDiagnostics,
    },
    {
      id: 'operations',
      titleKey: 'domain_operations_facilities',
      fallbackTitle: 'Operations & Facilities',
      icon: Building2,
      items: filteredOperations,
    },
    {
      id: 'finance',
      titleKey: 'domain_finance_governance',
      fallbackTitle: 'Finance & INSA Governance',
      icon: ShieldCheck,
      items: filteredFinance,
    },
  ], [filteredClinical, filteredDiagnostics, filteredOperations, filteredFinance]);

  // Pre-warm / prefetch all key routes on idle
  useEffect(() => {
    const allRoutes = [
      ...clinicalJourneyItems,
      ...diagnosticsPharmaItems,
      ...operationsFacilitiesItems,
      ...financeGovernanceItems,
    ].map((i) => i.href);
    allRoutes.forEach((href) => {
      try {
        router.prefetch(href);
      } catch {
        // ignore
      }
    });
  }, [router]);

  const renderNavGroup = (
    domain: NavDomain,
    collapsed = false
  ) => {
    const { id, titleKey, fallbackTitle, icon: DomainIcon, items } = domain;
    if (!items || items.length === 0) return null;

    const isOpen = openDomains[id] ?? true;
    const domainTitle = t(titleKey) || fallbackTitle;

    return (
      <div key={id} className="space-y-1">
        {!collapsed ? (
          <button
            type="button"
            onClick={() => toggleDomain(id)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#141c2c] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <DomainIcon className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                {domainTitle}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                {items.length}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </div>
          </button>
        ) : (
          <div className="my-2 border-t border-slate-800/80 mx-2" title={domainTitle} />
        )}

        {(isOpen || collapsed) && (
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
                    collapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'
                  } rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
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
        )}
      </div>
    );
  };

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
                Enterprise Clinical OS
              </span>
            </div>
          )}
        </Link>

        {/* Navigation Groups (Domain-Driven Flow) */}
        <nav className={`flex-1 overflow-y-auto space-y-4 ${isCollapsed ? 'p-1.5' : 'p-3'} custom-scrollbar`}>
          {isPatientRole ? (
            <div className="space-y-1">
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-400 block mb-1.5">
                {language === 'om' ? 'Kutaa Dhukkubsataa' : language === 'am' ? 'የታካሚ ክፍል' : 'Patient Care Portal'}
              </span>
              {patientItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold text-xs"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{t(item.key)}</span>
                </Link>
              ))}
            </div>
          ) : (
            domains.map((domain) => renderNavGroup(domain, isCollapsed))
          )}
        </nav>

        {/* Hospital Footer status & Collapse Toggle */}
        <div className={`p-2.5 border-t border-[#1a2233] bg-[#080c14] space-y-2 text-xs`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-600/30 truncate">
                    {effectiveRole.toUpperCase()} {simulatedRole ? '(SIM)' : ''}
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

              {/* Administrative Supervisory Authority & Workstation Inspector */}
              {(isSupervisorRole || simulatedRole) && (
                <div className="rounded-xl bg-[#0c121e] border border-amber-500/30 p-2.5 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {language === 'om' ? "To'annoo Ogeessotaa" : language === 'am' ? 'የስራ ክትትል' : 'Staff Oversight'}
                      </span>
                    </div>
                    {simulatedRole && (
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedRole(null);
                          router.push('/dashboard');
                        }}
                        className="flex items-center gap-1 text-[9px] font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>{language === 'om' ? 'Deebi\'i' : 'Reset'}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    {language === 'om'
                      ? "Kutaa hojii ogeessa kamiyyuu akka supervisor-tti to'achuuf filadhu:"
                      : 'Switch workstation perspective to supervise staff activities:'}
                  </p>

                  <select
                    id="rbac-role-switcher"
                    value={effectiveRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      setSimulatedRole(nextRole === 'admin' ? null : nextRole);
                      router.push('/dashboard');
                    }}
                    className="w-full bg-[#06090f] border border-amber-500/40 text-amber-200 text-[11px] rounded-lg px-2 py-1.5 font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="admin">🛡️ ADMIN (Executive Cockpit)</option>
                    <option value="doctor">🩺 DOCTOR (Clinical & EMR)</option>
                    <option value="nurse">💉 NURSE (Wards & Vitals)</option>
                    <option value="pharmacist">💊 PHARMACIST (FEFO & Drugs)</option>
                    <option value="technician">🔬 LAB TECH (LIS Bench)</option>
                    <option value="billing">💳 BILLING (Cashier & CBHI)</option>
                    <option value="receptionist">🎫 RECEPTIONIST (Intake)</option>
                    <option value="patient">👤 PATIENT (Health Portal)</option>
                    <option value="super_admin">⚡ SUPER ADMIN (Full Root)</option>
                  </select>
                </div>
              )}

              {/* Prominent Sidebar Logout Button */}
              <button
                type="button"
                onClick={handleSidebarLogout}
                title={language === 'om' ? "Sirna Keessaa Ba'i (Logout)" : language === 'am' ? 'ከስርዓቱ ውጣ (Logout)' : 'Sign out of HMIS'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-2 px-3 text-xs shadow-md shadow-rose-950/50 hover:shadow-rose-600/30 active:scale-[0.98] transition-all cursor-pointer border border-rose-400/30"
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
          {isPatientRole ? (
            <div className="space-y-1">
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-400 block mb-1.5">
                {language === 'om' ? 'Kutaa Dhukkubsataa' : language === 'am' ? 'የታካሚ ክፍል' : 'Patient Care Portal'}
              </span>
              {patientItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold text-xs"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{t(item.key)}</span>
                </Link>
              ))}
            </div>
          ) : (
            domains.map((domain) => renderNavGroup(domain))
          )}
        </nav>

        {/* Mobile Drawer Footer with Logout Button */}
        <div className="p-3 border-t border-[#1a2233] bg-[#080c14] shrink-0 space-y-2">
          {isSupervisorRole && (
            <select
              value={effectiveRole}
              onChange={(e) => {
                const nextRole = e.target.value as UserRole;
                setSimulatedRole(nextRole === 'admin' ? null : nextRole);
                setIsMobileOpen(false);
                router.push('/dashboard');
              }}
              className="w-full bg-[#0c121e] border border-amber-500/40 text-amber-200 text-xs rounded-lg p-2 font-semibold"
            >
              <option value="admin">🛡️ ADMIN (Executive)</option>
              <option value="doctor">🩺 DOCTOR (Clinical)</option>
              <option value="nurse">💉 NURSE (Wards)</option>
              <option value="pharmacist">💊 PHARMACIST</option>
              <option value="technician">🔬 LAB TECH</option>
              <option value="billing">💳 BILLING</option>
              <option value="receptionist">🎫 RECEPTIONIST</option>
            </select>
          )}

          <button
            type="button"
            onClick={handleSidebarLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-2.5 px-4 text-sm shadow-md shadow-rose-950/50 active:scale-95 transition-all cursor-pointer border border-rose-400/30"
          >
            <LogOut className="h-4 w-4" />
            <span>{language === 'om' ? "Sirna Keessaa Ba'i" : language === 'am' ? 'ከስርዓቱ ውጣ' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
