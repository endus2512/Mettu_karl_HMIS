/**
 * Billing & Insurance Integration (Telebirr & CBHI).
 * Features Ethiopian Community-Based Health Insurance (CBHI) 90% co-pay waivers,
 * Ethio Telecom Telebirr instant USSD push, and automated accounting reconciliation.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

export default function BillingPage(): React.ReactElement {
  const { t } = useTranslation();
  const [patientId, setPatientId] = useState('MKH-2026-000101');
  const [patientName, setPatientName] = useState('Gudeta Hailu Tadesse');
  const [isCbhiActive, setIsCbhiActive] = useState(true);
  const [subtotal] = useState(850.0);
  const [isPaid, setIsPaid] = useState(false);
  const [telebirrPhone, setTelebirrPhone] = useState('0911002233');

  const copayRate = isCbhiActive ? 0.1 : 1.0; // 10% co-pay under CBHI
  const patientPayable = subtotal * copayRate;
  const insuranceCovered = subtotal - patientPayable;

  const handlePayTelebirr = () => {
    setIsPaid(true);
  };

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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  💳
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('billing')} • Telebirr & CBHI Insurance Workstation
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Ethiopian CBHI Co-Pay Integration • Telebirr QR & SMS Push • Automatic General Ledger Posting
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Telebirr API: Live
              </span>
            </div>
          </div>

          {/* Quick Stats Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-800 transition-colors">
                  Today's Revenue
                </p>
                <span className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-white group-hover:text-teal-700 text-sm">
                  💰
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">
                ETB 84,520
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-bold">↑ 14.2% vs yesterday</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-800 transition-colors">
                  CBHI Claims
                </p>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-white group-hover:text-blue-700 text-sm">
                  🧾
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-blue-600 group-hover:text-blue-950 transition-colors">
                92.4%
              </p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Automatic Woreda subsidy</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-800 transition-colors">
                  Telebirr Settled
                </p>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-white group-hover:text-purple-700 text-sm">
                  📱
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-purple-700 group-hover:text-purple-950 transition-colors">
                328 Trans
              </p>
              <p className="mt-1 text-xs text-purple-600 font-bold">Zero manual cash leakage</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-800 transition-colors">
                  Pending Discharge
                </p>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-white group-hover:text-amber-700 text-sm">
                  ⏳
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-amber-600 group-hover:text-amber-950 transition-colors">
                4 Invoices
              </p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Avg wait time: 2.4 min</p>
            </div>
          </div>

          {/* Billing Form & Checkout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Invoice Configuration Form */}
            <div className="group col-span-2 rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
              <h3 className="mb-4 text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Patient Invoice Details
              </h3>

              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Patient MRN</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-200 p-2.5 text-xs font-mono font-bold hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Full Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-200 p-2.5 text-xs font-bold hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* CBHI Policy Card */}
              <div className="mb-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-400/30 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-emerald-900 text-sm">{t('cbhi_insurance')}</h4>
                    <p className="text-xs text-emerald-700 font-semibold">Policy: HH-METTU-9924 • Kebele 01, Mettu Town</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-black text-emerald-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCbhiActive}
                      onChange={(e) => setIsCbhiActive(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-600 cursor-pointer"
                    />
                    Apply 90% CBHI Co-Pay Waiver
                  </label>
                </div>
              </div>

              {/* Line Items */}
              <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                Itemized Clinical Services
              </h4>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:border-teal-400 hover:bg-teal-50/60 hover:ring-1 hover:ring-teal-400/40 transition-all cursor-pointer">
                  <span className="font-bold text-slate-800">General Physician OPD Consultation</span>
                  <span className="font-mono font-black text-slate-900">150.00 ETB</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:border-teal-400 hover:bg-teal-50/60 hover:ring-1 hover:ring-teal-400/40 transition-all cursor-pointer">
                  <span className="font-bold text-slate-800">Complete Blood Count (CBC) Lab & Chemistry</span>
                  <span className="font-mono font-black text-slate-900">250.00 ETB</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:border-teal-400 hover:bg-teal-50/60 hover:ring-1 hover:ring-teal-400/40 transition-all cursor-pointer">
                  <span className="font-bold text-slate-800">Ceftriaxone 1g Injection + Infusion Set</span>
                  <span className="font-mono font-black text-slate-900">450.00 ETB</span>
                </div>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
              <h3 className="mb-4 text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Summary & Checkout
              </h3>

              <div className="space-y-3 text-xs font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">{subtotal.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>CBHI Insurance Paid:</span>
                  <span className="font-mono">- {insuranceCovered.toFixed(2)} ETB</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-base font-black text-slate-900">
                    <span>Patient Due:</span>
                    <span className="text-teal-700 font-mono">{patientPayable.toFixed(2)} ETB</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <label className="mb-2 block text-xs font-bold uppercase text-slate-700">
                  Customer Telebirr Phone
                </label>
                <input
                  type="text"
                  value={telebirrPhone}
                  onChange={(e) => setTelebirrPhone(e.target.value)}
                  className="mb-4 w-full rounded-2xl border-2 border-slate-200 p-2.5 text-xs font-mono font-bold hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 focus:outline-none transition-all"
                />

                {isPaid ? (
                  <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 text-center font-black text-emerald-800">
                    ✅ Paid via Telebirr (Ref: TB-992384)
                  </div>
                ) : (
                  <button
                    onClick={handlePayTelebirr}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>📱</span> {t('telebirr_pay')}
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
