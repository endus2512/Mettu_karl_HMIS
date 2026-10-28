/**
 * Biomedical Equipment & Capital Asset Management.
 * Medical equipment tracking with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface BioAsset {
  tag: string;
  name: string;
  category: string;
  dept: string;
  room: string;
  ppmDate: string;
  status: 'operational' | 'maintenance' | 'critical';
}

const mockAssets: BioAsset[] = [
  { tag: 'VENT-ICU-01', name: 'Hamilton C6 Ventilator', category: 'Life Support', dept: 'ICU Ward', room: 'Bed 2', ppmDate: '2026-11-15', status: 'operational' },
  { tag: 'ANESTH-OT-02', name: 'Dräger Fabius Plus Anesthesia', category: 'Life Support', dept: 'Operating Room', room: 'OT Suite 2', ppmDate: '2026-10-30', status: 'maintenance' },
  { tag: 'US-MAT-01', name: 'GE Voluson E8 Ultrasound', category: 'Diagnostic', dept: 'Maternity Ward', room: 'Scan Room 1', ppmDate: '2027-01-10', status: 'operational' },
  { tag: 'DEFIB-EMG-04', name: 'Zoll R Series Defibrillator', category: 'Life Support', dept: 'Emergency Dept', room: 'Crash Cart A', ppmDate: '2026-11-05', status: 'operational' },
  { tag: 'AUTO-CSSD-01', name: 'Tuttnauer 5075 Autoclave', category: 'Facility', dept: 'CSSD Dept', room: 'Sterilization Bay', ppmDate: '2026-10-28', status: 'critical' },
];

export default function AssetsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [assets] = useState<BioAsset[]>(mockAssets);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedAssetTag, setSelectedAssetTag] = useState('');

  const handleOpenWorkOrder = (tag: string) => {
    setSelectedAssetTag(tag);
    setShowWorkOrderModal(true);
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
                  🔬
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('assets')} • Biomedical Engineering & Asset Lifecycle
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Capital Equipment Tracking • PPM Scheduled Maintenance • Barcode Asset Registry
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                142 Active Biomedical Devices
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-800 transition-colors">
                Total Capital Value
              </span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">
                48,250,000 ETB
              </p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Covered under hospital equipment insurance</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">PPM Due In 30 Days</span>
              <p className="mt-2 text-3xl font-black text-amber-900 group-hover:text-amber-950 transition-colors">
                4 Devices
              </p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">Requires calibration & filter replacement</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Active Breakdown Tickets</span>
              <p className="mt-2 text-3xl font-black text-rose-900 group-hover:text-rose-950 transition-colors">
                1 Device
              </p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">Tuttnauer Autoclave (CSSD Room 1)</p>
            </div>
          </div>

          {/* Biomedical Devices Table (Floating Card-Rows) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-2">Asset Tag / ID</th>
                  <th className="px-5 py-2">Device Name</th>
                  <th className="px-5 py-2">Category</th>
                  <th className="px-5 py-2">Department / Room</th>
                  <th className="px-5 py-2">Next PPM Date</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2 text-right">Work Order</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.tag}
                    className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                  >
                    <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                      {asset.tag}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm">
                      {asset.name}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-semibold text-slate-700">
                      {asset.category}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-medium text-slate-600">
                      {asset.dept} • {asset.room}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-bold text-slate-700">
                      {asset.ppmDate}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                      {asset.status === 'operational' && (
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-[10px] font-black text-emerald-800">
                          Operational
                        </span>
                      )}
                      {asset.status === 'maintenance' && (
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[10px] font-black text-amber-800">
                          PPM Due
                        </span>
                      )}
                      {asset.status === 'critical' && (
                        <span className="rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-[10px] font-black text-rose-800 animate-pulse">
                          Breakdown
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                      <button
                        onClick={() => handleOpenWorkOrder(asset.tag)}
                        className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                      >
                        Create Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Work Order Modal */}
          {showWorkOrderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border-2 border-teal-500 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">
                    Create Biomedical Work Order ({selectedAssetTag})
                  </h3>
                  <button
                    onClick={() => setShowWorkOrderModal(false)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Issue Description</label>
                    <textarea
                      placeholder="Specify failure symptoms, error codes, or calibration anomalies..."
                      className="w-full rounded-2xl border-2 border-slate-200 p-3 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Priority</label>
                    <select className="w-full rounded-xl border-2 border-slate-200 p-2.5 text-xs font-bold">
                      <option>Urgent / Life Support Critical</option>
                      <option>Routine Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setShowWorkOrderModal(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowWorkOrderModal(false)}
                    className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer shadow-sm"
                  >
                    Dispatch Biomedical Engineer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
