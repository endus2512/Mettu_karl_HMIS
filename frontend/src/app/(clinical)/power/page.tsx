/**
 * Hospital Physical Resilience: Grid, Dual Generators & Solar Microgrid Workstation.
 * High-reliability medical electrical microgrid with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface PowerStatus {
  activeSource: string;
  eeuOnline: boolean;
  eeuVoltage: number;
  gen1Running: boolean;
  gen1Fuel: number;
  gen2Running: boolean;
  gen2Fuel: number;
  atsState: string;
  solarSOC: number;
  loadKW: number;
  upsSOC: number;
  coldChainAlarm: boolean;
}

const mockStatus: PowerStatus = {
  activeSource: 'Ethiopian Electric Utility (EEU Grid)',
  eeuOnline: true,
  eeuVoltage: 382.4,
  gen1Running: false,
  gen1Fuel: 86.0,
  gen2Running: false,
  gen2Fuel: 94.0,
  atsState: 'Main Utility Engaged',
  solarSOC: 96.0,
  loadKW: 148.5,
  upsSOC: 100.0,
  coldChainAlarm: false,
};

export default function PowerPage(): React.ReactElement {
  const { t } = useTranslation();
  const [power, setPower] = useState<PowerStatus>(mockStatus);
  const [simulatedBlackout, setSimulatedBlackout] = useState(false);

  const toggleBlackoutSim = () => {
    if (!simulatedBlackout) {
      setPower({
        ...power,
        activeSource: 'Primary Diesel Generator 1 (Cummins 500kVA)',
        eeuOnline: false,
        eeuVoltage: 0.0,
        gen1Running: true,
        atsState: 'Emergency Generator Engaged',
        solarSOC: 93.0,
        loadKW: 154.0,
      });
      setSimulatedBlackout(true);
    } else {
      setPower(mockStatus);
      setSimulatedBlackout(false);
    }
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  ⚡
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('power_resilience')} • EEU Grid, Dual Generators & Solar Microgrid
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    EEU 33kV Grid • Dual 500kVA Cummins Diesel Backup • 100kW Solar PV Storage • ICU & OT Protection
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={toggleBlackoutSim}
                className={`rounded-2xl px-5 py-2.5 text-xs font-black text-white shadow-sm transition-all cursor-pointer ${
                  simulatedBlackout
                    ? 'bg-emerald-600 hover:bg-emerald-700 hover:ring-2 hover:ring-emerald-400/50'
                    : 'bg-rose-600 hover:bg-rose-700 hover:ring-2 hover:ring-rose-400/50'
                }`}
              >
                {simulatedBlackout ? 'Restore Main EEU Grid' : 'Simulate EEU Grid Outage Drill'}
              </button>
            </div>
          </div>

          {/* Active Power Alert / Status Banner with Rectangular Spotlight */}
          <div
            className={`group rounded-3xl border-2 p-6 shadow-xs flex items-center justify-between transition-all duration-200 hover:ring-2 ${
              power.eeuOnline
                ? 'border-emerald-400 bg-emerald-50/80 text-emerald-950 hover:border-emerald-600 hover:ring-emerald-400/30'
                : 'border-amber-400 bg-amber-50/80 text-amber-950 hover:border-amber-600 hover:ring-amber-400/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{power.eeuOnline ? '⚡' : '🔄'}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Power Generation Source</p>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{power.activeSource}</h3>
                <p className="text-xs font-semibold text-slate-600">ATS Transfer Switch: <span className="font-bold text-teal-800">{power.atsState}</span> (&lt; 10s auto-switch)</p>
              </div>
            </div>
            <span
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                power.eeuOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white animate-pulse'
              }`}
            >
              Hospital Demand: {power.loadKW} kW
            </span>
          </div>

          {/* Three Power Sources Grid (Floating Rectangular Spotlight Cards) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Source 1: EEU Grid */}
            <div
              className={`group rounded-3xl border-2 p-6 shadow-xs transition-all duration-200 cursor-pointer transform hover:-translate-y-1 ${
                power.eeuOnline
                  ? 'border-slate-200/90 bg-white hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg'
                  : 'border-rose-400 bg-rose-50/30 ring-2 ring-rose-400/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 group-hover:border-teal-200/60 transition-colors">
                <span className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors">
                  Source 1: EEU Utility Grid
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                    power.eeuOnline ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {power.eeuOnline ? 'ONLINE' : 'BLACKOUT'}
                </span>
              </div>
              <div className="mt-4 space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">3-Phase Voltage:</span>
                  <span className="font-mono font-black text-slate-900">{power.eeuVoltage} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Substation:</span>
                  <span className="font-bold text-slate-800">Mettu Town 33kV Line</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grid Frequency:</span>
                  <span className="font-mono font-bold text-slate-900">{power.eeuOnline ? '50.0 Hz' : '0.0 Hz'}</span>
                </div>
              </div>
            </div>

            {/* Source 2: Dual Diesel Generators */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 group-hover:border-teal-200/60 transition-colors">
                <span className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors">
                  Source 2: Dual Generators
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                    power.gen1Running
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {power.gen1Running ? 'GEN 1 ACTIVE' : 'STANDBY READY'}
                </span>
              </div>
              <div className="mt-4 space-y-3 text-xs font-semibold">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-500">Gen 1 Fuel (500kVA):</span>
                    <span className="text-emerald-700 font-mono font-black">{power.gen1Fuel}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${power.gen1Fuel}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-500">Gen 2 Fuel (500kVA):</span>
                    <span className="text-emerald-700 font-mono font-black">{power.gen2Fuel}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${power.gen2Fuel}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Source 3: Solar PV & Batteries */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 group-hover:border-teal-200/60 transition-colors">
                <span className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors">
                  Source 3: Solar PV & Storage
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black">
                  OPTIMAL
                </span>
              </div>
              <div className="mt-4 space-y-3 text-xs font-semibold">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-500">Lithium Battery Bank (SOC):</span>
                    <span className="text-emerald-700 font-mono font-black">{power.solarSOC}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${power.solarSOC}%` }} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rooftop Solar Array:</span>
                  <span className="font-bold text-slate-900">100 kWp Generation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inverter Autonomy:</span>
                  <span className="font-mono font-bold text-teal-800">14.5 Hours Storage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Care Power Protection Assurance */}
          <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
            <h3 className="mb-4 text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
              Critical Care Facility Power Security Assurance
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer">
                <p className="text-[10px] font-bold uppercase text-slate-400">ICU Ventilators</p>
                <p className="text-base font-black text-emerald-600 mt-1">100% Protected</p>
                <p className="text-[10px] text-slate-400 font-semibold">Zero-break transfer UPS</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer">
                <p className="text-[10px] font-bold uppercase text-slate-400">Operating Theatres</p>
                <p className="text-base font-black text-emerald-600 mt-1">4/4 Suites Live</p>
                <p className="text-[10px] text-slate-400 font-semibold">Isolated surgical power</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer">
                <p className="text-[10px] font-bold uppercase text-slate-400">Blood Bank Fridge</p>
                <p className="text-base font-black text-emerald-600 mt-1">3.6°C Stable</p>
                <p className="text-[10px] text-slate-400 font-semibold">Dual line continuous power</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer">
                <p className="text-[10px] font-bold uppercase text-slate-400">Server Datacenter</p>
                <p className="text-base font-black text-emerald-600 mt-1">100% Online</p>
                <p className="text-[10px] text-slate-400 font-semibold">Redundant UPS strings</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
