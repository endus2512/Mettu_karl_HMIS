/**
 * Mettu Karl Referral Hospital — Dedicated Patient Portal Dashboard.
 *
 * User Request Refinements:
 * 1. Dedicated Patient Leftside Navigation (Sidebar):
 *    - Fully integrated Leftside Sidebar matching the hospital HIS workstation architecture.
 *    - Includes Hospital Logo, Patient Profile capsule, 5 interactive workstation items with
 *      responsive rectangular hover spotlights, language switcher, helpline, and touch logout.
 * 2. Spacious Rightside Main Workspace:
 *    - Generous widescreen layout with high contrast, soothing therapeutic healthcare palette.
 * 3. 5 Patient-Centered Modules:
 *    - To'annoo Dabaree OPD (Queue & Token)
 *    - Seenaa Yaalaa & Qorannoo (FHIR R4 Encounters, Vitals, Diagnoses)
 *    - Qoricha Koo & Faarmaasii (e-Prescriptions & FEFO Dispense Status)
 *    - Herrega & Kaffaltii Telebirr (CBHI 80% Subsidy & Instant Pay)
 *    - Yaala Fagoo & Beellama (Telemedicine Live Video & In-Person Follow-up)
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationBell } from '@/components/common/NotificationBell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getRolePortalPath } from '@/lib/roleRoutes';
import apiClient from '@/lib/api';
import {
  Ticket,
  FileText,
  Pill,
  CreditCard,
  Video,
  Building2,
  Calendar,
  Sun,
  Moon,
  CloudSun,
  LogOut,
  Phone,
  QrCode,
  Bell,
  Check,
  CheckCircle2,
  X,
  AlertTriangle,
  Fingerprint,
  ShieldCheck,
  MapPin,
  Tv,
  Compass,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Clock,
  User,
  HeartPulse,
  Plus,
  Printer,
  Edit2,
  RefreshCw,
  Send,
  Droplet,
  Sparkles,
} from 'lucide-react';

// Interface types
interface PatientProfile {
  id: number;
  mrn: string;
  fhir_id: string;
  full_name: string;
  phone_number: string;
  fayda_id: string;
  gender: string;
  birth_date: string;
  woreda: string;
  blood_group: string;
  allergies: string[];
  emergency_contact?: string;
  emergency_phone?: string;
  cbhi_active: boolean;
  cbhi_policy_number: string;
}

interface PatientEncounter {
  date: string;
  department: string;
  clinician: string;
  chief_complaint: string;
  vitals: {
    blood_pressure?: string;
    pulse?: string;
    temperature?: string;
    spo2?: string;
  };
  diagnosis: string;
  status: string;
}

interface PrescriptionItem {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string;
  is_dispensed: boolean;
}

interface PrescriptionResponse {
  prescription_code: string;
  prescribed_date: string;
  prescriber_name: string;
  status: string;
  items: PrescriptionItem[];
}

interface InvoiceItem {
  description: string;
  amount_etb: number;
}

interface InvoiceResponse {
  id: number;
  invoice_number: string;
  date: string;
  total_amount_etb: number;
  insurance_covered_etb: number;
  patient_payable_etb: number;
  status: string;
  items: InvoiceItem[];
}

interface QueueStatusResponse {
  has_active_token: boolean;
  token_number: string;
  department: string;
  current_serving_token: string;
  queue_position: number;
  estimated_wait_minutes: number;
  status: string;
}

interface AppointmentResponse {
  id: number;
  scheduled_time: string;
  clinician_name: string;
  department: string;
  type: string;
  meeting_link?: string | null;
  status: string;
}

export default function PatientPortalPage(): React.ReactElement {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();

  // Strict Authentication & RBAC Isolation Guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/patient-login');
        return;
      }
      // If a non-patient & non-admin staff stumbles upon /patient-portal, redirect them to their workstation
      if (user.role && user.role !== 'patient' && user.role !== 'admin' && user.role !== 'super_admin') {
        notifications.show({
          title: language === 'om' ? 'Wiirtuu Yaalaa' : language === 'am' ? 'የስራ ክፍል' : 'Staff Workstation',
          message:
            language === 'om'
              ? 'Akka ogeessa fayyaatti gara wiirtuu hojii keessaniitti qajeeltaniittu.'
              : 'Redirecting to your designated staff clinical workstation.',
          color: 'teal',
        });
        router.replace(getRolePortalPath(user.role));
      }
    }
  }, [authLoading, isAuthenticated, user, router, language]);

  // Active Tab: 'queue' | 'history' | 'prescriptions' | 'billing' | 'telemed'
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'prescriptions' | 'billing' | 'telemed'>('queue');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Calendar & Shift State for Header
  const [calendarDate, setCalendarDate] = useState('Tikimt 17, 2019 E.C. • Oct 27, 2026 G.C.');
  const [shiftName, setShiftName] = useState('Morning Shift (08:00–16:00)');
  const [shiftIcon, setShiftIcon] = useState<'morning' | 'afternoon' | 'night'>('morning');

  useEffect(() => {
    try {
      const savedDate = localStorage.getItem('mkh_header_date');
      if (savedDate) {
        const parsed = JSON.parse(savedDate);
        const eth = `${parsed.ethMonth || 'Tikimt'} ${parsed.ethDay || '17'}, ${parsed.ethYear || '2019'} E.C.`;
        const gcRaw = parsed.gcDate || '2026-10-27';
        const formattedGc = new Date(gcRaw).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        setCalendarDate(`${eth} • ${formattedGc} G.C.`);
        if (parsed.shiftName) setShiftName(parsed.shiftName);
        if (parsed.shiftIcon) setShiftIcon(parsed.shiftIcon);
      }
    } catch {
      // fallback to defaults
    }
  }, []);

  // Portal Data States
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [encounters, setEncounters] = useState<PatientEncounter[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Action Modals State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [healthCardModalOpen, setHealthCardModalOpen] = useState(false);
  const [bioEditModalOpen, setBioEditModalOpen] = useState(false);

  // Booking Form State
  const [bookingDept, setBookingDept] = useState('Cardiology Clinic');
  const [bookingDoctor, setBookingDoctor] = useState('Dr. Senait Bekele');
  const [bookingDate, setBookingDate] = useState('2026-11-14');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingType, setBookingType] = useState<'Telemedicine Video Call' | 'In-Person Consultation'>('Telemedicine Video Call');
  const [bookingNotes, setBookingNotes] = useState('');

  // Refill Form State
  const [refillDrug, setRefillDrug] = useState('');
  const [refillNotes, setRefillNotes] = useState('');

  // Queue Form State
  const [tokenDept, setTokenDept] = useState('OPD Internal Medicine');

  // Bio Edit Form State
  const [editPhone, setEditPhone] = useState('');
  const [editWoreda, setEditWoreda] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('O+');
  const [editAllergies, setEditAllergies] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');

  // Telebirr Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<InvoiceResponse | null>(null);
  const [telebirrPhone, setTelebirrPhone] = useState('+251 911 002 233');
  const [paymentStep, setPaymentStep] = useState<'prompt' | 'processing' | 'success'>('prompt');
  const [txId, setTxId] = useState('');

  // Telemedicine Video Call Modal State
  const [telemedModalOpen, setTelemedModalOpen] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<AppointmentResponse | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  // Spontaneous instantaneous logout
  const handleInstantLogout = () => {
    void logout();
    router.replace('/patient-login');
  };

  // Helper to persist current patient records in localStorage per unique patient key
  const persistRecords = useCallback(
    (
      newProfile?: PatientProfile,
      newEncounters?: PatientEncounter[],
      newPrescriptions?: PrescriptionResponse[],
      newInvoices?: InvoiceResponse[],
      newQueue?: QueueStatusResponse | null,
      newAppointments?: AppointmentResponse[],
    ) => {
      const p = newProfile || profile;
      const enc = newEncounters || encounters;
      const rx = newPrescriptions || prescriptions;
      const inv = newInvoices || invoices;
      const q = newQueue !== undefined ? newQueue : queueStatus;
      const apt = newAppointments || appointments;

      const recordsToSave = {
        profile: p,
        encounters: enc,
        prescriptions: rx,
        invoices: inv,
        queueStatus: q,
        appointments: apt,
      };

      if (typeof window !== 'undefined') {
        const key = p?.mrn || user?.mrn || user?.username || String(user?.id || 'guest');
        try {
          localStorage.setItem(`mkh_patient_records_${key}`, JSON.stringify(recordsToSave));
          if (p?.mrn) localStorage.setItem(`mkh_patient_records_${p.mrn}`, JSON.stringify(recordsToSave));
          if (user?.username) localStorage.setItem(`mkh_patient_records_${user.username}`, JSON.stringify(recordsToSave));
        } catch {
          // ignore storage quota error
        }
      }
    },
    [profile, encounters, prescriptions, invoices, queueStatus, appointments, user],
  );

  // Load patient data with strict per-patient partitioning
  const fetchPatientData = useCallback(async () => {
    setIsLoading(true);

    const patientKey = user?.mrn || user?.username || String(user?.id || 'guest');

    // 1. Check if patient already has dedicated persistent records in localStorage
    if (typeof window !== 'undefined') {
      const storedJson =
        localStorage.getItem(`mkh_patient_records_${patientKey}`) ||
        (user?.mrn ? localStorage.getItem(`mkh_patient_records_${user.mrn}`) : null) ||
        (user?.username ? localStorage.getItem(`mkh_patient_records_${user.username}`) : null);

      if (storedJson) {
        try {
          const parsed = JSON.parse(storedJson);
          if (parsed.profile) setProfile(parsed.profile);
          if (parsed.encounters) setEncounters(parsed.encounters);
          if (parsed.prescriptions) setPrescriptions(parsed.prescriptions);
          if (parsed.invoices) setInvoices(parsed.invoices);
          if (parsed.queueStatus) setQueueStatus(parsed.queueStatus);
          if (parsed.appointments) setAppointments(parsed.appointments);
          setIsLoading(false);
          return;
        } catch {
          // parse failed, fall through to creation
        }
      }
    }

    const isGudeta = Boolean(
      user?.username?.includes('gudeta') ||
      user?.faydaId?.includes('9901') ||
      user?.mrn?.includes('0001') ||
      user?.patientId === 1 ||
      user?.fullName?.toLowerCase().includes('gudeta')
    );

    const isChaltu = Boolean(
      user?.username?.includes('chaltu') ||
      user?.faydaId?.includes('7721') ||
      user?.mrn?.includes('0042') ||
      user?.patientId === 2 ||
      user?.fullName?.toLowerCase().includes('chaltu')
    );

    let registeredPatient: any = null;
    if (typeof window !== 'undefined') {
      try {
        const registeredList = JSON.parse(localStorage.getItem('mettu_his_registered_patients') || '[]');
        if (Array.isArray(registeredList)) {
          registeredPatient = registeredList.find(
            (p: any) =>
              p.id === user?.patientId ||
              p.id === user?.id ||
              p.username === user?.username ||
              p.phone_number === user?.phone ||
              (user?.fullName && p.full_name?.toLowerCase() === user.fullName.toLowerCase())
          ) || null;
        }
      } catch {
        // ignore
      }
    }

    let initialProfile: PatientProfile;
    let initialEncounters: PatientEncounter[];
    let initialPrescriptions: PrescriptionResponse[];
    let initialInvoices: InvoiceResponse[];
    let initialQueue: QueueStatusResponse;
    let initialAppointments: AppointmentResponse[];

    if (isChaltu) {
      initialProfile = {
        id: 2,
        mrn: user?.mrn || 'MKH-2026-0042',
        fhir_id: user?.fhirId || 'pat-mkrh-0042',
        full_name: 'Chaltu Daba Tolasa',
        phone_number: user?.phone || '+251 922 445 566',
        fayda_id: user?.faydaId || 'FAN-7721-9981-3310',
        gender: 'female',
        birth_date: '1992-08-20',
        woreda: 'Mettu Town, Kebele 04',
        blood_group: 'A+',
        allergies: ['Penicillin'],
        emergency_contact: 'Daba Tolasa (Abbaa)',
        emergency_phone: '+251 911 223 344',
        cbhi_active: true,
        cbhi_policy_number: 'CBHI-OR-MET-99104',
      };
      initialEncounters = [
        {
          date: '2026-10-24 10:15',
          department: 'Cardiology Clinic',
          clinician: 'Dr. Senait Bekele',
          chief_complaint: 'Routine hypertensive evaluation & follow-up',
          vitals: {
            blood_pressure: '128/82 mmHg',
            pulse: '72 bpm',
            temperature: '36.8 °C',
            spo2: '99%',
          },
          diagnosis: 'Essential Hypertension (ICD-10: I10) - Stable on Amlodipine',
          status: 'Completed',
        },
      ];
      initialPrescriptions = [
        {
          prescription_code: 'RX-2026-MKH-0640',
          prescribed_date: '2026-10-24',
          prescriber_name: 'Dr. Senait Bekele',
          status: 'Dispensed (Kenfameera)',
          items: [
            {
              drug_name: 'Amlodipine 5mg Tablet',
              dosage: '1 tablet',
              frequency: 'Once daily in morning (Ganama ganama)',
              duration_days: 30,
              instructions: "Dhiibbaa dhiigaa to'achuuf guyyaa hunda fudhadhaa",
              is_dispensed: true,
            },
            {
              drug_name: 'Paracetamol 500mg Tablet',
              dosage: '1 tablet',
              frequency: 'As needed (Yoo mataan dhibe)',
              duration_days: 5,
              instructions: 'Mataa dhukkubbii yoo qabaattan qofa fudhadhaa',
              is_dispensed: true,
            },
          ],
        },
      ];
      initialInvoices = [
        {
          id: 102,
          invoice_number: 'INV-2026-MKH-0084',
          date: '2026-10-24',
          total_amount_etb: 280.0,
          insurance_covered_etb: 224.0,
          patient_payable_etb: 56.0,
          status: 'PAID (Kaffalameera)',
          items: [
            { description: 'Cardiology Specialist Consultation', amount_etb: 150.0 },
            { description: 'ECG 12-Lead Diagnostic Tracing', amount_etb: 130.0 },
          ],
        },
      ];
      initialQueue = {
        has_active_token: true,
        token_number: 'B-015',
        department: 'Cardiology Clinic (Room 02)',
        current_serving_token: 'B-012',
        queue_position: 3,
        estimated_wait_minutes: 12,
        status: 'WAITING (Dabaree Eegaa Jira)',
      };
      initialAppointments = [
        {
          id: 502,
          scheduled_time: '2026-11-04 11:00 AM',
          clinician_name: 'Dr. Senait Bekele',
          department: 'Cardiology Clinic',
          type: 'Telemedicine Video Call',
          meeting_link: 'https://meet.mettukarl.gov.et/room/telemed-dr-senait-pat-0042',
          status: "CONFIRMED (Mirkanaa'eera)",
        },
      ];
    } else if (isGudeta) {
      initialProfile = {
        id: 1,
        mrn: user?.mrn || 'MKH-2026-0001',
        fhir_id: user?.fhirId || 'pat-mkrh-0001',
        full_name: 'Gudeta Hailu Tadesse',
        phone_number: user?.phone || '+251 911 002 233',
        fayda_id: user?.faydaId || 'FAN-9901-2384-5120',
        gender: 'male',
        birth_date: '1985-04-12',
        woreda: 'Mettu Town, Kebele 02',
        blood_group: 'O+',
        allergies: ['Penicillin', 'Sulfa'],
        emergency_contact: 'Hailu Tadesse (Abbaa)',
        emergency_phone: '+251 911 334 455',
        cbhi_active: true,
        cbhi_policy_number: 'CBHI-OR-MET-88902',
      };
      initialEncounters = [
        {
          date: '2026-10-25 09:30',
          department: 'Internal Medicine OPD',
          clinician: 'Dr. Bekele Tadesse',
          chief_complaint: 'Persistent dry cough and moderate fever for 3 days',
          vitals: {
            blood_pressure: '120/80 mmHg',
            pulse: '76 bpm',
            temperature: '37.4 °C',
            spo2: '98%',
          },
          diagnosis: 'Acute Bronchitis (ICD-10: J20.9) - Responding well to therapy',
          status: 'Completed',
        },
      ];
      initialPrescriptions = [
        {
          prescription_code: 'RX-2026-MKH-0881',
          prescribed_date: '2026-10-25',
          prescriber_name: 'Dr. Bekele Tadesse',
          status: 'Dispensed (Kenfameera)',
          items: [
            {
              drug_name: 'Amoxicillin + Clavulanic Acid 625mg',
              dosage: '1 tablet',
              frequency: "Twice daily (Sa'aatii 12'n)",
              duration_days: 7,
              instructions: "Nyaata booda bishaan ga'aa wajjin liqimsaa",
              is_dispensed: true,
            },
            {
              drug_name: 'Paracetamol 500mg Tablet',
              dosage: '1-2 tablets',
              frequency: "As needed for fever (Yoo ho'i dhufe)",
              duration_days: 5,
              instructions: "Ho'a ykn dhukkubbiif qofa fayyadamaa",
              is_dispensed: true,
            },
          ],
        },
      ];
      initialInvoices = [
        {
          id: 101,
          invoice_number: 'INV-2026-MKH-0192',
          date: '2026-10-25',
          total_amount_etb: 420.0,
          insurance_covered_etb: 336.0,
          patient_payable_etb: 84.0,
          status: 'PENDING_PAYMENT',
          items: [
            { description: 'OPD Senior Physician Consultation', amount_etb: 120.0 },
            { description: 'Laboratory CBC & CRP Diagnostic Panel', amount_etb: 180.0 },
            { description: 'Pharmacy Prescription Dispensing', amount_etb: 120.0 },
          ],
        },
      ];
      initialQueue = {
        has_active_token: true,
        token_number: 'A-042',
        department: 'OPD Internal Medicine (Room 04)',
        current_serving_token: 'A-038',
        queue_position: 4,
        estimated_wait_minutes: 18,
        status: 'WAITING (Dabaree Eegaa Jira)',
      };
      initialAppointments = [
        {
          id: 501,
          scheduled_time: '2026-10-29 10:00 AM',
          clinician_name: 'Dr. Bekele Tadesse',
          department: 'Internal Medicine Follow-up',
          type: 'Telemedicine Video Call',
          meeting_link: 'https://meet.mettukarl.gov.et/room/telemed-dr-bekele-pat-001',
          status: "CONFIRMED (Mirkanaa'eera)",
        },
      ];
    } else {
      // Newly registered or custom patient (e.g. Tolan)
      const customName = user?.fullName || registeredPatient?.full_name || (user?.username ? user.username.replace(/^pat_/, '') : 'Dhukkubsataa');
      const customMrn = user?.mrn || registeredPatient?.mrn || `MKH-2026-${user?.id || 1045}`;
      const customFhir = user?.fhirId || `pat-mkrh-${user?.id || 1045}`;
      const customFayda = user?.faydaId || registeredPatient?.fayda_id || `FAN-${user?.id || 1045}-2026`;
      const customPhone = user?.phone || registeredPatient?.phone_number || '+251 900 000 000';
      const customGender = ((registeredPatient?.gender === 'female' ? 'female' : 'male') as 'male' | 'female');
      const customBirthDate = registeredPatient?.birth_date || '1996-05-18';
      const customWoreda = registeredPatient?.birth_place || 'Mettu Town, Kebele 01';
      const customBloodGroup = registeredPatient?.blood_group || 'O+';
      const customAllergies = registeredPatient?.allergies
        ? (Array.isArray(registeredPatient.allergies) ? registeredPatient.allergies : registeredPatient.allergies.split(','))
        : ['No Known Drug Allergies (NKDA)'];
      const customEmergencyContact = registeredPatient?.emergency_contact || 'Maatii / Emergency Contact';
      const customEmergencyPhone = registeredPatient?.emergency_phone || customPhone;
      const customCbhi = registeredPatient?.cbhi_policy_number || `CBHI-OR-MET-${user?.id || 1045}`;

      initialProfile = {
        id: user?.id || user?.patientId || 1045,
        mrn: customMrn,
        fhir_id: customFhir,
        full_name: customName,
        phone_number: customPhone,
        fayda_id: customFayda,
        gender: customGender,
        birth_date: customBirthDate,
        woreda: customWoreda,
        blood_group: customBloodGroup,
        allergies: customAllergies,
        emergency_contact: customEmergencyContact,
        emergency_phone: customEmergencyPhone,
        cbhi_active: true,
        cbhi_policy_number: customCbhi,
      };

      initialEncounters = [
        {
          date: new Date().toISOString().slice(0, 10) + ' 08:30',
          department: 'Triage & General OPD',
          clinician: 'Dr. Gemechu Desta',
          chief_complaint: 'Galmee dhukkubsataa haaraa fi qorannoo fayyaa duraa (Initial enrollment & clinical intake)',
          vitals: {
            blood_pressure: '118/76 mmHg',
            pulse: '72 bpm',
            temperature: '36.6 °C',
            spo2: '99%',
          },
          diagnosis: 'General Health Assessment (ICD-10: Z00.00) - Ragaan yaalaa haarawa qophaa\'eera',
          status: 'Completed',
        },
      ];

      initialPrescriptions = [];

      initialInvoices = [
        {
          id: (user?.id || 1045) + 500,
          invoice_number: `INV-2026-MKH-${user?.id || 1045}`,
          date: new Date().toISOString().slice(0, 10),
          total_amount_etb: 50.0,
          insurance_covered_etb: 50.0,
          patient_payable_etb: 0.0,
          status: 'PAID (Kaffalameera)',
          items: [
            { description: 'Kaardii Galmee Fayyaa & Fayda Digital Integration', amount_etb: 50.0 },
          ],
        },
      ];

      const tokenId = (user?.id ? user.id % 40 : 10) + 1;
      initialQueue = {
        has_active_token: true,
        token_number: `C-0${tokenId < 10 ? '0' + tokenId : tokenId}`,
        department: 'Reception & Registration (Desk 01)',
        current_serving_token: 'C-005',
        queue_position: 1,
        estimated_wait_minutes: 5,
        status: 'WAITING (Dabaree Eegaa Jira)',
      };

      initialAppointments = [
        {
          id: (user?.id || 1045) + 700,
          scheduled_time: 'Boru 09:30 AM',
          clinician_name: 'Dr. Gemechu Desta',
          department: 'OPD General Consultation',
          type: 'In-Person Consultation',
          meeting_link: '',
          status: "CONFIRMED (Mirkanaa'eera)",
        },
      ];
    }

    setProfile(initialProfile);
    setEncounters(initialEncounters);
    setPrescriptions(initialPrescriptions);
    setInvoices(initialInvoices);
    setQueueStatus(initialQueue);
    setAppointments(initialAppointments);

    // Persist this newly initialized record immediately to this patient's storage key
    if (typeof window !== 'undefined') {
      const recordsToSave = {
        profile: initialProfile,
        encounters: initialEncounters,
        prescriptions: initialPrescriptions,
        invoices: initialInvoices,
        queueStatus: initialQueue,
        appointments: initialAppointments,
      };
      try {
        localStorage.setItem(`mkh_patient_records_${patientKey}`, JSON.stringify(recordsToSave));
        if (initialProfile.mrn) localStorage.setItem(`mkh_patient_records_${initialProfile.mrn}`, JSON.stringify(recordsToSave));
        if (user?.username) localStorage.setItem(`mkh_patient_records_${user.username}`, JSON.stringify(recordsToSave));
      } catch {
        // ignore
      }
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchPatientData();
  }, [fetchPatientData]);

  // Handle Booking New Appointment
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newApt: AppointmentResponse = {
      id: Date.now(),
      scheduled_time: `${bookingDate} ${bookingTime}`,
      clinician_name: bookingDoctor,
      department: bookingDept,
      type: bookingType,
      meeting_link:
        bookingType === 'Telemedicine Video Call'
          ? `https://meet.mettukarl.gov.et/room/telemed-${Math.floor(1000 + Math.random() * 9000)}`
          : null,
      status: "CONFIRMED (Mirkanaa'eera)",
    };
    const updated = [newApt, ...appointments];
    setAppointments(updated);
    persistRecords(undefined, undefined, undefined, undefined, undefined, updated);
    setBookingModalOpen(false);
    notifications.show({
      title: language === 'om' ? "Beellamni Qabameera!" : language === 'am' ? 'ቀጠሮ ተይዟል!' : 'Appointment Confirmed!',
      message:
        language === 'om'
          ? `Beellamni ${bookingDept} - ${bookingDoctor} wajjin ${bookingDate}tti qophaa'eera.`
          : `Appointment booked with ${bookingDoctor} for ${bookingDate}.`,
      color: 'teal',
    });
  };

  // Handle Cancel Appointment
  const handleCancelAppointment = (id: number) => {
    const updated = appointments.filter((a) => a.id !== id);
    setAppointments(updated);
    persistRecords(undefined, undefined, undefined, undefined, undefined, updated);
    notifications.show({
      title: language === 'om' ? 'Beellamni Haqameera' : 'Appointment Cancelled',
      message: language === 'om' ? "Beellamni keessan haquun milkaa'eera." : 'Appointment has been cancelled.',
      color: 'amber',
    });
  };

  // Handle Request Prescription Refill
  const handleRequestRefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillDrug.trim()) return;
    const newRx: PrescriptionResponse = {
      prescription_code: `RX-${new Date().getFullYear()}-REF-${Math.floor(1000 + Math.random() * 9000)}`,
      prescribed_date: new Date().toISOString().slice(0, 10),
      prescriber_name: 'Dr. Gemechu Desta (OPD Attending)',
      status: 'Refill Requested (Haaromsuun Gaafatameera)',
      items: [
        {
          drug_name: refillDrug.trim(),
          dosage: 'Standard Dosage',
          frequency: 'As Prescribed',
          duration_days: 30,
          instructions: refillNotes.trim() || 'Haaromsa qoricha duraanii (Refill requested by patient)',
          is_dispensed: false,
        },
      ],
    };
    const updated = [newRx, ...prescriptions];
    setPrescriptions(updated);
    persistRecords(undefined, undefined, updated);
    setRefillDrug('');
    setRefillNotes('');
    setRefillModalOpen(false);
    notifications.show({
      title: language === 'om' ? "Gaaffiin Qorichaa Ergameera!" : "Refill Requested!",
      message: language === 'om' ? "Gaaffiin haaromsa qorichaa gara faarmaasiitti ergameera." : "Prescription refill request submitted to hospital pharmacy.",
      color: 'teal',
    });
  };

  // Handle Request Live Queue Ticket
  const handleRequestToken = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNum = Math.floor(10 + Math.random() * 40);
    const tokenPrefix = tokenDept.includes('Cardiology') ? 'B' : tokenDept.includes('Pediatrics') ? 'P' : 'A';
    const newToken: QueueStatusResponse = {
      has_active_token: true,
      token_number: `${tokenPrefix}-0${nextNum}`,
      department: tokenDept,
      current_serving_token: `${tokenPrefix}-0${Math.max(1, nextNum - 3)}`,
      queue_position: 3,
      estimated_wait_minutes: 12,
      status: 'WAITING (Dabaree Eegaa Jira)',
    };
    setQueueStatus(newToken);
    persistRecords(undefined, undefined, undefined, undefined, newToken);
    setTokenModalOpen(false);
    notifications.show({
      title: language === 'om' ? "Dabareen Haaraa Kennameera!" : "New Token Issued!",
      message: language === 'om' ? `Token ${newToken.token_number} - ${tokenDept} kenneera.` : `Token ${newToken.token_number} generated for ${tokenDept}.`,
      color: 'teal',
    });
  };

  // Handle Cancel Token
  const handleCancelToken = () => {
    const resetToken: QueueStatusResponse = {
      has_active_token: false,
      token_number: '---',
      department: 'No Active Queue',
      current_serving_token: '---',
      queue_position: 0,
      estimated_wait_minutes: 0,
      status: 'COMPLETED (Dabareen Hin Jiru)',
    };
    setQueueStatus(resetToken);
    persistRecords(undefined, undefined, undefined, undefined, resetToken);
    notifications.show({
      title: language === 'om' ? 'Dabareen Haqameera' : 'Token Cancelled',
      message: language === 'om' ? 'Dabareen keessan dhiifameera.' : 'Queue ticket released.',
      color: 'amber',
    });
  };

  // Handle Open Bio Editor
  const handleOpenBioEdit = () => {
    if (profile) {
      setEditPhone(profile.phone_number);
      setEditWoreda(profile.woreda);
      setEditBloodGroup(profile.blood_group);
      setEditAllergies(profile.allergies.join(', '));
      setEditEmergencyContact(profile.emergency_contact || '');
      setEditEmergencyPhone(profile.emergency_phone || '');
    }
    setBioEditModalOpen(true);
  };

  // Handle Save Bio
  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updatedProfile: PatientProfile = {
      ...profile,
      phone_number: editPhone.trim() || profile.phone_number,
      woreda: editWoreda.trim() || profile.woreda,
      blood_group: editBloodGroup || profile.blood_group,
      allergies: editAllergies.trim() ? editAllergies.split(',').map((s) => s.trim()).filter(Boolean) : profile.allergies,
      emergency_contact: editEmergencyContact.trim() || profile.emergency_contact,
      emergency_phone: editEmergencyPhone.trim() || profile.emergency_phone,
    };
    setProfile(updatedProfile);
    persistRecords(updatedProfile);
    setBioEditModalOpen(false);
    notifications.show({
      title: language === 'om' ? "Odeeffannoon Haaromfameera!" : "Demographics Updated!",
      message: language === 'om' ? "Ragaan dhuunfaa keessanii milkaa'inaan haaromfameera." : "Patient profile and biography updated.",
      color: 'teal',
    });
  };

  // Handle Telebirr instant payment simulation
  const handleOpenPayment = (inv: InvoiceResponse) => {
    setPayingInvoice(inv);
    setTelebirrPhone(profile?.phone_number || '+251 911 002 233');
    setPaymentStep('prompt');
    setPayModalOpen(true);
  };

  const executeTelebirrPayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      const generatedTx = `TB-${Math.floor(100000000 + Math.random() * 900000000)}`;
      setTxId(generatedTx);
      setPaymentStep('success');

      // Update invoice locally and persist
      if (payingInvoice) {
        const updatedInvoices = invoices.map((i) =>
          i.id === payingInvoice.id ? { ...i, status: 'PAID (Kaffalameera)' } : i
        );
        setInvoices(updatedInvoices);
        persistRecords(undefined, undefined, undefined, updatedInvoices);
      }
      notifications.show({
        title: language === 'om' ? "Kaffaltiin Telebirr Milkaa'eera!" : language === 'am' ? 'የቴሌብር ክፍያ ተሳክቷል!' : 'Telebirr Payment Successful!',
        message: language === 'om' ? `Nagaheen herregaa #${payingInvoice?.invoice_number} qophaa'eera.` : `Digital receipt #${payingInvoice?.invoice_number} generated successfully.`,
        color: 'teal',
      });
    }, 1200);
  };

  return (
    <ProtectedRoute allowedRoles={['patient', 'super_admin']} moduleName="Patient Portal" category="clinical">
      <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden">
        {/* =========================================================================
            1. DEDICATED PATIENT LEFTSIDE NAVIGATION (SIDEBAR - DESKTOP & MOBILE DRAWER)
            ========================================================================= */}
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 lg:w-80 shrink-0 border-r border-[#1b2334] bg-[#0b0f17] flex-col h-screen sticky top-0 shadow-2xl select-none z-30">
          {/* Sidebar Top: Hospital Brand */}
          <div className="h-18 flex items-center gap-3 border-b border-[#1b2334] px-4 py-3 bg-[#0e131f] shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/20 border border-amber-300 text-xl shrink-0">
              MK
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                {t('hospital_name')}
              </h2>
              <span className="inline-block rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.2 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
                {t('patient_portal')}
              </span>
            </div>
          </div>

          {/* Sidebar Patient Profile Capsule */}
          <div className="p-3.5 border-b border-[#1b2334] bg-[#0e131f]/60 shrink-0">
            <div className="rounded-2xl border border-[#222b3d] bg-[#131824] p-3 shadow-md space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 font-bold text-sm shadow-xs border border-amber-500/30">
                  {profile?.blood_group || 'O+'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    {profile?.full_name || user?.fullName || user?.username || 'Dhukkubsataa'}
                  </p>
                  <p className="text-[11px] font-mono font-medium text-amber-400 truncate">
                    MRN: {profile?.mrn || user?.mrn || 'MKH-2026-REG'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#1b2334] text-[10px] font-medium">
                <span className="text-slate-400 font-mono">{profile?.fayda_id || user?.faydaId || 'FAN-REG-2026'}</span>
                <span className="bg-[#102419] text-[#34d399] border border-[#059669]/40 px-1.5 py-0.5 rounded font-semibold">
                  CBHI 80%
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Items (5 Workstations with Executive Gold Rounded Active State) */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language === 'am' ? 'የታካሚ አገልግሎቶች' : language === 'en' ? 'Patient Workstations' : 'Kutaalee Yaalaa'}
            </p>

            {/* Item 1: Queue */}
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                activeTab === 'queue'
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                  : 'border-[#222b3d] bg-[#101624] text-slate-300 hover:border-amber-500/40 hover:bg-[#151c2e] hover:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Ticket className={`h-4 w-4 shrink-0 ${activeTab === 'queue' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate text-xs sm:text-sm">{t('queue_tracking')}</span>
              </div>
              {queueStatus?.has_active_token && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shrink-0">
                  {queueStatus.token_number}
                </span>
              )}
            </button>

            {/* Item 2: Medical History */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                activeTab === 'history'
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                  : 'border-[#222b3d] bg-[#101624] text-slate-300 hover:border-amber-500/40 hover:bg-[#151c2e] hover:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className={`h-4 w-4 shrink-0 ${activeTab === 'history' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate text-xs sm:text-sm">{t('medical_history')}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                activeTab === 'history' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {encounters.length}
              </span>
            </button>

            {/* Item 3: Prescriptions */}
            <button
              type="button"
              onClick={() => setActiveTab('prescriptions')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                activeTab === 'prescriptions'
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                  : 'border-[#222b3d] bg-[#101624] text-slate-300 hover:border-amber-500/40 hover:bg-[#151c2e] hover:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Pill className={`h-4 w-4 shrink-0 ${activeTab === 'prescriptions' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate text-xs sm:text-sm">{t('my_prescriptions')}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                activeTab === 'prescriptions' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {prescriptions.length}
              </span>
            </button>

            {/* Item 4: Billing & Telebirr */}
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                activeTab === 'billing'
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                  : 'border-[#222b3d] bg-[#101624] text-slate-300 hover:border-amber-500/40 hover:bg-[#151c2e] hover:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CreditCard className={`h-4 w-4 shrink-0 ${activeTab === 'billing' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate text-xs sm:text-sm">{t('billing_telebirr')}</span>
              </div>
              {invoices.some((i) => i.status.includes('PENDING')) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shrink-0 animate-pulse">
                  Pay
                </span>
              )}
            </button>

            {/* Item 5: Telemedicine */}
            <button
              type="button"
              onClick={() => setActiveTab('telemed')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                activeTab === 'telemed'
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                  : 'border-[#222b3d] bg-[#101624] text-slate-300 hover:border-amber-500/40 hover:bg-[#151c2e] hover:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Video className={`h-4 w-4 shrink-0 ${activeTab === 'telemed' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate text-xs sm:text-sm">{t('telemedicine_tab')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#102419] text-[#34d399] border border-[#059669]/40 shrink-0">
                Live
              </span>
            </button>
          </nav>

          {/* Sidebar Footer: Helpline */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-900/80 shrink-0">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-center">
              <span className="inline-flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <Phone className="h-3 w-3 text-teal-400" />
                <span>{language === 'am' ? 'የእርዳታ መስመር' : language === 'en' ? 'Help Desk' : 'Deeggarsa'}</span>
              </span>
              <span className="text-xs font-black text-teal-400 font-mono">907 / 047-111-2233</span>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Drawer (Slide-out) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-950 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Top Header with Close Button */}
          <div className="h-16 flex items-center justify-between border-b border-slate-800 px-4 bg-slate-900/95 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xl"></span>
              <span className="text-xs font-black text-white">{t('patient_portal')}</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Profile Capsule */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/40 shrink-0">
            <div className="rounded-2xl border-2 border-slate-800 bg-slate-900/90 p-3 shadow-md space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-black text-sm shadow-xs border border-teal-400/30">
                  {profile?.blood_group || 'O+'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-black text-white truncate">
                    {profile?.full_name || user?.fullName || user?.username || 'Dhukkubsataa'}
                  </p>
                  <p className="text-[11px] font-mono font-bold text-teal-400 truncate">
                    MRN: {profile?.mrn || user?.mrn || 'MKH-2026-REG'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Nav Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-2">
            <button
              type="button"
              onClick={() => { setActiveTab('queue'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'queue' ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30' : 'border-[#222b3d] bg-[#101624] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ticket className={`h-4 w-4 ${activeTab === 'queue' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">{t('queue_tracking')}</span>
              </div>
              {queueStatus?.has_active_token && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  {queueStatus.token_number}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'history' ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30' : 'border-[#222b3d] bg-[#101624] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className={`h-4 w-4 ${activeTab === 'history' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">{t('medical_history')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                {encounters.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('prescriptions'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'prescriptions' ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30' : 'border-[#222b3d] bg-[#101624] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Pill className={`h-4 w-4 ${activeTab === 'prescriptions' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">{t('my_prescriptions')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                {prescriptions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('billing'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'billing' ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30' : 'border-[#222b3d] bg-[#101624] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className={`h-4 w-4 ${activeTab === 'billing' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">{t('billing_telebirr')}</span>
              </div>
              {invoices.some((i) => i.status.includes('PENDING')) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">Pay</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('telemed'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                activeTab === 'telemed' ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30' : 'border-[#222b3d] bg-[#101624] text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Video className={`h-4 w-4 ${activeTab === 'telemed' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">{t('telemedicine_tab')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#102419] text-[#34d399] border border-[#059669]/40">Live</span>
            </button>
          </nav>

          {/* Drawer Helpline */}
          <div className="p-3.5 border-t border-[#1b2334] bg-[#0e131f] shrink-0">
            <div className="rounded-xl border border-[#222b3d] bg-[#0b0f17] p-2 text-center">
              <span className="block text-[10px] uppercase font-bold text-amber-400">
                <Phone className="h-3.5 w-3.5 text-amber-400 inline mr-1" /> 907 / 047-111-2233
              </span>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            2. MAIN WORKSPACE (RIGHT SIDE: WIDE & BREATHABLE)
            ========================================================================= */}
        <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 pb-20 lg:pb-0">
          {/* Main Top Header Bar - Midnight Obsidian with Integrated Calendar & Shift Cockpit */}
          <header className="sticky top-0 z-20 border-b border-[#1b2334] bg-[#0b0f17] text-white px-3 sm:px-6 py-3 shadow-xl flex items-center justify-between gap-2.5 select-none w-full">
            {/* Header Left: Hamburger for mobile + Active Workstation Title */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl bg-[#141b29] text-amber-400 hover:text-white border border-[#222b3d] active:scale-95 transition-all shadow-sm shrink-0 touch-manipulation cursor-pointer"
                title="Toggle Patient Menu"
                aria-label="Toggle Patient Menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <span className="text-xl sm:text-2xl drop-shadow-sm shrink-0">
                {activeTab === 'queue' && <Ticket className='h-5 w-5 text-amber-400 shrink-0' />}
                {activeTab === 'history' && <FileText className='h-5 w-5 text-amber-400 shrink-0' />}
                {activeTab === 'prescriptions' && <Pill className='h-5 w-5 text-amber-400 shrink-0' />}
                {activeTab === 'billing' && <CreditCard className='h-5 w-5 text-amber-400 shrink-0' />}
                {activeTab === 'telemed' && <Video className='h-5 w-5 text-amber-400 shrink-0' />}
              </span>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight truncate">
                  {activeTab === 'queue' && t('queue_tracking')}
                  {activeTab === 'history' && t('medical_history')}
                  {activeTab === 'prescriptions' && t('my_prescriptions')}
                  {activeTab === 'billing' && t('billing_telebirr')}
                  {activeTab === 'telemed' && t('telemedicine_tab')}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium uppercase tracking-wider truncate">
                  {t('hospital_name')} • {language === 'am' ? 'የታካሚ ክፍል' : language === 'en' ? 'Patient Portal' : 'Kutaa Dhukkubsataa'}
                </p>
              </div>
            </div>

            {/* Header Center: Calendar, Morning Shift & FHIR Cockpit */}
            <div className="hidden lg:flex items-center gap-2 mx-auto shrink-0">
              {/* 1. Calendar (Kalandarii) */}
              <div className="flex items-center gap-1.5 rounded-xl bg-[#101624] border border-[#222b3d] px-2.5 py-1 text-xs font-medium text-slate-300 shadow-xs">
                <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-slate-200 tracking-tight">{calendarDate}</span>
              </div>

              {/* 2. Morning Shift (Dabaree Ganamaa) */}
              <div className="flex items-center gap-1.5 rounded-xl bg-[#101624] border border-[#222b3d] px-2.5 py-1 text-xs font-medium text-amber-300 shadow-xs">
                <span className="text-sm">{shiftIcon}</span>
                <span className="text-amber-300 tracking-tight">{shiftName}</span>
              </div>

              {/* 3. FHIR Status Pill */}
              <div className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-[#059669]/40 bg-[#102419] px-2.5 py-1 text-[11px] font-semibold text-[#34d399]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>FHIR R4</span>
              </div>
            </div>

            {/* Header Right: Notifications, Language Selector & Bold Red Logout Button */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 ml-auto shrink-0">
              {/* Notification Bell with Live Reactions */}
              <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-0.5 shadow-xs shrink-0">
                <NotificationBell variant="dark" />
              </div>

              {/* Language Selector */}
              <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-0.5 shadow-xs shrink-0">
                <LanguageSelect variant="dark" />
              </div>

              {/* Single Interchangeable Light/Dark Theme Toggle Button */}
              <ThemeToggle variant="cockpit" />

              {/* Logout Button: Bold, clearly situated on the far right */}
              <button
                type="button"
                onClick={handleInstantLogout}
                title={language === 'om' ? "Poortaalii Dhukkubsataa Keessaa Ba'i (Logout)" : language === 'am' ? 'ከታካሚ ፖርታል ውጣ' : 'Sign out of Patient Portal'}
                className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-600 hover:border-rose-400 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:text-white transition-all duration-150 shadow-sm shadow-rose-950/50 hover:shadow-rose-600/30 active:scale-95 cursor-pointer select-none touch-manipulation shrink-0"
                aria-label="Logout"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-400 group-hover:text-white transition-transform duration-150 group-hover:scale-110 shrink-0" />
                <span className="hidden sm:inline font-bold tracking-wide">
                  {language === 'om' ? "Ba'i" : language === 'am' ? 'ውጣ' : 'Logout'}
                </span>
              </button>
            </div>
          </header>

          {/* Strict Clinical Confidentiality & Privacy Enforcement Barrier */}
          <div className="mx-3 sm:mx-6 lg:mx-10 mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/60 border-2 border-emerald-500/40 text-xs flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  {language === 'om' ? 'Eenyummaan Dhukkubsataa Cufaa Dha (Confidential Patient Session)' : 'Protected Patient Healthcare Session (ISO 27799 / HIPAA)'}
                </span>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5 truncate">
                  {language === 'om'
                    ? `Poortaaliin kun ${profile?.full_name || user?.fullName || 'Dhukkubsataa'} (MRN: ${profile?.mrn || user?.mrn || 'MKH-2026-REG'}) qofaaf qoodameera. Ragaan keessan dhukkubsataa biraatiin akka hin ilaalamne guutummaatti cufameera.`
                    : `Private healthcare session locked exclusively to ${profile?.full_name || user?.fullName || 'Patient Member'} (MRN: ${profile?.mrn || user?.mrn || 'MKH-2026-REG'}). Unauthorized cross-patient access is strictly blocked.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setHealthCardModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{language === 'om' ? 'Kaardii Digital' : 'Digital ID Card'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenBioEdit}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>{language === 'om' ? 'Odeeffannoo Haaromsi' : 'Edit Demographics'}</span>
              </button>
            </div>
          </div>

          {/* Patient Safety & Demographic Strip */}
          <section className="border-b border-teal-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/90 py-3.5 px-6 sm:px-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Fayda ID Card */}
              <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-slate-700 hover:ring-2 hover:ring-teal-400/20 transition-all duration-150 select-none">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Fingerprint className="h-3.5 w-3.5 text-emerald-400 inline mr-1" /> {t('fayda_id')}
                </span>
                <span className="text-xs font-mono font-bold text-teal-800 dark:text-teal-300">
                  {profile?.fayda_id || user?.faydaId || 'FAN-REG-2026'}
                </span>
              </div>

              {/* CBHI Subsidy */}
              <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/40 p-3 shadow-xs hover:border-emerald-500 hover:ring-2 hover:ring-emerald-400/30 transition-all duration-150 select-none">
                <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-400 inline mr-1" /> {t('cbhi_insurance')}
                </span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active (80% {language === 'am' ? 'የተሸፈነ' : language === 'en' ? 'Covered' : 'Uwwifame'})
                </span>
              </div>

              {/* Allergies Warning */}
              <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 p-3 shadow-xs hover:border-amber-500 hover:ring-2 hover:ring-amber-400/30 transition-all duration-150 select-none">
                <span className="block text-[10px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 inline mr-1" /> {t('allergies')}
                </span>
                <span className="text-xs font-black text-rose-700 dark:text-rose-400 mt-0.5 block">
                  {profile?.allergies.join(', ') || 'No Known Drug Allergies (NKDA)'}
                </span>
              </div>

              {/* Woreda Location */}
              <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-slate-700 hover:ring-2 hover:ring-teal-400/20 transition-all duration-150 select-none">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5 text-sky-400 inline mr-1" /> {t('residence')}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                  {profile?.woreda || 'Mettu Town, Kebele 01'}
                </span>
              </div>
            </div>
          </section>

          {/* Main Content Workspace */}
          <main className="p-6 sm:p-8 lg:p-10 flex-1">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
                  <p className="text-xs font-bold text-teal-800">Ragaan Yaala Keessanii Fe&apos;amaa Jira...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Non-Smartphone USSD & SMS Info Strip */}
                <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-emerald-950/30 p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mb-6">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="h-5 w-5 text-teal-400" />
                    <div>
                      <span className="font-black text-emerald-950 dark:text-emerald-200 block">
                        {language === 'om' ? 'Bilbila Duudaa (Feature Phone) qabduu? Interneetii malee hordofaa!' : 'Using a standard mobile phone? Track without internet!'}
                      </span>
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                        {language === 'om' ? (
                          <>Bilbila keessan irraa <strong className="font-mono text-emerald-950 dark:text-emerald-200 bg-emerald-200/70 dark:bg-emerald-900/60 px-1 rounded">*907#</strong> bilbiluun dabaree OPD, qoricha, fi herrega Telebirr hordofaa.</>
                        ) : (
                          <>Dial <strong className="font-mono text-emerald-950 dark:text-emerald-200 bg-emerald-200/70 dark:bg-emerald-900/60 px-1 rounded">*907#</strong> from any phone to track your OPD queue token, prescriptions, and Telebirr bills.</>
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-xl bg-emerald-600 text-white font-mono font-black text-xs px-3 py-1 shadow-2xs">
                    USSD: *907#
                  </span>
                </div>

                {/* TAB 1: LIVE OPD QUEUE & TOKEN */}
                {activeTab === 'queue' && (
                  <div className="space-y-6">
                    {/* Calming Alert Banner with Responsive Rectangular Hover */}
                    <div className="rounded-3xl border-2 border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/80 dark:from-amber-950/40 dark:via-slate-900/90 dark:to-amber-950/30 p-5 sm:p-6 shadow-sm hover:border-amber-500 hover:ring-4 hover:ring-amber-400/20 transition-all duration-150 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border-2 border-amber-400 dark:border-amber-600 text-2xl text-amber-700 dark:text-amber-300">
                          
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 px-3 py-0.5 text-[11px] font-black text-amber-900 dark:text-amber-200 mb-1">
                            Dabareen Keessan Dhihaateera!
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            Token Lakkoofsa <span className="text-teal-700 dark:text-teal-400 font-mono">{queueStatus?.token_number}</span>
                          </h2>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {queueStatus?.department} • Please proceed to consultation room.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border-2 border-teal-200 dark:border-teal-700/60 bg-teal-50/80 dark:bg-teal-950/40 px-6 py-3 text-center shadow-xs">
                        <span className="block text-[11px] uppercase font-bold text-teal-800 dark:text-teal-300">{t('estimated_wait')}</span>
                        <span className="text-2xl font-black text-teal-900 dark:text-teal-200">~{queueStatus?.estimated_wait_minutes} {language === 'am' ? 'ደቂቃ' : language === 'en' ? 'Mins' : 'Daqiiqaa'}</span>
                        <span className="block text-[10px] text-teal-700 dark:text-teal-300 font-medium">
                          {language === 'am' ? `${queueStatus?.queue_position} ሰዎች ከእርስዎ በፊት አሉ` : language === 'en' ? `${queueStatus?.queue_position} patients ahead of you` : `Namoota ${queueStatus?.queue_position} isin dura jiru`}
                        </span>
                      </div>
                    </div>

                    {/* Visual TV Display Simulation */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-teal-500 hover:ring-2 hover:ring-teal-400/20 transition-all duration-150 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                              <Tv className="h-4 w-4 text-teal-400 inline mr-1.5" /> {t('queue_tracking')} (Live Screen)
                            </h3>
                            <p className="text-xs text-slate-500">{t('hospital_name')} • OPD Block B</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                              Live Sync
                            </span>
                            <button
                              type="button"
                              onClick={() => setTokenModalOpen(true)}
                              className="rounded-xl border-2 border-teal-600 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 text-xs font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>{language === 'om' ? 'Dabaree Haaraa' : 'Take Ticket'}</span>
                            </button>
                            {queueStatus?.has_active_token && (
                              <button
                                type="button"
                                onClick={handleCancelToken}
                                className="rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>{language === 'om' ? 'Dhiisi' : 'Cancel'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Currently Serving in Responsive Rectangle */}
                          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-center hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/20 transition-all duration-150">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                              {t('serving_now')}
                            </span>
                            <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-wider">
                              {queueStatus?.current_serving_token}
                            </span>
                            <span className="block text-xs text-teal-800 mt-2 font-bold">
                              {queueStatus?.department || 'OPD Consultation Room'}
                            </span>
                          </div>

                          {/* Patient's Token in Responsive Rectangle */}
                          <div className="rounded-2xl border-2 border-teal-300 bg-teal-50/80 p-5 text-center hover:border-teal-600 hover:ring-4 hover:ring-teal-400/30 transition-all duration-150">
                            <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block mb-1">
                              {t('your_token')}
                            </span>
                            <span className="text-4xl sm:text-5xl font-black text-teal-700 font-mono tracking-wider">
                              {queueStatus?.token_number}
                            </span>
                            <span className="block text-xs text-teal-900 mt-2 font-black">
                              {language === 'am' ? `ተራ #${queueStatus?.queue_position}ኛ` : language === 'en' ? `Queue Position #${queueStatus?.queue_position}` : `Dabaree #${queueStatus?.queue_position}ffaa`}
                            </span>
                          </div>
                        </div>

                        {/* Journey Progress Bar */}
                        <div>
                          <div className="flex justify-between text-xs text-slate-600 mb-2 font-bold">
                            <span>1. Reception & Triage</span>
                            <span className="text-teal-700">2. Vitals (Completed)</span>
                            <span className="text-amber-700">3. Waiting Room (Active)</span>
                            <span className="text-slate-400">4. Doctor Consultation</span>
                          </div>
                          <div className="h-3.5 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden p-0.5">
                            <div className="h-full bg-gradient-to-r from-teal-500 via-teal-600 to-amber-500 w-3/4 rounded-full transition-all duration-500" />
                          </div>
                        </div>
                      </div>

                      {/* Clinic Directions with Responsive Rectangle Form */}
                      <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-teal-500 hover:ring-2 hover:ring-teal-400/20 transition-all duration-150 space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Compass className="h-4 w-4 text-teal-400 inline mr-1.5" /> Clinic & Room Navigation Guide
                        </h3>
                        <div className="space-y-3 text-xs text-slate-700">
                          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="rounded-lg bg-teal-600 text-white font-black p-1 text-xs">01</span>
                            <p>Proceed to OPD Building B, 1st Floor, Room 04.</p>
                          </div>
                          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="rounded-lg bg-teal-600 text-white font-black p-1 text-xs">02</span>
                            <p>Yeroo maqaan keessan wamamu waraqaa ragaa ykn koodii token agarsiisaa.</p>
                          </div>
                          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="rounded-lg bg-teal-600 text-white font-black p-1 text-xs">03</span>
                            <p>When laboratory tests or medications are prescribed, your Telebirr digital bill is ready instantly.</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/80 p-3.5 text-xs text-teal-900">
                          <Phone className="h-4 w-4 text-teal-400 inline mr-1.5" /> <span className="font-bold">Deeggarsa Barbaadduu?</span> Bakka simannaatti (Triage Desk) deemaa ykn bilbila 907 irratti deeggarsa gaafadhaa.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MEDICAL HISTORY & CLINICAL ENCOUNTERS */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">{t('medical_history')}</h2>
                        <p className="text-xs text-slate-500">
                          Ragaalee yaala duraanii, qorannoo doktooraa fi dhukkuba mirkanaa&apos;e (FHIR R4 Encounters)
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHealthCardModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 text-xs font-black text-teal-800 transition active:scale-95 cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5 text-teal-700" />
                          <span>{language === 'om' ? 'Kaardii EHR & QR' : 'Digital ID Card'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenBioEdit}
                          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition active:scale-95 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>{language === 'om' ? 'Haaromsi' : 'Edit'}</span>
                        </button>
                        <span className="rounded-xl border-2 border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 font-mono">
                          FHIR-ID: {profile?.fhir_id}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {encounters.map((enc, idx) => (
                        <div
                          key={idx}
                          className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-teal-500 hover:ring-2 hover:ring-teal-400/20 hover:shadow-md transition-all duration-150 space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-teal-700">
                                {enc.department}
                              </span>
                              <h3 className="text-lg font-black text-slate-900">{enc.clinician}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-slate-500">
                                <Calendar className="h-3.5 w-3.5 text-teal-500" />
                                <span>{enc.date}</span>
                              </span>
                              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-0.5 text-[11px] font-bold">
                                {enc.status}
                              </span>
                            </div>
                          </div>

                          {/* Complaint & Diagnosis with Responsive Rectangular Hover */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 hover:border-teal-400 hover:bg-white transition-all duration-150">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                {t('complaint')}
                              </span>
                              <p className="text-slate-800 font-medium leading-relaxed">{enc.chief_complaint}</p>
                            </div>

                            <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/60 p-4 hover:border-teal-500 hover:bg-teal-50/90 transition-all duration-150">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-teal-800 mb-1">
                                {t('diagnosis')}
                              </span>
                              <p className="text-teal-950 font-black leading-relaxed">{enc.diagnosis}</p>
                            </div>
                          </div>

                          {/* Vitals Grid with Responsive Rectangles */}
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                              {t('vitals')}
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                                <span className="block text-[10px] text-slate-500 font-semibold">Dhiibbaa Dhiigaa (BP)</span>
                                <span className="text-sm font-black text-slate-900">{enc.vitals.blood_pressure}</span>
                              </div>
                              <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                                <span className="block text-[10px] text-slate-500 font-semibold">Rukuttaa Onnee (Pulse)</span>
                                <span className="text-sm font-black text-slate-900">{enc.vitals.pulse}</span>
                              </div>
                              <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                                <span className="block text-[10px] text-slate-500 font-semibold">Ho&apos;a Qaamaa (Temp)</span>
                                <span className="text-sm font-black text-amber-700">{enc.vitals.temperature}</span>
                              </div>
                              <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                                <span className="block text-[10px] text-slate-500 font-semibold">Oksijiinii (SpO2)</span>
                                <span className="text-sm font-black text-emerald-700">{enc.vitals.spo2}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: PRESCRIPTIONS & PHARMACY */}
                {activeTab === 'prescriptions' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">{t('my_prescriptions')}</h2>
                        <p className="text-xs text-slate-500">
                          Verified e-Prescriptions and instructions for take-home medications
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRefillModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-teal-600 bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs font-black text-white shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{language === 'om' ? 'Qoricha Haaromsuu Gaafadhu' : 'Request Refill'}</span>
                        </button>
                        <span className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                          FEFO Dispensed
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {prescriptions.length === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 text-center space-y-3">
                          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                            <Pill className="h-6 w-6" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                            {language === 'om' ? 'Qorichi Yeroo Ammaa Ajajame Hin Jiru' : language === 'am' ? 'በአሁኑ ጊዜ የታዘዘ መድኃኒት የለም' : 'No Active Prescriptions'}
                          </h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            {language === 'om'
                              ? 'Qorichi doktarri keessan isiniif ajaju asirratti dhiyaata. FEFO fayyadamuun koodii fi qajeelfama fudhannaa qorichaa asirraa argattu.'
                              : 'Prescriptions issued by your attending physician will appear here once verified and authorized.'}
                          </p>
                        </div>
                      ) : (
                        prescriptions.map((rx, idx) => (
                          <div
                            key={idx}
                            className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-teal-500 hover:ring-2 hover:ring-teal-400/20 hover:shadow-md transition-all duration-150 space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <span className="text-xs font-mono font-bold text-teal-700">{rx.prescription_code}</span>
                                <h3 className="text-sm font-bold text-slate-800">Ajaje: {rx.prescriber_name}</h3>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 font-medium">Guyyaa: {rx.prescribed_date}</span>
                                <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold">
                                  {rx.status}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {rx.items.map((item, i) => (
                                <div
                                  key={i}
                                  className="rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-400 hover:bg-white hover:ring-2 hover:ring-teal-400/20 transition-all duration-150"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Pill className="h-5 w-5 text-teal-400" />
                                      <h4 className="text-sm font-black text-slate-900">{item.drug_name}</h4>
                                    </div>
                                    <p className="text-xs text-teal-800 font-bold">
                                      Dose: {item.dosage} • {item.frequency} • Guyyoota {item.duration_days}f
                                    </p>
                                    <p className="text-xs text-slate-600 italic">
                                      {t('instructions')}: &quot;{item.instructions}&quot;
                                    </p>
                                  </div>

                                  <div className="shrink-0">
                                    {item.is_dispensed ? (
                                      <span className="rounded-xl border-2 border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-900 flex items-center gap-1.5">
                                        <Check className="h-3.5 w-3.5 text-emerald-400 inline mr-1" /> {t('dispensed')}
                                      </span>
                                    ) : (
                                      <span className="rounded-xl border-2 border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">
                                        {t('pending')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: BILLING & TELEBIRR PAYMENTS */}
                {activeTab === 'billing' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">{t('billing_telebirr')}</h2>
                        <p className="text-xs text-slate-500">
                          Community-Based Health Insurance (CBHI 80% covered) and Telebirr digital payments
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-xl border-2 border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-900">
                          Telebirr Ready
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {invoices.length === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 text-center space-y-3">
                          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                            <Check className="h-6 w-6" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                            {language === 'om' ? 'Kaffaltiin Eegamu Hin Jiru' : language === 'am' ? 'ምንም የሚከፈል ሂሳብ የለም' : 'All Dues Cleared'}
                          </h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            {language === 'om'
                              ? 'Herregni kaffaltii yeroo ammaa guutummaatti qulqullaa\'aa dha. Kaffaltiin tajaajila haaraa yoo uumame asirratti isiniif mul\'ata.'
                              : 'All medical and pharmacy invoices are fully settled. Any new invoices will appear here.'}
                          </p>
                        </div>
                      ) : (
                        invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-teal-500 hover:ring-2 hover:ring-teal-400/20 hover:shadow-md transition-all duration-150 space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <span className="text-xs font-mono font-bold text-teal-700">{inv.invoice_number}</span>
                                <p className="text-xs text-slate-500">Guyyaa: {inv.date}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-black ${
                                    inv.status.includes('PAID')
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                                {!inv.status.includes('PAID') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPayment(inv)}
                                    className="rounded-xl border-2 border-teal-600 bg-teal-600 hover:bg-teal-700 hover:border-teal-700 hover:ring-4 hover:ring-teal-400/30 px-4 py-2 text-xs font-black text-white shadow-md active:scale-95 transition-all duration-150 cursor-pointer"
                                  >
                                    {t('telebirr_pay')} →
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-2 text-xs">
                              {inv.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-slate-700 py-1.5 border-b border-slate-100">
                                  <span>{it.description}</span>
                                  <span className="font-mono font-bold text-slate-900">{it.amount_etb.toFixed(2)} ETB</span>
                                </div>
                              ))}
                            </div>

                            {/* Totals with Clear CBHI Government Subsidy Breakdown */}
                            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="block text-slate-500 text-[10px] uppercase font-bold">{t('total_bill')}</span>
                                <span className="text-base font-black text-slate-900 font-mono">{inv.total_amount_etb.toFixed(2)} ETB</span>
                              </div>
                              <div>
                                <span className="block text-emerald-700 text-[10px] uppercase font-bold">{t('cbhi_subsidy')}</span>
                                <span className="text-base font-black text-emerald-700 font-mono">-{inv.insurance_covered_etb.toFixed(2)} ETB</span>
                              </div>
                              <div className="border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-200">
                                <span className="block text-amber-800 text-[10px] uppercase font-bold">{t('patient_copay')}</span>
                                <span className="text-lg font-black text-amber-900 font-mono">{inv.patient_payable_etb.toFixed(2)} ETB</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: TELEMEDICINE & APPOINTMENTS */}
                {activeTab === 'telemed' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">{t('telemedicine_tab')}</h2>
                        <p className="text-xs text-slate-500">
                          Live video telemedicine consultations with your physician and appointment booking
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookingModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-teal-600 bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-black text-white shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{language === 'om' ? 'Beellama Haaraa Qabadhu' : 'Book Appointment'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {appointments.length === 0 ? (
                        <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 text-center space-y-3">
                          <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto border border-teal-500/20">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                            {language === 'om' ? 'Beellamni Qophaa\'e Hin Jiru' : language === 'am' ? 'ምንም የተቀጠረ ቀጠሮ የለም' : 'No Scheduled Appointments'}
                          </h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            {language === 'om'
                              ? 'Beellamni yaala kallattiin ykn yaala fagootti (Telemedicine) qabattan asirratti dhiyaata.'
                              : 'Upcoming in-person or telemedicine video appointments will appear here.'}
                          </p>
                        </div>
                      ) : (
                        appointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-teal-500 hover:ring-2 hover:ring-teal-400/20 hover:shadow-md transition-all duration-150 space-y-4 flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="rounded-full bg-teal-100 text-teal-900 border border-teal-300 px-3 py-1 text-xs font-black">
                                  {apt.type}
                                </span>
                                <span className="text-xs font-mono font-bold text-amber-800">
                                  ⏰ {apt.scheduled_time}
                                </span>
                              </div>

                              <h3 className="text-lg font-black text-slate-900">{apt.department}</h3>
                              <p className="text-xs text-slate-600 font-medium">Doktoora: <span className="text-slate-900 font-bold">{apt.clinician_name}</span></p>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-center justify-between">
                                <div>Status: <span className="text-teal-800 font-black">{apt.status}</span></div>
                                <button
                                  type="button"
                                  onClick={() => handleCancelAppointment(apt.id)}
                                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                >
                                  {language === 'om' ? 'Haqi' : 'Cancel'}
                                </button>
                              </div>
                            </div>

                            {apt.meeting_link && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMeeting(apt);
                                  setTelemedModalOpen(true);
                                }}
                                className="w-full rounded-xl border-2 border-teal-600 bg-teal-600 hover:bg-teal-700 hover:border-teal-700 hover:ring-4 hover:ring-teal-400/30 py-3 text-xs font-black text-white shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all duration-150 cursor-pointer"
                              >
                                <Video className="h-4 w-4 inline mr-1" /> {t('join_video_call')} →
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* =========================================================================
            3. TELEBIRR INSTANT PAYMENT MODAL
            ========================================================================= */}
        {payModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border-2 border-teal-500 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-6 w-6 text-teal-400" />
                  <h3 className="text-lg font-black text-slate-900">Telebirr Instant Payment</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {paymentStep === 'prompt' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Invoice:</span>
                      <span className="font-mono font-bold text-slate-900">{payingInvoice?.invoice_number}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Payment Gateway:</span>
                      <span className="text-slate-900 font-bold">{t('hospital_name')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2 text-sm font-bold">
                      <span className="text-slate-900">{language === 'am' ? 'የሚከፈል መጠን:' : language === 'en' ? 'Amount to Pay:' : 'Gatiin Kaffalamu:'}</span>
                      <span className="text-teal-700 font-mono text-base font-black">
                        {payingInvoice?.patient_payable_etb.toFixed(2)} ETB
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {language === 'am' ? 'የቴሌብር ስልክ ቁጥር' : language === 'en' ? 'Telebirr Phone Number' : 'Lakkoofsa Bilbila Telebirr'}
                    </label>
                    <input
                      type="text"
                      value={telebirrPhone}
                      onChange={(e) => setTelebirrPhone(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-400/20"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={executeTelebirrPayment}
                    className="w-full rounded-xl border-2 border-teal-600 bg-teal-600 hover:bg-teal-700 hover:ring-4 hover:ring-teal-400/30 py-3 text-sm font-black text-white shadow-md active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    {language === 'am' ? 'ክፍያውን ጀምር (*127# USSD Push) →' : language === 'en' ? 'Initiate Payment (*127# USSD Push) →' : 'Kaffaltii Eegali (*127# USSD Push) →'}
                  </button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-8 text-center space-y-4">
                  <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
                  <p className="text-sm font-bold text-teal-800">
                    Telebirr wajjin wal qunnamaa jira...
                  </p>
                  <p className="text-xs text-slate-500">
                    Bilbila keessan irratti PIN telebirr galchaa mirkaneessaa.
                  </p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-4 text-center space-y-4">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-3xl border-2 border-emerald-500">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{language === 'am' ? 'ክፍያው ተጠናቋል!' : language === 'en' ? 'Payment Successful!' : 'Kaffaltiin Milkaa\'eera!'}</h4>
                    <p className="text-xs text-slate-500 mt-1">Transaction ID: <span className="font-mono text-teal-800 font-bold">{txId}</span></p>
                    <p className="text-xs text-slate-600 mt-2">
                      Your digital receipt has been generated and dispatched to the hospital pharmacy and laboratory.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPayModalOpen(false)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-800"
                  >
                    {language === 'am' ? 'ዝጋ (Close)' : language === 'en' ? 'Close' : 'Cufi (Close)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            4. TELEMEDICINE VIDEO MODAL
            ========================================================================= */}
        {telemedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl rounded-3xl border-2 border-teal-500 bg-white p-6 shadow-2xl space-y-4 text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Video className="h-6 w-6 text-teal-400" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {t('telemedicine_tab')} (Live Consult)
                    </h3>
                    <p className="text-xs text-teal-700 font-semibold">
                      Doktoora: {activeMeeting?.clinician_name} • {activeMeeting?.department}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTelemedModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Video Frame */}
              <div className="relative aspect-video w-full rounded-2xl bg-slate-900 border-2 border-slate-300 overflow-hidden flex items-center justify-center text-white">
                {camOff ? (
                  <div className="text-center text-slate-400">
                    <Video className="h-12 w-12 text-teal-400 mx-auto mb-2" />
                    <p className="text-xs">Kaameraan Cufameera (Camera Off)</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="h-24 w-24 mx-auto rounded-full bg-teal-500/30 border-2 border-teal-400 flex items-center justify-center text-3xl mb-3 animate-pulse">
                      
                    </div>
                    <p className="text-sm font-bold text-white">{activeMeeting?.clinician_name}</p>
                    <p className="text-xs text-emerald-300 font-semibold">Audio/Video Connected • Encrypted WebRTC</p>
                  </div>
                )}

                {/* Self View Floating Box */}
                <div className="absolute bottom-4 right-4 h-28 w-40 rounded-xl bg-slate-800/95 border-2 border-slate-600 p-2 flex flex-col justify-between shadow-lg">
                  <span className="text-[10px] text-teal-300 font-bold">Patient (You)</span>
                  <div className="text-center text-xs text-slate-300">{profile?.full_name}</div>
                  <div className="flex justify-end gap-1 text-[10px]">
                    {micMuted && <MicOff className="h-3.5 w-3.5 text-rose-400 inline ml-1" />}
                    {camOff && <VideoOff className="h-3.5 w-3.5 text-rose-400 inline ml-1" />}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setMicMuted(!micMuted)}
                  className={`rounded-xl p-3 font-bold border-2 transition-all cursor-pointer ${
                    micMuted ? 'bg-rose-600 border-rose-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={micMuted ? 'Unmute' : 'Mute'}
                >
                  {micMuted ? <MicOff className='h-4 w-4' /> : <Mic className='h-4 w-4' />}
                </button>

                <button
                  type="button"
                  onClick={() => setCamOff(!camOff)}
                  className={`rounded-xl p-3 font-bold border-2 transition-all cursor-pointer ${
                    camOff ? 'bg-rose-600 border-rose-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={camOff ? 'Turn Cam On' : 'Turn Cam Off'}
                >
                  {camOff ? <VideoOff className='h-4 w-4' /> : <Video className='h-4 w-4' />}
                </button>

                <button
                  type="button"
                  onClick={() => setTelemedModalOpen(false)}
                  className="rounded-xl border-2 border-rose-600 bg-rose-600 hover:bg-rose-700 px-6 py-3 text-xs font-black text-white shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'am' ? 'ውይይት ጨርስ' : language === 'en' ? 'End Call' : 'Yaala Xumuri (End Call)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. APPOINTMENT BOOKING MODAL
            ========================================================================= */}
        {bookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl border-2 border-teal-500 bg-white p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-teal-600" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {language === 'om' ? 'Beellama Yaalaa Qabadhu' : language === 'am' ? 'የህክምና ቀጠሮ ይያዙ' : 'Book Clinical Appointment'}
                    </h3>
                    <p className="text-xs text-slate-500">Mettu Karl Referral Hospital • OPD & Telemed</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'om' ? 'Kutaa Yaalaa (Department / Specialty)' : 'Department / Specialty'}
                  </label>
                  <select
                    value={bookingDept}
                    onChange={(e) => setBookingDept(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="OPD Internal Medicine (Room 04)">OPD Internal Medicine (Room 04)</option>
                    <option value="Cardiology Clinic (Room 12)">Cardiology Clinic (Room 12)</option>
                    <option value="Pediatrics Clinic (Room 08)">Pediatrics Clinic (Room 08)</option>
                    <option value="General Surgery Clinic (Room 02)">General Surgery Clinic (Room 02)</option>
                    <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
                    <option value="Ophthalmology (Eye Clinic)">Ophthalmology (Eye Clinic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'om' ? 'Ogeessa Yaalaa (Attending Physician)' : 'Attending Physician'}
                  </label>
                  <select
                    value={bookingDoctor}
                    onChange={(e) => setBookingDoctor(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="Dr. Gemechu Desta">Dr. Gemechu Desta (Senior Internist)</option>
                    <option value="Dr. Bekele Tadesse">Dr. Bekele Tadesse (Cardiologist)</option>
                    <option value="Dr. Chala Merga">Dr. Chala Merga (Pediatrician)</option>
                    <option value="Dr. Hawi Tolera">Dr. Hawi Tolera (Surgeon)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'om' ? 'Guyyaa (Date)' : 'Appointment Date'}
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'om' ? 'Sa\'aatii (Time Slot)' : 'Time Slot'}
                    </label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:45 AM">11:45 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'om' ? 'Gosa Yaalaa (Consultation Mode)' : 'Consultation Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingType('In-Person Consultation')}
                      className={`p-3 rounded-xl border-2 text-xs font-black text-left transition cursor-pointer ${
                        bookingType === 'In-Person Consultation'
                          ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-400/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <Building2 className="h-4 w-4 mb-1 text-teal-600" />
                      <div>Kallattiin (In-Person)</div>
                      <span className="text-[10px] font-normal text-slate-500">Hospital OPD Campus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('Telemedicine Video Call')}
                      className={`p-3 rounded-xl border-2 text-xs font-black text-left transition cursor-pointer ${
                        bookingType === 'Telemedicine Video Call'
                          ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-400/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <Video className="h-4 w-4 mb-1 text-teal-600" />
                      <div>Yaala Fagoo (Video Call)</div>
                      <span className="text-[10px] font-normal text-slate-500">Encrypted WebRTC Consult</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {language === 'om' ? 'Dhiisi' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-black rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md active:scale-95 transition cursor-pointer"
                  >
                    {language === 'om' ? 'Mirkaneessi & Qabadhu' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            6. PRESCRIPTION REFILL REQUEST MODAL
            ========================================================================= */}
        {refillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border-2 border-teal-500 bg-white p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Pill className="h-6 w-6 text-teal-600" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {language === 'om' ? 'Qoricha Haaromsuu Gaafadhu' : language === 'am' ? 'መድኃኒት ማደስ ይጠይቁ' : 'Request Prescription Refill'}
                    </h3>
                    <p className="text-xs text-slate-500">Mettu Karl Outpatient Pharmacy • FEFO Verified</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRefillModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRequestRefill} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'om' ? 'Maqaa Qorichaa (Medication Name & Strength)' : 'Medication Name & Strength'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="fkn. Amoxicillin 500mg, Metformin 500mg..."
                    value={refillDrug}
                    onChange={(e) => setRefillDrug(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                  {/* Quick Pill presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Amoxicillin 500mg', 'Paracetamol 1000mg', 'Omeprazole 20mg', 'Metformin 500mg', 'Ciprofloxacin 500mg'].map((drug) => (
                      <button
                        key={drug}
                        type="button"
                        onClick={() => setRefillDrug(drug)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer"
                      >
                        + {drug}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'om' ? 'Sababa / Yaada Doktooraaf (Reason / Instructions)' : 'Reason / Notes for Pharmacist'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Qorichi duraan kenname dhumateera, itti fufiinsaan ajajame..."
                    value={refillNotes}
                    onChange={(e) => setRefillNotes(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-tight">
                    Gaaffiin keessan ogeessa faarmaasii fi doktooraan erga sakatta&apos;amee booda Telebirriin herregamee qophaa&apos;a.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRefillModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {language === 'om' ? 'Dhiisi' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-black rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md active:scale-95 transition cursor-pointer"
                  >
                    {language === 'om' ? 'Gaaffii Ergi' : 'Submit Refill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            7. LIVE QUEUE TICKET MODAL
            ========================================================================= */}
        {tokenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl border-2 border-teal-500 bg-white p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="h-6 w-6 text-teal-600" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {language === 'om' ? 'Dabaree Haaraa Fudhadhu' : language === 'am' ? 'አዲስ የተራ ቁጥር ይውሰዱ' : 'Take Live Queue Ticket'}
                    </h3>
                    <p className="text-xs text-slate-500">Mettu Karl Automated Triage & Queue System</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTokenModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRequestToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'om' ? 'Kutaa Dabaree Barbaaddan (Clinic / Station)' : 'Select Clinic / Station'}
                  </label>
                  <select
                    value={tokenDept}
                    onChange={(e) => setTokenDept(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="OPD Internal Medicine (Room 04)">OPD Internal Medicine (Room 04)</option>
                    <option value="Pediatrics Clinic (Room 08)">Pediatrics Clinic (Room 08)</option>
                    <option value="Cardiology OPD (Room 12)">Cardiology OPD (Room 12)</option>
                    <option value="Triage & Emergency Station">Triage & Emergency Station</option>
                    <option value="Hospital Pharmacy & Dispensing">Hospital Pharmacy & Dispensing</option>
                    <option value="Diagnostic Laboratory Desk">Diagnostic Laboratory Desk</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-teal-900">
                    <span>{language === 'om' ? 'Tilmaama Yeroo Eegumsaa:' : 'Estimated Wait:'}</span>
                    <span className="font-mono text-teal-800 font-black">~10 - 15 Daqiiqaa</span>
                  </div>
                  <div className="flex justify-between text-teal-800">
                    <span>{language === 'om' ? 'Namoota Fuuldura Keessan:' : 'Patients in Queue:'}</span>
                    <span className="font-mono font-bold">3 Patients</span>
                  </div>
                  <p className="text-[10px] text-teal-700 pt-1 border-t border-teal-200">
                    Koodiin dabaree keessanii iskiriinii TV hospitaala irratti fi bilbila keessan irratti battalumatti ni calaqqisa.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTokenModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {language === 'om' ? 'Dhiisi' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-black rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md active:scale-95 transition cursor-pointer"
                  >
                    {language === 'om' ? 'Token Fudhadhu' : 'Generate Token'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            8. OFFICIAL DIGITAL PATIENT HEALTH CARD & QR MODAL
            ========================================================================= */}
        {healthCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl border-2 border-teal-500 bg-white p-6 shadow-2xl space-y-5 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-teal-600" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {language === 'om' ? 'Waraqaa Ragaa Fayyaa Dhukkubsataa' : language === 'am' ? 'የታካሚ የህክምና መታወቂያ ካርድ' : 'Official Patient Healthcare ID Card'}
                    </h3>
                    <p className="text-[11px] text-teal-800 font-bold">FDRE Ministry of Health • Mettu Karl Comprehensive Specialized Hospital</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHealthCardModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Card Container */}
              <div id="patient-health-card-print" className="rounded-2xl border-2 border-teal-700 bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white p-5 shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-start justify-between border-b border-teal-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
                      MK
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Mettu Karl Referral Hospital
                      </h4>
                      <p className="text-[10px] text-slate-300">National Health ID • FHIR R4 Connected</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-800/80 border border-teal-500/50 text-[10px] font-black uppercase text-teal-200 font-mono">
                    {profile?.blood_group || 'O+'}
                  </span>
                </div>

                {/* Patient Profile Content */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="col-span-2 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Maqaa Guutuu (Full Name)</span>
                      <p className="text-sm font-black text-white">{profile?.full_name || user?.fullName || 'Dhukkubsataa'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">MRN ID</span>
                        <p className="font-mono font-bold text-amber-300">{profile?.mrn || 'MKH-2026-REG'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Fayda ID</span>
                        <p className="font-mono font-bold text-teal-300">{profile?.fayda_id || 'FAN-REG-2026'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Saala / Gender</span>
                        <p className="capitalize font-bold text-slate-200">{profile?.gender || 'Male'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Guyyaa Dhalootaa</span>
                        <p className="font-mono font-bold text-slate-200">{profile?.birth_date || '1996-05-18'}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">CBHI Policy (80% Covered)</span>
                      <p className="font-mono font-bold text-emerald-400">{profile?.cbhi_policy_number || 'CBHI-OR-MET-2026'}</p>
                    </div>
                  </div>

                  {/* QR Code Stamp */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white text-slate-900 border-2 border-teal-400 shadow-md">
                    <QrCode className="h-20 w-20 text-slate-900" />
                    <span className="text-[8px] font-mono font-black mt-1 text-slate-700">SCAN AT CLINIC</span>
                  </div>
                </div>

                {/* Footer Warnings */}
                <div className="pt-2 border-t border-teal-800/60 flex items-center justify-between text-[10px] text-slate-300">
                  <div className="flex items-center gap-1 text-rose-300 font-bold">
                    <AlertTriangle className="h-3 w-3 inline text-amber-400" />
                    <span>Allergies: {profile?.allergies.join(', ') || 'NKDA'}</span>
                  </div>
                  <span className="font-mono text-slate-400">Emergency: {profile?.emergency_phone || profile?.phone_number}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  {language === 'om' ? 'Kaardiin kun kutaa hundatti fudhatama qaba.' : 'Recognized across all hospital wards & labs.'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') window.print();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>{language === 'om' ? 'Maxxansi (Print)' : 'Print Card'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHealthCardModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {language === 'om' ? 'Cufi' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            9. PATIENT BIOGRAPHY & DEMOGRAPHICS EDITOR MODAL
            ========================================================================= */}
        {bioEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl border-2 border-teal-500 bg-white p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-6 w-6 text-teal-600" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {language === 'om' ? 'Odeeffannoo Dhukkubsataa Haaromsi' : language === 'am' ? 'የታካሚ መረጃን ያድሱ' : 'Edit Patient Demographics'}
                    </h3>
                    <p className="text-xs text-slate-500">Update contact, address, allergies & emergency contact</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBioEditModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBio} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'om' ? 'Lakkoofsa Bilbilaa' : 'Phone Number'}
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'om' ? 'Gosa Dhiigaa (Blood Group)' : 'Blood Group'}
                    </label>
                    <select
                      value={editBloodGroup}
                      onChange={(e) => setEditBloodGroup(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                    >
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                      <option value="O-">O-</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'om' ? 'Iddoo Jireenyaa (Woreda / Kebele)' : 'Residence Address / Woreda'}
                  </label>
                  <input
                    type="text"
                    value={editWoreda}
                    onChange={(e) => setEditWoreda(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'om' ? 'Dhibee / Alarjii Qorichaa (Allergies)' : 'Known Drug Allergies (comma-separated)'}
                  </label>
                  <input
                    type="text"
                    value={editAllergies}
                    onChange={(e) => setEditAllergies(e.target.value)}
                    placeholder="Penicillin, Sulfa, Aspirin..."
                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'om' ? 'Nama Balaa Yeroo Qunnamu (Contact Name)' : 'Emergency Contact Name'}
                    </label>
                    <input
                      type="text"
                      value={editEmergencyContact}
                      onChange={(e) => setEditEmergencyContact(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'om' ? 'Bilbila Balaa (Emergency Phone)' : 'Emergency Phone'}
                    </label>
                    <input
                      type="text"
                      value={editEmergencyPhone}
                      onChange={(e) => setEditEmergencyPhone(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBioEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {language === 'om' ? 'Dhiisi' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-black rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md active:scale-95 transition cursor-pointer"
                  >
                    {language === 'om' ? 'Olkaayi (Save Profile)' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Mobile Bottom Tab Navigation Bar for Patients */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'queue' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="h-4 w-4 text-teal-300 shrink-0" />
            <span>{language === 'am' ? 'ተራ' : language === 'en' ? 'Queue' : 'Dabaree'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'history' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4 text-teal-300 shrink-0" />
            <span>{language === 'am' ? 'ታሪክ' : language === 'en' ? 'History' : 'Seenaa'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prescriptions')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'prescriptions' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pill className="h-4 w-4 text-teal-300 shrink-0" />
            <span>{language === 'am' ? 'መድኃኒት' : language === 'en' ? 'Rx' : 'Qoricha'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'billing' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="h-4 w-4 text-teal-300 shrink-0" />
            <span>{language === 'am' ? 'ክፍያ' : language === 'en' ? 'Pay' : 'Kaffaltii'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemed')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'telemed' ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="h-4 w-4 text-teal-300 shrink-0" />
            <span>{language === 'am' ? 'ቴሌሜድ' : language === 'en' ? 'Telemed' : 'Telemed'}</span>
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
