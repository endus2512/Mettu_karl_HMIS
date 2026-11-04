/**
 * Hospital Supply Chain, Public Tenders & Vendor Bids Workstation.
 * Ethiopian Public Procurement & Property Administration (FPPA) compliance.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  ShoppingBag,
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Plus,
  TrendingUp,
  Users,
  Award,
  Filter
} from 'lucide-react';

interface TenderItem {
  id: string;
  title: string;
  category: string;
  budgetETB: string;
  deadline: string;
  bidsCount: number;
  status: 'published' | 'in_evaluation' | 'awarded';
}

const initialTenders: TenderItem[] = [
  { id: 'TND-MKH-2026-08', title: 'Annual Procurement of Sterile Surgical Sutures & Laparotomy Packs', category: 'Medical Consumables', budgetETB: '1,850,000 ETB', deadline: '2026-11-15', bidsCount: 4, status: 'published' },
  { id: 'TND-MKH-2026-09', title: 'Procurement of High-Resolution Diagnostic Ultrasound Probes', category: 'Biomedical Assets', budgetETB: '2,400,000 ETB', deadline: '2026-11-05', bidsCount: 3, status: 'in_evaluation' },
  { id: 'TND-MKH-2026-07', title: 'Bulk Supply of Antiretroviral & First-Line Antibiotic Syrups', category: 'Pharmaceuticals', budgetETB: '3,200,000 ETB', deadline: '2026-10-20', bidsCount: 5, status: 'awarded' },
];

export default function ProcurementPage(): React.ReactElement {
  const { t } = useTranslation();
  const [tenders] = useState<TenderItem[]>(initialTenders);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTenders = useMemo(() => {
    if (!searchTerm) return tenders;
    const q = searchTerm.toLowerCase();
    return tenders.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [tenders, searchTerm]);

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
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('procurement_tenders')} • Public Procurement & Vendor Tenders
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ethiopian Public Procurement & Property Administration (FPPA) • Competitive Bidding • Scoring Matrix
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Publish Tender Notice
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Public Tenders</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-teal-700 dark:text-teal-400">{tenders.length} Notices</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Open for certified supplier bidding</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tender Value</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">7.45M ETB</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Annual hospital procurement budget</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered Suppliers</span>
                <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">38 Vendors</p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">Vetted TIN & EFDA license verified</p>
            </div>
          </div>

          {/* Tenders Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Active Procurement Notices & Bidding Portals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Competitive tender advertisements, submission deadlines & bid opening logs
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter tender ref, title..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0b0f17] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Tender Ref #</th>
                    <th className="px-5 py-3">Contract Notice Title</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Estimated Budget</th>
                    <th className="px-5 py-3">Deadline</th>
                    <th className="px-5 py-3">Bids</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1b2334] font-medium">
                  {filteredTenders.map((tender) => (
                    <tr key={tender.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-teal-700 dark:text-teal-400 font-bold">{tender.id}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-sm max-w-sm">{tender.title}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{tender.category}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">{tender.budgetETB}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">{tender.deadline}</td>
                      <td className="px-5 py-3.5 text-slate-800 dark:text-slate-200 font-semibold">{tender.bidsCount} Offers</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tender.status === 'awarded'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : tender.status === 'in_evaluation'
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {tender.status.toUpperCase()}
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
