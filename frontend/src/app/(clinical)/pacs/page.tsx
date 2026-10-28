/**
 * PACS / RIS Radiology Diagnostic Imaging & DICOM Web Viewer.
 * Digital radiography and cross-sectional imaging with responsive rectangular spotlight UX.
 */
'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';

interface DicomStudyItem {
  uid: string;
  patient: string;
  modality: string;
  description: string;
  date: string;
  slices: number;
}

const mockStudies: DicomStudyItem[] = [
  { uid: '1.2.826.0.1.368.101', patient: 'Abera Duresa (MKH-2026-000101)', modality: 'CR (X-Ray)', description: 'Chest PA Digital Radiography', date: '2026-10-26 10:14', slices: 1 },
  { uid: '1.2.826.0.1.368.102', patient: 'Hawine Dibaba (MKH-2026-000102)', modality: 'CT', description: 'Brain Non-Contrast 64-Slice CT Scan', date: '2026-10-26 09:30', slices: 128 },
  { uid: '1.2.826.0.1.368.103', patient: 'Ayantu Mamo (MKH-2026-000103)', modality: 'US', description: 'Obstetrical 2nd Trimester Color Doppler', date: '2026-10-25 15:20', slices: 12 },
];

export default function PACSPage(): React.ReactElement {
  const { t } = useTranslation();
  const [selectedStudy, setSelectedStudy] = useState<DicomStudyItem>(mockStudies[0]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [contrastInvert, setContrastInvert] = useState(false);

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
                  🩻
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-950 transition-colors">
                    {t('pacs')} • Radiology (RIS) & Web DICOM Diagnostic Viewer
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    DICOM R4 Server • Lossless Medical Imaging Storage • Radiologist Diagnostic Workstation
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 group-hover:bg-white transition-colors">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                PACS Archive: 18.4 TB Online
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards with Rectangular Spotlight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Scans Today</span>
              <p className="mt-2 text-3xl font-black text-slate-900 group-hover:text-teal-950 transition-colors">42 Studies</p>
              <p className="mt-1 text-xs text-teal-600 font-bold">28 X-Ray • 8 CT • 6 US</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Critical Alerts</span>
              <p className="mt-2 text-3xl font-black text-rose-600 group-hover:text-rose-950 transition-colors">2 Urgent</p>
              <p className="mt-1 text-xs text-rose-600 font-semibold">Tension Pneumothorax, ED Bed 1</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Radiology TAT</span>
              <p className="mt-2 text-3xl font-black text-blue-700 group-hover:text-blue-950 transition-colors">38 Min</p>
              <p className="mt-1 text-xs text-blue-600 font-bold">Emergency turnaround target &lt; 45m</p>
            </div>
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:bg-teal-50/70 hover:ring-2 hover:ring-teal-400/40 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">MinIO Storage</span>
              <p className="mt-2 text-3xl font-black text-emerald-600 group-hover:text-emerald-950 transition-colors">100% S3</p>
              <p className="mt-1 text-xs text-slate-500 font-semibold">On-premise redundant SAN array</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* DICOM Web Viewer */}
            <div className="col-span-2 rounded-3xl bg-slate-950 p-6 text-white shadow-xl flex flex-col justify-between min-h-[500px] border-2 border-slate-800 hover:border-teal-400 hover:ring-2 hover:ring-teal-400/30 transition-all">
              {/* Viewer Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-teal-400">{selectedStudy.modality}</span>
                  <span className="text-xs text-slate-300 font-semibold">• {selectedStudy.description}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                    className="rounded-xl bg-slate-800 px-3 py-1 font-bold hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    🔍 -
                  </button>
                  <span className="font-mono text-xs">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                    className="rounded-xl bg-slate-800 px-3 py-1 font-bold hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    🔍 +
                  </button>
                  <button
                    onClick={() => setContrastInvert(!contrastInvert)}
                    className="rounded-xl bg-slate-800 px-3 py-1 font-bold hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    🌓 Invert
                  </button>
                </div>
              </div>

              {/* Central Imaging Canvas */}
              <div className="flex flex-1 items-center justify-center p-8">
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    filter: contrastInvert ? 'invert(1)' : 'none',
                    transition: 'transform 0.15s ease-in-out',
                  }}
                  className="flex h-72 w-72 flex-col items-center justify-center rounded-3xl border-2 border-slate-700 bg-slate-900/90 shadow-2xl"
                >
                  <span className="text-7xl mb-2">🩻</span>
                  <p className="text-xs font-mono text-slate-400">{selectedStudy.patient}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{selectedStudy.uid}</p>
                  <span className="mt-3 rounded-full bg-teal-500/20 px-3 py-0.5 text-[10px] font-black text-teal-300 border border-teal-400/40">
                    {selectedStudy.slices} Slices Loaded
                  </span>
                </div>
              </div>

              {/* Viewport Info Overlay */}
              <div className="flex justify-between border-t border-slate-800 pt-3 text-[11px] font-mono text-slate-400">
                <span>WW/WL: 400/40 (Mediastinum)</span>
                <span>Mettu Karl Referral Radiology RIS v2.4</span>
              </div>
            </div>

            {/* Study Selection Cards */}
            <div className="group rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs hover:border-teal-500 hover:ring-2 hover:ring-teal-400/30 transition-all duration-200 space-y-3">
              <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-950 transition-colors uppercase tracking-wider">
                Recent Diagnostic Studies
              </h3>
              <div className="space-y-2.5">
                {mockStudies.map((study) => (
                  <div
                    key={study.uid}
                    onClick={() => setSelectedStudy(study)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedStudy.uid === study.uid
                        ? 'border-teal-500 bg-teal-50/80 shadow-sm ring-2 ring-teal-400/30'
                        : 'border-slate-200 bg-slate-50/70 hover:border-teal-400 hover:bg-teal-50/40'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-slate-900">{study.modality}</span>
                      <span className="font-mono text-[10px] text-slate-400">{study.date}</span>
                    </div>
                    <p className="font-bold text-xs text-slate-800">{study.patient}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{study.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
