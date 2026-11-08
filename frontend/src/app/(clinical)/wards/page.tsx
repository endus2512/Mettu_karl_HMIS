/**
 * Inpatient Ward & Bed Occupancy Management Workstation (IPD).
 * Enterprise clinical workstation for Mettu Karl Comprehensive Specialized Hospital.
 *
 * Full Production Architecture:
 * - Real-time bed census matrix with visual occupancy cards and capability badges (O2, telemetry)
 * - Patient admissions workflow with clinical triage acuity (Critical, High, Moderate, Stable)
 * - Ward-to-ward / bed-to-bed transfer management with automated housekeeping tracking
 * - Clinical discharge clearance with automatic length-of-stay & bed charge calculations
 * - Official printable Inpatient Admission & Discharge Summary voucher with TIN, QR verification & doctor sign-off
 * - Obsidian & Champagne Gold luxury medical design system
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Bed,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Filter,
  HeartPulse,
  Home,
  LogOut,
  MapPin,
  Maximize2,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
  UserCheck,
  Users,
  Utensils,
  Wind,
  X,
  Zap,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface WardBed {
  id: number;
  ward_id: number;
  bed_number: string;
  bed_type: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
  daily_rate_etb: number;
  oxygen_supplied: boolean;
  has_monitor: boolean;
  current_admission_id?: number | null;
  ward_code?: string;
  ward_name_en?: string;
  ward_name_om?: string;
  patient_id?: number | null;
  patient_name?: string | null;
  patient_mrn?: string | null;
  admission_number?: string | null;
  acuity_level?: 'critical' | 'high' | 'moderate' | 'stable' | null;
  admission_date?: string | null;
}

interface Ward {
  id: number;
  ward_code: string;
  name_en: string;
  name_om: string;
  department: string;
  floor_location: string;
  head_nurse: string;
  is_active: boolean;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  cleaning_beds: number;
  maintenance_beds: number;
  occupancy_rate: number;
  beds: WardBed[];
}

interface InpatientAdmission {
  id: number;
  admission_number: string;
  patient_id: number;
  patient_mrn: string;
  patient_name: string;
  patient_gender: string;
  patient_age: number;
  ward_id: number;
  ward_name: string;
  bed_id: number;
  bed_number: string;
  admitting_doctor_name: string;
  primary_nurse_name: string;
  admitting_diagnosis: string;
  icd10_code?: string | null;
  admission_type: string;
  acuity_level: 'critical' | 'high' | 'moderate' | 'stable';
  diet_category: string;
  payment_method: string;
  admission_date: string;
  discharge_date?: string | null;
  discharge_summary?: string | null;
  discharge_condition?: string | null;
  total_days: number;
  total_bed_charge_etb: number;
  status: 'admitted' | 'transferred' | 'discharged' | 'deceased';
}

interface BedTransferLog {
  id: number;
  admission_id: number;
  admission_number: string;
  patient_name: string;
  from_ward_name: string;
  from_bed_number: string;
  to_ward_name: string;
  to_bed_number: string;
  transferred_by_name: string;
  transfer_reason: string;
  transferred_at: string;
}

interface InpatientStats {
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  cleaning_beds: number;
  maintenance_beds: number;
  overall_occupancy_rate: number;
  active_admissions_count: number;
  critical_patients_count: number;
  today_admissions_count: number;
  today_discharges_count: number;
}

interface VoucherData {
  hospital_name_en: string;
  hospital_name_om: string;
  tin_number: string;
  accreditation_level: string;
  telephone: string;
  location: string;
  admission_number: string;
  admission_date: string;
  discharge_date: string;
  total_stay_days: number;
  daily_rate_etb: number;
  total_bed_charge_etb: number;
  patient_mrn: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_address: string;
  ward_name: string;
  bed_number: string;
  payment_category: string;
  admitting_diagnosis: string;
  icd10_code?: string | null;
  discharge_summary: string;
  discharge_condition: string;
  attending_physician: string;
  issued_timestamp: string;
  verification_qr: string;
}

export default function InpatientWardsPage() {
  // Live State
  const [stats, setStats] = useState<InpatientStats>({
    total_beds: 0,
    occupied_beds: 0,
    available_beds: 0,
    cleaning_beds: 0,
    maintenance_beds: 0,
    overall_occupancy_rate: 0,
    active_admissions_count: 0,
    critical_patients_count: 0,
    today_admissions_count: 0,
    today_discharges_count: 0,
  });

  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<WardBed[]>([]);
  const [admissions, setAdmissions] = useState<InpatientAdmission[]>([]);
  const [transfers, setTransfers] = useState<BedTransferLog[]>([]);
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'matrix' | 'census' | 'transfers' | 'wards'>('matrix');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Active Selections for Actions
  const [selectedAdmission, setSelectedAdmission] = useState<InpatientAdmission | null>(null);
  const [selectedBedForAdmit, setSelectedBedForAdmit] = useState<WardBed | null>(null);
  const [voucherPayload, setVoucherPayload] = useState<VoucherData | null>(null);

  // Feedback State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form: Patient Admission
  const [admitPatientId, setAdmitPatientId] = useState<number>(1);
  const [admitWardId, setAdmitWardId] = useState<number>(1);
  const [admitBedId, setAdmitBedId] = useState<number>(1);
  const [admitDiagnosis, setAdmitDiagnosis] = useState('');
  const [admitIcd10, setAdmitIcd10] = useState('');
  const [admitType, setAdmitType] = useState('emergency');
  const [admitAcuity, setAdmitAcuity] = useState<'critical' | 'high' | 'moderate' | 'stable'>('moderate');
  const [admitDiet, setAdmitDiet] = useState('regular');
  const [admitPayment, setAdmitPayment] = useState('cbhi');

  // Form: Transfer
  const [transferTargetWardId, setTransferTargetWardId] = useState<number>(1);
  const [transferTargetBedId, setTransferTargetBedId] = useState<number>(1);
  const [transferReason, setTransferReason] = useState('');

  // Form: Discharge
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [dischargeCondition, setDischargeCondition] = useState('cured_improved');

  // Load all live Inpatient data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, wardsRes, bedsRes, admRes, transRes, patRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/inpatient/stats`),
        fetch(`${API_BASE}/api/v1/inpatient/wards`),
        fetch(`${API_BASE}/api/v1/inpatient/beds`),
        fetch(`${API_BASE}/api/v1/inpatient/admissions`),
        fetch(`${API_BASE}/api/v1/inpatient/transfers`),
        fetch(`${API_BASE}/api/v1/patient-portal/profile`).catch(() => ({ ok: false })),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (wardsRes.ok) {
        const wardsData = await wardsRes.json();
        setWards(wardsData);
        if (wardsData.length > 0 && !admitWardId) {
          setAdmitWardId(wardsData[0].id);
        }
      }
      if (bedsRes.ok) {
        const bedsData = await bedsRes.json();
        setBeds(bedsData);
      }
      if (admRes.ok) setAdmissions(await admRes.json());
      if (transRes.ok) setTransfers(await transRes.json());

      // Try fetching patient list from patients table via billing/fhir or fallback
      try {
        const pRes = await fetch(`${API_BASE}/api/v1/patients/`);
        if (pRes.ok) {
          const pData = await pRes.json();
          setRegisteredPatients(pData);
        }
      } catch (e) {
        // Patients fallback
      }
    } catch (err: any) {
      console.error('Failed to load Inpatient data:', err);
      setActionError('Kuusaa deetaa hospitaalaa irraa deetaa argachuu hin dandeenye.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Check query params for tab or print
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['matrix', 'census', 'transfers', 'wards'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
      if (params.get('print') === 'true' && params.get('admId')) {
        handleOpenVoucher(parseInt(params.get('admId')!));
      } else if (params.get('print') === 'true') {
        // open first admission voucher
        setTimeout(() => {
          handleOpenVoucher(1);
        }, 800);
      }
    }
  }, []);

  // Filter beds for the Matrix view
  const filteredBeds = useMemo(() => {
    return beds.filter((bed) => {
      const matchesWard = selectedWardFilter === 'all' || bed.ward_id.toString() === selectedWardFilter;
      const matchesStatus = selectedStatusFilter === 'all' || bed.status === selectedStatusFilter;
      const matchesSearch =
        !searchQuery ||
        bed.bed_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bed.patient_name && bed.patient_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (bed.patient_mrn && bed.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (bed.ward_name_en && bed.ward_name_en.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesWard && matchesStatus && matchesSearch;
    });
  }, [beds, selectedWardFilter, selectedStatusFilter, searchQuery]);

  // Filter admissions for the Census view
  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const matchesWard = selectedWardFilter === 'all' || adm.ward_id.toString() === selectedWardFilter;
      const matchesSearch =
        !searchQuery ||
        adm.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adm.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adm.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adm.admitting_diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adm.bed_number.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesWard && matchesSearch;
    });
  }, [admissions, selectedWardFilter, searchQuery]);

  // Available beds for selected ward in admit form
  const availableBedsForAdmit = useMemo(() => {
    return beds.filter((b) => b.ward_id === admitWardId && b.status === 'available');
  }, [beds, admitWardId]);

  // Available beds for target ward in transfer form
  const availableBedsForTransfer = useMemo(() => {
    return beds.filter((b) => b.ward_id === transferTargetWardId && b.status === 'available');
  }, [beds, transferTargetWardId]);

  // Handle Quick Bed Status Change (e.g. Cleaning -> Available)
  const handleUpdateBedStatus = async (bedId: number, newStatus: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/inpatient/beds/${bedId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update bed status');
      }
      setActionSuccess(`Bed status updated successfully to '${newStatus.toUpperCase()}'.`);
      await fetchAllData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Patient Admission Submit
  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitDiagnosis.trim()) {
      setActionError('Please enter the admitting diagnosis.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const payload = {
        patient_id: admitPatientId,
        ward_id: admitWardId,
        bed_id: admitBedId,
        admitting_diagnosis: admitDiagnosis,
        icd10_code: admitIcd10 || null,
        admission_type: admitType,
        acuity_level: admitAcuity,
        diet_category: admitDiet,
        payment_method: admitPayment,
      };

      const res = await fetch(`${API_BASE}/api/v1/inpatient/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to register patient admission');
      }

      const created = await res.json();
      setActionSuccess(`Patient admitted successfully under Admission #${created.admission_number}!`);
      setShowAdmitModal(false);
      setAdmitDiagnosis('');
      setAdmitIcd10('');
      await fetchAllData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during admission registration.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Patient Bed Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    if (!transferReason.trim()) {
      setActionError('Please enter the clinical transfer reason.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const payload = {
        to_ward_id: transferTargetWardId,
        to_bed_id: transferTargetBedId,
        transfer_reason: transferReason,
      };

      const res = await fetch(`${API_BASE}/api/v1/inpatient/admissions/${selectedAdmission.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to complete patient transfer');
      }

      setActionSuccess(`Patient ${selectedAdmission.patient_name} transferred successfully to target ward & bed.`);
      setShowTransferModal(false);
      setSelectedAdmission(null);
      setTransferReason('');
      await fetchAllData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during bed transfer.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Clinical Discharge Submit
  const handleDischargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    if (!dischargeSummary.trim()) {
      setActionError('Please enter the physician discharge summary.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const payload = {
        discharge_summary: dischargeSummary,
        discharge_condition: dischargeCondition,
      };

      const res = await fetch(`${API_BASE}/api/v1/inpatient/admissions/${selectedAdmission.id}/discharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to process patient discharge');
      }

      const discharged = await res.json();
      setActionSuccess(`Patient ${discharged.patient_name} discharged successfully after ${discharged.total_days} days of inpatient care.`);
      setShowDischargeModal(false);
      setDischargeSummary('');
      await fetchAllData();
      setTimeout(() => setActionSuccess(null), 4000);

      // Offer to view voucher
      handleOpenVoucher(discharged.id);
    } catch (err: any) {
      setActionError(err.message || 'An error occurred during patient discharge.');
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Opening Voucher Preview Modal
  const handleOpenVoucher = async (admissionId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/inpatient/admissions/${admissionId}/voucher`);
      if (!res.ok) {
        throw new Error('Unable to fetch inpatient summary voucher.');
      }
      const data = await res.json();
      setVoucherPayload(data);
      setShowVoucherModal(true);
    } catch (err: any) {
      setActionError(err.message || 'Unable to open voucher preview.');
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  // Acuity styling helper
  const getAcuityBadge = (acuity?: string | null) => {
    switch (acuity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            CRITICAL (ICU)
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            HIGH (MONITORING)
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
            MODERATE (WARD)
          </span>
        );
      case 'stable':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            STABLE
          </span>
        );
    }
  };

  // Bed Status styling helper
  const getBedStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Occupied
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Available
          </span>
        );
      case 'cleaning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            Sanitizing
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-700 text-slate-300 border border-slate-600">
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS                                               */}
      {/* ========================================================================= */}
      <header className="border-b border-[#1a2233] bg-[#101624]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href="/dashboard" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-slate-200">Inpatient Wards (IPD)</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-amber-400 font-medium">Bed Census & Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Bed className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Inpatient Wards & Bed Occupancy
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live IPD Workstation
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Mettu Karl Comprehensive Specialized Hospital • Inpatient Bed Occupancy & Clinical Ward Census
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#1a2233] hover:bg-[#253047] text-slate-200 border border-[#2b374e] transition-all disabled:opacity-50"
              title="Refresh Census"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => {
                setSelectedBedForAdmit(null);
                setShowAdmitModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Admit New Patient
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {actionSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. OPERATIONAL KPI METRICS STRIP                                         */}
      {/* ========================================================================= */}
      <section className="px-6 pt-6 pb-2 grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* KPI 1: Bed Occupancy Rate (BOR %) */}
        <div className="bg-[#101624] border border-[#1a2233] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Bed Occupancy Rate (BOR)</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{stats.overall_occupancy_rate}%</span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({stats.occupied_beds}/{stats.total_beds} Beds)
            </span>
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-[#1a2233] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.overall_occupancy_rate > 85
                  ? 'bg-rose-500'
                  : stats.overall_occupancy_rate > 65
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, stats.overall_occupancy_rate)}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 2: Occupied Active Admissions */}
        <div className="bg-[#101624] border border-[#1a2233] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Admitted Inpatients</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-400">{stats.occupied_beds}</span>
            <span className="text-[11px] text-slate-400">Active Census</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> Across 6 clinical wards
          </span>
        </div>

        {/* KPI 3: Available Free Beds */}
        <div className="bg-[#101624] border border-[#1a2233] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Available Beds</span>
            <Bed className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{stats.available_beds}</span>
            <span className="text-[11px] text-slate-400">Ready to Admit</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Direct admission</span>
        </div>

        {/* KPI 4: Sanitization & Maintenance */}
        <div className="bg-[#101624] border border-[#1a2233] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Sanitizing & Maint</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-cyan-400">{stats.cleaning_beds}</span>
            <span className="text-[11px] text-slate-400 font-mono">Cleaning • {stats.maintenance_beds} Maint</span>
          </div>
          <span className="text-[11px] text-cyan-300/80 mt-1">Housekeeping turn</span>
        </div>

        {/* KPI 5: Critical Acuity Patients */}
        <div className="bg-[#101624] border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical Acuity</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-400">{stats.critical_patients_count}</span>
            <span className="text-[11px] text-rose-300 font-mono">ICU Priority</span>
          </div>
          <span className="text-[10px] text-rose-400/90 font-medium flex items-center gap-1 mt-1 animate-pulse">
            <HeartPulse className="w-3 h-3" /> Dedicated bedside monitoring
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TABS NAVIGATION & SEARCH CONTROLS                                      */}
      {/* ========================================================================= */}
      <section className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Workstation Tabs */}
        <div className="flex items-center gap-1 bg-[#101624] p-1 rounded-2xl border border-[#1a2233]">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#1a2233]'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            Bed Census Matrix
          </button>
          <button
            onClick={() => setActiveTab('census')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'census'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#1a2233]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Inpatient Census
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-950/40 text-amber-200">
              {admissions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transfers'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#1a2233]'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Bed Transfers & Logs
          </button>
          <button
            onClick={() => setActiveTab('wards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wards'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#1a2233]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Clinical Wards
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-3">
          {/* Ward Selector Filter */}
          <div className="relative">
            <select
              value={selectedWardFilter}
              onChange={(e) => setSelectedWardFilter(e.target.value)}
              className="bg-[#101624] border border-[#1a2233] text-slate-200 text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
            >
              <option value="all">All Clinical Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id.toString()}>
                  {w.name_en || w.name_om} ({w.ward_code})
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Status Filter (in Matrix view) */}
          {activeTab === 'matrix' && (
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#101624] border border-[#1a2233] text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Bed Statuses</option>
              <option value="available">Available Beds</option>
              <option value="occupied">Occupied Beds</option>
              <option value="cleaning">Cleaning / Sanitizing</option>
              <option value="maintenance">Maintenance</option>
            </select>
          )}

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Patient Name, MRN, or Bed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#101624] border border-[#1a2233] text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 w-56 md:w-64 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAIN WORKSTATION CONTENT AREA                                          */}
      {/* ========================================================================= */}
      <main className="flex-1 px-6 pb-12">
        {/* ======================================================================= */}
        {/* TAB 1: BED MATRIX (INTERACTIVE VISUAL GRID)                             */}
        {/* ======================================================================= */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-[#101624]/60 border border-[#1a2233] text-xs text-slate-300">
              <span className="font-bold text-slate-400">Status Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20"></span>
                <span>Available Beds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/20"></span>
                <span>Occupied Beds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/20 animate-pulse"></span>
                <span>Cleaning / Sanitizing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 ring-2 ring-slate-500/20"></span>
                <span>Maintenance</span>
              </div>
              <div className="ml-auto text-[11px] text-slate-500 font-mono">
                {filteredBeds.length} Beds Listed
              </div>
            </div>

            {/* Beds Grid Grouped by Wards */}
            {wards
              .filter((w) => selectedWardFilter === 'all' || w.id.toString() === selectedWardFilter)
              .map((ward) => {
                const wardBeds = filteredBeds.filter((b) => b.ward_id === ward.id);
                if (wardBeds.length === 0 && selectedWardFilter !== 'all') return null;

                return (
                  <div key={ward.id} className="bg-[#101624] border border-[#1a2233] rounded-3xl p-5 shadow-xl">
                    {/* Ward Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1a2233] gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#1a2233] text-amber-400 border border-[#2b374e]">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-white">{ward.name_en || ward.name_om}</h2>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1a2233] text-amber-300 border border-[#2b374e]">
                              {ward.ward_code}
                            </span>
                            <span className="text-xs text-slate-400 hidden sm:inline">({ward.name_en})</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" /> {ward.floor_location}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-500" /> {ward.head_nurse}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ward mini stat */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400">
                          Occupancy:{' '}
                          <strong className="text-white font-mono">{ward.occupancy_rate}%</strong> ({ward.occupied_beds}/
                          {ward.total_beds})
                        </span>
                        <div className="w-24 bg-[#1a2233] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ward.occupancy_rate > 80
                                ? 'bg-rose-500'
                                : ward.occupancy_rate > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${ward.occupancy_rate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Beds Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
                      {wardBeds.map((bed) => {
                        const isOccupied = bed.status === 'occupied';
                        const isAvailable = bed.status === 'available';
                        const isCleaning = bed.status === 'cleaning';
                        const isMaintenance = bed.status === 'maintenance';

                        return (
                          <div
                            key={bed.id}
                            className={`rounded-2xl border p-4 transition-all duration-200 relative flex flex-col justify-between ${
                              isOccupied
                                ? 'bg-[#141b29] border-amber-500/30 hover:border-amber-500/60 shadow-lg'
                                : isAvailable
                                ? 'bg-[#0f1724]/90 border-emerald-500/30 hover:border-emerald-500/60'
                                : isCleaning
                                ? 'bg-[#0f1c29]/90 border-cyan-500/30 hover:border-cyan-500/60'
                                : 'bg-[#111722] border-slate-800 opacity-70'
                            }`}
                          >
                            {/* Card Top: Bed ID & Badges */}
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-white font-mono">{bed.bed_number}</span>
                                  <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-[#1a2233]">
                                    {bed.bed_type.replace('_', ' ')}
                                  </span>
                                </div>
                                {getBedStatusBadge(bed.status)}
                              </div>

                              {/* Utilities (Oxygen, Monitor, Daily Rate) */}
                              <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-2 font-mono">
                                {bed.oxygen_supplied && (
                                  <span className="flex items-center gap-1 text-teal-400" title="Oxygen Pipeline Connected">
                                    <Wind className="w-3 h-3" /> O₂
                                  </span>
                                )}
                                {bed.has_monitor && (
                                  <span className="flex items-center gap-1 text-cyan-400" title="Vital Telemetry Monitor Attached">
                                    <HeartPulse className="w-3 h-3" /> Monitor
                                  </span>
                                )}
                                <span className="ml-auto text-amber-400/90 font-medium">{bed.daily_rate_etb} ETB/d</span>
                              </div>

                              {/* Occupant Details or Availability Message */}
                              <div className="mt-3.5 pt-3 border-t border-[#1f293d]">
                                {isOccupied ? (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-white truncate">
                                        {bed.patient_name || 'Patient'}
                                      </span>
                                      {getAcuityBadge(bed.acuity_level)}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                                      <span>{bed.patient_mrn}</span>
                                      <span className="text-amber-400/80">{bed.admission_number}</span>
                                    </div>
                                  </div>
                                ) : isAvailable ? (
                                  <div className="py-2 text-center text-xs text-emerald-400/90 flex items-center justify-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Bed ready for patient admission</span>
                                  </div>
                                ) : isCleaning ? (
                                  <div className="py-2 text-center text-xs text-cyan-400 flex items-center justify-center gap-1.5 animate-pulse">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Under housekeeping disinfection</span>
                                  </div>
                                ) : (
                                  <div className="py-2 text-center text-xs text-slate-500">
                                    <span>Under engineering maintenance</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Bottom: Contextual Action Buttons */}
                            <div className="mt-4 pt-3 border-t border-[#1f293d]/80 flex items-center gap-2">
                              {isOccupied && (
                                <>
                                  <button
                                    onClick={() => {
                                      const adm = admissions.find((a) => a.id === bed.current_admission_id);
                                      if (adm) {
                                        setSelectedAdmission(adm);
                                        setTransferTargetWardId(adm.ward_id);
                                        setShowTransferModal(true);
                                      }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#1a2233] hover:bg-[#253047] text-slate-200 border border-[#2b374e] transition-all"
                                    title="Transfer Bed"
                                  >
                                    <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                                    <span>Transfer</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const adm = admissions.find((a) => a.id === bed.current_admission_id);
                                      if (adm) {
                                        setSelectedAdmission(adm);
                                        setShowDischargeModal(true);
                                      }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
                                    title="Discharge Patient"
                                  >
                                    <LogOut className="w-3 h-3 text-rose-400" />
                                    <span>Discharge</span>
                                  </button>
                                </>
                              )}

                              {isAvailable && (
                                <button
                                  onClick={() => {
                                    setSelectedBedForAdmit(bed);
                                    setAdmitWardId(bed.ward_id);
                                    setAdmitBedId(bed.id);
                                    setShowAdmitModal(true);
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Admit Here</span>
                                </button>
                              )}

                              {isCleaning && (
                                <button
                                  onClick={() => handleUpdateBedStatus(bed.id, 'available')}
                                  disabled={actionLoading}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Mark Sanitized</span>
                                </button>
                              )}

                              {isMaintenance && (
                                <button
                                  onClick={() => handleUpdateBedStatus(bed.id, 'available')}
                                  disabled={actionLoading}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-all"
                                >
                                  <span>Release to Service</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: ACTIVE INPATIENT CENSUS TABLE                                    */}
        {/* ======================================================================= */}
        {activeTab === 'census' && (
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1a2233] gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Active Inpatient Census
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {filteredAdmissions.length} Inpatients
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Current census of admitted inpatients across all wards with triage acuity
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAdmitModal(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Admit Patient
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#1a2233]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141b29] text-slate-400 font-mono uppercase text-[11px] border-b border-[#1a2233]">
                  <tr>
                    <th className="py-3 px-4">Admission # / MRN</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Ward / Bed</th>
                    <th className="py-3 px-4">Admitting Diagnosis</th>
                    <th className="py-3 px-4">Acuity</th>
                    <th className="py-3 px-4">Admit Date</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Attending Physician</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2233] text-slate-200">
                  {filteredAdmissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No active inpatient admissions found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmissions.map((adm) => (
                      <tr key={adm.id} className="hover:bg-[#161f30] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium">
                          <span className="text-amber-400 block font-bold">{adm.admission_number}</span>
                          <span className="text-slate-500 text-[11px]">{adm.patient_mrn}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          <span className="text-white block font-bold">{adm.patient_name}</span>
                          <span className="text-slate-400 text-[11px]">
                            {adm.patient_age} Waggaa • {adm.patient_gender.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-[#1a2233] text-amber-300 font-bold border border-[#2b374e] inline-block mb-1">
                            {adm.bed_number}
                          </span>
                          <span className="text-slate-400 text-[11px] block">{adm.ward_name}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="font-semibold text-slate-200 block truncate" title={adm.admitting_diagnosis}>
                            {adm.admitting_diagnosis}
                          </span>
                          {adm.icd10_code && (
                            <span className="text-[10px] text-teal-400 font-mono">ICD-10: {adm.icd10_code}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">{getAcuityBadge(adm.acuity_level)}</td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-white block">
                            {new Date(adm.admission_date).toLocaleDateString()}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {adm.total_days > 0 ? `${adm.total_days} Guyyaa` : 'Amma Dura'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              adm.payment_method === 'cbhi'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {adm.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="text-slate-300 block">{adm.admitting_doctor_name}</span>
                          <span className="text-slate-500 text-[11px]">{adm.primary_nurse_name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setTransferTargetWardId(adm.ward_id);
                                setShowTransferModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#1a2233] hover:bg-[#253047] text-amber-400 transition-colors"
                              title="Transfer Bed"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setShowDischargeModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                              title="Discharge Patient"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenVoucher(adm.id)}
                              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
                              title="Print Inpatient Summary Voucher"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: TRANSFERS & TURNOVER LOG                                         */}
        {/* ======================================================================= */}
        {activeTab === 'transfers' && (
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="pb-4 border-b border-[#1a2233]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Ward Bed Transfer Audit Log
              </h2>
              <p className="text-xs text-slate-400">
                Comprehensive audit log of patient relocations between hospital wards and beds
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#1a2233]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141b29] text-slate-400 font-mono uppercase text-[11px] border-b border-[#1a2233]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Previous Ward/Bed</th>
                    <th className="py-3 px-4">Target Ward/Bed</th>
                    <th className="py-3 px-4">Transfer Reason</th>
                    <th className="py-3 px-4">Authorized Clinician</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2233] text-slate-200">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No bed transfer records logged.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-[#161f30] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {new Date(t.transferred_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">{t.admission_number}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{t.patient_name}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-mono text-[11px] border border-rose-500/30">
                            {t.from_ward_name} ({t.from_bed_number})
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[11px] border border-emerald-500/30">
                            {t.to_ward_name} ({t.to_bed_number})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-sm text-slate-300 font-medium">{t.transfer_reason}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{t.transferred_by_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: WARDS CONFIGURATION & DEPARTMENT HEALTH                          */}
        {/* ======================================================================= */}
        {activeTab === 'wards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {wards.map((ward) => (
              <div
                key={ward.id}
                className="bg-[#101624] border border-[#1a2233] rounded-3xl p-6 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#1a2233]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-amber-400" />
                      <span className="text-base font-bold text-white">{ward.name_om}</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {ward.ward_code}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>English Name:</span>
                      <strong className="text-slate-200">{ward.name_en}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Department:</span>
                      <strong className="text-slate-200">{ward.department}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Location:</span>
                      <strong className="text-slate-200">{ward.floor_location}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Head Nurse:</span>
                      <strong className="text-slate-200">{ward.head_nurse}</strong>
                    </div>
                  </div>

                  {/* Bed Breakdown Pill */}
                  <div className="grid grid-cols-4 gap-2 mt-5 p-3 rounded-2xl bg-[#141b29] border border-[#1f293d] text-center">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">Ida'ama</span>
                      <strong className="text-base font-extrabold text-white">{ward.total_beds}</strong>
                    </div>
                    <div>
                      <span className="text-amber-400 text-[10px] block font-medium">Qabame</span>
                      <strong className="text-base font-extrabold text-amber-400">{ward.occupied_beds}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-400 text-[10px] block font-medium">Qophii</span>
                      <strong className="text-base font-extrabold text-emerald-400">{ward.available_beds}</strong>
                    </div>
                    <div>
                      <span className="text-cyan-400 text-[10px] block font-medium">Cleaning</span>
                      <strong className="text-base font-extrabold text-cyan-400">{ward.cleaning_beds}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#1a2233] flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Occupancy Rate: <strong className="text-amber-400">{ward.occupancy_rate}%</strong>
                  </span>
                  <button
                    onClick={() => {
                      setSelectedWardFilter(ward.id.toString());
                      setActiveTab('matrix');
                    }}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    View Beds <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: PATIENT ADMISSION MODAL                                          */}
      {/* ========================================================================= */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-auto animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-[#1a2233]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Inpatient Admission</h3>
                  <p className="text-xs text-slate-400">Select ward, bed, and admitting diagnosis to assign an inpatient bed</p>
                </div>
              </div>
              <button onClick={() => setShowAdmitModal(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="mt-5 space-y-4">
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Registered Patient *
                </label>
                <select
                  value={admitPatientId}
                  onChange={(e) => setAdmitPatientId(parseInt(e.target.value))}
                  className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>Gudeta Hailu (MKH-2026-000101) - 41 yrs • Male</option>
                  <option value={2}>Ayantu Mamo (MKH-2026-000102) - 32 yrs • Female</option>
                  <option value={3}>Chaltu Abera (MKH-2026-000103) - 28 yrs • Female</option>
                  <option value={4}>Tolessa Bekele (MKH-2026-000104) - 54 yrs • Male</option>
                  <option value={5}>Mekonnen Kebede (MKH-2026-000105) - 62 yrs • Male</option>
                </select>
              </div>

              {/* Ward and Bed Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Clinical Ward *
                  </label>
                  <select
                    value={admitWardId}
                    onChange={(e) => {
                      const newWardId = parseInt(e.target.value);
                      setAdmitWardId(newWardId);
                      const available = beds.filter((b) => b.ward_id === newWardId && b.status === 'available');
                      if (available.length > 0) setAdmitBedId(available[0].id);
                    }}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name_en || w.name_om} ({w.ward_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Available Bed *
                  </label>
                  <select
                    value={admitBedId}
                    onChange={(e) => setAdmitBedId(parseInt(e.target.value))}
                    disabled={availableBedsForAdmit.length === 0}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  >
                    {availableBedsForAdmit.length === 0 ? (
                      <option value="">No beds currently available in this ward!</option>
                    ) : (
                      availableBedsForAdmit.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bed_number} ({b.bed_type}) - {b.daily_rate_etb} ETB/d
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Clinical Indication & ICD-10 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Admitting Diagnosis *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Appendicitis with localized peritonitis"
                    value={admitDiagnosis}
                    onChange={(e) => setAdmitDiagnosis(e.target.value)}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">ICD-10 Code</label>
                  <input
                    type="text"
                    placeholder="e.g. K35.8"
                    value={admitIcd10}
                    onChange={(e) => setAdmitIcd10(e.target.value)}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Acuity Level & Admission Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Clinical Acuity Level *
                  </label>
                  <select
                    value={admitAcuity}
                    onChange={(e) => setAdmitAcuity(e.target.value as any)}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="critical">CRITICAL (ICU Required)</option>
                    <option value="high">HIGH (Close Monitoring)</option>
                    <option value="moderate">MODERATE (Standard Ward)</option>
                    <option value="stable">STABLE (Elective / Observational)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Admission Type *
                  </label>
                  <select
                    value={admitType}
                    onChange={(e) => setAdmitType(e.target.value)}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="emergency">Emergency (Triage ED Admission)</option>
                    <option value="elective_surgical">Elective Surgical (OPD Pre-Op)</option>
                    <option value="referral">Referral (External Health Center)</option>
                    <option value="internal_transfer">Internal Transfer (Clinic to Ward)</option>
                  </select>
                </div>
              </div>

              {/* Diet & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Diet Category</label>
                  <select
                    value={admitDiet}
                    onChange={(e) => setAdmitDiet(e.target.value)}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="regular">Regular Diet</option>
                    <option value="diabetic">Diabetic Diet (Low Glycemic)</option>
                    <option value="renal">Renal Diet (Low Sodium/Potassium)</option>
                    <option value="npo_fasting">NPO / Fasting (Pre-Op / ICU)</option>
                    <option value="soft">Soft / Fluid Diet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Payment Method</label>
                  <select
                    value={admitPayment}
                    onChange={(e) => setAdmitPayment(e.target.value)}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="cbhi">CBHI (Community-Based Health Insurance)</option>
                    <option value="cash">Cash (Self-Pay)</option>
                    <option value="private_insurance">Private Insurance</option>
                    <option value="free_exempted">Exempted / Government Scheme</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1a2233]">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#1a2233]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || availableBedsForAdmit.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Admitting...' : 'Admit Patient & Assign Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BED TRANSFER MODAL                                               */}
      {/* ========================================================================= */}
      {showTransferModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-auto animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-[#1a2233]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Patient Bed Transfer</h3>
                  <p className="text-xs text-slate-400">Transfer inpatient to another ward or specialized bed</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-5 space-y-4">
              {/* Current Status Box */}
              <div className="p-3.5 rounded-2xl bg-[#141b29] border border-[#1f293d] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <strong className="text-white">{selectedAdmission.patient_name} ({selectedAdmission.patient_mrn})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Ward & Bed:</span>
                  <span className="text-rose-300 font-mono font-bold">
                    {selectedAdmission.ward_name} • {selectedAdmission.bed_number}
                  </span>
                </div>
              </div>

              {/* Target Ward & Bed Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Clinical Ward *
                  </label>
                  <select
                    value={transferTargetWardId}
                    onChange={(e) => {
                      const newWardId = parseInt(e.target.value);
                      setTransferTargetWardId(newWardId);
                      const available = beds.filter((b) => b.ward_id === newWardId && b.status === 'available');
                      if (available.length > 0) setTransferTargetBedId(available[0].id);
                    }}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name_en || w.name_om} ({w.ward_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Bed *
                  </label>
                  <select
                    value={transferTargetBedId}
                    onChange={(e) => setTransferTargetBedId(parseInt(e.target.value))}
                    disabled={availableBedsForTransfer.length === 0}
                    className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  >
                    {availableBedsForTransfer.length === 0 ? (
                      <option value="">No beds currently available in this ward!</option>
                    ) : (
                      availableBedsForTransfer.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bed_number} ({b.bed_type}) - {b.daily_rate_etb} ETB/d
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Transfer Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Clinical Transfer Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Patient condition stabilized post-ICU management; transferred to Medical Inpatient Ward for ongoing oral antimicrobial therapy."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>The vacated bed will automatically be queued for Housekeeping disinfection.</span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1a2233]">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#1a2233]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || availableBedsForTransfer.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Transferring...' : 'Execute Bed Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CLINICAL DISCHARGE MODAL                                         */}
      {/* ========================================================================= */}
      {showDischargeModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101624] border border-[#1a2233] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-auto animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-[#1a2233]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Clinical Discharge Clearance</h3>
                  <p className="text-xs text-slate-400">Record physician discharge summary and release bed for cleaning</p>
                </div>
              </div>
              <button onClick={() => setShowDischargeModal(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="mt-5 space-y-4">
              {/* Patient summary */}
              <div className="p-3.5 rounded-2xl bg-[#141b29] border border-[#1f293d] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <strong className="text-white">{selectedAdmission.patient_name} ({selectedAdmission.patient_mrn})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ward / Bed:</span>
                  <span className="text-amber-300 font-mono">{selectedAdmission.ward_name} • {selectedAdmission.bed_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admission Date:</span>
                  <span className="text-slate-200 font-mono">
                    {new Date(selectedAdmission.admission_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Discharge Condition */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Discharge Disposition *
                </label>
                <select
                  value={dischargeCondition}
                  onChange={(e) => setDischargeCondition(e.target.value)}
                  className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="cured_improved">Cured & Improved</option>
                  <option value="transferred">Transferred to Higher Tertiary Facility</option>
                  <option value="lama">Left Against Medical Advice (LAMA)</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>

              {/* Discharge Narrative Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Physician Discharge Summary & Instructions *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter clinical course, discharge medications, follow-up instructions..."
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  className="w-full bg-[#141b29] border border-[#2b374e] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1a2233]">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#1a2233]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Discharging...' : 'Confirm & Finalize Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: OFFICIAL PRINTABLE INPATIENT ADMISSION & DISCHARGE VOUCHER       */}
      {/* ========================================================================= */}
      {showVoucherModal && voucherPayload && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative my-auto print:shadow-none print:w-full print:rounded-none">
            {/* Header / Actions (hidden in print) */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Inpatient Admission & Discharge Summary Preview
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print Voucher
                </button>
                <button onClick={() => setShowVoucherModal(false)} className="p-2 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hospital Official Letterhead */}
            <div className="text-center pt-4 pb-4 border-b-2 border-slate-900">
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
                {voucherPayload.hospital_name_en}
              </h2>
              <h3 className="text-xs font-bold uppercase text-slate-700">
                {voucherPayload.hospital_name_om}
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Department of Inpatient Clinical Services & Bed Management • {voucherPayload.accreditation_level}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                TIN: {voucherPayload.tin_number} • {voucherPayload.location} • Tel: {voucherPayload.telephone}
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center my-3">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 rounded border border-slate-300">
                INPATIENT ADMISSION & CLINICAL DISCHARGE SUMMARY
              </span>
            </div>

            {/* Patient Demographics & Admission Particulars */}
            <div className="grid grid-cols-2 gap-4 text-xs py-3 border-y border-slate-200">
              <div className="space-y-1">
                <p>
                  <strong className="text-slate-600">Patient Name:</strong>{' '}
                  <span className="font-bold text-slate-900">{voucherPayload.patient_name}</span>
                </p>
                <p>
                  <strong className="text-slate-600">MRN:</strong>{' '}
                  <span className="font-mono font-bold text-slate-900">{voucherPayload.patient_mrn}</span>
                </p>
                <p>
                  <strong className="text-slate-600">Age / Gender:</strong>{' '}
                  <span>{voucherPayload.patient_age} yrs • {voucherPayload.patient_gender}</span>
                </p>
                <p>
                  <strong className="text-slate-600">Address:</strong>{' '}
                  <span>{voucherPayload.patient_address}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p>
                  <strong className="text-slate-600">Admission No:</strong>{' '}
                  <span className="font-mono font-bold text-slate-900">{voucherPayload.admission_number}</span>
                </p>
                <p>
                  <strong className="text-slate-600">Ward & Bed:</strong>{' '}
                  <span className="font-bold text-slate-900">{voucherPayload.ward_name} ({voucherPayload.bed_number})</span>
                </p>
                <p>
                  <strong className="text-slate-600">Stay Duration:</strong>{' '}
                  <span className="font-mono font-bold">{voucherPayload.total_stay_days} Days</span> ({voucherPayload.daily_rate_etb} ETB/d)
                </p>
                <p>
                  <strong className="text-slate-600">Total Bed Charge:</strong>{' '}
                  <span className="font-mono font-bold text-amber-700">{voucherPayload.total_bed_charge_etb} ETB ({voucherPayload.payment_category})</span>
                </p>
              </div>
            </div>

            {/* Clinical Indications */}
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                  ADMITTING DIAGNOSIS & CLINICAL INDICATION:
                </span>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {voucherPayload.admitting_diagnosis} {voucherPayload.icd10_code && `(ICD-10: ${voucherPayload.icd10_code})`}
                </p>
              </div>

              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                  DISCHARGE CLINICAL SUMMARY & COURSE IN HOSPITAL:
                </span>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed mt-0.5">
                  {voucherPayload.discharge_summary}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-slate-100 border border-slate-200">
                <span className="text-xs text-slate-600">
                  <strong>Discharge Condition:</strong> {voucherPayload.discharge_condition}
                </span>
                <span className="text-xs text-slate-600 font-mono">
                  Admitted: {new Date(voucherPayload.admission_date).toLocaleDateString()} • Discharged: {new Date(voucherPayload.discharge_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Validation, Sign-off & QR Code */}
            <div className="mt-6 pt-4 border-t-2 border-slate-900 flex items-end justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-slate-300 rounded bg-slate-50">
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  <p className="font-bold text-slate-800">MKH IPD Digital Verification</p>
                  <p>ADM: {voucherPayload.admission_number}</p>
                  <p>Certified Inpatient Medical Record</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">
                  Validated & Electronically Signed:
                </div>
                <div className="font-extrabold text-sm text-slate-900 border-b border-slate-900 pb-1">
                  {voucherPayload.attending_physician}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  Attending Consultant / Clinical Department Head
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  {new Date(voucherPayload.issued_timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
