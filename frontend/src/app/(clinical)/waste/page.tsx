/**
 * Medical Waste Segregation & Incinerator Management Workstation.
 * WHO 4-color segregation, dual-chamber pyrolysis (850°C/1100°C) & environmental emissions.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Flame,
  Trash2,
  Thermometer,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Search
} from 'lucide-react';

interface WasteBatch {
  id: string;
  category: 'yellow_infectious' | 'red_sharps' | 'brown_pharmaceutical' | 'black_general';
  categoryLabel: string;
  weightKg: number;
  origin: string;
  time: string;
}

const initialBatches: WasteBatch[] = [
  { id: 'MW-20261026-01', category: 'yellow_infectious', categoryLabel: 'Yellow Bag (Biohazardous / Infectious)', weightKg: 24.5, origin: 'Isolation Ward & ICU', time: '08:30 AM' },
  { id: 'MW-20261026-02', category: 'red_sharps', categoryLabel: 'Red Container (Needles, Scalpels, Sharps)', weightKg: 8.2, origin: 'Main OT Suite & Emergency', time: '09:15 AM' },
  { id: 'MW-20261026-03', category: 'brown_pharmaceutical', categoryLabel: 'Brown Box (Expired Cytotoxic / Pharma)', weightKg: 12.0, origin: 'Central Pharmacy Warehouse', time: '10:00 AM' },
  { id: 'MW-20261026-04', category: 'black_general', categoryLabel: 'Black Bag (Non-Risk Municipal Waste)', weightKg: 65.0, origin: 'Administrative & Dining', time: '11:00 AM' },
];

export default function WastePage(): React.ReactElement {
  const { t } = useTranslation();
  const [batches] = useState<WasteBatch[]>(initialBatches);
  const [searchTerm, setSearchTerm] = useState('');

  const totalKg = useMemo(() => batches.reduce((acc, b) => acc + b.weightKg, 0), [batches]);

  const filteredBatches = useMemo(() => {
    if (!searchTerm) return batches;
    const q = searchTerm.toLowerCase();
    return batches.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.categoryLabel.toLowerCase().includes(q) ||
        b.origin.toLowerCase().includes(q)
    );
  }, [batches, searchTerm]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('waste_management')} • Medical Waste & Dual-Chamber Incinerator
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  WHO 4-Color Coded Segregation • High-Temperature Pyrolysis (850°C / 1100°C) • Ash Disposal Logging
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="h-3.5 w-3.5" />
                Scrubber Filtration: 99.4% Emission Safe
              </span>
            </div>
          </div>

          {/* Incinerator Real-Time Telemetry Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Primary Chamber</span>
                <span className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                  <Flame className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300">865°C</p>
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">Pyrolysis zone (&gt; 850°C standard)</p>
            </div>

            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Secondary Chamber</span>
                <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                  <Thermometer className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">1,120°C</p>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">Complete gas destruction (&gt; 1100°C)</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Burn Cycle Active</span>
                <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">75 / 90 min</p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">Batch INC-20261026-A</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Treated Today</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{totalKg.toFixed(1)} Kg</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">Safely neutralized & ash consigned</p>
            </div>
          </div>

          {/* Waste Batches Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  WHO Biomedical Waste Segregation Batches
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Point-of-generation origin tracking & color-coded stream classification
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter batch ID, category..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Batch ID</th>
                    <th className="px-5 py-3">WHO Category Stream</th>
                    <th className="px-5 py-3">Department Origin</th>
                    <th className="px-5 py-3">Net Weight</th>
                    <th className="px-5 py-3 text-right">Intake Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-teal-700 dark:text-teal-400 font-bold">{batch.id}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          batch.category === 'yellow_infectious'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                            : batch.category === 'red_sharps'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                            : batch.category === 'brown_pharmaceutical'
                            ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {batch.categoryLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{batch.origin}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">{batch.weightKg} kg</td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-500 dark:text-slate-400 text-[11px]">{batch.time}</td>
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
