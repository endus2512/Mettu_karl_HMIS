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
    <header className="flex h-16 items-center justify-between border-b-2 border-sky-400/75 dark:border-sky-400/40 bg-gradient-to-r from-sky-100/95 via-white/95 to-indigo-100/95 dark:from-[#0f1c36]/95 dark:via-[#152546]/95 dark:to-[#182245]/95 backdrop-blur-xl px-3 sm:px-6 sticky top-0 z-30 shadow-[0_8px_24px_-8px_rgba(14,165,233,0.22)] select-none text-slate-900 dark:text-white transition-all duration-300">
      {/* LEFT: Mobile Drawer Trigger & Unified Online Time • Calendar • Shift Cube Rectangle */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('toggle-mkh-sidebar'));
            }
          }}
          className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-white/90 dark:bg-[#141b29] hover:bg-sky-50 dark:hover:bg-[#1c263a] text-amber-700 dark:text-amber-400 border-2 border-sky-300 dark:border-sky-500/40 transition-colors shrink-0 cursor-pointer shadow-xs"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* ONE COMPACT CUBE-COLORED ONLINE RECTANGLE: TIME (12H) + CALENDAR + SHIFT */}
        <button
          type="button"
          onClick={() => setCalendarModalOpen(true)}
          title={`Online NTP Synced • EAT UTC+3 (${ethiopian.habasha_time_str}) — Click to configure calendar & shift`}
          className="group flex items-center gap-2 sm:gap-2.5 rounded-2xl border-2 border-sky-400/85 dark:border-sky-400/50 bg-gradient-to-br from-white via-sky-50 to-indigo-100/90 dark:from-[#172744] dark:via-[#1b2e52] dark:to-[#1d2849] px-3 py-1.5 shadow-[0_6px_16px_-4px_rgba(14,165,233,0.26),3px_3px_0_0_rgba(56,189,248,0.3)] hover:-translate-y-0.5 hover:border-sky-500 hover:shadow-[0_10px_22px_-4px_rgba(14,165,233,0.38),4px_4px_0_0_rgba(56,189,248,0.4)] transition-all duration-300 cursor-pointer min-w-0 max-w-full"
        >
          {/* Online Live Dot + 12-Hour Clock (up to 12:00) */}
          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-mono font-extrabold text-teal-900 dark:text-teal-200 shrink-0">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                ntpSynced
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            <Clock className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300 shrink-0" />
            <span>{serverTime}</span>
          </div>

          {/* Calendar Date */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-100 pl-2 border-l border-sky-300/80 dark:border-sky-400/35 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300 shrink-0" />
            <span className="group-hover:text-indigo-700 dark:group-hover:text-amber-200 transition-colors">
              {dateDisplay}
            </span>
          </div>

          {/* Active Shift */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-extrabold text-indigo-900 dark:text-amber-200 pl-2 border-l border-sky-300/80 dark:border-sky-400/35 min-w-0">
            {shift.type === 'morning' ? (
              <Sun className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300 shrink-0" />
            ) : shift.type === 'afternoon' ? (
              <CloudSun className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300 shrink-0" />
            ) : shift.type === 'night' ? (
              <Moon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300 shrink-0" />
            )}
            <span className="truncate max-w-[170px]">{shiftDisplay}</span>
            {!shift.is_auto && (
              <span className="px-1.5 py-0.5 text-[9px] bg-amber-200 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 rounded font-extrabold border border-amber-400/70 shrink-0">
                MANUAL
              </span>
            )}
          </div>
        </button>
      </div>

      {/* CENTER: OMNISEARCH COMMAND PALETTE (Ctrl+K) */}
      <div className="hidden lg:flex items-center mx-2 shrink-0">
        <OmnisearchCommandCenter />
      </div>

      {/* RIGHT: SYNC CAPSULE, UTILITIES, PROFILE & LOGOUT */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Edge Offline / Online Connectivity & Sync Capsule + Dark Icon Strip */}
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-2xl border-2 border-sky-400/60 dark:border-sky-400/40 bg-[#101c34]/95 dark:bg-[#0f1a30]/95 px-2.5 py-1 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.3)] text-white">
          <div className="flex items-center gap-1.5 pr-1.5 border-r border-slate-700 text-xs">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]" title="Central DB Online">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden xl:inline font-mono">ONLINE</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]" title="Edge Offline Mode (IndexedDB Active)">
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
                className="hidden xl:flex items-center gap-1 px-1 py-0.5 rounded text-slate-300 hover:text-white text-[10px] cursor-pointer"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
              </button>
            )}

            {syncStatusMsg && (
              <span className="hidden 2xl:inline text-[10px] text-teal-300 font-medium truncate max-w-[110px]" title={syncStatusMsg}>
                {syncStatusMsg}
              </span>
            )}
          </div>

          {/* Notification Bell */}
          <div className="flex items-center px-0.5">
            <NotificationBell variant="dark" />
          </div>

          {/* Language Selector */}
          <div className="flex items-center px-0.5 border-l border-slate-700">
            <LanguageSelect variant="dark" />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center px-0.5 border-l border-slate-700">
            <ThemeToggle variant="cockpit" />
          </div>
        </div>

        {/* Clinician Profile Avatar & Name (Universal Bright & Dark Contrast) */}
        <div className="flex items-center gap-2 pl-1 pr-2 border-r-2 border-sky-300/60 dark:border-slate-700 shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center ring-2 ring-amber-400/50 shrink-0 shadow-xs">
            {profile.initials}
          </div>
          <div className="hidden lg:block text-left min-w-0">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight">
              {profile.name}
            </p>
            <p className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 capitalize truncate">
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
