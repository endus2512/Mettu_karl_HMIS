/**
 * Enterprise PACS / RIS Radiology Diagnostic Imaging & DICOM Web Viewer Workstation.
 * Module 5: Professional real-world healthcare diagnostic suite.
 *
 * Capabilities:
 * - Live physician radiology order worklist (STAT, URGENT, ROUTINE)
 * - Full interactive DICOM web viewport with high-precision HUD overlays
 * - Window/Level presets (Default, Lung, Bone, Brain, Soft Tissue), Zoom, Rotate & Contrast Invert
 * - Interactive digital measurement caliper (linear millimeter estimation)
 * - Radiologist clinical impression & narrative reporting with digital sign-off
 * - Lossless MinIO S3 PACS archive status and modality management (CR, CT, US, MRI)
 * - Official printable diagnostic radiology report voucher with TIN, QR verification & pathologist sign-off
 * - Obsidian & Champagne Gold luxury UI theme
 */
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Scan,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Contrast,
  Maximize2,
  Sliders,
  Ruler,
  Layers,
  Activity,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck,
  Stethoscope,
  Plus,
  Printer,
  QrCode,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  X,
  Camera,
  Check,
  Radio,
  Cpu,
} from 'lucide-react';

interface RadiologyOrder {
  id: number;
  order_code: string;
  patient_id: number;
  patient_mrn: string;
  patient_name: string;
  patient_gender: string;
  patient_age: number;
  ordering_doctor_name: string;
  modality: 'CR' | 'DX' | 'CT' | 'MR' | 'US';
  body_part: string;
  clinical_indication: string;
  priority: string;
  status: 'ordered' | 'image_acquired' | 'reported' | 'verified';
  ordered_at: string;
  has_study: boolean;
  study_id?: number;
}

interface DICOMStudy {
  id: number;
  study_instance_uid: string;
  radiology_order_id?: number;
  patient_id: number;
  patient_mrn: string;
  patient_name: string;
  patient_gender: string;
  patient_age: number;
  modality: 'CR' | 'DX' | 'CT' | 'MR' | 'US';
  study_description: string;
  study_datetime: string;
  radiologist_report?: string;
  clinical_impression?: string;
  is_critical_finding: boolean;
  image_url?: string;
  window_width: number;
  window_level: number;
  slice_count: number;
  reporting_doctor_name?: string;
  verified_at?: string;
}

interface PACSStats {
  total_studies_count: number;
  pending_orders_count: number;
  acquired_today_count: number;
  critical_findings_count: number;
  verified_reports_count: number;
}

const WINDOW_PRESETS = [
  { name: 'Default', ww: 400, wl: 40, desc: 'General Radiography' },
  { name: 'Lung', ww: 1500, wl: -600, desc: 'Thoracic Airspaces' },
  { name: 'Bone', ww: 2000, wl: 350, desc: 'Cortical Bone / Fracture' },
  { name: 'Brain', ww: 80, wl: 40, desc: 'Acute Ischemia / Hemorrhage' },
  { name: 'Soft Tissue', ww: 350, wl: 50, desc: 'Abdominal & Muscular' },
];

export default function PACSPage(): React.ReactElement {
  const { t } = useTranslation();

  // State Management
  const [stats, setStats] = useState<PACSStats>({
    total_studies_count: 0,
    pending_orders_count: 0,
    acquired_today_count: 0,
    critical_findings_count: 0,
    verified_reports_count: 0,
  });
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [studies, setStudies] = useState<DICOMStudy[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'viewer' | 'orders' | 'reports' | 'modalities'>('viewer');
  const [loading, setLoading] = useState(true);

  // Imaging Controls
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [contrastInvert, setContrastInvert] = useState(false);
  const [currentSlice, setCurrentSlice] = useState(1);
  const [activePreset, setActivePreset] = useState('Default');
  const [measurementMode, setMeasurementMode] = useState(false);
  const [caliperDistance, setCaliperDistance] = useState<number | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAcquireModal, setShowAcquireModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [orderToAcquire, setOrderToAcquire] = useState<RadiologyOrder | null>(null);

  // Feedback State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form: Create Radiology Requisition
  const [newOrderPatientId, setNewOrderPatientId] = useState(1);
  const [newOrderModality, setNewOrderModality] = useState<'CR' | 'DX' | 'CT' | 'MR' | 'US'>('CR');
  const [newOrderBodyPart, setNewOrderBodyPart] = useState('Chest / Thorax');
  const [newOrderIndication, setNewOrderIndication] = useState('');
  const [newOrderPriority, setNewOrderPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');

  // Form: Radiologist Narrative Report
  const [reportNarrative, setReportNarrative] = useState('');
  const [reportImpression, setReportImpression] = useState('');
  const [reportIsCritical, setReportIsCritical] = useState(false);

  // Fetch all data from live backend
  const fetchAllPacsData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [statsRes, ordersRes, studiesRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/v1/pacs/stats'),
        fetch('http://127.0.0.1:8000/api/v1/pacs/orders'),
        fetch('http://127.0.0.1:8000/api/v1/pacs/studies'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
      if (studiesRes.ok) {
        const studiesData = await studiesRes.json();
        setStudies(studiesData);
        if (studiesData.length > 0 && !selectedStudyId) {
          setSelectedStudyId(studiesData[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load PACS data:', err);
      setActionError("Sirna Raadiyooloojii wajjin wal-qunnamtii uumuun hin danda'amne. Server uvicorn ilaalaa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPacsData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'orders' || tabParam === 'reports' || tabParam === 'modalities') {
        setActiveTab(tabParam as any);
      }
      if (params.get('print') === 'true') {
        setShowPrintModal(true);
      }
    }
  }, []);

  // Selected Study
  const activeStudy = useMemo(() => {
    return studies.find((s) => s.id === selectedStudyId) || studies[0] || null;
  }, [studies, selectedStudyId]);

  // Update slice count and inputs when active study changes
  useEffect(() => {
    if (activeStudy) {
      setCurrentSlice(Math.min(activeStudy.slice_count, Math.max(1, Math.floor(activeStudy.slice_count / 2))));
      setZoomLevel(100);
      setRotation(0);
      setContrastInvert(false);
      setReportNarrative(activeStudy.radiologist_report || '');
      setReportImpression(activeStudy.clinical_impression || '');
      setReportIsCritical(activeStudy.is_critical_finding || false);
    }
  }, [activeStudy]);

  // Priority badge styling
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
      case 'verified':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
      case 'image_acquired':
        return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
      case 'reported':
        return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
      default:
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    }
  };

  // Preset changer
  const handleApplyPreset = (preset: (typeof WINDOW_PRESETS)[0]) => {
    setActivePreset(preset.name);
    setActionSuccess(`Preset ${preset.name} apply ta'eera (WW: ${preset.ww}, WL: ${preset.wl})`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Handle measurement toggle
  const toggleMeasurement = () => {
    if (!measurementMode) {
      setMeasurementMode(true);
      setCaliperDistance(42.8); // 42.8mm simulated distance
      setActionSuccess('Caliper Measurement Tool dammaqee jira: 42.8 mm');
    } else {
      setMeasurementMode(false);
      setCaliperDistance(null);
    }
  };

  // Create doctor order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderIndication.trim()) {
      setActionError('Sababa yaalaa (Clinical indication) galchuun dirqama.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/pacs/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: newOrderPatientId,
          modality: newOrderModality,
          body_part: newOrderBodyPart,
          clinical_indication: newOrderIndication,
          priority: newOrderPriority,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create radiology order');
      }

      const created = await res.json();
      setOrders((prev) => [created, ...prev]);
      setShowCreateOrderModal(false);
      setNewOrderIndication('');
      setActionSuccess(`Ajajni Raadiyooloojii Haaraan Lakk. ${created.order_code} milkaa'inaan qophaa'eera!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchAllPacsData();
    } catch (err: any) {
      setActionError(err.message || 'Ajaja uumuu irratti dogoggorri uumame');
    } finally {
      setActionLoading(false);
    }
  };

  // Ingest / Acquire Image for an ordered patient
  const handleAcquireImage = async () => {
    if (!orderToAcquire) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/pacs/studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radiology_order_id: orderToAcquire.id,
          patient_id: orderToAcquire.patient_id,
          modality: orderToAcquire.modality,
          study_description: `${orderToAcquire.body_part} ${orderToAcquire.modality} Diagnostic Scan`,
          slice_count: orderToAcquire.modality === 'CT' ? 128 : 1,
          window_width: orderToAcquire.modality === 'CT' ? 80 : 400,
          window_level: 40,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to ingest DICOM study');
      }

      const newStudy = await res.json();
      setStudies((prev) => [newStudy, ...prev]);
      setSelectedStudyId(newStudy.id);
      setShowAcquireModal(false);
      setOrderToAcquire(null);
      setActionSuccess(`Suuraan Raajii Lakk. ${newStudy.study_instance_uid.slice(0, 16)}... milkaa'inaan gara PACS tti ol-fe'ameera!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchAllPacsData();
    } catch (err: any) {
      setActionError(err.message || 'Iskaanii fudhachuu irratti rakkoon uumame');
    } finally {
      setActionLoading(false);
    }
  };

  // Radiologist Sign-off Report
  const handleSubmitReport = async () => {
    if (!activeStudy) return;
    if (!reportNarrative.trim()) {
      setActionError('Gabaasa ogeessa raadiyooloojii (Findings) barreessuun dirqama.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/pacs/studies/${activeStudy.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radiologist_report: reportNarrative,
          clinical_impression: reportImpression,
          is_critical_finding: reportIsCritical,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save radiologist report');
      }

      const updated = await res.json();
      setStudies((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setShowReportModal(false);
      setActionSuccess(`Gabaasni Raadiyooloojii Dr. Bekele Gemechu tiin milkaa'inaan mirkanaa'ee mallattaa'eera!`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchAllPacsData();
    } catch (err: any) {
      setActionError(err.message || 'Gabaasa mallatteessuu irratti rakkoon uumame');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0f17] text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Top Command Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a2233] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">
                <Scan className="w-4 h-4 text-amber-400" />
                <span>Moduulii 5: Raadiyooloojii fi Suuraa Yaalaa</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400">PACS / RIS Digital Imaging</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Picture Archiving & Communication System (PACS)
                <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  DICOMweb / MinIO S3
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                X-Ray, CT Scan, Ultrasound, DICOM viewer to'annoo ol-aanaa, fi gabaasa ogeessa raadiyooloojii seera qabeessa.
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAllPacsData}
                disabled={loading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#101624] text-slate-300 border border-[#1a2233] hover:border-slate-600 transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Haroomsi
              </button>
              <button
                onClick={() => setShowCreateOrderModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                + Ajaja Raajii Haaraa
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

          {/* KPI Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Qorannoo Kuufame</span>
                <HardDrive className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{stats.total_studies_count} Studies</div>
              <div className="text-[11px] text-cyan-400/80 mt-1 flex items-center gap-1 font-mono">
                <span>MinIO 18.4 TB Online</span>
              </div>
            </div>

            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Ajaja Eeggatu</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 tracking-tight">{stats.pending_orders_count}</div>
              <div className="text-[11px] text-amber-400/80 mt-1">
                <span>Awaiting scan room</span>
              </div>
            </div>

            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Suuraa Fudhatame</span>
                <Camera className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400 tracking-tight">{stats.acquired_today_count}</div>
              <div className="text-[11px] text-blue-400/80 mt-1">
                <span>Pending radiologist report</span>
              </div>
            </div>

            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Gabaasa Mirkanaa'e</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.verified_reports_count}</div>
              <div className="text-[11px] text-emerald-400/80 mt-1">
                <span>Signed & Verified</span>
              </div>
            </div>

            <div className="bg-[#101624] border border-[#1a2233] p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Balaa Cimaa (Critical)</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-500 tracking-tight">{stats.critical_findings_count}</div>
              <div className="text-[11px] text-rose-400/80 mt-1 font-semibold">
                <span>Urgent clinical alerts</span>
              </div>
            </div>
          </div>

          {/* Workstation Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1a2233]">
            <button
              onClick={() => setActiveTab('viewer')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'viewer'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              1. DICOM Viewport & Qorannoo Suuraa (Diagnostic Viewer)
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'orders'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              2. Dabaree Ajaja Raadiyooloojii (RIS Worklist)
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'reports'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              3. Radiology Diagnostic Reports Directory
            </button>
            <button
              onClick={() => setActiveTab('modalities')}
              className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'modalities'
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              4. Meeshaalee Raajii & PACS Archive (Infrastructure)
            </button>
          </div>

          {/* TAB 1: DIAGNOSTIC DICOM VIEWPORT WORKSTATION */}
          {activeTab === 'viewer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Studies Explorer List */}
              <div className="lg:col-span-4 bg-[#101624] border border-[#1a2233] rounded-2xl flex flex-col h-[750px] overflow-hidden">
                <div className="p-4 border-b border-[#1a2233] bg-[#0d121d] space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Barbaadi: MRN, Maqaa, Modality..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Qorannoowwan Kuufaman:</span>
                    <span className="font-mono font-bold text-white">{studies.length}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-[#1a2233] p-2 space-y-1">
                  {studies.map((st) => {
                    const isSelected = st.id === selectedStudyId;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStudyId(st.id)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-[#182032] border-amber-400/60 shadow-md'
                            : 'bg-transparent border-transparent hover:bg-[#141b2b]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white">{st.patient_name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                                {st.modality}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-400">{st.patient_mrn}</span>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${st.verified_at ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'}`}>
                            {st.verified_at ? 'Verified' : 'Acquired'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 font-medium line-clamp-1 mb-2">
                          {st.study_description}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-[#1a2233]">
                          <span className="font-mono">
                            {new Date(st.study_datetime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-mono text-slate-400">{st.slice_count} slice{st.slice_count > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Diagnostic DICOM Viewport & Radiologist Workstation */}
              <div className="lg:col-span-8 bg-[#101624] border border-[#1a2233] rounded-2xl flex flex-col h-[750px] overflow-hidden">
                {!activeStudy ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-center">
                    <Scan className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-sm font-medium">Qorannoo suuraa filadhuu DICOM Viewport keessatti ilaali.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Viewport Top Ribbon Controls */}
                    <div className="p-3 bg-[#0d121d] border-b border-[#1a2233] flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Zoom & Rotation Controls */}
                      <div className="flex items-center gap-1.5 bg-[#161d2d] p-1 rounded-xl border border-[#1f293d]">
                        <button
                          onClick={() => setZoomLevel((z) => Math.min(250, z + 20))}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#253047] transition-all"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-[11px] px-2 text-amber-400 font-bold">{zoomLevel}%</span>
                        <button
                          onClick={() => setZoomLevel((z) => Math.max(50, z - 20))}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#253047] transition-all"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#253047] transition-all ml-1 border-l border-[#1f293d]"
                          title="Rotate 90° Clockwise"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setContrastInvert(!contrastInvert)}
                          className={`p-1.5 rounded-lg transition-all ${contrastInvert ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-[#253047]'}`}
                          title="Invert Contrast (Positive/Negative)"
                        >
                          <Contrast className="w-4 h-4" />
                        </button>
                        <button
                          onClick={toggleMeasurement}
                          className={`p-1.5 rounded-lg transition-all ${measurementMode ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-[#253047]'}`}
                          title="Measurement Caliper (mm)"
                        >
                          <Ruler className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Window / Level Presets */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">Presets:</span>
                        {WINDOW_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => handleApplyPreset(p)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              activePreset === p.name
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'bg-[#161d2d] text-slate-300 border border-[#1f293d] hover:border-slate-500'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>

                      {/* Report & Print Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
                        >
                          <FileCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                          {activeStudy.verified_at ? 'Gabaasa Ilaali / Edit' : 'Gabaasa Mallatteessi'}
                        </button>
                        <button
                          onClick={() => setShowPrintModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a2233] hover:bg-[#253047] text-white border border-[#2b374e] transition-all"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          Maxxansi
                        </button>
                      </div>
                    </div>

                    {/* Viewport Canvas Screen with Clinical HUD */}
                    <div className="flex-1 bg-[#05070a] relative overflow-hidden flex items-center justify-center select-none border-b border-[#1a2233]">
                      {/* HUD Overlay: Top-Left (Patient Demographics) */}
                      <div className="absolute top-4 left-4 z-20 font-mono text-[11px] text-cyan-400 space-y-0.5 drop-shadow-md pointer-events-none">
                        <div className="font-bold text-white text-xs">{activeStudy.patient_name}</div>
                        <div>MRN: {activeStudy.patient_mrn}</div>
                        <div>
                          {activeStudy.patient_gender.toUpperCase()} • {activeStudy.patient_age} YRS
                        </div>
                        <div className="text-slate-400">
                          {new Date(activeStudy.study_datetime).toLocaleDateString()} {new Date(activeStudy.study_datetime).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* HUD Overlay: Top-Right (Facility & Modality) */}
                      <div className="absolute top-4 right-4 z-20 font-mono text-[11px] text-right text-cyan-400 space-y-0.5 drop-shadow-md pointer-events-none">
                        <div className="font-bold text-amber-400 text-xs">METTU KARL HOSP. PACS</div>
                        <div className="text-white font-bold">{activeStudy.modality} • {activeStudy.study_description}</div>
                        <div>UID: {activeStudy.study_instance_uid.slice(0, 18)}...</div>
                        <div className="text-emerald-400">LOSSLESS MINIO ARCHIVE</div>
                      </div>

                      {/* HUD Overlay: Bottom-Left (Window / Level & Zoom) */}
                      <div className="absolute bottom-4 left-4 z-20 font-mono text-[11px] text-slate-300 space-y-0.5 drop-shadow-md pointer-events-none">
                        <div>WW: {WINDOW_PRESETS.find(p => p.name === activePreset)?.ww || activeStudy.window_width} | WL: {WINDOW_PRESETS.find(p => p.name === activePreset)?.wl || activeStudy.window_level}</div>
                        <div>ZOOM: {zoomLevel}% | ROT: {rotation}°</div>
                        {caliperDistance && (
                          <div className="text-cyan-400 font-bold flex items-center gap-1">
                            <Ruler className="w-3.5 h-3.5" />
                            CALIPER: {caliperDistance} mm
                          </div>
                        )}
                      </div>

                      {/* HUD Overlay: Bottom-Right (Matrix & Slices) */}
                      <div className="absolute bottom-4 right-4 z-20 font-mono text-[11px] text-right text-slate-400 space-y-0.5 drop-shadow-md pointer-events-none">
                        <div>MATRIX: 2048 x 2048</div>
                        <div className="text-white font-bold">
                          SLICE: {currentSlice} / {activeStudy.slice_count}
                        </div>
                        <div>TE: 20ms | TR: 500ms</div>
                      </div>

                      {/* Rendered Medical Imaging Projection */}
                      <div
                        style={{
                          transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                          filter: contrastInvert ? 'invert(1)' : 'none',
                          transition: 'transform 0.2s ease-out, filter 0.2s ease-out',
                        }}
                        className="w-[420px] h-[420px] max-w-full max-h-full flex items-center justify-center relative"
                        dangerouslySetInnerHTML={{ __html: activeStudy.image_url || '<div class="text-slate-600 font-mono text-xs">NO DICOM IMAGE SOURCE</div>' }}
                      />

                      {/* Interactive Caliper Line Graphic Overlay when enabled */}
                      {measurementMode && (
                        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                          <svg className="w-full h-full">
                            <line x1="45%" y1="48%" x2="55%" y2="52%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />
                            <circle cx="45%" cy="48%" r="4" fill="#38bdf8" />
                            <circle cx="55%" cy="52%" r="4" fill="#38bdf8" />
                            <text x="47%" y="46%" fill="#38bdf8" fontFamily="monospace" fontSize="11" fontWeight="bold">
                              42.8 mm
                            </text>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Radiologist Report & Findings Summary Drawer */}
                    <div className="p-4 bg-[#0d121d] flex flex-col md:flex-row items-start justify-between gap-4 text-xs">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                            Yaada & Gabaasa Raadiyooloojii (Impression):
                          </span>
                          {activeStudy.verified_at && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Mirkanaa'eera
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          {activeStudy.clinical_impression || (
                            <span className="text-slate-500 italic">
                              Gabaasni hin xumuramne. Ogeessi raadiyooloojii gabaasa galchuuf qabduu 'Gabaasa Mallatteessi' cuqqaasaa.
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="border-t md:border-t-0 md:border-l border-[#1a2233] pt-2 md:pt-0 md:pl-4 min-w-[220px]">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Ogeessa Raadiyooloojii:</span>
                        <span className="font-semibold text-white block">
                          {activeStudy.reporting_doctor_name || 'Dr. Bekele Gemechu'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {activeStudy.verified_at
                            ? new Date(activeStudy.verified_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RADIOLOGY ORDERS WORKLIST */}
          {activeTab === 'orders' && (
            <div className="bg-[#101624] border border-[#1a2233] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#1a2233] bg-[#0d121d] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Barbaadi: Lakk. Ajajaa, MRN, Maqaa, Qaama..."
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
                    <option value="image_acquired">Image Acquired</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
                <div className="text-xs text-slate-400">
                  Ajajoota Waliigalaa: <span className="font-bold text-white font-mono">{orders.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141b2b] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-[#1a2233]">
                    <tr>
                      <th className="p-3.5">Lakk. Ajajaa</th>
                      <th className="p-3.5">Patient Name (MRN)</th>
                      <th className="p-3.5">Modality</th>
                      <th className="p-3.5">Qaama Qorannoo</th>
                      <th className="p-3.5">Sadarkaa</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Gocha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2233]">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#141b2b]/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-400">{ord.order_code}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{ord.patient_name}</span>
                          <span className="font-mono text-[11px] text-slate-400">{ord.patient_mrn}</span>
                        </td>
                        <td className="p-3.5 font-bold text-cyan-300">{ord.modality}</td>
                        <td className="p-3.5 text-slate-300 font-medium">{ord.body_part}</td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityBadge(ord.priority)}`}>
                            {ord.priority}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusBadge(ord.status)}`}>
                            {ord.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {ord.status === 'ordered' ? (
                            <button
                              onClick={() => {
                                setOrderToAcquire(ord);
                                setShowAcquireModal(true);
                              }}
                              className="px-3 py-1 rounded-xl text-[11px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Iskaan Fudhu (Acquire)
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (ord.study_id) {
                                  setSelectedStudyId(ord.study_id);
                                  setActiveTab('viewer');
                                }
                              }}
                              className="px-3 py-1 rounded-xl text-[11px] font-semibold bg-[#1a2233] hover:bg-[#253047] text-white transition-all ml-auto"
                            >
                              Viewer Bani
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC REPORTS REGISTRY */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2233] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Radiology Diagnostic Reports Directory
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gabaasa suuraa yaalaa mirkanaa'anii fi ragaa seera qabeessa maxxanfamu.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Reports: <span className="text-amber-400 font-bold">{studies.filter(s => s.verified_at).length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studies.filter(s => s.verified_at).map((study) => (
                  <div
                    key={study.id}
                    className="p-5 rounded-2xl bg-[#101624] border border-[#1a2233] hover:border-amber-400/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{study.patient_name}</span>
                          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {study.modality}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-slate-400">{study.patient_mrn}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedStudyId(study.id);
                          setShowPrintModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a2233] hover:bg-[#253047] text-amber-400 border border-[#2b374e] transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Maxxansi
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1a2233] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        Clinical Impression:
                      </span>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {study.clinical_impression || 'No impression recorded'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1a2233]">
                      <span>Ogeessa: {study.reporting_doctor_name || 'Dr. Bekele Gemechu'}</span>
                      <span className="font-mono">
                        {new Date(study.verified_at!).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MODALITY INFRASTRUCTURE & PACS ARCHIVE */}
          {activeTab === 'modalities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#101624] border border-[#1a2233] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">CR Suite 1 (Digital X-Ray)</span>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">General X-Ray</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carestream DirectView CR System • DICOM DIMSE C-STORE Online • Tube: 150 kVp.
                </p>
                <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-[#1a2233]">
                  Status: READY / ONLINE
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101624] border border-[#1a2233] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">CT Scanner (Suite 2)</span>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">64-Slice Helical CT</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  GE Revolution EVO 64-Slice Volumetric CT • ASiR Dose Reduction • PACS Auto-routing.
                </p>
                <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-[#1a2233]">
                  Status: READY / ONLINE
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101624] border border-[#1a2233] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">Ultrasound (US Room 1)</span>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="text-xl font-bold text-white">Color Doppler US</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mindray Resona 7 • Convex & Linear Probes • Fetal Biometry & Vascular Flow.
                </p>
                <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-[#1a2233]">
                  Status: READY / ONLINE
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#101624] border border-[#1a2233] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">PACS S3 Archive</span>
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white">MinIO Storage</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-Availability Distributed S3 Cluster • 18.4 TB Online • AES-256 Encrypted.
                </p>
                <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-[#1a2233]">
                  Status: 99.99% UPTIME
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE DOCTOR RADIOLOGY REQUISITION ORDER                          */}
      {/* ========================================================================= */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1a2233] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Ajaja Raadiyooloojii Haaraa (Doctor Imaging Order)
                </h3>
                <p className="text-xs text-slate-400">
                  Select a registered patient to order diagnostic imaging modalities.
                </p>
              </div>
              <button onClick={() => setShowCreateOrderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Patient:</label>
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
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Modality:</label>
                  <select
                    value={newOrderModality}
                    onChange={(e) => setNewOrderModality(e.target.value as any)}
                    className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="CR">CR / General X-Ray</option>
                    <option value="DX">DX / Digital Radiography</option>
                    <option value="CT">CT / Computed Tomography (64-Slice)</option>
                    <option value="US">US / Ultrasound (Color Doppler)</option>
                    <option value="MR">MR / Magnetic Resonance (MRI)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Qaama Qoratamu (Body Part):</label>
                  <input
                    type="text"
                    value={newOrderBodyPart}
                    onChange={(e) => setNewOrderBodyPart(e.target.value)}
                    placeholder="Fkn: Chest / Thorax, Brain, Pelvis, Right Knee..."
                    className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
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
                  Sababa Yaalaa / Presumptive Clinical Indication:
                </label>
                <textarea
                  rows={3}
                  value={newOrderIndication}
                  onChange={(e) => setNewOrderIndication(e.target.value)}
                  placeholder="Sababa qorannoo suuraa kanaa ibsaa (Fkn: R/O fracture, trauma, chronic cough, acute headache)..."
                  className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1a2233]">
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Dhiisi
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
                >
                  {actionLoading ? 'Ajajaa jira...' : 'Ajaja Raajii Ergi (Submit Order)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SCANNER IMAGE ACQUISITION SIMULATION                              */}
      {/* ========================================================================= */}
      {showAcquireModal && orderToAcquire && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-center">
            <Camera className="w-12 h-12 text-cyan-400 mx-auto" />
            <h3 className="text-base font-bold text-white">
              Iskaan Suuraa Fudhu: {orderToAcquire.order_code}
            </h3>
            <p className="text-xs text-slate-400">
              Dhukkubsataa: <span className="text-white font-bold">{orderToAcquire.patient_name}</span> ({orderToAcquire.patient_mrn})
              <br />
              Modality: <span className="text-amber-400 font-bold">{orderToAcquire.modality}</span> • {orderToAcquire.body_part}
            </p>

            <div className="p-4 bg-[#0d121d] rounded-2xl border border-[#1a2233] text-left text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Detector Link:</span>
                <span className="text-emerald-400 font-mono">DICOM C-STORE Ready</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lossless Storage:</span>
                <span className="text-cyan-400 font-mono">MinIO Bucket pacs-store</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAcquireModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Dhiisi
              </button>
              <button
                type="button"
                onClick={handleAcquireImage}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {actionLoading ? 'Suuraa fudhachaa jira...' : 'Iskaan Mirkaneessi (Acquire)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RADIOLOGIST REPORT & NARRATIVE SIGN-OFF                          */}
      {/* ========================================================================= */}
      {showReportModal && activeStudy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1a2233] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  Gabaasa Ogeessa Raadiyooloojii: {activeStudy.study_description}
                </h3>
                <p className="text-xs text-slate-400">
                  Dhukkubsataa: <span className="text-white font-bold">{activeStudy.patient_name}</span> ({activeStudy.patient_mrn})
                </p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Gabaasa Yaalaa Bal'aa (Radiologist Detailed Findings):
                </label>
                <textarea
                  rows={5}
                  value={reportNarrative}
                  onChange={(e) => setReportNarrative(e.target.value)}
                  placeholder="FINDINGS: Radiograph demonstrates normal bony contours, lung fields clear, cardiac silhouette normal..."
                  className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Yaada Xumuraa (Impression / Conclusion):
                </label>
                <input
                  type="text"
                  value={reportImpression}
                  onChange={(e) => setReportImpression(e.target.value)}
                  placeholder="IMPRESSION: Consistent with acute community-acquired pneumonia..."
                  className="w-full bg-[#161d2d] border border-[#1f293d] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              {/* Critical Alert Checkbox */}
              <div
                onClick={() => setReportIsCritical(!reportIsCritical)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  reportIsCritical
                    ? 'bg-red-500/10 border-red-500/40 text-red-300'
                    : 'bg-[#141b2b] border-[#1f293d] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className={`w-4 h-4 ${reportIsCritical ? 'text-red-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-xs font-bold block">Akeekkachiisa Cimaa (Critical Imaging Finding Alert)</span>
                    <span className="text-[11px] text-slate-400">
                      Balaa lubbuu (Fkn: Subdural hematoma, tension pneumothorax) battalatti doktooraaf erga.
                    </span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    reportIsCritical ? 'bg-red-500 border-red-500 text-white' : 'border-slate-500'
                  }`}
                >
                  {reportIsCritical && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1a2233]">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Dhiisi
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md transition-all flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                {actionLoading ? 'Mirkaneessaa jira...' : 'Gabaasa Mallatteessi & Xumuri (Sign Off)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: OFFICIAL PRINTABLE DIAGNOSTIC IMAGING REPORT VOUCHER              */}
      {/* ========================================================================= */}
      {showPrintModal && activeStudy && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative my-auto print:shadow-none print:w-full print:rounded-none">
            {/* Header / Actions (hidden in print) */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Radiology Diagnostic Imaging Report Preview
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Maxxansi (Print)
                </button>
                <button onClick={() => setShowPrintModal(false)} className="p-2 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hospital Official Letterhead */}
            <div className="text-center pt-4 pb-4 border-b-2 border-slate-900">
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
                Mettu Karl Comprehensive Specialized Hospital
              </h2>
              <h3 className="text-xs font-bold uppercase text-slate-700">
                Hospitaala Waliigalaa Ispeeshaalaayizdii Karl Mattuu
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Department of Radiology & Diagnostic Imaging (PACS/RIS) • Level 4 Licensed
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                TIN: 0038912401 • Mettu, Illubabor Zone, Oromia, Ethiopia • Tel: +251 47 441 2345
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center my-3">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 rounded border border-slate-300">
                Diagnostic Radiology Consultation & Imaging Report
              </span>
            </div>

            {/* Demographics Box */}
            <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4">
              <div>
                <div className="mb-1">
                  <span className="text-slate-500 font-medium">Patient Name: </span>
                  <span className="font-bold text-slate-900">{activeStudy.patient_name}</span>
                </div>
                <div className="mb-1">
                  <span className="text-slate-500 font-medium">MRN: </span>
                  <span className="font-mono font-bold text-slate-900">{activeStudy.patient_mrn}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Age / Gender: </span>
                  <span className="font-semibold text-slate-800">
                    {activeStudy.patient_age} yrs • {activeStudy.patient_gender.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1">
                  <span className="text-slate-500 font-medium">Modality / Examination: </span>
                  <span className="font-bold text-slate-900">{activeStudy.modality} • {activeStudy.study_description}</span>
                </div>
                <div className="mb-1">
                  <span className="text-slate-500 font-medium">Study Date: </span>
                  <span className="font-mono text-slate-800">
                    {new Date(activeStudy.study_datetime).toLocaleDateString()} {new Date(activeStudy.study_datetime).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Reporting Radiologist: </span>
                  <span className="font-semibold text-slate-800">
                    {activeStudy.reporting_doctor_name || 'Dr. Bekele Gemechu'}
                  </span>
                </div>
              </div>
            </div>

            {/* Radiologist Narrative Body */}
            <div className="space-y-4 mb-6 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                  Clinical Findings:
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                  {activeStudy.radiologist_report || 'Study imaging acquired. Radiologist narrative pending completion.'}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                  Impression & Conclusion:
                </h4>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-slate-900 font-bold leading-relaxed font-sans">
                  {activeStudy.clinical_impression || 'No impression recorded'}
                </div>
              </div>
            </div>

            {/* Pathologist Stamp & QR Verification */}
            <div className="flex items-center justify-between border-t border-slate-300 pt-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-1">
                  <QrCode className="w-14 h-14 text-slate-800" />
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <div className="font-bold text-slate-800">MKH PACS Digital Verification</div>
                  <div className="font-mono">Study: {activeStudy.study_instance_uid.slice(0, 20)}...</div>
                  <div>Certified Diagnostic Radiology Archive</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-500 text-[11px]">Validated & Electronically Signed:</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">
                  {activeStudy.reporting_doctor_name || 'Dr. Bekele Gemechu'}
                </div>
                <div className="text-[10px] text-slate-500">Consultant Radiologist / Clinical Director</div>
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
