/**
 * Mettu Karl Referral Hospital — Laboratory LIS & Diagnostics Dashboard
 * Dedicated operational view for Laboratory Technologists and Pathologists.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import {
  FlaskConical,
  Microscope,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Scan,
  ShieldCheck,
  ArrowRight,
  Flame,
  Activity,
} from 'lucide-react';

interface SpecimenOrder {
  specimenId: string;
  mrn: string;
  patientName: string;
  testName: string;
  department: string;
  priority: 'stat' | 'urgent' | 'routine';
  status: 'received' | 'analyzing' | 'completed';
}

const INITIAL_SPECIMENS: SpecimenOrder[] = [
  {
    specimenId: 'SPEC-2026-8801',
    mrn: 'MKH-2026-000101',
    patientName: 'Gudeta Hailu Tadesse',
    testName: 'Serum Electrolytes (Na+, K+, Cl-)',
    department: 'Clinical Chemistry',
    priority: 'stat',
    status: 'analyzing',
  },
  {
    specimenId: 'SPEC-2026-8802',
    mrn: 'MKH-2026-000102',
    patientName: 'Ayantu Mamo Kassa',
    testName: 'Complete Blood Count (CBC) + Diff',
    department: 'Hematology',
    priority: 'urgent',
    status: 'received',
  },
  {
    specimenId: 'SPEC-2026-8803',
    mrn: 'MKH-2026-000104',
    patientName: 'Chala Tolera Lemma',
    testName: 'Cardiac Troponin I (High Sensitivity)',
    department: 'Immunoassay',
    priority: 'stat',
    status: 'analyzing',
  },
  {
    specimenId: 'SPEC-2026-8804',
    mrn: 'MKH-2026-000105',
    patientName: 'Chaltu Daba Tolasa',
    testName: 'Blood Grouping & Crossmatch (Packed RBC 2U)',
    department: 'Blood Bank',
    priority: 'urgent',
    status: 'received',
  },
];

export function LabTechDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const [specimens, setSpecimens] = useState<SpecimenOrder[]>(INITIAL_SPECIMENS);

  const handleMarkComplete = (specimenId: string) => {
    setSpecimens((prev) =>
      prev.map((s) => (s.specimenId === specimenId ? { ...s, status: 'completed' } : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. LIS HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#101624] border border-[#222b3d] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Qorannoo Laabooratorii & Dhiigaa (LIS)'
                  : lang === 'am'
                  ? 'የላቦራቶሪና የደም ምርመራ ማዕከል (LIS)'
                  : 'Laboratory Information System (LIS) Command'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-semibold">
                CORE LIS ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'om'
                ? 'To\'annoo saampilaa, meeshaalee yaalaa (analyzers), fi qulqullina qorannoo (QC)'
                : 'Specimen intake workflow, automated analyzer telemetry, and panic value notifications'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/laboratory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Microscope className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Laabooratorii Guutuu' : 'Full LIS'}</span>
          </Link>
          <Link
            href="/blood-bank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-rose-300 text-xs font-semibold transition cursor-pointer"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Kuusaa Dhiigaa' : 'Blood Bank'}</span>
          </Link>
          <Link
            href="/pacs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-purple-300 text-xs font-semibold transition cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'PACS / X-Ray' : 'PACS Imaging'}</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Qorannoo Eeggachaa Jiru' : 'Pending Specimens'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400">14</span>
              <span className="text-[11px] text-cyan-400/90 font-medium">in queue</span>
            </div>
            <p className="text-[10px] text-slate-500">Hematology, Chem & Urine</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'STAT Hatattamaa' : 'STAT Urgent Orders'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">4</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                IMMEDIATE
              </span>
            </div>
            <p className="text-[10px] text-rose-400/80">Troponin, Crossmatch 2U</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Bu\'aa Panic Alert' : 'Panic Values Logged'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">2</span>
              <span className="text-[11px] text-amber-400 font-medium">notified</span>
            </div>
            <p className="text-[10px] text-slate-500">Dr. Bekele confirmed</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Qulqullina Meeshaa (QC)' : 'Analyzer QC Status'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">100%</span>
              <span className="text-[11px] text-emerald-400 font-medium">valid</span>
            </div>
            <p className="text-[10px] text-slate-500">Alinity & Sysmex Calibrated</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SPECIMEN TESTING WORKLIST */}
      <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'om' ? 'Tarree Saampilaa Qoratamuuf Jiranii' : 'Active Specimen Worklist'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Direct HL7 / ASTM Pipeline
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1f293d] pb-2">
              <tr>
                <th className="pb-2">Specimen ID / MRN</th>
                <th className="pb-2">{lang === 'om' ? 'Dhukkubsataa' : 'Patient Name'}</th>
                <th className="pb-2">{lang === 'om' ? 'Qorannoo Gaafatame' : 'Test Panel'}</th>
                <th className="pb-2">{lang === 'om' ? 'Kutaa (Dept)' : 'Department'}</th>
                <th className="pb-2">Priority</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2336]">
              {specimens.map((s) => (
                <tr key={s.specimenId} className="hover:bg-[#141b2b] transition">
                  <td className="py-3 font-mono">
                    <span className="font-bold text-cyan-400 block">{s.specimenId}</span>
                    <span className="text-[10px] text-slate-500">{s.mrn}</span>
                  </td>
                  <td className="py-3 font-semibold text-white">
                    {s.patientName}
                  </td>
                  <td className="py-3 text-slate-200">
                    {s.testName}
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">
                    {s.department}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        s.priority === 'stat'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : s.priority === 'urgent'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                      }`}
                    >
                      {s.priority}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        s.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : s.status === 'analyzing'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {s.status !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => handleMarkComplete(s.specimenId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold shadow-md transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{lang === 'om' ? 'Galmeessi' : 'Complete'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        ✓ {lang === 'om' ? 'Mirkanaa\'e' : 'Verified'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
