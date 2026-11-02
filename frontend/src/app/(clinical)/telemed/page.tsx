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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('telemedicine')} • Remote Specialist Consultation
                </h1>
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
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Video className="h-4 w-4" />
                  Start Remote Consultation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsInCall(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <PhoneOff className="h-4 w-4" />
                  End Consultation
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tele-Clinics Connected</span>
                <span className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Building2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">12 Health Centers</p>
              <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium">Bedele, Yayu, Hurumu network</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">P2P Encryption</span>
                <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">DTLS-SRTP 256</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Zero recording on public servers</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Consultations Today</span>
                <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">18 Patients</p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">Saved 340km round-trip ambulance travel</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Network Latency</span>
                <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <Wifi className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">32 ms</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Ethio Telecom 4G / EthERNet dedicated</p>
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
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Tele-Consultation Documentation
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">FHIR Encounter & Tele-Prescription</p>
                  </div>
                </div>

                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Document subjective chief complaint, remote objective assessment, findings, and clinical orders..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none min-h-[220px]"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 shadow-xs transition-colors cursor-pointer text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  Commit Tele-Consultation to EHR
                </button>

                {savedNotes && (
                  <div className="mt-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
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
