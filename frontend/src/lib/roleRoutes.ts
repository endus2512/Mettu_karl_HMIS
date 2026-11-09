/**
 * Role-to-Portal Route Resolution and Access Control Matrix.
 * Defines isolated, dedicated portals for each clinical and administrative role.
 */
import type { UserRole } from '@/types';

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
