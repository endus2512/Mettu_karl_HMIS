/**
 * National Digital ID (Fayda / FIN) eKYC & Patient Linkage Workstation.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

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

  const handleVerify = () => {
    if (!finInput) return;
    setCard({
      fin: finInput.trim().toUpperCase(),
      nameEn: 'Ayantu Mamo',
      nameAm: 'አያንቱ ማሞ (Ayaantuu Maammoo)',
      dob: '1994-09-23',
      gender: 'Female',
      phone: '+251 922 334 455',
      verified: true,
    });
    setLinkedStatus(null);
  };

  const handleLink = () => {
    if (!card) return;
    setLinkedStatus(`Successfully linked Fayda ${card.fin} to Patient MRN ${patientMrn}!`);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                {t('national_id_fayda')} • eKYC Biometric Verification
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Ethiopian National ID Program (NIDP) • Master MPI Deduplication • Fayda FIN Validation
              </p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              NIDP Fayda Gateway: Connected
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Lookup Form */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
              <h3 className="mb-4 text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Query Fayda Identification Number
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Fayda FIN Number</label>
                  <input
                    type="text"
                    value={finInput}
                    onChange={(e) => setFinInput(e.target.value)}
                    placeholder="e.g. FAN-9901-2384-5120"
                    className="w-full rounded-2xl border-2 border-slate-200 p-2.5 text-xs font-mono font-bold hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 focus:outline-none transition-all"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">12 or 16-digit unique resident identity token</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Target Patient MRN</label>
                  <input
                    type="text"
                    value={patientMrn}
                    onChange={(e) => setPatientMrn(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-200 p-2.5 text-xs font-mono font-bold hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerify}
                  className="w-full rounded-2xl bg-teal-600 px-5 py-3 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  Verify via NIDP eKYC
                </button>
              </div>
            </div>

            {/* Fayda Verified Card Preview */}
            <div className="group col-span-2 rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
              <h3 className="mb-4 text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Verified National Digital ID Card
              </h3>
              {card ? (
                <div className="rounded-3xl border-2 border-teal-500 bg-gradient-to-br from-teal-50/70 via-white to-blue-50/40 p-6 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-teal-700 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-2xl tracking-wider">
                    Official eKYC Verified
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="h-28 w-24 rounded-xl bg-gray-200 border-2 border-emerald-500/50 flex flex-col items-center justify-center text-4xl shadow-inner">
                      👤
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-gray-900">{card.nameEn}</span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          Active FIN
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-600">{card.nameAm}</p>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div>
                          <span className="text-gray-400 font-medium">FIN Number: </span>
                          <span className="font-mono font-bold text-primary-800">{card.fin}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Date of Birth: </span>
                          <span className="font-bold text-gray-800">{card.dob}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Gender: </span>
                          <span className="font-bold text-gray-800">{card.gender}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Registered Phone: </span>
                          <span className="font-bold text-gray-800">{card.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-200/60 pt-4">
                    <span className="text-xs text-gray-500 font-medium">
                      Integrates with FHIR R4 Patient Identifier (`http://fayda.et/fin`)
                    </span>
                    <button
                      type="button"
                      onClick={handleLink}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                    >
                      Confirm Link to Patient MRN
                    </button>
                  </div>

                  {linkedStatus && (
                    <div className="mt-3 rounded-lg bg-emerald-100 p-2.5 text-center text-xs font-bold text-emerald-800">
                      ✓ {linkedStatus}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No Fayda ID queried yet.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
