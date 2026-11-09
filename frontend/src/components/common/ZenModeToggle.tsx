/**
 * Mettu Karl Comprehensive Specialized Hospital
 * ZenModeToggle — Interactive Mode Switcher between "Zen / Salphaa" and "Advanced / Bal'aa".
 *
 * Simplicity & Visual Calm (Filannoo 1 & 4):
 * - Zen Mode (Default): Minimizes visual noise, collapses deep background monitors, highlights immediate tasks.
 * - Advanced Mode: Expands deep clinical telemetry, full database tables, and engineering logs.
 */
'use client';

import React from 'react';
import { useZenMode } from '@/lib/zenMode';
import { useTranslation } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';
import { Sparkles, SlidersHorizontal, Leaf, BarChart2 } from 'lucide-react';

interface ZenModeToggleProps {
  variant?: 'pill' | 'compact' | 'header';
}

export function ZenModeToggle({ variant = 'header' }: ZenModeToggleProps): React.ReactElement {
  const { isZenMode, toggleZenMode } = useZenMode();
  const { language } = useTranslation();

  const handleToggle = () => {
    toggleZenMode();
    const nextState = !isZenMode;
    notifications.show({
      title:
        language === 'om'
          ? nextState
            ? 'Haala Salphaa (Zen Mode) Banameera'
            : "Haala Bal'aa (Advanced Mode) Banameera"
          : nextState
          ? 'Zen Mode Active (Distraction-Free)'
          : 'Advanced Mode Active (Full Telemetry)',
      message:
        language === 'om'
          ? nextState
            ? 'Dhiphinni ijaa hir\'atee, wanti ijoo qofti fuulduratti dhiyaateera.'
            : 'Taabiloota gad-fagoo fi lakkoofsi teeknikaalaa hunduu dabalameera.'
          : nextState
          ? 'Visual noise reduced. Core patient workflows focused.'
          : 'Detailed clinical data tables and telemetry revealed.',
      color: nextState ? 'teal' : 'amber',
      autoClose: 2500,
    });
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={
          isZenMode
            ? language === 'om'
              ? "Haala Salphaa (Zen) Hojirra Jira - Cuqaasii Bal'isi"
              : 'Zen Mode Active - Click for Full Analytics'
            : language === 'om'
            ? "Haala Bal'aa (Advanced) - Cuqaasii Salphisi"
            : 'Advanced Mode Active - Click for Zen Simplicity'
        }
        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
          isZenMode
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            : 'bg-[#151d2e] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
        aria-label="Toggle Zen Mode"
      >
        {isZenMode ? <Leaf className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={
        isZenMode
          ? language === 'om'
            ? "Haala Salphaa (Zen) Hojirra Jira - Cuqaasii Bal'isi"
            : 'Zen Mode Active - Click for Full Analytics'
          : language === 'om'
          ? "Haala Bal'aa (Advanced) - Cuqaasii Salphisi"
          : 'Advanced Mode Active - Click for Zen Simplicity'
      }
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all duration-200 select-none cursor-pointer ${
        isZenMode
          ? 'bg-gradient-to-r from-emerald-950/80 to-[#10241c] border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.12)] hover:border-emerald-400'
          : 'bg-[#141b29] border-slate-700/80 text-slate-300 hover:text-white hover:border-amber-400/50'
      }`}
    >
      {isZenMode ? (
        <>
          <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono text-[11px] font-bold">
            {language === 'om' ? '🍃 Salphaa (Zen)' : language === 'am' ? '🍃 ቀላል (Zen)' : '🍃 Zen'}
          </span>
        </>
      ) : (
        <>
          <BarChart2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-mono text-[11px] font-bold">
            {language === 'om' ? "📊 Bal'aa" : language === 'am' ? '📊 ዝርዝር' : '📊 Advanced'}
          </span>
        </>
      )}
    </button>
  );
}
