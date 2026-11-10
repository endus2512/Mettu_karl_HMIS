/**
 * Mettu Karl Referral Hospital — Doctor Clinical & OPD Workstation Dashboard
 * Dedicated operational view for Physicians, Surgeons, and Clinical Specialists.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import { useZenMode } from '@/lib/zenMode';
import { ClinicalGuidedStepper } from '@/components/clinical/ClinicalGuidedStepper';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  FlaskConical,
  Bed,
  Syringe,
  Pill,
  Scan,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Search,
  Activity,
  Heart,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Leaf,
  BarChart2,
  Route,
  LayoutGrid,
} from 'lucide-react';

interface OpdPatient {
  token: string;
  mrn: string;
  name: string;
  ageGender: string;
  triage: 'red' | 'yellow' | 'green';
  complaint: { en: string; om: string; am: string };
  bp: string;
  temp: string;
  spo2: string;
  status: 'waiting' | 'in_consultation' | 'completed';
}

const INITIAL_OPD_PATIENTS: OpdPatient[] = [
  {
    token: 'A-012',
    mrn: 'MKH-2026-000101',
    name: 'Gudeta Hailu Tadesse',
    ageGender: '42 / Dhi',
    triage: 'yellow',
    complaint: {
      en: 'High fever, severe rigors & joint pain for 3 days',
      om: "Ho'a cimaa, rom'uu fi dhukkubbii buusaa guyyaa 3f",
      am: 'ከፍተኛ ትኩሳት፣ ብርድ ብርድ ማለት እና የመገጣጠሚያ ህመም',
    },
    bp: '125/82',
    temp: '38.9°C',
    spo2: '97%',
    status: 'in_consultation',
  },
  {
    token: 'A-015',
    mrn: 'MKH-2026-000102',
    name: 'Ayantu Mamo Kassa',
    ageGender: '31 / Dub',
    triage: 'yellow',
    complaint: {
      en: 'Acute abdominal cramping & nausea',
      om: 'Dhukkubbii garaa cimaa fi diddiga',
      am: 'አጣዳፊ የሆድ ህመም እና ማቅለሽለሽ',
    },
    bp: '110/72',
    temp: '37.8°C',
    spo2: '98%',
    status: 'waiting',
  },
  {
    token: 'A-019',
    mrn: 'MKH-2026-000103',
    name: 'Derartu Tulu Gemechu',
    ageGender: '28 / Dub',
    triage: 'green',
    complaint: {
      en: 'Routine prenatal follow-up 28 weeks gestation',
      om: 'Hordoffii ulfaa yeroo (torbee 28ffaa)',
      am: 'መደበኛ የቅድመ ወሊድ ክትትል 28 ሳምንታት',
    },
    bp: '118/76',
    temp: '36.7°C',
    spo2: '99%',
    status: 'waiting',
  },
  {
    token: 'A-024',
    mrn: 'MKH-2026-000104',
    name: 'Chala Tolera Lemma',
    ageGender: '55 / Dhi',
    triage: 'red',
    complaint: {
      en: 'Chest tightness radiating to left shoulder, diaphoresis',
      om: "Cobsama qomaa gara ceekuu bitaatti babal'atu",
      am: 'የደረት መወጠር እና ወደ ግራ ትከሻ የሚሰራጭ ህመም',
    },
    bp: '155/98',
    temp: '37.1°C',
    spo2: '93%',
    status: 'waiting',
  },
];

export function DoctorDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';
  const { isZenMode, toggleZenMode } = useZenMode();
  const [viewMode, setViewMode] = useState<'guided' | 'standard'>('guided');

  const [patients, setPatients] = useState<OpdPatient[]>(INITIAL_OPD_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<OpdPatient | null>(INITIAL_OPD_PATIENTS[0]);

  const handleCompleteConsultation = (mrn: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.mrn === mrn ? { ...p, status: 'completed' as const } : p))
    );
    if (selectedPatient?.mrn === mrn) {
      setSelectedPatient((prev) => (prev ? { ...prev, status: 'completed' as const } : null));
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. CLINICAL HEADER WITH QUICK SHORTCUTS */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl p-4 sm:p-5 shadow-lg transition-all ${
        isZenMode
          ? 'bg-[#0e1422] border border-slate-800/80'
          : 'bg-[#101624] border border-[#222b3d]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'om'
                  ? 'Kiliinika Deddeebii & Kutaa Ogeessa Yaalaa (OPD)'
                  : lang === 'am'
                  ? 'የተመላላሽ ታካሚ ክሊኒክና የሀኪም የስራ ክፍል (OPD)'
                  : 'Physician Clinical & OPD Command Workstation'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono font-semibold">
                DOCTOR ACTIVE
              </span>
              {isZenMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-medium flex items-center gap-1">
                  <Leaf className="w-2.5 h-2.5" />
                  <span>ZEN ACTIVE</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'om'
                ? "Hordoffii dhukkubsattoota har'aa, ajaja qorannoo laabii, fi barreessa resephii"
                : 'Outpatient consultation queue, LIS laboratory reviews, CDSS safety alerts, and inpatient rounds'}
            </p>
          </div>
        </div>

        {/* Quick Clinical Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Dhukkubsataa Haaraa' : 'New Consultation'}</span>
          </Link>
          <Link
            href="/laboratory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-cyan-300 text-xs font-semibold transition cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Ajaji Laabii' : 'Order Lab'}</span>
          </Link>
          <Link
            href="/pharmacy"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-amber-300 text-xs font-semibold transition cursor-pointer"
          >
            <Pill className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Barreessi Resephii' : 'Prescribe'}</span>
          </Link>
          <Link
            href="/wards"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-emerald-300 text-xs font-semibold transition cursor-pointer"
          >
            <Bed className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Kutaa Ciisichaa' : 'Inpatient Wards'}</span>
          </Link>
        </div>
      </div>

      {/* 2. DUAL INTERFACE SWITCHER: GUIDED STEPPER vs STANDARD QUEUE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#0e1422] border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('guided')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'guided'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? '🚶 Qajeelcha Yaalaa (Guided Stepper)' : '🚶 Guided Stepper Mode'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('standard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'standard'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? '📋 Tartiiba Baramaa (Standard Workstation)' : '📋 Standard Workstation'}</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {viewMode === 'guided'
            ? (lang === 'om' ? '⚡ Adeemsa salphaa sadarkaa 4n xumuru' : '⚡ Zero-confusion 4-step consultation flow')
            : (lang === 'om' ? '📊 Wiirtuu guutuu dabaree fi vitals' : '📊 Full consultation worklist and vitals cards')}
        </span>
      </div>

      {viewMode === 'guided' ? (
        <div className="animate-smooth-in">
          <ClinicalGuidedStepper onComplete={handleCompleteConsultation} />
        </div>
      ) : (
        <div className="animate-smooth-in space-y-5">
          {/* 3. DOCTOR CLINICAL KPI TILES / PROGRESSIVE DISCLOSURE */}
      {isZenMode ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#0e1422] border border-slate-800/80 shadow-sm transition-all">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {lang === 'om' ? "Har'a: 14 Dhukkubsattoota" : "Today: 14 Patients"} (8 {lang === 'om' ? 'Xumuraman' : 'Done'}, 6 {lang === 'om' ? 'Dabaree' : 'Waiting'})
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 font-semibold text-rose-300">
              <FlaskConical className="w-3.5 h-3.5 text-rose-400" />
              3 {lang === 'om' ? "Akeekkachiisa Laabii (Panic Alert)" : "Panic Lab Alerts"}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Syringe className="w-3.5 h-3.5 text-amber-400" />
              1 {lang === 'om' ? 'Baqaqsaa (11:30 AM)' : 'Surgery Scheduled'}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Bed className="w-3.5 h-3.5 text-teal-400" />
              8 {lang === 'om' ? 'Marsaa Ciisichaa' : 'Ward Rounds'}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleZenMode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141b2a] hover:bg-slate-800 border border-slate-700/60 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'om' ? "Bal'isi (Telemetry)" : 'Expand Metrics'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span className="font-semibold">{lang === 'om' ? "Istaatiistiksii Bal'aa (Expanded Clinical Telemetry)" : "Expanded Clinical Telemetry"}</span>
            <button
              type="button"
              onClick={toggleZenMode}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <Leaf className="w-3 h-3" />
              <span>{lang === 'om' ? "Gara Salphaatti Deebi'i (Zen Mode)" : 'Back to Zen Mode'}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  {lang === 'om' ? "Dhukkubsattoota Har'aa" : 'Patients Today'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">14</span>
                  <span className="text-[11px] text-teal-400 font-medium">8 {lang === 'om' ? 'xumuraman' : 'done'}</span>
                </div>
                <p className="text-[10px] text-slate-500">6 {lang === 'om' ? 'dabaree eeggachaa jiru' : 'waiting in lobby'}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  {lang === 'om' ? "Bu'aa Laabii Eegamu" : 'Pending Lab Reviews'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-400">3</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    PANIC
                  </span>
                </div>
                <p className="text-[10px] text-rose-400/80">K+ 6.1, Troponin (+) alert</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  {lang === 'om' ? 'Baqaqsanii Yaaluu (OT)' : 'Surgeries Scheduled'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400">1</span>
                  <span className="text-[11px] text-amber-400/90 font-medium">11:30 AM</span>
                </div>
                <p className="text-[10px] text-slate-500">Appendectomy • Theatre 01</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Syringe className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  {lang === 'om' ? 'Marsaa Ciisichaa (IPD)' : 'Ward Rounds'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">8</span>
                  <span className="text-[11px] text-emerald-400/90 font-medium">Ward B</span>
                </div>
                <p className="text-[10px] text-slate-500">2 ready for discharge</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Bed className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CLINICAL ALERTS BANNER (CDSS & PANIC VALUES) */}
      <div className={`rounded-2xl p-4 space-y-2 transition-all ${
        isZenMode
          ? 'bg-[#0e1422] border border-slate-800'
          : 'bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-[#101624] border border-rose-500/40'
      }`}>
        <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Akeekkachiisa Yaalaa Hatattamaa (CDSS & Panic Lab Alerts)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0b0f17]/80 rounded-xl border border-rose-500/30 p-2.5 flex items-start gap-2.5">
            <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-ping" />
            <div>
              <p className="font-semibold text-rose-200">
                Panic LIS: Gudeta Hailu (MKH-2026-000101)
              </p>
              <p className="text-slate-300 text-[11px]">
                Serum Potassium (K+): <strong className="text-rose-400 font-mono">6.1 mEq/L</strong> (High risk arrhythmias. Repeat ECG ordered).
              </p>
            </div>
          </div>
          <div className="bg-[#0b0f17]/80 rounded-xl border border-amber-500/30 p-2.5 flex items-start gap-2.5">
            <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-200">
                CDSS Interaction Alert: Ciprofloxacin + Warfarin
              </p>
              <p className="text-slate-300 text-[11px]">
                Elevated bleeding risk detected on Patient Ayantu Mamo. Monitor PT/INR.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ACTIVE OPD CONSULTATIONS WORKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient Queue Table (2 Cols) */}
        <div className={`lg:col-span-2 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 transition-all ${
          isZenMode ? 'bg-[#0e1422] border border-slate-800/80' : 'bg-[#101624] border border-[#222b3d]'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">
                {lang === 'om' ? "Dabaree Yaala OPD Har'aa" : "Today's OPD Consultation Queue"}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Live Lobby Queue
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1f293d] pb-2">
                <tr>
                  <th className="pb-2">Token / MRN</th>
                  <th className="pb-2">{lang === 'om' ? 'Dhukkubsataa' : 'Patient Name'}</th>
                  <th className="pb-2">Triage</th>
                  <th className="pb-2">Vitals</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2336]">
                {patients.map((pat) => (
                  <tr
                    key={pat.token}
                    onClick={() => setSelectedPatient(pat)}
                    className={`hover:bg-[#141b2b] transition cursor-pointer ${
                      selectedPatient?.token === pat.token ? 'bg-[#152033] border-l-2 border-teal-400' : ''
                    }`}
                  >
                    <td className="py-3 font-mono">
                      <span className="font-bold text-amber-400 block">{pat.token}</span>
                      <span className="text-[10px] text-slate-500">{pat.mrn}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-white block">{pat.name}</span>
                      <span className="text-[10px] text-slate-400">{pat.ageGender}</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          pat.triage === 'red'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : pat.triage === 'yellow'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {pat.triage}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] font-mono text-slate-300">
                      <div>BP: {pat.bp}</div>
                      <div>T: {pat.temp} • SpO2: {pat.spo2}</div>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/patients`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 text-[11px] font-medium transition"
                      >
                        <span>{lang === 'om' ? 'Yaali' : 'Consult'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Patient Card & Quick Prescription Box */}
        <div className={`rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 transition-all ${
          isZenMode ? 'bg-[#0e1422] border border-slate-800/80' : 'bg-[#101624] border border-[#222b3d]'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>{lang === 'om' ? 'Ragaa Dhukkubsataa' : 'Selected Case'}</span>
            </h3>
            {selectedPatient && (
              <span className="text-[11px] font-mono text-teal-400 font-bold">
                {selectedPatient.token}
              </span>
            )}
          </div>

          {selectedPatient ? (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedPatient.name}</h4>
                <p className="text-slate-400 text-[11px]">
                  MRN: <span className="font-mono text-amber-300">{selectedPatient.mrn}</span> • {selectedPatient.ageGender}
                </p>
              </div>

              {/* Vitals Summary Pill Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#090d15] border border-[#1e283b] p-2 text-center">
                  <span className="text-[10px] text-slate-400 block">BP</span>
                  <span className="font-bold text-white font-mono text-xs">{selectedPatient.bp}</span>
                </div>
                <div className="rounded-xl bg-[#090d15] border border-[#1e283b] p-2 text-center">
                  <span className="text-[10px] text-slate-400 block">Temp</span>
                  <span className="font-bold text-amber-300 font-mono text-xs">{selectedPatient.temp}</span>
                </div>
                <div className="rounded-xl bg-[#090d15] border border-[#1e283b] p-2 text-center">
                  <span className="text-[10px] text-slate-400 block">SpO2</span>
                  <span className="font-bold text-teal-300 font-mono text-xs">{selectedPatient.spo2}</span>
                </div>
              </div>

              {/* Chief Complaint */}
              <div className="rounded-xl bg-[#090d15] border border-[#1e283b] p-3 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {lang === 'om' ? 'Komiin Dhukkubsataa:' : 'Chief Complaint:'}
                </span>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {selectedPatient.complaint[lang]}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => selectedPatient && handleCompleteConsultation(selectedPatient.mrn)}
                  disabled={selectedPatient.status === 'completed'}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                    selectedPatient.status === 'completed'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedPatient.status === 'completed'
                      ? (lang === 'om' ? '✓ Yaalli Xumurameera' : '✓ Consultation Completed')
                      : (lang === 'om' ? 'Yaala Xumuri (Finish Consultation)' : 'Complete Consultation')}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/pharmacy"
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition text-center"
                  >
                    <Pill className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lang === 'om' ? 'Resephii' : 'Prescribe'}</span>
                  </Link>
                  <Link
                    href="/laboratory"
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-semibold transition text-center"
                  >
                    <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lang === 'om' ? 'Ajaji Laabii' : 'Order Lab'}</span>
                  </Link>
                </div>

                <Link
                  href="/wards"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 font-semibold transition"
                >
                  <Bed className="w-3.5 h-3.5" />
                  <span>{lang === 'om' ? 'Kutaa Ciisichaatti Galmeessi (Admit)' : 'Admit to Inpatient Ward'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              {lang === 'om' ? 'Dhukkubsataa tokko filadhaa' : 'Select a patient from the queue'}
            </div>
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
