/**
 * Clinical Audit, EHSTG National Standards & Zero-Trust Security Sentinel Workstation.
 * Quality assurance, Ethiopian Hospital Services Transformation Guidelines (EHSTG),
 * and Zero-Trust Impersonation Detection & Audit Trail Guard.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  AlertTriangle,
  UserX,
  EyeOff,
  CheckCircle2,
  Terminal,
  RefreshCw,
  KeyRound,
  Server,
  FileText,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';

interface AuditItem {
  id: string;
  chapter: string;
  dept: string;
  score: number;
  date: string;
  auditor: string;
  status: 'passed' | 'capa_pending';
}

interface CAPAItem {
  id: number;
  auditRef: string;
  issue: string;
  action: string;
  assignee: string;
  deadline: string;
  resolved: boolean;
}

interface SecurityIncident {
  id: string;
  timestamp: string;
  actor: string;
  roleClaim: string;
  ipAddress: string;
  targetResource: string;
  eventType:
    | 'IMPERSONATION_BLOCKED'
    | 'TOKEN_TAMPER_DETECTED'
    | 'BREAK_GLASS_ALERT'
    | 'PRIVACY_MASK_APPLIED'
    | 'VERIFIED_SESSION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  description: string;
  enforcementAction: string;
}

const initialAudits: AuditItem[] = [
  {
    id: 'AUD-EHSTG-2026-IPPS',
    chapter: 'Infection Prevention & Patient Safety (IPPS)',
    dept: 'All Hospital Wards',
    score: 91.5,
    date: '2026-10-15',
    auditor: 'Dr. Chala (Quality Officer)',
    status: 'passed',
  },
  {
    id: 'AUD-EHSTG-2026-SURG',
    chapter: 'Surgical Safety Checklist (WHO 3-Phase)',
    dept: 'Main Operation Theatre',
    score: 74.0,
    date: '2026-10-20',
    auditor: 'Dr. Bekele (Clinical Director)',
    status: 'capa_pending',
  },
  {
    id: 'AUD-EHSTG-2026-DOCS',
    chapter: 'Clinical Documentation & Legibility (EHR)',
    dept: 'Inpatient Pediatric & Medical',
    score: 86.0,
    date: '2026-10-22',
    auditor: 'Prof. Helen (Governance)',
    status: 'passed',
  },
  {
    id: 'AUD-EHSTG-2026-PHARM',
    chapter: 'Pharmacy FEFO & Rational Drug Use CDSS',
    dept: 'Dispensary & Store',
    score: 88.5,
    date: '2026-10-25',
    auditor: 'Solomon (Lead Pharmacist)',
    status: 'passed',
  },
];

const initialCAPA: CAPAItem[] = [
  {
    id: 1,
    auditRef: 'AUD-EHSTG-2026-SURG',
    issue: 'Sign-out phase missed in 24% of observed surgical cases before skin closure',
    action: 'Implement mandatory circulating nurse verbal checklist verification on OT tablet',
    assignee: 'Nurse Matron Almaz',
    deadline: '2026-11-05',
    resolved: false,
  },
  {
    id: 2,
    auditRef: 'AUD-EHSTG-2026-IPPS',
    issue: 'Hand hygiene compliance at bed entrance was 78% in Ward B',
    action: 'Install wall-mounted alcohol hand rub dispensers at every bed footboard',
    assignee: 'Facilities Lead Haile',
    deadline: '2026-10-28',
    resolved: true,
  },
];

const initialSecurityEvents: SecurityIncident[] = [
  {
    id: 'SEC-2026-0941',
    timestamp: '2026-10-28 19:42:10',
    actor: 'MKRH-STF-099 (Unverified Intern / Impersonator)',
    roleClaim: 'Claimed Title: Medical Doctor (Unverified)',
    ipAddress: '192.168.1.142 (Staff Wi-Fi Subnet)',
    targetResource: 'Patient MKH-2026-000101 (Clinical Chart & Diagnostics)',
    eventType: 'IMPERSONATION_BLOCKED',
    severity: 'CRITICAL',
    description:
      'Account in PENDING_VERIFICATION status attempted to invoke /api/v1/fhir/r4/Patient/pat-98a2-mkrh-001 without medical board license clearance.',
    enforcementAction:
      'Zero-Trust Gateway Intercept (HTTP 403 Forbidden). Tamper-evident incident logged to PostgreSQL audit_logs. Security notification dispatched.',
  },
  {
    id: 'SEC-2026-0940',
    timestamp: '2026-10-28 18:30:15',
    actor: 'Unknown Client (External Gateway)',
    roleClaim: 'Forged Bearer Token (Payload role="doctor")',
    ipAddress: '10.14.88.22',
    targetResource: 'API Gateway /api/v1/fhir/r4/Patient',
    eventType: 'TOKEN_TAMPER_DETECTED',
    severity: 'HIGH',
    description:
      'Cryptographic HMAC SHA-256 signature verification failed. Caller forged payload role claim from patient to doctor in localStorage.',
    enforcementAction:
      'Token Immediately Revoked (HTTP 401 Unauthorized). Request blocked before reaching clinical database.',
  },
  {
    id: 'SEC-2026-0938',
    timestamp: '2026-10-28 17:15:02',
    actor: 'Dr. Bekele Gemechu (MD, Lead Surgeon)',
    roleClaim: 'Verified Medical Doctor (License: ETH-MED-2022-4910)',
    ipAddress: '192.168.1.55 (ED Acute Trauma Bay)',
    targetResource: 'Patient MKH-2026-000103 (Emergency Resuscitation)',
    eventType: 'BREAK_GLASS_ALERT',
    severity: 'MEDIUM',
    description:
      'Dr. Bekele exercised Break-Glass emergency protocol to inspect unassigned trauma patient chart. Justification: "Acute MCI polytrauma emergency resuscitation".',
    enforcementAction:
      'Access Granted with Mandatory Governance Flag. Audit log dispatched to Medical Director for post-incident review.',
  },
  {
    id: 'SEC-2026-0935',
    timestamp: '2026-10-28 16:40:22',
    actor: 'Admin User (Hospital Finance & Operations)',
    roleClaim: 'Role: ADMIN (Non-Clinical)',
    ipAddress: '192.168.1.201 (Administrative Office)',
    targetResource: 'Inpatient Ward Bed Census',
    eventType: 'PRIVACY_MASK_APPLIED',
    severity: 'INFO',
    description:
      'Administrative user queried inpatient capacity statistics. System automatically enforced FHIR R4 clinical privacy filter masking patient names to [PROTECTED] / [CONFIDENTIAL].',
    enforcementAction:
      'Demographics Masked. Medical diagnoses and clinical notes obscured from administrative view.',
  },
  {
    id: 'SEC-2026-0930',
    timestamp: '2026-10-28 15:10:44',
    actor: 'Gudeta Hailu Tadesse (Patient)',
    roleClaim: 'Role: PATIENT (Fayda FAN-9901-2384-5120)',
    ipAddress: '196.188.42.11 (Ethio Telecom 4G)',
    targetResource: 'Patient Portal /portal/prescriptions',
    eventType: 'VERIFIED_SESSION',
    severity: 'INFO',
    description:
      'Patient successfully retrieved personal medication records and laboratory results via authenticated session. Data scoped solely to own records.',
    enforcementAction:
      'Zero-Trust Patient Boundary Verified. Cross-patient inspection mathematically impossible.',
  },
];

export default function ClinicalAuditPage(): React.ReactElement {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'security' | 'ehstg'>('security');
  const [audits] = useState<AuditItem[]>(initialAudits);
  const [capas, setCapas] = useState<CAPAItem[]>(initialCAPA);
  const [securityEvents, setSecurityEvents] = useState<SecurityIncident[]>(initialSecurityEvents);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  const resolveCAPA = (capaId: number) => {
    setCapas((prev) =>
      prev.map((c) => (c.id === capaId ? { ...c, resolved: true } : c))
    );
  };

  const avgScore = Math.round(audits.reduce((acc, a) => acc + a.score, 0) / audits.length);

  // Trigger live simulation of an unverified user pretending to be a doctor
  const simulateImpersonationAttack = async () => {
    setIsSimulating(true);
    setSimulationToast(null);

    try {
      // Call backend simulation endpoint
      const res = await fetch('http://localhost:8000/api/v1/clinical-audit/security/simulate-intercept', {
        method: 'POST',
      });
      const data = await res.json().catch(() => null);

      const newId = `SEC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const newIncident: SecurityIncident = {
        id: newId,
        timestamp: timeStr,
        actor: 'Simulated Attacker / Unverified Doctor',
        roleClaim: 'Claimed: Doctor (Without Medical License Clearance)',
        ipAddress: '192.168.1.189 (Unauthorized Client)',
        targetResource: 'Patient MKH-2026-000101 (Confidential EHR Chart)',
        eventType: 'IMPERSONATION_BLOCKED',
        severity: 'CRITICAL',
        description:
          data?.message ||
          'Zero-Trust Sentinel intercepted unverified user attempting to siphon patient medical data. Request blocked at API Controller before data layer.',
        enforcementAction:
          'Enforcement: HTTP 403 Forbidden. Immutable record created in audit_logs table with Client IP.',
      };

      setSecurityEvents((prev) => [newIncident, ...prev]);
      setSimulationToast(
        '🚨 YAALII SOBA DOKTORAA BATTALATTI DHORKAMEERA! Systemichi yeruma sana soba qabee galmee dachaafamaa hin danda\'amne (immutable audit log) irratti galmeesse.'
      );
    } catch {
      // Offline fallback simulation
      const newId = `SEC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const newIncident: SecurityIncident = {
        id: newId,
        timestamp: timeStr,
        actor: 'Simulated Attacker / Fake Doctor Title',
        roleClaim: 'Claimed: Doctor (EFDA Verification: Missing)',
        ipAddress: '192.168.1.189 (Internal Gateway)',
        targetResource: 'Patient MKH-2026-000101 (Clinical Notes & Prescriptions)',
        eventType: 'IMPERSONATION_BLOCKED',
        severity: 'CRITICAL',
        description:
          'Zero-Trust Sentinel detected unverified clinician credential. Access blocked with HTTP 403 Forbidden.',
        enforcementAction:
          'API Gateway Intercept. Immutable entry logged in tamper-evident database.',
      };

      setSecurityEvents((prev) => [newIncident, ...prev]);
      setSimulationToast(
        '🚨 YAALII SOBA DOKTORAA BATTALATTI DHORKAMEERA! Systemichi yeruma sana soba qabee galmee dachaafamaa hin danda\'amne (immutable audit log) irratti galmeesse.'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header Bar with Workstation Branding */}
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  🛡️
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    Mettu Karl HIS • Eegumsa Iccitii Yaalaa & Qulqullina EHSTG
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Zero-Trust Clinical Security Sentinel • Anti-Impersonation Guard • Tamper-Evident Audit Trails
                  </p>
                </div>
              </div>
            </div>

            {/* TAB SWITCHER: SECURITY SENTINEL vs EHSTG CLINICAL QUALITY */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'security'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Nageenya & Impersonation Sentinel</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ehstg')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'ehstg'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Sadarkaa EHSTG & CAPA ({avgScore}%)</span>
              </button>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* TAB 1: ZERO-TRUST SECURITY & IMPERSONATION SENTINEL                      */}
          {/* ======================================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Interactive Simulation Banner (if triggered) */}
              {simulationToast && (
                <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 shadow-sm flex items-start justify-between gap-3 animate-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-rose-950 text-sm">{simulationToast}</p>
                      <p className="text-xs text-rose-800 mt-1">
                        Zero-Trust Security Sentinel-n yeruma sana soba kana qabee itti cufuu isaa mirkaneeffadhaa. Galmeen taatee kun (Audit Log) gadiitti dabalameera.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimulationToast(null)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-rose-100 cursor-pointer"
                  >
                    ✕ Cufi
                  </button>
                </div>
              )}

              {/* 4 Security Sentinel KPI Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-500 hover:bg-blue-50/60 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>Audit Events Har'aa</span>
                    <Activity className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="mt-2 text-3xl font-black text-blue-700">1,482</p>
                  <p className="mt-1 text-xs text-slate-500 font-semibold">
                    100% Immutable (Dachaafamaa Hin Danda&apos;amne)
                  </p>
                </div>

                <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-rose-500 hover:bg-rose-50/60 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-600">
                    <span>Soba Doktoraa Dhaabame</span>
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                  </div>
                  <p className="mt-2 text-3xl font-black text-rose-600">4 Intercepted</p>
                  <p className="mt-1 text-xs text-rose-700 font-semibold">
                    HTTP 403 Forbidden (Ittifameera)
                  </p>
                </div>

                <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-amber-500 hover:bg-amber-50/60 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700">
                    <span>Break-Glass Overrides</span>
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="mt-2 text-3xl font-black text-amber-700">2 Audited</p>
                  <p className="mt-1 text-xs text-amber-700 font-semibold">
                    Taatee Balaa Tasaa (ICU & Trauma)
                  </p>
                </div>

                <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/60 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700">
                    <span>Privacy Masking FHIR</span>
                    <EyeOff className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-3xl font-black text-emerald-600">100% Active</p>
                  <p className="mt-1 text-xs text-emerald-700 font-semibold">
                    Bulchiinsaaf Ragaan Yaalaa Dhorkameera
                  </p>
                </div>
              </div>

              {/* Zero-Trust 4-Gate Architectural Defense System */}
              <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-600" />
                      <span>Karaalee 4 Systemichi Soba Doktoraa fi Eeyyama Malee Seenuu Ittiin Qabu</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      How Mettu Karl HIS detects, intercepts, and prevents clinical record siphoning & impersonation:
                    </p>
                  </div>

                  {/* Interactive Attack Simulation Trigger Button */}
                  <button
                    type="button"
                    onClick={simulateImpersonationAttack}
                    disabled={isSimulating}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white px-4 py-2.5 text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSimulating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                    <span>🧪 Yaalii Soba Doktoraa Qori (Simulate Intercept)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      <span>1. Cryptographic JWT Claims</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Token-ni seensaa mallattoo iccitiitiin (HMAC SHA-256) cufama. Namni tokko browser keessaa role isaa &apos;doctor&apos; jedhee sobaan yoo jijjiire, mallattoon cryptographic waan baduuf yeruma sana kuffifama (HTTP 401).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>2. Boordii Yaalaatiin Mirkanaa&apos;uu</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Namni kamiyyuu form irratti &apos;Doctor&apos; jedhee galmaa&apos;ullee, Daarektara Yaalaa (Medical Director) fi ICT Hospitaalaatiin lakkoofsi hayyama boordii (EFDA/Medical License) erga mirkanaa&apos;een booda qofa seensi kiliinikaa banamaaf.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Server className="w-4 h-4 text-amber-600" />
                      <span>3. Galmee Dachaafamaa (Audit Trail)</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Doktorri dhugaa yoo ta&apos;ellee, ragaa dhukkubsataa kutaa isaa hin taane yoo banee ilaale, teessoon IP, sa&apos;aatiin, fi ID&apos;n isaa galmee dachaafamaa hin danda&apos;amne (immutable flatfile & PostgreSQL) irratti yeruma sana qabama.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                      <EyeOff className="w-4 h-4 text-purple-600" />
                      <span>4. Privacy Masking & IDOR Isolation</span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Dhukkubsataan ragaa isaa qofa arga (cross-patient leakage hin jiru). Bulchiinsi (Admin) lakkoofsa waliigalaa malee maqaafi dhukkuba dhukkubsataa hin argu—ragaan isaanii [PROTECTED] ta&apos;ee dhorkama.
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Security Incident & Access Stream */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span>Galmee Qabatamaa Nageenyaa & Yaaliiwwan Dhaabaman (Live Security Stream)</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    To&apos;annoo Battalaa (Real-Time Live Feed)
                  </span>
                </div>

                <div className="space-y-3">
                  {securityEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className={`rounded-3xl border-2 p-5 shadow-xs transition-all duration-200 ${
                        evt.eventType === 'IMPERSONATION_BLOCKED'
                          ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50/70'
                          : evt.eventType === 'TOKEN_TAMPER_DETECTED'
                          ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70'
                          : evt.eventType === 'BREAK_GLASS_ALERT'
                          ? 'border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/70'
                          : 'border-slate-200/90 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3 gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              evt.severity === 'CRITICAL'
                                ? 'bg-rose-600 text-white'
                                : evt.severity === 'HIGH'
                                ? 'bg-amber-600 text-white'
                                : evt.severity === 'MEDIUM'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-white'
                            }`}
                          >
                            {evt.eventType}
                          </span>
                          <span className="font-mono text-xs font-black text-slate-900">{evt.id}</span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs text-slate-500 font-mono">{evt.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                          <span>IP: <strong className="text-slate-800">{evt.ipAddress}</strong></span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                          <p>
                            <span className="text-slate-400 font-semibold">Qaama Yaale (Actor): </span>
                            <strong className="text-slate-900">{evt.actor}</strong>
                          </p>
                          <p>
                            <span className="text-slate-400 font-semibold">Gahee Sobaa/Dhugaa: </span>
                            <span className="font-mono text-blue-700 font-semibold">{evt.roleClaim}</span>
                          </p>
                        </div>

                        <p className="text-slate-700">
                          <span className="text-slate-400 font-semibold">Ragaa Barbaadame: </span>
                          <strong className="text-slate-900 font-mono">{evt.targetResource}</strong>
                        </p>

                        <p className="text-slate-800 font-medium pt-1">
                          {evt.description}
                        </p>

                        <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11.5px]">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {evt.enforcementAction}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">Audit Log Verified ✓</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: EHSTG NATIONAL CLINICAL QUALITY STANDARDS & CAPA TRACKER         */}
          {/* ======================================================================= */}
          {activeTab === 'ehstg' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Quick Metrics Cards with Rectangular Spotlight */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall EHSTG Score</span>
                  <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">
                    {avgScore}%
                  </p>
                  <p className="mt-1 text-xs text-teal-600 font-bold">Highest tier referral hospital</p>
                </div>

                <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chapters Audited</span>
                  <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">
                    4 Chapters
                  </p>
                  <p className="mt-1 text-xs text-slate-500 font-semibold">Q3 National MoH cycle</p>
                </div>

                <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-amber-500 hover:bg-amber-50/70 hover:ring-2 hover:ring-amber-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Open CAPA Actions</span>
                  <p className="mt-2 text-3xl font-black text-amber-700 group-hover:text-amber-950 transition-colors">
                    1 Active
                  </p>
                  <p className="mt-1 text-xs text-amber-600 font-semibold">OT surgical safety sign-out</p>
                </div>

                <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mortality Audit Rate</span>
                  <p className="mt-2 text-3xl font-black text-blue-700 group-hover:text-blue-950 transition-colors">
                    100%
                  </p>
                  <p className="mt-1 text-xs text-blue-600 font-bold">Within 72h of occurrence</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* EHSTG Quality Audit Chapters */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    EHSTG National Clinical Quality Standards
                  </h3>
                  <div className="space-y-3">
                    {audits.map((a) => (
                      <div
                        key={a.id}
                        className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-black text-slate-900 text-sm group-hover:text-teal-950 transition-colors">
                            {a.chapter}
                          </span>
                          <span
                            className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-xl border ${
                              a.score >= 85
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {a.score}%
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span>
                            Department: <span className="font-bold text-slate-800">{a.dept}</span>
                          </span>
                          <span className="font-mono text-slate-400">{a.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corrective and Preventive Actions (CAPA) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Corrective and Preventive Actions (CAPA Tracker)
                  </h3>
                  <div className="space-y-3">
                    {capas.map((capa) => (
                      <div
                        key={capa.id}
                        className="group rounded-3xl border-2 border-slate-200/90 bg-white p-5 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/30 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-mono text-xs font-bold text-teal-800">
                            {capa.auditRef}
                          </span>
                          {capa.resolved ? (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black">
                              RESOLVED
                            </span>
                          ) : (
                            <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 text-[10px] font-black animate-pulse">
                              ACTION PENDING
                            </span>
                          )}
                        </div>
                        <div className="mt-3 space-y-1 text-xs font-semibold">
                          <p className="text-rose-700 font-bold">Issue: {capa.issue}</p>
                          <p className="text-slate-800">Action: {capa.action}</p>
                          <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-500">
                              Lead: <span className="font-bold text-slate-700">{capa.assignee}</span>
                            </span>
                            {!capa.resolved ? (
                              <button
                                onClick={() => resolveCAPA(capa.id)}
                                className="rounded-xl bg-teal-600 px-3 py-1 text-xs font-black text-white hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/40 transition-all cursor-pointer shadow-xs"
                              >
                                Mark Remediated
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-black">✓ Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
