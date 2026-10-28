/**
 * Shared TypeScript type definitions for the Mettu Karl HIS frontend.
 */

/** User roles matching the backend UserRole enum */
export type UserRole =
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'insurance_officer'
  | 'technician'
  | 'patient'
  | 'super_admin'
  | 'lab_technician'
  | 'receptionist'
  | 'billing'
  | 'auditor';

/** Authenticated user object */
export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  isActive: boolean;
  patientId?: number;
  mrn?: string;
  fhirId?: string;
  faydaId?: string;
  phone?: string;
}

/** JWT token pair returned by the auth API */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

/** MFA challenge response from /auth/login when MFA is enabled */
export interface MFAChallengeResponse {
  mfa_required: true;
  mfa_token: string;
}

/** Patient record as stored internally */
export interface Patient {
  id: number;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date string YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | 'unknown';
  phone?: string;
  email?: string;
  addressLine?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry: string;
  fhirId: string;
  createdAt: string;
  updatedAt: string;
}

/** FHIR R4 HumanName */
export interface FHIRHumanName {
  use?: string;
  family: string;
  given: string[];
}

/** FHIR R4 ContactPoint */
export interface FHIRContactPoint {
  system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value: string;
  use?: string;
}

/** FHIR R4 Address */
export interface FHIRAddress {
  use?: string;
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** FHIR R4 Patient resource */
export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{
    use?: string;
    system?: string;
    value: string;
  }>;
  name: FHIRHumanName[];
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  telecom?: FHIRContactPoint[];
  address?: FHIRAddress[];
}

/** FHIR R4 Bundle (searchset) */
export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'searchset';
  total: number;
  entry: Array<{
    fullUrl: string;
    resource: FHIRPatient;
  }>;
}

/** Generic API error response */
export interface APIError {
  detail: string | Array<{ msg: string; loc: string[] }>;
}

/** Pagination params */
export interface PaginationParams {
  page: number;
  pageSize: number;
}
