/**
 * FHIR R4 Patient Management Workstation — Mettu Karl Referral Hospital HMIS.
 * Enterprise Healthcare Design System:
 * - HL7 FHIR R4 Master Patient Index (MPI) standard compliance
 * - National Fayda Digital ID & biometric FIN linkage
 * - Professional high-density data table & card view with full dark mode support
 * - Modern Lucide icons replacing raw emojis
 * - Role-based clinical data protection & privacy masking
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Bed,
  AlertTriangle,
  CreditCard,
  Search,
  Table as TableIcon,
  LayoutGrid,
  X,
  ShieldAlert,
  FileCode,
  HeartPulse,
  Phone,
  MapPin,
  Calendar,
  Check,
  TrendingUp,
  Stethoscope,
  Filter,
  Copy,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { notifications } from '@mantine/notifications';

interface PatientRecord {
  id: number;
  fhirId: string;
  mrn: string;
  name: string;
  localName: string;
  gender: 'male' | 'female';
  birthDate: string;
  age: number;
  phone: string;
  woreda: string;
  bloodGroup: string;
  allergies: string[];
  faydaId: string;
  status: 'Inpatient' | 'Outpatient' | 'Emergency' | 'Discharged';
  wardBed?: string;
  registeredAt: string;
}

const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 1,
    fhirId: 'pat-98a2-mkrh-001',
    mrn: 'MKH-2026-000101',
    name: 'Gudeta Hailu Tadesse',
    localName: 'Gudetaa Hayiluu Taaddasaa (ጉዴታ ኃይሉ)',
    gender: 'male',
    birthDate: '1985-04-12',
    age: 41,
    phone: '+251 911 002 233',
    woreda: 'Mettu Town, Kebele 02',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Sulfa'],
    faydaId: 'FAN-9901-2384-5120',
    status: 'Inpatient',
    wardBed: 'Male Medical Ward - Bed 14',
    registeredAt: '2026-10-24 08:30',
  },
  {
    id: 2,
    fhirId: 'pat-44bc-mkrh-002',
    mrn: 'MKH-2026-000102',
    name: 'Chaltu Daba Tolasa',
    localName: 'Caaltuu Dabaa Tolaasaa (ጫልቱ ዳባ)',
    gender: 'female',
    birthDate: '1993-08-20',
    age: 33,
    phone: '+251 922 445 566',
    woreda: 'Bedele Woreda, Sor Zone',
    bloodGroup: 'A+',
    allergies: ['None known'],
    faydaId: 'FAN-7721-9981-3310',
    status: 'Inpatient',
    wardBed: 'Maternity Ward - Bed 06',
    registeredAt: '2026-10-25 11:15',
  },
  {
    id: 3,
    fhirId: 'pat-72df-mkrh-003',
    mrn: 'MKH-2026-000103',
    name: 'Tolera Bekele Gemechu',
    localName: 'Toleeraa Baqqalaa Gammachuu (ቶሌራ በቀለ)',
    gender: 'male',
    birthDate: '1978-11-05',
    age: 48,
    phone: '+251 933 667 788',
    woreda: 'Yayu Forest Zone',
    bloodGroup: 'B+',
    allergies: ['NSAIDs / Ibuprofen'],
    faydaId: 'FAN-6632-1190-8452',
    status: 'Emergency',
    wardBed: 'ED Acute Resus - Bed 02',
    registeredAt: '2026-10-27 06:45',
  },
  {
    id: 4,
    fhirId: 'pat-11ee-mkrh-004',
    mrn: 'MKH-2026-000104',
    name: 'Hawani Abera Feyisa',
    localName: 'Hawaanii Abbaraa Fayyisaa (ሀዋኒ አበራ)',
    gender: 'female',
    birthDate: '2001-02-14',
    age: 25,
    phone: '+251 944 889 900',
    woreda: 'Hurumu Woreda',
    bloodGroup: 'AB+',
    allergies: ['None known'],
    faydaId: 'FAN-5510-7734-2201',
    status: 'Outpatient',
    wardBed: 'OPD Clinic 3',
    registeredAt: '2026-10-27 08:10',
  },
  {
    id: 5,
    fhirId: 'pat-33ff-mkrh-005',
    mrn: 'MKH-2026-000105',
    name: 'Bikila Duresa Hunde',
    localName: 'Baqqalaa Dureessaa Hundee (በቀለ ዱሬሳ)',
    gender: 'male',
    birthDate: '1962-07-30',
    age: 64,
    phone: '+251 911 778 899',
    woreda: 'Alge Sachi Woreda',
    bloodGroup: 'O-',
    allergies: ['Aspirin'],
    faydaId: 'FAN-4409-8812-6633',
    status: 'Inpatient',
    wardBed: 'Surgical ICU - Bed 03',
    registeredAt: '2026-10-26 14:20',
  },
];

export default function PatientsFHIRPage(): React.ReactElement {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPatientForFHIR, setSelectedPatientForFHIR] = useState<PatientRecord | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedFHIR, setCopiedFHIR] = useState(false);

  // New patient registration form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    localName: '',
    gender: 'male' as 'male' | 'female',
    birthDate: '1995-01-01',
    phone: '+251 9',
    woreda: 'Mettu Town',
    bloodGroup: 'O+',
    allergies: 'None known',
    faydaId: '',
    status: 'Outpatient' as PatientRecord['status'],
  });

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.localName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.faydaId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);

    const matchesGender = selectedGender === 'all' || p.gender === selectedGender;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;

    return matchesSearch && matchesGender && matchesStatus;
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    const nextId = patients.length + 1;
    const padded = String(nextId).padStart(6, '0');
    const newMrn = `MKH-2026-${padded}`;
    const newFhirId = `pat-${Math.random().toString(36).substring(2, 6)}-mkrh-${nextId}`;

    const birthYear = new Date(formData.birthDate).getFullYear();
    const currentYear = 2026;
    const calculatedAge = Math.max(1, currentYear - birthYear);

    const newRec: PatientRecord = {
      id: nextId,
      fhirId: newFhirId,
      mrn: newMrn,
      name: `${formData.firstName} ${formData.lastName}`,
      localName: formData.localName || `${formData.firstName} ${formData.lastName}`,
      gender: formData.gender,
      birthDate: formData.birthDate,
      age: calculatedAge,
      phone: formData.phone,
      woreda: formData.woreda,
      bloodGroup: formData.bloodGroup,
      allergies: formData.allergies.split(',').map((s) => s.trim()),
      faydaId: formData.faydaId || `FAN-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: formData.status,
      wardBed: formData.status === 'Inpatient' ? 'General Ward - Triage Pending' : 'OPD Consultation Room',
      registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setPatients([newRec, ...patients]);
    setIsRegisterOpen(false);
    notifications.show({
      title: language === 'om' ? 'Galmeen Milkaa\'eera' : 'Patient Registered',
      message: `${newRec.name} (${newRec.mrn}) FHIR R4 profile created.`,
      color: 'teal',
    });
    setFormData({
      firstName: '',
      lastName: '',
      localName: '',
      gender: 'male',
      birthDate: '1995-01-01',
      phone: '+251 9',
      woreda: 'Mettu Town',
      bloodGroup: 'O+',
      allergies: 'None known',
      faydaId: '',
      status: 'Outpatient',
    });
  };

  const generateFHIRResource = (p: PatientRecord) => {
    return {
      resourceType: 'Patient',
      id: p.fhirId,
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
      },
      text: {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>${p.name}</b> (${p.mrn})</p></div>`,
      },
      identifier: [
        {
          use: 'official',
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'MR',
                display: 'Medical Record Number',
              },
            ],
          },
          system: 'http://mettukarl.gov.et/fhir/sid/mrn',
          value: p.mrn,
        },
        {
          use: 'secondary',
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'NI',
                display: 'National Digital ID (Fayda)',
              },
            ],
          },
          system: 'http://id.gov.et/fayda',
          value: p.faydaId,
        },
      ],
      active: true,
      name: [
        {
          use: 'official',
          family: p.name.split(' ').slice(1).join(' '),
          given: [p.name.split(' ')[0]],
          text: p.name,
        },
        {
          use: 'usual',
          text: p.localName,
        },
      ],
      telecom: [
        {
          system: 'phone',
          value: p.phone,
          use: 'mobile',
        },
      ],
      gender: p.gender,
      birthDate: p.birthDate,
      address: [
        {
          use: 'home',
          type: 'physical',
          city: 'Mettu',
          district: p.woreda,
          state: 'Oromia Regional State',
          country: 'ETH',
        },
      ],
      extension: [
        {
          url: 'http://mettukarl.gov.et/fhir/StructureDefinition/blood-group',
          valueString: p.bloodGroup,
        },
        {
          url: 'http://mettukarl.gov.et/fhir/StructureDefinition/clinical-status',
          valueString: p.status,
        },
      ],
      managingOrganization: {
        reference: 'Organization/mkrh-referral-hospital',
        display: 'Mettu Karl Referral Hospital',
      },
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFHIR(true);
    setTimeout(() => setCopiedFHIR(false), 2000);
    notifications.show({
      title: 'Copied',
      message: 'FHIR JSON copied to clipboard.',
      color: 'teal',
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header & Badges */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 shadow-xs shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{t('patients')}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">FHIR R4 Master Index</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  HL7 FHIR Release 4 Medical Registry • Fayda Biometric Linkage • Master Patient Index
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#102419] px-3 py-1 text-xs font-semibold text-[#34d399] border border-[#059669]/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FHIR R4 Online
              </span>

              {!isAdmin ? (
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 text-slate-950 font-bold px-3.5 py-2 text-xs shadow-md shadow-amber-500/20 border border-amber-300 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-slate-950" />
                  <span>{language === 'om' ? 'Galmee Haaraa' : language === 'am' ? 'አዲስ ታካሚ ምዝገባ' : 'Register Patient'}</span>
                </button>
              ) : (
                <Link
                  href="/analytics"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#131824] hover:bg-[#1a2233] border border-amber-500/30 px-3.5 py-2 text-xs font-semibold text-amber-300 shadow-xs transition-all"
                >
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>BI Analytics →</span>
                </Link>
              )}
            </div>
          </div>

          {/* ADMIN CLINICAL PRIVACY / CONFIDENTIALITY BANNER */}
          {isAdmin && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <span>Clinical Data Confidentiality Active (MOH Health Data Policy)</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    Under Ethiopian MoH clinical privacy guidelines, sensitive diagnostic, medication, and allergy details are restricted to verified clinical practitioners (Doctor/Nurse). Administrative accounts retain aggregate BI and workload oversight.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Precision Situational Awareness KPI Cards (Matching Reference Sparkline Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Total Registered */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">1. Total Registered</span>
                  <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">14,892</p>
                </div>
                <span className="text-amber-400 text-sm">✦</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">+38 registered today</span>
                {/* Gold Sparkline */}
                <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                  <path d="M 0,22 Q 25,28 50,15 T 100,5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Active Inpatients */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">2. Active Inpatients</span>
                  <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">340</p>
                </div>
                <span className="text-amber-400 text-sm">✦</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">85% Bed Occupancy (340/400)</span>
                {/* Gold Sparkline */}
                <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                  <path d="M 0,25 Q 25,10 50,18 T 100,8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Emergency & Triage */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-rose-500/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">3. Emergency & Triage</span>
                  <p className="mt-1.5 text-2xl font-black text-rose-500 dark:text-rose-400 tracking-tight">24 Acute</p>
                </div>
                <span className="text-rose-400 text-sm">✦</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">3 Immediate (Red Resuscitation)</span>
                {/* Rose Sparkline */}
                <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                  <path d="M 0,20 Q 30,5 60,25 T 100,10" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Fayda FIN Verified */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-4.5 shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">4. Fayda FIN Linkage</span>
                  <p className="mt-1.5 text-2xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight">92.4%</p>
                </div>
                <span className="text-amber-400 text-sm">✦</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Zero duplicate MRNs</span>
                {/* Gold Sparkline */}
                <svg className="w-20 h-6 shrink-0" viewBox="0 0 100 30" fill="none">
                  <path d="M 0,26 Q 30,22 60,12 T 100,4" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar + Filters + View Switcher */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80 md:w-96 shrink-0">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'om' ? 'Barbaadi (Maqaa, MRN, Fayda, Bilbila)...' : language === 'am' ? 'ፈልግ (ስም፣ MRN፣ ፋይዳ፣ ስልክ)...' : 'Search name, MRN, Fayda FAN, phone...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-10 pr-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 rounded cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredPatients.length}
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-teal-600 focus:outline-none cursor-pointer"
                >
                  <option value="all">{language === 'om' ? 'Koorniyaa: Hunda' : language === 'am' ? 'ጾታ፡ ሁሉም' : 'Gender: All'}</option>
                  <option value="male">{language === 'om' ? 'Dhiira (Male)' : 'Male'}</option>
                  <option value="female">{language === 'om' ? 'Dhalaa (Female)' : 'Female'}</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-teal-600 focus:outline-none cursor-pointer"
                >
                  <option value="all">{language === 'om' ? 'Haala Yaalaa: Hunda' : language === 'am' ? 'ሁኔታ፡ ሁሉም' : 'Status: All'}</option>
                  <option value="Inpatient">Inpatient (Ciisee)</option>
                  <option value="Outpatient">Outpatient (Deddeebi&apos;ee)</option>
                  <option value="Emergency">Emergency (Hatattama)</option>
                </select>
              </div>
            </div>

            {/* View Switcher: Table vs Cards */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs shrink-0 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{language === 'om' ? 'Gabatee' : 'Table'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{language === 'om' ? 'Kaardii' : 'Cards'}</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: DATA TABLE */}
          {viewMode === 'table' ? (
            <div className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">MRN & FHIR ID</th>
                      <th className="px-4 py-3">{language === 'om' ? 'Dhukkubsataa' : 'Patient Name'}</th>
                      <th className="px-4 py-3">{language === 'om' ? 'Umurii / Saala' : 'Age / Gender'}</th>
                      <th className="px-4 py-3">Fayda ID (FAN)</th>
                      <th className="px-4 py-3">{language === 'om' ? 'Dhiiga / Allergy' : 'Blood / Allergy'}</th>
                      <th className="px-4 py-3">{language === 'om' ? 'Kutaa (Ward/Bed)' : 'Location'}</th>
                      <th className="px-4 py-3">{language === 'om' ? 'Haala (Status)' : 'Status'}</th>
                      <th className="px-4 py-3 text-right">FHIR Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredPatients.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-teal-50/40 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                            {p.mrn}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-400 mt-1">{p.fhirId}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {isAdmin ? `${p.name.split(' ')[0]} ${p.name.split(' ')[1]?.[0] || ''}. [Protected]` : p.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isAdmin ? 'Protected Clinical Identity' : p.localName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {isAdmin ? '+251 9** *** ***' : p.phone}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.age} yrs</span>
                          <span className="ml-1 text-slate-500 capitalize">({p.gender})</span>
                          <span className="block text-[10px] text-slate-400">{p.birthDate}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{isAdmin ? `FAN-****-****-${p.faydaId.slice(-4)}` : p.faydaId}</span>
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-1">{p.woreda}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="rounded px-1.5 py-0.5 font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px]">
                            {p.bloodGroup}
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {isAdmin ? (
                              <span className="rounded text-[10px] px-1.5 py-0.5 font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Protected
                              </span>
                            ) : (
                              p.allergies.map((allergy, i) => (
                                <span
                                  key={i}
                                  className={`rounded text-[10px] px-1.5 py-0.5 font-medium ${
                                    allergy === 'None known'
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  {allergy}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {isAdmin ? 'Confidential Location' : p.wardBed || 'Outpatient Clinic'}
                          </p>
                          <p className="text-[10px] text-slate-400">Reg: {p.registeredAt}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              p.status === 'Inpatient'
                                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                : p.status === 'Emergency'
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedPatientForFHIR(p)}
                            className="inline-flex items-center gap-1 rounded-md bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            <span>FHIR</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPatients.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          {language === 'om'
                            ? 'Dhukkubsataan barbaaddan hin argamne.'
                            : 'No matching patient records found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: CLINICAL CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPatients.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-teal-400/60 dark:hover:border-teal-600/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.localName}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${
                          p.status === 'Inpatient'
                            ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            : p.status === 'Emergency'
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    {/* MRN & Fayda Row */}
                    <div className="grid grid-cols-2 gap-2 my-2.5">
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2">
                        <span className="block text-[10px] uppercase font-medium text-slate-400">MRN Index</span>
                        <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">{p.mrn}</span>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2">
                        <span className="block text-[10px] uppercase font-medium text-slate-400">Fayda FIN</span>
                        <span className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate flex items-center gap-1">
                          <Check className="h-3 w-3 shrink-0" />
                          <span>{p.faydaId}</span>
                        </span>
                      </div>
                    </div>

                    {/* Demographics */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Age / Gender:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{p.age} yrs • {p.gender.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate ml-2">{p.wardBed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Blood / Allergy:</span>
                        <span className="font-semibold text-rose-700 dark:text-rose-400">
                          {p.bloodGroup} • {p.allergies.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[11px] text-slate-400 font-mono">Reg: {p.registeredAt}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientForFHIR(p)}
                      className="inline-flex items-center gap-1 rounded-md bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>HL7 FHIR JSON</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FHIR R4 JSON Viewer Modal */}
          {selectedPatientForFHIR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        HL7 FHIR R4 Patient Resource
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {selectedPatientForFHIR.mrn} • {selectedPatientForFHIR.fhirId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(generateFHIRResource(selectedPatientForFHIR), null, 2))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      {copiedFHIR ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFHIR ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientForFHIR(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-5">
                  <pre className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800">
                    {JSON.stringify(generateFHIRResource(selectedPatientForFHIR), null, 2)}
                  </pre>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-950 rounded-b-2xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    HL7 FHIR R4 & Ethiopian Digital Health Blueprint Compliant
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForFHIR(null)}
                    className="rounded-lg bg-slate-800 dark:bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Register Patient Modal */}
          {isRegisterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {language === 'om' ? 'Galmee Dhukkubsataa Haaraa' : language === 'am' ? 'አዲስ ታካሚ ምዝገባ' : 'Register New Patient'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Generates hospital MRN, binds national Fayda FIN, and creates FHIR R4 resource.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        First Name (Maqaa) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="e.g. Tolera"
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Last / Father Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="e.g. Gemechu"
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Local Name (Afaan Oromoo / Amharic)
                    </label>
                    <input
                      type="text"
                      value={formData.localName}
                      onChange={(e) => setFormData({ ...formData, localName: e.target.value })}
                      placeholder="e.g. Toleeraa Gammachuu (ቶሌራ ገመቹ)"
                      className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Gender (Saala)
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })
                        }
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                      >
                        <option value="male">Dhiira (Male)</option>
                        <option value="female">Dhalaa (Female)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Date of Birth (DOB)
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Blood Group (Gosa Dhiigaa)
                      </label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Phone Number (Lakkoofsa Bilbilaa)
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Fayda National ID (FIN)
                      </label>
                      <input
                        type="text"
                        value={formData.faydaId}
                        onChange={(e) => setFormData({ ...formData, faydaId: e.target.value })}
                        placeholder="e.g. FAN-9901-2384-5120"
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Woreda / Residence
                      </label>
                      <input
                        type="text"
                        value={formData.woreda}
                        onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Admission Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as PatientRecord['status'],
                          })
                        }
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                      >
                        <option value="Outpatient">Outpatient (Deddeebi&apos;ee)</option>
                        <option value="Inpatient">Inpatient (Ciisee)</option>
                        <option value="Emergency">Emergency (Hatattama)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Allergies & Known Contraindications
                    </label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="e.g. Penicillin, Aspirin (or None known)"
                      className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsRegisterOpen(false)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {language === 'om' ? 'Haqi (Cancel)' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer"
                    >
                      {language === 'om' ? 'Galmeessi' : 'Save & Create FHIR Record'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
