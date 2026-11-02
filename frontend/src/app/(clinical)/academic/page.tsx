/**
 * IRB Clinical Trials & Medical Resident Procedure Logbook Workstation.
 * Academic teaching hospital research, residency training & surgical case logs.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  GraduationCap,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Sparkles,
  Layers,
  Search,
  Check,
  Award
} from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  const verifyEntry = (entryId: number) => {
    setLogbooks((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, verified: true } : e))
    );
  };

  const totalEnrolled = useMemo(() => protocols.reduce((acc, p) => acc + p.enrolled, 0), [protocols]);
  const pendingLogbookCount = useMemo(() => logbooks.filter((l) => !l.verified).length, [logbooks]);

  const filteredLogbook = useMemo(() => {
    if (!searchTerm) return logbooks;
    const q = searchTerm.toLowerCase();
    return logbooks.filter(
      (l) =>
        l.trainee.toLowerCase().includes(q) ||
        l.procedure.toLowerCase().includes(q) ||
        l.supervisor.toLowerCase().includes(q)
    );
  }, [logbooks, searchTerm]);

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
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('academic_research')} • IRB Trials & Medical Residency Logbook
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mettu University Academic Teaching Hospital • Ethical Protocol Oversight • Surgical Case Verifications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <Award className="h-3.5 w-3.5" />
                Teaching Hospital Affiliation Active
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active IRB Trials</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <BookOpen className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{protocols.length} Protocols</p>
              <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">Approved by National Ethics Review Board</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Enrolled Cohort</span>
                <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <UserCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalEnrolled} Patients</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Informed consent verified via e-Sign</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resident Logbooks</span>
                <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <FileCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{logbooks.length} Procedures</p>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">{pendingLogbookCount} Pending supervisor sign-off</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Publications (2026)</span>
                <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <GraduationCap className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">8 Papers</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Indexed in PubMed / African Journals Online</p>
            </div>
          </div>

          {/* Section 1: Clinical Research Trials Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Active Institutional Review Board (IRB) Protocols
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clinical trials and epidemiological studies currently recruiting patients
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">IRB Code</th>
                    <th className="px-5 py-3">Study Title</th>
                    <th className="px-5 py-3">Principal Investigator</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Enrollment Progress</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {protocols.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-teal-700 dark:text-teal-400 font-bold">{p.id}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-sm max-w-sm">{p.title}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{p.pi}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{p.dept}</td>
                      <td className="px-5 py-3.5 min-w-[160px]">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">{p.enrolled}</span>
                          <span className="text-slate-400">/ {p.target} Patients</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teal-600 dark:bg-teal-500"
                            style={{ width: `${Math.min(100, (p.enrolled / p.target) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.status === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
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

          {/* Section 2: Resident Logbook Verifications Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Medical Resident Procedure Logbook Sign-Off
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Supervised surgical cases, bedside procedures & clinical competencies
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter trainee, procedure..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Trainee / Level</th>
                    <th className="px-5 py-3">Clinical Role</th>
                    <th className="px-5 py-3">Surgical / Bedside Procedure</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Faculty Supervisor</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredLogbook.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{entry.trainee}</td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{entry.role}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{entry.procedure}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">{entry.date}</td>
                      <td className="px-5 py-3.5 text-teal-700 dark:text-teal-400 font-semibold">{entry.supervisor}</td>
                      <td className="px-5 py-3.5 text-right">
                        {entry.verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Signed Off
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => verifyEntry(entry.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
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
