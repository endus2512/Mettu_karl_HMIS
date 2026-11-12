/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Patient Personal Health Dashboard (/portal or /patient-portal view).
 *
 * Dedicated operational view for Patients.
 * Overhauled to match the Executive Command Standard:
 * - Unified Outer Rectangle with 4 Compact Animated 3D Mini Cubes
 * - Frosted Glassmorphism, Bold Typography, Vibrant Responsive Gradients
 * - High-Contrast Universal Theme (Flawless Light & Dark Mode)
 * - Dynamic Personalized Identity: Uses logged-in patient's real name, MRN, and Fayda ID
 * - Minimized-by-Default Clean Workstation with Kinetic MorphingArrowButtons
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, type Language } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { MorphingArrowButton } from '@/components/admin/MorphingArrowButton';
import {
  HeartPulse,
  Pill,
  FlaskConical,
  Calendar,
  CreditCard,
  Ticket,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  FileText,
  User,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Phone,
  Video,
} from 'lucide-react';

export function PatientDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';
  const { user } = useAuth();

  const [showQuickPads, setShowQuickPads] = useState<boolean>(false);
  const [showQueueModule, setShowQueueModule] = useState<boolean>(false);

  // Derive dynamic personalized patient identity from logged-in session
  const displayName = user?.fullName || user?.username || (lang === 'om' ? 'Dhukkubsataa' : 'Patient Member');
  const displayMrn = user?.mrn || 'MKH-2026-REG';
  const displayFayda = user?.faydaId || 'FAN-REG-ACTIVE';

  // Check if user is sample Gudeta
  const isGudeta = Boolean(
    user?.username?.toLowerCase().includes('gudeta') ||
    user?.faydaId?.includes('9901') ||
    user?.mrn?.includes('000101') ||
    user?.fullName?.toLowerCase().includes('gudeta')
  );

  return (
    <div className="space-y-4 sm:space-y-5 animate-smooth-in">
      {/* ================================================================= */}
      {/* 1. PATIENT WELCOME & IDENTITY COCKPIT HEADER                      */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-100/90 via-white/95 to-sky-100/90 dark:from-[#0d2226]/95 dark:via-[#112d33]/95 dark:to-[#0c1f24]/95 border-[2.5px] border-teal-400/90 dark:border-teal-400/60 shadow-[0_12px_32px_-8px_rgba(20,184,166,0.28)] hover:shadow-[0_16px_40px_-8px_rgba(20,184,166,0.4)] transition-all duration-300">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/50 dark:via-teal-200/15 to-transparent mkh-panel-sweep" />

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/35 border-2 border-white/60 shrink-0 transform hover:scale-105 hover:rotate-3 transition-transform">
            <User className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                {lang === 'om'
                  ? `Baga Nagaan Dhuftan, ${displayName}`
                  : lang === 'am'
                  ? `እንኳን ደህና መጡ፣ ${displayName}`
                  : `Welcome, ${displayName}`}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-400/30 text-teal-950 dark:text-teal-100 border-2 border-teal-500/60 font-mono font-black">
                PATIENT PORTAL
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              MRN: <strong className="text-teal-800 dark:text-teal-300 font-mono mr-3">{displayMrn}</strong>
              Fayda ID: <span className="text-sky-800 dark:text-sky-300 font-mono">{displayFayda}</span>
            </p>
          </div>
        </div>

        {/* Quick CTA to Full Portal */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/patient-portal"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-teal-500/25 transition-all hover:scale-[1.03]"
          >
            <span>{lang === 'om' ? 'Poortaalii Guutuu Bani' : 'Open Full Patient Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. ONE UNIFIED RECTANGLE HOLDING 4 COMPACT ANIMATED 3D MINI CUBES */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-[2.5px] border-teal-400/90 dark:border-teal-400/60 bg-gradient-to-br from-teal-100/85 via-white/95 to-sky-100/85 dark:from-[#0d2226]/95 dark:via-[#112d33]/95 dark:to-[#0c1f24]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_14px_34px_-8px_rgba(20,184,166,0.3)] hover:shadow-[0_18px_42px_-8px_rgba(20,184,166,0.45)] hover:-translate-y-0.5 transition-all duration-300 animate-smooth-in">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '0.6s' }} />
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto">
          {/* Mini Cube 1: Active Prescriptions */}
          <Link
            href="/patient-portal?tab=prescriptions"
            style={{ animationDelay: '0s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-amber-400/85 dark:border-amber-400/55 bg-gradient-to-br from-white via-amber-50 to-amber-100/95 dark:from-[#362714] dark:via-[#423118] dark:to-[#362615] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(245,158,11,0.28),3px_3px_0_0_rgba(251,191,36,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-amber-500 hover:shadow-[0_14px_24px_-4px_rgba(245,158,11,0.42),5px_5px_0_0_rgba(251,191,36,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-amber-200/20 to-transparent mkh-cube-sweep" />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-amber-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                1. {lang === 'om' ? 'Qoricha Koo' : 'Prescriptions'}
              </span>
              <span className="h-6 w-6 rounded-lg bg-amber-500/20 dark:bg-amber-400/25 border border-amber-400/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Pill className="w-3 h-3" />
              </span>
            </div>

            <div className="relative z-10 space-y-1 my-auto">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-amber-900 dark:text-amber-200">
                {isGudeta ? 2 : 1}
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border border-amber-400/60">
                DISPENSED (FEFO)
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {isGudeta ? 'Coartem • Panadol' : 'Verified Dosage'}
            </p>
          </Link>

          {/* Mini Cube 2: Lab Results Ready */}
          <Link
            href="/patient-portal?tab=lab"
            style={{ animationDelay: '0.45s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-cyan-400/85 dark:border-cyan-400/55 bg-gradient-to-br from-white via-cyan-50 to-cyan-100/95 dark:from-[#11313d] dark:via-[#153b4a] dark:to-[#122e38] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(6,182,212,0.28),3px_3px_0_0_rgba(34,211,238,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-cyan-500 hover:shadow-[0_14px_24px_-4px_rgba(6,182,212,0.42),5px_5px_0_0_rgba(34,211,238,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-cyan-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '1.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-cyan-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                2. {lang === 'om' ? 'Bu\'aa Laabii' : 'Lab Reports'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-cyan-500/20 dark:bg-cyan-400/25 border border-cyan-400/60 text-cyan-800 dark:text-cyan-200 flex items-center justify-center shrink-0 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300">
                <FlaskConical className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-cyan-900 dark:text-cyan-200">
                {isGudeta ? 1 : 1}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-500/25 text-cyan-950 dark:text-cyan-100 border border-cyan-400/60">
                READY TO VIEW
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {isGudeta ? 'Serum Electrolytes' : 'Complete Blood Count'}
            </p>
          </Link>

          {/* Mini Cube 3: Appointments */}
          <Link
            href="/patient-portal?tab=telemed"
            style={{ animationDelay: '0.9s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-teal-400/85 dark:border-teal-400/55 bg-gradient-to-br from-white via-teal-50 to-teal-100/95 dark:from-[#113137] dark:via-[#163a42] dark:to-[#122e35] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(20,184,166,0.28),3px_3px_0_0_rgba(45,212,191,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-teal-500 hover:shadow-[0_14px_24px_-4px_rgba(20,184,166,0.42),5px_5px_0_0_rgba(45,212,191,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '2.2s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-teal-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                3. {lang === 'om' ? 'Beellama Yaalaa' : 'Appointments'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-teal-500/20 dark:bg-teal-400/25 border border-teal-400/60 text-teal-800 dark:text-teal-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-sm sm:text-base font-black tracking-tight text-teal-900 dark:text-teal-200">
                Upcoming
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border border-teal-400/60">
                TELEMED VIDEO
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Dr. Bekele Tadesse
            </p>
          </Link>

          {/* Mini Cube 4: Pending Invoice */}
          <Link
            href="/patient-portal?tab=billing"
            style={{ animationDelay: '1.35s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-emerald-400/85 dark:border-emerald-400/55 bg-gradient-to-br from-white via-emerald-50 to-emerald-100/95 dark:from-[#113125] dark:via-[#163a2d] dark:to-[#122e24] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(16,185,129,0.28),3px_3px_0_0_rgba(52,211,153,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-emerald-500 hover:shadow-[0_14px_24px_-4px_rgba(16,185,129,0.42),5px_5px_0_0_rgba(52,211,153,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-emerald-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '3.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-emerald-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                4. {lang === 'om' ? 'Kaffaltii' : 'Invoice Due'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-emerald-500/20 dark:bg-emerald-400/25 border border-emerald-400/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-base sm:text-lg font-black tracking-tight text-emerald-900 dark:text-emerald-200 font-mono">
                {isGudeta ? '84.00' : '0.00'} ETB
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400/60">
                {isGudeta ? 'CBHI 80% COVER' : 'ALL CLEARED'}
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {isGudeta ? 'Pay with Telebirr' : 'No Pending Dues'}
            </p>
          </Link>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. MINIMIZED-BY-DEFAULT SECTION: QUICK HEALTHCARE PADS            */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-teal-400/80 dark:border-teal-400/50 bg-white/95 dark:bg-[#0c1f24]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-teal-50 via-sky-50 to-white dark:from-[#0d2226] dark:via-[#112d33] dark:to-[#0c1f24] border-b border-teal-200/80 dark:border-teal-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-800 dark:text-teal-200 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Kutaalee Poortaalii Dhukkubsataa' : 'Patient Healthcare Action Pads'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-950 dark:text-teal-100 border border-teal-500/40 font-bold">
                  4 DIRECT HUBS
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Seenaa yaalaa, qoricha, bu\'aa laabii, fi kaffaltii Telebirr' : 'Access your FHIR medical chart, e-prescriptions, lab results, and Telebirr payments'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="teal"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showQuickPads}
            label={showQuickPads ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Hubs')}
            onClick={() => setShowQuickPads((prev) => !prev)}
          />
        </div>

        {showQuickPads && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-smooth-in">
            <Link
              href="/patient-portal?tab=records"
              className="p-4 rounded-2xl border-2 border-teal-300 dark:border-teal-600/40 bg-teal-50/60 dark:bg-teal-950/20 hover:border-teal-500 hover:shadow-lg transition-all group cursor-pointer flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Seenaa Yaala Koo' : 'Medical History'}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  FHIR R4 Diagnoses & Vitals
                </p>
              </div>
            </Link>

            <Link
              href="/patient-portal?tab=prescriptions"
              className="p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-600/40 bg-amber-50/60 dark:bg-amber-950/20 hover:border-amber-500 hover:shadow-lg transition-all group cursor-pointer flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Qoricha & Resephii' : 'My Prescriptions'}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  FEFO Verified Dispensary
                </p>
              </div>
            </Link>

            <Link
              href="/patient-portal?tab=lab"
              className="p-4 rounded-2xl border-2 border-cyan-300 dark:border-cyan-600/40 bg-cyan-50/60 dark:bg-cyan-950/20 hover:border-cyan-500 hover:shadow-lg transition-all group cursor-pointer flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Bu\'aa Laaboraatorii' : 'Lab Test Results'}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  LIS Official PDF Vouchers
                </p>
              </div>
            </Link>

            <Link
              href="/patient-portal?tab=billing"
              className="p-4 rounded-2xl border-2 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50/60 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Kaffaltii Telebirr' : 'Telebirr Payment'}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Instant POS Clearance
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
