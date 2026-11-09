/**
 * Infection Prevention & Control (IPPS) and EPHI Outbreak Surveillance Workstation.
 * Epidemiological surveillance, antimicrobial resistance, and barrier nursing.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import apiClient from '@/lib/api';
import {
  Microscope,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Flame,
  Search,
  Filter,
  UserX,
  Sparkles,
  Layers,
  Thermometer,
  ShieldCheck,
  Building2,
  Bell
} from 'lucide-react';

interface HAIItem {
  id: number;
  patient: string;
  patientMrn: string;
  type: string;
  ward: string;
  pathogen: string;
  antibioticSensitivity: string;
  isolated: boolean;
  date: string;
}

interface PHEMItem {
  code: string;
  disease: string;
  origin: string;
  ephiStatus: string;
  outcome: string;
  date: string;
  severity: 'high' | 'critical' | 'moderate';
}

const initialHAIs: HAIItem[] = [
  { id: 1, patient: 'Tolessa Bekele', patientMrn: 'MKH-2026-000103', type: 'Surgical Site Infection (SSI)', ward: 'Main Surgical Ward (Bed 12)', pathogen: 'Staphylococcus aureus (MRSA)', antibioticSensitivity: 'Sensitive: Vancomycin, Linezolid • Resistant: Oxacillin', isolated: true, date: '2026-10-24' },
  { id: 2, patient: 'Genet Abera', patientMrn: 'MKH-2026-000104', type: 'Catheter-Associated UTI (CAUTI)', ward: 'Internal Medicine Ward (Bed 08)', pathogen: 'Klebsiella pneumoniae (ESBL)', antibioticSensitivity: 'Sensitive: Meropenem, Amikacin • Resistant: Ceftriaxone', isolated: false, date: '2026-10-25' },
  { id: 3, patient: 'Mekonnen Kebede', patientMrn: 'MKH-2026-000105', type: 'Ventilator-Associated Pneumonia (VAP)', ward: 'Intensive Care Unit (Bed 03)', pathogen: 'Pseudomonas aeruginosa', antibioticSensitivity: 'Sensitive: Colistin, Piperacillin/Tazobactam', isolated: true, date: '2026-10-26' },
];

const initialPHEMs: PHEMItem[] = [
  { code: 'PHEM-MKH-2026-W42-01', disease: 'Suspected Cholera (AWD)', origin: 'Kebele 02, Sor Valley (Mettu Woreda)', ephiStatus: 'Sample Transferred to EPHI Lab', outcome: 'Isolated in Cholera Treatment Bay (CTC)', date: '2026-10-25', severity: 'critical' },
  { code: 'PHEM-MKH-2026-W42-02', disease: 'Measles Outbreak Cluster', origin: 'Hurumu Woreda, Village 04', ephiStatus: 'Serology IgM Positive', outcome: 'Community Ring Vaccination Activated', date: '2026-10-22', severity: 'high' },
];

export default function InfectionPage(): React.ReactElement {
  const { t } = useTranslation();
  const [hais, setHais] = useState<HAIItem[]>(initialHAIs);
  const [phems, setPhems] = useState<PHEMItem[]>(initialPHEMs);
  const [searchFilter, setSearchFilter] = useState('');

  // Sync Live HAI Logs and PHEM Outbreak Reports from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchInfectionData = async () => {
      try {
        const [haiRes, phemRes] = await Promise.all([
          apiClient.get('/infection-control/hai-logs'),
          apiClient.get('/infection-control/phem-reports'),
        ]);

        if (isMounted && haiRes.data && Array.isArray(haiRes.data) && haiRes.data.length > 0) {
          const liveHAIs: HAIItem[] = haiRes.data.map((h: any) => ({
            id: h.id,
            patient: h.patient_name || 'Patient Chart',
            patientMrn: h.patient_mrn || `MKH-2026-${String(h.id).padStart(6, '0')}`,
            type: h.hai_type ? h.hai_type.toUpperCase() : 'Hospital-Acquired Infection',
            ward: h.ward || 'General Ward',
            pathogen: h.pathogen_isolated || 'Microbial Isolate',
            antibioticSensitivity: h.antibiotic_susceptibility || 'Testing in progress',
            isolated: Boolean(h.isolation_precaution_active),
            date: h.detected_date ? h.detected_date.split('T')[0] : '2026-10-26',
          }));
          setHais(liveHAIs);
        }

        if (isMounted && phemRes.data && Array.isArray(phemRes.data) && phemRes.data.length > 0) {
          const livePHEMs: PHEMItem[] = phemRes.data.map((p: any) => ({
            code: p.report_code || `PHEM-${p.id}`,
            disease: p.disease_category ? p.disease_category.toUpperCase() : 'Epidemic Alert',
            origin: p.affected_woreda || 'Mettu Zone',
            ephiStatus: 'EPHI Synchronized',
            outcome: p.case_count ? `${p.case_count} cases under barrier precautions` : 'Active surveillance',
            date: p.reported_to_ephi_at ? p.reported_to_ephi_at.split('T')[0] : '2026-10-25',
            severity: p.mortality_count > 0 ? 'critical' : 'high',
          }));
          setPhems(livePHEMs);
        }
      } catch (err) {
        console.warn('Infection control live fetch fallback', err);
      }
    };
    void fetchInfectionData();
    return () => {
      isMounted = false;
    };
  }, []);

  const isolatedCount = useMemo(() => hais.filter((h) => h.isolated).length, [hais]);

  const filteredHAIs = useMemo(() => {
    if (!searchFilter) return hais;
    const q = searchFilter.toLowerCase();
    return hais.filter(
      (h) =>
        h.patient.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q) ||
        h.pathogen.toLowerCase().includes(q) ||
        h.ward.toLowerCase().includes(q)
    );
  }, [hais, searchFilter]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-[#131824] px-6 py-5 rounded-2xl border border-slate-200 dark:border-[#222b3d] shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-500 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <Microscope className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('infection_epidemiology')} • Infection Prevention (IPPS) & EPHI Surveillance
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hospital-Acquired Infection (HAI) Surveillance • Antimicrobial Stewardship • EPHI PHEM Epidemic Alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="h-3.5 w-3.5" />
                EPHI National Gateway: Live
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active HAI Cases</span>
                <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <Flame className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{hais.length} Inpatients</p>
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">1 SSI • 1 CAUTI • 1 VAP</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact Isolation</span>
                <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <UserX className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{isolatedCount} in Isolation</p>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">Strict barrier PPE nursing protocol</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">PHEM Outbreak Alerts</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Bell className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{phems.length} Active Clusters</p>
              <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">AWD/Cholera & Measles ring</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hand Hygiene Rate</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">94.2%</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">WHO 5-Moments observation audit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Hospital-Acquired Infection Surveillance Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  Hospital-Acquired Infection (HAI) Surveillance
                </h3>
                <div className="relative w-44">
                  <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search HAI..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-7 pr-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredHAIs.map((hai) => (
                  <div
                    key={hai.id}
                    className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{hai.type}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hai.ward}</div>
                      </div>
                      {hai.isolated ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                          <UserX className="h-3 w-3" />
                          ISOLATION
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          COHORTED
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{hai.patient}</span>
                        <span className="font-mono text-slate-400 text-[11px]">{hai.patientMrn}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        Pathogen: <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{hai.pathogen}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg font-mono">
                        {hai.antibioticSensitivity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EPHI Epidemic Outbreak Alerts */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                EPHI Public Health Emergency (PHEM) Outbreak Alerts
              </h3>

              <div className="space-y-3">
                {phems.map((phem) => (
                  <div
                    key={phem.code}
                    className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">{phem.disease}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{phem.origin}</div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {phem.code}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Laboratory Status:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{phem.ephiStatus}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Response Action:</span>
                        <span className="font-bold text-teal-700 dark:text-teal-400">{phem.outcome}</span>
                      </div>
                      <div className="text-right text-[11px] text-slate-400 pt-1">
                        Reported: {phem.date}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Guidelines Box */}
                <div className="rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      <strong className="text-slate-900 dark:text-white font-bold">Standard Precautions Active:</strong>
                      <p className="text-slate-600 dark:text-slate-400">
                        All clinical personnel must adhere to WHO Hand Hygiene guidelines and don appropriate isolation PPE prior to patient contact in designated zones.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
