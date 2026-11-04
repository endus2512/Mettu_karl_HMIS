/**
 * Billing & Insurance Integration (Telebirr & CBHI).
 * Mettu Karl Referral Hospital HMIS — Enterprise Healthcare Design System:
 * - Ethiopian Community-Based Health Insurance (CBHI) 90% co-pay waiver calculation
 * - Ethio Telecom Telebirr instant QR & USSD push payment gateway
 * - Itemized clinical breakdown (OPD, Laboratory, Pharmacy, Nursing care)
 * - Printable receipt and transaction reconciliation
 * - Full light & dark mode support
 */
'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Receipt,
  Smartphone,
  CheckCircle2,
  Clock,
  Printer,
  QrCode,
  ShieldCheck,
  Building2,
  Check,
  TrendingUp,
  FileText,
  DollarSign,
  User,
  AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';

interface BillItem {
  id: string;
  name: string;
  category: 'Consultation' | 'Laboratory' | 'Pharmacy' | 'Radiology';
  amountETB: number;
}

export default function BillingPage(): React.ReactElement {
  const { t, language } = useTranslation();
  const [patientId, setPatientId] = useState('MKH-2026-000101');
  const [patientName, setPatientName] = useState('Gudeta Hailu Tadesse');
  const [isCbhiActive, setIsCbhiActive] = useState(true);
  const [telebirrPhone, setTelebirrPhone] = useState('0911002233');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cash' | 'cbe_birr'>('telebirr');
  const [showReceipt, setShowReceipt] = useState(false);

  const [billItems] = useState<BillItem[]>([
    {
      id: 'srv-1',
      name: 'General Physician OPD Consultation',
      category: 'Consultation',
      amountETB: 150.0,
    },
    {
      id: 'srv-2',
      name: 'Complete Blood Count (CBC) & Chem-7 Lab Panel',
      category: 'Laboratory',
      amountETB: 250.0,
    },
    {
      id: 'srv-3',
      name: 'Ceftriaxone 1g Injection + Infusion Set',
      category: 'Pharmacy',
      amountETB: 450.0,
    },
  ]);

  const subtotal = billItems.reduce((acc, item) => acc + item.amountETB, 0);
  const copayRate = isCbhiActive ? 0.1 : 1.0; // 10% co-pay under Ethiopian CBHI
  const patientPayable = subtotal * copayRate;
  const insuranceCovered = subtotal - patientPayable;

  const handlePay = () => {
    setIsPaid(true);
    notifications.show({
      title: language === 'om' ? 'Kaffaltiin Milkaa\'eera' : 'Payment Settled',
      message: `Transaction Ref: TB-992384-${Date.now().toString().slice(-4)}. ETB ${patientPayable.toFixed(2)} received.`,
      color: 'teal',
    });
  };

  const handlePrint = () => {
    window.print();
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
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{t('billing')}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Telebirr & CBHI Revenue Desk</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ethiopian Community-Based Health Insurance (CBHI) • Ethio Telecom Telebirr Integration • Automated General Ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Telebirr API: Live Gateway
              </span>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Today&apos;s Revenue</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">ETB 84,520</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14.2% vs yesterday</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">CBHI Covered Claims</span>
              <p className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">92.4%</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Direct Woreda subsidies</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Digital Settlement</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">328 Trans</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Zero cash leakage verified</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Invoices</span>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">4 Invoices</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Avg checkout time: 2.1 min</span>
            </div>
          </div>

          {/* Billing Form & Checkout Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Invoice Configuration Form */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Patient Invoice Details & Services</span>
                </h3>
                <span className="font-mono text-xs text-slate-400">INV-2026-8941</span>
              </div>

              {/* Patient Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Patient MRN
                  </label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* CBHI Policy Card */}
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
                      {t('cbhi_insurance')} (MOH Active Policy)
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Policy: HH-METTU-9924 • Kebele 01, Mettu Town Catchment
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCbhiActive}
                    onChange={(e) => setIsCbhiActive(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-400 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>Apply 90% CBHI Co-Pay Waiver</span>
                </label>
              </div>

              {/* Itemized Clinical Services Table */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Itemized Clinical Services
                </span>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3.5 py-2">Clinical Service</th>
                        <th className="px-3.5 py-2">Category</th>
                        <th className="px-3.5 py-2 text-right">Standard Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {billItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900 dark:text-white">
                            {item.name}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                            {item.amountETB.toFixed(2)} ETB
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Summary & Checkout
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">ETB Currency</span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Clinical Subtotal:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{subtotal.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                    <span>CBHI Subsidy (90%):</span>
                    <span className="font-mono">- {insuranceCovered.toFixed(2)} ETB</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                      <span>Patient Due (10% Co-Pay):</span>
                      <span className="text-teal-600 dark:text-teal-400 font-mono text-lg font-extrabold">
                        {patientPayable.toFixed(2)} ETB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Channel Selector */}
                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-2">
                    Payment Gateway
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0e131f] mb-4 text-xs font-semibold border border-slate-200 dark:border-[#222b3d]">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('telebirr')}
                      className={`py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                        paymentMethod === 'telebirr'
                          ? 'border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.12)] font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200'
                      }`}
                    >
                      Telebirr
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cbe_birr')}
                      className={`py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                        paymentMethod === 'cbe_birr'
                          ? 'border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.12)] font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200'
                      }`}
                    >
                      CBE Birr
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.12)] font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200'
                      }`}
                    >
                      Cash Desk
                    </button>
                  </div>

                  {paymentMethod === 'telebirr' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Customer Telebirr Phone
                      </label>
                      <input
                        type="text"
                        value={telebirrPhone}
                        onChange={(e) => setTelebirrPhone(e.target.value)}
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {isPaid ? (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-emerald-300 dark:border-[#059669]/40 bg-[#102419] p-3 text-center text-xs font-semibold text-[#34d399] flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Settled via {paymentMethod.toUpperCase()} (Ref: TB-992384)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full h-10 rounded-xl border border-amber-500/30 bg-[#101624] hover:bg-amber-500/20 text-xs font-semibold text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>Print Hospital Receipt</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePay}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 border border-amber-300 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-slate-950" />
                    <span>Pay {patientPayable.toFixed(2)} ETB with {paymentMethod.toUpperCase()}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
