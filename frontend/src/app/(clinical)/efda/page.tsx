/**
 * EFDA Compliance, ADR Pharmacovigilance & Drug Recall Workstation.
 * National drug safety regulatory oversight, Yellow Forms & quarantine lockup.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Scale,
  AlertTriangle,
  FileWarning,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  ArrowUpRight,
  Building2,
  FileText,
  Clock,
  Sparkles,
  PackageX
} from 'lucide-react';

interface ADRItem {
  id: string;
  patient: string;
  patientMrn: string;
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
  quarantinedQty: number;
}

const initialReports: ADRItem[] = [
  { id: 'ADR-MKH-2026-0041', patient: 'Chaltu Abera', patientMrn: 'MKH-2026-000101', drug: 'Ceftriaxone 1g Injection', batch: 'BAT-CEF-9921', reaction: 'Acute bronchospasm and facial angioedema post-infusion', severity: 'severe', status: 'Transmitted to EFDA', date: '2026-10-24' },
  { id: 'ADR-MKH-2026-0042', patient: 'Gudeta Hailu', patientMrn: 'MKH-2026-000102', drug: 'Ciprofloxacin 500mg Tab', batch: 'BAT-CIP-1049', reaction: 'Achilles tendon tenderness and mild arthralgia', severity: 'moderate', status: 'Under Review', date: '2026-10-25' },
  { id: 'ADR-MKH-2026-0043', patient: 'Ayantu Mamo', patientMrn: 'MKH-2026-000104', drug: 'Vancomycin 500mg IV', batch: 'BAT-VAN-3310', reaction: 'Red man syndrome with flushing and pruritus', severity: 'moderate', status: 'Transmitted to EFDA', date: '2026-10-26' },
  { id: 'ADR-MKH-2026-0044', patient: 'Tolessa Bekele', patientMrn: 'MKH-2026-000103', drug: 'Phenytoin 100mg Tab', batch: 'BAT-PHT-0091', reaction: 'Maculopapular rash and mild lymphadenopathy', severity: 'mild', status: 'Resolved', date: '2026-10-27' },
];

const initialRecalls: RecallItem[] = [
  { code: 'RCL-EFDA-2026-09', drug: 'Metronidazole 500mg/100ml IV Infusion', batches: 'BAT-MTZ-8801, BAT-MTZ-8802', reason: 'Particulate matter contamination detected in glass ampoules', date: '2026-10-20', quarantined: true, quarantinedQty: 120 },
];

export default function EFDAPage(): React.ReactElement {
  const { t } = useTranslation();
  const [reports] = useState<ADRItem[]>(initialReports);
  const [recalls] = useState<RecallItem[]>(initialRecalls);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchesSearch =
        item.drug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [reports, searchTerm, severityFilter]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('efda_compliance')} • Ethiopian Food & Drug Authority (EFDA)
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Yellow Form Pharmacovigilance • Substandard / Falsified Medicine Quarantine • Regulatory Oversight
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="h-3.5 w-3.5" />
                EFDA Portal: Synced
              </span>
            </div>
          </div>

          {/* Active Recall Directives */}
          {recalls.map((r) => (
            <div
              key={r.code}
              className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 shrink-0 mt-1 sm:mt-0">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        National Drug Recall Directive ({r.code})
                      </span>
                      <span className="text-xs text-slate-400">• Issued: {r.date}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{r.drug}</h3>
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-medium mt-0.5">
                      {r.reason} • Batches Affected: <span className="font-mono font-bold">{r.batches}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 text-white px-3.5 py-2 text-xs font-semibold shadow-xs">
                    <Lock className="h-3.5 w-3.5" />
                    {r.quarantined ? `${r.quarantinedQty} Units Quarantined in Vault` : 'Quarantine Required'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Key Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ADR Yellow Forms</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">42 Filed</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>100% transmitted to EFDA National Center</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quarantined Stock</span>
                <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <PackageX className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">120 Ampoules</p>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">Secured in Biohazard Disposal Bay</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pharmacovigilance Score</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">Grade A (96%)</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">MoH / EFDA Tertiary Referral Benchmark</p>
            </div>
          </div>

          {/* ADR Adverse Drug Reaction Yellow Forms Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Adverse Drug Reaction (ADR) Surveillance Reports
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  EFDA Yellow Form submissions & post-marketing clinical safety logs
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search drug, patient, batch..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">ADR Form ID</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Suspected Medication</th>
                    <th className="px-5 py-3">Batch Number</th>
                    <th className="px-5 py-3">Reported Reaction Symptoms</th>
                    <th className="px-5 py-3">Severity</th>
                    <th className="px-5 py-3 text-right">Regulatory Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredReports.map((adr) => (
                    <tr key={adr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-teal-700 dark:text-teal-400 font-semibold">{adr.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{adr.patient}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{adr.patientMrn}</div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{adr.drug}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-300">{adr.batch}</td>
                      <td className="px-5 py-3.5 max-w-xs text-slate-600 dark:text-slate-400 truncate">{adr.reaction}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          adr.severity === 'severe'
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : adr.severity === 'moderate'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {adr.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {adr.status}
                        </span>
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
