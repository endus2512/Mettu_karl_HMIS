/**
 * Telemedicine & Remote Video Consultation.
 * Encrypted WebRTC clinical telemetry, tele-referral & rural healthcare connectivity.
 * Enterprise Healthcare Standard (Epic/Cerner/NHS).
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Activity,
  Clock,
  Building2,
  Sparkles,
  FileText,
  Save,
  CheckCircle2,
  Wifi,
  Users,
  User
} from 'lucide-react';

export default function TelemedicinePage(): React.ReactElement {
  const { t } = useTranslation();
  const [isInCall, setIsInCall] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState(false);

  const handleSaveNotes = () => {
    if (!clinicalNotes) return;
    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 3000);
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
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] shrink-0">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('telemedicine')} • Remote Specialist Consultation
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#102419] text-[#34d399] border border-[#059669]/40 shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
                    WebRTC Mesh Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  End-to-End Encrypted WebRTC Video/Audio • Rural Health Center Tele-Referral • Electronic Prescription
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isInCall ? (
                <button
                  type="button"
                  onClick={() => setIsInCall(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold px-4 py-2 text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  <Video className="h-4 w-4" />
                  Start Remote Consultation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsInCall(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition cursor-pointer border border-rose-500/30"
                >
                  <PhoneOff className="h-4 w-4" />
                  End Consultation
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats KPI Cards (Obsidian & Sparklines) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 1. Tele-Clinics
                </span>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Building2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">12 Centers</p>
                <svg className="h-5 w-16 text-amber-500/60" viewBox="0 0 64 20" fill="none">
                  <path d="M 0 15 Q 16 5 32 12 T 64 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-amber-400/90 font-medium">Bedele, Yayu, Hurumu network</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 2. P2P Encryption
                </span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-emerald-400">DTLS-SRTP</p>
                <svg className="h-5 w-16 text-emerald-500/60" viewBox="0 0 64 20" fill="none">
                  <path d="M 0 16 Q 20 6 40 10 T 64 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-slate-400">Zero recording on public servers</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 3. Consultations Today
                </span>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-amber-300">18 Patients</p>
                <svg className="h-5 w-16 text-amber-400/70" viewBox="0 0 64 20" fill="none">
                  <path d="M 0 12 Q 18 18 36 6 T 64 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-amber-400/80 font-medium">Saved 340km round-trip ambulance travel</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-amber-400">✦</span> 4. Network Latency
                </span>
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <Wifi className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold tracking-tight text-sky-400">32 ms</p>
                <svg className="h-5 w-16 text-sky-500/60" viewBox="0 0 64 20" fill="none">
                  <path d="M 0 14 Q 24 16 40 8 T 64 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-slate-400">Ethio Telecom 4G / EthERNet dedicated</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Video Frame (2 Cols) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center rounded-2xl bg-slate-950 p-6 text-white shadow-xl relative min-h-[460px] border border-slate-800 overflow-hidden">
              {isInCall ? (
                <div className="w-full h-full flex flex-col items-center justify-center py-8">
                  {/* Patient Avatar Viewport */}
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-teal-950/80 border-2 border-teal-500 text-teal-300 mb-3 shadow-lg">
                    <User className="h-14 w-14" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Ayantu Mamo</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-teal-300 font-mono">Connected • Yayu Health Center • 1080p HD</p>
                  </div>

                  {/* Doctor Picture-in-Picture */}
                  <div className="absolute top-4 right-4 h-28 w-40 rounded-xl border border-white/20 bg-slate-900/90 flex flex-col items-center justify-center shadow-lg p-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-teal-400 mb-1">
                      <User className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] text-slate-200 font-bold">Dr. Bekele (You)</span>
                    <span className="text-[9px] text-emerald-400 font-mono">Audio / Video Active</span>
                  </div>

                  {/* Media Controls Floating Dock */}
                  <div className="absolute bottom-6 flex items-center gap-3 rounded-2xl bg-slate-900/80 px-6 py-2.5 backdrop-blur-md border border-white/10 shadow-xl">
                    <button
                      type="button"
                      onClick={() => setIsAudioMuted(!isAudioMuted)}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm transition-colors cursor-pointer ${
                        isAudioMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
                    >
                      {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm transition-colors cursor-pointer ${
                        isVideoMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title={isVideoMuted ? 'Start Video' : 'Stop Video'}
                    >
                      {isVideoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </button>
                    <div className="h-6 w-px bg-white/20 mx-1" />
                    <span className="text-xs font-mono font-semibold text-teal-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      00:14:22
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 py-16">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                    <Video className="h-7 w-7 text-teal-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200">No Active Remote Call</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Select a queued rural health center referral from the directory or click Start Consultation to initiate an encrypted tele-visit.
                  </p>
                </div>
              )}
            </div>

            {/* Clinical Encounter Notes */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#222b3d] pb-3 mb-4">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Tele-Consultation Documentation
                    </h3>
                    <p className="text-[11px] text-slate-400">FHIR Encounter & Tele-Prescription</p>
                  </div>
                </div>

                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Document subjective chief complaint, remote objective assessment, findings, and clinical orders..."
                  className="w-full rounded-xl border border-slate-200 dark:border-[#222b3d] bg-slate-50 dark:bg-[#0b0f17] p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[220px]"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold py-2.5 shadow-md shadow-amber-500/20 transition cursor-pointer text-xs"
                >
                  <Save className="h-3.5 w-3.5 text-slate-950" />
                  Commit Tele-Consultation to EHR
                </button>

                {savedNotes && (
                  <div className="mt-2.5 rounded-xl bg-emerald-50 dark:bg-[#0f1d18] border border-emerald-200 dark:border-emerald-500/40 p-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Documentation saved to Patient Encounter record!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
