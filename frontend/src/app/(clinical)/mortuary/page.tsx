'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Archive,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  FileText,
  Clock,
  User,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Printer,
  X,
  Plus,
  Stethoscope,
  Activity,
  Calendar,
  Building2,
  FileCheck,
  Lock,
  ChevronRight,
  ExternalLink,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

const API_BASE = '';

interface MortuaryStats {
  total_vaults: number;
  occupied_vaults: number;
  vacant_vaults: number;
  maintenance_vaults: number;
  total_deceased_admitted: number;
  total_released: number;
  total_autopsies: number;
  avg_storage_temp: number;
}

interface BodyVaultItem {
  id: number;
  vault_code: string;
  vault_number?: string;
  bay_name?: string;
  temperature_celsius: number;
  status: 'occupied' | 'vacant' | 'maintenance' | string;
  occupant_name?: string;
  occupant_tag?: string;
  occupant_dod?: string;
}

interface MortuaryRecordItem {
  id: number;
  tag_number: string;
  patient_id?: number | null;
  deceased_name: string;
  gender: string;
  datetime_of_death: string;
  cause_of_death: string;
  declaring_doctor_name: string;
  body_vault_id?: number | null;
  vault_id?: number | null;
  vault_code?: string | null;
  death_certificate_number?: string | null;
  is_autopsy_conducted: boolean;
  autopsy_findings?: string | null;
  pathologist_name?: string | null;
  autopsy_date?: string | null;
  burial_permit_number?: string | null;
  police_case_number?: string | null;
  received_at: string;
  released_at?: string | null;
  released_to_name?: string | null;
  released_to_relationship?: string | null;
  contact_kin_name?: string | null;
  contact_kin_phone?: string | null;
  released_to_kin: boolean;
}

interface MortuaryVoucher {
  hospital_name: string;
  hospital_subtitle: string;
  tin_number: string;
  telephone: string;
  voucher_id: string;
  tag_number: string;
  death_certificate_number: string;
  deceased_name: string;
  gender: string;
  datetime_of_death: string;
  cause_of_death: string;
  declaring_doctor_name: string;
  vault_code: string;
  bay_name: string;
  temperature_recorded: string;
  received_at: string;
  is_autopsy_conducted: boolean;
  pathologist_name?: string | null;
  autopsy_findings?: string | null;
  released_at?: string | null;
  released_to_name?: string | null;
  released_to_relationship?: string | null;
  contact_kin_phone?: string | null;
  burial_permit_number?: string | null;
  police_case_number?: string | null;
  verification_qr: string;
}

const INITIAL_STATS: MortuaryStats = {
  total_vaults: 8,
  occupied_vaults: 3,
  vacant_vaults: 4,
  maintenance_vaults: 1,
  total_deceased_admitted: 5,
  total_released: 2,
  total_autopsies: 1,
  avg_storage_temp: 3.0,
};

function MortuaryWorkstationContent(): React.ReactElement {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // Primary State
  const [stats, setStats] = useState<MortuaryStats>(INITIAL_STATS);
  const [vaults, setVaults] = useState<BodyVaultItem[]>([]);
  const [records, setRecords] = useState<MortuaryRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'vaults' | 'registry' | 'autopsy' | 'releases'>('vaults');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isAutopsyModalOpen, setIsAutopsyModalOpen] = useState(false);
  const [selectedRecordForAutopsy, setSelectedRecordForAutopsy] = useState<MortuaryRecordItem | null>(null);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedRecordForRelease, setSelectedRecordForRelease] = useState<MortuaryRecordItem | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<MortuaryVoucher | null>(null);

  // Form: Admit Deceased
  const [admitName, setAdmitName] = useState('');
  const [admitGender, setAdmitGender] = useState('MALE');
  const [admitDateOfDeath, setAdmitDateOfDeath] = useState(() => new Date().toISOString().split('T')[0]);
  const [admitTimeOfDeath, setAdmitTimeOfDeath] = useState('10:00');
  const [admitCause, setAdmitCause] = useState('');
  const [admitDoctor, setAdmitDoctor] = useState('Dr. Chala Worku');
  const [admitVaultId, setAdmitVaultId] = useState<number | ''>('');
  const [admitKinName, setAdmitKinName] = useState('');
  const [admitKinPhone, setAdmitKinPhone] = useState('');

  // Form: Autopsy
  const [autopsyPathologist, setAutopsyPathologist] = useState('Dr. Daniel Gemechu (Forensic Pathologist)');
  const [autopsyFindings, setAutopsyFindings] = useState('');
  const [autopsyConfirmedCause, setAutopsyConfirmedCause] = useState('');
  const [autopsyPoliceCase, setAutopsyPoliceCase] = useState('');

  // Form: Release
  const [releaseKinName, setReleaseKinName] = useState('');
  const [releaseKinRelationship, setReleaseKinRelationship] = useState('Son');
  const [releaseKinPhone, setReleaseKinPhone] = useState('');
  const [releaseCertNumber, setReleaseCertNumber] = useState('');
  const [releaseBurialPermit, setReleaseBurialPermit] = useState('');

  // Notifications
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Fetch Live Data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, vaultsRes, recsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/mortuary/stats`),
        fetch(`${API_BASE}/api/v1/mortuary/vaults`),
        fetch(`${API_BASE}/api/v1/mortuary/records?filter_type=all`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (vaultsRes.ok) setVaults(await vaultsRes.json());
      if (recsRes.ok) setRecords(await recsRes.json());
    } catch (err: any) {
      console.error('Error fetching mortuary data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Query Param Navigation
    const tabParam = searchParams.get('tab');
    if (tabParam && ['vaults', 'registry', 'autopsy', 'releases'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    const voucherParam = searchParams.get('voucher');
    if (voucherParam) {
      fetchVoucher(Number(voucherParam));
    }
  }, [searchParams]);

  // Fetch Voucher
  const fetchVoucher = async (recordId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/mortuary/records/${recordId}/voucher`);
      if (!res.ok) throw new Error('Voucher retrieval failed');
      const data = await res.json();
      setSelectedVoucher(data);
      setIsVoucherModalOpen(true);
    } catch (err: any) {
      setActionError(err.message || 'Waraaqaa ragaa dufaa fiduun hin dandaamne');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Admission
  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitName || !admitCause) {
      setActionError('Maqaa fi sababa dufaa galchuun dirqama');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      const res = await fetch(`${API_BASE}/api/v1/mortuary/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deceased_name: admitName,
          gender: admitGender,
          date_of_death: admitDateOfDeath,
          time_of_death: `${admitTimeOfDeath}:00`,
          cause_of_death: admitCause,
          certifying_physician: admitDoctor,
          body_vault_id: admitVaultId ? Number(admitVaultId) : null,
          contact_kin_name: admitKinName,
          contact_kin_phone: admitKinPhone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Galmeen reeffaa hin milkoofne');
      }

      const newRec = await res.json();
      setActionSuccess(`Reeffi kabajamaa/tuu ${admitName} milkaa'inaan kutaa reeffaatti galmaa'eera (Tag: ${newRec.tag_number})`);
      setIsAdmitModalOpen(false);
      resetAdmitForm();
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const resetAdmitForm = () => {
    setAdmitName('');
    setAdmitCause('');
    setAdmitVaultId('');
    setAdmitKinName('');
    setAdmitKinPhone('');
  };

  // Submit Autopsy
  const handleAutopsySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAutopsy || !autopsyFindings) {
      setActionError('Bu\'aa qorannoo post-mortem galchuun dirqama');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      const res = await fetch(`${API_BASE}/api/v1/mortuary/records/${selectedRecordForAutopsy.id}/autopsy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathologist_name: autopsyPathologist,
          autopsy_findings: autopsyFindings,
          confirmed_cause_of_death: autopsyConfirmedCause || selectedRecordForAutopsy.cause_of_death,
          police_case_number: autopsyPoliceCase || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Qorannoo post-mortem galmeessuun hin dandaamne');
      }

      setActionSuccess(`Qorannoon post-mortem reeffa ${selectedRecordForAutopsy.deceased_name} seeraan galmaa'eera.`);
      setIsAutopsyModalOpen(false);
      setSelectedRecordForAutopsy(null);
      setAutopsyFindings('');
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Release to Kin
  const handleReleaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForRelease || !releaseKinName) {
      setActionError('Maqaa fira dhiyoo reeffa fudhatuu galchuun dirqama');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      const res = await fetch(`${API_BASE}/api/v1/mortuary/records/${selectedRecordForRelease.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          released_to_name: releaseKinName,
          released_to_relationship: releaseKinRelationship,
          contact_kin_phone: releaseKinPhone,
          death_certificate_number: releaseCertNumber || selectedRecordForRelease.death_certificate_number,
          burial_permit_number: releaseBurialPermit || `BP-MKH-${String(selectedRecordForRelease.id).padStart(4, '0')}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Reeffa gadhiisuun hin dandaamne');
      }

      setActionSuccess(`Reeffi ${selectedRecordForRelease.deceased_name} seeraan maatiitti dabarfamee jira.`);
      setIsReleaseModalOpen(false);
      const freedRecId = selectedRecordForRelease.id;
      setSelectedRecordForRelease(null);
      await fetchAllData();
      fetchVoucher(freedRecId);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering Vaults
  const filteredVaults = useMemo(() => {
    return vaults.filter((v) => {
      const matchSearch =
        v.vault_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (v.bay_name && v.bay_name.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (v.occupant_name && v.occupant_name.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (v.occupant_tag && v.occupant_tag.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || v.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [vaults, searchFilter, statusFilter]);

  // Filtering Records
  const inCustodyRecords = useMemo(() => records.filter((r) => !r.released_at), [records]);
  const releasedRecords = useMemo(() => records.filter((r) => r.released_at), [records]);
  const autopsyRecords = useMemo(() => records.filter((r) => r.is_autopsy_conducted), [records]);

  const filteredRegistry = useMemo(() => {
    return records.filter((r) => {
      return (
        r.deceased_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.tag_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.cause_of_death.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (r.death_certificate_number && r.death_certificate_number.toLowerCase().includes(searchFilter.toLowerCase()))
      );
    });
  }, [records, searchFilter]);

  return (
    <div className="flex min-h-screen bg-[#070a0f] text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] w-full mx-auto">
          {/* Top Banner */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-[#0d131f] border border-[#1e293b] p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
                <Archive className="h-7 w-7 text-blue-200" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Kutaa Reeffaa & Qorannoo Post-Mortem
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/80">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    Cold Chamber Custody (2°C - 4°C)
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Mettu Karl Referral Hospital • Cold Body Storage Units • Forensic Autopsy & Legal Deceased Release
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <button
                onClick={() => setIsAdmitModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Reeffa Haaraa Galmeessi
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {actionSuccess && (
            <div className="flex items-center justify-between bg-emerald-950/80 border border-emerald-800 text-emerald-200 px-5 py-3.5 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-medium">{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {actionError && (
            <div className="flex items-center justify-between bg-rose-950/80 border border-rose-800 text-rose-200 px-5 py-3.5 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                <span className="text-sm font-medium">{actionError}</span>
              </div>
              <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* KPI Statistics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-[#0d131f] border border-[#1e293b] p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Vaults Hunda</span>
                <Archive className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.total_vaults}</p>
              <p className="text-xs text-slate-500 mt-1">Refrigerated bays</p>
            </div>

            <div className="bg-[#0d131f] border border-[#1e293b] p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Reeffa Qabame</span>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-amber-400 mt-2">{stats.occupied_vaults}</p>
              <p className="text-xs text-slate-500 mt-1">Occupied cold vaults</p>
            </div>

            <div className="bg-[#0d131f] border border-[#1e293b] p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Vault Duwwaa</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.vacant_vaults}</p>
              <p className="text-xs text-slate-500 mt-1">Available for intake</p>
            </div>

            <div className="bg-[#0d131f] border border-[#1e293b] p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Temp giddugaleessaa</span>
                <Thermometer className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400 mt-2">{stats.avg_storage_temp}°C</p>
              <p className="text-xs text-slate-500 mt-1">Target: 2.0°C - 4.0°C</p>
            </div>

            <div className="bg-[#0d131f] border border-[#1e293b] p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Post-Mortem Autopsy</span>
                <Stethoscope className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400 mt-2">{stats.total_autopsies}</p>
              <p className="text-xs text-slate-500 mt-1">Forensic examinations</p>
            </div>

            <div className="bg-[#0d131f] border border-[#1e293b] p-4 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Maatiitti Kan Kenname</span>
                <FileCheck className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400 mt-2">{stats.total_released}</p>
              <p className="text-xs text-slate-500 mt-1">Legal next-of-kin release</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('vaults')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'vaults'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Kutaa Vault (Chamber Matrix) ({vaults.length})
              </button>
              <button
                onClick={() => setActiveTab('registry')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'registry'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Galmee Reeffaa (Custody Census) ({inCustodyRecords.length})
              </button>
              <button
                onClick={() => setActiveTab('autopsy')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'autopsy'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Qorannoo Post-Mortem & Forensic ({autopsyRecords.length})
              </button>
              <button
                onClick={() => setActiveTab('releases')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'releases'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Baasii Seera Qabeessa (Released) ({releasedRecords.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Barbaadi maqaa, tag, lakk. vault..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[#0d131f] border border-[#1e293b] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>

              {activeTab === 'vaults' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#0d131f] border border-[#1e293b] rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Status Hunda</option>
                  <option value="OCCUPIED">Occupied (Qabame)</option>
                  <option value="VACANT">Vacant (Duwwaa)</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              )}
            </div>
          </div>

          {/* TAB 1: COLD VAULT MATRIX */}
          {activeTab === 'vaults' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredVaults.map((vault) => {
                const isOccupied = vault.status.toLowerCase() === 'occupied';
                const isVacant = vault.status.toLowerCase() === 'vacant';
                const isMaint = vault.status.toLowerCase() === 'maintenance';

                return (
                  <div
                    key={vault.id}
                    className={`bg-[#0d131f] border rounded-2xl p-5 shadow-lg transition-all relative overflow-hidden ${
                      isOccupied
                        ? 'border-amber-500/40 hover:border-amber-500/80 shadow-amber-950/20'
                        : isVacant
                        ? 'border-emerald-500/30 hover:border-emerald-500/70'
                        : 'border-slate-700/60'
                    }`}
                  >
                    {/* Top Status Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white tracking-wide">{vault.vault_code}</span>
                        <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          {vault.bay_name}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isOccupied
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                            : isVacant
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {vault.status}
                      </span>
                    </div>

                    {/* Cold Chamber Thermometer */}
                    <div className="mt-4 p-3 rounded-xl bg-[#070a0f] border border-[#1e293b] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer
                          className={`h-5 w-5 ${
                            vault.temperature_celsius > 4.0
                              ? 'text-rose-400 animate-pulse'
                              : 'text-cyan-400'
                          }`}
                        />
                        <div>
                          <p className="text-xs text-slate-400">Ho'a Kutaa (Temperature)</p>
                          <p className="text-base font-bold text-white">{vault.temperature_celsius.toFixed(1)}°C</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        Preservation Optimal
                      </span>
                    </div>

                    {/* Occupant Details or Vacant State */}
                    <div className="mt-4 pt-3 border-t border-[#1e293b]/70 min-h-[90px]">
                      {isOccupied ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Reeffa (Deceased):</span>
                            <span className="text-xs font-mono text-amber-400">{vault.occupant_tag}</span>
                          </div>
                          <p className="text-sm font-bold text-white truncate">{vault.occupant_name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            DoD: {vault.occupant_dod || 'Kaleessa'}
                          </p>
                        </div>
                      ) : isVacant ? (
                        <div className="flex flex-col items-center justify-center py-2 text-center text-slate-500">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500/60 mb-1" />
                          <span className="text-xs font-medium text-slate-400">Kutaan Duwwaadha</span>
                          <span className="text-[11px] text-slate-600">Qophii Reeffa Fudhatuu</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2 text-center text-slate-500">
                          <AlertTriangle className="h-6 w-6 text-amber-500/60 mb-1" />
                          <span className="text-xs font-medium text-slate-400">Suphaa Irra Jira</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between gap-2">
                      {isOccupied ? (
                        <>
                          <button
                            onClick={() => {
                              const rec = records.find((r) => r.body_vault_id === vault.id && !r.released_at);
                              if (rec) {
                                setSelectedRecordForAutopsy(rec);
                                setIsAutopsyModalOpen(true);
                              }
                            }}
                            className="flex-1 py-1.5 px-2 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 rounded-lg text-xs font-medium text-purple-300 transition-colors flex items-center justify-center gap-1"
                          >
                            <Stethoscope className="h-3.5 w-3.5" />
                            Autopsy
                          </button>
                          <button
                            onClick={() => {
                              const rec = records.find((r) => r.body_vault_id === vault.id && !r.released_at);
                              if (rec) {
                                setSelectedRecordForRelease(rec);
                                setReleaseKinName(rec.contact_kin_name || '');
                                setReleaseKinPhone(rec.contact_kin_phone || '');
                                setIsReleaseModalOpen(true);
                              }
                            }}
                            className="flex-1 py-1.5 px-2 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 rounded-lg text-xs font-medium text-blue-300 transition-colors flex items-center justify-center gap-1"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            Gadhiisi
                          </button>
                        </>
                      ) : isVacant ? (
                        <button
                          onClick={() => {
                            setAdmitVaultId(vault.id);
                            setIsAdmitModalOpen(true);
                          }}
                          className="w-full py-1.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg text-xs font-medium text-emerald-300 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Reeffa Asitti Galmeessi
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed text-center"
                        >
                          Maintenance Mode
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: DECEASED REGISTRY (CENSUS) */}
          {activeTab === 'registry' && (
            <div className="bg-[#0d131f] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Galmee Reeffaa Hospitaalaa (Deceased Registry)</h3>
                  <p className="text-xs text-slate-400">Ragaa du'aa, ogeessa mirkaneesse, fi qabiinsa kutaa reeffaa</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                  {filteredRegistry.length} Galmeewwan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#070a0f] text-xs uppercase font-semibold text-slate-400 border-b border-[#1e293b]">
                    <tr>
                      <th className="px-5 py-3.5">Tag & Deceased</th>
                      <th className="px-5 py-3.5">Saala</th>
                      <th className="px-5 py-3.5">Guyyaa & Sa'aatii Du'aa</th>
                      <th className="px-5 py-3.5">Sababa Du'aa (Clinical Cause)</th>
                      <th className="px-5 py-3.5">Ogeessa Yaalaa</th>
                      <th className="px-5 py-3.5">Vault</th>
                      <th className="px-5 py-3.5">Haala Custody</th>
                      <th className="px-5 py-3.5 text-right">Tarkaanfii</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {filteredRegistry.map((rec) => {
                      const isCustody = !rec.released_at;
                      return (
                        <tr key={rec.id} className="hover:bg-[#101726]/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-white">{rec.deceased_name}</p>
                                <p className="text-xs font-mono text-amber-400">{rec.tag_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-300">
                            {rec.gender}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-400">
                            {new Date(rec.datetime_of_death).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-xs font-medium text-slate-200 max-w-xs truncate" title={rec.cause_of_death}>
                            {rec.cause_of_death}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-300">
                            {rec.declaring_doctor_name}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            {rec.vault_code ? (
                              <span className="font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                {rec.vault_code}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {isCustody ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                In Custody
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                <CheckCircle2 className="h-3 w-3" />
                                Released
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isCustody && (
                                <button
                                  onClick={() => {
                                    setSelectedRecordForRelease(rec);
                                    setReleaseKinName(rec.contact_kin_name || '');
                                    setReleaseKinPhone(rec.contact_kin_phone || '');
                                    setIsReleaseModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800/50 border border-blue-700/60 text-blue-300 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Gadhiisi
                                </button>
                              )}
                              <button
                                onClick={() => fetchVoucher(rec.id)}
                                className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/60 text-amber-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                <Printer className="h-3 w-3" />
                                Voucher
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOPSY & FORENSIC PATHOLOGY */}
          {activeTab === 'autopsy' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-[#0d131f] border border-[#1e293b] p-5 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-white">Qorannoo Post-Mortem & Forensic Pathology</h3>
                  <p className="text-xs text-slate-400">Qorannoo seera qabeessa reeffaa fi gabaasa ogeessa falaasama fayyaa (Pathologist)</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  {autopsyRecords.length} Autopsies Done
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {records.map((rec) => {
                  return (
                    <div
                      key={rec.id}
                      className={`bg-[#0d131f] border rounded-2xl p-5 shadow-lg relative overflow-hidden ${
                        rec.is_autopsy_conducted ? 'border-purple-600/50' : 'border-[#1e293b]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono text-purple-400">{rec.tag_number}</span>
                          <h4 className="text-lg font-bold text-white mt-0.5">{rec.deceased_name}</h4>
                        </div>
                        {rec.is_autopsy_conducted ? (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Autopsy Completed
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-400">
                            Pending Clinical Decision
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Sababa Du'aa Duraa:</span>
                          <span className="font-semibold text-slate-200">{rec.cause_of_death}</span>
                        </div>
                        {rec.police_case_number && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Lakk. Galmee Poolisii:</span>
                            <span className="font-mono text-amber-400">{rec.police_case_number}</span>
                          </div>
                        )}
                        {rec.pathologist_name && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Ogeessa Qorannoo (Pathologist):</span>
                            <span className="font-semibold text-purple-300">{rec.pathologist_name}</span>
                          </div>
                        )}
                      </div>

                      {rec.autopsy_findings && (
                        <div className="mt-4 p-3.5 rounded-xl bg-[#070a0f] border border-purple-900/40">
                          <p className="text-xs font-semibold text-purple-300 mb-1">Gabaasa Bu'aa Qorannoo:</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{rec.autopsy_findings}</p>
                        </div>
                      )}

                      <div className="mt-5 pt-3 border-t border-[#1e293b] flex items-center justify-between">
                        {!rec.is_autopsy_conducted ? (
                          <button
                            onClick={() => {
                              setSelectedRecordForAutopsy(rec);
                              setIsAutopsyModalOpen(true);
                            }}
                            className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/80 rounded-xl text-xs font-semibold text-purple-200 transition-colors flex items-center gap-1.5"
                          >
                            <Stethoscope className="h-4 w-4" />
                            Qorannoo Autopsy Galmeessi
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Forensic Protocol Certified</span>
                        )}

                        <button
                          onClick={() => fetchVoucher(rec.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Gabaasa Seera Qabeessa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: LEGAL RELEASES (MAATIITTI KAN KENNAMAN) */}
          {activeTab === 'releases' && (
            <div className="bg-[#0d131f] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-[#1e293b] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Ragaa Baasii Reeffaa Seera Qabeessa (Next-of-Kin Handover)</h3>
                  <p className="text-xs text-slate-400">Ragaa koodii waraaqaa du'aa, hayyama awwaalchaa, fi mallattoo maatii</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {releasedRecords.length} Released
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#070a0f] text-xs uppercase font-semibold text-slate-400 border-b border-[#1e293b]">
                    <tr>
                      <th className="px-5 py-3.5">Deceased Details</th>
                      <th className="px-5 py-3.5">Waraaqaa Du'aa (Cert #)</th>
                      <th className="px-5 py-3.5">Fira Fudhate (Released To)</th>
                      <th className="px-5 py-3.5">Firooma</th>
                      <th className="px-5 py-3.5">Bilbila Firaa</th>
                      <th className="px-5 py-3.5">Yeroo Baasii</th>
                      <th className="px-5 py-3.5">Hayyama Awwaalchaa</th>
                      <th className="px-5 py-3.5 text-right">Waraaqaa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {releasedRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#101726]/60 transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-white">{rec.deceased_name}</p>
                            <p className="text-xs font-mono text-amber-400">{rec.tag_number}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-cyan-300">
                          {rec.death_certificate_number || '—'}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-200">
                          {rec.released_to_name || 'Next of Kin'}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-300">
                          {rec.released_to_relationship || 'Family'}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-400">
                          {rec.contact_kin_phone || '—'}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          {rec.released_at ? new Date(rec.released_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-emerald-400">
                          {rec.burial_permit_number || `BP-MKH-${String(rec.id).padStart(4, '0')}`}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => fetchVoucher(rec.id)}
                            className="px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/60 text-amber-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ml-auto"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Maxxansi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODAL 1: ADMIT DECEASED */}
          {isAdmitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#0d131f] border border-[#1e293b] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#101726]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Reeffa Haaraa Galmeessi (Mortuary Intake)</h3>
                      <p className="text-xs text-slate-400">Galmee reeffaa kutaa qabbaneessaa (Cold Vault Storage)</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAdmitModalOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAdmitSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Maqaa Guutuu Reeffaa *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Fkn: Tadesse Gemechu"
                        value={admitName}
                        onChange={(e) => setAdmitName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Saala (Gender) *
                      </label>
                      <select
                        value={admitGender}
                        onChange={(e) => setAdmitGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="MALE">Dhiira (Male)</option>
                        <option value="FEMALE">Dhalaa (Female)</option>
                        <option value="UNKNOWN">Hin Beekamne (Unknown / Doe)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Guyyaa Du'aa (Date of Death) *
                      </label>
                      <input
                        type="date"
                        required
                        value={admitDateOfDeath}
                        onChange={(e) => setAdmitDateOfDeath(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Sa'aatii Du'aa (Time of Death) *
                      </label>
                      <input
                        type="time"
                        required
                        value={admitTimeOfDeath}
                        onChange={(e) => setAdmitTimeOfDeath(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sababa Du'aa (Primary Cause of Death) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Fkn: Acute Myocardial Infarction / Severe Trauma"
                      value={admitCause}
                      onChange={(e) => setAdmitCause(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Ogeessa Yaalaa Mirkaneesse (Certifying Doctor)
                      </label>
                      <input
                        type="text"
                        value={admitDoctor}
                        onChange={(e) => setAdmitDoctor(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Kutaa Vault Ramadi (Cold Vault)
                      </label>
                      <select
                        value={admitVaultId}
                        onChange={(e) => setAdmitVaultId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Filadhaa (Duwwaa Qofa) --</option>
                        {vaults
                          .filter((v) => v.status.toLowerCase() === 'vacant')
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.vault_code} ({v.bay_name}) - {v.temperature_celsius}°C
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Maqaa Fira Dhiyoo (Next-of-Kin Name)
                      </label>
                      <input
                        type="text"
                        placeholder="Fkn: Almaz Tadesse (Daughter)"
                        value={admitKinName}
                        onChange={(e) => setAdmitKinName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Bilbila Fira Dhiyoo (Kin Phone)
                      </label>
                      <input
                        type="tel"
                        placeholder="+251 9..."
                        value={admitKinPhone}
                        onChange={(e) => setAdmitKinPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                    <button
                      type="button"
                      onClick={() => setIsAdmitModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      {actionLoading ? 'Galmeessaa jira...' : 'Galmeessi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: PERFORM AUTOPSY */}
          {isAutopsyModalOpen && selectedRecordForAutopsy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#0d131f] border border-[#1e293b] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#101726]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Qorannoo Post-Mortem Galmeessi</h3>
                      <p className="text-xs text-slate-400">
                        {selectedRecordForAutopsy.deceased_name} ({selectedRecordForAutopsy.tag_number})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsAutopsyModalOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAutopsySubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Maqaa Ogeessa Qorannoo (Pathologist) *
                    </label>
                    <input
                      type="text"
                      required
                      value={autopsyPathologist}
                      onChange={(e) => setAutopsyPathologist(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Lakk. Galmee Poolisii (Police Case No, if forensic)
                    </label>
                    <input
                      type="text"
                      placeholder="Fkn: POL-MK-2026-891"
                      value={autopsyPoliceCase}
                      onChange={(e) => setAutopsyPoliceCase(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sababa Du'aa Mirkanaa'e (Confirmed Cause of Death)
                    </label>
                    <input
                      type="text"
                      placeholder={selectedRecordForAutopsy.cause_of_death}
                      value={autopsyConfirmedCause}
                      onChange={(e) => setAutopsyConfirmedCause(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Gabaasa Qorannoo Qaamaa & Bu'aa Toxicological (Detailed Autopsy Findings) *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Qorannoo sammuu, qomaa, dhiigaa fi summii dabalatee..."
                      value={autopsyFindings}
                      onChange={(e) => setAutopsyFindings(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                    <button
                      type="button"
                      onClick={() => setIsAutopsyModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-900/30 active:scale-95 transition-all"
                    >
                      {actionLoading ? 'Mirkaneessaa jira...' : 'Gabaasa Mirkaneessi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 3: RELEASE DECEASED */}
          {isReleaseModalOpen && selectedRecordForRelease && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#0d131f] border border-[#1e293b] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#101726]">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Reeffa Maatiitti Kenni (Release Deceased)</h3>
                      <p className="text-xs text-slate-400">
                        {selectedRecordForRelease.deceased_name} • Vault {selectedRecordForRelease.vault_code || 'Chamber'} ni duwwa'a
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsReleaseModalOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleReleaseSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Maqaa Fira Fudhatuu *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Fkn: Tolasa Diriba"
                        value={releaseKinName}
                        onChange={(e) => setReleaseKinName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Firooma (Relationship) *
                      </label>
                      <select
                        value={releaseKinRelationship}
                        onChange={(e) => setReleaseKinRelationship(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Son">Ilma (Son)</option>
                        <option value="Daughter">Intala (Daughter)</option>
                        <option value="Spouse">Haadha Warraa / Abbaa Warraa (Spouse)</option>
                        <option value="Brother">Obboleessa (Brother)</option>
                        <option value="Sister">Obboleettii (Sister)</option>
                        <option value="Father">Abbaa (Father)</option>
                        <option value="Mother">Haadha (Mother)</option>
                        <option value="Legal Representative">Bakka Bu'aa Seeraa (Legal Guardian)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Bilbila Fira Fudhatuu *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+251 9..."
                        value={releaseKinPhone}
                        onChange={(e) => setReleaseKinPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Lakk. Waraaqaa Du'aa (Certificate No)
                      </label>
                      <input
                        type="text"
                        placeholder={selectedRecordForRelease.death_certificate_number || 'DC-MKH-2026-XXXX'}
                        value={releaseCertNumber}
                        onChange={(e) => setReleaseCertNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Lakk. Hayyama Awwaalchaa (Burial Permit No)
                    </label>
                    <input
                      type="text"
                      placeholder={`BP-MKH-${String(selectedRecordForRelease.id).padStart(4, '0')}`}
                      value={releaseBurialPermit}
                      onChange={(e) => setReleaseBurialPermit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#070a0f] border border-[#1e293b] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>
                      Tarkaanfiin kun reeffa maatiitti dabarseera jedhee galmeessuun kutaa vault ({selectedRecordForRelease.vault_code || 'Chamber'}) reeffa biraaf duwwaa godha.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                    <button
                      type="button"
                      onClick={() => setIsReleaseModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 active:scale-95 transition-all"
                    >
                      {actionLoading ? 'Dabarsaa jira...' : 'Dabarsi & Waraaqaa Baasi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 4: PRINTABLE OFFICIAL DEATH CERTIFICATE & VOUCHER */}
          {isVoucherModalOpen && selectedVoucher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
              <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d131f]">
                  <div className="flex items-center gap-2">
                    <Printer className="h-5 w-5 text-amber-400" />
                    <span className="text-sm font-bold text-white">Waraaqaa Seera Qabeessa Kutaa Reeffaa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Maxxansi (Print)
                    </button>
                    <button onClick={() => setIsVoucherModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Voucher Content */}
                <div className="p-8 bg-white text-slate-900 font-serif">
                  {/* Hospital Government Letterhead */}
                  <div className="text-center border-b-2 border-slate-900 pb-4">
                    <p className="text-xs uppercase tracking-widest text-slate-600 font-sans font-bold">
                      Federal Democratic Republic of Ethiopia • Oromia Health Bureau
                    </p>
                    <h2 className="text-xl font-bold text-slate-950 mt-1 uppercase">
                      Hospitaala Riifaraalaa Mettuu Kaarli
                    </h2>
                    <p className="text-xs font-sans text-slate-600">
                      Mettu Karl Referral Hospital • Mortuary, Autopsy & Forensic Department
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-4 text-[11px] font-sans text-slate-500">
                      <span>TIN: <strong className="text-slate-900">{selectedVoucher.tin_number}</strong></span>
                      <span>•</span>
                      <span>Bilbila: {selectedVoucher.telephone}</span>
                      <span>•</span>
                      <span>Voucher: <strong className="text-slate-900 font-mono">{selectedVoucher.voucher_id}</strong></span>
                    </div>
                  </div>

                  {/* Certificate Title Badge */}
                  <div className="text-center my-4">
                    <span className="inline-block px-4 py-1 border-2 border-slate-900 font-sans font-bold text-xs tracking-wider uppercase bg-slate-100">
                      Waraaqaa Mirkaneessa Du'aa & Gadhiifama Reeffaa (Medical Certificate of Cause of Death)
                    </span>
                  </div>

                  {/* Body Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans mt-4">
                    <div className="space-y-2 border border-slate-300 p-3 rounded">
                      <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Odeeffannoo Reeffaa (Deceased Details)</p>
                      <p><strong>Maqaa Guutuu:</strong> {selectedVoucher.deceased_name}</p>
                      <p><strong>Saala (Gender):</strong> {selectedVoucher.gender}</p>
                      <p><strong>Lakk. Tag:</strong> <span className="font-mono">{selectedVoucher.tag_number}</span></p>
                      <p><strong>Waraaqaa Du'aa (Cert #):</strong> <span className="font-mono">{selectedVoucher.death_certificate_number}</span></p>
                      <p><strong>Guyyaa & Sa'aatii Du'aa:</strong> {selectedVoucher.datetime_of_death}</p>
                    </div>

                    <div className="space-y-2 border border-slate-300 p-3 rounded">
                      <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Qabiinsa Kutaa Qabbaneessaa (Vault Custody)</p>
                      <p><strong>Kutaa Vault:</strong> <span className="font-bold">{selectedVoucher.vault_code} ({selectedVoucher.bay_name})</span></p>
                      <p><strong>Ho'a Galmaa'e:</strong> {selectedVoucher.temperature_recorded}</p>
                      <p><strong>Yeroo Fudhatame:</strong> {selectedVoucher.received_at}</p>
                      <p><strong>Ogeessa Yaalaa:</strong> {selectedVoucher.declaring_doctor_name}</p>
                      <p><strong>Hayyama Awwaalchaa:</strong> <span className="font-mono">{selectedVoucher.burial_permit_number || 'BP-MKH-0041'}</span></p>
                    </div>
                  </div>

                  {/* Clinical Cause of Death */}
                  <div className="mt-4 p-3 border border-slate-300 rounded font-sans text-xs">
                    <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px] mb-1">
                      Sababa Du'aa Mirkanaa'e (Certified Cause of Death - ICD Standard)
                    </p>
                    <p className="text-sm font-bold text-slate-900">{selectedVoucher.cause_of_death}</p>
                  </div>

                  {/* Autopsy Findings if Conducted */}
                  {selectedVoucher.is_autopsy_conducted && (
                    <div className="mt-4 p-3 border border-purple-300 bg-purple-50 rounded font-sans text-xs">
                      <p className="font-bold uppercase tracking-wider text-purple-900 text-[10px] mb-1">
                        Gabaasa Qorannoo Post-Mortem & Forensic Pathology
                      </p>
                      <p><strong>Pathologist:</strong> {selectedVoucher.pathologist_name || 'Dr. Daniel Gemechu'}</p>
                      {selectedVoucher.police_case_number && (
                        <p><strong>Lakk. Poolisii:</strong> {selectedVoucher.police_case_number}</p>
                      )}
                      <p className="mt-1 text-slate-800 italic">{selectedVoucher.autopsy_findings}</p>
                    </div>
                  )}

                  {/* Next of Kin Release Handover */}
                  <div className="mt-4 p-3 border border-slate-300 rounded font-sans text-xs">
                    <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px] mb-1">
                      Ragaa Fira Reeffa Fudhatuu (Next-of-Kin Release Handover)
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <p><strong>Maqaa:</strong> {selectedVoucher.released_to_name || 'Almaz Tadesse'}</p>
                      <p><strong>Firooma:</strong> {selectedVoucher.released_to_relationship || 'Daughter'}</p>
                      <p><strong>Bilbila:</strong> {selectedVoucher.contact_kin_phone || '+251 911 223344'}</p>
                    </div>
                  </div>

                  {/* Signatures & QR Code */}
                  <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between font-sans text-[11px]">
                    <div>
                      <p className="font-bold">Mirkaneessa Ogeessa Kutaa Reeffaa:</p>
                      <p className="mt-4 border-b border-slate-400 w-44"></p>
                      <p className="text-slate-500 mt-0.5">Mallattoo & Guyyaa</p>
                    </div>

                    <div className="text-center flex flex-col items-center">
                      <div className="h-16 w-16 bg-slate-100 border border-slate-300 p-1 rounded flex items-center justify-center">
                        <QrCode className="h-14 w-14 text-slate-900" />
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 font-mono">TIN: 0038912401</span>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">Mallattoo Fira Fudhatuu (Next-of-Kin):</p>
                      <p className="mt-4 border-b border-slate-400 w-44 ml-auto"></p>
                      <p className="text-slate-500 mt-0.5">Mallattoo & Guyyaa</p>
                    </div>
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

export default function MortuaryPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-slate-200">
          <div className="flex flex-col items-center gap-3">
            <Archive className="h-8 w-8 text-blue-500 animate-pulse" />
            <p className="text-sm font-medium">Kutaa Reeffaa & Qorannoo Post-Mortem banaa jira...</p>
          </div>
        </div>
      }
    >
      <MortuaryWorkstationContent />
    </Suspense>
  );
}
