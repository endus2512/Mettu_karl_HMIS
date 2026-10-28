/**
 * Mortuary & Cold Body Vault Management Workstation.
 * Cold chamber custody with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface VaultItem {
  id: string;
  bay: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  temp: number;
  occupant?: string;
  dod?: string;
}

const initialVaults: VaultItem[] = [
  { id: 'VLT-01', bay: 'Bay 1 Top', status: 'occupied', temp: 3.2, occupant: 'Bekele Shiferaw', dod: '2026-10-25' },
  { id: 'VLT-02', bay: 'Bay 1 Bottom', status: 'occupied', temp: 3.4, occupant: 'Aberash Worku', dod: '2026-10-26' },
  { id: 'VLT-03', bay: 'Bay 2 Top', status: 'vacant', temp: 2.9 },
  { id: 'VLT-04', bay: 'Bay 2 Bottom', status: 'vacant', temp: 3.1 },
  { id: 'VLT-05', bay: 'Bay 3 Top', status: 'occupied', temp: 3.0, occupant: 'Girma Tufa', dod: '2026-10-24' },
  { id: 'VLT-06', bay: 'Bay 3 Bottom', status: 'vacant', temp: 3.3 },
];

export default function MortuaryPage(): React.ReactElement {
  const { t } = useTranslation();
  const [vaults, setVaults] = useState<VaultItem[]>(initialVaults);

  const releaseToKin = (vaultId: string) => {
    setVaults((prev) =>
      prev.map((v) => (v.id === vaultId ? { ...v, status: 'vacant', occupant: undefined, dod: undefined } : v))
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  ⚰️
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('mortuary')} • Cold Body Storage & Forensic Custody
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Cold Vault Chamber (2°C - 4°C) • Medical Certificate of Cause of Death • Next-of-Kin Handover
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-800 border border-blue-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Chamber Cooling: 3.1°C Avg
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-800 transition-colors">Total Vault Capacity</p>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">6 Units</p>
              <p className="mt-1 text-xs text-slate-400 font-semibold">Cold mortuary cooling bay</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Occupied Vaults</p>
              <p className="mt-2 text-3xl font-black text-amber-700 group-hover:text-amber-950 transition-colors">3 Bodies</p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">50% Storage capacity utilized</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Vacant Ready Vaults</p>
              <p className="mt-2 text-3xl font-black text-teal-700 group-hover:text-teal-950 transition-colors">3 Vaults</p>
              <p className="mt-1 text-xs text-teal-600 font-semibold">Sanitized & temperature verified</p>
            </div>
          </div>

          {/* Vault Units Grid (Floating Rectangular Spotlight Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vaults.map((vault) => (
              <div
                key={vault.id}
                className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 group-hover:border-teal-200/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm group-hover:text-teal-950 transition-colors">{vault.id}</span>
                    <span className="font-mono text-xs text-slate-500 font-semibold">({vault.bay})</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                    {vault.temp}°C
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[10px]">Status:</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      vault.status === 'occupied'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {vault.status.toUpperCase()}
                    </span>
                  </div>

                  {vault.occupant && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="font-black text-slate-900 text-sm">{vault.occupant}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Date of Death: {vault.dod}</p>
                    </div>
                  )}
                </div>

                {vault.occupant && (
                  <button
                    onClick={() => releaseToKin(vault.id)}
                    className="w-full mt-4 rounded-xl bg-slate-800 py-2.5 text-xs font-black text-white hover:bg-slate-900 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                  >
                    Release Body to Next-of-Kin
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
