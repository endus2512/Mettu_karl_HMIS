/**
 * EFDA Compliance, ADR Pharmacovigilance & Drug Recall Workstation.
 * National drug safety regulatory oversight with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface ADRItem {
  id: string;
  patient: string;
  drug: string;
  batch: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  status: string;
  date: string;
}

interface RecallItem {
  code: string;
  drug: string;
  batches: string;
  reason: string;
  date: string;
  quarantined: boolean;
}

const initialReports: ADRItem[] = [
  { id: 'ADR-MKH-2026-0041', patient: 'Chaltu Abera (MKH-2026-000101)', drug: 'Ceftriaxone 1g Injection', batch: 'BAT-CEF-9921', reaction: 'Acute bronchospasm and facial angioedema post-infusion', severity: 'severe', status: 'Submitted to EFDA', date: '2026-10-24' },
  { id: 'ADR-MKH-2026-0042', patient: 'Gudeta Hailu (MKH-2026-000102)', drug: 'Ciprofloxacin 500mg Tab', batch: 'BAT-CIP-1049', reaction: 'Achilles tendon tenderness and mild arthralgia', severity: 'moderate', status: 'Under Review', date: '2026-10-25' },
];

const initialRecalls: RecallItem[] = [
  { code: 'RCL-EFDA-2026-09', drug: 'Metronidazole 500mg/100ml IV Infusion', batches: 'BAT-MTZ-8801, BAT-MTZ-8802', reason: 'Particulate matter contamination detected in glass ampoules', date: '2026-10-20', quarantined: true },
];

export default function EFDAPage(): React.ReactElement {
  const { t } = useTranslation();
  const [reports] = useState<ADRItem[]>(initialReports);
  const [recalls] = useState<RecallItem[]>(initialRecalls);

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
                  ⚖️
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('efda_compliance')} • Ethiopian Food & Drug Authority (EFDA)
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    ADR Yellow Form Pharmacovigilance • Substandard/Falsified Medicine Quarantine • Regulatory Audits
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                1 Active EFDA Drug Recall Notice
              </span>
            </div>
          </div>

          {/* Active Recall Banner with Spotlight */}
          {recalls.map((r) => (
            <div
              key={r.code}
              className="group rounded-3xl border-2 border-rose-400 bg-rose-50/80 p-5 shadow-xs hover:border-rose-600 hover:ring-2 hover:ring-rose-400/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">⚠️</span>
                  <div>
                    <span className="text-xs font-black uppercase text-rose-800 tracking-wider">
                      National Drug Recall Directive ({r.code})
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">{r.drug}</h3>
                    <p className="text-xs text-rose-700 font-semibold">{r.reason} • Affected Batches: {r.batches}</p>
                  </div>
                </div>
                <span className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white shrink-0">
                  {r.quarantined ? '✓ 100% Quarantined in Vault' : 'Quarantine Action Required'}
                </span>
              </div>
            </div>
          ))}

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-800 transition-colors">ADR Yellow Forms</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">42 Filed</p>
              <p className="mt-1 text-xs text-teal-600 font-semibold">100% transmitted to EFDA portal</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Quarantined Stock</span>
              <p className="mt-2 text-3xl font-black text-amber-800 group-hover:text-amber-950 transition-colors">120 Ampoules</p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">Locked in Biohazard Disposal Bay</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pharmacovigilance Score</span>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">Grade A (96%)</p>
              <p className="mt-1 text-xs text-emerald-600 font-bold">MoH National Drug Safety Benchmark</p>
            </div>
          </div>

          {/* ADR Adverse Drug Reaction Yellow Forms (Floating Card-Rows Table) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Adverse Drug Reaction (ADR) Clinical Surveillance Reports
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2">ADR Report ID</th>
                    <th className="px-5 py-2">Patient</th>
                    <th className="px-5 py-2">Suspected Medication</th>
                    <th className="px-5 py-2">Batch #</th>
                    <th className="px-5 py-2">Adverse Reaction Symptoms</th>
                    <th className="px-5 py-2">Severity</th>
                    <th className="px-5 py-2 text-right">Regulatory Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((adr) => (
                    <tr
                      key={adr.id}
                      className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                    >
                      <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                        {adr.id}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm">
                        {adr.patient}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700">
                        {adr.drug}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-bold text-slate-600">
                        {adr.batch}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-slate-600 font-semibold max-w-xs truncate">
                        {adr.reaction}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span className={`rounded-xl px-2.5 py-1 text-xs font-black ${
                          adr.severity === 'severe'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {adr.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right font-bold text-emerald-800">
                        {adr.status}
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
