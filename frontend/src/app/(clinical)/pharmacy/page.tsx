/**
 * Pharmacy & Inventory Management with FEFO Expiry Tracking and CDSS.
 * Mettu Karl Referral Hospital HMIS — Enterprise Healthcare Design System:
 * - FEFO (First-Expired, First-Out) stock allocation
 * - Real-time Clinical Decision Support System (CDSS) for Drug-Drug interactions & Allergies
 * - High-density clinical formulary inventory table with instant search and status filtering
 * - Full light & dark mode support
 * - Modern Lucide SVG icons
 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  Pill,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ShieldAlert,
  Barcode,
  PackageCheck,
  PackageX,
  Layers,
  ArrowUpDown,
  Filter,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { AlertModal, InteractionWarning, AllergyWarning } from '@/components/cdss/AlertModal';
import { notifications } from '@mantine/notifications';

interface DrugItem {
  id: string;
  name: string;
  generic: string;
  category: string;
  form: string;
  batch: string;
  qty: number;
  reorderLevel: number;
  expiry: string;
  unitPriceETB: number;
  status: 'good' | 'expiring' | 'low';
}

const INITIAL_INVENTORY: DrugItem[] = [
  {
    id: 'drg-1',
    name: 'Amoxicillin 500mg',
    generic: 'Amoxicillin Trihydrate',
    category: 'Antibacterial / Penicillin',
    form: 'Capsule',
    batch: 'BAT-2026-101',
    qty: 45,
    reorderLevel: 100,
    expiry: '2026-12-15',
    unitPriceETB: 4.5,
    status: 'expiring',
  },
  {
    id: 'drg-2',
    name: 'Paracetamol 500mg',
    generic: 'Acetaminophen',
    category: 'Analgesic / Antipyretic',
    form: 'Tablet',
    batch: 'BAT-2026-204',
    qty: 24,
    reorderLevel: 150,
    expiry: '2027-08-20',
    unitPriceETB: 1.2,
    status: 'low',
  },
  {
    id: 'drg-3',
    name: 'Ciprofloxacin 500mg',
    generic: 'Ciprofloxacin HCl',
    category: 'Fluoroquinolone',
    form: 'Tablet',
    batch: 'BAT-2026-302',
    qty: 120,
    reorderLevel: 50,
    expiry: '2027-04-10',
    unitPriceETB: 8.0,
    status: 'good',
  },
  {
    id: 'drg-4',
    name: 'Ceftriaxone 1g Inj',
    generic: 'Ceftriaxone Sodium',
    category: 'Cephalosporin 3rd Gen',
    form: 'Vial / Injection',
    batch: 'BAT-2026-405',
    qty: 15,
    reorderLevel: 60,
    expiry: '2026-11-30',
    unitPriceETB: 65.0,
    status: 'low',
  },
  {
    id: 'drg-5',
    name: 'Ibuprofen 400mg',
    generic: 'Ibuprofen',
    category: 'NSAID / Anti-inflammatory',
    form: 'Tablet',
    batch: 'BAT-2026-501',
    qty: 200,
    reorderLevel: 80,
    expiry: '2028-01-15',
    unitPriceETB: 2.5,
    status: 'good',
  },
  {
    id: 'drg-6',
    name: 'Warfarin 5mg',
    generic: 'Warfarin Sodium',
    category: 'Oral Anticoagulant',
    form: 'Tablet',
    batch: 'BAT-2026-601',
    qty: 60,
    reorderLevel: 30,
    expiry: '2027-09-01',
    unitPriceETB: 12.0,
    status: 'good',
  },
  {
    id: 'drg-7',
    name: 'Omeprazole 20mg',
    generic: 'Omeprazole',
    category: 'Proton Pump Inhibitor',
    form: 'Delayed-Release Capsule',
    batch: 'BAT-2026-702',
    qty: 180,
    reorderLevel: 50,
    expiry: '2027-11-12',
    unitPriceETB: 5.5,
    status: 'good',
  },
  {
    id: 'drg-8',
    name: 'Artemether-Lumefantrine (Coartem)',
    generic: 'Artemether 20mg / Lumefantrine 120mg',
    category: 'Antimalarial ACT',
    form: 'Tablet 6x4',
    batch: 'BAT-2026-809',
    qty: 350,
    reorderLevel: 100,
    expiry: '2027-06-30',
    unitPriceETB: 0.0, // National Malaria Program free
    status: 'good',
  },
];

export default function PharmacyPage(): React.ReactElement {
  const { t, language } = useTranslation();
  const [inventory, setInventory] = useState<DrugItem[]>(INITIAL_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'expiring' | 'good'>('all');
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

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.generic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchTerm, statusFilter]);

  const lowStockCount = useMemo(() => inventory.filter((i) => i.status === 'low').length, [inventory]);
  const expiringCount = useMemo(() => inventory.filter((i) => i.status === 'expiring').length, [inventory]);
  const goodCount = useMemo(() => inventory.filter((i) => i.status === 'good').length, [inventory]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 shadow-xs shrink-0">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{t('pharmacy')}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">FEFO Inventory & CDSS Safety</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  First-Expired, First-Out (FEFO) Allocation • Automated Drug-Drug & Allergy Contraindication Checks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleTestCDSS}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-200" />
                <span>Test CDSS Safety Alerts</span>
              </button>
            </div>
          </div>

          {/* Quick Stats / Stock Alerts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Low Stock Warning */}
            <div
              onClick={() => setStatusFilter('low')}
              className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-4.5 shadow-xs hover:border-rose-400 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  {t('low_stock_warning')}
                </span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                  <PackageX className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">{lowStockCount} Medications</p>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">Below safety reorder threshold</p>
            </div>

            {/* Expiring in 90 Days */}
            <div
              onClick={() => setStatusFilter('expiring')}
              className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 p-4.5 shadow-xs hover:border-amber-400 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  FEFO Expiring &lt; 90 Days
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">{expiringCount} Batches</p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">Priority dispense recommended</p>
            </div>

            {/* Healthy Stock */}
            <div
              onClick={() => setStatusFilter('good')}
              className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-white dark:bg-slate-900 p-4.5 shadow-xs hover:border-teal-400 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  Adequate Stock
                </span>
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-teal-700 dark:text-teal-400">{goodCount} Formulary Drugs</p>
              <p className="mt-1 text-xs text-teal-600 dark:text-teal-400 font-medium">Adequate hospital buffer stock</p>
            </div>
          </div>

          {/* Search Bar & Status Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'om' ? 'Qoricha, generic, ykn batch barbaadi...' : 'Search brand, generic, batch...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-medium border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({inventory.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('low')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'low'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Low ({lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expiring')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'expiring'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Expiring ({expiringCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('good')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  statusFilter === 'good'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Healthy ({goodCount})
              </button>
            </div>
          </div>

          {/* Pharmacy Inventory Data Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Medication Name</th>
                    <th className="px-4 py-3">Generic / Pharmacology</th>
                    <th className="px-4 py-3">Batch Number</th>
                    <th className="px-4 py-3">In-Stock Qty</th>
                    <th className="px-4 py-3">Expiry Date (FEFO)</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3 text-right">FEFO Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</p>
                        <span className="text-[11px] text-slate-400">{item.form}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.generic}</p>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-teal-700 dark:text-teal-400">
                        {item.batch}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`font-bold text-sm ${item.qty <= item.reorderLevel ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.qty} units
                        </span>
                        <span className="block text-[10px] text-slate-400">Min: {item.reorderLevel}</span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {item.expiry}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-800 dark:text-slate-200">
                        {item.unitPriceETB > 0 ? `${item.unitPriceETB.toFixed(2)} ETB` : 'Government Program (Free)'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {item.status === 'expiring' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Expiring Soon</span>
                          </span>
                        )}
                        {item.status === 'low' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Low Stock</span>
                          </span>
                        )}
                        {item.status === 'good' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No pharmaceutical formulary items match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
