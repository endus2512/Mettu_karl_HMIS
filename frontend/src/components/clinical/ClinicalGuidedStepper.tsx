/**
 * Mettu Karl Comprehensive Specialized Hospital
 * ClinicalGuidedStepper — Universal Guided Step-by-Step Consultation Workflow (Filannoo 1).
 *
 * Designed for Maximum Simplicity & Universal Usability:
 * - Zero Computer Skills Required: Guides anyone step-by-step through consultation.
 * - Step 1: Patient Selection (Dhukkubsataa Filadhu)
 * - Step 2: Vitals & Presenting Complaint (Vitals & Mallattoolee)
 * - Step 3: 1-Tap Clinical Actions (Resephii, Laabii, Ciisicha)
 * - Step 4: Finalize & Summary Voucher (Xumuri & Ragaa Baasi)
 * - Tri-Lingual: Afaan Oromoo ('om'), Amharic ('am'), English ('en').
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation, Language } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';
import {
  User,
  Heart,
  Activity,
  Thermometer,
  Stethoscope,
  Pill,
  FlaskConical,
  Bed,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Printer,
  RotateCcw,
  Check,
  Plus,
} from 'lucide-react';

export interface StepperPatient {
  token: string;
  mrn: string;
  name: string;
  ageGender: string;
  triage: 'red' | 'yellow' | 'green';
  bp: string;
  temp: string;
  spo2: string;
  pulse: string;
  complaint: { om: string; am: string; en: string };
  history: string;
}

const DEMO_STEPPER_PATIENTS: StepperPatient[] = [
  {
    token: 'A-012',
    mrn: 'MKH-2026-000101',
    name: 'Gudeta Hailu Tadesse',
    ageGender: '42 / Dhi (M)',
    triage: 'yellow',
    bp: '125/82',
    temp: '38.9°C',
    spo2: '97%',
    pulse: '92 bpm',
    complaint: {
      om: "Ho'a cimaa, rom'uu fi dhukkubbii buusaa guyyaa 3f",
      am: 'ከፍተኛ ትኩሳት፣ ብርድ ብርድ ማለት እና የመገጣጠሚያ ህመም',
      en: 'High fever, severe rigors & joint pain for 3 days',
    },
    history: 'Known HTN on Enalapril 10mg. Suspected Acute Febrile Illness / Malaria.',
  },
  {
    token: 'A-015',
    mrn: 'MKH-2026-000102',
    name: 'Ayantu Mamo Kassa',
    ageGender: '31 / Dub (F)',
    triage: 'yellow',
    bp: '110/72',
    temp: '37.8°C',
    spo2: '98%',
    pulse: '78 bpm',
    complaint: {
      om: 'Dhukkubbii garaa cimaa fi diddiga yeroo maraa',
      am: 'አጣዳፊ የሆድ ህመም እና ማቅለሽለሽ',
      en: 'Acute epigastric abdominal cramping & recurrent vomiting',
    },
    history: 'No known chronic illness. Suspected PUD / Acute Gastritis.',
  },
  {
    token: 'A-024',
    mrn: 'MKH-2026-000104',
    name: 'Chala Tolera Lemma',
    ageGender: '55 / Dhi (M)',
    triage: 'red',
    bp: '155/98',
    temp: '37.1°C',
    spo2: '93%',
    pulse: '104 bpm',
    complaint: {
      om: "Cobsama qomaa gara ceekuu bitaatti babal'atu fi dafquu",
      am: 'የደረት መወጠር እና ወደ ግራ ትከሻ የሚሰራጭ ህመም',
      en: 'Substernal chest tightness radiating to left shoulder with diaphoresis',
    },
    history: 'Diabetic 8 years. High risk Acute Coronary Syndrome (ACS).',
  },
];

interface QuickPrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  instructions: { om: string; am: string; en: string };
  category: string;
}

const COMMON_PRESCRIPTIONS: QuickPrescriptionItem[] = [
  {
    id: 'rx-1',
    name: 'Paracetamol 500mg Tab',
    dosage: '1 tab PO TID x 3 days',
    instructions: {
      om: 'Kiniinii 1 guyyaatti si\'a 3 nyaata booda (Guyyaa 3f)',
      am: '1 ኪኒን በቀን 3 ጊዜ ከምግብ በኋላ (ለ3 ቀናት)',
      en: '1 tablet 3 times daily after meals for 3 days',
    },
    category: 'Analgesic / Antipyretic',
  },
  {
    id: 'rx-2',
    name: 'Amoxicillin 500mg Cap',
    dosage: '1 cap PO TID x 5 days',
    instructions: {
      om: 'Kabsulii 1 sa\'aatii 8 8n bishaaniin liqimsuu',
      am: '1 ካፕሱል በየ 8 ሰዓቱ በውሃ መዋጥ',
      en: '1 capsule every 8 hours with full glass of water',
    },
    category: 'Antibiotic',
  },
  {
    id: 'rx-3',
    name: 'Coartem (Artemether-Lumefantrine)',
    dosage: '4 tabs PO BID x 3 days',
    instructions: {
      om: 'Kiniinii 4 nyaata soorata zayita qabu wajjin guyyaa 3f',
      am: '4 ኪኒን ከምግብ ጋር በቀን 2 ጊዜ ለ3 ቀናት',
      en: '4 tablets with fatty meal twice daily for 3 days',
    },
    category: 'Antimalarial',
  },
  {
    id: 'rx-4',
    name: 'Omeprazole 20mg Cap',
    dosage: '1 cap PO Daily morning x 14 days',
    instructions: {
      om: 'Kabsulii 1 ganama osoo hin nyaatin daqiiqaa 30 dura',
      am: '1 ካፕሱል ጠዋት ከቁርስ 30 ደቂቃ በፊት',
      en: '1 capsule daily 30 minutes before breakfast',
    },
    category: 'Antacid / PPI',
  },
  {
    id: 'rx-5',
    name: 'ORS + Zinc Sulphate 20mg',
    dosage: '1 sachet in 1L boiled water',
    instructions: {
      om: 'Paakeetii 1 bishaan danfe qabbanaa\'e leetira 1tti dhangalaasuu',
      am: '1 ፓኬት በ1 ሊትር የፈላ ውሃ ውስጥ በጥብጦ መጠጣት',
      en: 'Dissolve 1 sachet in 1L clean boiled water, drink frequently',
    },
    category: 'Rehydration',
  },
];

interface QuickLabItem {
  id: string;
  code: string;
  name: { om: string; am: string; en: string };
  sample: string;
}

const COMMON_LABS: QuickLabItem[] = [
  {
    id: 'lab-1',
    code: 'CBC',
    name: {
      om: 'Qorannoo Dhiiga Guutuu (CBC)',
      am: 'የተሟላ የደም ምርመራ (CBC)',
      en: 'Complete Blood Count (CBC)',
    },
    sample: 'Whole Blood (EDTA)',
  },
  {
    id: 'lab-2',
    code: 'MAL-BF',
    name: {
      om: 'Qorannoo Busaa Dhiigaa (Blood Film / RDT)',
      am: 'የወባ የደም ምርመራ (Blood Film / RDT)',
      en: 'Malaria Blood Film & Rapid Test',
    },
    sample: 'Capillary / Venous Blood',
  },
  {
    id: 'lab-3',
    code: 'U/A',
    name: {
      om: 'Qorannoo Fincaanii Guutuu (Urinalysis)',
      am: 'የሽንት ምርመራ (Urinalysis)',
      en: 'Routine Urinalysis (Dipstick & Micro)',
    },
    sample: 'Midstream Urine',
  },
  {
    id: 'lab-4',
    code: 'TROP-I',
    name: {
      om: 'Qorannoo Onnee (Troponin-I / ECG)',
      am: 'የትሮፖኒን የልብ ምርመራ (Troponin-I)',
      en: 'Cardiac Troponin-I Rapid Screen',
    },
    sample: 'Serum / Plasma',
  },
];

interface ClinicalGuidedStepperProps {
  onComplete?: (patientMrn: string) => void;
  onClose?: () => void;
}

export function ClinicalGuidedStepper({ onComplete, onClose }: ClinicalGuidedStepperProps): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language = language === 'om' || language === 'am' || language === 'en' ? language : 'om';

  // Stepper State: 1 = Patient Select, 2 = Review Vitals, 3 = Actions/Orders, 4 = Finalize
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPatient, setSelectedPatient] = useState<StepperPatient>(DEMO_STEPPER_PATIENTS[0]);
  const [selectedRxs, setSelectedRxs] = useState<string[]>(['rx-1']);
  const [selectedLabs, setSelectedLabs] = useState<string[]>(['lab-2']);
  const [admitToWard, setAdmitToWard] = useState<boolean>(false);
  const [doctorNotes, setDoctorNotes] = useState<string>('Patient assessed. Treatment regimen initiated.');
  const [isFinalized, setIsFinalized] = useState<boolean>(false);

  // Step 1: Select patient & go to Step 2
  const handleSelectPatient = (patient: StepperPatient) => {
    setSelectedPatient(patient);
    setCurrentStep(2);
  };

  const toggleRx = (id: string) => {
    setSelectedRxs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleLab = (id: string) => {
    setSelectedLabs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleFinalizeConsultation = () => {
    setIsFinalized(true);
    notifications.show({
      title: lang === 'om' ? 'Yaalli Milkaa\'inaan Xumurameera!' : lang === 'am' ? 'ምርመራው በተሳካ ሁኔታ ተጠናቋል!' : 'Consultation Finalized Successfully!',
      message:
        lang === 'om'
          ? `Dhukkubsataa ${selectedPatient.name} tiif qorichi fi laabiin battalatti qophaa'eera.`
          : `Orders and prescriptions dispatched for ${selectedPatient.name}.`,
      color: 'teal',
      icon: <CheckCircle2 className="w-5 h-5" />,
      autoClose: 4000,
    });
    if (onComplete) {
      onComplete(selectedPatient.mrn);
    }
  };

  const resetStepper = () => {
    setCurrentStep(1);
    setSelectedRxs(['rx-1']);
    setSelectedLabs(['lab-2']);
    setAdmitToWard(false);
    setIsFinalized(false);
  };

  return (
    <div className="rounded-3xl bg-[#0c121e] border border-slate-800 shadow-2xl p-4 sm:p-6 lg:p-7 space-y-6 text-white transition-all">
      {/* 1. STEPPER PROGRESS BAR HEADER */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-950/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>
                  {lang === 'om'
                    ? 'Qajeelcha Yaalaa Salphaa (Guided Clinical Stepper)'
                    : lang === 'am'
                    ? 'ቀላል ደረጃ በደረጃ የህክምና መመሪያ'
                    : 'Universal Guided Consultation Stepper'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold border border-teal-500/30">
                  STEP {currentStep} OF 4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'om'
                  ? 'Adeemsa qulqulluu fi salphaa sadarkaa 4n yaala dhukkubsataa xumuraa'
                  : 'Intuitive 4-step workflow designed for effortless clinical consultations'}
              </p>
            </div>
          </div>

          {/* Quick Step Indicators */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {[1, 2, 3, 4].map((step) => {
              const isActive = currentStep === step;
              const isPassed = currentStep > step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setCurrentStep(step as 1 | 2 | 3 | 4)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-md scale-105'
                      : isPassed
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                      : 'bg-[#151c2c] text-slate-500 border border-slate-800'
                  }`}
                >
                  <span>{step}</span>
                  {isPassed && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Line Progress Bar */}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* STEP 1: PATIENT SELECTION                                         */}
      {/* ================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-smooth-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>{lang === 'om' ? 'Dhukkubsataa Dabaree Irra Jiru Filadhu' : 'Select Patient from Live Queue'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'om' ? 'Dhukkubsataa qorachuuf qabduu tokko qofa cuqaasi' : 'Tap on a patient to begin consultation'}
              </p>
            </div>
            <span className="text-xs text-teal-400 font-mono font-bold">
              {DEMO_STEPPER_PATIENTS.length} Waiting
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEMO_STEPPER_PATIENTS.map((patient) => {
              const isSelected = selectedPatient.mrn === patient.mrn;
              return (
                <div
                  key={patient.mrn}
                  onClick={() => handleSelectPatient(patient)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative group ${
                    isSelected
                      ? 'bg-gradient-to-br from-teal-950/40 via-[#101928] to-[#0c121e] border-teal-400 shadow-xl shadow-teal-950/30'
                      : 'bg-[#101624] border-slate-800/80 hover:border-slate-700 hover:bg-[#141b2c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {patient.token}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        patient.triage === 'red'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {patient.triage} triage
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                      {patient.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {patient.mrn} • {patient.ageGender}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090d15] border border-slate-800/60 text-xs text-slate-300">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                      {lang === 'om' ? 'Komiin:' : 'Complaint:'}
                    </span>
                    <p className="line-clamp-2 leading-relaxed">
                      {patient.complaint[lang]}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-mono">
                      BP: <strong className="text-white">{patient.bp}</strong> • T: <strong className="text-amber-300">{patient.temp}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 group-hover:translate-x-1 transition-transform">
                      <span>{lang === 'om' ? 'Filadhu' : 'Select'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 2: REVIEW VITALS & PRESENTING COMPLAINT                       */}
      {/* ================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-smooth-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>{lang === 'om' ? 'Vitals & Mallattoolee Dhukkubaa Ilaali' : 'Review Vitals & Symptoms'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {selectedPatient.name} ({selectedPatient.mrn})
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">
              Token {selectedPatient.token}
            </span>
          </div>

          {/* Vitals Summary Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#101726] border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>Dhiibbaa Dhiigaa (BP)</span>
              </div>
              <p className="text-lg font-black font-mono text-white">{selectedPatient.bp}</p>
              <span className="text-[10px] text-emerald-400 font-medium">Normal / Checked</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#101726] border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Ho'a Qaamaa (Temp)</span>
              </div>
              <p className="text-lg font-black font-mono text-amber-300">{selectedPatient.temp}</p>
              <span className="text-[10px] text-rose-400 font-medium">Elevated Fever</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#101726] border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Heart className="w-3.5 h-3.5 text-teal-400" />
                <span>SpO2 (Oxygen)</span>
              </div>
              <p className="text-lg font-black font-mono text-teal-300">{selectedPatient.spo2}</p>
              <span className="text-[10px] text-teal-400 font-medium">Optimal Saturation</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#101726] border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rukuttaa Onnee (Pulse)</span>
              </div>
              <p className="text-lg font-black font-mono text-white">{selectedPatient.pulse}</p>
              <span className="text-[10px] text-slate-400 font-medium">Rhythm Regular</span>
            </div>
          </div>

          {/* Chief Complaint Details */}
          <div className="p-4 rounded-2xl bg-[#101624] border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              {lang === 'om' ? 'Komiin Dhukkubsataa fi Seenaa Yaalaa:' : 'Chief Presenting Complaint & History:'}
            </span>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              "{selectedPatient.complaint[lang]}"
            </p>
            <p className="text-xs text-slate-400 pt-1 border-t border-slate-800">
              <strong>Seenaa Dabalataa:</strong> {selectedPatient.history}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === 'om' ? 'Gara Dhukkubsattootaatti' : 'Back to Patient List'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 text-xs font-black shadow-lg shadow-teal-950/40 cursor-pointer transition active:scale-95"
            >
              <span>{lang === 'om' ? 'Qoricha & Laabii Filadhu' : 'Proceed to Orders & Prescriptions'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 3: 1-TAP CLINICAL ACTIONS (PRESCRIPTIONS & LABS)             */}
      {/* ================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-smooth-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>{lang === 'om' ? 'Qoricha fi Qorannoo Laabii Cuqaasa Tokkoon Ajaji' : 'One-Tap Prescriptions & Lab Orders'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'om' ? 'Wanta ajajuu barbaaddu irratti cuqaasaa (Checkboxes)' : 'Select medications and lab panels with a single click'}
              </p>
            </div>
            <span className="text-xs text-teal-400 font-mono font-bold">
              {selectedRxs.length} Rx • {selectedLabs.length} Labs
            </span>
          </div>

          {/* Quick Prescriptions Grid */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              <span>{lang === 'om' ? '1. Qoricha Baasi (Prescriptions):' : '1. Select Prescriptions:'}</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {COMMON_PRESCRIPTIONS.map((rx) => {
                const isChecked = selectedRxs.includes(rx.id);
                return (
                  <div
                    key={rx.id}
                    onClick={() => toggleRx(rx.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 select-none ${
                      isChecked
                        ? 'bg-amber-500/15 border-amber-400/80 text-white shadow-md'
                        : 'bg-[#101624] border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{rx.name}</span>
                      <div
                        className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-amber-500 border-amber-400 text-slate-950 font-black' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-300/90 font-mono">{rx.dosage}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{rx.instructions[lang]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Lab Panels Grid */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>{lang === 'om' ? '2. Ajaja Qorannoo Laabii (Laboratory Tests):' : '2. Select Lab Panels:'}</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {COMMON_LABS.map((lab) => {
                const isChecked = selectedLabs.includes(lab.id);
                return (
                  <div
                    key={lab.id}
                    onClick={() => toggleLab(lab.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 select-none ${
                      isChecked
                        ? 'bg-cyan-500/15 border-cyan-400/80 text-white shadow-md'
                        : 'bg-[#101624] border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-cyan-300">{lab.code}</span>
                      <div
                        className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{lab.name[lang]}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{lab.sample}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inpatient Ward Admission Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#101624] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Bed className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {lang === 'om' ? 'Kutaa Ciisichaatti Galmeessi (Admit to Ward)?' : 'Inpatient Admission Needed?'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === 'om' ? 'Dhukkubsataan kun siree akka qabatu yoo barbaaddan mirkaneessaa' : 'Flag patient for bed allocation in Medical Ward'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAdmitToWard(!admitToWard)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                admitToWard
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {admitToWard ? '✓ ADMIT ACTIVE' : '+ ADMIT'}
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === 'om' ? 'Gara Vitals' : 'Back to Vitals'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 text-xs font-black shadow-lg shadow-teal-950/40 cursor-pointer transition active:scale-95"
            >
              <span>{lang === 'om' ? 'Gara Xumuraatti (Review & Finalize)' : 'Review & Finalize Consultation'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 4: REVIEW & FINALIZE CONSULTATION                            */}
      {/* ================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-smooth-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold">4</span>
                <span>{lang === 'om' ? 'Yaala Mirkaneessi & Ragaa Baasi' : 'Final Review & Order Dispatch'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'om' ? 'Ajajoota qophaa\'an mirkaneessaa, cuqaasa tokkoon xumuraa' : 'Verify orders and click Finalize to dispatch to Pharmacy & Lab'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Ready to Dispatch
            </span>
          </div>

          {/* Consultation Summary Voucher */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#090d15] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-black text-white">{selectedPatient.name}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  MRN: <strong className="text-amber-300">{selectedPatient.mrn}</strong> • Token: {selectedPatient.token}
                </p>
              </div>
              <span className="text-xs font-bold text-teal-400 bg-teal-500/15 border border-teal-500/30 px-2.5 py-1 rounded-xl">
                OPD Completed Case
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-amber-400 block uppercase text-[11px]">
                  {lang === 'om' ? 'Qorichoota Ajajaman:' : 'Prescriptions Dispatched:'}
                </span>
                {selectedRxs.length === 0 ? (
                  <p className="text-slate-500">No medications selected.</p>
                ) : (
                  <ul className="space-y-1 text-slate-300">
                    {selectedRxs.map((id) => {
                      const item = COMMON_PRESCRIPTIONS.find((p) => p.id === id);
                      return item ? (
                        <li key={id} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{item.name} ({item.dosage})</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-cyan-400 block uppercase text-[11px]">
                  {lang === 'om' ? 'Qorannoo Laabii Ajajaman:' : 'Laboratory Panels Dispatched:'}
                </span>
                {selectedLabs.length === 0 ? (
                  <p className="text-slate-500">No laboratory panels selected.</p>
                ) : (
                  <ul className="space-y-1 text-slate-300">
                    {selectedLabs.map((id) => {
                      const item = COMMON_LABS.find((l) => l.id === id);
                      return item ? (
                        <li key={id} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{item.name[lang]}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>
            </div>

            {admitToWard && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <Bed className="w-4 h-4 shrink-0" />
                <span>Patient marked for immediate admission to Medical Inpatient Ward.</span>
              </div>
            )}
          </div>

          {/* Action Finalization Bar */}
          {!isFinalized ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition w-full sm:w-auto justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{lang === 'om' ? 'Gara Qorichaa Deebi\'i' : 'Back to Orders'}</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeConsultation}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/50 cursor-pointer transition active:scale-95 w-full sm:w-auto"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{lang === 'om' ? '✓ Yaala Xumuri & Resephii Baasi' : '✓ Finalize & Dispatch Consultation'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-3">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500 text-slate-950 shadow-lg">
                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  {lang === 'om' ? 'Yaalli Dhukkubsataa Kun Xumurameera!' : 'Consultation Successfully Completed!'}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Resephiin gara Faarmaasiitti, qorannoon gara Laaboraatoriitti ergameera.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'om' ? 'Waraqaa Resephii Maxxansi' : 'Print Voucher'}</span>
                </button>

                <button
                  type="button"
                  onClick={resetStepper}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black cursor-pointer transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{lang === 'om' ? 'Dhukkubsataa Itti Aanu Qori' : 'Next Patient Consultation'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
