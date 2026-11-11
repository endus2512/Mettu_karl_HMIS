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
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Globe,
  Monitor,
  Palette,
  Pause,
  Play,
  RotateCcw,
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

  return (
    <div
      id="admin-led-signage-studio"
      className="bg-[#101624] border border-[#222b3d] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c2436] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0">
            <Monitor className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {lang === 'om'
                  ? "To'annoo Boordii Digital LED Gamoo (Login Marquee Studio)"
                  : lang === 'am'
                  ? 'የሆስፒታሉ ዲጂታል የLED ማስታወቂያ ሰሌዳ መቆጣጠሪያ'
                  : 'Hospital Building Digital LED Marquee Control Studio'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
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
                        ? 'Device Hundumaa (Server DB Sync)'
                        : 'All Devices Synced (Server DB)'}
                    </span>
                  </>
                ) : syncStatus === 'demo_session' ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      {lang === 'om'
                        ? 'Browser Tokko Qofa (Demo Session — Re-login Admin)'
                        : 'Local Only (Demo Session — Re-login Admin)'}
                    </span>
                  </>
                ) : syncStatus === 'backend_offline' ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      {lang === 'om'
                        ? 'Browser Tokko Qofa (Backend Offline)'
                        : 'Local Only (Backend Offline)'}
                    </span>
                  </>
                ) : (
                  <span>{lang === 'om' ? 'Sync Mirkaneeffamaa jira...' : 'Checking Sync...'}</span>
                )}
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  {lang === 'om' ? 'Hin Ol-kaa\'amne (Unsaved)' : 'Unsaved Changes'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'om'
                ? 'Barreeffama, halluu LED, guddina qubee, saffisa fi teessoo boordii fuula seensaa irratti kallattiin gulaali.'
                : 'Customize the physical LED dot-matrix signboard displayed above the hospital entrance hero.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#263248] bg-[#141c2c] hover:bg-[#1a2438] text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'om' ? 'Deebisi (Default)' : 'Reset Default'}</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-60 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {isSaving
                ? lang === 'om'
                  ? 'Ol-kaa\'aa jira...'
                  : 'Publishing...'
                : lang === 'om'
                ? 'Ol-kaa\'i & Mul\'isi (Save & Publish)'
                : 'Save & Publish Live'}
            </span>
          </button>
        </div>
      </div>

      {syncStatus === 'demo_session' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-orange-500/40 bg-orange-500/10 px-3.5 py-2.5 text-xs text-orange-200">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              {lang === 'om'
                ? "Offline/Demo token moofaa irra jirtu — device biroorratti hin mul'atu. Device hundumaatti wal-qabsiisuuf haaraa seenaa:"
                : 'You are on an offline demo token, so saves stay in this browser only. Re-login with your live server Admin session to publish across all devices.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearTokens();
              if (typeof window !== 'undefined') {
                const base = window.location.pathname.startsWith('/Mettu_karl_HMIS')
                  ? '/Mettu_karl_HMIS'
                  : '';
                window.location.href = `${base}/login`;
              }
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-[11px] transition cursor-pointer"
          >
            {lang === 'om' ? 'Ba\'i & Haaraa Seeni (Admin)' : 'Sign Out & Re-Login Admin'}
          </button>
        </div>
      )}

      {/* Live Physical LED Board Preview */}
      <div className="space-y-2 rounded-xl bg-[#090e18] border border-[#1d2638] p-3 sm:p-4">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'om' ? 'Ilaalcha Kallattii (Live LED Matrix Preview)' : 'Live LED Matrix Preview'}
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            {draft.speed.toFixed(2)}x ({pxPerSec} px/s) • Scale {draft.fontScale.toFixed(2)}x •{' '}
            {draft.colorHex.toUpperCase()}
          </span>
        </div>
        <DigitalLedBoard config={draft} variant="preview" />
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (Message, Presets & Palette) */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* 1. Custom Message Input & Presets */}
          <div className="bg-[#0c121e] border border-[#1b2436] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-led-message-input"
                className="text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {lang === 'om'
                    ? '1. Barreeffama Boordii LED (Scrolling Message):'
                    : '1. Scrolling Marquee Message:'}
                </span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">{draft.message.length}/300</span>
            </div>
            <input
              id="admin-led-message-input"
              type="text"
              maxLength={300}
              value={draft.message}
              onChange={(e) => updateDraft({ message: e.target.value })}
              placeholder="METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL"
              className="w-full rounded-xl border border-[#26354d] bg-[#141c2e] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 mr-1">
                {lang === 'om' ? 'Filannoo Salphaa (Presets):' : 'Quick Presets:'}
              </span>
              {LED_MESSAGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateDraft({ message: preset.text })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                    draft.message === preset.text
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                      : 'bg-[#141c2c] text-slate-300 border-[#222d42] hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Color Palette + Custom Picker */}
          <div className="bg-[#0c121e] border border-[#1b2436] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {lang === 'om'
                    ? '2. Halluuwwan LED (Color Palette & Custom Picker):'
                    : '2. LED Diode Color Palette:'}
                </span>
              </span>
              <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 cursor-pointer bg-[#141c2c] border border-[#26354d] px-2 py-0.5 rounded-lg">
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
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#182238] border-white/60 text-white shadow-sm'
                        : 'bg-[#121928] border-[#1f293d] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: swatch.hex,
                        boxShadow: `0 0 8px ${swatch.hex}`,
                      }}
                    />
                    <span className="text-[11px] font-semibold truncate">
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
          <div className="bg-[#0c121e] border border-[#1b2436] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    draft.isPlaying
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#141c2c] border border-[#24314a] text-slate-300 hover:text-white cursor-pointer"
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
  );
}
