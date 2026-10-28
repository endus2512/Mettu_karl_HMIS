/**
 * CBHI & EHIA Health Insurance Claims and Batch Adjudication Workstation.
 * Insurance adjudication with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface ClaimItem {
  id: number;
  claimNum: string;
  cbhiId: string;
  patient: string;
  service: string;
  totalCost: number;
  copay: number;
  claimedAmt: number;
  status: 'submitted' | 'approved' | 'rejected';
}

const initialClaims: ClaimItem[] = [
  { id: 1, claimNum: 'CLM-2026-0091', cbhiId: 'CBHI-MET-04-88912', patient: 'Chaltu Benti', service: 'Emergency C-Section & 3-Day Inpatient', totalCost: 4200.0, copay: 0.0, claimedAmt: 4200.0, status: 'approved' },
  { id: 2, claimNum: 'CLM-2026-0092', cbhiId: 'CBHI-MET-01-10294', patient: 'Gudeta Hailu', service: 'OPD Consultation, Blood Labs & Oral Antibiotics', totalCost: 350.0, copay: 0.0, claimedAmt: 350.0, status: 'submitted' },
  { id: 3, claimNum: 'CLM-2026-0093', cbhiId: 'CBHI-YAYO-03-55102', patient: 'Ayantu Mamo', service: 'Ultrasonography & Antenatal Folate Supply', totalCost: 580.0, copay: 0.0, claimedAmt: 580.0, status: 'submitted' },
];

export default function InsurancePage(): React.ReactElement {
  const { t } = useTranslation();
  const [claims, setClaims] = useState<ClaimItem[]>(initialClaims);

  const adjudicateClaim = (claimId: number, newStatus: 'approved' | 'rejected') => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: newStatus } : c))
    );
  };

  const totalClaimed = claims.reduce((acc, c) => acc + c.claimedAmt, 0);
  const totalApproved = claims.filter((c) => c.status === 'approved').reduce((acc, c) => acc + c.claimedAmt, 0);

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
                  🧾
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('insurance_claims')} • CBHI & EHIA Electronic Claims Hub
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Ethiopian Health Insurance Agency (EHIA) • Community-Based Health Insurance • Woreda Capitation
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-800 border border-teal-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                EHIA Gateway: Online
              </span>
            </div>
          </div>

          {/* Aggregate Claims Metrics with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Claims Submitted</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">{claims.length} Claims</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Tikimt 2019 Batch</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Claimed Value</span>
              <p className="mt-2 text-3xl font-black text-teal-800 group-hover:text-teal-950 transition-colors font-mono">{totalClaimed.toLocaleString()} ETB</p>
              <p className="mt-1 text-xs text-slate-400 font-semibold">Hospital service package</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/70 hover:ring-2 hover:ring-emerald-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved Reimbursement</span>
              <p className="mt-2 text-3xl font-black text-emerald-700 group-hover:text-emerald-950 transition-colors font-mono">{totalApproved.toLocaleString()} ETB</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Transferred to hospital CBE account</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">EHIA Approval Rate</span>
              <p className="mt-2 text-3xl font-black text-blue-700 group-hover:text-blue-950 transition-colors">98.2%</p>
              <p className="mt-1 text-xs text-blue-600 font-bold">Zero rejection on essential drugs</p>
            </div>
          </div>

          {/* Claims Table (Floating Card-Rows Table) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Itemized CBHI Patient Claims Batch
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2">Claim ID</th>
                    <th className="px-5 py-2">CBHI Policy #</th>
                    <th className="px-5 py-2">Beneficiary Patient</th>
                    <th className="px-5 py-2">Clinical Service Description</th>
                    <th className="px-5 py-2 font-mono">Claimed (ETB)</th>
                    <th className="px-5 py-2">Status</th>
                    <th className="px-5 py-2 text-right">Adjudication</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c) => (
                    <tr
                      key={c.id}
                      className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                    >
                      <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                        {c.claimNum}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-bold text-slate-600">
                        {c.cbhiId}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm">
                        {c.patient}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-semibold text-slate-700">
                        {c.service}
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-slate-900">
                        {c.claimedAmt.toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          c.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : c.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        }`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                        {c.status === 'submitted' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => adjudicateClaim(c.id, 'approved')}
                              className="rounded-xl bg-teal-600 px-3 py-1 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => adjudicateClaim(c.id, 'rejected')}
                              className="rounded-xl border border-rose-300 px-3 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Adjudicated</span>
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
