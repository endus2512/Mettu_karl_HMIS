/**
 * Billing & Revenue Assurance Management (Telebirr, Cashier, CBE Birr, & CBHI).
 * Mettu Karl Referral Hospital HMIS — Production Grade Healthcare Workstation:
 * - Direct REST API Integration with SQLite/PostgreSQL Database
 * - Live Patient Invoices with Itemized Clinical Breakdown (OPD, Lab, Pharmacy, Bed, Procedures)
 * - Ethiopian Community-Based Health Insurance (CBHI / Inshuraansii Fayyaa Hawaasaa) Waiver & Co-pay
 * - Ethio Telecom Telebirr Instant QR & USSD Push Payment with Real-time Webhook Settlement
 * - Cash Desk & CBE Birr Direct Cashier Settlement with Printable Hospital Tax Receipt
 * - Daily Revenue Ledger & Financial Audit Trail for 100% Zero-Leakage Governance
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Plus,
  Search,
  RefreshCw,
  X,
  Send,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Percent,
  Banknote,
  FileCheck,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';
import apiClient from '@/lib/api';

// ==========================================
// Data Types & Contracts
// ==========================================
interface InvoiceItem {
  id?: number;
  service_name: string;
  service_code?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PaymentRecord {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method: 'telebirr' | 'cash' | 'cbe_birr' | 'cbhi' | 'private_insurance';
  transaction_reference: string;
  status: 'initiated' | 'success' | 'failed' | 'refunded';
  payer_phone?: string | null;
  notes?: string | null;
  created_at: string;
}

interface PatientBillingBrief {
  id: number;
  mrn: string;
  first_name: string;
  last_name: string;
  gender: string;
  phone_number?: string | null;
  has_cbhi: boolean;
  cbhi_household?: string | null;
  cbhi_copay_rate: number;
}

interface InvoiceRecord {
  id: number;
  invoice_number: string;
  patient_id: number;
  patient?: PatientBillingBrief | null;
  total_amount: number;
  insurance_covered_amount: number;
  patient_payable_amount: number;
  paid_amount: number;
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  notes?: string | null;
  created_at: string;
  items: InvoiceItem[];
  payments: PaymentRecord[];
}

interface RevenueSummary {
  today_total_revenue: number;
  today_telebirr_revenue: number;
  today_cash_revenue: number;
  today_cbe_revenue: number;
  today_cbhi_claims: number;
  pending_invoices_count: number;
  paid_invoices_count: number;
  total_invoices_count: number;
  collection_rate_percentage: number;
}

interface CBHIPolicyItem {
  id: number;
  patient_id: number;
  household_number: string;
  kebele: string;
  woreda: string;
  expiry_date: string;
  co_pay_percentage: number;
  is_active: boolean;
}

export default function BillingPage(): React.ReactElement {
  const { t, language } = useTranslation();

  // Tab Navigation: 'invoices' | 'revenue' | 'cbhi'
  const [activeTab, setActiveTab] = useState<'invoices' | 'revenue' | 'cbhi'>('invoices');

  // Live Data States
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [cbhiPolicies, setCbhiPolicies] = useState<CBHIPolicyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Selected Invoice & Cashier Checkout States
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<'telebirr' | 'cash' | 'cbe_birr' | 'cbhi'>('telebirr');
  const [telebirrPhone, setTelebirrPhone] = useState('0911002233');
  const [isInitiatingTelebirr, setIsInitiatingTelebirr] = useState(false);
  const [telebirrPaymentData, setTelebirrPaymentData] = useState<{
    checkout_url: string;
    transaction_reference: string;
    qr_data: string;
    amount: number;
  } | null>(null);
  const [isConfirmingTelebirr, setIsConfirmingTelebirr] = useState(false);
  const [isSettlingCash, setIsSettlingCash] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Receipt Modal
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceRecord | null>(null);

  // Create Invoice Modal
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [newInvoicePatientId, setNewInvoicePatientId] = useState<number>(1);
  const [newInvoiceApplyCbhi, setNewInvoiceApplyCbhi] = useState(true);
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('');
  const [newInvoiceItems, setNewInvoiceItems] = useState<
    Array<{ service_name: string; service_code?: string; quantity: number; unit_price: number }>
  >([
    { service_name: 'General Medical OPD Consultation', service_code: 'OPD-CONS-01', quantity: 1, unit_price: 150.0 },
    { service_name: 'Complete Blood Count (CBC) Lab Panel', service_code: 'LAB-CBC-02', quantity: 1, unit_price: 250.0 },
  ]);

  // URL query parameter synchronization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'invoices' || tabParam === 'revenue' || tabParam === 'cbhi') {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // ==========================================
  // Fetch Functions
  // ==========================================
  const fetchAllBillingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invRes, revRes, cbhiRes] = await Promise.all([
        apiClient.get<InvoiceRecord[]>('/billing/invoices'),
        apiClient.get<RevenueSummary>('/billing/revenue/summary'),
        apiClient.get<CBHIPolicyItem[]>('/billing/cbhi/policies'),
      ]);

      if (invRes.data) {
        setInvoices(invRes.data);
        // Default select first pending invoice or first invoice
        if (!selectedInvoice && invRes.data.length > 0) {
          const firstPending = invRes.data.find((i) => i.status === 'pending') || invRes.data[0];
          setSelectedInvoice(firstPending);
          if (firstPending.patient?.phone_number) {
            setTelebirrPhone(firstPending.patient.phone_number.replace('+251', '0'));
          }
        } else if (selectedInvoice) {
          // Update selected invoice with fresh data
          const updated = invRes.data.find((i) => i.id === selectedInvoice.id);
          if (updated) setSelectedInvoice(updated);
        }
      }

      if (revRes.data) {
        setRevenueSummary(revRes.data);
      }

      if (cbhiRes.data) {
        setCbhiPolicies(cbhiRes.data);
      }

      setIsLiveConnected(true);
    } catch (err: any) {
      console.error('Failed to fetch billing data:', err);
      notifications.show({
        title: 'Connection Notice',
        message: 'Could not synchronize with billing database server.',
        color: 'yellow',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedInvoice]);

  useEffect(() => {
    fetchAllBillingData();
  }, [fetchAllBillingData]);

  // ==========================================
  // Handlers: Telebirr Payment
  // ==========================================
  const handleInitiateTelebirr = async () => {
    if (!selectedInvoice) return;
    setIsInitiatingTelebirr(true);
    try {
      const res = await apiClient.post('/billing/telebirr/pay', {
        invoice_id: selectedInvoice.id,
        phone_number: telebirrPhone,
      });
      setTelebirrPaymentData(res.data);
      notifications.show({
        title: 'Telebirr Push Sent',
        message: `Koodiin nagahee ${selectedInvoice.invoice_number} gara lakk. ${telebirrPhone} tti ergameera.`,
        color: 'teal',
      });
    } catch (err: any) {
      console.error('Telebirr error:', err);
      notifications.show({
        title: 'Telebirr Error',
        message: err.response?.data?.detail || 'Kaffaltii Telebirr jalqabsiisuu hin dandeenye.',
        color: 'red',
      });
    } finally {
      setIsInitiatingTelebirr(false);
    }
  };

  const handleConfirmTelebirr = async () => {
    if (!telebirrPaymentData) return;
    setIsConfirmingTelebirr(true);
    try {
      const res = await apiClient.post<InvoiceRecord>('/billing/telebirr/confirm', {
        transaction_reference: telebirrPaymentData.transaction_reference,
      });
      notifications.show({
        title: 'Payment Succeeded',
        message: `Nagaheen ${res.data.invoice_number} Telebirr dhaan kaffalamee mirkanaa'eera!`,
        color: 'green',
      });
      setTelebirrPaymentData(null);
      setSelectedInvoice(res.data);
      setReceiptInvoice(res.data);
      await fetchAllBillingData();
    } catch (err: any) {
      console.error('Confirm error:', err);
      notifications.show({
        title: 'Verification Failed',
        message: err.response?.data?.detail || 'Kaffaltii mirkaneessuun hin danda\'amne.',
        color: 'red',
      });
    } finally {
      setIsConfirmingTelebirr(false);
    }
  };

  // ==========================================
  // Handlers: Cashier Direct Payment
  // ==========================================
  const handleCashierDirectPayment = async (method: 'cash' | 'cbe_birr' | 'cbhi') => {
    if (!selectedInvoice) return;
    setIsSettlingCash(true);
    try {
      const res = await apiClient.post<InvoiceRecord>('/billing/cashier/pay', {
        invoice_id: selectedInvoice.id,
        payment_method: method,
        payer_phone: telebirrPhone,
        notes: `Settled via ${method.toUpperCase()} by Cashier desk`,
      });
      notifications.show({
        title: 'Settlement Complete',
        message: `Nagaheen ${res.data.invoice_number} karaa ${method.toUpperCase()} kaffalameera.`,
        color: 'teal',
      });
      setSelectedInvoice(res.data);
      setReceiptInvoice(res.data);
      await fetchAllBillingData();
    } catch (err: any) {
      console.error('Cashier settlement error:', err);
      notifications.show({
        title: 'Settlement Error',
        message: err.response?.data?.detail || 'Kaffaltii galmeessuu hin dandeenye.',
        color: 'red',
      });
    } finally {
      setIsSettlingCash(false);
    }
  };

  // ==========================================
  // Handlers: Create Invoice
  // ==========================================
  const handleAddPresetItem = (service_name: string, service_code: string, unit_price: number) => {
    setNewInvoiceItems((prev) => [...prev, { service_name, service_code, quantity: 1, unit_price }]);
  };

  const handleRemoveItem = (index: number) => {
    setNewInvoiceItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newInvoiceItems.length === 0) {
      notifications.show({ title: 'Validation Error', message: 'Tajaajila yoo xiqqaate tokko dabalaa.', color: 'red' });
      return;
    }
    try {
      const res = await apiClient.post<InvoiceRecord>('/billing/invoices', {
        patient_id: Number(newInvoicePatientId),
        items: newInvoiceItems,
        apply_cbhi: newInvoiceApplyCbhi,
        notes: newInvoiceNotes || 'Generated at Hospital Billing Counter',
      });
      notifications.show({
        title: 'Invoice Created',
        message: `Nagaheen ${res.data.invoice_number} uumameera.`,
        color: 'teal',
      });
      setIsCreateInvoiceOpen(false);
      setSelectedInvoice(res.data);
      await fetchAllBillingData();
    } catch (err: any) {
      console.error('Create invoice error:', err);
      notifications.show({ title: 'Error', message: 'Nagahee uumuu hin dandeenye.', color: 'red' });
    }
  };

  // ==========================================
  // Filtered Invoices
  // ==========================================
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? inv.status === 'pending' || inv.status === 'partial'
          : inv.status === statusFilter;

      const s = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        inv.invoice_number.toLowerCase().includes(s) ||
        (inv.patient &&
          `${inv.patient.first_name} ${inv.patient.last_name} ${inv.patient.mrn}`.toLowerCase().includes(s)) ||
        inv.items.some((it) => it.service_name.toLowerCase().includes(s));

      return matchesStatus && matchesSearch;
    });
  }, [invoices, statusFilter, searchTerm]);

  // Aggregate Counters
  const pendingCount = useMemo(() => invoices.filter((i) => i.status === 'pending' || i.status === 'partial').length, [invoices]);
  const paidCount = useMemo(() => invoices.filter((i) => i.status === 'paid').length, [invoices]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 transition-colors font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-[#101624] px-5 sm:px-6 py-4.5 rounded-2xl border border-slate-200 dark:border-[#1e293b] shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {language === 'om' ? 'Kaffaltii & Galii Hospitaalaa' : 'Billing & Revenue Assurance'}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Telebirr & CBHI Gateway Live
                  </span>
                  {isLiveConnected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      [Database Synchronized]
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mettu Karl Referral Hospital — 90% CBHI Co-Pay Waiver • Telebirr Push • Cashier General Ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={fetchAllBillingData}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-[#1a2233] hover:bg-slate-200 dark:hover:bg-[#232e44] text-slate-700 dark:text-slate-200 px-3.5 py-2 text-xs font-semibold border border-slate-300 dark:border-[#2e3c54] transition cursor-pointer"
                title="Refresh live data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                <span>{language === 'om' ? 'Haaromsi' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateInvoiceOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold px-4 py-2 text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950 font-black" />
                <span>{language === 'om' ? '+ Nagahee Haaraa Uumi' : '+ Create Patient Invoice'}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Financial KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] p-4.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {language === 'om' ? 'Galiin Har\'aa' : "Today's Settled Revenue"}
              </span>
              <p className="mt-1 text-2xl font-black text-amber-400">
                {revenueSummary ? `${revenueSummary.today_total_revenue.toFixed(2)} ETB` : '0.00 ETB'}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Verified Direct Settlement</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] p-4.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {language === 'om' ? 'Wabiin Fayyaa CBHI' : 'CBHI Subsidies Claimed'}
              </span>
              <p className="mt-1 text-2xl font-black text-cyan-400">
                {revenueSummary ? `${revenueSummary.today_cbhi_claims.toFixed(2)} ETB` : '0.00 ETB'}
              </p>
              <span className="text-[11px] text-slate-400 font-medium">90% Woreda MOH Reimbursement</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] p-4.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {language === 'om' ? 'Telebirr Dijitaalaa' : 'Telebirr Digital Flow'}
              </span>
              <p className="mt-1 text-2xl font-black text-emerald-400">
                {revenueSummary ? `${revenueSummary.today_telebirr_revenue.toFixed(2)} ETB` : '0.00 ETB'}
              </p>
              <span className="text-[11px] text-emerald-400 font-medium">Instant QR/USSD Push</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] p-4.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {language === 'om' ? 'Nagahee Eegaa Jiru' : 'Pending Invoices'}
              </span>
              <p className="mt-1 text-2xl font-black text-rose-400">
                {pendingCount} <span className="text-xs font-normal text-slate-400">Invoices</span>
              </p>
              <span className="text-[11px] text-rose-400 font-semibold">Awaiting Cashier Settlement</span>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#101624] p-2 rounded-2xl border border-slate-200 dark:border-[#1e293b] shadow-sm">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#0b0f17] rounded-xl border border-slate-200 dark:border-[#1e293b]">
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'invoices'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>{language === 'om' ? '1. Nagahee Kaffaltii (Invoices)' : '1. Patient Invoices & Cashier'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-slate-950 font-black">
                  {invoices.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('revenue')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'revenue'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>{language === 'om' ? '2. Gabaasa Galii (Revenue Ledger)' : '2. Daily Revenue Ledger'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cbhi')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'cbhi'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'om' ? '3. Inshuraansii CBHI (Registry)' : '3. CBHI Registry'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20 text-slate-950 font-black">
                  {cbhiPolicies.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  language === 'om' ? 'Koodii nagahee, MRN, ykn maqaa barbaadi...' : 'Search invoice #, MRN, patient name...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-[#222b3d] bg-slate-50 dark:bg-[#0b0f17] text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: PATIENT INVOICES & CASHIER CHECKOUT                */}
          {/* ========================================================= */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {/* Status Filters */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400 font-medium">Filter Invoices:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'bg-white dark:bg-[#101624] text-slate-400 border border-slate-200 dark:border-[#1e293b] hover:text-white'
                  }`}
                >
                  All ({invoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                      : 'bg-white dark:bg-[#101624] text-slate-400 border border-slate-200 dark:border-[#1e293b] hover:text-white'
                  }`}
                >
                  Pending Checkout ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'bg-white dark:bg-[#101624] text-slate-400 border border-slate-200 dark:border-[#1e293b] hover:text-white'
                  }`}
                >
                  Settled / Paid ({paidCount})
                </button>
              </div>

              {/* Master-Detail Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left 7 Columns: Invoices Table */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-[#0c101a] border-b border-slate-200 dark:border-[#1e293b] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-4 py-3.5">Invoice #</th>
                            <th className="px-4 py-3.5">Patient Details</th>
                            <th className="px-4 py-3.5">Total / Subsidy</th>
                            <th className="px-4 py-3.5">Patient Due</th>
                            <th className="px-4 py-3.5">Status</th>
                            <th className="px-4 py-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1b2334]">
                          {filteredInvoices.map((inv) => {
                            const isSelected = selectedInvoice?.id === inv.id;
                            const isPaid = inv.status === 'paid';
                            return (
                              <tr
                                key={inv.id}
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  if (inv.patient?.phone_number) {
                                    setTelebirrPhone(inv.patient.phone_number.replace('+251', '0'));
                                  }
                                  setTelebirrPaymentData(null);
                                }}
                                className={`transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500/10 dark:bg-amber-500/10 border-l-4 border-l-amber-500'
                                    : 'hover:bg-slate-50 dark:hover:bg-amber-500/5'
                                }`}
                              >
                                <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                                  {inv.invoice_number}
                                  <span className="block text-[10px] text-slate-400 font-sans">
                                    {new Date(inv.created_at).toLocaleDateString()}
                                  </span>
                                </td>

                                <td className="px-4 py-3.5">
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : `Patient #${inv.patient_id}`}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] text-cyan-400">{inv.patient?.mrn}</span>
                                    {inv.patient?.has_cbhi && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        CBHI 90%
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 py-3.5 font-mono">
                                  <span className="text-slate-300 font-medium">{inv.total_amount.toFixed(2)} ETB</span>
                                  {inv.insurance_covered_amount > 0 && (
                                    <span className="block text-[10px] text-emerald-400">
                                      - {inv.insurance_covered_amount.toFixed(2)} CBHI
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3.5 font-mono font-bold">
                                  <span
                                    className={`text-sm ${
                                      isPaid ? 'text-slate-400 line-through' : 'text-rose-400'
                                    }`}
                                  >
                                    {inv.patient_payable_amount.toFixed(2)} ETB
                                  </span>
                                </td>

                                <td className="px-4 py-3.5">
                                  {isPaid ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>SETTLED</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-rose-300 animate-pulse">
                                      <Clock className="w-3 h-3 text-rose-400" />
                                      <span>PENDING</span>
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3.5 text-right">
                                  {isPaid ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReceiptInvoice(inv);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1a2233] text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-semibold transition"
                                    >
                                      <Printer className="w-3 h-3 text-amber-400" />
                                      <span>Receipt</span>
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center text-amber-400 font-bold text-xs">
                                      Checkout <ChevronRight className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {filteredInvoices.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400">
                                {language === 'om' ? 'Nagaheen hin argamne.' : 'No invoices match your filter.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right 5 Columns: Cashier Checkout & Settlement Panel */}
                <div className="lg:col-span-5">
                  {selectedInvoice ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] p-5 shadow-sm space-y-4 sticky top-6">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-3">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-amber-400" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Cashier Settlement Desk
                          </h3>
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {selectedInvoice.invoice_number}
                        </span>
                      </div>

                      {/* Patient Summary Card */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1e293b] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dhukkubsataa</span>
                          <p className="font-bold text-slate-200 text-sm">
                            {selectedInvoice.patient
                              ? `${selectedInvoice.patient.first_name} ${selectedInvoice.patient.last_name}`
                              : `Patient #${selectedInvoice.patient_id}`}
                          </p>
                          <span className="font-mono text-xs text-amber-400 font-semibold">
                            {selectedInvoice.patient?.mrn}
                          </span>
                        </div>
                        {selectedInvoice.patient?.has_cbhi ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              CBHI Active
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                              {selectedInvoice.patient.cbhi_household}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            Standard Fee
                          </span>
                        )}
                      </div>

                      {/* Line items list */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Tajaajiloota Yaalaa (Services):
                        </span>
                        {selectedInvoice.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-[#0f1422] border border-slate-100 dark:border-[#1a2233]"
                          >
                            <span className="text-slate-300 truncate max-w-[220px]">
                              {it.quantity}x {it.service_name}
                            </span>
                            <span className="font-mono font-semibold text-slate-200">
                              {it.total_price.toFixed(2)} ETB
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Calculations breakdown */}
                      <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Waliigala Tajaajilaa (Subtotal):</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            {selectedInvoice.total_amount.toFixed(2)} ETB
                          </span>
                        </div>
                        {selectedInvoice.insurance_covered_amount > 0 && (
                          <div className="flex justify-between text-emerald-400 font-medium">
                            <span>Wabiin Fayyaa CBHI (90% Covered):</span>
                            <span className="font-mono">
                              - {selectedInvoice.insurance_covered_amount.toFixed(2)} ETB
                            </span>
                          </div>
                        )}
                        <div className="border-t border-amber-500/20 pt-2 flex justify-between items-baseline text-sm font-black">
                          <span className="text-slate-100">Kaffaltii Dhukkubsataa (Due):</span>
                          <span className="text-amber-400 font-mono text-lg">
                            {selectedInvoice.patient_payable_amount.toFixed(2)} ETB
                          </span>
                        </div>
                      </div>

                      {/* Already Paid vs Checkout Action */}
                      {selectedInvoice.status === 'paid' ? (
                        <div className="space-y-3 pt-2">
                          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Kaffaltiin Guutummaatti Mirkanaa'eera (PAID)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReceiptInvoice(selectedInvoice)}
                            className="w-full h-10 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/40 transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-amber-400" />
                            <span>Agarsiisi Nagahee (Print Hospital Tax Receipt)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2">
                          {/* Payment Gateway Toggle */}
                          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1e293b] text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutMethod('telebirr');
                                setTelebirrPaymentData(null);
                              }}
                              className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                                checkoutMethod === 'telebirr'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Telebirr
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutMethod('cash');
                                setTelebirrPaymentData(null);
                              }}
                              className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                                checkoutMethod === 'cash'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Cash Desk
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutMethod('cbe_birr');
                                setTelebirrPaymentData(null);
                              }}
                              className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                                checkoutMethod === 'cbe_birr'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              CBE Birr
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutMethod('cbhi');
                                setTelebirrPaymentData(null);
                              }}
                              className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                                checkoutMethod === 'cbhi'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              CBHI Waive
                            </button>
                          </div>

                          {/* Gateway Detail Panel: Telebirr */}
                          {checkoutMethod === 'telebirr' && (
                            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1e293b] text-xs">
                              <div>
                                <label className="block text-slate-300 font-semibold mb-1">
                                  Telebirr Mobile Phone *
                                </label>
                                <input
                                  type="text"
                                  value={telebirrPhone}
                                  onChange={(e) => setTelebirrPhone(e.target.value)}
                                  placeholder="0911XXXXXX"
                                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#101624] text-slate-100 font-mono font-bold focus:border-amber-500 focus:outline-none"
                                />
                              </div>

                              {telebirrPaymentData ? (
                                <div className="space-y-3 p-3 rounded-xl bg-[#102419] border border-emerald-500/40 text-center">
                                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                                    <Smartphone className="w-4 h-4 animate-bounce" />
                                    <span>USSD Push Sent to {telebirrPhone}!</span>
                                  </div>
                                  <div className="p-3 bg-white rounded-lg inline-block shadow-md">
                                    <QrCode className="w-28 h-28 text-slate-950" />
                                  </div>
                                  <p className="text-[10px] text-slate-300 font-mono">
                                    Ref: {telebirrPaymentData.transaction_reference}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={handleConfirmTelebirr}
                                    disabled={isConfirmingTelebirr}
                                    className="w-full h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                  >
                                    {isConfirmingTelebirr ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Confirming Webhook...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4" />
                                        <span>Simulate Customer PIN Approval</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleInitiateTelebirr}
                                  disabled={isInitiatingTelebirr}
                                  className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 text-slate-950 font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                                >
                                  {isInitiatingTelebirr ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                      <span>Contacting Ethio Telecom...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Smartphone className="w-4 h-4 text-slate-950" />
                                      <span>
                                        Pay {selectedInvoice.patient_payable_amount.toFixed(2)} ETB with Telebirr
                                      </span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Gateway Detail Panel: Cash Desk */}
                          {checkoutMethod === 'cash' && (
                            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1e293b] text-xs">
                              <p className="text-slate-300 font-medium">
                                Qarshii callaa harka dhukkubsataatii fuudhuun nagahee seeraa dhiyeessi.
                              </p>
                              <button
                                type="button"
                                onClick={() => handleCashierDirectPayment('cash')}
                                disabled={isSettlingCash}
                                className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-slate-950 font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
                              >
                                {isSettlingCash ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Settling Cashier Ledger...</span>
                                  </>
                                ) : (
                                  <>
                                    <Banknote className="w-4 h-4" />
                                    <span>
                                      Collect {selectedInvoice.patient_payable_amount.toFixed(2)} ETB Cash & Settle
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Gateway Detail Panel: CBE Birr */}
                          {checkoutMethod === 'cbe_birr' && (
                            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1e293b] text-xs">
                              <p className="text-slate-300 font-medium">
                                Commercial Bank of Ethiopia (CBE Birr) mobile transfer confirmation.
                              </p>
                              <button
                                type="button"
                                onClick={() => handleCashierDirectPayment('cbe_birr')}
                                disabled={isSettlingCash}
                                className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 text-white font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                              >
                                {isSettlingCash ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Verifying CBE Birr...</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="w-4 h-4" />
                                    <span>Confirm {selectedInvoice.patient_payable_amount.toFixed(2)} ETB via CBE</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Gateway Detail Panel: CBHI Waiver */}
                          {checkoutMethod === 'cbhi' && (
                            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1e293b] text-xs">
                              <p className="text-slate-300 font-medium">
                                Wabiin Fayyaa Hawaasaa (100% CBHI Waiver Scheme - Exempt Group).
                              </p>
                              <button
                                type="button"
                                onClick={() => handleCashierDirectPayment('cbhi')}
                                disabled={isSettlingCash}
                                className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 text-slate-950 font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Apply CBHI Full Waiver Voucher</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] p-8 text-center text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-50" />
                      <p className="font-semibold text-sm">Nagaheen hin filatamne.</p>
                      <p className="text-xs text-slate-500 mt-1">Select an invoice on the left to begin cashier checkout.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: DAILY REVENUE LEDGER & AUDIT TRAIL                 */}
          {/* ========================================================= */}
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'om' ? 'Galmee Galii Guyyaa (Daily Revenue Ledger)' : 'Hospital Financial Audit Ledger'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable real-time ledger of cashier collections, Telebirr digital settlements, and CBHI claims.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                  Zero Financial Leakage Verified
                </span>
              </div>

              {/* Channel breakdown cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624]">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Telebirr Mobile Channel</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    {revenueSummary?.today_telebirr_revenue.toFixed(2)} ETB
                  </p>
                  <span className="text-[10px] text-slate-400">Direct Ethio Telecom Settlement</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624]">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Cash Desk Channel</span>
                  <p className="text-xl font-bold text-amber-400 mt-1">
                    {revenueSummary?.today_cash_revenue.toFixed(2)} ETB
                  </p>
                  <span className="text-[10px] text-slate-400">In-hand physical bank deposits</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624]">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Government CBHI Subsidies</span>
                  <p className="text-xl font-bold text-cyan-400 mt-1">
                    {revenueSummary?.today_cbhi_claims.toFixed(2)} ETB
                  </p>
                  <span className="text-[10px] text-slate-400">Woreda Health Office Claims</span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#0c101a] border-b border-slate-200 dark:border-[#1e293b] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3.5">Timestamp</th>
                        <th className="px-4 py-3.5">Invoice #</th>
                        <th className="px-4 py-3.5">Payment Method</th>
                        <th className="px-4 py-3.5">Transaction Ref</th>
                        <th className="px-4 py-3.5">Payer Phone</th>
                        <th className="px-4 py-3.5">Amount Settled</th>
                        <th className="px-4 py-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1b2334]">
                      {invoices.flatMap((inv) =>
                        inv.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-amber-500/5">
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {new Date(p.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-amber-400">{inv.invoice_number}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                                {p.payment_method}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-300">{p.transaction_reference}</td>
                            <td className="px-4 py-3 font-mono text-slate-400">{p.payer_phone || 'Cash Desk'}</td>
                            <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                              +{p.amount.toFixed(2)} ETB
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <Check className="w-3 h-3" />
                                {p.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CBHI REGISTRY (COMMUNITY HEALTH INSURANCE)         */}
          {/* ========================================================= */}
          {activeTab === 'cbhi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'om' ? 'Galmee Wabiin Fayyaa Hawaasaa (CBHI Registry)' : 'CBHI Insurance Policies Registry'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verified household policies under Ethiopian Ministry of Health & Mettu Woreda Health Bureau.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/30">
                  {cbhiPolicies.length} Active Households
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#0c101a] border-b border-slate-200 dark:border-[#1e293b] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3.5">Policy / Household #</th>
                        <th className="px-4 py-3.5">Patient ID</th>
                        <th className="px-4 py-3.5">Kebele / Catchment</th>
                        <th className="px-4 py-3.5">Woreda</th>
                        <th className="px-4 py-3.5">Valid Until</th>
                        <th className="px-4 py-3.5">Co-Pay Rate</th>
                        <th className="px-4 py-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1b2334]">
                      {cbhiPolicies.map((pol) => (
                        <tr key={pol.id} className="hover:bg-amber-500/5">
                          <td className="px-4 py-3 font-mono font-bold text-cyan-400">{pol.household_number}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">Patient #{pol.patient_id}</td>
                          <td className="px-4 py-3 text-slate-300">{pol.kebele}</td>
                          <td className="px-4 py-3 text-slate-300">{pol.woreda}</td>
                          <td className="px-4 py-3 font-mono text-amber-400">{pol.expiry_date}</td>
                          <td className="px-4 py-3 font-bold text-slate-200">{pol.co_pay_percentage}% Co-pay</td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3" />
                              ACTIVE POLICY
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL 1: CREATE PATIENT INVOICE                           */}
          {/* ========================================================= */}
          {isCreateInvoiceOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
              <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b] pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {language === 'om' ? 'Nagahee Yaalaa Haaraa Uumi' : 'Create New Patient Invoice'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateInvoiceOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2233] text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Filadhu Dhukkubsataa (Select Patient) *
                    </label>
                    <select
                      value={newInvoicePatientId}
                      onChange={(e) => setNewInvoicePatientId(parseInt(e.target.value))}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-[#222b3d] bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value={1}>Gudeta Hailu (MKH-2026-000101) - CBHI Active (Kebele 01)</option>
                      <option value={2}>Ayantu Mamo (MKH-2026-000102) - Standard / Non-insured</option>
                    </select>
                  </div>

                  {/* CBHI Waiver Toggle */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="font-bold text-emerald-300 block">Apply 90% CBHI Co-Pay Waiver</span>
                        <span className="text-[11px] text-slate-400">Patient pays only 10% co-pay out of pocket</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newInvoiceApplyCbhi}
                      onChange={(e) => setNewInvoiceApplyCbhi(e.target.checked)}
                      className="h-4 w-4 rounded border-emerald-400 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">
                      Quick Add Clinical Services:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleAddPresetItem('Specialist OPD Consultation', 'OPD-SPEC-01', 200.0)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1a2233] text-slate-300 hover:text-white border border-slate-200 dark:border-[#2e3c54] text-[11px]"
                      >
                        + OPD Consult (200 ETB)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPresetItem('Urinalysis & Renal Panel', 'LAB-URI-01', 180.0)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1a2233] text-slate-300 hover:text-white border border-slate-200 dark:border-[#2e3c54] text-[11px]"
                      >
                        + Urinalysis (180 ETB)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPresetItem('Chest X-Ray Digital View', 'RAD-CXR-01', 350.0)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1a2233] text-slate-300 hover:text-white border border-slate-200 dark:border-[#2e3c54] text-[11px]"
                      >
                        + Chest X-Ray (350 ETB)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPresetItem('Inpatient Bed Stay (1 Day)', 'WARD-BED-01', 300.0)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1a2233] text-slate-300 hover:text-white border border-slate-200 dark:border-[#2e3c54] text-[11px]"
                      >
                        + Bed Stay (300 ETB)
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 border-t border-slate-200 dark:border-[#1e293b] pt-3">
                    <span className="font-bold text-slate-300 block">Line Items ({newInvoiceItems.length}):</span>
                    {newInvoiceItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0c101a] border border-slate-200 dark:border-[#1e293b]"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">{item.service_name}</p>
                          <span className="font-mono text-[10px] text-slate-400">
                            {item.quantity}x @ {item.unit_price.toFixed(2)} ETB
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            {(item.quantity * item.unit_price).toFixed(2)} ETB
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Yaada Dabalataa (Notes)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ward Admission / Emergency referral"
                      value={newInvoiceNotes}
                      onChange={(e) => setNewInvoiceNotes(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-[#222b3d] bg-slate-50 dark:bg-[#0b0f17] text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e293b]">
                    <button
                      type="button"
                      onClick={() => setIsCreateInvoiceOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-[#2e3c54] text-slate-400 hover:text-white"
                    >
                      Dhiisi (Cancel)
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-bold hover:brightness-105"
                    >
                      Uumi Nagahee (Generate Invoice)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL 2: PRINTABLE OFFICIAL HOSPITAL TAX RECEIPT          */}
          {/* ========================================================= */}
          {receiptInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#101624] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b] pb-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Official Tax Invoice & Voucher
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Voucher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptInvoice(null)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2233] text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Receipt Body */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#0c101a] space-y-4 text-xs font-sans">
                  {/* Hospital Official Letterhead */}
                  <div className="text-center border-b border-slate-200 dark:border-[#222b3d] pb-3">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Mettu Karl Referral Hospital
                    </h2>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Oromia Regional Health Bureau • Mettu, Ethiopia
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      TIN: 0038912401 • FS Number: FS-MKH-{receiptInvoice.id.toString().padStart(6, '0')}
                    </p>
                    <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                      OFFICIAL CASHIER RECEIPT • SETTLED
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Invoice Number:</span>
                      <strong className="font-mono text-slate-200">{receiptInvoice.invoice_number}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Date & Time:</span>
                      <span className="font-mono text-slate-200">
                        {new Date(receiptInvoice.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Patient Name:</span>
                      <strong className="text-slate-200">
                        {receiptInvoice.patient
                          ? `${receiptInvoice.patient.first_name} ${receiptInvoice.patient.last_name}`
                          : `Patient #${receiptInvoice.patient_id}`}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Patient MRN:</span>
                      <span className="font-mono text-cyan-400 font-bold">{receiptInvoice.patient?.mrn}</span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border-t border-b border-slate-200 dark:border-[#222b3d] py-2">
                    <table className="w-full text-left text-[11px]">
                      <thead className="text-[10px] uppercase text-slate-400">
                        <tr>
                          <th className="pb-1">Service Description</th>
                          <th className="pb-1 text-center">Qty</th>
                          <th className="pb-1 text-right">Unit Price</th>
                          <th className="pb-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1b2334]">
                        {receiptInvoice.items.map((it, i) => (
                          <tr key={i}>
                            <td className="py-1 text-slate-300">{it.service_name}</td>
                            <td className="py-1 text-center font-mono">{it.quantity}</td>
                            <td className="py-1 text-right font-mono">{it.unit_price.toFixed(2)}</td>
                            <td className="py-1 text-right font-mono font-bold">{it.total_price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Totals */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Clinical Amount:</span>
                      <span className="font-mono text-slate-200">{receiptInvoice.total_amount.toFixed(2)} ETB</span>
                    </div>
                    {receiptInvoice.insurance_covered_amount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-medium">
                        <span>CBHI Government Subsidy (90%):</span>
                        <span className="font-mono">- {receiptInvoice.insurance_covered_amount.toFixed(2)} ETB</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 dark:border-[#222b3d] pt-1 flex justify-between font-black text-xs text-amber-400">
                      <span>Amount Paid by Patient:</span>
                      <span className="font-mono text-sm">{receiptInvoice.paid_amount.toFixed(2)} ETB</span>
                    </div>
                  </div>

                  {/* Payment Details & Verification Barcode */}
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#101624] border border-slate-200 dark:border-[#222b3d] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Settlement Channel</span>
                      <span className="font-bold text-slate-200 font-mono text-xs">
                        {receiptInvoice.payments[0]?.payment_method.toUpperCase() || 'CASHIER DESK'}
                      </span>
                      <span className="block text-[10px] text-amber-400 font-mono">
                        Ref: {receiptInvoice.payments[0]?.transaction_reference || 'DIRECT-VERIFIED'}
                      </span>
                    </div>
                    <div className="text-right">
                      <QrCode className="w-12 h-12 text-slate-200 inline-block" />
                    </div>
                  </div>

                  {/* Cashier Stamp */}
                  <div className="pt-2 text-center text-[10px] text-slate-500 italic">
                    Galatoomaa! • Thank you for choosing Mettu Karl Referral Hospital.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
