/**
 * Mettu Karl Comprehensive Specialized Hospital — Unified Public Portal & Campus Workstation.
 *
 * Enterprise Healthcare Design System:
 * - Fully responsive, portable layout optimized for both mobile screens and desktop PCs
 * - Modern HTML/Tailwind structure with Obsidian & Champagne Gold luxury aesthetic
 * - Clean navigation header with Emergency 907 hotline, calendar switcher, and language options
 * - Interactive hospital building complex overview (Block A, Block B, ICU, Maternal, Diagnostics, Lab, Emergency)
 * - Quick-access cards for Clinical Services, OPD, Laboratory, PACS, Inpatient Wards, and Pharmacy
 * - Direct unified authentication and isolated patient portal access
 */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  Bed,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  Droplets,
  FileText,
  FlaskConical,
  HeartPulse,
  Home,
  Info,
  Layers,
  Lock,
  LogIn,
  MapPin,
  Maximize2,
  Phone,
  PhoneCall,
  Pill,
  QrCode,
  Scan,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Ticket,
  User,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation, type Language } from '@/lib/i18n';

interface BuildingBlock {
  id: string;
  code: string;
  name_en: string;
  name_om: string;
  category: string;
  color: string;
  borderColor: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  floor: string;
  description: string;
  services: string[];
  link: string;
  statusText: string;
}

const HOSPITAL_BLOCKS: BuildingBlock[] = [
  {
    id: 'block-a',
    code: 'BLOCK A',
    name_en: 'Outpatient Department (OPD Clinics)',
    name_om: 'Kutaa Yaala Alaa (OPD & Qorannoo)',
    category: 'Clinical OPD',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    icon: Stethoscope,
    floor: 'Block A • Ground & 1st Floor',
    description: 'Smart ticket queue calling, General Medicine, Pediatrics, Internal Medicine, and Chronic Follow-up.',
    services: ['Smart Queue Token Calling', 'General OPD Consultations', 'Pediatrics & Under-5 Clinic', 'Chronic Disease Center'],
    link: '/queue',
    statusText: 'Open • 24/7 Active',
  },
  {
    id: 'block-b',
    code: 'BLOCK B',
    name_en: 'Surgical Inpatient & Operating Theatres (OT)',
    name_om: 'Wardi Baqaqsaa & Kutaalee Yaalaa (OT)',
    category: 'Surgery & OT',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/10',
    icon: Syringe,
    floor: 'Block B • 1st & 2nd Floor',
    description: '3 Major sterile Operating Theatres, Orthopedic surgical bay, CSSD instrument sterilization, and Post-Op recovery.',
    services: ['Major Operating Theatre 1-3', 'Orthopedics & Fracture Ward', 'CSSD Autoclave Sterilization', 'Post-Op Recovery Bay'],
    link: '/wards',
    statusText: 'Active Operating Suite',
  },
  {
    id: 'block-c',
    code: 'BLOCK C',
    name_en: 'Intensive Care Unit (ICU) & Resuscitation',
    name_om: 'Kutaa Yaala Cimaa (ICU & Resuscitation)',
    category: 'Critical Care',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    bgColor: 'bg-rose-500/10',
    icon: HeartPulse,
    floor: 'Block C • 3rd Floor',
    description: 'Ventilated adult and pediatric intensive care beds, bedside IoMT continuous telemetry, and acute shock resuscitation.',
    services: ['Mechanical Ventilators', 'Bedside Vital Signs Telemetry', 'Acute Resuscitation Bay', 'Isolation Negative-Pressure'],
    link: '/iomt',
    statusText: 'High Priority • 24/7 Ready',
  },
  {
    id: 'maternal-wing',
    code: 'WING M',
    name_en: 'Maternal & Neonatal Wing (MCH & NICU)',
    name_om: 'Kutaa Harmootaa fi Da\'umsaa (MCH & NICU)',
    category: 'Maternal Health',
    color: 'text-teal-400',
    borderColor: 'border-teal-500/40',
    bgColor: 'bg-teal-500/10',
    icon: Users,
    floor: 'Maternal Wing • Ground Floor',
    description: 'Labor & Delivery suites, dedicated C-Section surgical theater, Neonatal Intensive Care Unit (NICU), and Antenatal Care (ANC).',
    services: ['Labor & Delivery Suites', 'Emergency C-Section OT', 'NICU Incubators & Warmers', 'Antenatal Ultrasound'],
    link: '/wards',
    statusText: 'Comprehensive EmONC Level 4',
  },
  {
    id: 'diagnostics-pacs',
    code: 'DIAG-1',
    name_en: 'Radiology & Web PACS Imaging Center',
    name_om: 'Kutaa Raajii & Qorannoo Suuraa (PACS)',
    category: 'Diagnostic Radiology',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgColor: 'bg-cyan-500/10',
    icon: Scan,
    floor: 'Diagnostic Center • Block D',
    description: 'Digital Radiography (CR/DR), 64-Slice Helical CT Scanner, Color Doppler Ultrasound, and Orthanc PACS web viewers.',
    services: ['64-Slice Helical CT Scan', 'Digital Chest/Skeletal X-Ray', 'Color Doppler Ultrasound', 'Electronic Radiologist Sign-off'],
    link: '/pacs',
    statusText: 'Online • Orthanc Linked',
  },
  {
    id: 'central-lab',
    code: 'LAB-LIS',
    name_en: 'ISO-15189 Certified Clinical Laboratory',
    name_om: 'Laabooratorii & Qorannoo Dhiigaa (LIS)',
    category: 'Laboratory Pathology',
    color: 'text-amber-300',
    borderColor: 'border-amber-400/40',
    bgColor: 'bg-amber-400/10',
    icon: FlaskConical,
    floor: 'Central Laboratory Wing',
    description: 'Fully automated 5-part hematology analyzer, clinical chemistry, blood crossmatching, and critical panic value alerting.',
    services: ['CBC & 5-Part Differential', 'Clinical Chemistry & Liver/Renal', 'Blood Transfusion Crossmatch', 'Panic Value Notifications'],
    link: '/laboratory',
    statusText: 'ISO Accredited Testing',
  },
  {
    id: 'emergency-ems',
    code: 'ED-907',
    name_en: 'Emergency Trauma Center & Ambulance Fleet',
    name_om: 'Kutaa Balaa Hatattamaa & Ambulaansii 907',
    category: 'Emergency Resuscitation',
    color: 'text-rose-500',
    borderColor: 'border-rose-500/50',
    bgColor: 'bg-rose-500/15',
    icon: AlertOctagon,
    floor: 'Emergency Complex • Ground Level',
    description: 'MCI disaster START triage, trauma resuscitation suites, 24/7 dedicated dispatch fleet, and national 907 toll-free integration.',
    services: ['START Color Triage Protocol', 'Trauma Resuscitation Suite', 'Ambulance 907 GPS Tracking', 'Direct ED Bedside Admission'],
    link: '/ems',
    statusText: 'National Toll-Free: 907',
  },
  {
    id: 'pharmacy-cdss',
    code: 'PHARM-24',
    name_en: '24/7 Dispensary & FEFO Drug Inventory',
    name_om: 'Faarmaasii & To\'annoo Qorichaa (FEFO)',
    category: 'Pharmaceutical Care',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    icon: Pill,
    floor: 'Central Dispensary • Gate 1',
    description: 'FEFO stock management, clinical drug-drug interaction alerts (CDSS), Telebirr electronic cashier, and cold-chain monitoring.',
    services: ['24-Hour Medicine Dispensary', 'First-Expiry First-Out (FEFO)', 'Clinical Drug Interaction CDSS', 'Telebirr Digital Clearance'],
    link: '/pharmacy',
    statusText: 'Stocked • 24/7 Continuous',
  },
];

export default function HomePage(): React.ReactElement {
  const { isAuthenticated, user, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const router = useRouter();

  const [activeBlock, setActiveBlock] = useState<BuildingBlock>(HOSPITAL_BLOCKS[0]);
  const [useEthiopianCalendar, setUseEthiopianCalendar] = useState<boolean>(false);

  // Quick search in services
  const [serviceSearch, setServiceSearch] = useState<string>('');

  // Filtered blocks based on search
  const filteredBlocks = HOSPITAL_BLOCKS.filter(
    (b) =>
      !serviceSearch ||
      b.name_en.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      b.name_om.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      b.services.some((s) => s.toLowerCase().includes(serviceSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* ========================================================================= */}
      {/* 1. TOP EMERGENCY & UTILITY NOTICE BAR                                     */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-rose-950/80 via-[#101624] to-rose-950/80 border-b border-rose-500/20 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-rose-300 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider font-mono">
              {language === 'om' ? 'Tajaajila Balaa Hatattamaa (24/7 Emergency):' : language === 'am' ? 'የ24/7 የድንገተኛ አደጋ ህክምና ጥሪ:' : '24/7 Emergency Medical Response:'}
            </span>
            <span className="text-white font-extrabold flex items-center gap-1 font-mono">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" /> 907 (Toll-Free) • +251 47 441 2345
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <button
              onClick={() => setUseEthiopianCalendar(!useEthiopianCalendar)}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors font-mono"
            >
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>{useEthiopianCalendar ? 'Ethiopian Calendar (EC)' : 'Gregorian (GC)'}</span>
            </button>
            <span>•</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`font-semibold transition-colors ${language === 'en' ? 'text-amber-400 underline underline-offset-4' : 'hover:text-slate-200'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('om')}
                className={`font-semibold transition-colors ${language === 'om' ? 'text-amber-400 underline underline-offset-4' : 'hover:text-slate-200'}`}
              >
                Afaan Oromoo
              </button>
              <button
                onClick={() => setLanguage('am')}
                className={`font-semibold transition-colors ${language === 'am' ? 'text-amber-400 underline underline-offset-4' : 'hover:text-slate-200'}`}
              >
                አማርኛ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN NAVIGATION HEADER                                                 */}
      {/* ========================================================================= */}
      <header className="border-b border-[#1a2233] bg-[#101624]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Hospital Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-amber-400/20 to-teal-500/20 border border-amber-500/40 p-1 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight group-hover:text-amber-300 transition-colors">
                Mettu Karl Comprehensive Specialized Hospital
              </h1>
              <p className="text-[11px] text-amber-400/90 font-medium">
                Level 4 Tertiary Referral Hospital • Ilu Aba Bor, Oromia
              </p>
            </div>
          </Link>

          {/* Nav Actions / Auth Status */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href={user?.role === 'patient' ? '/patient-portal' : '/dashboard'}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>
                    {user?.role === 'patient'
                      ? (language === 'om' ? 'Poortaalii Dhukkubsataa' : language === 'am' ? 'የታካሚ ፖርታል' : 'Patient Portal')
                      : (language === 'om' ? 'Gara Daashboordii' : language === 'am' ? 'ወደ ዳሽቦርድ' : 'Open Dashboard')}
                  </span>
                </Link>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141b29] border border-[#2b374e] text-xs">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-white truncate max-w-[120px]">{user?.fullName || user?.username}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1a2233] text-teal-300 border border-teal-500/30">
                    {user?.role}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:scale-105"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{language === 'om' ? 'Seeni (Login)' : language === 'am' ? 'ግባ (Login)' : 'Staff & Patient Login'}</span>
                </Link>
                <Link
                  href="/login?tab=patient"
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#141b29] hover:bg-[#1a2233] text-amber-400 border border-amber-500/30 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{language === 'om' ? 'Poortaalii Dhukkubsataa' : language === 'am' ? 'የታካሚ ፖርታል' : 'Patient Portal'}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SHOWCASE & SEARCH                                                 */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden border-b border-[#1a2233] bg-gradient-to-b from-[#101624] via-[#0b0f17] to-[#0b0f17] py-12 md:py-16 px-4 sm:px-8">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a223315_1px,transparent_1px),linear-gradient(to_bottom,#1a223315_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {language === 'om'
                  ? 'Sirna Yaalaa fi Qorannoo Dijitaalaa • Advanced Hospital Information System'
                  : language === 'am'
                  ? 'የዲጂታል ህክምናና መረጃ ስርዓት • Advanced Hospital Information System'
                  : 'Digital Healthcare & Telemetry • Advanced Hospital Information System'}
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {language === 'om' ? (
                <>
                  Tajaajila Fayyaa Ispeeshaalaayizdii fi{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                    Teknooloojii Ammayyaa
                  </span>
                </>
              ) : language === 'am' ? (
                <>
                  ስፔሻላይዝድ የጤና አገልግሎትና{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                    ዘመናዊ ቴክኖሎጂ
                  </span>
                </>
              ) : (
                <>
                  Specialized Tertiary Healthcare &{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                    Modern Medical Technology
                  </span>
                </>
              )}
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              {language === 'om'
                ? 'Hospitaalli Waliigalaa Ispeeshaalaayizdii Karl Mattuu dhiha Oromiyaa fi naannolee ollaa hundaaf tajaajila yaalaa sadarkaa 4ffaa qulqullina olaanaa qabu kennaa jira.'
                : language === 'am'
                ? 'የመቱ ካርል ሪፈራል ሆስፒታል ለምዕራብ ኢትዮጵያና ለአጎራባች ክልሎች ጥራት ያለው የደረጃ 4 የሪፈራል ህክምና አገልግሎት ይሰጣል።'
                : 'Mettu Karl Comprehensive Specialized Hospital provides accredited Level-4 tertiary clinical care, 24/7 acute resuscitation, and advanced diagnostics across Western Ethiopia.'}
            </p>

            {/* Hero Quick Search for Clinics / Services */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder={
                    language === 'om'
                      ? 'Kutaa yaalaa ykn tajaajila barbaadi...'
                      : language === 'am'
                      ? 'የህክምና ክፍል ወይም አገልግሎት ይፈልጉ...'
                      : 'Search clinical services, departments, or wards...'
                  }
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full bg-[#101624] border border-[#2b374e] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
                />
                <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>

              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <span>{language === 'om' ? 'Gara Sirnaatti Seeni' : language === 'am' ? 'ወደ ሲስተም ግባ' : 'Enter Hospital System'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Metrics Badge Strip */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#1a2233]">
              <div className="p-3 rounded-2xl bg-[#101624]/60 border border-[#1a2233] text-left">
                <span className="text-xs text-slate-400 block">
                  {language === 'om' ? 'Sadarkaa' : language === 'am' ? 'ደረጃ' : 'Accreditation'}
                </span>
                <strong className="text-base font-extrabold text-amber-400">Level 4 Tertiary</strong>
              </div>
              <div className="p-3 rounded-2xl bg-[#101624]/60 border border-[#1a2233] text-left">
                <span className="text-xs text-slate-400 block">
                  {language === 'om' ? 'Kutaalee Ciisichaa' : language === 'am' ? 'የተኝቶ ክፍሎች' : 'Inpatient Beds'}
                </span>
                <strong className="text-base font-extrabold text-emerald-400">6 Wards • 28 Beds</strong>
              </div>
              <div className="p-3 rounded-2xl bg-[#101624]/60 border border-[#1a2233] text-left">
                <span className="text-xs text-slate-400 block">
                  {language === 'om' ? 'Raajii & Qorannoo' : language === 'am' ? 'ራዲዮሎጂና ምስል' : 'Diagnostic Imaging'}
                </span>
                <strong className="text-base font-extrabold text-cyan-400">CT 64 & Web PACS</strong>
              </div>
              <div className="p-3 rounded-2xl bg-[#101624]/60 border border-[#1a2233] text-left">
                <span className="text-xs text-slate-400 block">
                  {language === 'om' ? 'Laabooratorii' : language === 'am' ? 'ላቦራቶሪ' : 'LIS Pathology'}
                </span>
                <strong className="text-base font-extrabold text-teal-400">ISO-15189 LIS</strong>
              </div>
            </div>
          </div>

          {/* Building Hero Visual Card */}
          <div className="w-full lg:w-[480px] shrink-0">
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#1a2233] bg-[#101624] shadow-2xl p-2 group hover:border-amber-500/40 transition-all">
              <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden">
                <Image
                  src="/hospital-building.webp"
                  alt="Mettu Karl Comprehensive Specialized Hospital Building"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-black/30" />
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#101624]/90 backdrop-blur-md border border-[#2b374e]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 font-mono">Main Campus</span>
                      <h4 className="text-xs font-bold text-white">Ijaarsa Hospitaala Karl Mattuu</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Operational 24/7
                    </span>
                  </div>
                </div>
              </div>

              {/* Building Quick Action Navigation Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link
                  href="/wards"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#141b29] hover:bg-[#1a2233] text-xs font-semibold text-slate-200 border border-[#2b374e] transition-all"
                >
                  <Bed className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kutaa Ciisichaa (IPD)</span>
                </Link>
                <Link
                  href="/queue"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#141b29] hover:bg-[#1a2233] text-xs font-semibold text-slate-200 border border-[#2b374e] transition-all"
                >
                  <Ticket className="w-3.5 h-3.5 text-teal-400" />
                  <span>Dabaree Waamuu (Queue)</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE HOSPITAL BUILDING COMPLEX MAP                              */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-8 border-b border-[#1a2233] bg-[#0d121d]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Kaartaa Kutaalee Hospitaalaa (Campus Architecture)</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Kutaalee fi Ijaarsawwan Hospitaala Karl Mattuu</h3>
              <p className="text-xs text-slate-400 mt-1">
                Kutaalee armaan gadii filachuun tajaajiloota fi haala hojii isaanii battalatti qoradhaa
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {filteredBlocks.length} Kutaalee Qindaa'an
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Building Selection Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredBlocks.map((block) => {
                const isSelected = activeBlock.id === block.id;
                const IconComponent = block.icon;
                return (
                  <div
                    key={block.id}
                    onClick={() => setActiveBlock(block)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#161f30] border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                        : 'bg-[#101624] border-[#1a2233] hover:border-[#2b374e] hover:bg-[#141b29]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${block.bgColor} ${block.color} border ${block.borderColor}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1a2233] text-slate-300">
                          {block.code}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-3">{block.name_om}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{block.name_en}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1f293d] flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{block.floor}</span>
                      <span className={`font-semibold ${block.color}`}>{block.statusText}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Active Building Detail Showcase */}
            <div className="lg:col-span-5 bg-[#101624] border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-amber-500/5 pointer-events-none">
                <Building2 className="w-48 h-48" />
              </div>

              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#1a2233]">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${activeBlock.bgColor} ${activeBlock.color} border ${activeBlock.borderColor}`}>
                      {React.createElement(activeBlock.icon, { className: 'w-6 h-6' })}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold font-mono text-amber-400">{activeBlock.code}</span>
                      <h4 className="text-base font-bold text-white">{activeBlock.name_om}</h4>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1a2233] text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Bakka (Location):</span>
                    <p className="text-slate-200 font-semibold">{activeBlock.floor}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Ibsa Kutaichaa (Overview):</span>
                    <p className="text-slate-300 leading-relaxed mt-0.5">{activeBlock.description}</p>
                  </div>
                </div>

                {/* Services list */}
                <div className="mt-5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Tajaajiloota Ijoo (Core Services):
                  </span>
                  <div className="space-y-1.5">
                    {activeBlock.services.map((srv, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-200 bg-[#141b29] p-2 rounded-xl border border-[#1f293d]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{srv}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Workstation Action Link */}
              <div className="mt-6 pt-4 border-t border-[#1a2233]">
                <Link
                  href={activeBlock.link}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all hover:scale-[1.02]"
                >
                  <span>Gara Kutaa Kanaan Seeni (Open Workstation)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. QUICK-ACCESS CLINICAL SERVICES GRID                                    */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-8 border-b border-[#1a2233]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Tajaajila Hatattamaa fi Klinikaalaa
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Kutaalee fi Moduulota HMIS
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Doktaroonni, narsiiwwan, ogeessonni laaboratorii, faarmaasiistoonni, fi dhukkubsattoonni kallattiin itti fayyadamuu danda'u
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Emergency & Triage */}
            <Link
              href="/mci"
              className="p-5 rounded-3xl bg-[#101624] border border-[#1a2233] hover:border-rose-500/50 hover:bg-[#141b29] transition-all group"
            >
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 w-fit">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 group-hover:text-rose-300 transition-colors">
                Balaa & Triage (START)
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Sadarkaalee Triage (Diimaa, Keelloo, Magariisa, Gurraacha) fi balaa tasaa to'achuu.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-rose-400">
                <span>Ilaali</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 2: Smart Queue OPD */}
            <Link
              href="/queue"
              className="p-5 rounded-3xl bg-[#101624] border border-[#1a2233] hover:border-amber-500/50 hover:bg-[#141b29] transition-all group"
            >
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit">
                <Ticket className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 group-hover:text-amber-300 transition-colors">
                To'annoo Dabaree (Queue)
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tikeettii dabaree OPD, TV Display waamicha sagalee Afaan Oromootiin qindeessuu.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-400">
                <span>Ilaali</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 3: Laboratory LIS */}
            <Link
              href="/laboratory"
              className="p-5 rounded-3xl bg-[#101624] border border-[#1a2233] hover:border-cyan-500/50 hover:bg-[#141b29] transition-all group"
            >
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 w-fit">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 group-hover:text-cyan-300 transition-colors">
                Laabooratorii & Dhiiga (LIS)
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Qorannoo dhiigaa, dhiiga wal-simsiisuu (Crossmatch), fi akeekkachiisa balaa hatattamaa.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-400">
                <span>Ilaali</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 4: PACS Radiology */}
            <Link
              href="/pacs"
              className="p-5 rounded-3xl bg-[#101624] border border-[#1a2233] hover:border-teal-500/50 hover:bg-[#141b29] transition-all group"
            >
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 w-fit">
                <Scan className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 group-hover:text-teal-300 transition-colors">
                Raajii & DICOM (PACS)
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Suuraa DICOM sakatta'uu, safartuu Caliper, Preset WW/WL, fi gabaasa doktooraa.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-400">
                <span>Ilaali</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 5: Inpatient Wards (IPD) */}
            <Link
              href="/wards"
              className="p-5 rounded-3xl bg-[#101624] border border-[#1a2233] hover:border-emerald-500/50 hover:bg-[#141b29] transition-all group"
            >
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-fit">
                <Bed className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 group-hover:text-emerald-300 transition-colors">
                Kutaa Ciisichaa (IPD)
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Kaartaa siree (Bed Matrix), galmee ciisichaa, dabarsa siree, fi baasii dhukkubsataa.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <span>Ilaali</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 6: Pharmacy & FEFO */}
            <Link
              href="/pharmacy"
              className="p-5 rounded-3xl bg-[#101624] border border-[#1a2233] hover:border-blue-500/50 hover:bg-[#141b29] transition-all group"
            >
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 w-fit">
                <Pill className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 group-hover:text-blue-300 transition-colors">
                Faarmaasii & Qoricha
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Ajaja qorichaa dhiyeessuu, kuusaa FEFO to'achuu, fi akeekkachiisa wal-nyaatinsa qorichaa.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-400">
                <span>Ilaali</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 7: Billing & CBHI */}
            <Link
              href="/billing"
              className="p-5 rounded-3xl bg-[#101624] border border-[#1a2233] hover:border-amber-500/50 hover:bg-[#141b29] transition-all group"
            >
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 group-hover:text-amber-300 transition-colors">
                Kaffaltii & CBHI
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Nagahee elektirooniksii, kaffaltii Telebirr, fi inshuraansii fayyaa hawaasaa (CBHI).
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-400">
                <span>Ilaali</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* Card 8: Patient Self-Service Portal */}
            <Link
              href="/patient-portal"
              className="p-5 rounded-3xl bg-[#101624] border border-[#1a2233] hover:border-teal-500/50 hover:bg-[#141b29] transition-all group"
            >
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 w-fit">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mt-4 group-hover:text-teal-300 transition-colors">
                Poortaalii Dhukkubsataa
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Bu'aa qorannoo laaboratorii, ajaja qorichaa, fi lakkoofsa dabaree mobaayilaan hordofuu.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-400">
                <span>Ilaali</span> <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PATIENT PORTAL CTA BANNER                                              */}
      {/* ========================================================================= */}
      <section className="py-10 px-4 sm:px-8 bg-gradient-to-r from-amber-500/10 via-[#101624] to-teal-500/10 border-b border-[#1a2233]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl border border-amber-500/30 bg-[#101624] shadow-2xl relative overflow-hidden">
          <div className="max-w-xl">
            <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
              Tajaajila Dhukkubsataa Mobaayilaa (Patient Self-Service)
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Bu'aa Qorannoo fi Tikeettii Dabaree Keessan Mobaayilaan Hordofaa
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Koodii Fayda NID, MRN, ykn lakk. bilbilaa keessaniin galmaa'uun bu'aa qorannoo laabooratorii, qoricha
              ajajame, fi kaffaltii Telebirr salphaatti raawwadhaa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/login?tab=patient"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <UserCheck className="w-4 h-4" />
              <span>Poortaalii Dhukkubsataatti Seeni</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold bg-[#1a2233] hover:bg-[#253047] text-slate-200 border border-[#2b374e] transition-all"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Seensa Hojjattootaa (Staff)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#1a2233] bg-[#090d14] py-10 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>Mettu Karl Specialized Hospital</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Hospitaala Waliigalaa Ispeeshaalaayizdii Karl Mattuu • Level 4 Licensed Tertiary Referral & Teaching Hospital.
            </p>
            <p className="text-[10px] font-mono text-slate-500">TIN: 0038912401 • MOH HMIS Accredited</p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Kutaalee Ijoo</h5>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/wards" className="hover:text-amber-400 transition-colors">
                  Kutaa Ciisichaa & Sireewwanii (IPD)
                </Link>
              </li>
              <li>
                <Link href="/pacs" className="hover:text-amber-400 transition-colors">
                  Qorannoo Raajii & DICOM (PACS)
                </Link>
              </li>
              <li>
                <Link href="/laboratory" className="hover:text-amber-400 transition-colors">
                  Laabooratorii & Dhiigaa (LIS)
                </Link>
              </li>
              <li>
                <Link href="/pharmacy" className="hover:text-amber-400 transition-colors">
                  Faarmaasii & To'annoo Qorichaa
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Nageenya & Qajeelfama</h5>
            <ul className="space-y-2 text-[11px]">
              <li>
                <span className="flex items-center gap-1 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Eegumsa Deetaa Dhukkubsataa (Privacy)
                </span>
              </li>
              <li>
                <span className="flex items-center gap-1 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Role-Based Access Control (RBAC)
                </span>
              </li>
              <li>
                <span className="flex items-center gap-1 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> 100% Offline Local LAN Edge Resilient
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Teessoo & Quunnamtii</h5>
            <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Mattuu, Godina Iluu Abbaa Booraa, Oromiyaa
            </p>
            <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> +251 47 441 2345 / +251 47 441 2688
            </p>
            <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5 mt-2 font-mono">
              <PhoneCall className="w-3.5 h-3.5 shrink-0" /> Balaa Hatattamaa: 907
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#1a2233] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
          <p>© {new Date().getFullYear()} Mettu Karl Comprehensive Specialized Hospital HMIS. Mirgi qabiyyee seeraan eegamaadha.</p>
          <div className="flex items-center gap-4 font-mono">
            <span>Next.js 14 • FastAPI • PostgreSQL / SQLite</span>
            <span>FHIR R4 • ICD-10 • LOINC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
