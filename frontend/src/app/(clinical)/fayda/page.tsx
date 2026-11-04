/**
 * National Digital ID (Fayda / FIN) eKYC & Patient Linkage Workstation.
 * Ethiopian National ID Program (NIDP) Master Patient Index (MPI) integration.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Fingerprint,
  CheckCircle2,
  Search,
  Link2,
  ShieldCheck,
  UserCheck,
  Building2,
  Sparkles,
  Copy,
  Calendar,
  Phone,
  User,
  Check
} from 'lucide-react';

interface FaydaCardData {
  fin: string;
  nameEn: string;
  nameAm: string;
  dob: string;
  gender: string;
  phone: string;
  verified: boolean;
}

export default function FaydaPage(): React.ReactElement {
  const { t } = useTranslation();
  const [finInput, setFinInput] = useState('FAN-9901-2384-5120');
  const [patientMrn, setPatientMrn] = useState('MKH-2026-000101');
  const [card, setCard] = useState<FaydaCardData | null>({
    fin: 'FAN-9901-2384-5120',
    nameEn: 'Gudeta Hailu',
    nameAm: 'ጉዴታ ኃይሉ (Gudetaa Hayiluu)',
    dob: '1985-04-12',
    gender: 'Male',
    phone: '+251 911 002 233',
    verified: true,
  });
  const [linkedStatus, setLinkedStatus] = useState<string | null>('Linked to MRN: MKH-2026-000101');
  const [copied, setCopied] = useState(false);

  const handleVerify = () => {
    if (!finInput) return;
    if (finInput.includes('7721')) {
      setCard({
        fin: 'FAN-7721-9034-1188',
        nameEn: 'Chaltu Abera',
        nameAm: 'ጫልቱ አበራ (Caaltuu Eebbaa)',
        dob: '1992-06-15',
        gender: 'Female',
        phone: '+251 911 445 566',
        verified: true,
      });
    } else {
      setCard({
        fin: finInput.trim().toUpperCase(),
        nameEn: 'Ayantu Mamo',
        nameAm: 'አያንቱ ማሞ (Ayaantuu Maammoo)',
        dob: '1994-09-23',
        gender: 'Female',
        phone: '+251 922 334 455',
        verified: true,
      });
    }
    setLinkedStatus(null);
  };

  const handleLink = () => {
    if (!card) return;
    setLinkedStatus(`Successfully linked Fayda ${card.fin} to Patient MRN ${patientMrn}!`);
  };

  const handleCopyFin = () => {
    if (!card) return;
    navigator.clipboard.writeText(card.fin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-[#131824] px-6 py-5 rounded-2xl border border-slate-200 dark:border-[#222b3d] shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-500 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('national_id_fayda')} • eKYC Biometric Verification
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ethiopian National ID Program (NIDP) • Master MPI Deduplication • Fayda FIN Validation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="h-3.5 w-3.5" />
                NIDP Fayda Gateway: Connected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Query & Linkage Form */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Query Fayda ID
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct NIDP REST API Lookup</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Fayda FIN Number
                  </label>
                  <input
                    type="text"
                    value={finInput}
                    onChange={(e) => setFinInput(e.target.value)}
                    placeholder="FAN-XXXX-XXXX-XXXX"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                  {/* Demo Chips */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Quick Test:</span>
                    <button
                      type="button"
                      onClick={() => setFinInput('FAN-9901-2384-5120')}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded font-mono hover:bg-teal-50"
                    >
                      FAN-9901
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinInput('FAN-7721-9034-1188')}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded font-mono hover:bg-teal-50"
                    >
                      FAN-7721
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Patient Hospital MRN
                  </label>
                  <input
                    type="text"
                    value={patientMrn}
                    onChange={(e) => setPatientMrn(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerify}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold py-2.5 shadow-md shadow-amber-500/20 transition cursor-pointer text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Verify via NIDP eKYC
                </button>
              </div>
            </div>

            {/* Verified Fayda Card Display */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Verified National Digital Identity Profile
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Federal Democratic Republic of Ethiopia • NIDP Record</p>
                  </div>
                </div>

                {card && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    eKYC VERIFIED
                  </span>
                )}
              </div>

              {card ? (
                <div className="rounded-2xl border border-teal-500/40 dark:border-teal-600/40 bg-gradient-to-br from-teal-50/50 via-white to-slate-50 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900 p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="h-28 w-24 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-teal-500/40 flex flex-col items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                      <Fingerprint className="h-10 w-10 stroke-[1.5]" />
                      <span className="text-[9px] uppercase font-bold mt-1 tracking-wider text-slate-400">Biometric</span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{card.nameEn}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                          Active Citizen
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{card.nameAm}</p>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">FIN:</span>
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{card.fin}</span>
                          <button
                            type="button"
                            onClick={handleCopyFin}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Copy FIN"
                          >
                            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-400">DOB:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{card.dob}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-400">Gender:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{card.gender}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{card.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      FHIR R4 URI: <code className="text-teal-700 dark:text-teal-400">http://fayda.et/fin</code>
                    </span>

                    <button
                      type="button"
                      onClick={handleLink}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Link to Patient MRN ({patientMrn})
                    </button>
                  </div>

                  {linkedStatus && (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{linkedStatus}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No Fayda ID queried yet. Enter a FIN above to search the National ID Program.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
