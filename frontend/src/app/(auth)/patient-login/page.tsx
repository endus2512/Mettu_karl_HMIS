/**
 * Mettu Karl Referral Hospital — Dedicated Patient Authentication & Enrollment Portal.
 *
 * User Request Refinements:
 * 1. Bright & Luminous Medical Daytime Theme:
 *    - Refreshing pastel gradient matching the bright staff login page.
 * 2. Extended Height Downwards (Hojjaa Gadi Dheeressuu):
 *    - Slightly increased vertical height for generous breathing room, elegant padding,
 *      and larger touch targets without overflowing the viewport.
 * 3. Privacy First (Zero Public Patient Exposure):
 *    - Absolutely NO patient names, MRNs, or identity details displayed on public screen.
 * 4. Dedicated Patient Self-Enrollment (Galmee Haaraa):
 *    - Allows new patients to register and immediately log in.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { ThemeToggle } from '@/components/common/ThemeToggle';

// Schemas
const patientLoginSchema = z.object({
  identifier: z.string().min(4, 'Identifier required / Barbaachisaadha / ያስፈልጋል'),
  password_or_otp: z.string().min(4, 'Password or OTP required / Barbaachisaadha / ያስፈልጋል'),
});

const patientRegisterSchema = z.object({
  full_name: z.string().min(3, 'Maqaa guutuu barreessaa / ሙሉ ስም ያስገቡ'),
  phone_number: z.string().min(7, 'Lakkoofsa bilbilaa sirrii / ትክክለኛ ስልክ ቁጥር'),
  birth_place: z.string().optional(),
  fayda_id: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female']).default('male'),
  password: z.string().min(4, 'Jechi darbii yoo xiqqaate qubee 4 qabaachuu qaba'),
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50/70 via-sky-50/40 to-emerald-50/60 p-4 sm:p-6 overflow-hidden">
      {/* Bright Luminous Ambient Pastel Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-100/30 blur-3xl" />

      {/* Top Right Single Theme Toggle Button */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-40">
        <ThemeToggle variant="minimal" />
      </div>

      {/* High-Contrast Luminous Central Card with Comfortably Extended Downward Height */}
      <div className="relative w-full max-w-xl rounded-[28px] bg-white p-6 sm:p-8 sm:py-10 shadow-2xl shadow-teal-950/10 border-2 border-teal-400 ring-8 ring-teal-500/15 backdrop-blur-md">
        {/* Hospital Brand Header */}
        <div className="mb-5 sm:mb-6 text-center">
          <div className="mb-2.5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md shadow-teal-700/30 border border-teal-300">
            <span className="text-3xl">🏥</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {t('hospital_name')}
          </h1>

          {/* Multilingual Selector: Placed directly BELOW Mettu Karl Referral Hospital */}
          <div className="mt-3 flex justify-center">
            <LanguageSelect variant="light" />
          </div>
        </div>

        {/* Primary Mode Switcher: Sign In vs New Registration (Privacy Ensured) */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-100/90 p-1.5 rounded-2xl mb-4.5 sm:mb-5 text-xs sm:text-sm font-black">
          <button
            type="button"
            onClick={() => setActiveMode('login')}
            className={`rounded-xl py-2.5 px-3.5 text-center transition-all duration-150 border-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeMode === 'login'
                ? 'bg-white border-teal-600 text-teal-950 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-teal-900 hover:bg-white/60'
            }`}
          >
            <span>🔐</span>
            <span>{language === 'am' ? 'መግቢያ (Sign In)' : language === 'en' ? 'Sign In' : 'Seensa (Login)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('register')}
            className={`rounded-xl py-2.5 px-3.5 text-center transition-all duration-150 border-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeMode === 'register'
                ? 'bg-white border-teal-600 text-teal-950 shadow-xs'
                : 'border-transparent text-slate-600 hover:text-teal-900 hover:bg-white/60'
            }`}
          >
            <span>📝</span>
            <span>{language === 'am' ? 'አዲስ ምዝገባ (Register)' : language === 'en' ? 'New Patient' : 'Galmee Haaraa (Register)'}</span>
          </button>
        </div>

        {/* =========================================================================
            MODE 1: SIGN IN (Strict Privacy — Zero Patient Names on Public Screen)
            ========================================================================= */}
        {activeMode === 'login' && (
          <div>
            {/* Input Method Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100/90 p-1.5 rounded-xl mb-4 sm:mb-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('fayda');
                  setLoginValue('identifier', 'FAN-9901-2384-5120');
                }}
                className={`rounded-lg py-2 px-1 text-center transition-all duration-150 border cursor-pointer ${
                  authMethod === 'fayda'
                    ? 'bg-white border-teal-600 text-teal-900 shadow-2xs font-black'
                    : 'border-transparent text-slate-600 hover:border-teal-300 hover:bg-white/80'
                }`}
              >
                {language === 'am' ? '🆔 ፋይዳ' : language === 'en' ? '🆔 Fayda' : '🆔 Fayda'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setLoginValue('identifier', '+251 911 002 233');
                }}
                className={`rounded-lg py-2 px-1 text-center transition-all duration-150 border cursor-pointer ${
                  authMethod === 'phone'
                    ? 'bg-white border-teal-600 text-teal-900 shadow-2xs font-black'
                    : 'border-transparent text-slate-600 hover:border-teal-300 hover:bg-white/80'
                }`}
              >
                {language === 'am' ? '📱 ስልክ' : language === 'en' ? '📱 Phone' : '📱 Bilbila'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('mrn');
                  setLoginValue('identifier', 'MKH-2026-0001');
                }}
                className={`rounded-lg py-2 px-1 text-center transition-all duration-150 border cursor-pointer ${
                  authMethod === 'mrn'
                    ? 'bg-white border-teal-600 text-teal-900 shadow-2xs font-black'
                    : 'border-transparent text-slate-600 hover:border-teal-300 hover:bg-white/80'
                }`}
              >
                {language === 'am' ? '🏥 MRN' : language === 'en' ? '🏥 MRN' : '🏥 MRN'}
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
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
                </label>
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
                  className="block w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-400/20 hover:border-teal-400 transition-all duration-150"
                />
                {loginErrors.identifier && (
                  <p className="mt-1 text-xs text-rose-600 font-bold">{loginErrors.identifier.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  {language === 'am'
                    ? 'የይለፍ ቃል ወይም የኤስኤምኤስ OTP ኮድ'
                    : language === 'en'
                    ? 'Password or SMS OTP Code'
                    : 'Jecha Darbii ykn Koodii OTP (Password/OTP)'}
                </label>
                <input
                  type="password"
                  {...registerLogin('password_or_otp')}
                  placeholder={language === 'am' ? 'ምሳሌ፡ 123456' : language === 'en' ? 'e.g. 123456' : 'e.g. 123456'}
                  className="block w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-400/20 hover:border-teal-400 transition-all duration-150"
                />
                {loginErrors.password_or_otp && (
                  <p className="mt-1 text-xs text-rose-600 font-bold">{loginErrors.password_or_otp.message}</p>
                )}
                <p className="mt-1.5 text-[11px] text-slate-500 font-medium leading-tight">
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
                className="w-full rounded-xl border-2 border-teal-600 bg-teal-600 px-4 py-3.5 text-sm sm:text-base font-black text-white shadow-md hover:bg-teal-700 hover:border-teal-700 hover:ring-4 hover:ring-teal-400/30 active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isLoading
                  ? language === 'am'
                    ? 'በማረጋገጥ ላይ...'
                    : language === 'en'
                    ? 'Verifying...'
                    : 'Iccitii Qorachaa Jira...'
                  : language === 'am'
                  ? 'ወደ ታካሚ ፖርታል ይግቡ →'
                  : language === 'en'
                  ? 'Sign In to Patient Portal →'
                  : 'Gara Patient Portal Seenaa →'}
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
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                    {language === 'am' ? 'ሙሉ ስም (Full Name)' : language === 'en' ? 'Full Name' : 'Maqaa Guutuu'} *
                  </label>
                  <input
                    type="text"
                    {...registerEnroll('full_name')}
                    placeholder="fkn: Tolasa Gudeta"
                    className="block w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                  {enrollErrors.full_name && (
                    <p className="mt-0.5 text-[11px] text-rose-600 font-bold">{enrollErrors.full_name.message}</p>
                  )}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                    {language === 'am' ? 'ስልክ ቁጥር (Phone)' : language === 'en' ? 'Phone Number' : 'Lakkoofsa Bilbilaa'} *
                  </label>
                  <input
                    type="text"
                    {...registerEnroll('phone_number')}
                    placeholder="+251 911 000 000"
                    className="block w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                  {enrollErrors.phone_number && (
                    <p className="mt-0.5 text-[11px] text-rose-600 font-bold">{enrollErrors.phone_number.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fayda National ID */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                    {language === 'am' ? 'ፋይዳ መታወቂያ (Fayda FAN)' : language === 'en' ? 'Fayda ID (FAN)' : 'Eenyummaa Fayda (FAN)'}
                  </label>
                  <input
                    type="text"
                    {...registerEnroll('fayda_id')}
                    placeholder="FAN-9901-2384-5120"
                    className="block w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>

                {/* Birth Place / Woreda */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                    {language === 'am' ? 'የትውልድ ቦታ / ወረዳ' : language === 'en' ? 'Birth Place / Woreda' : 'Bakka Dhalootaa / Aanaa'}
                  </label>
                  <input
                    type="text"
                    {...registerEnroll('birth_place')}
                    placeholder="fkn: Mettu, Kebele 02"
                    className="block w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Birth Date */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                    {language === 'am' ? 'የትውልድ ቀን' : language === 'en' ? 'Date of Birth' : 'Guyyaa Dhalootaa'}
                  </label>
                  <input
                    type="date"
                    {...registerEnroll('birth_date')}
                    className="block w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                    {language === 'am' ? 'ጾታ (Gender)' : language === 'en' ? 'Gender' : 'Saala'}
                  </label>
                  <select
                    {...registerEnroll('gender')}
                    className="block w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20 bg-white"
                  >
                    <option value="male">{language === 'am' ? 'ወንድ (Male)' : language === 'en' ? 'Male' : 'Dhiira (Male)'}</option>
                    <option value="female">{language === 'am' ? 'ሴት (Female)' : language === 'en' ? 'Female' : 'Dubara (Female)'}</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                  {language === 'am' ? 'የይለፍ ቃል ወይም ፒን (Password/PIN)' : language === 'en' ? 'Password or PIN' : 'Jecha Darbii / PIN'} *
                </label>
                <input
                  type="password"
                  {...registerEnroll('password')}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
                {enrollErrors.password && (
                  <p className="mt-0.5 text-[11px] text-rose-600 font-bold">{enrollErrors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl border-2 border-teal-600 bg-teal-600 px-4 py-3 text-xs sm:text-sm font-black text-white shadow-md hover:bg-teal-700 hover:border-teal-700 hover:ring-4 hover:ring-teal-400/30 active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isLoading
                  ? language === 'am'
                    ? 'በመመዝገብ ላይ...'
                    : language === 'en'
                    ? 'Registering...'
                    : 'Galmeessaa Jira...'
                  : language === 'am'
                  ? 'ይመዝገቡ እና ወደ ፖርታል ይግቡ →'
                  : language === 'en'
                  ? 'Register & Enter Portal →'
                  : "Galmaa'aa & Poortaalitti Qajeelaa →"}
              </button>
            </form>
          </div>
        )}

        {/* Hospital Staff Switcher (Compact Row) */}
        <div className="mt-5 sm:mt-6 border-t border-slate-200 pt-3.5 sm:pt-4 text-center">
          <div className="flex items-center justify-center flex-wrap gap-2 text-xs">
            <span className="text-slate-600 font-semibold">
              {language === 'am'
                ? 'የሆስፒታል ሰራተኛ?'
                : language === 'en'
                ? 'Hospital Staff?'
                : 'Ogeessa Hospitaalaati?'}
            </span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-800 hover:border-teal-500 hover:text-teal-900 hover:bg-teal-50 transition-all duration-150 cursor-pointer"
            >
              <span>💼</span>
              {language === 'am'
                ? 'የሰራተኞች መግቢያ →'
                : language === 'en'
                ? 'Staff Login →'
                : 'Seensa Hojjettootaa →'}
            </Link>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2">
            {t('hospital_name')} • Mettu, Ilu Abba Bor, Oromia
          </p>
        </div>
      </div>
    </div>
  );
}
