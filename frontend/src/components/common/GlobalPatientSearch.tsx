/**
 * Enterprise Global Patient & Command Search Palette (Ctrl+K).
 * Search patients by MRN, Name, Phone, Fayda ID, and instant navigate across workstations.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  Fingerprint,
  Phone,
  Ticket,
  Pill,
  CreditCard,
  Scan,
  HeartPulse,
  X,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface SearchResultPatient {
  id: string;
  mrn: string;
  name: string;
  phone: string;
  faydaId?: string;
  age: number;
  gender: string;
  ward: string;
  status: 'Inpatient' | 'Outpatient' | 'Emergency' | 'Discharged';
}

const DEMO_PATIENTS: SearchResultPatient[] = [
  {
    id: 'pat-1',
    mrn: 'MK-2026-001042',
    name: 'Tolosa Gudeta Benti',
    phone: '0917-882-190',
    faydaId: 'FAN-9901-4421-8890',
    age: 42,
    gender: 'Male',
    ward: 'Internal Medicine (Bed 14)',
    status: 'Inpatient',
  },
  {
    id: 'pat-2',
    mrn: 'MK-2026-000891',
    name: 'Chaltu Daba Waqo',
    phone: '0922-341-908',
    faydaId: 'FAN-7721-1092-3341',
    age: 28,
    gender: 'Female',
    ward: 'Maternity Ward (Bed 06)',
    status: 'Inpatient',
  },
  {
    id: 'pat-3',
    mrn: 'MK-2026-001210',
    name: 'Abebe Bikila Gemechu',
    phone: '0911-550-239',
    faydaId: 'FAN-8812-3301-9921',
    age: 35,
    gender: 'Male',
    ward: 'Triage Holding Bay',
    status: 'Emergency',
  },
  {
    id: 'pat-4',
    mrn: 'MK-2026-000542',
    name: 'Fatuma Duresa Keno',
    phone: '0930-112-876',
    faydaId: 'FAN-3312-9901-7721',
    age: 56,
    gender: 'Female',
    ward: 'OPD Clinic 3',
    status: 'Outpatient',
  },
  {
    id: 'pat-5',
    mrn: 'MK-2026-001330',
    name: 'Girma Wondimu Bultum',
    phone: '0944-771-098',
    faydaId: 'FAN-5541-2290-1188',
    age: 63,
    gender: 'Male',
    ward: 'Surgical ICU (Bed 02)',
    status: 'Inpatient',
  },
];

interface QuickModuleAction {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  dept: string;
}

const QUICK_MODULES: QuickModuleAction[] = [
  { title: 'Master Patient Index (FHIR)', href: '/patients', icon: User, dept: 'Clinical' },
  { title: 'Smart Queue Calling Console', href: '/queue', icon: Ticket, dept: 'OPD' },
  { title: 'Pharmacy & CDSS Dispensary', href: '/pharmacy', icon: Pill, dept: 'Pharmacy' },
  { title: 'PACS & DICOM Imaging', href: '/pacs', icon: Scan, dept: 'Radiology' },
  { title: 'Cashier & Revenue Billing', href: '/billing', icon: CreditCard, dept: 'Finance' },
  { title: 'ICU Central Telemetry Station', href: '/iomt', icon: HeartPulse, dept: 'Critical Care' },
];

export function GlobalPatientSearch(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter patients
  const filteredPatients = query.trim()
    ? DEMO_PATIENTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.mrn.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query) ||
          (p.faydaId && p.faydaId.toLowerCase().includes(query.toLowerCase())),
      )
    : [];

  const handleSelectPatient = (patient: SearchResultPatient) => {
    setIsOpen(false);
    router.push(`/patients?search=${encodeURIComponent(patient.mrn)}`);
  };

  const handleSelectModule = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Header Search Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-[#222b3d] bg-[#131824] px-3 py-1.5 text-xs text-slate-300 hover:border-amber-500/60 hover:text-white transition-all cursor-pointer shadow-xs select-none max-w-[200px] sm:max-w-xs md:w-56"
        title="Universal Search (Ctrl+K)"
        aria-label="Universal Patient & Command Search"
      >
        <Search className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="truncate text-left flex-1 text-slate-400">Search patient, MRN...</span>
        <kbd className="hidden sm:inline-flex items-center rounded-md border border-[#222b3d] bg-[#0b0f17] px-1.5 py-0.5 text-[10px] font-mono text-amber-400 font-bold">
          ⌘K
        </kbd>
      </button>

      {/* Spotlight Command Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-[#131824] border border-[#222b3d] shadow-2xl overflow-hidden z-10 text-white animate-in zoom-in-95 duration-150">
            {/* Input Bar */}
            <div className="flex items-center gap-3 border-b border-[#1e283c] px-4 py-3 bg-[#0b0f17]">
              <Search className="h-4.5 w-4.5 text-amber-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search patient by Name, MRN (MK-2026-...), Phone, or Fayda ID..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-md p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Results Body */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {/* Patient Results */}
              {query.trim() ? (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 px-2 block mb-2">
                    Matched Patients ({filteredPatients.length})
                  </span>
                  {filteredPatients.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No patients found matching "{query}". Check MRN or phone number.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredPatients.map((pat) => (
                        <div
                          key={pat.id}
                          onClick={() => handleSelectPatient(pat)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors border border-transparent hover:border-slate-700"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {pat.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                  {pat.name}
                                </span>
                                <Badge
                                  variant={
                                    pat.status === 'Emergency'
                                      ? 'critical'
                                      : pat.status === 'Inpatient'
                                      ? 'teal'
                                      : 'info'
                                  }
                                  size="xs"
                                >
                                  {pat.status}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                <span className="font-mono text-teal-300 font-semibold">{pat.mrn}</span>
                                <span>•</span>
                                <span>{pat.age}y / {pat.gender}</span>
                                <span>•</span>
                                <span className="truncate">{pat.ward}</span>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Quick Workstation Launchers */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-2">
                  Quick Clinical Workstations
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {QUICK_MODULES.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <div
                        key={mod.href}
                        onClick={() => handleSelectModule(mod.href)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/90 border border-slate-700/50 hover:border-teal-500/40 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-700/60 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block group-hover:text-teal-200">
                              {mod.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{mod.dept}</span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 bg-[#080e1e] px-4 py-2.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>Select: <strong className="text-slate-300">Click / Enter</strong></span>
                <span>Navigate: <strong className="text-slate-300">Tab</strong></span>
              </div>
              <span className="text-teal-400 font-mono">Mettu Karl HMIS Spotlight</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
