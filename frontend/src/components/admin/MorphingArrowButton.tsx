'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';

export type MorphingButtonVariant =
  | 'amber'
  | 'amber-soft'
  | 'sky'
  | 'teal'
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'neutral';

export type MorphingButtonSize = 'xs' | 'sm' | 'md';

interface MorphingArrowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: MorphingButtonVariant;
  size?: MorphingButtonSize;
  isExpanded?: boolean;
  href?: string;
  arrowDirection?: 'right' | 'toggle';
}

const VARIANT_CLASSES: Record<MorphingButtonVariant, string> = {
  amber:
    'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-300 text-slate-950 border border-amber-500/80 dark:border-amber-300/60 shadow-md shadow-amber-500/25 hover:shadow-amber-500/40',
  'amber-soft':
    'bg-amber-100/90 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/35 text-amber-950 dark:text-amber-100 border border-amber-400/70 dark:border-amber-400/45 shadow-sm hover:shadow-amber-500/20',
  sky:
    'bg-sky-100/90 dark:bg-sky-500/20 hover:bg-sky-200 dark:hover:bg-sky-500/35 text-sky-950 dark:text-sky-100 border border-sky-400/70 dark:border-sky-400/45 shadow-sm hover:shadow-sky-500/20',
  teal:
    'bg-teal-100/90 dark:bg-teal-500/20 hover:bg-teal-200 dark:hover:bg-teal-500/35 text-teal-950 dark:text-teal-100 border border-teal-400/70 dark:border-teal-400/45 shadow-sm hover:shadow-teal-500/20',
  indigo:
    'bg-indigo-100/90 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/35 text-indigo-950 dark:text-indigo-100 border border-indigo-400/70 dark:border-indigo-400/45 shadow-sm hover:shadow-indigo-500/20',
  violet:
    'bg-violet-100/90 dark:bg-violet-500/20 hover:bg-violet-200 dark:hover:bg-violet-500/35 text-violet-950 dark:text-violet-100 border border-violet-400/70 dark:border-violet-400/45 shadow-sm hover:shadow-violet-500/20',
  emerald:
    'bg-emerald-100/90 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/35 text-emerald-950 dark:text-emerald-100 border border-emerald-400/70 dark:border-emerald-400/45 shadow-sm hover:shadow-emerald-500/20',
  rose:
    'bg-rose-100/90 dark:bg-rose-500/20 hover:bg-rose-200 dark:hover:bg-rose-500/35 text-rose-950 dark:text-rose-100 border border-rose-400/70 dark:border-rose-400/45 shadow-sm hover:shadow-rose-500/20',
  neutral:
    'bg-white/95 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/90 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md',
};

const SIZE_CLASSES: Record<MorphingButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-[11px] sm:text-xs gap-1.5 rounded-lg',
  sm: 'px-3.5 py-2 text-xs sm:text-sm gap-2 rounded-xl',
  md: 'px-4 py-2.5 text-xs sm:text-sm gap-2 rounded-xl',
};

/**
 * Reusable Morphing Arrow Button for Admin Dashboard actions.
 * Morphs a compact directional badge into an elongated kinetic arrow on hover.
 */
export function MorphingArrowButton({
  label,
  icon,
  children,
  variant = 'indigo',
  size = 'sm',
  isExpanded,
  href,
  arrowDirection,
  className = '',
  type = 'button',
  ...rest
}: MorphingArrowButtonProps): React.ReactElement {
  const mode = arrowDirection ?? (isExpanded !== undefined ? 'toggle' : 'right');
  const content = label ?? children;

  const baseClasses = [
    'group relative inline-flex items-center justify-center font-extrabold overflow-hidden select-none',
    'transition-all duration-300 ease-out cursor-pointer',
    'hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  ].join(' ');

  const inner = (
    <>
      {/* Glossy hover sweep */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      {icon && (
        <span className="relative z-10 inline-flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>
      )}

      {content && <span className="relative z-10 truncate">{content}</span>}

      {/* Morphing Kinetic Arrow Pill */}
      <span
        aria-hidden="true"
        className="relative z-10 inline-flex items-center justify-center rounded-full bg-black/10 dark:bg-white/15 px-1.5 py-0.5 transition-all duration-300 ease-out group-hover:px-2 group-hover:bg-black/15 dark:group-hover:bg-white/25 shrink-0"
      >
        <span className="h-[2px] w-0 group-hover:w-2.5 rounded-full bg-current opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out mr-0 group-hover:mr-0.5" />
        {mode === 'toggle' ? (
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${
              isExpanded
                ? 'rotate-180 group-hover:-translate-y-0.5'
                : 'rotate-0 group-hover:translate-y-0.5'
            }`}
          />
        ) : (
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} className={baseClasses} {...rest}>
      {inner}
    </button>
  );
}
