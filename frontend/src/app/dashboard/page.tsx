/**
 * Mettu Karl Referral Hospital — Clinical Executive Command Dashboard.
 *
 * Full Multilingual Localization:
 * - Default Language: English ('en')
 * - Complete Tri-Lingual Support across English ('en'), Afaan Oromoo ('om'), and Amharic ('am')
 * - All 27 Workstations, Category Tabs, Situational Awareness tiles, Greeting bar,
 *   Role Scope notices, and Emergency Action Hub dynamically translate on selection.
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation, Language } from '@/lib/i18n';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AdminOversightHub } from '@/components/admin/AdminOversightHub';
import type { UserRole } from '@/types';

interface LocalizedText {
  en: string;
  om: string;
  am: string;
}

interface Workstation {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  href: string;
  icon: string;
  badge?: LocalizedText;
  badgeColor?: string;
  category: 'emergency' | 'clinical' | 'operations' | 'governance';
  allowedRoles?: UserRole[];
}

const ROLE_DESCRIPTIONS: Record<string, Record<Language, { title: string; desc: string }>> = {
  admin: {
    en: {
      title: 'Hospital Executive Oversight & Contact Hub',
      desc: 'All hospital departments (Doctors, Nurses, Pharmacy, Inpatients, and Finance) are under executive oversight. You have full administrative permission to inspect, direct, and contact staff.',
    },
    om: {
      title: "To'annoo fi Quunnamtii Bulchiinsa Hospitaalaa",
      desc: "Kutaaleen hospitaalaa hundi (Ogeeyyii Yaalaa, Narsitoota, Farmaasii, Dhukkubsattoota, fi Faayinaansii) to'annoo keessan jala jiru. Kallattiin to'achuu, hordofuu fi qunnamuuf qophiidha.",
    },
    am: {
      title: 'የሆስፒታል አስተዳደር ቁጥጥርና የቀጥታ ግንኙነት ማዕከል',
      desc: 'ሁሉም የሆስፒታል ክፍሎች (ዶክተሮች፣ ነርሶች፣ ፋርማሲ፣ ተኝቶ ታካሚዎች እና ፋይናንስ) በእርስዎ ሙሉ ቁጥጥር ስር ናቸው። በቀጥታ የመቆጣጠርና የመገናኘት ሙሉ ስልጣን አለዎት።',
    },
  },
  doctor: {
    en: {
      title: 'Clinical Care & CDSS Workstations',
      desc: 'Patient electronic records, OPD consultation queue, drug-drug interaction alerts, and surgical theater schedules are active.',
    },
    om: {
      title: 'Kiliinikaa & CDSS Hojiirra',
      desc: "Galmee dhukkubsattootaa, OPD, qorannoo qorichaa, fi baqaqsanii yaaluu qofti ifa ta'aniiru. Herregni baankii/HRM roolii kanaan hin hayyamamu.",
    },
    am: {
      title: 'ክሊኒካል ህክምና እና የህክምና ውሳኔ ድጋፍ',
      desc: 'የታካሚዎች መዝገብ፣ የተመላላሽ ህክምና፣ የመድኃኒት ምርመራ እና የቀዶ ህክምና ክፍሎች ክፍት ናቸው።',
    },
  },
  nurse: {
    en: {
      title: 'Emergency Care & Inpatient Telemetry',
      desc: 'Patient health records, OPD triage queue, ICU bedside telemetry, and inpatient dietary nutrition plans are accessible.',
    },
    om: {
      title: 'Yaala Saffisaa & ICU Hojiirra',
      desc: "Galmee dhukkubsattootaa, dabaree OPD, ICU Telemetry, fi nyaanni dhukkubsattootaa ifa ta'aniiru.",
    },
    am: {
      title: 'የነርሲንግ እንክብካቤ እና የአይሲዩ ክትትል',
      desc: 'የተኙ ታካሚዎች መዝገብ፣ የድንገተኛ ክፍል ትሪያጅ፣ የአይሲዩ ሞኒተሪንግ እና የተመጣጠነ ምግብ ዝግጅት ክፍት ናቸው።',
    },
  },
  pharmacist: {
    en: {
      title: 'Pharmacy & Drug Inventory (FEFO)',
      desc: 'First-Expiry First-Out inventory, prescription dispensing, and EFDA adverse drug reaction reporting are accessible.',
    },
    om: {
      title: 'Farmaasii & Qoricha Hojiirra',
      desc: "Kuusaa FEFO, kenniinsa qorichaa, fi nageenyi qorichaa EFDA ifa ta'aniiru.",
    },
    am: {
      title: 'የመድኃኒት አደልደል እና የክምችት ቁጥጥር',
      desc: 'የመድኃኒት ስርጭት፣ የክምችት ቁጥጥር (FEFO) እና የኢትዮጵያ መድኃኒት ባለስልጣን (EFDA) ክትትል ክፍት ናቸው።',
    },
  },
  insurance_officer: {
    en: {
      title: 'CBHI Health Insurance & Claims',
      desc: 'Community-Based Health Insurance claims, Fayda digital ID verification, and billing reconciliation are active.',
    },
    om: {
      title: 'Inshuraansii & Kaffaltii Hojiirra',
      desc: "Gaaffilee inshuraansii CBHI/EHIA, Fayda ID, fi kaffaltiileen ifa ta'aniiru.",
    },
    am: {
      title: 'የጤና መድህን እና የክፍያ ማረጋገጫ',
      desc: 'የህብረተሰብ ጤና መድህን (CBHI)፣ የፋይዳ መታወቂያ ማረጋገጫ እና የክፍያ ስራዎች ክፍት ናቸው።',
    },
  },
  technician: {
    en: {
      title: 'Biomedical & Hospital Infrastructure',
      desc: 'Biomedical assets uptime, solar/power resilience grid, and PACS radiology equipment are active.',
    },
    om: {
      title: 'Biomedical & Infrastructure Hojiirra',
      desc: "Meeshaalee yaalaa, humna ibsaa/soolaarii, fi meeshaalee PACS ifa ta'aniiru.",
    },
    am: {
      title: 'የህክምና መሳሪያዎች እና መሰረተ-ልማት ጥገና',
      desc: 'የህክምና መሳሪያዎች ቁጥጥር፣ የሆስፒታል መብራትና ሶላር፣ እና የራዲዮሎጂ ሲስተም ክፍት ናቸው።',
    },
  },
  super_admin: {
    en: {
      title: 'Hospital Master Administration',
      desc: 'Complete universal access granted across all 27 clinical, emergency, operations, and governance workstations.',
    },
    om: {
      title: "Bulchiinsa Ol'aanaa Hospitaalaa",
      desc: "Kutaaleen hospitaalaa hundi guutummaatti ifa ta'anii jiru.",
    },
    am: {
      title: 'የበላይ የሆስፒታል አስተዳደር',
      desc: 'ለሁሉም የህክምና፣ የስራ ማስኬጃ እና የህግ ክፍሎች ሙሉ ፈቃድ ተሰጥቷል።',
    },
  },
};

const SITUATIONAL_I18N: Record<Language, {
  sectionTitle: string;
  sensorBadge: string;
  bedTitle: string;
  bedOccupancy: string;
  bedTotal: string;
  bedAvail: string;
  bedIcu: string;
  edTitle: string;
  edBadge: string;
  edSub: string;
  o2Title: string;
  o2Badge: string;
  o2Pipeline: string;
  o2LowStock: string;
  o2Days: string;
  o2Total: string;
  powerTitle: string;
  powerBadge: string;
  powerSolar: string;
  powerGen: string;
  powerSwitch: string;
}> = {
  en: {
    sectionTitle: 'Hospital Situational Awareness',
    sensorBadge: 'Live Clinical Sensors Active',
    bedTitle: 'Bed Capacity (BOR)',
    bedOccupancy: '85% Occupancy',
    bedTotal: '/ 400 Total Beds',
    bedAvail: '60 Beds Available',
    bedIcu: 'ICU: 4 Free',
    edTitle: 'Emergency ED Triage',
    edBadge: '63 In ED',
    edSub: '3 Acute Resuscitations active',
    o2Title: 'Blood & Oxygen',
    o2Badge: 'Stable',
    o2Pipeline: 'O₂ Pipeline',
    o2LowStock: 'O-Neg (Low Stock)',
    o2Days: '14 Days Liquid O₂',
    o2Total: '124 Units Total',
    powerTitle: 'Power & Grid',
    powerBadge: '100% Online',
    powerSolar: 'EEU Grid + 120kW Solar',
    powerGen: 'Dual 500kVA Diesel (94% Ready)',
    powerSwitch: 'Auto-switch: <10s ready',
  },
  om: {
    sectionTitle: 'Haala Yeroo Ammaa Hospitaalaa',
    sensorBadge: 'Mallattoolee Yaalaa Kallattiin Hojjatu',
    bedTitle: 'Dandeettii Siree (BOR)',
    bedOccupancy: '85% Qabameera',
    bedTotal: '/ Waliigala Siree 400',
    bedAvail: 'Sireewwan 60 Duwwaa',
    bedIcu: 'ICU: 4 Duwwaa',
    edTitle: 'Balaa Tasaa (ED Triage)',
    edBadge: '63 Kutaa Tasaatti',
    edSub: '3 Yaala Dhaabbachuu Lubbuu',
    o2Title: 'Dhiiga & Oksijiinii',
    o2Badge: "Tasgabbaa'aa",
    o2Pipeline: 'Ujummoo Oksijiinii',
    o2LowStock: 'O-Neg (Hanqina Qaba)',
    o2Days: "Oksijiinii Guyyaa 14",
    o2Total: 'Waliigala Yuunitii 124',
    powerTitle: 'Ibsaa & Humna Elektiriikii',
    powerBadge: '100% Hojjira',
    powerSolar: 'Sarara EEU + 120kW Soolaarii',
    powerGen: 'Jenereetara 500kVA (94% Qophii)',
    powerSwitch: 'Ofumaan jijjiirama: <10s',
  },
  am: {
    sectionTitle: 'የሆስፒታል ወቅታዊ የቁጥጥር ሁኔታ',
    sensorBadge: 'የቀጥታ ሴንሰሮች በስራ ላይ',
    bedTitle: 'የአልጋ ብዛት (BOR)',
    bedOccupancy: '85% የተያዘ',
    bedTotal: '/ 400 አጠቃላይ አልጋዎች',
    bedAvail: '60 ክፍት አልጋዎች',
    bedIcu: 'አይሲዩ: 4 ክፍት',
    edTitle: 'የድንገተኛ ክፍል ትሪያጅ',
    edBadge: '63 ድንገተኛ ክፍል ውስጥ',
    edSub: '3 ከፍተኛ ድንገተኛ ህክምና',
    o2Title: 'ደም እና ኦክስጅን',
    o2Badge: 'የተረጋጋ',
    o2Pipeline: 'የኦክስጅን መስመር',
    o2LowStock: 'ኦ-ኔጌቲቭ (አናሳ ክምችት)',
    o2Days: 'የ14 ቀናት ፈሳሽ ኦክስጅን',
    o2Total: '124 አጠቃላይ ክፍሎች',
    powerTitle: 'የመብራት ኃይል',
    powerBadge: '100% በስራ ላይ',
    powerSolar: 'የኢትዮጵያ መብራት + 120kW ሶላር',
    powerGen: '500kVA ጀነሬተር (94% ዝግጁ)',
    powerSwitch: 'ራስ-ሰር መቀየሪያ: <10 ሰከንድ',
  },
};

const GREETING_I18N: Record<Language, {
  shift: string;
  catchment: string;
  emergencyAction: string;
  rolePrefix: string;
  systemAdmin: string;
  scopedCount: string;
  executiveActive: string;
  rbacActive: string;
  openWorkstation: string;
  noFound: string;
}> = {
  en: {
    shift: 'Active Shift: Morning Duty (08:00 - 16:00)',
    catchment: 'Catchment: 2.5M',
    emergencyAction: 'Emergency Action',
    rolePrefix: 'Role: ',
    systemAdmin: 'System Administrator',
    scopedCount: 'Workstations Available: ',
    executiveActive: 'Executive Governance Active',
    rbacActive: 'Role Governance Active',
    openWorkstation: 'Open Workstation',
    noFound: 'No workstations found matching',
  },
  om: {
    shift: 'Shiftii Hojii: Hojii Ganamaa (08:00 - 16:00)',
    catchment: 'Ummata Tajaajilamu: 2.5M',
    emergencyAction: 'Tarkaanfii Hatattamaa',
    rolePrefix: 'Gahee Hojii: ',
    systemAdmin: 'Bulchaa Sirnaa',
    scopedCount: 'Kutaalee Argaman: ',
    executiveActive: 'Hoggansi Bulchiinsaa Hojjira',
    rbacActive: 'To\'annoo Roolii Hojjira',
    openWorkstation: 'Kutaa Bani',
    noFound: 'Kutaan walsimu hin argamne',
  },
  am: {
    shift: 'የስራ ሰዓት: የጠዋት ስራ (08:00 - 16:00)',
    catchment: 'የአገልግሎት ህዝብ: 2.5 ሚሊዮን',
    emergencyAction: 'የአደጋ ጊዜ እርምጃ',
    rolePrefix: 'የስራ ድርሻ: ',
    systemAdmin: 'የሲስተም አስተዳዳሪ',
    scopedCount: 'የተገኙ ክፍሎች: ',
    executiveActive: 'የአመራር ቁጥጥር በርቷል',
    rbacActive: 'የስራ ድርሻ ቁጥጥር በርቷል',
    openWorkstation: 'ክፍሉን ክፈት',
    noFound: 'ምንም ክፍል አልተገኘም',
  },
};

const EMERGENCY_MODAL_I18N: Record<Language, {
  title: string;
  codeBlue: string;
  codeBlueDesc: string;
  mci: string;
  mciDesc: string;
  ems: string;
  emsDesc: string;
  fastIntake: string;
  fastIntakeDesc: string;
  close: string;
  activeCodeBlue: string;
  activeCodeBlueDesc: string;
  clear: string;
}> = {
  en: {
    title: 'Emergency Rapid Action Hub',
    codeBlue: 'CODE BLUE',
    codeBlueDesc: 'Cardiac Arrest Resuscitation',
    mci: 'MASS CASUALTY (MCI)',
    mciDesc: 'START Disaster Protocol',
    ems: '907 Ambulance',
    emsDesc: 'Dispatch Vehicle',
    fastIntake: 'Fast Intake',
    fastIntakeDesc: 'Register Walk-in Patient',
    close: 'Close',
    activeCodeBlue: 'Active CODE BLUE: Resuscitation Team Dispatched',
    activeCodeBlueDesc: 'Crash Cart #2 en route to ED Acute Resuscitation Bed 01',
    clear: 'Clear',
  },
  om: {
    title: 'Wiirtuu Tarkaanfii Hatattamaa',
    codeBlue: 'KOODII CUQULIISA (CODE BLUE)',
    codeBlueDesc: 'Dhaabbachuu Onnee fi Lubbuu Baraaruu',
    mci: 'BALAA GUDDAA (MCI)',
    mciDesc: 'Pirootokoolii START Balaa Tasaa',
    ems: 'Ambulaansii 907',
    emsDesc: 'Konkolaataa Hatattamaa Bobbaasi',
    fastIntake: 'Galmee Hatattamaa',
    fastIntakeDesc: 'Dhukkubsataa Haaraa Galmeessi',
    close: 'Cufi',
    activeCodeBlue: 'KOODIIN CUQULIISI HOJIIRRA JIRA: Gareen Yaalaa Bobba\'eera',
    activeCodeBlueDesc: 'Gaariin Qorichaa #2 gara Siree Tasaa 01 deemaa jira',
    clear: 'Balleessi',
  },
  am: {
    title: 'የአደጋ ጊዜ ፈጣን እርምጃ ማዕከል',
    codeBlue: 'ኮድ ብሉ (CODE BLUE)',
    codeBlueDesc: 'የልብ ህመም አደጋ ህክምና',
    mci: 'ከፍተኛ አደጋ (MCI)',
    mciDesc: 'የSTART የአደጋ ጊዜ ደንብ',
    ems: '907 አምቡላንስ',
    emsDesc: 'ተሽከርካሪ ስምሪት',
    fastIntake: 'ፈጣን ምዝገባ',
    fastIntakeDesc: 'አዲስ ታካሚ በፍጥነት መመዝገብ',
    close: 'ዝጋ',
    activeCodeBlue: 'ኮድ ብሉ በርቷል: የአደጋ ጊዜ ህክምና ቡድን ተሰማርቷል',
    activeCodeBlueDesc: 'የህክምና ጋሪ #2 ወደ ድንገተኛ ክፍል አልጋ 01 እየሄደ ነው',
    clear: 'አጽዳ',
  },
};

export default function DashboardPage(): React.ReactElement {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();

  // Active locale safe fallback
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  // Workflow Category Tab
  const [activeTab, setActiveTab] = useState<'all' | 'emergency' | 'clinical' | 'operations' | 'governance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [activeCodeBlue, setActiveCodeBlue] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role === 'patient') {
        router.replace('/patient-portal');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'am' ? 'am-ET' : 'om-ET', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  // All 27 Hospital Workstations with Tri-Lingual Titles, Subtitles, and Badges
  const workstations: Workstation[] = useMemo(
    () => [
      // 1. Emergency & Critical Care
      {
        id: 'patients',
        title: {
          en: 'Patients (FHIR R4)',
          om: 'Galmee Dhukkubsattootaa',
          am: 'የታካሚዎች መዝገብ (FHIR R4)',
        },
        subtitle: {
          en: 'Inpatient & Outpatient Records',
          om: 'Galmee Yaala Keessaa fi Alaa',
          am: 'የተኝቶና የተመላላሽ ታካሚዎች መዝገብ',
        },
        href: '/patients',
        icon: '👥',
        badge: {
          en: '340 Inpatients',
          om: 'Dhukkubsattoota 340',
          am: '340 ተኝቶ ታካሚዎች',
        },
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
      },
      {
        id: 'queue',
        title: {
          en: 'Queue & Token TV',
          om: "To'annoo Dabaree OPD",
          am: 'የተራ ቁጥርና ቶከን ቲቪ',
        },
        subtitle: {
          en: 'OPD Smart Waiting Display',
          om: 'Agarsiisa Tikkeettii fi Dabaree',
          am: 'የተመላላሽ ታካሚዎች መጠበቂያ',
        },
        href: '/queue',
        icon: '🎫',
        badge: {
          en: '18 Waiting',
          om: '18 Eegaa Jiru',
          am: '18 በመጠባበቅ ላይ',
        },
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'receptionist', 'super_admin'],
      },
      {
        id: 'mci',
        title: {
          en: 'MCI & START Triage',
          om: 'Balaa Tasaa (MCI)',
          am: 'የድንገተኛ አደጋ ትሪያጅ (MCI)',
        },
        subtitle: {
          en: 'Mass Casualty Incident Command',
          om: 'Triage Hatattamaa fi Balaa Guddaa',
          am: 'የከፍተኛ አደጋ መቆጣጠሪያ',
        },
        href: '/mci',
        icon: '🚨',
        badge: {
          en: '3 Red Active',
          om: '3 Sadarkaa Diimaa',
          am: '3 ቀይ ደረጃ',
        },
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
      },
      {
        id: 'blood-bank',
        title: {
          en: 'Blood Bank & Stock',
          om: 'Kuusaa Dhiigaa',
          am: 'የደም ባንክና ክምችት',
        },
        subtitle: {
          en: 'Reserves & Cross-Matching',
          om: 'Kuusaa fi Qorannoo Dhiigaa',
          am: 'የደም ክምችትና ምርመራ',
        },
        href: '/blood-bank',
        icon: '🩸',
        badge: {
          en: 'O- Low Stock',
          om: 'O- Hanqina Qaba',
          am: 'ኦ-ኔጌቲቭ አናሳ ነው',
        },
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'technician', 'super_admin'],
      },
      {
        id: 'ems',
        title: {
          en: '907 EMS Ambulance',
          om: 'Ambulaansii 907',
          am: '907 አምቡላንስ',
        },
        subtitle: {
          en: 'GPS Fleet & Dispatch',
          om: 'Hordoffii Ambulaansii fi Hatattamaa',
          am: 'የአምቡላንስና ድንገተኛ ስምሪት',
        },
        href: '/ems',
        icon: '🚑',
        badge: {
          en: '4 Ready',
          om: '4 Qophiidha',
          am: '4 ዝግጁ ናቸው',
        },
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
      },
      {
        id: 'iomt',
        title: {
          en: 'IoMT ICU Telemetry',
          om: 'Mallattoo Lubbuu ICU',
          am: 'አይሲዩ ቴሌሜትሪ (IoMT)',
        },
        subtitle: {
          en: 'Smart Bedside Vital Monitors',
          om: 'Hordoffii Siree ICU Kallattiin',
          am: 'የቀጥታ የህመምተኛ ክትትል',
        },
        href: '/iomt',
        icon: '📡',
        badge: {
          en: '18 Live Beds',
          om: 'Sireewwan 18 Live',
          am: '18 አልጋዎች በቀጥታ',
        },
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'emergency',
        allowedRoles: ['doctor', 'nurse', 'technician', 'super_admin'],
      },

      // 2. Clinical Care & Diagnostics
      {
        id: 'pharmacy',
        title: {
          en: 'Pharmacy & FEFO',
          om: 'Farmaasii fi Qoricha',
          am: 'ፋርማሲና መድኃኒት',
        },
        subtitle: {
          en: 'Dispensing & Stock Management',
          om: 'Raabsa fi Kuusaa Qorichaa',
          am: 'የመድኃኒት አደልደልና ክምችት',
        },
        href: '/pharmacy',
        icon: '💊',
        badge: {
          en: '98% Stocked',
          om: '98% Guutuudha',
          am: '98% የተሟላ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'clinical',
        allowedRoles: ['pharmacist', 'doctor', 'super_admin'],
      },
      {
        id: 'pacs',
        title: {
          en: 'PACS & Radiology',
          om: 'Suuraa X-Ray / CT',
          am: 'ራዲዮሎጂና ኤክስሬይ (PACS)',
        },
        subtitle: {
          en: 'DICOM Viewer CT / MRI / X-Ray',
          om: 'Ilaaltuu Suuraa PACS fi Raadiyooloojii',
          am: 'የሲቲ ስካን እና ኤክስሬይ ምርመራ',
        },
        href: '/pacs',
        icon: '🩻',
        badge: {
          en: '12 Scans Ready',
          om: '12 Suuraan Qophiidha',
          am: '12 ምርመራዎች ዝግጁ',
        },
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'clinical',
        allowedRoles: ['doctor', 'technician', 'super_admin'],
      },
      {
        id: 'ot',
        title: {
          en: 'OT Surgery & CSSD',
          om: 'Kutaa Baqaqsanii Yaaluu',
          am: 'የቀዶ ጥገና ክፍል (OT & CSSD)',
        },
        subtitle: {
          en: 'Operating Theaters & Sterilization',
          om: 'Suursa Baqaqsaa fi Qulqulleessa CSSD',
          am: 'የቀዶ ህክምና እና ማምከኛ ክፍል',
        },
        href: '/ot',
        icon: '🔪',
        badge: {
          en: '3 In Surgery',
          om: '3 Baqaqsarratti',
          am: '3 ቀዶ ጥገና ላይ',
        },
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
        category: 'clinical',
        allowedRoles: ['doctor', 'nurse', 'super_admin'],
      },
      {
        id: 'telemed',
        title: {
          en: 'Telemedicine Video',
          om: 'Yaala Fagoo Vidiyoo',
          am: 'የቴሌሜዲሲን ቪዲዮ',
        },
        subtitle: {
          en: 'Remote Clinical Consultation',
          om: 'Marii Ogeeyyii Yaalaa Fagoo',
          am: 'የሩቅ የህክምና ምክክር',
        },
        href: '/telemed',
        icon: '🩺',
        badge: {
          en: 'Online',
          om: 'Toora Irra Jira',
          am: 'በመስመር ላይ',
        },
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        category: 'clinical',
        allowedRoles: ['doctor', 'super_admin'],
      },
      {
        id: 'dietary',
        title: {
          en: 'Dietary & Kitchen',
          om: 'Nyaata Dhukkubsattootaa',
          am: 'የታካሚዎች ምግብና ስነ-ምግብ',
        },
        subtitle: {
          en: 'Inpatient Nutrition & Meal Plans',
          om: 'Soorata fi Nyaata Yaalaa',
          am: 'የተመጣጠነ ምግብ ዝግጅት',
        },
        href: '/dietary',
        icon: '🍲',
        badge: {
          en: '340 Meals',
          om: 'Soorata 340',
          am: '340 ምግቦች',
        },
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        category: 'clinical',
        allowedRoles: ['nurse', 'admin', 'super_admin'],
      },
      {
        id: 'crm',
        title: {
          en: 'Patient CRM & Care',
          om: 'Komii fi Yaada (CRM)',
          am: 'የታካሚዎች ቅሬታና አስተያየት',
        },
        subtitle: {
          en: 'Grievance, Feedback & Support',
          om: 'Tajaajila Maamilaa fi Yaada Dhukkubsattootaa',
          am: 'የደንበኞች አገልግሎትና እንክብካቤ',
        },
        href: '/crm',
        icon: '🤝',
        badge: {
          en: '4 Feedback',
          om: 'Yaada 4',
          am: '4 አስተያየቶች',
        },
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        category: 'clinical',
        allowedRoles: ['admin', 'insurance_officer', 'super_admin'],
      },

      // 3. Operations & Finance
      {
        id: 'billing',
        title: {
          en: 'Telebirr & Billing',
          om: 'Kaffaltii fi Inshuraansii',
          am: 'ክፍያና ቴሌብር',
        },
        subtitle: {
          en: 'Revenue, POS & Invoices',
          om: 'Kaffaltii Telebirr fi Galii Guyyaa',
          am: 'የቴሌብር ክፍያና የዕለት ገቢ',
        },
        href: '/billing',
        icon: '💳',
        badge: {
          en: 'ETB 84.5K Today',
          om: 'ETB 84.5K Har\'a',
          am: 'ETB 84.5K ዛሬ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'operations',
        allowedRoles: ['billing', 'insurance_officer', 'admin', 'super_admin'],
      },
      {
        id: 'accounting',
        title: {
          en: 'Finance & Ledger',
          om: 'Herrega Guutuu (GL)',
          am: 'ፋይናንስና ሂሳብ መዝገብ',
        },
        subtitle: {
          en: 'Balance Sheet & Expenses',
          om: 'Galmee Maallaqaa fi Baasii',
          am: 'የሆስፒታል በጀትና ወጪ ቁጥጥር',
        },
        href: '/accounting',
        icon: '📑',
        badge: {
          en: 'Reconciled',
          om: 'Walsimsiifameera',
          am: 'የተመሳከረ',
        },
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'operations',
        allowedRoles: ['billing', 'admin', 'super_admin'],
      },
      {
        id: 'hrm',
        title: {
          en: 'HRM & Shift Payroll',
          om: 'Hojjetootaa fi Mindaa',
          am: 'የሰው ኃይልና ደመወዝ',
        },
        subtitle: {
          en: 'Staff Attendance & Biometrics',
          om: 'Galmee Hojjetootaa fi Mindaa',
          am: 'የሰራተኞች የስራ ሰዓትና ደመወዝ',
        },
        href: '/hrm',
        icon: '👔',
        badge: {
          en: '482 Staff',
          om: 'Hojjetoota 482',
          am: '482 ሰራተኞች',
        },
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        category: 'operations',
        allowedRoles: ['admin', 'super_admin'],
      },
      {
        id: 'assets',
        title: {
          en: 'Biomedical Assets',
          om: 'Meeshaalee Yaalaa',
          am: 'የህክምና መሳሪያዎች ቁጥጥር',
        },
        subtitle: {
          en: 'Equipment Maintenance & Uptime',
          om: "Suphaa fi To'annoo Meeshaalee",
          am: 'ጥገናና የጥራት ማረጋገጫ',
        },
        href: '/assets',
        icon: '🔬',
        badge: {
          en: '99.2% Uptime',
          om: '99.2% Hojiirra',
          am: '99.2% በስራ ላይ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'operations',
        allowedRoles: ['technician', 'admin', 'super_admin'],
      },
      {
        id: 'waste',
        title: {
          en: 'Medical Waste',
          om: 'Balfa Yaalaa',
          am: 'የህክምና ቆሻሻ አወጋገድ',
        },
        subtitle: {
          en: 'Biohazard Tracking & Incinerator',
          om: "To'annoo Balfa Hospitaalaa fi Gubaatii",
          am: 'የአደገኛ ቆሻሻ ማቃጠያ',
        },
        href: '/waste',
        icon: '☣️',
        badge: {
          en: 'Incinerator 850°C',
          om: 'Gubaatii 850°C',
          am: 'ማቃጠያ 850°C',
        },
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        category: 'operations',
        allowedRoles: ['technician', 'admin', 'super_admin'],
      },
      {
        id: 'procurement',
        title: {
          en: 'Supply Chain',
          om: 'Bittaa fi Caalbaasii',
          am: 'ግዥና አቅርቦት',
        },
        subtitle: {
          en: 'Tenders & Requisitions',
          om: 'Dhiheessii Meeshaalee fi Qorichaa',
          am: 'የመድኃኒትና እቃዎች ጨረታ',
        },
        href: '/procurement',
        icon: '📦',
        badge: {
          en: '3 Active Tenders',
          om: 'Caalbaasii 3',
          am: '3 ንቁ ጨረታዎች',
        },
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        category: 'operations',
        allowedRoles: ['admin', 'pharmacist', 'super_admin'],
      },
      {
        id: 'mortuary',
        title: {
          en: 'Mortuary Vaults',
          om: 'Kutaa Reeffaa',
          am: 'የአስከሬን ማቆያ',
        },
        subtitle: {
          en: 'Cold Storage & Vault Logistics',
          om: 'Bulchiinsa fi Kuusaa Qabbanaawaa',
          am: 'የማቀዝቀዣ ክፍል ቁጥጥር',
        },
        href: '/mortuary',
        icon: '⚰️',
        badge: {
          en: '-4.2°C Cold',
          om: '-4.2°C Qabbana',
          am: '-4.2°C ቅዝቃዜ',
        },
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        category: 'operations',
        allowedRoles: ['doctor', 'admin', 'super_admin'],
      },

      // 4. Governance & Resilience
      {
        id: 'fayda',
        title: {
          en: 'Fayda National ID',
          om: 'Eenyummaa Biyyaalessaa',
          am: 'የፋይዳ ዲጂታል መታወቂያ',
        },
        subtitle: {
          en: 'NIDP Biometric Verification',
          om: 'Waraqaa Eenyummaa Fayda Biometric',
          am: 'የብሔራዊ መታወቂያ ማረጋገጫ',
        },
        href: '/fayda',
        icon: '🆔',
        badge: {
          en: 'NIDP Verified',
          om: 'Mirkanaa\'eera',
          am: 'የተረጋገጠ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'governance',
        allowedRoles: ['insurance_officer', 'admin', 'receptionist', 'super_admin'],
      },
      {
        id: 'efda',
        title: {
          en: 'EFDA Drug Safety',
          om: 'Nageenya Qorichaa',
          am: 'የመድኃኒት ደህንነት (EFDA)',
        },
        subtitle: {
          en: 'ADR Surveillance & MoH Rules',
          om: "To'annoo Miidhaa Qorichaa (EFDA)",
          am: 'የመድኃኒት ተፅዕኖ ክትትል',
        },
        href: '/efda',
        icon: '⚖️',
        badge: {
          en: 'MoH Compliant',
          om: 'Qajeelfama MoH',
          am: 'የጤና ሚኒስቴር ህግ',
        },
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'governance',
        allowedRoles: ['pharmacist', 'admin', 'super_admin'],
      },
      {
        id: 'infection',
        title: {
          en: 'Infection Control',
          om: "To'annoo Dhibee (EPHI)",
          am: 'የኢንፌክሽን መከላከያ (EPHI)',
        },
        subtitle: {
          en: 'Surveillance & Outbreak Protocols',
          om: 'Hordoffii Dhibee Daddarbaa',
          am: 'የተላላፊ በሽታዎች ቁጥጥር',
        },
        href: '/infection',
        icon: '🧫',
        badge: {
          en: 'Zero Outbreaks',
          om: 'Dhibeen Hin Jiru',
          am: 'ዜሮ ወረርሽኝ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'governance',
        allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
      },
      {
        id: 'insurance',
        title: {
          en: 'CBHI & Claims',
          om: 'Inshuraansii Fayyaa',
          am: 'የህብረተሰብ ጤና መድህን (CBHI)',
        },
        subtitle: {
          en: 'Community Health Reimbursements',
          om: 'Kaffaltii Inshuraansii Hawaasaa CBHI',
          am: 'የመድን ክፍያ ጥያቄዎች',
        },
        href: '/insurance',
        icon: '🧾',
        badge: {
          en: '98% Approved',
          om: '98% Mirkanaa\'e',
          am: '98% የፀደቀ',
        },
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        category: 'governance',
        allowedRoles: ['insurance_officer', 'admin', 'billing', 'super_admin'],
      },
      {
        id: 'audit',
        title: {
          en: 'Clinical Audit EHSTG',
          om: 'Qulqullina Tajaajilaa',
          am: 'የህክምና ኦዲትና ጥራት (EHSTG)',
        },
        subtitle: {
          en: 'Hospital Standards & Scorecards',
          om: 'Istaandaardii Qulqullinaa EHSTG',
          am: 'የኢትዮጵያ ሆስፒታሎች የጥራት ደረጃ',
        },
        href: '/audit',
        icon: '📋',
        badge: {
          en: 'Level 4 (91.5%)',
          om: 'Sadarkaa 4 (91.5%)',
          am: 'ደረጃ 4 (91.5%)',
        },
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
        category: 'governance',
        allowedRoles: ['admin', 'doctor', 'super_admin'],
      },
      {
        id: 'power',
        title: {
          en: 'Power & Solar Grid',
          om: 'Ibsaa fi Soolaarii',
          am: 'የኤሌክትሪክና ሶላር ኃይል',
        },
        subtitle: {
          en: 'Grid, Diesel & Solar Backup',
          om: 'Humna Elektiriikii, Jenereetara fi Soolaarii',
          am: 'ዋና መብራት፣ ጀነሬተርና የፀሐይ ኃይል',
        },
        href: '/power',
        icon: '⚡',
        badge: {
          en: '100% Online',
          om: '100% Hojjira',
          am: '100% በስራ ላይ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        category: 'governance',
        allowedRoles: ['technician', 'admin', 'super_admin'],
      },
      {
        id: 'analytics',
        title: {
          en: 'Executive BI',
          om: 'Gabaasa Hoggansaa',
          am: 'የአመራር ዳሽቦርድ (BI)',
        },
        subtitle: {
          en: 'Clinical & Financial Metrics',
          om: 'Gabaasa Kiliinikaa fi Faayinaansii',
          am: 'የክሊኒካልና ፋይናንስ ቁልፍ መረጃዎች',
        },
        href: '/analytics',
        icon: '📈',
        badge: {
          en: 'Real-time KPIs',
          om: 'KPIs Yeroo Ammaa',
          am: 'የቀጥታ መረጃዎች',
        },
        badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
        category: 'governance',
        allowedRoles: ['admin', 'doctor', 'super_admin'],
      },
      {
        id: 'academic',
        title: {
          en: 'Research & Trials',
          om: 'Qorannoo Ogeeyyii',
          am: 'ምርምርና ስልጠና',
        },
        subtitle: {
          en: 'Mettu University Medical IRB',
          om: 'Qorannoo fi Leenjii Yunivarsitii Meettuu',
          am: 'የመቱ ዩኒቨርሲቲ የህክምና ምርምር',
        },
        href: '/academic',
        icon: '🎓',
        badge: {
          en: '6 Trials Active',
          om: 'Qorannoo 6 Hojiirra',
          am: '6 ንቁ ምርምሮች',
        },
        badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        category: 'governance',
        allowedRoles: ['doctor', 'admin', 'super_admin'],
      },
    ],
    []
  );

  const displayedWorkstations = useMemo(() => {
    return workstations.filter((w) => {
      // 1. RBAC Filtering by User Role: Super admin and Admin have full access across all workstations
      const matchesRole =
        !user?.role ||
        user.role === 'super_admin' ||
        user.role === 'admin' ||
        !w.allowedRoles ||
        w.allowedRoles.includes(user.role);

      if (!matchesRole) return false;

      // 2. Category Tab Filter
      const matchesTab = activeTab === 'all' || w.category === activeTab;

      // 3. Search Query Filter across English, Afaan Oromoo, and Amharic
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        w.title[lang].toLowerCase().includes(q) ||
        w.subtitle[lang].toLowerCase().includes(q) ||
        w.title.en.toLowerCase().includes(q) ||
        w.title.om.toLowerCase().includes(q) ||
        w.title.am.toLowerCase().includes(q) ||
        (w.badge && w.badge[lang].toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [workstations, activeTab, searchQuery, user?.role, lang]);

  // Pre-warm workstation routes for instantaneous transitions
  useEffect(() => {
    workstations.forEach((w) => {
      try {
        router.prefetch(w.href);
      } catch {
        // ignore
      }
    });
  }, [router, workstations]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <></>;

  const currentRole = user?.role || 'doctor';
  const roleInfo =
    ROLE_DESCRIPTIONS[currentRole]?.[lang] ||
    ROLE_DESCRIPTIONS['doctor'][lang];

  const sit = SITUATIONAL_I18N[lang] || SITUATIONAL_I18N['en'];
  const grt = GREETING_I18N[lang] || GREETING_I18N['en'];
  const emr = EMERGENCY_MODAL_I18N[lang] || EMERGENCY_MODAL_I18N['en'];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 lg:p-8 space-y-7">
          {/* Top Context & Greeting Bar (Responsive rectangular hover) */}
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 min-w-0">
              <span className="flex h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0 space-y-1">
                <h1 className="text-xl font-black text-slate-900 tracking-tight truncate group-hover:text-teal-950 transition-colors">
                  {t('welcome_back')},{' '}
                  <span className="text-teal-700">
                    {user?.username === 'admin'
                      ? grt.systemAdmin
                      : user?.username === 'nurse_chaltu'
                      ? 'Nurse Chaltu'
                      : 'Dr. Bekele Tadesse'}
                  </span>
                </h1>
                <p className="text-xs font-semibold text-slate-500 truncate">
                  {t('hospital_name')} • <span className="text-slate-800 font-bold">{grt.shift}</span> • {grt.catchment}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-block font-mono text-xs font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 group-hover:bg-white transition-colors">
                {currentDateTime}
              </span>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-rose-700 hover:ring-2 hover:ring-rose-400/40 transition-all cursor-pointer"
              >
                <span className="text-sm">🚨</span>
                <span>{grt.emergencyAction}</span>
              </button>
            </div>
          </div>

          {/* RBAC SCOPE & ROLE-BASED WORKSTATION NOTICE */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border-2 border-slate-200/90 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-lg shadow-sm">
                {user?.role === 'admin'
                  ? '🏛️'
                  : user?.role === 'doctor'
                  ? '🩺'
                  : user?.role === 'nurse'
                  ? '💉'
                  : user?.role === 'pharmacist'
                  ? '💊'
                  : user?.role === 'insurance_officer'
                  ? '🧾'
                  : user?.role === 'technician'
                  ? '🔧'
                  : '🏥'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                    {grt.rolePrefix}{user?.role ? user.role.replace('_', ' ').toUpperCase() : 'DOCTOR'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    • {grt.scopedCount}
                    <strong className="text-slate-800">{displayedWorkstations.length}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  <strong>{roleInfo.title}:</strong> {roleInfo.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {user?.role === 'admin' || user?.role === 'super_admin' ? grt.executiveActive : grt.rbacActive}
              </span>
            </div>
          </div>

          {/* DEDICATED HOSPITAL EXECUTIVE OVERSIGHT & DIRECT CONTACT HUB (ADMIN & SUPER ADMIN) */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <AdminOversightHub />
          )}

          {/* SECTION 1: 3-SECOND CLINICAL VITAL SIGNS (Responsive Rectangular Hover Cards) */}
          <div>
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>📊</span> {sit.sectionTitle}
              </h2>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                {sit.sensorBadge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* Tile 1: Bed Capacity */}
              <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-wider">{sit.bedTitle}</span>
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200 group-hover:bg-white group-hover:border-teal-400 transition-colors">
                    {sit.bedOccupancy}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">340</span>
                  <span className="text-sm font-bold text-slate-400">{sit.bedTotal}</span>
                </div>
                <div className="mt-3.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: '85%' }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{sit.bedAvail}</span>
                  <span className="text-teal-700 font-bold">{sit.bedIcu}</span>
                </div>
              </div>

              {/* Tile 2: START Emergency Triage */}
              <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-wider">{sit.edTitle}</span>
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200 group-hover:bg-white transition-colors">
                    {sit.edBadge}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-rose-50 py-2 border border-rose-200 group-hover:bg-white transition-colors">
                    <span className="block text-base font-black text-rose-700">3</span>
                    <span className="text-[10px] font-bold text-rose-800 uppercase">Red</span>
                  </div>
                  <div className="rounded-xl bg-amber-50 py-2 border border-amber-200 group-hover:bg-white transition-colors">
                    <span className="block text-base font-black text-amber-700">12</span>
                    <span className="text-[10px] font-bold text-amber-800 uppercase">Yel</span>
                  </div>
                  <div className="rounded-xl bg-emerald-50 py-2 border border-emerald-200 group-hover:bg-white transition-colors">
                    <span className="block text-base font-black text-emerald-700">48</span>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Grn</span>
                  </div>
                  <div className="rounded-xl bg-slate-100 py-2 border border-slate-200 group-hover:bg-white transition-colors">
                    <span className="block text-base font-black text-slate-600">0</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Blk</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] font-semibold text-slate-400">
                  {sit.edSub}
                </p>
              </div>

              {/* Tile 3: Blood & Oxygen Supply */}
              <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-wider">{sit.o2Title}</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200 group-hover:bg-white transition-colors">
                    {sit.o2Badge}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">4.8</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">Bar</span>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{sit.o2Pipeline}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-600">6</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">Units</span>
                    <p className="text-xs font-bold text-rose-600 mt-0.5">{sit.o2LowStock}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-400">
                  <span>{sit.o2Days}</span>
                  <span className="font-bold text-slate-700">{sit.o2Total}</span>
                </div>
              </div>

              {/* Tile 4: Power Grid & Resilience */}
              <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/50 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-wider">{sit.powerTitle}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 group-hover:bg-white transition-colors">
                    {sit.powerBadge}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-600">{sit.powerSolar}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {sit.powerGen}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">{sit.powerSwitch}</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: WORKSTATION DIRECTORY */}
          <div className="space-y-4">
            {/* Filter Toolbar: Search Bar on LEFT + Category Tabs Following Immediately to the Right */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* COMPACT & SHORTENED SEARCH BAR */}
              <div className="relative w-full sm:w-80 md:w-96 shrink-0">
                <div className="flex h-12 items-center rounded-2xl border-[3px] border-teal-600 bg-white px-4 shadow-sm hover:border-teal-700 focus-within:border-teal-700 focus-within:ring-4 focus-within:ring-teal-400/30 transition-all duration-150">
                  <span className="text-base text-teal-800 mr-2.5 shrink-0">🔍</span>
                  <input
                    type="text"
                    placeholder={t('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base font-extrabold text-slate-950 placeholder-slate-400 focus:outline-none tracking-wide"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="ml-1 text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                  <span className="ml-2 rounded-xl bg-teal-100/90 border-2 border-teal-300 px-2.5 py-0.5 text-xs font-black text-teal-900 shrink-0">
                    {displayedWorkstations.length}
                  </span>
                </div>
              </div>

              {/* Category Tabs (Localizes across English, Afaan Oromoo, and Amharic) */}
              <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-200/70 p-1.5 text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-teal-700 text-white shadow-xs font-black ring-2 ring-teal-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  {t('all_tab')} ({workstations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('emergency')}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'emergency'
                      ? 'bg-rose-700 text-white shadow-xs font-black ring-2 ring-rose-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  <span>🚨</span> {t('emergency_triage')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clinical')}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'clinical'
                      ? 'bg-teal-700 text-white shadow-xs font-black ring-2 ring-teal-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  <span>🩺</span> {t('clinical_care')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('operations')}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'operations'
                      ? 'bg-blue-700 text-white shadow-xs font-black ring-2 ring-blue-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  <span>💼</span> {t('operations_erp')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('governance')}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all cursor-pointer ${
                    activeTab === 'governance'
                      ? 'bg-purple-700 text-white shadow-xs font-black ring-2 ring-purple-400/40'
                      : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 hover:ring-1 hover:ring-teal-400/40'
                  }`}
                >
                  <span>⚖️</span> {t('regulations_governance')}
                </button>
              </div>
            </div>

            {/* 3. WORKSTATIONS GRID (Responsive Rectangular Hover Spotlight & 100% Dynamic Translation) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedWorkstations.map((item) => {
                const titleText = item.title[lang] || item.title.en;
                const subtitleText = item.subtitle[lang] || item.subtitle.en;
                const badgeText = item.badge ? item.badge[lang] || item.badge.en : null;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    prefetch={true}
                    onMouseEnter={() => router.prefetch(item.href)}
                    onFocus={() => router.prefetch(item.href)}
                    className="group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200/90 bg-white p-5 shadow-2xs hover:border-teal-500 hover:bg-teal-50/70 hover:shadow-lg hover:ring-2 hover:ring-teal-400/30 transition-all duration-150 ease-in-out cursor-pointer active:scale-[0.98] transform hover:-translate-y-0.5 min-h-[130px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-2xl group-hover:scale-110 group-hover:bg-white group-hover:border-teal-400 group-hover:shadow-xs transition-all">
                          {item.icon}
                        </div>
                        {badgeText && (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 transition-colors ${item.badgeColor} group-hover:bg-white group-hover:shadow-2xs`}
                          >
                            {badgeText}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors leading-snug">
                        {titleText}
                      </h3>
                      <p className="text-xs font-semibold text-teal-700 mt-1 truncate group-hover:text-teal-800 transition-colors">
                        {subtitleText}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-teal-800 border-t border-slate-100 group-hover:border-teal-200/60 pt-2.5 transition-colors">
                      <span className="group-hover:underline">{grt.openWorkstation}</span>
                      <span className="text-sm group-hover:translate-x-1.5 transition-transform">→</span>
                    </div>
                  </Link>
                );
              })}

              {displayedWorkstations.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm font-semibold text-slate-400 bg-white rounded-3xl border border-slate-200">
                  {grt.noFound} &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </div>

          {/* EMERGENCY PROTOCOL MODAL */}
          {emergencyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
              <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl border-2 border-rose-300 overflow-hidden">
                <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-pulse">🚨</span>
                    <h2 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                      {emr.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(false)}
                    className="rounded-full p-2 text-rose-400 hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCodeBlue(true);
                        setEmergencyModalOpen(false);
                      }}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-blue-600 bg-blue-50/70 p-5 text-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer group hover:shadow-lg hover:ring-2 hover:ring-blue-400/40"
                    >
                      <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">💙</span>
                      <span className="text-xs font-black text-blue-900 group-hover:text-white">
                        {emr.codeBlue}
                      </span>
                      <span className="text-[11px] text-blue-700 group-hover:text-blue-100 mt-0.5">
                        {emr.codeBlueDesc}
                      </span>
                    </button>

                    <Link
                      href="/mci"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-rose-600 bg-rose-50/70 p-5 text-center hover:bg-rose-600 hover:text-white transition-all group hover:shadow-lg hover:ring-2 hover:ring-rose-400/40"
                    >
                      <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">🆘</span>
                      <span className="text-xs font-black text-rose-900 group-hover:text-white">
                        {emr.mci}
                      </span>
                      <span className="text-[11px] text-rose-700 group-hover:text-rose-100 mt-0.5">
                        {emr.mciDesc}
                      </span>
                    </Link>

                    <Link
                      href="/ems"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-center hover:bg-slate-800 hover:text-white transition-all group hover:shadow-lg hover:ring-2 hover:ring-slate-400/40"
                    >
                      <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">🚑</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-white">
                        {emr.ems}
                      </span>
                      <span className="text-[11px] text-slate-500 group-hover:text-slate-200 mt-0.5">
                        {emr.emsDesc}
                      </span>
                    </Link>

                    <Link
                      href="/patients"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-center hover:bg-teal-700 hover:text-white transition-all group hover:shadow-lg hover:ring-2 hover:ring-teal-400/40"
                    >
                      <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">👥</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-white">
                        {emr.fastIntake}
                      </span>
                      <span className="text-[11px] text-slate-500 group-hover:text-teal-100 mt-0.5">
                        {emr.fastIntakeDesc}
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    {emr.close}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CODE BLUE BANNER (IF TRIGGERED) */}
          {activeCodeBlue && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-3xl bg-blue-900 p-5 text-white shadow-2xl border border-blue-400 animate-bounce">
              <span className="text-3xl">💙</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">
                  {emr.activeCodeBlue}
                </p>
                <p className="text-xs text-blue-200 mt-0.5">
                  {emr.activeCodeBlueDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCodeBlue(false)}
                className="ml-3 rounded-xl bg-blue-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
              >
                {emr.clear}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
