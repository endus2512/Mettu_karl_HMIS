/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Doctor Clinical & OPD Workstation Dashboard (/portal/doctor).
 *
 * Dedicated operational view for Physicians, Surgeons, and Clinical Specialists.
 * Upgraded to match the Executive Command Standard:
 * - Unified Outer Rectangle with 4 Compact Animated 3D Mini Cubes
 * - Frosted Glassmorphism, Bold Typography, Vibrant Responsive Gradients
 * - GPU-Accelerated Levitation & Panel Sweep Animations
 * - Minimized-by-Default Clean Workstation with Kinetic MorphingArrowButtons
 * - Interactive Rapid Clinical Order, Prescription & Lab Dispatch Modal
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, type Language } from '@/lib/i18n';
import { useZenMode } from '@/lib/zenMode';
import { ClinicalGuidedStepper } from '@/components/clinical/ClinicalGuidedStepper';
import { MorphingArrowButton } from '@/components/admin/MorphingArrowButton';
import { useHospitalTimeSync } from '@/lib/timeSync';
import { notifications } from '@mantine/notifications';
import { playClinicalAudioAlert } from '@/lib/notifications';
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
  Sliders,
  Volume2,
  Edit3,
  Check,
  X,
  CreditCard,
  Plus,
  Building2,
  Eye,
  BedDouble,
  Ticket,
  FileText,
  Send,
  Droplets,
  Ambulance,
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
  pulse?: string;
  status: 'waiting' | 'in_consultation' | 'completed';
}

const INITIAL_OPD_PATIENTS: OpdPatient[] = [
  {
    token: 'A-012',
    mrn: 'MKH-2026-000101',
    name: 'Gudeta Hailu Tadesse',
    ageGender: '42 / Dhi (M)',
    triage: 'yellow',
    complaint: {
      en: 'High fever, severe rigors & joint pain for 3 days',
      om: "Ho'a cimaa, rom'uu fi dhukkubbii buusaa guyyaa 3f",
      am: 'ከፍተኛ ትኩሳት፣ ብርድ ብርድ ማለት እና የመገጣጠሚያ ህመም',
    },
    bp: '125/82',
    temp: '38.9°C',
    spo2: '97%',
    pulse: '92 bpm',
    status: 'in_consultation',
  },
  {
    token: 'A-015',
    mrn: 'MKH-2026-000102',
    name: 'Ayantu Mamo Kassa',
    ageGender: '31 / Dub (F)',
    triage: 'yellow',
    complaint: {
      en: 'Acute abdominal cramping & nausea',
      om: 'Dhukkubbii garaa cimaa fi diddiga',
      am: 'አጣዳፊ የሆድ ህመም እና ማቅለሽለሽ',
    },
    bp: '110/72',
    temp: '37.8°C',
    spo2: '98%',
    pulse: '78 bpm',
    status: 'waiting',
  },
  {
    token: 'A-019',
    mrn: 'MKH-2026-000103',
    name: 'Derartu Tulu Gemechu',
    ageGender: '28 / Dub (F)',
    triage: 'green',
    complaint: {
      en: 'Routine prenatal follow-up 28 weeks gestation',
      om: 'Hordoffii ulfaa yeroo (torbee 28ffaa)',
      am: 'መደበኛ የቅድመ ወሊድ ክትትል 28 ሳምንታት',
    },
    bp: '118/76',
    temp: '36.7°C',
    spo2: '99%',
    pulse: '74 bpm',
    status: 'waiting',
  },
  {
    token: 'A-024',
    mrn: 'MKH-2026-000104',
    name: 'Chala Tolera Lemma',
    ageGender: '55 / Dhi (M)',
    triage: 'red',
    complaint: {
      en: 'Chest tightness radiating to left shoulder, diaphoresis',
      om: "Cobsama qomaa gara ceekuu bitaatti babal'atu",
      am: 'የደረት መወጠር እና ወደ ግራ ትከሻ የሚሰራጭ ህመም',
    },
    bp: '155/98',
    temp: '37.1°C',
    spo2: '93%',
    pulse: '104 bpm',
    status: 'waiting',
  },
];

export function DoctorDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';
  const { isZenMode } = useZenMode();

  // Online synchronized shift and 12-hour clock
  const { serverTime, shift: onlineShift } = useHospitalTimeSync();

  // Workflow modes
  const [viewMode, setViewMode] = useState<'guided' | 'standard'>('standard');
  const [patients, setPatients] = useState<OpdPatient[]>(INITIAL_OPD_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<OpdPatient | null>(INITIAL_OPD_PATIENTS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [triageFilter, setTriageFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all');

  // Minimized-by-default module toggles
  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [showCaseReview, setShowCaseReview] = useState<boolean>(false);
  const [showQuickOrderPads, setShowQuickOrderPads] = useState<boolean>(false);
  const [showCdssSafety, setShowCdssSafety] = useState<boolean>(false);

  // Quick Clinical Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'rx' | 'lab' | 'admit'>('rx');
  const [rxDrugName, setRxDrugName] = useState('Amoxicillin 500mg');
  const [rxDosage, setRxDosage] = useState('1 cap TID x 7 days');
  const [labTestName, setLabTestName] = useState('Complete Blood Count (CBC)');
  const [admitWard, setAdmitWard] = useState('Internal Medicine Ward B');
  const [clinicalNote, setClinicalNote] = useState('');

  // Emergency status indicator
  const [emergencyCode] = useState<'nominal' | 'code_blue' | 'mci'>('nominal');

  const handleCompleteConsultation = (mrn: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.mrn === mrn ? { ...p, status: 'completed' as const } : p))
    );
    if (selectedPatient?.mrn === mrn) {
      setSelectedPatient((prev) => (prev ? { ...prev, status: 'completed' as const } : null));
    }
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Yaalli Xumurameera' : 'Consultation Completed',
      message: lang === 'om' ? `Yaalli dhukkubsataa (${mrn}) milkaa'inaan galmaa'eera.` : `Patient consultation (${mrn}) recorded successfully.`,
      color: 'teal',
    });
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Ajajni Qorichaa/Laabii Ergameera' : 'Clinical Order Dispatched',
      message:
        orderType === 'rx'
          ? `${rxDrugName} (${rxDosage}) sent directly to Central FEFO Pharmacy.`
          : orderType === 'lab'
          ? `${labTestName} transmitted to LIS Laboratory Bench.`
          : `Admission request queued for ${admitWard}.`,
      color: 'teal',
    });
    setIsOrderModalOpen(false);
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTriage = triageFilter === 'all' || p.triage === triageFilter;
    return matchesSearch && matchesTriage;
  });

  const waitingCount = patients.filter((p) => p.status === 'waiting').length;
  const inConsultCount = patients.filter((p) => p.status === 'in_consultation').length;
  const completedCount = patients.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-5">
      {/* ================================================================= */}
      {/* 1. COMPACT CLINICAL COCKPIT HEADER WITH QUICK CONTROLS            */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-br from-white via-teal-100/80 to-sky-100/75 dark:from-[#16233d] dark:via-[#1a2d48] dark:to-[#142036] border-[2.5px] border-teal-400/90 dark:border-teal-400/55 rounded-3xl p-4 sm:p-5 shadow-[0_14px_34px_-8px_rgba(20,184,166,0.28)] hover:shadow-[0_18px_40px_-8px_rgba(20,184,166,0.42)] hover:-translate-y-1 transition-all duration-300 group">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 dark:via-teal-200/15 to-transparent mkh-panel-sweep" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-sky-500 text-slate-950 flex items-center justify-center shadow-md shadow-teal-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shrink-0">
              <Stethoscope className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2.5 flex-wrap">
                <span>
                  {lang === 'om'
                    ? 'Wiirtuu Hojii Yaalaa & OPD Ogeeyyii Yaalaa (Doctor Command)'
                    : lang === 'am'
                    ? 'የሀኪሞች የተመላላሽ ክሊኒክና የህክምና ማዕከል (Doctor Workstation)'
                    : 'Physician Clinical & OPD Command Workstation'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-400/30 text-teal-950 dark:text-teal-100 border-2 border-teal-500/60 font-mono font-black">
                  DOCTOR ACTIVE
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {lang === 'om'
                  ? "Dabaree yaalaa har'aa, ajaja qorannoo laabii, barreessa resephii, fi hordoffii kutaa ciisichaa"
                  : 'Outpatient consultation queue, LIS laboratory reviews, CDSS safety alerts, and inpatient rounds'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Status Badges & Doctor Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Emergency Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-transform hover:scale-[1.04] ${
              emergencyCode === 'code_blue'
                ? 'bg-rose-100 dark:bg-rose-950/85 text-rose-900 dark:text-rose-100 border-rose-500 animate-pulse'
                : emergencyCode === 'mci'
                ? 'bg-amber-100 dark:bg-amber-950/85 text-amber-950 dark:text-amber-100 border-amber-500 animate-pulse'
                : 'bg-emerald-100/95 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border-emerald-500/75'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${emergencyCode === 'nominal' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>
              {emergencyCode === 'code_blue'
                ? 'CODE BLUE ACTIVE'
                : emergencyCode === 'mci'
                ? 'MCI START TRIAGE'
                : lang === 'om'
                ? 'NAGAADHA (Nominal)'
                : 'Clinical Nominal'}
            </span>
          </div>

          {/* Active Shift Pill (Online Centralized with 12-hour Clock) */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#142038] border-2 border-teal-400/80 dark:border-teal-400/50 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:border-teal-500 transition-colors">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>
              {onlineShift
                ? lang === 'om'
                  ? onlineShift.name_om
                  : lang === 'am'
                  ? onlineShift.name_am
                  : onlineShift.name_en
                : lang === 'om'
                ? 'Shiftii Ganamaa (08:00-16:00)'
                : 'Morning Clinical Shift'}
            </span>
            <span className="text-xs text-teal-800 dark:text-teal-200 font-mono font-black pl-1.5 border-l-2 border-teal-300 dark:border-slate-600">
              {serverTime}
            </span>
          </div>

          {/* PRIMARY DOCTOR ACTION BUTTON (MORPHING ARROW) */}
          <MorphingArrowButton
            variant="teal"
            size="md"
            icon={<Sliders className="w-4 h-4 text-slate-950" />}
            label={lang === 'om' ? "Ajaji & Yaali (Quick Orders)" : "Quick Clinical Orders"}
            onClick={() => setIsOrderModalOpen(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. CLINICAL ALERTS & CDSS INTERACTION BANNER                      */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-100 via-amber-100/90 to-rose-100/95 dark:from-rose-950/45 dark:via-amber-950/35 dark:to-rose-950/45 border-[2.5px] border-rose-400/90 dark:border-rose-400/60 text-xs sm:text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 dark:via-rose-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.2s' }} />
        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-300 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="font-black text-rose-950 dark:text-rose-100 mr-2">
              {lang === 'om' ? "Akeekkachiisa Yaalaa Hatattamaa (CDSS):" : "Urgent CDSS & Panic Lab Alert:"}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              Panic K+ 6.1 mEq/L (Gudeta Hailu) • Ciprofloxacin + Warfarin Interaction Flagged
            </span>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <MorphingArrowButton
            variant="rose"
            size="xs"
            label={lang === 'om' ? 'Ilaali' : 'Review Panic Lab'}
            onClick={() => setShowCdssSafety(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. ONE UNIFIED RECTANGLE HOLDING 4 COMPACT ANIMATED 3D MINI CUBES */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-[2.5px] border-teal-400/90 dark:border-teal-400/60 bg-gradient-to-br from-teal-100/85 via-white/95 to-sky-100/85 dark:from-[#132838]/95 dark:via-[#163345]/95 dark:to-[#142738]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_14px_34px_-8px_rgba(20,184,166,0.3)] hover:shadow-[0_18px_42px_-8px_rgba(20,184,166,0.45)] hover:-translate-y-0.5 transition-all duration-300 animate-smooth-in">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '0.6s' }} />
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto">
          {/* Mini Cube 1: Patients Today */}
          <div
            onClick={() => setShowQueue((prev) => !prev)}
            style={{ animationDelay: '0s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-teal-400/85 dark:border-teal-400/55 bg-gradient-to-br from-white via-teal-50 to-teal-100/95 dark:from-[#123442] dark:via-[#163e50] dark:to-[#18354e] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(20,184,166,0.28),3px_3px_0_0_rgba(45,212,191,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-teal-500 hover:shadow-[0_14px_24px_-4px_rgba(20,184,166,0.42),5px_5px_0_0_rgba(45,212,191,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/20 to-transparent mkh-cube-sweep" />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-teal-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                1. {lang === 'om' ? 'Dhukkubsattoota' : 'Patients Today'}
              </span>
              <span className="h-6 w-6 rounded-lg bg-teal-500/20 dark:bg-teal-400/25 border border-teal-400/60 text-teal-800 dark:text-teal-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-3 h-3" />
              </span>
            </div>

            <div className="relative z-10 space-y-1 my-auto">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  {patients.length}
                </span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                  {completedCount} Done
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/90 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
                  style={{ width: `${Math.round((completedCount / (patients.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {waitingCount} {lang === 'om' ? 'Dabaree Eeggachaa' : 'Waiting in Queue'}
            </p>
          </div>

          {/* Mini Cube 2: Panic Lab Reviews */}
          <div
            onClick={() => setShowCdssSafety((prev) => !prev)}
            style={{ animationDelay: '0.45s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-rose-400/85 dark:border-rose-400/55 bg-gradient-to-br from-white via-rose-50 to-rose-100/95 dark:from-[#361824] dark:via-[#421d2d] dark:to-[#381622] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(244,63,94,0.28),3px_3px_0_0_rgba(251,113,133,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-rose-500 hover:shadow-[0_14px_24px_-4px_rgba(244,63,94,0.42),5px_5px_0_0_rgba(251,113,133,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-rose-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '1.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-rose-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                2. {lang === 'om' ? 'Laabii Hatattamaa' : 'Panic Labs'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-rose-500/20 dark:bg-rose-400/25 border border-rose-400/60 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300">
                <FlaskConical className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-rose-900 dark:text-rose-200">
                3
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border border-rose-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-300 animate-ping" />
                PANIC ALERTS
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              K+ 6.1 • Trop (+)
            </p>
          </div>

          {/* Mini Cube 3: Scheduled Surgery (OT) */}
          <Link
            href="/ot"
            style={{ animationDelay: '0.9s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-amber-400/85 dark:border-amber-400/55 bg-gradient-to-br from-white via-amber-50 to-orange-100/95 dark:from-[#362714] dark:via-[#423118] dark:to-[#362615] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(245,158,11,0.28),3px_3px_0_0_rgba(251,191,36,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-amber-500 hover:shadow-[0_14px_24px_-4px_rgba(245,158,11,0.42),5px_5px_0_0_rgba(251,191,36,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-amber-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '2.2s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-amber-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                3. {lang === 'om' ? 'Baqaqsaa (OT)' : 'Surgeries (OT)'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-amber-500/20 dark:bg-amber-400/25 border border-amber-400/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Syringe className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-amber-900 dark:text-amber-200">
                1
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border border-amber-400/60">
                11:30 AM
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Appendectomy • OT-1
            </p>
          </Link>

          {/* Mini Cube 4: Inpatient Rounds (IPD) */}
          <Link
            href="/wards"
            style={{ animationDelay: '1.35s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-emerald-400/85 dark:border-emerald-400/55 bg-gradient-to-br from-white via-emerald-50 to-teal-100/95 dark:from-[#123628] dark:via-[#164232] dark:to-[#13362a] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(16,185,129,0.28),3px_3px_0_0_rgba(52,211,153,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-emerald-500 hover:shadow-[0_14px_24px_-4px_rgba(16,185,129,0.42),5px_5px_0_0_rgba(52,211,153,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-emerald-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '3.3s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-emerald-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                4. {lang === 'om' ? 'Marsaa Ciisichaa' : 'Ward Rounds'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-emerald-500/20 dark:bg-emerald-400/25 border border-emerald-400/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Bed className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-emerald-900 dark:text-emerald-200">
                8
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-300 animate-pulse" />
                2 Discharge
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Ward B • All Stable
            </p>
          </Link>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. WORKFLOW MODE SWITCHER (GUIDED STEPPER vs STANDARD QUEUE)      */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-white via-teal-50/70 to-sky-50/70 dark:from-[#15223a] dark:via-[#192742] dark:to-[#152033] border-[2.5px] border-teal-300/80 dark:border-teal-400/40 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('guided')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              viewMode === 'guided'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-md font-black border border-teal-400'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-white/70 dark:bg-slate-800/60 border border-slate-300/70 dark:border-slate-700'
            }`}
          >
            <Route className="w-4 h-4" />
            <span>{lang === 'om' ? '🚶 Qajeelcha Yaalaa (Guided Stepper)' : '🚶 Guided Stepper Mode'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('standard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              viewMode === 'standard'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-md font-black border border-teal-400'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-white/70 dark:bg-slate-800/60 border border-slate-300/70 dark:border-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{lang === 'om' ? '📋 Tartiiba Baramaa (Standard Workstation)' : '📋 Standard Workstation'}</span>
          </button>
        </div>

        <span className="text-xs text-slate-700 dark:text-slate-200 font-bold">
          {viewMode === 'guided'
            ? lang === 'om'
              ? '⚡ Adeemsa salphaa sadarkaa 4n xumuru'
              : '⚡ Zero-confusion 4-step consultation flow'
            : lang === 'om'
            ? '📊 Wiirtuu guutuu dabaree, vitals fi ajaja hatattamaa'
            : '📊 Full consultation worklist, live triage & rapid order pads'}
        </span>
      </div>

      {/* Guided Stepper View */}
      {viewMode === 'guided' && (
        <div className="animate-smooth-in">
          <ClinicalGuidedStepper onComplete={handleCompleteConsultation} />
        </div>
      )}

      {/* Standard Workstation View */}
      {viewMode === 'standard' && (
        <div className="space-y-4 animate-smooth-in">
          {/* =============================================================== */}
          {/* 5A. OPD CONSULTATION QUEUE (MINIMIZED BY DEFAULT)               */}
          {/* =============================================================== */}
          <div className={`relative overflow-hidden bg-gradient-to-br from-white via-sky-50/70 to-indigo-50/70 dark:from-[#16233d] dark:via-[#192742] dark:to-[#162033] border-[2.5px] border-sky-400/90 dark:border-sky-400/55 rounded-2xl shadow-[0_12px_28px_-8px_rgba(14,165,233,0.26)] hover:shadow-[0_16px_34px_-8px_rgba(14,165,233,0.4)] hover:-translate-y-1 transition-all duration-300 group ${showQueue ? 'p-4 sm:p-5 space-y-4' : 'p-4 sm:p-5'}`}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/35 dark:via-sky-200/15 to-transparent mkh-panel-sweep" />
            <div className={`relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${showQueue ? 'pb-3 border-b-2 border-sky-200 dark:border-slate-700' : ''}`}>
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/25 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Activity className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      {lang === 'om' ? "Dabaree Yaala OPD Har'aa (Lobby Worklist)" : "Today's OPD Consultation Queue & Triage"}
                    </h2>
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/25 text-sky-950 dark:text-sky-100 border-2 border-sky-500/60 dark:border-sky-400/50">
                      {waitingCount} Waiting • {inConsultCount} Active
                    </span>
                  </div>
                  {!showQueue && (
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      Gudeta Hailu (A-012) • Ayantu Mamo (A-015) • Derartu Tulu (A-019) • Chala Tolera (A-024)
                    </p>
                  )}
                </div>
              </div>

              <MorphingArrowButton
                variant="sky"
                size="sm"
                isExpanded={showQueue}
                label={showQueue ? (lang === 'om' ? 'Xiqeessi (Minimize)' : 'Minimize') : (lang === 'om' ? 'Bani (Expand)' : 'Expand')}
                onClick={() => setShowQueue((prev) => !prev)}
                className="shrink-0 self-start sm:self-auto"
              />
            </div>

            {showQueue && (
              <div className="relative z-10 space-y-3">
                {/* Search & Triage Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={lang === 'om' ? "Maqaa, Token ykn MRN barbaadi..." : "Search patient name, Token, or MRN..."}
                      className="w-full h-10 rounded-xl border border-sky-300 dark:border-slate-600 bg-white dark:bg-[#121c2e] pl-9 pr-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#0c1422] border border-slate-300 dark:border-slate-700 p-0.5 text-xs font-black">
                    {(['all', 'red', 'yellow', 'green'] as const).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTriageFilter(tag)}
                        className={`px-3 py-1.5 rounded-lg uppercase transition-colors cursor-pointer ${
                          triageFilter === tag
                            ? tag === 'red'
                              ? 'bg-rose-600 text-white font-black'
                              : tag === 'yellow'
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : tag === 'green'
                              ? 'bg-emerald-600 text-white font-black'
                              : 'bg-sky-500 text-slate-950 font-black'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-sky-200/80 dark:border-slate-700/70">
                  <table className="w-full text-left text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                    <thead className="border-b-2 border-sky-200 dark:border-slate-700 bg-slate-100/95 dark:bg-[#101829] text-[11px] sm:text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono font-black">
                      <tr>
                        <th className="py-3 px-3">Token / MRN</th>
                        <th className="py-3 px-3">{lang === 'om' ? 'Dhukkubsataa' : 'Patient Name'}</th>
                        <th className="py-3 px-3">Triage</th>
                        <th className="py-3 px-3">Vitals (BP/Temp/SpO2)</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white/85 dark:bg-[#0e1524]">
                      {filteredPatients.map((pat) => (
                        <tr
                          key={pat.token}
                          onClick={() => {
                            setSelectedPatient(pat);
                            setShowCaseReview(true);
                          }}
                          className={`hover:bg-sky-50/90 dark:hover:bg-[#162137] transition-colors cursor-pointer ${
                            selectedPatient?.token === pat.token ? 'bg-teal-50 dark:bg-[#13273c] border-l-4 border-teal-500' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono">
                            <span className="font-black text-amber-700 dark:text-amber-300 block">{pat.token}</span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">{pat.mrn}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-black text-slate-900 dark:text-white block">{pat.name}</span>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{pat.ageGender}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                                pat.triage === 'red'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-100 border-rose-500 animate-pulse'
                                  : pat.triage === 'yellow'
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 border-amber-500'
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 border-emerald-500'
                              }`}
                            >
                              {pat.triage}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">
                            <span className="font-black text-slate-900 dark:text-white">BP: {pat.bp}</span>
                            <span className="text-slate-600 dark:text-slate-400 block">T: {pat.temp} • {pat.spo2}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase border ${
                                pat.status === 'completed'
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                  : pat.status === 'in_consultation'
                                  ? 'bg-teal-100 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border-teal-400'
                                  : 'bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border-amber-400'
                              }`}
                            >
                              {pat.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <MorphingArrowButton
                              variant="teal"
                              size="xs"
                              icon={<ArrowRight className="w-3 h-3" />}
                              label={lang === 'om' ? 'Ilaali' : 'Select'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(pat);
                                setShowCaseReview(true);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* 5B. SELECTED PATIENT CASE REVIEW & QUICK ACTIONS                */}
          {/* =============================================================== */}
          <div className={`relative overflow-hidden bg-gradient-to-br from-white via-amber-50/70 to-teal-50/70 dark:from-[#16233d] dark:via-[#1f2b46] dark:to-[#162238] border-[2.5px] border-amber-400/90 dark:border-amber-400/55 rounded-2xl shadow-[0_12px_28px_-8px_rgba(245,158,11,0.25)] hover:shadow-[0_16px_34px_-8px_rgba(245,158,11,0.4)] hover:-translate-y-1 transition-all duration-300 group ${showCaseReview ? 'p-4 sm:p-5 space-y-4' : 'p-4 sm:p-5'}`}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/35 dark:via-amber-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.4s' }} />
            <div className={`relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${showCaseReview ? 'pb-3 border-b-2 border-amber-200 dark:border-slate-700' : ''}`}>
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Heart className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      {lang === 'om' ? 'Qorannoo Dhukkubsataa Filatamee (Active Case)' : 'Selected Patient Case & Rapid Consultation Pad'}
                    </h2>
                    {selectedPatient && (
                      <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border-2 border-amber-500/60">
                        {selectedPatient.name} ({selectedPatient.token})
                      </span>
                    )}
                  </div>
                  {!showCaseReview && selectedPatient && (
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      BP: {selectedPatient.bp} • Temp: {selectedPatient.temp} • SpO2: {selectedPatient.spo2} • {selectedPatient.complaint[lang]}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <MorphingArrowButton
                  variant="amber"
                  size="sm"
                  icon={<Sliders className="w-4 h-4 text-slate-950" />}
                  label={lang === 'om' ? 'Ajaji (Order)' : 'Write Order'}
                  onClick={() => setIsOrderModalOpen(true)}
                />
                <MorphingArrowButton
                  variant="amber-soft"
                  size="sm"
                  isExpanded={showCaseReview}
                  label={showCaseReview ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand')}
                  onClick={() => setShowCaseReview((prev) => !prev)}
                />
              </div>
            </div>

            {showCaseReview && selectedPatient && (
              <div className="relative z-10 space-y-4">
                {/* Patient Summary & Vitals Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/95 dark:bg-[#121c2e] border-2 border-teal-300 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 block">Blood Pressure</span>
                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">{selectedPatient.bp}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/95 dark:bg-[#121c2e] border-2 border-amber-300 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 block">Temperature</span>
                    <span className="text-base font-black text-amber-700 dark:text-amber-300 font-mono">{selectedPatient.temp}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/95 dark:bg-[#121c2e] border-2 border-sky-300 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 block">Oxygen (SpO2)</span>
                    <span className="text-base font-black text-sky-700 dark:text-sky-300 font-mono">{selectedPatient.spo2}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/95 dark:bg-[#121c2e] border-2 border-emerald-300 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400 block">Pulse Rate</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">{selectedPatient.pulse || '80 bpm'}</span>
                  </div>
                </div>

                {/* Complaint and Clinical Impression */}
                <div className="p-4 rounded-xl bg-white/95 dark:bg-[#121c2e] border-2 border-amber-300/80 dark:border-slate-700 space-y-1.5 shadow-xs">
                  <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-200 block">
                    {lang === 'om' ? 'Komiin Dhukkubsataa (Chief Complaint):' : 'Chief Presenting Complaint:'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                    {selectedPatient.complaint[lang]}
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <MorphingArrowButton
                      variant="teal"
                      size="sm"
                      icon={<Pill className="w-4 h-4" />}
                      label={lang === 'om' ? 'Resephii Barreessi' : 'Prescribe Drugs'}
                      onClick={() => {
                        setOrderType('rx');
                        setIsOrderModalOpen(true);
                      }}
                    />
                    <MorphingArrowButton
                      variant="sky"
                      size="sm"
                      icon={<FlaskConical className="w-4 h-4" />}
                      label={lang === 'om' ? 'Ajaji Laabii' : 'Order Lab Test'}
                      onClick={() => {
                        setOrderType('lab');
                        setIsOrderModalOpen(true);
                      }}
                    />
                    <MorphingArrowButton
                      variant="indigo"
                      size="sm"
                      icon={<Bed className="w-4 h-4" />}
                      label={lang === 'om' ? 'Ciisicha Ajaji' : 'Admit to Ward'}
                      onClick={() => {
                        setOrderType('admit');
                        setIsOrderModalOpen(true);
                      }}
                    />
                  </div>

                  <MorphingArrowButton
                    variant="emerald"
                    size="sm"
                    disabled={selectedPatient.status === 'completed'}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label={
                      selectedPatient.status === 'completed'
                        ? lang === 'om'
                          ? '✓ Yaalli Xumurameera'
                          : '✓ Consultation Done'
                        : lang === 'om'
                        ? 'Yaala Xumuri (Finish)'
                        : 'Finish Consultation'
                    }
                    onClick={() => handleCompleteConsultation(selectedPatient.mrn)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* 5C. RAPID CLINICAL ACTION PADS (MINIMIZED BY DEFAULT)           */}
          {/* =============================================================== */}
          <div className={`relative overflow-hidden bg-gradient-to-br from-white via-teal-50/70 to-cyan-50/70 dark:from-[#16233d] dark:via-[#192b45] dark:to-[#162136] border-[2.5px] border-teal-400/90 dark:border-teal-400/55 rounded-2xl shadow-[0_12px_28px_-8px_rgba(20,184,166,0.26)] hover:shadow-[0_16px_34px_-8px_rgba(20,184,166,0.4)] hover:-translate-y-1 transition-all duration-300 group ${showQuickOrderPads ? 'p-4 sm:p-5 space-y-3.5' : 'p-4 sm:p-5'}`}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/35 dark:via-teal-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.8s' }} />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/25 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Eye className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      {lang === 'om' ? 'Kutaalee Ajaja Hatattamaa (Clinical Order Pads)' : 'Rapid Departmental Jump Pads & Orders'}
                    </h2>
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border-2 border-teal-500/60 dark:border-teal-400/50">
                      7 Pads Online
                    </span>
                  </div>
                  {!showQuickOrderPads && (
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      Pharmacy FEFO • Laboratory LIS • Inpatient Wards • Operating Theatre • PACS DICOM • Telemedicine • EMS
                    </p>
                  )}
                </div>
              </div>

              <MorphingArrowButton
                variant="teal"
                size="sm"
                isExpanded={showQuickOrderPads}
                label={showQuickOrderPads ? (lang === 'om' ? 'Xiqeessi (Minimize)' : 'Minimize') : (lang === 'om' ? 'Bani (Expand)' : 'Expand')}
                onClick={() => setShowQuickOrderPads((prev) => !prev)}
                className="shrink-0 self-start sm:self-auto"
              />
            </div>

            {showQuickOrderPads && (
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3 border-t-2 border-teal-300/70 dark:border-slate-700">
                {[
                  { href: '/pharmacy', icon: Pill, title: 'Pharmacy', sub: 'FEFO Dispensary', color: 'border-amber-400/80 dark:border-amber-500/50 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/20', iconColor: 'text-amber-700 dark:text-amber-300' },
                  { href: '/laboratory', icon: FlaskConical, title: 'Laboratory', sub: 'LIS & Panels', color: 'border-cyan-400/80 dark:border-cyan-500/50 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/20', iconColor: 'text-cyan-700 dark:text-cyan-300' },
                  { href: '/wards', icon: BedDouble, title: 'Wards', sub: 'IPD Bed Census', color: 'border-emerald-400/80 dark:border-emerald-500/50 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/20', iconColor: 'text-emerald-700 dark:text-emerald-300' },
                  { href: '/ot', icon: Syringe, title: 'Theatre (OT)', sub: 'Surgical Booking', color: 'border-indigo-400/80 dark:border-indigo-500/50 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20', iconColor: 'text-indigo-700 dark:text-indigo-300' },
                  { href: '/pacs', icon: Scan, title: 'PACS & X-Ray', sub: 'DICOM Viewer', color: 'border-blue-400/80 dark:border-blue-500/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20', iconColor: 'text-blue-700 dark:text-blue-300' },
                  { href: '/telemed', icon: Stethoscope, title: 'Telemedicine', sub: 'Virtual Consult', color: 'border-purple-400/80 dark:border-purple-500/50 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/20', iconColor: 'text-purple-700 dark:text-purple-300' },
                  { href: '/ems', icon: Ambulance, title: 'EMS Dispatch', sub: 'Ambulance 907', color: 'border-rose-400/80 dark:border-rose-500/50 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20', iconColor: 'text-rose-700 dark:text-rose-300' },
                ].map((pad) => {
                  const Icon = pad.icon;
                  return (
                    <Link
                      key={pad.href}
                      href={pad.href}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl bg-white/95 dark:bg-[#131d31] border-2 ${pad.color} transition-all duration-300 text-center group hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-lg`}
                    >
                      <Icon className={`w-5 h-5 ${pad.iconColor} group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300 mb-1.5`} />
                      <span className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">{pad.title}</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{pad.sub}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* 5D. CDSS SAFETY PROTOCOLS (MINIMIZED BY DEFAULT)                */}
          {/* =============================================================== */}
          <div className={`relative overflow-hidden bg-gradient-to-br from-white via-rose-50/70 to-amber-50/70 dark:from-[#16233d] dark:via-[#22213d] dark:to-[#171f33] border-[2.5px] border-rose-400/90 dark:border-rose-400/55 rounded-2xl shadow-[0_12px_28px_-8px_rgba(244,63,94,0.25)] hover:shadow-[0_16px_34px_-8px_rgba(244,63,94,0.4)] hover:-translate-y-1 transition-all duration-300 group ${showCdssSafety ? 'p-4 sm:p-5 space-y-4' : 'p-4 sm:p-5'}`}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/35 dark:via-rose-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '2.4s' }} />
            <div className={`relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${showCdssSafety ? 'pb-3 border-b-2 border-rose-200 dark:border-slate-700' : ''}`}>
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/25 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                  <ShieldAlert className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      {lang === 'om' ? 'Qajeelfama Eegumsa Yaalaa & Qorichaa (CDSS Safety)' : 'Clinical Decision Support (CDSS) & Pharmacovigilance'}
                    </h2>
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border-2 border-rose-500/60">
                      2 Safety Flags Active
                    </span>
                  </div>
                  {!showCdssSafety && (
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      Serum Potassium (K+ 6.1 mEq/L Panic Alert) • Ciprofloxacin + Warfarin Bleeding Risk
                    </p>
                  )}
                </div>
              </div>

              <MorphingArrowButton
                variant="rose"
                size="sm"
                isExpanded={showCdssSafety}
                label={showCdssSafety ? (lang === 'om' ? 'Xiqeessi (Minimize)' : 'Minimize') : (lang === 'om' ? 'Bani (Expand)' : 'Expand')}
                onClick={() => setShowCdssSafety((prev) => !prev)}
                className="shrink-0 self-start sm:self-auto"
              />
            </div>

            {showCdssSafety && (
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-white/95 dark:bg-[#121a2a] border-2 border-rose-400/80 dark:border-rose-500/50 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
                    <span>Panic LIS Result: Gudeta Hailu (A-012)</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                    Serum Potassium (<strong className="text-rose-700 dark:text-rose-300 font-mono text-sm">K+ 6.1 mEq/L</strong>) exceeds panic threshold. Urgent 12-lead ECG and Calcium Gluconate 10% IV protocol initiated.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/95 dark:bg-[#121a2a] border-2 border-amber-400/80 dark:border-amber-500/50 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>Drug Interaction: Ciprofloxacin + Warfarin</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                    Concurrent administration inhibits CYP1A2, significantly elevating Warfarin exposure and bleeding risk. PT/INR monitoring or alternative antibiotic (e.g., Ceftriaxone) advised.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. INTERACTIVE DOCTOR QUICK ORDER & PRESCRIPTION MODAL            */}
      {/* ================================================================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border-2 border-teal-300 dark:border-slate-700 bg-white/95 dark:bg-[#101829] p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-400/60">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {lang === 'om' ? 'Wiirtuu Ajaja Yaalaa & Qorannoo (Order Pad)' : 'Doctor Rapid Order & Prescription Pad'}
                  </h3>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {selectedPatient ? `Active Patient: ${selectedPatient.name} (${selectedPatient.token})` : 'Hospital-wide Clinical Order Desk'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Order Category Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('rx')}
                className={`py-2 px-3 rounded-xl border-2 text-center font-black transition-all cursor-pointer ${
                  orderType === 'rx'
                    ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-[#151f33] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                💊 Prescribe (Qoricha)
              </button>
              <button
                type="button"
                onClick={() => setOrderType('lab')}
                className={`py-2 px-3 rounded-xl border-2 text-center font-black transition-all cursor-pointer ${
                  orderType === 'lab'
                    ? 'bg-cyan-100 dark:bg-cyan-500/25 text-cyan-950 dark:text-cyan-200 border-cyan-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-[#151f33] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                🔬 Lab Test (Laabii)
              </button>
              <button
                type="button"
                onClick={() => setOrderType('admit')}
                className={`py-2 px-3 rounded-xl border-2 text-center font-black transition-all cursor-pointer ${
                  orderType === 'admit'
                    ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 border-emerald-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-[#151f33] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                🛏️ Admit (Ciisicha)
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4 text-xs sm:text-sm">
              {orderType === 'rx' && (
                <>
                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 dark:text-slate-100">
                      {lang === 'om' ? 'Maqaa Qorichaa (Medication Name):' : 'Medication Name & Strength:'}
                    </label>
                    <input
                      type="text"
                      value={rxDrugName}
                      onChange={(e) => setRxDrugName(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0c121e] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-black text-slate-800 dark:text-slate-100">
                      {lang === 'om' ? 'Doozii & Yeroo Fudhatamaa (Dosage & Frequency):' : 'Dosage, Route & Frequency:'}
                    </label>
                    <input
                      type="text"
                      value={rxDosage}
                      onChange={(e) => setRxDosage(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0c121e] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {orderType === 'lab' && (
                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 dark:text-slate-100">
                    {lang === 'om' ? 'Qorannoo Laabii Filadhu (Lab Panel):' : 'Select Laboratory Panel:'}
                  </label>
                  <select
                    value={labTestName}
                    onChange={(e) => setLabTestName(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0c121e] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC / Hemogram)</option>
                    <option value="Serum Electrolytes (Na+, K+, Cl-)">Serum Electrolytes (Na+, K+, Cl-)</option>
                    <option value="Blood Film for Malaria (BF)">Blood Film for Malaria (BF / RDT)</option>
                    <option value="Renal Function Tests (BUN, Creatinine)">Renal Function Tests (BUN, Creatinine)</option>
                    <option value="Liver Enzymes (ALT, AST, ALP)">Liver Function Tests (LFT / Enzymes)</option>
                    <option value="Random Blood Sugar (RBS)">Random Blood Sugar (RBS / Glucometry)</option>
                    <option value="Urinalysis Microscopy">Urinalysis Dipstick & Microscopy</option>
                  </select>
                </div>
              )}

              {orderType === 'admit' && (
                <div className="space-y-1.5">
                  <label className="font-black text-slate-800 dark:text-slate-100">
                    {lang === 'om' ? 'Kutaa Ciisichaa Filadhu (Target Ward):' : 'Target Inpatient Ward:'}
                  </label>
                  <select
                    value={admitWard}
                    onChange={(e) => setAdmitWard(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0c121e] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Internal Medicine Ward B">Internal Medicine Ward B (Medical)</option>
                    <option value="Surgical Ward A">Surgical Ward A (Post-Op)</option>
                    <option value="Pediatrics Ward">Pediatrics Ward (Children)</option>
                    <option value="Maternity & Labor Ward">Maternity & Labor Ward (Obstetrics)</option>
                    <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU / Critical Care)</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-black text-slate-800 dark:text-slate-100">
                  {lang === 'om' ? 'Yaada Yaalaa Dabalataa (Clinical Note):' : 'Clinical Handover / Special Instructions:'}
                </label>
                <textarea
                  rows={3}
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                  placeholder="Enter specific instructions for nurses, pharmacists, or lab technicians..."
                  className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0c121e] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold cursor-pointer transition-colors"
                >
                  {lang === 'om' ? 'Dhiisi (Cancel)' : 'Cancel'}
                </button>
                <MorphingArrowButton
                  type="submit"
                  variant="teal"
                  size="sm"
                  icon={<Send className="w-4 h-4" />}
                  label={lang === 'om' ? 'Ajaja Ergi (Dispatch)' : 'Dispatch Order'}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
