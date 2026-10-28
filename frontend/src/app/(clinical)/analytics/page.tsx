/**
 * Executive Business Intelligence (BI) Analytics Dashboard.
 * Leadership KPIs and clinical metrics with responsive rectangular spotlight UX.
 */
'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

export default function AnalyticsPage(): React.ReactElement {
  const { t } = useTranslation();

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
                  📈
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('executive_bi')} • Hospital Leadership & KPI Dashboard
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Real-time BOR • Revenue & CBHI Yield • Department Workload • MoH / RHB Indicator Reporting
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-800 border border-teal-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Live BI Stream Active
              </span>
            </div>
          </div>

          {/* Top Level Metric Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-800 transition-colors">
                Total Registered Patients
              </span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">14,892</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">↑ +14% this month</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-800 transition-colors">
                Bed Occupancy (BOR)
              </span>
              <p className="mt-2 text-3xl font-black text-amber-700 group-hover:text-amber-950 transition-colors">85.0%</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">340 / 400 Total Active Beds</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-800 transition-colors">
                Daily Revenue Collection
              </span>
              <p className="mt-2 text-3xl font-black text-emerald-700 group-hover:text-emerald-950 transition-colors">84,520 ETB</p>
              <p className="mt-1 text-xs text-emerald-600 font-bold">62% Telebirr • 38% Cash</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-800 transition-colors">
                CBHI Insurance Claims
              </span>
              <p className="mt-2 text-3xl font-black text-blue-700 group-hover:text-blue-950 transition-colors">142,300 ETB</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Submitted for regional reimbursement</p>
            </div>
          </div>

          {/* Detailed Performance Sections with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Channel Distribution */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
              <h3 className="mb-4 text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Revenue Stream Breakdown
              </h3>
              <div className="space-y-4 text-xs font-bold">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-teal-400 transition-all">
                  <div className="flex justify-between">
                    <span className="text-slate-800">Telebirr Mobile Payment</span>
                    <span className="font-mono text-teal-800">52,400 ETB (62%)</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-600" style={{ width: '62%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-emerald-400 transition-all">
                  <div className="flex justify-between">
                    <span className="text-slate-800">Hospital Cashier Direct Cash</span>
                    <span className="font-mono text-emerald-800">32,120 ETB (38%)</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '38%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Department Workload Distribution */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
              <h3 className="mb-4 text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Department Workload Today
              </h3>
              <div className="space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:border-teal-400 hover:bg-teal-50/60 transition-all">
                  <span className="font-bold text-slate-800">Outpatient (OPD) Consultations</span>
                  <span className="font-mono font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                    284 Patients
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:border-rose-400 hover:bg-rose-50/60 transition-all">
                  <span className="font-bold text-slate-800">Emergency & Trauma (ED)</span>
                  <span className="font-mono font-black text-rose-800 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                    63 Admissions
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:border-blue-400 hover:bg-blue-50/60 transition-all">
                  <span className="font-bold text-slate-800">Major Operating Theatre (OT) Surgeries</span>
                  <span className="font-mono font-black text-blue-800 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                    12 Cases
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
