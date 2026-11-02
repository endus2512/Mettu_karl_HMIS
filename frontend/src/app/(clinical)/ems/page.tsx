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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <Ambulance className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('ems_dispatch')} • 907 Emergency Hotline & Ambulance Fleet
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Toll-Free 907 Hotline Intake • Pre-Hospital Trauma Triage • GPS Telematics & Bay Dispatching
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-600" />
                <PhoneCall className="h-3.5 w-3.5" />
                907 Hotline: ONLINE
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">907 Calls Today</span>
                <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <PhoneCall className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">26 Calls</p>
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">14 Trauma • 8 Obstetric • 4 Medical</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Fleet</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{availableFleetCount} Ambulances</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Stationed in hospital emergency bay</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">En-Route / On-Scene</span>
                <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Navigation className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{enRouteCount} Active Units</p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">AMB-02 (Gore Road, ETA 8 min)</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Urban ETA</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">9.4 Min</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Catchment: Mettu, Hurumu, Gore</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 907 Incoming Calls Queue */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  Incoming Emergency 907 Hotline Calls
                </h3>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search location, caller..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-7 pr-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredCalls.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          c.triage === 'RED'
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {c.triage} PRIORITY
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-semibold">{c.time}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
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

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Status: <strong className="text-teal-700 dark:text-teal-400">{c.status}</strong>
                      </span>
                      {c.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => dispatchAmbulance(c.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-1.5 text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          <Send className="h-3 w-3" />
                          Dispatch Ambulance Now
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
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
                <Ambulance className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Ambulance Fleet Status
              </h3>

              <div className="space-y-3">
                {fleet.map((amb) => (
                  <div
                    key={amb.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{amb.callSign}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({amb.plateNumber})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        amb.status === 'available'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 animate-pulse'
                      }`}>
                        {amb.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{amb.type}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Crew: {amb.crew}
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold mt-1 flex items-center gap-1">
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
