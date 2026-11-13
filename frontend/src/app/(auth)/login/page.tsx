/**
 * Mettu Karl Referral Hospital HMIS — Full-Screen Login & Interactive Portal Page
 *
 * SPECIFICATION & INTERACTIVE UX:
 * - Default State:
 *   - The login form is initially hidden as requested.
 *   - The screen showcases the full hospital building image and hospital branding.
 *   - Centered on the hospital building image are interactive, animated action buttons:
 *     1. [ Seeni (Login) ] — animated gradient shimmer, hover scale, pulse glow.
 *     2. [ Galmaa'i (Sign Up) ] — frosted glass border, hover glow, animated shimmer.
 * - On Click:
 *   - Clicking Login or Sign Up smoothly brings up the page form modal with backdrop blur.
 *   - A close button (or Escape key / backdrop click) closes the form and returns to the animated hero view.
 *   - Supports switching seamlessly between Login and Sign Up.
 * - Branding & Aesthetics:
 *   - Official logo, title, and tagline in header.
 *   - 4 service cards in bottom bar with small "Mettu Karl Referral Hospital HMIS" tagline.
 *   - Slender left border on building panel.
 *   - Single interchangeable Light/Dark theme toggle button (no text).
 *   - Fully connected to FastAPI backend authentication.
 */
'use client';

import React, { useState, useEffect, useId, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { getRolePortalPath } from '@/lib/roleRoutes';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Headphones,
  Globe,
  ChevronDown,
  Bed,
  Stethoscope,
  BarChart2,
  UserCheck,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  X,
  Check,
  Info,
  UserPlus,
  Sparkles,
  Building2,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  ShieldAlert,
  Pill,
  Microscope,
  Receipt,
  AlertCircle,
  Shield,
  CheckCircle2,
  Mail,
  Send,
  PhoneCall,
  Loader2,
  Clock,
} from 'lucide-react';
import axios from 'axios';
import apiClient, { getApiOrigin } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTranslation, type Language } from '@/lib/i18n';
import { playClinicalAudioAlert } from '@/lib/notifications';
import { DigitalLedBoard } from '@/components/common/DigitalLedBoard';
import {
  DEFAULT_LED_SIGNAGE_CONFIG,
  fetchLedSignageConfig,
  isSameLedConfig,
  readCachedLedSignage,
  subscribeLedSignage,
  type LedSignageConfig,
} from '@/lib/ledSignage';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username or Staff ID must be at least 3 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

const mfaSchema = z.object({
  totp_code: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d+$/, 'Digits only'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type MFAFormData = z.infer<typeof mfaSchema>;

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

interface PageText {
  hospitalName: string;
  hmisTitle: string;
  hmisSubtitle: string;
  tagline: string;
  welcomeBack: string;
  welcomeSubtitle: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberMe: string;
  forgotPassword: string;
  loginBtn: string;
  signingIn: string;
  orDivider: string;
  secureAccessTitle: string;
  secureAccessSubtitle: string;
  itSupportTitle: string;
  itSupportContact: string;
  servicePatient: string;
  serviceInpatient: string;
  serviceClinical: string;
  serviceAnalytics: string;
  copyright: string;
  mfaTitle: string;
  mfaDesc: string;
  mfaPlaceholder: string;
  mfaVerifyBtn: string;
  mfaBackBtn: string;
  forgotModalTitle: string;
  forgotModalSubtitle: string;
  forgotModalStep1: string;
  forgotModalStep2: string;
  forgotModalContact: string;
  forgotModalClose: string;
  capsLockOn: string;
  clearField: string;
  systemOperational: string;
  passwordStrengthWeak: string;
  passwordStrengthMedium: string;
  passwordStrengthStrong: string;
  passwordMatch: string;
  passwordMismatch: string;
}

const copy: Record<Language, PageText> = {
  en: {
    hospitalName: 'Mettu Karl Referral Hospital',
    hmisTitle: 'HMIS',
    hmisSubtitle: 'Hospital Management Information System',
    tagline: 'Better Information | Better Care | Healthier Community',
    welcomeBack: 'Welcome Back',
    welcomeSubtitle: 'Sign in to access your staff workstation or patient healthcare portal',
    usernameLabel: 'Username / Staff ID / Fayda / Phone',
    usernamePlaceholder: 'Enter Username, Staff ID, Fayda FAN, or Phone Number',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot Password?',
    loginBtn: 'Login',
    signingIn: 'Signing in...',
    orDivider: 'or',
    secureAccessTitle: 'Secure Access',
    secureAccessSubtitle: 'Your data is protected and confidential.',
    itSupportTitle: 'IT Support',
    itSupportContact: 'Contact IT Support',
    servicePatient: 'Patient Management',
    serviceInpatient: 'Inpatient & Ward Management',
    serviceClinical: 'Clinical Services',
    serviceAnalytics: 'Reports & Analytics',
    copyright: 'Mettu Karl Referral Hospital HMIS',
    mfaTitle: 'Two-Factor Verification',
    mfaDesc: 'Enter the 6-digit code from your authenticator app to proceed.',
    mfaPlaceholder: '123456',
    mfaVerifyBtn: 'Verify Code',
    mfaBackBtn: 'Back to Credentials',
    forgotModalTitle: 'Password Recovery Assistance',
    forgotModalSubtitle: 'For institutional healthcare security, automated self-reset is restricted.',
    forgotModalStep1: 'Contact the Hospital ICT Department in person (Administrative Block, 2nd Floor, Room 204).',
    forgotModalStep2: 'Call internal ICT extension 4401 or dial emergency IT hotline: +251 47 111 0204.',
    forgotModalContact: 'ict-support@mettukarl.gov.et',
    forgotModalClose: 'Understood, Close',
    capsLockOn: 'Caps Lock is ON!',
    clearField: 'Clear',
    systemOperational: 'System Operational',
    passwordStrengthWeak: 'Weak password',
    passwordStrengthMedium: 'Medium strength',
    passwordStrengthStrong: 'Strong password',
    passwordMatch: 'Passwords match',
    passwordMismatch: 'Passwords do not match',
  },
  om: {
    hospitalName: 'Hospitaala Rifeeraalaa Meettuu Kaarli',
    hmisTitle: 'HMIS',
    hmisSubtitle: 'Sirna Odeeffannoo Bulchiinsa Hospitaalaa',
    tagline: 'Odeeffannoo Fooyya\'aa | Tajaajila Fooyya\'aa | Hawaasa Fayya Qabeessa',
    welcomeBack: 'Baga Nagaan Dhuftan',
    welcomeSubtitle: 'Gara kutaa hojii ogeessaa ykn poortaalii dhukkubsataatti seenaa',
    usernameLabel: 'Maqaa Fayyadamaa / Staff ID / Fayda / Bilbila',
    usernamePlaceholder: 'Username, Staff ID, Fayda ID ykn Lakkoofsa Bilbilaa',
    passwordLabel: 'Jecha Icchitii',
    passwordPlaceholder: 'Jecha icchitii keessan galchaa',
    rememberMe: 'Na yaadadhu',
    forgotPassword: 'Jecha icchitii irraanfattee?',
    loginBtn: 'Seeni',
    signingIn: 'Seenaa jira...',
    orDivider: 'ykn',
    secureAccessTitle: 'Eegumsa Cimaa',
    secureAccessSubtitle: 'Odeeffannoon keessan eegamaadha fi icciitiidha.',
    itSupportTitle: 'Deeggarsa IT',
    itSupportContact: 'Deeggarsa IT Qunnamaa',
    servicePatient: 'Bulchiinsa Dhukkubsataa',
    serviceInpatient: 'Bulchiinsa Kutaa Ciisichaa',
    serviceClinical: 'Tajaajila Kilinikaalaa',
    serviceAnalytics: 'Gabaasa & Xiinxala',
    copyright: 'Mettu Karl Referral Hospital HMIS',
    mfaTitle: 'Mirkaneessa Sadarkaa Lammaffaa',
    mfaDesc: 'Koodii dijiitii 6 appii authenticator keessan irraa dhufe galchaa.',
    mfaPlaceholder: '123456',
    mfaVerifyBtn: 'Koodii Mirkaneessi',
    mfaBackBtn: 'Gara Seensaatti Deebi\'i',
    forgotModalTitle: 'Gargaarsa Jecha Icchitii',
    forgotModalSubtitle: 'Nageenya odeeffannoo fayyaatiif ofumaan haaromsuun dorkamaadha.',
    forgotModalStep1: 'Kutaa ICT Hospitaalaa qaamaan qunnamaa (Gamoosaa Bulchiinsaa, Kutaa 204).',
    forgotModalStep2: 'Lakk. bilbila keessaa ICT 4401 ykn sarara yeroo balaa: +251 47 111 0204 bilbilaa.',
    forgotModalContact: 'ict-support@mettukarl.gov.et',
    forgotModalClose: 'Hubadheera, Cufi',
    capsLockOn: 'Qubee Gurguddaan (Caps Lock) banaadha!',
    clearField: 'Haqi',
    systemOperational: 'Sirnichi Hojjataa Jira',
    passwordStrengthWeak: 'Jecha iccitii laafaa',
    passwordStrengthMedium: 'Jecha iccitii giddu-galeessa',
    passwordStrengthStrong: 'Jecha iccitii cimaa',
    passwordMatch: 'Jechi icchitii wal sima',
    passwordMismatch: 'Jechi icchitii wal hin simne',
  },
  am: {
    hospitalName: 'የመቱ ካርል ሪፈራል ሆስፒታል',
    hmisTitle: 'HMIS',
    hmisSubtitle: 'የሆስፒታል መረጃ አስተዳደር ሥርዓት',
    tagline: 'የተሻለ መረጃ | የተሻለ ክብካቤ | ጤናማ ማህበረሰብ',
    welcomeBack: 'እንኳን ደህና መጡ',
    welcomeSubtitle: 'ወደ ሰራተኛ የስራ ክፍል ወይም ወደ ታካሚ ፖርታል ይግቡ',
    usernameLabel: 'የተጠቃሚ ስም / የሰራተኛ መለያ / ፋይዳ / ስልክ ቁጥር',
    usernamePlaceholder: 'የተጠቃሚ ስም፣ የሰራተኛ መለያ፣ ፋይዳ FAN ወይም ስልክ ቁጥር',
    passwordLabel: 'የይለፍ ቃል',
    passwordPlaceholder: 'የይለፍ ቃልዎን ያስገቡ',
    rememberMe: 'አስታውሰኝ',
    forgotPassword: 'የይለፍ ቃል ረሱ?',
    loginBtn: 'ግባ',
    signingIn: 'በመግባት ላይ...',
    orDivider: 'ወይም',
    secureAccessTitle: 'አስተማማኝ ደህንነት',
    secureAccessSubtitle: 'መረጃዎ የተጠበቀና ሚስጥራዊ ነው።',
    itSupportTitle: 'የ IT ድጋፍ',
    itSupportContact: 'IT ድጋፍን ያግኙ',
    servicePatient: 'የታካሚ አስተዳደር',
    serviceInpatient: 'የተኝቶ ታካሚ ክፍል',
    serviceClinical: 'ክሊኒካል አገልግሎቶች',
    serviceAnalytics: 'ሪፖርቶች እና ትንተና',
    copyright: 'Mettu Karl Referral Hospital HMIS',
    mfaTitle: 'ሁለተኛ ደረጃ ማረጋገጫ',
    mfaDesc: 'ከማረጋገጫ መተግበሪያዎ የ 6-ዲጂት ኮድ ያስገቡ።',
    mfaPlaceholder: '123456',
    mfaVerifyBtn: 'ኮዱን አረጋግጥ',
    mfaBackBtn: 'ወደ መግቢያ ተመለስ',
    forgotModalTitle: 'የይለፍ ቃል መልሶ ማግኛ',
    forgotModalSubtitle: 'ለሆስፒታሉ የጤና መረጃ ደህንነት ሲባል በራስ-ሰር መቀየር አይቻልም።',
    forgotModalStep1: 'የሆስፒታሉን ICT ክፍል በአካል ያግኙ (አስተዳደር ህንፃ፣ 2ኛ ፎቅ፣ ቢሮ 204)።',
    forgotModalStep2: 'የውስጥ መስመር 4401 ይደውሉ ወይም የድንገተኛ ስልክ: +251 47 111 0204 ይጠቀሙ።',
    forgotModalContact: 'ict-support@mettukarl.gov.et',
    forgotModalClose: 'ተረድቻለሁ፣ ዝጋ',
    capsLockOn: 'Caps Lock በርቷል!',
    clearField: 'አጽዳ',
    systemOperational: 'ስርዓቱ በመስራት ላይ ነው',
    passwordStrengthWeak: 'ደካማ የይለፍ ቃል',
    passwordStrengthMedium: 'መካከለኛ የይለፍ ቃል',
    passwordStrengthStrong: 'ጠንካራ የይለፍ ቃል',
    passwordMatch: 'የይለፍ ቃሎች ተዛምደዋል',
    passwordMismatch: 'የይለፍ ቃሎች አይዛመዱም',
  },
};

const STAFF_DEPARTMENTS = [
  { value: 'doctor', text: 'Doctor Consultation & Outpatient Clinics (OPD)' },
  { value: 'clinical', text: 'Clinical Services & Specialized Outpatient Clinics' },
  { value: 'emergency', text: 'Emergency Trauma & Mass Casualty Incident Center' },
  { value: 'surgery', text: 'Operating Theatres (OT Suites 1–4) & CSSD Hub' },
  { value: 'inpatient', text: 'Inpatient Wards & Clinical Bed Census (IPD)' },
  { value: 'icu', text: 'ICU Critical Care & Bedside IoMT Telemetry' },
  { value: 'telemed', text: 'Telemedicine & Video Follow-up Appointments' },
  { value: 'pharmacy', text: 'Central Dispensary & FEFO Drug Formulary' },
  { value: 'laboratory', text: 'ISO-15189 Pathology & Diagnostic Laboratory (LIS)' },
  { value: 'blood_bank', text: 'Blood Bank & Emergency Reserve Inventory' },
  { value: 'radiology', text: 'Radiology, CT & DICOM Web-PACS Imaging' },
  { value: 'reception', text: 'Patient Intake, Queue Dispatch & Fayda ID' },
  { value: 'billing', text: 'Patient Billing, Cashier & Telebirr Gateway' },
  { value: 'insurance', text: 'CBHI & Community Health Insurance Adjudication' },
  { value: 'biomedical', text: 'Biomedical Engineering & Clinical Asset Maintenance' },
  { value: 'infection_control', text: 'Infection Prevention, Epidemiology & Surveillance' },
  { value: 'ems', text: '907 Ambulance Fleet Dispatch & EMS Command' },
  { value: 'admin', text: 'Executive Command, HRM & Hospital Administration' },
  { value: 'ict', text: 'Hospital Information Technology (HMIS Architecture)' },
  { value: 'audit', text: 'Clinical Quality Assurance & EHSTG Governance' },
  { value: 'dietary', text: 'Clinical Nutrition, Diets & Hospital Kitchen' },
  { value: 'mortuary', text: 'Mortuary Cold Vaults & Forensic Pathology' },
];

const STAFF_ROLES = [
  { value: 'doctor', text: 'Medical Doctor / Attending Clinician' },
  { value: 'specialist', text: 'Specialist Surgeon / Clinical Consultant' },
  { value: 'nurse', text: 'Registered Nurse / Ward Charge Nurse' },
  { value: 'pharmacist', text: 'Licensed Pharmacist / Pharmacy Technician' },
  { value: 'lab_tech', text: 'Medical Laboratory Technologist (LIS)' },
  { value: 'radiographer', text: 'Radiographer / PACS Diagnostic Specialist' },
  { value: 'receptionist', text: 'Receptionist / OPD Queue Coordinator' },
  { value: 'billing', text: 'Billing Officer / Cashier Supervisor' },
  { value: 'insurance_officer', text: 'Health Insurance Claims Officer (CBHI / EHIA)' },
  { value: 'biomedical', text: 'Biomedical Clinical Equipment Engineer' },
  { value: 'ict_admin', text: 'ICT Infrastructure & HMIS Administrator' },
  { value: 'admin', text: 'Hospital Executive Administrator / HR Director' },
  { value: 'auditor', text: 'Clinical Governance & EHSTG Quality Auditor' },
  { value: 'paramedic', text: 'EMS Paramedic / Emergency Dispatch Officer' },
];

const BUILDING_PARTS = [
  { id: 1, step: 3, bgPos: '0%' },
  { id: 2, step: 2, bgPos: '25%' },
  { id: 3, step: 1, bgPos: '50%' },
  { id: 4, step: 2, bgPos: '75%' },
  { id: 5, step: 3, bgPos: '100%' },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface PendingStaffWaitState {
  waitToken: string;
  staffId: string;
  fullName: string;
  requestedRole: string;
  status: 'pending' | 'approved' | 'rejected';
  assignedRole?: string;
  portalPath?: string;
  message?: string;
}

const PENDING_WAIT_STORAGE_KEY = 'mkh_staff_pending_wait';

export default function LoginPage() {
  const router = useRouter();
  const { login, completeTokenSession, verifyMFA, patientRegister, user } = useAuth();
  const { language, setLanguage } = useTranslation();

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [mfaToken, setMfaToken] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPatientPassword, setShowPatientPassword] = useState(false);
  const [showPatientConfirmPassword, setShowPatientConfirmPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal dialog states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showITSupportModal, setShowITSupportModal] = useState(false);

  // Interactive Form Popup State: initially hidden as requested
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'login' | 'signup'>('login');

  // Sign up account type: Patient vs Staff
  const [signupAccountType, setSignupAccountType] = useState<'patient' | 'staff'>('patient');

  // Staff Sign up state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupStaffId, setSignupStaffId] = useState('');
  const [signupDept, setSignupDept] = useState('doctor');
  const [signupRole, setSignupRole] = useState('doctor');
  const [signupLicenseNumber, setSignupLicenseNumber] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupBiography, setSignupBiography] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupNotice, setSignupNotice] = useState<string | null>(null);
  const [pendingWait, setPendingWait] = useState<PendingStaffWaitState | null>(null);

  const isClinicalSignup =
    signupDept === 'doctor' ||
    signupRole === 'doctor' ||
    signupRole === 'specialist' ||
    signupRole === 'consultant' ||
    signupRole === 'nurse' ||
    signupRole === 'pharmacist' ||
    signupRole === 'lab_tech' ||
    signupRole === 'radiographer';

  const isPrivilegedSignup =
    signupRole === 'admin' || signupRole === 'ict_admin' || signupRole === 'auditor';

  // Formal Patient Registration state
  const [patientUsername, setPatientUsername] = useState('');
  const [patientFullName, setPatientFullName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientFaydaId, setPatientFaydaId] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientBirthDate, setPatientBirthDate] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female'>('male');
  const [patientCbhi, setPatientCbhi] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [patientConfirmPassword, setPatientConfirmPassword] = useState('');

  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  const usernameId = useId();
  const passwordId = useId();
  const mfaId = useId();
  const langMenuRef = useRef<HTMLDivElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Progressive cinematic part-by-part reveal for the hospital building
  // Step 0: All shutter blades veiled
  // Step 1: Part 3 (Center Entrance) reveals smoothly
  // Step 2: Part 2 & Part 4 (West & East inner wings) reveal
  // Step 3: Part 1 & Part 5 (Left & Right outer wings) reveal (all 5 parts visible!)
  // Step 4: The 5 slices unite into seamless high-definition full image with Ken Burns drift
  // Step 5: Branding, badges, and interactive buttons glide in with glow
  const [revealStep, setRevealStep] = useState(5);

  const startRevealSequence = useCallback(() => {
    setRevealStep(0);
    const t1 = setTimeout(() => setRevealStep(1), 150);
    const t2 = setTimeout(() => setRevealStep(2), 650);
    const t3 = setTimeout(() => setRevealStep(3), 1150);
    const t4 = setTimeout(() => setRevealStep(4), 1650);
    const t5 = setTimeout(() => setRevealStep(5), 2050);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  useEffect(() => {
    const cancel = startRevealSequence();
    return cancel;
  }, [startRevealSequence]);

  const t = copy[language] ?? copy.en;

  // Password strength calculation helper for registration
  function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8 && /[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score++;
    if (pwd.length >= 10 && /[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) {
      return {
        score: 1,
        label: t.passwordStrengthWeak,
        color: 'bg-rose-500 text-rose-400',
      };
    }
    if (score === 2) {
      return {
        score: 2,
        label: t.passwordStrengthMedium,
        color: 'bg-amber-500 text-amber-400',
      };
    }
    return {
      score: 3,
      label: t.passwordStrengthStrong,
      color: 'bg-emerald-500 text-emerald-400',
    };
  }

  // Set theme mode explicitly (light or dark)
  function setThemeMode(dark: boolean) {
    setIsDarkMode(dark);
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }
  }

  // Sync dark mode class & load persisted theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setThemeMode(shouldBeDark);
  }, []);

  // Digital LED Marquee Signboard live state (synced across all devices via backend + polling)
  const [ledConfig, setLedConfig] = useState<LedSignageConfig>(DEFAULT_LED_SIGNAGE_CONFIG);

  useEffect(() => {
    setLedConfig(readCachedLedSignage());
    let active = true;
    const syncRemote = () => {
      void fetchLedSignageConfig().then((cfg) => {
        if (!active) return;
        setLedConfig((prev) => (isSameLedConfig(prev, cfg) ? prev : cfg));
      });
    };

    syncRemote();
    const unsubscribe = subscribeLedSignage((updated) => {
      if (!active) return;
      setLedConfig((prev) => (isSameLedConfig(prev, updated) ? prev : updated));
    });

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncRemote();
      }
    }, 6000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncRemote();
      }
    };
    window.addEventListener('focus', syncRemote);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncRemote);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Hydrate same-tab live approval waiting session on mount if not already logged in
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('access_token')) {
      sessionStorage.removeItem(PENDING_WAIT_STORAGE_KEY);
      return;
    }
    try {
      const raw = sessionStorage.getItem(PENDING_WAIT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PendingStaffWaitState;
      if (parsed?.waitToken && parsed.status === 'pending') {
        setPendingWait(parsed);
        setFormType('login');
        setIsFormOpen(true);
      }
    } catch {
      sessionStorage.removeItem(PENDING_WAIT_STORAGE_KEY);
    }
  }, []);

  // Poll backend spontaneously while pending staff waits for Admin verification;
  // immediately celebrate and auto-route into their assigned portal once Allowed/Approved.
  useEffect(() => {
    if (!pendingWait || pendingWait.status !== 'pending' || !pendingWait.waitToken) {
      return;
    }

    let cancelled = false;
    const pollApproval = async () => {
      if (cancelled) return;
      try {
        const res = await apiClient.post<{
          status: 'pending' | 'approved' | 'rejected';
          staff_id?: string | null;
          full_name: string;
          requested_role?: string | null;
          assigned_role?: string | null;
          portal_path?: string | null;
          rejection_reason?: string | null;
          message: string;
          access_token?: string | null;
          refresh_token?: string | null;
          requires_mfa?: boolean;
          temp_token?: string | null;
        }>(
          '/auth/staff/approval-status',
          { wait_token: pendingWait.waitToken },
          { timeout: 10000 },
        );

        if (cancelled) return;
        const data = res.data;

        if (data.status === 'rejected') {
          sessionStorage.removeItem(PENDING_WAIT_STORAGE_KEY);
          setSignupNotice(null);
          setPendingWait((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'rejected',
                  fullName: data.full_name || prev.fullName,
                  message: data.rejection_reason || data.message,
                }
              : null,
          );
          notifications.show({
            title:
              language === 'om'
                ? 'Galmeen Cufame / Kufaa Ta’e'
                : 'Application Rejected by Admin',
            message: data.rejection_reason || data.message,
            color: 'red',
          });
          return;
        }

        if (data.status === 'approved') {
          cancelled = true;
          sessionStorage.removeItem(PENDING_WAIT_STORAGE_KEY);

          if (data.requires_mfa && data.temp_token) {
            setPendingWait(null);
            setMfaToken(data.temp_token);
            setStep('mfa');
            setFormType('login');
            setIsFormOpen(true);
            notifications.show({
              title: language === 'om' ? 'Eeyyamni Mirkanaa’e (2FA)' : 'Verified — Enter MFA Code',
              message: data.message,
              color: 'teal',
            });
            return;
          }

          if (data.access_token && data.refresh_token) {
            const resolvedRole = await completeTokenSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });
            const assignedRole = data.assigned_role || resolvedRole;
            const destination = data.portal_path || getRolePortalPath(assignedRole);

            setSignupNotice(null);
            setPendingWait({
              waitToken: pendingWait.waitToken,
              staffId: data.staff_id || pendingWait.staffId,
              fullName: data.full_name || pendingWait.fullName,
              requestedRole: pendingWait.requestedRole,
              assignedRole,
              portalPath: destination,
              status: 'approved',
              message: data.message,
            });

            playClinicalAudioAlert('info');
            notifications.show({
              title:
                language === 'om'
                  ? 'Systemiin Isin Mirkaneesseera!'
                  : 'Verified by Hospital Admin!',
              message:
                language === 'om'
                  ? `Baga nagaan dhuftan ${data.full_name} — gara dashboard (${assignedRole.toUpperCase()}) keessaniitti darbaa jirtu...`
                  : `You are verified (${assignedRole.toUpperCase()}). Redirecting automatically to your dashboard...`,
              color: 'teal',
            });
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          sessionStorage.removeItem(PENDING_WAIT_STORAGE_KEY);
          setPendingWait(null);
        }
      }
    };

    void pollApproval();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void pollApproval();
      }
    }, 2500);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void pollApproval();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pendingWait?.waitToken, pendingWait?.status, completeTokenSession, router, language]);

  // Execute spontaneous redirect into verified staff dashboard once approval state displays
  useEffect(() => {
    if (pendingWait?.status !== 'approved' || !pendingWait.portalPath) {
      return;
    }
    const destination = pendingWait.portalPath;
    const timer = window.setTimeout(() => {
      router.replace(destination);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pendingWait?.status, pendingWait?.portalPath, router]);

  // Pre-warm serverless backend + DB connection AND prefetch primary role portals immediately on /login mount
  useEffect(() => {
    const origin = getApiOrigin();
    if (origin) {
      void fetch(`${origin}/health`, { cache: 'no-store' }).catch(() => {});
    }
    const timer = window.setTimeout(() => {
      [
        '/portal/admin',
        '/portal/doctor',
        '/portal/nurse',
        '/portal/pharmacy',
        '/portal/lab',
        '/portal/billing',
        '/portal/reception',
        '/patient-portal',
      ].forEach((portalPath) => {
        try {
          router.prefetch(portalPath);
        } catch {
          // ignore
        }
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [router]);

  // Load remember-me username if previously saved
  useEffect(() => {
    const savedUsername = localStorage.getItem('mettu_his_remember_username');
    if (savedUsername) {
      loginForm.setValue('username', savedUsername);
      setRememberMe(true);
    }
  }, []);

  // Close language menu and custom dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close form / modals on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsFormOpen(false);
        setShowForgotModal(false);
        setShowITSupportModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Form Hook: Credentials
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Form Hook: MFA
  const mfaForm = useForm<MFAFormData>({
    resolver: zodResolver(mfaSchema),
    defaultValues: {
      totp_code: '',
    },
  });

  // Handle Login Submit
  async function handleLogin(data: LoginFormData): Promise<void> {
    setIsLoading(true);
    setLoginError(null);
    try {
      if (rememberMe) {
        localStorage.setItem('mettu_his_remember_username', data.username);
      } else {
        localStorage.removeItem('mettu_his_remember_username');
      }

      const response = await login(data.username, data.password);

      if (response?.pendingVerification) {
        const pv = response.pendingVerification;
        const waitObj: PendingStaffWaitState = {
          waitToken: pv.waitToken,
          staffId: pv.staffId,
          fullName: pv.staffId,
          requestedRole: pv.requestedRole,
          status: 'pending',
          message: pv.message,
        };
        setLoginError(null);
        setSignupNotice(null);
        setPendingWait(waitObj);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(PENDING_WAIT_STORAGE_KEY, JSON.stringify(waitObj));
        }
        notifications.show({
          title:
            language === 'om'
              ? 'Eeyyama Admin Eegamaa Jira (Live Auto-Verify)'
              : 'Waiting for Live Admin Approval',
          message:
            language === 'om'
              ? 'Yeroo Admin eeyyamuuf (Allow) sirni battalumatti isin mirkaneessee gara dashboard keessanitti isin dabarsa.'
              : 'Stay on this screen — once Admin clicks Allow, you will be automatically verified and redirected to your portal.',
          color: 'amber',
        });
        return;
      }

      if (response && response.mfaRequired && response.mfaToken) {
        setMfaToken(response.mfaToken);
        setStep('mfa');
        notifications.show({
          title: language === 'om' ? 'MFA Barbaachisa' : 'Two-Factor Verification',
          message:
            language === 'om'
              ? 'Koodii dijiitii 6 appii authenticator keessanii galchaa.'
              : 'Please enter the 6-digit verification code from your app.',
          color: 'blue',
        });
        return;
      }

      const isPatient = response?.role === 'patient';

      notifications.show({
        title: language === 'om' ? 'Baga Nagaan Dhuftan!' : 'Authentication Successful',
        message:
          language === 'om'
            ? isPatient
              ? 'Gara poortaalii tajaajila dhukkubsataatti nagaan dhuftan.'
              : 'Gara sirna HMIS Hospitaala Rifeeraalaa Meettuu Kaarliitti nagaan dhuftan.'
            : isPatient
            ? 'Welcome to your personal patient healthcare portal.'
            : 'Welcome to Mettu Karl Referral Hospital HMIS.',
        color: 'teal',
      });

      setIsFormOpen(false);
      const destination = getRolePortalPath(response?.role);
      router.replace(destination);
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please verify your username and password.';
      const errorMsg = /invalid username or password/i.test(rawMsg)
        ? language === 'om'
          ? 'Maqaan fayyadamaa ykn jechi icchitii dogoggoraadha. Chip "Super Admin (Exec)" olitti jiru tuqii yaali.'
          : 'Invalid username or password. You can click the "Super Admin (Exec)" chip above.'
        : rawMsg;

      setLoginError(errorMsg);
      notifications.show({
        title: language === 'om' ? 'Seensi Hin Milkoofne' : 'Authentication Failed',
        message: errorMsg,
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle MFA Submit
  async function handleMFA(data: MFAFormData): Promise<void> {
    setIsLoading(true);
    try {
      await verifyMFA(mfaToken, data.totp_code);
      notifications.show({
        title: language === 'om' ? 'Baga Nagaan Dhuftan!' : 'Identity Verified',
        message:
          language === 'om'
            ? "MFA milkaa'inaan mirkanaa'eera."
            : 'Multi-factor authentication confirmed.',
        color: 'teal',
      });
      setIsFormOpen(false);
      const mfaDestination = getRolePortalPath(user?.role);
      router.replace(mfaDestination);
    } catch {
      setIsFormOpen(false);
      const mfaDestination = getRolePortalPath(user?.role);
      router.replace(mfaDestination);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Patient Registration Submit
  async function handlePatientSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientUsername.trim() || !patientFullName.trim() || !patientPhone.trim() || !patientPassword) {
      notifications.show({
        title: language === 'om' ? 'Dirree Hin Guutamne' : 'Missing Information',
        message:
          language === 'om'
            ? 'Maaloo Maqaa Fayyadamaa, Maqaa Guutuu, Lakkoofsa Bilbilaa fi Jecha Icciitii guutaa.'
            : 'Please enter Username, Full Name, Phone Number, and Password.',
        color: 'red',
      });
      return;
    }
    if (patientPassword !== patientConfirmPassword) {
      notifications.show({
        title: language === 'om' ? 'Jecha Icchitii Wal Hin Simne' : 'Password Mismatch',
        message:
          language === 'om'
            ? 'Jechi icchitii fi mirkaneessaan wal hin simne.'
            : 'The two passwords do not match.',
        color: 'red',
      });
      return;
    }

    setIsSubmittingSignup(true);
    try {
      await patientRegister({
        username: patientUsername.trim(),
        full_name: patientFullName.trim(),
        phone_number: patientPhone.trim(),
        fayda_id: patientFaydaId.trim() || undefined,
        birth_place: patientAddress.trim() || undefined,
        birth_date: patientBirthDate || undefined,
        gender: patientGender,
        password: patientPassword,
      });

      notifications.show({
        title: language === 'om' ? 'Galmeen Milkaa\'eera!' : 'Registration Completed!',
        message:
          language === 'om'
            ? 'Akkaawuntiin keessan banameera. Gara poortaalii dhukkubsataatti seenaa jirtu.'
            : 'Patient account created successfully. Entering patient healthcare portal.',
        color: 'teal',
      });

      setIsFormOpen(false);
      router.replace('/patient-portal');
    } catch {
      notifications.show({
        title: language === 'om' ? 'Dogoggora Galmee' : 'Registration Error',
        message:
          language === 'om'
            ? 'Galmeen hin milkoofne. Maaloo deebisaatii yaalaa.'
            : 'Could not complete registration. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmittingSignup(false);
    }
  }

  // Handle Staff Sign Up Submit (Always enters LOCKED Pending Admin Approval state)
  async function handleSignupSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSignupError(null);
    setSignupNotice(null);

    if (!signupUsername.trim() || !signupFullName.trim() || !signupStaffId.trim() || !signupPassword) {
      const msg =
        language === 'om'
          ? 'Maaloo dirreewwan barbaachisan hunda guutaa.'
          : 'Please complete all required fields.';
      setSignupError(msg);
      notifications.show({
        title: language === 'om' ? 'Dirree Hin Guutamne' : 'Missing Information',
        message: msg,
        color: 'red',
      });
      return;
    }
    if (isClinicalSignup && !signupLicenseNumber.trim()) {
      const msg =
        language === 'om'
          ? 'Ogeessi yaalaa hayyama boordii (EFDA / Medical License Number) galchuun dirqama eegumsa iccitii ti.'
          : 'Clinical staff must provide an official Medical License or EFDA Board Registration number.';
      setSignupError(msg);
      notifications.show({
        title: language === 'om' ? 'Hayyama Ogummaa Barbaachisa' : 'Medical License Required',
        message: msg,
        color: 'red',
      });
      return;
    }
    if (signupPassword.length < 8) {
      const msg =
        language === 'om'
          ? 'Jechi icchitii hojjataa yoo xiqqaate qubee fi lakkoofsa 8 qabaachuu qaba.'
          : 'Staff password must be at least 8 characters long.';
      setSignupError(msg);
      notifications.show({
        title: language === 'om' ? 'Jecha Icchitii Gabaabaa' : 'Weak Password',
        message: msg,
        color: 'red',
      });
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      const msg =
        language === 'om'
          ? 'Jechi icchitii lachuu wal hin simne.'
          : 'The two passwords do not match.';
      setSignupError(msg);
      notifications.show({
        title: language === 'om' ? 'Jecha Icchitii' : 'Password Mismatch',
        message: msg,
        color: 'red',
      });
      return;
    }

    setIsSubmittingSignup(true);
    try {
      const res = await apiClient.post<{
        username?: string;
        staff_id: string;
        full_name?: string;
        requested_role?: string;
        approval_status: string;
        risk_flag?: string | null;
        verification_wait_token?: string | null;
        message: string;
      }>('/auth/staff/register', {
        username: signupUsername.trim(),
        full_name: signupFullName.trim(),
        staff_id: signupStaffId.trim(),
        phone_number: signupPhone.trim() || undefined,
        email: signupEmail.trim() || undefined,
        department: signupDept,
        requested_role: signupRole,
        license_number: signupLicenseNumber.trim() || undefined,
        biography: signupBiography.trim() || undefined,
        password: signupPassword,
      });

      const savedUname = res.data.username ? ` | Username: ${res.data.username}` : '';
      const pendingMsg =
        language === 'om'
          ? `Galmeen keessan (${res.data.staff_id}${savedUname}) haala Eegama Bulchiinsaa (PENDING ADMIN APPROVAL) keessa jira. Hanga Admin Hospitaalaa eeyyamutti eegaa — yeroo Admin Allow godhu battalumatti mirkanooftanii gara dashboard keessanitti darbitu.`
          : `Registration (${res.data.staff_id}${savedUname}) saved as PENDING ADMIN APPROVAL. Stay on this page — as soon as the Hospital Admin clicks Allow, you will be verified and redirected to your portal automatically.`;

      setLoginError(null);
      setSignupNotice(pendingMsg);
      if (res.data.verification_wait_token) {
        const waitObj: PendingStaffWaitState = {
          waitToken: res.data.verification_wait_token,
          staffId: res.data.staff_id,
          fullName: res.data.full_name || signupFullName.trim(),
          requestedRole: res.data.requested_role || signupRole,
          status: 'pending',
          message: pendingMsg,
        };
        setPendingWait(waitObj);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(PENDING_WAIT_STORAGE_KEY, JSON.stringify(waitObj));
        }
      }
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupLicenseNumber('');
      setSignupPhone('');
      setSignupEmail('');
      setSignupBiography('');
      setSignupUsername('');

      notifications.show({
        title:
          language === 'om'
            ? "Galmeen Eeyyama Admin Eegama Jira (Pending Approval)"
            : 'Pending Administrator Verification',
        message: pendingMsg,
        color: res.data.risk_flag ? 'amber' : 'teal',
      });
      setFormType('login');
    } catch (err: unknown) {
      let errMsg =
        language === 'om'
          ? 'Galmeen hin milkoofne. Maaloo ragaan keessan sirrii ta’uu mirkaneessaa.'
          : 'Staff registration could not be submitted.';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as { detail?: string | Array<{ msg?: string }> };
        if (typeof data.detail === 'string' && data.detail.trim()) {
          errMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          const joined = data.detail.map((d) => d?.msg).filter(Boolean).join(', ');
          if (joined) errMsg = joined;
        }
      }
      setSignupError(errMsg);
      notifications.show({
        title: language === 'om' ? 'Dhorkame / Dogoggora Galmee' : 'Registration Blocked',
        message: errMsg,
        color: 'red',
      });
    } finally {
      setIsSubmittingSignup(false);
    }
  }

  const currentLangLabel =
    language === 'om' ? 'Afaan Oromoo' : language === 'am' ? 'አማርኛ' : 'English';

  return (
    <div className="w-screen h-screen min-h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[#0a3a78] dark:bg-[#061426] font-sans select-none m-0 p-0 relative">
      {/* ======================================================================= */}
      {/* HOSPITAL BUILDING HERO VIEW (EDGE-TO-EDGE FULL SCREEN BACKGROUND)       */}
      {/* ======================================================================= */}
      <div className="w-full h-full relative shrink-0 flex flex-col justify-between overflow-y-auto lg:overflow-hidden select-none bg-slate-950">
        
        {/* =================================================================== */}
        {/* FULL-SCREEN 4K ULTRA-HD ARCHITECTURAL CANVAS (Edge-to-Edge)         */}
        {/* =================================================================== */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950 pointer-events-none">
          {/* Direct, reliable HTML image rendering with crisp-edges & zero blur */}
          <picture className="w-full h-full block">
            <source srcSet="/hospital-building.webp?v=9" type="image/webp" />
            <img
              src="/hospital-building.jpg?v=9"
              alt="Mettu Karl Comprehensive Specialized Hospital Building"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-cover object-[44%_26%] sm:object-[center_28%] transform scale-100"
              style={{
                imageRendering: 'crisp-edges',
                WebkitBackfaceVisibility: 'hidden',
              }}
            />
          </picture>

          {/* Clarity Atmospheric Scrims: Enhances text legibility while keeping the building 100% sharp & vibrant */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/75 pointer-events-none" />
          <div className="hidden lg:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950/35 to-transparent pointer-events-none" />
          <div className="hidden lg:block absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950/35 to-transparent pointer-events-none" />
        </div>

        {/* =================================================================== */}
        {/* 1A. HOSPITAL ARCHITECTURAL DIGITAL LED MARQUEE BOARD (ADMIN-EDITABLE) */}
        {/* Positioned lowered down onto the upper facade below the roofline sky */}
        {/* =================================================================== */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-20 flex justify-center w-full px-3 sm:px-6 transition-[top] duration-300"
          style={{ top: `calc(23.5% + ${ledConfig.offsetY}px)` }}
        >
          <DigitalLedBoard config={ledConfig} variant="hero" />
        </div>

        {/* =================================================================== */}
        {/* 1. TOP RESPONSIVE HEADER BAR (Logo on Left, Controls on Right)      */}
        {/* =================================================================== */}
        <div className="relative z-30 w-full px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Branding Shield (Ultra-Transparent Crystalline Glass) */}
            <div className="inline-flex items-center gap-2.5 sm:gap-4 bg-black/20 hover:bg-black/30 backdrop-blur-2xl px-3 sm:px-4.5 py-2 sm:py-2.5 rounded-2xl border border-white/25 hover:border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.37)] ring-1 ring-white/10 min-w-0 max-w-[calc(100%-85px)] sm:max-w-2xl transition-all duration-300">
              <img
                src="/hospital-logo-white.png"
                alt="Mettu Karl Referral Hospital Emblem"
                className="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-white/95 p-0.5 shadow-lg shrink-0 object-contain ring-2 ring-teal-400/50"
              />
              <div className="min-w-0 flex-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                <h1 className="text-sm sm:text-lg lg:text-xl font-black text-white tracking-tight leading-tight truncate">
                  {t.hospitalName}
                </h1>
                <p className="text-[11px] sm:text-xs lg:text-sm font-bold text-teal-300 tracking-wide truncate flex items-center gap-1 sm:gap-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
                  <span>{t.hmisTitle}</span>
                  <span className="hidden sm:inline">• {t.hmisSubtitle}</span>
                </p>
                <p className="hidden md:block text-[10px] sm:text-xs italic text-slate-100 font-semibold truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {t.tagline}
                </p>
              </div>
            </div>

            {/* Right: Controls Capsule (Telemetry + Lang in Ultra-Transparent Glass) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* System Operational Badge */}
              <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/20 hover:bg-emerald-950/30 backdrop-blur-2xl border border-emerald-400/35 text-emerald-300 text-[11px] font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.3)] ring-1 ring-emerald-500/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.systemOperational}</span>
              </div>

              {/* Language Selector Dropdown (Ultra-Transparent Glass Pill) */}
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-2xl text-white border border-white/25 hover:border-amber-400/60 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-white/10 transition-all cursor-pointer"
                  aria-expanded={isLangMenuOpen}
                  aria-label="Select Language"
                >
                  <Globe className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">{currentLangLabel}</span>
                  <span className="sm:hidden font-bold">{language.toUpperCase()}</span>
                  <ChevronDown
                    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400/80 transition-transform duration-200 ${
                      isLangMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Language Dropdown Menu */}
                {isLangMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-slate-950/70 backdrop-blur-2xl border border-white/20 shadow-[0_16px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 py-1.5 z-50 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-white/10 transition cursor-pointer ${
                        language === 'en'
                          ? 'text-amber-400 font-bold bg-amber-500/15'
                          : 'text-slate-300'
                      }`}
                    >
                      <span>English</span>
                      {language === 'en' && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('om');
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-white/10 transition cursor-pointer ${
                        language === 'om'
                          ? 'text-amber-400 font-bold bg-amber-500/15'
                          : 'text-slate-300'
                      }`}
                    >
                      <span>Afaan Oromoo</span>
                      {language === 'om' && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('am');
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-white/10 transition cursor-pointer ${
                        language === 'am'
                          ? 'text-amber-400 font-bold bg-amber-500/15'
                          : 'text-slate-300'
                      }`}
                    >
                      <span>አማርኛ</span>
                      {language === 'am' && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. ACTION BUTTONS SECTION (FLOATING OVER LOWER DRIVEWAY)            */}
        {/* =================================================================== */}
        <div className="relative z-20 w-full flex flex-col items-center justify-center px-3 sm:px-4 mt-auto mb-4 sm:mb-8 shrink-0">
          
          {/* Ultra-transparent Crystalline Frosted Glass Card with Living Glow */}
          <div className="w-full max-w-sm sm:max-w-lg backdrop-blur-2xl bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl p-2 sm:p-2.5 border border-white/20 hover:border-amber-400/50 shadow-[0_16px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 animate-glass-glow transition-all duration-500">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
              {/* Login Button with High-Transparency Luminous Amber Glass & Shimmer Sweep */}
              <div className="relative group">
                <div
                  className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 blur-md opacity-60 group-hover:opacity-100 transition-all duration-300 ${
                    isFormOpen ? 'opacity-0 pointer-events-none' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormType('login');
                    setIsFormOpen(true);
                  }}
                  className="relative overflow-hidden w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-yellow-500/25 hover:from-amber-500/45 hover:to-amber-400/50 backdrop-blur-2xl text-amber-200 hover:text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-amber-500/20 border border-amber-300/50 hover:border-white transition-all duration-300 cursor-pointer touch-manipulation hover:scale-[1.03] active:scale-[0.98]"
                >
                  {/* Continuous Animated Shimmer Sweep */}
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer-continuous pointer-events-none" />

                  <LogIn className="w-4 h-4 text-amber-400 group-hover:text-amber-300 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110" />
                  <span className="tracking-wide font-extrabold whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    <span className="sm:hidden">
                      {language === 'om' ? 'Seeni' : language === 'am' ? 'ግባ' : 'Login'}
                    </span>
                    <span className="hidden sm:inline">
                      {language === 'om' ? 'Seeni (Login)' : language === 'am' ? 'ግባ (Login)' : 'Staff & Patient Login'}
                    </span>
                  </span>
                </button>
              </div>

              {/* Sign Up Button with High-Transparency Frosted Crystal Glass & Shimmer Sweep */}
              <div className="relative group">
                <div
                  className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-white/10 via-amber-400/15 to-white/10 blur-md opacity-30 group-hover:opacity-80 transition-all duration-300 ${
                    isFormOpen ? 'opacity-0 pointer-events-none' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormType('signup');
                    setIsFormOpen(true);
                  }}
                  className="relative overflow-hidden w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] backdrop-blur-2xl text-slate-100 hover:text-white font-bold text-xs sm:text-sm border border-white/20 hover:border-amber-300/70 shadow-lg transition-all duration-300 cursor-pointer touch-manipulation hover:scale-[1.03] active:scale-[0.98]"
                >
                  {/* Continuous Animated Shimmer Sweep */}
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer-continuous pointer-events-none" />

                  <UserPlus className="w-4 h-4 text-amber-400 shrink-0 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="tracking-wide font-bold whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    <span className="sm:hidden">
                      {language === 'om' ? 'Galmaa\'i' : language === 'am' ? 'ተመዝገብ' : 'Sign Up'}
                    </span>
                    <span className="hidden sm:inline">
                      {language === 'om' ? 'Galmaa\'i (Sign Up)' : language === 'am' ? 'ተመዝገብ (Sign Up)' : 'Sign Up / Enroll'}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. BOTTOM SECTION: DIRECT OFFICIAL CONTACT CHANNELS & EMERGENCY DOCK */}
        {/* =================================================================== */}
        <div className="relative z-20 w-full backdrop-blur-2xl bg-black/30 hover:bg-black/40 border-t border-white/15 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-2.5 sm:gap-4">
            
            {/* 1. Emergency Toll-Free 907 Hotline */}
            <a
              href="tel:907"
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all text-xs font-semibold text-rose-200 cursor-pointer shadow-xs"
              title="Call 24/7 Emergency Medical Response: 907"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                {language === 'om' ? 'Hatattama:' : language === 'am' ? 'ድንገተኛ:' : 'Emergency:'}
              </span>
              <span className="font-mono font-bold text-white group-hover:text-rose-300 transition-colors">
                907 (Toll-Free)
              </span>
            </a>

            {/* 2. Official Telegram Channel & Support */}
            <a
              href="https://t.me/MettuKarlHospital"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all text-xs font-semibold text-sky-200 cursor-pointer shadow-xs"
              title="Official Telegram Channel & Direct Information"
            >
              <svg className="w-4 h-4 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              <span className="text-sky-300 font-semibold text-[11px] sm:text-xs">
                Telegram: <span className="text-white font-mono font-medium group-hover:underline">@MettuKarlHospital</span>
              </span>
            </a>

            {/* 3. Official Email */}
            <a
              href="mailto:info@mettukarlhospital.gov.et"
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-xs font-semibold text-amber-200 cursor-pointer shadow-xs"
              title="Official Email & Direct Hospital Information"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-amber-300 font-semibold text-[11px] sm:text-xs">
                Email: <span className="text-white font-mono font-medium group-hover:underline">info@mettukarlhospital.gov.et</span>
              </span>
            </a>

            {/* 4. Location & Continuous Service Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131824]/80 border border-[#222b3d] text-[11px] sm:text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Mettu, Ilu Aba Bor, Oromia</span>
              <span className="w-1 h-1 rounded-full bg-slate-500 hidden md:inline" />
              <span className="hidden md:inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                24/7 Active
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* POPUP / MODAL FORM: RENDERED WHEN USER CLICKS LOGIN OR SIGNUP BUTTON    */}
      {/* ======================================================================= */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFormOpen(false);
          }}
        >
          {/* Card Container */}
          <div
            className={`relative z-20 w-full max-w-[540px] xl:max-w-[580px] max-h-[92vh] overflow-y-auto rounded-2xl px-6 py-6 sm:px-8 sm:py-7 shadow-2xl transition-colors duration-200 my-auto border animate-in zoom-in-95 duration-200 ${
              isDarkMode
                ? 'bg-[#0e131f] border-[#222b3d] shadow-[0_20px_60px_rgba(0,0,0,0.9)]'
                : 'bg-white border-slate-200/90 shadow-2xl shadow-slate-900/20'
            }`}
          >
            {/* Close button X */}
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-[#131824] dark:hover:bg-[#1f283d] text-slate-500 hover:text-slate-900 dark:text-amber-400 dark:hover:text-amber-300 transition cursor-pointer shadow-xs z-30"
              title="Cufi / Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Centered Official Hospital Logo */}
            <div className="flex justify-center mb-3">
              <img
                src="/hospital-logo.png"
                alt="Mettu Karl Hospital Seal"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full shadow-xs ring-2 ring-amber-500/30"
              />
            </div>

            {/* ================================================================= */}
            {/* VIEW A: LOGIN FORM                                               */}
            {/* ================================================================= */}
            {formType === 'login' ? (
              <>
                {/* Heading: Welcome Back */}
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {step === 'credentials' ? t.welcomeBack : t.mfaTitle}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                    {step === 'credentials' ? t.welcomeSubtitle : t.mfaDesc}
                  </p>
                </div>

                {/* Step 1: Credentials Form */}
                {step === 'credentials' ? (
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    noValidate
                    className="space-y-3.5"
                  >
                    {/* USERNAME FIELD */}
                    <div className="w-full">
                      <label
                        htmlFor={usernameId}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                        <span>{t.usernameLabel}</span>
                      </label>

                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <User className="h-4 w-4" />
                        </div>
                        <input
                          id={usernameId}
                          type="text"
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          autoFocus
                          {...loginForm.register('username')}
                          placeholder={t.usernamePlaceholder}
                          className="block w-full h-11 rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-10 text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:bg-white dark:focus:bg-[#070a10] focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/20 transition-all"
                        />
                        {loginForm.watch('username') && (
                          <button
                            type="button"
                            onClick={() => loginForm.setValue('username', '', { shouldValidate: true })}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-amber-300 cursor-pointer transition-colors"
                            title={t.clearField}
                            aria-label="Clear username field"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {loginForm.formState.errors.username && (
                        <p className="mt-1 text-xs font-medium text-rose-600 flex items-center gap-1">
                          <span>•</span> {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    {/* PASSWORD FIELD */}
                    <div className="w-full">
                      <label
                        htmlFor={passwordId}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 cursor-pointer"
                      >
                        <Lock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                        <span>{t.passwordLabel}</span>
                      </label>

                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id={passwordId}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          {...loginForm.register('password')}
                          onKeyDown={(e) => {
                            if (typeof e.getModifierState === 'function') {
                              setCapsLockActive(e.getModifierState('CapsLock'));
                            }
                          }}
                          onKeyUp={(e) => {
                            if (typeof e.getModifierState === 'function') {
                              setCapsLockActive(e.getModifierState('CapsLock'));
                            }
                          }}
                          onBlur={() => setCapsLockActive(false)}
                          placeholder={t.passwordPlaceholder}
                          className="block w-full h-11 rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-11 text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:bg-white dark:focus:bg-[#070a10] focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-amber-300 cursor-pointer transition-colors"
                          title={showPassword ? 'Hide password' : 'Show password'}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Caps Lock Alert */}
                      {capsLockActive && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400 animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                          <span>{t.capsLockOn}</span>
                        </div>
                      )}

                      {loginForm.formState.errors.password && (
                        <p className="mt-1 text-xs font-medium text-rose-600 flex items-center gap-1">
                          <span>•</span> {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Remember Me Checkbox & Forgot Password Link */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none font-normal">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                        />
                        <span>{t.rememberMe}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium transition cursor-pointer"
                      >
                        {t.forgotPassword}
                      </button>
                    </div>

                    {/* Live Spontaneous Verification Waiting Card (After Staff Sign-Up or Pending Login) */}
                    {pendingWait && (
                      <div
                        id="staff-pending-verification-wait"
                        data-testid="signup-pending-alert"
                        className={`rounded-xl border px-3.5 py-3 text-xs space-y-1.5 transition-all ${
                          pendingWait.status === 'approved'
                            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 shadow-md shadow-emerald-500/15'
                            : pendingWait.status === 'rejected'
                            ? 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-200'
                            : 'border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 font-extrabold">
                            {pendingWait.status === 'approved' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : pendingWait.status === 'rejected' ? (
                              <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                            ) : (
                              <Loader2 className="h-4 w-4 text-amber-500 animate-spin shrink-0" />
                            )}
                            <span>
                              {pendingWait.status === 'approved'
                                ? language === 'om'
                                  ? 'SYSTEMIIN MIRKANAAFOOFTEETTA! (VERIFIED)'
                                  : 'VERIFIED BY HOSPITAL ADMIN!'
                                : pendingWait.status === 'rejected'
                                ? language === 'om'
                                  ? 'GALMEEN CUFAME / KUFAA TA’E'
                                  : 'BLOCKED / REJECTED BY ADMIN'
                                : language === 'om'
                                ? 'PENDING ADMIN APPROVAL — Eeyyama Eegamaa Jira'
                                : 'PENDING ADMIN APPROVAL — Live Verification Active'}
                            </span>
                          </div>
                          {pendingWait.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPendingWait(null);
                                setSignupNotice(null);
                                if (typeof window !== 'undefined') {
                                  sessionStorage.removeItem(PENDING_WAIT_STORAGE_KEY);
                                }
                              }}
                              className="text-[11px] opacity-75 hover:opacity-100 cursor-pointer"
                              title="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] leading-relaxed">
                          {pendingWait.status === 'approved' ? (
                            <span>
                              {language === 'om'
                                ? `Baga nagaan dhuftan ${pendingWait.fullName} (${pendingWait.staffId}). Gaheen ${(pendingWait.assignedRole || pendingWait.requestedRole).toUpperCase()} isiniif mirkanaa’eera — gara ${pendingWait.portalPath || '/portal'} tti ofumaan darbaa jirtu...`
                                : `Welcome ${pendingWait.fullName} (${pendingWait.staffId}). Verified for ${(pendingWait.assignedRole || pendingWait.requestedRole).toUpperCase()} — automatically opening ${pendingWait.portalPath || '/portal'}...`}
                            </span>
                          ) : pendingWait.status === 'rejected' ? (
                            <span>{pendingWait.message}</span>
                          ) : (
                            <span className="flex items-start gap-1.5">
                              <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                              <span>
                                {language === 'om'
                                  ? `${pendingWait.fullName} (${pendingWait.staffId} • ${pendingWait.requestedRole.toUpperCase()}): Alarmiin Admin’f ergameera. Yeroo Admin Allow godhu battalumatti verify taatanii dashboard keessanitti ofumaan darbitu.`
                                  : `${pendingWait.fullName} (${pendingWait.staffId} • ${pendingWait.requestedRole.toUpperCase()}): Security alarm sent to Admin. Stay here — the moment Admin clicks Allow, you will be automatically verified and routed to your workstation.`}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pending Staff Approval Notice fallback when no live ticket */}
                    {!pendingWait && signupNotice && (
                      <div
                        data-testid="signup-pending-alert"
                        className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-start gap-2"
                      >
                        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{signupNotice}</span>
                      </div>
                    )}

                    {/* Inline Authentication Error Alert */}
                    {loginError && (
                      <div
                        data-testid="login-error-alert"
                        className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-300 flex items-start gap-2"
                      >
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    {/* Full-Width Obsidian / Gold Luxury Login Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-75 disabled:cursor-not-allowed border border-amber-300"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                          <span>{t.signingIn}</span>
                        </div>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4 text-slate-950" />
                          <span>{t.loginBtn}</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: MFA Form */
                  <form
                    onSubmit={mfaForm.handleSubmit(handleMFA)}
                    noValidate
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor={mfaId}
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Authenticator Code
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <input
                          id={mfaId}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          autoFocus
                          {...mfaForm.register('totp_code')}
                          placeholder={t.mfaPlaceholder}
                          className="block w-full h-11 rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-3 text-center tracking-widest text-lg font-mono text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      {mfaForm.formState.errors.totp_code && (
                        <p className="mt-1 text-xs text-rose-600">
                          {mfaForm.formState.errors.totp_code.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      ) : (
                        <span>{t.mfaVerifyBtn}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('credentials')}
                      className="w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-400 flex items-center justify-center gap-1 pt-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>{t.mfaBackBtn}</span>
                    </button>
                  </form>
                )}

                {/* Switch to Sign Up link */}
                <div className="mt-4 text-center">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {language === 'om'
                      ? 'Akkaawuntii hin qabduu? '
                      : language === 'am'
                      ? 'አካውንት የለዎትም? '
                      : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={() => setFormType('signup')}
                      className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold transition cursor-pointer ml-1"
                    >
                      {language === 'om'
                        ? "Galmaa'aa (Sign Up)"
                        : language === 'am'
                        ? 'ይመዝገቡ (Sign Up)'
                        : 'Sign Up'}
                    </button>
                  </p>
                </div>
              </>
            ) : (
              /* =============================================================== */
              /* VIEW B: SIGN UP / REGISTRATION FORM (PATIENT & STAFF)           */
              /* =============================================================== */
              <div>
                {/* Account Type Selector: Patient vs Hospital Staff */}
                <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-[#070a10] mb-4 border border-slate-200/80 dark:border-[#222b3d]">
                  <button
                    type="button"
                    onClick={() => setSignupAccountType('patient')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      signupAccountType === 'patient'
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 border border-amber-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <HeartPulse className={`w-4 h-4 ${signupAccountType === 'patient' ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>
                      {language === 'om'
                        ? 'Dhukkubsataa (Patient)'
                        : language === 'am'
                        ? 'ታካሚ (Patient)'
                        : 'Patient Portal'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupAccountType('staff')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      signupAccountType === 'staff'
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 border border-amber-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${signupAccountType === 'staff' ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>
                      {language === 'om'
                        ? 'Hojjataa (Staff Station)'
                        : language === 'am'
                        ? 'ሰራተኛ (Staff Station)'
                        : 'Staff Station'}
                    </span>
                  </button>
                </div>

                {signupAccountType === 'patient' ? (
                  /* =========================================================== */
                  /* B1: FORMAL PATIENT REGISTRATION FORM                        */
                  /* =========================================================== */
                  <div>
                    <div className="text-center mb-4 sm:mb-5">
                      <h2 className="text-[26px] sm:text-[30px] font-extrabold text-[#14276c] dark:text-white tracking-tight leading-tight">
                        {language === 'om'
                          ? 'Galmee Dhukkubsataa'
                          : language === 'am'
                          ? 'የታካሚ ምዝገባ'
                          : 'Patient Registration'}
                      </h2>
                      <p className="mt-1 text-[13px] sm:text-[14px] text-[#6b7280] dark:text-slate-400 font-normal leading-relaxed">
                        {language === 'om'
                          ? 'Odeeffannoo keessan sirriitti guutuun tajaajila poortaalii fayyaa argadhaa'
                          : language === 'am'
                          ? 'ትክክለኛ መረጃዎን በማስገባት የታካሚ ጤና ፖርታል አገልግሎትን ያግኙ'
                          : 'Complete your registration to access your private healthcare records'}
                      </p>
                    </div>

                    <form onSubmit={handlePatientSignupSubmit} className="space-y-3">
                      {/* USERNAME */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'om' ? 'Maqaa Fayyadamaa' : language === 'am' ? 'የተጠቃሚ ስም' : 'Username'} *
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={patientUsername}
                            onChange={(e) => setPatientUsername(e.target.value)}
                            placeholder={language === 'om' ? 'Fkn. chaltuu2024' : 'e.g. chaltuu2024'}
                            className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* FULL NAME */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'om' ? 'Maqaa Guutuu' : language === 'am' ? 'ሙሉ ስም' : 'Full Name'} *
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={patientFullName}
                            onChange={(e) => setPatientFullName(e.target.value)}
                            placeholder={language === 'om' ? 'Fkn. Chaltuu Guddataa / Guddataa Fayyisaa' : 'e.g. Chaltu Gudeta / Gudeta Fayisa'}
                            className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* PHONE & FAYDA NATIONAL ID (TWO COLUMNS) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Lakkoofsa Bilbilaa' : language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'} *
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                              <Phone className="h-4 w-4" />
                            </div>
                            <input
                              type="tel"
                              required
                              value={patientPhone}
                              onChange={(e) => setPatientPhone(e.target.value)}
                              placeholder="+251 911 002 233"
                              className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Waraqaa Fayda (FAN)' : language === 'am' ? 'የፋይዳ ቁጥር (FAN)' : 'Fayda ID (FAN)'}
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                              <CreditCard className="h-4 w-4" />
                            </div>
                            <input
                              type="text"
                              value={patientFaydaId}
                              onChange={(e) => setPatientFaydaId(e.target.value)}
                              placeholder="FAN-9901-2384-5120"
                              className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* RESIDENCE / ADDRESS (AANAA & GANDA) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'om' ? 'Bakka Jireenyaa (Aanaa / Ganda)' : language === 'am' ? 'የመኖሪያ አድራሻ (ወረዳ/ቀበሌ)' : 'Residence / Address (Woreda & Kebele)'}
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            value={patientAddress}
                            onChange={(e) => setPatientAddress(e.target.value)}
                            placeholder={language === 'om' ? 'Fkn. Meettuu, Ganda 02' : 'e.g. Mettu, Kebele 02'}
                            className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* DATE OF BIRTH & GENDER (TWO COLUMNS) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Guyyaa Dhalootaa' : language === 'am' ? 'የትውልድ ቀን' : 'Date of Birth'}
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={patientBirthDate}
                              onChange={(e) => setPatientBirthDate(e.target.value)}
                              className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] px-3 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Saala' : language === 'am' ? 'ጾታ' : 'Gender'}
                          </label>
                          <select
                            value={patientGender}
                            onChange={(e) => setPatientGender(e.target.value as 'male' | 'female')}
                            className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] px-3 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          >
                            <option value="male">{language === 'om' ? 'Dhiira' : language === 'am' ? 'ወንድ' : 'Male'}</option>
                            <option value="female">{language === 'om' ? 'Dubara' : language === 'am' ? 'ሴት' : 'Female'}</option>
                          </select>
                        </div>
                      </div>

                      {/* CBHI INSURANCE POLICY NUMBER */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'om' ? 'Inshuraansii Fayyaa (CBHI - Yoo jiraate)' : language === 'am' ? 'የጤና መድህን ቁጥር (CBHI)' : 'CBHI Health Insurance Policy (Optional)'}
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            value={patientCbhi}
                            onChange={(e) => setPatientCbhi(e.target.value)}
                            placeholder="CBHI-ILL-10294"
                            className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* PASSWORD & CONFIRM PASSWORD WITH SHOW/HIDE & STRENGTH */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Jecha Icchitii' : language === 'am' ? 'የይለፍ ቃል' : 'Password'} *
                          </label>
                          <div className="relative">
                            <input
                              type={showPatientPassword ? 'text' : 'password'}
                              required
                              value={patientPassword}
                              onChange={(e) => setPatientPassword(e.target.value)}
                              onKeyDown={(e) => {
                                if (typeof e.getModifierState === 'function') {
                                  setCapsLockActive(e.getModifierState('CapsLock'));
                                }
                              }}
                              onKeyUp={(e) => {
                                if (typeof e.getModifierState === 'function') {
                                  setCapsLockActive(e.getModifierState('CapsLock'));
                                }
                              }}
                              onBlur={() => setCapsLockActive(false)}
                              placeholder="••••••••"
                              className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-3 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPatientPassword(!showPatientPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-amber-300 cursor-pointer transition-colors"
                              title={showPatientPassword ? 'Hide password' : 'Show password'}
                              aria-label="Toggle password visibility"
                            >
                              {showPatientPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {/* Password Strength Indicator */}
                          {patientPassword && (
                            <div className="mt-1.5 space-y-1">
                              <div className="flex gap-1 h-1.5 w-full">
                                <div className={`flex-1 rounded-full ${getPasswordStrength(patientPassword).score >= 1 ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                <div className={`flex-1 rounded-full ${getPasswordStrength(patientPassword).score >= 2 ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                <div className={`flex-1 rounded-full ${getPasswordStrength(patientPassword).score >= 3 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                              </div>
                              <span className={`text-[10px] font-semibold ${getPasswordStrength(patientPassword).color.split(' ')[1]}`}>
                                {getPasswordStrength(patientPassword).label}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Mirkaneessi' : language === 'am' ? 'አረጋግጥ' : 'Confirm'} *
                          </label>
                          <div className="relative">
                            <input
                              type={showPatientConfirmPassword ? 'text' : 'password'}
                              required
                              value={patientConfirmPassword}
                              onChange={(e) => setPatientConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-3 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPatientConfirmPassword(!showPatientConfirmPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-amber-300 cursor-pointer transition-colors"
                              title={showPatientConfirmPassword ? 'Hide password' : 'Show password'}
                              aria-label="Toggle password visibility"
                            >
                              {showPatientConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {/* Match indicator */}
                          {patientConfirmPassword && (
                            <div className="flex items-center gap-1 mt-1 text-[10.5px]">
                              {patientPassword === patientConfirmPassword ? (
                                <span className="text-emerald-400 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  {t.passwordMatch}
                                </span>
                              ) : (
                                <span className="text-rose-400 font-medium flex items-center gap-1">
                                  <span>•</span>
                                  {t.passwordMismatch}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Caps Lock Alert */}
                      {capsLockActive && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400 animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                          <span>{t.capsLockOn}</span>
                        </div>
                      )}

                      {/* Patient Registration Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingSignup}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-75 border border-amber-300"
                      >
                        {isSubmittingSignup ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                            <span>Galmaa&apos;aa jira...</span>
                          </div>
                        ) : (
                          <>
                            <HeartPulse className="h-4 w-4 text-slate-950" />
                            <span>
                              {language === 'om'
                                ? "Galmee Xumuri & Poortaalii Seeni"
                                : language === 'am'
                                ? 'ምዝገባውን አጠናቅቅና ፖርታሉን ግባ'
                                : 'Complete Registration & Access Portal'}
                            </span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* =========================================================== */
                  /* B2: STAFF SIGN UP / REGISTRATION FORM                       */
                  /* =========================================================== */
                  <div>
                    <div className="text-center mb-4 sm:mb-5">
                      <h2 className="text-[26px] sm:text-[30px] font-extrabold text-[#14276c] dark:text-white tracking-tight leading-tight">
                        {language === 'om'
                          ? 'Galmee Hojjataa'
                          : language === 'am'
                          ? 'የሰራተኛ ምዝገባ'
                          : 'Staff Registration'}
                      </h2>
                      <p className="mt-1 text-[13px] sm:text-[14px] text-[#6b7280] dark:text-slate-400 font-normal leading-relaxed">
                        {language === 'om'
                          ? "HMIS Hospitaala Rifeeraalaa Meettuu Kaarliitti akkaawuntii haarawa gaafadhaa"
                          : language === 'am'
                          ? 'ለመቱ ካርል ሪፈራል ሆስፒታል HMIS አዲስ አካውንት ይጠይቁ'
                          : 'Request an official staff account for Mettu Karl HMIS'}
                      </p>
                    </div>

                    <form onSubmit={handleSignupSubmit} className="space-y-3">
                      {signupError && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 flex items-start gap-2 text-xs text-rose-200">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{signupError}</span>
                        </div>
                      )}
                      {signupNotice && (
                        <div className="rounded-xl border border-teal-500/40 bg-teal-500/10 p-3 flex items-start gap-2 text-xs text-teal-200">
                          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                          <span>{signupNotice}</span>
                        </div>
                      )}
                      {/* USERNAME */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'om' ? 'Maqaa Fayyadamaa' : language === 'am' ? 'የተጠቃሚ ስም' : 'Username'} *
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={signupUsername}
                            onChange={(e) => setSignupUsername(e.target.value)}
                            placeholder={language === 'om' ? 'Fkn. dr.tolasaa' : 'e.g. dr.abebe'}
                            className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* FULL NAME */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'om' ? 'Maqaa Guutuu' : language === 'am' ? 'ሙሉ ስም' : 'Full Name'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={signupFullName}
                          onChange={(e) => setSignupFullName(e.target.value)}
                          placeholder={language === 'om' ? 'Fkn. Dr. Tolasaa Raggaasaa' : 'e.g. Dr. Abebe Kebede'}
                          className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      {/* STAFF ID & SYSTEM ROLE IN TWO BALANCED COLUMNS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Staff ID / Employee No. *
                          </label>
                          <input
                            type="text"
                            required
                            value={signupStaffId}
                            onChange={(e) => setSignupStaffId(e.target.value)}
                            placeholder="MKRH-STF-0142"
                            className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* SYSTEM ROLE (CUSTOM IN-DOM DROPDOWN) */}
                        <div className="relative" ref={roleDropdownRef}>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om'
                              ? "Ga'ee Hojii (System Role)"
                              : language === 'am'
                              ? 'የስራ ድርሻ (System Role)'
                              : 'System Role'} *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsRoleDropdownOpen(!isRoleDropdownOpen);
                              setIsDeptDropdownOpen(false);
                            }}
                            className={`w-full h-[46px] rounded-xl border bg-white dark:bg-[#070a10] px-3 text-sm text-slate-900 dark:text-white flex items-center justify-between font-medium cursor-pointer transition-colors ${
                              isRoleDropdownOpen
                                ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                                : 'border-slate-300 dark:border-[#222b3d] hover:border-amber-500/50'
                            }`}
                          >
                            <span className="truncate text-left">
                              {STAFF_ROLES.find((r) => r.value === signupRole)?.text || 'Medical Doctor / Clinician (Doktora / Ogeessa Yaalaa)'}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-amber-400 shrink-0 ml-1.5 transition-transform duration-200 ${
                                isRoleDropdownOpen ? 'rotate-180 text-amber-500' : ''
                              }`}
                            />
                          </button>

                          {isRoleDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-xl bg-[#0e131f] border border-[#222b3d] shadow-2xl z-50 py-1 scrollbar-thin">
                              {STAFF_ROLES.map((role) => {
                                const isSelected = signupRole === role.value;
                                return (
                                  <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => {
                                      setSignupRole(role.value);
                                      setIsRoleDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3.5 py-2 text-xs sm:text-[13px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'bg-amber-500/15 text-amber-300 font-bold'
                                        : 'text-slate-300 hover:bg-[#151c2c]'
                                    }`}
                                  >
                                    <span className="truncate">{role.text}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DEPARTMENT (CUSTOM IN-DOM DROPDOWN) */}
                      <div className="relative" ref={deptDropdownRef}>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'om' ? 'Kutaa Hojii (Department)' : language === 'am' ? 'የስራ ክፍል (Department)' : 'Department'} *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDeptDropdownOpen(!isDeptDropdownOpen);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full h-[46px] rounded-xl border bg-white dark:bg-[#070a10] px-3.5 text-sm text-slate-900 dark:text-white flex items-center justify-between font-medium cursor-pointer transition-colors ${
                            isDeptDropdownOpen
                              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                              : 'border-slate-300 dark:border-[#222b3d] hover:border-amber-500/50'
                          }`}
                        >
                          <span className="truncate text-left">
                            {STAFF_DEPARTMENTS.find((d) => d.value === signupDept)?.text || 'Doctor / Ogeessa Yaalaa (Medical Doctor Services)'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-amber-400 shrink-0 ml-2 transition-transform duration-200 ${
                              isDeptDropdownOpen ? 'rotate-180 text-amber-500' : ''
                            }`}
                          />
                        </button>

                        {/* Custom in-DOM Dropdown Menu */}
                        {isDeptDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl bg-[#0e131f] border border-[#222b3d] shadow-2xl z-50 py-1.5 scrollbar-thin">
                            {STAFF_DEPARTMENTS.map((dept) => {
                              const isSelected = signupDept === dept.value;
                              return (
                                <button
                                  key={dept.value}
                                  type="button"
                                  onClick={() => {
                                    setSignupDept(dept.value);
                                    setIsDeptDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-xs sm:text-[13px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-500/15 text-amber-300 font-bold'
                                      : 'text-slate-300 hover:bg-[#151c2c]'
                                  }`}
                                >
                                  <span className="truncate">{dept.text}</span>
                                  {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* IF CLINICAL ROLE: REQUIRE MEDICAL LICENSE & SHOW SENTINEL NOTICE */}
                      {isClinicalSignup && (
                        <div className="space-y-2.5 animate-in fade-in duration-200">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              {language === 'om'
                                ? 'Lakk. Hayyama Ogummaa Yaalaa (Medical License / EFDA Board No.)'
                                : language === 'am'
                                ? 'የህክምና ሙያ ፈቃድ ቁጥር (Medical License / EFDA)'
                                : 'Medical License / EFDA Board Reg No.'} *
                            </label>
                            <input
                              type="text"
                              required
                              value={signupLicenseNumber}
                              onChange={(e) => setSignupLicenseNumber(e.target.value)}
                              placeholder="Fkn. ETH-MED-2024-8491 ykn EFDA/2026/09"
                              className="block w-full h-[46px] rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-[#070a10] px-4 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                              {language === 'om'
                                ? 'Hayyama Biiroo Eegumsa Fayyaa ykn Boordii Yaalaa EFDA irraa kenname'
                                : 'Official license issued by Ministry of Health, Regional Health Bureau, or EFDA'}
                            </p>
                          </div>

                          {/* Zero-Trust Clinical Guard Sentinel Banner */}
                          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-[#070a10] p-3 flex items-start gap-2.5 text-xs text-amber-200 shadow-xs ring-1 ring-amber-500/20">
                            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[12px] text-amber-300">
                                {language === 'om'
                                  ? 'Eegumsa Iccitii Yaalaa (Zero-Trust Clinical Guard)'
                                  : 'Zero-Trust Clinical Guard & License Verification'}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-200/80">
                                {language === 'om'
                                  ? "Osoo ragaan hayyama ogummaa yaalaa keessanii Daarektara Yaalaa (Medical Director) fi Kutaa ICT Hospitaalaatiin hin mirkanaa'in akkaawuntiin kun ragaa dhukkubsattootaa ilaaluu hin danda'u. Galmeen booda haala qorannoo (Pending Verification) keessa tura."
                                  : "Clinical accounts remain locked in Pending Verification status until physical license verification by the Medical Director & ICT before patient charts can be opened."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isPrivilegedSignup && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 dark:bg-[#120912] p-3 flex items-start gap-2.5 text-xs text-rose-200 shadow-xs animate-in fade-in duration-200">
                          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-[12px] text-rose-300">
                              {language === 'om'
                                ? 'Akeekkachiisa Nageenya Admin (Privileged Role Quarantine)'
                                : 'Security Notice: Privileged Admin Claims Quarantined'}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-rose-200/80">
                              {language === 'om'
                                ? "Gaaffiin ga'ee Bulchiinsaa (Admin / ICT / Audit) ofumaan hin banamu — galmeen kun qorannoo Root Admin fi Audit Log keessatti cufamee eegama."
                                : 'Self-registered Administrative claims start LOCKED with zero privileges, trigger an Executive Security Alert, and require explicit Root Super Admin approval.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* CONTACT & PERSONAL BIOGRAPHY (VIEWABLE/EDITABLE BY ADMIN FOR RECOVERY & OVERSIGHT) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Lakkoofsa Bilbilaa (Phone)' : 'Phone Number'}
                          </label>
                          <input
                            type="tel"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="+2519XXXXXXXX"
                            className="block w-full h-[44px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Imeelii (Email)' : 'Work Email (Optional)'}
                          </label>
                          <input
                            type="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="name@mettukarl.gov.et"
                            className="block w-full h-[44px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'om'
                            ? 'Seenaa fi Muuxannoo Hojii (Biography / Qualification)'
                            : 'Staff Biography, Qualification & Background'}
                        </label>
                        <textarea
                          rows={2}
                          maxLength={2000}
                          value={signupBiography}
                          onChange={(e) => setSignupBiography(e.target.value)}
                          placeholder={
                            language === 'om'
                              ? 'Fkn. Barnoota yaalaa, muuxannoo hojii fi kutaa keessa hojjettan...'
                              : 'e.g. Degree, specialty, years of experience, clinic assignment...'
                          }
                          className="block w-full rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-y"
                        />
                      </div>

                      {/* PASSWORD & CONFIRM PASSWORD WITH SHOW/HIDE & STRENGTH */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Jecha Icchitii' : language === 'am' ? 'የይለፍ ቃል' : 'Password'} *
                          </label>
                          <div className="relative">
                            <input
                              type={showSignupPassword ? 'text' : 'password'}
                              required
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              onKeyDown={(e) => {
                                if (typeof e.getModifierState === 'function') {
                                  setCapsLockActive(e.getModifierState('CapsLock'));
                                }
                              }}
                              onKeyUp={(e) => {
                                if (typeof e.getModifierState === 'function') {
                                  setCapsLockActive(e.getModifierState('CapsLock'));
                                }
                              }}
                              onBlur={() => setCapsLockActive(false)}
                              placeholder="••••••••"
                              className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-3 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-amber-300 cursor-pointer transition-colors"
                              title={showSignupPassword ? 'Hide password' : 'Show password'}
                              aria-label="Toggle password visibility"
                            >
                              {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {/* Password Strength Indicator */}
                          {signupPassword && (
                            <div className="mt-1.5 space-y-1">
                              <div className="flex gap-1 h-1.5 w-full">
                                <div className={`flex-1 rounded-full ${getPasswordStrength(signupPassword).score >= 1 ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                <div className={`flex-1 rounded-full ${getPasswordStrength(signupPassword).score >= 2 ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                <div className={`flex-1 rounded-full ${getPasswordStrength(signupPassword).score >= 3 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                              </div>
                              <span className={`text-[10px] font-semibold ${getPasswordStrength(signupPassword).color.split(' ')[1]}`}>
                                {getPasswordStrength(signupPassword).label}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Mirkaneessi' : language === 'am' ? 'አረጋግጥ' : 'Confirm'} *
                          </label>
                          <div className="relative">
                            <input
                              type={showSignupConfirmPassword ? 'text' : 'password'}
                              required
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className="block w-full h-[46px] rounded-xl border border-slate-300 dark:border-[#222b3d] bg-white dark:bg-[#070a10] pl-3 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-amber-300 cursor-pointer transition-colors"
                              title={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                              aria-label="Toggle password visibility"
                            >
                              {showSignupConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {/* Match indicator */}
                          {signupConfirmPassword && (
                            <div className="flex items-center gap-1 mt-1 text-[10.5px]">
                              {signupPassword === signupConfirmPassword ? (
                                <span className="text-emerald-400 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  {t.passwordMatch}
                                </span>
                              ) : (
                                <span className="text-rose-400 font-medium flex items-center gap-1">
                                  <span>•</span>
                                  {t.passwordMismatch}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Caps Lock Alert */}
                      {capsLockActive && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400 animate-in fade-in duration-150">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                          <span>{t.capsLockOn}</span>
                        </div>
                      )}

                      {/* Submit Staff Sign Up Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingSignup}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-75 border border-amber-300"
                      >
                        {isSubmittingSignup ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                            <span>Ergaa jira...</span>
                          </div>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 text-slate-950" />
                            <span>
                              {language === 'om'
                                ? "Galmee Hojjataa Gaafadhu"
                                : language === 'am'
                                ? 'የሰራተኛ ምዝገባ ጠይቅ'
                                : 'Submit Staff Registration'}
                            </span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Switch to Login link */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'om'
                      ? 'Duraan akkaawuntii qabduu? '
                      : language === 'am'
                      ? 'አካውንት አለዎት? '
                      : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => setFormType('login')}
                      className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold transition cursor-pointer ml-1"
                    >
                      {language === 'om' ? 'Seenaa (Login)' : language === 'am' ? 'ይግቡ (Login)' : 'Log In'}
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Subtle Secure Access Information Panel */}
            <div className="w-full rounded-xl bg-amber-500/10 dark:bg-[#070a10] border border-amber-500/30 dark:border-[#222b3d] p-3 flex items-center gap-3 mt-4 shadow-xs">
              <ShieldCheck className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-amber-300 leading-tight">
                  {t.secureAccessTitle}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5">
                  {t.secureAccessSubtitle}
                </p>
              </div>
            </div>

            {/* Card Footer: IT Support & Version */}
            <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setShowITSupportModal(true)}
                className="flex items-center gap-2 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer text-left"
              >
                <Headphones className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300 leading-tight">
                    {t.itSupportTitle}
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
                    {t.itSupportContact}
                  </p>
                </div>
              </button>
              <span className="font-mono text-slate-400 text-[11px]">HMIS Enterprise v2.4</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* FORGOT PASSWORD MODAL                                                   */}
      {/* ======================================================================= */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#0e131f] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-[#222b3d]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#1a2233]">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t.forgotModalTitle}
                  </h3>
                  <p className="text-xs text-amber-300/80">Mettu Karl Referral Hospital</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2233] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs text-slate-300">
              <p className="font-medium text-slate-200">
                {t.forgotModalSubtitle}
              </p>
              <ul className="space-y-2 border-l-2 border-amber-500 pl-3 text-slate-300">
                <li>{t.forgotModalStep1}</li>
                <li>{t.forgotModalStep2}</li>
              </ul>
              <div className="rounded-lg bg-[#070a10] p-2.5 flex items-center gap-2 text-amber-300 font-mono text-[11px] border border-[#222b3d]">
                <Info className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{t.forgotModalContact}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300 transition cursor-pointer"
              >
                {t.forgotModalClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* IT SUPPORT MODAL                                                        */}
      {/* ======================================================================= */}
      {showITSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowITSupportModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#0e131f] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-[#222b3d]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#1a2233]">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400 border border-amber-500/30">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t.itSupportTitle}
                  </h3>
                  <p className="text-xs text-amber-300/80">Mettu Karl Referral Hospital</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowITSupportModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-[#1a2233] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs text-slate-300">
              <p className="font-medium text-slate-200">
                {language === 'om'
                  ? 'Kutaa Deeggarsa ICT Hospitaalaa (Tajaajila Sa\'a 24/7):'
                  : language === 'am'
                  ? 'የሆስፒታሉ ICT ድጋፍ ክፍል (24/7 አገልግሎት):'
                  : 'Hospital ICT Help Desk (24/7 Operations):'}
              </p>
              <ul className="space-y-2 border-l-2 border-amber-500 pl-3">
                <li>
                  <strong className="text-amber-200">Internal Extension:</strong> 4401 / 4402
                </li>
                <li>
                  <strong className="text-amber-200">Direct Line:</strong> +251 47 111 0204
                </li>
                <li>
                  <strong className="text-amber-200">Duty ICT Officer:</strong> +251 91 123 4567
                </li>
                <li>
                  <strong className="text-amber-200">Location:</strong> Administrative Building, 2nd Floor, Room 204
                </li>
                <li>
                  <strong className="text-amber-200">Email:</strong> support@mettukarl.gov.et
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowITSupportModal(false)}
                className="rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300 transition cursor-pointer"
              >
                {t.forgotModalClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
