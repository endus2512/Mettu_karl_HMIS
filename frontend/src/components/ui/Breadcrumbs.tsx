/**
 * Enterprise Healthcare Breadcrumb Navigation component.
 */
import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps): React.ReactElement {
  return (
    <nav aria-label="Breadcrumb" className={clsx('flex items-center text-xs text-slate-500 dark:text-slate-400 select-none', className)}>
      <ol className="flex items-center space-x-1.5">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {isLast || !item.href ? (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
