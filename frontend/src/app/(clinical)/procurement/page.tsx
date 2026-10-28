/**
 * Hospital Supply Chain, Public Tenders & Vendor Bids Workstation.
 * Public procurement with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

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
                  📦
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('procurement_tenders')} • Public Procurement & Vendor Tenders
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Ethiopian Public Procurement & Property Administration (FPPA) • Competitive Bidding • Scoring Matrix
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
              >
                <span>➕</span> Publish New Tender Notice
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-800 transition-colors">Active Public Tenders</p>
              <p className="mt-2 text-3xl font-black text-teal-800 group-hover:text-teal-950 transition-colors">6 Notices</p>
              <p className="mt-1 text-xs text-teal-600 font-semibold">Open for certified supplier bidding</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/70 hover:ring-2 hover:ring-emerald-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Tender Value</p>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">7.45M ETB</p>
              <p className="mt-1 text-xs text-slate-400 font-semibold">Annual hospital procurement allocation</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-blue-500 hover:bg-blue-50/70 hover:ring-2 hover:ring-blue-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Registered Suppliers</p>
              <p className="mt-2 text-3xl font-black text-blue-600 group-hover:text-blue-950 transition-colors">38 Vendors</p>
              <p className="mt-1 text-xs text-blue-600 font-semibold">Vetted TIN, EFDA License & Compliance</p>
            </div>
          </div>

          {/* Tenders Table (Floating Card-Rows) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Active Procurement Notices & Bidding Portals
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2">Tender Ref #</th>
                    <th className="px-5 py-2">Contract Notice Title</th>
                    <th className="px-5 py-2">Category</th>
                    <th className="px-5 py-2">Estimated Budget</th>
                    <th className="px-5 py-2">Deadline</th>
                    <th className="px-5 py-2">Bids</th>
                    <th className="px-5 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map((tender) => (
                    <tr
                      key={tender.id}
                      className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                    >
                      <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                        {tender.id}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm max-w-sm">
                        {tender.title}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700">
                        {tender.category}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-bold text-slate-900">
                        {tender.budgetETB}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-bold text-slate-500">
                        {tender.deadline}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-800">
                        {tender.bidsCount} Offers
                      </td>
                      <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          tender.status === 'awarded'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : tender.status === 'in_evaluation'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
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
