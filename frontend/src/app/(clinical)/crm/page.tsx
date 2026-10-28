/**
 * Patient CRM, CSAT Feedback & Grievance SLA Ticketing Workstation.
 * Patient advocacy with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface GrievanceItem {
  id: string;
  patient: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dept: string;
  details: string;
  slaDue: string;
  status: 'submitted' | 'under_investigation' | 'resolved';
}

const initialTickets: GrievanceItem[] = [
  { id: 'GRV-2026-081', patient: 'Solomon Regassa', category: 'Clinical Care Delay', priority: 'critical', dept: 'Emergency Department', details: 'Awaiting orthopedic reduction for 3 hours with active severe discomfort', slaDue: '4 Hours (Due 14:00)', status: 'submitted' },
  { id: 'GRV-2026-082', patient: 'Ayantu Gudina', category: 'Billing & Insurance', priority: 'medium', dept: 'Billing / CBHI', details: 'Disputed pharmacy copayment calculation on covered essential medicines', slaDue: '72 Hours (Due Oct 28)', status: 'under_investigation' },
  { id: 'GRV-2026-083', patient: 'Megersa Dinku', category: 'Staff Conduct', priority: 'high', dept: 'Radiology Reception', details: 'Unhelpful reception assistance during scheduled chest CT intake', slaDue: '24 Hours (Due Oct 27)', status: 'submitted' },
];

export default function CRMPage(): React.ReactElement {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<GrievanceItem[]>(initialTickets);

  const resolveTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((item) => (item.id === ticketId ? { ...item, status: 'resolved' } : item))
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
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  🤝
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('patient_crm')} • Patient Experience & Grievance SLA Desk
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Patient CSAT Voice • Automated SLA Timers • Grievance Investigation & Ombudsman Resolution
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Hospital CSAT: 4.7 / 5.0 ★
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Grievances</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">18 Tickets</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">This Month • Quality Assurance</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Critical (4h SLA)</span>
              <p className="mt-2 text-3xl font-black text-rose-600 group-hover:text-rose-950 transition-colors">1 Active</p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">Emergency care delay ticket</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Resolution Rate</span>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">92.4%</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Target &gt; 90% SLA met</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Resolution TAT</span>
              <p className="mt-2 text-3xl font-black text-blue-700 group-hover:text-blue-950 transition-colors">18 Hours</p>
              <p className="mt-1 text-xs text-blue-600 font-bold">Fast-track mediation</p>
            </div>
          </div>

          {/* Grievance Tickets (Floating Card-Rows Table) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-2">Ticket ID</th>
                  <th className="px-5 py-2">Patient Name</th>
                  <th className="px-5 py-2">Category</th>
                  <th className="px-5 py-2">Department</th>
                  <th className="px-5 py-2">Grievance Summary</th>
                  <th className="px-5 py-2">SLA Window</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                  >
                    <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                      {t.id}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm">
                      {t.patient}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700">
                      {t.category}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-slate-600 font-semibold">
                      {t.dept}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-slate-500 max-w-xs truncate">
                      {t.details}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700 font-mono">
                      {t.slaDue}
                    </td>
                    <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                      {t.status === 'resolved' && (
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-[10px] font-black text-emerald-800">
                          Resolved
                        </span>
                      )}
                      {t.status === 'under_investigation' && (
                        <span className="rounded-full bg-blue-100 border border-blue-300 px-3 py-1 text-[10px] font-black text-blue-800">
                          Investigating
                        </span>
                      )}
                      {t.status === 'submitted' && (
                        <span className="rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-[10px] font-black text-rose-800 animate-pulse">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                      {t.status !== 'resolved' && (
                        <button
                          onClick={() => resolveTicket(t.id)}
                          className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                        >
                          Resolve SLA
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
