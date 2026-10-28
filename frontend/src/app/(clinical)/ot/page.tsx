/**
 * Operation Theatre (OT) Scheduling & CSSD Sterilization Management.
 * Surgical suite coordination with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface SurgeryItem {
  code: string;
  room: string;
  patient: string;
  procedure: string;
  surgeon: string;
  time: string;
  status: 'in_surgery' | 'scheduled' | 'recovery';
}

const mockSurgeries: SurgeryItem[] = [
  { code: 'SURG-010', room: 'OT Suite 1 (Major Trauma)', patient: 'Baye Tolera (MKH-2026-000101)', procedure: 'Emergency Appendectomy & Peritonitis Washout', surgeon: 'Dr. Bekele Tadesse', time: '09:00 - 11:30', status: 'in_surgery' },
  { code: 'SURG-011', room: 'OT Suite 2 (Orthopedics)', patient: 'Hawine Dibaba (MKH-2026-000102)', procedure: 'Femur Fracture Open Reduction Internal Fixation (ORIF)', surgeon: 'Dr. Chala Gemechu', time: '11:00 - 14:00', status: 'scheduled' },
  { code: 'SURG-012', room: 'OT Suite 3 (Maternity/Obs)', patient: 'Lensa Duresa (MKH-2026-000103)', procedure: 'Elective Caesarean Section (Twin Delivery)', surgeon: 'Dr. Helen Kassa', time: '13:00 - 15:00', status: 'scheduled' },
];

export default function OTPage(): React.ReactElement {
  const { t } = useTranslation();
  const [surgeries] = useState<SurgeryItem[]>(mockSurgeries);

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
                  🔪
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('ot_cssd')} • Operating Theatre & CSSD Sterilization
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Surgical Table Coordination • Anesthesia Machine Checks • 134°C Autoclave Sterile Pack Tracking
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-800 border border-teal-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                4 Active Operating Suites
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Currently in Surgery</span>
              <p className="mt-2 text-3xl font-black text-rose-900 group-hover:text-rose-950 transition-colors">1 Active Case</p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">Suite 1: Dr. Bekele Tadesse</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-blue-500 hover:bg-blue-50/70 hover:ring-2 hover:ring-blue-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Scheduled Today</span>
              <p className="mt-2 text-3xl font-black text-blue-900 group-hover:text-blue-950 transition-colors">6 Surgeries</p>
              <p className="mt-1 text-xs text-blue-600 font-semibold">2 Ortho • 2 C-Section • 2 General</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">CSSD Sterile Packs</span>
              <p className="mt-2 text-3xl font-black text-teal-900 group-hover:text-teal-950 transition-colors">48 Trays Ready</p>
              <p className="mt-1 text-xs text-teal-600 font-semibold">Biological indicator test passed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Surgery Schedule Cards */}
            <div className="col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Today&apos;s Operating Theatre Surgical Table
              </h3>
              <div className="space-y-3">
                {surgeries.map((s, idx) => (
                  <div
                    key={idx}
                    className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 group-hover:border-teal-200/60 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm group-hover:text-teal-950 transition-colors">{s.room}</span>
                        <span className="font-mono text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 font-bold">
                          {s.code}
                        </span>
                      </div>
                      {s.status === 'in_surgery' && (
                        <span className="rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-[10px] font-black text-rose-800 animate-pulse">
                          🔴 IN SURGERY
                        </span>
                      )}
                      {s.status === 'scheduled' && (
                        <span className="rounded-full bg-blue-100 border border-blue-300 px-3 py-1 text-[10px] font-black text-blue-800">
                          SCHEDULED
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase">Procedure:</span>
                        <span className="font-black text-slate-800">{s.procedure}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase">Lead Surgeon:</span>
                        <span className="font-bold text-teal-800">{s.surgeon}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase">Patient:</span>
                        <span className="font-bold text-slate-700">{s.patient}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase">Scheduled Window:</span>
                        <span className="font-mono font-bold text-slate-700">{s.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CSSD Sterilizer Hub with Rectangular Spotlight */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200 space-y-4">
              <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                CSSD Autoclave Status
              </h3>
              <div className="space-y-3 text-xs font-semibold">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-teal-400 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Autoclave Unit #1 (Tuttnauer)</span>
                    <span className="font-bold text-emerald-700">134°C • 3.2 Bar</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Sterilizing 6 Laparotomy Sets • 18 min remaining</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-teal-400 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Autoclave Unit #2 (Steam)</span>
                    <span className="font-bold text-teal-700">Ready / Standby</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Loaded with 4 Orthopedic Drill Packs</p>
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-2xl bg-teal-600 py-3 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
              >
                Log New Sterile Instrument Batch
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
