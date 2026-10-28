/**
 * Telemedicine & Remote Video Consultation.
 * Encrypted WebRTC clinical telemetry with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

export default function TelemedicinePage(): React.ReactElement {
  const { t } = useTranslation();
  const [isInCall, setIsInCall] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header Bar with Rectangular Responsive Spotlight */}
          <div className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-7 py-5 rounded-3xl border-2 border-slate-200/90 shadow-xs hover:border-teal-500 hover:bg-teal-50/40 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm text-2xl group-hover:scale-105 transition-transform">
                  🩺
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('telemedicine')} • Remote Specialist Consultation
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    End-to-End Encrypted WebRTC Video/Audio • Remote Rural Clinic Tele-Referral • Electronic Prescription
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!isInCall ? (
                <button
                  onClick={() => setIsInCall(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <span>📹</span> Start Remote Consultation
                </button>
              ) : (
                <button
                  onClick={() => setIsInCall(false)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-sm hover:bg-rose-700 hover:ring-2 hover:ring-rose-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <span>❌</span> End Call
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tele-Clinics Connected</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">12 Health Ctrs</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">Bedele, Yayu, Hurumu</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">P2P Encryption</span>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">DTLS-SRTP</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">Zero recording on public servers</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultations Today</span>
              <p className="mt-2 text-3xl font-black text-blue-600 group-hover:text-blue-950 transition-colors">18 Patients</p>
              <p className="mt-1 text-xs text-blue-600 font-bold">Avoided 340km ambulance travel</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bandwidth Latency</span>
              <p className="mt-2 text-3xl font-black text-purple-700 group-hover:text-purple-950 transition-colors">32 ms</p>
              <p className="mt-1 text-xs text-purple-600 font-bold">Ethio Telecom 4G / EthERNet</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Video Frame */}
            <div className="col-span-2 flex flex-col items-center justify-center rounded-3xl bg-slate-900 p-6 text-white shadow-xl relative min-h-[460px] border-2 border-slate-800 hover:border-teal-400 hover:ring-2 hover:ring-teal-400/30 transition-all">
              {isInCall ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-teal-900/60 border-4 border-teal-400 text-4xl mb-4 animate-pulse">
                    👤
                  </div>
                  <h3 className="text-xl font-black text-white">Ayantu Mamo (Patient)</h3>
                  <p className="text-xs text-teal-400 font-mono mt-1">Connected • Encrypted P2P WebRTC HD</p>

                  {/* Doctor Picture-in-Picture */}
                  <div className="absolute top-4 right-4 h-32 w-44 rounded-2xl border-2 border-white/20 bg-slate-800 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-2xl">👨‍⚕️</span>
                    <span className="text-xs text-slate-300 font-bold mt-1">Dr. Bekele (You)</span>
                  </div>

                  {/* Media Controls Bar */}
                  <div className="absolute bottom-6 flex items-center gap-4 rounded-2xl bg-white/10 px-6 py-3 backdrop-blur-md border border-white/15">
                    <button
                      onClick={() => setIsAudioMuted(!isAudioMuted)}
                      className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg transition-colors cursor-pointer ${
                        isAudioMuted ? 'bg-rose-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {isAudioMuted ? '🔇' : '🎙️'}
                    </button>
                    <button
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                      className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg transition-colors cursor-pointer ${
                        isVideoMuted ? 'bg-rose-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {isVideoMuted ? '🚫' : '📹'}
                    </button>
                    <span className="text-xs font-mono font-bold text-teal-300">Live 00:14:22</span>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <span className="text-6xl block">📹</span>
                  <h3 className="text-base font-black text-slate-200">No Active Remote Call</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Select a queued rural health center referral from the directory or click Start Consultation above.
                  </p>
                </div>
              )}
            </div>

            {/* Clinical Encounter Notes */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200 flex flex-col">
              <h3 className="mb-4 text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Clinical Tele-Encounter Notes
              </h3>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Document subjective symptoms, objective remote findings, and tele-prescription advice..."
                className="w-full flex-1 rounded-2xl border-2 border-slate-200 p-4 text-xs font-semibold hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 focus:outline-none transition-all min-h-[220px]"
              />
              <button
                type="button"
                className="mt-4 rounded-2xl bg-teal-600 py-3 text-xs font-black text-white shadow-sm hover:bg-teal-700 hover:ring-2 hover:ring-teal-400/50 hover:shadow-md transition-all cursor-pointer"
              >
                💾 Commit Tele-Consultation to EHR
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
