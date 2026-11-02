/**
 * Full Financial Accounting, General Ledger (GL) & Trial Balance.
 * Double-entry hospital finances, MoFED & public expenditure compliance.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Landmark,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  X,
  CreditCard,
  Building2,
  Filter
} from 'lucide-react';

interface AccountLine {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  debit: number;
  credit: number;
}

const mockTrialBalance: AccountLine[] = [
  { code: '1010', name: 'Cash in Hand (Hospital Cashier Desks)', type: 'Asset', debit: 345000, credit: 0 },
  { code: '1020', name: 'Commercial Bank of Ethiopia (CBE Operational)', type: 'Asset', debit: 2840000, credit: 0 },
  { code: '1030', name: 'Accounts Receivable (CBHI & EHIA Claims)', type: 'Asset', debit: 520000, credit: 0 },
  { code: '1040', name: 'Pharmacy Medication & Consumable Inventory', type: 'Asset', debit: 1450000, credit: 0 },
  { code: '2010', name: 'Accounts Payable (Pharmaceutical Vendors)', type: 'Liability', debit: 0, credit: 680000 },
  { code: '2020', name: 'Pension Contribution Payable (7% + 11%)', type: 'Liability', debit: 0, credit: 145000 },
  { code: '3010', name: 'Hospital Capital & MoH Surplus Fund', type: 'Equity', debit: 0, credit: 3200000 },
  { code: '4010', name: 'Outpatient Consultation & Triage Revenue', type: 'Revenue', debit: 0, credit: 480000 },
  { code: '4020', name: 'Inpatient Hospitalization & Bed Charges', type: 'Revenue', debit: 0, credit: 380000 },
  { code: '4030', name: 'Dispensary Pharmacy Drug Sales', type: 'Revenue', debit: 0, credit: 620000 },
  { code: '5010', name: 'Clinical Staff Salaries & Allowances', type: 'Expense', debit: 240000, credit: 0 },
  { code: '5020', name: 'Biomedical Maintenance & Utilities', type: 'Expense', debit: 110000, credit: 0 },
];

export default function AccountingPage(): React.ReactElement {
  const { t } = useTranslation();
  const [tbAccounts, setTbAccounts] = useState<AccountLine[]>(mockTrialBalance);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Voucher form state
  const [vDebitCode, setVDebitCode] = useState('1020');
  const [vCreditCode, setVCreditCode] = useState('4010');
  const [vAmount, setVAmount] = useState('');

  const totalDebits = useMemo(() => tbAccounts.reduce((sum, a) => sum + a.debit, 0), [tbAccounts]);
  const totalCredits = useMemo(() => tbAccounts.reduce((sum, a) => sum + a.credit, 0), [tbAccounts]);
  const isBalanced = totalDebits === totalCredits;

  const filteredAccounts = useMemo(() => {
    return tbAccounts.filter((acc) => {
      const matchSearch =
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.includes(searchTerm);
      const matchType = typeFilter === 'All' || acc.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [tbAccounts, searchTerm, typeFilter]);

  const handlePostVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(vAmount);
    if (isNaN(amt) || amt <= 0) return;

    setTbAccounts((prev) =>
      prev.map((acc) => {
        if (acc.code === vDebitCode) {
          return { ...acc, debit: acc.debit + amt };
        }
        if (acc.code === vCreditCode) {
          return { ...acc, credit: acc.credit + amt };
        }
        return acc;
      })
    );
    setVAmount('');
    setShowVoucherModal(false);
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'billing', 'super_admin']} moduleName="Finance & Bank Ledger" category="financial">
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
            {/* Header Action Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                  <Landmark className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('accounting')} • General Ledger & Ethiopian Public Finance
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Double-Entry Chart of Accounts • MoFED Compliance • Automated Daily Trial Balance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Post Journal Voucher
                </button>
              </div>
            </div>

            {/* Quick Metrics KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Ledger Debits</span>
                  <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {totalDebits.toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
                </p>
                <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">Cash + CBE Bank + Receivables</p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Ledger Credits</span>
                  <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Receipt className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {totalCredits.toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
                </p>
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">Revenue + Liabilities + Equity</p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Audit Reconciliation</span>
                  <span className={`p-2 rounded-lg ${isBalanced ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'}`}>
                    {isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </span>
                </div>
                <p className={`mt-2 text-2xl font-bold tracking-tight ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isBalanced ? 'Reconciled' : 'Variance Detected'}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {isBalanced ? 'Zero variance between Debits & Credits' : `Variance: ${Math.abs(totalDebits - totalCredits).toLocaleString()} ETB`}
                </p>
              </div>
            </div>

            {/* Trial Balance Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Trial Balance & Chart of Accounts
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time general ledger balances across operating divisions
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search code or account title..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="All">All Types</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3">GL Code</th>
                      <th className="px-5 py-3">Account Title / Description</th>
                      <th className="px-5 py-3">Classification</th>
                      <th className="px-5 py-3 text-right">Debit Balance (ETB)</th>
                      <th className="px-5 py-3 text-right">Credit Balance (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredAccounts.map((line) => (
                      <tr key={line.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-teal-700 dark:text-teal-400 font-bold">{line.code}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{line.name}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            line.type === 'Asset'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              : line.type === 'Revenue'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : line.type === 'Expense'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {line.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white text-right font-semibold">
                          {line.debit > 0 ? line.debit.toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white text-right font-semibold">
                          {line.credit > 0 ? line.credit.toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Journal Voucher Modal */}
            {showVoucherModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Post Double-Entry Journal Voucher</h3>
                    <button
                      type="button"
                      onClick={() => setShowVoucherModal(false)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handlePostVoucher} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Debit Account
                      </label>
                      <select
                        value={vDebitCode}
                        onChange={(e) => setVDebitCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                      >
                        {tbAccounts.map((acc) => (
                          <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Credit Account
                      </label>
                      <select
                        value={vCreditCode}
                        onChange={(e) => setVCreditCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                      >
                        {tbAccounts.map((acc) => (
                          <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Amount (ETB)
                      </label>
                      <input
                        type="number"
                        required
                        value={vAmount}
                        onChange={(e) => setVAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowVoucherModal(false)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        Post to Ledger
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
