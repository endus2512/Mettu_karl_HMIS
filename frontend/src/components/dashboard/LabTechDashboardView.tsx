/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Laboratory LIS & Pathology Bench Workstation (/portal/lab).
 *
 * Dedicated operational view for Laboratory Technologists, Biochemists, and Pathologists.
 * Overhauled to match the Executive Command Standard:
 * - Unified Outer Rectangle with 4 Compact Animated 3D Mini Cubes
 * - Frosted Glassmorphism, Bold Typography, Vibrant Responsive Gradients
 * - High-Contrast Universal Theme (Flawless Light & Dark Mode)
 * - Minimized-by-Default Clean Workstation with Kinetic MorphingArrowButtons
 * - Interactive Rapid Specimen Result Logging & Panic Lab Dispatch Modal
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, type Language } from '@/lib/i18n';
import { useHospitalTimeSync } from '@/lib/timeSync';
import { MorphingArrowButton } from '@/components/admin/MorphingArrowButton';
import { notifications } from '@mantine/notifications';
import { playClinicalAudioAlert } from '@/lib/notifications';
import {
  FlaskConical,
  Microscope,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Scan,
  ShieldCheck,
  ArrowRight,
  Flame,
  Activity,
  Search,
  Check,
  X,
  Layers,
  FileText,
  Boxes,
  Radio,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react';

interface SpecimenOrder {
  specimenId: string;
  mrn: string;
  patientName: string;
  testName: string;
  department: string;
  priority: 'stat' | 'urgent' | 'routine';
  resultValue?: string;
  status: 'received' | 'analyzing' | 'completed';
}

const INITIAL_SPECIMENS: SpecimenOrder[] = [
  {
    specimenId: 'SPEC-2026-8801',
    mrn: 'MKH-2026-000101',
    patientName: 'Gudeta Hailu Tadesse',
    testName: 'Serum Electrolytes (Na+, K+, Cl-)',
    department: 'Clinical Chemistry',
    priority: 'stat',
    resultValue: 'K+ 6.1 mEq/L (Critical High)',
    status: 'analyzing',
  },
  {
    specimenId: 'SPEC-2026-8802',
    mrn: 'MKH-2026-000102',
    patientName: 'Ayantu Mamo Kassa',
    testName: 'Complete Blood Count (CBC) + Diff',
    department: 'Hematology',
    priority: 'urgent',
    resultValue: 'WBC 14.8k, Hgb 11.2 g/dL',
    status: 'received',
  },
  {
    specimenId: 'SPEC-2026-8803',
    mrn: 'MKH-2026-000104',
    patientName: 'Chala Tolera Lemma',
    testName: 'Cardiac Troponin I (High Sensitivity)',
    department: 'Immunoassay',
    priority: 'stat',
    resultValue: '0.84 ng/mL (Critical Elevated)',
    status: 'analyzing',
  },
  {
    specimenId: 'SPEC-2026-8804',
    mrn: 'MKH-2026-000105',
    patientName: 'Chaltu Daba Tolasa',
    testName: 'Blood Grouping & Crossmatch (Packed RBC 2U)',
    department: 'Blood Bank',
    priority: 'urgent',
    resultValue: 'B Positive (Compatible with Unit #2904)',
    status: 'received',
  },
];

interface BloodUnitSummary {
  group: string;
  rh: string;
  availableUnits: number;
  reservedUnits: number;
}

const BLOOD_INVENTORY: BloodUnitSummary[] = [
  { group: 'O', rh: 'Negative', availableUnits: 4, reservedUnits: 1 },
  { group: 'O', rh: 'Positive', availableUnits: 18, reservedUnits: 3 },
  { group: 'A', rh: 'Positive', availableUnits: 12, reservedUnits: 2 },
  { group: 'B', rh: 'Positive', availableUnits: 9, reservedUnits: 2 },
  { group: 'AB', rh: 'Positive', availableUnits: 5, reservedUnits: 0 },
];

export function LabTechDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const { serverTime, shift } = useHospitalTimeSync();

  const [specimens, setSpecimens] = useState<SpecimenOrder[]>(INITIAL_SPECIMENS);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'stat' | 'urgent' | 'routine'>('all');

  // Minimized-by-default module toggles
  const [showSpecimenQueue, setShowSpecimenQueue] = useState<boolean>(false);
  const [showBloodBank, setShowBloodBank] = useState<boolean>(false);
  const [showActionPads, setShowActionPads] = useState<boolean>(false);

  // Quick Result Logging Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpecimen, setSelectedSpecimen] = useState<SpecimenOrder>(INITIAL_SPECIMENS[0]);
  const [modalResultText, setModalResultText] = useState('K+ 6.1 mEq/L (Critical High)');
  const [isCriticalFlag, setIsCriticalFlag] = useState(true);

  const handleMarkCompleteDirect = (specimenId: string) => {
    setSpecimens((prev) =>
      prev.map((s) => (s.specimenId === specimenId ? { ...s, status: 'completed' } : s))
    );
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Qorannoon Xumurameera' : 'LIS Result Authorized',
      message: `${specimenId} results transmitted to Electronic Health Record (EHR).`,
      color: 'teal',
    });
  };

  const handleSaveModalResult = (e: React.FormEvent) => {
    e.preventDefault();
    setSpecimens((prev) =>
      prev.map((s) =>
        s.specimenId === selectedSpecimen.specimenId
          ? {
              ...s,
              resultValue: modalResultText,
              status: 'completed',
            }
          : s
      )
    );
    playClinicalAudioAlert(isCriticalFlag ? 'alert' : 'info');
    notifications.show({
      title: isCriticalFlag
        ? (lang === 'om' ? 'Qorannoo Hatattamaa (Panic Alert Ergame)' : 'Critical Panic Value Dispatched')
        : (lang === 'om' ? 'Firiin Qorannoo Galmaa\'eera' : 'Lab Result Authorized'),
      message: `${selectedSpecimen.specimenId} (${selectedSpecimen.testName}): ${modalResultText} transmitted directly to attending physician.`,
      color: isCriticalFlag ? 'red' : 'teal',
    });
    setIsModalOpen(false);
  };

  const filteredSpecimens = specimens.filter((s) => {
    const matchesSearch =
      s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.specimenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || s.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const statCount = specimens.filter((s) => s.priority === 'stat').length;
  const completedCount = specimens.filter((s) => s.status === 'completed').length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-smooth-in">
      {/* ================================================================= */}
      {/* 1. LIS BENCH COCKPIT HEADER                                       */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-cyan-100/90 via-white/95 to-sky-100/90 dark:from-[#0d222b]/95 dark:via-[#112d38]/95 dark:to-[#0c1f26]/95 border-[2.5px] border-cyan-400/90 dark:border-cyan-400/60 shadow-[0_12px_32px_-8px_rgba(6,182,212,0.28)] hover:shadow-[0_16px_40px_-8px_rgba(6,182,212,0.4)] transition-all duration-300">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/50 dark:via-cyan-200/15 to-transparent mkh-panel-sweep" />

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/35 border-2 border-white/60 shrink-0 transform hover:scale-105 hover:rotate-3 transition-transform">
            <FlaskConical className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Qorannoo Laaboraatorii & Dhiigaa (LIS)'
                  : lang === 'am'
                  ? 'የላቦራቶሪና የደም ምርመራ ማዕከል (LIS Bench)'
                  : 'Laboratory Information System (LIS) Command Desk'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-400/30 text-cyan-950 dark:text-cyan-100 border-2 border-cyan-500/60 font-mono font-black">
                LIS BENCH ACTIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {lang === 'om'
                ? 'Qorannoo dhiigaa, mirkaneessa firii, akeekkachiisa panic values, fi kuusaa dhiigaa'
                : 'Hematology analyzers, clinical chemistry benches, panic lab alerting, and SafeBlood'}
            </p>
          </div>
        </div>

        {/* Quick Status Badges & Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          {/* STAT Panic Alerts Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 bg-rose-100/95 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border-rose-500/75 transition-transform hover:scale-[1.04]">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>2 STAT PANIC LABS</span>
          </div>

          {/* Active Shift Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#11242e] border-2 border-cyan-400/80 dark:border-cyan-400/50 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:border-cyan-500 transition-colors">
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>
              {shift ? (lang === 'om' ? shift.name_om : lang === 'am' ? shift.name_am : shift.name_en) : 'Lab Duty Shift'}
            </span>
            <span className="text-cyan-700 dark:text-cyan-300 font-mono text-xs">
              ({serverTime || '10:00 AM'})
            </span>
          </div>

          {/* Primary Action Button: Log Lab Result */}
          <MorphingArrowButton
            variant="sky"
            size="sm"
            label={lang === 'om' ? 'Galmee Firii' : 'Log Lab Result'}
            icon={<FileCheck2 className="w-4 h-4" />}
            onClick={() => {
              setSelectedSpecimen(specimens[0]);
              setModalResultText(specimens[0].resultValue || '');
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. URGENT CRITICAL PANIC LAB BANNER                               */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-100 via-amber-100/90 to-rose-100/95 dark:from-rose-950/45 dark:via-amber-950/35 dark:to-rose-950/45 border-[2.5px] border-rose-400/90 dark:border-rose-400/60 text-xs sm:text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 dark:via-rose-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.2s' }} />
        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-300 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="font-black text-rose-950 dark:text-rose-100 mr-2">
              {lang === 'om' ? "Akeekkachiisa Firii Hatattamaa (Panic Value):" : "Urgent Panic Value Detected:"}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              Chala Tolera (MKH-2026-000104): Cardiac Troponin I 0.84 ng/mL • Immediate Cardiology Alert
            </span>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <MorphingArrowButton
            variant="rose"
            size="xs"
            label={lang === 'om' ? 'Qorannoo Ilaali' : 'Inspect Specimen'}
            onClick={() => setShowSpecimenQueue(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. ONE UNIFIED RECTANGLE HOLDING 4 COMPACT ANIMATED 3D MINI CUBES */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-[2.5px] border-cyan-400/90 dark:border-cyan-400/60 bg-gradient-to-br from-cyan-100/85 via-white/95 to-sky-100/85 dark:from-[#0d222b]/95 dark:via-[#112d38]/95 dark:to-[#0c1f26]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_14px_34px_-8px_rgba(6,182,212,0.3)] hover:shadow-[0_18px_42px_-8px_rgba(6,182,212,0.45)] hover:-translate-y-0.5 transition-all duration-300 animate-smooth-in">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/45 dark:via-cyan-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '0.6s' }} />
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto">
          {/* Mini Cube 1: Specimens Today */}
          <div
            onClick={() => setShowSpecimenQueue((prev) => !prev)}
            style={{ animationDelay: '0s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-cyan-400/85 dark:border-cyan-400/55 bg-gradient-to-br from-white via-cyan-50 to-cyan-100/95 dark:from-[#11313d] dark:via-[#153b4a] dark:to-[#122e38] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(6,182,212,0.28),3px_3px_0_0_rgba(34,211,238,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-cyan-500 hover:shadow-[0_14px_24px_-4px_rgba(6,182,212,0.42),5px_5px_0_0_rgba(34,211,238,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-cyan-200/20 to-transparent mkh-cube-sweep" />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-cyan-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                1. {lang === 'om' ? 'Qorannoo Har\'aa' : 'Specimens Today'}
              </span>
              <span className="h-6 w-6 rounded-lg bg-cyan-500/20 dark:bg-cyan-400/25 border border-cyan-400/60 text-cyan-800 dark:text-cyan-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Microscope className="w-3 h-3" />
              </span>
            </div>

            <div className="relative z-10 space-y-1 my-auto">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  34
                </span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                  {completedCount + 24} Done
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/90 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-700" style={{ width: '76%' }} />
              </div>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {specimens.length - completedCount} {lang === 'om' ? 'Harka Irra Jira' : 'In Analysis'}
            </p>
          </div>

          {/* Mini Cube 2: STAT Panic Values */}
          <div
            onClick={() => setShowSpecimenQueue((prev) => !prev)}
            style={{ animationDelay: '0.45s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-rose-400/85 dark:border-rose-400/55 bg-gradient-to-br from-white via-rose-50 to-rose-100/95 dark:from-[#361824] dark:via-[#421d2d] dark:to-[#381622] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(244,63,94,0.28),3px_3px_0_0_rgba(251,113,133,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-rose-500 hover:shadow-[0_14px_24px_-4px_rgba(244,63,94,0.42),5px_5px_0_0_rgba(251,113,133,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-rose-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '1.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-rose-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                2. {lang === 'om' ? 'Qorannoo STAT' : 'STAT Panic'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-rose-500/20 dark:bg-rose-400/25 border border-rose-400/60 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-rose-900 dark:text-rose-200">
                {statCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border border-rose-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-300 animate-ping" />
                PANIC ALERTS
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              K+ 6.1 • Troponin I
            </p>
          </div>

          {/* Mini Cube 3: Blood Bank SafeBlood Reserve */}
          <div
            onClick={() => setShowBloodBank((prev) => !prev)}
            style={{ animationDelay: '0.9s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-rose-400/85 dark:border-rose-400/55 bg-gradient-to-br from-white via-rose-50 to-red-100/95 dark:from-[#361a22] dark:via-[#42202a] dark:to-[#351820] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(244,63,94,0.28),3px_3px_0_0_rgba(251,113,133,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-rose-500 hover:shadow-[0_14px_24px_-4px_rgba(244,63,94,0.42),5px_5px_0_0_rgba(251,113,133,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-rose-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '2.2s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-rose-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                3. {lang === 'om' ? 'Kuusaa Dhiigaa' : 'Blood Bank'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-rose-500/20 dark:bg-rose-400/25 border border-rose-400/60 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Droplets className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-rose-900 dark:text-rose-200">
                48
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border border-rose-400/60">
                O- 4 UNITS RESERVE
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              2 Units Crossmatched
            </p>
          </div>

          {/* Mini Cube 4: Analyzer Calibration & QC */}
          <Link
            href="/assets"
            style={{ animationDelay: '1.35s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-teal-400/85 dark:border-teal-400/55 bg-gradient-to-br from-white via-teal-50 to-teal-100/95 dark:from-[#132c38] dark:via-[#163646] dark:to-[#122b36] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(20,184,166,0.28),3px_3px_0_0_rgba(45,212,191,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-teal-500 hover:shadow-[0_14px_24px_-4px_rgba(20,184,166,0.42),5px_5px_0_0_rgba(45,212,191,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '3.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-teal-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                4. {lang === 'om' ? 'Qulqullina (QC)' : 'Analyzer QC'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-teal-500/20 dark:bg-teal-400/25 border border-teal-400/60 text-teal-800 dark:text-teal-200 flex items-center justify-center shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-teal-900 dark:text-teal-200 font-mono">
                PASS
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border border-teal-400/60">
                SYSMEX & COBAS
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Daily Controls Verified
            </p>
          </Link>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MINIMIZED-BY-DEFAULT SECTION 1: SPECIMEN QUEUE & LIS WORKLIST  */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-cyan-400/80 dark:border-cyan-400/50 bg-white/95 dark:bg-[#0c1f26]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-cyan-50 via-sky-50 to-white dark:from-[#0f2833] dark:via-[#133240] dark:to-[#0d222b] border-b border-cyan-200/80 dark:border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-800 dark:text-cyan-200 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Dabaree Qorannoo Laaboraatorii & LIS Worklist' : 'Laboratory Specimen Worklist & LIS Queue'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-950 dark:text-cyan-100 border border-cyan-500/40 font-bold">
                  {filteredSpecimens.length} SPECIMENS
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Qorannoowwan laaboraatorii dhiyaatan, firii galmeessuu, fi panic alert gabaasuu' : 'Specimen accessioning, analyzer telemetry, and automated panic flags'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="sky"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showSpecimenQueue}
            label={showSpecimenQueue ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Queue')}
            onClick={() => setShowSpecimenQueue((prev) => !prev)}
          />
        </div>

        {showSpecimenQueue && (
          <div className="p-4 sm:p-5 space-y-4 animate-smooth-in">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === 'om' ? 'Barbaadi Qorannoo, Maqaa, Specimen ID...' : 'Search by Test Name, Patient or Specimen ID...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border-2 border-cyan-300 dark:border-cyan-600/50 bg-white dark:bg-[#122833] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'stat', 'urgent', 'routine'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setPriorityFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      priorityFilter === filter
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' ? (lang === 'om' ? 'Hundumaa' : 'All') : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Specimen Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSpecimens.map((specimen) => (
                <div
                  key={specimen.specimenId}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                    specimen.priority === 'stat'
                      ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-400/80'
                      : specimen.priority === 'urgent'
                      ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-400/80'
                      : 'bg-cyan-50/70 dark:bg-cyan-950/25 border-cyan-300/80 dark:border-cyan-600/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          {specimen.specimenId}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {specimen.patientName}
                        </h3>
                      </div>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                        {specimen.mrn} • {specimen.department}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        specimen.priority === 'stat'
                          ? 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100 border-rose-400 animate-pulse'
                          : specimen.priority === 'urgent'
                          ? 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100 border-amber-400'
                          : 'bg-cyan-100 text-cyan-950 dark:bg-cyan-900/50 dark:text-cyan-100 border-cyan-400'
                      }`}
                    >
                      {specimen.priority}
                    </span>
                  </div>

                  {/* Test Name & Result strip */}
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 my-2 space-y-1">
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{specimen.testName}</span>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                        {specimen.status}
                      </span>
                    </div>
                    {specimen.resultValue && (
                      <div className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-950/40 p-1.5 rounded-lg border border-cyan-300 dark:border-cyan-700/60">
                        {specimen.resultValue}
                      </div>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      LIS Bench Telemetry Sync
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSpecimen(specimen);
                          setModalResultText(specimen.resultValue || '');
                          setIsCriticalFlag(specimen.priority === 'stat');
                          setIsModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>{lang === 'om' ? 'Firii Galmeessi' : 'Log Result'}</span>
                      </button>
                      {specimen.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleMarkCompleteDirect(specimen.specimenId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition"
                        >
                          {lang === 'om' ? 'Mirkaneessi' : 'Authorize'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 5. MINIMIZED-BY-DEFAULT SECTION 2: BLOOD BANK SAFEBLOOD RESERVE   */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-cyan-400/80 dark:border-cyan-400/50 bg-white/95 dark:bg-[#0c1f26]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-cyan-50 via-sky-50 to-white dark:from-[#0f2833] dark:via-[#133240] dark:to-[#0d222b] border-b border-cyan-200/80 dark:border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-800 dark:text-rose-200 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Kuusaa Dhiigaa SafeBlood & Qorannoo Wal-Simsiisaa (Crossmatch)' : 'Blood Bank SafeBlood Cold Vault & Crossmatch Matrix'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-950 dark:text-rose-100 border border-rose-500/40 font-bold">
                  48 UNITS IN VAULT
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Kuusaa dhiigaa ABO/Rh, dhiiga hatattamaa O-, fi qorannoo wal-fudhatinsaa' : 'Screened blood unit inventory, emergency O-negative, and crossmatch validation'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="rose"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showBloodBank}
            label={showBloodBank ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Blood Bank')}
            onClick={() => setShowBloodBank((prev) => !prev)}
          />
        </div>

        {showBloodBank && (
          <div className="p-4 sm:p-5 space-y-3 animate-smooth-in">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {BLOOD_INVENTORY.map((unit) => (
                <div
                  key={`${unit.group}-${unit.rh}`}
                  className="p-3.5 rounded-2xl border-2 border-rose-300 dark:border-rose-600/40 bg-rose-50/70 dark:bg-rose-950/25 text-center flex flex-col justify-between"
                >
                  <div className="text-lg font-black text-rose-700 dark:text-rose-300">
                    {unit.group} {unit.rh === 'Negative' ? '(-)' : '(+)'}
                  </div>
                  <div className="text-2xl font-black text-slate-950 dark:text-white my-1 font-mono">
                    {unit.availableUnits}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {unit.reservedUnits} Crossmatched
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 6. MINIMIZED-BY-DEFAULT SECTION 3: RAPID LABORATORY ACTION PADS   */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-cyan-400/80 dark:border-cyan-400/50 bg-white/95 dark:bg-[#0c1f26]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-cyan-50 via-sky-50 to-white dark:from-[#0f2833] dark:via-[#133240] dark:to-[#0d222b] border-b border-cyan-200/80 dark:border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-800 dark:text-cyan-200 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Wiirtuuwwan Qaxxaamuraa Laaboraatorii' : 'Rapid Laboratory & Diagnostic Action Pads'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-950 dark:text-cyan-100 border border-cyan-500/40 font-bold">
                  6 PADS ONLINE
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Laaboraatorii LIS, kuusaa dhiigaa, PACS raajii, meeshaalee kalibireeshinii, fi kosii' : 'Direct links to LIS Analyzers, Blood Bank, DICOM PACS, and Equipment Calibration'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="sky"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showActionPads}
            label={showActionPads ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Pads')}
            onClick={() => setShowActionPads((prev) => !prev)}
          />
        </div>

        {showActionPads && (
          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-smooth-in">
            <Link
              href="/laboratory"
              className="p-3.5 rounded-2xl border-2 border-cyan-300 dark:border-cyan-600/40 bg-cyan-50/60 dark:bg-cyan-950/20 hover:border-cyan-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Microscope className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Laaboraatorii (LIS)' : 'LIS Laboratory'}
              </span>
              <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-semibold mt-0.5">
                Sysmex Analyzers
              </span>
            </Link>

            <Link
              href="/blood-bank"
              className="p-3.5 rounded-2xl border-2 border-rose-300 dark:border-rose-600/40 bg-rose-50/60 dark:bg-rose-950/20 hover:border-rose-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Kuusaa Dhiigaa' : 'Blood Bank'}
              </span>
              <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold mt-0.5">
                SafeBlood Online
              </span>
            </Link>

            <Link
              href="/pacs"
              className="p-3.5 rounded-2xl border-2 border-sky-300 dark:border-sky-600/40 bg-sky-50/60 dark:bg-sky-950/20 hover:border-sky-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Scan className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'PACS Raajii' : 'DICOM PACS'}
              </span>
              <span className="text-[10px] text-sky-800 dark:text-sky-300 font-semibold mt-0.5">
                Radiology Viewer
              </span>
            </Link>

            <Link
              href="/assets"
              className="p-3.5 rounded-2xl border-2 border-teal-300 dark:border-teal-600/40 bg-teal-50/60 dark:bg-teal-950/20 hover:border-teal-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Meeshaalee Yaalaa' : 'Biomed Calibration'}
              </span>
              <span className="text-[10px] text-teal-800 dark:text-teal-300 font-semibold mt-0.5">
                Calibration Verified
              </span>
            </Link>

            <Link
              href="/waste"
              className="p-3.5 rounded-2xl border-2 border-amber-300 dark:border-amber-600/40 bg-amber-50/60 dark:bg-amber-950/20 hover:border-amber-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Kosiin Qorichaa' : 'Biohazard Waste'}
              </span>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold mt-0.5">
                Incinerator Ready
              </span>
            </Link>

            <Link
              href="/scanner"
              className="p-3.5 rounded-2xl border-2 border-indigo-300 dark:border-indigo-600/40 bg-indigo-50/60 dark:bg-indigo-950/20 hover:border-indigo-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Scan className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Barcode Tube' : 'Tube Scanner'}
              </span>
              <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-semibold mt-0.5">
                GS1 Barcode
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 7. QUICK SPECIMEN RESULT LOGGING & PANIC MODAL                    */}
      {/* ================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-smooth-in">
          <div className="w-full max-w-lg rounded-3xl border-2 border-cyan-400 bg-white dark:bg-[#0c1f26] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {lang === 'om' ? 'Galmee Firii Qorannoo LIS' : 'Log & Authorize LIS Result'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveModalResult} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Qorannoo Filadhu (Select Specimen)' : 'Select Specimen'}
                </label>
                <select
                  value={selectedSpecimen.specimenId}
                  onChange={(e) => {
                    const found = specimens.find((s) => s.specimenId === e.target.value);
                    if (found) {
                      setSelectedSpecimen(found);
                      setModalResultText(found.resultValue || '');
                      setIsCriticalFlag(found.priority === 'stat');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border-2 border-cyan-300 dark:border-cyan-600 bg-white dark:bg-[#122833] text-slate-900 dark:text-white text-xs font-bold"
                >
                  {specimens.map((s) => (
                    <option key={s.specimenId} value={s.specimenId}>
                      {s.specimenId} - {s.patientName} ({s.testName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-700/60 space-y-1 text-xs">
                <div className="font-black text-slate-900 dark:text-white">
                  Patient: {selectedSpecimen.patientName} ({selectedSpecimen.mrn})
                </div>
                <div className="font-bold text-cyan-900 dark:text-cyan-200">
                  Test: {selectedSpecimen.testName} • {selectedSpecimen.department}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Firii Qorannoo (Quantitative / Qualitative Result)' : 'Test Result Value & Units'}
                </label>
                <input
                  type="text"
                  value={modalResultText}
                  onChange={(e) => setModalResultText(e.target.value)}
                  placeholder="e.g. K+ 6.1 mEq/L (Critical High) or Hgb 12.4 g/dL"
                  className="w-full p-2.5 rounded-xl border-2 border-cyan-300 dark:border-cyan-600 text-xs font-bold font-mono bg-white dark:bg-[#122833] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700">
                <input
                  type="checkbox"
                  id="criticalFlag"
                  checked={isCriticalFlag}
                  onChange={(e) => setIsCriticalFlag(e.target.checked)}
                  className="h-4 w-4 text-rose-600 rounded border-gray-300"
                />
                <label htmlFor="criticalFlag" className="text-xs font-black text-rose-950 dark:text-rose-200 cursor-pointer">
                  {lang === 'om' ? 'Firii Hatattamaa (Flag as Critical Panic Value)' : 'Flag as Urgent Panic Value (Broadcasts immediate alert to doctor)'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {lang === 'om' ? 'Dhiisi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md cursor-pointer transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'om' ? 'Mirkaneessi & Ergi' : 'Authorize & Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
