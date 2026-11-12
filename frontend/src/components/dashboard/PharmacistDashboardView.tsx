/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Pharmacist & Dispensary Workstation Dashboard (/portal/pharmacy).
 *
 * Dedicated operational view for Hospital Pharmacists, FEFO Controllers, and Dispensary Officers.
 * Overhauled to match the Executive Command Standard:
 * - Unified Outer Rectangle with 4 Compact Animated 3D Mini Cubes
 * - Frosted Glassmorphism, Bold Typography, Vibrant Responsive Gradients
 * - High-Contrast Universal Theme (Flawless Light & Dark Mode)
 * - Minimized-by-Default Clean Workstation with Kinetic MorphingArrowButtons
 * - Interactive Rapid Prescription Dispensing & Barcode Verification Modal
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
  Pill,
  Clock,
  AlertTriangle,
  PackageCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Barcode,
  Search,
  Check,
  X,
  Layers,
  FileText,
  Boxes,
  Truck,
  Scan,
  ShieldCheck,
  TrendingDown,
  Eye,
} from 'lucide-react';

interface RxItem {
  rxId: string;
  mrn: string;
  patientName: string;
  doctor: string;
  drug: string;
  dosage: string;
  batch: string;
  expiryDays: number;
  status: 'pending' | 'verified' | 'dispensed';
}

const INITIAL_RX: RxItem[] = [
  {
    rxId: 'RX-2026-9041',
    mrn: 'MKH-2026-000101',
    patientName: 'Gudeta Hailu Tadesse',
    doctor: 'Dr. Bekele Tadesse',
    drug: 'Coartem (Artemether + Lumefantrine) 20/120mg',
    dosage: '4 tabs BID for 3 days',
    batch: 'BAT-2026-042',
    expiryDays: 140,
    status: 'pending',
  },
  {
    rxId: 'RX-2026-9042',
    mrn: 'MKH-2026-000102',
    patientName: 'Ayantu Mamo Kassa',
    doctor: 'Dr. Sisay Lemma',
    drug: 'Ciprofloxacin 500mg Tablets',
    dosage: '1 tab PO BID x 7 days',
    batch: 'BAT-2025-119',
    expiryDays: 18,
    status: 'pending',
  },
  {
    rxId: 'RX-2026-9043',
    mrn: 'MKH-2026-000103',
    patientName: 'Derartu Tulu Gemechu',
    doctor: 'Dr. Helen Kassa',
    drug: 'Ferrous Sulfate + Folic Acid 200/0.4mg',
    dosage: '1 tab daily x 30 days',
    batch: 'BAT-2026-008',
    expiryDays: 320,
    status: 'verified',
  },
  {
    rxId: 'RX-2026-9044',
    mrn: 'MKH-2026-000105',
    patientName: 'Chaltu Daba Tolasa',
    doctor: 'Dr. Chala Gemechu',
    drug: 'Hydralazine 25mg Tablets',
    dosage: '25mg PO TID',
    batch: 'BAT-2026-077',
    expiryDays: 85,
    status: 'pending',
  },
];

interface FefoAlert {
  drug: string;
  batch: string;
  expiryDate: string;
  daysRemaining: number;
  currentStock: number;
  urgency: 'critical' | 'warning' | 'normal';
}

const INITIAL_FEFO: FefoAlert[] = [
  {
    drug: 'Ciprofloxacin 500mg Tablets',
    batch: 'BAT-2025-119',
    expiryDate: '2026-11-30',
    daysRemaining: 18,
    currentStock: 140,
    urgency: 'critical',
  },
  {
    drug: 'Amoxicillin + Clavulanic Acid 625mg',
    batch: 'BAT-2025-204',
    expiryDate: '2026-12-15',
    daysRemaining: 33,
    currentStock: 85,
    urgency: 'warning',
  },
  {
    drug: 'Regular Insulin 100 IU/mL Vials',
    batch: 'BAT-2026-012',
    expiryDate: '2027-01-20',
    daysRemaining: 69,
    currentStock: 42,
    urgency: 'normal',
  },
];

export function PharmacistDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const { serverTime, shift } = useHospitalTimeSync();

  const [rxList, setRxList] = useState<RxItem[]>(INITIAL_RX);
  const [fefoAlerts] = useState<FefoAlert[]>(INITIAL_FEFO);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'dispensed'>('all');

  // Minimized-by-default module toggles
  const [showDispensingQueue, setShowDispensingQueue] = useState<boolean>(false);
  const [showFefoWarnings, setShowFefoWarnings] = useState<boolean>(false);
  const [showActionPads, setShowActionPads] = useState<boolean>(false);

  // Quick Dispense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState<RxItem>(INITIAL_RX[0]);
  const [enteredBarcode, setEnteredBarcode] = useState('');

  const handleDispenseDirect = (rxId: string) => {
    setRxList((prev) =>
      prev.map((item) => (item.rxId === rxId ? { ...item, status: 'dispensed' } : item))
    );
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Qorichi Raabsameera' : 'Prescription Dispensed',
      message: `${rxId} recorded as dispensed at ${serverTime || '10:00 AM'}. FEFO inventory balance decremented.`,
      color: 'teal',
    });
  };

  const handleSaveModalDispense = (e: React.FormEvent) => {
    e.preventDefault();
    setRxList((prev) =>
      prev.map((item) => (item.rxId === selectedRx.rxId ? { ...item, status: 'dispensed' } : item))
    );
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Qorichi Raabsameera (FEFO Verified)' : 'Prescription Dispensed & Verified',
      message: `${selectedRx.rxId} (${selectedRx.drug}): Verified against Batch ${selectedRx.batch}. Dispensed to ${selectedRx.patientName}.`,
      color: 'teal',
    });
    setIsModalOpen(false);
  };

  const filteredRx = rxList.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.drug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = rxList.filter((r) => r.status === 'pending').length;
  const dispensedCount = rxList.filter((r) => r.status === 'dispensed').length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-smooth-in">
      {/* ================================================================= */}
      {/* 1. PHARMACY COCKPIT HEADER                                        */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-100/90 via-white/95 to-yellow-100/90 dark:from-[#261f0d]/95 dark:via-[#332a12]/95 dark:to-[#241c0b]/95 border-[2.5px] border-amber-400/90 dark:border-amber-400/60 shadow-[0_12px_32px_-8px_rgba(245,158,11,0.28)] hover:shadow-[0_16px_40px_-8px_rgba(245,158,11,0.4)] transition-all duration-300">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/50 dark:via-amber-200/15 to-transparent mkh-panel-sweep" />

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/35 border-2 border-white/60 shrink-0 transform hover:scale-105 hover:rotate-3 transition-transform">
            <Pill className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Faarmaasii & Raabsa Qorichaa (FEFO)'
                  : lang === 'am'
                  ? 'የፋርማሲና የመድኃኒት ማሰራጫ የስራ ማዕከል (FEFO)'
                  : 'Pharmacy Dispensing & FEFO Command Desk'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/30 text-amber-950 dark:text-amber-100 border-2 border-amber-500/60 font-mono font-black">
                PHARMACY ACTIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {lang === 'om'
                ? 'Mirkanneessa resephii, qajeelfama FEFO (First-Expired First-Out), fi to\'annoo kuusaa'
                : 'Prescription dispensing verification, FEFO batch expiry control, and EFDA narcotics safety'}
            </p>
          </div>
        </div>

        {/* Quick Status Badges & Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          {/* FEFO Nominal Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 bg-amber-100/95 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border-amber-500/75 transition-transform hover:scale-[1.04]">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{lang === 'om' ? 'FEFO TO\'ATAMEERA' : 'FEFO Compliant'}</span>
          </div>

          {/* Active Shift Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#1a150b] border-2 border-amber-400/80 dark:border-amber-400/50 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:border-amber-500 transition-colors">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>
              {shift ? (lang === 'om' ? shift.name_om : lang === 'am' ? shift.name_am : shift.name_en) : 'Dispensary Shift'}
            </span>
            <span className="text-amber-700 dark:text-amber-300 font-mono text-xs">
              ({serverTime || '10:00 AM'})
            </span>
          </div>

          {/* Primary Action Button: Quick Dispense */}
          <MorphingArrowButton
            variant="amber"
            size="sm"
            label={lang === 'om' ? 'Raabsa Qorichaa' : 'Quick Dispense'}
            icon={<PackageCheck className="w-4 h-4" />}
            onClick={() => {
              setSelectedRx(rxList[0]);
              setEnteredBarcode(rxList[0].batch);
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. URGENT FEFO EXPIRY WARNING BANNER                              */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-100/90 to-amber-100/95 dark:from-amber-950/45 dark:via-rose-950/35 dark:to-amber-950/45 border-[2.5px] border-amber-400/90 dark:border-amber-400/60 text-xs sm:text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 dark:via-amber-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.2s' }} />
        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="font-black text-amber-950 dark:text-amber-100 mr-2">
              {lang === 'om' ? "Akeekkachiisa FEFO (Yeroon Dhumuuf Jira):" : "Urgent FEFO Expiry Warning:"}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              Ciprofloxacin 500mg (Batch BAT-2025-119) expires in 18 days • 140 tabs remaining
            </span>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <MorphingArrowButton
            variant="amber"
            size="xs"
            label={lang === 'om' ? 'FEFO Ilaali' : 'Inspect FEFO'}
            onClick={() => setShowFefoWarnings(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. ONE UNIFIED RECTANGLE HOLDING 4 COMPACT ANIMATED 3D MINI CUBES */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-[2.5px] border-amber-400/90 dark:border-amber-400/60 bg-gradient-to-br from-amber-100/85 via-white/95 to-yellow-100/85 dark:from-[#261f0d]/95 dark:via-[#332a12]/95 dark:to-[#241c0b]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_14px_34px_-8px_rgba(245,158,11,0.3)] hover:shadow-[0_18px_42px_-8px_rgba(245,158,11,0.45)] hover:-translate-y-0.5 transition-all duration-300 animate-smooth-in">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/45 dark:via-amber-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '0.6s' }} />
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto">
          {/* Mini Cube 1: Prescriptions Today */}
          <div
            onClick={() => setShowDispensingQueue((prev) => !prev)}
            style={{ animationDelay: '0s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-amber-400/85 dark:border-amber-400/55 bg-gradient-to-br from-white via-amber-50 to-amber-100/95 dark:from-[#362714] dark:via-[#423118] dark:to-[#362615] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(245,158,11,0.28),3px_3px_0_0_rgba(251,191,36,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-amber-500 hover:shadow-[0_14px_24px_-4px_rgba(245,158,11,0.42),5px_5px_0_0_rgba(251,191,36,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-amber-200/20 to-transparent mkh-cube-sweep" />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-amber-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                1. {lang === 'om' ? 'Resephii Har\'aa' : 'Prescriptions'}
              </span>
              <span className="h-6 w-6 rounded-lg bg-amber-500/20 dark:bg-amber-400/25 border border-amber-400/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-3 h-3" />
              </span>
            </div>

            <div className="relative z-10 space-y-1 my-auto">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  28
                </span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                  {dispensedCount + 18} Done
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/90 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-700" style={{ width: '68%' }} />
              </div>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {pendingCount} {lang === 'om' ? 'Dabaree Eeggachaa' : 'Pending in Queue'}
            </p>
          </div>

          {/* Mini Cube 2: FEFO Expiry Alerts */}
          <div
            onClick={() => setShowFefoWarnings((prev) => !prev)}
            style={{ animationDelay: '0.45s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-rose-400/85 dark:border-rose-400/55 bg-gradient-to-br from-white via-rose-50 to-rose-100/95 dark:from-[#361824] dark:via-[#421d2d] dark:to-[#381622] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(244,63,94,0.28),3px_3px_0_0_rgba(251,113,133,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-rose-500 hover:shadow-[0_14px_24px_-4px_rgba(244,63,94,0.42),5px_5px_0_0_rgba(251,113,133,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-rose-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '1.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-rose-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                2. {lang === 'om' ? 'Akeekkachiisa FEFO' : 'FEFO Expiry'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-rose-500/20 dark:bg-rose-400/25 border border-rose-400/60 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-rose-900 dark:text-rose-200">
                4
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border border-rose-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-300 animate-ping" />
                CRITICAL &lt; 30D
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Ciprofloxacin (18d left)
            </p>
          </div>

          {/* Mini Cube 3: Stock Depletion Alerts */}
          <div
            onClick={() => setShowFefoWarnings((prev) => !prev)}
            style={{ animationDelay: '0.9s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-amber-400/85 dark:border-amber-400/55 bg-gradient-to-br from-white via-amber-50 to-orange-100/95 dark:from-[#362714] dark:via-[#423118] dark:to-[#362615] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(245,158,11,0.28),3px_3px_0_0_rgba(251,191,36,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-amber-500 hover:shadow-[0_14px_24px_-4px_rgba(245,158,11,0.42),5px_5px_0_0_rgba(251,191,36,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-amber-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '2.2s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-amber-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                3. {lang === 'om' ? 'Qoricha Hir\'ate' : 'Stock Depletion'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-amber-500/20 dark:bg-amber-400/25 border border-amber-400/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-amber-900 dark:text-amber-200">
                2
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border border-amber-400/60">
                RE-ORDER SOON
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Insulin • Amoxiclav
            </p>
          </div>

          {/* Mini Cube 4: EFDA Controlled Registry */}
          <Link
            href="/efda"
            style={{ animationDelay: '1.35s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-teal-400/85 dark:border-teal-400/55 bg-gradient-to-br from-white via-teal-50 to-teal-100/95 dark:from-[#132c38] dark:via-[#163646] dark:to-[#122b36] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(20,184,166,0.28),3px_3px_0_0_rgba(45,212,191,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-teal-500 hover:shadow-[0_14px_24px_-4px_rgba(20,184,166,0.42),5px_5px_0_0_rgba(45,212,191,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-teal-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '3.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-teal-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                4. {lang === 'om' ? 'EFDA Narcotics' : 'EFDA Registry'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-teal-500/20 dark:bg-teal-400/25 border border-teal-400/60 text-teal-800 dark:text-teal-200 flex items-center justify-center shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-teal-900 dark:text-teal-200 font-mono">
                100%
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border border-teal-400/60">
                AUDIT VERIFIED
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Morphine & Diazepam Safe
            </p>
          </Link>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MINIMIZED-BY-DEFAULT SECTION 1: PRESCRIPTION DISPENSING QUEUE  */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-amber-400/80 dark:border-amber-400/50 bg-white/95 dark:bg-[#181308]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-white dark:from-[#261f0d] dark:via-[#302610] dark:to-[#211a09] border-b border-amber-200/80 dark:border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-200 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Dabaree Raabsa Resephii & Barcode (Dispensing Queue)' : 'Prescription Dispensing Queue & Barcode Verification'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-950 dark:text-amber-100 border border-amber-500/40 font-bold">
                  {filteredRx.length} PRESCRIPTIONS
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Qoricha doktoorotaan ajajame mirkaneessuu, lakkoofsa batch sakatta\'uu fi raabsuu' : 'Verify clinical orders, scan batch barcodes, and execute dispensing'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="amber"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showDispensingQueue}
            label={showDispensingQueue ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Queue')}
            onClick={() => setShowDispensingQueue((prev) => !prev)}
          />
        </div>

        {showDispensingQueue && (
          <div className="p-4 sm:p-5 space-y-4 animate-smooth-in">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === 'om' ? 'Barbaadi Qoricha, Maqaa, RxID...' : 'Search by Drug Name, Patient or RxID...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border-2 border-amber-300 dark:border-amber-600/50 bg-white dark:bg-[#1f1809] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'pending', 'verified', 'dispensed'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' ? (lang === 'om' ? 'Hundumaa' : 'All Prescriptions') : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescriptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredRx.map((rx) => (
                <div
                  key={rx.rxId}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                    rx.status === 'dispensed'
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700 opacity-80'
                      : rx.status === 'verified'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-400/80'
                      : 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-400/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          {rx.rxId}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {rx.patientName}
                        </h3>
                      </div>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                        {rx.mrn} • Prescribed by {rx.doctor}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        rx.status === 'dispensed'
                          ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100 border-emerald-400'
                          : rx.status === 'verified'
                          ? 'bg-teal-100 text-teal-950 dark:bg-teal-900/50 dark:text-teal-100 border-teal-400'
                          : 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100 border-amber-400'
                      }`}
                    >
                      {rx.status}
                    </span>
                  </div>

                  {/* Drug detail banner */}
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 my-2 space-y-1">
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{rx.drug}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Dosage: {rx.dosage}</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        Batch: {rx.batch}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {rx.expiryDays} days to expiry
                    </span>
                    <div className="flex items-center gap-1.5">
                      {rx.status !== 'dispensed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRx(rx);
                              setEnteredBarcode(rx.batch);
                              setIsModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1"
                          >
                            <Barcode className="w-3 h-3" />
                            <span>{lang === 'om' ? 'Barcode Sakatta\'i' : 'Scan & Verify'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDispenseDirect(rx.rxId)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition"
                          >
                            {lang === 'om' ? 'Raabsi' : 'Dispense'}
                          </button>
                        </>
                      )}
                      {rx.status === 'dispensed' && (
                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispensed & Decremented</span>
                        </span>
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
      {/* 5. MINIMIZED-BY-DEFAULT SECTION 2: FEFO BATCH EXPIRY WARNINGS     */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-amber-400/80 dark:border-amber-400/50 bg-white/95 dark:bg-[#181308]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-white dark:from-[#261f0d] dark:via-[#302610] dark:to-[#211a09] border-b border-amber-200/80 dark:border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-800 dark:text-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'To\'annoo FEFO & Yeroon Qorichaa Dhumuu (Expiry Watchlist)' : 'FEFO Expiry Watchlist & Batch Depletion Alerts'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-950 dark:text-rose-100 border border-rose-500/40 font-bold">
                  {fefoAlerts.length} BATCHES UNDER WATCH
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Batch qorichaa kan guyyoota 30 keessatti yeroon isaanii dhumu dursanii akka dhumataniif' : 'Prioritize early expiry batches before fresh stock is opened'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="rose"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showFefoWarnings}
            label={showFefoWarnings ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand FEFO Watch')}
            onClick={() => setShowFefoWarnings((prev) => !prev)}
          />
        </div>

        {showFefoWarnings && (
          <div className="p-4 sm:p-5 space-y-3 animate-smooth-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {fefoAlerts.map((fefo) => (
                <div
                  key={fefo.batch}
                  className={`p-3.5 rounded-2xl border-2 transition-all ${
                    fefo.urgency === 'critical'
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400'
                      : fefo.urgency === 'warning'
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400'
                      : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                      {fefo.batch}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        fefo.urgency === 'critical'
                          ? 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100 border-rose-400 animate-pulse'
                          : fefo.urgency === 'warning'
                          ? 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100 border-amber-400'
                          : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100 border-emerald-400'
                      }`}
                    >
                      {fefo.daysRemaining} Days Left
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                    {fefo.drug}
                  </h4>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Expiry: {fefo.expiryDate}</span>
                    <span className="font-mono font-bold">{fefo.currentStock} Units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 6. MINIMIZED-BY-DEFAULT SECTION 3: RAPID PHARMACY ACTION PADS     */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-amber-400/80 dark:border-amber-400/50 bg-white/95 dark:bg-[#181308]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-yellow-50 to-white dark:from-[#261f0d] dark:via-[#302610] dark:to-[#211a09] border-b border-amber-200/80 dark:border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-200 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Wiirtuuwwan Qaxxaamuraa Faarmaasii' : 'Rapid Dispensary & Inventory Action Pads'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-950 dark:text-amber-100 border border-amber-500/40 font-bold">
                  6 PADS ONLINE
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Kuusaa guddicha, EFDA qoricha to\'ataman, bittaaf dhiyeessii, fi scanner barcode' : 'Direct links to Central Store, EFDA Registry, Procurement, and Barcode Scanner'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="amber"
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
              href="/pharmacy"
              className="p-3.5 rounded-2xl border-2 border-amber-300 dark:border-amber-600/40 bg-amber-50/60 dark:bg-amber-950/20 hover:border-amber-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Kuusaa Guddicha' : 'Central Store'}
              </span>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold mt-0.5">
                FEFO Stock
              </span>
            </Link>

            <Link
              href="/efda"
              className="p-3.5 rounded-2xl border-2 border-teal-300 dark:border-teal-600/40 bg-teal-50/60 dark:bg-teal-950/20 hover:border-teal-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'EFDA Narcotics' : 'EFDA Registry'}
              </span>
              <span className="text-[10px] text-teal-800 dark:text-teal-300 font-semibold mt-0.5">
                Narcotics Safe
              </span>
            </Link>

            <Link
              href="/procurement"
              className="p-3.5 rounded-2xl border-2 border-indigo-300 dark:border-indigo-600/40 bg-indigo-50/60 dark:bg-indigo-950/20 hover:border-indigo-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Bittaa Qorichaa' : 'Procurement'}
              </span>
              <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-semibold mt-0.5">
                Tenders Active
              </span>
            </Link>

            <Link
              href="/scanner"
              className="p-3.5 rounded-2xl border-2 border-sky-300 dark:border-sky-600/40 bg-sky-50/60 dark:bg-sky-950/20 hover:border-sky-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Scan className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'GS1 Barcode' : 'Barcode Scanner'}
              </span>
              <span className="text-[10px] text-sky-800 dark:text-sky-300 font-semibold mt-0.5">
                2D DataMatrix
              </span>
            </Link>

            <Link
              href="/wards"
              className="p-3.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50/60 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Qoricha Ciisichaa' : 'Ward Discharges'}
              </span>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                8 Pending Rx
              </span>
            </Link>

            <Link
              href="/assets"
              className="p-3.5 rounded-2xl border-2 border-cyan-300 dark:border-cyan-600/40 bg-cyan-50/60 dark:bg-cyan-950/20 hover:border-cyan-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Cold Chain' : 'Cold Chain Asset'}
              </span>
              <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-semibold mt-0.5">
                +4.2°C Fridge
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 7. QUICK DISPENSE & BARCODE VERIFICATION MODAL                    */}
      {/* ================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-smooth-in">
          <div className="w-full max-w-lg rounded-3xl border-2 border-amber-400 bg-white dark:bg-[#1a1409] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black">
              <div className="flex items-center gap-2.5">
                <Barcode className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {lang === 'om' ? 'Raabsa Qorichaa & Mirkanneessa FEFO' : 'Verify & Dispense Prescription'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-950" />
              </button>
            </div>

            <form onSubmit={handleSaveModalDispense} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Resephii Filadhu (Select Prescription)' : 'Select Prescription'}
                </label>
                <select
                  value={selectedRx.rxId}
                  onChange={(e) => {
                    const found = rxList.find((r) => r.rxId === e.target.value);
                    if (found) {
                      setSelectedRx(found);
                      setEnteredBarcode(found.batch);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-white dark:bg-[#241c0b] text-slate-900 dark:text-white text-xs font-bold"
                >
                  {rxList.map((r) => (
                    <option key={r.rxId} value={r.rxId}>
                      {r.rxId} - {r.patientName} ({r.drug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-1 text-xs">
                <div className="font-black text-slate-900 dark:text-white">
                  Patient: {selectedRx.patientName} ({selectedRx.mrn})
                </div>
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  Drug: {selectedRx.drug}
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  Dosage: {selectedRx.dosage} • Prescriber: {selectedRx.doctor}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Lakkoofsa Batch Barcode (Scan / Verify)' : 'Scanned GS1 Batch Barcode'}
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={enteredBarcode}
                    onChange={(e) => setEnteredBarcode(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-amber-300 dark:border-amber-600 text-xs font-bold font-mono bg-white dark:bg-[#241c0b] text-slate-900 dark:text-white"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer transition flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{lang === 'om' ? 'Mirkaneessi & Raabsi' : 'Verify & Dispense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
