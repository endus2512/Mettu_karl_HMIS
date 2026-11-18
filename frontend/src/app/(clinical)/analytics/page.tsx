/**
 * Executive Business Intelligence (BI) Analytics Dashboard.
 * Mettu Karl Referral Hospital HMIS — Live Database-Driven KPIs & Real CSV Export:
 * - Live API integration with GET /api/v1/analytics/executive-summary?time_range=...
 * - Real downloadable MoH / EHSTG CSV report via GET /api/v1/analytics/executive-summary/export
 * - Dynamic BOR, ALOS, Bed Turnover, Revenue & CBHI Channels, Ward Census, OT/Lab/Pharmacy metrics
 * - Zero hardcoded dummy numbers; full Light/Dark & Trilingual (EN / OM / AM) support
 */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  Activity,
  ShieldCheck,
  Download,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  PieChart,
  RefreshCw,
  BedDouble,
  FlaskConical,
  Pill,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';
import apiClient from '@/lib/api';

type TimeRange = 'today' | 'week' | 'month' | 'quarter';

interface RevenueMetric {
  category: string;
  total_birr: number;
  percentage: number;
}

interface DepartmentWorkload {
  department: string;
  patient_count: number;
}

interface WardOccupancyMetric {
  ward_code: string;
  ward_name: string;
  total_beds: number;
  occupied_beds: number;
  occupancy_percent: number;
}

interface ExecutiveSummaryData {
  time_range: string;
  generated_at: string;
  total_patients_registered: number;
  new_patients_in_period: number;
  patient_growth_percent: number;
  outpatients_today: number;
  active_inpatient_admissions: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  bed_occupancy_rate_percent: number;
  daily_gross_revenue_etb: number;
  telebirr_collection_etb: number;
  cash_collection_etb: number;
  cbhi_claims_etb: number;
  revenue_breakdown: RevenueMetric[];
  outpatient_triage_distribution: DepartmentWorkload[];
  ward_occupancy_breakdown: WardOccupancyMetric[];
  pharmacy_low_stock_count: number;
  pharmacy_expiring_soon_count: number;
  emergency_admissions_in_period: number;
  ot_surgeries_total: number;
  ot_surgeries_completed: number;
  lab_orders_total: number;
  lab_orders_completed: number;
  average_length_of_stay_days: number;
  bed_turnover_rate: number;
  hai_cases_count: number;
  surgical_site_infection_rate_percent: number;
  moh_safety_index_score: number;
}

const RANGE_LABELS: Record<TimeRange, { en: string; om: string; am: string }> = {
  today: { en: 'Today', om: 'Harʼa', am: 'ዛሬ' },
  week: { en: 'Week', om: 'Torban', am: 'ሳምንት' },
  month: { en: 'Month', om: 'Jiʼa', am: 'ወር' },
  quarter: { en: 'Quarter', om: 'Kurmaana', am: 'ሩብ ዓመት' },
};

function formatCurrencyETB(amount: number): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ETB`;
}

export default function AnalyticsPage(): React.ReactElement {
  const { t, language } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [data, setData] = useState<ExecutiveSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchExecutiveSummary = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get<ExecutiveSummaryData>('/analytics/executive-summary', {
        params: { time_range: range },
      });
      setData(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setErrorMsg(
          language === 'om'
            ? 'Daataan Executive BI kun hayyama Admin qofaaf banaadha.'
            : language === 'am'
            ? 'ይህ የበላይ አመራር ዳሽቦርድ ለአስተዳዳሪዎች ብቻ የተፈቀደ ነው።'
            : 'Executive BI analytics requires Administrator privileges (HTTP 403).'
        );
      } else if (status === 401) {
        setErrorMsg(
          language === 'om'
            ? 'Mee dura akkaawuntii Admin keessaniin seenaa.'
            : 'Please sign in with an Administrator account to load live metrics.'
        );
      } else {
        setErrorMsg(
          language === 'om'
            ? 'Daataa live database irraa fiduun hin dandaʼamne. Mee irra deebiʼii yaali.'
            : 'Unable to load live executive metrics from the hospital server. Please retry.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void fetchExecutiveSummary(timeRange);
  }, [timeRange, fetchExecutiveSummary]);

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await apiClient.get('/analytics/executive-summary/export', {
        params: { time_range: timeRange },
        responseType: 'blob',
      });

      const disposition = String(res.headers['content-disposition'] || '');
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const todayStamp = new Date().toISOString().slice(0, 10);
      const filename = match?.[1] || `mettu-karl-moh-kpi-${timeRange}-${todayStamp}.csv`;

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      notifications.show({
        title: language === 'om' ? 'Gabaasni CSV Buufameera' : 'CSV Report Downloaded',
        message: `${filename}`,
        color: 'teal',
      });
    } catch {
      notifications.show({
        title: language === 'om' ? 'Buusuun Hin Milkoofne' : 'Export Failed',
        message:
          language === 'om'
            ? 'Faayilii CSV serverii irraa buusuun hin dandaʼamne.'
            : 'Could not download MoH KPI CSV report from server.',
        color: 'red',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const telebirrPct =
    data?.revenue_breakdown.find((r) => r.category.toLowerCase().includes('telebirr'))?.percentage ?? 0;
  const cashPct =
    data?.revenue_breakdown.find((r) => r.category.toLowerCase().includes('cash'))?.percentage ?? 0;
  const cbhiPct =
    data?.revenue_breakdown.find((r) => r.category.toLowerCase().includes('cbhi'))?.percentage ?? 0;

  const lastUpdatedLabel = data?.generated_at
    ? new Date(data.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 shadow-xs shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
                  <span>{t('executive_bi')}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                    {language === 'om' ? 'Daashboordii KPI Live' : 'Leadership & Live KPI Dashboard'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    LIVE DB • {lastUpdatedLabel}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time BOR • Revenue &amp; CBHI Yield • Department Workload • MoH / EHSTG Indicator Reporting
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
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      timeRange === range
                        ? 'border border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.12)]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200'
                    }`}
                  >
                    {RANGE_LABELS[range][language === 'om' ? 'om' : language === 'am' ? 'am' : 'en']}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => void fetchExecutiveSummary(timeRange)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-60"
                title="Refresh live metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{language === 'om' ? 'Haaromsi' : 'Refresh'}</span>
              </button>

              {/* Real Export CSV Button */}
              <button
                type="button"
                onClick={() => void handleExportCSV()}
                disabled={isExporting || !data}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-[#101624] hover:bg-amber-500/20 text-amber-300 px-3.5 py-2 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{language === 'om' ? 'CSV Buusi (MoH KPI)' : 'Export MoH KPI CSV'}</span>
              </button>
            </div>
          </div>

          {/* Error Alert Banner */}
          {errorMsg && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-xs text-rose-800 dark:text-rose-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-medium">{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => void fetchExecutiveSummary(timeRange)}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition cursor-pointer shrink-0"
              >
                {language === 'om' ? 'Irra deebiʼi' : 'Retry'}
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && !data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse"
                >
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="mt-4 h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="mt-3 h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : data ? (
            <>
              {/* Top Level Live Metric Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Registered Patients */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        1. {language === 'om' ? 'Walii Gala Dhukkubsattootaa' : 'Total Registered'}
                      </span>
                      <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {data.total_patients_registered.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-amber-400 text-sm">✦</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      +{data.new_patients_in_period} ({data.patient_growth_percent >= 0 ? '+' : ''}
                      {data.patient_growth_percent}%)
                    </span>
                    <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                      <path d="M 0,22 Q 25,28 50,15 T 100,5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 2. Live Bed Occupancy Rate */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        2. {language === 'om' ? 'Qabama Siree (BOR)' : 'Bed Occupancy (BOR)'}
                      </span>
                      <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {data.bed_occupancy_rate_percent.toFixed(1)}%
                      </p>
                    </div>
                    <span className="text-amber-400 text-sm">✦</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {data.occupied_beds} / {data.total_beds} Beds ({data.available_beds} Free)
                    </span>
                    <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                      <path d="M 0,25 Q 25,10 50,18 T 100,8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 3. Live Revenue Collections */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        3. {language === 'om' ? 'Galii Walitti Qabame' : 'Revenue Collections'}
                      </span>
                      <p className="mt-1.5 text-2xl font-black text-emerald-600 dark:text-[#34d399] tracking-tight">
                        {formatCurrencyETB(data.daily_gross_revenue_etb)}
                      </p>
                    </div>
                    <span className="text-amber-400 text-sm">✦</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-emerald-600 dark:text-[#34d399] font-medium">
                      {telebirrPct}% Telebirr • {cashPct}% Cash • {cbhiPct}% CBHI
                    </span>
                    <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                      <path d="M 0,26 Q 30,20 60,10 T 100,5" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 4. MoH Safety Index */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        4. {language === 'om' ? 'Sadarkaa Nageenya MoH' : 'MoH Safety Index'}
                      </span>
                      <p className="mt-1.5 text-2xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                        {data.moh_safety_index_score.toFixed(1)}/100
                      </p>
                    </div>
                    <span className="text-amber-400 text-sm">✦</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {data.hai_cases_count} HAI • {data.pharmacy_low_stock_count} Low Stock
                    </span>
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
                      <span>Revenue Channels &amp; CBHI Settlement</span>
                    </h3>
                    <span className="font-mono text-xs text-slate-400 uppercase">{data.time_range}</span>
                  </div>

                  <div className="space-y-3">
                    {data.revenue_breakdown.map((item) => {
                      const isTelebirr = item.category.toLowerCase().includes('telebirr');
                      const isCash = item.category.toLowerCase().includes('cash');
                      const barColor = isTelebirr
                        ? 'bg-teal-600'
                        : isCash
                        ? 'bg-emerald-500'
                        : 'bg-amber-500';
                      const textColor = isTelebirr
                        ? 'text-teal-700 dark:text-teal-400'
                        : isCash
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400';

                      return (
                        <div
                          key={item.category}
                          className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        >
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800 dark:text-slate-200">{item.category}</span>
                            <span className={`font-mono ${textColor}`}>
                              {formatCurrencyETB(item.total_birr)} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clinical Workstations Activity */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Clinical Workstations Activity ({RANGE_LABELS[timeRange].en})</span>
                    </h3>
                    <span className="font-mono text-xs text-emerald-500">Live SQL</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Outpatient (OPD) Queue Visits
                        </span>
                      </div>
                      <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                        {data.outpatients_today.toLocaleString()} Visits
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Emergency &amp; Trauma (ED) Admissions
                        </span>
                      </div>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        {data.emergency_admissions_in_period.toLocaleString()} Admissions
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Operating Theater (OT) Surgeries
                        </span>
                      </div>
                      <span className="font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {data.ot_surgeries_completed} / {data.ot_surgeries_total} Completed
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Laboratory LIS Orders Verified
                        </span>
                      </div>
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                        {data.lab_orders_completed} / {data.lab_orders_total} Completed
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Pharmacy FEFO Inventory Alerts
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        {data.pharmacy_low_stock_count} Low • {data.pharmacy_expiring_soon_count} Expiring
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ward Bed Census & OPD Department Breakdown */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Live Ward Occupancy */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Live Ward Bed Occupancy Breakdown</span>
                    </h3>
                    <span className="font-mono text-xs text-slate-400">
                      {data.active_inpatient_admissions} Active IPD
                    </span>
                  </div>

                  {data.ward_occupancy_breakdown.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                      No active inpatient wards configured yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {data.ward_occupancy_breakdown.map((ward) => (
                        <div
                          key={ward.ward_code}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        >
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800 dark:text-slate-200">
                              {ward.ward_name}{' '}
                              <span className="font-mono text-[11px] text-slate-400">({ward.ward_code})</span>
                            </span>
                            <span className="font-mono text-teal-700 dark:text-teal-400">
                              {ward.occupied_beds} / {ward.total_beds} ({ward.occupancy_percent}%)
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                ward.occupancy_percent >= 85
                                  ? 'bg-rose-500'
                                  : ward.occupancy_percent >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-teal-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, ward.occupancy_percent))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* OPD Department Queue Distribution */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>OPD Department Queue Distribution</span>
                    </h3>
                    <span className="font-mono text-xs text-slate-400">
                      {data.outpatient_triage_distribution.length} Active Depts
                    </span>
                  </div>

                  {data.outpatient_triage_distribution.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                      No OPD queue tickets recorded in this time range ({RANGE_LABELS[timeRange].en}).
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.outpatient_triage_distribution.map((dept) => {
                        const pct =
                          data.outpatients_today > 0
                            ? Math.round((dept.patient_count / data.outpatients_today) * 100)
                            : 0;
                        return (
                          <div
                            key={dept.department}
                            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                          >
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-800 dark:text-slate-200">{dept.department}</span>
                              <span className="font-mono text-sky-700 dark:text-sky-400">
                                {dept.patient_count} Visits ({pct}%)
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Ethiopian Ministry of Health (MoH) EHSTG Quality Indicators */}
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Ethiopian Hospital Services Transformation Guide (EHSTG) Quality Indicators</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Computed live from Mettu Karl Referral Hospital clinical &amp; infection surveillance tables
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Average Length of Stay (ALOS)
                    </span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {data.average_length_of_stay_days.toFixed(1)} Days
                    </p>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {data.average_length_of_stay_days <= 5.0
                        ? 'Within FMoH target (< 5.0 days)'
                        : 'Above 5.0-day benchmark'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Bed Turnover Rate
                    </span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {data.bed_turnover_rate.toFixed(2)} / Bed
                    </p>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                      Discharges per active bed ({data.time_range})
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Surgical Site Infection (SSI)
                    </span>
                    <p
                      className={`text-xl font-bold mt-1 ${
                        data.surgical_site_infection_rate_percent <= 2.0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {data.surgical_site_infection_rate_percent.toFixed(2)}%
                    </p>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {data.surgical_site_infection_rate_percent <= 2.0
                        ? 'Below 2.0% EHSTG ceiling'
                        : 'Exceeds 2.0% ceiling — review IPPS'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      MoH Safety &amp; Readiness Index
                    </span>
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                      {data.moh_safety_index_score.toFixed(1)}%
                    </p>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                      Live HAI + WHO Checklist + Stock Index
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
