/**
 * Dietary & Kitchen Management Workstation.
 * Clinical inpatient nutrition with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

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

  const markDelivered = (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' } : o))
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  🍲
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('dietary_kitchen')} • Clinical Inpatient Nutrition & Kitchen
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Therapeutic Diet Orders • NPO Fasting Safety Safeguards • Ward Food Cart Tray Dispatch
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Kitchen Service: Lunch Shift Active
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-800 transition-colors">
                Meals Prepared Today
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">340 Trays</p>
              <p className="mt-1 text-xs text-slate-400 font-semibold">Breakfast & Lunch Distributed</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700">NPO Fasting Safeguards</p>
              <p className="mt-2 text-3xl font-black text-rose-600 group-hover:text-rose-950 transition-colors">8 Patients</p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">Strict Meal Hold for Surgery / Lab</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Specialized Diets</p>
              <p className="mt-2 text-3xl font-black text-amber-600 group-hover:text-amber-950 transition-colors">42 Custom Plans</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Renal, Diabetic, High-Protein, Pediatric</p>
            </div>
          </div>

          {/* Meal Orders Table (Floating Card-Rows) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-2">Patient</th>
                  <th className="px-5 py-2">Ward / Bed</th>
                  <th className="px-5 py-2">Therapeutic Diet</th>
                  <th className="px-5 py-2">Meal Service</th>
                  <th className="px-5 py-2">Special Diet Notes</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                  >
                    <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm">
                      {o.patient}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700">
                      {o.ward} • {o.room}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                      <span className={`rounded-xl px-2.5 py-1 text-xs font-black ${
                        o.dietType.startsWith('NPO')
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-50 text-amber-900 border border-amber-300'
                      }`}>
                        {o.dietType}
                      </span>
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-800">
                      {o.meal}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-slate-500">
                      {o.specialNotes}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                      {o.status === 'delivered' && (
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-[10px] font-black text-emerald-800">
                          Delivered
                        </span>
                      )}
                      {o.status === 'in_transit' && (
                        <span className="rounded-full bg-blue-100 border border-blue-300 px-3 py-1 text-[10px] font-black text-blue-800 animate-pulse">
                          In Transit
                        </span>
                      )}
                      {o.status === 'preparing' && (
                        <span className="rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-[10px] font-black text-slate-700">
                          Preparing
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                      {o.status !== 'delivered' && (
                        <button
                          onClick={() => markDelivered(o.id)}
                          className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                        >
                          Confirm Delivery
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
