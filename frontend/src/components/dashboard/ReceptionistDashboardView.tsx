/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Receptionist, Admissions & Queue Dashboard (/portal/reception).
 *
 * Dedicated operational view for Front Desk Registrars, Admissions Officers, and Queue Clerks.
 * Overhauled to match the Executive Command Standard:
 * - Unified Outer Rectangle with 4 Compact Animated 3D Mini Cubes
 * - Frosted Glassmorphism, Bold Typography, Vibrant Responsive Gradients
 * - High-Contrast Universal Theme (Flawless Light & Dark Mode)
 * - Minimized-by-Default Clean Workstation with Kinetic MorphingArrowButtons
 * - Interactive Rapid Patient Intake & Token Generation Modal with Audio Chime
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
  Ticket,
  Users,
  Fingerprint,
  Clock,
  Ambulance,
  Tv,
  ArrowRight,
  Volume2,
  CheckCircle2,
  Search,
  UserPlus,
  Check,
  X,
  Layers,
  FileText,
  BadgeAlert,
  ShieldCheck,
  Bed,
  Radio,
  Building2,
  ShieldAlert,
} from 'lucide-react';

interface QueueItem {
  token: string;
  mrn: string;
  patientName: string;
  clinic: string;
  category: 'general' | 'pediatric' | 'emergency' | 'anc';
  status: 'waiting' | 'called' | 'in_room';
}

const INITIAL_QUEUE: QueueItem[] = [
  {
    token: 'A-012',
    mrn: 'MKH-2026-000101',
    patientName: 'Gudeta Hailu Tadesse',
    clinic: 'OPD Clinic 02 (Dr. Bekele)',
    category: 'general',
    status: 'in_room',
  },
  {
    token: 'A-015',
    mrn: 'MKH-2026-000102',
    patientName: 'Ayantu Mamo Kassa',
    clinic: 'OPD Clinic 01 (Dr. Sisay)',
    category: 'general',
    status: 'called',
  },
  {
    token: 'P-004',
    mrn: 'MKH-2026-000106',
    patientName: 'Lensa Tolera (Child)',
    clinic: 'Pediatric Clinic 01',
    category: 'pediatric',
    status: 'waiting',
  },
  {
    token: 'E-003',
    mrn: 'MKH-2026-000104',
    patientName: 'Chala Tolera Lemma',
    clinic: 'Acute Resuscitation ER',
    category: 'emergency',
    status: 'in_room',
  },
];

export function ReceptionistDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const { serverTime, shift } = useHospitalTimeSync();

  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'general' | 'pediatric' | 'emergency' | 'anc'>('all');

  // Minimized-by-default module toggles
  const [showQueueList, setShowQueueList] = useState<boolean>(false);
  const [showFaydaVerification, setShowFaydaVerification] = useState<boolean>(false);
  const [showActionPads, setShowActionPads] = useState<boolean>(false);

  // Quick Patient Intake Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('0911223344');
  const [newFayda, setNewFayda] = useState('FAN-2026-9901');
  const [newClinic, setNewClinic] = useState('OPD Clinic 02 (Dr. Bekele)');
  const [newCategory, setNewCategory] = useState<'general' | 'pediatric' | 'emergency' | 'anc'>('general');

  const handleCallAudioToken = (token: string, name: string, clinic: string) => {
    setQueue((prev) =>
      prev.map((q) => (q.token === token ? { ...q, status: 'called' } : q))
    );
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? `Tokanii ${token} Sagaleen Waamameera` : `Token ${token} Broadcasted`,
      message: `${name} (${token}) called to ${clinic}. Hall display updated.`,
      color: 'teal',
    });
  };

  const handleSaveModalIntake = (e: React.FormEvent) => {
    e.preventDefault();
    const tokenLetter = newCategory === 'emergency' ? 'E' : newCategory === 'pediatric' ? 'P' : 'A';
    const nextNum = queue.length + 16;
    const generatedToken = `${tokenLetter}-${String(nextNum).padStart(3, '0')}`;
    const generatedMrn = `MKH-2026-${String(100 + queue.length + 1)}`;

    const newItem: QueueItem = {
      token: generatedToken,
      mrn: generatedMrn,
      patientName: newName || 'Tola Gemechu',
      clinic: newClinic,
      category: newCategory,
      status: 'waiting',
    };

    setQueue((prev) => [newItem, ...prev]);
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Galmeen Dhukkubsataa Milkaa\'eera' : 'Patient Registered & Token Issued',
      message: `Token ${generatedToken} generated for ${newItem.patientName} (${generatedMrn}) at ${newClinic}.`,
      color: 'teal',
    });

    setNewName('');
    setIsModalOpen(false);
  };

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clinic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const waitingCount = queue.filter((q) => q.status === 'waiting').length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-smooth-in">
      {/* ================================================================= */}
      {/* 1. RECEPTION COCKPIT HEADER                                       */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-100/90 via-white/95 to-sky-100/90 dark:from-[#0d2226]/95 dark:via-[#112d33]/95 dark:to-[#0c1f24]/95 border-[2.5px] border-teal-400/90 dark:border-teal-400/60 shadow-[0_12px_32px_-8px_rgba(20,184,166,0.28)] hover:shadow-[0_16px_40px_-8px_rgba(20,184,166,0.4)] transition-all duration-300">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/50 dark:via-teal-200/15 to-transparent mkh-panel-sweep" />

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/35 border-2 border-white/60 shrink-0 transform hover:scale-105 hover:rotate-3 transition-transform">
            <Ticket className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Simannaa, Fayda & Dabaree (Reception)'
                  : lang === 'am'
                  ? 'የመስተንግዶ፣ ፋይዳና የተራ ቁጥር ክፍል (Reception)'
                  : 'Reception, Fayda ID & Smart Queue Counter'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-400/30 text-teal-950 dark:text-teal-100 border-2 border-teal-500/60 font-mono font-black">
                RECEPTION ACTIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {lang === 'om'
                ? 'Galmee dhukkubsattootaa, mirkaneessa biometrics Fayda, maxxansa tokanii, fi sagaleen waamuu'
                : 'Patient registration, biometric Fayda ID verification, smart queuing, and audio chime calling'}
            </p>
          </div>
        </div>

        {/* Quick Status Badges & Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Fayda Online Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 bg-teal-100/95 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border-teal-500/75 transition-transform hover:scale-[1.04]">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span>FAYDA ONLINE</span>
          </div>

          {/* Active Shift Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#122428] border-2 border-teal-400/80 dark:border-teal-400/50 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:border-teal-500 transition-colors">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>
              {shift ? (lang === 'om' ? shift.name_om : lang === 'am' ? shift.name_am : shift.name_en) : 'Reception Shift'}
            </span>
            <span className="text-teal-700 dark:text-teal-300 font-mono text-xs">
              ({serverTime || '10:00 AM'})
            </span>
          </div>

          {/* Primary Action Button: New Patient Intake */}
          <MorphingArrowButton
            variant="teal"
            size="sm"
            label={lang === 'om' ? 'Galmee Haaraa' : 'Patient Intake'}
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. URGENT EMERGENCY ACUITY ALERT BANNER                           */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-100 via-amber-100/90 to-rose-100/95 dark:from-rose-950/45 dark:via-amber-950/35 dark:to-rose-950/45 border-[2.5px] border-rose-400/90 dark:border-rose-400/60 text-xs sm:text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 dark:via-rose-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.2s' }} />
        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-300 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="font-black text-rose-950 dark:text-rose-100 mr-2">
              {lang === 'om' ? "Dabaree Hatattamaa ER (Emergency Triage):" : "Emergency Acuity Red Flag:"}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              Token E-003 (Chala Tolera): Chest pain radiating to left shoulder • Routed immediately to Acute ER
            </span>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <MorphingArrowButton
            variant="rose"
            size="xs"
            label={lang === 'om' ? 'Dabaree Ilaali' : 'Inspect ER'}
            onClick={() => setShowQueueList(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. ONE UNIFIED RECTANGLE HOLDING 4 COMPACT ANIMATED 3D MINI CUBES */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-[2.5px] border-teal-400/90 dark:border-teal-400/60 bg-gradient-to-br from-teal-100/85 via-white/95 to-sky-100/85 dark:from-[#0d2226]/95 dark:via-[#112d33]/95 dark:to-[#0c1f24]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_14px_34px_-8px_rgba(20,184,166,0.3)] hover:shadow-[0_18px_42px_-8px_rgba(20,184,166,0.45)] hover:-translate-y-0.5 transition-all duration-300 animate-smooth-in">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '0.6s' }} />
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto">
          {/* Mini Cube 1: Admissions Today */}
          <div
            onClick={() => setShowQueueList((prev) => !prev)}
            style={{ animationDelay: '0s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-teal-400/85 dark:border-teal-400/55 bg-gradient-to-br from-white via-teal-50 to-teal-100/95 dark:from-[#113137] dark:via-[#163a42] dark:to-[#122e35] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(20,184,166,0.28),3px_3px_0_0_rgba(45,212,191,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-teal-500 hover:shadow-[0_14px_24px_-4px_rgba(20,184,166,0.42),5px_5px_0_0_rgba(45,212,191,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/20 to-transparent mkh-cube-sweep" />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-teal-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                1. {lang === 'om' ? 'Simannaa Har\'aa' : 'Intake Today'}
              </span>
              <span className="h-6 w-6 rounded-lg bg-teal-500/20 dark:bg-teal-400/25 border border-teal-400/60 text-teal-800 dark:text-teal-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-3 h-3" />
              </span>
            </div>

            <div className="relative z-10 space-y-1 my-auto">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  68
                </span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                  42 Triaged
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/90 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-700" style={{ width: '62%' }} />
              </div>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              26 {lang === 'om' ? 'Dabaree OPD Eegaa Jiru' : 'In OPD Process'}
            </p>
          </div>

          {/* Mini Cube 2: Waiting Queue */}
          <div
            onClick={() => setShowQueueList((prev) => !prev)}
            style={{ animationDelay: '0.45s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-amber-400/85 dark:border-amber-400/55 bg-gradient-to-br from-white via-amber-50 to-orange-100/95 dark:from-[#362714] dark:via-[#423118] dark:to-[#362615] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(245,158,11,0.28),3px_3px_0_0_rgba(251,191,36,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-amber-500 hover:shadow-[0_14px_24px_-4px_rgba(245,158,11,0.42),5px_5px_0_0_rgba(251,191,36,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-amber-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '1.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-amber-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                2. {lang === 'om' ? 'Dabaree Eeggachaa' : 'Waiting Queue'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-amber-500/20 dark:bg-amber-400/25 border border-amber-400/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-amber-900 dark:text-amber-200">
                {waitingCount + 14}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border border-amber-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                LOBBY WAITING
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Avg Wait: 14 mins
            </p>
          </div>

          {/* Mini Cube 3: Fayda Digital ID */}
          <div
            onClick={() => setShowFaydaVerification((prev) => !prev)}
            style={{ animationDelay: '0.9s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-sky-400/85 dark:border-sky-400/55 bg-gradient-to-br from-white via-sky-50 to-blue-100/95 dark:from-[#112436] dark:via-[#162d42] dark:to-[#122435] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(14,165,233,0.28),3px_3px_0_0_rgba(56,189,248,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-sky-500 hover:shadow-[0_14px_24px_-4px_rgba(14,165,233,0.42),5px_5px_0_0_rgba(56,189,248,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-sky-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '2.2s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-sky-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                3. {lang === 'om' ? 'Waraqaa Fayda' : 'Fayda ID'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-sky-500/20 dark:bg-sky-400/25 border border-sky-400/60 text-sky-800 dark:text-sky-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Fingerprint className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-sky-900 dark:text-sky-200">
                94%
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-500/25 text-sky-950 dark:text-sky-100 border border-sky-400/60">
                BIOMETRIC MATCH
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              National Digital Health
            </p>
          </div>

          {/* Mini Cube 4: Emergency Red Triage */}
          <Link
            href="/queue"
            style={{ animationDelay: '1.35s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-rose-400/85 dark:border-rose-400/55 bg-gradient-to-br from-white via-rose-50 to-rose-100/95 dark:from-[#361824] dark:via-[#421d2d] dark:to-[#381622] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(244,63,94,0.28),3px_3px_0_0_rgba(251,113,133,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-rose-500 hover:shadow-[0_14px_24px_-4px_rgba(244,63,94,0.42),5px_5px_0_0_rgba(251,113,133,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-rose-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '3.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-rose-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                4. {lang === 'om' ? 'Gara ER' : 'Emergency ER'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-rose-500/20 dark:bg-rose-400/25 border border-rose-400/60 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                <Ambulance className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-rose-900 dark:text-rose-200">
                4
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border border-rose-400/60">
                RED ACUITY
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Immediate ER Routing
            </p>
          </Link>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MINIMIZED-BY-DEFAULT SECTION 1: SMART QUEUE & TOKEN CALLING    */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-teal-400/80 dark:border-teal-400/50 bg-white/95 dark:bg-[#0c1f24]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-teal-50 via-sky-50 to-white dark:from-[#0d2226] dark:via-[#112d33] dark:to-[#0c1f24] border-b border-teal-200/80 dark:border-teal-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-800 dark:text-teal-200 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'To\'annoo Tokanii & Sagaleen Waamuu (Smart Queue)' : 'OPD Smart Queue & Public Token Audio Chime'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-950 dark:text-teal-100 border border-teal-500/40 font-bold">
                  {filteredQueue.length} TOKENS
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Tokanii dabaree maxxansuu, gara kutaa yaalaatti erguu, fi sagaleen waamuu' : 'Real-time outpatient queue dispatch, TV display synchronization, and voice calling'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="teal"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showQueueList}
            label={showQueueList ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Queue')}
            onClick={() => setShowQueueList((prev) => !prev)}
          />
        </div>

        {showQueueList && (
          <div className="p-4 sm:p-5 space-y-4 animate-smooth-in">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === 'om' ? 'Barbaadi Tokanii, Maqaa, Kutaa Yaalaa...' : 'Search by Token, Name or Clinic...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border-2 border-teal-300 dark:border-teal-600/50 bg-white dark:bg-[#12282e] text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'general', 'pediatric', 'emergency', 'anc'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCategoryFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      categoryFilter === filter
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' ? (lang === 'om' ? 'Hundumaa' : 'All') : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredQueue.map((item) => (
                <div
                  key={item.token}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                    item.category === 'emergency'
                      ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-400/80'
                      : item.status === 'called'
                      ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-400/80'
                      : 'bg-teal-50/70 dark:bg-teal-950/25 border-teal-300/80 dark:border-teal-600/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black px-2.5 py-1 rounded-lg bg-teal-600 text-white shadow-xs">
                          {item.token}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {item.patientName}
                        </h3>
                      </div>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                        {item.mrn} • Clinic: {item.clinic}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        item.status === 'in_room'
                          ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100 border-emerald-400'
                          : item.status === 'called'
                          ? 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100 border-amber-400 animate-pulse'
                          : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200 border-slate-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                      Category: {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCallAudioToken(item.token, item.patientName, item.clinic)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{lang === 'om' ? 'Sagaleen Waami' : 'Audio Chime Call'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 5. MINIMIZED-BY-DEFAULT SECTION 2: FAYDA DIGITAL ID BIO-VERIFY     */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-teal-400/80 dark:border-teal-400/50 bg-white/95 dark:bg-[#0c1f24]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-teal-50 via-sky-50 to-white dark:from-[#0d2226] dark:via-[#112d33] dark:to-[#0c1f24] border-b border-teal-200/80 dark:border-teal-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-800 dark:text-sky-200 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Waraqaa Eenyummaa Fayda & Biometrics' : 'National Digital ID (Fayda) Verification Counter'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-950 dark:text-sky-100 border border-sky-400/40 font-bold">
                  94% VERIFIED
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Mallattoo qubaa, asxaa fuulaa, fi Master Patient Index (MPI) wal-simsiisuu' : 'Biometric identity match with national digital health index'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="sky"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showFaydaVerification}
            label={showFaydaVerification ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Fayda')}
            onClick={() => setShowFaydaVerification((prev) => !prev)}
          />
        </div>

        {showFaydaVerification && (
          <div className="p-4 sm:p-5 space-y-3 animate-smooth-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/25 border-2 border-sky-300 dark:border-sky-600/40 space-y-1 text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  Biometric Match Accuracy
                </span>
                <p className="font-bold text-sky-700 dark:text-sky-300 text-lg font-mono">
                  99.8% Match Confirmed
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Direct API integration with National ID Program (NIDP) gateway.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/25 border-2 border-teal-300 dark:border-teal-600/40 space-y-1 text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  Automated MPI Linked
                </span>
                <p className="font-bold text-teal-700 dark:text-teal-300 text-lg font-mono">
                  14,820 Records Linked
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Zero duplicated patient charts across Mettu Karl clinical wards.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border-2 border-amber-300 dark:border-amber-600/40 space-y-1 text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  Offline Fallback Ready
                </span>
                <p className="font-bold text-amber-700 dark:text-amber-300 text-lg font-mono">
                  Local Cache Active
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Encrypted offline queue guarantees patient intake during telecom outage.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 6. MINIMIZED-BY-DEFAULT SECTION 3: RAPID RECEPTION ACTION PADS    */}
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
                  {lang === 'om' ? 'Wiirtuuwwan Qaxxaamuraa Simannaa & Galmee' : 'Rapid Reception & Patient Flow Action Pads'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-950 dark:text-teal-100 border border-teal-500/40 font-bold">
                  6 PADS ONLINE
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Dabaree smart queue, galmee dhukkubsataa, Fayda ID, EMS buufata ambulaansii, fi ciisicha' : 'Direct links to Smart Queue, Patient Charts, Fayda, EMS, and Inpatient Beds'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="teal"
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
              href="/queue"
              className="p-3.5 rounded-2xl border-2 border-teal-300 dark:border-teal-600/40 bg-teal-50/60 dark:bg-teal-950/20 hover:border-teal-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Tv className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Smart Queue' : 'Queue TV Hall'}
              </span>
              <span className="text-[10px] text-teal-800 dark:text-teal-300 font-semibold mt-0.5">
                Waiting Displays
              </span>
            </Link>

            <Link
              href="/patients"
              className="p-3.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50/60 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Galmee MPI' : 'Patient Charts'}
              </span>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                FHIR Registry
              </span>
            </Link>

            <Link
              href="/fayda"
              className="p-3.5 rounded-2xl border-2 border-sky-300 dark:border-sky-600/40 bg-sky-50/60 dark:bg-sky-950/20 hover:border-sky-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Fingerprint className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Fayda ID' : 'National ID'}
              </span>
              <span className="text-[10px] text-sky-800 dark:text-sky-300 font-semibold mt-0.5">
                Biometric Portal
              </span>
            </Link>

            <Link
              href="/ems"
              className="p-3.5 rounded-2xl border-2 border-rose-300 dark:border-rose-600/40 bg-rose-50/60 dark:bg-rose-950/20 hover:border-rose-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Ambulance className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'EMS Ambulaansii' : 'EMS Dispatch'}
              </span>
              <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold mt-0.5">
                *907* Response
              </span>
            </Link>

            <Link
              href="/wards"
              className="p-3.5 rounded-2xl border-2 border-cyan-300 dark:border-cyan-600/40 bg-cyan-50/60 dark:bg-cyan-950/20 hover:border-cyan-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Bed className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Kutaa Ciisichaa' : 'Inpatient Beds'}
              </span>
              <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-semibold mt-0.5">
                36 Free Beds
              </span>
            </Link>

            <Link
              href="/sms-ussd"
              className="p-3.5 rounded-2xl border-2 border-indigo-300 dark:border-indigo-600/40 bg-indigo-50/60 dark:bg-indigo-950/20 hover:border-indigo-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'SMS & USSD' : 'SMS Gateway'}
              </span>
              <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-semibold mt-0.5">
                Appointment Chime
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 7. QUICK PATIENT INTAKE & TOKEN GENERATION MODAL                  */}
      {/* ================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-smooth-in">
          <div className="w-full max-w-lg rounded-3xl border-2 border-teal-400 bg-white dark:bg-[#0c1f24] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-teal-500 to-sky-600 text-white font-black">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {lang === 'om' ? 'Galmee Dhukkubsataa & Maxxansa Tokanii' : 'New Patient Intake & Token Generation'}
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

            <form onSubmit={handleSaveModalIntake} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Maqaa Guutuu Dhukkubsataa' : 'Full Patient Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tolasa Gemechu Lemma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-teal-300 dark:border-teal-600 bg-white dark:bg-[#12282e] text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 rounded-xl border border-teal-300 dark:border-teal-600 text-xs font-bold font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Fayda Digital ID (FAN)
                  </label>
                  <input
                    type="text"
                    value={newFayda}
                    onChange={(e) => setNewFayda(e.target.value)}
                    className="w-full p-2 rounded-xl border border-teal-300 dark:border-teal-600 text-xs font-bold font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Garee / Kutaa Yaalaa (Triage Category)' : 'Acuity / Category'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['general', 'pediatric', 'emergency', 'anc'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`p-2 rounded-xl text-xs font-bold uppercase border-2 cursor-pointer transition ${
                        newCategory === cat
                          ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Kutaa Yaalaa Ergamuu (Destination Clinic)' : 'Destination Clinic'}
                </label>
                <select
                  value={newClinic}
                  onChange={(e) => setNewClinic(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-teal-300 dark:border-teal-600 bg-white dark:bg-[#12282e] text-slate-900 dark:text-white text-xs font-bold"
                >
                  <option value="OPD Clinic 01 (Dr. Sisay)">OPD Clinic 01 (Dr. Sisay)</option>
                  <option value="OPD Clinic 02 (Dr. Bekele)">OPD Clinic 02 (Dr. Bekele)</option>
                  <option value="Pediatric Clinic 01">Pediatric Clinic 01</option>
                  <option value="Acute Resuscitation ER">Acute Resuscitation ER</option>
                  <option value="ANC Prenatal Follow-Up">ANC Prenatal Follow-Up</option>
                </select>
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
                  className="px-4 py-2 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-500 text-white shadow-md cursor-pointer transition flex items-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{lang === 'om' ? 'Tokanii Maxxansi' : 'Issue Token'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
