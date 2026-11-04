/**
 * EMS 907 Emergency Hotline, Triage & Ambulance Dispatch Workstation.
 * Toll-free emergency hotline, pre-hospital trauma triage & GPS fleet dispatching.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Ambulance,
  PhoneCall,
  MapPin,
  Clock,
  Radio,
  Navigation,
  Users,
  CheckCircle2,
  AlertTriangle,
  Send,
  Search,
  ShieldAlert,
  Flame,
  Check
} from 'lucide-react';

interface AmbulanceItem {
  id: number;
  callSign: string;
  plateNumber: string;
  type: string;
  status: 'available' | 'en_route' | 'on_scene' | 'maintenance';
  crew: string;
  location: string;
}

interface EmergencyCallItem {
  id: number;
  time: string;
  caller: string;
  location: string;
  description: string;
  triage: 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';
  status: 'pending' | 'dispatched' | 'completed';
}

const mockFleet: AmbulanceItem[] = [
  { id: 1, callSign: 'AMB-01', plateNumber: 'ET-3-10294', type: 'Advanced Life Support (ALS)', status: 'available', crew: 'Paramedic Dawit & Nurse Beth', location: 'Hospital Bay 1' },
  { id: 2, callSign: 'AMB-02', plateNumber: 'ET-3-10295', type: 'Advanced Life Support (ALS)', status: 'en_route', crew: 'Paramedic Fikadu & EMT Abebe', location: 'Gore Road (ETA 8 min)' },
  { id: 3, callSign: 'AMB-03', plateNumber: 'ET-3-88219', type: 'Basic Life Support (BLS)', status: 'available', crew: 'EMT Yohannes & Driver Kedir', location: 'Hospital Bay 2' },
  { id: 4, callSign: 'AMB-04', plateNumber: 'ET-3-88220', type: 'Neonatal Critical Transport', status: 'available', crew: 'NICU Specialist & Nurse Selam', location: 'Maternity Bay' },
];

const mockCalls: EmergencyCallItem[] = [
  { id: 101, time: '11:42 AM', caller: '+251 911 234 567', location: 'Near Mettu University Gate 2', description: 'Pedestrian vs motorcycle collision, unconscious patient', triage: 'RED', status: 'pending' },
  { id: 102, time: '11:15 AM', caller: '+251 922 456 789', location: 'Mettu Central Market, Grain Mill', description: 'Elderly male with acute chest pressure and dyspnea', triage: 'RED', status: 'dispatched' },
  { id: 103, time: '10:50 AM', caller: '+251 933 678 901', location: 'Sor River Bridge', description: 'Fall from height, closed forearm fracture, hemodynamically stable', triage: 'YELLOW', status: 'completed' },
];

export default function EMSPage(): React.ReactElement {
  const { t } = useTranslation();
  const [fleet] = useState<AmbulanceItem[]>(mockFleet);
  const [calls, setCalls] = useState<EmergencyCallItem[]>(mockCalls);
  const [searchTerm, setSearchTerm] = useState('');

  const dispatchAmbulance = (callId: number) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: 'dispatched' } : c))
    );
  };

  const availableFleetCount = useMemo(() => fleet.filter((a) => a.status === 'available').length, [fleet]);
  const enRouteCount = useMemo(() => fleet.filter((a) => a.status === 'en_route' || a.status === 'on_scene').length, [fleet]);

  const filteredCalls = useMemo(() => {
    if (!searchTerm) return calls;
    const q = searchTerm.toLowerCase();
    return calls.filter(
      (c) =>
        c.caller.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [calls, searchTerm]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-[#131824] px-6 py-5 rounded-2xl border border-slate-200 dark:border-[#222b3d] shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] shrink-0">
                <Ambulance className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('ems_dispatch')} • 907 Emergency Hotline & Ambulance Fleet
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#102419] text-[#34d399] border border-[#059669]/40 shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
                    GPS Telematics Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Toll-Free 907 Hotline Intake • Pre-Hospital Trauma Triage • GPS Telematics & Bay Dispatching
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/15 px-3.5 py-1.5 text-xs font-semibold text-rose-300 border border-rose-500/40 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <PhoneCall className="h-3.5 w-3.5" />
                907 Hotline: ONLINE
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards (Obsidian & Sparklines) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 1. 907 Calls Today
                </span>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <PhoneCall className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">26 Calls</p>
                <svg className="h-5 w-16 text-rose-500/60" viewBox="0 0 64 20" fill="none">
                  <path d="M 0 15 Q 20 6 36 14 T 64 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-rose-400/90 font-medium">14 Trauma • 8 Obstetric • 4 Medical</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 2. Available Fleet
                </span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-emerald-400">{availableFleetCount} Units</p>
                <svg className="h-5 w-16 text-emerald-500/60" viewBox="0 0 64 20" fill="none">
                  <path d="M 0 16 Q 16 4 36 12 T 64 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-slate-400">Stationed in hospital emergency bay</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 3. En-Route / On-Scene
                </span>
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Navigation className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-amber-300">{enRouteCount} Active</p>
                <svg className="h-5 w-16 text-amber-400/70" viewBox="0 0 64 20" fill="none">
                  <path d="M 0 14 Q 24 18 40 8 T 64 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-amber-400/80 font-medium">AMB-02 (Gore Road, ETA 8 min)</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 4. Average Urban ETA
                </span>
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">9.4 Min</p>
                <svg className="h-5 w-16 text-sky-500/60" viewBox="0 0 64 20" fill="none">
                  <path d="M 0 12 Q 20 16 40 6 T 64 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-slate-400">Catchment: Mettu, Hurumu, Gore</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 907 Incoming Calls Queue */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                  Incoming Emergency 907 Hotline Calls
                </h3>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search location, caller..."
                    className="w-full rounded-xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#0b0f17] pl-7 pr-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredCalls.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222b3d] pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          c.triage === 'RED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {c.triage} PRIORITY
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-semibold">{c.time}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-300 bg-[#0b0f17] border border-[#222b3d] px-2.5 py-0.5 rounded-lg">
                        {c.caller}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{c.description}</p>
                      <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{c.location}</span>
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-[#222b3d] pt-3">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Status: <strong className="text-amber-400">{c.status}</strong>
                      </span>
                      {c.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => dispatchAmbulance(c.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 text-slate-950 font-bold px-4 py-1.5 text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                        >
                          <Send className="h-3 w-3 text-slate-950" />
                          Dispatch Ambulance Now
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                          <Check className="h-3.5 w-3.5" />
                          Unit En Route
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ambulance Fleet Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Ambulance className="h-4 w-4 text-amber-400" />
                Ambulance Fleet Status
              </h3>

              <div className="space-y-3">
                {fleet.map((amb) => (
                  <div
                    key={amb.id}
                    className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{amb.callSign}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({amb.plateNumber})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        amb.status === 'available'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-sky-500/15 text-sky-300 border border-sky-500/30 animate-pulse'
                      }`}>
                        {amb.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{amb.type}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Crew: {amb.crew}
                    </p>
                    <p className="text-[11px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {amb.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
