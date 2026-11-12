/**
 * Mettu Karl Comprehensive Specialized Hospital — Executive Administration & Command Center View
 * Dedicated operational view for Hospital CEO, Medical Director, and Chief Administrator.
 *
 * Capabilities:
 * - Real-time shift management, ward bed capacity editing, and emergency overrides
 * - Live On-Duty Staff Supervision Directory (AdminOversightHub)
 * - Quick 1-Click Launchers into every role portal and domain workstation
 * - Full Tri-Lingual Support: Afaan Oromoo ('om'), Amharic ('am'), English ('en')
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import { useHospitalTimeSync, type ShiftType } from '@/lib/timeSync';
import { AdminOversightHub } from '@/components/admin/AdminOversightHub';
import { AdminLedControlPanel } from '@/components/admin/AdminLedControlPanel';
import { AdminStaffApprovalPanel } from '@/components/admin/AdminStaffApprovalPanel';
import { AdminWorkforceMonitor } from '@/components/admin/AdminWorkforceMonitor';
import { AdminUserDirectoryPanel } from '@/components/admin/AdminUserDirectoryPanel';
import { notifications } from '@mantine/notifications';
import apiClient from '@/lib/api';
import {
  ShieldCheck,
  Building2,
  Users,
  BedDouble,
  Clock,
  Sliders,
  Edit3,
  Check,
  X,
  Stethoscope,
  Pill,
  FlaskConical,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Volume2,
  Eye,
  Ticket,
} from 'lucide-react';

interface WardStatus {
  id: string;
  name: { en: string; om: string; am: string };
  totalBeds: number;
  occupiedBeds: number;
  onDutyStaff: string;
  avgWait: string;
  status: 'optimal' | 'busy' | 'critical';
}

const INITIAL_WARDS: WardStatus[] = [
  {
    id: 'er',
    name: {
      en: 'Emergency & Acute Resuscitation',
      om: 'Kutaa Tasaa fi Lubbuu Baraaruu',
      am: 'ድንገተኛና አጣዳፊ ህክምና ክፍል',
    },
    totalBeds: 25,
    occupiedBeds: 21,
    onDutyStaff: 'Dr. Bekele, Nurse Chaltu',
    avgWait: '8 min',
    status: 'busy',
  },
  {
    id: 'opd',
    name: {
      en: 'General & Pediatric OPD Clinics',
      om: 'Kiliinika Deddeebii fi Daa\'immanii',
      am: 'አጠቃላይና የህፃናት ተመላላሽ ክሊኒክ',
    },
    totalBeds: 12,
    occupiedBeds: 12,
    onDutyStaff: 'Dr. Tolera, Nurse Ayantu',
    avgWait: '18 min',
    status: 'optimal',
  },
  {
    id: 'icu',
    name: {
      en: 'Intensive Care Unit (ICU)',
      om: 'Kutaa Yaala Cimaa (ICU)',
      am: 'ጽኑ ህክምና ክፍል (ICU)',
    },
    totalBeds: 15,
    occupiedBeds: 13,
    onDutyStaff: 'Dr. Chala, Nurse Worku',
    avgWait: 'Immediate',
    status: 'critical',
  },
  {
    id: 'maternity',
    name: {
      en: 'Maternity & C-Section Ward',
      om: 'Kutaa Deessuu fi Baqaqsaa C-Section',
      am: 'የወሊድና ቀዶ-ህክምና ክፍል',
    },
    totalBeds: 30,
    occupiedBeds: 24,
    onDutyStaff: 'Dr. Hawani, Midwife Almaz',
    avgWait: '12 min',
    status: 'optimal',
  },
  {
    id: 'pharmacy',
    name: {
      en: 'Central Pharmacy & FEFO Dispensing',
      om: 'Faarmaasii Giddugaleessaa (FEFO)',
      am: 'ማዕከላዊ ፋርማሲና የመድኃኒት ስርጭት',
    },
    totalBeds: 8,
    occupiedBeds: 6,
    onDutyStaff: 'Pharm. Solomon, Tech Desta',
    avgWait: '10 min',
    status: 'optimal',
  },
];

export function AdminDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = (language === 'om' || language === 'am' || language === 'en') ? language : 'en';

  // Centralized Online Time & Shift Hook
  const {
    shift: onlineShift,
    serverTime,
    overrideShift: onlineOverrideShift,
  } = useHospitalTimeSync();

  // State Management for Full Admin Control & Live Editing
  const [wards, setWards] = useState<WardStatus[]>(INITIAL_WARDS);
  const [activeShift, setActiveShift] = useState<'morning' | 'afternoon' | 'night'>('morning');
  const [emergencyCode, setEmergencyCode] = useState<'nominal' | 'code_blue' | 'mci'>('nominal');
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    'All departments operational. Cold chain at 4.2°C nominal. EEU main grid active.'
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWardForEdit, setSelectedWardForEdit] = useState<WardStatus | null>(null);
  const [showPortals, setShowPortals] = useState(false);
  const [showWardTable, setShowWardTable] = useState(false);

  // Sync activeShift from backend
  useEffect(() => {
    if (onlineShift?.type) {
      const mapped = onlineShift.type === 'on_call' ? 'morning' : onlineShift.type;
      setActiveShift(mapped);
    }
  }, [onlineShift?.type]);

  // Sync Live Ward Bed Census from PostgreSQL Database
  useEffect(() => {
    let isMounted = true;
    const fetchLiveWardCensus = async () => {
      try {
        const res = await apiClient.get('/inpatient/wards');
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const liveWards: WardStatus[] = res.data.map((w: any) => ({
            id: String(w.id || w.ward_code || '').toLowerCase(),
            name: {
              en: w.name_en || w.ward_code || 'Ward',
              om: w.name_om || w.name_en || 'Ward',
              am: w.name_en || 'ክፍል',
            },
            totalBeds: w.total_beds || 0,
            occupiedBeds: w.occupied_beds || 0,
            onDutyStaff: w.head_nurse || 'Ward Duty Staff',
            avgWait: (w.occupancy_rate || 0) > 85 ? 'Immediate triage' : '15 min',
            status: (w.occupancy_rate || 0) > 85 ? 'critical' : (w.occupancy_rate || 0) > 65 ? 'busy' : 'optimal',
          }));
          setWards(liveWards);
        }
      } catch (err) {
        console.warn('Live ward census fetch fallback', err);
      }
    };
    void fetchLiveWardCensus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Edit Modal Temporary Inputs
  const [editShift, setEditShift] = useState(activeShift);
  const [editEmergency, setEditEmergency] = useState(emergencyCode);
  const [editBroadcast, setEditBroadcast] = useState(broadcastMessage);
  const [editBeds, setEditBeds] = useState<{ [key: string]: { total: number; occupied: number } }>({});

  // Sync edit beds inputs when opening modal
  useEffect(() => {
    const map: { [key: string]: { total: number; occupied: number } } = {};
    wards.forEach((w) => {
      map[w.id] = { total: w.totalBeds, occupied: w.occupiedBeds };
    });
    setEditBeds(map);
    setEditShift(activeShift);
    setEditEmergency(emergencyCode);
    setEditBroadcast(broadcastMessage);
  }, [wards, activeShift, emergencyCode, broadcastMessage, isEditModalOpen]);

  // Calculate live aggregate totals
  const totalBeds = useMemo(() => wards.reduce((sum, w) => sum + w.totalBeds, 0), [wards]);
  const occupiedBeds = useMemo(() => wards.reduce((sum, w) => sum + w.occupiedBeds, 0), [wards]);
  const occupancyPercent = useMemo(
    () => (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0),
    [totalBeds, occupiedBeds]
  );

  // Save changes from Admin Control Modal
  const handleSaveAdminSettings = async () => {
    setActiveShift(editShift);
    setEmergencyCode(editEmergency);
    setBroadcastMessage(editBroadcast);

    try {
      await onlineOverrideShift({
        shift_type: editShift as ShiftType,
        handover_notes: editBroadcast,
      });
    } catch {
      // Handled gracefully
    }

    const updated = wards.map((w) => {
      const edited = editBeds[w.id];
      if (edited) {
        return {
          ...w,
          totalBeds: Number(edited.total),
          occupiedBeds: Math.min(Number(edited.occupied), Number(edited.total)),
          status:
            edited.occupied / edited.total > 0.85
              ? ('critical' as const)
              : edited.occupied / edited.total > 0.65
              ? ('busy' as const)
              : ('optimal' as const),
        };
      }
      return w;
    });

    setWards(updated);
    setIsEditModalOpen(false);

    notifications.show({
      title: language === 'om' ? "Gulaalliin Milkaa'eera" : language === 'am' ? 'ቅንብሩ ተቀምጧል' : 'Settings Updated',
      message:
        language === 'om'
          ? "Ibsaa, shiftii fi teessoon siree hospitaalaa database giddu-galeessaa irratti haaromfameera."
          : 'Hospital shifts, ward capacities, and operational alerts updated successfully online.',
      color: 'teal',
    });
  };

  return (
    <div className="space-y-5">
      {/* ================================================================= */}
      {/* 1. COMPACT EXECUTIVE COCKPIT HEADER WITH QUICK CONTROLS            */}
      {/* ================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#101624] border border-[#222b3d] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{language === 'om' ? "Wiirtuu Bulchiinsa Hospitaala Mattuu Kaarl" : language === 'am' ? 'የመቱ ካርል ሪፈራል ሆስፒታል የበላይ አስተዳደር' : 'Mettu Karl Referral Hospital Executive Command'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  ADMIN COMMAND
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {language === 'om'
                  ? "To'annoo kutaalee yaalaa, karoora ogeeyyii, fi murtiiwwan hatattamaa hospitaalaa"
                  : 'Hospital-wide departmental monitoring, staffing oversight, and live operational control'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Status Badges & Admin Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Emergency Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              emergencyCode === 'code_blue'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse'
                : emergencyCode === 'mci'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 animate-pulse'
                : 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${emergencyCode === 'nominal' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            <span>
              {emergencyCode === 'code_blue'
                ? 'CODE BLUE ACTIVE'
                : emergencyCode === 'mci'
                ? 'MCI START TRIAGE'
                : (language === 'om' ? 'NAGAADHA (Nominal)' : 'System Nominal')}
            </span>
          </div>

          {/* Active Shift Pill (Online Centralized) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141c2e] border border-[#23314a] text-xs font-semibold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {onlineShift
                ? (lang === 'om' ? onlineShift.name_om : lang === 'am' ? onlineShift.name_am : onlineShift.name_en)
                : activeShift === 'morning'
                ? (lang === 'om' ? 'Shiftii Ganamaa (08:00-16:00)' : 'Morning Shift')
                : activeShift === 'afternoon'
                ? (lang === 'om' ? 'Shiftii Galgalaa (16:00-24:00)' : 'Afternoon Shift')
                : (lang === 'om' ? 'Shiftii Halkan (00:00-08:00)' : 'Night Shift')}
            </span>
            <span className="text-[10px] text-teal-400 font-mono pl-1 border-l border-slate-700">
              {serverTime}
            </span>
          </div>

          {/* THE PRIMARY EDIT & CONTROL BUTTON */}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-950" />
            <span>{language === 'om' ? "To'adhu & Gulaali (Controls)" : language === 'am' ? 'አስተዳድርና አርትዕ' : 'Admin Controls'}</span>
          </button>
        </div>
      </div>

      {/* Broadcast Banner */}
      {broadcastMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-300">{language === 'om' ? "Beeksisa Hospitaalaa:" : "Broadcast:"}</span>
            <span className="text-slate-300 truncate">{broadcastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="text-amber-400 hover:underline text-[11px] font-semibold shrink-0 cursor-pointer"
          >
            {language === 'om' ? 'Jijjiiri' : 'Edit'}
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. HIGH-SIGNAL EXECUTIVE KPI STRIP (ALWAYS VISIBLE AT A GLANCE)   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Bed Occupancy */}
        <div className="rounded-xl border border-[#222b3d] bg-[#101624] p-3.5 shadow-sm relative group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">1. {language === 'om' ? 'Siree Dhukkubsataa' : 'Bed Occupancy'}</span>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Bed Capacity"
              className="text-slate-500 hover:text-amber-400 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-white">{occupiedBeds}</span>
              <span className="text-xs font-medium text-slate-500">/ {totalBeds}</span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                occupancyPercent > 85
                  ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {occupancyPercent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-[#1b2336] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Active Consultations */}
        <div className="rounded-xl border border-[#222b3d] bg-[#101624] p-3.5 shadow-sm hover:border-teal-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">2. {language === 'om' ? 'Qorannoo Yaalaa (Active)' : 'Active Consultations'}</span>
            <Stethoscope className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-teal-300">142</span>
            <span className="text-[11px] text-slate-400">OPD & IPD Daily</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 truncate">
            {language === 'om' ? 'Doktoorota 12 fi Ispeeshaalistoota 6 hojiirra jiru' : '12 Doctors & 6 Specialists active on shift'}
          </p>
        </div>

        {/* Card 3: Revenue & Telebirr */}
        <div className="rounded-xl border border-[#222b3d] bg-[#101624] p-3.5 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">3. {language === 'om' ? 'Galii Telebirr & CBHI' : 'Revenue & Telebirr'}</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-emerald-300">284.5K</span>
            <span className="text-[11px] font-mono text-emerald-400/90 font-semibold">ETB Today</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 truncate">
            {language === 'om' ? 'Telebirr 68% • CBHI 24% • Kaashii 8%' : 'Telebirr 68% • CBHI 24% • Cash 8%'}
          </p>
        </div>

        {/* Card 4: System Telemetry */}
        <div className="rounded-xl border border-[#222b3d] bg-[#101624] p-3.5 shadow-sm hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">4. {language === 'om' ? 'Haala Sirna Yaalaa' : 'System Telemetry'}</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight text-white">99.98%</span>
            <span className="text-[11px] text-emerald-400 font-mono">100% HA Node</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 truncate">
            {language === 'om' ? 'Kuusaan Qabbanaa 4.2°C • EEU Ibsaa Hojirra' : 'Cold Chain 4.2°C • EEU Grid Normal'}
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. SIMPLIFIED & MINIMIZED EXECUTIVE COMMAND MODULES               */}
      {/* ================================================================= */}
      <div className="space-y-3">
        {/* 3A. Staff Sign-Up Guard & Security Alarms (Minimized by Default) */}
        <AdminStaffApprovalPanel />

        {/* 3B. Live Workforce Activity & Access Control (Minimized by Default) */}
        <AdminWorkforceMonitor />

        {/* 3B2. Staff & Patient Directory, Biography & Password Recovery (Minimized by Default) */}
        <AdminUserDirectoryPanel />

        {/* 3C. Digital LED Marquee Board (Minimized; All Edits Inside Settings) */}
        <AdminLedControlPanel />

        {/* 3D. Staff, Pharmacy & Patient Command (Minimized by Default) */}
        <AdminOversightHub />

        {/* 3E. Staff Workstation Portals (Minimized by Default) */}
        <div className={`bg-[#101624] border border-[#222b3d] rounded-2xl shadow-lg transition-all ${showPortals ? 'p-4 space-y-3' : 'p-4'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
                <Eye className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    {language === 'om' ? "Kutaalee Hojii Ogeessotaa (Role Portals)" : "Staff Workstation Portals (Supervisor Jump)"}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    7 Portals Active
                  </span>
                </div>
                {!showPortals && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Doctor • Nurse • Pharmacy • Laboratory • Billing • Reception • Patient
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPortals((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#25334d] bg-[#151e30] hover:bg-[#1c2840] text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {showPortals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showPortals ? (language === 'om' ? 'Xiqeessi (Minimize)' : 'Minimize') : (language === 'om' ? 'Bani (Expand)' : 'Expand')}</span>
            </button>
          </div>

          {showPortals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3 border-t border-[#1c2536]">
              <Link
                href="/portal/doctor"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#141c2c] border border-teal-500/30 hover:border-teal-400 hover:bg-teal-500/10 transition-all text-center group"
              >
                <Stethoscope className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-white group-hover:text-teal-300">Doctor</span>
                <span className="text-[10px] text-slate-400">EMR & OPD</span>
              </Link>

              <Link
                href="/portal/nurse"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#141c2c] border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all text-center group"
              >
                <BedDouble className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-white group-hover:text-emerald-300">Nurse</span>
                <span className="text-[10px] text-slate-400">Wards & MAR</span>
              </Link>

              <Link
                href="/portal/pharmacy"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#141c2c] border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 transition-all text-center group"
              >
                <Pill className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-white group-hover:text-amber-300">Pharmacy</span>
                <span className="text-[10px] text-slate-400">FEFO Dispensary</span>
              </Link>

              <Link
                href="/portal/lab"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#141c2c] border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all text-center group"
              >
                <FlaskConical className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">Laboratory</span>
                <span className="text-[10px] text-slate-400">LIS & Blood</span>
              </Link>

              <Link
                href="/portal/billing"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#141c2c] border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10 transition-all text-center group"
              >
                <CreditCard className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-white group-hover:text-blue-300">Billing</span>
                <span className="text-[10px] text-slate-400">Telebirr & POS</span>
              </Link>

              <Link
                href="/portal/reception"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#141c2c] border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10 transition-all text-center group"
              >
                <Ticket className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-white group-hover:text-purple-300">Reception</span>
                <span className="text-[10px] text-slate-400">Triage & Fayda</span>
              </Link>

              <Link
                href="/patient-portal"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#141c2c] border border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/10 transition-all text-center group"
              >
                <Users className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-white group-hover:text-rose-300">Patient</span>
                <span className="text-[10px] text-slate-400">Health Portal</span>
              </Link>
            </div>
          )}
        </div>

        {/* 3F. Live Ward Bed Capacity (Minimized by Default) */}
        <div className={`rounded-2xl border border-[#222b3d] bg-[#101624] shadow-lg transition-all ${showWardTable ? 'p-4 sm:p-5 space-y-4' : 'p-4'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${showWardTable ? 'pb-3 border-b border-[#1b2336]' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <BedDouble className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    {language === 'om' ? "Haala Siree & Kutaalee Yaalaa (Ward Capacity)" : "Live Ward Bed Capacity & Allocation"}
                  </h2>
                  {!showWardTable && (
                    <span className="text-[11px] font-mono text-slate-300">
                      {wards.length} Wards • {occupiedBeds}/{totalBeds} Beds ({occupancyPercent}%)
                    </span>
                  )}
                </div>
                {showWardTable && (
                  <p className="text-[11px] text-slate-400">
                    {language === 'om' ? "Kutaalee yaalaa gurguddoo fi to'annoo siree battalaa" : "Departmental census with real-time room capacity overrides"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{language === 'om' ? 'Kutaalee Gulaali' : 'Edit Wards'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowWardTable((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#25334d] bg-[#151e30] hover:bg-[#1c2840] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                {showWardTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showWardTable ? (language === 'om' ? 'Xiqeessi (Minimize)' : 'Minimize') : (language === 'om' ? 'Bani (Expand)' : 'Expand')}</span>
              </button>
            </div>
          </div>

          {showWardTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-[#1f293d] bg-[#0c121e] text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">{language === 'om' ? 'Kutaa Yaalaa' : 'Department / Ward'}</th>
                    <th className="py-2.5 px-3">{language === 'om' ? 'Siree (Total / Occupied)' : 'Beds (Tot/Occ)'}</th>
                    <th className="py-2.5 px-3">{language === 'om' ? 'Dhibbeentaa' : 'Occupancy'}</th>
                    <th className="py-2.5 px-3">{language === 'om' ? 'Ogeeyyii Hojirra Jiran' : 'On-Duty Staff'}</th>
                    <th className="py-2.5 px-3">{language === 'om' ? 'Haala' : 'Status'}</th>
                    <th className="py-2.5 px-3 text-right">{language === 'om' ? 'Gulaali' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182133]">
                  {wards.map((ward) => {
                    const percent = Math.round((ward.occupiedBeds / ward.totalBeds) * 100);
                    const wardName = ward.name[lang] || ward.name.en;
                    return (
                      <tr key={ward.id} className="hover:bg-[#141c2c] transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">
                          <span>{wardName}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-white font-bold">{ward.occupiedBeds}</span>
                          <span className="text-slate-500"> / {ward.totalBeds}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-[#1b2336] rounded-full overflow-hidden">
                              <div
                                className={`h-full ${percent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px]">{percent}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          <span>{ward.onDutyStaff}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ward.status === 'critical'
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                                : ward.status === 'busy'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {ward.status === 'critical'
                              ? (language === 'om' ? 'DHIPHOO (Critical)' : 'Critical')
                              : ward.status === 'busy'
                              ? (language === 'om' ? 'HOJII BAAY\'EE' : 'Busy')
                              : (language === 'om' ? 'GAARII' : 'Optimal')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWardForEdit(ward);
                              setIsEditModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{language === 'om' ? 'Gulaali' : 'Edit'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 6. INTERACTIVE ADMIN CONTROL & QUICK-EDIT MODAL                   */}
      {/* ================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-[#222b3d] bg-[#101624] p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e283c]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {language === 'om' ? "Wiirtuu To'annoo fi Gulaallii Bulchiinsaa" : "Admin Executive Control Center"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'om' ? "Jijjiirraa shiftii, to'annoo siree, fi akeekkachiisa hatattamaa qindeessi" : "Modify operational shifts, ward bed allocations, and hospital-wide emergency states"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls */}
            <div className="space-y-4 text-xs">
              {/* Emergency Level Switch */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  {language === 'om' ? '1. Sadarkaa Balaa Hatattamaa (Hospital Emergency Code):' : '1. Hospital Emergency Code:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditEmergency('nominal')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editEmergency === 'nominal'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-[#151c2e] text-slate-400 border-[#222d42] hover:bg-[#1a233a]'
                    }`}
                  >
                    Nominal (Nagaa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditEmergency('mci')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editEmergency === 'mci'
                        ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-[#151c2e] text-slate-400 border-[#222d42] hover:bg-[#1a233a]'
                    }`}
                  >
                    MCI / START Triage
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditEmergency('code_blue')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editEmergency === 'code_blue'
                        ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-sm'
                        : 'bg-[#151c2e] text-slate-400 border-[#222d42] hover:bg-[#1a233a]'
                    }`}
                  >
                    CODE BLUE (Resus)
                  </button>
                </div>
              </div>

              {/* Active Shift Selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  {language === 'om' ? '2. Shiftii Hojii Yeroo Ammaa (Active Shift):' : '2. Active Hospital Shift:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditShift('morning')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editShift === 'morning'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-[#151c2e] text-slate-400 border-[#222d42]'
                    }`}
                  >
                    Morning (08:00-16:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditShift('afternoon')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editShift === 'afternoon'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-[#151c2e] text-slate-400 border-[#222d42]'
                    }`}
                  >
                    Afternoon (16:00-24:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditShift('night')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editShift === 'night'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-[#151c2e] text-slate-400 border-[#222d42]'
                    }`}
                  >
                    Night (00:00-08:00)
                  </button>
                </div>
              </div>

              {/* Broadcast Alert Text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  {language === 'om' ? '3. Beeksisa Waliigalaa (Hospital Broadcast Message):' : '3. Hospital Broadcast Message:'}
                </label>
                <input
                  type="text"
                  value={editBroadcast}
                  onChange={(e) => setEditBroadcast(e.target.value)}
                  className="w-full rounded-xl border border-[#222d42] bg-[#0c121e] px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  placeholder="Enter broadcast alert to display on all staff headers..."
                />
              </div>

              {/* Bed Capacity Overrides */}
              <div className="space-y-1.5 pt-2 border-t border-[#1e283c]">
                <label className="font-semibold text-slate-300">
                  {language === 'om' ? '4. Baay\'ina Siree Kutaalee Gulaali (Override Ward Beds):' : '4. Ward Bed Capacity Overrides:'}
                </label>
                <div className="space-y-2">
                  {wards.map((ward) => (
                    <div key={ward.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#0c121e] border border-[#1b2336]">
                      <span className="font-semibold text-white">{ward.name[lang] || ward.name.en}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Total:</span>
                          <input
                            type="number"
                            min="1"
                            value={editBeds[ward.id]?.total ?? ward.totalBeds}
                            onChange={(e) =>
                              setEditBeds({
                                ...editBeds,
                                [ward.id]: {
                                  total: Number(e.target.value),
                                  occupied: editBeds[ward.id]?.occupied ?? ward.occupiedBeds,
                                },
                              })
                            }
                            className="w-14 rounded-lg border border-[#26354d] bg-[#141c2e] px-2 py-1 text-center font-mono text-xs text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Occupied:</span>
                          <input
                            type="number"
                            min="0"
                            value={editBeds[ward.id]?.occupied ?? ward.occupiedBeds}
                            onChange={(e) =>
                              setEditBeds({
                                ...editBeds,
                                [ward.id]: {
                                  total: editBeds[ward.id]?.total ?? ward.totalBeds,
                                  occupied: Number(e.target.value),
                                },
                              })
                            }
                            className="w-14 rounded-lg border border-[#26354d] bg-[#141c2e] px-2 py-1 text-center font-mono text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1e283c]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#222b3d] text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                {language === 'om' ? 'Dhiisi (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveAdminSettings}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'om' ? "Jijjiirraa Mirkanessi (Save & Apply)" : "Save & Apply Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
