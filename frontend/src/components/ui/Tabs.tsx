/**
 * Enterprise Healthcare Tab Navigation component with counts, icons, and keyboard support.
 */
import React from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | string;
  countColor?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}: TabsProps): React.ReactElement {
  return (
    <div
      className={clsx(
        variant === 'underline' &&
          'flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar',
        variant === 'pills' &&
          'flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto no-scrollbar',
        variant === 'enclosed' &&
          'flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                'group inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px cursor-pointer',
                isActive
                  ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {Icon && (
                <Icon
                  className={clsx(
                    'h-4 w-4',
                    isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400',
                  )}
                />
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold',
                    tab.countColor ||
                      (isActive
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'),
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="rounded-md bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return null;
      })}
    </div>
  );
}
