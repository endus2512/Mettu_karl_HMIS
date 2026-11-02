/**
 * Mortuary & Cold Body Vault Management Workstation.
 * Cold chamber custody (2°C - 4°C), death certification & forensic custody.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Archive,
  Thermometer,
  CheckCircle2,
  Clock,
  User,
  Building2,
  ShieldCheck,
  Search,
  Check
} from 'lucide-react';

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

  const occupiedCount = useMemo(() => vaults.filter((v) => v.status === 'occupied').length, [vaults]);
  const vacantCount = useMemo(() => vaults.filter((v) => v.status === 'vacant').length, [vaults]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                <Archive className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('mortuary')} • Cold Body Storage & Forensic Custody
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cold Vault Chamber (2°C - 4°C) • Medical Certificate of Cause of Death • Next-of-Kin Handover
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <Thermometer className="h-3.5 w-3.5" />
                Chamber Cooling: 3.1°C Avg
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Vault Units</span>
                <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Archive className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{vaults.length} Units</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Cold chamber refrigeration bay</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Occupied Vaults</span>
                <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{occupiedCount} Bodies</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{Math.round((occupiedCount / vaults.length) * 100)}% capacity utilized</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vacant Ready Vaults</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{vacantCount} Vaults</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Sanitized & temperature verified</p>
            </div>
          </div>

          {/* Vault Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaults.map((vault) => (
              <div
                key={vault.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-teal-500/50 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{vault.id}</span>
                    <span className="font-mono text-xs text-slate-400 font-medium">({vault.bay})</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                    {vault.temp}°C
                  </span>
                </div>

                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      vault.status === 'occupied'
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {vault.status.toUpperCase()}
                    </span>
                  </div>

                  {vault.occupant && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{vault.occupant}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Date of Death: {vault.dod}</p>
                    </div>
                  )}
                </div>

                {vault.occupant && (
                  <button
                    type="button"
                    onClick={() => releaseToKin(vault.id)}
                    className="w-full mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold py-2 text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
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
