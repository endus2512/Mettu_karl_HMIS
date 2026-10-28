/**
 * IRB Clinical Trials & Medical Resident Procedure Logbook Workstation.
 * Academic teaching hospital research with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface ProtocolItem {
  id: string;
  title: string;
  pi: string;
  dept: string;
  enrolled: number;
  target: number;
  status: 'approved' | 'under_review' | 'completed';
}

interface LogbookEntry {
  id: number;
  trainee: string;
  role: string;
  procedure: string;
  date: string;
  verified: boolean;
  supervisor: string;
}

const initialProtocols: ProtocolItem[] = [
  { id: 'IRB-MKH-2026-01', title: 'Community-Based Management of Pediatric Severe Pneumonia in Illubabor', pi: 'Dr. Tariku Lemma', dept: 'Pediatrics & Child Health', enrolled: 184, target: 200, status: 'approved' },
  { id: 'IRB-MKH-2026-02', title: 'Post-Cesarean Wound Infection Surveillance with Single-Dose Prophylaxis', pi: 'Dr. Senait Fikre', dept: 'Obstetrics & Gynecology', enrolled: 92, target: 150, status: 'approved' },
  { id: 'IRB-MKH-2026-03', title: 'Prevalence of Artemisinin-Partial-Resistance Gene Markers in Southwestern Ethiopia', pi: 'Dr. Chala Worku', dept: 'Pathology & Microbiology', enrolled: 45, target: 300, status: 'under_review' },
];

const initialLogbook: LogbookEntry[] = [
  { id: 1, trainee: 'Dr. Kinde Assefa (R2 Resident)', role: 'Primary Operator', procedure: 'Exploratory Laparotomy & Appendectomy', date: '2026-10-25', verified: true, supervisor: 'Prof. Bekele Tadesse' },
  { id: 2, trainee: 'Dr. Rahel Girma (R1 Resident)', role: 'First Assistant', procedure: 'Closed Reduction & Cast Application of Colles Fracture', date: '2026-10-26', verified: false, supervisor: 'Dr. Chala Gemechu' },
  { id: 3, trainee: 'Dr. Yohannes Tefera (Intern)', role: 'Primary Operator', procedure: 'Diagnostic Lumbar Puncture under Supervision', date: '2026-10-26', verified: false, supervisor: 'Dr. Helen Kassa' },
];

export default function AcademicPage(): React.ReactElement {
  const { t } = useTranslation();
  const [protocols] = useState<ProtocolItem[]>(initialProtocols);
  const [logbooks, setLogbooks] = useState<LogbookEntry[]>(initialLogbook);

  const verifyEntry = (entryId: number) => {
    setLogbooks((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, verified: true } : e))
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  🎓
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('academic_research')} • IRB Trials & Medical Residency Logbook
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Mettu University Academic Teaching Hospital • Ethical Protocol Oversight • Surgical Case Verifications
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-800 border border-teal-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Teaching Hospital Affiliation Active
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active IRB Trials</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">3 Protocols</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Approved by National Ethics Board</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled Cohort</span>
              <p className="mt-2 text-3xl font-black text-teal-800 group-hover:text-teal-950 transition-colors">321 Patients</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Consent verified via e-Sign</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Resident Logbooks</span>
              <p className="mt-2 text-3xl font-black text-amber-800 group-hover:text-amber-950 transition-colors">128 Cases</p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">2 Pending supervisor sign-off</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Publications (2026)</span>
              <p className="mt-2 text-3xl font-black text-purple-700 group-hover:text-purple-950 transition-colors">8 Papers</p>
              <p className="mt-1 text-xs text-purple-600 font-bold">Indexed in PubMed / African Journals</p>
            </div>
          </div>

          {/* Section 1: Clinical Research Trials */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Active IRB Clinical Research Protocols
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2">IRB Code</th>
                    <th className="px-5 py-2">Study Title</th>
                    <th className="px-5 py-2">Principal Investigator</th>
                    <th className="px-5 py-2">Clinical Department</th>
                    <th className="px-5 py-2">Enrollment Progress</th>
                    <th className="px-5 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {protocols.map((p) => (
                    <tr
                      key={p.id}
                      className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                    >
                      <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                        {p.id}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm max-w-sm">
                        {p.title}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700">
                        {p.pi}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-slate-600 font-semibold">
                        {p.dept}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span className="font-bold text-slate-900">{p.enrolled}</span> / {p.target} Patients
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, (p.enrolled / p.target) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          p.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Resident Logbook Verifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Medical Resident Procedure Logbook Sign-Off
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2">Trainee / Level</th>
                    <th className="px-5 py-2">Clinical Role</th>
                    <th className="px-5 py-2">Surgical / Bedside Procedure</th>
                    <th className="px-5 py-2">Date</th>
                    <th className="px-5 py-2">Faculty Supervisor</th>
                    <th className="px-5 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logbooks.map((entry) => (
                    <tr
                      key={entry.id}
                      className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                    >
                      <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900">
                        {entry.trainee}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700">
                        {entry.role}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-semibold text-slate-800">
                        {entry.procedure}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-bold text-slate-500">
                        {entry.date}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-teal-800">
                        {entry.supervisor}
                      </td>
                      <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                        {entry.verified ? (
                          <span className="text-xs font-black text-emerald-700">✓ Signed Off</span>
                        ) : (
                          <button
                            onClick={() => verifyEntry(entry.id)}
                            className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                          >
                            Verify & Sign
                          </button>
                        )}
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
