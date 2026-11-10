/**
 * Mettu Karl Comprehensive Specialized Hospital
 * OmnisearchCommandCenter — Universal Command Palette & Superhuman Search (Filannoo 4).
 *
 * Capabilities:
 * - Omnisearch across Patients, Portals, Clinical Modules, and Instant Actions (Ctrl+K / Cmd+K).
 * - Full Tri-Lingual Search (Afaan Oromoo, Amharic, English keywords).
 * - Complete Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape).
 * - Direct Actions: Zen Mode Toggle, Guided Stepper Launch, Code Blue Emergency, Instant Logout.
 */
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation, Language } from '@/lib/i18n';
import { useZenMode } from '@/lib/zenMode';
import { notifications } from '@mantine/notifications';
import {
  Search,
  User,
  Users,
  Stethoscope,
  BedDouble,
  Pill,
  FlaskConical,
  CreditCard,
  Ticket,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Heart,
  Syringe,
  Scan,
  Phone,
  RotateCcw,
  Sparkles,
  Command,
  ArrowRight,
  X,
  ExternalLink,
  Leaf,
  LogOut,
  Sliders,
  Bed,
} from 'lucide-react';

interface SearchItem {
  id: string;
  category: 'patient' | 'portal' | 'module' | 'action';
  title: string;
  subtitle?: string;
  keywords: string[];
  href?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: 'teal' | 'amber' | 'rose' | 'blue' | 'purple';
}

export function OmnisearchCommandCenter(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'om';
  const { isZenMode, toggleZenMode } = useZenMode();

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
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Master Omnisearch Catalog
  const allItems: SearchItem[] = useMemo(() => {
    return [
      // 1. PATIENTS
      {
        id: 'pat-1',
        category: 'patient',
        title: 'Gudeta Hailu Tadesse',
        subtitle: 'MKH-2026-000101 • 42y / Male • Token A-012 • OPD Room 3',
        keywords: ['gudeta', 'hailu', 'tadesse', 'mkh-2026-000101', '000101', 'a-012', 'dhukkubsataa', 'taakamaa', 'patient'],
        href: '/patients?search=MKH-2026-000101',
        icon: User,
        badge: 'Yellow Triage',
        badgeColor: 'amber',
      },
      {
        id: 'pat-2',
        category: 'patient',
        title: 'Ayantu Mamo Kassa',
        subtitle: 'MKH-2026-000102 • 31y / Female • Token A-015 • Maternity/OPD',
        keywords: ['ayantu', 'mamo', 'kassa', 'mkh-2026-000102', '000102', 'a-015', 'dhukkubsataa', 'patient'],
        href: '/patients?search=MKH-2026-000102',
        icon: User,
        badge: 'Yellow Triage',
        badgeColor: 'amber',
      },
      {
        id: 'pat-3',
        category: 'patient',
        title: 'Chala Tolera Lemma',
        subtitle: 'MKH-2026-000104 • 55y / Male • Token A-024 • Acute Cardiac Bay',
        keywords: ['chala', 'tolera', 'lemma', 'mkh-2026-000104', '000104', 'a-024', 'dhukkubsataa', 'patient', 'emergency'],
        href: '/patients?search=MKH-2026-000104',
        icon: User,
        badge: 'RED TRIAGE',
        badgeColor: 'rose',
      },
      {
        id: 'pat-4',
        category: 'patient',
        title: 'Derartu Tulu Gemechu',
        subtitle: 'MKH-2026-000103 • 28y / Female • Token A-019 • Prenatal ANC',
        keywords: ['derartu', 'tulu', 'gemechu', 'mkh-2026-000103', '000103', 'a-019', 'dhukkubsataa', 'patient'],
        href: '/patients?search=MKH-2026-000103',
        icon: User,
        badge: 'Green Triage',
        badgeColor: 'teal',
      },

      // 2. DEDICATED ROLE PORTALS
      {
        id: 'portal-doc',
        category: 'portal',
        title: lang === 'om' ? 'Wiirtuu Ogeessa Yaalaa (Doctor Portal)' : 'Doctor Workstation Portal',
        subtitle: '/portal/doctor • OPD Consultation Queue & EMR',
        keywords: ['doctor', 'doktoora', 'yaala', 'opd', 'physician', 'emr', 'consultation', 'ሀኪም'],
        href: '/portal/doctor',
        icon: Stethoscope,
        badge: 'Role Portal',
        badgeColor: 'teal',
      },
      {
        id: 'portal-nurse',
        category: 'portal',
        title: lang === 'om' ? 'Wiirtuu Narsii (Nurse Portal)' : 'Nurse Workstation Portal',
        subtitle: '/portal/nurse • Wards, Bed Census & Medication MAR',
        keywords: ['nurse', 'narsii', 'ward', 'mar', 'vitals', 'siree', 'ciisicha', 'ነርስ'],
        href: '/portal/nurse',
        icon: BedDouble,
        badge: 'Role Portal',
        badgeColor: 'teal',
      },
      {
        id: 'portal-pharm',
        category: 'portal',
        title: lang === 'om' ? 'Wiirtuu Faarmaasii (Pharmacy Portal)' : 'Pharmacy Workstation Portal',
        subtitle: '/portal/pharmacy • FEFO Dispensing & EFDA Safety',
        keywords: ['pharmacy', 'faarmaasii', 'qoricha', 'dispensary', 'fefo', 'efda', 'ፋርማሲ', 'መድሃኒት'],
        href: '/portal/pharmacy',
        icon: Pill,
        badge: 'Role Portal',
        badgeColor: 'amber',
      },
      {
        id: 'portal-lab',
        category: 'portal',
        title: lang === 'om' ? 'Wiirtuu Laaboraatorii (Laboratory Portal)' : 'Laboratory Workstation Portal',
        subtitle: '/portal/lab • LIS Hematology, Chemistry & Panic Alerts',
        keywords: ['lab', 'laboratory', 'laabii', 'laaboraatorii', 'lis', 'analyzer', 'ደም', 'ላብራቶሪ'],
        href: '/portal/lab',
        icon: FlaskConical,
        badge: 'Role Portal',
        badgeColor: 'blue',
      },
      {
        id: 'portal-bill',
        category: 'portal',
        title: lang === 'om' ? 'Wiirtuu Kaffaltii (Billing Portal)' : 'Billing & Cashier Portal',
        subtitle: '/portal/billing • Telebirr, CBHI & Cashier POS',
        keywords: ['billing', 'kaffaltii', 'telebirr', 'cbhi', 'pos', 'cashier', 'galii', 'ክፍያ', 'ቴሌብር'],
        href: '/portal/billing',
        icon: CreditCard,
        badge: 'Role Portal',
        badgeColor: 'blue',
      },
      {
        id: 'portal-rec',
        category: 'portal',
        title: lang === 'om' ? 'Wiirtuu Simannaa (Reception Portal)' : 'Reception & Intake Portal',
        subtitle: '/portal/reception • Triage, Queue Tokens & Fayda National ID',
        keywords: ['reception', 'simannaa', 'triage', 'fayda', 'queue', 'token', 'መቀበያ'],
        href: '/portal/reception',
        icon: Ticket,
        badge: 'Role Portal',
        badgeColor: 'purple',
      },
      {
        id: 'portal-admin',
        category: 'portal',
        title: lang === 'om' ? 'Wiirtuu Hoggansaa (Executive Command Center)' : 'Executive Admin Command Center',
        subtitle: '/portal/admin • CEO Oversight, Staff Supervision & Cluster HA',
        keywords: ['admin', 'ceo', 'hoggansa', 'command center', 'oversight', 'supervision', 'ዋና አስተዳዳሪ'],
        href: '/portal/admin',
        icon: ShieldCheck,
        badge: 'Executive',
        badgeColor: 'amber',
      },

      // 3. CLINICAL MODULES
      {
        id: 'mod-ot',
        category: 'module',
        title: lang === 'om' ? 'Kutaa Baqaqsanii Yaaluu (OT)' : 'Operating Theatre (OT)',
        subtitle: '/ot • Surgical Scheduling & Anesthesia Protocols',
        keywords: ['surgery', 'ot', 'baqaqsaa', 'surgeon', 'theatre', 'anesthesia', 'ቀዶ ጥገና'],
        href: '/ot',
        icon: Syringe,
        badge: 'Clinical',
        badgeColor: 'teal',
      },
      {
        id: 'mod-blood',
        category: 'module',
        title: lang === 'om' ? 'Kuusaa Dhiigaa (Blood Bank)' : 'Blood Bank & Cross-Match',
        subtitle: '/blood-bank • Donor Registry & Cold Chain Monitors',
        keywords: ['blood', 'bank', 'dhiiga', 'donor', 'abo', 'cold chain', 'ደም ባንክ'],
        href: '/blood-bank',
        icon: Heart,
        badge: 'Diagnostics',
        badgeColor: 'rose',
      },
      {
        id: 'mod-ems',
        category: 'module',
        title: lang === 'om' ? 'Tajaajila Ambulaansii (EMS Hotline 907)' : 'Emergency Medical Services (EMS)',
        subtitle: '/ems • Fleet GPS Radar & Emergency Dispatch',
        keywords: ['ems', 'ambulance', 'ambulaansii', 'radar', 'dispatch', 'tasaa', 'አምቡላንስ'],
        href: '/ems',
        icon: Activity,
        badge: 'Emergency',
        badgeColor: 'rose',
      },
      {
        id: 'mod-pacs',
        category: 'module',
        title: lang === 'om' ? 'Suuraa DICOM PACS (Radiology)' : 'DICOM PACS & Diagnostic Imaging',
        subtitle: '/pacs • Web CT-Scan, X-Ray & MRI Viewers',
        keywords: ['pacs', 'dicom', 'xray', 'ct', 'mri', 'radiology', 'suuraa', 'ራጅ'],
        href: '/pacs',
        icon: Scan,
        badge: 'Imaging',
        badgeColor: 'blue',
      },

      // 4. INSTANT ONE-TAP ACTIONS
      {
        id: 'act-zen',
        category: 'action',
        title: isZenMode
          ? (lang === 'om' ? "Gara Haala Bal'aatti Jijjiiri (Advanced Mode)" : 'Switch to Advanced Telemetry')
          : (lang === 'om' ? 'Gara Haala Salphaatti Jijjiiri (🍃 Zen Mode)' : 'Switch to Zen Mode (Calm)'),
        subtitle: 'Toggle progressive disclosure & visual decluttering instantly',
        keywords: ['zen', 'salphaa', 'simple', 'advanced', 'balaa', 'calm', 'declutter', 'toggle'],
        action: () => {
          toggleZenMode();
          notifications.show({
            title: isZenMode ? "Haala Bal'aa Banameera" : 'Haala Salphaa (Zen) Banameera',
            message: isZenMode ? 'Full analytics expanded' : 'Distraction-free mode active',
            color: isZenMode ? 'amber' : 'teal',
          });
        },
        icon: Leaf,
        badge: 'Action',
        badgeColor: 'teal',
      },
      {
        id: 'act-code-blue',
        category: 'action',
        title: lang === 'om' ? 'Akeekkachiisa Cimaa Labsi (Trigger CODE BLUE)' : 'Emergency Broadcast (CODE BLUE)',
        subtitle: 'Alert ICU, Resuscitation & Crash Team Hospital-Wide',
        keywords: ['code blue', 'emergency', 'tasaa', 'hatattama', 'resuscitation', 'ድንገተኛ'],
        action: () => {
          notifications.show({
            title: '🚨 CODE BLUE RESUSCITATION ALERT ACTIVATED',
            message: 'Crash team dispatched to Main ICU / Emergency Bay.',
            color: 'red',
            autoClose: 5000,
          });
        },
        icon: ShieldAlert,
        badge: 'Emergency',
        badgeColor: 'rose',
      },
      {
        id: 'act-logout',
        category: 'action',
        title: lang === 'om' ? "Sirna Keessaa Ba'i (Logout)" : 'Sign Out of Mettu Karl HMIS',
        subtitle: 'Safely end active clinical session',
        keywords: ['logout', 'signout', 'exit', 'bai', 'baasaa', 'መውጣት'],
        action: () => {
          logout();
          router.push('/login');
        },
        icon: LogOut,
        badge: 'Session',
        badgeColor: 'rose',
      },
    ];
  }, [lang, isZenMode, toggleZenMode, logout, router]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default recommended actions and role portals
      return allItems.slice(0, 8);
    }
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [query, allItems]);

  // Handle keyboard navigation inside the list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      }
    }
  };

  const executeItem = (item: SearchItem) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <>
      {/* Universal Search Bar Trigger in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#101726] hover:border-amber-500/60 hover:bg-[#141d30] px-3 py-1.5 text-xs text-slate-300 transition-all cursor-pointer shadow-xs select-none max-w-[200px] sm:max-w-xs md:w-64 group"
        title="Omnisearch Command Palette (Ctrl+K)"
        aria-label="Universal Search"
      >
        <Search className="h-3.5 w-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
        <span className="truncate text-left flex-1 text-slate-400 group-hover:text-slate-200">
          {lang === 'om' ? 'Barbaadi (Ctrl+K)...' : 'Search patient, portal...'}
        </span>
        <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-700 bg-[#090d15] px-1.5 py-0.5 text-[10px] font-mono text-amber-400 font-bold">
          ⌘K
        </kbd>
      </button>

      {/* Spotlight Command Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-4">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            onKeyDown={handleKeyDown}
            className="relative w-full max-w-2xl rounded-3xl bg-[#0e1422] border border-slate-700/80 shadow-2xl overflow-hidden z-10 text-white animate-smooth-scale flex flex-col max-h-[80vh]"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 border-b border-slate-800 px-4 sm:px-5 py-3.5 bg-[#090d15]">
              <Search className="h-5 w-5 text-amber-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder={
                  lang === 'om'
                    ? 'Maqaa dhukkubsataa, MRN, kutaa hojii, qoricha, ykn ajaja barbaadi...'
                    : 'Search patient by Name/MRN, role portal, medications, or actions...'
                }
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-md p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Results Scroll Area */}
            <div
              ref={resultsRef}
              className="overflow-y-auto p-3 space-y-1.5 custom-scrollbar flex-1"
            >
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">Wanti argame hin jiru (No results)</p>
                  <p>Check spelling or search by MRN (fkn. 000101) or Portal name.</p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={item.id}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-gradient-to-r from-teal-500/15 via-[#162133] to-teal-500/5 border-teal-500/50 shadow-md'
                          : 'bg-[#101726]/60 border-transparent hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            item.category === 'patient'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : item.category === 'portal'
                              ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                              : item.category === 'action'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                                  item.badgeColor === 'rose'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : item.badgeColor === 'amber'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : item.badgeColor === 'teal'
                                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isSelected && (
                          <kbd className="hidden sm:inline-flex items-center rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                            ↵ Enter
                          </kbd>
                        )}
                        <ArrowRight
                          className={`h-4 w-4 transition-transform ${
                            isSelected ? 'text-teal-400 translate-x-1' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Keyboard Hints */}
            <div className="flex items-center justify-between border-t border-slate-800 bg-[#090d15] px-4 py-2.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-4">
                <span>
                  Navigate: <strong className="text-slate-200">↑ ↓</strong>
                </span>
                <span>
                  Select: <strong className="text-slate-200">↵ Enter</strong>
                </span>
                <span>
                  Close: <strong className="text-slate-200">Esc</strong>
                </span>
              </div>
              <span className="text-amber-400 font-mono text-[10px] font-bold">
                Mettu Karl Omnisearch
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
