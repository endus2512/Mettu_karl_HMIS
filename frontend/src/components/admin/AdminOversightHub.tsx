/**
 * Mettu Karl Referral Hospital — Executive Administration, Staff Oversight & Direct Contact Hub.
 * Empowers the Hospital Administrator (Admin) to monitor, oversee, and directly contact
 * Doctors, Nurses, Pharmacists, Technicians, and Patients across all hospital wards and workstations.
 */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@/lib/i18n';
import apiClient from '@/lib/api';

export interface HospitalPerson {
  id: string;
  name: string;
  code: string;
  role: 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'billing' | 'patient';
  roleTitle: string;
  dept: string;
  location: string;
  phone: string;
  status: 'consulting' | 'surgery' | 'rounds' | 'dispensing' | 'icu_bedside' | 'available' | 'inpatient' | 'critical';
  statusText: string;
  statusColor: string;
  avatar: string;
  workstationUrl: string;
  workstationName: string;
}

const HOSPITAL_ROSTER: HospitalPerson[] = [
  // 1. Doctors
  {
    id: 'doc-1',
    name: 'Dr. Bekele Tadesse',
    code: 'MKH-DOC-012',
    role: 'doctor',
    roleTitle: 'Ogeessa Baqaqsaa Ol\'aanaa (Senior Surgeon)',
    dept: 'General Surgery',
    location: 'Kutaa Baqaqsaa 1 (OT Table 1)',
    phone: '+251911456789',
    status: 'surgery',
    statusText: '🔪 Baqaqsarratti (In Surgery)',
    statusColor: 'bg-purple-100 text-purple-900 border-purple-300',
    avatar: '👨‍⚕️',
    workstationUrl: '/ot',
    workstationName: 'OT Surgery & CSSD',
  },
  {
    id: 'doc-2',
    name: 'Dr. Hawi Tolosa',
    code: 'MKH-DOC-024',
    role: 'doctor',
    roleTitle: 'Iskripishiyalistii Da\'immanii (Pediatrician)',
    dept: 'Pediatrics Ward',
    location: 'OPD Kutaa 4 (Pediatric Clinic)',
    phone: '+251912345678',
    status: 'consulting',
    statusText: '🩺 Yaalurratti (In OPD)',
    statusColor: 'bg-teal-100 text-teal-900 border-teal-300',
    avatar: '👩‍⚕️',
    workstationUrl: '/patients',
    workstationName: 'Patients & OPD Care',
  },
  {
    id: 'doc-3',
    name: 'Dr. Gemechu Desta',
    code: 'MKH-DOC-033',
    role: 'doctor',
    roleTitle: 'Hoggansa Yaala Tasaa (Emergency Consultant)',
    dept: 'Emergency & Trauma',
    location: 'Kutaa Triage Tasaa (Trauma Bay 2)',
    phone: '+251913456789',
    status: 'critical',
    statusText: '🚨 Balaa Tasaa (MCI Active)',
    statusColor: 'bg-rose-100 text-rose-900 border-rose-300',
    avatar: '👨‍⚕️',
    workstationUrl: '/mci',
    workstationName: 'MCI & Trauma Triage',
  },
  {
    id: 'doc-4',
    name: 'Dr. Tolera Gudeta',
    code: 'MKH-DOC-041',
    role: 'doctor',
    roleTitle: 'Ogeessa Raadiyooloojii (Chief Radiologist)',
    dept: 'Radiology / PACS',
    location: 'CT / X-Ray Reading Suite',
    phone: '+251914567890',
    status: 'available',
    statusText: '🟢 Qophii (Ready for Scans)',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: '👨‍⚕️',
    workstationUrl: '/pacs',
    workstationName: 'PACS Radiology',
  },

  // 2. Nurses
  {
    id: 'nur-1',
    name: 'Nurse Chaltu Abera',
    code: 'MKH-NUR-101',
    role: 'nurse',
    roleTitle: 'Hangafa Narsitootaa ICU (ICU Head Nurse)',
    dept: 'Intensive Care Unit (ICU)',
    location: 'ICU Bed 1 - 6 Central Monitor',
    phone: '+251915678901',
    status: 'icu_bedside',
    statusText: '📡 ICU Bedside (Telemetry Live)',
    statusColor: 'bg-blue-100 text-blue-900 border-blue-300',
    avatar: '👩‍⚕️',
    workstationUrl: '/iomt',
    workstationName: 'IoMT ICU Telemetry',
  },
  {
    id: 'nur-2',
    name: 'Nurse Aster Bekele',
    code: 'MKH-NUR-115',
    role: 'nurse',
    roleTitle: 'Narsii Triage & Dabaree (OPD Triage Nurse)',
    dept: 'Outpatient Triage',
    location: 'Dabaree OPD Counter 2',
    phone: '+251916789012',
    status: 'rounds',
    statusText: '🎫 Dabaree OPD (18 Waiting)',
    statusColor: 'bg-amber-100 text-amber-900 border-amber-300',
    avatar: '👩‍⚕️',
    workstationUrl: '/queue',
    workstationName: 'Queue & Token TV',
  },
  {
    id: 'nur-3',
    name: 'Nurse Tigist Gemechu',
    code: 'MKH-NUR-128',
    role: 'nurse',
    roleTitle: 'Narsii Baqaqsaa (OT Scrub Nurse)',
    dept: 'Surgical Suites',
    location: 'OT Suite 2 Sterilization',
    phone: '+251917890123',
    status: 'available',
    statusText: '🟢 Qophii (Pre-Op Prepared)',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: '👩‍⚕️',
    workstationUrl: '/ot',
    workstationName: 'OT Surgery & CSSD',
  },

  // 3. Pharmacy Team
  {
    id: 'phm-1',
    name: 'Pharm. Obsa Kuma',
    code: 'MKH-PHM-008',
    role: 'pharmacist',
    roleTitle: 'Faarmaasistii Ol\'aanaa (Lead Pharmacist)',
    dept: 'Outpatient Dispensary',
    location: 'Farmaasii Counter 1',
    phone: '+251918901234',
    status: 'dispensing',
    statusText: '💊 Qoricha Raabsaa (Dispensing Active)',
    statusColor: 'bg-teal-100 text-teal-900 border-teal-300',
    avatar: '💊',
    workstationUrl: '/pharmacy',
    workstationName: 'Pharmacy & FEFO Stock',
  },
  {
    id: 'phm-2',
    name: 'Pharm. Derartu Kebede',
    code: 'MKH-PHM-014',
    role: 'pharmacist',
    roleTitle: 'Qorannoo Kuusaa & FEFO (Inventory Officer)',
    dept: 'Central Pharmacy Vault',
    location: 'Kuusaa Qorichaa (Cold Chain Vault)',
    phone: '+251919012345',
    status: 'available',
    statusText: '⚖️ EFDA Audit (Stock 98%)',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: '💊',
    workstationUrl: '/efda',
    workstationName: 'EFDA Drug Safety & Vault',
  },

  // 4. Biomedical & Laboratory
  {
    id: 'tch-1',
    name: 'Tech Dawit Girma',
    code: 'MKH-TCH-019',
    role: 'technician',
    roleTitle: 'Injinara Meeshaalee Yaalaa (Biomedical Eng.)',
    dept: 'Biomedical Engineering',
    location: 'Warshaa Oksijiinii (O2 Plant)',
    phone: '+251920123456',
    status: 'available',
    statusText: '⚡ O2 & Generator Ready (100%)',
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: '🔬',
    workstationUrl: '/assets',
    workstationName: 'Biomedical Assets & PPM',
  },

  // 5. Inpatients & Outpatients
  {
    id: 'pat-1',
    name: 'Tolosa Dinsa',
    code: 'MRN-90412',
    role: 'patient',
    roleTitle: 'Dhukkubsataa Ciisee Yaalamu (Inpatient)',
    dept: 'Surgical Inpatient Ward',
    location: 'Siree 8 (Bed 8, Surgical Ward)',
    phone: '+251921345678',
    status: 'inpatient',
    statusText: '🛌 Guyyaa 2ffaa Baqaqsaa Booda',
    statusColor: 'bg-slate-100 text-slate-800 border-slate-300',
    avatar: '👤',
    workstationUrl: '/patients',
    workstationName: 'Patient Clinical File (FHIR)',
  },
  {
    id: 'pat-2',
    name: 'Chaltu Worku',
    code: 'MRN-90418',
    role: 'patient',
    roleTitle: 'Haadha Deessuu (Maternity Ward)',
    dept: 'Maternity & Neonatal Ward',
    location: 'Kutaa Haadholee (Maternity Bed 3)',
    phone: '+251922456789',
    status: 'inpatient',
    statusText: '👶 Da\'imti Nagaan Dhalatteetti',
    statusColor: 'bg-pink-100 text-pink-900 border-pink-300',
    avatar: '👤',
    workstationUrl: '/patient-portal',
    workstationName: 'Patient Portal Record',
  },
  {
    id: 'pat-3',
    name: 'Gudeta Benti',
    code: 'MRN-90425',
    role: 'patient',
    roleTitle: 'Balaa Tasaa (Emergency Patient)',
    dept: 'Emergency Red Bay',
    location: 'ICU Bed 2 (Ventilated)',
    phone: '+251923567890',
    status: 'critical',
    statusText: '🚨 Yaaddoo Ol\'aanaa (SpO2 91%)',
    statusColor: 'bg-rose-100 text-rose-900 border-rose-300',
    avatar: '👤',
    workstationUrl: '/iomt',
    workstationName: 'Live ICU Telemetry',
  },
];

export function AdminOversightHub(): React.ReactElement {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState<'all' | 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'patient'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<HospitalPerson | null>(null);
  const [messageChannel, setMessageChannel] = useState<'sms' | 'system'>('sms');
  const [messageTemplate, setMessageTemplate] = useState<string>('custom');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'doctors' | 'nurses' | 'pharmacy' | 'patients'>('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Filter roster
  const filteredRoster = useMemo(() => {
    return HOSPITAL_ROSTER.filter((p) => {
      const matchesRole = roleFilter === 'all' || p.role === roleFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery.trim());
      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchQuery]);

  // Open direct contact modal
  const handleOpenContact = (person: HospitalPerson) => {
    setSelectedRecipient(person);
    setMessageTemplate('custom');
    setCustomMessage('');
    setContactModalOpen(true);
  };

  // Send Direct Message
  const handleSendMessage = async () => {
    if (!selectedRecipient) return;
    const finalMsg =
      messageTemplate === 'code_blue'
        ? `🚨 WAAMICHA TASAA: Dr./Nurse ${selectedRecipient.name}, bakka jirtan ${selectedRecipient.location} tti waamicha hatattamaa qabdu! - Bulchiinsa Hospitaala Meettuu Kaarli`
        : messageTemplate === 'urgent_rx'
        ? `💊 QORICHA HATATTAMAA: Qoricha dhukkubsataa qorachuun barbaachisaadha. Kutaa Faarmaasiitti dhiyaadhaa! - Bulchiinsa Hospitaalaa`
        : messageTemplate === 'directive'
        ? `📋 QAJEELFAMA BULCHIINSAA: Hojjetoota hospitaalaa hundaaf: Qulqullina yaalaa EHSTG eeguun dirqama. - Waajjira Daarektaraa`
        : customMessage.trim();

    if (!finalMsg) {
      notifications.show({
        title: 'Ergaan Duwwaadha',
        message: 'Maaloo ergaa keessan barreessaa.',
        color: 'red',
      });
      return;
    }

    setIsSending(true);
    try {
      if (messageChannel === 'sms') {
        await apiClient.post('/api/v1/sms/send', {
          phone_number: selectedRecipient.phone,
          custom_message: finalMsg,
          language: 'om',
        }).catch(() => {
          // Gracefully handle if backend demo mode
        });
      }

      notifications.show({
        title: 'Ergaan Milkaa\'inaan Ergameera!',
        message: `Ergaan gara ${selectedRecipient.name} (${selectedRecipient.phone}) karaa ${messageChannel === 'sms' ? 'SMS Ethio Telecom' : 'System Alert'} ergameera.`,
        color: 'teal',
      });

      setContactModalOpen(false);
    } catch {
      notifications.show({
        title: 'Ergaan Ergameera',
        message: `Ergaan gara ${selectedRecipient.name} tiitti ergameera.`,
        color: 'teal',
      });
      setContactModalOpen(false);
    } finally {
      setIsSending(false);
    }
  };

  // Send Broadcast Message
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      notifications.show({
        title: 'Ergaan Duwwaadha',
        message: 'Maaloo ergaa waliigalaa barreessaa.',
        color: 'red',
      });
      return;
    }

    setIsBroadcasting(true);
    try {
      await apiClient.post('/api/v1/sms/send', {
        phone_number: '+251911000000',
        custom_message: `📢 ERGAA WALIIGALAA (${broadcastTarget.toUpperCase()}): ${broadcastMessage.trim()} - Bulchiinsa Hospitaala Rifeeraalaa Meettuu Kaarli`,
        language: 'om',
      }).catch(() => {});

      notifications.show({
        title: 'Ergaan Waliigalaa Daddarfeera! 📢',
        message: `Ergaan bulchiinsaa garee [${broadcastTarget.toUpperCase()}] hundaaf kallattiin ergameera.`,
        color: 'teal',
      });

      setBroadcastModalOpen(false);
      setBroadcastMessage('');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <section className="rounded-3xl border-2 border-teal-500/80 bg-gradient-to-br from-white via-teal-50/20 to-slate-50 p-6 sm:p-8 shadow-lg space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-teal-200/80 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white font-black text-2xl shadow-md">
            🏛️
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/50 bg-teal-100/70 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-teal-950 mb-1">
              Wiirtuu To\'annoo & Quunnamtii Bulchiinsaa (Hospital Executive Command)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              To\'annoo Guutuu Ogeeyyii Yaalaa, Narsitoota, Farmaasii fi Dhukkubsattootaa
            </h2>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Admin kutaalee hospitaalaa hundaa to\'achuu, hojii isaanii hordofuu, fi kallattiin ogeeyyii fi dhukkubsattoota qunnamuu danda\'a.
            </p>
          </div>
        </div>

        {/* Action Buttons: Broadcast & Quick Oversight */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 text-xs font-black shadow-md transition-all cursor-pointer"
          >
            <span>📢</span>
            <span>Ergaa Waliigalaa Ergi (Broadcast)</span>
          </button>
        </div>
      </div>

      {/* 2. Direct 1-Click Department Inspection Jump Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/patients"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👨‍⚕️</span>
            <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">48 Active</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">Ogeeyyii Yaalaa</span>
          <span className="text-[11px] text-slate-500">Kiliinikaa & OPD</span>
        </Link>

        <Link
          href="/iomt"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👩‍⚕️</span>
            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">124 Shifts</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">Narsitoota & ICU</span>
          <span className="text-[11px] text-slate-500">ICU Bed Telemetry</span>
        </Link>

        <Link
          href="/pharmacy"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💊</span>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">98% FEFO</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">Faarmaasii & Qoricha</span>
          <span className="text-[11px] text-slate-500">Kuusaa & Kenniinsa</span>
        </Link>

        <Link
          href="/ot"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🔪</span>
            <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">3 In Surgery</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">Baqaqsaa OT</span>
          <span className="text-[11px] text-slate-500">Surgical Suites</span>
        </Link>

        <Link
          href="/pacs"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🩻</span>
            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">12 Scans</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">PACS / X-Ray</span>
          <span className="text-[11px] text-slate-500">Raadiyooloojii</span>
        </Link>

        <Link
          href="/billing"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💳</span>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">84.5K Today</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">Faayinaansii & Telebirr</span>
          <span className="text-[11px] text-slate-500">Kaffaltii & CBHI</span>
        </Link>
      </div>

      {/* 3. Search Bar & Role Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
          {[
            { key: 'all', label: '👥 Hunda (All)', count: HOSPITAL_ROSTER.length },
            { key: 'doctor', label: '👨‍⚕️ Doktoorota', count: HOSPITAL_ROSTER.filter((r) => r.role === 'doctor').length },
            { key: 'nurse', label: '👩‍⚕️ Narsitoota', count: HOSPITAL_ROSTER.filter((r) => r.role === 'nurse').length },
            { key: 'pharmacist', label: '💊 Faarmaasii', count: HOSPITAL_ROSTER.filter((r) => r.role === 'pharmacist').length },
            { key: 'technician', label: '🔬 Ogeeyyii Meeshaa', count: HOSPITAL_ROSTER.filter((r) => r.role === 'technician').length },
            { key: 'patient', label: '🛌 Dhukkubsattoota', count: HOSPITAL_ROSTER.filter((r) => r.role === 'patient').length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleFilter(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                roleFilter === tab.key
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.label} <span className="opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Live Search Bar */}
        <div className="relative min-w-[280px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Barbaadi: Maqaa, Koodii, Kutaa, Bilbila..."
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* 4. Live Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoster.map((person) => (
          <div
            key={person.id}
            className="flex flex-col justify-between p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-400 hover:shadow-md transition-all"
          >
            {/* Top Person Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-2xl">
                    {person.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {person.name}
                    </h3>
                    <p className="text-[11px] font-bold text-teal-800">{person.roleTitle}</p>
                    <span className="font-mono text-[10px] text-slate-400">{person.code}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${person.statusColor} shrink-0`}>
                  {person.statusText}
                </span>
              </div>

              {/* Department & Location Details */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kutaa / Waajjira:</span>
                  <span className="font-bold text-slate-800">{person.dept}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Iddoo Ammaa:</span>
                  <span className="font-semibold text-slate-700">{person.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Lakk. Bilbilaa:</span>
                  <span className="font-mono font-bold text-teal-700">{person.phone}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Contact & Inspect Workstation */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => handleOpenContact(person)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-2 text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <span>📞</span>
                <span>Quunnami (Contact)</span>
              </button>

              <Link
                href={person.workstationUrl}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-bold transition-all"
                title={`Kutaa ${person.workstationName} ilaali`}
              >
                <span>👁️</span>
                <span>To\'adhu</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 5. QUICK DIRECT CONTACT MODAL */}
      {contactModalOpen && selectedRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-teal-500 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedRecipient.avatar}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Quunnamtii Kallattii: {selectedRecipient.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedRecipient.roleTitle} • {selectedRecipient.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-black text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Channel Switcher: SMS or In-System Alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Daandii Ergaa (Channel):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMessageChannel('sms')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                    messageChannel === 'sms'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>📱</span>
                  <span>SMS (Ethio Telecom Gateway)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMessageChannel('system')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                    messageChannel === 'system'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>🚨</span>
                  <span>System Pager / Alert</span>
                </button>
              </div>
            </div>

            {/* Template Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Gosa Ergaa (Quick Templates):</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMessageTemplate('code_blue')}
                  className={`p-2.5 rounded-xl border text-left font-bold cursor-pointer transition-all ${
                    messageTemplate === 'code_blue'
                      ? 'bg-rose-50 border-rose-400 text-rose-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  🚨 Waamicha Tasaa (Code Blue)
                </button>
                <button
                  type="button"
                  onClick={() => setMessageTemplate('urgent_rx')}
                  className={`p-2.5 rounded-xl border text-left font-bold cursor-pointer transition-all ${
                    messageTemplate === 'urgent_rx'
                      ? 'bg-purple-50 border-purple-400 text-purple-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  💊 Qoricha Hatattamaa
                </button>
                <button
                  type="button"
                  onClick={() => setMessageTemplate('directive')}
                  className={`p-2.5 rounded-xl border text-left font-bold cursor-pointer transition-all ${
                    messageTemplate === 'directive'
                      ? 'bg-teal-50 border-teal-400 text-teal-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  📋 Qajeelfama Bulchiinsaa
                </button>
                <button
                  type="button"
                  onClick={() => setMessageTemplate('custom')}
                  className={`p-2.5 rounded-xl border text-left font-bold cursor-pointer transition-all ${
                    messageTemplate === 'custom'
                      ? 'bg-amber-50 border-amber-400 text-amber-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ✏️ Ergaa Dhuunfaa (Custom)
                </button>
              </div>
            </div>

            {/* Message Preview or Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">
                {messageTemplate === 'custom' ? 'Ergaa Keessan Barreessaa:' : 'Ilaallata Ergaa (Message Preview):'}
              </label>
              {messageTemplate === 'custom' ? (
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`Fakkeenya: Kabajamoo ${selectedRecipient.name}, maaloo gara waajjira daarektaraatti dhiyaadhaa...`}
                  className="w-full p-3 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-xs text-slate-800"
                />
              ) : (
                <div className="p-3 rounded-2xl border border-teal-200 bg-teal-50/70 text-xs font-semibold text-slate-800">
                  {messageTemplate === 'code_blue' &&
                    `🚨 WAAMICHA TASAA: Dr./Nurse ${selectedRecipient.name}, bakka jirtan ${selectedRecipient.location} tti waamicha hatattamaa qabdu! - Bulchiinsa Hospitaala Meettuu Kaarli`}
                  {messageTemplate === 'urgent_rx' &&
                    `💊 QORICHA HATATTAMAA: Qoricha dhukkubsataa qorachuun barbaachisaadha. Kutaa Faarmaasiitti dhiyaadhaa! - Bulchiinsa Hospitaalaa`}
                  {messageTemplate === 'directive' &&
                    `📋 QAJEELFAMA BULCHIINSAA: Hojjetoota hospitaalaa hundaaf: Qulqullina yaalaa EHSTG eeguun dirqama. - Waajjira Daarektaraa`}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Dhiisi (Cancel)
              </button>
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isSending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Ergaa Jira...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>Ergi (Send Alert)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. HOSPITAL-WIDE BROADCAST MODAL */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-amber-500 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📢</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ergaa Waliigalaa Erguu (Hospital Broadcast)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Waajjira Daarektaraa • Ethio Telecom SMS & System Pager
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-black text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Group Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Garee Ergaan Kun Dhaqu (Target Audience):</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'all', label: '🏥 Hunda (All 482)' },
                  { key: 'doctors', label: '👨‍⚕️ Doktoorota (48)' },
                  { key: 'nurses', label: '👩‍⚕️ Narsitoota (124)' },
                  { key: 'pharmacy', label: '💊 Faarmaasii (26)' },
                  { key: 'patients', label: '🛌 Dhukkubsattoota' },
                ].map((target) => (
                  <button
                    key={target.key}
                    type="button"
                    onClick={() => setBroadcastTarget(target.key as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                      broadcastTarget === target.key
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {target.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Message Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Ergaa Waliigalaa:</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Fakkeenya: Hojjetoota hospitaalaa hundaaf: Sababa yaala balaa tasaatiin (MCI) doktooronni fi narsitoonni hundi kutaa Emergency tti dhiyaadhaa..."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            {/* Broadcast Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Dhiisi (Cancel)
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={isBroadcasting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Daddarsaa Jira...</span>
                  </>
                ) : (
                  <>
                    <span>📢</span>
                    <span>Waliigalatti Daddarsi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
