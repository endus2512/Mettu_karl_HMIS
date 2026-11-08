/**
 * Mettu Karl Referral Hospital — Dedicated Patient Personal Health Dashboard
 * Dedicated operational view for Patients.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
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
} from 'lucide-react';

export function PatientDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  return (
    <div className="space-y-6">
      {/* 1. PATIENT WELCOME BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-teal-950/60 via-[#101624] to-[#101624] border border-teal-500/40 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'om'
                  ? 'Baga Nagaan Dhuftan, Gudeta Hailu Tadesse'
                  : lang === 'am'
                  ? 'እንኳን ደህና መጡ፣ ጉደታ ሀይሉ ታደሰ'
                  : 'Welcome, Gudeta Hailu Tadesse'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono font-semibold">
                PATIENT
              </span>
            </div>
            <p className="text-xs text-slate-300">
              MRN: <strong className="text-amber-300 font-mono">MKH-2026-000101</strong> • Fayda: <span className="text-teal-300 font-mono">FAN-9901-2384-5120</span>
            </p>
          </div>
        </div>

        {/* Primary Patient Portal CTA */}
        <Link
          href="/patient-portal"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition cursor-pointer"
        >
          <span>{lang === 'om' ? 'Gara Poortaalii Guutuutti Seeni' : 'Open Full Patient Portal'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. PATIENT KPI SUMMARY TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Qoricha Harka Qabdan' : 'Active Prescriptions'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">2</span>
              <span className="text-[11px] text-teal-400 font-medium">Coartem, Panadol</span>
            </div>
            <p className="text-[10px] text-slate-500">Refill in 5 days</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Bu\'aa Qorannoo Laabii' : 'Lab Reports Ready'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400">1</span>
              <span className="text-[11px] text-cyan-400 font-medium">new</span>
            </div>
            <p className="text-[10px] text-slate-500">Serum Electrolytes (K+ 6.1)</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Beellama Dhufu' : 'Upcoming Appointment'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white">Nov 12, 2026</span>
            </div>
            <p className="text-[10px] text-slate-500">09:30 AM • Dr. Bekele</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Nagahee Kaffaltii' : 'Pending Invoice'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-amber-400">185.00</span>
              <span className="text-xs text-amber-300 font-mono">ETB</span>
            </div>
            <p className="text-[10px] text-teal-400">Pay with Telebirr</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. PATIENT PORTAL QUICK ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/patient-portal?tab=records"
          className="group rounded-2xl bg-[#101624] border border-[#222b3d] hover:border-teal-500/50 p-5 space-y-3 transition shadow-md"
        >
          <div className="h-10 w-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/30 group-hover:scale-110 transition">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition">
              {lang === 'om' ? 'Seenaa Yaala Koo' : 'Medical History (FHIR R4)'}
            </h4>
            <p className="text-xs text-slate-400">
              {lang === 'om' ? 'Ragaa dhukkubaa, alarjiikii fi yaala durii' : 'Diagnoses, allergies, and clinical encounters'}
            </p>
          </div>
        </Link>

        <Link
          href="/patient-portal?tab=prescriptions"
          className="group rounded-2xl bg-[#101624] border border-[#222b3d] hover:border-amber-500/50 p-5 space-y-3 transition shadow-md"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
              {lang === 'om' ? 'Qoricha & Resephii' : 'My Prescriptions'}
            </h4>
            <p className="text-xs text-slate-400">
              {lang === 'om' ? 'Qajeelfama qorichaa fi yeroo fudhannaa' : 'Drug dosages, timings, and refills'}
            </p>
          </div>
        </Link>

        <Link
          href="/patient-portal?tab=lab"
          className="group rounded-2xl bg-[#101624] border border-[#222b3d] hover:border-cyan-500/50 p-5 space-y-3 transition shadow-md"
        >
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
              {lang === 'om' ? 'Bu\'aa Laabooratorii' : 'Lab Test Results'}
            </h4>
            <p className="text-xs text-slate-400">
              {lang === 'om' ? 'Bu\'aa qorannoo dhiigaa fi ashaboo' : 'Hematology, chemistry, and official PDF vouchers'}
            </p>
          </div>
        </Link>

        <Link
          href="/patient-portal?tab=billing"
          className="group rounded-2xl bg-[#101624] border border-[#222b3d] hover:border-emerald-500/50 p-5 space-y-3 transition shadow-md"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
              {lang === 'om' ? 'Kaffaltii Telebirr' : 'Telebirr Payment'}
            </h4>
            <p className="text-xs text-slate-400">
              {lang === 'om' ? 'Nagahee kaffaltii fi herrega qulqulleessi' : 'Instant digital payment & CBHI receipts'}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
