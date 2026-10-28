/**
 * IoMT Medical Telemetry & ICU Central Station Workstation.
 * Bedside vital monitor telemetry with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

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

const initialMonitors: BedsideMonitor[] = [
  { id: 'MON-ICU-01', bed: 'ICU Bed 01', patient: 'Derese Tolossa', mrn: 'MKH-2026-000101', hr: 84, spo2: 98, bp: '120/80', rr: 16, temp: 36.8 },
  { id: 'MON-ICU-02', bed: 'ICU Bed 02', patient: 'Tigist Alemu', mrn: 'MKH-2026-000102', hr: 136, spo2: 94, bp: '145/92', rr: 24, temp: 38.6, alarm: 'Tachycardia Detected (HR > 130)', alarmSeverity: 'warning' },
  { id: 'MON-ICU-03', bed: 'ICU Bed 03', patient: 'Mekonnen Kebede', mrn: 'MKH-2026-000103', hr: 92, spo2: 86, bp: '105/65', rr: 26, temp: 37.2, alarm: 'Severe Hypoxia Alert (SpO2 < 90%)', alarmSeverity: 'critical' },
  { id: 'MON-ICU-04', bed: 'ICU Bed 04', patient: 'Fatuma Abdi', mrn: 'MKH-2026-000104', hr: 74, spo2: 99, bp: '118/76', rr: 15, temp: 36.6 },
];

export default function IoMTPage(): React.ReactElement {
  const { t } = useTranslation();
  const [monitors, setMonitors] = useState<BedsideMonitor[]>(initialMonitors);

  const acknowledgeAlarm = (bedId: string) => {
    setMonitors((prev) =>
      prev.map((m) => (m.id === bedId ? { ...m, alarm: undefined, alarmSeverity: undefined } : m))
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header Bar with Rectangular Responsive Spotlight */}
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  📡
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('iomt_telemetry')} • ICU Central Station & Bedside Telemetry
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Real-time HL7/FHIR Device Observation Streaming • Vital Signs Alert CDSS • Automatic Desaturation Alarms
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                WebSocket: 4/4 Beds Online (100Hz)
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ICU Bed Occupancy</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">4 / 4 Beds</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">100% telemetry coverage</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Critical Hypoxia</span>
              <p className="mt-2 text-3xl font-black text-rose-600 group-hover:text-rose-950 transition-colors">1 Patient</p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">Bed 03: SpO2 86% on Vent</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Tachycardia Warning</span>
              <p className="mt-2 text-3xl font-black text-amber-700 group-hover:text-amber-950 transition-colors">1 Patient</p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">Bed 02: HR 136 bpm (Febrile)</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mean Arterial Pressure</span>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">MAP 88</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Adequate end-organ perfusion</p>
            </div>
          </div>

          {/* Bedside Monitors Telemetry Grid (Floating Rectangular Spotlight Cards) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {monitors.map((mon) => (
              <div
                key={mon.id}
                className={`group rounded-3xl border-2 p-6 shadow-xs transition-all duration-200 cursor-pointer transform hover:-translate-y-1 ${
                  mon.alarmSeverity === 'critical'
                    ? 'border-rose-500 bg-rose-50/40 ring-4 ring-rose-400/20 hover:border-rose-600'
                    : mon.alarmSeverity === 'warning'
                    ? 'border-amber-400 bg-amber-50/40 ring-4 ring-amber-400/20 hover:border-amber-500'
                    : 'border-slate-200/90 bg-white hover:border-teal-500 hover:bg-teal-50/60 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors">{mon.bed}</span>
                    <span className="ml-2 font-mono text-xs text-slate-400 font-bold">({mon.id})</span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{mon.patient} • <span className="font-mono text-slate-400">{mon.mrn}</span></p>
                  </div>
                  {mon.alarm && (
                    <button
                      onClick={() => acknowledgeAlarm(mon.id)}
                      className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-800 cursor-pointer shadow-xs"
                    >
                      Acknowledge Alarm
                    </button>
                  )}
                </div>

                {/* Alarm Banner */}
                {mon.alarm && (
                  <div className={`mt-3 rounded-2xl p-3 text-xs font-black border ${
                    mon.alarmSeverity === 'critical'
                      ? 'bg-rose-100 border-rose-300 text-rose-900 animate-pulse'
                      : 'bg-amber-100 border-amber-300 text-amber-900'
                  }`}>
                    ⚠️ {mon.alarm}
                  </div>
                )}

                {/* Vitals Quadrants */}
                <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 hover:bg-white transition-all">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Heart Rate</span>
                    <span className={`text-2xl font-black ${mon.hr > 120 ? 'text-rose-600' : 'text-slate-900'}`}>{mon.hr}</span>
                    <span className="block text-[10px] text-slate-400 font-semibold">bpm</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 hover:bg-white transition-all">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">SpO2 Oxygen</span>
                    <span className={`text-2xl font-black ${mon.spo2 < 90 ? 'text-rose-600' : 'text-teal-700'}`}>{mon.spo2}%</span>
                    <span className="block text-[10px] text-slate-400 font-semibold">pleth</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 hover:bg-white transition-all">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Blood Press</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block font-mono">{mon.bp}</span>
                    <span className="block text-[10px] text-slate-400 font-semibold">mmHg</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 hover:bg-white transition-all">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Temp / Resp</span>
                    <span className="text-base font-black text-slate-900 mt-1 block">{mon.temp}°C</span>
                    <span className="block text-[10px] text-slate-400 font-semibold">{mon.rr} /min</span>
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
