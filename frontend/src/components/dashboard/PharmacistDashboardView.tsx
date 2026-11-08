/**
 * Mettu Karl Referral Hospital — Pharmacy Dispensing & Inventory Dashboard
 * Dedicated operational view for Pharmacists and Dispensary Officers.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import {
  Pill,
  Clock,
  AlertTriangle,
  PackageCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Barcode,
  Search,
} from 'lucide-react';

interface RxItem {
  rxId: string;
  mrn: string;
  patientName: string;
  doctor: string;
  drug: string;
  dosage: string;
  batch: string;
  status: 'pending' | 'verified' | 'dispensed';
}

const INITIAL_RX: RxItem[] = [
  {
    rxId: 'RX-2026-9041',
    mrn: 'MKH-2026-000101',
    patientName: 'Gudeta Hailu Tadesse',
    doctor: 'Dr. Bekele Tadesse',
    drug: 'Coartem (Artemether + Lumefantrine) 20/120mg',
    dosage: '4 tabs BID for 3 days',
    batch: 'BAT-2026-042',
    status: 'pending',
  },
  {
    rxId: 'RX-2026-9042',
    mrn: 'MKH-2026-000102',
    patientName: 'Ayantu Mamo Kassa',
    doctor: 'Dr. Sisay Lemma',
    drug: 'Ciprofloxacin 500mg Tablets',
    dosage: '1 tab PO BID x 7 days',
    batch: 'BAT-2025-119',
    status: 'pending',
  },
  {
    rxId: 'RX-2026-9043',
    mrn: 'MKH-2026-000103',
    patientName: 'Derartu Tulu Gemechu',
    doctor: 'Dr. Helen Kassa',
    drug: 'Ferrous Sulfate + Folic Acid 200/0.4mg',
    dosage: '1 tab daily x 30 days',
    batch: 'BAT-2026-008',
    status: 'verified',
  },
  {
    rxId: 'RX-2026-9044',
    mrn: 'MKH-2026-000105',
    patientName: 'Chaltu Daba Tolasa',
    doctor: 'Dr. Chala Gemechu',
    drug: 'Hydralazine 25mg Tablets',
    dosage: '25mg PO TID',
    batch: 'BAT-2026-077',
    status: 'pending',
  },
];

export function PharmacistDashboardView(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const [rxList, setRxList] = useState<RxItem[]>(INITIAL_RX);

  const handleDispense = (rxId: string) => {
    setRxList((prev) =>
      prev.map((item) => (item.rxId === rxId ? { ...item, status: 'dispensed' } : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. PHARMACY HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#101624] border border-[#222b3d] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'om'
                  ? 'Wiirtuu Faarmaasii & Raabsa Qorichaa (Dispensary)'
                  : lang === 'am'
                  ? 'የፋርማሲና የመድኃኒት ማሰራጫ የስራ ማዕከል'
                  : 'Pharmacy Dispensing & FEFO Inventory Dashboard'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-semibold">
                PHARMACY ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'om'
                ? 'Mirkanneessa resephii, qajeelfama FEFO (First-Expired, First-Out), fi to\'annoo kuusaa'
                : 'Prescription dispensing verification, FEFO batch expiry control, and EFDA drug safety'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/pharmacy"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Pill className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Faarmaasii Guutuu' : 'Full Pharmacy'}</span>
          </Link>
          <Link
            href="/procurement"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-teal-300 text-xs font-semibold transition cursor-pointer"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Bittaa Qorichaa' : 'Procurement'}</span>
          </Link>
          <Link
            href="/efda"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172238] hover:bg-[#1f2d4a] border border-[#2c3d60] text-sky-300 text-xs font-semibold transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Qorannoo EFDA' : 'EFDA Safety'}</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Resephii Eeggachaa Jiru' : 'Pending Prescriptions'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">9</span>
              <span className="text-[11px] text-amber-400/90 font-medium">in queue</span>
            </div>
            <p className="text-[10px] text-slate-500">Avg wait: 6 minutes</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'FEFO Dhumuuf Ga\'e' : 'Near-Expiry (FEFO)'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">3</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                &lt; 60 DAYS
              </span>
            </div>
            <p className="text-[10px] text-rose-400/80">Ceftriaxone, Amoxicillin batches</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Hanqina Kuusaa' : 'Low Stock Warning'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-300">4</span>
              <span className="text-[11px] text-amber-300 font-medium">items</span>
            </div>
            <p className="text-[10px] text-slate-500">Paracetamol 500mg &lt; reorder</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Har\'a kan Raabsame' : 'Dispensed Today'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">168</span>
              <span className="text-[11px] text-emerald-400 font-medium">units</span>
            </div>
            <p className="text-[10px] text-slate-500">42 patient tickets served</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. PRESCRIPTION DISPENSING WORKLIST */}
      <div className="rounded-2xl bg-[#101624] border border-[#222b3d] p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'om' ? 'Tarree Resephii Raabsamuuf Jiran' : 'Prescription Dispensing Worklist'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            FEFO Validated Dispensary
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1f293d] pb-2">
              <tr>
                <th className="pb-2">Rx ID / MRN</th>
                <th className="pb-2">{lang === 'om' ? 'Dhukkubsataa & Doktoora' : 'Patient & Doctor'}</th>
                <th className="pb-2">{lang === 'om' ? 'Qoricha & Ajaja' : 'Prescribed Drug & Regimen'}</th>
                <th className="pb-2">Batch #</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2336]">
              {rxList.map((item) => (
                <tr key={item.rxId} className="hover:bg-[#141b2b] transition">
                  <td className="py-3 font-mono">
                    <span className="font-bold text-amber-400 block">{item.rxId}</span>
                    <span className="text-[10px] text-slate-500">{item.mrn}</span>
                  </td>
                  <td className="py-3">
                    <span className="font-bold text-white block">{item.patientName}</span>
                    <span className="text-[10px] text-slate-400">{item.doctor}</span>
                  </td>
                  <td className="py-3">
                    <span className="font-semibold text-teal-300 block">{item.drug}</span>
                    <span className="text-[10px] text-slate-300">{item.dosage}</span>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-slate-300">
                    {item.batch}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        item.status === 'dispensed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : item.status === 'verified'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {item.status !== 'dispensed' ? (
                      <button
                        type="button"
                        onClick={() => handleDispense(item.rxId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{lang === 'om' ? 'Raabsi' : 'Dispense'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        ✓ {lang === 'om' ? 'Kenfameera' : 'Completed'}
                      </span>
                    )}
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
