/**
 * Mettu Karl Comprehensive Specialized Hospital — Unified Clinical Operating System Sidebar.
 *
 * Dedicated Role-Isolated Portals & Domain-Driven Navigation:
 * - Dedicated Role Portals:
 *   * /portal/doctor (Doctor Workstation)
 *   * /portal/nurse (Nurse & Ward Station)
 *   * /portal/pharmacy (Pharmacy FEFO Dispensary)
 *   * /portal/lab (Laboratory LIS Bench)
 *   * /portal/billing (Billing, Cashier & POS)
 *   * /portal/reception (Reception, Fayda & Queue)
 *   * /portal/admin (Executive Command Center)
 *   * /patient-portal (Patient Care Portal)
 *
 * Key Capabilities:
 * - Strict Role Isolation: Non-admin staff only see their own assigned tools.
 * - Executive Supervisory Authority: Admins have dedicated Staff Portals accordion to inspect any role.
 * - Dynamic Dashboard Resolution: The Dashboard link dynamically maps to each user's dedicated portal.
 * - Full Tri-Lingual Localization: Afaan Oromoo ('om'), Amharic ('am'), English ('en').
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { getRolePortalPath, isAdminRole } from '@/lib/roleRoutes';
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

/** 0. DEDICATED ROLE PORTALS (SUPERVISOR ACCESS) */
const staffWorkstationPortals: NavItem[] = [
  {
    key: 'portal_doctor',
    href: '/portal/doctor',
    icon: Stethoscope,
    badge: 'OPD',
    badgeColor: 'bg-teal-500/20 text-teal-950 dark:text-teal-200 border border-teal-500/45',
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'portal_nurse',
    href: '/portal/nurse',
    icon: Bed,
    badge: 'IPD',
    badgeColor: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/45',
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'portal_pharmacy',
    href: '/portal/pharmacy',
    icon: Pill,
    badge: 'FEFO',
    badgeColor: 'bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/45',
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'portal_lab',
    href: '/portal/lab',
    icon: FlaskConical,
    badge: 'LIS',
    badgeColor: 'bg-cyan-500/20 text-cyan-950 dark:text-cyan-200 border border-cyan-500/45',
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'portal_billing',
    href: '/portal/billing',
    icon: CreditCard,
    badge: 'POS',
    badgeColor: 'bg-blue-500/20 text-blue-950 dark:text-blue-200 border border-blue-500/45',
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'portal_reception',
    href: '/portal/reception',
    icon: Ticket,
    badge: 'Fayda',
    badgeColor: 'bg-purple-500/20 text-purple-950 dark:text-purple-200 border border-purple-500/45',
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'patient_portal',
    href: '/patient-portal',
    icon: HeartPulse,
    badge: 'Portal',
    badgeColor: 'bg-rose-500/20 text-rose-950 dark:text-rose-200 border border-rose-500/45',
    allowedRoles: ['admin', 'super_admin'],
  },
];

/** 1. DOMAIN: CLINICAL JOURNEY & PATIENT CARE */
const clinicalJourneyItems: NavItem[] = [
  {
    key: 'patients',
    href: '/patients',
    icon: Users,
    badge: 'FHIR',
    badgeColor: 'bg-teal-500/20 text-teal-950 dark:text-teal-200 border border-teal-500/45',
    allowedRoles: ['doctor', 'nurse', 'receptionist', 'admin', 'super_admin'],
  },
  {
    key: 'queue_system',
    href: '/queue',
    icon: Ticket,
    badge: 'OPD',
    badgeColor: 'bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/45',
    allowedRoles: ['receptionist', 'nurse', 'doctor', 'admin', 'super_admin'],
  },
  {
    key: 'inpatient_wards',
    href: '/wards',
    icon: Bed,
    badge: 'IPD',
    badgeColor: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/45',
    allowedRoles: ['nurse', 'doctor', 'admin', 'super_admin'],
  },
  {
    key: 'ot_cssd',
    href: '/ot',
    icon: Syringe,
    badge: 'OT',
    badgeColor: 'bg-sky-500/20 text-sky-950 dark:text-sky-200 border border-sky-500/45',
    allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'ems_dispatch',
    href: '/ems',
    icon: Ambulance,
    badge: '907',
    badgeColor: 'bg-rose-500/20 text-rose-950 dark:text-rose-200 border border-rose-500/45',
    allowedRoles: ['nurse', 'receptionist', 'admin', 'super_admin'],
  },
  {
    key: 'mci_disaster_triage',
    href: '/mci',
    icon: AlertOctagon,
    badge: 'START',
    badgeColor: 'bg-rose-500/20 text-rose-950 dark:text-rose-200 border border-rose-500/45',
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
    badgeColor: 'bg-cyan-500/20 text-cyan-950 dark:text-cyan-200 border border-cyan-500/45',
    allowedRoles: ['technician', 'lab_technician', 'lab_tech', 'doctor', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'blood_bank',
    href: '/blood-bank',
    icon: Droplets,
    badge: 'SafeBlood',
    badgeColor: 'bg-red-500/20 text-red-950 dark:text-red-200 border border-red-500/45',
    allowedRoles: ['technician', 'lab_technician', 'lab_tech', 'doctor', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'pacs',
    href: '/pacs',
    icon: Scan,
    badge: 'DICOM',
    badgeColor: 'bg-blue-500/20 text-blue-950 dark:text-blue-200 border border-blue-500/45',
    allowedRoles: ['doctor', 'technician', 'nurse', 'admin', 'super_admin'],
  },
  {
    key: 'pharmacy',
    href: '/pharmacy',
    icon: Pill,
    badge: 'FEFO',
    badgeColor: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/45',
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
    badgeColor: 'bg-indigo-500/20 text-indigo-950 dark:text-indigo-200 border border-indigo-500/45',
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
    badgeColor: 'bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/45',
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
    badgeColor: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/45',
    allowedRoles: ['billing', 'insurance_officer', 'admin', 'super_admin'],
  },
  {
    key: 'insurance_claims',
    href: '/insurance',
    icon: BadgeCheck,
    badge: 'CBHI',
    badgeColor: 'bg-teal-500/20 text-teal-950 dark:text-teal-200 border border-teal-500/45',
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
    badgeColor: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/45',
    allowedRoles: ['receptionist', 'nurse', 'insurance_officer', 'billing', 'admin', 'super_admin'],
  },
  {
    key: 'clinical_audit_ehstg',
    href: '/audit',
    icon: ClipboardCheck,
    badge: 'INSA',
    badgeColor: 'bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-500/45',
    allowedRoles: ['admin', 'auditor', 'super_admin'],
  },
  {
    key: 'executive_bi',
    href: '/analytics',
    icon: TrendingUp,
    badge: 'KPI',
    badgeColor: 'bg-indigo-500/20 text-indigo-950 dark:text-indigo-200 border border-indigo-500/45',
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'sms_ussd_gateway',
    href: '/sms-ussd',
    icon: Smartphone,
    badge: '*907#',
    badgeColor: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/45',
    allowedRoles: ['admin', 'nurse', 'doctor', 'receptionist', 'super_admin'],
  },
  {
    key: 'barcode_qr_scanner',
    href: '/scanner',
    icon: QrCode,
    badge: 'GS1',
    badgeColor: 'bg-teal-500/20 text-teal-950 dark:text-teal-200 border border-teal-500/45',
    allowedRoles: ['doctor', 'nurse', 'pharmacist', 'billing', 'technician', 'admin', 'super_admin'],
  },
];

const patientItems: NavItem[] = [
  {
    key: 'patient_portal',
    href: '/patient-portal',
    icon: HeartPulse,
    badge: 'PORTAL',
    badgeColor: 'bg-teal-500/20 text-teal-950 dark:text-teal-200 border border-teal-500/45',
    allowedRoles: ['patient'],
  },
];

let corePortalsPrefetched = false;

export function Sidebar(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const { user, logout, activeRole, simulatedRole, setSimulatedRole } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Default to minimized/collapsed mode on opening
  const [isCollapsed, setIsCollapsed] = useState(true);

  const realRole: UserRole = user?.role || 'patient';
  const isSupervisorRole = isAdminRole(realRole);
  const effectiveRole: UserRole = isSupervisorRole ? activeRole : realRole;
  const isPatientRole = effectiveRole === 'patient';

  // Collapsible Accordion State for the Domains (closed by default for clean, compact overview)
  const [openDomains, setOpenDomains] = useState<{ [key: string]: boolean }>({
    portals: false,
    clinical: false,
    diagnostics: false,
    operations: false,
    finance: false,
  });

  const toggleDomain = (domainId: string) => {
    setOpenDomains((prev) => ({
      ...prev,
      [domainId]: !prev[domainId],
    }));
  };

  const handleSidebarLogout = () => {
    void logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    } else {
      router.replace('/login');
    }
  };

  // Restore collapsed state (defaults to true / minimized when opening)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('mkh_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      } else {
        // By default when opening, start minimized
        setIsCollapsed(true);
      }
    } catch {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('mkh_sidebar_collapsed', String(next));
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
    if (isSupervisorRole && (effectiveRole === 'super_admin' || effectiveRole === 'admin')) return items;
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

  const filteredPortals = useMemo(() => filterByRole(staffWorkstationPortals), [effectiveRole]);
  const filteredClinical = useMemo(() => filterByRole(clinicalJourneyItems), [effectiveRole]);
  const filteredDiagnostics = useMemo(() => filterByRole(diagnosticsPharmaItems), [effectiveRole]);
  const filteredOperations = useMemo(() => filterByRole(operationsFacilitiesItems), [effectiveRole]);
  const filteredFinance = useMemo(() => filterByRole(financeGovernanceItems), [effectiveRole]);

  // All structured domains: Dashboard is pinned first above this list, then Staff Portal, then remaining clinical/ops domains
  const domains: NavDomain[] = useMemo(() => {
    const list: NavDomain[] = [];
    if (isSupervisorRole) {
      list.push({
        id: 'portals',
        titleKey: 'domain_portals_supervision',
        fallbackTitle: 'Staff Portal',
        icon: Eye,
        items: filteredPortals,
      });
    }
    list.push(
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
      }
    );
    return list;
  }, [isSupervisorRole, filteredPortals, filteredClinical, filteredDiagnostics, filteredOperations, filteredFinance]);

  // Active Page Resolution: Identifies what is currently open/displayed on dashboard and under which domain
  const activePageInfo = useMemo(() => {
    const currentPath = pathname;
    const dashboardHref = getRolePortalPath(effectiveRole);
    if (currentPath === dashboardHref || currentPath === '/dashboard') {
      return {
        domainId: 'dashboard',
        domainTitle: language === 'om' ? 'Dashboard' : language === 'am' ? 'ዳሽቦርድ' : 'Dashboard',
        itemKey: 'dashboard',
        itemTitle: language === 'om' ? 'Dashboard (Wiirtuu Guddicha)' : 'Executive Dashboard',
        href: dashboardHref,
        isDashboard: true,
      };
    }

    for (const domain of domains) {
      const foundItem = domain.items.find((item) => {
        const itemHref = item.key === 'dashboard' ? getRolePortalPath(effectiveRole) : item.href;
        return currentPath === itemHref || currentPath.startsWith(itemHref + '/');
      });
      if (foundItem) {
        const domainTitle =
          domain.id === 'portals'
            ? language === 'om'
              ? 'Wiirtuu Ogeeyyii'
              : language === 'am'
              ? 'የባለሙያዎች ክፍል'
              : 'Staff Portal'
            : t(domain.titleKey) || domain.fallbackTitle;
        return {
          domainId: domain.id,
          domainTitle,
          itemKey: foundItem.key,
          itemTitle: t(foundItem.key),
          href: foundItem.href,
          icon: foundItem.icon,
          badge: foundItem.badge,
          isDashboard: false,
        };
      }
    }

    return null;
  }, [pathname, effectiveRole, domains, language, t]);

  // Synchronize accordion state on route change:
  // Auto-open ONLY the domain containing the active page, keeping all other domains minimized!
  useEffect(() => {
    if (activePageInfo && !activePageInfo.isDashboard) {
      setOpenDomains({
        portals: activePageInfo.domainId === 'portals',
        clinical: activePageInfo.domainId === 'clinical',
        diagnostics: activePageInfo.domainId === 'diagnostics',
        operations: activePageInfo.domainId === 'operations',
        finance: activePageInfo.domainId === 'finance',
      });
    } else if (activePageInfo?.isDashboard) {
      // On primary dashboard, keep all sub-domains closed so minimized sidebar stays strictly compact
      setOpenDomains({
        portals: false,
        clinical: false,
        diagnostics: false,
        operations: false,
        finance: false,
      });
    }
  }, [activePageInfo?.domainId, activePageInfo?.isDashboard]);

  // Stagger-warm ONLY primary portals once per session on idle so clicked links respond instantaneously
  useEffect(() => {
    if (corePortalsPrefetched) return;
    corePortalsPrefetched = true;
    const priorityRoutes = [
      getRolePortalPath(effectiveRole),
      '/portal/doctor',
      '/portal/nurse',
      '/portal/pharmacy',
      '/portal/lab',
      '/patients',
    ];
    const timer = window.setTimeout(() => {
      priorityRoutes.forEach((href) => {
        try {
          router.prefetch(href);
        } catch {
          // ignore
        }
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [router, effectiveRole]);

  const renderPrimaryDashboardCard = (collapsed = false, closeMobile = false) => {
    const dashboardHref = getRolePortalPath(effectiveRole);
    const isDashboardActive = pathname === dashboardHref || pathname === '/dashboard';
    const dashboardLabel =
      language === 'om'
        ? 'Dashboard'
        : language === 'am'
        ? 'Dashboard (ዳሽቦርድ)'
        : 'Dashboard';

    return (
      <Link
        href={dashboardHref}
        prefetch={true}
        onClick={() => {
          if (closeMobile) setIsMobileOpen(false);
        }}
        onMouseEnter={() => router.prefetch(dashboardHref)}
        title={collapsed ? `${dashboardLabel} ${isDashboardActive ? '(Hojirra jira / Active)' : ''}` : undefined}
        className={`mkh-sidebar-rect group relative flex items-center overflow-hidden ${
          collapsed ? 'justify-center p-2.5 w-11 h-11 mx-auto' : 'justify-between px-3.5 py-3'
        } rounded-2xl border-2 backdrop-blur-md cursor-pointer transition-all duration-300 ${
          isDashboardActive
            ? 'mkh-sidebar-active-glow bg-gradient-to-r from-sky-500/25 via-indigo-500/20 to-amber-500/25 dark:from-sky-500/30 dark:via-indigo-500/25 dark:to-amber-500/25 border-sky-500/85 dark:border-amber-400/75 text-slate-950 dark:text-white shadow-[0_0_16px_rgba(14,165,233,0.35)] scale-105'
            : 'bg-white/40 dark:bg-slate-900/40 border-sky-300/80 dark:border-sky-400/40 text-slate-950 dark:text-white hover:bg-white/65 dark:hover:bg-sky-500/20 hover:border-sky-500 hover:scale-105'
        }`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/45 dark:via-sky-200/20 to-transparent mkh-panel-sweep"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/40 dark:via-white/15 to-transparent"
        />

        {/* Pulsing Beacon if dashboard is currently active in collapsed mode */}
        {isDashboardActive && collapsed && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </span>
        )}

        <div className={`relative z-10 flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'min-w-0'}`}>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shrink-0">
            <LayoutDashboard className="h-4.5 w-4.5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block text-sm font-black tracking-tight text-slate-950 dark:text-white truncate">
                {dashboardLabel}
              </span>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sky-900 dark:text-sky-200 truncate">
                {language === 'om' ? 'Wiirtuu Guddicha' : 'Executive Overview'}
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <span className="relative z-10 inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-200 border border-emerald-500/50 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-300 animate-ping" />
            LIVE
          </span>
        )}
        {collapsed && (
          <div className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 text-xs font-black text-slate-950 dark:text-white shadow-xl border border-sky-400 dark:border-slate-700">
            <span>{dashboardLabel}</span>
            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold">
              {isDashboardActive ? '(HOJIRRA JIRA)' : '(LIVE)'}
            </span>
          </div>
        )}
      </Link>
    );
  };

  const renderNavGroup = (
    domain: NavDomain,
    collapsed = false
  ) => {
    const { id, titleKey, fallbackTitle, icon: DomainIcon, items } = domain;
    if (!items || items.length === 0) return null;

    const isOpen = openDomains[id] ?? false;
    const isDomainActive = activePageInfo?.domainId === id;
    const domainTitle =
      id === 'portals'
        ? language === 'om'
          ? 'Wiirtuu Ogeeyyii'
          : language === 'am'
          ? 'የባለሙያዎች ክፍል'
          : 'Staff Portal'
        : t(titleKey) || fallbackTitle;

    // 1. EXPANDED SIDEBAR ACCORDION VIEW
    if (!collapsed) {
      return (
        <div key={id} className="space-y-1.5">
          <button
            type="button"
            onClick={() => toggleDomain(id)}
            className={`mkh-sidebar-rect relative overflow-hidden w-full flex items-center justify-between px-3 py-2.5 rounded-xl backdrop-blur-md border-2 cursor-pointer group transition-all duration-300 ${
              isDomainActive
                ? 'bg-amber-400/20 dark:bg-amber-500/20 border-amber-500/85 dark:border-amber-400/70 text-slate-950 dark:text-white shadow-[0_0_16px_rgba(245,158,11,0.25)] translate-x-1'
                : id === 'portals'
                ? 'bg-amber-400/15 dark:bg-amber-500/15 border-amber-400/75 dark:border-amber-400/45 text-slate-950 dark:text-white hover:bg-amber-400/25 dark:hover:bg-amber-500/25 hover:border-amber-500 hover:translate-x-1'
                : 'bg-white/35 dark:bg-slate-900/35 border-sky-300/60 dark:border-sky-400/30 text-slate-950 dark:text-white hover:bg-white/55 dark:hover:bg-sky-500/20 hover:border-sky-500/75 hover:translate-x-1'
            }`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/35 dark:via-white/10 to-transparent"
            />
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <DomainIcon className={`w-4 h-4 transition-transform duration-300 shrink-0 ${
                  isDomainActive ? 'text-amber-700 dark:text-amber-300 scale-110' : 'text-amber-700 dark:text-amber-300 group-hover:scale-115 group-hover:rotate-12'
                }`} />
                {isDomainActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white truncate">
                {domainTitle}
              </span>
            </div>
            <div className="relative z-10 flex items-center gap-1.5 shrink-0">
              {isDomainActive && (
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border border-emerald-500/50">
                  {language === 'om' ? 'HOJIRRA' : 'ACTIVE'}
                </span>
              )}
              <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-sky-500/20 dark:bg-sky-500/25 text-sky-950 dark:text-sky-100 border border-sky-500/50">
                {items.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-900 dark:text-slate-100 transition-transform duration-300 ease-out ${
                  isOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </div>
          </button>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden space-y-1.5 pt-0.5">
              {items.map((item) => {
                const itemHref = item.key === 'dashboard' ? getRolePortalPath(effectiveRole) : item.href;
                const isActive =
                  pathname === itemHref ||
                  (item.key === 'dashboard' && pathname === getRolePortalPath(effectiveRole));
                const IconComponent = item.icon;
                const itemLabel = t(item.key);

                return (
                  <Link
                    key={item.href}
                    href={itemHref}
                    prefetch={true}
                    onClick={() => setIsMobileOpen(false)}
                    onMouseEnter={() => router.prefetch(itemHref)}
                    onTouchStart={() => router.prefetch(itemHref)}
                    onFocus={() => router.prefetch(itemHref)}
                    className={`mkh-sidebar-rect group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] sm:text-sm tracking-tight backdrop-blur-md cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'mkh-sidebar-active-glow bg-gradient-to-r from-amber-400/35 via-sky-400/25 to-indigo-400/25 dark:from-amber-500/30 dark:via-sky-500/20 dark:to-indigo-500/20 text-slate-950 dark:text-white font-black border-2 border-amber-500/80 dark:border-amber-400/70 translate-x-1 shadow-[0_0_14px_rgba(245,158,11,0.25)]'
                        : 'bg-white/30 dark:bg-slate-900/30 text-slate-950 dark:text-white font-extrabold border border-sky-200/70 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-sky-500/20 hover:border-sky-400/85 dark:hover:border-sky-400/60 hover:translate-x-1.5 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(14,165,233,0.35)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/40 dark:via-white/15 to-transparent"
                    />

                    <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <IconComponent
                          className={`h-4.5 w-4.5 shrink-0 transition-all duration-300 ${
                            isActive
                              ? 'text-amber-800 dark:text-amber-300 scale-110'
                              : 'text-indigo-700 dark:text-sky-300 group-hover:text-amber-700 dark:group-hover:text-amber-300 group-hover:scale-115 group-hover:-rotate-6'
                          }`}
                        />
                        {isActive && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        )}
                      </div>
                      <span className="truncate drop-shadow-xs">{itemLabel}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`relative z-10 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                          isActive
                            ? 'bg-amber-500/30 text-slate-950 dark:text-amber-100 border border-amber-500/60'
                            : item.badgeColor || 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-950 dark:text-white border border-slate-400/60 dark:border-slate-600/60'
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
        </div>
      );
    }

    // 2. MINIMIZED / COLLAPSED SIDEBAR VIEW
    return (
      <div key={id} className="flex flex-col items-center space-y-1.5 w-full">
        {/* Domain Category Icon Button */}
        <button
          type="button"
          onClick={() => toggleDomain(id)}
          title={`${domainTitle} ${isDomainActive ? '(Banameera / Active Domain)' : ''}`}
          aria-expanded={isOpen}
          className={`group/cat relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 cursor-pointer ${
            isDomainActive
              ? 'mkh-sidebar-active-glow bg-gradient-to-br from-amber-400/40 via-sky-400/30 to-indigo-500/30 dark:from-amber-500/40 dark:via-sky-500/30 dark:to-indigo-500/30 border-2 border-amber-500 dark:border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.4)] scale-105'
              : isOpen
              ? 'bg-sky-500/20 dark:bg-sky-500/25 border-2 border-sky-400/70 dark:border-sky-400/50 text-slate-950 dark:text-white shadow-sm'
              : 'bg-white/35 dark:bg-slate-900/35 border border-sky-300/60 dark:border-slate-700/50 text-slate-950 dark:text-white hover:bg-white/65 dark:hover:bg-slate-800/65 hover:border-sky-400 hover:scale-105'
          }`}
        >
          <DomainIcon
            className={`w-5 h-5 transition-transform duration-300 ${
              isDomainActive
                ? 'text-amber-800 dark:text-amber-300 scale-110'
                : 'text-indigo-800 dark:text-sky-200 group-hover/cat:scale-115'
            }`}
          />

          {/* Pulsing Beacon if this domain contains the active route */}
          {isDomainActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </span>
          )}

          {/* Indicator chip at the bottom: arrow if open, or item count if closed */}
          <span className="absolute -bottom-1 text-[8px] font-mono font-black px-1 rounded-full bg-slate-900/85 text-white dark:bg-white/90 dark:text-slate-950 border border-slate-700 dark:border-slate-300 leading-none py-0.5">
            {isOpen ? '▲' : items.length}
          </span>

          {/* Floating Tooltip */}
          <div className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover/cat:flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 text-xs font-black text-slate-950 dark:text-white shadow-xl border border-sky-400 dark:border-slate-700">
            <span>{domainTitle}</span>
            {isDomainActive && (
              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                ({language === 'om' ? 'BANAMEERA' : 'ACTIVE'})
              </span>
            )}
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">({items.length})</span>
          </div>
        </button>

        {/* Sub-items accordion: rendered ONLY when isOpen === true */}
        <div
          className={`grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden space-y-1.5 pt-1.5 flex flex-col items-center w-full">
            {items.map((item) => {
              const itemHref = item.key === 'dashboard' ? getRolePortalPath(effectiveRole) : item.href;
              const isActive =
                pathname === itemHref ||
                (item.key === 'dashboard' && pathname === getRolePortalPath(effectiveRole));
              const IconComponent = item.icon;
              const itemLabel = t(item.key);

              return (
                <Link
                  key={item.href}
                  href={itemHref}
                  prefetch={true}
                  onClick={() => setIsMobileOpen(false)}
                  onMouseEnter={() => router.prefetch(itemHref)}
                  onTouchStart={() => router.prefetch(itemHref)}
                  onFocus={() => router.prefetch(itemHref)}
                  title={`${itemLabel} ${isActive ? '(Active)' : ''}`}
                  className={`mkh-sidebar-rect group relative flex items-center justify-center w-10 h-10 rounded-xl backdrop-blur-md cursor-pointer transition-all duration-300 ${
                    isActive
                      ? 'mkh-sidebar-active-glow bg-gradient-to-br from-amber-400/40 via-sky-400/30 to-indigo-500/30 dark:from-amber-500/35 dark:via-sky-500/25 dark:to-indigo-500/25 text-slate-950 dark:text-white font-black border-2 border-amber-500 dark:border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.4)] scale-105'
                      : 'bg-white/30 dark:bg-slate-900/30 text-slate-950 dark:text-white font-extrabold border border-sky-200/70 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-sky-500/20 hover:border-sky-400/85 hover:scale-105'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/40 dark:via-white/15 to-transparent"
                  />

                  {/* Pulsing Beacon if this item is currently active */}
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-slate-900" />
                    </span>
                  )}

                  <IconComponent
                    className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 ${
                      isActive
                        ? 'text-amber-800 dark:text-amber-300 scale-110'
                        : 'text-indigo-700 dark:text-sky-300 group-hover:scale-115'
                    }`}
                  />

                  {/* Floating Tooltip in collapsed mode */}
                  <div className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 text-xs font-black text-slate-950 dark:text-white shadow-xl border border-sky-400 dark:border-slate-700">
                    <span>{itemLabel}</span>
                    {isActive && (
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                        ({language === 'om' ? 'HOJIRRA JIRA' : 'ACTIVE'})
                      </span>
                    )}
                    {item.badge && (
                      <span className="font-mono text-[10px] text-teal-800 dark:text-teal-200">({item.badge})</span>
                    )}
                    <span className="text-[10px] text-amber-700 dark:text-amber-300">[{domainTitle}]</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. DESKTOP / PC SIDEBAR (FROSTED GLASS TRANSPARENCY + CRISP TEXT + ANIMATED HOVER) */}
      <aside
        className={`hidden lg:flex ${
          isCollapsed ? 'w-18' : 'w-72 lg:w-76'
        } flex-shrink-0 border-r-2 border-sky-300/75 dark:border-sky-400/35 bg-white/45 dark:bg-slate-950/45 backdrop-blur-2xl text-slate-950 dark:text-white flex-col h-screen sticky top-0 shadow-[10px_0_32px_-10px_rgba(14,165,233,0.22)] dark:shadow-2xl select-none z-20 transition-all duration-300`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-16 items-center ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
          } border-b border-sky-300/60 dark:border-slate-700/60 flex-shrink-0 bg-white/35 dark:bg-slate-900/40 backdrop-blur-md`}
        >
          <Link
            href={getRolePortalPath(effectiveRole)}
            className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
            title={t('hospital_name')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/35 to-orange-500/25 border-2 border-amber-500/60 text-amber-800 dark:text-amber-300 shrink-0 group-hover:scale-110 group-hover:rotate-3 shadow-[0_0_16px_rgba(245,158,11,0.25)] transition-all duration-300">
              <Building2 className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="text-sm font-black text-slate-950 dark:text-white tracking-tight leading-tight block group-hover:text-indigo-800 dark:group-hover:text-amber-300 transition-colors truncate">
                  {t('hospital_name')}
                </span>
                <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 block truncate">
                  Enterprise Clinical OS
                </span>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              title="Minimize sidebar"
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/70 transition-colors cursor-pointer shrink-0 ml-1"
              aria-label="Minimize sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Groups (Dashboard First -> Staff Portal -> Remaining Domains) */}
        <nav className={`flex-1 overflow-y-auto space-y-3.5 ${isCollapsed ? 'p-1.5' : 'p-3'} custom-scrollbar`}>
          {isPatientRole ? (
            <div className="space-y-1.5">
              <span className="px-3 text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-200 block mb-1.5">
                {language === 'om' ? 'Kutaa Dhukkubsataa' : language === 'am' ? 'የታካሚ ክፍል' : 'Patient Care Portal'}
              </span>
              {patientItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`mkh-sidebar-rect group relative flex items-center overflow-hidden ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
                    } rounded-xl backdrop-blur-md cursor-pointer ${
                      isActive
                        ? 'mkh-sidebar-active-glow bg-gradient-to-r from-teal-500/25 via-emerald-500/20 to-sky-500/25 dark:from-teal-500/30 dark:via-emerald-500/25 dark:to-sky-500/25 border-2 border-teal-500/85 dark:border-teal-400/70 text-slate-950 dark:text-white font-black translate-x-1'
                        : 'bg-white/30 dark:bg-slate-900/30 text-slate-950 dark:text-white font-extrabold border border-sky-200/70 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-teal-500/20 hover:border-teal-400/85 dark:hover:border-teal-400/60 hover:translate-x-1.5 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(20,184,166,0.35)]'
                    } transition-all duration-300`}
                  >
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/40 dark:via-white/15 to-transparent" />
                    <div className={`relative z-10 flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
                      <IconComponent className="h-4.5 w-4.5 text-teal-700 dark:text-teal-300 shrink-0 group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300" />
                      {!isCollapsed && <span className="truncate text-sm">{t(item.key)}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span className={`relative z-10 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-teal-500/30 text-slate-950 dark:text-teal-100 border border-teal-500/60' : 'bg-teal-500/20 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border border-teal-500/45'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {isCollapsed && (
                      <div className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 text-xs font-extrabold text-slate-950 dark:text-white shadow-xl border border-teal-400 dark:border-slate-700">
                        <span>{t(item.key)}</span>
                        {item.badge && (
                          <span className="font-mono text-[10px] text-teal-800 dark:text-teal-200">({item.badge})</span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <>
              {renderPrimaryDashboardCard(isCollapsed, false)}
              {isCollapsed && (
                <div className="w-8 h-px bg-sky-300/60 dark:bg-slate-700/60 my-2 mx-auto" />
              )}
              {domains.map((domain) => renderNavGroup(domain, isCollapsed))}
            </>
          )}
        </nav>

        {/* Hospital Footer status & Collapse Toggle */}
        <div className="p-2.5 border-t border-sky-300/60 dark:border-slate-700/60 bg-white/35 dark:bg-slate-900/40 backdrop-blur-md space-y-2 text-xs">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] font-mono font-extrabold text-amber-950 dark:text-amber-100 bg-amber-300/60 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-md border border-amber-500/60 dark:border-amber-500/50 truncate">
                    {effectiveRole.toUpperCase()} {simulatedRole ? '(SIM)' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  title="Collapse sidebar to icon mode"
                  className="p-1.5 rounded-lg text-slate-900 dark:text-white hover:bg-white/60 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Administrative Supervisory Authority & Workstation Inspector */}
              {isSupervisorRole && (
                <div className="rounded-xl bg-white/40 dark:bg-slate-900/45 backdrop-blur-md border-2 border-amber-400/65 dark:border-amber-400/45 p-2.5 space-y-2 shadow-sm hover:border-amber-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                      <Eye className="w-4 h-4" />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        {language === 'om' ? "To'annoo Ogeessotaa" : language === 'am' ? 'የስራ ክትትል' : 'Staff Oversight'}
                      </span>
                    </div>
                    {simulatedRole && (
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedRole(null);
                          router.push('/portal/admin');
                        }}
                        className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{language === 'om' ? 'Deebi\'i' : 'Reset'}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
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
                      router.push(getRolePortalPath(nextRole));
                    }}
                    className="w-full bg-white/80 dark:bg-slate-950/75 border-2 border-amber-400/75 dark:border-amber-500/50 text-slate-950 dark:text-white text-xs rounded-lg px-2.5 py-1.5 font-extrabold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="admin">🛡️ ADMIN (Executive)</option>
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold py-2.5 px-3 text-xs sm:text-sm shadow-md shadow-rose-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-rose-400/40"
              >
                <LogOut className="h-4 w-4 shrink-0" />
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
                className="p-1.5 rounded-md text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 hover:bg-white/60 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 3. MOBILE SLIDE-OVER DRAWER PANEL */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white/55 dark:bg-slate-950/60 backdrop-blur-2xl text-slate-950 dark:text-white shadow-2xl flex flex-col lg:hidden transform transition-transform duration-300 ease-out border-r-2 border-sky-300/75 dark:border-sky-400/35 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header with Brand & Close Button */}
        <div className="flex h-16 items-center justify-between border-b border-sky-300/60 dark:border-slate-700/60 px-4 bg-white/40 dark:bg-slate-900/45 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/25 border-2 border-amber-500/60 text-amber-800 dark:text-amber-300 shrink-0">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-black text-slate-950 dark:text-white truncate">
              {t('hospital_name')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 dark:bg-slate-800/80 text-slate-950 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Workstation Links */}
        <nav className="flex-1 overflow-y-auto space-y-3.5 p-3 custom-scrollbar">
          {isPatientRole ? (
            <div className="space-y-1.5">
              <span className="px-3 text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-200 block mb-1.5">
                {language === 'om' ? 'Kutaa Dhukkubsataa' : language === 'am' ? 'የታካሚ ክፍል' : 'Patient Care Portal'}
              </span>
              {patientItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="mkh-sidebar-rect flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/45 dark:bg-slate-900/45 backdrop-blur-md border-2 border-teal-500/50 text-slate-950 dark:text-white font-extrabold text-sm"
                >
                  <item.icon className="w-4.5 h-4.5 text-teal-700 dark:text-teal-300" />
                  <span>{t(item.key)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <>
              {renderPrimaryDashboardCard(false, true)}
              {domains.map((domain) => renderNavGroup(domain))}
            </>
          )}
        </nav>

        {/* Mobile Drawer Footer with Logout Button */}
        <div className="p-3 border-t border-sky-300/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/45 backdrop-blur-md shrink-0 space-y-2">
          {isSupervisorRole && (
            <select
              value={effectiveRole}
              onChange={(e) => {
                const nextRole = e.target.value as UserRole;
                setSimulatedRole(nextRole === 'admin' ? null : nextRole);
                setIsMobileOpen(false);
                router.push(getRolePortalPath(nextRole));
              }}
              className="w-full bg-white/80 dark:bg-slate-950/75 border-2 border-amber-400/75 dark:border-amber-500/50 text-slate-950 dark:text-white text-xs rounded-lg p-2 font-extrabold"
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
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold py-2.5 px-4 text-sm shadow-md shadow-rose-600/25 active:scale-95 transition-all cursor-pointer border border-rose-400/30"
          >
            <LogOut className="h-4 w-4" />
            <span>{language === 'om' ? "Sirna Keessaa Ba'i" : language === 'am' ? 'ከስርዓቱ ውጣ' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
