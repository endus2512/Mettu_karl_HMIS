/**
 * FHIR R4 Patient Management Workstation.
 * Implements HL7 FHIR R4 Patient standard specifications, national Fayda ID linkage,
 * biometric verification, and clinical registry management.
 *
 * Enhanced with responsive rectangular spotlight cursor hover effects across all cards,
 * search controls, action buttons, and table rows.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPatientForFHIR, setSelectedPatientForFHIR] = useState<PatientRecord | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header & Badges (Responsive Rectangular Hover Spotlight) */}
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm text-2xl group-hover:scale-105 group-hover:bg-teal-700 transition-all">
                  👥
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('patients')} • FHIR R4 Master Patient Index
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    HL7 FHIR Release 4 Standardized Medical Records • National Fayda Biometric Linkage • Barcode MPI
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                FHIR R4 Server: Online
              </span>
              {!isAdmin ? (
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <span>➕</span> Galmee Haaraa (Register Patient)
                </button>
              ) : (
                <Link
                  href="/analytics"
                  className="flex items-center gap-2 rounded-2xl bg-teal-700 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-teal-800 transition-all cursor-pointer"
                >
                  <span>📈</span> Executive BI Analytics →
                </Link>
              )}
            </div>
          </div>

          {/* ADMIN CLINICAL PRIVACY / CONFIDENTIALITY BANNER */}
          {isAdmin && (
            <div className="rounded-3xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400 text-2xl">
                  🔒
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-100 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-900">
                    Nageenya Odeeffannoo & Iccitii Yaalaa (Clinical Data Confidentiality)
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Iccitiin Yaalaa fi Ragaan Kiliinikaa Dhukkubsattootaa Dhorkameera
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                    Imaammata eegumsa iccitii dhukkubsattootaa fi seera MoH tti, ragaan yaalaa (Allergies, qorannoo, qoricha, fi teessoon qabatamaa) ogeessota yaalaa (Doctor / Nurse) qofaaf ifa ta'a. Gaheen Bulchiinsaa (Admin) lakkoofsa boroo fi raawwii waliigalaa qofa ilaaluuf heeyyama qaba.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/analytics"
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-black text-white shadow-xs hover:bg-teal-800 transition-all cursor-pointer"
                    >
                      <span>📈</span> Gara Executive BI Analytics tti Deemaa →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats 4 Cards (with Universal Rectangular Spotlight Hover) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-800 transition-colors">
                  Total Registered
                </p>
                <span className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-white group-hover:text-teal-700 group-hover:ring-1 group-hover:ring-teal-400/40 transition-all text-sm">
                  👥
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">
                14,892
              </p>
              <p className="mt-1 text-xs text-teal-600 font-bold group-hover:text-teal-800">
                ↑ 38 new registered today
              </p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-800 transition-colors">
                  Active Inpatients
                </p>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-white group-hover:text-blue-700 group-hover:ring-1 group-hover:ring-blue-400/40 transition-all text-sm">
                  🛏️
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-blue-600 group-hover:text-blue-950 transition-colors">
                340
              </p>
              <p className="mt-1 text-xs text-slate-500 font-semibold group-hover:text-blue-800">
                85% Bed Occupancy (BOR)
              </p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-rose-800 transition-colors">
                  Emergency & Triage
                </p>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-white group-hover:text-rose-700 group-hover:ring-1 group-hover:ring-rose-400/40 transition-all text-sm">
                  🚨
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-rose-600 group-hover:text-rose-950 transition-colors">
                24
              </p>
              <p className="mt-1 text-xs text-rose-600 font-bold group-hover:text-rose-700">
                3 Immediate (Red Resuscitation)
              </p>
            </div>

            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-800 transition-colors">
                  Fayda FIN Verified
                </p>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-white group-hover:text-emerald-700 group-hover:ring-1 group-hover:ring-emerald-400/40 transition-all text-sm">
                  🆔
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">
                92.4%
              </p>
              <p className="mt-1 text-xs text-slate-500 font-semibold group-hover:text-emerald-800">
                Zero duplicate MRNs
              </p>
            </div>
          </div>

          {/* Search Bar on LEFT + Filters + View Switcher */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Bar on LEFT and Filters directly next to it */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
              {/* COMPACT & SHORTENED SEARCH BAR (Gara Bitaatti / Left Side Position) */}
              <div className="relative w-full sm:w-80 md:w-96 shrink-0">
                <div className="flex h-12 items-center rounded-2xl border-[3px] border-teal-600 bg-white px-4 shadow-sm hover:border-teal-700 focus-within:border-teal-700 focus-within:ring-4 focus-within:ring-teal-400/30 transition-all duration-150">
                  <span className="text-base text-teal-800 mr-2.5 shrink-0">🔍</span>
                  <input
                    type="text"
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base font-extrabold text-slate-950 placeholder-slate-400 focus:outline-none tracking-wide"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="ml-1 text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                  <span className="ml-2 rounded-xl bg-teal-100/90 border-2 border-teal-300 px-2.5 py-0.5 text-xs font-black text-teal-900 shrink-0">
                    {filteredPatients.length}
                  </span>
                </div>
              </div>

              {/* Gender and Admission Status Filters */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="rounded-2xl border-2 border-slate-200/90 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 transition-all cursor-pointer focus:outline-none"
                >
                  <option value="all">Koorniyaa: Hunda (Gender: All)</option>
                  <option value="male">Dhiira (Male)</option>
                  <option value="female">Dhalaa (Female)</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-2xl border-2 border-slate-200/90 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 transition-all cursor-pointer focus:outline-none"
                >
                  <option value="all">Haala Yaalaa: Hunda (All Statuses)</option>
                  <option value="Inpatient">Ciisanii Jiran (Inpatient)</option>
                  <option value="Outpatient">Deddeebi'anii Yaalaman (Outpatient)</option>
                  <option value="Emergency">Kutaa Hatattamaa (Emergency)</option>
                </select>
              </div>
            </div>

            {/* View Switcher: Table vs Cards */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-200/70 p-1 text-xs font-bold text-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-teal-700 text-white shadow-xs font-black ring-2 ring-teal-400/40'
                    : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                }`}
              >
                <span>📋</span> Gabatee (Table)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-teal-700 text-white shadow-xs font-black ring-2 ring-teal-400/40'
                    : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                }`}
              >
                <span>🗂️</span> Kaardii (Cards)
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: INTERACTIVE TABLE (Floating Card-Rows with Rectangular Responsive Spotlight) */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-separate border-spacing-y-2.5">
                <thead>
                  <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2">MRN & FHIR ID</th>
                    <th className="px-5 py-2">Dhukkubsataa (Patient Name)</th>
                    <th className="px-5 py-2">Umurii / Saala</th>
                    <th className="px-5 py-2">Fayda National ID</th>
                    <th className="px-5 py-2">Dhiiga / Allergy</th>
                    <th className="px-5 py-2">Iddoo (Ward/Bed)</th>
                    <th className="px-5 py-2">Haala (Status)</th>
                    <th className="px-5 py-2 text-right">Tarkaanfii (Actions)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr
                      key={p.id}
                      className="group transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-lg"
                    >
                      <td className="px-5 py-4 bg-white rounded-l-2xl border-y-2 border-l-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span className="font-mono font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 group-hover:bg-white group-hover:border-teal-400 transition-colors">
                          {p.mrn}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-400 mt-1">{p.fhirId}</span>
                      </td>

                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <p className="font-black text-slate-900 group-hover:text-teal-950 transition-colors text-sm">
                          {isAdmin ? `${p.name.split(' ')[0]} ${p.name.split(' ')[1]?.[0] || ''}. [🔒 Iccitiin Eegame]` : p.name}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 group-hover:text-teal-800 transition-colors">
                          {isAdmin ? 'Odeeffannoo Kiliinikaa Dhorkame' : p.localName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {isAdmin ? '+251 9** *** ***' : p.phone}
                        </p>
                      </td>

                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span className="font-black text-slate-800">{p.age} yrs</span>
                        <span className="ml-1 text-slate-500 capitalize">({p.gender})</span>
                        <span className="block text-[10px] text-slate-400">{p.birthDate}</span>
                      </td>

                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 group-hover:bg-white transition-colors">
                          <span>✓</span> {isAdmin ? `FAN-****-****-${p.faydaId.slice(-4)}` : p.faydaId}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">{p.woreda}</span>
                      </td>

                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span className="rounded-lg bg-rose-50 px-2 py-0.5 font-black text-rose-700 border border-rose-200">
                          {p.bloodGroup}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {isAdmin ? (
                            <span className="rounded text-[10px] px-1.5 py-0.5 font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              🔒 Iccitii Yaalaa (Clinician Only)
                            </span>
                          ) : (
                            p.allergies.map((allergy, i) => (
                              <span
                                key={i}
                                className={`rounded text-[10px] px-1.5 py-0.5 font-bold ${
                                  allergy === 'None known'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {allergy}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <p className="font-bold text-slate-800">
                          {isAdmin ? 'Kutaa Ciisichaa (Protected)' : p.wardBed || 'Outpatient Clinic'}
                        </p>
                        <p className="text-[10px] text-slate-400">Reg: {p.registeredAt}</p>
                      </td>

                      <td className="px-5 py-4 bg-white border-y-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black ${
                            p.status === 'Inpatient'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : p.status === 'Emergency'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 bg-white rounded-r-2xl border-y-2 border-r-2 border-slate-200/90 group-hover:border-teal-500 group-hover:bg-teal-50/70 transition-all text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPatientForFHIR(p)}
                          className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                        >
                          FHIR JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold bg-white rounded-2xl border-2 border-slate-200">
                        Dhukkubsataan barbaaddan hin argamne. (No matching patient records found).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW MODE 2: CLINICAL PATIENT CARDS (Matching Dashboard Rectangular Spotlight) */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredPatients.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col justify-between rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-xl transition-all duration-200 ease-in-out cursor-pointer transform hover:-translate-y-1"
                >
                  <div>
                    {/* Top Patient Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 font-black text-lg group-hover:scale-105 group-hover:bg-white group-hover:border-teal-400 transition-all">
                          {p.gender === 'male' ? '👨' : '👩'}
                        </span>
                        <div>
                          <h3 className="text-base font-black text-slate-900 group-hover:text-teal-950 transition-colors leading-tight">
                            {p.name}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 group-hover:text-teal-800 transition-colors">
                            {p.localName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black shrink-0 ${
                          p.status === 'Inpatient'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : p.status === 'Emergency'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    {/* MRN & Fayda Pills with individual rectangular hover */}
                    <div className="grid grid-cols-2 gap-2 my-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 group-hover:bg-white group-hover:border-teal-300 transition-all">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">MRN Index</span>
                        <span className="font-mono text-xs font-black text-teal-800">{p.mrn}</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 group-hover:bg-white group-hover:border-emerald-300 transition-all">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Fayda National ID</span>
                        <span className="font-mono text-xs font-bold text-emerald-800 truncate block">✓ {p.faydaId}</span>
                      </div>
                    </div>

                    {/* Clinical Demographics */}
                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 group-hover:border-teal-200/60 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Age / Gender:</span>
                        <span className="font-bold text-slate-800">{p.age} yrs • {p.gender.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Location / Ward:</span>
                        <span className="font-bold text-slate-800 truncate ml-2">{p.wardBed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Blood / Allergies:</span>
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          {p.bloodGroup} • {p.allergies.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 group-hover:border-teal-200/60 pt-3 transition-colors">
                    <span className="text-[11px] text-slate-400 font-mono">Reg: {p.registeredAt}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientForFHIR(p)}
                      className="rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all shadow-xs cursor-pointer"
                    >
                      HL7 FHIR JSON →
                    </button>
                  </div>
                </div>
              ))}

              {filteredPatients.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm font-semibold text-slate-400 bg-white rounded-3xl border border-slate-200">
                  Dhukkubsataan barbaaddan hin argamne. (No matching patient records found).
                </div>
              )}
            </div>
          )}

          {/* FHIR R4 JSON Viewer Modal */}
          {selectedPatientForFHIR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl border-2 border-teal-500">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🩺</span>
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        HL7 FHIR R4 Patient Resource
                      </h2>
                      <p className="text-xs text-slate-500 font-mono">
                        {selectedPatientForFHIR.mrn} • {selectedPatientForFHIR.fhirId}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForFHIR(null)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <pre className="rounded-2xl bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                    {JSON.stringify(generateFHIRResource(selectedPatientForFHIR), null, 2)}
                  </pre>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-slate-50 rounded-b-3xl">
                  <span className="text-xs text-slate-500">
                    Compliant with HL7 FHIR Release 4 & Ethiopian eHealth Standards
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPatientForFHIR(null)}
                    className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-900 cursor-pointer"
                  >
                    Cufi (Close)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Register Patient Modal */}
          {isRegisterOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl border-2 border-teal-500">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Galmee Dhukkubsataa Haaraa (Register New Patient)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Creates official MRN, binds Fayda National ID, and instantiates FHIR R4 resource.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        First Name (Maqaa) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="e.g. Tolera"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Last / Grandfather Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="e.g. Gemechu"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Local Name (Afaan Oromoo / Amharic)
                    </label>
                    <input
                      type="text"
                      value={formData.localName}
                      onChange={(e) => setFormData({ ...formData, localName: e.target.value })}
                      placeholder="e.g. Toleeraa Gammachuu (ቶሌራ ገመቹ)"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Saala (Gender)
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })
                        }
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      >
                        <option value="male">Dhiira (Male)</option>
                        <option value="female">Dhalaa (Female)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Guyyaa Dhalootaa (DOB)
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Gosa Dhiigaa (Blood Group)
                      </label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Lakkoofsa Bilbilaa (Phone)
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Fayda National ID (FIN)
                      </label>
                      <input
                        type="text"
                        value={formData.faydaId}
                        onChange={(e) => setFormData({ ...formData, faydaId: e.target.value })}
                        placeholder="e.g. FAN-9901-2384-5120"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Woreda / Iddoo Jireenyaa
                      </label>
                      <input
                        type="text"
                        value={formData.woreda}
                        onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Haala Tajaajilaa (Admission Status)
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as PatientRecord['status'],
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                      >
                        <option value="Outpatient">Outpatient (Deddeebi'ee)</option>
                        <option value="Inpatient">Inpatient (Ciisee)</option>
                        <option value="Emergency">Emergency (Hatattama)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Allergies (Qorichaa fi Nyaata Wal-hin-simalle)
                    </label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="e.g. Penicillin, Aspirin (or None known)"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsRegisterOpen(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Haqi (Cancel)
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-md cursor-pointer"
                    >
                      Galmeessi (Save & Create FHIR Record)
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
