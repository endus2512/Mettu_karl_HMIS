/**
 * Mettu Karl Referral Hospital — Nurse Station & Ward Care Dashboard
 * Dedicated operational view for Inpatient, Triage, and Critical Care Nurses.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import {
  HeartPulse,
  Bed,
  AlertTriangle,
  Pill,
  Clock,
  CheckCircle2,
  Activity,
  Thermometer,
  Droplets,
  Syringe,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  UtensilsCrossed,
} from 'lucide-react';

interface BedVital {
  bedNo: string;
  patientName: string;
  mrn: string;
  condition: string;
  bp: string;
  temp: string;
  hr: string;
  spo2: string;
  status: 'stable' | 'warning' | 'critical';
  nextMed: string;
}

const INITIAL_BEDS: BedVital[] = [
  {
    bedNo: 'Bed-01',
    patientName: 'Gudeta Hailu Tadesse',
    mrn: 'MKH-2026-000101',
    condition: 'Post-op Day 1 (Appendectomy)',
    bp: '120/80',
    temp: '37.1°C',
    hr: '74 bpm',
    spo2: '98%',
    status: 'stable',
    nextMed: 'IV Ceftriaxone 1g @ 10:00',
  },
  {
    bedNo: 'Bed-05',
    patientName: 'Chaltu Daba Tolasa',
    mrn: 'MKH-2026-000105',
    condition: 'Severe Preeclampsia / HTN crisis',
    bp: '168/102',
    temp: '38.4°C',
    hr: '108 bpm',
    spo2: '95%',
    status: 'critical',
    nextMed: 'IV Hydralazine 10mg STAT',
  },
  {
    bedNo: 'Bed-08',
    patientName: 'Tolera Mamo Kassa',
    mrn: 'MKH-2026-000108',
    condition: 'Community-Acquired Pneumonia',
    bp: '115/72',
    temp: '37.6°C',
    hr: '88 bpm',
    spo2: '91%',
    status: 'warning',
    nextMed: 'Nasal O2 3L/min + Azithromycin',
  },
  {
    bedNo: 'Bed-12',
    patientName: 'Derartu Gemechu Tulu',
    mrn: 'MKH-2026-000112',
    condition: 'Diabetic Foot Ulcer Dressing',
    bp: '128/84',
    temp: '36.9°C',
    hr: '78 bpm',
    spo2: '97%',
    status: 'stable',
    nextMed: 'Subcutaneous Insulin 8 IU',
  },
];

export function NurseDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'om';

  const [beds, setBeds] = useState<BedVital[]>(INITIAL_BEDS);

  return (
    <div className="space-y-6">
      {/* 1. NURSING HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#101624] border border-[#222b3d] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Tajaajila Narsummaa fi Kutaa Ciisichaa'
                  : lang === 'am'
                  ? 'የነርስ ጣቢያና የተኝቶ ታካሚዎች ክትትል ክፍል'
                  : 'Nursing Station & Inpatient Ward Care Dashboard'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold">
                NURSE STATION 02
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'om'
                ? 'To\'annoo mallattoolee lubbuu (vitals), kenniinsa qorichaa (MAR), fi qophii ciisichaa'
                : 'Bedside vital signs telemetry, MAR medication administration, triage, and sterile supplies'}
            </p>
          </div>
        </div>

        {/* Quick Nursing Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/wards"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Bed className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Kutaa Ciisichaa (IPD)' : 'Inpatient Beds'}</span>
          </Link>
          <Link
            href="/queue"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-amber-300 text-xs font-semibold transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Dabaree Triage' : 'Triage Queue'}</span>
          </Link>
          <Link
            href="/blood-bank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-rose-300 text-xs font-semibold transition cursor-pointer"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Dhiiga Naquu' : 'Transfusion'}</span>
          </Link>
          <Link
            href="/dietary"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-teal-300 text-xs font-semibold transition cursor-pointer"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Nyaata Yaalaa' : 'Dietary'}</span>
          </Link>
        </div>
      </div>

      {/* 2. NURSING KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Dhukkubsattoota Ciisan' : 'Admitted Patients'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">18</span>
              <span className="text-[11px] text-slate-400 font-medium">/ 20 beds</span>
            </div>
            <p className="text-[10px] text-emerald-400 font-medium">90% {lang === 'om' ? 'qabameera' : 'occupancy'}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Bed className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Akeekkachiisa Vitals' : 'Abnormal Vitals'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">2</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                ATTENTION
              </span>
            </div>
            <p className="text-[10px] text-rose-400/80">Bed-05 (BP High), Bed-08 (SpO2)</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Qoricha MAR Amma Barbaadamu' : 'MAR Doses Due Now'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">4</span>
              <span className="text-[11px] text-amber-400/90 font-medium">{lang === 'om' ? 'sa\'aatii kanatti' : 'next 30m'}</span>
            </div>
            <p className="text-[10px] text-slate-500">IV Ceftriaxone, Insulin, O2</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Wal-Harkaa Fuudhiinsa Shiftii' : 'Shift Handover'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400">1h 45m</span>
            </div>
            <p className="text-[10px] text-slate-500">Nurse Derartu taking over</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. WARD BED VITALS BOARD & MONITOR MATRIX */}
      <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'om' ? 'To\'annoo Sireewwan Ciisichaa (Bedside Vitals & Status)' : 'Inpatient Bed Vitals & Monitor Matrix'}
            </h3>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">
            Ward B • Internal Medicine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {beds.map((b) => (
            <div
              key={b.bedNo}
              className={`rounded-2xl border p-4 space-y-3 transition-all ${
                b.status === 'critical'
                  ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/40'
                  : b.status === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/50'
                  : 'bg-[#0a0e17] border-[#1e283b] hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{b.bedNo}</span>
                    <span className="font-bold text-white text-sm">{b.patientName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    MRN: <span className="font-mono text-slate-300">{b.mrn}</span> • {b.condition}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    b.status === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : b.status === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              {/* Vitals Telemetry Row */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-xl bg-[#101624] border border-[#222b3d] p-1.5">
                  <span className="text-[10px] text-slate-400 block">BP</span>
                  <span className={`font-mono font-bold ${b.status === 'critical' ? 'text-rose-400' : 'text-white'}`}>
                    {b.bp}
                  </span>
                </div>
                <div className="rounded-xl bg-[#101624] border border-[#222b3d] p-1.5">
                  <span className="text-[10px] text-slate-400 block">Temp</span>
                  <span className="font-mono font-bold text-amber-300">{b.temp}</span>
                </div>
                <div className="rounded-xl bg-[#101624] border border-[#222b3d] p-1.5">
                  <span className="text-[10px] text-slate-400 block">Pulse</span>
                  <span className="font-mono font-bold text-cyan-300">{b.hr}</span>
                </div>
                <div className="rounded-xl bg-[#101624] border border-[#222b3d] p-1.5">
                  <span className="text-[10px] text-slate-400 block">SpO2</span>
                  <span className={`font-mono font-bold ${b.status === 'warning' ? 'text-amber-400' : 'text-emerald-300'}`}>
                    {b.spo2}
                  </span>
                </div>
              </div>

              {/* Next Scheduled Medication */}
              <div className="flex items-center justify-between rounded-xl bg-[#101624] border border-[#1f293d] px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Pill className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] truncate">{b.nextMed}</span>
                </div>
                <Link
                  href="/wards"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 hover:text-teal-300 hover:underline shrink-0"
                >
                  <span>MAR</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
