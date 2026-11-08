/**
 * Mettu Karl Referral Hospital — Nurse Station & Ward Care Dashboard
 * Dedicated operational view for Inpatient, Triage, and Critical Care Nurses.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import { useHospitalTimeSync } from '@/lib/timeSync';
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
  Edit3,
  Check,
  Calendar,
  Stethoscope,
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

  const {
    serverTime,
    ethiopian,
    gregorian,
    shift,
    ntpSynced,
    overrideShift,
    isUpdating,
  } = useHospitalTimeSync();

  const [beds, setBeds] = useState<BedVital[]>(INITIAL_BEDS);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [handoverNoteDraft, setHandoverNoteDraft] = useState(shift.handover_notes || '');

  React.useEffect(() => {
    if (shift?.handover_notes) {
      setHandoverNoteDraft(shift.handover_notes);
    }
  }, [shift?.handover_notes]);

  const handleSaveNotes = async () => {
    try {
      await overrideShift({
        shift_type: shift.type,
        handover_notes: handoverNoteDraft,
      });
      setIsEditingNotes(false);
    } catch {
      // handled
    }
  };

  const handoverHours = Math.floor(shift.handover_countdown_minutes / 60);
  const handoverMins = shift.handover_countdown_minutes % 60;
  const handoverTimeStr = `${handoverHours}h ${handoverMins}m`;

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
                ? "To'annoo mallattoolee lubbuu (vitals), kenniinsa qorichaa (MAR), fi qophii ciisichaa"
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

      {/* 2. ONLINE LIVE SHIFT & WARD HANDOVER COCKPIT */}
      <div className="rounded-2xl bg-gradient-to-r from-[#101726] via-[#121c30] to-[#0f1728] border border-[#22314d] p-4 sm:p-5 shadow-lg space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2b42]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>{lang === 'om' ? 'Shiftii fi Dabarsaa Wardii Online' : 'Online Shift & Handover Telemetry'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30">
                NTP SYNCED
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Server EAT Time */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d131f] border border-[#1e2a3f] text-teal-300 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{serverTime} EAT</span>
              <span className="text-[10px] text-slate-400 font-normal">({ethiopian.habasha_time_str})</span>
            </div>

            {/* Ethiopian Calendar */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d131f] border border-[#1e2a3f] text-amber-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'am' ? ethiopian.formatted_am : ethiopian.formatted_om} E.C.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Active Shift with progress bar */}
          <div className="rounded-xl bg-[#0b0f19] border border-[#1c273a] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {lang === 'om' ? 'Shiftii Ammaa' : 'Active Duty Shift'}
              </span>
              <span className="text-amber-400 font-bold">
                {shift.start_time} - {shift.end_time}
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              {lang === 'om' ? shift.name_om : lang === 'am' ? shift.name_am : shift.name_en}
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>{lang === 'om' ? 'Sadarkaa Shiftii' : 'Shift Progress'}</span>
                <span className="text-teal-300 font-mono font-bold">{shift.progress_percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, shift.progress_percent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Duty Staffing */}
          <div className="rounded-xl bg-[#0b0f19] border border-[#1c273a] p-3 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {lang === 'om' ? 'Ogeeyyii Shiftii Irra Jiran' : 'On-Duty Ward Staff'}
            </span>
            <div className="flex items-center gap-2 text-xs text-white">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold truncate">{shift.charge_nurse || 'Nurse Chaltu Daba (Charge)'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Stethoscope className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{shift.duty_physician || 'Dr. Bekele Tadesse (MD, Surgeon)'}</span>
            </div>
            <div className="text-[11px] text-slate-400 pt-0.5">
              <span>{lang === 'om' ? 'Hafte Sa\'aa' : 'Handover in'}: </span>
              <span className="text-cyan-300 font-bold font-mono">{handoverTimeStr}</span>
            </div>
          </div>

          {/* Live Ward Handover Notes */}
          <div className="rounded-xl bg-[#0b0f19] border border-[#1c273a] p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {lang === 'om' ? 'Qabxii Dabarsaa Wardii' : 'Ward Handover Notes'}
                </span>
                {!isEditingNotes ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(true)}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer font-semibold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{lang === 'om' ? 'Gulaali' : 'Edit'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                    <span>{isUpdating ? 'Olkaawamaa...' : lang === 'om' ? 'Olkaa\'i' : 'Save'}</span>
                  </button>
                )}
              </div>
              {!isEditingNotes ? (
                <p className="text-xs text-slate-200 line-clamp-2 italic">
                  "{shift.handover_notes || 'All acute ward beds stable. Bed-05 under strict BP monitoring.'}"
                </p>
              ) : (
                <textarea
                  rows={2}
                  value={handoverNoteDraft}
                  onChange={(e) => setHandoverNoteDraft(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 p-1.5 text-xs text-white focus:border-teal-500 focus:outline-none resize-none"
                  placeholder="Enter acute notes, patient stability alerts..."
                />
              )}
            </div>
            <div className="text-[10px] text-slate-500 pt-1">
              {lang === 'om' ? 'Waliigala database tiin qindaa\'eera' : 'Persisted in hospital central database'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. NURSING KPI METRICS */}
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
              <span className="text-[11px] text-amber-400/90 font-medium">{lang === 'om' ? "sa'aatii kanatti" : 'next 30m'}</span>
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
              <span className="text-2xl font-black text-cyan-400">{handoverTimeStr}</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {shift.charge_nurse || 'Duty Sister-in-Charge'}
            </p>
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
