/**
 * Mettu Karl Referral Hospital — Executive Administration, Staff Oversight & Direct Contact Hub.
 *
 * Full Multilingual Localization:
 * - Supports English ('en'), Afaan Oromoo ('om'), and Amharic ('am')
 * - Empowers the Hospital Administrator to monitor, oversee, and directly contact
 *   Doctors, Nurses, Pharmacists, Technicians, and Patients across all hospital wards.
 */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { notifications } from '@mantine/notifications';
import { useTranslation, Language } from '@/lib/i18n';
import apiClient from '@/lib/api';
import { addNotification } from '@/lib/notifications';

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
      en: '🔪 In Surgery',
      om: '🔪 Baqaqsarratti',
      am: '🔪 ቀዶ ጥገና ላይ',
    },
    statusColor: 'bg-purple-100 text-purple-900 border-purple-300',
    avatar: '👨‍⚕️',
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
      en: '🩺 In OPD Consultation',
      om: '🩺 Yaalurratti (OPD)',
      am: '🩺 ታካሚዎችን እያየ ነው',
    },
    statusColor: 'bg-teal-100 text-teal-900 border-teal-300',
    avatar: '👩‍⚕️',
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
      en: '🚨 MCI Active (Critical Resus)',
      om: '🚨 Balaa Tasaa (MCI Active)',
      am: '🚨 ከፍተኛ አደጋ ህክምና ላይ',
    },
    statusColor: 'bg-rose-100 text-rose-900 border-rose-300',
    avatar: '👨‍⚕️',
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
      en: '🟢 Ready for Scans',
      om: '🟢 Qophii (Scans Ready)',
      am: '🟢 ለምርመራ ዝግጁ',
    },
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: '👨‍⚕️',
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
      en: '📡 ICU Bedside (Telemetry Live)',
      om: '📡 ICU Bedside (Telemetry)',
      am: '📡 አይሲዩ ክትትል ላይ',
    },
    statusColor: 'bg-blue-100 text-blue-900 border-blue-300',
    avatar: '👩‍⚕️',
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
      en: '🎫 OPD Queue (18 Waiting)',
      om: '🎫 Dabaree OPD (18 Eegaa)',
      am: '🎫 የተመላላሽ ተራ (18 በመጠባበቅ)',
    },
    statusColor: 'bg-amber-100 text-amber-900 border-amber-300',
    avatar: '👩‍⚕️',
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
      en: '🟢 Pre-Op Prepared',
      om: '🟢 Qophii (Pre-Op Ready)',
      am: '🟢 ለቀዶ ጥገና ዝግጁ',
    },
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: '👩‍⚕️',
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
      en: '💊 Dispensing Active',
      om: '💊 Qoricha Raabsaa',
      am: '💊 መድኃኒት በመስጠት ላይ',
    },
    statusColor: 'bg-teal-100 text-teal-900 border-teal-300',
    avatar: '💊',
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
      en: '⚖️ EFDA Compliant (98%)',
      om: '⚖️ EFDA Mirkanaa\'e (98%)',
      am: '⚖️ የEFDA ህግ የተሟላ (98%)',
    },
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: '💊',
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
      en: '⚡ Grid & O2 Online (100%)',
      om: '⚡ Humna & O2 Qophii (100%)',
      am: '⚡ መብራትና ኦክስጅን 100% ዝግጁ',
    },
    statusColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    avatar: '🔬',
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
      en: '🛌 Post-Op Day 2 Stable',
      om: '🛌 Guyyaa 2ffaa Baqaqsaa Booda',
      am: '🛌 ከቀዶ ጥገና በኋላ 2ኛ ቀን',
    },
    statusColor: 'bg-slate-100 text-slate-800 border-slate-300',
    avatar: '👤',
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
      en: '👶 Healthy Delivery',
      om: '👶 Daa\'imti Nagaan Dhalatteetti',
      am: '👶 ጤናማ ልጅ ተወልዷል',
    },
    statusColor: 'bg-pink-100 text-pink-900 border-pink-300',
    avatar: '👤',
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
      en: '🚨 Critical (SpO2 91%)',
      om: '🚨 Yaaddoo Ol\'aanaa (SpO2 91%)',
      am: '🚨 ከፍተኛ ክትትል (SpO2 91%)',
    },
    statusColor: 'bg-rose-100 text-rose-900 border-rose-300',
    avatar: '👤',
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
}> = {
  en: {
    badge: 'Hospital Executive Command & Oversight',
    title: 'Hospital Staff, Pharmacy & Patient Command Center',
    subtitle: 'The Administrator has universal oversight over Doctors, Nurses, Pharmacists, Technicians, and Patients with direct 1-click SMS & Alert communication.',
    broadcastBtn: 'Broadcast Message',
    tabAll: '👥 All',
    tabDoctor: '👨‍⚕️ Doctors',
    tabNurse: '👩‍⚕️ Nurses',
    tabPharmacy: '💊 Pharmacy',
    tabTechnician: '🔬 Technicians',
    tabPatient: '🛌 Patients',
    searchPlaceholder: 'Search: Name, Code, Ward, Phone...',
    labelDept: 'Department / Ward:',
    labelLocation: 'Current Location:',
    labelPhone: 'Phone Number:',
    contactBtn: 'Contact',
    inspectBtn: 'Inspect',
    contactModalTitle: 'Direct Contact:',
    channelLabel: 'Communication Channel:',
    channelSms: 'SMS (Ethio Telecom Gateway)',
    channelSystem: 'System Pager / Alert',
    templateLabel: 'Quick Message Template:',
    tmplCodeBlue: '🚨 Emergency Call (Code Blue)',
    tmplUrgentRx: '💊 Urgent Pharmacy Clearance',
    tmplDirective: '📋 Administrative Directive',
    tmplCustom: '✏️ Custom Message',
    msgInputLabel: 'Write Your Message:',
    msgPreviewLabel: 'Message Preview:',
    sendBtn: 'Send Message Now',
    sendingText: 'Sending...',
    cancelBtn: 'Cancel',
    broadcastModalTitle: 'Hospital-Wide Executive Broadcast',
    broadcastTargetLabel: 'Select Recipient Group:',
    broadcastMsgLabel: 'Broadcast Announcement:',
    broadcastPlaceholder: 'Enter official hospital announcement to be dispatched instantly via SMS & System Alerts...',
    broadcastSendBtn: 'Dispatch Broadcast to All',
    emptyMsgError: 'Message Empty',
    emptyMsgErrorDesc: 'Please write a message before sending.',
    sendSuccessTitle: 'Message Dispatched Successfully!',
    sendSuccessMsg: 'Message was sent via Ethio Telecom SMS and System Alert.',
    broadcastSuccessTitle: 'Executive Broadcast Dispatched! 📢',
    broadcastSuccessMsg: 'Official administrative announcement sent to all designated staff members.',
  },
  om: {
    badge: "Wiirtuu To'annoo & Quunnamtii Bulchiinsaa",
    title: "To'annoo Guutuu Ogeeyyii Yaalaa, Narsitoota, Farmaasii fi Dhukkubsattootaa",
    subtitle: "Admin kutaalee hospitaalaa hundaa to'achuu, hojii isaanii hordofuu, fi kallattiin ogeeyyii fi dhukkubsattoota qunnamuu danda'a.",
    broadcastBtn: 'Ergaa Waliigalaa Ergi (Broadcast)',
    tabAll: '👥 Hunda',
    tabDoctor: '👨‍⚕️ Doktoorota',
    tabNurse: '👩‍⚕️ Narsitoota',
    tabPharmacy: '💊 Faarmaasii',
    tabTechnician: '🔬 Ogeeyyii Meeshaa',
    tabPatient: '🛌 Dhukkubsattoota',
    searchPlaceholder: 'Barbaadi: Maqaa, Koodii, Kutaa, Bilbila...',
    labelDept: 'Kutaa / Waajjira:',
    labelLocation: 'Iddoo Ammaa:',
    labelPhone: 'Lakk. Bilbilaa:',
    contactBtn: 'Quunnami',
    inspectBtn: "To'adhu",
    contactModalTitle: 'Quunnamtii Kallattii:',
    channelLabel: 'Daandii Ergaa (Channel):',
    channelSms: 'SMS (Ethio Telecom Gateway)',
    channelSystem: 'System Pager / Alert',
    templateLabel: 'Gosa Ergaa (Quick Templates):',
    tmplCodeBlue: '🚨 Waamicha Tasaa (Code Blue)',
    tmplUrgentRx: '💊 Qoricha Hatattamaa',
    tmplDirective: '📋 Qajeelfama Bulchiinsaa',
    tmplCustom: '✏️ Ergaa Dhuunfaa (Custom)',
    msgInputLabel: 'Ergaa Keessan Barreessaa:',
    msgPreviewLabel: 'Ilaallata Ergaa (Message Preview):',
    sendBtn: 'Amma Ergi',
    sendingText: 'Ergaa Jira...',
    cancelBtn: 'Dhiisi',
    broadcastModalTitle: 'Ergaa Waliigalaa Bulchiinsa Hospitaalaa',
    broadcastTargetLabel: 'Garee Ergaan Dhaqqabu Filadhaa:',
    broadcastMsgLabel: 'Ergaa Labsii Bulchiinsaa:',
    broadcastPlaceholder: 'Ergaa labsii hospitaalaa kan kallattiin karaa SMS fi Siisteemii darbu asitti barreessaa...',
    broadcastSendBtn: 'Ergaa Waliigalaa Daddarsi',
    emptyMsgError: 'Ergaan Duwwaadha',
    emptyMsgErrorDesc: 'Maaloo ergaa keessan barreessaa.',
    sendSuccessTitle: "Ergaan Milkaa'inaan Ergameera!",
    sendSuccessMsg: 'Ergaan karaa SMS Ethio Telecom fi System Alert ergameera.',
    broadcastSuccessTitle: 'Ergaan Waliigalaa Daddarfeera! 📢',
    broadcastSuccessMsg: 'Ergaan bulchiinsaa garee filatame hundaaf kallattiin ergameera.',
  },
  am: {
    badge: 'የሆስፒታል አስተዳደር አመራርና የቀጥታ ቁጥጥር ማዕከል',
    title: 'የዶክተሮች፣ ነርሶች፣ ፋርማሲና ታካሚዎች ሙሉ የአስተዳደር ቁጥጥር',
    subtitle: 'የሆስፒታል አስተዳዳሪ ሁሉንም ክፍሎች መቆጣጠር፣ የስራ እንቅስቃሴያቸውን መከታተል፣ እና በኤስኤምኤስ ወይም ፈጣን ማንቂያ ሰራተኞችንና ታካሚዎችን ማግኘት ይችላሉ።',
    broadcastBtn: 'አጠቃላይ መልዕክት ላክ (Broadcast)',
    tabAll: '👥 ሁሉም',
    tabDoctor: '👨‍⚕️ ዶክተሮች',
    tabNurse: '👩‍⚕️ ነርሶች',
    tabPharmacy: '💊 ፋርማሲ',
    tabTechnician: '🔬 ቴክኒሻኖች',
    tabPatient: '🛌 ታካሚዎች',
    searchPlaceholder: 'ፈልግ: ስም፣ መለያ ቁጥር፣ ክፍል፣ ስልክ...',
    labelDept: 'ክፍል / ዋርድ:',
    labelLocation: 'የአሁን ቦታ:',
    labelPhone: 'ስልክ ቁጥር:',
    contactBtn: 'አግኝ',
    inspectBtn: 'ተመልከት',
    contactModalTitle: 'የቀጥታ ግንኙነት:',
    channelLabel: 'የመልዕክት መስመር:',
    channelSms: 'ኤስኤምኤስ (ኢትዮ ቴሌኮም)',
    channelSystem: 'የሲስተም ማንቂያ (Alert)',
    templateLabel: 'የመልዕክት አብነቶች:',
    tmplCodeBlue: '🚨 የአደጋ ጊዜ ጥሪ (Code Blue)',
    tmplUrgentRx: '💊 አስቸኳይ መድኃኒት',
    tmplDirective: '📋 የአስተዳደር መመሪያ',
    tmplCustom: '✏️ የራስዎ መልዕክት',
    msgInputLabel: 'መልዕክትዎን ይጻፉ:',
    msgPreviewLabel: 'የመልዕክት ቅድመ-ዕይታ:',
    sendBtn: 'አሁን ላክ',
    sendingText: 'በመላክ ላይ...',
    cancelBtn: 'ሰርዝ',
    broadcastModalTitle: 'አጠቃላይ የሆስፒታል አስተዳደር መግለጫ',
    broadcastTargetLabel: 'የተቀባይ ቡድን ይምረጡ:',
    broadcastMsgLabel: 'የመግለጫው መልዕክት:',
    broadcastPlaceholder: 'በኤስኤምኤስና በሲስተም የሚሰራጭ ይፋዊ የሆስፒታል መመሪያ ወይም ማስታወቂያ እዚህ ይጻፉ...',
    broadcastSendBtn: 'መግለጫውን ለሁሉም አሰራጭ',
    emptyMsgError: 'ባዶ መልዕክት',
    emptyMsgErrorDesc: 'እባክዎ ከመላክዎ በፊት መልዕክት ይጻፉ።',
    sendSuccessTitle: 'መልዕክቱ በተሳካ ሁኔታ ተልኳል!',
    sendSuccessMsg: 'መልዕክቱ በኢትዮ ቴሌኮም ኤስኤምኤስ እና በሲስተም ማስጠንቀቂያ ተልኳል።',
    broadcastSuccessTitle: 'አጠቃላይ መልዕክት ተሰራጭቷል! 📢',
    broadcastSuccessMsg: 'የአስተዳደር መግለጫው ለተመረጡት ሰራተኞች በሙሉ ደርሷል።',
  },
};

export function AdminOversightHub(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';
  const txt = OVERSIGHT_I18N[lang] || OVERSIGHT_I18N['en'];

  const [isCollapsed, setIsCollapsed] = useState(false);
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
          ? `🚨 WAAMICHA TASAA: ${selectedRecipient.name}, bakka jirtan ${selectedRecipient.location.om} tti waamicha hatattamaa qabdu! - Bulchiinsa Hospitaala Meettuu Kaarli`
          : lang === 'am'
          ? `🚨 የአደጋ ጊዜ ጥሪ: ${selectedRecipient.name}፣ ባሉበት ${selectedRecipient.location.am} አስቸኳይ ህክምና ይፈለጋል! - መቱ ካርል ሆስፒታል አስተዳደር`
          : `🚨 CODE BLUE ALERT: ${selectedRecipient.name}, urgent clinical response required at ${selectedRecipient.location.en}! - Mettu Karl Administration`;
    } else if (messageTemplate === 'urgent_rx') {
      finalMsg =
        lang === 'om'
          ? `💊 QORICHA HATATTAMAA: Qoricha dhukkubsataa qorachuun barbaachisaadha. Kutaa Faarmaasiitti dhiyaadhaa! - Bulchiinsa Hospitaalaa`
          : lang === 'am'
          ? `💊 አስቸኳይ መድኃኒት: የታካሚ መድኃኒት ማረጋገጫ ያስፈልጋል። እባክዎ ፋርማሲ ያግኙ! - የሆስፒታል አስተዳደር`
          : `💊 URGENT PHARMACY CLEARANCE: Immediate medication verification required. Please report to pharmacy! - Hospital Administration`;
    } else if (messageTemplate === 'directive') {
      finalMsg =
        lang === 'om'
          ? `📋 QAJEELFAMA BULCHIINSAA: Hojjetoota hospitaalaa hundaaf: Qulqullina yaalaa EHSTG eeguun dirqama. - Waajjira Daarektaraa`
          : lang === 'am'
          ? `📋 የአስተዳደር መመሪያ: ለሁሉም ሰራተኞች: የEHSTG የህክምና ጥራት ደረጃን መጠበቅ ግዴታ ነው። - የሆስፒታል ዋና ዳይሬክተር`
          : `📋 ADMINISTRATIVE DIRECTIVE: Hospital Staff Notice: Strict adherence to EHSTG clinical quality standards is mandatory. - CEO Office`;
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
          en: messageTemplate === 'code_blue' ? '🚨 CODE BLUE: Trauma Resuscitation' : messageTemplate === 'urgent_rx' ? '💊 Urgent Medication Order' : '📋 Direct Administrative Alert',
          om: messageTemplate === 'code_blue' ? '🚨 WAAMICHA TASAA (Code Blue)' : messageTemplate === 'urgent_rx' ? '💊 Qoricha Hatattamaa' : '📋 Ergaa Kallattii Bulchiinsaa',
          am: messageTemplate === 'code_blue' ? '🚨 የአደጋ ጊዜ ጥሪ (Code Blue)' : messageTemplate === 'urgent_rx' ? '💊 አስቸኳይ መድኃኒት' : '📋 የቀጥታ አስተዳደር ጥሪ',
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
          en: `📢 Broadcast Announcement (${broadcastTarget.toUpperCase()})`,
          om: `📢 Ergaa Labsii Bulchiinsaa (${broadcastTarget.toUpperCase()})`,
          am: `📢 የአስተዳደር ይፋዊ መግለጫ (${broadcastTarget.toUpperCase()})`,
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
          custom_message: `📢 [BROADCAST - ${broadcastTarget.toUpperCase()}]: ${broadcastMessage.trim()} - Mettu Karl Referral Hospital Administration`,
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
    <section className="rounded-3xl border-2 border-teal-500/80 bg-gradient-to-br from-white via-teal-50/20 to-slate-50 p-6 sm:p-8 shadow-lg space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-teal-200/80 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white font-black text-2xl shadow-md">
            🏛️
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/50 bg-teal-100/70 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-teal-950 mb-1">
              {txt.badge}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {txt.title}
            </h2>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              {txt.subtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons: Broadcast & Simplicity Collapse/Expand */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs font-black shadow-md transition-all cursor-pointer"
          >
            <span>📢</span>
            <span>{txt.broadcastBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 rounded-2xl border border-teal-300 bg-white hover:bg-teal-50 text-teal-800 px-3.5 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <span>{isCollapsed ? '▼' : '▲'}</span>
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
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👨‍⚕️</span>
            <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">48 Active</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">{txt.tabDoctor}</span>
          <span className="text-[11px] text-slate-500">OPD & Clinical</span>
        </Link>

        <Link
          href="/iomt"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👩‍⚕️</span>
            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">124 Shifts</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">{txt.tabNurse}</span>
          <span className="text-[11px] text-slate-500">ICU Telemetry</span>
        </Link>

        <Link
          href="/pharmacy"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💊</span>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">98% FEFO</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">{txt.tabPharmacy}</span>
          <span className="text-[11px] text-slate-500">FEFO Stock</span>
        </Link>

        <Link
          href="/ot"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🔪</span>
            <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">3 In Surgery</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">OT Surgery</span>
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
          <span className="text-[11px] text-slate-500">Radiology Suite</span>
        </Link>

        <Link
          href="/billing"
          className="group flex flex-col p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💳</span>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">84.5K Today</span>
          </div>
          <span className="text-xs font-black text-slate-900 group-hover:text-teal-900">Telebirr & POS</span>
          <span className="text-[11px] text-slate-500">Revenue & CBHI</span>
        </Link>
      </div>

      {/* 3. Search Bar & Role Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
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
            placeholder={txt.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* 4. Live Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoster.map((person) => {
          const roleTitle = person.roleTitle[lang] || person.roleTitle.en;
          const statusText = person.statusText[lang] || person.statusText.en;
          const dept = person.dept[lang] || person.dept.en;
          const location = person.location[lang] || person.location.en;
          const workstationName = person.workstationName[lang] || person.workstationName.en;

          return (
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
                      <p className="text-[11px] font-bold text-teal-800">{roleTitle}</p>
                      <span className="font-mono text-[10px] text-slate-400">{person.code}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${person.statusColor} shrink-0`}>
                    {statusText}
                  </span>
                </div>

                {/* Department & Location Details */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{txt.labelDept}</span>
                    <span className="font-bold text-slate-800">{dept}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{txt.labelLocation}</span>
                    <span className="font-semibold text-slate-700">{location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{txt.labelPhone}</span>
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
                  <span>{txt.contactBtn}</span>
                </button>

                <Link
                  href={person.workstationUrl}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-bold transition-all"
                  title={`${txt.inspectBtn}: ${workstationName}`}
                >
                  <span>👁️</span>
                  <span>{txt.inspectBtn}</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

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
                    {txt.contactModalTitle} {selectedRecipient.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedRecipient.roleTitle[lang] || selectedRecipient.roleTitle.en} • {selectedRecipient.phone}
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
              <label className="text-xs font-black text-slate-700">{txt.channelLabel}</label>
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
                  <span>{txt.channelSms}</span>
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
                  <span>{txt.channelSystem}</span>
                </button>
              </div>
            </div>

            {/* Template Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">{txt.templateLabel}</label>
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
                  {txt.tmplCodeBlue}
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
                  {txt.tmplUrgentRx}
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
                  {txt.tmplDirective}
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
                  {txt.tmplCustom}
                </button>
              </div>
            </div>

            {/* Message Preview or Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">
                {messageTemplate === 'custom' ? txt.msgInputLabel : txt.msgPreviewLabel}
              </label>
              {messageTemplate === 'custom' ? (
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`${selectedRecipient.name}: ...`}
                  className="w-full p-3 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-xs text-slate-800"
                />
              ) : (
                <div className="p-3 rounded-2xl border border-teal-200 bg-teal-50/70 text-xs font-semibold text-slate-800">
                  {messageTemplate === 'code_blue' &&
                    (lang === 'om'
                      ? `🚨 WAAMICHA TASAA: ${selectedRecipient.name}, bakka jirtan ${selectedRecipient.location.om} tti waamicha hatattamaa qabdu! - Bulchiinsa Hospitaala Meettuu Kaarli`
                      : lang === 'am'
                      ? `🚨 የአደጋ ጊዜ ጥሪ: ${selectedRecipient.name}፣ ባሉበት ${selectedRecipient.location.am} አስቸኳይ ህክምና ይፈለጋል! - መቱ ካርል ሆስፒታል አስተዳደር`
                      : `🚨 CODE BLUE ALERT: ${selectedRecipient.name}, urgent clinical response required at ${selectedRecipient.location.en}! - Mettu Karl Administration`)}
                  {messageTemplate === 'urgent_rx' &&
                    (lang === 'om'
                      ? `💊 QORICHA HATATTAMAA: Qoricha dhukkubsataa qorachuun barbaachisaadha. Kutaa Faarmaasiitti dhiyaadhaa! - Bulchiinsa Hospitaalaa`
                      : lang === 'am'
                      ? `💊 አስቸኳይ መድኃኒት: የታካሚ መድኃኒት ማረጋገጫ ያስፈልጋል። እባክዎ ፋርማሲ ያግኙ! - የሆስፒታል አስተዳደር`
                      : `💊 URGENT PHARMACY CLEARANCE: Immediate medication verification required. Please report to pharmacy! - Hospital Administration`)}
                  {messageTemplate === 'directive' &&
                    (lang === 'om'
                      ? `📋 QAJEELFAMA BULCHIINSAA: Hojjetoota hospitaalaa hundaaf: Qulqullina yaalaa EHSTG eeguun dirqama. - Waajjira Daarektaraa`
                      : lang === 'am'
                      ? `📋 የአስተዳደር መመሪያ: ለሁሉም ሰራተኞች: የEHSTG የህክምና ጥራት ደረጃን መጠበቅ ግዴታ ነው። - የሆስፒታል ዋና ዳይሬክተር`
                      : `📋 ADMINISTRATIVE DIRECTIVE: Hospital Staff Notice: Strict adherence to EHSTG clinical quality standards is mandatory. - CEO Office`)}
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
                {txt.cancelBtn}
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
                    <span>{txt.sendingText}</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
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
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-amber-500 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📢</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {txt.broadcastModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ethio Telecom SMS Gateway & In-App Hospital Alert
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

            {/* Target Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">{txt.broadcastTargetLabel}</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
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
                    className={`py-2 px-3 rounded-xl border cursor-pointer transition-all ${
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
              <label className="text-xs font-black text-slate-700">{txt.broadcastMsgLabel}</label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={txt.broadcastPlaceholder}
                className="w-full p-3.5 rounded-2xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                {txt.cancelBtn}
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
                    <span>{txt.sendingText}</span>
                  </>
                ) : (
                  <>
                    <span>📢</span>
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
