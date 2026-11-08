/**
 * Mettu Karl Referral Hospital — Receptionist, Admissions & Queue Dashboard
 * Dedicated operational view for Front Desk Registrars and Admissions Staff.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import {
  Ticket,
  Users,
  Fingerprint,
  Clock,
  Ambulance,
  Tv,
  ArrowRight,
  Volume2,
  CheckCircle2,
  Search,
  UserPlus,
} from 'lucide-react';

interface QueueItem {
  token: string;
  mrn: string;
  patientName: string;
  clinic: string;
  category: 'general' | 'pediatric' | 'emergency' | 'anc';
  status: 'waiting' | 'called' | 'in_room';
}

const INITIAL_QUEUE: QueueItem[] = [
  {
    token: 'A-012',
    mrn: 'MKH-2026-000101',
    patientName: 'Gudeta Hailu Tadesse',
    clinic: 'OPD Clinic 02 (Dr. Bekele)',
    category: 'general',
    status: 'in_room',
  },
  {
    token: 'A-015',
    mrn: 'MKH-2026-000102',
    patientName: 'Ayantu Mamo Kassa',
    clinic: 'OPD Clinic 01 (Dr. Sisay)',
    category: 'general',
    status: 'called',
  },
  {
    token: 'P-004',
    mrn: 'MKH-2026-000106',
    patientName: 'Lensa Tolera (Child)',
    clinic: 'Pediatric Clinic 01',
    category: 'pediatric',
    status: 'waiting',
  },
  {
    token: 'E-003',
    mrn: 'MKH-2026-000104',
    patientName: 'Chala Tolera Lemma',
    clinic: 'Acute Resuscitation ER',
    category: 'emergency',
    status: 'in_room',
  },
];

export function ReceptionistDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);

  const handleCall = (token: string) => {
    setQueue((prev) =>
      prev.map((q) => (q.token === token ? { ...q, status: 'called' } : q))
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. RECEPTION HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#101624] border border-[#222b3d] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Simannaa, Galmee & To\'annoo Dabaree (Queue)'
                  : lang === 'am'
                  ? 'የመቀበያ፣ ምዝገባና የተራ መቆጣጠሪያ ማዕከል'
                  : 'Front Desk Admissions & Patient Queue Dashboard'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono font-semibold">
                RECEPTION ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'om'
                ? 'Galmee dhukkubsataa haaraa, baafata token dabaree, fi eenyummaa Fayda'
                : 'Walk-in patient registration, token generation, lobby TV queue dispatch, and Fayda biometric ID'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Galmee Haaraa' : 'New Patient'}</span>
          </Link>
          <Link
            href="/queue"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-amber-300 text-xs font-semibold transition cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'To\'annoo TV' : 'TV Queue'}</span>
          </Link>
          <Link
            href="/fayda"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-emerald-300 text-xs font-semibold transition cursor-pointer"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Eenyummaa Fayda' : 'Fayda ID'}</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Galmee Har\'aa' : 'Registrations Today'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">48</span>
              <span className="text-[11px] text-teal-400 font-medium">36 walk-ins</span>
            </div>
            <p className="text-[10px] text-slate-500">12 online appointments</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Dabaree Eeggachaa Jiru' : 'Waiting in Lobby'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">18</span>
              <span className="text-[11px] text-amber-400 font-medium">tokens</span>
            </div>
            <p className="text-[10px] text-slate-500">Avg wait: 12 minutes</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Fayda Mirkanaa\'e' : 'Fayda Verified'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">35</span>
              <span className="text-[11px] text-emerald-400 font-medium">73% of total</span>
            </div>
            <p className="text-[10px] text-slate-500">National ID linked</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Fingerprint className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Seensa Tasaa (ER)' : 'Emergency Intakes'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">3</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                EMS 907
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Dispatched directly to ER</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <Ambulance className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. LIVE QUEUE TABLE */}
      <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'om' ? 'Dabaree OPD fi Kutaa Tajaajilaa' : 'Live OPD Patient Tokens & Dispatch Matrix'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Main OPD Lobby Screen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1f293d] pb-2">
              <tr>
                <th className="pb-2">Token # / MRN</th>
                <th className="pb-2">{lang === 'om' ? 'Dhukkubsataa' : 'Patient Name'}</th>
                <th className="pb-2">{lang === 'om' ? 'Kutaa / Ogeessa' : 'Assigned Clinic & Room'}</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2336]">
              {queue.map((q) => (
                <tr key={q.token} className="hover:bg-[#141b2b] transition">
                  <td className="py-3 font-mono">
                    <span className="font-bold text-amber-400 block">{q.token}</span>
                    <span className="text-[10px] text-slate-500">{q.mrn}</span>
                  </td>
                  <td className="py-3 font-semibold text-white">
                    {q.patientName}
                  </td>
                  <td className="py-3 text-teal-300">
                    {q.clinic}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        q.category === 'emergency'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : q.category === 'pediatric'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {q.category}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        q.status === 'in_room'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : q.status === 'called'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleCall(q.token)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold shadow-md transition cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{lang === 'om' ? 'Waami' : 'Call Next'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
