/**
 * Mettu Karl Referral Hospital — Dedicated Patient Authentication & Enrollment Portal.
 * Enterprise Healthcare Design System:
 * - Professional navy, crisp white, and subtle teal palette with full light & dark mode support
 * - Modern Lucide icons replacing emojis
 * - Clean input styling with subtle focus rings
 * - Quick test patient profile chips for instant access
 * - Strict clinical privacy: zero public patient health information on public screen
 * - Multilingual support (Afaan Oromoo, English, Amharic)
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import {
  HeartPulse,
  Lock,
  UserPlus,
  CreditCard,
  Phone,
  FileText,
  Building2,
  Sparkles,
  ShieldCheck,
  User,
  Calendar,
  MapPin,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { ThemeToggle } from '@/components/common/ThemeToggle';

// Validation Schemas
const patientLoginSchema = z.object({
  identifier: z.string().min(4, 'Valid identifier or phone number is required'),
  password_or_otp: z.string().min(4, 'Password or SMS OTP code is required'),
});

const patientRegisterSchema = z.object({
  full_name: z.string().min(3, 'Full name is required (minimum 3 characters)'),
  phone_number: z.string().min(7, 'Valid phone number is required'),
  birth_place: z.string().optional(),
  fayda_id: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female']).default('male'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type PatientLoginForm = z.infer<typeof patientLoginSchema>;
type PatientRegisterForm = z.infer<typeof patientRegisterSchema>;

export default function PatientLoginPage(): React.ReactElement {
  const { patientLogin, patientRegister } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'fayda' | 'phone' | 'mrn'>('fayda');

  // Login Form Hook
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<PatientLoginForm>({
    resolver: zodResolver(patientLoginSchema),
    defaultValues: {
      identifier: 'FAN-9901-2384-5120',
      password_or_otp: '123456',
    },
  });

  // Registration Form Hook
  const {
    register: registerEnroll,
    handleSubmit: handleEnrollSubmit,
    formState: { errors: enrollErrors },
  } = useForm<PatientRegisterForm>({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      full_name: '',
      phone_number: '+251 9',
      birth_place: 'Mettu, Kebele 02',
      fayda_id: '',
      birth_date: '1995-05-12',
      gender: 'male',
      password: '',
    },
  });

  const onLogin = async (data: PatientLoginForm): Promise<void> => {
    setIsLoading(true);
    try {
      await patientLogin(data.identifier, data.password_or_otp);
      notifications.show({
        title: language === 'am' ? 'እንኳን ደህና መጡ!' : language === 'en' ? 'Welcome!' : 'Baga Nagaan Dhuftan!',
        message: language === 'am' ? 'ወደ ታካሚ ፖርታል እየገቡ ነው...' : language === 'en' ? 'Redirecting to Patient Portal...' : "Seensi milkaa'eera. Gara Patient Portal tti qajeelaa jirtu...",
        color: 'teal',
      });
      router.push('/patient-portal');
    } catch {
      notifications.show({
        title: language === 'am' ? 'የመግቢያ ስህተት' : language === 'en' ? 'Login Error' : 'Dogoggora Seensaa',
        message: language === 'am' ? 'የፋይዳ መታወቂያ ወይም ኮድ የተሳሳተ ነው። እባክዎ እንደገና ይሞክሩ።' : language === 'en' ? 'Invalid identifier or passcode. Please try again.' : "Fayda ID ykn koodiin dogoggora. Irra deebi'aa yaalaa.",
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: PatientRegisterForm): Promise<void> => {
    setIsLoading(true);
    try {
      await patientRegister(data);
      notifications.show({
        title: language === 'am' ? 'ምዝገባው ተሳክቷል!' : language === 'en' ? 'Registration Successful!' : "Galmeen Milkaa'eera!",
        message: language === 'am' ? 'የታካሚ መለያ ተፈጥሯል። ወደ ፖርታል እየገቡ ነው...' : language === 'en' ? 'Account created. Entering Patient Portal...' : "Akaawuntiin uumameera. Gara poortaaliitti qajeelaa jirtu...",
        color: 'teal',
      });
      router.push('/patient-portal');
    } catch {
      notifications.show({
        title: language === 'am' ? 'የምዝገባ ስህተት' : language === 'en' ? 'Registration Error' : 'Dogoggora Galmee',
        message: language === 'am' ? 'መረጃዎን አረጋግጠው እንደገና ይሞክሩ።' : language === 'en' ? 'Could not complete registration. Please check inputs.' : "Galmeen hin xumuramne. Odeeffannoo keessan mirkaneessaa.",
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100/80 dark:bg-slate-950 p-4 sm:p-6 transition-colors duration-200">
      {/* Subtle Healthcare Ambient Gradient */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-400/10 dark:bg-teal-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-400/10 dark:bg-sky-500/5 blur-3xl" />

      {/* Top Bar Controls */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-40 flex items-center gap-2">
        <ThemeToggle variant="minimal" />
      </div>

      {/* Enterprise Central Patient Card */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md transition-all">
        {/* Hospital Brand Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs">
              <HeartPulse className="w-6 h-6" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('hospital_name')}
          </h1>

          <p className="mt-1 text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-400">
            {language === 'om'
              ? 'Poortaalii Tajaajila Fayyaa Dhukkubsattootaa'
              : language === 'am'
              ? 'የታካሚዎች የግል ጤና ፖርታል'
              : 'Patient Personal Healthcare Portal'}
          </p>

          {/* Multilingual Selector */}
          <div className="mt-3 flex justify-center">
            <LanguageSelect variant="light" />
          </div>
        </div>

        {/* Primary Mode Switcher: Sign In vs New Registration */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-5 text-xs sm:text-sm font-semibold border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveMode('login')}
            className={`rounded-lg py-2 px-3 text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeMode === 'login'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{language === 'am' ? 'መግቢያ (Sign In)' : language === 'en' ? 'Sign In' : 'Seensa (Login)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('register')}
            className={`rounded-lg py-2 px-3 text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeMode === 'register'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{language === 'am' ? 'አዲስ ምዝገባ (Register)' : language === 'en' ? 'New Patient' : 'Galmee Haaraa'}</span>
          </button>
        </div>

        {/* =========================================================================
            MODE 1: SIGN IN (Strict Privacy — Zero Patient Names on Public Screen)
            ========================================================================= */}
        {activeMode === 'login' && (
          <div>
            {/* Input Method Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg mb-4 text-xs font-medium border border-slate-200/70 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('fayda');
                  setLoginValue('identifier', 'FAN-9901-2384-5120');
                }}
                className={`rounded-md py-1.5 px-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'fayda'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{language === 'am' ? 'ፋይዳ (Fayda)' : 'Fayda FAN'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setLoginValue('identifier', '+251 911 002 233');
                }}
                className={`rounded-md py-1.5 px-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'phone'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{language === 'am' ? 'ስልክ (Phone)' : 'Phone'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('mrn');
                  setLoginValue('identifier', 'MKH-2026-0001');
                }}
                className={`rounded-md py-1.5 px-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'mrn'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{language === 'am' ? 'MRN መለያ' : 'Hospital MRN'}</span>
              </button>
            </div>

            {/* Quick Patient Test Chips */}
            <div className="mb-4 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>{language === 'om' ? 'Fkn. Seensaa:' : language === 'am' ? 'የሙከራ አካውንት:' : 'Demo Quick-Fill:'}</span>
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('fayda');
                    setLoginValue('identifier', 'FAN-9901-2384-5120');
                    setLoginValue('password_or_otp', '123456');
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                >
                  Gudeta (FAN-9901)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('fayda');
                    setLoginValue('identifier', 'FAN-7721-9981-3310');
                    setLoginValue('password_or_otp', '123456');
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition cursor-pointer"
                >
                  Chaltu (FAN-7721)
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-3.5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {authMethod === 'fayda' && <CreditCard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                  {authMethod === 'phone' && <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                  {authMethod === 'mrn' && <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                  <span>
                    {authMethod === 'fayda' &&
                      (language === 'am'
                        ? 'ብሔራዊ ዲጂታል መታወቂያ (ፋይዳ FAN)'
                        : language === 'en'
                        ? 'National Digital ID (Fayda FAN Number)'
                        : 'Eenyummaa Biyyaalessaa (Fayda FAN Number)')}
                    {authMethod === 'phone' &&
                      (language === 'am'
                        ? 'የሞባይል ስልክ ቁጥር'
                        : language === 'en'
                        ? 'Mobile Phone Number'
                        : 'Lakkoofsa Bilbilaa (Mobile Phone)')}
                    {authMethod === 'mrn' &&
                      (language === 'am'
                        ? 'የሆስፒታል መዝገብ ቁጥር (MRN)'
                        : language === 'en'
                        ? 'Hospital Record Number (MRN)'
                        : 'Lakkoofsa Galmee Yaalaa (Hospital MRN)')}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...registerLogin('identifier')}
                    placeholder={
                      authMethod === 'fayda'
                        ? 'FAN-9901-2384-5120'
                        : authMethod === 'phone'
                        ? '+251 911 002 233'
                        : 'MKH-2026-0001'
                    }
                    className="block w-full h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/20 transition-all"
                  />
                </div>
                {loginErrors.identifier && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <span>•</span> {loginErrors.identifier.message}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>
                    {language === 'am'
                      ? 'የይለፍ ቃል ወይም የኤስኤምኤስ OTP ኮድ'
                      : language === 'en'
                      ? 'Password or SMS OTP Code'
                      : 'Jecha Darbii ykn Koodii OTP (Password/OTP)'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    {...registerLogin('password_or_otp')}
                    placeholder={language === 'am' ? 'ምሳሌ፡ 123456' : 'e.g. 123456'}
                    className="block w-full h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/20 transition-all"
                  />
                </div>
                {loginErrors.password_or_otp && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <span>•</span> {loginErrors.password_or_otp.message}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {language === 'am'
                    ? 'በስልክዎ የተላከውን የኤስኤምኤስ ኮድ (OTP) ወይም የይለፍ ቃልዎን ይጠቀሙ።'
                    : language === 'en'
                    ? 'Use the SMS verification code (OTP) sent to your phone or your account password.'
                    : 'Koodii yeroo tokkoo (OTP) bilbilaaf ergame ykn jecha darbii keessan fayyadamaa.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 hover:from-teal-800 hover:to-slate-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:cursor-not-allowed disabled:opacity-75 border border-teal-500/30"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{language === 'am' ? 'በማረጋገጥ ላይ...' : language === 'en' ? 'Verifying...' : 'Qorachaa jira...'}</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {language === 'am'
                        ? 'ወደ ታካሚ ፖርታል ይግቡ'
                        : language === 'en'
                        ? 'Sign In to Patient Portal'
                        : 'Gara Patient Portal Seenaa'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-teal-300" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* =========================================================================
            MODE 2: NEW PATIENT ENROLLMENT (Galmee Haaraa)
            ========================================================================= */}
        {activeMode === 'register' && (
          <div>
            <form onSubmit={handleEnrollSubmit(onRegister)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{language === 'am' ? 'ሙሉ ስም (Full Name)' : language === 'en' ? 'Full Name' : 'Maqaa Guutuu'} *</span>
                  </label>
                  <input
                    type="text"
                    {...registerEnroll('full_name')}
                    placeholder="fkn: Tolasa Gudeta"
                    className="block w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  {enrollErrors.full_name && (
                    <p className="mt-0.5 text-[11px] text-rose-600 font-medium">{enrollErrors.full_name.message}</p>
                  )}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{language === 'am' ? 'ስልክ ቁጥር (Phone)' : language === 'en' ? 'Phone Number' : 'Lakkoofsa Bilbilaa'} *</span>
                  </label>
                  <input
                    type="text"
                    {...registerEnroll('phone_number')}
                    placeholder="+251 911 000 000"
                    className="block w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  {enrollErrors.phone_number && (
                    <p className="mt-0.5 text-[11px] text-rose-600 font-medium">{enrollErrors.phone_number.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fayda National ID */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{language === 'am' ? 'ፋይዳ መታወቂያ (Fayda)' : 'Fayda ID (FAN)'}</span>
                  </label>
                  <input
                    type="text"
                    {...registerEnroll('fayda_id')}
                    placeholder="FAN-9901-2384-5120"
                    className="block w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {/* Birth Place / Woreda */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{language === 'am' ? 'የትውልድ ቦታ / ወረዳ' : 'Birth Place / Woreda'}</span>
                  </label>
                  <input
                    type="text"
                    {...registerEnroll('birth_place')}
                    placeholder="fkn: Mettu, Kebele 02"
                    className="block w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Birth Date */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{language === 'am' ? 'የትውልድ ቀን' : 'Date of Birth'}</span>
                  </label>
                  <input
                    type="date"
                    {...registerEnroll('birth_date')}
                    className="block w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>{language === 'am' ? 'ጾታ (Gender)' : 'Gender'}</span>
                  </label>
                  <select
                    {...registerEnroll('gender')}
                    className="block w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="male">{language === 'am' ? 'ወንድ (Male)' : language === 'en' ? 'Male' : 'Dhiira (Male)'}</option>
                    <option value="female">{language === 'am' ? 'ሴት (Female)' : language === 'en' ? 'Female' : 'Dubara (Female)'}</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{language === 'am' ? 'የይለፍ ቃል (Password/PIN)' : 'Password or PIN'} *</span>
                </label>
                <input
                  type="password"
                  {...registerEnroll('password')}
                  placeholder="••••••••"
                  className="block w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                {enrollErrors.password && (
                  <p className="mt-0.5 text-[11px] text-rose-600 font-medium">{enrollErrors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 hover:from-teal-800 hover:to-slate-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:cursor-not-allowed disabled:opacity-75 border border-teal-500/30"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{language === 'am' ? 'በመመዝገብ ላይ...' : language === 'en' ? 'Registering...' : 'Galmeessaa jira...'}</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {language === 'am'
                        ? 'ይመዝገቡ እና ወደ ፖርታል ይግቡ'
                        : language === 'en'
                        ? 'Register & Enter Portal'
                        : "Galmaa'aa & Poortaalitti Qajeelaa"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-teal-300" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Hospital Staff Switcher (Compact Row) */}
        <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-3.5 text-center">
          <div className="flex items-center justify-center flex-wrap gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {language === 'am'
                ? 'የሆስፒታል ሰራተኛ?'
                : language === 'en'
                ? 'Hospital Staff?'
                : 'Ogeessa Hospitaalaati?'}
            </span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>
                {language === 'am'
                  ? 'የሰራተኞች መግቢያ →'
                  : language === 'en'
                  ? 'Staff Login →'
                  : 'Seensa Hojjettootaa →'}
              </span>
            </Link>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-normal">
            {t('hospital_name')} • Mettu, Ilu Abba Bor, Oromia, Ethiopia
          </p>
        </div>
      </div>
    </div>
  );
}
