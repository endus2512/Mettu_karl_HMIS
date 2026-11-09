/**
 * Hospital Physical Resilience: Grid, Dual Generators & Solar Microgrid Workstation.
 * High-reliability medical electrical microgrid, ATS transfer telemetry & blackout drill.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import apiClient from '@/lib/api';
import { notifications } from '@mantine/notifications';
import {
  Zap,
  BatteryCharging,
  Sun,
  Fuel,
  ShieldCheck,
  AlertTriangle,
  Activity,
  RefreshCw,
  Server,
  CheckCircle2,
  Cpu,
  Power
} from 'lucide-react';

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
  activeSource: 'Ethiopian Electric Utility (EEU Grid 33kV)',
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

  useEffect(() => {
    let isMounted = true;
    const fetchPowerSummary = async () => {
      try {
        const res = await apiClient.get('/power-grid/summary');
        if (isMounted && res.data) {
          const s = res.data;
          setPower((prev) => ({
            ...prev,
            activeSource:
              s.current_source === 'eeu_grid'
                ? 'Ethiopian Electric Utility (EEU Grid 33kV)'
                : 'Primary Diesel Generator 1 (Cummins 500kVA)',
            eeuOnline: s.current_source === 'eeu_grid',
            eeuVoltage: s.current_source === 'eeu_grid' ? 382.4 : 0.0,
            atsState:
              s.ats_state === 'main_grid_engaged'
                ? 'Main Utility Engaged'
                : 'Emergency Generator Engaged (< 8s switch)',
            solarSOC: s.solar_battery_soc_percent || prev.solarSOC,
          }));
        }
      } catch (err) {
        console.warn('Power grid summary fallback', err);
      }
    };
    void fetchPowerSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleBlackoutSim = async () => {
    const isNowBlackout = !simulatedBlackout;
    setSimulatedBlackout(isNowBlackout);
    if (isNowBlackout) {
      setPower({
        ...power,
        activeSource: 'Primary Diesel Generator 1 (Cummins 500kVA)',
        eeuOnline: false,
        eeuVoltage: 0.0,
        gen1Running: true,
        atsState: 'Emergency Generator Engaged (< 8s switch)',
        solarSOC: 93.0,
        loadKW: 154.0,
      });
      try {
        await apiClient.post('/power-grid/telemetry', {
          active_source: 'diesel_gen1',
          eeu_grid_online: false,
          eeu_grid_voltage: 0.0,
          gen1_running: true,
          gen1_fuel_percent: power.gen1Fuel,
          gen2_running: false,
          gen2_fuel_percent: power.gen2Fuel,
          ats_state: 'generator_engaged',
          solar_battery_soc_percent: 93.0,
          total_hospital_load_kw: 154.0,
          server_room_ups_soc_percent: 100.0,
          cold_chain_alarm: false,
        });
        notifications.show({
          title: 'Power Telemetry Persisted',
          message: 'Blackout drill recorded and synchronized with PostgreSQL telemetry.',
          color: 'teal',
        });
      } catch (e) {
        console.warn('Failed to post power telemetry', e);
      }
    } else {
      setPower(mockStatus);
      try {
        await apiClient.post('/power-grid/telemetry', {
          active_source: 'eeu_grid',
          eeu_grid_online: true,
          eeu_grid_voltage: 382.4,
          gen1_running: false,
          gen1_fuel_percent: mockStatus.gen1Fuel,
          gen2_running: false,
          gen2_fuel_percent: mockStatus.gen2Fuel,
          ats_state: 'main_grid_engaged',
          solar_battery_soc_percent: 96.0,
          total_hospital_load_kw: 148.5,
          server_room_ups_soc_percent: 100.0,
          cold_chain_alarm: false,
        });
        notifications.show({
          title: 'EEU Grid Restored',
          message: 'Nominal grid state synchronized with PostgreSQL.',
          color: 'teal',
        });
      } catch (e) {
        console.warn('Failed to post power telemetry', e);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-[#131824] px-6 py-5 rounded-2xl border border-slate-200 dark:border-[#222b3d] shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('power_resilience')} • EEU Grid, Dual Generators & Solar Microgrid
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  EEU 33kV Grid • Dual 500kVA Cummins Diesel Backup • 100kW Solar PV Storage • ICU & OT Protection
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleBlackoutSim}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                  simulatedBlackout
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <Power className="h-4 w-4" />
                {simulatedBlackout ? 'Restore Main EEU Grid' : 'Simulate EEU Grid Outage Drill'}
              </button>
            </div>
          </div>

          {/* Active Power Generation Source Banner */}
          <div
            className={`rounded-2xl border p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all ${
              power.eeuOnline
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-xl ${power.eeuOnline ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>
                {power.eeuOnline ? <Zap className="h-6 w-6" /> : <RefreshCw className="h-6 w-6 animate-spin" />}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Active Primary Generation Source
                </p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{power.activeSource}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  ATS Switch Status: <strong className="text-teal-700 dark:text-teal-400">{power.atsState}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                power.eeuOnline ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white animate-pulse'
              }`}>
                <Activity className="h-3.5 w-3.5" />
                Hospital Load: {power.loadKW} kW
              </span>
            </div>
          </div>

          {/* Three Power Sources Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Source 1: EEU Grid */}
            <div className={`rounded-2xl border p-5 shadow-xs ${
              power.eeuOnline
                ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Source 1: EEU Grid
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  power.eeuOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}>
                  {power.eeuOnline ? 'ONLINE' : 'OUTAGE'}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">3-Phase Voltage:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{power.eeuVoltage} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Substation:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Mettu Town 33kV Dedicated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grid Frequency:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{power.eeuOnline ? '50.0 Hz' : '0.0 Hz'}</span>
                </div>
              </div>
            </div>

            {/* Source 2: Dual Generators */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Fuel className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Source 2: Dual Generators
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  power.gen1Running
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {power.gen1Running ? 'GEN 1 ACTIVE' : 'STANDBY READY'}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Gen 1 Fuel (500kVA):</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{power.gen1Fuel}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${power.gen1Fuel}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Gen 2 Fuel (500kVA):</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{power.gen2Fuel}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${power.gen2Fuel}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Source 3: Solar PV & Storage */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-amber-500" />
                  Source 3: Solar Microgrid
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  OPTIMAL
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Lithium Battery Bank (SOC):</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{power.solarSOC}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${power.solarSOC}%` }} />
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Rooftop Solar Array:</span>
                  <span className="font-bold text-slate-900 dark:text-white">100 kWp Generation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inverter Autonomy:</span>
                  <span className="font-mono font-bold text-teal-700 dark:text-teal-400">14.5 Hours Storage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Care Power Protection Assurance */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Critical Care Facility Power Security Assurance
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 text-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">ICU Ventilators</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">100% Protected</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Zero-break transfer UPS</p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 text-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">Operating Theatres</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">4/4 Suites Live</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Isolated surgical power</p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 text-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">Blood Bank Fridges</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">3.6°C Stable</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Dual continuous feeds</p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 text-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">Server Datacenter</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">100% Online</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Redundant UPS strings</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
