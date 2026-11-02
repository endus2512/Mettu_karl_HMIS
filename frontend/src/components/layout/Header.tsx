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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationBell } from '@/components/common/NotificationBell';
import {
  Calendar,
  Sun,
  Moon,
  CloudSun,
  QrCode,
  Smartphone,
  Menu,
  X,
  RotateCcw,
  LogOut,
  Building2,
  Clock,
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
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  // Calendar & Shift State (with editable capability)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [ethMonth, setEthMonth] = useState('Tikimt');
  const [ethDay, setEthDay] = useState('17');
  const [ethYear, setEthYear] = useState('2019');
  const [gcDate, setGcDate] = useState('2026-10-27');
  const [shiftName, setShiftName] = useState('Morning Shift (08:00–16:00)');
  const [shiftType, setShiftType] = useState<'morning' | 'afternoon' | 'night'>('morning');

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
    router.replace('/login');
  };

  // Load persisted calendar date or default
  useEffect(() => {
    try {
      const savedDate = localStorage.getItem('mkh_header_date');
      if (savedDate) {
        const parsed = JSON.parse(savedDate);
        if (parsed.ethMonth) setEthMonth(parsed.ethMonth);
        if (parsed.ethDay) setEthDay(parsed.ethDay);
        if (parsed.ethYear) setEthYear(parsed.ethYear);
        if (parsed.gcDate) setGcDate(parsed.gcDate);
        if (parsed.shiftName) setShiftName(parsed.shiftName);
        if (parsed.shiftType) setShiftType(parsed.shiftType);
      }
    } catch {
      // fallback to defaults
    }
  }, []);

  const handleSaveCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      ethMonth,
      ethDay,
      ethYear,
      gcDate,
      shiftName,
      shiftType,
    };
    try {
      localStorage.setItem('mkh_header_date', JSON.stringify(config));
    } catch {
      // ignore
    }
    setCalendarModalOpen(false);
  };

  const handleResetToLive = () => {
    const now = new Date();
    const iso = now.toISOString().split('T')[0];
    setEthMonth('Tikimt');
    setEthDay('17');
    setEthYear('2019');
    setGcDate(iso);
    setShiftName('Morning Shift (08:00–16:00)');
    setShiftType('morning');
    try {
      localStorage.removeItem('mkh_header_date');
    } catch {
      // ignore
    }
    setCalendarModalOpen(false);
  };

  // Formatted date string
  const formattedGc = new Date(gcDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const dateDisplay = `${ethMonth} ${ethDay}, ${ethYear} E.C. • ${formattedGc} G.C.`;

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
      default:
        return {
          initials: user?.username ? user.username.slice(0, 2).toUpperCase() : 'HP',
          name: user?.username || 'Hospital Practitioner',
          dept: 'Clinical Operations',
        };
    }
  };

  const profile = getProfile();
  const roleLabel = user?.role ? user.role.replace('_', ' ').toUpperCase() : 'DOCTOR';

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#080e1e] px-3 sm:px-6 sticky top-0 z-30 shadow-sm select-none text-white">
      {/* LEFT: Clinician Profile & Mobile Drawer Trigger */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('toggle-mkh-sidebar'));
            }
          }}
          className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 transition-colors shrink-0 cursor-pointer"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="h-9 w-9 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
          {profile.initials}
        </div>
        <div className="text-left min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
            {profile.name}
          </p>
          <p className="text-[11px] text-teal-400 capitalize truncate mt-0.5">
            {roleLabel} <span className="hidden sm:inline text-slate-400">• {profile.dept}</span>
          </p>
        </div>
      </div>

      {/* RIGHT: UNIFIED COMMAND COCKPIT (Calendar -> Shift -> Scanner -> SMS -> Languages -> Logout) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-xl border border-slate-800 bg-[#0b1329] px-2 sm:px-3 py-1 shadow-xs shrink-0">
        {/* 1. Calendar (Clickable, Normal Inline) */}
        <button
          type="button"
          onClick={() => setCalendarModalOpen(true)}
          title="Click to configure hospital date (Kalandarii jijjiiruuf cuqaasaa)"
          className="hidden 2xl:flex items-center gap-1.5 text-xs font-medium text-slate-200 hover:text-teal-300 transition-colors cursor-pointer select-none pr-2.5 border-r border-slate-800"
        >
          <Calendar className="h-3.5 w-3.5 text-teal-400" />
          <span className="hover:underline decoration-teal-400 underline-offset-2">{dateDisplay}</span>
        </button>

        {/* 2. Shift (Normal Inline) */}
        <div className="hidden 2xl:flex items-center gap-1.5 text-xs font-medium text-teal-300 select-none pr-2.5 border-r border-slate-800">
          {shiftType === 'morning' ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : shiftType === 'afternoon' ? (
            <CloudSun className="h-3.5 w-3.5 text-sky-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-indigo-400" />
          )}
          <span>{shiftName}</span>
        </div>

        {/* 3. Barcode & QR Code Scanner Quick Launch */}
        <Link
          href="/scanner"
          title={t('barcode_qr_scanner')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-950/40 hover:bg-teal-700 hover:text-white px-2.5 py-1 text-xs font-medium text-teal-300 transition-colors cursor-pointer shrink-0"
        >
          <QrCode className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Scanner</span>
        </Link>

        {/* 4. SMS & USSD Gateway (*907#) Quick Launch */}
        <Link
          href="/sms-ussd"
          title={t('sms_ussd_gateway')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-700 hover:text-white px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors cursor-pointer shrink-0"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span className="hidden md:inline">SMS/*907#</span>
        </Link>

        {/* 5. Hospital Notification Bell */}
        <div className="flex items-center pr-1 border-r border-slate-800">
          <NotificationBell variant="dark" />
        </div>

        {/* 6. Language Selector */}
        <div className="flex items-center pr-1 border-r border-slate-800">
          <LanguageSelect variant="dark" />
        </div>

        {/* 7. Theme Toggle */}
        <div className="flex items-center pr-1 border-r border-slate-800">
          <ThemeToggle variant="cockpit" />
        </div>

        {/* 8. Logout Button */}
        <button
          type="button"
          onClick={handleInstantLogout}
          title={t('logout')}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/50 hover:bg-rose-600 hover:text-white px-2.5 py-1 text-xs font-medium text-rose-300 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>

      {/* EDITABLE CALENDAR & SHIFT MODAL */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="flex w-full max-w-lg flex-col rounded-xl bg-white dark:bg-[#0f172a] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Hospital Calendar & Shift Configuration
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Guyyaa Kalandarii Itoophiyaa fi Shiftii Hojii Jijjiiri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCalendar} className="p-5 space-y-4">
              {/* Ethiopian Calendar Controls */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                  1. Ethiopian Calendar (Kalandarii Itoophiyaa - E.C.)
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Ji'a (Month)
                    </label>
                    <select
                      value={ethMonth}
                      onChange={(e) => setEthMonth(e.target.value)}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
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
                      value={ethDay}
                      onChange={(e) => setEthDay(e.target.value)}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Waggaa (Year)
                    </label>
                    <input
                      type="number"
                      value={ethYear}
                      onChange={(e) => setEthYear(e.target.value)}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Gregorian Calendar Control */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                  2. Gregorian Calendar (G.C.)
                </span>
                <div>
                  <input
                    type="date"
                    value={gcDate}
                    onChange={(e) => setGcDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shift Configuration */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3.5 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                  3. Active Clinical Duty Shift (Shiftii Yaalaa)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShiftName('Morning Shift (08:00–16:00)');
                      setShiftType('morning');
                    }}
                    className={`rounded-lg border p-2 text-center text-xs font-medium transition-colors cursor-pointer ${
                      shiftType === 'morning'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-300 font-semibold'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                    <span>Morning</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShiftName('Afternoon Shift (16:00–23:00)');
                      setShiftType('afternoon');
                    }}
                    className={`rounded-lg border p-2 text-center text-xs font-medium transition-colors cursor-pointer ${
                      shiftType === 'afternoon'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-300 font-semibold'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CloudSun className="h-4 w-4 mx-auto mb-1 text-sky-500" />
                    <span>Afternoon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShiftName('Night Emergency (23:00–08:00)');
                      setShiftType('night');
                    }}
                    className={`rounded-lg border p-2 text-center text-xs font-medium transition-colors cursor-pointer ${
                      shiftType === 'night'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-300 font-semibold'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="h-4 w-4 mx-auto mb-1 text-indigo-500" />
                    <span>Night</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetToLive}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to Live</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarModalOpen(false)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-xs transition-colors cursor-pointer"
                  >
                    Save & Apply
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
