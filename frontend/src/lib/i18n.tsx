/**
 * Multi-language localization context (Afaan Oromoo, Amharic, English).
 */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import om from '@/locales/om.json';
import am from '@/locales/am.json';
import en from '@/locales/en.json';

export type Language = 'om' | 'am' | 'en';

type Translations = Record<string, string>;

const translations: Record<Language, Translations> = { om, am, en };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Default language is English ('en') as requested by hospital administration
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('mkh_lang') as Language;
    if (saved && (saved === 'om' || saved === 'am' || saved === 'en')) {
      setLanguageState(saved);
    } else {
      setLanguageState('en');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mkh_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
