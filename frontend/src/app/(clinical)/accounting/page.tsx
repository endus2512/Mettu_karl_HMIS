/**
 * Full Financial Accounting, General Ledger (GL) & Trial Balance.
 * Double-entry hospital finances with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface AccountLine {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

const mockTrialBalance: AccountLine[] = [
  { code: '1010', name: 'Cash in Hand (Cashier Desks)', type: 'Asset', debit: 345000, credit: 0 },
  { code: '1020', name: 'Commercial Bank of Ethiopia (CBE)', type: 'Asset', debit: 2840000, credit: 0 },
  { code: '1030', name: 'Accounts Receivable (CBHI Insurance)', type: 'Asset', debit: 520000, credit: 0 },
  { code: '1040', name: 'Pharmacy Medication Stock Inventory', type: 'Asset', debit: 1450000, credit: 0 },
  { code: '2010', name: 'Accounts Payable (Pharmaceutical Vendors)', type: 'Liability', debit: 0, credit: 680000 },
  { code: '2020', name: 'Pension Contribution Payable (7% + 11%)', type: 'Liability', debit: 0, credit: 145000 },
  { code: '3010', name: 'Hospital Capital & Surplus Fund', type: 'Equity', debit: 0, credit: 3200000 },
  { code: '4010', name: 'Outpatient Consultation & Triage Revenue', type: 'Revenue', debit: 0, credit: 480000 },
  { code: '4020', name: 'Inpatient Hospitalization & Bed Charges', type: 'Revenue', debit: 0, credit: 380000 },
  { code: '4030', name: 'Dispensary Pharmacy Drug Sales', type: 'Revenue', debit: 0, credit: 620000 },
  { code: '5010', name: 'Clinical Staff Salaries & Allowances', type: 'Expense', debit: 240000, credit: 0 },
  { code: '5020', name: 'Biomedical Maintenance & Utilities', type: 'Expense', debit: 110000, credit: 0 },
];

export default function AccountingPage(): React.ReactElement {
  const { t } = useTranslation();
  const [tbAccounts] = useState<AccountLine[]>(mockTrialBalance);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const totalDebits = tbAccounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = tbAccounts.reduce((sum, a) => sum + a.credit, 0);
  const isBalanced = totalDebits === totalCredits;

  return (
    <ProtectedRoute allowedRoles={['admin', 'billing', 'super_admin']} moduleName="Finance & Bank Ledger" category="financial">
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
                  📑
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('accounting')} • General Ledger & Ethiopian Public Finance
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Double-Entry Chart of Accounts • MOFED Compliance • Automated Daily Trial Balance
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowVoucherModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
              >
                <span>➕</span> Post Journal Voucher
              </button>
            </div>
          </div>

          {/* Balance Indicator & Metric Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Ledger Debits</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors font-mono">
                {totalDebits.toLocaleString()} ETB
              </p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Cash + Bank + Receivables</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Ledger Credits</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors font-mono">
                {totalCredits.toLocaleString()} ETB
              </p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Revenue + Liabilities + Equity</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/70 hover:ring-2 hover:ring-emerald-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Audit Reconciliation</span>
              <p className="mt-2 text-3xl font-black text-emerald-700 group-hover:text-emerald-950 transition-colors">
                {isBalanced ? '✓ Reconciled' : '⚠️ Variance Detected'}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Zero variance between Debits & Credits</p>
            </div>
          </div>

          {/* Trial Balance Table (Floating Card-Rows) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-2">GL Account Code</th>
                  <th className="px-5 py-2">Account Title / Description</th>
                  <th className="px-5 py-2">Account Classification</th>
                  <th className="px-5 py-2 text-right">Debit (ETB)</th>
                  <th className="px-5 py-2 text-right">Credit (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {tbAccounts.map((line) => (
                  <tr
                    key={line.code}
                    className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                  >
                    <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                      {line.code}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-900 text-sm">
                      {line.name}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                      <span className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1 font-bold text-slate-700 text-xs">
                        {line.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-bold text-slate-900 text-right">
                      {line.debit > 0 ? line.debit.toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-bold text-slate-900 text-right">
                      {line.credit > 0 ? line.credit.toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Journal Voucher Modal */}
          {showVoucherModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border-2 border-teal-500 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">Post Double-Entry Journal Voucher</h3>
                  <button
                    onClick={() => setShowVoucherModal(false)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Debit Account</label>
                    <select className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-xs font-bold">
                      <option>1020 - Commercial Bank of Ethiopia (CBE)</option>
                      <option>1010 - Cash in Hand</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Credit Account</label>
                    <select className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-xs font-bold">
                      <option>4010 - Outpatient Consultation Revenue</option>
                      <option>4030 - Dispensary Drug Sales</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Amount (ETB)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setShowVoucherModal(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowVoucherModal(false)}
                    className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer shadow-sm"
                  >
                    Post to Ledger
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
