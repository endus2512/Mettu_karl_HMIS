/**
 * EMS 907 Emergency Hotline, Pre-Hospital Triage & Ambulance Fleet Dispatch Workstation.
 * Enterprise Pre-Hospital Care & Regional Trauma Dispatch for Mettu Karl Comprehensive Specialized Hospital.
 *
 * Full Production Architecture:
 * - 907 Toll-Free Emergency Hotline Call Intake & Rapid Color Triage (RED, YELLOW, GREEN, BLACK)
 * - Ambulance Fleet Management: ALS/BLS readiness, real-time GPS coordinates, oxygen tanks (bar) & fuel telemetry
 * - Rapid Mission Dispatching: Assign available ambulances, track mission lifecycle (en_route -> on_scene -> loaded -> hospital)
 * - Geographic Radar & Highway Coverage (Mettu, Sor Woreda, Gore Highway, Bedele Junction)
 * - Official Printable Paramedic Run Sheet & Dispatch Voucher with TIN 0038912401, QR Code & Handover Sign-Off
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
  Ambulance,
  ArrowRight,
  BatteryCharging,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Gauge,
  HeartPulse,
  Layers,
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  Plus,
  Printer,
  QrCode,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Thermometer,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

const API_BASE = '';

interface EMSStats {
  total_ambulances: number;
  available_ambulances: number;
  dispatched_ambulances: number;
  today_calls_count: number;
  active_red_calls: number;
  avg_response_time_minutes: number;
  als_readiness_rate: number;
}

interface AmbulanceVehicle {
  id: number;
  call_sign: string;
  plate_number: string;
  vehicle_model: string;
  vehicle_type: string;
  is_als: boolean;
  driver_name: string;
  driver_phone: string;
  assigned_crew: string;
  is_available: boolean;
  current_lat?: number | null;
  current_lon?: number | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  fuel_level_percent: number;
  oxygen_tank_bar: number;
  last_gps_update?: string | null;
}

interface EmergencyCall {
  id: number;
  incident_code: string;
  caller_name: string;
  caller_phone: string;
  location_address: string;
  incident_location?: string | null;
  location_lat?: number | null;
  location_lon?: number | null;
  triage_level: string;
  chief_complaint: string;
  emergency_description?: string | null;
  status: string;
  dispatch_status: string;
  ambulance_id?: number | null;
  assigned_ambulance_id?: number | null;
  assigned_ambulance_plate?: string | null;
  assigned_ambulance_call_sign?: string | null;
  paramedic_notes?: string | null;
  vital_signs_summary?: string | null;
  received_at: string;
  dispatched_at?: string | null;
  arrived_hospital_at?: string | null;
}

interface AmbulanceDispatchVoucher {
  hospital_name_en: string;
  hospital_name_om: string;
  tin_number: string;
  telephone: string;
  incident_code: string;
  caller_name: string;
  caller_phone: string;
  incident_location: string;
  triage_level: string;
  chief_complaint: string;
  ambulance_call_sign: string;
  ambulance_plate: string;
  paramedic_crew: string;
  vital_signs: string;
  dispatch_time: string;
  hospital_arrival_time: string;
  verification_qr: string;
}

const INITIAL_STATS: EMSStats = {
  total_ambulances: 5,
  available_ambulances: 3,
  dispatched_ambulances: 2,
  today_calls_count: 5,
  active_red_calls: 2,
  avg_response_time_minutes: 7.4,
  als_readiness_rate: 100.0,
};

function EMSWorkstationContent(): React.ReactElement {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // Primary State
  const [stats, setStats] = useState<EMSStats>(INITIAL_STATS);
  const [fleet, setFleet] = useState<AmbulanceVehicle[]>([]);
  const [calls, setCalls] = useState<EmergencyCall[]>([]);

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<'fleet' | 'hotline' | 'dispatch' | 'map'>('fleet');
  const [searchFilter, setSearchFilter] = useState('');
  const [triageFilter, setTriageFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isAmbulanceModalOpen, setIsAmbulanceModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedCallForDispatch, setSelectedCallForDispatch] = useState<EmergencyCall | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<AmbulanceDispatchVoucher | null>(null);

  // Form: 907 Call Intake
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [triageLevel, setTriageLevel] = useState<'RED' | 'YELLOW' | 'GREEN' | 'BLACK'>('RED');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [paramedicNotes, setParamedicNotes] = useState('');

  // Form: Register Ambulance
  const [ambPlate, setAmbPlate] = useState('');
  const [ambCallSign, setAmbCallSign] = useState('');
  const [ambType, setAmbType] = useState('advanced_life_support');
  const [ambModel, setAmbModel] = useState('Toyota Land Cruiser HZJ78');
  const [ambDriver, setAmbDriver] = useState('');
  const [ambPhone, setAmbPhone] = useState('');
  const [ambCrew, setAmbCrew] = useState('');
  const [ambFuel, setAmbFuel] = useState(90);
  const [ambO2, setAmbO2] = useState(200);

  // Form: Dispatch Selection
  const [dispatchAmbulanceId, setDispatchAmbulanceId] = useState<number | ''>('');

  // Action feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Fetch all live data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, fleetRes, callsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/ems/stats`),
        fetch(`${API_BASE}/api/v1/ems/ambulances`),
        fetch(`${API_BASE}/api/v1/ems/calls`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (fleetRes.ok) setFleet(await fleetRes.json());
      if (callsRes.ok) setCalls(await callsRes.json());
    } catch (err: any) {
      console.error('Error fetching EMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Check search params
    const tabParam = searchParams.get('tab');
    if (tabParam && ['fleet', 'hotline', 'dispatch', 'map'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    const voucherParam = searchParams.get('voucher');
    if (voucherParam) {
      fetchVoucher(Number(voucherParam));
    }
  }, [searchParams]);

  // Fetch Voucher
  const fetchVoucher = async (callId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/ems/calls/${callId}/voucher`);
      if (!res.ok) throw new Error('Voucher retrieval failed');
      const data = await res.json();
      setSelectedVoucher(data);
      setIsVoucherModalOpen(true);
    } catch (err: any) {
      setActionError(err.message || 'Waraaqaa ambalaansii fiduun hin dandaamne');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit 907 Emergency Call
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError(null);

      const payload = {
        caller_name: callerName || '907 Emergency Hotline',
        caller_phone: callerPhone,
        incident_location: incidentLocation,
        triage_level: triageLevel,
        chief_complaint: chiefComplaint,
        paramedic_notes: paramedicNotes,
      };

      const res = await fetch(`${API_BASE}/api/v1/ems/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to log emergency call');
      }

      const created = await res.json();
      setActionSuccess(`Waamichi hatattamaa '${created.incident_code}' [${created.triage_level}] milkaa'inaan galmaa'eera!`);
      setIsCallModalOpen(false);
      setCallerName('');
      setCallerPhone('');
      setIncidentLocation('');
      setChiefComplaint('');
      setParamedicNotes('');
      fetchAllData();

      // Automatically open dispatch modal for RED calls
      if (created.triage_level === 'RED') {
        setSelectedCallForDispatch(created);
        setIsDispatchModalOpen(true);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch 907 emergency call');
    } finally {
      setActionLoading(false);
    }
  };

  // Register Ambulance
  const handleRegisterAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionError(null);

      const payload = {
        call_sign: ambCallSign || `AMB-0${fleet.length + 1}`,
        plate_number: ambPlate,
        vehicle_model: ambModel,
        vehicle_type: ambType,
        is_als: ambType.includes('advanced') || ambType.includes('icu'),
        driver_name: ambDriver || 'EMS Standby Driver',
        driver_phone: ambPhone || '+251911907907',
        assigned_crew: ambCrew || 'Paramedic & EMT Team',
        fuel_level_percent: Number(ambFuel),
        oxygen_tank_bar: Number(ambO2),
        current_latitude: 8.3010,
        current_longitude: 35.5840,
      };

      const res = await fetch(`${API_BASE}/api/v1/ems/ambulances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to add ambulance to fleet');
      }

      setActionSuccess(`Ambalaansiin haaraa '${payload.call_sign}' (${payload.plate_number}) milkaa'inaan galmaa'eera!`);
      setIsAmbulanceModalOpen(false);
      setAmbPlate('');
      setAmbCallSign('');
      setAmbDriver('');
      setAmbCrew('');
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to register ambulance fleet unit');
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatch Ambulance
  const handleDispatchAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallForDispatch || !dispatchAmbulanceId) {
      setActionError('Maaloo ambalaansii qophaa\'aa filadhaa');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      const payload = {
        emergency_call_id: selectedCallForDispatch.id,
        ambulance_id: Number(dispatchAmbulanceId),
      };

      const res = await fetch(`${API_BASE}/api/v1/ems/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to dispatch ambulance');
      }

      const dispData = await res.json();
      setActionSuccess(`Ambalaansiin '${dispData.assigned_ambulance_call_sign || 'AMB'}' gara '${selectedCallForDispatch.incident_location || selectedCallForDispatch.location_address}' tti ERGAMEERA (En Route)!`);
      setIsDispatchModalOpen(false);
      setSelectedCallForDispatch(null);
      setDispatchAmbulanceId('');
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Ambalaansii erguu hin dandeenye');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Call Status
  const handleUpdateStatus = async (callId: number, targetStatus: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/ems/calls/${callId}/status?target_status=${targetStatus}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Status update failed');
      const updated = await res.json();
      setActionSuccess(`Haalli waamicha '${updated.incident_code}' gara '${targetStatus.toUpperCase()}' tti jijjiirameera.`);
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Haala waamichaa jijjiiruu hin dandeenye');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Calls
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      const matchSearch =
        !searchFilter ||
        c.incident_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.caller_phone.includes(searchFilter) ||
        c.location_address.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.chief_complaint.toLowerCase().includes(searchFilter.toLowerCase());

      const matchTriage = triageFilter === 'ALL' || c.triage_level === triageFilter;

      return matchSearch && matchTriage;
    });
  }, [calls, searchFilter, triageFilter]);

  // Filtered Fleet
  const filteredFleet = useMemo(() => {
    if (!searchFilter) return fleet;
    const q = searchFilter.toLowerCase();
    return fleet.filter(
      (a) =>
        a.call_sign.toLowerCase().includes(q) ||
        a.plate_number.toLowerCase().includes(q) ||
        a.driver_name.toLowerCase().includes(q) ||
        a.assigned_crew.toLowerCase().includes(q)
    );
  }, [fleet, searchFilter]);

  return (
    <div className="flex min-h-screen bg-[#070a0f] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d131f] via-[#101726] to-[#0c121e] border border-amber-500/20 p-6 shadow-2xl shadow-black/40">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-amber-500/20 to-red-600/10 border border-rose-500/40 text-rose-400 shadow-[0_0_24px_rgba(239,68,68,0.2)] shrink-0">
                  <Siren className="h-7 w-7 text-rose-500 fill-rose-500/20 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>Sarara Hatattamaa 907, Triage & Ergaa Ambalaansii</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        MOD-09
                      </span>
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Hotline 907 Dispatch Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Mettu Karl Comprehensive Specialized Hospital • Regional Emergency Medical Services (EMS).
                    Pre-hospital trauma triage, GPS fleet telemetry, emergency extrication & mobile ICU resuscitation.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCallModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs shadow-lg shadow-rose-950/60 transition-all cursor-pointer active:scale-95 border border-rose-400/40"
                >
                  <PhoneCall className="h-4 w-4 text-white" />
                  Dispatch 907 Call
                </button>

                <button
                  type="button"
                  onClick={() => setIsAmbulanceModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141d2e] hover:bg-[#1a253a] text-amber-300 font-bold text-xs border border-amber-500/30 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="h-4 w-4 text-amber-400" />
                  Ambalaansii Dabaladhu
                </button>

                <button
                  type="button"
                  onClick={fetchAllData}
                  disabled={loading}
                  className="inline-flex items-center justify-center p-2.5 rounded-xl bg-[#101624] hover:bg-[#161f33] text-slate-400 hover:text-amber-300 border border-slate-800 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Readiness HUD Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-rose-400 animate-pulse" /> EMS Telemetry:
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Fleet Readiness: {stats.available_ambulances} / {stats.total_ambulances} Standby
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/30">
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  Active RED Resuscitation: {stats.active_red_calls} Cases
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Avg Response Time: {stats.avg_response_time_minutes} min (Target &lt; 10 min)
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Advanced Life Support (ALS) Certified Paramedics</span>
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

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 shadow-sm hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 1. Ambalaansii Qophii Ta'an
                </span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Ambulance className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold tracking-tight text-white font-mono">
                  {stats.available_ambulances} <span className="text-sm font-normal text-slate-400">/ {stats.total_ambulances}</span>
                </p>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <span>Missions: <strong className="text-amber-300">{stats.dispatched_ambulances}</strong></span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> ALS 100%
                </span>
                <span className="text-[11px] font-mono">Oxygen & Fuel &gt; 80%</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-[#1c0e14] to-[#120a10] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-rose-400">✦</span> 2. Triage Diimaa (RED Immediate)
                </span>
                <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <Flame className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold tracking-tight text-rose-400 font-mono">{stats.active_red_calls}</p>
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/40">
                    Balaan Cimaa
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-rose-900/40 flex items-center justify-between text-xs text-rose-300/80">
                <span>Lubbuu baraaruu hatattamaa</span>
                <span className="font-mono text-amber-300">Target &lt; 8 min</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 shadow-sm hover:border-sky-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 3. Waamicha 907 Har'aa
                </span>
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <PhoneCall className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold tracking-tight text-white font-mono">{stats.today_calls_count} <span className="text-sm font-normal text-slate-400">Calls</span></p>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono border border-sky-800">
                  Toll-Free 907
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Community Hotline 24/7</span>
                <span className="font-mono text-sky-400">100% Handled</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 shadow-sm hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 4. Saffisa Qaqqabinsa (Response Time)
                </span>
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold tracking-tight text-amber-300 font-mono">{stats.avg_response_time_minutes} <span className="text-sm font-normal text-slate-400">min</span></p>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <span>GPS: <strong className="text-emerald-400">Active</strong></span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span className="text-emerald-400 font-medium">Urban & Rural Coverage</span>
                <span className="font-mono text-amber-300">ETA &lt; 10 min</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('fleet')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'fleet'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#101624] text-slate-400 hover:text-white hover:bg-[#161f33]'
                }`}
              >
                <Ambulance className="h-4 w-4" />
                Konkolaattota Ambalaansii ({fleet.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hotline')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'hotline'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#101624] text-slate-400 hover:text-white hover:bg-[#161f33]'
                }`}
              >
                <PhoneCall className="h-4 w-4" />
                Waamicha Hatattamaa 907 ({calls.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dispatch')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dispatch'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#101624] text-slate-400 hover:text-white hover:bg-[#161f33]'
                }`}
              >
                <Send className="h-4 w-4" />
                Ergaa & Haala Hojii (Live Dispatch)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'map'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#101624] text-slate-400 hover:text-white hover:bg-[#161f33]'
                }`}
              >
                <Compass className="h-4 w-4" />
                Kaartaa & Raadaara GPS
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Barbaadi (Plate, Lakk., Iddoo)..."
                className="w-full rounded-xl border border-slate-800 bg-[#0d131f] pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* TAB 1: FLEET READINESS CARDS */}
          {activeTab === 'fleet' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFleet.map((amb) => {
                  const isAvailable = amb.is_available;
                  return (
                    <div
                      key={amb.id}
                      className={`rounded-2xl border p-5 transition-all shadow-xl relative overflow-hidden ${
                        isAvailable
                          ? 'border-emerald-500/30 bg-[#0d1420] hover:border-emerald-500/60'
                          : 'border-amber-500/40 bg-gradient-to-br from-[#16120e] to-[#0f0e0c] hover:border-amber-500/60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl border ${
                            isAvailable
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            <Ambulance className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-black text-white font-mono">{amb.call_sign}</h3>
                              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#131b2e] text-slate-300 border border-slate-700">
                                {amb.plate_number}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{amb.vehicle_model}</p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          isAvailable
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                          {isAvailable ? 'STANDBY' : 'IN MISSION'}
                        </span>
                      </div>

                      {/* Fleet Telemetry Details */}
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#080d16] border border-slate-800 space-y-2">
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-500">Garee Ogeessaa (Crew):</span>
                            <strong className="text-white">{amb.assigned_crew}</strong>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-500">Konkolaachisaa:</span>
                            <span>{amb.driver_name} ({amb.driver_phone})</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span className="text-slate-500">Sadarkaa Deeggarsaa:</span>
                            <span className="text-amber-300 font-bold">
                              {amb.is_als ? 'Advanced Life Support (ALS)' : 'Basic Life Support (BLS)'}
                            </span>
                          </div>
                        </div>

                        {/* Gauges: Fuel & Oxygen */}
                        <div className="grid grid-cols-2 gap-3 font-mono">
                          <div className="p-2.5 rounded-xl bg-[#080d16] border border-slate-800">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                              <span className="flex items-center gap-1"><Gauge className="h-3 w-3 text-amber-400" /> Boba'aa (Fuel)</span>
                              <strong className="text-white">{amb.fuel_level_percent}%</strong>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${amb.fuel_level_percent}%` }} />
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[#080d16] border border-slate-800">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                              <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-sky-400" /> O2 Tank</span>
                              <strong className="text-sky-300">{amb.oxygen_tank_bar} Bar</strong>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.min(100, (amb.oxygen_tank_bar / 220) * 100)}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* GPS Coordinates */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-rose-400" />
                            GPS: {amb.current_latitude?.toFixed(4)}, {amb.current_longitude?.toFixed(4)}
                          </span>
                          <span className="text-emerald-400">Live Telemetry</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 907 EMERGENCY CALL INTAKE ROSTER */}
          {activeTab === 'hotline' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d131f] p-4 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" /> Sadarkaa Triage:
                  </span>
                  {['ALL', 'RED', 'YELLOW', 'GREEN'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTriageFilter(lvl)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        triageFilter === lvl
                          ? lvl === 'RED'
                            ? 'bg-rose-600 text-white'
                            : lvl === 'YELLOW'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-600 text-white'
                          : 'bg-[#141b2a] text-slate-400 hover:text-white hover:bg-[#1a2336]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCallModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Waamicha 907 Haaraa
                </button>
              </div>

              {/* Calls Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d131f] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#101726] text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Incident Code</th>
                        <th className="px-5 py-3.5">Triage Level</th>
                        <th className="px-5 py-3.5">Bilbila / Nama Waame</th>
                        <th className="px-5 py-3.5">Bakka Balaan Ga'e</th>
                        <th className="px-5 py-3.5">Ibsa Balaa (Complaint)</th>
                        <th className="px-5 py-3.5">Ambalaansii</th>
                        <th className="px-5 py-3.5">Haala (Status)</th>
                        <th className="px-5 py-3.5 text-right">Tarkaanfii</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium">
                      {filteredCalls.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                            Waamichi hatattamaa hin argamne.
                          </td>
                        </tr>
                      ) : (
                        filteredCalls.map((call) => {
                          const isRed = call.triage_level === 'RED';
                          const isYellow = call.triage_level === 'YELLOW';
                          const isPending = call.dispatch_status === 'pending' || call.status === 'received';
                          return (
                            <tr key={call.id} className="hover:bg-[#121929] transition-colors">
                              <td className="px-5 py-3.5 font-mono text-amber-300 font-bold">
                                {call.incident_code}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  isRed
                                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
                                    : isYellow
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                                }`}>
                                  {isRed && <Flame className="h-3 w-3 text-rose-400" />}
                                  {call.triage_level}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-white">{call.caller_name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{call.caller_phone}</div>
                              </td>
                              <td className="px-5 py-3.5 text-slate-200">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                  <span>{call.location_address || call.incident_location}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 max-w-xs truncate text-slate-300" title={call.chief_complaint}>
                                {call.chief_complaint}
                              </td>
                              <td className="px-5 py-3.5 font-mono">
                                {call.assigned_ambulance_call_sign ? (
                                  <span className="text-emerald-300 font-bold">
                                    {call.assigned_ambulance_call_sign}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">Hin Ramadamne</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  call.dispatch_status === 'en_route'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    : call.dispatch_status === 'on_scene'
                                    ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                                    : call.dispatch_status === 'arrived_hospital'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}>
                                  {call.dispatch_status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-2">
                                {isPending ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCallForDispatch(call);
                                      setIsDispatchModalOpen(true);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer"
                                  >
                                    Ergi (Dispatch)
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => fetchVoucher(call.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Printer className="h-3 w-3" />
                                    Voucher
                                  </button>
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

          {/* TAB 3: LIVE DISPATCH COORDINATION & MISSION WORKFLOW */}
          {activeTab === 'dispatch' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {calls
                  .filter((c) => c.dispatch_status !== 'arrived_hospital')
                  .map((call) => (
                    <div
                      key={call.id}
                      className="rounded-2xl border border-slate-800 bg-[#0d131f] p-5 shadow-xl space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            call.triage_level === 'RED'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-500 text-slate-950'
                          }`}>
                            {call.triage_level}
                          </span>
                          <div>
                            <h3 className="font-bold text-white text-sm">{call.incident_code}</h3>
                            <p className="text-[11px] text-slate-400">{call.location_address}</p>
                          </div>
                        </div>

                        <span className="font-mono text-xs text-amber-300 font-bold">
                          {call.assigned_ambulance_call_sign || 'Unassigned'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#080d16] border border-slate-800 text-xs space-y-1.5">
                        <div className="text-slate-300">
                          <strong className="text-white">Balaa:</strong> {call.chief_complaint}
                        </div>
                        {call.paramedic_notes && (
                          <div className="text-slate-400 text-[11px]">
                            <strong className="text-slate-300">Paramedic Notes:</strong> {call.paramedic_notes}
                          </div>
                        )}
                        {call.vital_signs_summary && (
                          <div className="text-emerald-400 font-mono text-[11px]">
                            <strong>Vitals:</strong> {call.vital_signs_summary}
                          </div>
                        )}
                      </div>

                      {/* Stage Progression Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(call.id, 'on_scene')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                              call.dispatch_status === 'on_scene'
                                ? 'bg-sky-500 text-slate-950'
                                : 'bg-[#141b2a] text-slate-300 hover:bg-[#1a2336]'
                            }`}
                          >
                            1. Iddoo Ga'e (On Scene)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(call.id, 'patient_loaded')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                              call.dispatch_status === 'patient_loaded'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-[#141b2a] text-slate-300 hover:bg-[#1a2336]'
                            }`}
                          >
                            2. Fe'ameera (Loaded)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(call.id, 'arrived_hospital')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md"
                          >
                            3. Arrived at Hospital ED
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => fetchVoucher(call.id)}
                          className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
                          title="Waraaqaa Maxxansi"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: GEOGRAPHIC RADAR & MAP TRACKING */}
          {activeTab === 'map' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="h-4 w-4 text-amber-400" />
                    Raadaara GPS & Daandiiwwan Ambalaansii (Pre-Hospital Coverage Radar)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mettu Karl Comprehensive Specialized Hospital • Ilu Abba Bor Zone Emergency Coverage Grid
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  GPS Satellite Lock: 9 Sats
                </span>
              </div>

              {/* Simulated Visual Radar Screen */}
              <div className="relative w-full h-96 rounded-2xl bg-[#080d16] border border-slate-800 overflow-hidden flex items-center justify-center">
                {/* Radar grid lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
                <div className="absolute w-72 h-72 rounded-full border border-emerald-500/20 pointer-events-none" />
                <div className="absolute w-48 h-48 rounded-full border border-emerald-500/30 pointer-events-none" />
                <div className="absolute w-24 h-24 rounded-full border border-emerald-500/40 pointer-events-none" />

                {/* Central Hospital Pin */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-black shadow-lg shadow-rose-600/40">
                    +
                  </div>
                  <span className="text-[11px] font-bold text-white mt-1 bg-black/60 px-2 py-0.5 rounded-md border border-slate-700">
                    Mettu Karl Hospital (Hub)
                  </span>
                </div>

                {/* Simulated Fleet Points */}
                <div className="absolute top-20 left-1/4 flex items-center gap-1.5 bg-[#0e1626]/90 border border-amber-500/40 px-2.5 py-1 rounded-xl text-xs font-mono text-amber-300 shadow-lg">
                  <Ambulance className="h-3.5 w-3.5" />
                  <span>AMB-02 (Gore Rd Km 4) • ETA 6m</span>
                </div>

                <div className="absolute bottom-16 right-1/4 flex items-center gap-1.5 bg-[#0e1626]/90 border border-rose-500/40 px-2.5 py-1 rounded-xl text-xs font-mono text-rose-300 shadow-lg">
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  <span>AMB-05 (Sor River Incident) • On Scene</span>
                </div>

                <div className="absolute top-1/3 right-1/5 flex items-center gap-1.5 bg-[#0e1626]/90 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-xs font-mono text-emerald-300 shadow-lg">
                  <Check className="h-3.5 w-3.5" />
                  <span>AMB-01 • Standby Bay 1</span>
                </div>
              </div>

              {/* Highway Coverage Index */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#080d16] border border-slate-800">
                  <span className="font-bold text-amber-300 block mb-1">Mettu - Gore Highway (24 km)</span>
                  <p className="text-slate-400 text-[11px]">Ambalaansii: AMB-02 • Saffisa qaqqabinsa: 8 min</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#080d16] border border-slate-800">
                  <span className="font-bold text-sky-300 block mb-1">Mettu - Bedele Corridor (48 km)</span>
                  <p className="text-slate-400 text-[11px]">Ambalaansii: AMB-04 • Saffisa qaqqabinsa: 12 min</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#080d16] border border-slate-800">
                  <span className="font-bold text-rose-300 block mb-1">Sor Woreda Rural Ring (18 km)</span>
                  <p className="text-slate-400 text-[11px]">Ambalaansii: AMB-05 (4x4) • Saffisa qaqqabinsa: 10 min</p>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 1: 907 CALL INTAKE */}
          {isCallModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-xl rounded-2xl bg-[#0e1422] border border-rose-500/40 p-6 shadow-2xl space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Dispatch 907 Emergency Hotline Intake</h3>
                      <p className="text-[11px] text-slate-400">Emergency Call Intake & Color Triage</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCallModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleLogCall} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Lakk. Bilbila Nama Waame</label>
                      <input
                        type="text"
                        value={callerPhone}
                        onChange={(e) => setCallerPhone(e.target.value)}
                        placeholder="+251 9..."
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-rose-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Maqaa Nama Waame</label>
                      <input
                        type="text"
                        value={callerName}
                        onChange={(e) => setCallerName(e.target.value)}
                        placeholder="fakkeessaa: Obbo Caalaa Workuu"
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Bakka Balaan Itti Ga'e</label>
                      <input
                        type="text"
                        value={incidentLocation}
                        onChange={(e) => setIncidentLocation(e.target.value)}
                        placeholder="fakkeessaa: Mettu Roundabout"
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Sadarkaa Triage</label>
                      <select
                        value={triageLevel}
                        onChange={(e) => setTriageLevel(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-bold focus:border-rose-500 focus:outline-none"
                      >
                        <option value="RED">RED - Immediate Resuscitation (Hatattama)</option>
                        <option value="YELLOW">YELLOW - Urgent Transport (Ariifachiisaa)</option>
                        <option value="GREEN">GREEN - Minor Ambulatory (Salphaa)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ibsa Balaa (Chief Complaint)</label>
                    <textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="Gonkolaataa fi baajaajii walitti bu'e, madaa mataa cimaa..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Qajeelfama Ogeessa Paramedic</label>
                    <textarea
                      value={paramedicNotes}
                      onChange={(e) => setParamedicNotes(e.target.value)}
                      placeholder="Cervical collar qopheessi, IV line 14G banuun dhiibbaa dhiigaa to'adhaa..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCallModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#141b2a] text-slate-300 font-semibold"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? 'Galmeessaa jira...' : 'Galmeessi (Submit)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: REGISTER AMBULANCE */}
          {isAmbulanceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-xl rounded-2xl bg-[#0e1422] border border-amber-500/40 p-6 shadow-2xl space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Ambulance className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Ambalaansii Haaraa Galmeessi</h3>
                      <p className="text-[11px] text-slate-400">Emergency Fleet Registration & Equipment Level</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAmbulanceModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleRegisterAmbulance} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Lakk. Gabatee (Plate Number)</label>
                      <input
                        type="text"
                        value={ambPlate}
                        onChange={(e) => setAmbPlate(e.target.value)}
                        placeholder="fakkeessaa: ET-3-99012"
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Call Sign / Koodii</label>
                      <input
                        type="text"
                        value={ambCallSign}
                        onChange={(e) => setAmbCallSign(e.target.value)}
                        placeholder="fakkeessaa: AMB-06"
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Gosa Tajaajilaa (Vehicle Type)</label>
                      <select
                        value={ambType}
                        onChange={(e) => setAmbType(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="advanced_life_support">Advanced Life Support (ALS)</option>
                        <option value="basic_life_support">Basic Life Support (BLS)</option>
                        <option value="neonatal_pediatric_icu">Neonatal & Pediatric Mobile ICU</option>
                        <option value="rural_trauma_retrieval">Rural Wilderness Retrieval 4x4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Mootora / Moodeela</label>
                      <input
                        type="text"
                        value={ambModel}
                        onChange={(e) => setAmbModel(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Konkolaachisaa (Driver)</label>
                      <input
                        type="text"
                        value={ambDriver}
                        onChange={(e) => setAmbDriver(e.target.value)}
                        placeholder="Maqaa konkolaachisaa"
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Bilbila Konkolaachisaa</label>
                      <input
                        type="text"
                        value={ambPhone}
                        onChange={(e) => setAmbPhone(e.target.value)}
                        placeholder="+251 9..."
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Garee Ogeessaa (Paramedic & EMT Team)</label>
                    <input
                      type="text"
                      value={ambCrew}
                      onChange={(e) => setAmbCrew(e.target.value)}
                      placeholder="fakkeessaa: Paramedic Kumsa & Nurse Genet"
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Boba'aa (%)</label>
                      <input
                        type="number"
                        value={ambFuel}
                        onChange={(e) => setAmbFuel(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Kuusaa Oksijiinii (Bar)</label>
                      <input
                        type="number"
                        value={ambO2}
                        onChange={(e) => setAmbO2(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAmbulanceModalOpen(false)}
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

          {/* MODAL 3: DISPATCH AMBULANCE TO INCIDENT */}
          {isDispatchModalOpen && selectedCallForDispatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-lg rounded-2xl bg-[#0e1422] border border-rose-500/40 p-6 shadow-2xl space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Ambalaansii Ergi (Dispatch Mission)</h3>
                      <p className="text-[11px] text-slate-400">Assign Vehicle & Paramedic Crew</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Incident Brief */}
                <div className="p-3.5 rounded-xl bg-[#080d16] border border-slate-800 space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span className="text-amber-400 font-bold">{selectedCallForDispatch.incident_code}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold text-[10px]">
                      {selectedCallForDispatch.triage_level}
                    </span>
                  </div>
                  <div className="text-slate-300 font-semibold">{selectedCallForDispatch.location_address || selectedCallForDispatch.incident_location}</div>
                  <p className="text-slate-400 text-[11px]">{selectedCallForDispatch.chief_complaint}</p>
                </div>

                <form onSubmit={handleDispatchAmbulance} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ambalaansii Qophaa'aa Filadhu</label>
                    <select
                      value={dispatchAmbulanceId}
                      onChange={(e) => setDispatchAmbulanceId(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-[#090d16] px-3.5 py-2.5 text-white font-mono focus:border-rose-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Ambalaansii Filadhu --</option>
                      {fleet
                        .filter((a) => a.is_available)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.call_sign} ({a.plate_number}) • {a.assigned_crew} (Fuel: {a.fuel_level_percent}%)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#141b2a] text-slate-300 font-semibold"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? 'Ergaa jira...' : 'Ergi (Launch Mission)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 4: OFFICIAL PRINTABLE PARAMEDIC RUN SHEET VOUCHER */}
          {isVoucherModalOpen && selectedVoucher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
              <div className="relative w-full max-w-3xl rounded-3xl bg-white text-slate-900 p-8 shadow-2xl space-y-6 print:p-0 print:shadow-none print:w-full">
                {/* Print Controls (Hidden on print) */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                    <Siren className="h-4 w-4" />
                    Official Paramedic Emergency Run Sheet & Handover Certificate
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
                    Department of Emergency Medicine & Regional Pre-Hospital EMS • TIN: <span className="font-mono font-bold text-slate-900">{selectedVoucher.tin_number}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Oromia, Ilu Abba Bor, Mettu, Ethiopia • Hotline 24/7: <span className="font-bold text-rose-700">{selectedVoucher.telephone}</span>
                  </p>
                </div>

                {/* Voucher Title */}
                <div className="text-center py-1 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-xs font-black uppercase tracking-widest text-rose-900">
                    WARAAQAA RUN SHEET ERGAA AMBALAANSII FI HARKAA-FUDHANNAA YAALAA HATATTAMAA
                  </span>
                </div>

                {/* Voucher Body Grid */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  {/* Incident Profile */}
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                      1. Odeeffannoo Waamicha Balaa (Incident Profile)
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Koodii Balaa:</span>
                        <span className="font-mono font-bold text-rose-700">{selectedVoucher.incident_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Waame:</span>
                        <strong className="text-slate-900">{selectedVoucher.caller_name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bilbila:</span>
                        <span className="font-mono">{selectedVoucher.caller_phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bakka Balaan Ga'e:</span>
                        <strong className="text-slate-900">{selectedVoucher.incident_location}</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Sadarkaa Triage:</span>
                        <span className="font-black text-sm text-rose-700 font-mono">{selectedVoucher.triage_level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle & Paramedic Crew */}
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                      2. Konkolaataa & Garee Paramedic (Response Unit)
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Call Sign:</span>
                        <span className="font-mono font-bold text-slate-900">{selectedVoucher.ambulance_call_sign}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Lakk. Gabatee:</span>
                        <span className="font-mono">{selectedVoucher.ambulance_plate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Garee Ogeessaa:</span>
                        <strong className="text-slate-900">{selectedVoucher.paramedic_crew}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Yeroo Ergame:</span>
                        <span className="font-mono">{selectedVoucher.dispatch_time}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Yeroo Hospitaala Ga'e:</span>
                        <span className="font-mono font-bold text-emerald-700">{selectedVoucher.hospital_arrival_time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes & Vitals */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-1">
                    3. Yaada Yaalaa & Mallattoolee Jireenyaa (Pre-Hospital Vitals & Interventions)
                  </span>
                  <div className="text-slate-900">
                    <strong className="text-slate-600">Ibsa Balaa:</strong> {selectedVoucher.chief_complaint}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900">
                    <strong>Vitals Summary:</strong> {selectedVoucher.vital_signs}
                  </div>
                </div>

                {/* Handover Sign-off & QR */}
                <div className="pt-4 border-t-2 border-slate-900 flex items-end justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-slate-300 rounded-xl bg-slate-50 font-mono text-[9px] text-center">
                      <QrCode className="h-10 w-10 text-slate-800 mx-auto" />
                      <span>{selectedVoucher.incident_code}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <span>Mirkaneeffameera (Verified Pre-Hospital Care)</span><br />
                      <strong className="text-slate-900">Mettu Karl EMS Ambulance Command</strong><br />
                      <span className="text-[10px] font-mono">{new Date().toISOString()}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="w-48 border-b border-slate-900 pb-1">
                      <span className="font-bold text-slate-950 font-serif italic text-sm">Paramedic In Charge</span>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Ogeessa Harkaa-Fuudhe (Trauma Resuscitation Team)
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

export default function EMSWorkstationPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-amber-400 font-bold">
          Qophaa'aa jira (Loading EMS Workstation)...
        </div>
      }
    >
      <EMSWorkstationContent />
    </Suspense>
  );
}
