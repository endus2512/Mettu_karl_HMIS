/**
 * Enterprise Hospital Information System Header.
 *
 * Enterprise Healthcare Design System:
 * - Professional Navy & Teal palette
 * - Modern Lucide SVG icons
 * - Clean command bar with calendar, shift, scanner, SMS gateway, notifications, language, theme, and logout
 * - Modal configuration for Ethiopian/Gregorian date and shift with local persistence
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import apiClient from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useHospitalTimeSync, type ShiftType } from '@/lib/timeSync';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { ZenModeToggle } from '@/components/common/ZenModeToggle';
import { NotificationBell } from '@/components/common/NotificationBell';
import { OmnisearchCommandCenter } from '@/components/common/OmnisearchCommandCenter';
import { getPendingCount, triggerEdgeBatchSync } from '@/lib/offlineSync';
import {
  Calendar,
  Sun,
  Moon,
  CloudSun,
  Menu,
  X,
  RotateCcw,
  LogOut,
  Building2,
  Clock,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

const ETH_MONTHS = [
  { val: 'Meskerem', label: 'Meskerem (Fulbaana)' },
  { val: 'Tikimt', label: 'Tikimt (Onkololeessa)' },
  { val: 'Hidar', label: 'Hidar (Sadaasa)' },
  { val: 'Tahsas', label: 'Tahsas (Muddee)' },
  { val: 'Tir', label: 'Tir (Amajjii)' },
  { val: 'Yakatit', label: 'Yakatit (Guraandhala)' },
  { val: 'Megabit', label: 'Megabit (Bitooteessa)' },
  { val: 'Miazia', label: 'Miazia (Ebla)' },
  { val: 'Ginbot', label: 'Ginbot (Caamsaa)' },
  { val: 'Sene', label: 'Sene (Waxabajjii)' },
  { val: 'Hamle', label: 'Hamle (Adooleessa)' },
  { val: 'Nehase', label: 'Nehase (Hagayya)' },
  { val: 'Pagume', label: 'Pagume (Phaagumee)' },
];

export function Header(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, activeRole, simulatedRole } = useAuth();
  const { t, language } = useTranslation();
  const {
    serverTime,
    gregorian,
    ethiopian,
    shift,
    ntpSynced,
    overrideShift,
    resetAutoShift,
    isUpdating,
  } = useHospitalTimeSync();

  const isSupervisor = user?.role === 'admin' || user?.role === 'super_admin';
  const effectiveRole = (isSupervisor ? activeRole : user?.role) || 'patient';

  // Online Calendar & Shift Modal Configuration State
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editEthMonth, setEditEthMonth] = useState('Tikimt');
  const [editEthDay, setEditEthDay] = useState('29');
  const [editEthYear, setEditEthYear] = useState('2019');
  const [editShiftType, setEditShiftType] = useState<ShiftType>('morning');
  const [editChargeNurse, setEditChargeNurse] = useState('');
  const [editDutyPhysician, setEditDutyPhysician] = useState('');
  const [editHandoverNotes, setEditHandoverNotes] = useState('');

  // Sync modal values with backend data when modal opens
  useEffect(() => {
    if (ethiopian) {
      setEditEthMonth(ethiopian.month_name_om || 'Tikimt');
      setEditEthDay(String(ethiopian.day || 29));
      setEditEthYear(String(ethiopian.year || 2019));
    }
    if (shift) {
      setEditShiftType(shift.type || 'morning');
      setEditChargeNurse(shift.charge_nurse || '');
      setEditDutyPhysician(shift.duty_physician || '');
      setEditHandoverNotes(shift.handover_notes || '');
    }
  }, [calendarModalOpen, ethiopian, shift]);

  // Edge Data Sync & Offline-First State
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const updatePending = async () => {
      try {
        const count = await getPendingCount();
        setPendingSyncCount(count);
      } catch {
        // fallback
      }
    };

    void updatePending();

    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatusMsg('Online restored. Auto-syncing...');
      setIsSyncing(true);
      const res = await triggerEdgeBatchSync();
      setIsSyncing(false);
      setSyncStatusMsg(res.message);
      await updatePending();
      setTimeout(() => setSyncStatusMsg(null), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatusMsg('Operating offline (Local IndexedDB cache)');
      setTimeout(() => setSyncStatusMsg(null), 4000);
    };

    const handleSyncChange = () => {
      void updatePending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mkh-offline-change', handleSyncChange);
    window.addEventListener('mkh-offline-synced', handleSyncChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mkh-offline-change', handleSyncChange);
      window.removeEventListener('mkh-offline-synced', handleSyncChange);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatusMsg('Syncing edge outbox with central DB...');
    try {
      const res = await triggerEdgeBatchSync();
      setSyncStatusMsg(res.message);
      const count = await getPendingCount();
      setPendingSyncCount(count);
    } catch {
      setSyncStatusMsg('Sync error occurred');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  // Live staff workforce activity heartbeat (reports active station path to Admin monitor)
  useEffect(() => {
    if (!user || user.role === 'patient' || typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token') || '';
    if (!token || token.includes('demo') || token.includes('registered')) return;

    const sendHeartbeat = () => {
      if (document.visibilityState === 'hidden') return;
      void apiClient
        .post('/auth/heartbeat', { current_path: pathname || '/dashboard' })
        .catch(() => {
          // Non-blocking heartbeat
        });
    };

    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 45000);
    return () => clearInterval(timer);
  }, [user, pathname]);

  // Pre-warm / prefetch all key routes on idle so clicking any link opens instantly
  useEffect(() => {
    const prewarmRoutes = [
      '/dashboard', '/patients', '/queue', '/billing', '/pharmacy',
      '/telemed', '/analytics', '/hrm', '/assets', '/ot', '/pacs',
      '/accounting', '/blood-bank', '/ems', '/iomt', '/dietary',
      '/mortuary', '/crm', '/academic', '/waste', '/procurement',
      '/fayda', '/efda', '/mci', '/infection', '/insurance', '/audit', '/power'
    ];
    prewarmRoutes.forEach((r) => {
      try {
        router.prefetch(r);
      } catch {
        // ignore
      }
    });
  }, [router]);

  const handleInstantLogout = () => {
    void logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    } else {
      router.replace('/login');
    }
  };

  const handleSaveCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await overrideShift({
        shift_type: editShiftType,
        custom_eth_month: editEthMonth,
        custom_eth_day: parseInt(editEthDay, 10) || 1,
        custom_eth_year: parseInt(editEthYear, 10) || 2019,
        charge_nurse: editChargeNurse,
        duty_physician: editDutyPhysician,
        handover_notes: editHandoverNotes,
      });
      setCalendarModalOpen(false);
    } catch {
      // handled
    }
  };

  const handleResetToLive = async () => {
    try {
      await resetAutoShift();
      setCalendarModalOpen(false);
    } catch {
      // handled
    }
  };

  // Formatted date string from centralized backend time sync
  const ethDateDisplay =
    language === 'om'
      ? ethiopian.formatted_om
      : language === 'am'
      ? ethiopian.formatted_am
      : ethiopian.formatted_en;
  const dateDisplay = `${ethDateDisplay} E.C. • ${gregorian.formatted} G.C.`;
  const shiftDisplay =
    language === 'om'
      ? shift.name_om
      : language === 'am'
      ? shift.name_am
      : shift.name_en;

  // Clinician profile based on dynamic role
  const getProfile = () => {
    switch (user?.role) {
      case 'admin':
        return {
          initials: 'AD',
          name: 'System Administrator',
          dept: 'Executive Hospital Management',
        };
      case 'doctor':
        return {
          initials: 'BT',
          name: 'Dr. Bekele Tadesse',
          dept: 'Internal Medicine & Surgery',
        };
      case 'nurse':
        return {
          initials: 'CD',
          name: 'Nurse Chaltu Daba',
          dept: 'Critical Care & Emergency',
        };
      case 'pharmacist':
        return {
          initials: 'PT',
          name: 'Pharm. Tolasa Gudeta',
          dept: 'Hospital Dispensary & FEFO',
        };
      case 'insurance_officer':
        return {
          initials: 'FD',
          name: 'Fatuma Duresa (Claims)',
          dept: 'CBHI & EHIA Assurance',
        };
      case 'technician':
        return {
          initials: 'GD',
          name: 'Gemechu Desta (Biomed)',
          dept: 'Biomedical & Infrastructure',
        };
      case 'lab_technician':
        return {
          initials: 'AY',
          name: 'Ayantu Yilma (Lab Scientist)',
          dept: 'Pathology & Diagnostic Laboratory',
        };
      case 'receptionist':
        return {
          initials: 'KA',
          name: 'Kumsa Alemu (Intake)',
          dept: 'OPD Admissions & Patient Triage',
        };
      case 'billing':
        return {
          initials: 'TW',
          name: 'Tigist Worku (Cashier)',
          dept: 'Revenue & Patient Accounts',
        };
      case 'auditor':
        return {
          initials: 'DL',
          name: 'Dr. Dereje Lemma (Quality)',
          dept: 'EHSTG Clinical Governance & Audit',
        };
      default:
        return {
          initials: user?.username ? user.username.slice(0, 2).toUpperCase() : 'HP',
          name: user?.username || 'Hospital Practitioner',
          dept: 'Clinical Operations',
        };
    }
  };

  const profile = getProfile();
  const roleLabel = `${effectiveRole.replace('_', ' ').toUpperCase()}${simulatedRole ? ' (SIM)' : ''}`;

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1b2334] bg-[#0b0f17] px-3 sm:px-6 sticky top-0 z-30 shadow-md select-none text-white">
      {/* LEFT: Mobile Drawer Trigger & Breadcrumb Navigation */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('toggle-mkh-sidebar'));
            }
          }}
          className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-[#141b29] hover:bg-[#1c263a] text-amber-400 hover:text-white border border-[#222b3d] transition-colors shrink-0 cursor-pointer"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Clean Executive Breadcrumb Trail (Matching Uploaded Image Style) */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium select-none shrink-0 whitespace-nowrap">
          <Link href="/dashboard" className="text-slate-400 hover:text-amber-300 transition-colors">
            Enterprise
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-semibold tracking-wide">
            Core Overview
          </span>
        </div>
      </div>

      {/* CENTER: OMNISEARCH COMMAND PALETTE (Ctrl+K) */}
      <div className="hidden md:flex items-center mx-2 lg:mx-4 shrink-0">
        <OmnisearchCommandCenter />
      </div>

      {/* RIGHT: COMMAND COCKPIT & GOLD PRIMARY ACTION (Matching Uploaded Image) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Hospital Utilities Capsule (Time -> Calendar -> Shift -> Bell -> Lang -> Theme) */}
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-[#222b3d] bg-[#101624] px-2 py-1 shadow-xs">
          {/* Live Online Server Clock & NTP Indicator */}
          <div
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-teal-300 pr-2 border-r border-[#1e283c] select-none"
            title={`Hospital NTP Server Clock: ${serverTime} EAT (${ethiopian.habasha_time_str})`}
          >
            <Clock className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
            <span>{serverTime}</span>
            <span
              className={`flex h-1.5 w-1.5 rounded-full ${ntpSynced ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400'}`}
              title={ntpSynced ? 'Online NTP Synchronized' : 'Syncing'}
            />
          </div>

          {/* Calendar (Online Editable Modal) */}
          <button
            type="button"
            onClick={() => setCalendarModalOpen(true)}
            title="Kalandarii fi shiftii online jijjiiri (Online Hospital Time/Shift Config)"
            className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-amber-300 transition-colors cursor-pointer select-none pr-2 border-r border-[#1e283c]"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span className="hover:underline underline-offset-2">{dateDisplay}</span>
            {!shift.is_auto && (
              <span className="px-1 py-0.2 text-[9px] bg-amber-500/20 text-amber-400 rounded-sm font-semibold border border-amber-500/40">
                MANUAL
              </span>
            )}
          </button>

          {/* Shift indicator */}
          <div className="hidden 2xl:flex items-center gap-1.5 text-xs font-medium text-amber-300 select-none pr-2 border-r border-[#1e283c]">
            {shift.type === 'morning' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : shift.type === 'afternoon' ? (
              <CloudSun className="h-3.5 w-3.5 text-sky-400" />
            ) : shift.type === 'night' ? (
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{shiftDisplay}</span>
          </div>

          {/* Edge Offline / Online Connectivity & Sync Capsule */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#1e283c] bg-[#101726] text-xs">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]" title="Central DB Online">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden xl:inline font-mono">ONLINE</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]" title="Edge Offline Mode (IndexedDB Active)">
                <WifiOff className="h-3 w-3 text-amber-400 animate-pulse" />
                <span className="hidden xl:inline font-mono">OFFLINE</span>
              </span>
            )}

            {/* Outbox Pending Counter & Sync Button */}
            {pendingSyncCount > 0 ? (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                title={isOnline ? `${pendingSyncCount} offline records ready to sync. Click to push now.` : `${pendingSyncCount} records buffered offline.`}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-bold transition-all cursor-pointer"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{pendingSyncCount} PENDING</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                title="Central database synced. Click to check for edge batch updates."
                className="hidden xl:flex items-center gap-1 px-1 py-0.5 rounded text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
              </button>
            )}

            {syncStatusMsg && (
              <span className="hidden 2xl:inline text-[10px] text-teal-300 font-medium truncate max-w-[130px]" title={syncStatusMsg}>
                {syncStatusMsg}
              </span>
            )}
          </div>

          {/* Notification Bell */}
          <div className="flex items-center px-0.5">
            <NotificationBell variant="dark" />
          </div>

          {/* Language Selector */}
          <div className="flex items-center px-0.5 border-l border-[#1e283c]">
            <LanguageSelect variant="dark" />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center px-0.5 border-l border-[#1e283c]">
            <ThemeToggle variant="cockpit" />
          </div>

          {/* Zen Mode / Salphaa Toggle */}
          <div className="hidden sm:flex items-center px-1 border-l border-[#1e283c]">
            <ZenModeToggle variant="header" />
          </div>
        </div>

        {/* Clinician Profile Avatar & Name */}
        <div className="flex items-center gap-2 pl-1 pr-1 border-r border-[#1e283c] shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center ring-2 ring-amber-400/30 shrink-0 shadow-xs">
            {profile.initials}
          </div>
          <div className="hidden lg:block text-left min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {profile.name}
            </p>
            <p className="text-[10px] text-amber-400/90 capitalize truncate">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* PROMINENT RIGHT-HAND HEADER LOGOUT BUTTON (BOLD RED, VISIBLE EVERYWHERE) */}
        <button
          type="button"
          onClick={handleInstantLogout}
          title={language === 'om' ? "Sirna Keessaa Ba'i (Logout)" : language === 'am' ? 'ከስርዓቱ ውጣ (Logout)' : 'Sign out of HMIS'}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold px-3 sm:px-3.5 py-1.5 text-xs shadow-md shadow-rose-950/50 hover:shadow-rose-600/30 active:scale-95 transition-all duration-150 cursor-pointer select-none shrink-0 border border-rose-400/40"
          aria-label="Logout"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white shrink-0" />
          <span className="inline font-bold tracking-wide">
            {language === 'om' ? "Ba'i" : language === 'am' ? 'ውጣ' : 'Logout'}
          </span>
        </button>
      </div>

      {/* ONLINE EDITABLE CALENDAR & SHIFT MODAL */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="flex w-full max-w-xl flex-col rounded-2xl bg-white dark:bg-[#0f172a] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-[#131d33] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Hospital Calendar & Clinical Shift Online
                    <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE API
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'om'
                      ? "Kalandarii Itoophiyaa, Sa'aatii fi Shiftii yaalaa database giddugaleessaa irratti jijjiiri"
                      : language === 'am'
                      ? 'የኢትዮጵያ ቀን መቁጠሪያ፣ ሰዓት እና የፈረቃ ስራዎችን በማዕከላዊ ዳታቤዝ ላይ ያስተዳድሩ'
                      : 'Configure Ethiopian calendar date, system clock, and operational duty shifts'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveCalendar} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Server Clock Telemetry Status */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
                    Server Clock (EAT UTC+3)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-teal-300 text-sm">
                    {serverTime}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-2">
                    ({ethiopian.habasha_time_str})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
                    Auto-Switch Status
                  </span>
                  <span className={`font-semibold ${shift.is_auto ? 'text-emerald-500' : 'text-amber-400'}`}>
                    {shift.is_auto ? '● Automatic NTP Active' : '▲ Manual Shift Override'}
                  </span>
                </div>
              </div>

              {/* Ethiopian Calendar Controls */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-500" />
                    1. Ethiopian Calendar (Kalandarii Itoophiyaa - E.C.)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    GC: {gregorian.formatted}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Ji'a (Month)
                    </label>
                    <select
                      value={editEthMonth}
                      onChange={(e) => setEditEthMonth(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    >
                      {ETH_MONTHS.map((m) => (
                        <option key={m.val} value={m.val}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Guyyaa (Day)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={editEthDay}
                      onChange={(e) => setEditEthDay(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Waggaa (Year)
                    </label>
                    <input
                      type="number"
                      value={editEthYear}
                      onChange={(e) => setEditEthYear(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Active Clinical Shift Controls */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                  2. Active Clinical Duty Shift (Shiftii Hojii Yaalaa)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditShiftType('morning')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all cursor-pointer ${
                      editShiftType === 'morning'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="h-4 w-4 mx-auto mb-1 text-amber-400" />
                    <span className="block font-bold">Morning</span>
                    <span className="text-[10px] opacity-75">08:00–16:00</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditShiftType('afternoon')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all cursor-pointer ${
                      editShiftType === 'afternoon'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-bold shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CloudSun className="h-4 w-4 mx-auto mb-1 text-sky-400" />
                    <span className="block font-bold">Afternoon</span>
                    <span className="text-[10px] opacity-75">16:00–23:00</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditShiftType('night')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all cursor-pointer ${
                      editShiftType === 'night'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="h-4 w-4 mx-auto mb-1 text-indigo-400" />
                    <span className="block font-bold">Night</span>
                    <span className="text-[10px] opacity-75">23:00–08:00</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditShiftType('on_call')}
                    className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-all cursor-pointer ${
                      editShiftType === 'on_call'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold shadow-xs'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Clock className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
                    <span className="block font-bold">On-Call</span>
                    <span className="text-[10px] opacity-75">24h Emerg</span>
                  </button>
                </div>
              </div>

              {/* Duty Staffing & Ward Handover Notes */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                  {language === 'om'
                    ? '3. Dabarsaa fi Hojjettoota Shiftii (Duty Staffing)'
                    : language === 'am'
                    ? '3. የፈረቃ ሰራተኞች እና የርክክብ ማስታወሻ'
                    : '3. Duty Staffing & Shift Handover'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === 'om' ? 'Nurse Ittigaafatamaa' : 'Charge Nurse on Duty'}
                    </label>
                    <input
                      type="text"
                      value={editChargeNurse}
                      onChange={(e) => setEditChargeNurse(e.target.value)}
                      placeholder="e.g. Nurse Chaltu Daba"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === 'om' ? 'Ogeessa Yaalaa' : 'Duty Physician / Surgeon'}
                    </label>
                    <input
                      type="text"
                      value={editDutyPhysician}
                      onChange={(e) => setEditDutyPhysician(e.target.value)}
                      placeholder="e.g. Dr. Bekele Tadesse"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'om' ? 'Qabxii Dabarsaa Wardii' : 'Live Shift Handover Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={editHandoverNotes}
                    onChange={(e) => setEditHandoverNotes(e.target.value)}
                    placeholder="Enter ward notes, critical alerts, ICU/bed handovers..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetToLive}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to Live Auto NTP</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarModalOpen(false)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-900/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isUpdating ? 'Saving Online...' : 'Save & Sync Online'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
