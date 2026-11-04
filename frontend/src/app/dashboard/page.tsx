/**
 * Mettu Karl Referral Hospital — Clinical Executive Command Dashboard.
 *
 * Enterprise Healthcare Design System:
 * - Professional Navy, Slate, and Subtle Healthcare Teal palette
 * - Modern Lucide SVG iconography (replacing consumer emojis)
 * - Restrained corner radii (rounded-xl cards, rounded-lg controls, rounded-md badges)
 * - Clear clinical visual hierarchy and balanced information density
 * - Complete Tri-Lingual Support: English ('en', default), Afaan Oromoo ('om'), Amharic ('am')
 * - Real-time RBAC Workstation filtering across 27 specialized hospital departments
 * - Situational Awareness vitals: Bed BOR, START Triage, Blood/Oxygen, Power/Solar Grid
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
import {
  Users,
  Ticket,
  AlertOctagon,
  Droplets,
  Ambulance,
  Activity,
  Pill,
  Scan,
  Syringe,
  Video,
  UtensilsCrossed,
  HeartHandshake,
  CreditCard,
  FileSpreadsheet,
  Briefcase,
  Microscope,
  Flame,
  PackageCheck,
  Archive,
  Fingerprint,
  Scale,
  ShieldAlert,
  BadgeCheck,
  ClipboardCheck,
  Zap,
  TrendingUp,
  GraduationCap,
  Search,
  Clock,
  ShieldCheck,
  Stethoscope,
  Wrench,
  AlertTriangle,
  HeartPulse,
  UserPlus,
  ArrowRight,
  BedDouble,
  Siren,
  X,
  Radio,
  Building2,
  Sparkles,
  Check,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';

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
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge?: LocalizedText;
  badgeColor?: string;
  category: 'emergency' | 'clinical' | 'operations' | 'governance';
  allowedRoles?: UserRole[];
}

const ROLE_DESCRIPTIONS: Record<string, Record<Language, { title: string; desc: string }>> = {
  admin: {
    en: {
      title: 'Executive Oversight & Clinical Operations',
      desc: 'Universal oversight across Doctors, Nurses, Pharmacy, Inpatients, and Finance.',
    },
    om: {
      title: "To'annoo fi Quunnamtii Bulchiinsaa",
      desc: "To'annoo fi quunnamtii ogeeyyii yaalaa, narsitoota, farmaasii, fi dhukkubsattootaa.",
    },
    am: {
      title: 'የአስተዳደር ቁጥጥርና የቀጥታ ግንኙነት',
      desc: 'የዶክተሮች፣ ነርሶች፣ ፋርማሲና ተኝቶ ታካሚዎች የቀጥታ ቁጥጥርና ግንኙነት።',
    },
  },
  doctor: {
    en: {
      title: 'Clinical Care & CDSS Workstation',
      desc: 'Electronic health records, OPD queue, and clinical decision support active.',
    },
    om: {
      title: 'Yaala Kiliinikaa & CDSS',
      desc: 'Galmee dhukkubsattootaa, OPD fi yaala qorichaa qophiidha.',
    },
    am: {
      title: 'ክሊኒካል ህክምና እና CDSS',
      desc: 'የታካሚዎች መዝገብ፣ የተመላላሽ ህክምናና የህክምና ውሳኔ ድጋፍ ዝግጁ ናቸው።',
    },
  },
  nurse: {
    en: {
      title: 'Nursing & Inpatient Care',
      desc: 'Emergency triage, ICU telemetry, and inpatient ward care active.',
    },
    om: {
      title: 'Narsingii & Yaala Siree',
      desc: 'Triage hatattamaa, ICU fi kunuunsa dhukkubsattootaa qophiidha.',
    },
    am: {
      title: 'የነርሲንግና የተኝቶ ታካሚ እንክብካቤ',
      desc: 'የድንገተኛ ትሪያጅ፣ የአይሲዩ ክትትልና የታካሚዎች እንክብካቤ ክፍት ነው።',
    },
  },
  pharmacist: {
    en: {
      title: 'Pharmacy & Drug Inventory (FEFO)',
      desc: 'First-Expiry First-Out dispensing and EFDA medication safety active.',
    },
    om: {
      title: 'Farmaasii & Kuusaa Qorichaa',
      desc: 'Kuusaa FEFO, kenniinsa qorichaa fi nageenya EFDA.',
    },
    am: {
      title: 'የመድኃኒት አደልደል እና ክምችት (FEFO)',
      desc: 'የመድኃኒት ስርጭትና የኢትዮጵያ መድኃኒት ባለስልጣን ቁጥጥር ክፍት ነው።',
    },
  },
  insurance_officer: {
    en: {
      title: 'CBHI Health Insurance & Claims',
      desc: 'Community health insurance verification and billing reconciliation active.',
    },
    om: {
      title: 'Inshuraansii CBHI & Kaffaltii',
      desc: 'Kaffaltii inshuraansii hawaasaa CBHI fi Fayda ID qophiidha.',
    },
    am: {
      title: 'የጤና መድህን (CBHI) እና ክፍያ',
      desc: 'የህብረተሰብ ጤና መድህን ማረጋገጫና የክፍያ ስራዎች ክፍት ናቸው።',
    },
  },
  technician: {
    en: {
      title: 'Biomedical & Engineering Hub',
      desc: 'Medical equipment maintenance, power grid, and PACS radiology active.',
    },
    om: {
      title: 'Meeshaalee Yaalaa & Humna Ibsaa',
      desc: 'Meeshaalee yaalaa, ibsaa soolaarii fi suuraa PACS qophiidha.',
    },
    am: {
      title: 'የህክምና መሳሪያዎችና መሰረተ-ልማት',
      desc: 'የህክምና መሳሪያዎች፣ የሶላር ኃይልና የራዲዮሎጂ ሲስተም ክፍት ናቸው።',
    },
  },
  super_admin: {
    en: {
      title: 'Master System Administration',
      desc: 'Universal full access across all 27 clinical, financial, and regulatory workstations.',
    },
    om: {
      title: "Bulchiinsa Ol'aanaa Sirnaa",
      desc: "Kutaaleen hospitaalaa 27n hundi guutummaatti banaadha.",
    },
    am: {
      title: 'የበላይ የሲስተም አስተዳደር',
      desc: 'ለሁሉም 27 የሆስፒታል ክፍሎች ሙሉ መዳረሻ ተሰጥቷል።',
    },
  },
  receptionist: {
    en: {
      title: 'Patient Intake & OPD Queue Desk',
      desc: 'Master patient registration, Fayda eKYC verification, and queue routing active.',
    },
    om: {
      title: 'Galmee Dhukkubsattootaa & Triage OPD',
      desc: 'Galmee dhukkubsattootaa, Fayda ID mirkaneessuu fi dabareen eeguu qophiidha.',
    },
    am: {
      title: 'የታካሚዎች ምዝገባ እና የተመላላሽ ሰልፍ',
      desc: 'የታካሚዎች ምዝገባ፣ የፋይዳ ዲጂታል መታወቂያና የተራ ጥሪ ዝግጁ ነው።',
    },
  },
  lab_technician: {
    en: {
      title: 'Clinical Diagnostics & Laboratory Station',
      desc: 'Pathology worklist, specimen barcode scanning, and analyzer interfacing active.',
    },
    om: {
      title: 'Laabooratorii & Qorannoo Dhiigaa',
      desc: 'Qorannoo dhiigaa, barcode qorannoo fi buaa laabooratorii qophiidha.',
    },
    am: {
      title: 'ክሊኒካል ላቦራቶሪና የምርመራ ማዕከል',
      desc: 'የላቦራቶሪ ምርመራ፣ የባርኮድ ቁጥጥርና የውጤት ምዝገባ ክፍት ነው።',
    },
  },
  billing: {
    en: {
      title: 'Cashier & Revenue Accounting Terminal',
      desc: 'Multi-channel payment reconciliation (Telebirr, CBE) and patient billing active.',
    },
    om: {
      title: 'Kaffaltii & Qabeenya Faayinaansii',
      desc: 'Kaffaltii Telebirr, Baankii Daldala Itoophiyaa fi herrega qophiidha.',
    },
    am: {
      title: 'የክፍያና የፋይናንስ አስተዳደር ዴስክ',
      desc: 'የቴሌብርና የኢትዮጵያ ንግድ ባንክ ክፍያዎችና የታካሚዎች ሂሳብ ዝግጁ ነው።',
    },
  },
  auditor: {
    en: {
      title: 'Clinical Audit & EHSTG Quality Sentinel',
      desc: 'Zero-trust access log reviews, prescription audit, and healthcare quality compliance active.',
    },
    om: {
      title: "To'annoo Qulqullinaa & Audit Sentinel",
      desc: "To'annoo seeraa, qulqullina yaalaa EHSTG fi mirkaneessa sirnaa.",
    },
    am: {
      title: 'የጥራት ኦዲት እና የዜሮ-ትረስት ሴንቲኔል',
      desc: 'የሲስተም ኦዲት፣ የታካሚዎች መረጃ ጥበቃና የጥራት ደረጃዎች ክትትል ዝግጁ ነው።',
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
    sectionTitle: 'Situational Awareness & Clinical Vitals',
    sensorBadge: 'Telemetry Live',
    bedTitle: 'Bed Capacity (BOR)',
    bedOccupancy: '85% Occupied',
    bedTotal: '/ 400 Total',
    bedAvail: '60 Available',
    bedIcu: 'ICU: 4 Free',
    edTitle: 'Emergency Triage (START)',
    edBadge: '63 in ED',
    edSub: '3 Resuscitations active',
    o2Title: 'Critical Supply Reserves',
    o2Badge: 'Stable',
    o2Pipeline: 'Central O₂ Pipeline',
    o2LowStock: 'O-Neg (Low Reserve)',
    o2Days: '14 Days Supply',
    o2Total: '124 Units Blood Total',
    powerTitle: 'Power Grid & Microgrid',
    powerBadge: '100% Online',
    powerSolar: 'EEU Grid + 120kW Solar',
    powerGen: 'Dual 500kVA (94% Ready)',
    powerSwitch: 'ATS Auto-switch: <10s',
  },
  om: {
    sectionTitle: 'Haala Yeroo Ammaa & Mallattoo Yaalaa',
    sensorBadge: 'Kallattiin (Live)',
    bedTitle: 'Dandeettii Siree (BOR)',
    bedOccupancy: '85% Qabameera',
    bedTotal: '/ 400 Waliigala',
    bedAvail: '60 Duwwaa',
    bedIcu: 'ICU: 4 Duwwaa',
    edTitle: 'Triage Hatattamaa (START)',
    edBadge: '63 Kutaa Tasaatti',
    edSub: '3 Lubbuu Baraaruu',
    o2Title: 'Kuusaa Oksijiinii & Dhiigaa',
    o2Badge: "Tasgabbaa'aa",
    o2Pipeline: 'Ujummoo Oksijiinii',
    o2LowStock: 'O-Neg (Hanqina)',
    o2Days: 'Guyyaa 14 Oksijiinii',
    o2Total: '124 Yuunitii Dhiigaa',
    powerTitle: 'Ibsaa & Humna Elektiriikii',
    powerBadge: '100% Hojjira',
    powerSolar: 'EEU + 120kW Soolaarii',
    powerGen: 'Jenereetara 500kVA',
    powerSwitch: 'ATS jijjiirama: <10s',
  },
  am: {
    sectionTitle: 'ወቅታዊ ሁኔታና ክሊኒካል መረጃዎች',
    sensorBadge: 'ቀጥታ ስርጭት',
    bedTitle: 'የአልጋ ሁኔታ (BOR)',
    bedOccupancy: '85% የተያዘ',
    bedTotal: '/ 400 ጠቅላላ',
    bedAvail: '60 ክፍት',
    bedIcu: 'አይሲዩ: 4 ክፍት',
    edTitle: 'የድንገተኛ ትሪያጅ (START)',
    edBadge: '63 ድንገተኛ ክፍል',
    edSub: '3 ከፍተኛ ህክምና',
    o2Title: 'የኦክስጅንና ደም ክምችት',
    o2Badge: 'የተረጋጋ',
    o2Pipeline: 'የኦክስጅን ዋና መስመር',
    o2LowStock: 'ኦ-ኔጌቲቭ (አናሳ ክምችት)',
    o2Days: 'የ14 ቀናት ክምችት',
    o2Total: '124 ጠቅላላ የደም ዩኒት',
    powerTitle: 'የመብራት ኃይልና ሶላር',
    powerBadge: '100% በስራ ላይ',
    powerSolar: 'መብራት + 120kW ሶላር',
    powerGen: '500kVA ጀነሬተር',
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
    shift: 'Morning Duty (08:00 - 16:00)',
    catchment: 'Catchment: 2.5M Population',
    emergencyAction: 'Emergency 907',
    rolePrefix: 'Role: ',
    systemAdmin: 'System Administrator',
    scopedCount: 'Workstations: ',
    executiveActive: 'Executive Access Active',
    rbacActive: 'RBAC Active',
    openWorkstation: 'Open Workstation',
    noFound: 'No hospital workstations found matching',
  },
  om: {
    shift: 'Hojii Ganamaa (08:00 - 16:00)',
    catchment: 'Ummata: 2.5M',
    emergencyAction: 'Balaa Tasaa 907',
    rolePrefix: 'Gahee: ',
    systemAdmin: 'Bulchaa Sirnaa',
    scopedCount: 'Kutaalee: ',
    executiveActive: 'Bulchiinsa Hojiirra',
    rbacActive: 'Hojiirra',
    openWorkstation: 'Bani',
    noFound: 'Kutaan walsimu hin argamne',
  },
  am: {
    shift: 'የጠዋት ስራ (08:00 - 16:00)',
    catchment: 'የህዝብ ብዛት: 2.5 ሚሊዮን',
    emergencyAction: 'አደጋ ጊዜ 907',
    rolePrefix: 'ድርሻ: ',
    systemAdmin: 'ሲስተም አድሚን',
    scopedCount: 'ክፍሎች: ',
    executiveActive: 'አመራር በርቷል',
    rbacActive: 'በርቷል',
    openWorkstation: 'ክፈት',
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
    title: 'Emergency Rapid Action Console',
    codeBlue: 'CODE BLUE',
    codeBlueDesc: 'Cardiac Arrest Resuscitation Alert',
    mci: 'MASS CASUALTY (MCI)',
    mciDesc: 'START Disaster Protocol Activation',
    ems: '907 Ambulance',
    emsDesc: 'Immediate Vehicle Fleet Dispatch',
    fastIntake: 'Fast Intake',
    fastIntakeDesc: 'Rapid Walk-in Patient Registration',
    close: 'Close Console',
    activeCodeBlue: 'Active CODE BLUE: Resuscitation Team Dispatched',
    activeCodeBlueDesc: 'Crash Cart #2 en route to ED Acute Resuscitation Bed 01',
    clear: 'Resolve Alert',
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

  // All 27 Hospital Workstations with Standardized Lucide Icons & Tri-Lingual Support
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
        icon: Users,
        iconBg: 'bg-blue-50 dark:bg-blue-950/40',
        iconColor: 'text-blue-700 dark:text-blue-400',
        badge: {
          en: '340 Inpatients',
          om: 'Dhukkubsattoota 340',
          am: '340 ተኝቶ ታካሚዎች',
        },
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
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
        icon: Ticket,
        iconBg: 'bg-amber-50 dark:bg-amber-950/40',
        iconColor: 'text-amber-700 dark:text-amber-400',
        badge: {
          en: '18 Waiting',
          om: '18 Eegaa Jiru',
          am: '18 በመጠባበቅ ላይ',
        },
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
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
        icon: AlertOctagon,
        iconBg: 'bg-rose-50 dark:bg-rose-950/40',
        iconColor: 'text-rose-700 dark:text-rose-400',
        badge: {
          en: '3 Red Active',
          om: '3 Sadarkaa Diimaa',
          am: '3 ቀይ ደረጃ',
        },
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80',
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
        icon: Droplets,
        iconBg: 'bg-rose-50 dark:bg-rose-950/40',
        iconColor: 'text-rose-700 dark:text-rose-400',
        badge: {
          en: 'O- Low Stock',
          om: 'O- Hanqina Qaba',
          am: 'ኦ-ኔጌቲቭ አናሳ ነው',
        },
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80',
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
        icon: Ambulance,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-700 dark:text-emerald-400',
        badge: {
          en: '4 Ready',
          om: '4 Qophiidha',
          am: '4 ዝግጁ ናቸው',
        },
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
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
        icon: Activity,
        iconBg: 'bg-sky-50 dark:bg-sky-950/40',
        iconColor: 'text-sky-700 dark:text-sky-400',
        badge: {
          en: '18 Live Beds',
          om: 'Sireewwan 18 Live',
          am: '18 አልጋዎች በቀጥታ',
        },
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/80',
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
        icon: Pill,
        iconBg: 'bg-teal-50 dark:bg-teal-950/40',
        iconColor: 'text-teal-700 dark:text-teal-400',
        badge: {
          en: '98% Stocked',
          om: '98% Guutuudha',
          am: '98% የተሟላ',
        },
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/80',
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
        icon: Scan,
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
        iconColor: 'text-indigo-700 dark:text-indigo-400',
        badge: {
          en: '12 Scans Ready',
          om: '12 Suuraan Qophiidha',
          am: '12 ምርመራዎች ዝግጁ',
        },
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80',
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
        icon: Syringe,
        iconBg: 'bg-purple-50 dark:bg-purple-950/40',
        iconColor: 'text-purple-700 dark:text-purple-400',
        badge: {
          en: '3 In Surgery',
          om: '3 Baqaqsarratti',
          am: '3 ቀዶ ጥገና ላይ',
        },
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/80',
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
        icon: Video,
        iconBg: 'bg-teal-50 dark:bg-teal-950/40',
        iconColor: 'text-teal-700 dark:text-teal-400',
        badge: {
          en: 'Online',
          om: 'Toora Irra Jira',
          am: 'በመስመር ላይ',
        },
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/80',
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
        icon: UtensilsCrossed,
        iconBg: 'bg-amber-50 dark:bg-amber-950/40',
        iconColor: 'text-amber-700 dark:text-amber-400',
        badge: {
          en: '340 Meals',
          om: 'Soorata 340',
          am: '340 ምግቦች',
        },
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
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
        icon: HeartHandshake,
        iconBg: 'bg-slate-100 dark:bg-slate-800',
        iconColor: 'text-slate-700 dark:text-slate-300',
        badge: {
          en: '4 Feedback',
          om: 'Yaada 4',
          am: '4 አስተያየቶች',
        },
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
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
        icon: CreditCard,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-700 dark:text-emerald-400',
        badge: {
          en: 'ETB 84.5K Today',
          om: 'ETB 84.5K Har\'a',
          am: 'ETB 84.5K ዛሬ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
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
        icon: FileSpreadsheet,
        iconBg: 'bg-blue-50 dark:bg-blue-950/40',
        iconColor: 'text-blue-700 dark:text-blue-400',
        badge: {
          en: 'Reconciled',
          om: 'Walsimsiifameera',
          am: 'የተመሳከረ',
        },
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
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
        icon: Briefcase,
        iconBg: 'bg-teal-50 dark:bg-teal-950/40',
        iconColor: 'text-teal-700 dark:text-teal-400',
        badge: {
          en: '482 Staff',
          om: 'Hojjetoota 482',
          am: '482 ሰራተኞች',
        },
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/80',
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
        icon: Microscope,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-700 dark:text-emerald-400',
        badge: {
          en: '99.2% Uptime',
          om: '99.2% Hojiirra',
          am: '99.2% በስራ ላይ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
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
        icon: Flame,
        iconBg: 'bg-amber-50 dark:bg-amber-950/40',
        iconColor: 'text-amber-700 dark:text-amber-400',
        badge: {
          en: 'Incinerator 850°C',
          om: 'Gubaatii 850°C',
          am: 'ማቃጠያ 850°C',
        },
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80',
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
        icon: PackageCheck,
        iconBg: 'bg-slate-100 dark:bg-slate-800',
        iconColor: 'text-slate-700 dark:text-slate-300',
        badge: {
          en: '3 Active Tenders',
          om: 'Caalbaasii 3',
          am: '3 ንቁ ጨረታዎች',
        },
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
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
        icon: Archive,
        iconBg: 'bg-slate-100 dark:bg-slate-800',
        iconColor: 'text-slate-700 dark:text-slate-300',
        badge: {
          en: '-4.2°C Cold',
          om: '-4.2°C Qabbana',
          am: '-4.2°C ቅዝቃዜ',
        },
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
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
        icon: Fingerprint,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-700 dark:text-emerald-400',
        badge: {
          en: 'NIDP Verified',
          om: 'Mirkanaa\'eera',
          am: 'የተረጋገጠ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
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
        icon: Scale,
        iconBg: 'bg-blue-50 dark:bg-blue-950/40',
        iconColor: 'text-blue-700 dark:text-blue-400',
        badge: {
          en: 'MoH Compliant',
          om: 'Qajeelfama MoH',
          am: 'የጤና ሚኒስቴር ህግ',
        },
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
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
        icon: ShieldAlert,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-700 dark:text-emerald-400',
        badge: {
          en: 'Zero Outbreaks',
          om: 'Dhibeen Hin Jiru',
          am: 'ዜሮ ወረርሽኝ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
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
        icon: BadgeCheck,
        iconBg: 'bg-teal-50 dark:bg-teal-950/40',
        iconColor: 'text-teal-700 dark:text-teal-400',
        badge: {
          en: '98% Approved',
          om: '98% Mirkanaa\'e',
          am: '98% የፀደቀ',
        },
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/80',
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
        icon: ClipboardCheck,
        iconBg: 'bg-purple-50 dark:bg-purple-950/40',
        iconColor: 'text-purple-700 dark:text-purple-400',
        badge: {
          en: 'Level 4 (91.5%)',
          om: 'Sadarkaa 4 (91.5%)',
          am: 'ደረጃ 4 (91.5%)',
        },
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/80',
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
        icon: Zap,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-700 dark:text-emerald-400',
        badge: {
          en: '100% Online',
          om: '100% Hojjira',
          am: '100% በስራ ላይ',
        },
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80',
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
        icon: TrendingUp,
        iconBg: 'bg-blue-50 dark:bg-blue-950/40',
        iconColor: 'text-blue-700 dark:text-blue-400',
        badge: {
          en: 'Real-time KPIs',
          om: 'KPIs Yeroo Ammaa',
          am: 'የቀጥታ መረጃዎች',
        },
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80',
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
        icon: GraduationCap,
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
        iconColor: 'text-indigo-700 dark:text-indigo-400',
        badge: {
          en: '6 Trials Active',
          om: 'Qorannoo 6 Hojiirra',
          am: '6 ንቁ ምርምሮች',
        },
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80',
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070e1e]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <span className="text-xs font-medium text-slate-500">Mettu Karl HMIS...</span>
        </div>
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

  const profileName =
    user?.fullName ||
    (user?.username === 'admin'
      ? 'Spencer Dawit (Executive)'
      : user?.username === 'nurse_chaltu'
      ? 'Nurse Chaltu'
      : user?.role === 'pharmacist'
      ? 'Pharmacist Tolera'
      : user?.role === 'technician'
      ? 'Lab Tech Gemechu'
      : user?.role === 'billing' || user?.role === 'insurance_officer'
      ? 'Billing Officer Fatuma'
      : 'Dr. Bekele Tadesse');

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1720px] mx-auto w-full">
          {/* ================================================================= */}
          {/* 1. TOP GREETING & OPERATIONAL STATUS (MATCHING UPLOADED IMAGE)   */}
          {/* ================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Good morning, <span className="text-slate-100">{profileName}</span>
              </h1>
              {/* Green Operational Pill Badge directly beside name */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#102419] text-[#34d399] border border-[#059669]/40 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
                <span>System Operational</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="hidden md:flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400 bg-[#131824] px-3 py-1.5 rounded-xl border border-[#222b3d]">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>{currentDateTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 active:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-md shadow-rose-900/30 transition-all cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{grt.emergencyAction}</span>
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. 4 GOLD KPI SPARKLINE CARDS (MATCHING 4 TOP CARDS IN IMAGE)     */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: OPD Patient Throughput (matches ARR Throughput) */}
            <div className="relative overflow-hidden rounded-2xl bg-[#131824] border border-[#222b3d] hover:border-amber-500/50 p-4.5 sm:p-5 shadow-xl transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">1. OPD Patient Throughput</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">1,284</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                  (+14%)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Daily consultations & registrations</p>
              {/* Glowing Golden Curved Sparkline SVG */}
              <div className="absolute right-2 bottom-2 w-28 h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 32 Q 25 35, 45 22 T 80 18 T 120 8"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2: Bed Occupancy (BOR) (matches API Ingest) */}
            <div className="relative overflow-hidden rounded-2xl bg-[#131824] border border-[#222b3d] hover:border-amber-500/50 p-4.5 sm:p-5 shadow-xl transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">2. Inpatient Bed Occupancy</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">85.0%</span>
                <span className="text-xs font-semibold text-amber-400 font-mono">340/400</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">General, Maternity & ICU beds</p>
              <div className="absolute right-2 bottom-2 w-28 h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 28 Q 20 20, 45 30 T 85 14 T 120 10"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]"
                  />
                </svg>
              </div>
            </div>

            {/* Card 3: Clinical Staff On-Duty (matches Compute Provisioning) */}
            <div className="relative overflow-hidden rounded-2xl bg-[#131824] border border-[#222b3d] hover:border-amber-500/50 p-4.5 sm:p-5 shadow-xl transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">3. Clinical Staff On-Duty</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">142</span>
                <span className="text-xs font-semibold text-slate-400 font-mono">Active Duty</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Doctors, Nurses, Pharmacists & Lab</p>
              <div className="absolute right-2 bottom-2 w-28 h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 34 Q 30 30, 50 16 T 85 24 T 120 12"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]"
                  />
                </svg>
              </div>
            </div>

            {/* Card 4: MoH Clinical Quality Score (matches Security Score) */}
            <div className="relative overflow-hidden rounded-2xl bg-[#131824] border border-[#222b3d] hover:border-amber-500/50 p-4.5 sm:p-5 shadow-xl transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">4. MoH Clinical Safety Index</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">99.4/100</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">Tier-4</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">EHSTG Hospital Scorecard 99.4%</p>
              <div className="absolute right-2 bottom-2 w-28 h-12 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 120 40" className="w-full h-full overflow-visible">
                  <path
                    d="M 0 30 Q 30 18, 60 26 T 90 12 T 120 6"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. HERO TELEMETRY DUAL-WAVE SPLINE CHART (MATCHING CENTER CHART)  */}
          {/* ================================================================= */}
          <div className="rounded-2xl bg-[#131824] border border-[#222b3d] p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Telemetry & Patient Flow
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time patient intake vs discharge flow across 24h operational cycle
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold select-none">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>OPD Inflow & Consultations</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Discharges & Admissions</span>
                </span>
              </div>
            </div>

            {/* SVG Dual-Wave Spline Graph */}
            <div className="relative w-full h-56 sm:h-64 my-2">
              <svg viewBox="0 0 1000 240" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="goldCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="silverCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Silver Discharges Wave */}
                <path
                  d="M 0 155 C 140 155, 180 185, 290 180 C 400 175, 470 145, 570 135 C 670 125, 760 160, 850 120 C 920 95, 960 90, 1000 85 L 1000 240 L 0 240 Z"
                  fill="url(#silverCurveGrad)"
                />
                <path
                  d="M 0 155 C 140 155, 180 185, 290 180 C 400 175, 470 145, 570 135 C 670 125, 760 160, 850 120 C 920 95, 960 90, 1000 85"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Gold Inflow Primary Wave */}
                <path
                  d="M 0 180 C 130 180, 190 125, 300 130 C 410 135, 490 85, 600 70 C 700 60, 740 170, 800 165 C 880 160, 930 110, 1000 100 L 1000 240 L 0 240 Z"
                  fill="url(#goldCurveGrad)"
                />
                <path
                  d="M 0 180 C 130 180, 190 125, 300 130 C 410 135, 490 85, 600 70 C 700 60, 740 170, 800 165 C 880 160, 930 110, 1000 100"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  className="filter drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]"
                />

                {/* Peak Marker Dot & Glow */}
                <circle cx="600" cy="70" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                <circle cx="600" cy="70" r="14" fill="#f59e0b" opacity="0.25" className="animate-pulse" />

                {/* Dip Marker Dot */}
                <circle cx="800" cy="165" r="5" fill="#fcd34d" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Floating Callout 1 (Peak Intake: 312 OPD) */}
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{ left: '60%', top: '24%' }}
              >
                <div className="bg-[#0b0f17]/95 border border-amber-500/50 text-amber-300 px-3 py-1 rounded-full text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Peak Intake: 312 OPD</span>
                </div>
              </div>

              {/* Floating Callout 2 (Triage: 42 Acute) */}
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{ left: '80%', top: '65%' }}
              >
                <div className="bg-[#0b0f17]/95 border border-slate-700 text-slate-200 px-3 py-1 rounded-full text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Triage: 42 Acute</span>
                </div>
              </div>
            </div>

            {/* Time Axis Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1e283c] text-xs font-mono text-slate-500">
              <span>08:00</span>
              <span>10:00</span>
              <span>12:00</span>
              <span>14:00</span>
              <span>16:00</span>
              <span>18:00</span>
              <span>20:00</span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 4. SPLIT ROW: WORKSTATION HEALTH & AUDIT VAULT                    */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Workstation & Ward Health (Matching "Microservices Health") */}
            <div className="rounded-2xl bg-[#131824] border border-[#222b3d] p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1e283c]">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Workstation & Ward Health</span>
                  </h3>
                  <MoreHorizontal className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 border-b border-[#1b2334]">
                  <div className="col-span-2">Status</div>
                  <div className="col-span-5">Workstation / Ward</div>
                  <div className="col-span-3">Capacity Load</div>
                  <div className="col-span-2 text-right">Avg Wait</div>
                </div>

                {/* Rows with Segmented Meter Bars */}
                <div className="divide-y divide-[#182133] text-xs">
                  {/* Row 1: Emergency */}
                  <div className="grid grid-cols-12 items-center py-3">
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="col-span-5 font-semibold text-white truncate">
                      Emergency & Triage
                    </div>
                    <div className="col-span-3 flex items-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <span
                          key={i}
                          className={`h-4 w-1.5 rounded-xs ${
                            i < 9 ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="col-span-2 text-right font-mono text-slate-300">8 min</div>
                  </div>

                  {/* Row 2: General OPD */}
                  <div className="grid grid-cols-12 items-center py-3">
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="col-span-5 font-semibold text-white truncate">
                      General OPD Clinics
                    </div>
                    <div className="col-span-3 flex items-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <span
                          key={i}
                          className={`h-4 w-1.5 rounded-xs ${
                            i < 10 ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="col-span-2 text-right font-mono text-slate-300">18 min</div>
                  </div>

                  {/* Row 3: Inpatient Wards */}
                  <div className="grid grid-cols-12 items-center py-3">
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="col-span-5 font-semibold text-white truncate">
                      Inpatient & ICU Wards
                    </div>
                    <div className="col-span-3 flex items-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <span
                          key={i}
                          className={`h-4 w-1.5 rounded-xs ${
                            i < 11 ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="col-span-2 text-right font-mono text-slate-300">24 min</div>
                  </div>

                  {/* Row 4: Central Pharmacy */}
                  <div className="grid grid-cols-12 items-center py-3">
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="col-span-5 font-semibold text-white truncate">
                      Central Pharmacy & FEFO
                    </div>
                    <div className="col-span-3 flex items-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <span
                          key={i}
                          className={`h-4 w-1.5 rounded-xs ${
                            i < 6 ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="col-span-2 text-right font-mono text-slate-300">12 min</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Administrative Clinical Audit Vault (Matching "Administrative Audit Vault") */}
            <div className="rounded-2xl bg-[#131824] border border-[#222b3d] p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1e283c]">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Administrative Clinical Audit Vault
                  </h3>
                  <MoreHorizontal className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
                </div>

                {/* Stream of Audit Actions */}
                <div className="divide-y divide-[#182133] pt-1">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                        DB
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          Emergency Admission by Dr. Bekele
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">12 minutes ago</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <Check className="w-3 h-3 text-amber-400" />
                      <span>Verified</span>
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                        NC
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          START Triage Protocol initiated
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">24 minutes ago</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Active</span>
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/30">
                        PT
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          FEFO Insulin Batch Dispensation audited
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">38 minutes ago</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Passed</span>
                    </span>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-500/30">
                        AD
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          Facility Microgrid & Shift Handover logged
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">1 hour ago</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Passed</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RBAC SCOPE BAR & EXECUTIVE OVERSIGHT HUB (PRESERVED FUNCTIONALITY) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#222b3d] bg-[#131824] px-5 py-2.5 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-xs truncate">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                  {grt.rolePrefix}{user?.role ? user.role.replace('_', ' ').toUpperCase() : 'DOCTOR'}
                </span>
                <span className="text-slate-600 mx-2">|</span>
                <span className="text-slate-300 font-normal">{roleInfo.title}</span>
                <span className="text-slate-600 mx-2">|</span>
                <span className="text-slate-400 font-medium">{grt.scopedCount}<strong>{displayedWorkstations.length}</strong></span>
              </div>
            </div>

            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/70 px-2.5 py-0.5 rounded-md shrink-0 self-end sm:self-auto flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {user?.role === 'admin' || user?.role === 'super_admin' ? grt.executiveActive : grt.rbacActive}
            </span>
          </div>

          {/* DEDICATED HOSPITAL EXECUTIVE OVERSIGHT & DIRECT CONTACT HUB (ADMIN & SUPER ADMIN) */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <AdminOversightHub />
          )}

          {/* ================================================================= */}
          {/* 5. WORKSTATION DIRECTORY — SEARCH, FILTER & 27 TILES             */}
          {/* ================================================================= */}
          <div className="space-y-4">
            {/* Filter Toolbar: Modern Minimalist Search Bar & Category Pills */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
              {/* Sleek Search Bar */}
              <div className="relative w-full sm:w-80 md:w-96 shrink-0">
                <div className="flex h-10 items-center rounded-xl border border-[#222b3d] bg-[#131824] px-3 shadow-xs focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all duration-150">
                  <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder={t('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-medium text-white placeholder-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="ml-1 text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className="ml-2 rounded-md bg-[#0b0f17] px-2 py-0.5 text-xs font-mono font-medium text-amber-400 border border-[#222b3d] shrink-0">
                    {displayedWorkstations.length}
                  </span>
                </div>
              </div>

              {/* Minimalist Unified Category Segmented Control */}
              <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-[#0b0f17] border border-[#1e2636] p-1 text-xs font-medium custom-scrollbar">
                {[
                  { id: 'all', label: `${t('all_tab')} (${workstations.length})`, icon: null },
                  { id: 'emergency', label: t('emergency_triage'), icon: AlertOctagon },
                  { id: 'clinical', label: t('clinical_care'), icon: Stethoscope },
                  { id: 'operations', label: t('operations_erp'), icon: Briefcase },
                  { id: 'governance', label: t('regulations_governance'), icon: Scale },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-[#131824]'
                      }`}
                    >
                      {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 27 WORKSTATIONS GRID — Clean, Modern & Professional Enterprise Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {displayedWorkstations.map((item) => {
                const titleText = item.title[lang] || item.title.en;
                const subtitleText = item.subtitle[lang] || item.subtitle.en;
                const badgeText = item.badge ? item.badge[lang] || item.badge.en : null;
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    prefetch={true}
                    onMouseEnter={() => router.prefetch(item.href)}
                    onFocus={() => router.prefetch(item.href)}
                    className="group relative flex flex-col justify-between rounded-xl border border-[#1e2636] bg-[#0f1420] hover:bg-[#131926] hover:border-amber-500/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)] p-4 transition-all duration-150 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 group-hover:scale-105 group-hover:border-amber-500/40 transition-all">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {badgeText && (
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#0b0e17] text-amber-300 border border-amber-500/30">
                              {badgeText}
                            </span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors leading-snug">
                        {titleText}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 group-hover:text-slate-300 transition-colors">
                        {subtitleText}
                      </p>
                    </div>
                  </Link>
                );
              })}

              {displayedWorkstations.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm font-medium text-slate-400 bg-[#131824] rounded-2xl border border-[#222b3d]">
                  {grt.noFound} &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </div>

          {/* EMERGENCY PROTOCOL MODAL */}
          {emergencyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="flex w-full max-w-lg flex-col rounded-xl bg-white dark:bg-[#0f172a] shadow-xl border border-rose-200 dark:border-rose-900/60 overflow-hidden">
                <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/40 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 animate-pulse" />
                    <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                      {emr.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(false)}
                    className="rounded-lg p-1 text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCodeBlue(true);
                        setEmergencyModalOpen(false);
                      }}
                      className="flex flex-col items-center justify-center rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 text-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer group"
                    >
                      <HeartPulse className="h-7 w-7 text-blue-600 dark:text-blue-400 mb-2 group-hover:text-white transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200 group-hover:text-white">
                        {emr.codeBlue}
                      </span>
                      <span className="text-[11px] text-blue-700 dark:text-blue-400 group-hover:text-blue-100 mt-0.5">
                        {emr.codeBlueDesc}
                      </span>
                    </button>

                    <Link
                      href="/mci"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 p-4 text-center hover:bg-rose-600 hover:text-white transition-all group"
                    >
                      <AlertOctagon className="h-7 w-7 text-rose-600 dark:text-rose-400 mb-2 group-hover:text-white transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-200 group-hover:text-white">
                        {emr.mci}
                      </span>
                      <span className="text-[11px] text-rose-700 dark:text-rose-400 group-hover:text-rose-100 mt-0.5">
                        {emr.mciDesc}
                      </span>
                    </Link>

                    <Link
                      href="/ems"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 text-center hover:bg-slate-800 hover:text-white transition-all group"
                    >
                      <Ambulance className="h-7 w-7 text-slate-700 dark:text-slate-300 mb-2 group-hover:text-white transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-white">
                        {emr.ems}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-200 mt-0.5">
                        {emr.emsDesc}
                      </span>
                    </Link>

                    <Link
                      href="/patients"
                      onClick={() => setEmergencyModalOpen(false)}
                      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 text-center hover:bg-teal-700 hover:text-white transition-all group"
                    >
                      <UserPlus className="h-7 w-7 text-teal-600 dark:text-teal-400 mb-2 group-hover:text-white transition-transform group-hover:scale-110" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-white">
                        {emr.fastIntake}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-teal-100 mt-0.5">
                        {emr.fastIntakeDesc}
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(false)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {emr.close}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CODE BLUE BANNER (IF TRIGGERED) */}
          {activeCodeBlue && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-xl bg-blue-900 p-4 text-white shadow-xl border border-blue-400">
              <HeartPulse className="h-6 w-6 text-blue-200 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  {emr.activeCodeBlue}
                </p>
                <p className="text-xs text-blue-200 mt-0.5">
                  {emr.activeCodeBlueDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCodeBlue(false)}
                className="ml-3 rounded-lg bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer shrink-0"
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

function AlertCircleIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
