/**
 * Mettu Karl Comprehensive Specialized Hospital
 * Dedicated Cashier, Billing & Insurance Workstation Dashboard (/portal/billing).
 *
 * Dedicated operational view for Cashiers, Billing Clerks, and CBHI Officers.
 * Overhauled to match the Executive Command Standard:
 * - Unified Outer Rectangle with 4 Compact Animated 3D Mini Cubes
 * - Frosted Glassmorphism, Bold Typography, Vibrant Responsive Gradients
 * - High-Contrast Universal Theme (Flawless Light & Dark Mode)
 * - Minimized-by-Default Clean Workstation with Kinetic MorphingArrowButtons
 * - Interactive Rapid Invoice Creation & Telebirr Payment Settlement Modal
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, type Language } from '@/lib/i18n';
import { useHospitalTimeSync } from '@/lib/timeSync';
import { MorphingArrowButton } from '@/components/admin/MorphingArrowButton';
import { notifications } from '@mantine/notifications';
import { playClinicalAudioAlert } from '@/lib/notifications';
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
  Check,
  X,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Wallet,
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

  const { serverTime, shift } = useHospitalTimeSync();

  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Minimized-by-default module toggles
  const [showInvoicesQueue, setShowInvoicesQueue] = useState<boolean>(false);
  const [showCbhiDesk, setShowCbhiDesk] = useState<boolean>(false);
  const [showActionPads, setShowActionPads] = useState<boolean>(false);

  // Quick Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem>(INITIAL_INVOICES[0]);
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cash' | 'cbhi'>('telebirr');
  const [phoneForTelebirr, setPhoneForTelebirr] = useState('0911223344');

  const handlePayDirect = (invNo: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.invNo === invNo ? { ...inv, status: 'paid' } : inv))
    );
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Kaffaltiin Milkaa\'eera' : 'Invoice Paid & Cleared',
      message: `${invNo} marked as fully settled at ${serverTime || '10:00 AM'}. Official clearance receipt printed.`,
      color: 'teal',
    });
  };

  const handleSaveModalPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoices((prev) =>
      prev.map((inv) => (inv.invNo === selectedInvoice.invNo ? { ...inv, status: 'paid' } : inv))
    );
    playClinicalAudioAlert('info');
    notifications.show({
      title: lang === 'om' ? 'Kaffaltii Telebirr / Cash Milkaa\'eera' : 'Payment Settled via POS',
      message: `${selectedInvoice.invNo} (${selectedInvoice.totalEtb} ETB) settled via ${paymentMethod.toUpperCase()} for ${selectedInvoice.patientName}.`,
      color: 'teal',
    });
    setIsModalOpen(false);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const unpaidCount = invoices.filter((i) => i.status === 'unpaid').length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-smooth-in">
      {/* ================================================================= */}
      {/* 1. BILLING COCKPIT HEADER                                         */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-100/90 via-white/95 to-amber-100/90 dark:from-[#11261a]/95 dark:via-[#163323]/95 dark:to-[#0f2117]/95 border-[2.5px] border-emerald-400/90 dark:border-emerald-400/60 shadow-[0_12px_32px_-8px_rgba(16,185,129,0.28)] hover:shadow-[0_16px_40px_-8px_rgba(16,185,129,0.4)] transition-all duration-300">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/50 dark:via-emerald-200/15 to-transparent mkh-panel-sweep" />

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 border-2 border-white/60 shrink-0 transform hover:scale-105 hover:rotate-3 transition-transform">
            <CreditCard className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Kaffaltii, Telebirr & CBHI (Billing)'
                  : lang === 'am'
                  ? 'የክፍያ፣ ቴሌብርና መድህን ዴስክ (Cashier POS)'
                  : 'Billing, Cashier & Insurance Claims Desk'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-500/60 font-mono font-black">
                CASHIER ACTIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {lang === 'om'
                ? 'Kaffaltii Telebirr, waraqaa ragaa (invoicing), inshuraansii hawaasaa CBHI, fi qulqullina herregaa'
                : 'Telebirr POS transactions, automated invoicing, CBHI claims, and revenue reconciliation'}
            </p>
          </div>
        </div>

        {/* Quick Status Badges & Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Telebirr Online Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 bg-emerald-100/95 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border-emerald-500/75 transition-transform hover:scale-[1.04]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>TELEBIRR ONLINE</span>
          </div>

          {/* Active Shift Pill */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#14261c] border-2 border-emerald-400/80 dark:border-emerald-400/50 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:border-emerald-500 transition-colors">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {shift ? (lang === 'om' ? shift.name_om : lang === 'am' ? shift.name_am : shift.name_en) : 'Cashier Shift'}
            </span>
            <span className="text-emerald-700 dark:text-emerald-300 font-mono text-xs">
              ({serverTime || '10:00 AM'})
            </span>
          </div>

          {/* Primary Action Button: New Invoice */}
          <MorphingArrowButton
            variant="emerald"
            size="sm"
            label={lang === 'om' ? 'Kaffaltii Haaraa' : 'New Invoice'}
            icon={<Receipt className="w-4 h-4" />}
            onClick={() => {
              setSelectedInvoice(invoices[0]);
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. URGENT PENDING INVOICE BANNER                                  */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-100 via-emerald-100/90 to-amber-100/95 dark:from-amber-950/45 dark:via-emerald-950/35 dark:to-amber-950/45 border-[2.5px] border-amber-400/90 dark:border-amber-400/60 text-xs sm:text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 dark:via-amber-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.2s' }} />
        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="font-black text-amber-950 dark:text-amber-100 mr-2">
              {lang === 'om' ? "Kaffaltii Eeggachaa Jiru (Pending Dues):" : "Pending Cashier Invoices:"}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              Gudeta Hailu (INV-2026-4401: 185.00 ETB) • Chala Tolera (140.00 ETB CBHI co-pay pending)
            </span>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <MorphingArrowButton
            variant="amber"
            size="xs"
            label={lang === 'om' ? 'Kaffalchiisi' : 'Settle Invoice'}
            onClick={() => setShowInvoicesQueue(true)}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. ONE UNIFIED RECTANGLE HOLDING 4 COMPACT ANIMATED 3D MINI CUBES */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-[2.5px] border-emerald-400/90 dark:border-emerald-400/60 bg-gradient-to-br from-emerald-100/85 via-white/95 to-amber-100/85 dark:from-[#11261a]/95 dark:via-[#163323]/95 dark:to-[#0f2117]/95 backdrop-blur-md p-3.5 sm:p-4 shadow-[0_14px_34px_-8px_rgba(16,185,129,0.3)] hover:shadow-[0_18px_42px_-8px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 transition-all duration-300 animate-smooth-in">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/45 dark:via-emerald-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '0.6s' }} />
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto">
          {/* Mini Cube 1: Invoices Today */}
          <div
            onClick={() => setShowInvoicesQueue((prev) => !prev)}
            style={{ animationDelay: '0s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-emerald-400/85 dark:border-emerald-400/55 bg-gradient-to-br from-white via-emerald-50 to-emerald-100/95 dark:from-[#113125] dark:via-[#163a2d] dark:to-[#122e24] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(16,185,129,0.28),3px_3px_0_0_rgba(52,211,153,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-emerald-500 hover:shadow-[0_14px_24px_-4px_rgba(16,185,129,0.42),5px_5px_0_0_rgba(52,211,153,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-emerald-200/20 to-transparent mkh-cube-sweep" />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-emerald-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                1. {lang === 'om' ? 'Kaffaltii Har\'aa' : 'Invoices Today'}
              </span>
              <span className="h-6 w-6 rounded-lg bg-emerald-500/20 dark:bg-emerald-400/25 border border-emerald-400/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Receipt className="w-3 h-3" />
              </span>
            </div>

            <div className="relative z-10 space-y-1 my-auto">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  52
                </span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                  {paidCount + 37} Paid
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/90 dark:bg-slate-700/80 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700" style={{ width: '73%' }} />
              </div>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {unpaidCount} {lang === 'om' ? 'Eeggachaa Jiru' : 'Pending Settle'}
            </p>
          </div>

          {/* Mini Cube 2: Telebirr Revenue */}
          <div
            onClick={() => setShowInvoicesQueue((prev) => !prev)}
            style={{ animationDelay: '0.45s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-emerald-400/85 dark:border-emerald-400/55 bg-gradient-to-br from-white via-emerald-50 to-teal-100/95 dark:from-[#113125] dark:via-[#163a2d] dark:to-[#122e24] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(16,185,129,0.28),3px_3px_0_0_rgba(52,211,153,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-emerald-500 hover:shadow-[0_14px_24px_-4px_rgba(16,185,129,0.42),5px_5px_0_0_rgba(52,211,153,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-emerald-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '1.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-emerald-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                2. {lang === 'om' ? 'Gali Telebirr' : 'Telebirr Rev'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-emerald-500/20 dark:bg-emerald-400/25 border border-emerald-400/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-base sm:text-lg font-black tracking-tight text-emerald-900 dark:text-emerald-200 font-mono">
                24,850 ETB
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border border-emerald-400/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                DIRECT SETTLED
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Instant SuperApp Sync
            </p>
          </div>

          {/* Mini Cube 3: CBHI Health Insurance */}
          <div
            onClick={() => setShowCbhiDesk((prev) => !prev)}
            style={{ animationDelay: '0.9s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-amber-400/85 dark:border-amber-400/55 bg-gradient-to-br from-white via-amber-50 to-orange-100/95 dark:from-[#362714] dark:via-[#423118] dark:to-[#362615] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(245,158,11,0.28),3px_3px_0_0_rgba(251,191,36,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-amber-500 hover:shadow-[0_14px_24px_-4px_rgba(245,158,11,0.42),5px_5px_0_0_rgba(251,191,36,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-amber-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '2.2s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-amber-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                3. {lang === 'om' ? 'Gaaffii CBHI' : 'CBHI Claims'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-amber-500/20 dark:bg-amber-400/25 border border-amber-400/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-lg sm:text-xl font-black tracking-tight text-amber-900 dark:text-amber-200">
                31
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-100 border border-amber-400/60">
                EHIA PORTAL SYNC
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              80% Community Cover
            </p>
          </div>

          {/* Mini Cube 4: Pending Clearance Dues */}
          <div
            onClick={() => setShowInvoicesQueue((prev) => !prev)}
            style={{ animationDelay: '1.35s' }}
            className="mkh-cube-tile w-full max-w-[138px] sm:max-w-[148px] h-[116px] sm:h-[124px] mx-auto rounded-2xl border-2 border-rose-400/85 dark:border-rose-400/55 bg-gradient-to-br from-white via-rose-50 to-rose-100/95 dark:from-[#361824] dark:via-[#421d2d] dark:to-[#381622] p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-[0_6px_14px_-4px_rgba(244,63,94,0.28),3px_3px_0_0_rgba(251,113,133,0.32)] hover:-translate-y-2 hover:scale-[1.06] hover:border-rose-500 hover:shadow-[0_14px_24px_-4px_rgba(244,63,94,0.42),5px_5px_0_0_rgba(251,113,133,0.45)] transition-all duration-300 ease-out"
          >
            <div className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/45 dark:via-rose-200/20 to-transparent mkh-cube-sweep" style={{ animationDelay: '3.1s' }} />
            <div className="pointer-events-none absolute -right-5 -top-5 w-16 h-16 rounded-full bg-rose-400/25 blur-lg group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-start justify-between gap-1 relative z-10">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                4. {lang === 'om' ? 'Hafte Kaffaltii' : 'Pending Dues'}
              </span>
              <div className="h-6 w-6 rounded-lg bg-rose-500/20 dark:bg-rose-400/25 border border-rose-400/60 text-rose-800 dark:text-rose-200 flex items-center justify-center shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                <Wallet className="w-3 h-3" />
              </div>
            </div>

            <div className="relative z-10 my-auto space-y-1">
              <span className="block text-base sm:text-lg font-black tracking-tight text-rose-900 dark:text-rose-200 font-mono">
                4,120 ETB
              </span>
              <span className="inline-block text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100 border border-rose-400/60">
                14 UNSETTLED
              </span>
            </div>

            <p className="relative z-10 text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
              Awaiting Cashier Receipt
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MINIMIZED-BY-DEFAULT SECTION 1: CASHIER INVOICES QUEUE         */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-emerald-400/80 dark:border-emerald-400/50 bg-white/95 dark:bg-[#0f2117]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-[#11261a] dark:via-[#163323] dark:to-[#0f2117] border-b border-emerald-200/80 dark:border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Dabaree Waraqaa Kaffaltii & POS (Invoices Queue)' : 'Cashier Point of Sale (POS) & Invoice Queue'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border border-emerald-500/40 font-bold">
                  {filteredInvoices.length} INVOICES
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Kaffaltii tajaajila yaalaa, laaboraatorii, fi qorichaa milkeessuu' : 'Settle patient billing for consultations, lab tests, and pharmacy dispensaries'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="emerald"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showInvoicesQueue}
            label={showInvoicesQueue ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Invoices')}
            onClick={() => setShowInvoicesQueue((prev) => !prev)}
          />
        </div>

        {showInvoicesQueue && (
          <div className="p-4 sm:p-5 space-y-4 animate-smooth-in">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === 'om' ? 'Barbaadi Maqaa, InvNo, Tajaajila...' : 'Search by Patient, Inv No or Items...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border-2 border-emerald-300 dark:border-emerald-600/50 bg-white dark:bg-[#14281c] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'unpaid', 'paid'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' ? (lang === 'om' ? 'Hundumaa' : 'All') : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.invNo}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                    inv.status === 'paid'
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700 opacity-80'
                      : 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-400/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          {inv.invNo}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {inv.patientName}
                        </h3>
                      </div>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                        {inv.mrn} • Scheme: <span className="uppercase font-bold">{inv.scheme}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100 border-emerald-400'
                          : 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100 border-amber-400'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 my-2 space-y-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {inv.items}
                    </p>
                    <div className="flex items-center justify-between text-xs font-black pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">Total Payable:</span>
                      <span className="text-sm font-mono text-emerald-700 dark:text-emerald-300">
                        {inv.totalEtb.toFixed(2)} ETB
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Instant Clearance Receipt
                    </span>
                    <div className="flex items-center gap-1.5">
                      {inv.status === 'unpaid' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentMethod('telebirr');
                              setIsModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Telebirr</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePayDirect(inv.invNo)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition"
                          >
                            {lang === 'om' ? 'Kaffali (Cash)' : 'Cash'}
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cleared & Receipted</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 5. MINIMIZED-BY-DEFAULT SECTION 2: CBHI INSURANCE CLAIMS DESK     */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-emerald-400/80 dark:border-emerald-400/50 bg-white/95 dark:bg-[#0f2117]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-[#11261a] dark:via-[#163323] dark:to-[#0f2117] border-b border-emerald-200/80 dark:border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Inshuraansii Hawaasaa CBHI & Waliigaltee EHIA' : 'Community-Based Health Insurance (CBHI) Claims Desk'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-950 dark:text-amber-100 border border-amber-400/40 font-bold">
                  31 CLAIMS VERIFIED
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Kaffaltii %80 hawaasaa fi %20 co-pay dhukkubsataa' : 'Woreda membership verification, 80/20 copay, and electronic claim submission'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="amber"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showCbhiDesk}
            label={showCbhiDesk ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand CBHI Desk')}
            onClick={() => setShowCbhiDesk((prev) => !prev)}
          />
        </div>

        {showCbhiDesk && (
          <div className="p-4 sm:p-5 space-y-3 animate-smooth-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border-2 border-emerald-300 dark:border-emerald-600/40 space-y-1 text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  CBHI Active Coverage
                </span>
                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-lg font-mono">
                  80% Government Subsidized
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Patients pay nominal 20% co-pay or 0 ETB for exempt vulnerable households.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border-2 border-amber-300 dark:border-amber-600/40 space-y-1 text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  EHIA Woreda Voucher Sync
                </span>
                <p className="font-bold text-amber-700 dark:text-amber-300 text-lg font-mono">
                  Mettu Zuria & Karl
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Direct electronic reconciliation with Oromia Health Bureau insurance pool.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/25 border-2 border-cyan-300 dark:border-cyan-600/40 space-y-1 text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  Monthly Claims Total
                </span>
                <p className="font-bold text-cyan-700 dark:text-cyan-300 text-lg font-mono">
                  184,200 ETB
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Batch submission approved for electronic fund transfer.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 6. MINIMIZED-BY-DEFAULT SECTION 3: RAPID BILLING ACTION PADS      */}
      {/* ================================================================= */}
      <div className="rounded-3xl border-2 border-emerald-400/80 dark:border-emerald-400/50 bg-white/95 dark:bg-[#0f2117]/95 backdrop-blur-md shadow-md overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-[#11261a] dark:via-[#163323] dark:to-[#0f2117] border-b border-emerald-200/80 dark:border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-800 dark:text-teal-200 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {lang === 'om' ? 'Wiirtuuwwan Qaxxaamuraa Kaffaltii & POS' : 'Rapid Financial & Point of Sale Action Pads'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-950 dark:text-teal-100 border border-teal-500/40 font-bold">
                  6 PADS ONLINE
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'om' ? 'Kaffaltii POS, CBHI inshuraansii, herrega baankii, Fayda ID, fi gabaasa SMS' : 'Direct links to Billing POS, CBHI Claims, Accounting, Fayda, and SMS Receipts'}
              </p>
            </div>
          </div>

          <MorphingArrowButton
            variant="teal"
            size="sm"
            arrowDirection="toggle"
            isExpanded={showActionPads}
            label={showActionPads ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand Pads')}
            onClick={() => setShowActionPads((prev) => !prev)}
          />
        </div>

        {showActionPads && (
          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-smooth-in">
            <Link
              href="/billing"
              className="p-3.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50/60 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Wiirtuu Kaffaltii' : 'Cashier Desk'}
              </span>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                Telebirr QR
              </span>
            </Link>

            <Link
              href="/insurance"
              className="p-3.5 rounded-2xl border-2 border-amber-300 dark:border-amber-600/40 bg-amber-50/60 dark:bg-amber-950/20 hover:border-amber-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Inshuraansii CBHI' : 'CBHI Portal'}
              </span>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold mt-0.5">
                EHIA Gateway
              </span>
            </Link>

            <Link
              href="/accounting"
              className="p-3.5 rounded-2xl border-2 border-teal-300 dark:border-teal-600/40 bg-teal-50/60 dark:bg-teal-950/20 hover:border-teal-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Herrega Baankii' : 'Finance Ledger'}
              </span>
              <span className="text-[10px] text-teal-800 dark:text-teal-300 font-semibold mt-0.5">
                Daily Reconciliation
              </span>
            </Link>

            <Link
              href="/fayda"
              className="p-3.5 rounded-2xl border-2 border-sky-300 dark:border-sky-600/40 bg-sky-50/60 dark:bg-sky-950/20 hover:border-sky-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Fingerprint className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Fayda ID' : 'Fayda National ID'}
              </span>
              <span className="text-[10px] text-sky-800 dark:text-sky-300 font-semibold mt-0.5">
                Biometric Verify
              </span>
            </Link>

            <Link
              href="/procurement"
              className="p-3.5 rounded-2xl border-2 border-indigo-300 dark:border-indigo-600/40 bg-indigo-50/60 dark:bg-indigo-950/20 hover:border-indigo-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'Bittaa & Caalbaasii' : 'Procurement'}
              </span>
              <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-semibold mt-0.5">
                Hospital Tenders
              </span>
            </Link>

            <Link
              href="/sms-ussd"
              className="p-3.5 rounded-2xl border-2 border-cyan-300 dark:border-cyan-600/40 bg-cyan-50/60 dark:bg-cyan-950/20 hover:border-cyan-500 hover:shadow-lg transition-all group cursor-pointer text-center flex flex-col items-center justify-center"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {lang === 'om' ? 'SMS Nagahee' : 'SMS Receipts'}
              </span>
              <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-semibold mt-0.5">
                *907# USSD Gateway
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 7. QUICK INVOICE SETTLEMENT & TELEBIRR MODAL                      */}
      {/* ================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-smooth-in">
          <div className="w-full max-w-lg rounded-3xl border-2 border-emerald-400 bg-white dark:bg-[#0f2117] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-base font-black">
                  {lang === 'om' ? 'Kaffalchiisa POS & Telebirr' : 'Settle Invoice via POS / Telebirr'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveModalPayment} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Waraqaa Kaffaltii Filadhu' : 'Select Invoice'}
                </label>
                <select
                  value={selectedInvoice.invNo}
                  onChange={(e) => {
                    const found = invoices.find((i) => i.invNo === e.target.value);
                    if (found) setSelectedInvoice(found);
                  }}
                  className="w-full p-2.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-600 bg-white dark:bg-[#14291e] text-slate-900 dark:text-white text-xs font-bold"
                >
                  {invoices.map((inv) => (
                    <option key={inv.invNo} value={inv.invNo}>
                      {inv.invNo} - {inv.patientName} ({inv.totalEtb} ETB)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 space-y-1 text-xs">
                <div className="font-black text-slate-900 dark:text-white">
                  Patient: {selectedInvoice.patientName} ({selectedInvoice.mrn})
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  Services: {selectedInvoice.items}
                </div>
                <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300 pt-1">
                  Amount: {selectedInvoice.totalEtb.toFixed(2)} ETB
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'om' ? 'Mala Kaffaltii (Payment Method)' : 'Payment Channel'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telebirr')}
                    className={`p-2 rounded-xl text-xs font-bold border-2 cursor-pointer transition ${
                      paymentMethod === 'telebirr'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    Telebirr SuperApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2 rounded-xl text-xs font-bold border-2 cursor-pointer transition ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    Cash / POS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cbhi')}
                    className={`p-2 rounded-xl text-xs font-bold border-2 cursor-pointer transition ${
                      paymentMethod === 'cbhi'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                    }`}
                  >
                    CBHI Voucher
                  </button>
                </div>
              </div>

              {paymentMethod === 'telebirr' && (
                <div>
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                    {lang === 'om' ? 'Lakkoofsa Bilbilaa Telebirr' : 'Telebirr Phone Number'}
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phoneForTelebirr}
                      onChange={(e) => setPhoneForTelebirr(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-600 text-xs font-bold font-mono bg-white dark:bg-[#14291e] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {lang === 'om' ? 'Dhiisi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'om' ? 'Kaffalchiisi & Nagahee Baasi' : 'Confirm & Print Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
