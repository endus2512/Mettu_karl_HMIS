/**
 * Mettu Karl Referral Hospital — Billing, Cashier & Insurance Claims Dashboard
 * Dedicated operational view for Cashiers, Billing Clerks, and CBHI Officers.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import {
  CreditCard,
  FileSpreadsheet,
  BadgeCheck,
  Fingerprint,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Smartphone,
  Building2,
  Search,
} from 'lucide-react';

interface InvoiceItem {
  invNo: string;
  mrn: string;
  patientName: string;
  scheme: 'private' | 'cbhi' | 'fayda';
  items: string;
  totalEtb: number;
  status: 'unpaid' | 'paid';
}

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    invNo: 'INV-2026-4401',
    mrn: 'MKH-2026-000101',
    patientName: 'Gudeta Hailu Tadesse',
    scheme: 'fayda',
    items: 'OPD Consultation + LIS Malaria Panel + Coartem',
    totalEtb: 185.0,
    status: 'unpaid',
  },
  {
    invNo: 'INV-2026-4402',
    mrn: 'MKH-2026-000102',
    patientName: 'Ayantu Mamo Kassa',
    scheme: 'cbhi',
    items: 'Emergency Triage + CBC + IV Fluids (CBHI 80% covered)',
    totalEtb: 95.0,
    status: 'unpaid',
  },
  {
    invNo: 'INV-2026-4403',
    mrn: 'MKH-2026-000103',
    patientName: 'Derartu Tulu Gemechu',
    scheme: 'private',
    items: 'Obstetric Ultrasound + Prenatal Blood Panel',
    totalEtb: 420.0,
    status: 'paid',
  },
  {
    invNo: 'INV-2026-4404',
    mrn: 'MKH-2026-000104',
    patientName: 'Chala Tolera Lemma',
    scheme: 'cbhi',
    items: 'Cardiology ECG + Cardiac Troponin I + Oxygen therapy',
    totalEtb: 140.0,
    status: 'unpaid',
  },
];

export function BillingDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);

  const handlePay = (invNo: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.invNo === invNo ? { ...inv, status: 'paid' } : inv))
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. BILLING HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#101624] border border-[#222b3d] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Kaffaltii, Telebirr & Inshuraansii (Billing)'
                  : lang === 'am'
                  ? 'የክፍያ፣ ቴሌብርና ኢንሹራንስ ማስተናገጃ ማዕከል'
                  : 'Revenue, Cashier & CBHI Claims Dashboard'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-semibold">
                CASHIER ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'om'
                ? 'Kaffaltii Telebirr, Inshuraansii Fayyaa Hawaasaa (CBHI), fi nagahee seeraa'
                : 'Telebirr POS gateway, Community-Based Health Insurance claims, and fiscal receipts'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Kaffaltii Guutuu' : 'Full Billing'}</span>
          </Link>
          <Link
            href="/accounting"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-teal-300 text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Herrega GL' : 'Accounting'}</span>
          </Link>
          <Link
            href="/fayda"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-emerald-300 text-xs font-semibold transition cursor-pointer"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Eenyummaa Fayda' : 'Fayda ID'}</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Walitti Qabama Har\'aa' : 'Total Revenue Today'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">148,250</span>
              <span className="text-xs text-amber-300 font-mono">ETB</span>
            </div>
            <p className="text-[10px] text-slate-500">142 transactions processed</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Kaffaltii Telebirr' : 'Telebirr Share'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-400">68%</span>
              <span className="text-[11px] text-teal-400/90 font-medium">100,810 ETB</span>
            </div>
            <p className="text-[10px] text-teal-400/80">Direct mobile settlement</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Gaaffii CBHI' : 'Pending CBHI Claims'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-400">24</span>
              <span className="text-[11px] text-sky-400 font-medium">claims</span>
            </div>
            <p className="text-[10px] text-slate-500">18,400 ETB government subsidy</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <BadgeCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Nagahee Hin Kaffalamne' : 'Unsettled Bills'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">7</span>
              <span className="text-[11px] text-rose-400 font-medium">pending</span>
            </div>
            <p className="text-[10px] text-slate-500">Awaiting cashier payment</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. INVOICES TABLE */}
      <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'om' ? 'Nagaheewwan Kaffaltii Eeggachaa Jiran' : 'Patient Billing & Cashier Queue'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            TIN: 0038912401
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1f293d] pb-2">
              <tr>
                <th className="pb-2">Invoice # / MRN</th>
                <th className="pb-2">{lang === 'om' ? 'Dhukkubsataa' : 'Patient Name'}</th>
                <th className="pb-2">Scheme</th>
                <th className="pb-2">{lang === 'om' ? 'Tajaajiloota' : 'Rendered Services'}</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2336]">
              {invoices.map((inv) => (
                <tr key={inv.invNo} className="hover:bg-[#141b2b] transition">
                  <td className="py-3 font-mono">
                    <span className="font-bold text-amber-400 block">{inv.invNo}</span>
                    <span className="text-[10px] text-slate-500">{inv.mrn}</span>
                  </td>
                  <td className="py-3 font-semibold text-white">
                    {inv.patientName}
                  </td>
                  <td className="py-3 font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        inv.scheme === 'cbhi'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : inv.scheme === 'fayda'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                      }`}
                    >
                      {inv.scheme}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 text-[11px]">
                    {inv.items}
                  </td>
                  <td className="py-3 font-mono font-bold text-amber-300">
                    {inv.totalEtb.toFixed(2)} ETB
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {inv.status !== 'paid' ? (
                      <button
                        type="button"
                        onClick={() => handlePay(inv.invNo)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow-md transition cursor-pointer"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>{lang === 'om' ? 'Kaffalchiisi' : 'Collect'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        ✓ {lang === 'om' ? 'Kaffalameera' : 'Paid'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
