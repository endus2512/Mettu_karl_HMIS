/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Nurse Station & Inpatient Ward Care Dashboard (/portal/nurse).
 *
 * Dedicated operational view for Inpatient, Triage, and Critical Care Nurses.
 * Overhauled to match the Executive Command Standard:
 * - Unified Outer Rectangle with 4 Compact Animated 3D Mini Cubes
 * - Frosted Glassmorphism, Bold Typography, Vibrant Responsive Gradients
 * - High-Contrast Universal Theme (Flawless Light & Dark Mode)
 * - Minimized-by-Default Clean Workstation with Kinetic MorphingArrowButtons
 * - Interactive Rapid Bedside Vitals & Medication (MAR) Administration Modal
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
  Search,
  Plus,
  X,
  Volume2,
  FileText,
  Building2,
  Radio,
  Layers,
  Heart,
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
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const {
    serverTime,
    ethiopian,
    shift,
    overrideShift,
  } = useHospitalTimeSync();

  const [beds, setBeds] = useState<BedVital[]>(INITIAL_BEDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'stable' | 'warning' | 'critical'>('all');

  // Minimized-by-default module toggles
  const [showBedCensus, setShowBedCensus] = useState<boolean>(false);
  const [showShiftHandover, setShowShiftHandover] = useState<boolean>(false);
  const [showActionPads, setShowActionPads] = useState<boolean>(false);

  // Quick Vitals & MAR Administration Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBedNo, setSelectedBedNo] = useState('Bed-05');
  const [modalBp, setModalBp] = useState('168/102');
  const [modalTemp, setModalTemp] = useState('38.4°C');
  const [modalHr, setModalHr] = useState('108 bpm');
  const [modalSpo2, setModalSpo2] = useState('95%');
  const [modalMedGiven, setModalMedGiven] = useState('IV Hydralazine 10mg');

  // Handover note editing
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
      notifications.show({
        title: lang === 'om' ? 'Qabxiin Dabarsaa Ol-kaayameera' : 'Handover Notes Saved',
        message: lang === 'om' ? 'Qabxiin dabarsaa shiftii narsummaa milkaa\'inaan galmaa\'eera.' : 'Nurse shift handover notes saved successfully.',
        color: 'teal',
      });
    } catch {
      // handled
    }
  };

  const handleSaveVitalsModal = (e: React.FormEvent) => {
    e.preventDefault();
    setBeds((prev) =>
      prev.map((b) =>
        b.bedNo === selectedBedNo
          ? {
              ...b,
              bp: modalBp,
              temp: modalTemp,
              hr: modalHr,
              spo2: modalSpo2,
              condition: `${b.condition} • Vitals Refreshed`,
            }
          : b
      )
    );
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Mallattooleen Lubbuu Galmaa\'aniiru' : 'Bedside Vitals & MAR Logged',
      message: `${selectedBedNo}: BP ${modalBp}, SpO2 ${modalSpo2}, HR ${modalHr}. MAR: ${modalMedGiven} administered.`,
      color: 'teal',
    });
    setIsModalOpen(false);
  };

  const handleAdministerMarDirect = (bedNo: string, med: string) => {
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Qorichi Kennameera (MAR)' : 'MAR Dose Administered',
      message: `${bedNo}: ${med} recorded as given at ${serverTime || '10:00 AM'}.`,
      color: 'teal',
    });
  };

  const filteredBeds = beds.filter((b) => {
    const matchesSearch =
      b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bedNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const criticalCount = beds.filter((b) => b.status === 'critical').length;
  const warningCount = beds.filter((b) => b.status === 'warning').length;

  const handoverHours = Math.floor(shift.handover_countdown_minutes / 60);
  const handoverMins = shift.handover_countdown_minutes % 60;
  const handoverTimeStr = `${handoverHours}h ${handoverMins}m`;

  return (
    <div className="space-y-4 sm:space-y-5 animate-smooth-in">
      {/* ================================================================= */}
      {/* 1. NURSING COCKPIT HEADER                                         */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-100/90 via-white/95 to-teal-100/90 dark:from-[#0d2222]/95 dark:via-[#112d2d]/95 dark:to-[#0c1f1f]/95 border-[2.5px] border-emerald-400/90 dark:border-emerald-400/60 shadow-[0_12px_32px_-8px_rgba(16,185,129,0.28)] hover:shadow-[0_16px_40px_-8px_rgba(16,185,129,0.4)] transition-all duration-300">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/50 dark:via-emerald-200/15 to-transparent mkh-panel-sweep" />

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 border-2 border-white/60 shrink-0 transform hover:scale-105 hover:rotate-3 transition-transform">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Tajaajila Narsummaa fi Kutaa Ciisichaa'
                  : lang === 'am'
                  ? 'የነርስ ጣቢያና የተኝቶ ታካሚዎች ክትትል ክፍል (Nurse Station)'
                  : 'Nurse Station & Inpatient Care Cockpit'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-500/60 font-mono font-black">
                NURSE ACTIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {lang === 'om'
                ? "To'annoo vitals, MAR kenniinsa qorichaa, hordoffii siree, fi dabarsaa shiftii"
                : 'Bedside vital signs telemetry, MAR medication administration, and ward census'}
            </p>
          </div>
        </div>

        {/* Quick Status Badges & Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Emergency Code Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 bg-emerald-100/95 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border-emerald-500/75 transition-transform hover:scale-[1.04]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'om' ? 'NAGAADHA (Nominal)' : 'Ward Nominal'}</span>
          </div>

          {/* Active Shift Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#142626] border-2 border-emerald-400/80 dark:border-emerald-400/50 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:border-emerald-500 transition-colors">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>
              {shift ? (lang === 'om' ? shift.name_om : lang === 'am' ? shift.name_am : shift.name_en) : 'Day Shift'}
            </span>
            <span className="text-emerald-700 dark:text-emerald-300 font-mono text-xs">
              ({serverTime || '10:00 AM'})
            </span>
          </div>

          {/* Primary Action Button: Log Vitals / MAR */}
          <MorphingArrowButton
            variant="emerald"
            size="sm"
            label={lang === 'om' ? 'Galmee Vitals & Care' : 'Quick Vitals & MAR'}
            icon={<Activity className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. URGENT BED VITALS WARNING BANNER                               */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-100 via-amber-100/90 to-rose-100/95 dark:from-rose-950/45 dark:via-amber-950/35 dark:to-rose-950/45 border-[2.5px] border-rose-400/90 dark:border-rose-400/60 text-xs sm:text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 dark:via-rose-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.2s' }} />
        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-300 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="font-black text-rose-950 dark:text-rose-100 mr-2">
              {lang === 'om' ? "Akeekkachiisa Vitals Hatattamaa:" : "Urgent Bed Alert:"}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              Bed-05 (Chaltu Daba): Severe Preeclampsia BP 168/102 • STAT Hydralazine Due
            </span>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <MorphingArrowButton
            variant="rose"
            size="xs"
            label={lang === 'om' ? 'Siree Ilaali' : 'Inspect Bed'}
            onClick={() => setShowBedCensus(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. ONE UNIFIED RECTANGLE HOLDING 4 COMPACT ANIMATED 3D MINI CUBES */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-[2.5px] border-emerald-400/90 dark:border-emerald-400/60 bg-gradient-to-br from-emerald-100/85 via-white/95 to-teal-100/85 dark:from-[#0d2222]/95 dark:via-[#112d2d]/95 dark:to-[#0c1f1f]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_14px_34px_-8px_rgba(16,185,129,0.3)] hover:shadow-[0_18px_42px_-8px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 transition-all duration-300 animate-smooth-in">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/45 dark:via-emerald-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '0.6s' }} />
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto">
          {/* Mini Cube 1: Inpatient Bed Census */}
          <div
            onClick={() => setShowBedCensus((prev) => !prev)}
            style={{ animationDelay: '0s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-emerald-400/85 dark:border-emerald-400/55 bg-gradient-to-br from-white via-emerald-50 to-emerald-100/95 dark:from-[#113129] dark:via-[#163a32] dark:to-[#122e28] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(16,185,129,0.28),3px_3px_0_0_rgba(52,211,153,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-emerald-500 hover:shadow-[0_14px_24px_-4px_rgba(16,185,129,0.42),5px_5px_0_0_rgba(52,211,153,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-emerald-200/20 to-transparent mkh-cube-sweep" />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-emerald-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                1. {lang === 'om' ? 'Kutaa Ciisichaa' : 'Inpatient Beds'}
              </span>
              <span className="h-6 w-6 rounded-lg bg-emerald-500/20 dark:bg-emerald-400/25 border border-emerald-400/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Bed className="w-3 h-3" />
              </span>
            </div>

            <div className="relative z-10 space-y-1 my-auto">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  124
                </span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                  71% Full
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/90 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700" style={{ width: '71%' }} />
              </div>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              88 {lang === 'om' ? 'Qabame • 36 Duwwaa' : 'Occupied • 36 Free'}
            </p>
          </div>

          {/* Mini Cube 2: Critical Vitals Alerts */}
          <div
            onClick={() => setShowBedCensus((prev) => !prev)}
            style={{ animationDelay: '0.45s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-rose-400/85 dark:border-rose-400/55 bg-gradient-to-br from-white via-rose-50 to-rose-100/95 dark:from-[#361824] dark:via-[#421d2d] dark:to-[#381622] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(244,63,94,0.28),3px_3px_0_0_rgba(251,113,133,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-rose-500 hover:shadow-[0_14px_24px_-4px_rgba(244,63,94,0.42),5px_5px_0_0_rgba(251,113,133,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-rose-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '1.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-rose-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                2. {lang === 'om' ? 'Akeekkachiisa Vitals' : 'Critical Vitals'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-rose-500/20 dark:bg-rose-400/25 border border-rose-400/60 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-rose-900 dark:text-rose-200">
                {criticalCount + warningCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border border-rose-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-300 animate-ping" />
                BED-05 CRITICAL
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              BP 168/102 • SpO2 91%
            </p>
          </div>

          {/* Mini Cube 3: Medication Administration Record (MAR) */}
          <div
            onClick={() => setShowBedCensus((prev) => !prev)}
            style={{ animationDelay: '0.9s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-amber-400/85 dark:border-amber-400/55 bg-gradient-to-br from-white via-amber-50 to-orange-100/95 dark:from-[#362714] dark:via-[#423118] dark:to-[#362615] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(245,158,11,0.28),3px_3px_0_0_rgba(251,191,36,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-amber-500 hover:shadow-[0_14px_24px_-4px_rgba(245,158,11,0.42),5px_5px_0_0_rgba(251,191,36,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-amber-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '2.2s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-amber-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                3. {lang === 'om' ? 'Qoricha (MAR)' : 'MAR Doses Due'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-amber-500/20 dark:bg-amber-400/25 border border-amber-400/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Pill className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-amber-900 dark:text-amber-200">
                14
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border border-amber-400/60">
                1 STAT PENDING
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Hydralazine 10mg STAT
            </p>
          </div>

          {/* Mini Cube 4: Duty Handover Telemetry */}
          <div
            onClick={() => setShowShiftHandover((prev) => !prev)}
            style={{ animationDelay: '1.35s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-teal-400/85 dark:border-teal-400/55 bg-gradient-to-br from-white via-teal-50 to-teal-100/95 dark:from-[#132c38] dark:via-[#163646] dark:to-[#122b36] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(20,184,166,0.28),3px_3px_0_0_rgba(45,212,191,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-teal-500 hover:shadow-[0_14px_24px_-4px_rgba(20,184,166,0.42),5px_5px_0_0_rgba(45,212,191,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '3.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-teal-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                4. {lang === 'om' ? 'Dabarsaa Shiftii' : 'Duty Handover'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-teal-500/20 dark:bg-teal-400/25 border border-teal-400/60 text-teal-800 dark:text-teal-200 flex items-center justify-center shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-teal-900 dark:text-teal-200 font-mono">
                {handoverTimeStr}
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border border-teal-400/60">
                NURSE CHALTU
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {shift.progress_percent}% {lang === 'om' ? 'Shiftiin Raawwate' : 'Shift Elapsed'}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MINIMIZED-BY-DEFAULT SECTION 1: INPATIENT BEDS & VITALS MATRIX */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-emerald-400/80 dark:border-emerald-400/50 bg-white/95 dark:bg-[#0e2222]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-[#112d2d] dark:via-[#133333] dark:to-[#0f2828] border-b border-emerald-200/80 dark:border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center justify-center">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'To\'annoo Mallattoolee Lubbuu & Siree (Bedside Vitals & MAR)' : 'Bedside Vitals Intake & MAR Administration Matrix'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border border-emerald-500/40 font-bold">
                  {filteredBeds.length} BEDS ACTIVE
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Mallattoolee lubbuu (BP, HR, Temp, SpO2) fi qoricha kennuu' : 'Real-time vital telemetry, acuity triage, and MAR dose execution'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="emerald"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showBedCensus}
            label={showBedCensus ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Beds')}
            onClick={() => setShowBedCensus((prev) => !prev)}
          />
        </div>

        {showBedCensus && (
          <div className="p-4 sm:p-5 space-y-4 animate-smooth-in">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === 'om' ? 'Barbaadi Maqaa, Siree ykn MRN...' : 'Search by Patient Name, Bed No or MRN...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border-2 border-emerald-300 dark:border-emerald-600/50 bg-white dark:bg-[#142828] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'critical', 'warning', 'stable'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' ? (lang === 'om' ? 'Hundumaa' : 'All Beds') : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Beds Grid / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBeds.map((bed) => (
                <div
                  key={bed.bedNo}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                    bed.status === 'critical'
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400/80'
                      : bed.status === 'warning'
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400/80'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-600/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          {bed.bedNo}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {bed.patientName}
                        </h3>
                      </div>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                        {bed.mrn} • {bed.condition}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        bed.status === 'critical'
                          ? 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100 border-rose-400 animate-pulse'
                          : bed.status === 'warning'
                          ? 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100 border-amber-400'
                          : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100 border-emerald-400'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  {/* Vitals Telemetry strip */}
                  <div className="grid grid-cols-4 gap-2 my-2.5 p-2 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">BP</span>
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-white">{bed.bp}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Temp</span>
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-white">{bed.temp}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Heart Rate</span>
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-white">{bed.hr}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">SpO2</span>
                      <span className={`text-xs font-black font-mono ${parseInt(bed.spo2) < 92 ? 'text-rose-600 font-extrabold' : 'text-slate-900 dark:text-white'}`}>
                        {bed.spo2}
                      </span>
                    </div>
                  </div>

                  {/* Next Medication (MAR) & Action */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <Pill className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {bed.nextMed}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBedNo(bed.bedNo);
                          setModalBp(bed.bp);
                          setModalTemp(bed.temp);
                          setModalHr(bed.hr);
                          setModalSpo2(bed.spo2);
                          setIsModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition"
                      >
                        {lang === 'om' ? 'Vitals Haari' : 'Log Vitals'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdministerMarDirect(bed.bedNo, bed.nextMed)}
                        className="px-2 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 font-bold text-[11px] border border-teal-400/60 cursor-pointer transition"
                      >
                        {lang === 'om' ? 'Kenni (MAR)' : 'Give MAR'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 5. MINIMIZED-BY-DEFAULT SECTION 2: ONLINE SHIFT & HANDOVER NOTES  */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-emerald-400/80 dark:border-emerald-400/50 bg-white/95 dark:bg-[#0e2222]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-[#112d2d] dark:via-[#133333] dark:to-[#0f2828] border-b border-emerald-200/80 dark:border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-800 dark:text-teal-200 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Dabarsaa Shiftii & To\'annoo Ogeeyyii Wardii' : 'Ward Handover Notes & On-Duty Staffing'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-950 dark:text-teal-100 border border-teal-500/40 font-bold">
                  {shift.progress_percent}% SHIFT PROGRESS
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Ogeeyyii shiftii irra jiran, sa\'aatii dabarsaa, fi qabxii wal-harkaa fuudhiinsaa' : 'Duty roster, shift countdown, and handover instructions'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="teal"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showShiftHandover}
            label={showShiftHandover ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Handover')}
            onClick={() => setShowShiftHandover((prev) => !prev)}
          />
        </div>

        {showShiftHandover && (
          <div className="p-4 sm:p-5 space-y-4 animate-smooth-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Duty Shift Progress */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-[#122e2e] border-2 border-emerald-300 dark:border-emerald-600/40 space-y-2">
                <span className="text-xs uppercase font-black text-slate-700 dark:text-slate-300">
                  {lang === 'om' ? 'Shiftii Ammaa' : 'Active Duty Shift'}
                </span>
                <div className="text-base font-black text-slate-950 dark:text-white">
                  {shift ? (lang === 'om' ? shift.name_om : lang === 'am' ? shift.name_am : shift.name_en) : 'Day Shift'}
                </div>
                <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  {shift.start_time} - {shift.end_time}
                </div>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    <span>{lang === 'om' ? 'Raawwii Shiftii' : 'Shift Progress'}</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-300">{shift.progress_percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, shift.progress_percent))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* On-Duty Ward Staff */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-[#122e2e] border-2 border-emerald-300 dark:border-emerald-600/40 space-y-2">
                <span className="text-xs uppercase font-black text-slate-700 dark:text-slate-300">
                  {lang === 'om' ? 'Ogeeyyii Shiftii Irra Jiran' : 'On-Duty Ward Staff'}
                </span>
                <div className="space-y-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{shift.charge_nurse || 'Nurse Chaltu Daba (Charge)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{shift.duty_physician || 'Dr. Bekele Tadesse (MD, Surgeon)'}</span>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>{lang === 'om' ? 'Hafte Sa\'aa' : 'Handover in'}: </span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-mono font-black">{handoverTimeStr}</span>
                </div>
              </div>

              {/* Handover Notes Editor */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-[#122e2e] border-2 border-emerald-300 dark:border-emerald-600/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>{lang === 'om' ? 'Qabxii Dabarsaa Wardii' : 'Ward Handover Notes'}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                      className="text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingNotes ? (lang === 'om' ? 'Dhiisi' : 'Cancel') : (lang === 'om' ? 'Gulaali' : 'Edit')}</span>
                    </button>
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={handoverNoteDraft}
                        onChange={(e) => setHandoverNoteDraft(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2 rounded-xl border border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="Write critical notes for incoming shift..."
                      />
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        {lang === 'om' ? 'Ol-kaayi' : 'Save Notes'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed italic">
                      "{handoverNoteDraft || (lang === 'om' ? 'Qabxiin dabarsaa hin jiru.' : 'Bed-05 preeclampsia watched closely. All STAT orders executed.')}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 6. MINIMIZED-BY-DEFAULT SECTION 3: RAPID NURSING ACTION PADS      */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-emerald-400/80 dark:border-emerald-400/50 bg-white/95 dark:bg-[#0e2222]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-[#112d2d] dark:via-[#133333] dark:to-[#0f2828] border-b border-emerald-200/80 dark:border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-800 dark:text-teal-200 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Wiirtuuwwan Qaxxaamuraa Narsummaa' : 'Rapid Clinical & Inpatient Action Pads'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-950 dark:text-teal-100 border border-teal-500/40 font-bold">
                  6 PADS ONLINE
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Kutaa ciisichaa, dabaree triage, dhiiga naquu, nyaata yaalaa, fi IoMT telemetry' : 'Direct links to Inpatient Beds, Triage, Transfusion, Dietary, and IoMT'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="emerald"
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
              href="/wards"
              className="p-3.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50/60 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Bed className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Kutaa Ciisichaa' : 'Inpatient Wards'}
              </span>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                88 Occupied
              </span>
            </Link>

            <Link
              href="/queue"
              className="p-3.5 rounded-2xl border-2 border-amber-300 dark:border-amber-600/40 bg-amber-50/60 dark:bg-amber-950/20 hover:border-amber-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Dabaree Triage' : 'Triage Queue'}
              </span>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold mt-0.5">
                18 Waiting
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
                {lang === 'om' ? 'Dhiiga Naquu' : 'Transfusion'}
              </span>
              <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold mt-0.5">
                48 Units Cold
              </span>
            </Link>

            <Link
              href="/dietary"
              className="p-3.5 rounded-2xl border-2 border-teal-300 dark:border-teal-600/40 bg-teal-50/60 dark:bg-teal-950/20 hover:border-teal-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Nyaata Yaalaa' : 'Dietary Kitchen'}
              </span>
              <span className="text-[10px] text-teal-800 dark:text-teal-300 font-semibold mt-0.5">
                62 Trays Prepped
              </span>
            </Link>

            <Link
              href="/iomt"
              className="p-3.5 rounded-2xl border-2 border-cyan-300 dark:border-cyan-600/40 bg-cyan-50/60 dark:bg-cyan-950/20 hover:border-cyan-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'IoMT Telemetry' : 'IoMT Monitors'}
              </span>
              <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-semibold mt-0.5">
                12 ICU Beds Live
              </span>
            </Link>

            <Link
              href="/ot"
              className="p-3.5 rounded-2xl border-2 border-indigo-300 dark:border-indigo-600/40 bg-indigo-50/60 dark:bg-indigo-950/20 hover:border-indigo-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Syringe className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Kutaa Baqaqsaa' : 'Operating Theatre'}
              </span>
              <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-semibold mt-0.5">
                Theatre 01 Active
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 7. QUICK BEDSIDE VITALS & MAR ADMINISTRATION MODAL               */}
      {/* ================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-smooth-in">
          <div className="w-full max-w-lg rounded-3xl border-2 border-emerald-400 bg-white dark:bg-[#0f2424] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {lang === 'om' ? 'Galmee Vitals & Qoricha MAR' : 'Log Bedside Vitals & MAR Dose'}
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

            <form onSubmit={handleSaveVitalsModal} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Siree Filadhu (Select Bed)' : 'Select Bed'}
                </label>
                <select
                  value={selectedBedNo}
                  onChange={(e) => setSelectedBedNo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-600 bg-white dark:bg-[#142d2d] text-slate-900 dark:text-white text-xs font-bold"
                >
                  {beds.map((b) => (
                    <option key={b.bedNo} value={b.bedNo}>
                      {b.bedNo} - {b.patientName} ({b.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Blood Pressure (BP)
                  </label>
                  <input
                    type="text"
                    value={modalBp}
                    onChange={(e) => setModalBp(e.target.value)}
                    className="w-full p-2 rounded-xl border border-emerald-300 dark:border-emerald-600 text-xs font-bold font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="text"
                    value={modalTemp}
                    onChange={(e) => setModalTemp(e.target.value)}
                    className="w-full p-2 rounded-xl border border-emerald-300 dark:border-emerald-600 text-xs font-bold font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Heart Rate (HR)
                  </label>
                  <input
                    type="text"
                    value={modalHr}
                    onChange={(e) => setModalHr(e.target.value)}
                    className="w-full p-2 rounded-xl border border-emerald-300 dark:border-emerald-600 text-xs font-bold font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Oxygen Saturation (SpO2)
                  </label>
                  <input
                    type="text"
                    value={modalSpo2}
                    onChange={(e) => setModalSpo2(e.target.value)}
                    className="w-full p-2 rounded-xl border border-emerald-300 dark:border-emerald-600 text-xs font-bold font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Qoricha MAR Kenname (Administered Medication)' : 'MAR Dose Administered'}
                </label>
                <input
                  type="text"
                  value={modalMedGiven}
                  onChange={(e) => setModalMedGiven(e.target.value)}
                  placeholder="e.g. IV Hydralazine 10mg STAT"
                  className="w-full p-2.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-600 text-xs font-bold bg-white dark:bg-[#142d2d] text-slate-900 dark:text-white"
                />
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition"
                >
                  {lang === 'om' ? 'Galmee Ol-kaayi' : 'Save & Record MAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
