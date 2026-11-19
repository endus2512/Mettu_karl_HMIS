/**
 * Mettu Karl Comprehensive Specialized Hospital — Unified Workforce & Staff Command Hub.
 *
 * Consolidates three previously duplicated staff panels into one unified, high-performance center:
 * 1. Live Workforce & Access Control (Active staff, idle seconds, station IP, allow/block)
 * 2. User Directory & Passwords (Staff + patients, passwords reset, biographies, MRN, Fayda ID)
 * 3. Direct Contact & Hospital Oversight (On-duty calling, direct SMS & ward paging)
 *
 * 100% full functionality is preserved without any functional degradation.
 */
'use client';

import React, { useState } from 'react';
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
  Layers,
} from 'lucide-react';

export type WorkforceTab = 'workforce' | 'directory' | 'contact';

export function AdminUnifiedWorkforceHub(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = (language === 'om' || language === 'am' || language === 'en') ? language : 'en';

  const [activeTab, setActiveTab] = useState<WorkforceTab>('workforce');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="space-y-3">
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
                    ? "Wiirtuu To'annoo fi Quunnamtii Ogeeyyii (Unified Staff Command)"
                    : lang === 'am'
                    ? "የሰራተኞች አስተዳደርና መቆጣጠሪያ ማዕከል"
                    : "Unified Workforce & Staff Command Center"}
                </h2>
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/25 text-indigo-950 dark:text-indigo-200 border-2 border-indigo-500/60 dark:border-indigo-400/50 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  3-in-1 Deduplicated Hub
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                {lang === 'om'
                  ? "Hojii Live • Galmee & Jecha Darbii • Quunnamtii fi Waamicha Battalaa"
                  : "Live Workforce Telemetry • Directory & Passwords • Direct Staff Paging"}
              </p>
            </div>
          </div>

          {/* Tab Selector Controls + Minimize Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100/90 dark:bg-[#0a0f18] border border-slate-300 dark:border-[#1e2738] p-1 text-xs font-bold shadow-inner">
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
                <span>{lang === 'om' ? 'Hojii Live' : 'Live Workforce'}</span>
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
                <span>{lang === 'om' ? 'Galmee & Passwords' : 'Directory & Passwords'}</span>
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
              label={isExpanded ? (lang === 'om' ? 'Dhibi' : 'Minimize') : (lang === 'om' ? 'Bani' : 'Expand')}
              onClick={() => setIsExpanded((prev) => !prev)}
            />
          </div>
        </div>
      </div>

      {/* Render Active Sub-Hub when Expanded (100% Functionality Preserved) */}
      {isExpanded && (
        <div className="animate-in fade-in duration-200">
          {activeTab === 'workforce' && <AdminWorkforceMonitor />}
          {activeTab === 'directory' && <AdminUserDirectoryPanel />}
          {activeTab === 'contact' && <AdminOversightHub />}
        </div>
      )}
    </div>
  );
}
