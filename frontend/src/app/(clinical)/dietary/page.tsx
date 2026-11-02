/**
 * Dietary & Kitchen Management Workstation.
 * Clinical inpatient nutrition, therapeutic diets & NPO fasting safeguards.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Utensils,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Truck,
  Apple,
  Check,
  Building2,
  ShieldCheck,
  ChefHat
} from 'lucide-react';

interface MealOrderItem {
  id: number;
  patient: string;
  ward: string;
  room: string;
  dietType: string;
  meal: string;
  specialNotes: string;
  status: 'preparing' | 'in_transit' | 'delivered';
}

const initialOrders: MealOrderItem[] = [
  { id: 1, patient: 'Chaltu Benti', ward: 'Internal Medicine', room: 'Bed 201', dietType: 'Diabetic (Low GI)', meal: 'Lunch', specialNotes: 'No sugar, portioned carbs, high fiber', status: 'delivered' },
  { id: 2, patient: 'Debela Negassa', ward: 'Surgical Ward', room: 'Bed 105', dietType: 'NPO (Nil Per Os)', meal: 'Lunch', specialNotes: 'Strict fasting - Scheduled for OT at 14:00', status: 'preparing' },
  { id: 3, patient: 'Genet Abera', ward: 'Maternity Ward', room: 'Bed 304', dietType: 'High-Protein & Iron Rich', meal: 'Lunch', specialNotes: 'Post-partum recovery, extra lentils & spinach', status: 'in_transit' },
  { id: 4, patient: 'Tesfaye Roba', ward: 'Renal Care Unit', room: 'Bed 402', dietType: 'Low Sodium / Renal Diet', meal: 'Lunch', specialNotes: 'Restricted potassium, low phosphorus', status: 'in_transit' },
];

export default function DietaryPage(): React.ReactElement {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<MealOrderItem[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');

  const markDelivered = (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' } : o))
    );
  };

  const npoCount = useMemo(() => orders.filter((o) => o.dietType.startsWith('NPO')).length, [orders]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const q = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.patient.toLowerCase().includes(q) ||
        o.ward.toLowerCase().includes(q) ||
        o.dietType.toLowerCase().includes(q) ||
        o.room.toLowerCase().includes(q)
    );
  }, [orders, searchTerm]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('dietary_kitchen')} • Clinical Inpatient Nutrition & Kitchen
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Therapeutic Diet Orders • NPO Fasting Safeguards • Ward Food Cart Tray Dispatch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <ChefHat className="h-3.5 w-3.5" />
                Kitchen Service: Lunch Shift Active
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meals Prepared Today</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Utensils className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">340 Trays</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Breakfast & Lunch distributed across 6 wards</p>
            </div>

            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">NPO Fasting Safeguards</span>
                <span className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300">{npoCount} Patients</p>
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">Strict food & oral fluid hold for OT / Lab</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Specialized Diets</span>
                <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Apple className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">42 Custom Plans</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Renal, Diabetic, High-Protein, Pediatric</p>
            </div>
          </div>

          {/* Meal Orders Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Ward Dietary & Meal Delivery Orders
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track meal tray status from clinical kitchen to bedside cart
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter patient, ward, diet..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Ward / Bed</th>
                    <th className="px-5 py-3">Therapeutic Diet</th>
                    <th className="px-5 py-3">Meal Service</th>
                    <th className="px-5 py-3">Clinical Diet Notes</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-sm">{o.patient}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {o.ward} • <span className="font-mono text-[11px] text-slate-400">{o.room}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          o.dietType.startsWith('NPO')
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {o.dietType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{o.meal}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs">{o.specialNotes}</td>
                      <td className="px-5 py-3.5">
                        {o.status === 'delivered' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Delivered
                          </span>
                        )}
                        {o.status === 'in_transit' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 animate-pulse">
                            <Truck className="h-3 w-3" />
                            In Transit
                          </span>
                        )}
                        {o.status === 'preparing' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            <Clock className="h-3 w-3" />
                            Preparing
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {o.status !== 'delivered' && (
                          <button
                            type="button"
                            onClick={() => markDelivered(o.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            Confirm Delivery
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
