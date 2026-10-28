/**
 * Pharmacy & Inventory Management with FEFO Expiry Tracking and CDSS.
 * High-performance clinical pharmacology workstation with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { AlertModal, InteractionWarning, AllergyWarning } from '@/components/cdss/AlertModal';

interface DrugItem {
  name: string;
  generic: string;
  form: string;
  batch: string;
  qty: number;
  expiry: string;
  status: 'good' | 'expiring' | 'low';
}

const mockInventory: DrugItem[] = [
  { name: 'Amoxicillin 500mg', generic: 'Amoxicillin', form: 'Capsule', batch: 'BAT-101', qty: 45, expiry: '2026-12-15', status: 'expiring' },
  { name: 'Paracetamol 500mg', generic: 'Acetaminophen', form: 'Tablet', batch: 'BAT-204', qty: 24, expiry: '2027-08-20', status: 'low' },
  { name: 'Ciprofloxacin 500mg', generic: 'Ciprofloxacin', form: 'Tablet', batch: 'BAT-302', qty: 120, expiry: '2027-04-10', status: 'good' },
  { name: 'Ceftriaxone 1g Inj', generic: 'Ceftriaxone', form: 'Injection', batch: 'BAT-405', qty: 15, expiry: '2026-11-30', status: 'low' },
  { name: 'Ibuprofen 400mg', generic: 'Ibuprofen', form: 'Tablet', batch: 'BAT-501', qty: 200, expiry: '2028-01-15', status: 'good' },
  { name: 'Warfarin 5mg', generic: 'Warfarin', form: 'Tablet', batch: 'BAT-601', qty: 60, expiry: '2027-09-01', status: 'good' },
];

export default function PharmacyPage(): React.ReactElement {
  const { t } = useTranslation();
  const [inventory] = useState<DrugItem[]>(mockInventory);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [cdssInteractions, setCdssInteractions] = useState<InteractionWarning[]>([]);
  const [cdssAllergies, setCdssAllergies] = useState<AllergyWarning[]>([]);

  const handleTestCDSS = () => {
    setCdssInteractions([
      {
        drug_a: 'Warfarin 5mg',
        drug_b: 'Aspirin 81mg',
        severity: 'critical',
        clinical_effect: 'Severe hemorrhage and gastrointestinal bleeding risk.',
        recommendation: 'Avoid co-administration. Choose alternative analgesic (e.g. Paracetamol).',
      },
    ]);
    setCdssAllergies([
      {
        drug_name: 'Amoxicillin 500mg',
        allergen_substance: 'Penicillin',
        reaction: 'Severe Anaphylactic Shock',
        severity: 'critical',
      },
    ]);
    setIsAlertOpen(true);
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  💊
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('pharmacy')} • FEFO Inventory & CDSS Alert System
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {t('fefo_expiry')} • First-Expired, First-Out Allocation • Clinical Drug-Drug & Allergy CDSS
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleTestCDSS}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-rose-700 hover:ring-2 hover:ring-rose-400/50 hover:shadow-md transition-all cursor-pointer"
              >
                <span>🧪</span> Test CDSS Safety Check
              </button>
            </div>
          </div>

          {/* Quick Stats / Stock Alerts with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">{t('low_stock_warning')}</span>
              <p className="mt-2 text-3xl font-black text-rose-900 group-hover:text-rose-950 transition-colors">2 Items</p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">Stock below safety reorder threshold</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Expiring in 90 Days</span>
              <p className="mt-2 text-3xl font-black text-amber-900 group-hover:text-amber-950 transition-colors">1 Batch</p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">FEFO priority dispatch recommended</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Healthy Stock</span>
              <p className="mt-2 text-3xl font-black text-teal-900 group-hover:text-teal-950 transition-colors">14 Formulary Drugs</p>
              <p className="mt-1 text-xs text-teal-600 font-semibold">Adequate coverage for OPD & IPD wards</p>
            </div>
          </div>

          {/* Inventory Floating Card-Rows Table with Rectangular Spotlight */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-2">Medication Name</th>
                  <th className="px-5 py-2">Generic / Class</th>
                  <th className="px-5 py-2">Batch #</th>
                  <th className="px-5 py-2">Quantity</th>
                  <th className="px-5 py-2">Expiry Date (FEFO)</th>
                  <th className="px-5 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => (
                  <tr
                    key={idx}
                    className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                  >
                    <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm">
                      {item.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{item.form}</span>
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-semibold text-slate-700">
                      {item.generic}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono text-teal-800 font-bold">
                      {item.batch}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900">
                      {item.qty} units
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700 font-mono">
                      {item.expiry}
                    </td>
                    <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                      {item.status === 'expiring' && (
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[10px] font-black text-amber-800">
                          Expiring Soon
                        </span>
                      )}
                      {item.status === 'low' && (
                        <span className="rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-[10px] font-black text-rose-800 animate-pulse">
                          Low Stock
                        </span>
                      )}
                      {item.status === 'good' && (
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-[10px] font-black text-emerald-800">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CDSS Warning Modal */}
          <AlertModal
            isOpen={isAlertOpen}
            onClose={() => setIsAlertOpen(false)}
            onOverrideConfirm={() => setIsAlertOpen(false)}
            interactions={cdssInteractions}
            allergies={cdssAllergies}
          />
        </main>
      </div>
    </div>
  );
}
