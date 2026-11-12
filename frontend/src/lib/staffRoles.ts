/**
 * Shared RBAC role catalog and timestamp formatters for Admin security panels.
 */
import type { UserRole } from '@/types';

export const REQUEST_TO_DEFAULT_ROLE: Record<string, UserRole> = {
  doctor: 'doctor',
  specialist: 'doctor',
  consultant: 'doctor',
  nurse: 'nurse',
  paramedic: 'nurse',
  pharmacist: 'pharmacist',
  lab_tech: 'lab_tech',
  radiographer: 'lab_tech',
  technician: 'technician',
  biomedical: 'technician',
  receptionist: 'receptionist',
  billing: 'billing',
  auditor: 'billing',
  insurance_officer: 'insurance_officer',
  admin: 'admin',
  ict_admin: 'admin',
};

export const STAFF_ROLE_OPTIONS: Array<{
  value: UserRole;
  label: string;
  superAdminOnly?: boolean;
}> = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab_tech', label: 'Lab Technologist' },
  { value: 'technician', label: 'Technician / BioMed' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'billing', label: 'Billing Officer' },
  { value: 'insurance_officer', label: 'Insurance (CBHI)' },
  { value: 'admin', label: 'Administrator', superAdminOnly: true },
];

export type StaffRoleGroupKey =
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'lab_diag'
  | 'support_finance'
  | 'admin_security';

export interface StaffRoleGroupMeta {
  key: StaffRoleGroupKey;
  labelEn: string;
  labelOm: string;
  shortLabel: string;
  accentClass: string;
  badgeClass: string;
}

export const STAFF_ROLE_GROUPS: readonly StaffRoleGroupMeta[] = [
  {
    key: 'doctor',
    labelEn: 'Doctors & Specialists',
    labelOm: 'Doktaroota (Doctors)',
    shortLabel: 'Doctors',
    accentClass: 'border-sky-500/35 bg-sky-950/20',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  {
    key: 'nurse',
    labelEn: 'Nurses & Triage',
    labelOm: 'Narsiitota (Nurses)',
    shortLabel: 'Nurses',
    accentClass: 'border-teal-500/35 bg-teal-950/20',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  },
  {
    key: 'pharmacist',
    labelEn: 'Pharmacy & Dispensary',
    labelOm: 'Faarmaasii (Pharmacy)',
    shortLabel: 'Pharmacy',
    accentClass: 'border-emerald-500/35 bg-emerald-950/20',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    key: 'lab_diag',
    labelEn: 'Laboratory & BioMed Tech',
    labelOm: 'Laaboraatorii & Tech',
    shortLabel: 'Lab & Tech',
    accentClass: 'border-violet-500/35 bg-violet-950/20',
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  },
  {
    key: 'support_finance',
    labelEn: 'Reception, Billing & Insurance',
    labelOm: 'Simannaa, Kaffaltii & CBHI',
    shortLabel: 'Support & Billing',
    accentClass: 'border-amber-500/30 bg-amber-950/15',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    key: 'admin_security',
    labelEn: 'Admin Claims & Security Risk',
    labelOm: 'Bulchiinsa & Security Risk',
    shortLabel: 'Admin / Risk',
    accentClass: 'border-rose-500/45 bg-rose-950/20',
    badgeClass: 'bg-rose-500/25 text-rose-200 border-rose-500/50',
  },
] as const;

export function classifyStaffRoleGroup(
  roleOrDept?: string | null,
  riskFlag?: string | null,
): StaffRoleGroupKey {
  if (riskFlag) return 'admin_security';
  const val = (roleOrDept || '').trim().toLowerCase();
  if (val === 'doctor' || val === 'specialist' || val === 'consultant') return 'doctor';
  if (val === 'nurse' || val === 'paramedic') return 'nurse';
  if (val === 'pharmacist' || val === 'pharmacy') return 'pharmacist';
  if (
    val === 'lab_tech' ||
    val === 'lab_technician' ||
    val === 'technician' ||
    val === 'radiographer' ||
    val === 'biomedical' ||
    val === 'laboratory' ||
    val === 'lab'
  ) {
    return 'lab_diag';
  }
  if (
    val === 'admin' ||
    val === 'ict_admin' ||
    val === 'super_admin' ||
    val === 'superadmin' ||
    val === 'root' ||
    val === 'unverified'
  ) {
    return 'admin_security';
  }
  return 'support_finance';
}

export function resolveStaffRoleGroup(
  explicitGroup?: string | null,
  roleOrDept?: string | null,
  riskFlag?: string | null,
): StaffRoleGroupKey {
  if (
    explicitGroup === 'doctor' ||
    explicitGroup === 'nurse' ||
    explicitGroup === 'pharmacist' ||
    explicitGroup === 'lab_diag' ||
    explicitGroup === 'support_finance' ||
    explicitGroup === 'admin_security'
  ) {
    return explicitGroup;
  }
  return classifyStaffRoleGroup(roleOrDept, riskFlag);
}

export function formatRelativeTimestamp(iso?: string | null): string {
  if (!iso) return 'Never';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return iso;
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString();
}
