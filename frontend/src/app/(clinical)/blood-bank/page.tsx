/**
 * Blood Bank Management, Donor Registry & Crossmatch Workstation.
 * Cold chain monitoring with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface BloodStock {
  group: string;
  prbcUnits: number;
  ffpUnits: number;
  platelets: number;
  isCriticalLow: boolean;
}

const mockStock: BloodStock[] = [
  { group: 'O_POS', prbcUnits: 14, ffpUnits: 8, platelets: 5, isCriticalLow: false },
  { group: 'O_NEG', prbcUnits: 2, ffpUnits: 1, platelets: 0, isCriticalLow: true },
  { group: 'A_POS', prbcUnits: 12, ffpUnits: 6, platelets: 4, isCriticalLow: false },
  { group: 'A_NEG', prbcUnits: 3, ffpUnits: 2, platelets: 1, isCriticalLow: true },
  { group: 'B_POS', prbcUnits: 9, ffpUnits: 5, platelets: 3, isCriticalLow: false },
  { group: 'B_NEG', prbcUnits: 1, ffpUnits: 1, platelets: 0, isCriticalLow: true },
  { group: 'AB_POS', prbcUnits: 6, ffpUnits: 4, platelets: 2, isCriticalLow: false },
  { group: 'AB_NEG', prbcUnits: 2, ffpUnits: 1, platelets: 0, isCriticalLow: true },
];

export default function BloodBankPage(): React.ReactElement {
  const { t } = useTranslation();
  const [stock] = useState<BloodStock[]>(mockStock);
  const [donorGroup, setDonorGroup] = useState('O_NEG');
  const [recipientGroup, setRecipientGroup] = useState('A_POS');
  const [crossmatchResult, setCrossmatchResult] = useState<string | null>(null);

  const checkCompatibility = () => {
    if (donorGroup === 'O_NEG') {
      setCrossmatchResult('COMPATIBLE: O-Negative is universal red blood cell donor.');
    } else if (donorGroup === recipientGroup) {
      setCrossmatchResult(`COMPATIBLE: Identical ABO/Rh group match (${donorGroup}).`);
    } else if (recipientGroup === 'AB_POS') {
      setCrossmatchResult('COMPATIBLE: AB-Positive is universal red blood cell recipient.');
    } else {
      setCrossmatchResult('INCOMPATIBLE: Severe risk of acute hemolytic transfusion reaction!');
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  🩸
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('blood_bank')} • Regional Transfusion & Donor Registry
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Cold Chain Telemetry (2°C - 6°C) • PRBC/FFP Component Inventory • Major/Minor Crossmatch
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Fridge 1: 3.8°C
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-800 border border-blue-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                FFP Freezer: -24.2°C
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total PRBC Units</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">49 Units</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Tested negative for HIV, HBV, HCV, VDRL</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">O-Negative Reserve</span>
              <p className="mt-2 text-3xl font-black text-rose-600 group-hover:text-rose-950 transition-colors">2 Units (Low)</p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">Priority donor call list activated</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fresh Frozen Plasma</span>
              <p className="mt-2 text-3xl font-black text-blue-700 group-hover:text-blue-950 transition-colors">28 Bags</p>
              <p className="mt-1 text-xs text-blue-600 font-bold">Cryoprecipitate ready for coagulopathy</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platelet Concentrates</span>
              <p className="mt-2 text-3xl font-black text-amber-700 group-hover:text-amber-950 transition-colors">16 Units</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Agitator incubator operating at 22°C</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Blood Inventory Grid (Cards with Rectangular Spotlight) */}
            <div className="col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Blood Group Inventory & Safety Thresholds
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stock.map((item) => (
                  <div
                    key={item.group}
                    className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-base text-slate-900 group-hover:text-teal-950 transition-colors">
                        {item.group.replace('_', ' ')}
                      </span>
                      {item.isCriticalLow ? (
                        <span className="rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[9px] font-black text-rose-800 animate-pulse">
                          LOW
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[9px] font-black text-emerald-800">
                          OK
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs font-semibold">
                      <p className="text-slate-700 font-black text-lg">{item.prbcUnits} <span className="text-xs font-normal text-slate-400">PRBC</span></p>
                      <p className="text-slate-500">{item.ffpUnits} FFP • {item.platelets} Plt</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crossmatch Compatibility Simulator */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200 space-y-4">
              <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Crossmatch Compatibility
              </h3>
              <div className="space-y-3 text-xs font-bold">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Donor Group</label>
                  <select
                    value={donorGroup}
                    onChange={(e) => setDonorGroup(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-xs font-bold hover:border-teal-400 focus:border-teal-500 focus:outline-none"
                  >
                    {stock.map((s) => (
                      <option key={s.group} value={s.group}>{s.group.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Recipient Group</label>
                  <select
                    value={recipientGroup}
                    onChange={(e) => setRecipientGroup(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-xs font-bold hover:border-teal-400 focus:border-teal-500 focus:outline-none"
                  >
                    {stock.map((s) => (
                      <option key={s.group} value={s.group}>{s.group.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={checkCompatibility}
                  className="w-full rounded-2xl bg-teal-600 py-3 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  Verify Transfusion Compatibility
                </button>

                {crossmatchResult && (
                  <div className={`p-4 rounded-2xl border-2 text-xs font-bold ${
                    crossmatchResult.startsWith('COMPATIBLE')
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : 'bg-rose-50 border-rose-400 text-rose-900'
                  }`}>
                    {crossmatchResult}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
