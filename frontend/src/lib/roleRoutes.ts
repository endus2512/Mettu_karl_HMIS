/**
 * Role-to-Portal Route Resolution and Access Control Matrix.
 * Defines isolated, dedicated portals for each clinical and administrative role.
 */
import type { UserRole } from '@/types';

const LAB_ROLE_ALIASES: readonly UserRole[] = ['technician', 'lab_tech', 'lab_technician'];

/** Returns true only when the role belongs to executive Admin / Super Admin governance. */
export function isAdminRole(role?: UserRole | string | null): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Checks strict role membership while normalizing lab technician aliases
 * (`technician`, `lab_tech`, `lab_technician`). Fails closed if `role` is missing.
 */
export function isRoleAllowed(
  role: UserRole | string | null | undefined,
  allowedRoles: readonly UserRole[],
): boolean {
  if (!role || allowedRoles.length === 0) return false;
  const normalized = String(role).toLowerCase() as UserRole;
  if (allowedRoles.includes(normalized)) return true;
  if (
    LAB_ROLE_ALIASES.includes(normalized) &&
    allowedRoles.some((r) => LAB_ROLE_ALIASES.includes(r))
  ) {
    return true;
  }
  return false;
}

export interface RouteAccessRule {
  allowedRoles: readonly UserRole[];
  moduleName: string;
  category: 'clinical' | 'administrative' | 'financial';
}

/**
 * Single Source of Truth RBAC Matrix for all 31 routes under `(clinical)/*`.
 * Aligned strictly with Sidebar navigation permissions; default fallback is Admin-only.
 */
export const CLINICAL_ROUTE_ACCESS: Record<string, RouteAccessRule> = {
  '/academic': {
    allowedRoles: ['doctor', 'admin', 'super_admin'],
    moduleName: 'Academic & Clinical Research',
    category: 'clinical',
  },
  '/accounting': {
    allowedRoles: ['billing', 'admin', 'super_admin'],
    moduleName: 'Finance & Bank Ledger',
    category: 'financial',
  },
  '/analytics': {
    allowedRoles: ['admin', 'super_admin'],
    moduleName: 'Executive BI Analytics',
    category: 'administrative',
  },
  '/assets': {
    allowedRoles: ['technician', 'lab_tech', 'lab_technician', 'admin', 'super_admin'],
    moduleName: 'Biomedical Assets & Calibration',
    category: 'administrative',
  },
  '/audit': {
    allowedRoles: ['admin', 'auditor', 'super_admin'],
    moduleName: 'INSA Security & EHSTG Clinical Audit',
    category: 'administrative',
  },
  '/billing': {
    allowedRoles: ['billing', 'insurance_officer', 'admin', 'super_admin'],
    moduleName: 'Billing, Telebirr & Cashier Desk',
    category: 'financial',
  },
  '/blood-bank': {
    allowedRoles: ['technician', 'lab_tech', 'lab_technician', 'doctor', 'nurse', 'admin', 'super_admin'],
    moduleName: 'SafeBlood Screening & Inventory',
    category: 'clinical',
  },
  '/crm': {
    allowedRoles: ['insurance_officer', 'admin', 'super_admin'],
    moduleName: 'Patient Experience & CRM',
    category: 'administrative',
  },
  '/dietary': {
    allowedRoles: ['nurse', 'admin', 'super_admin'],
    moduleName: 'Dietary & Therapeutic Kitchen',
    category: 'clinical',
  },
  '/efda': {
    allowedRoles: ['pharmacist', 'admin', 'super_admin'],
    moduleName: 'EFDA Narcotics & Controlled Registry',
    category: 'clinical',
  },
  '/ems': {
    allowedRoles: ['nurse', 'receptionist', 'admin', 'super_admin'],
    moduleName: 'EMS Dispatch & *907* Response',
    category: 'clinical',
  },
  '/fayda': {
    allowedRoles: ['receptionist', 'nurse', 'insurance_officer', 'billing', 'admin', 'super_admin'],
    moduleName: 'Fayda National Digital ID Verification',
    category: 'administrative',
  },
  '/hrm': {
    allowedRoles: ['admin', 'super_admin'],
    moduleName: 'HRM & Staff Payroll',
    category: 'administrative',
  },
  '/infection': {
    allowedRoles: ['nurse', 'doctor', 'admin', 'super_admin'],
    moduleName: 'Infection Control & Epidemiology',
    category: 'clinical',
  },
  '/insurance': {
    allowedRoles: ['insurance_officer', 'billing', 'admin', 'super_admin'],
    moduleName: 'CBHI & Health Insurance Claims',
    category: 'financial',
  },
  '/iomt': {
    allowedRoles: ['doctor', 'nurse', 'technician', 'lab_tech', 'lab_technician', 'admin', 'super_admin'],
    moduleName: 'IoMT Telemetry & ICU Monitors',
    category: 'clinical',
  },
  '/laboratory': {
    allowedRoles: ['technician', 'lab_tech', 'lab_technician', 'doctor', 'nurse', 'admin', 'super_admin'],
    moduleName: 'Laboratory LIS & Pathology',
    category: 'clinical',
  },
  '/mci': {
    allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
    moduleName: 'MCI Mass Casualty START Triage',
    category: 'clinical',
  },
  '/mortuary': {
    allowedRoles: ['doctor', 'admin', 'super_admin'],
    moduleName: 'Mortuary & Medico-Legal Registry',
    category: 'clinical',
  },
  '/ot': {
    allowedRoles: ['doctor', 'nurse', 'admin', 'super_admin'],
    moduleName: 'Operating Theatre & CSSD',
    category: 'clinical',
  },
  '/pacs': {
    allowedRoles: ['doctor', 'technician', 'lab_tech', 'lab_technician', 'nurse', 'admin', 'super_admin'],
    moduleName: 'DICOM PACS & Radiology',
    category: 'clinical',
  },
  '/patients': {
    allowedRoles: ['doctor', 'nurse', 'receptionist', 'admin', 'super_admin'],
    moduleName: 'Patient Clinical Records (FHIR)',
    category: 'clinical',
  },
  '/pharmacy': {
    allowedRoles: ['pharmacist', 'doctor', 'nurse', 'admin', 'super_admin'],
    moduleName: 'Pharmacy FEFO Dispensary',
    category: 'clinical',
  },
  '/power': {
    allowedRoles: ['technician', 'lab_tech', 'lab_technician', 'admin', 'super_admin'],
    moduleName: 'Power Resilience & EEU Grid',
    category: 'administrative',
  },
  '/procurement': {
    allowedRoles: ['admin', 'pharmacist', 'super_admin'],
    moduleName: 'Procurement & Tenders',
    category: 'financial',
  },
  '/queue': {
    allowedRoles: ['receptionist', 'nurse', 'doctor', 'admin', 'super_admin'],
    moduleName: 'OPD Smart Queue Management',
    category: 'clinical',
  },
  '/scanner': {
    allowedRoles: ['doctor', 'nurse', 'pharmacist', 'billing', 'technician', 'lab_tech', 'lab_technician', 'admin', 'super_admin'],
    moduleName: 'GS1 Barcode & QR Scanner',
    category: 'clinical',
  },
  '/sms-ussd': {
    allowedRoles: ['admin', 'nurse', 'doctor', 'receptionist', 'super_admin'],
    moduleName: 'SMS & *907# USSD Gateway',
    category: 'administrative',
  },
  '/telemed': {
    allowedRoles: ['doctor', 'admin', 'super_admin'],
    moduleName: 'Telemedicine Consultations',
    category: 'clinical',
  },
  '/wards': {
    allowedRoles: ['nurse', 'doctor', 'admin', 'super_admin'],
    moduleName: 'Inpatient Wards & Bed Board',
    category: 'clinical',
  },
  '/waste': {
    allowedRoles: ['technician', 'lab_tech', 'lab_technician', 'nurse', 'admin', 'super_admin'],
    moduleName: 'Biohazard & Clinical Waste',
    category: 'administrative',
  },
};

/**
 * Resolves the RBAC policy for any clinical route pathname. Fails closed to Admin-only.
 */
export function resolveClinicalRouteAccess(pathname: string): RouteAccessRule {
  const cleanPath = (pathname || '/').replace(/^\/Mettu_karl_HMIS/, '') || '/';
  for (const [prefix, rule] of Object.entries(CLINICAL_ROUTE_ACCESS)) {
    if (cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)) {
      return rule;
    }
  }
  return {
    allowedRoles: ['admin', 'super_admin'],
    moduleName: 'Restricted Hospital Workstation',
    category: 'administrative',
  };
}

export function getRolePortalPath(role?: UserRole | string | null): string {
  switch (role) {
    case 'doctor':
      return '/portal/doctor';
    case 'nurse':
      return '/portal/nurse';
    case 'pharmacist':
      return '/portal/pharmacy';
    case 'technician':
    case 'lab_tech':
    case 'lab_technician':
      return '/portal/lab';
    case 'billing':
    case 'insurance_officer':
      return '/portal/billing';
    case 'receptionist':
      return '/portal/reception';
    case 'patient':
      return '/patient-portal';
    case 'admin':
    case 'super_admin':
      return '/portal/admin';
    default:
      return '/portal/doctor';
  }
}

export function getRoleDisplayName(role?: UserRole | string | null, lang: 'en' | 'om' | 'am' = 'en'): string {
  const names: Record<string, { en: string; om: string; am: string }> = {
    doctor: {
      en: 'Physician / Doctor Workstation',
      om: 'Wiirtuu Yaalaa fi Doktaraa',
      am: 'የዶክተርና ክሊኒካል ስራ ክፍል',
    },
    nurse: {
      en: 'Nurse & Inpatient Station',
      om: 'Wiirtuu Narsiitotaa fi Ciisichaa',
      am: 'የነርሶችና ተኝቶ ህክምና ክፍል',
    },
    pharmacist: {
      en: 'Pharmacy Dispensary & FEFO Desk',
      om: 'Faarmaasii & Qoricha (FEFO)',
      am: 'የፋርማሲና መድኃኒት ስርጭት',
    },
    technician: {
      en: 'Laboratory LIS & Pathology Bench',
      om: 'Laaboraatorii & Qorannoo LIS',
      am: 'የላቦራቶሪና ምርመራ ክፍል',
    },
    lab_tech: {
      en: 'Laboratory LIS & Pathology Bench',
      om: 'Laaboraatorii & Qorannoo LIS',
      am: 'የላቦራቶሪና ምርመራ ክፍል',
    },
    lab_technician: {
      en: 'Laboratory LIS & Pathology Bench',
      om: 'Laaboraatorii & Qorannoo LIS',
      am: 'የላቦራቶሪና ምርመራ ክፍል',
    },
    billing: {
      en: 'Billing, POS & Insurance Desk',
      om: 'Wiirtuu Kaffaltii, Telebirr & CBHI',
      am: 'የክፍያ፣ ቴሌብርና መድህን ዴስክ',
    },
    insurance_officer: {
      en: 'Billing, POS & Insurance Desk',
      om: 'Wiirtuu Kaffaltii, Telebirr & CBHI',
      am: 'የክፍያ፣ ቴሌብርና መድህን ዴስክ',
    },
    receptionist: {
      en: 'Reception, Triage & Queue Counter',
      om: 'Wiirtuu Simannaa, Fayda & Dabaree',
      am: 'የመስተንግዶ፣ ፋይዳና የተራ ቁጥር ክፍል',
    },
    admin: {
      en: 'Executive Command Center',
      om: 'Wiirtuu Bulchiinsa Hospitaalaa',
      am: 'የሆስፒታል የበላይ አመራር ማዕከል',
    },
    super_admin: {
      en: 'Root Executive Command Center',
      om: 'Wiirtuu Bulchiinsa Olaanaa (Root)',
      am: 'የበላይ አመራርና ስርዓት ተቆጣጣሪ',
    },
    patient: {
      en: 'Patient Health Portal',
      om: 'Poortaalii Dhukkubsattootaa',
      am: 'የታካሚዎች ጤና ፖርታል',
    },
  };

  const key = role ? String(role).toLowerCase() : 'doctor';
  const entry = names[key] || names.doctor;
  return entry[lang] || entry.en;
}
