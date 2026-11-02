/**
 * PACS / RIS Radiology Diagnostic Imaging & DICOM Web Viewer.
 * Mettu Karl Referral Hospital HMIS — Enterprise Healthcare Design System:
 * - Diagnostic web DICOM viewport with clinical HUD overlays (WW/WL, Matrix, Slices)
 * - Radiologist clinical impression & report sign-off panel
 * - High-precision imaging controls (Zoom, Pan, Invert, Window Level presets)
 * - Modern Lucide SVG icons replacing raw emojis
 * - Lossless MinIO S3 clinical archive integration
 */
'use client';

import React, { useState } from 'react';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Contrast,
  Maximize2,
  Sliders,
  Ruler,
  Layers,
  Activity,
  HardDrive,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck,
  Stethoscope,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTranslation } from '@/lib/i18n';
import { notifications } from '@mantine/notifications';

interface DicomStudyItem {
  uid: string;
  patient: string;
  mrn: string;
  modality: 'CR (X-Ray)' | 'CT' | 'US' | 'MRI';
  description: string;
  bodyPart: string;
  date: string;
  slices: number;
  currentSlice: number;
  ww: number;
  wl: number;
  radiologist: string;
  reportStatus: 'Signed' | 'Preliminary' | 'Pending Review';
  criticalFinding?: string;
}

const MOCK_STUDIES: DicomStudyItem[] = [
  {
    uid: '1.2.826.0.1.368.101',
    patient: 'Abera Duresa Hunde',
    mrn: 'MKH-2026-000101',
    modality: 'CR (X-Ray)',
    description: 'Chest PA Digital Radiography (Erect)',
    bodyPart: 'Chest / Thorax',
    date: '2026-10-26 10:14',
    slices: 1,
    currentSlice: 1,
    ww: 400,
    wl: 40,
    radiologist: 'Dr. Bekele Gemechu (Consultant Radiologist)',
    reportStatus: 'Signed',
  },
  {
    uid: '1.2.826.0.1.368.102',
    patient: 'Hawine Dibaba Tola',
    mrn: 'MKH-2026-000102',
    modality: 'CT',
    description: 'Brain Non-Contrast 64-Slice Helical CT',
    bodyPart: 'Head & Brain',
    date: '2026-10-26 09:30',
    slices: 128,
    currentSlice: 64,
    ww: 80,
    wl: 40,
    radiologist: 'Dr. Tolera Negash (Radiology Resident)',
    reportStatus: 'Preliminary',
    criticalFinding: 'Acute Left Parietal Subdural Hematoma (8mm shift)',
  },
  {
    uid: '1.2.826.0.1.368.103',
    patient: 'Ayantu Mamo Gudeta',
    mrn: 'MKH-2026-000103',
    modality: 'US',
    description: 'Obstetrical 2nd Trimester Color Doppler',
    bodyPart: 'Pelvis / Fetal Anatomy',
    date: '2026-10-25 15:20',
    slices: 24,
    currentSlice: 12,
    ww: 255,
    wl: 128,
    radiologist: 'Dr. Bekele Gemechu (Consultant Radiologist)',
    reportStatus: 'Signed',
  },
  {
    uid: '1.2.826.0.1.368.104',
    patient: 'Gudeta Hailu Tadesse',
    mrn: 'MKH-2026-000104',
    modality: 'CR (X-Ray)',
    description: 'Right Tibia/Fibula AP & Lateral',
    bodyPart: 'Right Lower Extremity',
    date: '2026-10-25 11:05',
    slices: 2,
    currentSlice: 1,
    ww: 2000,
    wl: 350,
    radiologist: 'Dr. Tolera Negash (Radiology Resident)',
    reportStatus: 'Signed',
  },
];

const WINDOW_PRESETS = [
  { name: 'Default', ww: 400, wl: 40 },
  { name: 'Lung', ww: 1500, wl: -600 },
  { name: 'Bone', ww: 2000, wl: 350 },
  { name: 'Brain', ww: 80, wl: 40 },
  { name: 'Soft Tissue', ww: 350, wl: 50 },
];

export default function PACSPage(): React.ReactElement {
  const { t, language } = useTranslation();
  const [selectedStudy, setSelectedStudy] = useState<DicomStudyItem>(MOCK_STUDIES[0]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [contrastInvert, setContrastInvert] = useState(false);
  const [currentSlice, setCurrentSlice] = useState(selectedStudy.currentSlice);
  const [activePreset, setActivePreset] = useState('Default');

  const handleStudyChange = (study: DicomStudyItem) => {
    setSelectedStudy(study);
    setCurrentSlice(study.currentSlice);
    setZoomLevel(100);
    setRotation(0);
    setContrastInvert(false);
  };

  const handlePresetChange = (preset: (typeof WINDOW_PRESETS)[0]) => {
    setActivePreset(preset.name);
    setSelectedStudy((prev) => ({
      ...prev,
      ww: preset.ww,
      wl: preset.wl,
    }));
    notifications.show({
      title: 'Window/Level Adjusted',
      message: `${preset.name} preset applied (WW: ${preset.ww}, WL: ${preset.wl})`,
      color: 'teal',
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Diagnostic Command Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 shadow-xs shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{t('pacs')}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Radiology RIS & Web DICOM</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  DICOMweb WADO-RS Server • Digital Radiography & CT Viewer • MinIO S3 Lossless Archive
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PACS Archive: 18.4 TB Online
              </span>
            </div>
          </div>

          {/* Quick Radiology Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Scans Conducted Today</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">42 Studies</p>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">28 X-Ray • 8 CT • 6 US</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Critical Imaging Findings</span>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">1 Urgent</p>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Acute Subdural Hematoma (CT)</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Report Turnaround (TAT)</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">34 Min</p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Target &lt; 45m achieved</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">MinIO S3 Redundancy</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">100% Synced</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">On-premise SAN mirror active</span>
            </div>
          </div>

          {/* Main DICOM Diagnostics Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Clinical Dark-Room DICOM Viewport */}
            <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 text-white shadow-xl flex flex-col justify-between overflow-hidden min-h-[580px]">
              {/* Top Viewport Clinical HUD Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 px-4 py-3 border-b border-slate-800 text-xs">
                {/* Modality & Study Title */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {selectedStudy.modality}
                  </span>
                  <span className="font-semibold text-slate-200 truncate max-w-xs">{selectedStudy.description}</span>
                </div>

                {/* Interactive Diagnostic Controls */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Zoom Controls */}
                  <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700 p-0.5">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-[11px] font-mono text-slate-300">{zoomLevel}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(250, z + 10))}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Rotate */}
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Invert LUT */}
                  <button
                    type="button"
                    onClick={() => setContrastInvert(!contrastInvert)}
                    className={`p-1.5 rounded-lg border text-xs font-medium cursor-pointer transition flex items-center gap-1 ${
                      contrastInvert
                        ? 'bg-teal-600 text-white border-teal-500'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                    title="Invert Grayscale LUT"
                  >
                    <Contrast className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Invert</span>
                  </button>
                </div>
              </div>

              {/* Window Level Preset Pills */}
              <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 text-[11px] overflow-x-auto">
                <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-teal-400" />
                  <span>WW/WL Presets:</span>
                </span>
                {WINDOW_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetChange(preset)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition cursor-pointer ${
                      activePreset === preset.name
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Central Imaging Canvas with HUD Corners */}
              <div className="relative flex-1 flex items-center justify-center p-6 bg-slate-950 overflow-hidden select-none min-h-[360px]">
                {/* HUD Overlay: Top-Left (Patient & Facility Info) */}
                <div className="absolute top-4 left-4 font-mono text-[11px] text-teal-300/90 space-y-0.5 pointer-events-none drop-shadow-md">
                  <p className="font-bold text-white text-xs">{selectedStudy.patient}</p>
                  <p>MRN: {selectedStudy.mrn}</p>
                  <p>DOB: 1985-04-12 (M)</p>
                  <p className="text-[10px] text-slate-400">METTU KARL REFERRAL HOSPITAL</p>
                </div>

                {/* HUD Overlay: Top-Right (Acquisition Info) */}
                <div className="absolute top-4 right-4 text-right font-mono text-[11px] text-teal-300/90 space-y-0.5 pointer-events-none drop-shadow-md">
                  <p className="font-bold text-white text-xs">{selectedStudy.modality}</p>
                  <p>{selectedStudy.bodyPart}</p>
                  <p>{selectedStudy.date}</p>
                  <p className="text-[10px] text-slate-400">Series 1 / Slices: {selectedStudy.slices}</p>
                </div>

                {/* HUD Overlay: Bottom-Left (Window Width / Level) */}
                <div className="absolute bottom-4 left-4 font-mono text-[11px] text-slate-400 space-y-0.5 pointer-events-none">
                  <p>WW: {selectedStudy.ww} / WL: {selectedStudy.wl}</p>
                  <p>Zoom: {zoomLevel}% • Rot: {rotation}°</p>
                  <p className="text-[10px] text-teal-400">LUT: {contrastInvert ? 'MONOCHROME1 (Inverted)' : 'MONOCHROME2'}</p>
                </div>

                {/* HUD Overlay: Bottom-Right (Matrix & Pixel Size) */}
                <div className="absolute bottom-4 right-4 text-right font-mono text-[11px] text-slate-400 space-y-0.5 pointer-events-none">
                  <p>Matrix: 512 x 512</p>
                  <p>FOV: 350.0 mm</p>
                  <p className="text-[10px] text-teal-400">Lossless 16-bit DICOM</p>
                </div>

                {/* The Medical Radiography Imaging Representation */}
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    filter: contrastInvert ? 'invert(1)' : 'none',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl relative w-80 h-80"
                >
                  {/* Subtle Grid crosshair */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-15">
                    <div className="border-r border-b border-teal-400" />
                    <div className="border-b border-teal-400" />
                    <div className="border-r border-teal-400" />
                    <div />
                  </div>

                  <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3">
                    <Activity className="w-10 h-10 animate-pulse" />
                  </div>

                  <span className="font-mono text-sm font-bold text-white tracking-wide">
                    {selectedStudy.modality}
                  </span>
                  <span className="text-xs text-slate-400 font-mono mt-1 text-center">
                    {selectedStudy.description}
                  </span>

                  {selectedStudy.slices > 1 && (
                    <div className="mt-4 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-[11px] font-mono text-teal-300">
                      Slice {currentSlice} of {selectedStudy.slices}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Multi-slice Scroller Slider (if study has slices) */}
              {selectedStudy.slices > 1 && (
                <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Slice:</span>
                  <input
                    type="range"
                    min={1}
                    max={selectedStudy.slices}
                    value={currentSlice}
                    onChange={(e) => setCurrentSlice(Number(e.target.value))}
                    className="flex-1 accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-teal-300 text-xs w-16 text-right">
                    {currentSlice} / {selectedStudy.slices}
                  </span>
                </div>
              )}
            </div>

            {/* Right 1 Col: Studies List & Radiologist Impression */}
            <div className="space-y-4">
              {/* Studies Roster */}
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Recent Diagnostic Studies</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{MOCK_STUDIES.length} Records</span>
                </div>

                <div className="mt-3 space-y-2">
                  {MOCK_STUDIES.map((study) => (
                    <div
                      key={study.uid}
                      onClick={() => handleStudyChange(study)}
                      className={`p-3 rounded-lg border transition cursor-pointer ${
                        selectedStudy.uid === study.uid
                          ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 dark:border-teal-700 shadow-xs ring-1 ring-teal-400/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 font-bold">
                            {study.modality}
                          </span>
                          <span>{study.patient}</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{study.date.split(' ')[1]}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">{study.description}</p>
                      {study.criticalFinding && (
                        <div className="mt-1 flex items-center gap-1 text-[10.5px] text-rose-600 dark:text-rose-400 font-semibold">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{study.criticalFinding}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Radiologist Formal Impression & Sign-off Panel */}
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Radiology Impression</span>
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      selectedStudy.reportStatus === 'Signed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {selectedStudy.reportStatus}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Consultant:</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{selectedStudy.radiologist}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Clinical Finding:</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-[11.5px]">
                      {selectedStudy.criticalFinding
                        ? `CRITICAL ALERT: ${selectedStudy.criticalFinding}. Notified attending ED physician immediately via HMIS telemetry push.`
                        : `Digital examination demonstrates clear bilateral lung fields, normal cardiothoracic ratio (<0.50). No active consolidation, effusion, or pneumothorax identified.`}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span>HL7 DiagnosticReport R4</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Verified Electronic Signature</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
