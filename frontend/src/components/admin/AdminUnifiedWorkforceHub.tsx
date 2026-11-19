/**
 * Mettu Karl Comprehensive Specialized Hospital — Unified Workforce & Staff Command Hub.
 *
 * Consolidates previously scattered staff administration panels into ONE unified command center:
 * 1. Staff Workstation Portals (Supervisor Jump to Doctor, Nurse, Pharmacy, Lab, Billing, Reception, Patient)
 * 2. Live Workforce & Access Control (Active staff, idle seconds, station IP, allow/block)
 * 3. User Directory & Passwords (Staff + patients, passwords reset, biographies, MRN, Fayda ID)
 * 4. Direct Contact & Hospital Oversight (On-duty calling, direct SMS & ward paging)
 *
 * 100% full functionality is preserved without any functional degradation.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, type Language } from '@/lib/i18n';
import { AdminWorkforceMonitor } from '@/components/admin/AdminWorkforceMonitor';
import { AdminUserDirectoryPanel } from '@/components/admin/AdminUserDirectoryPanel';
import { AdminOversightHub } from '@/components/admin/AdminOversightHub';
import { MorphingArrowButton } from '@/components/admin/MorphingArrowButton';
import {
  Users,
  Activity,
  KeyRound,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  BedDouble,
  Pill,
  FlaskConical,
  CreditCard,
  Ticket,
  Compass,
  Radio,
  ArrowRight,
} from 'lucide-react';

export type WorkforceTab = 'portals' | 'workforce' | 'directory' | 'contact';

interface PortalJumpItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: { en: string; om: string; am: string };
  sub: { en: string; om: string; am: string };
  color: string;
  iconColor: string;
  badge: { en: string; om: string; am: string };
}

const PORTAL_JUMP_CARDS: PortalJumpItem[] = [
  {
    href: '/portal/doctor',
    icon: Stethoscope,
    title: { en: 'Doctor', om: 'Ogeessa Yaalaa', am: 'ሐኪም' },
    sub: { en: 'EMR & OPD Care', om: 'EMR fi OPD', am: 'ክሊኒክ እና ታካሚ' },
    color: 'border-teal-400/80 dark:border-teal-500/50 hover:border-teal-500 hover:bg-teal-50/80 dark:hover:bg-teal-500/20',
    iconColor: 'text-teal-700 dark:text-teal-300',
    badge: { en: 'EMR Active', om: 'EMR Hojirra', am: 'EMR ንቁ' },
  },
  {
    href: '/portal/nurse',
    icon: BedDouble,
    title: { en: 'Nurse', om: 'Narsi', am: 'ነርስ' },
    sub: { en: 'Wards & MAR Care', om: 'Kutaalee & MAR', am: 'የዋርድ እንክብካቤ' },
    color: 'border-emerald-400/80 dark:border-emerald-500/50 hover:border-emerald-500 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/20',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    badge: { en: 'Bedside Care', om: 'Biyyee Siree', am: 'የአልጋ እንክብካቤ' },
  },
  {
    href: '/portal/pharmacy',
    icon: Pill,
    title: { en: 'Pharmacy', om: 'Faarmaasii', am: 'ፋርማሲ' },
    sub: { en: 'FEFO Dispensary', om: 'Qoricha Kennuu', am: 'መድሃኒት ቤት' },
    color: 'border-amber-400/80 dark:border-amber-500/50 hover:border-amber-500 hover:bg-amber-50/80 dark:hover:bg-amber-500/20',
    iconColor: 'text-amber-700 dark:text-amber-300',
    badge: { en: 'Stock & Rx', om: 'Qoricha & Kuusaa', am: 'መድሃኒት መዝገብ' },
  },
  {
    href: '/portal/lab',
    icon: FlaskConical,
    title: { en: 'Laboratory', om: 'Laabooratorii', am: 'ላብራቶሪ' },
    sub: { en: 'LIS & Blood Tests', om: 'Qorannoo Dhiigaa', am: 'የላብ ምርመራ' },
    color: 'border-cyan-400/80 dark:border-cyan-500/50 hover:border-cyan-500 hover:bg-cyan-50/80 dark:hover:bg-cyan-500/20',
    iconColor: 'text-cyan-700 dark:text-cyan-300',
    badge: { en: 'LIS Diagnostics', om: 'Qorannoo LIS', am: 'ምርመራ LIS' },
  },
  {
    href: '/portal/billing',
    icon: CreditCard,
    title: { en: 'Billing & POS', om: 'Kaffaltii & POS', am: 'ሂሳብ እና ክፍያ' },
    sub: { en: 'Telebirr & POS', om: 'Telebirr & Nagahee', am: 'ቴሌብር እና ደረሰኝ' },
    color: 'border-blue-400/80 dark:border-blue-500/50 hover:border-blue-500 hover:bg-blue-50/80 dark:hover:bg-blue-500/20',
    iconColor: 'text-blue-700 dark:text-blue-300',
    badge: { en: 'Cashier & POS', om: 'Nagahee & Kaffaltii', am: 'ካሳ እና ክፍያ' },
  },
  {
    href: '/portal/reception',
    icon: Ticket,
    title: { en: 'Reception', om: 'Simannaa', am: 'መስተንግዶ' },
    sub: { en: 'Triage & Fayda', om: 'Triage & Fayda ID', am: 'ምዝገባ እና ፋይዳ' },
    color: 'border-purple-400/80 dark:border-purple-500/50 hover:border-purple-500 hover:bg-purple-50/80 dark:hover:bg-purple-500/20',
    iconColor: 'text-purple-700 dark:text-purple-300',
    badge: { en: 'Intake Queue', om: 'Tarree Simannaa', am: 'የመግቢያ ወረፋ' },
  },
  {
    href: '/patient-portal',
    icon: Users,
    title: { en: 'Patient Portal', om: 'Dhukkubsataa', am: 'የታካሚ በር' },
    sub: { en: 'Health Records', om: 'Galmee Fayyaa', am: 'የግል ፖርታል' },
    color: 'border-rose-400/80 dark:border-rose-500/50 hover:border-rose-500 hover:bg-rose-50/80 dark:hover:bg-rose-500/20',
    iconColor: 'text-rose-700 dark:text-rose-300',
    badge: { en: 'Self-Service', om: 'Tajaajila Ofii', am: 'የግል አገልግሎት' },
  },
];

export function AdminUnifiedWorkforceHub(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = (language === 'om' || language === 'am' || language === 'en') ? language : 'en';

  const [activeTab, setActiveTab] = useState<WorkforceTab>('portals');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div id="unified-workforce-hub" className="space-y-3">
      {/* Unified Master Command Bar */}
      <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-indigo-400/80 dark:border-indigo-400/50 bg-gradient-to-br from-white via-indigo-50/70 to-blue-50/60 dark:from-[#131b2e] dark:via-[#162138] dark:to-[#111927] p-4 sm:p-5 shadow-[0_12px_28px_-8px_rgba(99,102,241,0.22)] hover:shadow-[0_16px_34px_-8px_rgba(99,102,241,0.35)] transition-all duration-300">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/35 dark:via-indigo-200/15 to-transparent mkh-panel-sweep" style={{ animationDelay: '1.2s' }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                  {lang === 'om'
                    ? "Wiirtuu Hojjettootaa fi Kutaalee Hojii (Unified Workforce Command)"
                    : lang === 'am'
                    ? "የሰራተኞችና የስራ ክፍሎች ማዕከል"
                    : "Unified Workforce & Staff Command Center"}
                </h2>
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/25 text-indigo-950 dark:text-indigo-200 border-2 border-indigo-500/60 dark:border-indigo-400/50 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  4-in-1 Unified Hub
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-900 dark:text-teal-200 border border-teal-400/40">
                  7 Workstations
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                {lang === 'om'
                  ? "Kutaalee Hojii (Portals) • Hojii Live • Galmee & Jecha Darbii • Quunnamtii Battalaa"
                  : lang === 'am'
                  ? "የስራ በሮች • የነባር ሰራተኞች ሁኔታ • መዝገብና የይለፍ ቃል • ቀጥታ ግንኙነት"
                  : "Role Portals • Live Telemetry & Access • Directory & Passwords • Direct Paging"}
              </p>
            </div>
          </div>

          {/* 4 Navigation Tabs + Minimize Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100/90 dark:bg-[#0a0f18] border border-slate-300 dark:border-[#1e2738] p-1 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('portals');
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'portals' && isExpanded
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{lang === 'om' ? 'Kutaalee Hojii' : 'Workstations'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('workforce');
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'workforce' && isExpanded
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{lang === 'om' ? 'Hojii Live' : 'Live Activity'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('directory');
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'directory' && isExpanded
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{lang === 'om' ? 'Galmee & Passwords' : 'Directory'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('contact');
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'contact' && isExpanded
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{lang === 'om' ? 'Quunnamtii' : 'Direct Contact'}</span>
              </button>
            </div>

            <MorphingArrowButton
              variant="indigo"
              size="sm"
              isExpanded={isExpanded}
              arrowDirection="toggle"
              label={isExpanded ? (lang === 'om' ? 'Xiqeessi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand')}
              onClick={() => setIsExpanded((prev) => !prev)}
            />
          </div>
        </div>
      </div>

      {/* Render Active Sub-Hub when Expanded (100% Functionality Preserved) */}
      {isExpanded && (
        <div className="animate-in fade-in duration-200">
          {/* TAB 1: 7 Workstation Portals (Supervisor Jump) */}
          {activeTab === 'portals' && (
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-teal-100/65 to-sky-100/75 dark:from-[#16233d] dark:via-[#1a2c4a] dark:to-[#162138] backdrop-blur-md border-[2.5px] border-teal-400/90 dark:border-teal-400/55 rounded-2xl shadow-[0_12px_28px_-8px_rgba(20,184,166,0.26)] p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-teal-300/70 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/25 text-teal-950 dark:text-teal-100 border border-teal-500/60 dark:border-teal-400/50">
                    7 Portals Ready
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {lang === 'om'
                      ? "Gara kutaalee hojii ogeeyyiitti kallattiin cehi (Supervisor Quick Jump)"
                      : "Direct supervisor bypass into clinical & administrative workstations"}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  Click any workstation to enter
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {PORTAL_JUMP_CARDS.map((portal) => {
                  const Icon = portal.icon;
                  const title = portal.title[lang] || portal.title.en;
                  const sub = portal.sub[lang] || portal.sub.en;
                  const badge = portal.badge[lang] || portal.badge.en;

                  return (
                    <Link
                      key={portal.href}
                      href={portal.href}
                      className={`flex flex-col items-center justify-between p-3 rounded-xl bg-white/95 dark:bg-[#131d31] border-2 ${portal.color} transition-all duration-300 text-center group hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-lg min-h-[128px]`}
                    >
                      <div className="flex flex-col items-center">
                        <Icon className={`w-5 h-5 ${portal.iconColor} group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300 mb-1.5`} />
                        <span className="text-xs sm:text-sm font-black text-slate-950 dark:text-white leading-tight">
                          {title}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          {sub}
                        </span>
                      </div>
                      <span className="mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        {badge}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Live Workforce Activity & Access Control */}
          {activeTab === 'workforce' && <AdminWorkforceMonitor embedded={true} />}

          {/* TAB 3: Staff & Patient Directory, Biographies & Passwords */}
          {activeTab === 'directory' && <AdminUserDirectoryPanel embedded={true} />}

          {/* TAB 4: Direct Staff Contact & Emergency Hospital Oversight */}
          {activeTab === 'contact' && <AdminOversightHub embedded={true} />}
        </div>
      )}
    </div>
  );
}
