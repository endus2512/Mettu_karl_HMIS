/**
 * Enterprise Healthcare Card components with glassmorphism, subtle borders, and elevation tokens.
 */
import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'subtle' | 'bordered';
}

export function Card({
  variant = 'default',
  className,
  children,
  ...props
}: CardProps): React.ReactElement {
  const variantStyles = {
    default:
      'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs',
    glass: 'glass-panel shadow-card',
    subtle:
      'bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60',
    bordered:
      'bg-transparent border border-slate-200 dark:border-slate-800',
  };

  return (
    <div
      className={clsx(
        'rounded-xl transition-all duration-150',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={clsx(
        'flex flex-col space-y-1.5 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.ReactElement {
  return (
    <h3
      className={clsx(
        'text-sm sm:text-base font-semibold leading-tight text-slate-900 dark:text-white tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.ReactElement {
  return (
    <p
      className={clsx('text-xs text-slate-500 dark:text-slate-400', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div className={clsx('p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={clsx(
        'flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
