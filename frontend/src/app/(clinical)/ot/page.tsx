/**
 * Operation Theatre (OT) Scheduling & CSSD Sterilization Management.
 * Mettu Karl Referral Hospital HMIS — Enterprise Healthcare Design System:
 * - Surgical table coordination and lead surgeon roster
 * - CSSD autoclave telemetry (134°C, 3.2 Bar, steam cycle timer)
 * - Surgical checklist & instrument batch tracking
 * - Full light & dark mode support
 * - Modern Lucide SVG icons
 */
'use client';

import React, { useState } from 'react';
import {
  Scissors,
  Activity,
  CheckCircle2,
  Clock,
  Thermometer,
  ShieldCheck,
  AlertCircle,
  Calendar,
  UserCheck,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Building2,
  Check,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';

interface SurgeryItem {
  code: string;
  room: string;
  patient: string;
  mrn: string;
  procedure: string;
  surgeon: string;
  anesthetist: string;
  time: string;
  status: 'in_surgery' | 'scheduled' | 'recovery';
}

const INITIAL_SURGERIES: SurgeryItem[] = [
  {
    code: 'SURG-010',
    room: 'OT Suite 1 (Major Trauma)',
    patient: 'Baye Tolera Daba',
    mrn: 'MKH-2026-000101',
    procedure: 'Emergency Exploratory Laparotomy & Peritonitis Washout',
    surgeon: 'Dr. Bekele Tadesse (General Surgeon)',
    anesthetist: 'Dr. Sisay Lemma (Lead Anesthetist)',
    time: '09:00 - 11:30',
    status: 'in_surgery',
  },
  {
    code: 'SURG-011',
    room: 'OT Suite 2 (Orthopedics)',
    patient: 'Hawine Dibaba Tola',
    mrn: 'MKH-2026-000102',
    procedure: 'Right Femur Fracture Open Reduction Internal Fixation (ORIF)',
    surgeon: 'Dr. Chala Gemechu (Orthopedic Surgeon)',
    anesthetist: 'Dr. Almaz Kassa (Anesthetist)',
    time: '11:00 - 14:00',
    status: 'scheduled',
  },
  {
    code: 'SURG-012',
    room: 'OT Suite 3 (Maternity/Obs)',
    patient: 'Lensa Duresa Hunde',
    mrn: 'MKH-2026-000103',
    procedure: 'Elective Caesarean Section (Twin Delivery C-Section)',
    surgeon: 'Dr. Helen Kassa (Obstetrician/Gynecologist)',
    anesthetist: 'Dr. Sisay Lemma (Lead Anesthetist)',
    time: '13:00 - 15:00',
    status: 'scheduled',
  },
];

export default function OTPage(): React.ReactElement {
  const { t, language } = useTranslation();
  const [surgeries, setSurgeries] = useState<SurgeryItem[]>(INITIAL_SURGERIES);

  const handleLogSterileBatch = () => {
    notifications.show({
      title: 'CSSD Log Created',
      message: 'Sterile Instrument Tray Set #CSSD-4091 logged and verified.',
      color: 'teal',
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 shadow-xs shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{t('ot_cssd')}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Surgical Suite & CSSD Hub</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Operating Table Management • Anesthesia Machine Safety Checks • 134°C Autoclave Sterile Instrument Tracking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                4 Active Operating Suites
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Active in Surgery
                </span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">1 Active Case</p>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">Suite 1: Dr. Bekele Tadesse</p>
            </div>

            <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-white dark:bg-slate-900 p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  Scheduled Today
                </span>
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-sky-700 dark:text-sky-400">6 Surgeries</p>
              <p className="mt-1 text-xs text-sky-600 dark:text-sky-400 font-medium">2 Ortho • 2 C-Section • 2 General</p>
            </div>

            <div className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-white dark:bg-slate-900 p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  CSSD Sterile Instrument Trays
                </span>
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-teal-700 dark:text-teal-400">48 Packs Ready</p>
              <p className="mt-1 text-xs text-teal-600 dark:text-teal-400 font-medium">134°C Autoclave test validated</p>
            </div>
          </div>

          {/* Operating Theater Schedule & CSSD Autoclaves */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Surgery Schedule Cards */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Today&apos;s Operating Theatre Surgical Table
                </h3>
                <span className="font-mono text-xs text-slate-400">{surgeries.length} Slotted Cases</span>
              </div>

              <div className="space-y-3">
                {surgeries.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm hover:border-teal-400/60 transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{s.room}</span>
                        <span className="font-mono text-xs text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 font-bold">
                          {s.code}
                        </span>
                      </div>
                      {s.status === 'in_surgery' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-1 text-[10.5px] font-bold text-rose-700 dark:text-rose-300 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>IN SURGERY</span>
                        </span>
                      )}
                      {s.status === 'scheduled' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-3 py-1 text-[10.5px] font-bold text-sky-700 dark:text-sky-300">
                          <Clock className="w-3 h-3" />
                          <span>SCHEDULED</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Surgical Procedure:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{s.procedure}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Lead Surgeon:</span>
                        <span className="font-semibold text-teal-700 dark:text-teal-400">{s.surgeon}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Patient / MRN:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {s.patient} ({s.mrn})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Scheduled Operating Window:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{s.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CSSD Sterilizer Hub */}
            <div className="rounded-xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>CSSD Autoclave Telemetry</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">134°C Cycle</span>
                </div>

                <div className="mt-3 space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Autoclave Unit #1 (Tuttnauer Steam)
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        134°C • 3.2 Bar
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sterilizing 6 Laparotomy Sets • 18 min remaining in plateau phase
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Autoclave Unit #2 (Hospital Standby)
                      </span>
                      <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
                        Ready / Standby
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pre-loaded with 4 Orthopedic Drill Packs & Biological Vials
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogSterileBatch}
                  className="w-full h-10 rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-xs font-semibold text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Sterile Instrument Tray Batch</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
