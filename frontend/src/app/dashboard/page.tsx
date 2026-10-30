/**
 * Mettu Karl Referral Hospital — Clinical Executive Command Dashboard.
 *
 * User Request Enhancements:
 * 1. High-Visibility Command Search Bar: Positioned prominently with clear borders,
 *    magnifying icon, live match count, and responsive focus/hover spotlight.
 * 2. Rectangular Responsive Cursor Hover Spotlight: Tasteful, clearly discernible
 *    medical teal spotlight (hover:border-teal-500, hover:bg-teal-50/70, hover:ring-2 hover:ring-teal-400/40)
 *    showing exactly where the cursor is resting.
 * 3. Spacious Layout & Category Tabs: De-cluttered 4-column grid with generous whitespace.
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AdminOversightHub } from '@/components/admin/AdminOversightHub';
import type { UserRole } from '@/types';

interface Workstation {
  id: string;
  name: string;
  localName: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  category: 'emergency' | 'clinical' | 'operations' | 'governance';
  allowedRoles?: UserRole[];
}

export default function DashboardPage(): React.ReactElement {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  // Workflow Category Tab
  const [activeTab, setActiveTab] = useState<'all' | 'emergency' | 'clinical' | 'operations' | 'governance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [activeCodeBlue, setActiveCodeBlue] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role === 'patient') {
        router.replace('/patient-portal');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Spacious Workstations with RBAC allowedRoles
  const workstations: Workstation[] = useMemo(
    () => [
      // 1. Emergency & Critical Care
      {
        id: 'patients',
        name: 'Patients (FHIR R4)',
        localName: 'Galmee Dhukkubsattootaa',
        href: '/patients',
        icon: '👥',
        badge: '340 Inpatients',
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
      },
      {
        id: 'queue',
        name: 'Queue & Token TV',
        localName: 'To\'annoo Dabaree OPD',
        href: '/queue',
        icon: '🎫',
        badge: '18 Waiting',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'receptionist', 'super_admin'],
      },
      {
        id: 'mci',
        name: 'MCI & START Triage',
        localName: 'Balaa Tasaa (MCI)',
        href: '/mci',
        icon: '🚨',
        badge: '3 Red Active',
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
      },
      {
        id: 'blood-bank',
        name: 'Blood Bank & Stock',
        localName: 'Kuusaa Dhiigaa',
        href: '/blood-bank',
        icon: '🩸',
        badge: 'O- Low Stock',
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'technician', 'super_admin'],
      },
      {
        id: 'ems',
        name: '907 EMS Ambulance',
        localName: 'Ambulaansii 907',
        href: '/ems',
        icon: '🚑',
        badge: '4 Ready',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
      },
      {
        id: 'iomt',
        name: 'IoMT ICU Telemetry',
        localName: 'Mallattoo Lubbuu ICU',
        href: '/iomt',
        icon: '📡',
        badge: '18 Live Beds',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'technician', 'super_admin'],
      },

      // 2. Clinical Care & Diagnostics
      {
        id: 'pharmacy',
        name: 'Pharmacy & FEFO',
        localName: 'Farmaasii fi Qoricha',
        href: '/pharmacy',
        icon: '💊',
        badge: '98% Stocked',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'clinical',
        allowedRoles: ['pharmacist', 'doctor', 'super_admin'],
      },
      {
        id: 'pacs',
        name: 'PACS & Radiology',
        localName: 'Suuraa X-Ray / CT',
        href: '/pacs',
        icon: '🩻',
        badge: '12 Scans Ready',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'clinical',
        allowedRoles: ['doctor', 'technician', 'super_admin'],
      },
      {
        id: 'ot',
        name: 'OT Surgery & CSSD',
        localName: 'Kutaa Baqaqsanii Yaaluu',
        href: '/ot',
        icon: '🔪',
        badge: '3 In Surgery',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
        category: 'clinical',
        allowedRoles: ['doctor', 'nurse', 'super_admin'],
      },
      {
        id: 'telemed',
        name: 'Telemedicine Call',
        localName: 'Yaala Fagoo Vidiyoo',
        href: '/telemed',
        icon: '🩺',
        badge: 'Online',
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        category: 'clinical',
        allowedRoles: ['doctor', 'super_admin'],
      },
      {
        id: 'dietary',
        name: 'Dietary & Kitchen',
        localName: 'Nyaata Dhukkubsattootaa',
        href: '/dietary',
        icon: '🍲',
        badge: '340 Meals',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        category: 'clinical',
        allowedRoles: ['nurse', 'admin', 'super_admin'],
      },
      {
        id: 'crm',
        name: 'Patient CRM & Care',
        localName: 'Komii fi Yaada (CRM)',
        href: '/crm',
        icon: '🤝',
        badge: '4 Feedback',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        category: 'clinical',
        allowedRoles: ['admin', 'insurance_officer', 'super_admin'],
      },

      // 3. Operations & Finance
      {
        id: 'billing',
        name: 'Telebirr & Billing',
        localName: 'Kaffaltii fi Inshuraansii',
        href: '/billing',
        icon: '💳',
        badge: 'ETB 84.5K Today',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'operations',
        allowedRoles: ['billing', 'insurance_officer', 'admin', 'super_admin'],
      },
      {
        id: 'accounting',
        name: 'Finance & Ledger',
        localName: 'Herrega Guutuu (GL)',
        href: '/accounting',
        icon: '📑',
        badge: 'Reconciled',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'operations',
        allowedRoles: ['billing', 'admin', 'super_admin'],
      },
      {
        id: 'hrm',
        name: 'HRM & Shift Payroll',
        localName: 'Hojjetootaa fi Mindaa',
        href: '/hrm',
        icon: '👔',
        badge: '482 Staff',
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        category: 'operations',
        allowedRoles: ['admin', 'super_admin'],
      },
      {
        id: 'assets',
        name: 'Biomedical Assets',
        localName: 'Meeshaalee Yaalaa',
        href: '/assets',
        icon: '🔬',
        badge: '99.2% Uptime',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'operations',
        allowedRoles: ['technician', 'admin', 'super_admin'],
      },
      {
        id: 'waste',
        name: 'Medical Waste',
        localName: 'Balfa Yaalaa',
        href: '/waste',
        icon: '☣️',
        badge: 'Incinerator 850°C',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        category: 'operations',
        allowedRoles: ['technician', 'admin', 'super_admin'],
      },
      {
        id: 'procurement',
        name: 'Supply Chain',
        localName: 'Bittaa fi Caalbaasii',
        href: '/procurement',
        icon: '📦',
        badge: '3 Active Tenders',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        category: 'operations',
        allowedRoles: ['admin', 'pharmacist', 'super_admin'],
      },
      {
        id: 'mortuary',
        name: 'Mortuary Vaults',
        localName: 'Kutaa Reeffaa',
        href: '/mortuary',
        icon: '⚰️',
        badge: '-4.2°C Cold',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        category: 'operations',
        allowedRoles: ['doctor', 'admin', 'super_admin'],
      },

      // 4. Governance & Resilience
      {
        id: 'fayda',
        name: 'Fayda National ID',
        localName: 'Eenyummaa Biyyaalessaa',
        href: '/fayda',
        icon: '🆔',
        badge: 'NIDP Verified',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'governance',
        allowedRoles: ['insurance_officer', 'admin', 'receptionist', 'super_admin'],
      },
      {
        id: 'efda',
        name: 'EFDA Drug Safety',
        localName: 'Nageenya Qorichaa',
        href: '/efda',
        icon: '⚖️',
        badge: 'MoH Compliant',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'governance',
        allowedRoles: ['pharmacist', 'admin', 'super_admin'],
      },
      {
        id: 'infection',
        name: 'Infection Control',
        localName: 'To\'annoo Dhibee (EPHI)',
        href: '/infection',
        icon: '🧫',
        badge: 'Zero Outbreaks',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'governance',
        allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
      },
      {
        id: 'insurance',
        name: 'CBHI & Claims',
        localName: 'Inshuraansii Fayyaa',
        href: '/insurance',
        icon: '🧾',
        badge: '98% Approved',
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        category: 'governance',
        allowedRoles: ['insurance_officer', 'admin', 'billing', 'super_admin'],
      },
      {
        id: 'audit',
        name: 'Clinical Audit EHSTG',
        localName: 'Qulqullina Tajaajilaa',
        href: '/audit',
        icon: '📋',
        badge: 'Level 4 (91.5%)',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
        category: 'governance',
        allowedRoles: ['admin', 'doctor', 'super_admin'],
      },
      {
        id: 'power',
        name: 'Power & Solar Grid',
        localName: 'Ibsaa fi Soolaarii',
        href: '/power',
        icon: '⚡',
        badge: '100% Online',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'governance',
        allowedRoles: ['technician', 'admin', 'super_admin'],
      },
      {
        id: 'analytics',
        name: 'Executive BI',
        localName: 'Gabaasa Hoggansaa',
        href: '/analytics',
        icon: '📈',
        badge: 'Real-time KPIs',
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'governance',
        allowedRoles: ['admin', 'doctor', 'super_admin'],
      },
      {
        id: 'academic',
        name: 'Research & Trials',
        localName: 'Qorannoo Ogeeyyii',
        href: '/academic',
        icon: '🎓',
        badge: '6 Trials Active',
        badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        category: 'governance',
        allowedRoles: ['doctor', 'admin', 'super_admin'],
      },
    ],
    []
  );

  const displayedWorkstations = useMemo(() => {
    return workstations.filter((w) => {
      // 1. RBAC Filtering by User Role: Super admin and Admin have full access across all workstations
      const matchesRole =
        !user?.role ||
        user.role === 'super_admin' ||
        user.role === 'admin' ||
        !w.allowedRoles ||
        w.allowedRoles.includes(user.role);

      if (!matchesRole) return false;

      // 2. Category Tab Filter
      const matchesTab = activeTab === 'all' || w.category === activeTab;

      // 3. Search Query Filter
      const matchesSearch =
        !searchQuery.trim() ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.localName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [workstations, activeTab, searchQuery, user?.role]);

  // Pre-warm workstation routes for instantaneous transitions
  useEffect(() => {
    workstations.forEach((w) => {
      try {
        router.prefetch(w.href);
      } catch {
        // ignore
      }
    });
  }, [router, workstations]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <></>;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 lg:p-8 space-y-7">
          {/* Top Context & Greeting Bar (Responsive rectangular hover) */}
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 min-w-0">
              <span className="flex h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0 space-y-1">
                <h1 className="text-xl font-black text-slate-900 tracking-tight truncate group-hover:text-teal-950 transition-colors">
                  {t('welcome_back')},{' '}
                  <span className="text-teal-700">
                    {user?.username === 'admin'
                      ? 'System Administrator'
                      : user?.username === 'nurse_chaltu'
                      ? 'Nurse Chaltu'
                      : 'Dr. Bekele Tadesse'}
                  </span>
                </h1>
                <p className="text-xs font-semibold text-slate-500 truncate">
                  Mettu Karl Referral Hospital • Active Shift:{' '}
                  <span className="text-slate-800 font-bold">Morning Duty (08:00 - 16:00)</span> • Catchment: 2.5M
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-block font-mono text-xs font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 group-hover:bg-white transition-colors">
                {currentDateTime}
              </span>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-rose-700 hover:ring-2 hover:ring-rose-400/40 transition-all cursor-pointer"
              >
                <span className="text-sm">🚨</span>
                <span>Emergency Action</span>
              </button>
            </div>
          </div>

          {/* RBAC SCOPE & ROLE-BASED WORKSTATION NOTICE */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border-2 border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-lg shadow-sm">
                {user?.role === 'admin'
                  ? '🏛️'
                  : user?.role === 'doctor'
                  ? '🩺'
                  : user?.role === 'nurse'
                  ? '💉'
                  : user?.role === 'pharmacist'
                  ? '💊'
                  : user?.role === 'insurance_officer'
                  ? '🧾'
                  : user?.role === 'technician'
                  ? '🔧'
                  : '🏥'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                    Gahee Hojii: {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'DOCTOR'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    • Workstations Scoped:{' '}
                    <strong className="text-slate-800">{displayedWorkstations.length}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {user?.role === 'admin' && (
                    <>
                      <strong>To'annoo fi Quunnamtii Bulchiinsa Hospitaalaa:</strong> Kutaaleen hospitaalaa hundi (Ogeeyyii Yaalaa, Narsitoota, Farmaasii, Dhukkubsattoota, fi Faayinaansii) to'annoo keessan jala jiru. Kallattiin to'achuu, hordofuu fi qunnamuuf qophiidha.
                    </>
                  )}
                  {user?.role === 'doctor' && (
                    <>
                      <strong>Kiliinikaa & CDSS:</strong> Galmee dhukkubsattootaa, OPD, qorannoo qorichaa, fi baqaqsanii yaaluu qofti ifa ta'aniiru. Herregni baankii/HRM roolii kanaan hin hayyamamu.
                    </>
                  )}
                  {user?.role === 'nurse' && (
                    <>
                      <strong>Yaala Saffisaa & ICU:</strong> Galmee dhukkubsattootaa, dabaree OPD, ICU Telemetry, fi nyaanni dhukkubsattootaa ifa ta'aniiru.
                    </>
                  )}
                  {user?.role === 'pharmacist' && (
                    <>
                      <strong>Farmaasii & Qoricha:</strong> Kuusaa FEFO, kenniinsa qorichaa, fi nageenyi qorichaa EFDA ifa ta'aniiru.
                    </>
                  )}
                  {user?.role === 'insurance_officer' && (
                    <>
                      <strong>Inshuraansii & Kaffaltii:</strong> Gaaffilee inshuraansii CBHI/EHIA, Fayda ID, fi kaffaltiileen ifa ta'aniiru.
                    </>
                  )}
                  {user?.role === 'technician' && (
                    <>
                      <strong>Biomedical & Infrastructure:</strong> Meeshaalee yaalaa, humna ibsaa/soolaarii, fi meeshaalee PACS ifa ta'aniiru.
                    </>
                  )}
                  {(!user?.role || user.role === 'super_admin') && (
                    <>Hospitaala Guutuu: Kutaaleen hundi guutummaatti ifa ta'anii jiru.</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {user?.role === 'admin' || user?.role === 'super_admin' ? 'Executive Governance Active' : 'RBAC Scoped (Active)'}
              </span>
            </div>
          </div>

          {/* DEDICATED HOSPITAL EXECUTIVE OVERSIGHT & DIRECT CONTACT HUB (ADMIN & SUPER ADMIN) */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <AdminOversightHub />
          )}

          {/* SECTION 1: 3-SECOND CLINICAL VITAL SIGNS (Responsive Rectangular Hover Cards) */}
          <div>
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>📊</span> Hospital Situational Awareness
              </h2>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Live Clinical Sensors Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* Tile 1: Bed Capacity */}
              <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-wider">Bed Capacity (BOR)</span>
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200 group-hover:bg-white group-hover:border-teal-400 transition-colors">
                    85% Occupancy
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">340</span>
                  <span className="text-sm font-bold text-slate-400">/ 400 Total Beds</span>
                </div>
                <div className="mt-3.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: '85%' }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>60 Beds Available</span>
                  <span className="text-teal-700 font-bold">ICU: 4 Free</span>
                </div>
              </div>

              {/* Tile 2: START Emergency Triage */}
              <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-wider">Emergency ED Triage</span>
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200 group-hover:bg-white transition-colors">
                    63 In ED
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-rose-50 py-2 border border-rose-200 group-hover:bg-white transition-colors">
                    <span className="block text-base font-black text-rose-700">3</span>
                    <span className="text-[10px] font-bold text-rose-800 uppercase">Red</span>
                  </div>
                  <div className="rounded-xl bg-amber-50 py-2 border border-amber-200 group-hover:bg-white transition-colors">
                    <span className="block text-base font-black text-amber-700">12</span>
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Yel</span>
                  </div>
                  <div className="rounded-xl bg-emerald-50 py-2 border border-emerald-200 group-hover:bg-white transition-colors">
                    <span className="block text-base font-black text-emerald-700">48</span>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Grn</span>
                  </div>
                  <div className="rounded-xl bg-slate-100 py-2 border border-slate-200 group-hover:bg-white transition-colors">
                    <span className="block text-base font-black text-slate-600">0</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Blk</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] font-semibold text-slate-400">
                  3 Acute Resuscitations active
                </p>
              </div>

              {/* Tile 3: Blood & Oxygen Supply */}
              <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-wider">Blood & Oxygen</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200 group-hover:bg-white transition-colors">
                    Stable
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">4.8</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">Bar</span>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">O₂ Pipeline</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-600">6</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">Units</span>
                    <p className="text-xs font-bold text-rose-600 mt-0.5">O-Neg (Low Stock)</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-400">
                  <span>14 Days Liquid O₂</span>
                  <span className="font-bold text-slate-700">124 Units Total</span>
                </div>
              </div>

              {/* Tile 4: Power Grid & Resilience */}
              <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-wider">Power & Grid</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 group-hover:bg-white transition-colors">
                    100% Online
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-600">EEU Grid</span>
                  <span className="text-xs font-bold text-slate-500">+ 120kW Solar</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Dual 500kVA Diesel (94% Ready)
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">Auto-switch: &lt;10s ready</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: WORKSTATION DIRECTORY */}
          <div className="space-y-4">
            {/* Filter Toolbar: Search Bar on LEFT + Category Tabs Following Immediately to the Right */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* COMPACT & SHORTENED SEARCH BAR (Gara Bitaatti / Left Side Position) */}
              <div className="relative w-full sm:w-80 md:w-96 shrink-0">
                <div className="flex h-12 items-center rounded-2xl border-[3px] border-teal-600 bg-white px-4 shadow-sm hover:border-teal-700 focus-within:border-teal-700 focus-within:ring-4 focus-within:ring-teal-400/30 transition-all duration-150">
                  <span className="text-base text-teal-800 mr-2.5 shrink-0">🔍</span>
                  <input
                    type="text"
                    placeholder={t('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base font-extrabold text-slate-950 placeholder-slate-400 focus:outline-none tracking-wide"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="ml-1 text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                  <span className="ml-2 rounded-xl bg-teal-100/90 border-2 border-teal-300 px-2.5 py-0.5 text-xs font-black text-teal-900 shrink-0">
                    {displayedWorkstations.length}
                  </span>
                </div>
              </div>

              {/* Category Tabs (Following immediately after the search bar) */}
              <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-200/70 p-1.5 text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-teal-700 text-white shadow-xs font-black ring-2 ring-teal-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  All ({workstations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('emergency')}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'emergency'
                      ? 'bg-rose-700 text-white shadow-xs font-black ring-2 ring-rose-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  <span>🚨</span> Emergency & Triage
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clinical')}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'clinical'
                      ? 'bg-teal-700 text-white shadow-xs font-black ring-2 ring-teal-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  <span>🩺</span> Clinical Care
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('operations')}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'operations'
                      ? 'bg-blue-700 text-white shadow-xs font-black ring-2 ring-blue-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  <span>💼</span> Operations & ERP
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('governance')}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'governance'
                      ? 'bg-purple-700 text-white shadow-xs font-black ring-2 ring-purple-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  <span>⚖️</span> Regulations
                </button>
              </div>
            </div>

            {/* 3. WORKSTATIONS GRID (Responsive Rectangular Hover Spotlight) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedWorkstations.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onFocus={() => router.prefetch(item.href)}
                  className="group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200/90 bg-white p-5 shadow-2xs hover:border-teal-500 hover:bg-teal-50/70 hover:shadow-lg hover:ring-2 hover:ring-teal-400/30 transition-all duration-150 ease-in-out cursor-pointer active:scale-[0.98] transform hover:-translate-y-0.5 min-h-[130px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-2xl group-hover:scale-110 group-hover:bg-white group-hover:border-teal-400 group-hover:shadow-xs transition-all">
                        {item.icon}
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 transition-colors ${item.badgeColor} group-hover:bg-white group-hover:shadow-2xs`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs font-semibold text-teal-700 mt-1 truncate group-hover:text-teal-800 transition-colors">
                      {item.localName}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-teal-800 border-t border-slate-100 group-hover:border-teal-200/60 pt-2.5 transition-colors">
                    <span className="group-hover:underline">Open Workstation</span>
                    <span className="text-sm group-hover:translate-x-1.5 transition-transform">→</span>
                  </div>
                </Link>
              ))}

              {displayedWorkstations.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm font-semibold text-slate-400 bg-white rounded-3xl border border-slate-200">
                  No workstations found matching "{searchQuery}".
                </div>
              )}
            </div>
          </div>

          {/* EMERGENCY PROTOCOL MODAL */}
          {emergencyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
              <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl border-2 border-rose-300 overflow-hidden">
                <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-pulse">🚨</span>
                    <h2 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                      Emergency Rapid Action Hub
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(false)}
                    className="rounded-full p-2 text-rose-400 hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCodeBlue(true);
                        setEmergencyModalOpen(false);
                      }}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-blue-600 bg-blue-50/70 p-5 text-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer group hover:shadow-lg hover:ring-2 hover:ring-blue-400/40"
                    >
                      <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">💙</span>
                      <span className="text-xs font-black text-blue-900 group-hover:text-white">
                        CODE BLUE
                      </span>
                      <span className="text-[11px] text-blue-700 group-hover:text-blue-100 mt-0.5">
                        Cardiac Arrest Resuscitation
                      </span>
                    </button>

                    <Link
                      href="/mci"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-rose-600 bg-rose-50/70 p-5 text-center hover:bg-rose-600 hover:text-white transition-all group hover:shadow-lg hover:ring-2 hover:ring-rose-400/40"
                    >
                      <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">🆘</span>
                      <span className="text-xs font-black text-rose-900 group-hover:text-white">
                        MASS CASUALTY (MCI)
                      </span>
                      <span className="text-[11px] text-rose-700 group-hover:text-rose-100 mt-0.5">
                        START Disaster Protocol
                      </span>
                    </Link>

                    <Link
                      href="/ems"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-center hover:bg-slate-800 hover:text-white transition-all group hover:shadow-lg hover:ring-2 hover:ring-slate-400/40"
                    >
                      <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">🚑</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-white">
                        907 Ambulance
                      </span>
                      <span className="text-[11px] text-slate-500 group-hover:text-slate-200 mt-0.5">
                        Dispatch Vehicle
                      </span>
                    </Link>

                    <Link
                      href="/patients"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-center hover:bg-teal-700 hover:text-white transition-all group hover:shadow-lg hover:ring-2 hover:ring-teal-400/40"
                    >
                      <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">👥</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-white">
                        Fast Intake
                      </span>
                      <span className="text-[11px] text-slate-500 group-hover:text-teal-100 mt-0.5">
                        Register Walk-in Patient
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CODE BLUE BANNER (IF TRIGGERED) */}
          {activeCodeBlue && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-3xl bg-blue-900 p-5 text-white shadow-2xl border border-blue-400 animate-bounce">
              <span className="text-3xl">💙</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">
                  Active CODE BLUE: Resuscitation Team Dispatched
                </p>
                <p className="text-xs text-blue-200 mt-0.5">
                  Crash Cart #2 en route to ED Acute Resuscitation Bed 01
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCodeBlue(false)}
                className="ml-3 rounded-xl bg-blue-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
