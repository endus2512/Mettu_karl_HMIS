/**
 * Infection Prevention & Control (IPPS) and EPHI Outbreak Surveillance Workstation.
 * Epidemiological surveillance with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface HAIItem {
  id: number;
  patient: string;
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
}

const initialHAIs: HAIItem[] = [
  { id: 1, patient: 'Tolessa Bekele (MKH-2026-000103)', type: 'Surgical Site Infection (SSI)', ward: 'Main Surgical Ward', pathogen: 'Staphylococcus aureus (MRSA)', antibioticSensitivity: 'Sensitive to Vancomycin, Linezolid', isolated: true, date: '2026-10-24' },
  { id: 2, patient: 'Genet Abera (MKH-2026-000104)', type: 'Catheter-Associated UTI (CAUTI)', ward: 'Internal Medicine Ward', pathogen: 'Klebsiella pneumoniae (ESBL)', antibioticSensitivity: 'Sensitive to Meropenem, Amikacin', isolated: false, date: '2026-10-25' },
  { id: 3, patient: 'Mekonnen Kebede (MKH-2026-000105)', type: 'Ventilator-Associated Pneumonia (VAP)', ward: 'Intensive Care Unit', pathogen: 'Pseudomonas aeruginosa', antibioticSensitivity: 'Sensitive to Colistin, Piperacillin/Tazo', isolated: true, date: '2026-10-26' },
];

const initialPHEMs: PHEMItem[] = [
  { code: 'PHEM-MKH-2026-W42-01', disease: 'Suspected Cholera (AWD)', origin: 'Kebele 02, Sor Valley (Mettu Woreda)', ephiStatus: 'Sample Transferred to EPHI Lab', outcome: 'Isolated in CTC Bay', date: '2026-10-25' },
  { code: 'PHEM-MKH-2026-W42-02', disease: 'Measles Outbreak Cluster', origin: 'Hurumu Woreda, Village 04', ephiStatus: 'Serology IgM Positive', outcome: 'Community Ring Vaccination Activated', date: '2026-10-22' },
];

export default function InfectionPage(): React.ReactElement {
  const { t } = useTranslation();
  const [hais] = useState<HAIItem[]>(initialHAIs);
  const [phems] = useState<PHEMItem[]>(initialPHEMs);

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
                  🧫
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('infection_epidemiology')} • Infection Prevention (IPPS) & EPHI Surveillance
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Hospital-Acquired Infection (HAI) Surveillance • Antimicrobial Stewardship • EPHI PHEM Epidemic Alerts
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                EPHI Gateway: Real-Time Sync
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Active HAI Cases</span>
              <p className="mt-2 text-3xl font-black text-rose-700 group-hover:text-rose-950 transition-colors">3 Patients</p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">1 SSI • 1 CAUTI • 1 VAP</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Contact Isolation</span>
              <p className="mt-2 text-3xl font-black text-amber-800 group-hover:text-amber-950 transition-colors">2 in Isolation</p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">Strict barrier nursing in effect</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">PHEM Outbreak Alerts</span>
              <p className="mt-2 text-3xl font-black text-teal-800 group-hover:text-teal-950 transition-colors">2 Clusters</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Suspected Cholera & Measles</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hand Hygiene Compliance</span>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">94.2%</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">WHO 5-Moments Observation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Hospital-Acquired Infection Surveillance Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Hospital-Acquired Infection (HAI) Surveillance
              </h3>
              <div className="space-y-3">
                {hais.map((hai) => (
                  <div
                    key={hai.id}
                    className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-slate-900 text-sm group-hover:text-teal-950 transition-colors">{hai.type}</span>
                      {hai.isolated ? (
                        <span className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-black text-rose-800 animate-pulse">
                          ISOLATED
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                          COHORTED
                        </span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1 text-xs font-semibold">
                      <p className="font-bold text-slate-800">{hai.patient} • <span className="text-teal-800">{hai.ward}</span></p>
                      <p className="text-slate-600">Pathogen: <span className="font-mono font-bold text-rose-700">{hai.pathogen}</span></p>
                      <p className="text-slate-500 text-[11px]">{hai.antibioticSensitivity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EPHI Epidemic Outbreak Alerts */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                EPHI Public Health Emergency (PHEM) Outbreak Alerts
              </h3>
              <div className="space-y-3">
                {phems.map((phem) => (
                  <div
                    key={phem.code}
                    className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-rose-700 text-sm">{phem.disease}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{phem.code}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-xs font-semibold">
                      <p className="text-slate-700">📍 Origin: <span className="font-bold text-slate-900">{phem.origin}</span></p>
                      <p className="text-teal-800 font-bold">{phem.ephiStatus}</p>
                      <p className="text-slate-500 text-[11px]">{phem.outcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
