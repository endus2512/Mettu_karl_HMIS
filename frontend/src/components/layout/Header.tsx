/**
 * Enterprise Hospital Information System Header.
 *
 * Enhancements:
 * 1. Background: "Daalacha" (Soft Clinical Slate Grey: bg-slate-100 / #f1f5f9).
 * 2. Editable Dual Calendar & Shift Modal: Clinicians can click the calendar capsule
 *    to edit the Ethiopian/Gregorian date and shift, with live persistence.
 * 3. Responsive Rectangular Cursor Spotlight on all buttons, controls, and avatar capsules.
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { ThemeToggle } from '@/components/common/ThemeToggle';

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
  const [shiftIcon, setShiftIcon] = useState('☀️');

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
        if (parsed.shiftIcon) setShiftIcon(parsed.shiftIcon);
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
      shiftIcon,
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
    setShiftIcon('☀️');
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
    <header className="flex h-16 items-center justify-between border-b border-slate-700/80 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] px-6 sticky top-0 z-30 shadow-md select-none text-white">
      {/* LEFT: Clinician Profile - Outside the rectangle */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shadow-md ring-2 ring-teal-400/40 shrink-0 hover:scale-105 transition-transform cursor-pointer">
          {profile.initials}
        </div>
        <div className="text-left min-w-0">
          <p className="text-sm sm:text-base font-black text-white truncate leading-tight tracking-tight">
            {profile.name}
          </p>
          <p className="text-[11px] font-bold text-teal-300 capitalize truncate mt-0.5">
            {roleLabel} • {profile.dept}
          </p>
        </div>
      </div>

      {/* RIGHT: UNIFIED COMMAND COCKPIT RECTANGLE (Calendar -> Shift -> Scanner -> SMS -> Languages -> Logout) */}
      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 rounded-2xl border-2 border-slate-700/90 bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 shadow-md">
        {/* 1. Calendar (Clickable, Normal Inline) */}
        <button
          type="button"
          onClick={() => setCalendarModalOpen(true)}
          title="Click to configure hospital date (Kalandarii jijjiiruuf cuqaasaa)"
          className="hidden 2xl:flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-100 hover:text-teal-300 transition-colors cursor-pointer select-none pr-3 border-r border-slate-700/80"
        >
          <span className="text-teal-400 text-base">📅</span>
          <span className="hover:underline decoration-teal-400 underline-offset-4 font-bold">{dateDisplay}</span>
        </button>

        {/* 2. Shift (Normal Inline) */}
        <div className="hidden 2xl:flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-300 select-none pr-3 border-r border-slate-700/80">
          <span className="text-base">{shiftIcon}</span>
          <span className="font-bold">{shiftName}</span>
        </div>

        {/* 3. Barcode & QR Code Scanner Quick Launch */}
        <Link
          href="/scanner"
          title={t('barcode_qr_scanner')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/70 bg-teal-950/80 hover:bg-teal-700 hover:text-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-teal-200 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <span className="text-sm">📷</span>
          <span className="font-bold">Scanner</span>
        </Link>

        {/* 4. SMS & USSD Gateway (*907#) Quick Launch */}
        <Link
          href="/sms-ussd"
          title={t('sms_ussd_gateway')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/70 bg-emerald-950/80 hover:bg-emerald-700 hover:text-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-200 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <span className="text-sm">📱</span>
          <span className="font-bold">SMS/*907#</span>
        </Link>

        {/* 5. Language Selector (Afanoota Sadan: Afaan Oromoo, አማርኛ, English) */}
        <div className="flex items-center pr-1 sm:pr-2 border-r border-slate-700/80">
          <LanguageSelect variant="dark" />
        </div>

        {/* 6. Single Interchangeable Light/Dark Theme Toggle Button */}
        <div className="flex items-center pr-1 sm:pr-2 border-r border-slate-700/80">
          <ThemeToggle variant="cockpit" />
        </div>

        {/* 7. Rectangular Instant Touch Logout Button */}
        <button
          type="button"
          onClick={handleInstantLogout}
          title={t('logout')}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-400 bg-rose-600 px-3.5 py-1.5 text-xs sm:text-sm font-black text-white shadow-md hover:bg-rose-500 hover:border-rose-300 active:scale-90 active:bg-rose-700 transition-all duration-75 cursor-pointer select-none shrink-0 touch-manipulation"
        >
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="font-black tracking-wide">{t('logout')}</span>
        </button>
      </div>

      {/* EDITABLE CALENDAR & SHIFT MODAL */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl border-2 border-teal-500 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📅</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Hospital Calendar & Shift Configuration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Guyyaa Kalandarii Itoophiyaa fi Shiftii Hojii Jijjiiri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCalendar} className="p-6 space-y-4">
              {/* Ethiopian Calendar Controls */}
              <div className="rounded-2xl border-2 border-slate-200 p-4 bg-slate-50/60 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-teal-800 block">
                  1. Ethiopian Calendar (Kalandarii Itoophiyaa - E.C.)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ji'a (Month)
                    </label>
                    <select
                      value={ethMonth}
                      onChange={(e) => setEthMonth(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                    >
                      {ETH_MONTHS.map((m) => (
                        <option key={m.val} value={m.val}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Guyyaa (Day)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={ethDay}
                      onChange={(e) => setEthDay(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Waggaa (Year)
                    </label>
                    <input
                      type="number"
                      value={ethYear}
                      onChange={(e) => setEthYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Gregorian Calendar Control */}
              <div className="rounded-2xl border-2 border-slate-200 p-4 bg-slate-50/60 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-800 block">
                  2. Gregorian Calendar (G.C.)
                </span>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Date Picker
                  </label>
                  <input
                    type="date"
                    value={gcDate}
                    onChange={(e) => setGcDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shift Configuration */}
              <div className="rounded-2xl border-2 border-slate-200 p-4 bg-slate-50/60 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-teal-800 block">
                  3. Active Clinical Duty Shift (Shiftii Yaalaa)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShiftName('Morning Shift (08:00–16:00)');
                      setShiftIcon('☀️');
                    }}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                      shiftName.includes('Morning')
                        ? 'border-teal-500 bg-teal-100/70 text-teal-900 ring-2 ring-teal-400/40'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-base mb-0.5">☀️</span>
                    Morning
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShiftName('Afternoon Shift (16:00–23:00)');
                      setShiftIcon('⛅');
                    }}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                      shiftName.includes('Afternoon')
                        ? 'border-teal-500 bg-teal-100/70 text-teal-900 ring-2 ring-teal-400/40'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-base mb-0.5">⛅</span>
                    Afternoon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShiftName('Night Emergency (23:00–08:00)');
                      setShiftIcon('🌙');
                    }}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                      shiftName.includes('Night')
                        ? 'border-teal-500 bg-teal-100/70 text-teal-900 ring-2 ring-teal-400/40'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-base mb-0.5">🌙</span>
                    Night
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleResetToLive}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  🔄 Reset to Live
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarModalOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-black text-white hover:bg-teal-700 shadow-md transition-all"
                  >
                    Save & Apply (Mirkaneessi)
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
