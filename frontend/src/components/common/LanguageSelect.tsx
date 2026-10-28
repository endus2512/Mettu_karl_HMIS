/**
 * Modern Clinical Language Selector Dropdown.
 * Displays ONLY the single currently active language.
 * Clicking opens a downward dropdown menu with language options.
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Language, useTranslation } from '@/lib/i18n';

export interface LanguageSelectProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const LANGUAGES: { code: Language; label: string; nativeName: string }[] = [
  { code: 'om', label: 'Afaan Oromoo', nativeName: 'Oromiffa' },
  { code: 'am', label: 'አማርኛ', nativeName: 'Amharic' },
  { code: 'en', label: 'English', nativeName: 'English (US)' },
];

export function LanguageSelect({ variant = 'dark', className = '' }: LanguageSelectProps): React.ReactElement {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLight = variant === 'light';
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button: Shows ONLY the current language */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Jijjiirraa Afaanii (Select Language)"
        className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer select-none active:scale-95 ${
          isLight
            ? 'border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs hover:border-teal-400 dark:hover:border-teal-500'
            : 'border border-slate-700/90 bg-slate-800/90 hover:bg-slate-700/90 text-white shadow-xs'
        }`}
      >
        <Globe className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-teal-600 dark:text-teal-400' : 'text-teal-400'}`} />
        <span className="tracking-tight">{currentLang.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-teal-400' : isLight ? 'text-slate-400' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Downward Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-1.5 w-44 rounded-2xl border shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              : 'bg-slate-900 border-slate-700 text-white'
          }`}
        >
          {LANGUAGES.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? isLight
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                      : 'bg-teal-950/80 text-teal-300'
                    : isLight
                    ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                    {item.nativeName}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
