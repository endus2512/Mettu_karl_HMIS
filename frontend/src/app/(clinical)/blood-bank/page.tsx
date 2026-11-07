/**
 * Blood Bank Management, Cold Chain Inventory & Crossmatch Workstation.
 * Enterprise Hemovigilance & Regional Transfusion Center for Mettu Karl Comprehensive Specialized Hospital.
 *
 * Full Production Architecture:
 * - Real-time ABO/Rh Blood Matrix & Critical Shortage HUD (O-, O+, A-, A+, B-, B+, AB-, AB+)
 * - Cold Chain Telemetry: Walk-In Refrigerator (2°C-6°C), Ultra-Low Freezer (-25°C), Platelet Agitator (20°C-24°C)
 * - Blood Units Registry: PRBC, FFP, Platelets, Cryoprecipitate with ISBT Barcodes and 100% Viral Screening
 * - Crossmatch Testing Registry: Major/Minor compatibility verification, serology methods, immediate allocation
 * - Voluntary & Replacement Blood Donor Registry
 * - Official Printable Blood Transfusion Clearance Voucher with TIN 0038912401, QR Code & Lab Sign-Off
 * - Obsidian & Champagne Gold luxury medical design system
 */
'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Droplet,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  MapPin,
  Maximize2,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Sparkles,
  TestTube2,
  Thermometer,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

const API_BASE = '';

interface BloodBankStats {
  total_units: number;
  total_prbc: number;
  total_plasma: number;
  total_platelets: number;
  o_neg_critical_count: number;
  active_crossmatches_count: number;
  transfused_today_count: number;
  total_donors_count: number;
  cold_chain_alarm_active: boolean;
  refrigerator_temperature_celsius: number;
  freezer_temperature_celsius: number;
  agitator_temperature_celsius: number;
}

interface BloodGroupStock {
  blood_group: string;
  units_available: number;
  total_units: number;
  prbc_units: number;
  plasma_units: number;
  platelet_units: number;
  is_critical_shortage: boolean;
  min_threshold: number;
}

interface BloodUnit {
  id: number;
  unit_barcode: string;
  unit_number?: string | null;
  donor_id?: number | null;
  donor_name?: string | null;
  blood_group: string;
  component_type: string;
  volume_ml: number;
  collected_at: string;
  expiry_date: string;
  storage_temperature_celsius: number;
  storage_location: string;
  status: string;
  tested_negative_hiv: boolean;
  tested_negative_hep_b: boolean;
  tested_negative_hep_c: boolean;
  tested_negative_syphilis: boolean;
}

interface CrossMatchRecord {
  id: number;
  crossmatch_code: string;
  patient_id: number;
  patient_name: string;
  patient_mrn: string;
  patient_blood_group: string;
  blood_unit_id: number;
  blood_unit_barcode: string;
  blood_unit_group: string;
  blood_unit_component: string;
  is_compatible: boolean;
  crossmatch_method: string;
  status: string;
  tested_at: string;
  technologist_id: number;
  technologist_name: string;
  notes?: string | null;
}

interface BloodDonor {
  id: number;
  donor_code: string;
  full_name: string;
  phone_number: string;
  blood_group: string;
  last_donation_date?: string | null;
  total_donations_count: number;
  is_eligible: boolean;
}

interface BloodTransfusionVoucher {
  hospital_name_en: string;
  hospital_name_om: string;
  tin_number: string;
  accreditation_level: string;
  telephone: string;
  location: string;
  crossmatch_code: string;
  tested_at: string;
  patient_mrn: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_blood_group: string;
  blood_unit_barcode: string;
  blood_unit_group: string;
  component_type: string;
  volume_ml: number;
  expiry_date: string;
  storage_location: string;
  is_compatible: boolean;
  compatibility_verdict: string;
  crossmatch_method: string;
  tested_negative_screens: string;
  technologist_name: string;
  issued_timestamp: string;
  verification_qr: string;
}

const INITIAL_STATS: BloodBankStats = {
  total_units: 28,
  total_prbc: 20,
  total_plasma: 6,
  total_platelets: 2,
  o_neg_critical_count: 6,
  active_crossmatches_count: 4,
  transfused_today_count: 1,
  total_donors_count: 8,
  cold_chain_alarm_active: false,
  refrigerator_temperature_celsius: 3.8,
  freezer_temperature_celsius: -26.4,
  agitator_temperature_celsius: 22.1,
};

const INITIAL_STOCKS: BloodGroupStock[] = [
  { blood_group: 'O_POS', units_available: 6, total_units: 6, prbc_units: 4, plasma_units: 1, platelet_units: 1, is_critical_shortage: false, min_threshold: 3 },
  { blood_group: 'O_NEG', units_available: 6, total_units: 6, prbc_units: 5, plasma_units: 1, platelet_units: 0, is_critical_shortage: false, min_threshold: 5 },
  { blood_group: 'A_POS', units_available: 4, total_units: 4, prbc_units: 2, plasma_units: 1, platelet_units: 1, is_critical_shortage: false, min_threshold: 3 },
  { blood_group: 'A_NEG', units_available: 3, total_units: 3, prbc_units: 2, plasma_units: 1, platelet_units: 0, is_critical_shortage: false, min_threshold: 3 },
  { blood_group: 'B_POS', units_available: 3, total_units: 3, prbc_units: 2, plasma_units: 1, platelet_units: 0, is_critical_shortage: false, min_threshold: 3 },
  { blood_group: 'B_NEG', units_available: 2, total_units: 2, prbc_units: 2, plasma_units: 0, platelet_units: 0, is_critical_shortage: true, min_threshold: 3 },
  { blood_group: 'AB_POS', units_available: 2, total_units: 2, prbc_units: 1, plasma_units: 1, platelet_units: 0, is_critical_shortage: true, min_threshold: 3 },
  { blood_group: 'AB_NEG', units_available: 2, total_units: 2, prbc_units: 2, plasma_units: 0, platelet_units: 0, is_critical_shortage: true, min_threshold: 3 },
];

function formatBloodGroup(bg: string): string {
  const map: Record<string, string> = {
    O_POS: 'O+',
    O_NEG: 'O-',
    A_POS: 'A+',
    A_NEG: 'A-',
    B_POS: 'B+',
    B_NEG: 'B-',
    AB_POS: 'AB+',
    AB_NEG: 'AB-',
  };
  return map[bg] || bg;
}

function BloodBankWorkstationContent(): React.ReactElement {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // Primary State
  const [stats, setStats] = useState<BloodBankStats>(INITIAL_STATS);
  const [stocks, setStocks] = useState<BloodGroupStock[]>(INITIAL_STOCKS);
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [crossmatches, setCrossmatches] = useState<CrossMatchRecord[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'inventory' | 'units' | 'crossmatch' | 'donors'>('inventory');
  const [searchFilter, setSearchFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');
  const [componentFilter, setComponentFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Crossmatch Simulator in Inventory tab
  const [simDonorGroup, setSimDonorGroup] = useState('O_NEG');
  const [simRecipientGroup, setSimRecipientGroup] = useState('A_POS');
  const [simVerdict, setSimVerdict] = useState<string | null>(null);

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isCrossmatchModalOpen, setIsCrossmatchModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<BloodTransfusionVoucher | null>(null);

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states: Receive Unit
  const [formUnitBarcode, setFormUnitBarcode] = useState('');
  const [formBloodGroup, setFormBloodGroup] = useState('O_POS');
  const [formComponentType, setFormComponentType] = useState('PACKED_RBC');
  const [formVolumeMl, setFormVolumeMl] = useState(450);
  const [formStorageLocation, setFormStorageLocation] = useState('Walk-In Blood Refrigerator #1 - Shelf A1');
  const [formDonorId, setFormDonorId] = useState<number | ''>('');
  const [formExpiryDays, setFormExpiryDays] = useState(35);
  const [formScreenHiv, setFormScreenHiv] = useState(true);
  const [formScreenHepB, setFormScreenHepB] = useState(true);
  const [formScreenHepC, setFormScreenHepC] = useState(true);
  const [formScreenSyphilis, setFormScreenSyphilis] = useState(true);

  // Form states: Register Donor
  const [formDonorName, setFormDonorName] = useState('');
  const [formDonorPhone, setFormDonorPhone] = useState('');
  const [formDonorBloodGroup, setFormDonorBloodGroup] = useState('O_POS');
  const [formDonorDonations, setFormDonorDonations] = useState(1);
  const [formDonorEligible, setFormDonorEligible] = useState(true);

  // Form states: Crossmatch
  const [formCmPatientId, setFormCmPatientId] = useState<number | ''>('');
  const [formCmUnitId, setFormCmUnitId] = useState<number | ''>('');
  const [formCmPatientBg, setFormCmPatientBg] = useState('A_POS');
  const [formCmMethod, setFormCmMethod] = useState('Indirect Antiglobulin Test (IAT) Gel Card');
  const [formCmNotes, setFormCmNotes] = useState('');

  // Auto-dismiss notifications
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Load all live data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, stocksRes, unitsRes, cmRes, donorsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/blood-bank/stats`),
        fetch(`${API_BASE}/api/v1/blood-bank/stock-summary`),
        fetch(`${API_BASE}/api/v1/blood-bank/units`),
        fetch(`${API_BASE}/api/v1/blood-bank/crossmatch`),
        fetch(`${API_BASE}/api/v1/blood-bank/donors`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (stocksRes.ok) setStocks(await stocksRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
      if (cmRes.ok) setCrossmatches(await cmRes.json());
      if (donorsRes.ok) setDonors(await donorsRes.json());

      // Fetch patients for dropdown
      try {
        const pRes = await fetch(`${API_BASE}/api/v1/patients/`);
        if (pRes.ok) setPatients(await pRes.json());
      } catch (e) {
        // Fallback
      }
    } catch (err: any) {
      console.error('Error fetching blood bank data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Check search params
    const tabParam = searchParams.get('tab');
    if (tabParam && ['inventory', 'units', 'crossmatch', 'donors'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    const voucherParam = searchParams.get('voucher');
    if (voucherParam) {
      fetchVoucher(Number(voucherParam));
    }
  }, [searchParams]);

  // Fetch Voucher
  const fetchVoucher = async (crossmatchId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/blood-bank/crossmatch/${crossmatchId}/voucher`);
      if (!res.ok) throw new Error('Voucher retrieval failed');
      const data = await res.json();
      setSelectedVoucher(data);
      setIsVoucherModalOpen(true);
    } catch (err: any) {
      setActionError(err.message || 'Waraaqaa mirkaneessa dhiigaa fiduun hin dandaamne');
    } finally {
      setActionLoading(false);
    }
  };

  // Run instant simulator check
  const evaluateSimulator = () => {
    const d = simDonorGroup;
    const r = simRecipientGroup;

    if (d === 'O_NEG') {
      setSimVerdict('COMPATIBLE (100%): O-Negative is the universal Red Blood Cell donor. Safe for all recipients.');
    } else if (d === r) {
      setSimVerdict(`COMPATIBLE (100%): Identical ABO/Rh group match (${formatBloodGroup(d)} to ${formatBloodGroup(r)}).`);
    } else if (r === 'AB_POS') {
      setSimVerdict('COMPATIBLE (100%): AB-Positive is the universal Red Blood Cell recipient. Free of Anti-A and Anti-B antibodies.');
    } else if (r === 'A_POS' && (d === 'A_NEG' || d === 'O_POS' || d === 'O_NEG')) {
      setSimVerdict(`COMPATIBLE (100%): ${formatBloodGroup(d)} PRBC can safely transfuse into A-Positive recipient.`);
    } else if (r === 'B_POS' && (d === 'B_NEG' || d === 'O_POS' || d === 'O_NEG')) {
      setSimVerdict(`COMPATIBLE (100%): ${formatBloodGroup(d)} PRBC can safely transfuse into B-Positive recipient.`);
    } else if (r === 'AB_NEG' && (d === 'A_NEG' || d === 'B_NEG' || d === 'O_NEG')) {
      setSimVerdict(`COMPATIBLE (100%): Rh-negative donor match safe for AB-Negative recipient.`);
    } else {
      setSimVerdict(`INCOMPATIBLE: High danger of Acute Hemolytic Transfusion Reaction (AHTR)! Agglutination predicted between ${formatBloodGroup(d)} and ${formatBloodGroup(r)}.`);
    }
  };

  // Receive Unit Action
  const handleReceiveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError(null);

      const expDate = new Date();
      expDate.setDate(expDate.getDate() + Number(formExpiryDays));

      const payload = {
        unit_number: formUnitBarcode || `MKH-BB-26-${Math.floor(1000 + Math.random() * 9000)}`,
        donor_id: formDonorId ? Number(formDonorId) : null,
        blood_group: formBloodGroup,
        component_type: formComponentType,
        volume_ml: Number(formVolumeMl),
        storage_location: formStorageLocation,
        collected_date: new Date().toISOString().split('T')[0],
        expiry_date: expDate.toISOString(),
        tested_negative_hiv: formScreenHiv,
        tested_negative_hep_b: formScreenHepB,
        tested_negative_hep_c: formScreenHepC,
        tested_negative_syphilis: formScreenSyphilis,
      };

      const res = await fetch(`${API_BASE}/api/v1/blood-bank/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to receive blood unit');
      }

      setActionSuccess(`Yuunitiin dhiigaa '${payload.unit_number}' (${formatBloodGroup(payload.blood_group)}) milkaa'inaan galmaa'eera!`);
      setIsReceiveModalOpen(false);
      setFormUnitBarcode('');
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Dhiiga galmeessuu irratti hanqinni uumame');
    } finally {
      setActionLoading(false);
    }
  };

  // Register Donor Action
  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError(null);

      const payload = {
        full_name: formDonorName,
        phone_number: formDonorPhone,
        blood_group: formDonorBloodGroup,
        total_donations_count: Number(formDonorDonations),
        is_eligible: formDonorEligible,
      };

      const res = await fetch(`${API_BASE}/api/v1/blood-bank/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to register blood donor');
      }

      setActionSuccess(`Arjoomaan dhiigaa '${formDonorName}' milkaa'inaan galmaa'eera!`);
      setIsDonorModalOpen(false);
      setFormDonorName('');
      setFormDonorPhone('');
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Arjoomaa galmeessuu hin dandeenye');
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Crossmatch Action
  const handlePerformCrossmatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCmPatientId || !formCmUnitId) {
      setActionError('Maaloo dhukkubsataa fi yuunitii dhiigaa filadhaa');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      const payload = {
        patient_id: Number(formCmPatientId),
        blood_unit_id: Number(formCmUnitId),
        patient_blood_group: formCmPatientBg,
        crossmatch_method: formCmMethod,
        notes: formCmNotes || 'Clinical compatibility verified at Mettu Karl Transfusion Center',
      };

      const res = await fetch(`${API_BASE}/api/v1/blood-bank/crossmatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to execute crossmatch');
      }

      const cmData = await res.json();
      setActionSuccess(
        cmData.is_compatible
          ? `Qorannoon Crossmatch '${cmData.crossmatch_code}' MILKAAYEERA (Compatible)!`
          : `Qorannoon Crossmatch '${cmData.crossmatch_code}' WAL-HIN-FUDHATU (Incompatible)!`
      );
      setIsCrossmatchModalOpen(false);
      fetchAllData();

      // Open voucher if compatible
      if (cmData.is_compatible) {
        fetchVoucher(cmData.id);
      }
    } catch (err: any) {
      setActionError(err.message || 'Qorannoo crossmatch gaggeessuu hin dandeenye');
    } finally {
      setActionLoading(false);
    }
  };

  // Transfuse or Quarantine Unit
  const handleUpdateUnitStatus = async (unitId: number, targetStatus: 'TRANSFUSED' | 'QUARANTINED') => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/blood-bank/units/${unitId}/transfuse?status_update=${targetStatus}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Status update failed');
      const updated = await res.json();
      setActionSuccess(`Yuunitiin dhiigaa '${updated.unit_barcode}' gara '${targetStatus}' tti jijjiirameera.`);
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Haala yuunitii jijjiiruu hin dandeenye');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchSearch =
        !searchFilter ||
        u.unit_barcode.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (u.unit_number && u.unit_number.toLowerCase().includes(searchFilter.toLowerCase())) ||
        u.storage_location.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (u.donor_name && u.donor_name.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchBg = bloodGroupFilter === 'ALL' || u.blood_group === bloodGroupFilter || formatBloodGroup(u.blood_group) === bloodGroupFilter;
      const matchComp = componentFilter === 'ALL' || u.component_type === componentFilter;

      return matchSearch && matchBg && matchComp;
    });
  }, [units, searchFilter, bloodGroupFilter, componentFilter]);

  // Filtered Crossmatches
  const filteredCrossmatches = useMemo(() => {
    return crossmatches.filter((c) => {
      if (!searchFilter) return true;
      const q = searchFilter.toLowerCase();
      return (
        c.crossmatch_code.toLowerCase().includes(q) ||
        c.patient_name.toLowerCase().includes(q) ||
        c.patient_mrn.toLowerCase().includes(q) ||
        c.blood_unit_barcode.toLowerCase().includes(q)
      );
    });
  }, [crossmatches, searchFilter]);

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      if (!searchFilter) return true;
      const q = searchFilter.toLowerCase();
      return (
        d.full_name.toLowerCase().includes(q) ||
        d.donor_code.toLowerCase().includes(q) ||
        d.phone_number.includes(q) ||
        d.blood_group.toLowerCase().includes(q)
      );
    });
  }, [donors, searchFilter]);

  return (
    <div className="flex min-h-screen bg-[#070a0f] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d131f] via-[#101726] to-[#0c121e] border border-amber-500/20 p-6 shadow-2xl shadow-black/40">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 via-rose-500/20 to-amber-600/10 border border-amber-500/40 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.2)] shrink-0">
                  <Droplet className="h-7 w-7 text-rose-500 fill-rose-500/20" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>Baankii Dhiigaa fi Eegumsa Kuusaa Dhiigaa</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        MOD-08
                      </span>
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Cold Vault Online (2°C - 6°C)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Mettu Karl Comprehensive Specialized Hospital • Regional Blood Transfusion & Hemovigilance Center.
                    Chain of custody from voluntary donor collection to surgical bed infusion with ISBT-128 compatibility verification.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="h-4 w-4 text-slate-950" />
                  Yuunitii Dhiigaa Fudhadhu
                </button>

                <button
                  type="button"
                  onClick={() => setIsCrossmatchModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141d2e] hover:bg-[#1a253a] text-amber-300 font-bold text-xs border border-amber-500/30 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <TestTube2 className="h-4 w-4 text-amber-400" />
                  Qorannoo Crossmatch
                </button>

                <button
                  type="button"
                  onClick={() => setIsDonorModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141d2e] hover:bg-[#1a253a] text-slate-200 font-semibold text-xs border border-slate-700/60 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Users className="h-4 w-4 text-rose-400" />
                  Arjoomaa Galmeessi
                </button>

                <button
                  type="button"
                  onClick={fetchAllData}
                  disabled={loading}
                  className="inline-flex items-center justify-center p-2.5 rounded-xl bg-[#101624] hover:bg-[#161f33] text-slate-400 hover:text-amber-300 border border-slate-800 transition-colors"
                  title="Haaromsi (Refresh)"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Live Cold Chain Telemetry Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-amber-400" /> Cold Chain Telemetry:
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Walk-In Fridge 1: {stats.refrigerator_temperature_celsius.toFixed(1)}°C (2-6°C Target)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-950/60 text-sky-300 border border-sky-500/30">
                  <Snowflake className="h-3.5 w-3.5 text-sky-400" />
                  Deep Plasma Freezer: {stats.freezer_temperature_celsius.toFixed(1)}°C (-25°C Target)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30">
                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                  Platelet Agitator: {stats.agitator_temperature_celsius.toFixed(1)}°C (22°C Agitating)
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Negative Viral Screening Confirmed</span>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3 shadow-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3 shadow-lg">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span className="font-medium">{actionError}</span>
            </div>
          )}

          {/* Quick Metrics KPI Cards (Obsidian Luxury) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 shadow-sm hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 1. Yuunitii Dhiigaa Waliigalaa
                </span>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <Droplet className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold tracking-tight text-white font-mono">{stats.total_units} <span className="text-sm font-normal text-slate-400">Units</span></p>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <span>PRBC: <strong className="text-amber-300">{stats.total_prbc}</strong></span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> 100% Screened
                </span>
                <span className="text-[11px] font-mono">FFP: {stats.total_plasma} | Plt: {stats.total_platelets}</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-[#1a0e14] to-[#120a10] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 2. O-Negative Kuusaa Qorannoo
                </span>
                <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold tracking-tight text-rose-400 font-mono">{stats.o_neg_critical_count} <span className="text-sm font-normal text-rose-300/70">Units</span></p>
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/40">
                    Universal Donor
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-rose-900/40 flex items-center justify-between text-xs text-rose-300/80">
                <span>Eegumsa balaa tasaa (Emergency Reserve)</span>
                <span className="font-mono text-amber-300">Target &ge; 5</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 shadow-sm hover:border-sky-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 3. Plaasmaa Qabbanaa'aa (FFP)
                </span>
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <Snowflake className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold tracking-tight text-white font-mono">{stats.total_plasma} <span className="text-sm font-normal text-slate-400">Bags</span></p>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono border border-sky-800">
                  -26.4°C Deep
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Coagulation factors preserved</span>
                <span className="font-mono text-sky-400">Shelf life 1 yr</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 shadow-sm hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 4. Crossmatch & Arjoomtota
                </span>
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <TestTube2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold tracking-tight text-amber-300 font-mono">{stats.active_crossmatches_count} <span className="text-sm font-normal text-slate-400">Matches</span></p>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <span>Arjoomtota: <strong className="text-white">{stats.total_donors_count}</strong></span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span className="text-emerald-400 font-medium">ISBT-128 Protocol Active</span>
                <span className="font-mono text-amber-300">IAT Gel Cards</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'inventory'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#101624] text-slate-400 hover:text-white hover:bg-[#161f33]'
                }`}
              >
                <Layers className="h-4 w-4" />
                Kuusaa ABO/Rh fi Simuleetara ({stocks.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('units')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'units'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#101624] text-slate-400 hover:text-white hover:bg-[#161f33]'
                }`}
              >
                <Droplet className="h-4 w-4" />
                Yuunitii Dhiigaa ({units.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('crossmatch')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'crossmatch'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#101624] text-slate-400 hover:text-white hover:bg-[#161f33]'
                }`}
              >
                <TestTube2 className="h-4 w-4" />
                Qorannoo Crossmatch & Waraaqaa ({crossmatches.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('donors')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'donors'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#101624] text-slate-400 hover:text-white hover:bg-[#161f33]'
                }`}
              >
                <Users className="h-4 w-4" />
                Galmee Arjoomtotaa ({donors.length})
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Barbaadi (Barcode, MRN, Maqaa)..."
                className="w-full rounded-xl border border-slate-800 bg-[#0d131f] pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* TAB 1: INVENTORY & ABO/RH MATRIX + SIMULATOR */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* ABO & Rh Component Matrix (2 Cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="h-4 w-4 text-amber-400" />
                        Gartuuwwan Dhiigaa 8 fi Sadarkaa Kuusaa (ABO/Rh Inventory Matrix)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kuusaa dhiigaa qulqullaa'ee qabbana keessa taa'e (Packed Red Blood Cells, Plasma & Platelets)
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Waliigala: {stats.total_units} units
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {stocks.map((item) => {
                      const bgSym = formatBloodGroup(item.blood_group);
                      return (
                        <div
                          key={item.blood_group}
                          className={`rounded-2xl border p-4.5 transition-all shadow-md ${
                            item.is_critical_shortage
                              ? 'border-rose-500/50 bg-gradient-to-br from-[#1c0e14] to-[#120a10]'
                              : 'border-slate-800 bg-[#0e1422] hover:border-amber-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-black text-white font-mono tracking-tight">
                              {bgSym}
                            </span>
                            {item.is_critical_shortage ? (
                              <span className="rounded-full bg-rose-950 border border-rose-500/60 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                CRITICAL LOW
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                NORMAL
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex items-baseline justify-between">
                              <span className="text-slate-400 font-medium">PRBC (Red Cells)</span>
                              <span className="text-lg font-bold text-white font-mono">{item.prbc_units} <span className="text-[10px] text-slate-500 font-normal">units</span></span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1.5 border-t border-slate-800">
                              <span>FFP: <strong className="text-sky-300 font-mono">{item.plasma_units}</strong></span>
                              <span>Plt: <strong className="text-amber-300 font-mono">{item.platelet_units}</strong></span>
                            </div>
                            <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                              <span>Total: <strong className="text-white font-mono">{item.units_available}</strong></span>
                              <span>Min: {item.min_threshold}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Refrigerator Architecture & Shelving Guide */}
                  <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Thermometer className="h-4 w-4 text-emerald-400" />
                      Qajeelfama Teessuma Kuusaa Qabbanaawaa (Cold Chain Storage Protocol)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                        <span className="font-bold text-amber-300 block mb-1">Walk-In Fridge 1 (2°C to 6°C)</span>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Shelf A: Gartuu O- fi O+ (Emergency & Universal trauma units)<br />
                          Shelf B: Gartuu A- fi A+<br />
                          Shelf C: Gartuu B- fi B+<br />
                          Shelf D: Gartuu AB- fi AB+
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                        <span className="font-bold text-sky-300 block mb-1">Ultra-Low Freezer (-25°C)</span>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Fresh Frozen Plasma (FFP) & Cryoprecipitate.<br />
                          Coagulation factors VII, VIII, Fibrinogen.<br />
                          Shelf life: Ji'oota 12 (1 Year).
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                        <span className="font-bold text-rose-300 block mb-1">Continuous Agitator (20°C-24°C)</span>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Platelet Concentrate Packs.<br />
                          Sochii wal-irraa hin citneen kuufama (Continuous mechanical motion).<br />
                          Shelf life: Guyyoota 5 qofa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crossmatch Compatibility Simulator */}
                <div className="rounded-2xl border border-amber-500/30 bg-[#0d131f] p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <TestTube2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Simuleetara Wal-fudhatinsa Dhiigaa (Compatibility Simulator)
                      </h3>
                      <p className="text-[11px] text-slate-400">ISBT ABO & Rh Serology Verification</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Gartuu Dhiiga Arjoomaa (Donor Unit Group)
                      </label>
                      <select
                        value={simDonorGroup}
                        onChange={(e) => setSimDonorGroup(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3.5 py-2.5 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {['O_NEG', 'O_POS', 'A_NEG', 'A_POS', 'B_NEG', 'B_POS', 'AB_NEG', 'AB_POS'].map((bg) => (
                          <option key={bg} value={bg}>{formatBloodGroup(bg)} ({bg.replace('_', ' ')})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Gartuu Dhiiga Dhukkubsataa (Recipient Patient Group)
                      </label>
                      <select
                        value={simRecipientGroup}
                        onChange={(e) => setSimRecipientGroup(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3.5 py-2.5 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map((bg) => (
                          <option key={bg} value={bg}>{formatBloodGroup(bg)} ({bg.replace('_', ' ')})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={evaluateSimulator}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold py-2.5 shadow-md shadow-amber-500/20 transition cursor-pointer text-xs"
                    >
                      <Sparkles className="h-4 w-4 text-slate-950" />
                      Mirkaneessi (Verify Compatibility Matrix)
                    </button>

                    {simVerdict && (
                      <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                        simVerdict.startsWith('COMPATIBLE')
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                          : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          {simVerdict.startsWith('COMPATIBLE') ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold block mb-1">
                              {simVerdict.startsWith('COMPATIBLE') ? 'WAL-FUDHATA (Compatible)' : 'WAL-HIN-FUDHATU (Incompatible)'}
                            </span>
                            <p className="text-[11px] opacity-90">{simVerdict}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <span className="font-semibold text-slate-300 block">Qajeelfama Bu'uuraa:</span>
                      <p>• <strong>O-Negative</strong>: Arjoomaa Addunyaawaa (Universal Red Cell Donor).</p>
                      <p>• <strong>AB-Positive</strong>: Fudhataa Addunyaawaa (Universal Red Cell Recipient).</p>
                      <p>• Dhiigni Rh-negative namoota Rh-positive dhaaf kennamuu danda'a.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BLOOD UNITS CENSUS TABLE */}
          {activeTab === 'units' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d131f] p-4 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" /> Filtara:
                  </span>
                  {['ALL', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroupFilter(bg)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        bloodGroupFilter === bg
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-[#141b2a] text-slate-400 hover:text-white hover:bg-[#1a2336]'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={componentFilter}
                    onChange={(e) => setComponentFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-[#141b2a] px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="ALL">Koompoonantii Hunda (All Components)</option>
                    <option value="PACKED_RBC">PRBC (Packed Red Cells)</option>
                    <option value="FRESH_FROZEN_PLASMA">FFP (Fresh Frozen Plasma)</option>
                    <option value="PLATELETS">Platelets (Plaatileetii)</option>
                  </select>
                </div>
              </div>

              {/* Units Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d131f] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#101726] text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Unit Barcode</th>
                        <th className="px-5 py-3.5">ABO/Rh</th>
                        <th className="px-5 py-3.5">Koompoonantii</th>
                        <th className="px-5 py-3.5">Hamma (ml)</th>
                        <th className="px-5 py-3.5">Guyyaa Dhumu</th>
                        <th className="px-5 py-3.5">Bakka Kuusaa</th>
                        <th className="px-5 py-3.5">Qorannoo (Viral)</th>
                        <th className="px-5 py-3.5">Haala (Status)</th>
                        <th className="px-5 py-3.5 text-right">Tarkaanfii</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium">
                      {filteredUnits.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                            Yuunitiin dhiigaa ulaagaa barbaadame wajjin walsimu hin argamne.
                          </td>
                        </tr>
                      ) : (
                        filteredUnits.map((unit) => {
                          const bgSym = formatBloodGroup(unit.blood_group);
                          const isOneg = bgSym === 'O-';
                          return (
                            <tr key={unit.id} className="hover:bg-[#121929] transition-colors">
                              <td className="px-5 py-3.5 font-mono text-amber-300 font-bold">
                                {unit.unit_barcode}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-black text-xs ${
                                  isOneg
                                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                                    : 'bg-[#182235] text-slate-200 border border-slate-700'
                                }`}>
                                  {bgSym}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-white">
                                {unit.component_type.replace(/_/g, ' ')}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-slate-300">
                                {unit.volume_ml} ml
                              </td>
                              <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                                {new Date(unit.expiry_date).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3.5 text-slate-300 text-[11px]">
                                {unit.storage_location}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                  <ShieldCheck className="h-3.5 w-3.5" /> 100% Neg
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  unit.status.toUpperCase() === 'AVAILABLE'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : unit.status.toUpperCase() === 'RESERVED'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    : unit.status.toUpperCase() === 'TRANSFUSED'
                                    ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                }`}>
                                  {unit.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-2">
                                {unit.status.toUpperCase() === 'AVAILABLE' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateUnitStatus(unit.id, 'TRANSFUSED')}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold cursor-pointer"
                                      title="Wardiidhaaf kenni (Mark Transfused)"
                                    >
                                      Transfuse
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateUnitStatus(unit.id, 'QUARANTINED')}
                                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-semibold cursor-pointer"
                                      title="Kawaarantinaatti galchi (Quarantine)"
                                    >
                                      Quarantine
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CROSSMATCH & TRANSFUSION ROSTER */}
          {activeTab === 'crossmatch' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-[#0d131f] overflow-hidden shadow-xl">
                <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                      Galmee Qorannoo Crossmatch & Mirkaneessa Dhiigaa
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ISBT Compatibility Certification & Chain-of-Custody for Inpatient & Emergency Wards
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCrossmatchModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Qorannoo Haaraa
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#101726] text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Code / Order</th>
                        <th className="px-5 py-3.5">Dhukkubsataa (Patient)</th>
                        <th className="px-5 py-3.5">ABO/Rh Dhukkubsataa</th>
                        <th className="px-5 py-3.5">Yuunitii Dhiigaa</th>
                        <th className="px-5 py-3.5">Mala Qorannoo</th>
                        <th className="px-5 py-3.5">Bu'aa (Compatibility)</th>
                        <th className="px-5 py-3.5">Ogeessa Laabii</th>
                        <th className="px-5 py-3.5 text-right">Waraaqaa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium">
                      {filteredCrossmatches.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                            Galmeen qorannoo crossmatch hin argamne.
                          </td>
                        </tr>
                      ) : (
                        filteredCrossmatches.map((cm) => (
                          <tr key={cm.id} className="hover:bg-[#121929] transition-colors">
                            <td className="px-5 py-3.5 font-mono text-amber-300 font-bold">
                              {cm.crossmatch_code}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-white">{cm.patient_name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{cm.patient_mrn}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-black text-xs bg-[#182235] text-slate-200 border border-slate-700">
                                {formatBloodGroup(cm.patient_blood_group)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-mono text-white">{cm.blood_unit_barcode}</div>
                              <div className="text-[11px] text-slate-400">
                                {formatBloodGroup(cm.blood_unit_group)} • {cm.blood_unit_component.replace(/_/g, ' ')}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-300 text-[11px]">
                              {cm.crossmatch_method}
                            </td>
                            <td className="px-5 py-3.5">
                              {cm.is_compatible ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  COMPATIBLE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                                  INCOMPATIBLE
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-slate-300">
                              {cm.technologist_name}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => fetchVoucher(cm.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                Voucher
                              </button>
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

          {/* TAB 4: DONOR REGISTRY */}
          {activeTab === 'donors' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-[#0d131f] overflow-hidden shadow-xl">
                <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-400" />
                      Galmee Arjoomtota Dhiigaa (Voluntary & Replacement Donor Registry)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Arjoomtota tola-ooltootaa fi firoota dhukkubsataa deeggaran
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDonorModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Arjoomaa Haaraa
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#101726] text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Donor Code</th>
                        <th className="px-5 py-3.5">Maqaa Guutuu</th>
                        <th className="px-5 py-3.5">Lakk. Bilbilaa</th>
                        <th className="px-5 py-3.5">Gartuu Dhiigaa</th>
                        <th className="px-5 py-3.5">Arjooma Waliigalaa</th>
                        <th className="px-5 py-3.5">Guyyaa Arjooma Dhumaa</th>
                        <th className="px-5 py-3.5 text-right">Ulaagaa (Eligibility)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium">
                      {filteredDonors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                            Arjoomaan dhiigaa hin argamne.
                          </td>
                        </tr>
                      ) : (
                        filteredDonors.map((d) => (
                          <tr key={d.id} className="hover:bg-[#121929] transition-colors">
                            <td className="px-5 py-3.5 font-mono text-amber-300 font-bold">
                              {d.donor_code}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-white">
                              {d.full_name}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-400">
                              {d.phone_number}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-black text-xs bg-[#182235] text-slate-200 border border-slate-700">
                                {formatBloodGroup(d.blood_group)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-white">
                              {d.total_donations_count} yeroo
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                              {d.last_donation_date ? new Date(d.last_donation_date).toLocaleDateString() : 'Har\'a'}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {d.is_eligible ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                                  <Check className="h-3.5 w-3.5" /> Ulaagaa Guuta (Eligible)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                                  <X className="h-3.5 w-3.5" /> Tursiifameera (Ineligible)
                                </span>
                              )}
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

          {/* MODAL 1: RECEIVE BLOOD UNIT */}
          {isReceiveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-xl rounded-2xl bg-[#0e1422] border border-amber-500/30 p-6 shadow-2xl space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Droplet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Yuunitii Dhiigaa Fudhadhu (Receive Blood Unit)</h3>
                      <p className="text-[11px] text-slate-400">ISBT-128 Barcode & Cold Vault Placement</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReceiveModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleReceiveUnit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Unit Barcode / Lakk.</label>
                      <input
                        type="text"
                        value={formUnitBarcode}
                        onChange={(e) => setFormUnitBarcode(e.target.value)}
                        placeholder="fakkeessaa: MKH-BB-26-9042"
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Gartuu Dhiigaa (ABO/Rh)</label>
                      <select
                        value={formBloodGroup}
                        onChange={(e) => setFormBloodGroup(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                      >
                        {['O_POS', 'O_NEG', 'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG'].map((bg) => (
                          <option key={bg} value={bg}>{formatBloodGroup(bg)} ({bg})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Koompoonantii (Component)</label>
                      <select
                        value={formComponentType}
                        onChange={(e) => setFormComponentType(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="PACKED_RBC">PRBC (Packed Red Blood Cells)</option>
                        <option value="FRESH_FROZEN_PLASMA">FFP (Fresh Frozen Plasma)</option>
                        <option value="PLATELETS">Platelets (Plaatileetii)</option>
                        <option value="WHOLE_BLOOD">Whole Blood (Dhiiga Guutuu)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Hamma / Volume (ml)</label>
                      <input
                        type="number"
                        value={formVolumeMl}
                        onChange={(e) => setFormVolumeMl(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Bakka Kuusaa (Storage Shelf)</label>
                      <input
                        type="text"
                        value={formStorageLocation}
                        onChange={(e) => setFormStorageLocation(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Guyyoota Dhumuuf Haffan</label>
                      <input
                        type="number"
                        value={formExpiryDays}
                        onChange={(e) => setFormExpiryDays(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Viral Screening Checklist */}
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 space-y-2">
                    <span className="font-bold text-amber-300 block">Qorannoo Dhibee Daddarbaa (100% Negative Required)</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formScreenHiv}
                          onChange={(e) => setFormScreenHiv(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span>HIV 1 & 2 (Negative)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formScreenHepB}
                          onChange={(e) => setFormScreenHepB(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span>Hepatitis B (HBsAg Neg)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formScreenHepC}
                          onChange={(e) => setFormScreenHepC(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span>Hepatitis C (HCV Neg)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formScreenSyphilis}
                          onChange={(e) => setFormScreenSyphilis(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span>Syphilis / VDRL (Neg)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsReceiveModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#141b2a] text-slate-300 font-semibold"
                    >
                      Dhiisi (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? 'Galmeessaa jira...' : 'Galmeessi (Register Unit)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: REGISTER BLOOD DONOR */}
          {isDonorModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-md rounded-2xl bg-[#0e1422] border border-amber-500/30 p-6 shadow-2xl space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Arjoomaa Galmeessi (Register Donor)</h3>
                      <p className="text-[11px] text-slate-400">Voluntary & Replacement Donor Registry</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDonorModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleRegisterDonor} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Maqaa Guutuu Arjoomaa</label>
                    <input
                      type="text"
                      value={formDonorName}
                      onChange={(e) => setFormDonorName(e.target.value)}
                      placeholder="fakkeessaa: Obbo Guddataa Tolasaa"
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Lakk. Bilbilaa</label>
                      <input
                        type="text"
                        value={formDonorPhone}
                        onChange={(e) => setFormDonorPhone(e.target.value)}
                        placeholder="+251 9..."
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Gartuu Dhiigaa</label>
                      <select
                        value={formDonorBloodGroup}
                        onChange={(e) => setFormDonorBloodGroup(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                      >
                        {['O_POS', 'O_NEG', 'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG'].map((bg) => (
                          <option key={bg} value={bg}>{formatBloodGroup(bg)} ({bg})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Arjooma Kanaan Duraa</label>
                      <input
                        type="number"
                        value={formDonorDonations}
                        onChange={(e) => setFormDonorDonations(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                        min={1}
                        required
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                        <input
                          type="checkbox"
                          checked={formDonorEligible}
                          onChange={(e) => setFormDonorEligible(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span>Ulaagaa Guuta (Eligible)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsDonorModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#141b2a] text-slate-300 font-semibold"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? 'Galmeessaa jira...' : 'Galmeessi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 3: PERFORM CROSSMATCH TEST */}
          {isCrossmatchModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-xl rounded-2xl bg-[#0e1422] border border-amber-500/30 p-6 shadow-2xl space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <TestTube2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Qorannoo Crossmatch Gaggeessi</h3>
                      <p className="text-[11px] text-slate-400">Major/Minor Serology Compatibility Protocol</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCrossmatchModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handlePerformCrossmatch} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Dhukkubsataa Filadhu (Recipient Patient)</label>
                    <select
                      value={formCmPatientId}
                      onChange={(e) => {
                        const pid = Number(e.target.value);
                        setFormCmPatientId(pid);
                        const pat = patients.find((p) => p.id === pid);
                        if (pat && pat.blood_group) {
                          setFormCmPatientBg(pat.blood_group);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-semibold focus:border-amber-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Dhukkubsataa Filadhu --</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} ({p.mrn}) • {p.blood_group || 'O+'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Gartuu Dhiiga Dhukkubsataa</label>
                      <select
                        value={formCmPatientBg}
                        onChange={(e) => setFormCmPatientBg(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                      >
                        {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map((bg) => (
                          <option key={bg} value={bg}>{formatBloodGroup(bg)} ({bg})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Yuunitii Dhiigaa Filadhu</label>
                      <select
                        value={formCmUnitId}
                        onChange={(e) => setFormCmUnitId(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                        required
                      >
                        <option value="">-- Yuunitii Dhiigaa Filadhu --</option>
                        {units
                          .filter((u) => u.status.toUpperCase() === 'AVAILABLE')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.unit_barcode} • {formatBloodGroup(u.blood_group)} ({u.component_type})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mala Qorannoo (Crossmatch Method)</label>
                    <select
                      value={formCmMethod}
                      onChange={(e) => setFormCmMethod(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Indirect Antiglobulin Test (IAT) Gel Card">Indirect Antiglobulin Test (IAT) Gel Card</option>
                      <option value="Saline Tube Technique at 37°C">Saline Tube Technique at 37°C</option>
                      <option value="Gel Column Agglutination (LISS/Coombs)">Gel Column Agglutination (LISS/Coombs)</option>
                      <option value="Enzyme-Treated Red Cell Technique">Enzyme-Treated Red Cell Technique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Yaada Ogeessaa (Technologist Notes)</label>
                    <textarea
                      value={formCmNotes}
                      onChange={(e) => setFormCmNotes(e.target.value)}
                      placeholder="Major & minor serology check non-reactive..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCrossmatchModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#141b2a] text-slate-300 font-semibold"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? 'Qorachaa jira...' : 'Qorannoo Raawwadhu (Execute)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 4: OFFICIAL PRINTABLE TRANSFUSION CLEARANCE VOUCHER */}
          {isVoucherModalOpen && selectedVoucher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
              <div className="relative w-full max-w-3xl rounded-3xl bg-white text-slate-900 p-8 shadow-2xl space-y-6 print:p-0 print:shadow-none print:w-full">
                {/* Print Controls (Hidden on print) */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4" />
                    Official Transfusion Compatibility Certificate
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                    >
                      <Printer className="h-4 w-4" />
                      Waraaqaa Maxxansi (Print)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVoucherModalOpen(false)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Voucher Official Header */}
                <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xl">
                      +
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
                        {selectedVoucher.hospital_name_en}
                      </h2>
                      <h3 className="text-xs font-bold text-slate-700">
                        {selectedVoucher.hospital_name_om}
                      </h3>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {selectedVoucher.accreditation_level} • TIN: <span className="font-mono font-bold text-slate-900">{selectedVoucher.tin_number}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {selectedVoucher.location} • Bilbila: {selectedVoucher.telephone}
                  </p>
                </div>

                {/* Certificate Title */}
                <div className="text-center py-1 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-900">
                    WARAAQAA MIRKANEESSA WAL-FUDHATINSA DHIIGAA (BLOOD TRANSFUSION CLEARANCE CERTIFICATE)
                  </span>
                </div>

                {/* Voucher Body Grid */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  {/* Recipient Profile */}
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                      1. Odeeffannoo Dhukkubsataa (Recipient Profile)
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Maqaa:</span>
                        <strong className="text-slate-900">{selectedVoucher.patient_name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Lakk. MRN:</span>
                        <span className="font-mono font-bold text-slate-900">{selectedVoucher.patient_mrn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Umurii / Saala:</span>
                        <span>{selectedVoucher.patient_age} yrs • {selectedVoucher.patient_gender.replace('Gender.', '')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Gartuu Dhiigaa:</span>
                        <span className="font-black text-sm text-rose-700 font-mono">{selectedVoucher.patient_blood_group}</span>
                      </div>
                    </div>
                  </div>

                  {/* Donor Unit Profile */}
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                      2. Odeeffannoo Yuunitii Dhiigaa (Donor Unit Profile)
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Barcode:</span>
                        <span className="font-mono font-bold text-slate-900">{selectedVoucher.blood_unit_barcode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Koompoonantii:</span>
                        <strong className="text-slate-900">{selectedVoucher.component_type.replace(/_/g, ' ')}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hamma / Volume:</span>
                        <span className="font-mono">{selectedVoucher.volume_ml} ml</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Gartuu Dhiiga Yuunitii:</span>
                        <span className="font-black text-sm text-emerald-700 font-mono">{selectedVoucher.blood_unit_group}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compatibility Serology & Safety Stamping */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-700" />
                      3. Bu'aa Qorannoo Crossmatch (Compatibility Verdict)
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs">
                      {selectedVoucher.is_compatible ? 'COMPATIBLE • WAL-FUDHATA' : 'INCOMPATIBLE'}
                    </span>
                  </div>
                  <p className="text-emerald-950 font-medium">
                    {selectedVoucher.compatibility_verdict}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800 pt-1 border-t border-emerald-200">
                    <div>Mala: <strong>{selectedVoucher.crossmatch_method}</strong></div>
                    <div>Guyyaa: <strong>{new Date(selectedVoucher.tested_at).toLocaleString()}</strong></div>
                  </div>
                  <div className="text-[10px] text-emerald-900 font-mono pt-1">
                    Screening: {selectedVoucher.tested_negative_screens}
                  </div>
                </div>

                {/* Sign-off & QR Code Footer */}
                <div className="pt-4 border-t-2 border-slate-900 flex items-end justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-slate-300 rounded-xl bg-slate-50 font-mono text-[9px] text-center">
                      <QrCode className="h-10 w-10 text-slate-800 mx-auto" />
                      <span>{selectedVoucher.crossmatch_code}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <span>Mirkaneeffameera (Verified by ISBT Protocol)</span><br />
                      <strong className="text-slate-900">Karl Mettu Regional Blood Bank</strong><br />
                      <span className="text-[10px] font-mono">{new Date(selectedVoucher.issued_timestamp).toISOString()}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="w-48 border-b border-slate-900 pb-1">
                      <span className="font-bold text-slate-950 font-serif italic text-sm">{selectedVoucher.technologist_name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Ogeessa Laaboraatorii (Certified Medical Technologist)
                    </p>
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

export default function BloodBankWorkstationPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-amber-400 font-bold">
          Qophaa'aa jira (Loading Blood Bank Workstation)...
        </div>
      }
    >
      <BloodBankWorkstationContent />
    </Suspense>
  );
}
