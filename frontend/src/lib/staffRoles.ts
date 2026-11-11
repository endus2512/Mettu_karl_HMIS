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
