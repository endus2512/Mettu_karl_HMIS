/**
 * Mettu Karl Referral Hospital — Executive Administration, Staff Oversight & Direct Contact Hub.
 *
 * Full Multilingual Localization:
 * - Supports English ('en'), Afaan Oromoo ('om'), and Amharic ('am')
 * - Empowers the Hospital Administrator to monitor, oversee, and directly contact
 *   Doctors, Nurses, Pharmacists, Technicians, and Patients across all hospital wards.
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { notifications } from '@mantine/notifications';
import { useTranslation, Language } from '@/lib/i18n';
import apiClient from '@/lib/api';
import { addNotification } from '@/lib/notifications';
import {
  Building2,
  Megaphone,
  ChevronUp,
  ChevronDown,
  Search,
  Stethoscope,
  Activity,
  Pill,
  Syringe,
  Scan,
  CreditCard,
  PhoneCall,
  Eye,
  X,
  Smartphone,
  Radio,
  Send,
  AlertTriangle,
  User,
  UserCheck,
  ArrowUpDown,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface LocalizedText {
  en: string;
  om: string;
  am: string;
}

export interface HospitalPerson {
  id: string;
  name: string;
  code: string;
  role: 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'billing' | 'patient';
  roleTitle: LocalizedText;
  dept: LocalizedText;
  location: LocalizedText;
  phone: string;
  status: 'consulting' | 'surgery' | 'rounds' | 'dispensing' | 'icu_bedside' | 'available' | 'inpatient' | 'critical';
  statusText: LocalizedText;
  statusColor: string;
  avatar: string;
  workstationUrl: string;
  workstationName: LocalizedText;
}

const HOSPITAL_ROSTER: HospitalPerson[] = [
  // 1. Doctors
  {
    id: 'doc-1',
    name: 'Dr. Bekele Tadesse',
    code: 'MKH-DOC-012',
    role: 'doctor',
    roleTitle: {
      en: 'Senior Consultant Surgeon',
      om: "Ogeessa Baqaqsaa Ol'aanaa",
      am: 'ዋና የቀዶ ህክምና ስፔሻሊስት',
    },
    dept: {
      en: 'General Surgery & OT',
      om: 'Kutaa Baqaqsaa Waliigalaa',
      am: 'አጠቃላይ ቀዶ ህክምና ክፍል',
    },
    location: {
      en: 'Operating Theater Suite 1',
      om: 'Kutaa Baqaqsaa 1 (OT 1)',
      am: 'የቀዶ ህክምና ክፍል 1',
    },
    phone: '+251911456789',
    status: 'surgery',
    statusText: {
      en: 'In Surgery',
      om: 'Baqaqsarratti',
      am: 'ቀዶ ጥገና ላይ',
    },
    statusColor: 'bg-purple-100 text-purple-900 border-purple-300',
    avatar: 'DOC',
    workstationUrl: '/ot',
    workstationName: {
      en: 'OT Surgery & CSSD',
      om: 'Kutaa Baqaqsanii Yaaluu',
      am: 'የቀዶ ጥገና ክፍል',
    },
  },
  {
    id: 'doc-2',
    name: 'Dr. Hawi Tolosa',
    code: 'MKH-DOC-024',
    role: 'doctor',
    roleTitle: {
      en: 'Consultant Pediatrician',
      om: "Iskripishiyalistii Daa'immanii",
      am: 'የህጻናት ህክምና ስፔሻሊስት',
    },
    dept: {
      en: 'Pediatrics Ward',
      om: "Kutaa Daa'immanii",
      am: 'የህፃናት ህክምና ክፍል',
    },
    location: {
      en: 'OPD Room 4 (Pediatric Clinic)',
      om: 'OPD Kutaa 4',
      am: 'የተመላላሽ ክፍል 4',
    },
    phone: '+251912345678',
    status: 'consulting',
    statusText: {
      en: 'In OPD Consultation',
      om: 'Yaalurratti (OPD)',
      am: 'ታካሚዎችን እያየ ነው',
    },
    statusColor: 'bg-teal-100 text-teal-900 border-teal-300',
    avatar: 'NUR',
    workstationUrl: '/patients',
    workstationName: {
      en: 'Patients & OPD Care',
      om: 'Galmee Dhukkubsattootaa',
      am: 'የታካሚዎች መዝገብ',
    },
  },
  {
    id: 'doc-3',
    name: 'Dr. Gemechu Desta',
    code: 'MKH-DOC-033',
    role: 'doctor',
    roleTitle: {
      en: 'Emergency & Trauma Consultant',
      om: 'Hoggansa Yaala Tasaa',
      am: 'የድንገተኛና አደጋ ህክምና አማካሪ',
    },
    dept: {
      en: 'Emergency & Trauma Center',
      om: 'Balaa Tasaa fi Triage',
      am: 'ድንገተኛና አደጋ ማዕከል',
    },
    location: {
      en: 'Trauma Bay 2 (Red Resuscitation)',
      om: 'Kutaa Triage Tasaa (Bay 2)',
      am: 'የአደጋ ጊዜ ክፍል 2',
    },
    phone: '+251913456789',
    status: 'critical',
    statusText: {
      en: 'MCI Active (Critical Resus)',
      om: 'Balaa Tasaa (MCI Active)',
      am: 'ከፍተኛ አደጋ ህክምና ላይ',
    },
    statusColor: 'bg-rose-100 text-rose-900 border-rose-300',
    avatar: 'DOC',
    workstationUrl: '/mci',
    workstationName: {
      en: 'MCI & Trauma Triage',
      om: 'Balaa Tasaa (MCI)',
      am: 'የድንገተኛ አደጋ ትሪያጅ',
    },
  },
  {
    id: 'doc-4',
    name: 'Dr. Tolera Gudeta',
    code: 'MKH-DOC-041',
    role: 'doctor',
    roleTitle: {
      en: 'Chief Radiologist',
      om: 'Ogeessa Raadiyooloojii',
      am: 'ዋና የራዲዮሎጂ ስፔሻሊስት',
    },
    dept: {
      en: 'Radiology / PACS Suite',
      om: 'Raadiyooloojii fi PACS',
      am: 'ራዲዮሎጂና ኤክስሬይ ክፍል',
    },
    location: {
      en: 'CT / X-Ray Reading Suite',
      om: 'Kutaa Dubbisa CT / X-Ray',
      am: 'የሲቲ ስካንና ኤክስሬይ ክፍል',
    },
    phone: '+251914567890',
    status: 'available',
    statusText: {
      en: 'Ready for Scans',
      om: 'Qophii (Scans Ready)',
      am: 'ለምርመራ ዝግጁ',
    },
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: 'DOC',
    workstationUrl: '/pacs',
    workstationName: {
      en: 'PACS Radiology',
      om: 'Suuraa X-Ray / CT',
      am: 'ራዲዮሎጂና ኤክስሬይ',
    },
  },

  // 2. Nurses
  {
    id: 'nur-1',
    name: 'Nurse Chaltu Abera',
    code: 'MKH-NUR-101',
    role: 'nurse',
    roleTitle: {
      en: 'ICU Head Nurse',
      om: 'Hangafa Narsitootaa ICU',
      am: 'የአይሲዩ ዋና ነርስ',
    },
    dept: {
      en: 'Intensive Care Unit (ICU)',
      om: 'Kutaa ICU',
      am: 'ጽኑ ህሙማን ክፍል (ICU)',
    },
    location: {
      en: 'ICU Beds 1 - 6 Central Monitor',
      om: 'Siree ICU 1 - 6 To\'annoo',
      am: 'የአይሲዩ አልጋዎች 1 - 6',
    },
    phone: '+251915678901',
    status: 'icu_bedside',
    statusText: {
      en: 'ICU Bedside (Telemetry Live)',
      om: 'ICU Bedside (Telemetry)',
      am: 'አይሲዩ ክትትል ላይ',
    },
    statusColor: 'bg-blue-100 text-blue-900 border-blue-300',
    avatar: 'NUR',
    workstationUrl: '/iomt',
    workstationName: {
      en: 'IoMT ICU Telemetry',
      om: 'Mallattoo Lubbuu ICU',
      am: 'አይሲዩ ቴሌሜትሪ',
    },
  },
  {
    id: 'nur-2',
    name: 'Nurse Aster Bekele',
    code: 'MKH-NUR-115',
    role: 'nurse',
    roleTitle: {
      en: 'OPD Triage Nurse',
      om: 'Narsii Triage & Dabaree',
      am: 'የተመላላሽ ትሪያጅ ነርስ',
    },
    dept: {
      en: 'Outpatient Triage',
      om: 'Dabaree OPD',
      am: 'የተመላላሽ ታካሚዎች ተራ',
    },
    location: {
      en: 'OPD Triage Counter 2',
      om: 'Dabaree OPD Counter 2',
      am: 'የተራ ቁጥር መስኮት 2',
    },
    phone: '+251916789012',
    status: 'rounds',
    statusText: {
      en: 'OPD Queue (18 Waiting)',
      om: 'Dabaree OPD (18 Eegaa)',
      am: 'የተመላላሽ ተራ (18 በመጠባበቅ)',
    },
    statusColor: 'bg-amber-100 text-amber-900 border-amber-300',
    avatar: 'NUR',
    workstationUrl: '/queue',
    workstationName: {
      en: 'Queue & Token TV',
      om: "To'annoo Dabaree OPD",
      am: 'የተራ ቁጥርና ቶከን',
    },
  },
  {
    id: 'nur-3',
    name: 'Nurse Tigist Gemechu',
    code: 'MKH-NUR-128',
    role: 'nurse',
    roleTitle: {
      en: 'OT Scrub Nurse',
      om: 'Narsii Baqaqsaa (OT Scrub)',
      am: 'የቀዶ ጥገና ረዳት ነርስ',
    },
    dept: {
      en: 'Surgical Suites & CSSD',
      om: 'Kutaa Baqaqsaa fi CSSD',
      am: 'የቀዶ ጥገናና ማምከኛ ክፍል',
    },
    location: {
      en: 'OT Suite 2 Sterilization',
      om: 'OT Suite 2 Qulqulleessa',
      am: 'የቀዶ ጥገና ክፍል 2',
    },
    phone: '+251917890123',
    status: 'available',
    statusText: {
      en: 'Pre-Op Prepared',
      om: 'Qophii (Pre-Op Ready)',
      am: 'ለቀዶ ጥገና ዝግጁ',
    },
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: 'NUR',
    workstationUrl: '/ot',
    workstationName: {
      en: 'OT Surgery & CSSD',
      om: 'Kutaa Baqaqsanii Yaaluu',
      am: 'የቀዶ ጥገና ክፍል',
    },
  },

  // 3. Pharmacy Team
  {
    id: 'phm-1',
    name: 'Pharm. Obsa Kuma',
    code: 'MKH-PHM-008',
    role: 'pharmacist',
    roleTitle: {
      en: 'Lead Pharmacist',
      om: "Faarmaasistii Ol'aanaa",
      am: 'ዋና የመድኃኒት ባለሙያ',
    },
    dept: {
      en: 'Outpatient Dispensary',
      om: 'Kutaa Kenniinsa Qorichaa',
      am: 'የመድኃኒት መስጫ ክፍል',
    },
    location: {
      en: 'Pharmacy Counter 1',
      om: 'Farmaasii Counter 1',
      am: 'ፋርማሲ መስኮት 1',
    },
    phone: '+251918901234',
    status: 'dispensing',
    statusText: {
      en: 'Dispensing Active',
      om: 'Qoricha Raabsaa',
      am: 'መድኃኒት በመስጠት ላይ',
    },
    statusColor: 'bg-teal-100 text-teal-900 border-teal-300',
    avatar: 'PT',
    workstationUrl: '/pharmacy',
    workstationName: {
      en: 'Pharmacy & FEFO Stock',
      om: 'Farmaasii fi Qoricha',
      am: 'ፋርማሲና መድኃኒት',
    },
  },
  {
    id: 'phm-2',
    name: 'Pharm. Derartu Kebede',
    code: 'MKH-PHM-014',
    role: 'pharmacist',
    roleTitle: {
      en: 'Inventory & FEFO Officer',
      om: 'Qorannoo Kuusaa & FEFO',
      am: 'የክምችትና ፈጣን ቁጥጥር ባለሙያ',
    },
    dept: {
      en: 'Central Pharmacy Vault',
      om: 'Kuusaa Qorichaa Giddu-galeessaa',
      am: 'ዋና የመድኃኒት መጋዘን',
    },
    location: {
      en: 'Cold Chain Vault (2°C - 8°C)',
      om: 'Kuusaa Qabbanaawaa (Cold Chain)',
      am: 'የማቀዝቀዣ መጋዘን (2°C - 8°C)',
    },
    phone: '+251919012345',
    status: 'available',
    statusText: {
      en: 'EFDA Compliant (98%)',
      om: "EFDA Mirkanaa'e (98%)",
      am: 'የEFDA ህግ የተሟላ (98%)',
    },
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: 'PHM',
    workstationUrl: '/efda',
    workstationName: {
      en: 'EFDA Drug Safety & Vault',
      om: 'Nageenya Qorichaa (EFDA)',
      am: 'የመድኃኒት ደህንነት',
    },
  },

  // 4. Biomedical & Laboratory
  {
    id: 'tch-1',
    name: 'Tech Dawit Girma',
    code: 'MKH-TCH-019',
    role: 'technician',
    roleTitle: {
      en: 'Biomedical Engineer',
      om: 'Injinara Meeshaalee Yaalaa',
      am: 'የህክምና መሳሪያዎች መሀንዲስ',
    },
    dept: {
      en: 'Biomedical Engineering',
      om: 'Injinariingii Meeshaalee',
      am: 'የህክምና መሳሪያዎች ጥገና',
    },
    location: {
      en: 'Liquid Oxygen & Power Plant',
      om: 'Warshaa Oksijiinii fi Humnaa',
      am: 'የኦክስጅንና መብራት ማመንጫ',
    },
    phone: '+251920123456',
    status: 'available',
    statusText: {
      en: 'Grid & O2 Online (100%)',
      om: 'Humna & O2 Qophii (100%)',
      am: 'መብራትና ኦክስጅን 100% ዝግጁ',
    },
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: 'TCH',
    workstationUrl: '/assets',
    workstationName: {
      en: 'Biomedical Assets & PPM',
      om: 'Meeshaalee Yaalaa',
      am: 'የህክምና መሳሪያዎች ቁጥጥር',
    },
  },

  // 5. Inpatients & Outpatients
  {
    id: 'pat-1',
    name: 'Tolosa Dinsa',
    code: 'MRN-90412',
    role: 'patient',
    roleTitle: {
      en: 'Surgical Inpatient',
      om: 'Dhukkubsataa Ciisee Yaalamu',
      am: 'የቀዶ ህክምና ተኝቶ ታካሚ',
    },
    dept: {
      en: 'Surgical Inpatient Ward',
      om: 'Wardi Baqaqsaa',
      am: 'የቀዶ ህክምና ህሙማን ክፍል',
    },
    location: {
      en: 'Bed 8 (Surgical Ward)',
      om: 'Siree 8 (Wardi Baqaqsaa)',
      am: 'አልጋ 8 (የቀዶ ህክምና)',
    },
    phone: '+251921345678',
    status: 'inpatient',
    statusText: {
      en: 'Post-Op Day 2 Stable',
      om: 'Guyyaa 2ffaa Baqaqsaa Booda',
      am: 'ከቀዶ ጥገና በኋላ 2ኛ ቀን',
    },
    statusColor: 'bg-slate-100 text-slate-800 border-slate-300',
    avatar: 'PAT',
    workstationUrl: '/patients',
    workstationName: {
      en: 'Patient Clinical File (FHIR)',
      om: 'Galmee Dhukkubsattootaa',
      am: 'የታካሚ የህክምና መዝገብ',
    },
  },
  {
    id: 'pat-2',
    name: 'Chaltu Worku',
    code: 'MRN-90418',
    role: 'patient',
    roleTitle: {
      en: 'Maternity Inpatient',
      om: 'Haadha Deessuu',
      am: 'የወሊድ ክፍል ተኝቶ ታካሚ',
    },
    dept: {
      en: 'Maternity & Neonatal Ward',
      om: "Kutaa Haadholee fi Daa'immanii",
      am: 'የእናቶችና ጨቅላ ህጻናት ክፍል',
    },
    location: {
      en: 'Maternity Ward Bed 3',
      om: 'Kutaa Haadholee Siree 3',
      am: 'የወሊድ ክፍል አልጋ 3',
    },
    phone: '+251922456789',
    status: 'inpatient',
    statusText: {
      en: 'Healthy Delivery',
      om: "Daa'imti Nagaan Dhalatteetti",
      am: 'ጤናማ ልጅ ተወልዷል',
    },
    statusColor: 'bg-pink-100 text-pink-900 border-pink-300',
    avatar: 'PAT',
    workstationUrl: '/patient-portal',
    workstationName: {
      en: 'Patient Portal Record',
      om: 'Poortaalii Dhukkubsataa',
      am: 'የታካሚ ፖርታል',
    },
  },
  {
    id: 'pat-3',
    name: 'Gudeta Benti',
    code: 'MRN-90425',
    role: 'patient',
    roleTitle: {
      en: 'Emergency Trauma Inpatient',
      om: 'Balaa Tasaa (Emergency)',
      am: 'የድንገተኛ አደጋ ተኝቶ ታካሚ',
    },
    dept: {
      en: 'Emergency Red Bay',
      om: 'Kutaa Tasaa Diimaa',
      am: 'የድንገተኛ ቀይ ክፍል',
    },
    location: {
      en: 'ICU Bed 2 (Ventilated)',
      om: 'ICU Siree 2 (Oksijiinii)',
      am: 'አይሲዩ አልጋ 2 (በኦክስጅን)',
    },
    phone: '+251923567890',
    status: 'critical',
    statusText: {
      en: 'Critical (SpO2 91%)',
      om: "Yaaddoo Ol'aanaa (SpO2 91%)",
      am: 'ከፍተኛ ክትትል (SpO2 91%)',
    },
    statusColor: 'bg-rose-100 text-rose-900 border-rose-300',
    avatar: 'PAT',
    workstationUrl: '/iomt',
    workstationName: {
      en: 'Live ICU Telemetry',
      om: 'Mallattoo Lubbuu ICU',
      am: 'የቀጥታ አይሲዩ ክትትል',
    },
  },
];

const OVERSIGHT_I18N: Record<Language, {
  badge: string;
  title: string;
  subtitle: string;
  broadcastBtn: string;
  tabAll: string;
  tabDoctor: string;
  tabNurse: string;
  tabPharmacy: string;
  tabTechnician: string;
  tabPatient: string;
  searchPlaceholder: string;
  labelDept: string;
  labelLocation: string;
  labelPhone: string;
  contactBtn: string;
  inspectBtn: string;
  contactModalTitle: string;
  channelLabel: string;
  channelSms: string;
  channelSystem: string;
  templateLabel: string;
  tmplCodeBlue: string;
  tmplUrgentRx: string;
  tmplDirective: string;
  tmplCustom: string;
  msgInputLabel: string;
  msgPreviewLabel: string;
  sendBtn: string;
  sendingText: string;
  cancelBtn: string;
  broadcastModalTitle: string;
  broadcastTargetLabel: string;
  broadcastMsgLabel: string;
  broadcastPlaceholder: string;
  broadcastSendBtn: string;
  emptyMsgError: string;
  emptyMsgErrorDesc: string;
  sendSuccessTitle: string;
  sendSuccessMsg: string;
  broadcastSuccessTitle: string;
  broadcastSuccessMsg: string;
  sortByAlpha: string;
  sortByCode: string;
  sortByStatus: string;
  expandRole: string;
  collapseRole: string;
  roleDirectoryNotice: string;
}> = {
  en: {
    badge: 'Executive Oversight',
    title: 'Staff, Pharmacy & Patient Command',
    subtitle: 'Universal monitoring and direct SMS / Alert contact across all departments.',
    broadcastBtn: 'Broadcast Announcement',
    tabAll: 'All Categories',
    tabDoctor: 'Doctors',
    tabNurse: 'Nurses',
    tabPharmacy: 'Pharmacy',
    tabTechnician: 'Technicians',
    tabPatient: 'Patients',
    searchPlaceholder: 'Search name, code, ward, phone...',
    labelDept: 'Dept:',
    labelLocation: 'Location:',
    labelPhone: 'Phone:',
    contactBtn: 'Contact',
    inspectBtn: 'Inspect',
    contactModalTitle: 'Direct Contact:',
    channelLabel: 'Channel:',
    channelSms: 'SMS (Ethio Telecom)',
    channelSystem: 'System Alert',
    templateLabel: 'Quick Template:',
    tmplCodeBlue: 'Emergency (Code Blue)',
    tmplUrgentRx: 'Urgent Pharmacy Clearance',
    tmplDirective: 'Administrative Directive',
    tmplCustom: 'Custom Message',
    msgInputLabel: 'Message:',
    msgPreviewLabel: 'Preview:',
    sendBtn: 'Send Message',
    sendingText: 'Sending...',
    cancelBtn: 'Cancel',
    broadcastModalTitle: 'Hospital-Wide Broadcast',
    broadcastTargetLabel: 'Recipient Group:',
    broadcastMsgLabel: 'Announcement:',
    broadcastPlaceholder: 'Enter official hospital announcement dispatched via SMS & System Alerts...',
    broadcastSendBtn: 'Dispatch Broadcast',
    emptyMsgError: 'Message Empty',
    emptyMsgErrorDesc: 'Please write a message before sending.',
    sendSuccessTitle: 'Message Dispatched!',
    sendSuccessMsg: 'Sent via SMS and System Alert.',
    broadcastSuccessTitle: 'Broadcast Dispatched!',
    broadcastSuccessMsg: 'Administrative announcement dispatched to all recipients.',
    sortByAlpha: 'Name (A-Z)',
    sortByCode: 'Code ID',
    sortByStatus: 'Duty Status',
    expandRole: 'Open Roster',
    collapseRole: 'Collapse',
    roleDirectoryNotice: 'Click any department below to view its organized roster. Keeps your command center clean and space-efficient.',
  },
  om: {
    badge: "To'annoo Bulchiinsaa",
    title: "Wiirtuu To'annoo Ogeeyyii fi Dhukkubsattootaa",
    subtitle: "To'annoo fi quunnamtii kallattii ogeeyyii fi dhukkubsattoota hospitaalaa.",
    broadcastBtn: 'Ergaa Waliigalaa (Broadcast)',
    tabAll: 'Kutaalee Hunda',
    tabDoctor: 'Doktoorota',
    tabNurse: 'Narsitoota',
    tabPharmacy: 'Faarmaasii',
    tabTechnician: 'Ogeeyyii Meeshaa',
    tabPatient: 'Dhukkubsattoota',
    searchPlaceholder: 'Barbaadi maqaa, koodii, kutaa...',
    labelDept: 'Kutaa:',
    labelLocation: 'Iddoo:',
    labelPhone: 'Bilbila:',
    contactBtn: 'Quunnami',
    inspectBtn: "To'adhu",
    contactModalTitle: 'Quunnamtii Kallattii:',
    channelLabel: 'Daandii (Channel):',
    channelSms: 'SMS (Ethio Telecom)',
    channelSystem: 'System Alert',
    templateLabel: 'Gosa Ergaa:',
    tmplCodeBlue: 'Waamicha Tasaa (Code Blue)',
    tmplUrgentRx: 'Qoricha Hatattamaa',
    tmplDirective: 'Qajeelfama Bulchiinsaa',
    tmplCustom: 'Ergaa Dhuunfaa',
    msgInputLabel: 'Ergaa:',
    msgPreviewLabel: 'Ilaallata:',
    sendBtn: 'Amma Ergi',
    sendingText: 'Ergaa Jira...',
    cancelBtn: 'Dhiisi',
    broadcastModalTitle: 'Ergaa Waliigalaa Bulchiinsaa',
    broadcastTargetLabel: 'Garee Filadhaa:',
    broadcastMsgLabel: 'Labsii Bulchiinsaa:',
    broadcastPlaceholder: 'Labsii hospitaalaa kan SMS fi Siisteemiin darbu asitti barreessaa...',
    broadcastSendBtn: 'Ergaa Daddarsi',
    emptyMsgError: 'Ergaan Duwwaadha',
    emptyMsgErrorDesc: 'Maaloo ergaa keessan barreessaa.',
    sendSuccessTitle: "Ergaan Ergameera!",
    sendSuccessMsg: 'Ergaan karaa SMS fi System Alert ergameera.',
    broadcastSuccessTitle: 'Ergaan Daddarfeera!',
    broadcastSuccessMsg: 'Ergaan bulchiinsaa garee filatameef kallattiin ergameera.',
    sortByAlpha: 'Maqaan (A-Z)',
    sortByCode: 'Koodii ID',
    sortByStatus: 'Haala Hojiin',
    expandRole: 'Tarree Banadhu',
    collapseRole: 'Dhadhahi (Cufi)',
    roleDirectoryNotice: "Kutaa barbaaddan tuquun tarree ogeeyyii qindaa’ee jiru banaa. Iddoo qusachuufi dubbisuuf salphaa taasisameera.",
  },
  am: {
    badge: 'አመራር ቁጥጥር',
    title: 'የሰራተኞችና ታካሚዎች ቁጥጥር',
    subtitle: 'የሆስፒታል ሰራተኞችና ታካሚዎች የቀጥታ ቁጥጥርና ግንኙነት።',
    broadcastBtn: 'አጠቃላይ መልዕክት (Broadcast)',
    tabAll: 'ሁሉም ክፍሎች',
    tabDoctor: 'ዶክተሮች',
    tabNurse: 'ነርሶች',
    tabPharmacy: 'ፋርማሲ',
    tabTechnician: 'ቴክኒሻኖች',
    tabPatient: 'ታካሚዎች',
    searchPlaceholder: 'ፈልግ ስም፣ መለያ፣ ክፍል...',
    labelDept: 'ክፍል:',
    labelLocation: 'ቦታ:',
    labelPhone: 'ስልክ:',
    contactBtn: 'አግኝ',
    inspectBtn: 'ተመልከት',
    contactModalTitle: 'የቀጥታ ግንኙነት:',
    channelLabel: 'የመልዕክት መስመር:',
    channelSms: 'ኤስኤምኤስ (ኢትዮ ቴሌኮም)',
    channelSystem: 'የሲስተም ማንቂያ (Alert)',
    templateLabel: 'የመልዕክት አብነቶች:',
    tmplCodeBlue: 'የአደጋ ጊዜ ጥሪ (Code Blue)',
    tmplUrgentRx: 'አስቸኳይ መድኃኒት',
    tmplDirective: 'የአስተዳደር መመሪያ',
    tmplCustom: 'የራስዎ መልዕክት',
    msgInputLabel: 'መልዕክት:',
    msgPreviewLabel: 'ቅድመ-ዕይታ:',
    sendBtn: 'አሁን ላክ',
    sendingText: 'በመላክ ላይ...',
    cancelBtn: 'ሰርዝ',
    broadcastModalTitle: 'አጠቃላይ የአስተዳደር መግለጫ',
    broadcastTargetLabel: 'የተቀባይ ቡድን:',
    broadcastMsgLabel: 'የመግለጫ መልዕክት:',
    broadcastPlaceholder: 'በኤስኤምኤስና በሲስተም የሚሰራጭ ይፋዊ መመሪያ እዚህ ይጻፉ...',
    broadcastSendBtn: 'መግለጫውን አሰራጭ',
    emptyMsgError: 'ባዶ መልዕክት',
    emptyMsgErrorDesc: 'እባክዎ ከመላክዎ በፊት መልዕክት ይጻፉ።',
    sendSuccessTitle: 'መልዕክቱ ተልኳል!',
    sendSuccessMsg: 'መልዕክቱ በኤስኤምኤስ እና በሲስተም ተልኳል።',
    broadcastSuccessTitle: 'አጠቃላይ መልዕክት ተሰራጭቷል!',
    broadcastSuccessMsg: 'የአስተዳደር መግለጫው ለሁሉም ሰራተኞች ደርሷል።',
    sortByAlpha: 'በስም (A-Z)',
    sortByCode: 'መለያ ቁጥር',
    sortByStatus: 'የስራ ሁኔታ',
    expandRole: 'ዝርዝር ክፈት',
    collapseRole: 'አሳጥር',
    roleDirectoryNotice: 'የሚፈልጉትን ክፍል በመጫን የተደራጀውን የሰራተኞች ዝርዝር ይመልከቱ። ቦታን የሚቆጥብና ለማንበብ ምቹ ተደርጓል።',
  },
};

export function AdminOversightHub(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';
  const txt = OVERSIGHT_I18N[lang] || OVERSIGHT_I18N['en'];

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'patient'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Departmental Categorized Accordions State:
  // Starts collapsed by default for maximum space savings and clean order!
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({
    doctor: false,
    nurse: false,
    pharmacist: false,
    technician: false,
    patient: false,
  });

  const [sortBy, setSortBy] = useState<'name' | 'code' | 'status'>('name');

  // Toggle single category
  const toggleRole = (roleKey: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  // If user searches, automatically open the categories with matching results
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedRoles({
        doctor: true,
        nurse: true,
        pharmacist: true,
        technician: true,
        patient: true,
      });
    }
  }, [searchQuery]);

  // When user clicks a role filter tab, focus and open that role's category
  const handleRoleTabClick = (key: 'all' | 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'patient') => {
    setRoleFilter(key);
    if (key === 'all') {
      // Toggle all closed or open
    } else {
      setExpandedRoles({
        doctor: key === 'doctor',
        nurse: key === 'nurse',
        pharmacist: key === 'pharmacist',
        technician: key === 'technician',
        patient: key === 'patient',
      });
    }
  };

  // Sort members within a category according to selected ordering
  const sortMembers = (members: HospitalPerson[]) => {
    return [...members].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'code') {
        return a.code.localeCompare(b.code);
      }
      if (sortBy === 'status') {
        const sA = (a.statusText[lang] || a.statusText.en).toLowerCase();
        const sB = (b.statusText[lang] || b.statusText.en).toLowerCase();
        return sA.localeCompare(sB);
      }
      return 0;
    });
  };

  // 5 Canonical Departmental Role Categories
  const categories = useMemo(() => [
    {
      key: 'doctor',
      icon: Stethoscope,
      title: {
        en: 'Doctors & Medical Consultants',
        om: 'Doktoorota fi Ogeeyyii Yaalaa',
        am: 'ዶክተሮች እና የህክምና አማካሪዎች',
      },
      subtitle: {
        en: 'General Surgery, Pediatrics, Trauma & Clinical OPD',
        om: 'Baqaqsaa Waliigalaa, Daa’imman, Tasaa fi OPD',
        am: 'አጠቃላይ ቀዶ ጥገና፣ ህጻናት፣ ድንገተኛና OPD',
      },
      badgeColor: 'border-teal-500/40 bg-teal-500/10 text-teal-400',
      iconBg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
      members: HOSPITAL_ROSTER.filter((r) => r.role === 'doctor'),
    },
    {
      key: 'nurse',
      icon: Activity,
      title: {
        en: 'Nursing Staff & ICU Care',
        om: 'Narsitoota fi Tajaajila ICU',
        am: 'ነርሶች እና የፅኑ ህክምና ክብካቤ',
      },
      subtitle: {
        en: 'Head Nurses, Ward Care, Triage & Critical Care',
        om: 'Hoggantoota Narsii, Kutaa Siree fi Triage',
        am: 'ዋና ነርሶች፣ የዋርድ ክብካቤ እና ትሪያጅ',
      },
      badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
      iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      members: HOSPITAL_ROSTER.filter((r) => r.role === 'nurse'),
    },
    {
      key: 'pharmacist',
      icon: Pill,
      title: {
        en: 'Pharmacists & FEFO Dispensary',
        om: 'Ogeeyyii Faarmaasistii & Raabsaa Qorichaa',
        am: 'ፋርማሲስቶች እና የመድኃኒት አደላዮች',
      },
      subtitle: {
        en: 'Inpatient Stock, FEFO Dispensary & Clinical ART',
        om: 'Kutaa Raabsaa FEFO, Kuusaa fi Qoricha ART',
        am: 'የFEFO መድኃኒት ማከፋፈያና ክምችት',
      },
      badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      members: HOSPITAL_ROSTER.filter((r) => r.role === 'pharmacist'),
    },
    {
      key: 'technician',
      icon: Scan,
      title: {
        en: 'Laboratory & Diagnostic Technicians',
        om: 'Teeknishiyaanota Laboraatorii & Raadiyooloojii',
        am: 'የላቦራቶሪ እና ራዲዮሎጂ ቴክኒሻኖች',
      },
      subtitle: {
        en: 'Diagnostic Pathology, Blood Bank & PACS Imaging',
        om: 'LIS Paatooloojii, Kuusaa Dhiigaa fi PACS',
        am: 'LIS ፓቶሎጂ፣ የደም ባንክ እና ራዲዮሎጂ',
      },
      badgeColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
      iconBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      members: HOSPITAL_ROSTER.filter((r) => r.role === 'technician'),
    },
    {
      key: 'patient',
      icon: UserCheck,
      title: {
        en: 'Inpatient Census & Admitted Patients',
        om: 'Dhukkubsattoota Ciisanii Yaalaman',
        am: 'ተኝተው የሚታከሙ ታካሚዎች',
      },
      subtitle: {
        en: 'Emergency Admissions, Surgical Wards & Bedside Care',
        om: 'Galmee Tasaa, Kutaalee Siree fi ICU',
        am: 'የድንገተኛና ተኝተው የሚታከሙ ታካሚዎች መዝገብ',
      },
      badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      members: HOSPITAL_ROSTER.filter((r) => r.role === 'patient'),
    },
  ], []);

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
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.dept[lang].toLowerCase().includes(q) ||
        p.location[lang].toLowerCase().includes(q) ||
        p.phone.includes(q);
      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchQuery, lang]);

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

    let finalMsg = customMessage.trim();
    if (messageTemplate === 'code_blue') {
      finalMsg =
        lang === 'om'
          ? `WAAMICHA TASAA: ${selectedRecipient.name}, bakka jirtan ${selectedRecipient.location.om} tti waamicha hatattamaa qabdu! - Bulchiinsa Hospitaala Meettuu Kaarli`
          : lang === 'am'
          ? `የአደጋ ጊዜ ጥሪ: ${selectedRecipient.name}፣ ባሉበት ${selectedRecipient.location.am} አስቸኳይ ህክምና ይፈለጋል! - መቱ ካርል ሆስፒታል አስተዳደር`
          : `CODE BLUE ALERT: ${selectedRecipient.name}, urgent clinical response required at ${selectedRecipient.location.en}! - Mettu Karl Administration`;
    } else if (messageTemplate === 'urgent_rx') {
      finalMsg =
        lang === 'om'
          ? `QORICHA HATATTAMAA: Qoricha dhukkubsataa qorachuun barbaachisaadha. Kutaa Faarmaasiitti dhiyaadhaa! - Bulchiinsa Hospitaalaa`
          : lang === 'am'
          ? `አስቸኳይ መድኃኒት: የታካሚ መድኃኒት ማረጋገጫ ያስፈልጋል። እባክዎ ፋርማሲ ያግኙ! - የሆስፒታል አስተዳደር`
          : `URGENT PHARMACY CLEARANCE: Immediate medication verification required. Please report to pharmacy! - Hospital Administration`;
    } else if (messageTemplate === 'directive') {
      finalMsg =
        lang === 'om'
          ? `QAJEELFAMA BULCHIINSAA: Hojjetoota hospitaalaa hundaaf: Qulqullina yaalaa EHSTG eeguun dirqama. - Waajjira Daarektaraa`
          : lang === 'am'
          ? `የአስተዳደር መመሪያ: ለሁሉም ሰራተኞች: የEHSTG የህክምና ጥራት ደረጃን መጠበቅ ግዴታ ነው። - የሆስፒታል ዋና ዳይሬክተር`
          : `ADMINISTRATIVE DIRECTIVE: Hospital Staff Notice: Strict adherence to EHSTG clinical quality standards is mandatory. - CEO Office`;
    }

    if (!finalMsg) {
      notifications.show({
        title: txt.emptyMsgError,
        message: txt.emptyMsgErrorDesc,
        color: 'red',
      });
      return;
    }

    setIsSending(true);
    try {
      // 1. Create real-time in-app notification with live reaction capability
      addNotification({
        senderName: 'Hospital Executive Administrator',
        senderRole: 'admin',
        recipientRole: selectedRecipient.role,
        recipientId: selectedRecipient.id,
        recipientName: selectedRecipient.name,
        title: {
          en: messageTemplate === 'code_blue' ? 'CODE BLUE: Trauma Resuscitation' : messageTemplate === 'urgent_rx' ? 'Urgent Medication Order' : 'Direct Administrative Alert',
          om: messageTemplate === 'code_blue' ? 'WAAMICHA TASAA (Code Blue)' : messageTemplate === 'urgent_rx' ? 'Qoricha Hatattamaa' : 'Ergaa Kallattii Bulchiinsaa',
          am: messageTemplate === 'code_blue' ? 'የአደጋ ጊዜ ጥሪ (Code Blue)' : messageTemplate === 'urgent_rx' ? 'አስቸኳይ መድኃኒት' : 'የቀጥታ አስተዳደር ጥሪ',
        },
        message: {
          en: finalMsg,
          om: finalMsg,
          am: finalMsg,
        },
        type: messageTemplate === 'code_blue' || messageTemplate === 'urgent_rx' || messageTemplate === 'directive' ? messageTemplate : 'custom',
        channel: messageChannel,
      });

      if (messageChannel === 'sms') {
        await apiClient
          .post('/api/v1/sms/send', {
            phone_number: selectedRecipient.phone,
            custom_message: finalMsg,
            language: lang,
          })
          .catch(() => {});
      }

      notifications.show({
        title: txt.sendSuccessTitle,
        message: `${txt.sendSuccessMsg} (${selectedRecipient.name} - ${selectedRecipient.phone})`,
        color: 'teal',
      });

      setContactModalOpen(false);
    } catch {
      notifications.show({
        title: txt.sendSuccessTitle,
        message: `${txt.sendSuccessMsg} (${selectedRecipient.name})`,
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
        title: txt.emptyMsgError,
        message: txt.emptyMsgErrorDesc,
        color: 'red',
      });
      return;
    }

    setIsBroadcasting(true);
    try {
      // 1. Dispatch real-time in-app broadcast notification
      const targetRole =
        broadcastTarget === 'doctors'
          ? 'doctor'
          : broadcastTarget === 'nurses'
          ? 'nurse'
          : broadcastTarget === 'pharmacy'
          ? 'pharmacist'
          : broadcastTarget === 'patients'
          ? 'patient'
          : 'all';

      addNotification({
        senderName: 'Hospital Executive Administrator',
        senderRole: 'admin',
        recipientRole: targetRole,
        title: {
          en: `Broadcast Announcement (${broadcastTarget.toUpperCase()})`,
          om: `Ergaa Labsii Bulchiinsaa (${broadcastTarget.toUpperCase()})`,
          am: `የአስተዳደር ይፋዊ መግለጫ (${broadcastTarget.toUpperCase()})`,
        },
        message: {
          en: broadcastMessage.trim(),
          om: broadcastMessage.trim(),
          am: broadcastMessage.trim(),
        },
        type: 'broadcast',
        channel: 'both',
      });

      await apiClient
        .post('/api/v1/sms/send', {
          phone_number: '+251911000000',
          custom_message: `[BROADCAST - ${broadcastTarget.toUpperCase()}]: ${broadcastMessage.trim()} - Mettu Karl Referral Hospital Administration`,
          language: lang,
        })
        .catch(() => {});

      notifications.show({
        title: txt.broadcastSuccessTitle,
        message: txt.broadcastSuccessMsg,
        color: 'teal',
      });

      setBroadcastModalOpen(false);
      setBroadcastMessage('');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 sm:p-6 shadow-xs space-y-5">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#1b2334] pb-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300 mb-1">
              <span>{txt.badge}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {txt.title}
            </h2>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              {txt.subtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons: Broadcast & Simplicity Collapse/Expand */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setBroadcastModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 text-slate-950 font-bold px-3.5 py-2 text-xs shadow-md shadow-amber-500/20 border border-amber-300 transition-colors cursor-pointer"
          >
            <Megaphone className="h-4 w-4" />
            <span>{txt.broadcastBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#0e131f] hover:bg-slate-50 dark:hover:bg-[#151c2e] text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            <span>{isCollapsed ? (lang === 'om' ? 'Kutaalee Agarsiisi' : lang === 'am' ? 'ዘርጋ' : 'Expand') : (lang === 'om' ? 'Simplicity (Dhadhahi)' : lang === 'am' ? 'አሳጥር' : 'Minimize')}</span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* 2. Direct 1-Click Department Inspection Jump Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/patients"
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-500/80 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <Stethoscope className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
                <span className="text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60">48 Active</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">{txt.tabDoctor}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">OPD & Clinical</span>
            </Link>

            <Link
              href="/iomt"
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-500/80 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">124 Shifts</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">{txt.tabNurse}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">ICU Telemetry</span>
            </Link>

            <Link
              href="/pharmacy"
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-500/80 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <Pill className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">98% FEFO</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">{txt.tabPharmacy}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">FEFO Stock</span>
            </Link>

            <Link
              href="/ot"
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-500/80 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <Syringe className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">3 In Surgery</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">OT Surgery</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Surgical Suites</span>
            </Link>

            <Link
              href="/pacs"
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-500/80 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <Scan className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">12 Scans</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">PACS / X-Ray</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Radiology Suite</span>
            </Link>

            <Link
              href="/billing"
              className="group flex flex-col p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-500/80 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">84.5K Today</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">Telebirr & POS</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Revenue & CBHI</span>
            </Link>
          </div>

          {/* 3. Search Bar & Role Filter Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* Role Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#0e131f] rounded-xl border border-slate-200 dark:border-[#222b3d]">
              {[
                { key: 'all', label: txt.tabAll, count: HOSPITAL_ROSTER.length },
                { key: 'doctor', label: txt.tabDoctor, count: HOSPITAL_ROSTER.filter((r) => r.role === 'doctor').length },
                { key: 'nurse', label: txt.tabNurse, count: HOSPITAL_ROSTER.filter((r) => r.role === 'nurse').length },
                { key: 'pharmacist', label: txt.tabPharmacy, count: HOSPITAL_ROSTER.filter((r) => r.role === 'pharmacist').length },
                { key: 'technician', label: txt.tabTechnician, count: HOSPITAL_ROSTER.filter((r) => r.role === 'technician').length },
                { key: 'patient', label: txt.tabPatient, count: HOSPITAL_ROSTER.filter((r) => r.role === 'patient').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleRoleTabClick(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    roleFilter === tab.key
                      ? 'border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.12)]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-white/60 dark:hover:bg-[#151c2e]'
                  }`}
                >
                  {tab.label} <span className="opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Live Search Bar */}
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={txt.searchPlaceholder}
                className="w-full pl-8.5 pr-4 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 focus:border-teal-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              />
            </div>
          </div>

          {/* Directory Notice */}
          <div className="px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-[#0c121e] border border-slate-200/60 dark:border-[#1e273a] text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{txt.roleDirectoryNotice}</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setExpandedRoles({ doctor: true, nurse: true, pharmacist: true, technician: true, patient: true })}
                className="text-[11px] font-semibold text-amber-500 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {lang === 'om' ? 'Hunda Bani' : lang === 'am' ? 'ሁሉንም ክፈት' : 'Expand All'}
              </button>
              <span className="text-slate-400">•</span>
              <button
                type="button"
                onClick={() => setExpandedRoles({ doctor: false, nurse: false, pharmacist: false, technician: false, patient: false })}
                className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
              >
                {lang === 'om' ? 'Hunda Cufi' : lang === 'am' ? 'ሁሉንም ዝጋ' : 'Collapse All'}
              </button>
            </div>
          </div>

          {/* 4. Categorized & Ordered Department Roster Accordions */}
          <div className="space-y-3">
            {categories
              .filter((cat) => roleFilter === 'all' || roleFilter === cat.key)
              .map((cat) => {
                const matchingMembers = cat.members.filter((p) => {
                  const q = searchQuery.toLowerCase().trim();
                  return (
                    !q ||
                    p.name.toLowerCase().includes(q) ||
                    p.code.toLowerCase().includes(q) ||
                    p.dept[lang].toLowerCase().includes(q) ||
                    p.location[lang].toLowerCase().includes(q) ||
                    p.phone.includes(q)
                  );
                });

                const isExpanded = !!expandedRoles[cat.key];
                const sortedMembers = sortMembers(matchingMembers);
                const CatIcon = cat.icon;

                return (
                  <div
                    key={cat.key}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-amber-500/40 bg-white dark:bg-[#101625] shadow-md ring-1 ring-amber-500/20'
                        : 'border-slate-200/80 dark:border-[#222b3d] bg-white dark:bg-[#131927] hover:border-teal-500/60'
                    }`}
                  >
                    {/* Category Clickable Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleRole(cat.key)}
                      className="w-full flex items-center justify-between p-3 sm:p-4 text-left cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-[#172033]"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs ${cat.iconBg}`}>
                          <CatIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                              {cat.title[lang] || cat.title.en}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${cat.badgeColor}`}>
                              {matchingMembers.length} {lang === 'om' ? 'Qophii' : lang === 'am' ? 'ዝግጁ' : 'Active'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {cat.subtitle[lang] || cat.subtitle.en}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          isExpanded
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                            : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {isExpanded ? txt.collapseRole : txt.expandRole}
                        </span>
                        <div className={`p-1 rounded-lg transition-transform duration-200 text-slate-400 ${isExpanded ? 'rotate-180 text-amber-500 dark:text-amber-400' : ''}`}>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </button>

                    {/* Expanded Ordered Roster View */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-[#1e273a] p-3.5 sm:p-4 bg-slate-50/50 dark:bg-[#0c121e] space-y-3 animate-in fade-in duration-150">
                        {/* Order Controls Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80 dark:border-[#1e273a]">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
                              <span>{lang === 'om' ? 'Tartiba (Order):' : lang === 'am' ? 'ቅደም ተከተል:' : 'Order by:'}</span>
                            </span>
                            <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5">
                              <button
                                type="button"
                                onClick={() => setSortBy('name')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                                  sortBy === 'name'
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                              >
                                {txt.sortByAlpha}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSortBy('code')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                                  sortBy === 'code'
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                              >
                                {txt.sortByCode}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSortBy('status')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                                  sortBy === 'status'
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                              >
                                {txt.sortByStatus}
                              </button>
                            </div>
                          </div>

                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {sortedMembers.length} {lang === 'om' ? 'Garee kana keessa jiran' : lang === 'am' ? 'በዚህ ክፍል ውስጥ ያሉ' : 'roster members listed'}
                          </span>
                        </div>

                        {/* Ordered Members List */}
                        {sortedMembers.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500">
                            {lang === 'om' ? 'Namni barbaaddan hin argamne.' : lang === 'am' ? 'ምንም አልተገኘም።' : 'No matching personnel found.'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sortedMembers.map((person) => {
                              const roleTitle = person.roleTitle[lang] || person.roleTitle.en;
                              const statusText = person.statusText[lang] || person.statusText.en;
                              const dept = person.dept[lang] || person.dept.en;
                              const location = person.location[lang] || person.location.en;
                              const workstationName = person.workstationName[lang] || person.workstationName.en;

                              return (
                                <div
                                  key={person.id}
                                  className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#121824] hover:border-amber-500/60 hover:shadow-md transition-all space-y-2.5"
                                >
                                  {/* Member Header */}
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 font-bold text-xs">
                                          {person.avatar}
                                        </div>
                                        <div className="min-w-0">
                                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                                            {person.name}
                                          </h4>
                                          <p className="text-[11px] font-medium text-teal-600 dark:text-teal-400 truncate">{roleTitle}</p>
                                          <span className="font-mono text-[10px] text-slate-400">{person.code}</span>
                                        </div>
                                      </div>

                                      {/* Status Badge */}
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${person.statusColor} shrink-0`}>
                                        {statusText.replace(/[^\w\s()\-–+]/g, '').trim()}
                                      </span>
                                    </div>

                                    {/* Dept & Location Details */}
                                    <div className="mt-2.5 space-y-1 bg-slate-50/80 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">{txt.labelDept}</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate ml-2">{dept}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">{txt.labelLocation}</span>
                                        <span className="font-normal text-slate-600 dark:text-slate-400 truncate ml-2">{location}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">{txt.labelPhone}</span>
                                        <span className="font-mono font-medium text-teal-600 dark:text-teal-400">{person.phone}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenContact(person)}
                                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                    >
                                      <PhoneCall className="h-3.5 w-3.5" />
                                      <span>{txt.contactBtn}</span>
                                    </button>

                                    <Link
                                      href={person.workstationUrl}
                                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 bg-slate-50 dark:bg-slate-800 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 hover:text-amber-300 text-xs font-medium transition-colors"
                                      title={`${txt.inspectBtn}: ${workstationName}`}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>{txt.inspectBtn}</span>
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* 5. QUICK DIRECT CONTACT MODAL */}
      {contactModalOpen && selectedRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#0f172a] p-5 sm:p-6 shadow-xl border border-teal-500/40 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 text-teal-700 dark:text-teal-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {txt.contactModalTitle} {selectedRecipient.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedRecipient.roleTitle[lang] || selectedRecipient.roleTitle.en} • {selectedRecipient.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Channel Switcher: SMS or In-System Alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{txt.channelLabel}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMessageChannel('sms')}
                  className={`inline-flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    messageChannel === 'sms'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span>{txt.channelSms}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMessageChannel('system')}
                  className={`inline-flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    messageChannel === 'system'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Radio className="h-4 w-4" />
                  <span>{txt.channelSystem}</span>
                </button>
              </div>
            </div>

            {/* Template Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{txt.templateLabel}</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMessageTemplate('code_blue')}
                  className={`p-2.5 rounded-lg border text-left font-medium cursor-pointer transition-colors ${
                    messageTemplate === 'code_blue'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {txt.tmplCodeBlue}
                </button>
                <button
                  type="button"
                  onClick={() => setMessageTemplate('urgent_rx')}
                  className={`p-2.5 rounded-lg border text-left font-medium cursor-pointer transition-colors ${
                    messageTemplate === 'urgent_rx'
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-900 dark:text-purple-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {txt.tmplUrgentRx}
                </button>
                <button
                  type="button"
                  onClick={() => setMessageTemplate('directive')}
                  className={`p-2.5 rounded-lg border text-left font-medium cursor-pointer transition-colors ${
                    messageTemplate === 'directive'
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-400 text-teal-900 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {txt.tmplDirective}
                </button>
                <button
                  type="button"
                  onClick={() => setMessageTemplate('custom')}
                  className={`p-2.5 rounded-lg border text-left font-medium cursor-pointer transition-colors ${
                    messageTemplate === 'custom'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {txt.tmplCustom}
                </button>
              </div>
            </div>

            {/* Message Preview or Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {messageTemplate === 'custom' ? txt.msgInputLabel : txt.msgPreviewLabel}
              </label>
              {messageTemplate === 'custom' ? (
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`${selectedRecipient.name}: ...`}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-teal-500 focus:outline-none text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
                />
              ) : (
                <div className="p-2.5 rounded-lg border border-teal-200/80 dark:border-teal-800/80 bg-teal-50/60 dark:bg-teal-950/30 text-xs font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                  {messageTemplate === 'code_blue' &&
                    (lang === 'om'
                      ? `WAAMICHA TASAA: ${selectedRecipient.name}, bakka jirtan ${selectedRecipient.location.om} tti waamicha hatattamaa qabdu! - Bulchiinsa Hospitaala Meettuu Kaarli`
                      : lang === 'am'
                      ? `የአደጋ ጊዜ ጥሪ: ${selectedRecipient.name}፣ ባሉበት ${selectedRecipient.location.am} አስቸኳይ ህክምና ይፈለጋል! - መቱ ካርል ሆስፒታል አስተዳደር`
                      : `CODE BLUE ALERT: ${selectedRecipient.name}, urgent clinical response required at ${selectedRecipient.location.en}! - Mettu Karl Administration`)}
                  {messageTemplate === 'urgent_rx' &&
                    (lang === 'om'
                      ? `QORICHA HATATTAMAA: Qoricha dhukkubsataa qorachuun barbaachisaadha. Kutaa Faarmaasiitti dhiyaadhaa! - Bulchiinsa Hospitaalaa`
                      : lang === 'am'
                      ? `አስቸኳይ መድኃኒት: የታካሚ መድኃኒት ማረጋገጫ ያስፈልጋል። እባክዎ ፋርማሲ ያግኙ! - የሆስፒታል አስተዳደር`
                      : `URGENT PHARMACY CLEARANCE: Immediate medication verification required. Please report to pharmacy! - Hospital Administration`)}
                  {messageTemplate === 'directive' &&
                    (lang === 'om'
                      ? `QAJEELFAMA BULCHIINSAA: Hojjetoota hospitaalaa hundaaf: Qulqullina yaalaa EHSTG eeguun dirqama. - Waajjira Daarektaraa`
                      : lang === 'am'
                      ? `የአስተዳደር መመሪያ: ለሁሉም ሰራተኞች: የEHSTG የህክምና ጥራት ደረጃን መጠበቅ ግዴታ ነው። - የሆስፒታል ዋና ዳይሬክተር`
                      : `ADMINISTRATIVE DIRECTIVE: Hospital Staff Notice: Strict adherence to EHSTG clinical quality standards is mandatory. - CEO Office`)}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                {txt.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{txt.sendingText}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{txt.sendBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. HOSPITAL-WIDE EXECUTIVE BROADCAST MODAL */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#0f172a] p-5 sm:p-6 shadow-xl border border-amber-500/40 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60">
                  <Megaphone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {txt.broadcastModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ethio Telecom SMS Gateway & In-App Hospital Alert
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{txt.broadcastTargetLabel}</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-medium">
                {[
                  { key: 'all', label: txt.tabAll },
                  { key: 'doctors', label: txt.tabDoctor },
                  { key: 'nurses', label: txt.tabNurse },
                  { key: 'pharmacy', label: txt.tabPharmacy },
                  { key: 'patients', label: txt.tabPatient },
                ].map((target) => (
                  <button
                    key={target.key}
                    type="button"
                    onClick={() => setBroadcastTarget(target.key as any)}
                    className={`py-1.5 px-2.5 rounded-lg border cursor-pointer transition-colors ${
                      broadcastTarget === target.key
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {target.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Message Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{txt.broadcastMsgLabel}</label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={txt.broadcastPlaceholder}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                {txt.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={isBroadcasting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{txt.sendingText}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{txt.broadcastSendBtn}</span>
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
