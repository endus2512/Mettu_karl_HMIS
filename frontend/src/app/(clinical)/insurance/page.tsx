/**
 * CBHI & EHIA Health Insurance Claims and Batch Adjudication Workstation.
 * Insurance adjudication, Woreda capitation, and reimbursement clearance.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Building2,
  ShieldCheck,
  TrendingUp,
  Clock,
  Filter,
  FileCheck,
  Check,
  X
} from 'lucide-react';

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
  { id: 4, claimNum: 'CLM-2026-0094', cbhiId: 'CBHI-HUR-02-33419', patient: 'Tolessa Bekele', service: 'Compound Fracture Debridement & Cast', totalCost: 2850.0, copay: 0.0, claimedAmt: 2850.0, status: 'approved' },
];

export default function InsurancePage(): React.ReactElement {
  const { t } = useTranslation();
  const [claims, setClaims] = useState<ClaimItem[]>(initialClaims);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const adjudicateClaim = (claimId: number, newStatus: 'approved' | 'rejected') => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: newStatus } : c))
    );
  };

  const totalClaimed = useMemo(() => claims.reduce((acc, c) => acc + c.claimedAmt, 0), [claims]);
  const totalApproved = useMemo(() => claims.filter((c) => c.status === 'approved').reduce((acc, c) => acc + c.claimedAmt, 0), [claims]);
  const approvalRate = useMemo(() => {
    const adjudicated = claims.filter((c) => c.status !== 'submitted');
    if (adjudicated.length === 0) return 100;
    const approved = adjudicated.filter((c) => c.status === 'approved').length;
    return Math.round((approved / adjudicated.length) * 100);
  }, [claims]);

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchSearch =
        c.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.claimNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cbhiId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.service.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [claims, searchTerm, statusFilter]);

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
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('insurance_claims')} • CBHI & EHIA Electronic Claims Hub
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ethiopian Health Insurance Agency (EHIA) • Community-Based Health Insurance • Woreda Capitation Clearance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <ShieldCheck className="h-3.5 w-3.5" />
                EHIA Gateway: Connected
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Claims Batch</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <FileCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{claims.length} Claims</p>
              <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">Tikimt 2019 Batch (Oromia Region)</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Claimed</span>
                <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Receipt className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {totalClaimed.toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Hospital essential service package</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Reimbursement</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {totalApproved.toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
              </p>
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Direct credit to CBE bank account</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">EHIA Approval Rate</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">{approvalRate}%</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Zero rejection on standard formulary</p>
            </div>
          </div>

          {/* Claims Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Itemized CBHI Patient Claims Batch
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Adjudicate service claims submitted to Woreda CBHI schemes
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search policy, patient, claim..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="all">All Claims</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Claim ID</th>
                    <th className="px-5 py-3">CBHI Policy #</th>
                    <th className="px-5 py-3">Beneficiary Patient</th>
                    <th className="px-5 py-3">Clinical Service Description</th>
                    <th className="px-5 py-3 font-mono">Claimed (ETB)</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Adjudication Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredClaims.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-teal-700 dark:text-teal-400 font-bold">{c.claimNum}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-300">{c.cbhiId}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-sm">{c.patient}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{c.service}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white font-bold">
                        {c.claimedAmt.toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          c.status === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : c.status === 'rejected'
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {c.status === 'submitted' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => adjudicateClaim(c.id, 'approved')}
                              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => adjudicateClaim(c.id, 'rejected')}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Adjudicated</span>
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
