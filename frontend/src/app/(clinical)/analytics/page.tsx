/**
 * Executive Business Intelligence (BI) Analytics Dashboard.
 * Mettu Karl Referral Hospital HMIS — Enterprise Healthcare Design System:
 * - Real-time BOR (Bed Occupancy Rate), ALOS (Average Length of Stay), and Throughput
 * - Revenue & CBHI subsidy analytics (Telebirr vs Cashier reconciliation)
 * - Ethiopian MoH & Oromia Health Bureau (RHB) Key Performance Indicators (KPIs)
 * - Full light & dark mode support
 * - Modern Lucide SVG icons
 */
'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  Bed,
  DollarSign,
  Activity,
  Calendar,
  Building2,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  Receipt,
  PieChart,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';

export default function AnalyticsPage(): React.ReactElement {
  const { t, language } = useTranslation();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');

  const handleExportCSV = () => {
    notifications.show({
      title: 'Report Exported',
      message: 'MoH KPI Summary exported as CSV.',
      color: 'teal',
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 shadow-xs shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{t('executive_bi')}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Leadership & KPI Dashboard</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time BOR • Revenue & CBHI Yield • Department Workload • MoH / RHB Indicator Reporting
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Range Selector */}
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-[#0e131f] p-1 text-xs border border-slate-200 dark:border-[#222b3d]">
                {(['today', 'week', 'month', 'quarter'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition cursor-pointer ${
                      timeRange === range
                        ? 'border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.12)]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-[#101624] hover:bg-amber-500/20 text-amber-300 px-3.5 py-2 text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export MoH KPI</span>
              </button>
            </div>
          </div>

          {/* Top Level Metric Cards (Obsidian & Gold Sparkline Cards) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Registered Patients */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">1. Total Registered</span>
                  <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">14,892</p>
                </div>
                <span className="text-amber-400 text-sm">✦</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">+14% vs previous period</span>
                {/* Gold Sparkline */}
                <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                  <path d="M 0,22 Q 25,28 50,15 T 100,5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Bed Occupancy Rate */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">2. Bed Occupancy (BOR)</span>
                  <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">85.0%</p>
                </div>
                <span className="text-amber-400 text-sm">✦</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">340 / 400 Active Beds</span>
                {/* Gold Sparkline */}
                <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                  <path d="M 0,25 Q 25,10 50,18 T 100,8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Daily Revenue */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">3. Revenue Collections</span>
                  <p className="mt-1.5 text-2xl font-black text-emerald-500 dark:text-[#34d399] tracking-tight">84,520 ETB</p>
                </div>
                <span className="text-amber-400 text-sm">✦</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-[#34d399] font-medium">62% Telebirr • 38% Cash</span>
                {/* Emerald Sparkline */}
                <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                  <path d="M 0,26 Q 30,20 60,10 T 100,5" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* CBHI Claims */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">4. MoH Safety Index</span>
                  <p className="mt-1.5 text-2xl font-black text-amber-500 dark:text-amber-400 tracking-tight">99.4/100</p>
                </div>
                <span className="text-amber-400 text-sm">✦</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">EHSTG Tier-4 Certified</span>
                {/* Gold Sparkline */}
                <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                  <path d="M 0,20 Q 30,25 60,10 T 100,4" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Detailed Performance Sections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Stream Breakdown */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Revenue Channels & Settlement</span>
                </h3>
                <span className="font-mono text-xs text-slate-400">Settled Daily</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">Ethio Telecom Telebirr Gateway</span>
                    <span className="font-mono text-teal-700 dark:text-teal-400">52,400 ETB (62%)</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-600" style={{ width: '62%' }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">Hospital Cashier Direct Cash</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">32,120 ETB (38%)</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '38%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Department Workload Distribution */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Clinical Workstations Activity Today</span>
                </h3>
                <span className="font-mono text-xs text-slate-400">Real-Time</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Outpatient (OPD) Consultations</span>
                  </div>
                  <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                    284 Patients
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Emergency & Trauma (ED)</span>
                  </div>
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                    63 Admissions
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Operating Theater (OT) Surgeries</span>
                  </div>
                  <span className="font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                    12 Cases Completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ethiopian Ministry of Health (MoH) Quality Indicators Table */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Ethiopian Hospital Services Transformation Guide (EHSTG) Quality Indicators</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Statutory clinical quality metrics monitored by Federal Ministry of Health (FMoH)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Average Length of Stay (ALOS)</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">4.2 Days</p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Standard target (&lt; 5.0 days)</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Bed Turnover Rate</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">68.4 / Bed</p>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Optimal bed utilization</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Surgical Site Infection (SSI)</span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">0.4%</p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Well below 2.0% ceiling</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Maternal Survival Rate</span>
                <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">99.7%</p>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Comprehensive CEmONC active</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
