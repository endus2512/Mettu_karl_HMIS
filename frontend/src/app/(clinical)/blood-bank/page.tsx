/**
 * Blood Bank Management, Donor Registry & Crossmatch Workstation.
 * Cold chain monitoring, ABO/Rh inventory, and hemovigilance telemetry.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Droplet,
  Thermometer,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  ShieldCheck,
  Search,
  ArrowRight,
  TestTube2,
  Clock,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface BloodStock {
  group: string;
  prbcUnits: number;
  ffpUnits: number;
  platelets: number;
  isCriticalLow: boolean;
  minThreshold: number;
}

interface TransfusionLog {
  id: string;
  recipientMrn: string;
  recipientName: string;
  recipientGroup: string;
  donorUnitId: string;
  component: string;
  status: 'transfused' | 'crossmatched' | 'issued' | 'quarantined';
  date: string;
  crossmatchResult: 'compatible' | 'incompatible';
}

const mockStock: BloodStock[] = [
  { group: 'O_POS', prbcUnits: 14, ffpUnits: 8, platelets: 5, isCriticalLow: false, minThreshold: 8 },
  { group: 'O_NEG', prbcUnits: 2, ffpUnits: 1, platelets: 0, isCriticalLow: true, minThreshold: 6 },
  { group: 'A_POS', prbcUnits: 12, ffpUnits: 6, platelets: 4, isCriticalLow: false, minThreshold: 6 },
  { group: 'A_NEG', prbcUnits: 3, ffpUnits: 2, platelets: 1, isCriticalLow: true, minThreshold: 4 },
  { group: 'B_POS', prbcUnits: 9, ffpUnits: 5, platelets: 3, isCriticalLow: false, minThreshold: 5 },
  { group: 'B_NEG', prbcUnits: 1, ffpUnits: 1, platelets: 0, isCriticalLow: true, minThreshold: 3 },
  { group: 'AB_POS', prbcUnits: 6, ffpUnits: 4, platelets: 2, isCriticalLow: false, minThreshold: 3 },
  { group: 'AB_NEG', prbcUnits: 2, ffpUnits: 1, platelets: 0, isCriticalLow: true, minThreshold: 2 },
];

const mockTransfusionLogs: TransfusionLog[] = [
  { id: 'TX-2026-081', recipientMrn: 'MKH-2026-000101', recipientName: 'Chaltu Abera', recipientGroup: 'A_POS', donorUnitId: 'PRBC-2026-4401', component: 'PRBC (350ml)', status: 'transfused', date: 'Today, 11:20 AM', crossmatchResult: 'compatible' },
  { id: 'TX-2026-082', recipientMrn: 'MKH-2026-000102', recipientName: 'Gudeta Hailu', recipientGroup: 'O_POS', donorUnitId: 'PRBC-2026-4398', component: 'PRBC (350ml)', status: 'issued', date: 'Today, 10:45 AM', crossmatchResult: 'compatible' },
  { id: 'TX-2026-083', recipientMrn: 'MKH-2026-000105', recipientName: 'Tolessa Bekele', recipientGroup: 'B_POS', donorUnitId: 'FFP-2026-1102', component: 'FFP (250ml)', status: 'crossmatched', date: 'Today, 09:15 AM', crossmatchResult: 'compatible' },
  { id: 'TX-2026-084', recipientMrn: 'MKH-2026-000107', recipientName: 'Genet Abera', recipientGroup: 'AB_POS', donorUnitId: 'PLT-2026-0492', component: 'Platelets (200ml)', status: 'transfused', date: 'Yesterday, 04:30 PM', crossmatchResult: 'compatible' },
];

export default function BloodBankPage(): React.ReactElement {
  const { t } = useTranslation();
  const [stock] = useState<BloodStock[]>(mockStock);
  const [donorGroup, setDonorGroup] = useState('O_NEG');
  const [recipientGroup, setRecipientGroup] = useState('A_POS');
  const [crossmatchResult, setCrossmatchResult] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const checkCompatibility = () => {
    if (donorGroup === 'O_NEG') {
      setCrossmatchResult('COMPATIBLE: O-Negative is the universal red blood cell donor.');
    } else if (donorGroup === recipientGroup) {
      setCrossmatchResult(`COMPATIBLE: Identical ABO/Rh group match (${donorGroup.replace('_', ' ')}).`);
    } else if (recipientGroup === 'AB_POS') {
      setCrossmatchResult('COMPATIBLE: AB-Positive is the universal red blood cell recipient.');
    } else if (recipientGroup === 'A_POS' && donorGroup === 'A_NEG') {
      setCrossmatchResult('COMPATIBLE: Rh-negative donor can safely transfuse to Rh-positive recipient.');
    } else if (recipientGroup === 'B_POS' && donorGroup === 'B_NEG') {
      setCrossmatchResult('COMPATIBLE: Rh-negative donor can safely transfuse to Rh-positive recipient.');
    } else {
      setCrossmatchResult('INCOMPATIBLE: Severe risk of acute hemolytic transfusion reaction!');
    }
  };

  const totalPRBC = useMemo(() => stock.reduce((acc, curr) => acc + curr.prbcUnits, 0), [stock]);
  const totalFFP = useMemo(() => stock.reduce((acc, curr) => acc + curr.ffpUnits, 0), [stock]);
  const totalPlatelets = useMemo(() => stock.reduce((acc, curr) => acc + curr.platelets, 0), [stock]);
  const oNegStock = useMemo(() => stock.find((s) => s.group === 'O_NEG')?.prbcUnits || 0, [stock]);

  const filteredLogs = useMemo(() => {
    if (!searchFilter) return mockTransfusionLogs;
    const q = searchFilter.toLowerCase();
    return mockTransfusionLogs.filter(
      (l) =>
        l.recipientName.toLowerCase().includes(q) ||
        l.recipientMrn.toLowerCase().includes(q) ||
        l.donorUnitId.toLowerCase().includes(q) ||
        l.recipientGroup.toLowerCase().includes(q)
    );
  }, [searchFilter]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <Droplet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('blood_bank')} • Regional Transfusion & Donor Registry
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cold Chain Telemetry (2°C - 6°C) • PRBC / FFP / Platelet Inventory • Hemovigilance & Compatibility
                </p>
              </div>
            </div>

            {/* Cold Chain Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <Thermometer className="h-3.5 w-3.5" />
                Fridge 1: 3.8°C
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                <Snowflake className="h-3.5 w-3.5" />
                FFP Freezer: -24.2°C
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <Activity className="h-3.5 w-3.5" />
                Platelet Incubator: 22.0°C
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total PRBC Units</span>
                <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <Droplet className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalPRBC} Units</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>100% negative HIV, HBV, HCV, VDRL</span>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">O-Negative Reserve</span>
                <span className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300">{oNegStock} Units</p>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">Critical Low</span>
              </div>
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">Priority universal donor recall activated</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fresh Frozen Plasma</span>
                <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Snowflake className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalFFP} Bags</p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">Cryoprecipitate ready for trauma & DIC</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Platelet Concentrates</span>
                <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalPlatelets} Units</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Continuous agitation in incubator</p>
            </div>
          </div>

          {/* Blood Inventory Grid & Simulator */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Blood Group Inventory Grid (2 Cols) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  ABO & Rh Component Inventory
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">8 Standard Clinical Groups</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stock.map((item) => {
                  const label = item.group.replace('_', ' ');
                  return (
                    <div
                      key={item.group}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-teal-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {label}
                        </span>
                        {item.isCriticalLow ? (
                          <span className="rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                            LOW
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            OK
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-baseline justify-between">
                          <span className="text-slate-500 dark:text-slate-400">PRBC</span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{item.prbcUnits} <span className="text-[10px] text-slate-400 font-normal">units</span></span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <span>FFP: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.ffpUnits}</strong></span>
                          <span>Plt: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.platelets}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Crossmatch Compatibility Simulator */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <TestTube2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Crossmatch Simulator
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Major/Minor ABO & Rh Serology Check</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Donor Unit Group
                  </label>
                  <select
                    value={donorGroup}
                    onChange={(e) => setDonorGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {stock.map((s) => (
                      <option key={s.group} value={s.group}>{s.group.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Recipient Patient Group
                  </label>
                  <select
                    value={recipientGroup}
                    onChange={(e) => setRecipientGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {stock.map((s) => (
                      <option key={s.group} value={s.group}>{s.group.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={checkCompatibility}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 shadow-xs transition-colors cursor-pointer text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Verify Compatibility Matrix
                </button>

                {crossmatchResult && (
                  <div className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${
                    crossmatchResult.startsWith('COMPATIBLE')
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}>
                    <div className="flex items-start gap-2">
                      {crossmatchResult.startsWith('COMPATIBLE') ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      )}
                      <span>{crossmatchResult}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transfusion & Crossmatch Log Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Recent Blood Transfusion & Crossmatch Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chain-of-custody tracking from cold bank to clinical ward infusion
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter patient, MRN, unit..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Order / Log ID</th>
                    <th className="px-5 py-3">Recipient Patient</th>
                    <th className="px-5 py-3">ABO/Rh</th>
                    <th className="px-5 py-3">Donor Unit ID</th>
                    <th className="px-5 py-3">Blood Component</th>
                    <th className="px-5 py-3">Serology</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-teal-700 dark:text-teal-400 font-semibold">{log.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{log.recipientName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{log.recipientMrn}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                          {log.recipientGroup.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300">{log.donorUnitId}</td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{log.component}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="h-3 w-3" /> Compatible
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.status === 'transfused'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : log.status === 'issued'
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-400 text-[11px] font-mono">{log.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
