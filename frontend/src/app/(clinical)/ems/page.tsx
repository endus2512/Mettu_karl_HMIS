/**
 * EMS 907 Emergency Hotline, Triage & Ambulance Dispatch Workstation.
 * GPS ambulance dispatching with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

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

  const dispatchAmbulance = (callId: number) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: 'dispatched' } : c))
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header Bar with Rectangular Responsive Spotlight */}
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  🚑
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('ems_dispatch')} • 907 Emergency Hotline & Ambulance Fleet
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Toll-Free 907 Hotline Intake • Pre-Hospital Trauma Triage • GPS Telematics & Bay Dispatching
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-2 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-600" />
                907 Hotline: ONLINE
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">907 Calls Today</span>
              <p className="mt-2 text-3xl font-black text-rose-900 group-hover:text-rose-950 transition-colors">26 Calls</p>
              <p className="mt-1 text-xs text-rose-600 font-bold">14 Trauma • 8 Obstetric • 4 Medical</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Available Fleet</span>
              <p className="mt-2 text-3xl font-black text-teal-900 group-hover:text-teal-950 transition-colors">3 Ambulances</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Ready in Hospital Bay</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-blue-500 hover:bg-blue-50/70 hover:ring-2 hover:ring-blue-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">En-Route / On-Scene</span>
              <p className="mt-2 text-3xl font-black text-blue-900 group-hover:text-blue-950 transition-colors">1 Active Unit</p>
              <p className="mt-1 text-xs text-blue-600 font-bold">AMB-02 (Gore Road, ETA 8 min)</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Urban ETA</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">9.4 Min</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Catchment: Mettu, Hurumu, Gore</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 907 Calls Queue (Floating Card-Rows) */}
            <div className="col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Incoming Emergency 907 Hotline Calls
              </h3>
              <div className="space-y-3">
                {calls.map((c) => (
                  <div
                    key={c.id}
                    className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 group-hover:border-teal-200/60 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                          c.triage === 'RED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {c.triage} PRIORITY
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-bold">{c.time}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {c.caller}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs font-semibold">
                      <p className="font-black text-slate-900 text-sm group-hover:text-teal-950 transition-colors">{c.description}</p>
                      <p className="text-slate-500">📍 Location: <span className="font-bold text-slate-700">{c.location}</span></p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 group-hover:border-teal-200/60 pt-3 transition-colors">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Status: <span className="text-teal-800 font-black">{c.status}</span>
                      </span>
                      {c.status === 'pending' ? (
                        <button
                          onClick={() => dispatchAmbulance(c.id)}
                          className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-black text-white hover:bg-rose-700 hover:ring-2 hover:ring-rose-400/40 transition-all cursor-pointer shadow-xs"
                        >
                          🚨 Dispatch Ambulance Now
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700">✓ Unit En Route</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ambulance Fleet Cards */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200 space-y-3">
              <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Ambulance Fleet Status
              </h3>
              <div className="space-y-3">
                {fleet.map((amb) => (
                  <div
                    key={amb.id}
                    className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/70 hover:border-teal-400 hover:bg-teal-50/50 transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-xs text-slate-900">{amb.callSign}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        amb.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                      }`}>
                        {amb.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700">{amb.type}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Crew: {amb.crew}</p>
                    <p className="text-[10px] text-teal-800 font-bold mt-1">📍 {amb.location}</p>
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
