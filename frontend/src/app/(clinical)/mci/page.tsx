/**
 * Mass Casualty Incident (MCI) & START Disaster Triage Workstation.
 * Disaster trauma intake with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface CasualtyItem {
  tag: string;
  category: 'red_immediate' | 'yellow_delayed' | 'green_minor' | 'black_deceased';
  respiratoryRate: number;
  pulse: boolean;
  commands: boolean;
  bay: string;
  injury: string;
  time: string;
}

const initialCasualties: CasualtyItem[] = [
  { tag: 'MCI-RED-001', category: 'red_immediate', respiratoryRate: 36, pulse: true, commands: true, bay: 'Trauma Resus Bay 1', injury: 'Severe blunt chest trauma, flail segment', time: '12:04' },
  { tag: 'MCI-RED-002', category: 'red_immediate', respiratoryRate: 24, pulse: false, commands: false, bay: 'Trauma Resus Bay 2', injury: 'Massive pelvic fracture with hemorrhagic shock', time: '12:08' },
  { tag: 'MCI-YEL-003', category: 'yellow_delayed', respiratoryRate: 20, pulse: true, commands: true, bay: 'OPD Surge Holding Bay A', injury: 'Open tibia-fibula fracture, distal pulses intact', time: '12:12' },
  { tag: 'MCI-GRN-004', category: 'green_minor', respiratoryRate: 18, pulse: true, commands: true, bay: 'Outpatient Corridor Ward', injury: 'Walking wounded, superficial facial lacerations', time: '12:15' },
];

export default function MCIPage(): React.ReactElement {
  const { t } = useTranslation();
  const [casualties, setCasualties] = useState<CasualtyItem[]>(initialCasualties);
  const [isBreathing] = useState(true);
  const [isAmbulatory, setIsAmbulatory] = useState(false);
  const [rr, setRr] = useState(34);
  const [hasPulse, setHasPulse] = useState(true);
  const [followsCommands, setFollowsCommands] = useState(true);

  const previewCategory = () => {
    if (!isBreathing) return 'black_deceased';
    if (isAmbulatory) return 'green_minor';
    if (rr > 30 || !hasPulse || !followsCommands) return 'red_immediate';
    return 'yellow_delayed';
  };

  const handleQuickTag = () => {
    const cat = previewCategory();
    const prefix = cat === 'red_immediate' ? 'RED' : cat === 'yellow_delayed' ? 'YEL' : cat === 'green_minor' ? 'GRN' : 'BLK';
    const newTag: CasualtyItem = {
      tag: `MCI-${prefix}-${Math.floor(100 + Math.random() * 900)}`,
      category: cat,
      respiratoryRate: rr,
      pulse: hasPulse,
      commands: followsCommands,
      bay: cat === 'red_immediate' ? 'Trauma Resus' : cat === 'yellow_delayed' ? 'Surge Bay A' : 'Minor Holding',
      injury: 'Rapid disaster intake assessment',
      time: 'Now',
    };
    setCasualties([newTag, ...casualties]);
  };

  const redCount = casualties.filter((c) => c.category === 'red_immediate').length;
  const yellowCount = casualties.filter((c) => c.category === 'yellow_delayed').length;
  const greenCount = casualties.filter((c) => c.category === 'green_minor').length;
  const blackCount = casualties.filter((c) => c.category === 'black_deceased').length;

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
                  🚨
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('mci_disaster_triage')} • START Mass Casualty Incident Protocol
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Simple Triage and Rapid Treatment (START) • Surge Capacity Mobilization • Disaster Tag Allocation
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-600" />
                MCI Command Post: ACTIVE
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight (START 4 Tiers) */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-rose-500 hover:bg-rose-50/70 hover:ring-2 hover:ring-rose-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-rose-700">RED (Immediate)</span>
                <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
              </div>
              <p className="mt-2 text-3xl font-black text-rose-700 group-hover:text-rose-950 transition-colors">{redCount} Patients</p>
              <p className="mt-1 text-xs text-rose-600 font-bold">Immediate airway, breathing, shock</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-black uppercase text-amber-700">YELLOW (Delayed)</span>
              <p className="mt-2 text-3xl font-black text-amber-700 group-hover:text-amber-950 transition-colors">{yellowCount} Patients</p>
              <p className="mt-1 text-xs text-amber-600 font-semibold">Serious injuries, vitals stable</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-black uppercase text-teal-700">GREEN (Minor)</span>
              <p className="mt-2 text-3xl font-black text-teal-700 group-hover:text-teal-950 transition-colors">{greenCount} Patients</p>
              <p className="mt-1 text-xs text-teal-600 font-semibold">Walking wounded, secondary bay</p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-slate-400 hover:bg-slate-100/70 hover:ring-2 hover:ring-slate-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-black uppercase text-slate-500">BLACK (Expectant)</span>
              <p className="mt-2 text-3xl font-black text-slate-700 group-hover:text-slate-950 transition-colors">{blackCount} Deceased</p>
              <p className="mt-1 text-xs text-slate-400 font-semibold">Non-salvageable / mortuary bay</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Casualty List (Floating Card-Rows Table) */}
            <div className="col-span-2 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Disaster Casualty Registry & Holding Bays
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                  <thead>
                    <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-2">START Tag #</th>
                      <th className="px-5 py-2">Triage Category</th>
                      <th className="px-5 py-2">Injury Summary</th>
                      <th className="px-5 py-2">Assigned Surge Bay</th>
                      <th className="px-5 py-2 text-right">Intake Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casualties.map((c) => (
                      <tr
                        key={c.tag}
                        className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                      >
                        <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-mono font-black text-teal-800">
                          {c.tag}
                        </td>
                        <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                          <span className={`rounded-xl px-3 py-1 font-black text-xs ${
                            c.category === 'red_immediate'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : c.category === 'yellow_delayed'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : c.category === 'green_minor'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-800 border border-slate-400'
                          }`}>
                            {c.category.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-black text-slate-900 text-sm">
                          {c.injury}
                        </td>
                        <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all font-bold text-slate-700">
                          {c.bay}
                        </td>
                        <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right font-mono text-slate-500 font-bold">
                          {c.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rapid START Algorithm Calculator */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-7 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200 space-y-4">
              <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Rapid START Tagging
              </h3>
              <div className="space-y-3 text-xs font-semibold">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAmbulatory}
                    onChange={(e) => setIsAmbulatory(e.target.checked)}
                    className="h-4 w-4 rounded text-teal-600"
                  />
                  <span>Can Patient Walk? (Ambulatory)</span>
                </label>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Respiratory Rate (/min)
                  </label>
                  <input
                    type="number"
                    value={rr}
                    onChange={(e) => setRr(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-slate-200 p-2 text-xs font-mono font-bold"
                  />
                </div>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPulse}
                    onChange={(e) => setHasPulse(e.target.checked)}
                    className="h-4 w-4 rounded text-teal-600"
                  />
                  <span>Radial Pulse Present / Cap Refill &lt; 2s</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followsCommands}
                    onChange={(e) => setFollowsCommands(e.target.checked)}
                    className="h-4 w-4 rounded text-teal-600"
                  />
                  <span>Obeys Simple Commands</span>
                </label>

                <button
                  onClick={handleQuickTag}
                  className="w-full mt-2 rounded-2xl bg-rose-600 py-3 text-xs font-black text-white shadow-sm hover:bg-rose-700 hover:ring-2 hover:ring-rose-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  Generate & Assign START Disaster Tag
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
