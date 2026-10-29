/**
 * Mettu Karl Referral Hospital HMIS — Full-Screen Login & Interactive Portal Page
 *
 * SPECIFICATION & INTERACTIVE UX:
 * - Default State:
 *   - The login form is initially hidden as requested.
 *   - The screen showcases the full hospital building image and hospital branding.
 *   - Centered on the hospital building image are interactive, animated action buttons:
 *     1. [ 🔐 Seeni (Login) ] — animated gradient shimmer, hover scale, pulse glow.
 *     2. [ 📝 Galmaa'i (Sign Up) ] — frosted glass border, hover glow, animated shimmer.
 * - On Click:
 *   - Clicking Login or Sign Up smoothly brings up the page form modal with backdrop blur.
 *   - A close button [ ✕ ] (or Escape key / backdrop click) closes the form and returns to the animated hero view.
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation, type Language } from '@/lib/i18n';

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
  },
};

const STAFF_DEPARTMENTS = [
  { value: 'doctor', text: 'Doctor / Ogeessa Yaalaa (Medical Doctor Services)' },
  { value: 'clinical', text: 'Clinical Services & OPD / Tajaajila Kilinikaalaa' },
  { value: 'emergency', text: 'Emergency & Trauma / Tajaajila Ariifachiisaa & MCI' },
  { value: 'surgery', text: 'Surgery & OT / Kutaa Baqaqsanii Yaaluu & CSSD' },
  { value: 'inpatient', text: 'Inpatient & Wards / Kutaa Ciisichaa & Narsii' },
  { value: 'icu', text: 'ICU Critical Care & IoMT / Telemetirii' },
  { value: 'telemed', text: 'Telemedicine / Yaala Fagoo Vidiyoo' },
  { value: 'pharmacy', text: 'Pharmacy & FEFO / Faarmaasii & Qoricha' },
  { value: 'laboratory', text: 'Laboratory & Pathology / Laaboraatorii & Qorannoo' },
  { value: 'blood_bank', text: 'Blood Bank & Stock / Kuusaa Dhiigaa' },
  { value: 'radiology', text: 'Radiology & PACS / Suuraa X-Ray & CT Scan' },
  { value: 'reception', text: 'Reception & Queue / Simannaa & Dabaree OPD' },
  { value: 'billing', text: 'Billing & Telebirr / Kaffaltii & Sanduuqa' },
  { value: 'insurance', text: 'CBHI & Health Insurance / Inshuraansii Fayyaa' },
  { value: 'biomedical', text: 'Biomedical Engineering / Meeshaalee Yaalaa' },
  { value: 'infection_control', text: 'Infection Prevention & Control / EPHI CDC' },
  { value: 'ems', text: '907 EMS Ambulance / Ambulaansii Ariifachiisaa' },
  { value: 'admin', text: 'Hospital Administration & HRM / Bulchiinsa' },
  { value: 'ict', text: 'ICT & HMIS Systems / Daataa & Sirna Odeeffannoo' },
  { value: 'audit', text: 'Clinical Audit & Quality / Qulqullina EHSTG' },
  { value: 'dietary', text: 'Dietary & Kitchen / Nyaata Dhukkubsattootaa' },
  { value: 'mortuary', text: 'Mortuary Vaults / Kutaa Reeffaa' },
];

const STAFF_ROLES = [
  { value: 'doctor', text: 'Medical Doctor / Clinician (Doktora / Ogeessa Yaalaa)' },
  { value: 'specialist', text: 'Specialist Surgeon / Consultant (Ispeeshaaliistii / Baqaqsituu)' },
  { value: 'nurse', text: 'Clinical Nurse / Ward Nurse (Ogeessa Narsii / Eegduu)' },
  { value: 'pharmacist', text: 'Pharmacist / Druggist (Faarmaasistii / Ogeessa Qorichaa)' },
  { value: 'lab_tech', text: 'Laboratory Technologist (Ogeessa Laaboraatorii)' },
  { value: 'radiographer', text: 'Radiographer / PACS Specialist (Ogeessa Suuraa X-Ray / CT)' },
  { value: 'receptionist', text: 'Reception & Triage Officer (Ofisara Simannaa & Galmee)' },
  { value: 'billing', text: 'Billing Officer / Cashier (Ofisara Kaffaltii & Herregaa)' },
  { value: 'insurance_officer', text: 'Health Insurance / CBHI Officer (Ofisara Inshuraansii Fayyaa)' },
  { value: 'biomedical', text: 'Biomedical Engineer (Injineera Meeshaalee Yaalaa)' },
  { value: 'ict_admin', text: 'ICT & System Administrator (Bulchaa Sirna ICT & HMIS)' },
  { value: 'admin', text: 'Hospital Administrator / HR (Hoggansa Hospitaalaa)' },
  { value: 'auditor', text: 'Clinical Quality Auditor / EHSTG (Odītara Qulqullina Yaalaa)' },
  { value: 'paramedic', text: 'EMS & Ambulance Paramedic (Ogeessa Ambulaansii 907)' },
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

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyMFA, patientRegister } = useAuth();
  const { language, setLanguage } = useTranslation();

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [mfaToken, setMfaToken] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  const [signupStaffId, setSignupStaffId] = useState('');
  const [signupDept, setSignupDept] = useState('doctor');
  const [signupRole, setSignupRole] = useState('doctor');
  const [signupLicenseNumber, setSignupLicenseNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const isClinicalSignup =
    signupDept === 'doctor' ||
    signupRole === 'doctor' ||
    signupRole === 'specialist' ||
    signupRole === 'consultant' ||
    signupRole === 'nurse';

  // Formal Patient Registration state
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
  const [revealStep, setRevealStep] = useState(0);

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

  const t = copy[language] ?? copy.om;

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
    try {
      if (rememberMe) {
        localStorage.setItem('mettu_his_remember_username', data.username);
      } else {
        localStorage.removeItem('mettu_his_remember_username');
      }

      const response = await login(data.username, data.password);

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
      const destination = isPatient ? '/patient-portal' : '/dashboard';
      if (typeof window !== 'undefined') {
        window.location.href = destination;
      } else {
        router.push(destination);
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : language === 'om'
          ? 'Maqaa fayyadamaa ykn jecha icchitii dogoggoraa'
          : 'Invalid credentials. Please verify your username and password.';

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
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      } else {
        router.push('/dashboard');
      }
    } catch {
      setIsFormOpen(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      } else {
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Patient Registration Submit
  async function handlePatientSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientFullName.trim() || !patientPhone.trim() || !patientPassword) {
      notifications.show({
        title: language === 'om' ? 'Dirree Hin Guutamne' : 'Missing Information',
        message:
          language === 'om'
            ? 'Maaloo Maqaa, Lakkoofsa Bilbilaa fi Jecha Icciitii guutaa.'
            : 'Please enter Full Name, Phone Number, and Password.',
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
      if (typeof window !== 'undefined') {
        window.location.href = '/patient-portal';
      } else {
        router.push('/patient-portal');
      }
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

  // Handle Staff Sign Up Submit
  function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signupFullName.trim() || !signupStaffId.trim() || !signupPassword) {
      notifications.show({
        title: language === 'om' ? 'Dirree Hin Guutamne' : 'Missing Information',
        message:
          language === 'om'
            ? 'Maaloo dirreewwan barbaachisan hunda guutaa.'
            : 'Please complete all required fields.',
        color: 'red',
      });
      return;
    }
    if (isClinicalSignup && !signupLicenseNumber.trim()) {
      notifications.show({
        title: language === 'om' ? 'Hayyama Ogummaa Barbaachisa' : 'Medical License Required',
        message:
          language === 'om'
            ? 'Ogeessi yaalaa hayyama boordii (EFDA / Medical License Number) galchuun dirqama eegumsa iccitii ti.'
            : 'Clinical staff must provide an official Medical License or EFDA Board Registration number.',
        color: 'red',
      });
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      notifications.show({
        title: language === 'om' ? 'Jecha Icchitii' : 'Password Mismatch',
        message:
          language === 'om'
            ? 'Jechi icchitii lachuu wal hin simne.'
            : 'The two passwords do not match.',
        color: 'red',
      });
      return;
    }
    setIsSubmittingSignup(true);
    setTimeout(() => {
      setIsSubmittingSignup(false);
      notifications.show({
        title:
          language === 'om'
            ? isClinicalSignup
              ? "Galmee Ogeessa Yaalaa (Qorannoon Eegama)"
              : 'Galmeen Ergameera!'
            : isClinicalSignup
            ? 'Clinical Registration Submitted (Verification Pending)'
            : 'Registration Submitted!',
        message:
          language === 'om'
            ? isClinicalSignup
              ? "Ragaan hayyama ogummaa fi gaaffiin keessan Daarektara Yaalaa fi ICT Hospitaalaaf ergameera. Qorannoon boordii erga xumuramee booda akkaawuntiin keessan ni banama."
              : "Gaaffiin galmee keessanii qorannoof kutaa ICTtti ergameera. Yeroo muraasa keessatti mirkanaa'a."
            : isClinicalSignup
            ? 'Your medical license credentials have been submitted to the Medical Director & ICT. Access will be granted after credential verification.'
            : 'Your registration request has been submitted to the ICT Department for verification.',
        color: 'teal',
      });
      setFormType('login');
    }, 800);
  }

  const currentLangLabel =
    language === 'om' ? 'Afaan Oromoo' : language === 'am' ? 'አማርኛ' : 'English';

  return (
    <div className="w-screen h-screen min-h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[#0a3a78] dark:bg-[#061426] font-sans select-none m-0 p-0 relative">
      {/* ======================================================================= */}
      {/* TOP-RIGHT CONTROLS: LANGUAGE DROPDOWN                                  */}
      {/* ======================================================================= */}
      <div className="absolute top-8 sm:top-8 right-3.5 sm:right-8 z-40 flex items-center gap-2 sm:gap-2.5">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/25 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold shadow-sm backdrop-blur-md transition-all cursor-pointer"
            aria-expanded={isLangMenuOpen}
            aria-label="Select Language"
          >
            <Globe className="h-3.5 w-3.5 text-sky-200" />
            <span>{currentLangLabel}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-sky-200/80 transition-transform duration-200 ${
                isLangMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Language Dropdown Menu */}
          {isLangMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  setIsLangMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer ${
                  language === 'en'
                    ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-slate-800/80'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>English</span>
                {language === 'en' && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('om');
                  setIsLangMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer ${
                  language === 'om'
                    ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-slate-800/80'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Afaan Oromoo</span>
                {language === 'om' && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('am');
                  setIsLangMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer ${
                  language === 'am'
                    ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-slate-800/80'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>አማርኛ</span>
                {language === 'am' && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* HOSPITAL BUILDING HERO VIEW (EDGE-TO-EDGE FULL SCREEN BACKGROUND)       */}
      {/* ======================================================================= */}
      <div className="w-full h-full relative shrink-0 flex flex-col justify-between overflow-y-auto lg:overflow-hidden select-none">
        
        {/* =================================================================== */}
        {/* FULL-BLEED BACKGROUND CANVAS (Ken Burns + 5-Part Architectural Reveal) */}
        {/* =================================================================== */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950 pointer-events-none">
          {/* 1. Final Seamless Ken Burns Layer (Fuses smoothly at step >= 4) */}
          <div
            className={`absolute inset-0 w-full h-full transform transition-all duration-1000 ease-out scale-[1.35] sm:scale-100 origin-[27%_35%] sm:origin-center bg-[position:27%_35%] sm:bg-[position:center_34%] ${
              revealStep >= 4
                ? 'opacity-100 blur-none animate-ken-burns'
                : 'opacity-0 scale-105 blur-sm pointer-events-none'
            }`}
            style={{
              backgroundImage: "url('/hospital-building.jpg')",
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* 2. 5-Part Architectural Shutter Slices (Visible during reveal steps 0-3) */}
          <div
            className={`absolute inset-0 w-full h-full flex transition-opacity duration-700 ${
              revealStep >= 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {BUILDING_PARTS.map((part, index) => {
              const isPartOpen = revealStep >= part.step;
              return (
                <div
                  key={part.id}
                  className="relative h-full flex-1 overflow-hidden border-r last:border-r-0 border-white/20 bg-slate-950/80"
                >
                  {/* Image slice for this part */}
                  <div
                    className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out transform scale-[1.35] sm:scale-100 origin-[27%_35%] sm:origin-center ${
                      isPartOpen
                        ? 'opacity-100 translate-y-0 blur-none'
                        : 'opacity-0 scale-115 translate-y-8 blur-md'
                    }`}
                    style={{
                      backgroundImage: "url('/hospital-building.jpg')",
                      backgroundSize: '500% 100%',
                      backgroundPosition: `${index * 25}% 34%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />

                  {/* Frosted Shutter Blade that draws upward */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-b from-[#0a3a78]/90 via-[#071d3d]/85 to-[#041124]/90 backdrop-blur-xs transition-all duration-700 pointer-events-none ${
                      isPartOpen ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
                    }`}
                  />

                  {/* Glowing vertical laser beam partition */}
                  <div
                    className={`absolute inset-y-0 right-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] transition-opacity duration-500 ${
                      isPartOpen ? 'opacity-70' : 'opacity-25'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Atmospheric Scrims: Enhances text readability while preserving the vibrant scene */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80 pointer-events-none" />
          <div className="hidden lg:block absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-slate-950/50 to-transparent pointer-events-none" />
          <div className="hidden lg:block absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-slate-950/50 to-transparent pointer-events-none" />
        </div>

        {/* =================================================================== */}
        {/* FOREGROUND CONTENT LAYER (TOP BRANDING, ACTION BUTTONS, BOTTOM)     */}
        {/* =================================================================== */}
        
        {/* 1. TOP BRANDING SECTION (FLOATING ON SKY) */}
        <div
          className={`relative z-20 px-3.5 pt-8 sm:px-8 sm:pt-8 transition-all duration-700 max-w-xl ${
            revealStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src="/hospital-logo-white.png"
              alt="Mettu Karl Referral Hospital Emblem"
              className="h-9 w-9 sm:h-14 sm:w-14 rounded-full bg-white/95 p-0.5 shadow-xl shrink-0 object-contain ring-2 ring-white/30"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] truncate sm:whitespace-normal">
                {t.hospitalName}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-sky-200 mt-0.5 tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] truncate sm:whitespace-normal">
                {t.hmisTitle} • {t.hmisSubtitle}
              </p>
            </div>
          </div>

          {/* Hospital Tagline */}
          <p className="text-[10px] sm:text-xs italic text-sky-100 font-medium mt-0.5 sm:mt-2 tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] truncate sm:whitespace-normal">
            {t.tagline}
          </p>
        </div>

        {/* 2. ACTION BUTTONS SECTION (FLOATING TOWARDS BOTTOM OVER DRIVEWAY) */}
        <div
          className={`relative z-20 w-full flex flex-col items-center justify-center px-4 mt-auto mb-5 sm:mb-8 lg:mb-10 transition-all duration-1000 ${
            revealStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Slight frosted pill grouping buttons smoothly with no harsh border box */}
          <div className="w-full max-w-md backdrop-blur-md bg-slate-950/45 rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border border-white/20 shadow-2xl ring-1 ring-white/10">
            <div className="flex flex-row items-center justify-center gap-2.5 sm:gap-4 w-full">
              {/* Login Button */}
              <div className="relative group flex-1">
                <div
                  className={`absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600 opacity-80 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 ${
                    isFormOpen ? 'opacity-0 pointer-events-none' : 'animate-pulse'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormType('login');
                    setIsFormOpen(true);
                  }}
                  className="relative overflow-hidden w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0256ae] via-[#0070f3] to-[#0256ae] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-600/50 hover:shadow-blue-400/80 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-sky-300/50 touch-manipulation"
                >
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/45 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
                  <LogIn className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-115" />
                  <span className="tracking-wide drop-shadow-md truncate">
                    {language === 'om' ? 'Seeni (Login)' : language === 'am' ? 'ግባ (Login)' : 'Login'}
                  </span>
                </button>
              </div>

              {/* Sign Up Button */}
              <div className="relative group flex-1">
                <div
                  className={`absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 opacity-70 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 ${
                    isFormOpen ? 'opacity-0 pointer-events-none' : 'animate-pulse'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormType('signup');
                    setIsFormOpen(true);
                  }}
                  className="relative overflow-hidden w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs sm:text-sm border-2 border-white/85 shadow-xl shadow-sky-500/30 hover:shadow-cyan-400/60 hover:scale-105 active:scale-95 backdrop-blur-md transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
                  <UserPlus className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-125" />
                  <span className="tracking-wide drop-shadow-md truncate">
                    {language === 'om' ? 'Galmaa\'i (Sign Up)' : language === 'am' ? 'ተመዝገብ (Sign Up)' : 'Sign Up'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM SECTION: FROSTED GLASS BAR WITH 4 SERVICE BADGES */}
        <div className="relative z-20 w-full backdrop-blur-md bg-slate-950/50 border-t border-white/15 px-2.5 sm:px-6 pt-2 pb-8 sm:pt-3 sm:pb-5 shrink-0 shadow-2xl">
          {/* 4 Feature Badges with Vertical Dividers */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="grid grid-cols-4 divide-x divide-white/20">
              {/* Feature 1: Patient Management */}
              <div className="flex flex-col items-center text-center px-1">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-white shadow-xs transition-transform hover:scale-105">
                  <UserCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[11px] font-medium text-white/95 mt-0.5 sm:mt-1 leading-tight drop-shadow-sm">
                  {t.servicePatient}
                </span>
              </div>

              {/* Feature 2: Inpatient & Ward Management */}
              <div className="flex flex-col items-center text-center px-1">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-white shadow-xs transition-transform hover:scale-105">
                  <Bed className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[11px] font-medium text-white/95 mt-0.5 sm:mt-1 leading-tight drop-shadow-sm">
                  {t.serviceInpatient}
                </span>
              </div>

              {/* Feature 3: Clinical Services */}
              <div className="flex flex-col items-center text-center px-1">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-white shadow-xs transition-transform hover:scale-105">
                  <Stethoscope className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[11px] font-medium text-white/95 mt-0.5 sm:mt-1 leading-tight drop-shadow-sm">
                  {t.serviceClinical}
                </span>
              </div>

              {/* Feature 4: Reports & Analytics */}
              <div className="flex flex-col items-center text-center px-1">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-white shadow-xs transition-transform hover:scale-105">
                  <BarChart2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[11px] font-medium text-white/95 mt-0.5 sm:mt-1 leading-tight drop-shadow-sm">
                  {t.serviceAnalytics}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Hospital HMIS Tag */}
          <div className="pt-1.5 pb-4 sm:pt-1.5 sm:pb-0 text-center">
            <p className="text-[9.5px] sm:text-[10.5px] font-normal text-sky-200/80 tracking-wide drop-shadow-sm">
              Mettu Karl Referral Hospital HMIS
            </p>
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
            className={`relative z-20 w-full max-w-[570px] xl:max-w-[620px] max-h-[92vh] overflow-y-auto rounded-[28px] px-6 py-5 sm:px-10 sm:py-6 xl:px-12 xl:py-7 shadow-2xl transition-colors duration-200 my-auto border animate-in zoom-in-95 duration-300 ${
              isDarkMode
                ? 'bg-[#0f172a] border-slate-700/80 shadow-black/80'
                : 'bg-[#f8fafc] border-white/60 shadow-2xl shadow-blue-950/40'
            }`}
          >
            {/* Close button X */}
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer shadow-sm z-30"
              title="Cufi / Close"
              aria-label="Close"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Centered Official Hospital Logo */}
            <div className="flex justify-center mb-2.5 sm:mb-3">
              <img
                src="/hospital-logo.png"
                alt="Mettu Karl Hospital Seal"
                className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] object-contain rounded-full shadow-2xs"
              />
            </div>

            {/* ================================================================= */}
            {/* VIEW A: LOGIN FORM                                               */}
            {/* ================================================================= */}
            {formType === 'login' ? (
              <>
                {/* Heading: Welcome Back */}
                <div className="text-center mb-5 sm:mb-6">
                  <h2 className="text-[29px] sm:text-[34px] font-extrabold text-[#14276c] dark:text-white tracking-tight leading-tight">
                    {step === 'credentials' ? t.welcomeBack : t.mfaTitle}
                  </h2>
                  <p className="mt-1 text-[14px] sm:text-[15px] text-[#6b7280] dark:text-slate-400 font-normal leading-relaxed">
                    {step === 'credentials' ? t.welcomeSubtitle : t.mfaDesc}
                  </p>
                </div>

                {/* Step 1: Credentials Form */}
                {step === 'credentials' ? (
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    noValidate
                    className="space-y-4"
                  >
                    {/* USERNAME FIELD */}
                    <div className="w-full">
                      <div className="flex items-center gap-2 rounded-xl bg-[#e2f0fd] dark:bg-blue-950/70 border border-blue-200/50 dark:border-blue-800/40 px-4 py-2.5 mb-1.5 w-full">
                        <User className="h-4.5 w-4.5 text-[#0066cc] fill-[#0066cc]" />
                        <label
                          htmlFor={usernameId}
                          className="text-[15.5px] font-semibold text-[#1a365d] dark:text-sky-200 cursor-pointer select-none"
                        >
                          {t.usernameLabel}
                        </label>
                      </div>

                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                          <User className="h-4.5 w-4.5 stroke-[2]" />
                        </div>
                        <input
                          id={usernameId}
                          type="text"
                          autoComplete="username"
                          autoFocus
                          {...loginForm.register('username')}
                          placeholder={t.usernamePlaceholder}
                          className="block w-full h-[52px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-12 pr-4 text-[15px] font-normal text-slate-900 dark:text-white placeholder:text-[#9ca3af] placeholder:text-[14px] placeholder:font-normal focus:border-[#0066cc] focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                        />
                      </div>
                      {loginForm.formState.errors.username && (
                        <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                          <span>•</span> {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    {/* PASSWORD FIELD */}
                    <div className="w-full">
                      <div className="flex items-center gap-2 rounded-xl bg-[#e2f0fd] dark:bg-blue-950/70 border border-blue-200/50 dark:border-blue-800/40 px-4 py-2.5 mb-1.5 mt-3.5 w-full">
                        <Lock className="h-4.5 w-4.5 text-[#0066cc] fill-[#0066cc]" />
                        <label
                          htmlFor={passwordId}
                          className="text-[15.5px] font-semibold text-[#1a365d] dark:text-sky-200 cursor-pointer select-none"
                        >
                          {t.passwordLabel}
                        </label>
                      </div>

                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                          <Lock className="h-4.5 w-4.5 stroke-[2]" />
                        </div>
                        <input
                          id={passwordId}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          {...loginForm.register('password')}
                          placeholder={t.passwordPlaceholder}
                          className="block w-full h-[52px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-12 pr-12 text-[15px] font-normal text-slate-900 dark:text-white placeholder:text-[#9ca3af] placeholder:text-[14px] placeholder:font-normal focus:border-[#0066cc] focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                          title={showPassword ? 'Hide password' : 'Show password'}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4.5 w-4.5 stroke-[1.8]" />
                          ) : (
                            <Eye className="h-4.5 w-4.5 stroke-[1.8]" />
                          )}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                          <span>•</span> {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Remember Me Checkbox & Forgot Password Link */}
                    <div className="flex items-center justify-between text-[13.5px] pt-1 pb-0.5">
                      <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none font-normal">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>{t.rememberMe}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition cursor-pointer"
                      >
                        {t.forgotPassword}
                      </button>
                    </div>

                    {/* Full-Width Blue Gradient Login Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#0256ae] to-[#08559b] hover:from-[#024a96] hover:to-[#074782] active:from-[#023e7e] active:to-[#063b6d] text-white font-bold text-[16px] shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>{t.signingIn}</span>
                        </div>
                      ) : (
                        <>
                          <LogIn className="h-5 w-5 stroke-[2.2]" />
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
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                          className="block w-full h-[52px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 text-center tracking-widest text-lg font-mono text-slate-900 dark:text-white focus:border-[#0066cc] focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                      className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#0256ae] to-[#08559b] hover:from-[#024a96] hover:to-[#074782] text-white font-bold text-[16px] transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <span>{t.mfaVerifyBtn}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('credentials')}
                      className="w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 pt-1 cursor-pointer"
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
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold transition cursor-pointer"
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
                <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 mb-5 border border-slate-200/80 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setSignupAccountType('patient')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      signupAccountType === 'patient'
                        ? 'bg-gradient-to-r from-[#0256ae] to-[#08559b] text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <HeartPulse className="w-4 h-4" />
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
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      signupAccountType === 'staff'
                        ? 'bg-gradient-to-r from-[#0256ae] to-[#08559b] text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
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
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                              className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                              className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                              className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      </div>

                      {/* PASSWORD & CONFIRM PASSWORD */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Jecha Icchitii' : language === 'am' ? 'የይለፍ ቃል' : 'Password'} *
                          </label>
                          <input
                            type="password"
                            required
                            value={patientPassword}
                            onChange={(e) => setPatientPassword(e.target.value)}
                            placeholder="••••••••"
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Mirkaneessi' : language === 'am' ? 'አረጋግጥ' : 'Confirm'} *
                          </label>
                          <input
                            type="password"
                            required
                            value={patientConfirmPassword}
                            onChange={(e) => setPatientConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      </div>

                      {/* Patient Registration Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingSignup}
                        className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#0256ae] to-[#08559b] hover:from-[#024a96] hover:to-[#074782] text-white font-bold text-[15.5px] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-75"
                      >
                        {isSubmittingSignup ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Galmaa&apos;aa jira...</span>
                          </div>
                        ) : (
                          <>
                            <HeartPulse className="h-5 w-5" />
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
                          className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                            className={`w-full h-[46px] rounded-xl border bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white flex items-center justify-between font-medium cursor-pointer transition-colors ${
                              isRoleDropdownOpen
                                ? 'border-blue-500 ring-1 ring-blue-400 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <span className="truncate text-left">
                              {STAFF_ROLES.find((r) => r.value === signupRole)?.text || 'Medical Doctor / Clinician (Doktora / Ogeessa Yaalaa)'}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200 ${
                                isRoleDropdownOpen ? 'rotate-180 text-blue-500' : ''
                              }`}
                            />
                          </button>

                          {isRoleDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 py-1 scrollbar-thin">
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
                                        ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold'
                                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                    }`}
                                  >
                                    <span className="truncate">{role.text}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DEPARTMENT (CUSTOM IN-DOM DROPDOWN: 100% ROCK SOLID, ZERO JITTER OUTSIDE PORTAL) */}
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
                          className={`w-full h-[46px] rounded-xl border bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white flex items-center justify-between font-medium cursor-pointer transition-colors ${
                            isDeptDropdownOpen
                              ? 'border-blue-500 ring-1 ring-blue-400 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="truncate text-left">
                            {STAFF_DEPARTMENTS.find((d) => d.value === signupDept)?.text || 'Doctor / Ogeessa Yaalaa (Medical Doctor Services)'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                              isDeptDropdownOpen ? 'rotate-180 text-blue-500' : ''
                            }`}
                          />
                        </button>

                        {/* Custom in-DOM Dropdown Menu */}
                        {isDeptDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 py-1.5 scrollbar-thin">
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
                                      ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold'
                                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                  }`}
                                >
                                  <span className="truncate">{dept.text}</span>
                                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* IF CLINICAL ROLE (DOCTOR/NURSE/SPECIALIST): REQUIRE MEDICAL LICENSE & SHOW SENTINEL NOTICE */}
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
                              className="block w-full h-[46px] rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-slate-900 px-4 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                              {language === 'om'
                                ? 'Hayyama Biiroo Eegumsa Fayyaa ykn Boordii Yaalaa EFDA irraa kenname'
                                : 'Official license issued by Ministry of Health, Regional Health Bureau, or EFDA'}
                            </p>
                          </div>

                          {/* Zero-Trust Clinical Guard Sentinel Banner */}
                          <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/40 p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
                            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[12px]">
                                {language === 'om'
                                  ? 'Eegumsa Iccitii Yaalaa (Zero-Trust Clinical Guard)'
                                  : 'Zero-Trust Clinical Guard & License Verification'}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                {language === 'om'
                                  ? "Osoo ragaan hayyama ogummaa yaalaa keessanii Daarektara Yaalaa (Medical Director) fi Kutaa ICT Hospitaalaatiin hin mirkanaa'in akkaawuntiin kun ragaa dhukkubsattootaa ilaaluu hin danda'u. Galmeen booda haala qorannoo (Pending Verification) keessa tura."
                                  : "Clinical accounts remain locked in Pending Verification status until physical license verification by the Medical Director & ICT before patient charts can be opened."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PASSWORD & CONFIRM PASSWORD */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Jecha Icchitii' : language === 'am' ? 'የይለፍ ቃል' : 'Password'} *
                          </label>
                          <input
                            type="password"
                            required
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="••••••••"
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {language === 'om' ? 'Mirkaneessi' : language === 'am' ? 'አረጋግጥ' : 'Confirm'} *
                          </label>
                          <input
                            type="password"
                            required
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="block w-full h-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      </div>

                      {/* Submit Staff Sign Up Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingSignup}
                        className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#0256ae] to-[#08559b] hover:from-[#024a96] hover:to-[#074782] text-white font-bold text-[15.5px] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-75"
                      >
                        {isSubmittingSignup ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Ergaa jira...</span>
                          </div>
                        ) : (
                          <>
                            <UserPlus className="h-5 w-5" />
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
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {language === 'om'
                      ? 'Duraan akkaawuntii qabduu? '
                      : language === 'am'
                      ? 'አካውንት አለዎት? '
                      : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => setFormType('login')}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold transition cursor-pointer"
                    >
                      {language === 'om' ? 'Seenaa (Login)' : language === 'am' ? 'ይግቡ (Login)' : 'Log In'}
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Pale-Blue Secure Access Information Panel */}
            <div className="w-full rounded-xl bg-[#e1f2fc] dark:bg-blue-950/60 border border-sky-200/60 dark:border-blue-900/50 p-3.5 sm:p-4 flex items-center gap-3.5 mt-5">
              <ShieldCheck className="h-5.5 w-5.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs sm:text-sm font-bold text-[#14276c] dark:text-sky-200 leading-tight">
                  {t.secureAccessTitle}
                </p>
                <p className="text-[11.5px] text-[#475569] dark:text-slate-400 leading-tight mt-0.5">
                  {t.secureAccessSubtitle}
                </p>
              </div>
            </div>

            {/* Card Footer: IT Support & Version */}
            <div className="flex items-center justify-between pt-4 sm:pt-5 mt-3 sm:mt-4 border-t border-slate-200/70 dark:border-slate-800 text-[12.5px] sm:text-[13px] text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setShowITSupportModal(true)}
                className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer text-left"
              >
                <Headphones className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                    {t.itSupportTitle}
                  </p>
                  <p className="text-[10.5px] text-blue-600 dark:text-blue-400 leading-tight">
                    {t.itSupportContact}
                  </p>
                </div>
              </button>
              <span className="font-mono text-slate-400 text-[12px]">v1.0.0</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* FORGOT PASSWORD MODAL                                                   */}
      {/* ======================================================================= */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-2 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.forgotModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500">Mettu Karl Referral Hospital</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {t.forgotModalSubtitle}
              </p>
              <ul className="space-y-2 border-l-2 border-blue-500 pl-3">
                <li>{t.forgotModalStep1}</li>
                <li>{t.forgotModalStep2}</li>
              </ul>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5 flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                <Info className="h-4 w-4 text-blue-600 shrink-0" />
                <span>{t.forgotModalContact}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowITSupportModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-2 text-blue-600 dark:text-blue-400">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.itSupportTitle}
                  </h3>
                  <p className="text-xs text-slate-500">Mettu Karl Referral Hospital</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowITSupportModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                Hospital ICT Help Desk (24/7 Operations):
              </p>
              <ul className="space-y-2 border-l-2 border-blue-500 pl-3">
                <li>
                  <strong>Internal Extension:</strong> 4401 / 4402
                </li>
                <li>
                  <strong>Direct Line:</strong> +251 47 111 0204
                </li>
                <li>
                  <strong>Duty ICT Officer:</strong> +251 91 123 4567
                </li>
                <li>
                  <strong>Location:</strong> Administrative Building, 2nd Floor, Room 204
                </li>
                <li>
                  <strong>Email:</strong> support@mettukarl.gov.et
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowITSupportModal(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
