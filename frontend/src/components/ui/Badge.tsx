/**
 * Enterprise Healthcare Status Badge with clinical severity variants, pulse dot, and dark mode.
 */
import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant =
  | 'default'
  | 'teal'
  | 'success'
  | 'warning'
  | 'critical'
  | 'info'
  | 'outline'
  | 'neutral';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  teal:
    'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  critical:
    'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  info:
    'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  outline:
    'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700',
  neutral:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800',
};

const pulseColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  teal: 'bg-teal-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500',
  info: 'bg-sky-500',
  outline: 'bg-slate-400',
  neutral: 'bg-slate-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded-sm font-medium',
  sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
  md: 'text-xs px-2.5 py-1 rounded-lg font-medium',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 border font-mono tracking-tight shrink-0',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              pulseColors[variant],
            )}
          />
          <span
            className={clsx('relative inline-flex rounded-full h-1.5 w-1.5', pulseColors[variant])}
          />
        </span>
      )}
      {children}
    </span>
  );
}
