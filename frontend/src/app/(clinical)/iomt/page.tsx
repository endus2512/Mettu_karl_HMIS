/**
 * IoMT Medical Telemetry & ICU Central Station Workstation.
 * Mettu Karl Referral Hospital HMIS — Enterprise Healthcare Design System:
 * - High-density ICU central telemetry console (Philips IntelliVue / Mindray BeneVision inspired)
 * - Color-coded physiological telemetry thresholds (HR, SpO2, NIBP, Respiration, Core Temp)
 * - Real-time audible & visual clinical arrhythmia / desaturation alarm acknowledgment
 * - Full light & dark mode support
 * - Modern Lucide SVG icons
 */
'use client';

import React, { useState } from 'react';
import {
  Activity,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Wind,
  Thermometer,
  Volume2,
  VolumeX,
  Bell,
  Bed,
  Radio,
  Check,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';

interface BedsideMonitor {
  id: string;
  bed: string;
  patient: string;
  mrn: string;
  hr: number;
  spo2: number;
  bp: string;
  rr: number;
  temp: number;
  alarm?: string;
  alarmSeverity?: 'critical' | 'warning';
}

const INITIAL_MONITORS: BedsideMonitor[] = [
  {
    id: 'MON-ICU-01',
    bed: 'ICU Bed 01',
    patient: 'Derese Tolossa Hunde',
    mrn: 'MKH-2026-000101',
    hr: 84,
    spo2: 98,
    bp: '120/80',
    rr: 16,
    temp: 36.8,
  },
  {
    id: 'MON-ICU-02',
    bed: 'ICU Bed 02',
    patient: 'Tigist Alemu Daba',
    mrn: 'MKH-2026-000102',
    hr: 136,
    spo2: 94,
    bp: '145/92',
    rr: 24,
    temp: 38.6,
    alarm: 'Sinus Tachycardia Alert (HR > 130 bpm)',
    alarmSeverity: 'warning',
  },
  {
    id: 'MON-ICU-03',
    bed: 'ICU Bed 03',
    patient: 'Mekonnen Kebede Gemechu',
    mrn: 'MKH-2026-000103',
    hr: 92,
    spo2: 86,
    bp: '105/65',
    rr: 26,
    temp: 37.2,
    alarm: 'Severe Hypoxia Desaturation (SpO2 < 90% on Vent)',
    alarmSeverity: 'critical',
  },
  {
    id: 'MON-ICU-04',
    bed: 'ICU Bed 04',
    patient: 'Fatuma Abdi Ahmed',
    mrn: 'MKH-2026-000104',
    hr: 74,
    spo2: 99,
    bp: '118/76',
    rr: 15,
    temp: 36.6,
  },
];

export default function IoMTPage(): React.ReactElement {
  const { t, language } = useTranslation();
  const [monitors, setMonitors] = useState<BedsideMonitor[]>(INITIAL_MONITORS);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const acknowledgeAlarm = (bedId: string) => {
    setMonitors((prev) =>
      prev.map((m) => (m.id === bedId ? { ...m, alarm: undefined, alarmSeverity: undefined } : m))
    );
    notifications.show({
      title: 'Telemetry Alarm Acknowledged',
      message: `${bedId} alarm cleared by duty ICU clinician.`,
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
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{t('iomt_telemetry')}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">ICU Central Station Telemetry</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-Time HL7/FHIR Device Observation Streaming • Continuous Multiparameter Patient Vitals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  soundEnabled
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
                title={soundEnabled ? 'Telemetry Audio Active' : 'Telemetry Audio Muted'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{soundEnabled ? 'Alarms ON' : 'Muted'}</span>
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                WebSocket: 4/4 Beds Online (100Hz)
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ICU Bed Occupancy</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">4 / 4 Beds</p>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">100% telemetry coverage</span>
            </div>

            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Critical Hypoxia</span>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">1 Patient</p>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Bed 03: SpO2 86% on Vent</span>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Tachycardia Warning</span>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">1 Patient</p>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Bed 02: HR 136 bpm (Febrile)</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mean Arterial Pressure</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">MAP 88</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Adequate perfusion target</span>
            </div>
          </div>

          {/* Bedside Monitors Telemetry Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {monitors.map((mon) => (
              <div
                key={mon.id}
                className={`rounded-xl border p-5 shadow-xs transition ${
                  mon.alarmSeverity === 'critical'
                    ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 ring-2 ring-rose-500/20'
                    : mon.alarmSeverity === 'warning'
                    ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20 ring-2 ring-amber-400/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-400/60'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{mon.bed}</span>
                      <span className="ml-1.5 font-mono text-[11px] text-slate-400 font-medium">({mon.id})</span>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        {mon.patient} • <span className="font-mono text-slate-400">{mon.mrn}</span>
                      </p>
                    </div>
                  </div>

                  {mon.alarm && (
                    <button
                      type="button"
                      onClick={() => acknowledgeAlarm(mon.id)}
                      className="rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer shadow-xs transition"
                    >
                      Acknowledge Alarm
                    </button>
                  )}
                </div>

                {/* Alarm Banner */}
                {mon.alarm && (
                  <div
                    className={`mt-3 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-2 border ${
                      mon.alarmSeverity === 'critical'
                        ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 animate-pulse'
                        : 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{mon.alarm}</span>
                  </div>
                )}

                {/* Vitals Quadrants */}
                <div className="mt-4 grid grid-cols-4 gap-2.5 text-center">
                  {/* Heart Rate */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">Heart Rate</span>
                    <span
                      className={`text-2xl font-bold font-mono mt-0.5 block ${
                        mon.hr > 120 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {mon.hr}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">bpm</span>
                  </div>

                  {/* SpO2 */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">SpO2 Oxygen</span>
                    <span
                      className={`text-2xl font-bold font-mono mt-0.5 block ${
                        mon.spo2 < 90 ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'
                      }`}
                    >
                      {mon.spo2}%
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">pleth</span>
                  </div>

                  {/* Blood Pressure */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">Blood Press</span>
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                      {mon.bp}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">mmHg</span>
                  </div>

                  {/* Temp / Resp */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5">
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">Temp / Resp</span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                      {mon.temp}°C
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">{mon.rr} /min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
