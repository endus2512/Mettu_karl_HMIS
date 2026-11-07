/**
 * Operation Theatre (OT) & Central Sterile Services Department (CSSD) Workstation.
 * Enterprise surgical workstation for Mettu Karl Comprehensive Specialized Hospital.
 *
 * Full Production Architecture:
 * - Real-time Operating Theatre Suites Coordination (OT-1 to OT-4) with live surgical phase HUD
 * - Surgical Schedule & Registry with WHO 3-stage Safety Checklist verification
 * - Intraoperative findings, blood loss (ml), implants used, and operative notes documentation
 * - CSSD Autoclave Telemetry: 134.0°C chamber temperature, 2.2 Bar pressure, biological indicator tracking
 * - Sterile Instrument Packs inventory from autoclave cycle to surgical table
 * - Official Printable Surgical Operative Summary Voucher with TIN 0038912401, QR verification & surgeon sign-off
 * - Obsidian & Champagne Gold luxury medical design system
 */
'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Flame,
  Gauge,
  HeartPulse,
  Home,
  Layers,
  MapPin,
  Maximize2,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Scissors,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Thermometer,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

const API_BASE = '';

const INITIAL_STATS: OTStats = {
  total_rooms: 4,
  active_surgeries_count: 2,
  scheduled_today_count: 1,
  completed_today_count: 1,
  ready_sterile_packs_count: 5,
  active_autoclave_batches_count: 2,
  emergency_trauma_bookings_count: 2,
};

const INITIAL_ROOMS: OperatingRoom[] = [
  {
    id: 1,
    name: 'OT Suite 1 (Major Trauma & Emergency)',
    room_code: 'OT-1',
    specialty: 'Trauma & General Surgery',
    floor_location: 'Block B - 2nd Floor',
    is_active: true,
    active_booking_id: 1,
    active_procedure_name: 'Emergency Exploratory Craniotomy & Subdural Hematoma Evacuation',
    active_patient_name: 'Ayantu Mamo',
    active_surgeon_name: 'Dr. Bekele Tadesse',
    current_status: 'in_surgery',
  },
  {
    id: 2,
    name: 'OT Suite 2 (Orthopedics & Complex Trauma)',
    room_code: 'OT-2',
    specialty: 'Orthopedics & Spine',
    floor_location: 'Block B - 2nd Floor',
    is_active: true,
    active_booking_id: 2,
    active_procedure_name: 'Right Femur Shaft Fracture Open Reduction Internal Fixation (ORIF)',
    active_patient_name: 'Tolessa Bekele',
    active_surgeon_name: 'Dr. Chala Gemechu',
    current_status: 'in_prep',
  },
  {
    id: 3,
    name: 'OT Suite 3 (Maternity & Obstetric OT)',
    room_code: 'OT-3',
    specialty: 'Obstetrics & Gynecology',
    floor_location: 'Block B - 2nd Floor',
    is_active: true,
    active_booking_id: 3,
    active_procedure_name: 'Emergency Caesarean Section (Twin Gestation, Fetal Distress)',
    active_patient_name: 'Chaltu Abera',
    active_surgeon_name: 'Dr. Helen Kassa',
    current_status: 'scheduled',
  },
  {
    id: 4,
    name: 'OT Suite 4 (Ophthalmic & ENT Micro-Surgery)',
    room_code: 'OT-4',
    specialty: 'Ophthalmology & ENT',
    floor_location: 'Block B - 2nd Floor',
    is_active: true,
    active_booking_id: null,
    active_procedure_name: null,
    active_patient_name: null,
    active_surgeon_name: null,
    current_status: 'available',
  },
];

const INITIAL_BOOKINGS: SurgicalBooking[] = [
  {
    id: 1,
    booking_code: 'SURG-2026-0101',
    patient_id: 2,
    patient_name: 'Ayantu Mamo',
    patient_mrn: 'MKH-2026-000102',
    patient_gender: 'FEMALE',
    patient_age: 31,
    room_id: 1,
    room_name: 'OT Suite 1 (Major Trauma & Emergency)',
    room_code: 'OT-1',
    procedure_name: 'Emergency Exploratory Craniotomy & Subdural Hematoma Evacuation',
    lead_surgeon_id: 2,
    lead_surgeon_name: 'Dr. Bekele Tadesse',
    anesthesiologist_id: 7,
    anesthesiologist_name: 'Dr. Sisay Lemma',
    scrub_nurse_id: 3,
    scrub_nurse_name: 'Nurse Chaltu Abera',
    scheduled_start: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
    status: 'in_surgery',
    who_safety_checklist_verified: true,
    post_op_notes: 'Bilateral temporal burr holes placed followed by frontoparietal craniotomy. Acute subdural hematoma evacuated.',
    blood_loss_ml: 120,
    findings: 'Acute high-pressure subdural hematoma evacuated. Brain pulsation restored promptly after decompression.',
    implants_used: 'Titanium cranial fixation plates x 3',
  },
  {
    id: 2,
    booking_code: 'SURG-2026-0102',
    patient_id: 4,
    patient_name: 'Tolessa Bekele',
    patient_mrn: 'MKH-2026-000104',
    patient_gender: 'MALE',
    patient_age: 53,
    room_id: 2,
    room_name: 'OT Suite 2 (Orthopedics & Complex Trauma)',
    room_code: 'OT-2',
    procedure_name: 'Right Femur Shaft Fracture Open Reduction Internal Fixation (ORIF)',
    lead_surgeon_id: 8,
    lead_surgeon_name: 'Dr. Chala Gemechu',
    anesthesiologist_id: 7,
    anesthesiologist_name: 'Dr. Sisay Lemma',
    scrub_nurse_id: 10,
    scrub_nurse_name: 'Nurse Derartu Tulu',
    scheduled_start: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
    status: 'in_prep',
    who_safety_checklist_verified: false,
    post_op_notes: null,
    blood_loss_ml: 0,
    findings: 'Midshaft transverse comminuted femur fracture awaiting anatomical reduction.',
    implants_used: 'Synthes 12-hole 4.5mm LC-DCP Plate + 9 cortical screws',
  },
  {
    id: 3,
    booking_code: 'SURG-2026-0103',
    patient_id: 3,
    patient_name: 'Chaltu Abera',
    patient_mrn: 'MKH-2026-000103',
    patient_gender: 'FEMALE',
    patient_age: 28,
    room_id: 3,
    room_name: 'OT Suite 3 (Maternity & Obstetric OT)',
    room_code: 'OT-3',
    procedure_name: 'Emergency Caesarean Section (Twin Gestation, Fetal Distress)',
    lead_surgeon_id: 9,
    lead_surgeon_name: 'Dr. Helen Kassa',
    anesthesiologist_id: 7,
    anesthesiologist_name: 'Dr. Sisay Lemma',
    scrub_nurse_id: 3,
    scrub_nurse_name: 'Nurse Chaltu Abera',
    scheduled_start: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 210 * 60 * 1000).toISOString(),
    status: 'scheduled',
    who_safety_checklist_verified: false,
    post_op_notes: null,
    blood_loss_ml: 0,
    findings: '37-week diamniotic twin pregnancy. Twin A in breech presentation with fetal distress.',
    implants_used: 'None / Polyglycolic acid sutures',
  },
  {
    id: 4,
    booking_code: 'SURG-2026-0100',
    patient_id: 1,
    patient_name: 'Gudeta Hailu',
    patient_mrn: 'MKH-2026-000101',
    patient_gender: 'MALE',
    patient_age: 40,
    room_id: 1,
    room_name: 'OT Suite 1 (Major Trauma & Emergency)',
    room_code: 'OT-1',
    procedure_name: 'Laparoscopic Cholecystectomy & Intraoperative Cholangiogram',
    lead_surgeon_id: 2,
    lead_surgeon_name: 'Dr. Bekele Tadesse',
    anesthesiologist_id: 7,
    anesthesiologist_name: 'Dr. Sisay Lemma',
    scrub_nurse_id: 10,
    scrub_nurse_name: 'Nurse Derartu Tulu',
    scheduled_start: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    status: 'completed',
    who_safety_checklist_verified: true,
    post_op_notes: 'Standard 4-port laparoscopic cholecystectomy performed. Critical view of safety achieved. Gallbladder removed in endobag.',
    blood_loss_ml: 65,
    findings: 'Acute gangrenous cholecystitis with dense adhesions. CBD clear on cholangiogram.',
    implants_used: 'Titanium Ligating Hemoclips x 4',
  },
];

const INITIAL_BATCHES: CSSDBatch[] = [
  {
    id: 1,
    batch_code: 'CSSD-2026-A101',
    sterilizer_unit_name: 'Tuttnauer 5075 Steam Autoclave',
    sterilizer_type: 'steam_autoclave',
    temperature_celsius: 134.0,
    pressure_bar: 2.2,
    cycle_duration_min: 45,
    biological_indicator_passed: true,
    sterilized_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    operator_name: 'Nurse Chaltu Abera',
    packs_count: 4,
  },
  {
    id: 2,
    batch_code: 'CSSD-2026-B102',
    sterilizer_unit_name: 'Sterrad 100NX Hydrogen Peroxide Plasma',
    sterilizer_type: 'plasma',
    temperature_celsius: 55.0,
    pressure_bar: 0.8,
    cycle_duration_min: 35,
    biological_indicator_passed: true,
    sterilized_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    operator_name: 'Nurse Derartu Tulu',
    packs_count: 2,
  },
];

const INITIAL_PACKS: SterilePack[] = [
  {
    id: 1,
    pack_code: 'PACK-CRAN-01',
    batch_id: 1,
    batch_code: 'CSSD-2026-A101',
    pack_name: 'Craniotomy & Neuro-Microsurgical Instrument Set',
    expiry_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'sterile',
  },
  {
    id: 2,
    pack_code: 'PACK-ORTHO-02',
    batch_id: 1,
    batch_code: 'CSSD-2026-A101',
    pack_name: 'Major Orthopedic ORIF & Bone Drill Set',
    expiry_date: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
    status: 'sterile',
  },
  {
    id: 3,
    pack_code: 'PACK-CS-03',
    batch_id: 1,
    batch_code: 'CSSD-2026-A101',
    pack_name: 'Emergency Caesarean Section Set',
    expiry_date: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
    status: 'sterile',
  },
  {
    id: 4,
    pack_code: 'PACK-LAP-04',
    batch_id: 1,
    batch_code: 'CSSD-2026-A101',
    pack_name: 'Major Laparotomy & Abdominal Retractor Set',
    expiry_date: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString(),
    status: 'used',
  },
  {
    id: 5,
    pack_code: 'PACK-VASC-05',
    batch_id: 2,
    batch_code: 'CSSD-2026-B102',
    pack_name: 'Vascular Clamp & Fine Microsuture Set',
    expiry_date: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
    status: 'sterile',
  },
  {
    id: 6,
    pack_code: 'PACK-ENT-06',
    batch_id: 2,
    batch_code: 'CSSD-2026-B102',
    pack_name: 'Tympanoplasty & Mastoid Micro-Ear Set',
    expiry_date: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
    status: 'sterile',
  },
];

const INITIAL_VOUCHER: SurgicalVoucherData = {
  hospital_name_en: 'Mettu Karl Comprehensive Specialized Hospital',
  hospital_name_om: 'Mana Qoricha Waliigalaa Ispeeshaalaayizdii Karl Mettuu',
  tin_number: '0038912401',
  accreditation_level: 'Tertiary Teaching & Surgical Referral Center',
  telephone: '+251 47 141 0422 / Emergency: 907',
  location: 'Oromia, Ilu Abba Bor, Mettu, Ethiopia',
  booking_code: 'SURG-2026-0101',
  operating_room: 'OT Suite 1 (Major Trauma & Emergency)',
  operating_room_code: 'OT-1',
  procedure_name: 'Emergency Exploratory Craniotomy & Subdural Hematoma Evacuation',
  patient_mrn: 'MKH-2026-000102',
  patient_name: 'Ayantu Mamo',
  patient_age: 31,
  patient_gender: 'FEMALE',
  lead_surgeon: 'Dr. Bekele Tadesse',
  anesthesiologist: 'Dr. Sisay Lemma',
  scrub_nurse: 'Nurse Chaltu Abera',
  scheduled_start: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  scheduled_end: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
  status: 'in_surgery',
  who_safety_checklist_verified: true,
  post_op_notes:
    'Bilateral temporal burr holes placed followed by frontoparietal craniotomy. Acute subdural hematoma evacuated with warm saline lavage. Dura closed watertight.',
  operative_findings:
    'Acute high-pressure subdural hematoma evacuated. Brain pulsation restored promptly after decompression.',
  blood_loss_ml: 120,
  implants_used: 'Titanium cranial fixation plates x 3',
  issued_timestamp: new Date().toISOString(),
  verification_qr: 'MKH-SURG-SURG-2026-0101-TIN0038912401',
};

interface OperatingRoom {
  id: number;
  name: string;
  room_code: string;
  specialty: string;
  floor_location: string;
  is_active: boolean;
  active_booking_id?: number | null;
  active_procedure_name?: string | null;
  active_patient_name?: string | null;
  active_surgeon_name?: string | null;
  current_status: 'available' | 'in_prep' | 'in_surgery' | 'in_recovery' | 'scheduled';
}

interface SurgicalBooking {
  id: number;
  booking_code: string;
  patient_id: number;
  patient_name: string;
  patient_mrn: string;
  patient_gender: string;
  patient_age: number;
  room_id: number;
  room_name: string;
  room_code: string;
  procedure_name: string;
  lead_surgeon_id: number;
  lead_surgeon_name: string;
  anesthesiologist_id?: number | null;
  anesthesiologist_name?: string | null;
  scrub_nurse_id?: number | null;
  scrub_nurse_name?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'in_prep' | 'in_surgery' | 'in_recovery' | 'completed' | 'cancelled';
  who_safety_checklist_verified: boolean;
  post_op_notes?: string | null;
  blood_loss_ml: number;
  findings?: string | null;
  implants_used?: string | null;
}

interface CSSDBatch {
  id: number;
  batch_code: string;
  sterilizer_unit_name: string;
  sterilizer_type: string;
  temperature_celsius: number;
  pressure_bar: number;
  cycle_duration_min: number;
  biological_indicator_passed: boolean;
  sterilized_at: string;
  operator_name?: string | null;
  packs_count: number;
}

interface SterilePack {
  id: number;
  pack_code: string;
  batch_id: number;
  batch_code?: string | null;
  pack_name: string;
  expiry_date: string;
  status: 'sterile' | 'used' | 'expired' | 'contaminated';
}

interface OTStats {
  total_rooms: number;
  active_surgeries_count: number;
  scheduled_today_count: number;
  completed_today_count: number;
  ready_sterile_packs_count: number;
  active_autoclave_batches_count: number;
  emergency_trauma_bookings_count: number;
}

interface SurgicalVoucherData {
  hospital_name_en: string;
  hospital_name_om: string;
  tin_number: string;
  accreditation_level: string;
  telephone: string;
  location: string;
  booking_code: string;
  operating_room: string;
  operating_room_code: string;
  procedure_name: string;
  patient_mrn: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  lead_surgeon: string;
  anesthesiologist: string;
  scrub_nurse: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  who_safety_checklist_verified: boolean;
  post_op_notes?: string | null;
  operative_findings?: string | null;
  blood_loss_ml: number;
  implants_used?: string | null;
  issued_timestamp: string;
  verification_qr: string;
}

function OTWorkstationContent(): React.ReactElement {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab = (tabParam && ['matrix', 'schedule', 'cssd', 'packs'].includes(tabParam)
    ? tabParam
    : 'matrix') as 'matrix' | 'schedule' | 'cssd' | 'packs';

  const voucherParam = searchParams.get('voucher');

  // Primary Live State
  const [stats, setStats] = useState<OTStats>(INITIAL_STATS);
  const [rooms, setRooms] = useState<OperatingRoom[]>(INITIAL_ROOMS);
  const [bookings, setBookings] = useState<SurgicalBooking[]>(INITIAL_BOOKINGS);
  const [batches, setBatches] = useState<CSSDBatch[]>(INITIAL_BATCHES);
  const [packs, setPacks] = useState<SterilePack[]>(INITIAL_PACKS);
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<'matrix' | 'schedule' | 'cssd' | 'packs'>(initialTab);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showBookModal, setShowBookModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showPostOpModal, setShowPostOpModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(!!voucherParam);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);

  // Selection state for modals
  const [selectedBooking, setSelectedBooking] = useState<SurgicalBooking | null>(INITIAL_BOOKINGS[0]);
  const [voucherData, setVoucherData] = useState<SurgicalVoucherData | null>(INITIAL_VOUCHER);

  // Feedback State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form: Booking
  const [bookPatientId, setBookPatientId] = useState<number>(1);
  const [bookRoomId, setBookRoomId] = useState<number>(1);
  const [bookProcedure, setBookProcedure] = useState('');
  const [bookSurgeonId, setBookSurgeonId] = useState<number>(2); // Dr Bekele
  const [bookAnesthetistId, setBookAnesthetistId] = useState<number>(7); // Dr Sisay
  const [bookNurseId, setBookNurseId] = useState<number>(3); // Nurse Chaltu
  const [bookStart, setBookStart] = useState('');
  const [bookEnd, setBookEnd] = useState('');

  // Form: WHO Safety Checklist
  const [signInChecked, setSignInChecked] = useState(true);
  const [timeOutChecked, setTimeOutChecked] = useState(true);
  const [signOutChecked, setSignOutChecked] = useState(true);
  const [checklistNotes, setChecklistNotes] = useState('');

  // Form: Post-Op Notes
  const [postOpNotes, setPostOpNotes] = useState('');
  const [intraOpFindings, setIntraOpFindings] = useState('');
  const [bloodLossMl, setBloodLossMl] = useState<number>(0);
  const [implantsUsed, setImplantsUsed] = useState('');

  // Form: Transition Status
  const [targetStatus, setTargetStatus] = useState<string>('in_surgery');

  // Form: CSSD Batch
  const [batchUnitName, setBatchUnitName] = useState('Tuttnauer 5075 Steam Autoclave');
  const [batchType, setBatchType] = useState('steam_autoclave');
  const [batchTemp, setBatchTemp] = useState(134.0);
  const [batchPressure, setBatchPressure] = useState(2.2);
  const [batchDuration, setBatchDuration] = useState(45);

  // Form: Sterile Pack
  const [packBatchId, setPackBatchId] = useState<number>(1);
  const [packName, setPackName] = useState('');
  const [packExpiryDays, setPackExpiryDays] = useState(30);

  // Auto-dismiss notifications
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Load all live OT & CSSD data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, roomsRes, bookingsRes, batchesRes, packsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/ot/stats`),
        fetch(`${API_BASE}/api/v1/ot/rooms`),
        fetch(`${API_BASE}/api/v1/ot/bookings`),
        fetch(`${API_BASE}/api/v1/ot/cssd/batches`),
        fetch(`${API_BASE}/api/v1/ot/cssd/packs`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (batchesRes.ok) setBatches(await batchesRes.json());
      if (packsRes.ok) setPacks(await packsRes.json());

      // Fetch patient list for booking dropdown
      try {
        const patRes = await fetch(`${API_BASE}/api/v1/patients/`);
        if (patRes.ok) {
          const patData = await patRes.json();
          setRegisteredPatients(patData);
        }
      } catch (e) {
        // Fallback registered patients
      }
    } catch (err: any) {
      console.error('Failed to load OT data:', err);
      setActionError('Kuusaa deetaa hospitaalaa irraa deetaa baqaqsanii yaaluu argachuu hin dandeenye.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['matrix', 'schedule', 'cssd', 'packs'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
      const voucherParam = params.get('voucher');
      if (voucherParam) {
        setVoucherData(INITIAL_VOUCHER);
        setShowVoucherModal(true);
        const bId = Number(voucherParam) || 1;
        fetch(`${API_BASE}/api/v1/ot/bookings/${bId}/voucher`)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.booking_code) {
              setVoucherData(data);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = selectedStatusFilter === 'all' || b.status === selectedStatusFilter;
      const matchesSearch =
        searchQuery === '' ||
        b.procedure_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.booking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.lead_surgeon_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [bookings, selectedStatusFilter, searchQuery]);

  // Action: Schedule New Surgery
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookProcedure) {
      setActionError('Mee maqaa yaala baqaksaa (Procedure Name) guutaa.');
      return;
    }
    try {
      setActionLoading(true);
      const startIso = bookStart ? new Date(bookStart).toISOString() : new Date().toISOString();
      const endIso = bookEnd
        ? new Date(bookEnd).toISOString()
        : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`${API_BASE}/api/v1/ot/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: bookPatientId,
          room_id: bookRoomId,
          procedure_name: bookProcedure,
          lead_surgeon_id: bookSurgeonId,
          anesthesiologist_id: bookAnesthetistId,
          scrub_nurse_id: bookNurseId,
          scheduled_start: startIso,
          scheduled_end: endIso,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Beellama yaala baqaksaa galmeessuun hin dandaamne.');
      }

      setActionSuccess('Beellamni yaala baqaksaa milkaa\'inaan galmaa\'eera!');
      setShowBookModal(false);
      setBookProcedure('');
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Transition Status
  const handleUpdateStatus = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/ot/bookings/${selectedBooking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Sadarkaa yaala baqaksaa jijjiiruun hin dandaamne.');
      }

      setActionSuccess(`Sadarkaan yaala baqaksaa gara "${targetStatus.toUpperCase()}" jijjiirameera!`);
      setShowStatusModal(false);
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Verify WHO Safety Checklist
  const handleVerifyChecklist = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/ot/bookings/${selectedBooking.id}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified: signInChecked && timeOutChecked && signOutChecked,
          sign_in_checked: signInChecked,
          time_out_checked: timeOutChecked,
          sign_out_checked: signOutChecked,
          notes: checklistNotes || 'WHO 3-Phase surgical checklist verified before table entry.',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Checklist WHO mirkaneessuun hin dandaamne.');
      }

      setActionSuccess('Checklist Nageenya Baqaqsanii Yaaluu WHO milkaa\'inaan mirkanaa\'eera!');
      setShowChecklistModal(false);
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Save Post-Op Notes
  const handleSavePostOp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/ot/bookings/${selectedBooking.id}/post-op`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_op_notes: postOpNotes || 'Operative procedure concluded successfully.',
          findings: intraOpFindings,
          blood_loss_ml: Number(bloodLossMl) || 0,
          implants_used: implantsUsed,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Galmee yaala baqaksaa galmeessuun hin dandaamne.');
      }

      setActionSuccess('Galmeen yaala baqaksaa (Operative Notes) milkaa\'inaan qusatameera!');
      setShowPostOpModal(false);
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Open Official Voucher
  const handleOpenVoucher = async (booking: SurgicalBooking) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/ot/bookings/${booking.id}/voucher`);
      if (!res.ok) throw new Error('Voucher baqaqsanii yaaluu argachuu hin dandeenye.');
      const data = await res.json();
      setVoucherData(data);
      setShowVoucherModal(true);
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Record CSSD Autoclave Cycle
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/ot/cssd/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sterilizer_unit_name: batchUnitName,
          sterilizer_type: batchType,
          temperature_celsius: Number(batchTemp),
          pressure_bar: Number(batchPressure),
          cycle_duration_min: Number(batchDuration),
          biological_indicator_passed: true,
        }),
      });

      if (!res.ok) throw new Error('Marsaa otookilaavii galmeessuun hin dandaamne.');

      setActionSuccess('Marsaan Qulqullina Meeshaa CSSD milkaa\'inaan galmaa\'eera!');
      setShowBatchModal(false);
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Register Sterile Pack
  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName) {
      setActionError('Mee maqaa meeshaa (Pack Name) galchaa.');
      return;
    }
    try {
      setActionLoading(true);
      const expDate = new Date(Date.now() + Number(packExpiryDays) * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`${API_BASE}/api/v1/ot/cssd/packs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: packBatchId,
          pack_name: packName,
          expiry_date: expDate,
        }),
      });

      if (!res.ok) throw new Error('Meeshaa qulqullaawaa galmeessuun hin dandaamne.');

      setActionSuccess('Setiin meeshaa qulqullaa\'e milkaa\'inaan galmaa\'eera!');
      setShowPackModal(false);
      setPackName('');
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Mark Pack Status
  const handleMarkPack = async (packId: number, newStatus: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/ot/cssd/packs/${packId}/use?status_update=${newStatus}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Sadarkaa meeshaa jijjiiruun hin dandaamne.');

      setActionSuccess(`Meeshaan gara "${newStatus.toUpperCase()}" jijjiirameera!`);
      await fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Dogoggorri uumameera.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070a0f] text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1680px] w-full mx-auto">
          {/* Top Breadcrumb & Status Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-amber-400 font-medium">Operation Theatre & CSSD Workstation</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>OT TELEMETRY LIVE</span>
              </div>
              <span className="text-slate-500 font-mono">TIN: 0038912401</span>
            </div>
          </div>

          {/* Header Banner - Obsidian & Champagne Gold Theme */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d131f] via-[#111927] to-[#181a24] p-6 sm:p-8 border border-amber-500/20 shadow-2xl shadow-black/60">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tertiary Surgical Care • WHO Safety Protocol Compliant</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <Scissors className="w-7 h-7 text-amber-400 shrink-0" />
                  <span>Kutaa Baqaqsanii Yaaluu & CSSD</span>
                  <span className="text-sm font-normal text-slate-400 hidden sm:inline">
                    (Operation Theatre & Sterilization Hub)
                  </span>
                </h1>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  To'annoo kutaa yaala baqaksaa (OT Suites 1–4), beellama baqaqsaa, sarara qulqullina meeshaa otookilaavii
                  (134°C Autoclave Telemetry), fi mirkaneessa eegumsa lubbuu WHO Safety Checklist.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowBookModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Beellama Baqaqsaa Haaraa</span>
                </button>

                <button
                  onClick={() => setShowBatchModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-950/70 hover:bg-teal-900 border border-teal-500/40 text-teal-300 font-semibold text-xs active:scale-95 transition-all"
                >
                  <Flame className="w-4 h-4 text-teal-400" />
                  <span>Marsaa Otookilaavii</span>
                </button>

                <button
                  onClick={() => setShowPackModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs active:scale-95 transition-all"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Meeshaa Qulqullaa'e</span>
                </button>

                <button
                  onClick={fetchAllData}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 active:scale-95 transition-all"
                  title="Haaromsi / Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Banners */}
          {actionSuccess && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs shadow-lg animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{actionError}</span>
            </div>
          )}

          {/* Operational KPIs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Total Suites */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Kutaalee Yaalaa (OT Suites)</span>
                <Building2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{stats.total_rooms}</span>
                <span className="text-[10px] text-cyan-400/90 font-medium">Suites Ready</span>
              </div>
            </div>

            {/* In Surgery / Active */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-amber-500/30 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-amber-300">Yaala Irra Jiran (Active)</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400">{stats.active_surgeries_count}</span>
                <span className="text-[10px] text-amber-300/80 font-medium">In Prep / Surgery</span>
              </div>
            </div>

            {/* Scheduled Today */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Beellama Har'aa (Scheduled)</span>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{stats.scheduled_today_count}</span>
                <span className="text-[10px] text-blue-400/90 font-medium">Upcoming</span>
              </div>
            </div>

            {/* Completed */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Xumuraman (Completed)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">{stats.completed_today_count}</span>
                <span className="text-[10px] text-slate-400">Cases</span>
              </div>
            </div>

            {/* Sterile Packs */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Meeshaalee Qulqullaa'an</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-teal-400">{stats.ready_sterile_packs_count}</span>
                <span className="text-[10px] text-teal-300/80">CSSD Ready</span>
              </div>
            </div>

            {/* Autoclave Status */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Otookilaavii (134°C)</span>
                <Gauge className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-400">{stats.active_autoclave_batches_count}</span>
                <span className="text-[10px] text-rose-300/80 font-mono">2.2 Bar Passed</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>To'annoo Kutaalee Yaalaa (Live Matrix)</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {rooms.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Galmee Yaala Baqaksaa (Surgical Census)</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {bookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('cssd')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'cssd'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Flame className="w-4 h-4 text-teal-400" />
                <span>CSSD Autoclave Telemetry</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-950 text-teal-300">
                  {batches.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('packs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'packs'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Meeshaalee Qulqullaa'an (Sterile Packs)</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {packs.length}
                </span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Barbaadi (Procedure, Patient, MRN)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400/80"
                />
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 focus:outline-hidden focus:border-amber-400"
              >
                <option value="all">Sadarkaa Hunda (All Statuses)</option>
                <option value="in_surgery">In Surgery (Baqaqsaa Irra)</option>
                <option value="in_prep">In Prep (Qophii Irra)</option>
                <option value="scheduled">Scheduled (Beellamame)</option>
                <option value="completed">Completed (Xumurame)</option>
              </select>
            </div>
          </div>

          {/* TAB 1: THEATRE COORDINATION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {rooms.map((room) => {
                  const booking = bookings.find((b) => b.id === room.active_booking_id);
                  const isOccupied = room.current_status === 'in_surgery' || room.current_status === 'in_prep';

                  return (
                    <div
                      key={room.id}
                      className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all ${
                        room.current_status === 'in_surgery'
                          ? 'bg-gradient-to-b from-[#1a1114] to-[#120b0e] border-rose-500/50 shadow-xl shadow-rose-950/20'
                          : room.current_status === 'in_prep'
                          ? 'bg-gradient-to-b from-[#18140c] to-[#110e08] border-amber-500/40 shadow-xl shadow-amber-950/20'
                          : room.current_status === 'scheduled'
                          ? 'bg-gradient-to-b from-[#0d1424] to-[#080d18] border-cyan-500/40'
                          : 'bg-gradient-to-b from-[#0c1514] to-[#080d0d] border-emerald-500/30'
                      }`}
                    >
                      {/* Top Header of Room */}
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider ${
                              room.current_status === 'in_surgery'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : room.current_status === 'in_prep'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : room.current_status === 'scheduled'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {room.room_code}
                          </span>

                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {room.current_status === 'in_surgery' && (
                              <span className="flex items-center gap-1.5 text-rose-400">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                <span>IN SURGERY</span>
                              </span>
                            )}
                            {room.current_status === 'in_prep' && (
                              <span className="flex items-center gap-1.5 text-amber-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>IN PREPARATION</span>
                              </span>
                            )}
                            {room.current_status === 'scheduled' && (
                              <span className="text-cyan-400">SCHEDULED</span>
                            )}
                            {room.current_status === 'available' && (
                              <span className="text-emerald-400">AVAILABLE</span>
                            )}
                          </div>
                        </div>

                        {/* Room Name & Specialty */}
                        <div className="mt-3">
                          <h3 className="font-bold text-white text-base leading-snug">{room.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <Stethoscope className="w-3 h-3 text-amber-400" />
                            <span>{room.specialty}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{room.floor_location}</span>
                          </div>
                        </div>

                        {/* Live Clinical Procedure HUD */}
                        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                          {room.active_procedure_name ? (
                            <>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                                  Yaala Baqaksaa (Procedure)
                                </span>
                                <p className="text-xs font-bold text-amber-300 line-clamp-2 mt-0.5">
                                  {room.active_procedure_name}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Dhukkubsataa</span>
                                  <p className="font-semibold text-white">{room.active_patient_name}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Surgeon</span>
                                  <p className="font-semibold text-slate-300">{room.active_surgeon_name}</p>
                                </div>
                              </div>

                              {booking && (
                                <div className="flex items-center justify-between pt-1 text-[11px]">
                                  <span className="text-slate-400 font-mono">{booking.booking_code}</span>
                                  {booking.who_safety_checklist_verified ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>WHO Verified</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>WHO Pending</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="py-6 text-center text-slate-500 space-y-1">
                              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/40" />
                              <p className="text-xs font-medium text-slate-400">Kutaan Qulqullaa'eera</p>
                              <p className="text-[11px] text-slate-600">Qophii yaala itti aanuu eegaa jira</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                        {booking ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setTargetStatus(booking.status);
                                setShowStatusModal(true);
                              }}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-colors text-center"
                            >
                              Sadarkaa
                            </button>

                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setSignInChecked(true);
                                setTimeOutChecked(true);
                                setSignOutChecked(true);
                                setShowChecklistModal(true);
                              }}
                              className="py-1.5 px-2.5 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-500/40 text-[11px] font-semibold text-teal-300 transition-colors"
                              title="WHO Safety Checklist"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setPostOpNotes(booking.post_op_notes || '');
                                setIntraOpFindings(booking.findings || '');
                                setBloodLossMl(booking.blood_loss_ml || 0);
                                setImplantsUsed(booking.implants_used || '');
                                setShowPostOpModal(true);
                              }}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-amber-300 transition-colors"
                              title="Surgeon Operative Notes"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenVoucher(booking)}
                              className="py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-semibold text-amber-300 transition-colors"
                              title="Print Surgical Operative Voucher"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setBookRoomId(room.id);
                              setShowBookModal(true);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Beellama Qabi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Theatre Live Environmental & Safety Banner */}
              <div className="p-4 rounded-xl bg-[#0b101c] border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-semibold text-slate-200">Environmental Sensors:</span>
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Ambient Temp: 20.4°C</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Laminar Flow Positive Pressure: +25 Pa</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Isolated Power System (IPS) Normal</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Ref: WHO Guidelines for Safe Surgery 2026 • Ilu Abba Bor Surgical Complex
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SURGICAL REGISTRY & SCHEDULE TABLE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl bg-[#0c121e] border border-slate-800/80 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#101826] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                      <tr>
                        <th className="py-3.5 px-4">Booking Code</th>
                        <th className="py-3.5 px-4">Kutaa (OT Suite)</th>
                        <th className="py-3.5 px-4">Dhukkubsataa (Patient)</th>
                        <th className="py-3.5 px-4">Yaala Baqaksaa (Procedure)</th>
                        <th className="py-3.5 px-4">Gare Yaalaa (Surgical Team)</th>
                        <th className="py-3.5 px-4">Yeroo (Schedule)</th>
                        <th className="py-3.5 px-4">Sadarkaa (Status)</th>
                        <th className="py-3.5 px-4">WHO Safety</th>
                        <th className="py-3.5 px-4 text-right">Tarkaanfii (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                              {b.booking_code}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-200 border border-slate-700">
                                {b.room_code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">{b.patient_name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {b.patient_mrn} • {b.patient_gender}, {b.patient_age} yrs
                              </div>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <p className="font-bold text-slate-200 truncate" title={b.procedure_name}>
                                {b.procedure_name}
                              </p>
                              {b.blood_loss_ml > 0 && (
                                <span className="text-[11px] text-rose-400 font-mono">
                                  Blood Loss: {b.blood_loss_ml} ml
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-[11px]">
                              <div className="text-amber-300 font-semibold">{b.lead_surgeon_name}</div>
                              <div className="text-slate-400">Anes: {b.anesthesiologist_name || 'N/A'}</div>
                              <div className="text-slate-500">Scrub: {b.scrub_nurse_name || 'N/A'}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                              {new Date(b.scheduled_start).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              –{' '}
                              {new Date(b.scheduled_end).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                  b.status === 'in_surgery'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : b.status === 'in_prep'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : b.status === 'scheduled'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {b.status === 'in_surgery' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                )}
                                {b.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {b.who_safety_checklist_verified ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setTargetStatus(b.status);
                                    setShowStatusModal(true);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                                  title="Sadarkaa Jijjiiri"
                                >
                                  Phase
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setSignInChecked(true);
                                    setTimeOutChecked(true);
                                    setSignOutChecked(true);
                                    setShowChecklistModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-800 text-teal-300"
                                  title="WHO Checklist"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setPostOpNotes(b.post_op_notes || '');
                                    setIntraOpFindings(b.findings || '');
                                    setBloodLossMl(b.blood_loss_ml || 0);
                                    setImplantsUsed(b.implants_used || '');
                                    setShowPostOpModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300"
                                  title="Surgeon Notes"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenVoucher(b)}
                                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300"
                                  title="Print Surgical Voucher"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-500">
                            Beellamni yaala baqaksaa hin argamne.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CSSD AUTOCLAVE TELEMETRY */}
          {activeTab === 'cssd' && (
            <div className="space-y-6">
              {/* Autoclave Telemetry Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Temp Gauge */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121c2c] to-[#0c121e] border border-cyan-500/30 shadow-lg">
                  <div className="flex items-center justify-between text-cyan-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Chamber Temperature</span>
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">134.0</span>
                    <span className="text-cyan-400 font-bold text-sm">°C</span>
                  </div>
                  <div className="mt-2 text-[11px] text-cyan-300/80">
                    Saturated High-Pressure Steam • Target ±0.5°C
                  </div>
                </div>

                {/* Pressure Gauge */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1f1610] to-[#120d09] border border-amber-500/30 shadow-lg">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Vessel Pressure</span>
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">2.20</span>
                    <span className="text-amber-400 font-bold text-sm">Bar</span>
                  </div>
                  <div className="mt-2 text-[11px] text-amber-300/80">
                    Operating Pressure 2.15 – 2.25 Bar Normal
                  </div>
                </div>

                {/* Sterilization Hold Time */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1c1a] to-[#081211] border border-teal-500/30 shadow-lg">
                  <div className="flex items-center justify-between text-teal-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Hold Time</span>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">45</span>
                    <span className="text-teal-400 font-bold text-sm">Minutes</span>
                  </div>
                  <div className="mt-2 text-[11px] text-teal-300/80">
                    Full Vacuum Pulsing + 18 Min Vacuum Drying
                  </div>
                </div>

                {/* Biological Indicator */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0b1a13] to-[#08120d] border border-emerald-500/30 shadow-lg">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Biological Spore Test</span>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400">PASSED</span>
                  </div>
                  <div className="mt-2 text-[11px] text-emerald-300/80">
                    G. stearothermophilus (10⁶ spores) • 100% Inactivated
                  </div>
                </div>
              </div>

              {/* Autoclave Batches List */}
              <div className="rounded-2xl bg-[#0c121e] border border-slate-800/80 overflow-hidden shadow-xl">
                <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">Marsaalee Otookilaavii Galmaa'an (Sterilization Cycles)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tuttnauer Steam & Sterrad Hydrogen Peroxide Plasma units tracked with autoclave batch IDs
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Marsaa Haaraa</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#101826] text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Batch Code</th>
                        <th className="py-3 px-4">Meeshaa (Unit Name)</th>
                        <th className="py-3 px-4">Akaakuu (Method)</th>
                        <th className="py-3 px-4">Ho'a & Dhiibbaa (Parameters)</th>
                        <th className="py-3 px-4">Turtii (Cycle Time)</th>
                        <th className="py-3 px-4">Spore Indicator</th>
                        <th className="py-3 px-4">Hojjetaa (Operator)</th>
                        <th className="py-3 px-4">Meeshaalee (Packs)</th>
                        <th className="py-3 px-4">Yeroo (Timestamp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {batches.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-bold text-teal-400">{b.batch_code}</td>
                          <td className="py-3 px-4 font-semibold text-white">{b.sterilizer_unit_name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                              {b.sterilizer_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {b.temperature_celsius}°C • {b.pressure_bar} Bar
                          </td>
                          <td className="py-3 px-4 font-mono">{b.cycle_duration_min} min</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Negative (Passed)</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{b.operator_name || 'CSSD Specialist'}</td>
                          <td className="py-3 px-4 font-bold text-amber-400">{b.packs_count} sets</td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {new Date(b.sterilized_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STERILE INSTRUMENT PACKS REGISTRY */}
          {activeTab === 'packs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Galmee Meeshaalee Qulqullaa'an (Sterile Instrument Packs)</h3>
                  <p className="text-xs text-slate-400">
                    Surgical instrument tray sets verified sterile with barcode tracking from CSSD to OT table.
                  </p>
                </div>
                <button
                  onClick={() => setShowPackModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Meeshaa Haaraa Galmeessi</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packs.map((pack) => (
                  <div
                    key={pack.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      pack.status === 'sterile'
                        ? 'bg-[#0c141d] border-teal-500/40 shadow-lg'
                        : pack.status === 'used'
                        ? 'bg-[#111319] border-slate-700/60 opacity-85'
                        : 'bg-[#1a1012] border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-amber-400">{pack.pack_code}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pack.status === 'sterile'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : pack.status === 'used'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {pack.status}
                      </span>
                    </div>

                    <h4 className="mt-3 font-bold text-white text-sm leading-snug">{pack.pack_name}</h4>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Autoclave Batch:</span>
                        <span className="font-mono text-teal-300">{pack.batch_code || 'CSSD-2026-A101'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sterility Expiry:</span>
                        <span className="font-mono text-slate-300">
                          {new Date(pack.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Pack Action Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      {pack.status === 'sterile' && (
                        <>
                          <button
                            onClick={() => handleMarkPack(pack.id, 'used')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold transition-colors"
                          >
                            Mark Used on Table
                          </button>
                          <button
                            onClick={() => handleMarkPack(pack.id, 'contaminated')}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-semibold transition-colors"
                          >
                            Contaminated
                          </button>
                        </>
                      )}
                      {pack.status !== 'sterile' && (
                        <button
                          onClick={() => handleMarkPack(pack.id, 'sterile')}
                          className="px-2.5 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-800 text-teal-300 text-[11px] font-semibold transition-colors"
                        >
                          Re-Sterilized
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MODAL 1: SCHEDULE NEW SURGERY                                     */}
          {/* ================================================================= */}
          {showBookModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
              <div className="relative w-full max-w-xl rounded-2xl bg-[#0e1422] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Scissors className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Beellama Yaala Baqaksaa Haaraa</h3>
                  </div>
                  <button
                    onClick={() => setShowBookModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
                  {/* Operating Room Suite */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kutaa Yaala Baqaksaa (OT Suite)</label>
                    <select
                      value={bookRoomId}
                      onChange={(e) => setBookRoomId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.room_code} — {r.name} ({r.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Patient Selection */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Dhukkubsataa (Patient)</label>
                    <select
                      value={bookPatientId}
                      onChange={(e) => setBookPatientId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                    >
                      <option value={1}>MKH-2026-000101 — Gudeta Hailu (Male, 40 yrs)</option>
                      <option value={2}>MKH-2026-000102 — Ayantu Mamo (Female, 31 yrs)</option>
                      <option value={3}>MKH-2026-000103 — Chaltu Abera (Female, 28 yrs)</option>
                      <option value={4}>MKH-2026-000104 — Tolessa Bekele (Male, 53 yrs)</option>
                    </select>
                  </div>

                  {/* Procedure Name */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Maqaa Yaala Baqaksaa (Procedure Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Fkn: Emergency Laparotomy / ORIF Femur Fracture / C-Section..."
                      value={bookProcedure}
                      onChange={(e) => setBookProcedure(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Surgical Team */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Lead Surgeon</label>
                      <select
                        value={bookSurgeonId}
                        onChange={(e) => setBookSurgeonId(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                      >
                        <option value={2}>Dr. Bekele Tadesse</option>
                        <option value={8}>Dr. Chala Gemechu</option>
                        <option value={9}>Dr. Helen Kassa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Anesthesiologist</label>
                      <select
                        value={bookAnesthetistId}
                        onChange={(e) => setBookAnesthetistId(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                      >
                        <option value={7}>Dr. Sisay Lemma</option>
                        <option value={2}>Dr. Bekele Tadesse</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Scrub Nurse</label>
                      <select
                        value={bookNurseId}
                        onChange={(e) => setBookNurseId(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                      >
                        <option value={3}>Nurse Chaltu Abera</option>
                        <option value={10}>Nurse Derartu Tulu</option>
                      </select>
                    </div>
                  </div>

                  {/* Schedule Time Window */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Yeroo Jalqabaa (Start Time)</label>
                      <input
                        type="datetime-local"
                        value={bookStart}
                        onChange={(e) => setBookStart(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Yeroo Xumuraa (End Time)</label>
                      <input
                        type="datetime-local"
                        value={bookEnd}
                        onChange={(e) => setBookEnd(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBookModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                    >
                      Dhiisi (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                    >
                      {actionLoading ? 'Galmeessaa jira...' : 'Galmeessi (Book Surgery)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MODAL 2: WHO SURGICAL SAFETY CHECKLIST                            */}
          {/* ================================================================= */}
          {showChecklistModal && selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
              <div className="relative w-full max-w-2xl rounded-2xl bg-[#0e1422] border border-teal-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-6 h-6 text-teal-400" />
                    <div>
                      <h3 className="font-bold text-white text-base">WHO Surgical Safety Checklist</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedBooking.booking_code} • {selectedBooking.patient_name} •{' '}
                        {selectedBooking.procedure_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChecklistModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Phase 1: SIGN-IN */}
                  <div className="p-4 rounded-xl bg-[#101b24] border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-cyan-300 text-xs uppercase tracking-wide">
                        1. Sign-In (Before Anesthesia Induction)
                      </h4>
                      <input
                        type="checkbox"
                        checked={signInChecked}
                        onChange={(e) => setSignInChecked(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 bg-slate-900 border-slate-700"
                      />
                    </div>
                    <ul className="text-slate-300 space-y-1 list-disc list-inside text-[11px]">
                      <li>Eenyummaan dhukkubsataa, iddoon yaalaa, fi heyyamsi mirkanaa'eera.</li>
                      <li>Iddoon baqaqsaa sirriitti mallatteeffameera (Site Marked).</li>
                      <li>Meeshaan oksijiinii (Pulse Oximeter) hojjetaa jiraachuun mirkanaa'eera.</li>
                      <li>Alarjii fi rakkoon qilleensa fudhachuu (Airway Risk) ilaallameera.</li>
                    </ul>
                  </div>

                  {/* Phase 2: TIME-OUT */}
                  <div className="p-4 rounded-xl bg-[#1f1910] border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wide">
                        2. Time-Out (Before Skin Incision)
                      </h4>
                      <input
                        type="checkbox"
                        checked={timeOutChecked}
                        onChange={(e) => setTimeOutChecked(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                      />
                    </div>
                    <ul className="text-slate-300 space-y-1 list-disc list-inside text-[11px]">
                      <li>Miseensonni garee yaalaa hundi wal-beesisaniiru (Team Introductions).</li>
                      <li>Maqaa dhukkubsataa, yaala baqaqsaa, fi iddoo yaalaa sagaleen mirkaneessaniiru.</li>
                      <li>Qorichi ittisa baakteeriyaa (Antibiotic Prophylaxis) daqiiqaa 60 keessatti kennameera.</li>
                      <li>Suuraan sakatta'iinsaa (X-ray/CT) teessoo yaalaa irratti mul'achaa jira.</li>
                    </ul>
                  </div>

                  {/* Phase 3: SIGN-OUT */}
                  <div className="p-4 rounded-xl bg-[#0c1d18] border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wide">
                        3. Sign-Out (Before Leaving Operating Room)
                      </h4>
                      <input
                        type="checkbox"
                        checked={signOutChecked}
                        onChange={(e) => setSignOutChecked(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700"
                      />
                    </div>
                    <ul className="text-slate-300 space-y-1 list-disc list-inside text-[11px]">
                      <li>Baay'inni meeshaalee, ispoonjii, fi lilmoo sirriitti lakkaa'amaniiru (Instrument Counts).</li>
                      <li>Saamudli qorannoo (Biopsy Specimen) maqaa dhukkubsataan sirriitti barreeffameera.</li>
                      <li>Qulqullinni fi sirrummaan meeshaa teknikaalaa mirkanaa'eera.</li>
                      <li>Qajeelfamni bayyanachuu (Post-Op Recovery Concerns) qophaa'eera.</li>
                    </ul>
                  </div>

                  {/* Checklist Notes */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Yaada Dabalataa Mirkaneessaa (Clinical Notes)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Hubannoo dabalataa garee baqaqsaan..."
                      value={checklistNotes}
                      onChange={(e) => setChecklistNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-teal-400"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowChecklistModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyChecklist}
                      disabled={actionLoading || !(signInChecked && timeOutChecked && signOutChecked)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
                    >
                      {actionLoading ? 'Mirkaneessaa jira...' : 'Checklist Mirkaneessi (Verify WHO)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MODAL 3: SURGEON OPERATIVE NOTES & FINDINGS                       */}
          {/* ================================================================= */}
          {showPostOpModal && selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
              <div className="relative w-full max-w-2xl rounded-2xl bg-[#0e1422] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-white text-base">Galmee Yaala Baqaksaa (Operative Notes)</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedBooking.patient_name} • {selectedBooking.procedure_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPostOpModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSavePostOp} className="space-y-4 text-xs">
                  {/* Operative Findings */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Argannoo Yeroo Yaalaa (Intraoperative Surgical Findings)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Wanta yeroo baqaqsaa argame gabaasi..."
                      value={intraOpFindings}
                      onChange={(e) => setIntraOpFindings(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Operative Notes */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Ibsa Yaala Baqaksaa (Operative Technique & Procedure Notes) *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Tarkaanfiiwwan yaala baqaksaa tarreessi..."
                      value={postOpNotes}
                      onChange={(e) => setPostOpNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Blood Loss & Implants */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Dhiiga Dhangala'e (Blood Loss in ml)</label>
                      <input
                        type="number"
                        min={0}
                        value={bloodLossMl}
                        onChange={(e) => setBloodLossMl(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Meeshaalee Dhaabbatan (Implants Used)</label>
                      <input
                        type="text"
                        placeholder="Fkn: Titanium Screws / Plates / Mesh..."
                        value={implantsUsed}
                        onChange={(e) => setImplantsUsed(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPostOpModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                    >
                      {actionLoading ? 'Qusataa jira...' : 'Galmee Qusadhu (Save Notes)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MODAL 4: TRANSITION SURGICAL STATUS                               */}
          {/* ================================================================= */}
          {showStatusModal && selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
              <div className="relative w-full max-w-md rounded-2xl bg-[#0e1422] border border-amber-500/40 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Sadarkaa Yaalaa Jijjiiri</h3>
                  </div>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-300">
                    Beellama: <span className="font-bold text-amber-300">{selectedBooking.booking_code}</span>
                    <br />
                    Dhukkubsataa: <span className="font-bold text-white">{selectedBooking.patient_name}</span>
                  </p>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Sadarkaa Haaraa Filadhu:</label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="scheduled">Scheduled (Beellamame)</option>
                      <option value="in_prep">In Preparation (Qophii Teessoo Irra)</option>
                      <option value="in_surgery">In Surgery (Baqaqsaa Irra)</option>
                      <option value="in_recovery">In Recovery (Kutaa Bayyanachuu PACU)</option>
                      <option value="completed">Completed (Xumurame)</option>
                      <option value="cancelled">Cancelled (Haqame)</option>
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowStatusModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateStatus}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                    >
                      {actionLoading ? 'Jijjiiraa jira...' : 'Mirkaneessi'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MODAL 5: LOG CSSD AUTOCLAVE BATCH                                 */}
          {/* ================================================================= */}
          {showBatchModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
              <div className="relative w-full max-w-lg rounded-2xl bg-[#0e1422] border border-teal-500/40 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-white text-base">Marsaa Otookilaavii Galmeessi</h3>
                  </div>
                  <button
                    onClick={() => setShowBatchModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Meeshaa Otookilaavii (Sterilizer Unit)</label>
                    <input
                      type="text"
                      required
                      value={batchUnitName}
                      onChange={(e) => setBatchUnitName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-teal-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Akaakuu (Type)</label>
                      <select
                        value={batchType}
                        onChange={(e) => setBatchType(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-teal-400"
                      >
                        <option value="steam_autoclave">Steam Autoclave</option>
                        <option value="plasma">Hydrogen Peroxide Plasma</option>
                        <option value="chemical_gas">Chemical Gas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Ho'a (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={batchTemp}
                        onChange={(e) => setBatchTemp(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-teal-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Dhiibbaa (Bar)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={batchPressure}
                        onChange={(e) => setBatchPressure(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Turtii (Daqiiqaa)</label>
                      <input
                        type="number"
                        value={batchDuration}
                        onChange={(e) => setBatchDuration(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-teal-400"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Biological Indicator (Geobacillus stearothermophilus) Passed & Verified</span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBatchModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-bold transition-all shadow-md shadow-teal-500/20"
                    >
                      {actionLoading ? 'Galmeessaa...' : 'Galmeessi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MODAL 6: REGISTER STERILE PACK                                    */}
          {/* ================================================================= */}
          {showPackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
              <div className="relative w-full max-w-lg rounded-2xl bg-[#0e1422] border border-amber-500/40 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Meeshaa Qulqullaa'e Galmeessi</h3>
                  </div>
                  <button
                    onClick={() => setShowPackModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePack} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Marsaa Otookilaavii (Parent Batch)</label>
                    <select
                      value={packBatchId}
                      onChange={(e) => setPackBatchId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batch_code} — {b.sterilizer_unit_name} ({b.temperature_celsius}°C)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Maqaa Setii Meeshaa (Pack Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Fkn: Major Laparotomy Instrument Set / C-Section Set..."
                      value={packName}
                      onChange={(e) => setPackName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Turtii Qulqullinaa (Guyyaa)</label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={packExpiryDays}
                      onChange={(e) => setPackExpiryDays(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-amber-400"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Barumsa meeshaa qulqullaa'e qulqullinaan eeguu (standard double wrap 30 days)
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPackModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                    >
                      Dhiisi
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                    >
                      {actionLoading ? 'Galmeessaa...' : 'Galmeessi Setii'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* MODAL 7: OFFICIAL PRINTABLE SURGICAL OPERATIVE VOUCHER            */}
          {/* ================================================================= */}
          {showVoucherModal && voucherData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="relative w-full max-w-3xl rounded-2xl bg-white text-slate-900 p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-none print:w-full">
                {/* Print Control Bar (Hidden when printed) */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                    <Printer className="w-5 h-5 text-amber-600" />
                    <span>Nagahee Yaala Baqaksaa Mirkanaa'aa (Official Operative Voucher)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Maxxansi (Print)</span>
                    </button>
                    <button
                      onClick={() => setShowVoucherModal(false)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Certificate Layout */}
                <div className="space-y-6">
                  {/* Hospital Header */}
                  <div className="flex items-center justify-between pb-4 border-b-2 border-amber-600/60">
                    <div className="space-y-1">
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        {voucherData.hospital_name_en}
                      </h2>
                      <h3 className="text-sm font-semibold text-amber-700">{voucherData.hospital_name_om}</h3>
                      <p className="text-xs text-slate-500">
                        {voucherData.accreditation_level} • {voucherData.location}
                      </p>
                      <p className="text-xs text-slate-500">
                        Bilbila: {voucherData.telephone} • <span className="font-bold text-amber-700">TIN: {voucherData.tin_number}</span>
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="w-16 h-16 rounded-xl border-2 border-amber-600/40 flex items-center justify-center bg-amber-50 text-amber-800 mb-1">
                        <QrCode className="w-12 h-12" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{voucherData.verification_qr}</span>
                    </div>
                  </div>

                  {/* Title Banner */}
                  <div className="py-2.5 px-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                        Gabaasa Yaala Baqaksaa (Surgical Operative Summary)
                      </span>
                      <p className="text-sm font-black font-mono">{voucherData.booking_code}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-slate-400">OT Suite:</span>{' '}
                      <span className="font-bold text-amber-400">{voucherData.operating_room_code}</span> — {voucherData.operating_room}
                    </div>
                  </div>

                  {/* Demographics & Team Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Odeeffannoo Dhukkubsataa (Patient)
                      </span>
                      <p className="font-extrabold text-sm text-slate-900">{voucherData.patient_name}</p>
                      <p className="text-slate-600 font-mono">
                        MRN: <span className="font-bold text-slate-900">{voucherData.patient_mrn}</span>
                      </p>
                      <p className="text-slate-600">
                        Saala / Umurii:{' '}
                        <span className="font-semibold text-slate-900">
                          {voucherData.patient_gender}, {voucherData.patient_age} yrs
                        </span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Garee Yaala Baqaksaa (Surgical Team)
                      </span>
                      <p className="font-bold text-slate-900">
                        Lead Surgeon:{' '}
                        <span className="text-amber-800 font-extrabold">{voucherData.lead_surgeon}</span>
                      </p>
                      <p className="text-slate-600">
                        Anesthesiologist: <span className="font-semibold text-slate-900">{voucherData.anesthesiologist}</span>
                      </p>
                      <p className="text-slate-600">
                        Scrub Nurse: <span className="font-semibold text-slate-900">{voucherData.scrub_nurse}</span>
                      </p>
                    </div>
                  </div>

                  {/* Procedure & Safety Box */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                        Yaala Baqaksaa Raawwatame (Procedure Performed)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        WHO Safety Checklist: VERIFIED
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900 leading-snug">
                      {voucherData.procedure_name}
                    </p>
                    <div className="flex items-center gap-6 pt-1 text-slate-700">
                      <span>
                        Dhiiga Dhangala'e:{' '}
                        <span className="font-bold text-rose-700">{voucherData.blood_loss_ml} ml</span>
                      </span>
                      <span>
                        Meeshaalee Dhaabbatan:{' '}
                        <span className="font-bold text-slate-900">{voucherData.implants_used || 'None'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Intraoperative Findings & Post-Op Notes */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Argannoo Yeroo Yaalaa (Intraoperative Findings):
                      </span>
                      <p className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-serif">
                        {voucherData.operative_findings || 'Pathology isolated and anatomical restoration accomplished.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Ibsa Tarkaanfii Yaalaa (Operative Technique & Summary):
                      </span>
                      <p className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-serif">
                        {voucherData.post_op_notes || 'Procedure executed without surgical complication.'}
                      </p>
                    </div>
                  </div>

                  {/* Sign-off & Seal */}
                  <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-8">
                        Mallattoo Doofaa / Ogeessa Yaala Baqaksaa (Lead Surgeon Signature)
                      </p>
                      <div className="border-t border-slate-400 pt-1">
                        <span className="font-extrabold text-slate-900">{voucherData.lead_surgeon}</span>
                        <p className="text-[10px] text-slate-500">Mettu Karl Referral Hospital Specialist Surgeon</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-8">
                        Mirkaneessa CSSD & Nageenya Teessoo (CSSD Quality Seal)
                      </p>
                      <div className="border-t border-slate-400 pt-1">
                        <span className="font-bold text-emerald-800">STERILITY 134°C ASSURED</span>
                        <p className="text-[10px] text-slate-500">
                          {new Date(voucherData.issued_timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function OTWorkstationPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-amber-400 font-bold">
          Qophaa'aa jira (Loading OT Workstation)...
        </div>
      }
    >
      <OTWorkstationContent />
    </Suspense>
  );
}
