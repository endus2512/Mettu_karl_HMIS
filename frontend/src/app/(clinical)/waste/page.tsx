/**
 * Medical Waste Segregation & Incinerator Management Workstation.
 * Biohazard disposal with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

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
                  ☣️
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('waste_management')} • Medical Waste & Dual-Chamber Incinerator
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    WHO 4-Color Coded Segregation • High-Temperature Pyrolysis (850°C / 1100°C) • Ash Disposal Logging
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Scrubber Filtration: 99.4% Emission Safe
              </span>
            </div>
          </div>

          {/* Incinerator Real-Time Telemetry Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Primary Chamber</span>
              <p className="mt-2 text-3xl font-black text-rose-600 group-hover:text-rose-950 transition-colors">865°C</p>
              <p className="mt-1 text-xs text-slate-400 font-semibold">Pyrolysis Zone (Min 850°C standard)</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Secondary Chamber</span>
              <p className="mt-2 text-3xl font-black text-amber-600 group-hover:text-amber-950 transition-colors">1120°C</p>
              <p className="mt-1 text-xs text-slate-400 font-semibold">Complete gas combustion (Min 1100°C)</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-blue-500 hover:bg-blue-50/70 hover:ring-2 hover:ring-blue-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Burn Cycle Active</span>
              <p className="mt-2 text-3xl font-black text-blue-700 group-hover:text-blue-950 transition-colors">75 / 90 min</p>
              <p className="mt-1 text-xs text-blue-600 font-semibold">Batch INC-20261026-A</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Treated Today</span>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">109.7 Kg</p>
              <p className="mt-1 text-xs text-emerald-600 font-bold">Safely neutralized & ash consigned</p>
            </div>
          </div>

          {/* Waste Batches (Floating Card-Rows Table) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              WHO Biomedical Waste Segregation Batches
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2">Batch Tracking ID</th>
                    <th className="px-5 py-2">WHO Color Category</th>
                    <th className="px-5 py-2">Hospital Source / Ward</th>
                    <th className="px-5 py-2">Weight (Kg)</th>
                    <th className="px-5 py-2 text-right">Log Time</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr
                      key={b.id}
                      className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                    >
                      <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                        {b.id}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span className={`rounded-xl px-3 py-1 font-bold text-xs ${
                          b.category === 'yellow_infectious'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : b.category === 'red_sharps'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : b.category === 'brown_pharmaceutical'
                            ? 'bg-amber-50 text-amber-950 border border-amber-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}>
                          {b.categoryLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-800">
                        {b.origin}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm">
                        {b.weightKg} Kg
                      </td>
                      <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right font-mono text-slate-500 font-bold">
                        {b.time}
                      </td>
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
