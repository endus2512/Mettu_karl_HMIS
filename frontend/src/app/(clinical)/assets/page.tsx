/**
 * Biomedical Equipment & Capital Asset Management.
 * Medical equipment tracking, PPM maintenance scheduling & breakdown tickets.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Wrench,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Plus,
  Building2,
  Tag,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

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
  { tag: 'VENT-ICU-01', name: 'Hamilton C6 ICU Mechanical Ventilator', category: 'Life Support', dept: 'ICU Ward', room: 'Bed 2', ppmDate: '2026-11-15', status: 'operational' },
  { tag: 'ANESTH-OT-02', name: 'Dräger Fabius Plus Anesthesia Workstation', category: 'Life Support', dept: 'Operating Room', room: 'OT Suite 2', ppmDate: '2026-10-30', status: 'maintenance' },
  { tag: 'US-MAT-01', name: 'GE Voluson E8 Diagnostic Ultrasound', category: 'Diagnostic', dept: 'Maternity Ward', room: 'Scan Room 1', ppmDate: '2027-01-10', status: 'operational' },
  { tag: 'DEFIB-EMG-04', name: 'Zoll R Series Biphasic Defibrillator', category: 'Life Support', dept: 'Emergency Dept', room: 'Crash Cart A', ppmDate: '2026-11-05', status: 'operational' },
  { tag: 'AUTO-CSSD-01', name: 'Tuttnauer 5075 Hospital Autoclave', category: 'Facility', dept: 'CSSD Dept', room: 'Sterilization Bay', ppmDate: '2026-10-28', status: 'critical' },
];

export default function AssetsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<BioAsset[]>(mockAssets);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedAssetTag, setSelectedAssetTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketIssue, setTicketIssue] = useState('');

  const handleOpenWorkOrder = (tag: string) => {
    setSelectedAssetTag(tag);
    setShowWorkOrderModal(true);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setAssets((prev) =>
      prev.map((a) => (a.tag === selectedAssetTag ? { ...a, status: 'maintenance' } : a))
    );
    setTicketIssue('');
    setShowWorkOrderModal(false);
  };

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;
    const q = searchTerm.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q) ||
        a.dept.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [assets, searchTerm]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-[#131824] px-6 py-5 rounded-2xl border border-slate-200 dark:border-[#222b3d] shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-500 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('assets')} • Biomedical Engineering & Asset Lifecycle
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Capital Equipment Tracking • Planned Preventive Maintenance (PPM) • Work Order Dispatch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="h-3.5 w-3.5" />
                142 Active Devices
              </span>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Capital Value</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                48,250,000 <span className="text-xs font-normal text-slate-400">ETB</span>
              </p>
              <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">Covered under hospital equipment warranty</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">PPM Due In 30 Days</span>
                <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">4 Devices</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Calibration & sensor testing scheduled</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Breakdown Tickets</span>
                <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">1 Device</p>
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">Tuttnauer Autoclave (CSSD Room 1)</p>
            </div>
          </div>

          {/* Biomedical Devices Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Biomedical Asset Master Registry
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track clinical devices across wards, maintenance schedules & operating status
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search device, tag, dept..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0b0f17] pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Asset Tag / ID</th>
                    <th className="px-5 py-3">Device Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Department / Location</th>
                    <th className="px-5 py-3">Next PPM Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1b2334] font-medium">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.tag} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-teal-700 dark:text-teal-400 font-bold">{asset.tag}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-sm">{asset.name}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{asset.category}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {asset.dept} • <span className="font-mono text-[11px] text-slate-400">{asset.room}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">{asset.ppmDate}</td>
                      <td className="px-5 py-3.5">
                        {asset.status === 'operational' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Operational
                          </span>
                        )}
                        {asset.status === 'maintenance' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            PPM Due
                          </span>
                        )}
                        {asset.status === 'critical' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            Breakdown
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenWorkOrder(asset.tag)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Wrench className="h-3 w-3" />
                          Create Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Work Order Modal */}
          {showWorkOrderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create Biomedical Work Order ({selectedAssetTag})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowWorkOrderModal(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Issue Description
                    </label>
                    <textarea
                      required
                      value={ticketIssue}
                      onChange={(e) => setTicketIssue(e.target.value)}
                      placeholder="Specify failure symptoms, error codes, calibration drift, or damaged consumables..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none min-h-[90px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Work Order Priority
                    </label>
                    <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none">
                      <option>Urgent / Life Support Critical</option>
                      <option>High Priority Clinical</option>
                      <option>Routine Calibration Maintenance</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowWorkOrderModal(false)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Dispatch Biomedical Engineer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
