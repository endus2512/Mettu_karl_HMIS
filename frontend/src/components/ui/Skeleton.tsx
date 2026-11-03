/**
 * Enterprise Healthcare Loading Skeleton component with pulse animation.
 */
import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({
  variant = 'rectangular',
  className,
  ...props
}: SkeletonProps): React.ReactElement {
  return (
    <div
      className={clsx(
        'animate-pulse bg-slate-200/80 dark:bg-slate-800/80',
        variant === 'rectangular' && 'rounded-lg',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-3.5 rounded-sm',
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonCard(): React.ReactElement {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="circular" className="h-8 w-8" />
      </div>
      <Skeleton variant="text" className="w-1/2 h-6" />
      <Skeleton variant="text" className="w-3/4 h-3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }): React.ReactElement {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
      <Skeleton variant="text" className="w-1/4 h-4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800">
          <Skeleton variant="circular" className="h-6 w-6 shrink-0" />
          <Skeleton variant="text" className="flex-1" />
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="text" className="w-16" />
        </div>
      ))}
    </div>
  );
}
