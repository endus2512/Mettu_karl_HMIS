'use client';

import React, { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { DigitalLedBoard } from '@/components/common/DigitalLedBoard';
import { clearTokens } from '@/lib/api';
import {
  DEFAULT_LED_SIGNAGE_CONFIG,
  LED_COLOR_PALETTE,
  LED_MESSAGE_PRESETS,
  fetchLedSignageWithStatus,
  hasServerAuthSession,
  normalizeLedConfig,
  saveLedSignageConfig,
  type LedSignageConfig,
} from '@/lib/ledSignage';
import { useTranslation, type Language } from '@/lib/i18n';
import { MorphingArrowButton } from '@/components/admin/MorphingArrowButton';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe,
  Monitor,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sliders,
  Sparkles,
  Type,
  Zap,
} from 'lucide-react';

type ServerSyncStatus = 'checking' | 'all_devices' | 'demo_session' | 'backend_offline';

export function AdminLedControlPanel(): React.ReactElement {
  const { language } = useTranslation();
  const lang: Language =
    language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const [draft, setDraft] = useState<LedSignageConfig>(DEFAULT_LED_SIGNAGE_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreviewOnly, setShowPreviewOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ServerSyncStatus>('checking');
  const syncStatusRef = React.useRef<ServerSyncStatus>('checking');
  syncStatusRef.current = syncStatus;

  useEffect(() => {
    let active = true;
    const syncInitial = async () => {
      const { config, backendConnected } = await fetchLedSignageWithStatus();
      if (!active) return;
      setDraft(config);
      if (!backendConnected) {
        setSyncStatus('backend_offline');
      } else if (!hasServerAuthSession()) {
        setSyncStatus('demo_session');
      } else {
        setSyncStatus('all_devices');
      }
    };
    void syncInitial();
    const timer = window.setInterval(() => {
      if (syncStatusRef.current === 'backend_offline' || syncStatusRef.current === 'checking') {
        void fetchLedSignageWithStatus().then(({ backendConnected }) => {
          if (!active || !backendConnected) return;
          setSyncStatus(hasServerAuthSession() ? 'all_devices' : 'demo_session');
        });
      }
    }, 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const updateDraft = (patch: Partial<LedSignageConfig>) => {
    setDraft((prev) => normalizeLedConfig({ ...prev, ...patch }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { config, syncedToServer, syncReason } = await saveLedSignageConfig(draft);
      setDraft(config);
      setHasUnsavedChanges(false);

      if (syncedToServer) {
        setSyncStatus('all_devices');
        notifications.show({
          title:
            lang === 'om'
              ? 'Boordiin LED Device Hundumaarratti Haaromfameera'
              : lang === 'am'
              ? 'ዲጂታል የLED ሰሌዳ በሁሉም መሣሪያዎች ተዘምኗል'
              : 'LED Board Published to All Devices',
          message:
            lang === 'om'
              ? 'Barreeffamni, halluun, safartuu fi saffisni server database irratti ol-kaa\'amee device hundumaarratti kallattiin mul\'achaa jira.'
              : 'Saved to server database and propagated live across all hospital screens and devices.',
          color: 'teal',
        });
        return;
      }

      if (syncReason === 'demo_session' || syncReason === 'unauthorized') {
        setSyncStatus('demo_session');
        notifications.show({
          title:
            lang === 'om'
              ? "Hubachiisa: Browser Kana Qofarratti Ol-kaa'ame"
              : lang === 'am'
              ? 'ማስጠንቀቂያ፡ በዚህ መሣሪያ ብቻ ተቀምጧል'
              : 'Warning: Saved Locally Only (Single Browser)',
          message:
            lang === 'om'
              ? 'Session Demo/Offline irra waan jirtuuf device biroorratti hin mul\'atu. Device hundumaarratti jijjiiruuf Sign Out godhii Admin sirriitiin backend waliin seeni.'
              : 'You are using an offline/demo token. Sign out and log in again with a live server Admin session to sync across all devices.',
          color: 'orange',
        });
        return;
      }

      setSyncStatus('backend_offline');
      notifications.show({
        title:
          lang === 'om'
            ? 'Serveriin Hin Argamne: Browser Kana Qofatti Ol-kaa\'ame'
            : lang === 'am'
            ? 'ሰርቨር አልተገኘም፡ በዚህ መሣሪያ ብቻ ተቀምጧል'
            : 'Backend Unreachable: Saved Locally Only',
        message:
          lang === 'om'
            ? 'Backend API wal-qunnamuu waan hin dandeenyeef browser kana qofarratti ol-kaa\'ame. Device biroo waliin sync gochuuf server backend (NEXT_PUBLIC_API_URL) qopheessi.'
            : 'Could not reach the backend server, so changes only saved in this browser. Connect the FastAPI server for cross-device sync.',
        color: 'orange',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(normalizeLedConfig({ ...DEFAULT_LED_SIGNAGE_CONFIG }));
    setHasUnsavedChanges(true);
  };

  const pxPerSec = Math.round(56 * draft.speed);

  const isExpanded = showSettings || showPreviewOnly;

  return (
    <div
      id="admin-led-signage-studio"
      className={`bg-gradient-to-br from-white via-cyan-50/45 to-amber-50/45 dark:from-[#172238] dark:via-[#1b2742] dark:to-[#162033] border-2 border-cyan-300/75 dark:border-cyan-400/35 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${
        isExpanded ? 'p-4 sm:p-5 space-y-4' : 'p-4 sm:p-5'
      }`}
    >
      {/* Header Row */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isExpanded ? 'border-b border-cyan-200 dark:border-slate-700 pb-3.5' : ''
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
            <Monitor className="w-5.5 h-5.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {lang === 'om'
                  ? "Boordii Digital LED Gamoo (Arduino Signage)"
                  : lang === 'am'
                  ? 'የሆስፒታሉ ዲጂታል የLED ማስታወቂያ ሰሌዳ'
                  : 'Hospital Digital LED Board (Arduino Marquee)'}
              </h2>
              <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border border-emerald-400/60">
                {draft.isPlaying ? 'LIVE SCROLL' : 'PAUSED'}
              </span>
              <span
                data-testid="led-sync-status-badge"
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                  syncStatus === 'all_devices'
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                    : syncStatus === 'checking'
                    ? 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                    : 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                }`}
              >
                {syncStatus === 'all_devices' ? (
                  <>
                    <Globe className="w-3 h-3" />
                    <span>
                      {lang === 'om'
                        ? 'All Devices Synced'
                        : 'All Devices Synced'}
                    </span>
                  </>
                ) : syncStatus === 'demo_session' ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      {lang === 'om'
                        ? 'Local Only (Demo Session)'
                        : 'Local Only (Demo Session)'}
                    </span>
                  </>
                ) : syncStatus === 'backend_offline' ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      {lang === 'om'
                        ? 'Local Only (Offline)'
                        : 'Local Only (Backend Offline)'}
                    </span>
                  </>
                ) : (
                  <span>{lang === 'om' ? 'Checking Sync...' : 'Checking Sync...'}</span>
                )}
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  {lang === 'om' ? 'Unsaved' : 'Unsaved'}
                </span>
              )}
            </div>
            {!showSettings && (
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5 max-w-2xl">
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">Active text:</span>
                <span className="font-mono text-cyan-800 dark:text-amber-300">{draft.message}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!showSettings && (
            <MorphingArrowButton
              variant={showPreviewOnly ? 'teal' : 'sky'}
              size="sm"
              icon={<Eye className="w-4 h-4" />}
              label={showPreviewOnly ? (lang === 'om' ? 'Dhoksi' : 'Hide Preview') : (lang === 'om' ? 'Ilaali' : 'Preview')}
              onClick={() => setShowPreviewOnly((prev) => !prev)}
            />
          )}

          {hasUnsavedChanges && !showSettings && (
            <MorphingArrowButton
              variant="amber"
              size="sm"
              disabled={isSaving}
              icon={<Check className="w-4 h-4" />}
              label={isSaving ? 'Publishing...' : 'Save & Publish Live'}
              onClick={handleSave}
            />
          )}

          <MorphingArrowButton
            variant={showSettings ? 'amber' : 'amber-soft'}
            size="sm"
            isExpanded={showSettings}
            icon={<Settings className={`w-4 h-4 ${showSettings ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />}
            label={
              showSettings
                ? lang === 'om'
                  ? 'Settings Cufi (Close)'
                  : 'Close Settings'
                : lang === 'om'
                ? "Qindaa'ina (Settings)"
                : 'Settings'
            }
            onClick={() => setShowSettings((prev) => !prev)}
          />
        </div>
      </div>

      {isExpanded && syncStatus === 'demo_session' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border-2 border-orange-400/60 bg-orange-100/90 dark:bg-orange-500/15 px-3.5 py-2.5 text-xs font-semibold text-orange-950 dark:text-orange-100">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-700 dark:text-orange-300 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              {lang === 'om'
                ? "Offline/Demo token moofaa irra jirtu — device biroorratti hin mul'atu. Device hundumaatti wal-qabsiisuuf haaraa seenaa:"
                : 'You are on an offline demo token, so saves stay in this browser only. Re-login with your live server Admin session to publish across all devices.'}
            </span>
          </div>
          <MorphingArrowButton
            variant="amber"
            size="xs"
            label={lang === 'om' ? 'Ba\'i & Haaraa Seeni (Admin)' : 'Sign Out & Re-Login Admin'}
            onClick={() => {
              clearTokens();
              if (typeof window !== 'undefined') {
                const base = window.location.pathname.startsWith('/Mettu_karl_HMIS')
                  ? '/Mettu_karl_HMIS'
                  : '';
                window.location.href = `${base}/login`;
              }
            }}
            className="shrink-0"
          />
        </div>
      )}

      {/* Live Physical LED Board Preview (shown when Settings OR Preview is opened) */}
      {isExpanded && (
        <div className="space-y-2 rounded-xl bg-slate-900 border-2 border-slate-700 p-3 sm:p-4">
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {lang === 'om' ? 'Ilaalcha Kallattii (Live LED Matrix Preview)' : 'Live LED Matrix Preview'}
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-200">
              {draft.speed.toFixed(2)}x ({pxPerSec} px/s) • Scale {draft.fontScale.toFixed(2)}x •{' '}
              {draft.colorHex.toUpperCase()}
            </span>
          </div>
          <DigitalLedBoard config={draft} variant="preview" />
        </div>
      )}

      {/* Unified Settings Drawer — ALL Digital Arduino LED Editing Controls Live Here */}
      {showSettings && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-100/95 dark:bg-[#0c121e] border border-slate-300 dark:border-[#1b2436] px-3.5 py-2.5">
            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-100">
              <span className="font-extrabold text-amber-800 dark:text-amber-300">
                {lang === 'om' ? 'Wiirtuu Gulaallii Digital LED:' : 'Unified Digital LED Settings:'}
              </span>{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {lang === 'om'
                  ? 'Barreeffama, halluu, saffisa fi effects hunda asitti qindeessaa.'
                  : 'Edit marquee message, diode colors, speed, typography, and effects below.'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <MorphingArrowButton
                variant="neutral"
                size="xs"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                label={lang === 'om' ? 'Deebisi (Default)' : 'Reset Default'}
                onClick={handleReset}
              />
              <MorphingArrowButton
                variant="amber"
                size="xs"
                disabled={isSaving}
                icon={<Check className="w-3.5 h-3.5" />}
                label={
                  isSaving
                    ? lang === 'om'
                      ? 'Ol-kaa\'aa jira...'
                      : 'Publishing...'
                    : lang === 'om'
                    ? 'Ol-kaa\'i & Mul\'isi (Save & Publish)'
                    : 'Save & Publish Live'
                }
                onClick={handleSave}
              />
            </div>
          </div>

          {/* Control Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (Message, Presets & Palette) */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* 1. Custom Message Input & Presets */}
          <div className="bg-white/95 dark:bg-[#0c121e] border border-slate-300 dark:border-[#1b2436] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-led-message-input"
                className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5"
              >
                <Type className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>
                  {lang === 'om'
                    ? '1. Barreeffama Boordii LED (Scrolling Message):'
                    : '1. Scrolling Marquee Message:'}
                </span>
              </label>
              <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">{draft.message.length}/300</span>
            </div>
            <input
              id="admin-led-message-input"
              type="text"
              maxLength={300}
              value={draft.message}
              onChange={(e) => updateDraft({ message: e.target.value })}
              placeholder="METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL"
              className="w-full rounded-xl border-2 border-slate-300 dark:border-[#26354d] bg-slate-50 dark:bg-[#141c2e] px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mr-1">
                {lang === 'om' ? 'Filannoo Salphaa (Presets):' : 'Quick Presets:'}
              </span>
              {LED_MESSAGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateDraft({ message: preset.text })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                    draft.message === preset.text
                      ? 'bg-amber-200 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-500'
                      : 'bg-slate-100 dark:bg-[#141c2c] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-[#222d42] hover:border-amber-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Color Palette + Custom Picker */}
          <div className="bg-white/95 dark:bg-[#0c121e] border border-slate-300 dark:border-[#1b2436] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>
                  {lang === 'om'
                    ? '2. Halluuwwan LED (Color Palette & Custom Picker):'
                    : '2. LED Diode Color Palette:'}
                </span>
              </span>
              <label className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-900 dark:text-slate-100 cursor-pointer bg-slate-100 dark:bg-[#141c2c] border border-slate-300 dark:border-[#26354d] px-2 py-0.5 rounded-lg">
                <span>Custom</span>
                <input
                  type="color"
                  value={draft.colorHex}
                  onChange={(e) =>
                    updateDraft({ colorPreset: 'custom', colorHex: e.target.value })
                  }
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                  aria-label="Custom LED Color Picker"
                />
                <span>{draft.colorHex.toUpperCase()}</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LED_COLOR_PALETTE.map((swatch) => {
                const active =
                  draft.colorHex.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() =>
                      updateDraft({ colorPreset: swatch.id, colorHex: swatch.hex })
                    }
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-sky-50 dark:bg-[#182238] border-sky-500 dark:border-white/70 text-slate-950 dark:text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-[#121928] border-slate-300 dark:border-[#1f293d] text-slate-800 dark:text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: swatch.hex,
                        boxShadow: `0 0 8px ${swatch.hex}`,
                      }}
                    />
                    <span className="text-[11px] font-extrabold truncate">
                      {lang === 'om' ? swatch.labelOm : swatch.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Speed, Font Size, Position & Effects) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* 3. Ultra-Fine Speed & Transport Controls */}
          <div className="bg-white/95 dark:bg-[#0c121e] border border-slate-300 dark:border-[#1b2436] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>
                  {lang === 'om'
                    ? '3. Saffisa fi Sochii (Ultra-Fine Speed):'
                    : '3. Ultra-Fine Speed & Playback:'}
                </span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateDraft({ isPlaying: !draft.isPlaying })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                    draft.isPlaying
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 border-amber-400'
                  }`}
                >
                  {draft.isPlaying ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>{lang === 'om' ? 'Dhaabi (Pause)' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>{lang === 'om' ? 'Taphachiisi (Play)' : 'Play'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({ direction: draft.direction === 'rtl' ? 'ltr' : 'rtl' })
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-[#141c2c] border border-slate-300 dark:border-[#24314a] text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  title="Toggle Scroll Direction"
                >
                  <ArrowLeftRight className="w-3 h-3 text-teal-400" />
                  <span>{draft.direction === 'rtl' ? 'R → L' : 'L → R'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{lang === 'om' ? 'Suuta (0.1x) — Ariifataa (5.0x)' : 'Ultra-Slow to Fast'}</span>
                <span className="font-mono text-amber-300 font-bold">
                  {draft.speed.toFixed(2)}x ({pxPerSec} px/s)
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.05"
                value={draft.speed}
                onChange={(e) => updateDraft({ speed: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
                aria-label="Scrolling Speed"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: 'Ultra Slow 0.2x', val: 0.2 },
                  { label: 'Slow 0.5x', val: 0.5 },
                  { label: 'Normal 1.0x', val: 1.0 },
                  { label: 'Fast 2.0x', val: 2.0 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => updateDraft({ speed: preset.val })}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono border cursor-pointer ${
                      Math.abs(draft.speed - preset.val) < 0.03
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                        : 'bg-[#141c2c] text-slate-400 border-[#222d42] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Typography Size, Spacing, Glow & Effects */}
          <div className="bg-[#0c121e] border border-[#1b2436] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {lang === 'om'
                  ? '4. Guddina Qubee, Iftina & Iddoo (Scale & Effects):'
                  : '4. Size, Glow, Effects & Vertical Offset:'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Font Size / Scale */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>{lang === 'om' ? 'Guddina Qubee' : 'Font Scale'}</span>
                  <span className="font-mono text-white">{draft.fontScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.55"
                  max="1.5"
                  step="0.05"
                  value={draft.fontScale}
                  onChange={(e) => updateDraft({ fontScale: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                  aria-label="Font Size Scale"
                />
              </div>

              {/* Letter Spacing */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>{lang === 'om' ? 'Fageenya Qubee' : 'Letter Spacing'}</span>
                  <span className="font-mono text-white">{draft.letterSpacing.toFixed(2)}em</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.28"
                  step="0.01"
                  value={draft.letterSpacing}
                  onChange={(e) => updateDraft({ letterSpacing: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                  aria-label="Letter Spacing"
                />
              </div>

              {/* Glow Intensity */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>{lang === 'om' ? 'Iftina LED (Glow)' : 'Glow Intensity'}</span>
                  <span className="font-mono text-white">{draft.glowIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={draft.glowIntensity}
                  onChange={(e) => updateDraft({ glowIntensity: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                  aria-label="LED Glow Intensity"
                />
              </div>

              {/* Vertical Fine Offset on Building */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>{lang === 'om' ? 'Iddoo Ol/Gadi (Pos Y)' : 'Vertical Offset'}</span>
                  <span className="font-mono text-white">{draft.offsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="45"
                  step="1"
                  value={draft.offsetY}
                  onChange={(e) => updateDraft({ offsetY: Number(e.target.value) })}
                  className="w-full accent-teal-400 cursor-pointer"
                  aria-label="Vertical Position Nudge"
                />
              </div>
            </div>

            {/* Matrix Grid & Scanline Effect Toggles */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#192234]">
              <button
                type="button"
                onClick={() => updateDraft({ showGridDots: !draft.showGridDots })}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  draft.showGridDots
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                    : 'bg-[#141c2c] text-slate-400 border-[#222d42]'
                }`}
              >
                {draft.showGridDots ? '● ' : '○ '}
                {lang === 'om' ? 'Tuqaa LED Matrix (Grid Dots)' : 'LED Grid Dots'}
              </button>

              <button
                type="button"
                onClick={() => updateDraft({ showScanlines: !draft.showScanlines })}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  draft.showScanlines
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                    : 'bg-[#141c2c] text-slate-400 border-[#222d42]'
                }`}
              >
                {draft.showScanlines ? '≡ ' : '— '}
                {lang === 'om' ? 'Sarara Scanlines' : 'Scanlines Effect'}
              </button>
            </div>
          </div>
        </div>
          </div>
        </div>
      )}
    </div>
  );
}
