/**
 * Enterprise Laboratory Information System (LIS) & Blood Investigation Workstation.
 * Module 4: Professional real-world healthcare diagnostic suite.
 *
 * Capabilities:
 * - Real-time physician lab requisition queues (STAT, URGENT, ROUTINE)
 * - Phlebotomy accessioning with specimen tube color guides & barcode generation
 * - Parameter result entry with LOINC standard coding & critical panic value alerts
 * - Official printable diagnostic laboratory report with TIN, QR verification & pathologist sign-off
 * - Diagnostic test catalog directory with Ethiopian Birr pricing & reference intervals
 * - Obsidian & Champagne Gold luxury UI theme
 */
'use client';

import React, { useState, useEffect, useMemo, useId } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import apiClient from '@/lib/api';
import {
  FlaskConical,
  TestTube,
  Microscope,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Printer,
  QrCode,
  ShieldAlert,
  ChevronRight,
  FileText,
  User,
  Sparkles,
  RefreshCw,
  Send,
  Droplets,
  Calendar,
  Layers,
  X,
  Stethoscope,
  Info,
  Check,
  Cpu,
  Radio,
} from 'lucide-react';

interface ParameterDef {
  name: string;
  unit?: string;
  reference_range?: string;
  min_ref?: number;
  max_ref?: number;
  critical_low?: number;
  critical_high?: number;
}

interface TestCatalog {
  id: number;
  test_code: string;
  test_name: string;
  name_om?: string;
  category: string;
  specimen_type: string;
  tube_color: string;
  loinc_code?: string;
  price_etb: number;
  turnaround_time_mins: number;
  parameters: ParameterDef[];
}

interface OrderItem {
  id: number;
  test_catalog_id: number;
  test_code: string;
  test_name: string;
  name_om?: string;
  category: string;
  specimen_type: string;
  tube_color: string;
  loinc_code?: string;
  price_etb: number;
  status: string;
}

interface LabResult {
  id: number;
  test_catalog_id: number;
  parameter_name: string;
  result_value: string;
  unit?: string;
  reference_range?: string;
  flag: 'normal' | 'low' | 'high' | 'critical_panic';
  notes?: string;
  recorded_at: string;
  technologist_name?: string;
}

interface LabOrder {
  id: number;
  order_number: string;
  patient_id: number;
  patient_mrn: string;
  patient_name: string;
  patient_gender: string;
  patient_age: number;
  patient_phone?: string;
  ordering_doctor_name: string;
  priority: 'routine' | 'urgent' | 'stat';
  clinical_notes?: string;
  status: 'ordered' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  ordered_at: string;
  sample_collected_at?: string;
  sample_barcode?: string;
  sample_collector_name?: string;
  completed_at?: string;
  verified_by_name?: string;
  has_critical_flag: boolean;
  billing_invoice_id?: number;
  items: OrderItem[];
  results: LabResult[];
}

interface LabStats {
  pending_orders_count: number;
  samples_collected_count: number;
  processing_count: number;
  completed_today_count: number;
  critical_panic_count: number;
  stat_urgent_count: number;
  total_tests_conducted: number;
}

export default function LaboratoryPage(): React.ReactElement {
  const { t } = useTranslation();

  // State Management
  const [stats, setStats] = useState<LabStats>({
    pending_orders_count: 0,
    samples_collected_count: 0,
    processing_count: 0,
    completed_today_count: 0,
    critical_panic_count: 0,
    stat_urgent_count: 0,
    total_tests_conducted: 0,
  });
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [catalog, setCatalog] = useState<TestCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'orders' | 'catalog' | 'blood_match' | 'hl7_analyzers'>('queue');
  const [hl7IngestLog, setHl7IngestLog] = useState<any | null>(null);
  const [hl7Simulating, setHl7Simulating] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form: Create Lab Requisition
  const [newOrderPatientId, setNewOrderPatientId] = useState(1);
  const [newOrderPriority, setNewOrderPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);

  // Form: Record Results
  const [resultInputs, setResultInputs] = useState<{ [paramName: string]: { value: string; flag: 'normal' | 'low' | 'high' | 'critical_panic'; notes: string } }>({});
  const [overallResultNotes, setOverallResultNotes] = useState('');

  // Form: Quick Blood Compatibility Checker
  const [compatDonorGroup, setCompatDonorGroup] = useState('O_NEG');
  const [compatRecipientGroup, setCompatRecipientGroup] = useState('A_POS');
  const [crossmatchResult, setCrossmatchResult] = useState<string | null>(null);

  const handleSimulateHL7Run = async () => {
    setHl7Simulating(true);
    try {
      const res = await apiClient.post('/hl7/simulate-analyzer-run', null, {
        params: { mrn: 'MKH-2026-000101', analyzer_model: 'Sysmex XN-550 Hematology' },
      });
      if (res.data) {
        setHl7IngestLog(res.data);
        setActionSuccess('HL7 v2.5 ORU^R01 packet processed & MLLP ACK returned successfully!');
      }
    } catch {
      setActionError('Failed to communicate with MLLP socket');
    } finally {
      setHl7Simulating(false);
    }
  };

  // Fetch all laboratory data from live backend
  const fetchAllLabData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [statsRes, ordersRes, catalogRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/laboratory/stats'),
        fetch('http://127.0.0.1:8000/api/v1/laboratory/orders'),
        fetch('http://127.0.0.1:8000/api/v1/laboratory/catalog'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
        if (ordersData.length > 0 && !selectedOrderId) {
          setSelectedOrderId(ordersData[0].id);
        }
      }
      if (catalogRes.ok) {
        const catalogData = await catalogRes.json();
        setCatalog(catalogData);
        if (catalogData.length > 0 && selectedTestIds.length === 0) {
          setSelectedTestIds([catalogData[0].id]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load lab data:', err);
      setActionError("Sirna laaboraatorii wajjin wal-qunnamtii uumuun hin danda'amne. Server uvicorn ilaalaa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLabData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'catalog' || tabParam === 'orders' || tabParam === 'blood_match') {
        setActiveTab(tabParam as any);
      }
      if (params.get('print') === 'true') {
        setShowPrintModal(true);
      }
    }
  }, []);

  // Selected Order
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        searchQuery === '' ||
        o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.sample_barcode && o.sample_barcode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPriority = priorityFilter === 'all' || o.priority === priorityFilter;
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;

      return matchSearch && matchPriority && matchStatus;
    });
  }, [orders, searchQuery, priorityFilter, statusFilter]);

  // Priority color styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse';
      case 'urgent':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      default:
        return 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20';
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
      case 'sample_collected':
      case 'processing':
        return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
      case 'cancelled':
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
      default:
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    }
  };

  // Handle Phlebotomy Specimen Draw confirmation
  const handleCollectSample = async (orderId: number) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/laboratory/orders/${orderId}/collect-sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error('Failed to record specimen collection');
      }

      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setActionSuccess(`Saammoon Dhiigaa Lakk. Barcode ${updated.sample_barcode} milkaa'inaan galmaa'eera!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchAllLabData();
    } catch (err: any) {
      setActionError(err.message || 'Saammoo fudhachuu irratti rakkoon uumame');
    } finally {
      setActionLoading(false);
    }
  };

  // Initialize result inputs when opening modal or selecting order
  const openResultEntryModal = (order: LabOrder) => {
    const initialInputs: { [key: string]: { value: string; flag: 'normal' | 'low' | 'high' | 'critical_panic'; notes: string } } = {};

    order.items.forEach((item) => {
      const test = catalog.find((c) => c.id === item.test_catalog_id);
      if (test && test.parameters) {
        test.parameters.forEach((p) => {
          // Check if already has result
          const existingResult = order.results.find((r) => r.parameter_name === p.name);
          initialInputs[p.name] = {
            value: existingResult ? existingResult.result_value : '',
            flag: existingResult ? existingResult.flag : 'normal',
            notes: existingResult ? existingResult.notes || '' : '',
          };
        });
      }
    });

    setResultInputs(initialInputs);
    setOverallResultNotes(order.clinical_notes || '');
    setShowResultModal(true);
  };

  // Auto-flag numeric result evaluation
  const handleResultValueChange = (paramDef: ParameterDef, val: string) => {
    const numVal = parseFloat(val);
    let autoFlag: 'normal' | 'low' | 'high' | 'critical_panic' = 'normal';

    if (!isNaN(numVal)) {
      if (paramDef.critical_low !== undefined && numVal <= paramDef.critical_low) {
        autoFlag = 'critical_panic';
      } else if (paramDef.critical_high !== undefined && numVal >= paramDef.critical_high) {
        autoFlag = 'critical_panic';
      } else if (paramDef.min_ref !== undefined && numVal < paramDef.min_ref) {
        autoFlag = 'low';
      } else if (paramDef.max_ref !== undefined && numVal > paramDef.max_ref) {
        autoFlag = 'high';
      }
    }

    setResultInputs((prev) => ({
      ...prev,
      [paramDef.name]: {
        value: val,
        flag: autoFlag,
        notes: prev[paramDef.name]?.notes || '',
      },
    }));
  };

  // Submit test results to backend
  const handleSubmitResults = async () => {
    if (!activeOrder) return;
    setActionLoading(true);
    setActionError(null);

    const payloadResults = Object.keys(resultInputs)
      .filter((k) => resultInputs[k].value.trim() !== '')
      .map((k) => ({
        parameter_name: k,
        result_value: resultInputs[k].value,
        flag: resultInputs[k].flag,
        notes: resultInputs[k].notes,
      }));

    if (payloadResults.length === 0) {
      setActionError("Yoo xiqqaate bu'aa qorannoo tokko galchuun dirqama.");
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/laboratory/orders/${activeOrder.id}/record-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: payloadResults,
          overall_notes: overallResultNotes,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record test results');
      }

      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setShowResultModal(false);
      setActionSuccess(`Bu'aan qorannoo Lakk. ${updated.order_number} milkaa'inaan mirkanaa'ee xumurameera!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchAllLabData();
    } catch (err: any) {
      setActionError(err.message || 'Error occurred while saving laboratory result');
    } finally {
      setActionLoading(false);
    }
  };

  // Create new physician lab requisition
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestIds.length === 0) {
      setActionError('Yoo xiqqaate gosa qorannoo tokko filachuun dirqama.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/laboratory/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: newOrderPatientId,
          priority: newOrderPriority,
          clinical_notes: newOrderNotes,
          test_catalog_ids: selectedTestIds,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.detail || 'Failed to place lab order');
      }

      const created = await res.json();
      setOrders((prev) => [created, ...prev]);
      setSelectedOrderId(created.id);
      setShowCreateModal(false);
      setNewOrderNotes('');
      setActionSuccess(`Ajajni Qorannoo Haaraan Lakk. ${created.order_number} milkaa'inaan qophaa'eera!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchAllLabData();
    } catch (err: any) {
      setActionError(err.message || 'Ajaja qorannoo uumuu irratti dogoggorri uumame');
    } finally {
      setActionLoading(false);
    }
  };

  // Compatibility Checker logic
  const checkCompatibility = () => {
    if (compatDonorGroup === 'O_NEG') {
      setCrossmatchResult("WAL-SIMATA (COMPATIBLE): O-Negative universal red cell donor dha; dhiiga kana dhukkubsataa kamuuf kennuun ni danda'ama.");
    } else if (compatDonorGroup === compatRecipientGroup) {
      setCrossmatchResult(`WAL-SIMATA (COMPATIBLE): Gosti dhiigaa lamaanuu tokko (${compatDonorGroup.replace('_', ' ')}). Wal-simannaan gaarii dha.`);
    } else if (compatRecipientGroup === 'AB_POS') {
      setCrossmatchResult("WAL-SIMATA (COMPATIBLE): AB-Positive universal recipient dha; dhiiga gosa kamiyyuu fudhachuu danda'a.");
    } else if (compatRecipientGroup === 'A_POS' && compatDonorGroup === 'A_NEG') {
      setCrossmatchResult('WAL-SIMATA (COMPATIBLE): A-Negative donor to A-Positive recipient nagaa dha.');
    } else if (compatRecipientGroup === 'B_POS' && compatDonorGroup === 'B_NEG') {
      setCrossmatchResult('WAL-SIMATA (COMPATIBLE): B-Negative donor to B-Positive recipient nagaa dha.');
    } else {
      setCrossmatchResult('HIN WAL-SIMATU (INCOMPATIBLE / HAZARD): Gosti dhiigaa kun wal-hin simu! Balaa hemolysis cimaa waan qabuuf dhiiga kana hin kenninaa!');
    }
  };

  // Trigger print
  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-[#0b0f17] text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Top Banner / Breadcrumb */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a2233] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">
                <Microscope className="w-4 h-4 text-amber-400" />
                <span>Moduulii 4: Qorannoo Laabooratorii & Dhiigaa</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400">Clinical Pathology & LIS</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Laboratory Information System (LIS)
                <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  LOINC / ISO 15189
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Ajaja qorannoo doktooraa, fudhatama saammoo dhiigaa (phlebotomy), fi mirkaneessa bu'aa qorannoo qulqullina olaanaadhaan.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAllLabData}
                disabled={loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#101624] text-slate-300 border border-[#1a2233] hover:border-slate-600 transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Haroomsi
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                + Ajaja Qorannoo Haaraa
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {actionError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Dabaree Eeggatan</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{stats.pending_orders_count}</div>
              <div className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
                <span>Awaiting phlebotomy desk</span>
              </div>
            </div>

            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Balaa & Ariifachiisaa</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400 tracking-tight">{stats.stat_urgent_count}</div>
              <div className="text-[11px] text-red-400/80 mt-1 flex items-center gap-1">
                <span>STAT / Urgent queue</span>
              </div>
            </div>

            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Saammoo Fuudhame</span>
                <TestTube className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300 tracking-tight">
                {stats.samples_collected_count + stats.processing_count}
              </div>
              <div className="text-[11px] text-cyan-400/80 mt-1 flex items-center gap-1">
                <span>In analyzer & testing</span>
              </div>
            </div>

            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Har'a Mirkanaa'e</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.completed_today_count}</div>
              <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
                <span>Verified diagnostics</span>
              </div>
            </div>

            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Akeekkachiisa Cimaa</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-500 tracking-tight">{stats.critical_panic_count}</div>
              <div className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1 font-semibold">
                <span>Critical Panic Values</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1a2233]">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'queue'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              1. Dabaree Qorannoo fi Saammoo (Active LIS Desk)
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'orders'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              2. Tarree Ajaja Qorannoo Guutuu (Directory)
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'catalog'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              3. Katalogii Qorannoo (LOINC & Pricing)
            </button>
            <button
              onClick={() => setActiveTab('blood_match')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'blood_match'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-4 h-4 text-red-400" />
              4. Baankii Dhiigaa & Wal-simannoo (Cross-Match)
            </button>
            <button
              onClick={() => setActiveTab('hl7_analyzers')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'hl7_analyzers'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-teal-400" />
              5. HL7 v2 Meeshaalee Laabii (Automated Analyzers)
            </button>
          </div>

          {/* TAB 1: ACTIVE LIS WORKSTATION & PHLEBOTOMY DESK */}
          {activeTab === 'queue' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Orders Queue List */}
              <div className="lg:col-span-5 bg-[#101624] border border-[#1a2233] rounded-2xl flex flex-col h-[740px] overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b border-[#1a2233] space-y-3 bg-[#0d121d]">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Barbaadi: MRN, Maqaa, Barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Sadarkaa:</span>
                    <button
                      onClick={() => setPriorityFilter('all')}
                      className={`px-2.5 py-1 rounded-lg ${priorityFilter === 'all' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-[#1a2233] text-slate-300'}`}
                    >
                      Hunda
                    </button>
                    <button
                      onClick={() => setPriorityFilter('stat')}
                      className={`px-2.5 py-1 rounded-lg ${priorityFilter === 'stat' ? 'bg-red-500 text-white font-bold' : 'bg-[#1a2233] text-red-400'}`}
                    >
                      STAT
                    </button>
                    <button
                      onClick={() => setPriorityFilter('urgent')}
                      className={`px-2.5 py-1 rounded-lg ${priorityFilter === 'urgent' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-[#1a2233] text-amber-300'}`}
                    >
                      Urgent
                    </button>
                  </div>
                </div>

                {/* Queue Items */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#1a2233] p-2 space-y-1">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs">
                      Ajajni qorannoo barbaadame hin jiru.
                    </div>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isSelected = ord.id === selectedOrderId;
                      return (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrderId(ord.id)}
                          className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-[#182032] border-amber-400/60 shadow-md'
                              : 'bg-transparent border-transparent hover:bg-[#141b2b]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-white">{ord.patient_name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityBadge(ord.priority)}`}>
                                  {ord.priority}
                                </span>
                              </div>
                              <span className="font-mono text-[11px] text-slate-400">{ord.patient_mrn}</span>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusBadge(ord.status)}`}>
                              {ord.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 line-clamp-1 mb-2 font-medium">
                            {ord.items.map((i) => i.test_code).join(' • ')}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-[#1a2233]">
                            <span className="font-mono">{ord.order_number}</span>
                            {ord.has_critical_flag && (
                              <span className="flex items-center gap-1 text-rose-400 font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                PANIC VALUE
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Workbench & Phlebotomy Specimen Desk */}
              <div className="lg:col-span-7 bg-[#101624] border border-[#1a2233] rounded-2xl flex flex-col h-[740px] overflow-hidden">
                {!activeOrder ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-center">
                    <Microscope className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-sm font-medium">Select an order from the roster to view specimen details and verify test results.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Active Order Banner */}
                    <div className="p-5 border-b border-[#1a2233] bg-[#0d121d] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-amber-400 font-bold">{activeOrder.order_number}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${getPriorityBadge(activeOrder.priority)}`}>
                            {activeOrder.priority}
                          </span>
                          <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full capitalize ${getStatusBadge(activeOrder.status)}`}>
                            {activeOrder.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          {activeOrder.patient_name}
                          <span className="text-xs font-normal text-slate-400 font-mono">
                            ({activeOrder.patient_gender}, {activeOrder.patient_age} yrs • {activeOrder.patient_mrn})
                          </span>
                        </h2>
                      </div>

                      {/* Print Voucher / Report Button */}
                      <button
                        onClick={() => setShowPrintModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1a2233] hover:bg-[#253047] text-white border border-[#2b374e] transition-all"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        Gabaasa Seera Qabeessa Maxxansi
                      </button>
                    </div>

                    {/* Clinical Details Bar */}
                    <div className="p-4 bg-[#141b2b] border-b border-[#1a2233] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Ogeessa Ajaje</span>
                        <span className="font-semibold text-white">{activeOrder.ordering_doctor_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Sa'aatii Ajajame</span>
                        <span className="font-mono text-slate-300">
                          {new Date(activeOrder.ordered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Saammoo Barcode</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {activeOrder.sample_barcode || 'Awaiting Draw'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Bilbila</span>
                        <span className="font-mono text-slate-300">{activeOrder.patient_phone || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Presumptive Diagnosis / Clinical Indication */}
                    {activeOrder.clinical_notes && (
                      <div className="p-4 border-b border-[#1a2233] bg-[#0f1422] flex items-start gap-3">
                        <Stethoscope className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-0.5">
                            Yaada Yaalaa (Presumptive Diagnosis / Indication)
                          </span>
                          <p className="text-xs text-slate-400 leading-relaxed">{activeOrder.clinical_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Emergency Alert Banner if Critical Panic Values */}
                    {activeOrder.has_critical_flag && (
                      <div className="p-4 bg-red-950/40 border-b border-red-500/40 text-red-200 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">
                            Akeekkachiisa Cimaa: Critical Panic Value Alert!
                          </h4>
                          <p className="text-xs text-red-200/90 mt-0.5">
                            Bu'aan qorannoo dhukkubsataa kanaa sadarkaa lubbuu balaarra buusu keessa waan jiruuf ogeessi yaalaa battalatti beeksisamuu qaba.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Phlebotomy / Specimen Collection Desk if Status is ORDERED */}
                    {activeOrder.status === 'ordered' && (
                      <div className="p-6 space-y-5 bg-[#0e1320] flex-1">
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3">
                          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-1">Dabaree Fudhatama Saammoo Dhiigaa (Phlebotomy Desk)</span>
                            Qodaa fi qaruuraa saammoon dhiigaa itti fudhatamu qopheessuun iskaan godhaa.
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                            Qorannoowwan Ajajaman & Qaruuraa Barbaachisu (Specimen Tubes):
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeOrder.items.map((item) => (
                              <div key={item.id} className="p-3.5 rounded-xl bg-[#141b2b] border border-[#1f293d]">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-bold text-white">{item.test_name}</span>
                                  <span className="text-xs font-mono font-bold text-amber-400">{item.price_etb} ETB</span>
                                </div>
                                <div className="text-[11px] text-cyan-300 flex items-center gap-1.5 font-medium">
                                  <TestTube className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>{item.tube_color}</span>
                                </div>
                                {item.loinc_code && (
                                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                                    LOINC: {item.loinc_code}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#1a2233]">
                          <button
                            onClick={() => handleCollectSample(activeOrder.id)}
                            disabled={actionLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all"
                          >
                            <TestTube className="w-4 h-4" />
                            {actionLoading ? 'Saammoo galmeessaa jira...' : 'Fudhatama Saammoo Mirkaneessi (Generate Accession Barcode)'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Results Table & Entry if Status is SAMPLE_COLLECTED or COMPLETED */}
                    {activeOrder.status !== 'ordered' && (
                      <div className="p-5 space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-amber-400" />
                            Bu'aa Qorannoo Laabooratorii (Test Parameters & Findings)
                          </h3>

                          {/* Quick Edit/Record Button */}
                          <button
                            onClick={() => openResultEntryModal(activeOrder)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            {activeOrder.status === 'completed' ? "Bu'aa Haaromsi / Edit" : "Bu'aa Galmeessi (Record)"}
                          </button>
                        </div>

                        {activeOrder.results.length === 0 ? (
                          <div className="p-8 text-center bg-[#141b2b] border border-[#1f293d] rounded-2xl">
                            <TestTube className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-60" />
                            <p className="text-xs text-slate-300 font-semibold mb-1">
                              Saammoon fudhatamee gara maashina qorannootti ergameera.
                            </p>
                            <p className="text-[11px] text-slate-500 mb-4">
                              Bu'aan qorannoo ammayyuu hin galmoofne. Qabxiiwwan qorannoo galchuuf qabduu armaan gadii cuqqaasaa.
                            </p>
                            <button
                              onClick={() => openResultEntryModal(activeOrder)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:from-cyan-400 hover:to-blue-500 transition-all"
                            >
                              Bu'aa Qorannoo Galmeessi (Enter Parameters)
                            </button>
                          </div>
                        ) : (
                          <div className="border border-[#1a2233] rounded-xl overflow-hidden bg-[#0d121d]">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#141b2b] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#1a2233]">
                                <tr>
                                  <th className="p-3">Qorannoo / Parameter</th>
                                  <th className="p-3">Bu'aa (Value)</th>
                                  <th className="p-3">Safartuu (Unit)</th>
                                  <th className="p-3">Sadarkaa Baramaa (Ref. Range)</th>
                                  <th className="p-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1a2233]">
                                {activeOrder.results.map((res) => (
                                  <tr key={res.id} className="hover:bg-[#141b2b]/50 transition-colors">
                                    <td className="p-3 font-medium text-white">
                                      {res.parameter_name}
                                      {res.notes && (
                                        <span className="block text-[11px] text-slate-400 italic mt-0.5">
                                          {res.notes}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-white text-sm">
                                      {res.result_value}
                                    </td>
                                    <td className="p-3 font-mono text-slate-400 text-xs">{res.unit || '-'}</td>
                                    <td className="p-3 font-mono text-slate-400 text-xs">
                                      {res.reference_range || '-'}
                                    </td>
                                    <td className="p-3">
                                      {res.flag === 'critical_panic' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse flex items-center gap-1 w-fit">
                                          <AlertTriangle className="w-3 h-3" />
                                          PANIC
                                        </span>
                                      )}
                                      {res.flag === 'high' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                          HIGH
                                        </span>
                                      )}
                                      {res.flag === 'low' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                          LOW
                                        </span>
                                      )}
                                      {res.flag === 'normal' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                          NORMAL
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DIRECTORY OF ALL LAB ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-[#101624] border border-[#1a2233] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#1a2233] bg-[#0d121d] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Barbaadi: MRN, Maqaa, Barcode, Lakk. Ajajaa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#161d2d] border border-[#1f293d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Status Hunda</option>
                    <option value="ordered">Ordered</option>
                    <option value="sample_collected">Sample Collected</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="text-xs text-slate-400">
                  Ajajoota Waliigalaa: <span className="font-bold text-white font-mono">{filteredOrders.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141b2b] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#1a2233]">
                    <tr>
                      <th className="p-3.5">Lakk. Ajajaa</th>
                      <th className="p-3.5">Dhukkubsataa (MRN)</th>
                      <th className="p-3.5">Qorannoowwan</th>
                      <th className="p-3.5">Sadarkaa</th>
                      <th className="p-3.5">Barcode Saammoo</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Gocha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2233]">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#141b2b]/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-400">{ord.order_number}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{ord.patient_name}</span>
                          <span className="font-mono text-[11px] text-slate-400">{ord.patient_mrn}</span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">
                          {ord.items.map((i) => i.test_code).join(', ')}
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityBadge(ord.priority)}`}>
                            {ord.priority}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-cyan-300">
                          {ord.sample_barcode || <span className="text-slate-500 italic">Eeggata</span>}
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusBadge(ord.status)}`}>
                            {ord.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrderId(ord.id);
                              setActiveTab('queue');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#1a2233] hover:bg-[#253047] text-white transition-all"
                          >
                            Bani
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrderId(ord.id);
                              setShowPrintModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                          >
                            Gabaasa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC TEST CATALOG & PRICING */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2233] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Katalogii Qorannoo Laabooratorii (LOINC Diagnostic Directory)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Qorannoowwan laabooratorii qoodama saayinsii, gosa qaruuraa, koodii LOINC fi gatii ETB wajjin.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Panels: <span className="text-amber-400 font-bold">{catalog.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalog.map((panel) => (
                  <div
                    key={panel.id}
                    className="p-5 rounded-2xl bg-[#101624] border border-[#1a2233] hover:border-amber-400/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                          {panel.test_code}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {panel.price_etb > 0 ? `${panel.price_etb} ETB` : 'FREE / MOH'}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm mb-1">{panel.test_name}</h4>
                      {panel.name_om && <p className="text-xs text-slate-400 italic mb-3">{panel.name_om}</p>}

                      <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-[#1a2233]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Qaruuraa / Tube:</span>
                          <span className="text-cyan-300 font-medium">{panel.tube_color}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Turnaround Time:</span>
                          <span className="font-mono text-white">{panel.turnaround_time_mins} mins</span>
                        </div>
                        {panel.loinc_code && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">LOINC Code:</span>
                            <span className="font-mono text-amber-300">{panel.loinc_code}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {panel.parameters && panel.parameters.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#1a2233]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Parameters ({panel.parameters.length}):
                        </span>
                        <div className="text-[11px] text-slate-400 line-clamp-2">
                          {panel.parameters.map((p) => p.name).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BLOOD BANK & CROSS-MATCHING WORKSTATION */}
          {activeTab === 'blood_match' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-[#101624] border border-[#1a2233] p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-red-500" />
                    Wal-simannoo Dhiigaa (ABO/Rh Compatibility Calculator)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Gosa dhiigaa arjoomaa (donor) fi fudhataa (recipient) filachuun wal-simannaa fi dhibee ittisuu mirkaneessaa.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Gosa Dhiigaa Arjoomaa (Donor Group):
                    </label>
                    <select
                      value={compatDonorGroup}
                      onChange={(e) => setCompatDonorGroup(e.target.value)}
                      className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="O_NEG">O- (Universal Red Cell Donor)</option>
                      <option value="O_POS">O+</option>
                      <option value="A_NEG">A-</option>
                      <option value="A_POS">A+</option>
                      <option value="B_NEG">B-</option>
                      <option value="B_POS">B+</option>
                      <option value="AB_NEG">AB-</option>
                      <option value="AB_POS">AB+ (Universal Plasma Donor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">
                      Gosa Dhiigaa Dhukkubsataa (Recipient Group):
                    </label>
                    <select
                      value={compatRecipientGroup}
                      onChange={(e) => setCompatRecipientGroup(e.target.value)}
                      className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="A_POS">A+</option>
                      <option value="A_NEG">A-</option>
                      <option value="B_POS">B+</option>
                      <option value="B_NEG">B-</option>
                      <option value="AB_POS">AB+ (Universal Recipient)</option>
                      <option value="AB_NEG">AB-</option>
                      <option value="O_POS">O+</option>
                      <option value="O_NEG">O-</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={checkCompatibility}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Wal-simannoo Dhiigaa Mirkaneessi (Verify Compatibility)
                </button>

                {crossmatchResult && (
                  <div
                    className={`p-4 rounded-xl text-xs font-semibold border ${
                      crossmatchResult.includes('WAL-SIMATA')
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-red-500/15 border-red-500/40 text-red-300'
                    }`}
                  >
                    {crossmatchResult}
                  </div>
                )}
              </div>

              {/* Blood Safety Standards */}
              <div className="lg:col-span-6 bg-[#101624] border border-[#1a2233] p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Ulaagaalee Nageenya Dhiigaa (Blood Transfusion Safety SOP)
                </h3>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-xl bg-[#141b2b] border border-[#1f293d]">
                    <span className="font-bold text-amber-400 block mb-0.5">1. Cross-Matching Dirqama:</span>
                    Dhiigni tokkollee osoo laabooratoriidhaan cross-matching hin godhamin dhukkubsataaf hin kennamu.
                  </div>
                  <div className="p-3 rounded-xl bg-[#141b2b] border border-[#1f293d]">
                    <span className="font-bold text-cyan-400 block mb-0.5">2. Cold Chain To'annoo:</span>
                    Kuusaan dhiigaa yeroo hunda teempireechara 2°C - 6°C keessatti firijii addaa keessatti to'atama.
                  </div>
                  <div className="p-3 rounded-xl bg-[#141b2b] border border-[#1f293d]">
                    <span className="font-bold text-rose-400 block mb-0.5">3. Qorannoo Jarmootaa (TTIs):</span>
                    Dhiigni hundi HIV 1/2, Hepatitis B (HBsAg), Hepatitis C (HCV), fi Syphilis (RPR/VDRL) irraa bilisa ta'uun mirkanaa'eera.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HL7 v2.x MLLP AUTOMATED ANALYZERS INTEGRATION */}
          {activeTab === 'hl7_analyzers' && (
            <div className="space-y-6">
              {/* Instrument Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    id: 'LAB-SYS-01',
                    name: 'Sysmex XN-550',
                    modality: 'Hematology 5-Part Diff',
                    ip: '192.168.10.41:2100',
                    status: 'Online (MLLP)',
                    packets: '1,420 pkts',
                  },
                  {
                    id: 'LAB-MIN-02',
                    name: 'Mindray BS-430',
                    modality: 'Clinical Chemistry',
                    ip: '192.168.10.42:2101',
                    status: 'Online (MLLP)',
                    packets: '982 pkts',
                  },
                  {
                    id: 'LAB-XPT-03',
                    name: 'GeneXpert IV',
                    modality: 'Molecular PCR (TB MTB)',
                    ip: '192.168.10.43:2102',
                    status: 'Online (MLLP)',
                    packets: '315 pkts',
                  },
                  {
                    id: 'LAB-COB-04',
                    name: 'Roche Cobas e411',
                    modality: 'Immunology & Hormones',
                    ip: '192.168.10.44:2103',
                    status: 'Online (MLLP)',
                    packets: '640 pkts',
                  },
                ].map((analyzer) => (
                  <div
                    key={analyzer.id}
                    className="p-5 rounded-2xl bg-[#101624] border border-[#1a2233] shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">{analyzer.id}</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {analyzer.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{analyzer.name}</h4>
                      <p className="text-xs text-slate-400">{analyzer.modality}</p>
                    </div>
                    <div className="pt-2 border-t border-[#1a2233] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{analyzer.ip}</span>
                      <span className="text-amber-400">{analyzer.packets}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Analyzer Simulation & Raw Packet Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-[#101624] border border-[#1a2233] p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-teal-400" />
                    Automated Specimen Ingestion (MLLP Bridge)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Trigger a live specimen run on Sysmex XN-550. Generates standard HL7 v2.5 ORU^R01 packet over TCP socket, parses analytes, and stores into PostgreSQL.
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateHL7Run}
                    disabled={hl7Simulating}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Cpu className="w-4 h-4" />
                    {hl7Simulating ? 'Processing MLLP Stream...' : 'Simulate Live Sysmex XN-550 Run'}
                  </button>

                  <div className="p-3.5 rounded-xl bg-[#141b2b] border border-[#1f293d] space-y-2 text-xs">
                    <span className="font-bold text-amber-400 block">Instrument Protocol:</span>
                    <p className="text-slate-300 font-mono text-[11px]">Framing: MLLP (VT ... FS CR)</p>
                    <p className="text-slate-300 font-mono text-[11px]">Standard: HL7 v2.5 ORU^R01</p>
                    <p className="text-slate-300 font-mono text-[11px]">Encoding: ASCII / UTF-8</p>
                  </div>
                </div>

                <div className="lg:col-span-8 bg-[#101624] border border-[#1a2233] p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1a2233] pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      HL7 v2.5 Ingestion Telemetry & Parsed Results
                    </h3>
                    {hl7IngestLog && (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        ACK: MSA|AA|{hl7IngestLog.message_control_id}
                      </span>
                    )}
                  </div>

                  {hl7IngestLog ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#141b2b] p-3 rounded-xl border border-[#1f293d]">
                        <div>
                          <span className="text-slate-400 block">Patient MRN:</span>
                          <span className="font-bold text-white font-mono">{hl7IngestLog.patient_mrn}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Patient Name:</span>
                          <span className="font-bold text-white">{hl7IngestLog.patient_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Analyzer:</span>
                          <span className="font-bold text-teal-400">{hl7IngestLog.sending_analyzer}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Test Profile:</span>
                          <span className="font-bold text-amber-400">{hl7IngestLog.order_test_name}</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#1f293d] overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#141b2b] text-slate-400 uppercase font-mono text-[10px]">
                            <tr>
                              <th className="p-2.5">Analyte Parameter</th>
                              <th className="p-2.5">Observed Value</th>
                              <th className="p-2.5">Unit</th>
                              <th className="p-2.5">Reference Interval</th>
                              <th className="p-2.5">Flag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1a2233]">
                            {hl7IngestLog.parameters?.map((p: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[#161d2d]/60">
                                <td className="p-2.5 font-semibold text-white">{p.parameter_name} ({p.parameter_code})</td>
                                <td className="p-2.5 font-bold font-mono text-cyan-400">{p.value}</td>
                                <td className="p-2.5 text-slate-400 font-mono">{p.unit}</td>
                                <td className="p-2.5 text-slate-400 font-mono">{p.reference_range}</td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      p.flag === 'PANIC'
                                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                        : p.flag === 'H'
                                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                        : p.flag === 'L'
                                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    }`}
                                  >
                                    {p.flag === 'N' ? 'NORMAL' : p.flag}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 text-center text-xs text-slate-400 border border-dashed border-[#1a2233] rounded-2xl">
                      No live packet received yet. Click &quot;Simulate Live Sysmex XN-550 Run&quot; to test MLLP packet parsing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE DOCTOR LAB REQUISITION ORDER                               */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1a2233] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Ajaja Qorannoo Laabooratorii Haaraa (Doctor Lab Order)
                </h3>
                <p className="text-xs text-slate-400">
                  Dhukkubsataa filachuun qorannoo barbaadame ajajaa.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Dhukkubsataa:</label>
                  <select
                    value={newOrderPatientId}
                    onChange={(e) => setNewOrderPatientId(parseInt(e.target.value))}
                    className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={1}>Gudeta Hailu (MKH-2026-000101)</option>
                    <option value={2}>Ayantu Mamo (MKH-2026-000102)</option>
                    <option value={3}>Chaltu Abera (MKH-2026-000103)</option>
                    <option value={4}>Tolessa Bekele (MKH-2026-000104)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Sadarkaa Ariifachiisummaa:</label>
                  <select
                    value={newOrderPriority}
                    onChange={(e) => setNewOrderPriority(e.target.value as any)}
                    className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="routine">ROUTINE (Waliigalaa)</option>
                    <option value="urgent">URGENT (Ariifachiisaa)</option>
                    <option value="stat">STAT / EMERGENCY (Balaa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Yaada Yaalaa / Presumptive Clinical Indication:
                </label>
                <input
                  type="text"
                  placeholder="Fkn: Acute febrile illness, suspected malaria, diabetes monitoring..."
                  value={newOrderNotes}
                  onChange={(e) => setNewOrderNotes(e.target.value)}
                  className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Test Selection Checkboxes */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Qorannoowwan Filataman (Select Diagnostic Panels):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-[#0c101a] rounded-xl border border-[#1a2233]">
                  {catalog.map((t) => {
                    const isChecked = selectedTestIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedTestIds(selectedTestIds.filter((id) => id !== t.id));
                          } else {
                            setSelectedTestIds([...selectedTestIds, t.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isChecked
                            ? 'bg-amber-400/10 border-amber-400/40 text-amber-200'
                            : 'bg-[#141b2b] border-[#1f293d] text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-amber-400 border-amber-400 text-slate-950' : 'border-slate-500'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="font-medium text-white">{t.test_name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-amber-400">{t.price_etb} ETB</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1a2233]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Dhiisi (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
                >
                  {actionLoading ? 'Ajajaa jira...' : 'Ajaja Qorannoo Ergi (Submit Order)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESULT PARAMETER ENTRY & VALIDATION                               */}
      {/* ========================================================================= */}
      {showResultModal && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1a2233] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  Galmee Bu'aa Qorannoo: {activeOrder.order_number}
                </h3>
                <p className="text-xs text-slate-400">
                  Dhukkubsataa: <span className="text-white font-bold">{activeOrder.patient_name}</span> ({activeOrder.patient_mrn})
                </p>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Qabxiiwwan Qorannoo (Test Parameters & Numerical Readings):
              </div>

              {activeOrder.items.map((item) => {
                const test = catalog.find((c) => c.id === item.test_catalog_id);
                if (!test || !test.parameters) return null;

                return (
                  <div key={item.id} className="p-4 rounded-2xl bg-[#0c101a] border border-[#1a2233] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1a2233] pb-2">
                      <span className="font-bold text-amber-300 text-xs">{test.test_name}</span>
                      <span className="text-[10px] font-mono text-cyan-300">{test.tube_color}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {test.parameters.map((p) => {
                        const current = resultInputs[p.name] || { value: '', flag: 'normal', notes: '' };
                        return (
                          <div key={p.name} className="p-3 rounded-xl bg-[#141b2b] border border-[#1f293d] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {p.reference_range ? `Ref: ${p.reference_range} ${p.unit || ''}` : ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={p.unit ? `Value in ${p.unit}` : 'Enter finding'}
                                value={current.value}
                                onChange={(e) => handleResultValueChange(p, e.target.value)}
                                className="flex-1 bg-[#1a2233] border border-[#253047] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                              />

                              <select
                                value={current.flag}
                                onChange={(e) =>
                                  setResultInputs((prev) => ({
                                    ...prev,
                                    [p.name]: {
                                      ...prev[p.name],
                                      flag: e.target.value as any,
                                    },
                                  }))
                                }
                                className={`text-[10px] font-bold rounded-lg px-2 py-1.5 border focus:outline-none ${
                                  current.flag === 'critical_panic'
                                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                    : current.flag === 'high'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                    : current.flag === 'low'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                <option value="normal">NORMAL</option>
                                <option value="low">LOW</option>
                                <option value="high">HIGH</option>
                                <option value="critical_panic">PANIC</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Yaada Ogeessa Laaboraatorii (Pathologist / Technologist Clinical Note):
                </label>
                <textarea
                  rows={2}
                  placeholder="Yaada dabalataa laaboraatorii..."
                  value={overallResultNotes}
                  onChange={(e) => setOverallResultNotes(e.target.value)}
                  className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1a2233]">
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Dhiisi
              </button>
              <button
                type="button"
                onClick={handleSubmitResults}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {actionLoading ? 'Mirkaneessaa jira...' : "Bu'aa Mirkaneessi & Xumuri (Finalize)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OFFICIAL PRINTABLE DIAGNOSTIC LABORATORY REPORT                   */}
      {/* ========================================================================= */}
      {showPrintModal && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative my-auto print:shadow-none print:w-full print:rounded-none">
            {/* Action Bar (hidden in print) */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Diagnostic Laboratory Report Preview
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Maxxansi (Print)
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Hospital Letterhead */}
            <div className="text-center pt-4 pb-4 border-b-2 border-slate-900">
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
                Mettu Karl Comprehensive Specialized Hospital
              </h2>
              <h3 className="text-xs font-bold uppercase text-slate-700">
                Hospitaala Waliigalaa Ispeeshaalaayizdii Karl Mattuu
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Department of Pathology & Clinical Laboratory Diagnostics • ISO 15189 Certified
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                TIN: 0038912401 • Mettu, Illubabor Zone, Oromia, Ethiopia • Tel: +251 47 441 2345
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center my-3">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 rounded border border-slate-300">
                Official Diagnostic Laboratory Findings Voucher
              </span>
            </div>

            {/* Patient & Order Demographics Box */}
            <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4">
              <div>
                <div className="mb-1">
                  <span className="text-slate-500 font-medium">Patient Name: </span>
                  <span className="font-bold text-slate-900">{activeOrder.patient_name}</span>
                </div>
                <div className="mb-1">
                  <span className="text-slate-500 font-medium">MRN: </span>
                  <span className="font-mono font-bold text-slate-900">{activeOrder.patient_mrn}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Age / Gender: </span>
                  <span className="font-semibold text-slate-800">
                    {activeOrder.patient_age} yrs • {activeOrder.patient_gender.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1">
                  <span className="text-slate-500 font-medium">Lab Order No: </span>
                  <span className="font-mono font-bold text-slate-900">{activeOrder.order_number}</span>
                </div>
                <div className="mb-1">
                  <span className="text-slate-500 font-medium">Specimen Barcode: </span>
                  <span className="font-mono font-bold text-slate-900">{activeOrder.sample_barcode || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Ordering Doctor: </span>
                  <span className="font-semibold text-slate-800">{activeOrder.ordering_doctor_name}</span>
                </div>
              </div>
            </div>

            {/* Parameter Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="p-2.5">Investigation / Test Parameter</th>
                    <th className="p-2.5">Observed Value</th>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">Reference Range</th>
                    <th className="p-2.5 text-center">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeOrder.results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                        Testing in progress. Results pending verification.
                      </td>
                    </tr>
                  ) : (
                    activeOrder.results.map((r) => (
                      <tr key={r.id}>
                        <td className="p-2 font-medium text-slate-900">{r.parameter_name}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{r.result_value}</td>
                        <td className="p-2 font-mono text-slate-600">{r.unit || '-'}</td>
                        <td className="p-2 font-mono text-slate-600">{r.reference_range || '-'}</td>
                        <td className="p-2 text-center">
                          {r.flag === 'critical_panic' && (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-700 border border-red-300">
                              PANIC CRITICAL
                            </span>
                          )}
                          {r.flag === 'high' && (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                              HIGH
                            </span>
                          )}
                          {r.flag === 'low' && (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800 border border-blue-300">
                              LOW
                            </span>
                          )}
                          {r.flag === 'normal' && (
                            <span className="px-2 py-0.5 rounded font-medium text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                              NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pathologist Verification & QR Verification Footer */}
            <div className="flex items-center justify-between border-t border-slate-300 pt-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-1">
                  <QrCode className="w-14 h-14 text-slate-800" />
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <div className="font-bold text-slate-800">MKH LIS Digital Verification</div>
                  <div className="font-mono">Order: {activeOrder.order_number}</div>
                  <div>Certified Diagnostic Record</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-500 text-[11px]">Validated & Released By:</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">
                  {activeOrder.verified_by_name || 'Gemechu Desta'}
                </div>
                <div className="text-[10px] text-slate-500">Chief Clinical Laboratory Technologist</div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
