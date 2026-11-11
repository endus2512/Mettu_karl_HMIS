/**
 * Digital LED Marquee Signboard configuration, presets, and hybrid persistence.
 * Syncs with FastAPI (`/api/v1/signage`) when online and maintains resilient
 * `localStorage` + `BroadcastChannel` synchronization for offline/demo mode.
 */
import apiClient from '@/lib/api';

export type ScrollDirection = 'rtl' | 'ltr';

export interface LedColorOption {
  id: string;
  label: string;
  labelOm: string;
  hex: string;
}

export interface LedSignageConfig {
  message: string;
  colorPreset: string;
  colorHex: string;
  speed: number;
  fontScale: number;
  letterSpacing: number;
  glowIntensity: number;
  showGridDots: boolean;
  showScanlines: boolean;
  isPlaying: boolean;
  direction: ScrollDirection;
  offsetY: number;
  updatedAt: string;
  updatedBy: string;
  syncedRemote?: boolean;
}

export const LED_COLOR_PALETTE: LedColorOption[] = [
  { id: 'amber_yellow', label: 'Amber Gold', labelOm: 'Keelloo Warqee', hex: '#ffb800' },
  { id: 'classic_red', label: 'Classic Red', labelOm: 'Diimaa', hex: '#ff2b3a' },
  { id: 'emerald_green', label: 'Emerald Green', labelOm: 'Magariisa', hex: '#10ff7a' },
  { id: 'neon_blue', label: 'Neon Blue', labelOm: 'Cuquliisa', hex: '#3b82ff' },
  { id: 'cyan', label: 'Aqua Cyan', labelOm: 'Saayaanii', hex: '#00f0ff' },
  { id: 'hot_pink', label: 'Hot Pink', labelOm: 'Roosa', hex: '#ff2ec4' },
  { id: 'purple', label: 'Electric Purple', labelOm: 'Diimaa-Cuquliisa', hex: '#b84dff' },
  { id: 'pure_white', label: 'Pure White', labelOm: 'Adii Qulqulluu', hex: '#f8fbff' },
];

export const LED_MESSAGE_PRESETS: Array<{ label: string; text: string }> = [
  {
    label: 'Official Name',
    text: 'METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL',
  },
  {
    label: 'Welcome (Oromoo)',
    text: 'BAGA NAGAAN DHUFTAN!  •  METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL',
  },
  {
    label: 'Emergency 907',
    text: '24/7 EMERGENCY HOTLINE: 907 (TOLL-FREE)  •  METTU KARL REFERRAL HOSPITAL',
  },
  {
    label: 'Departments Active',
    text: 'OPD • EMERGENCY • ICU • MATERNITY • LABORATORY • PHARMACY OPERATIONAL',
  },
];

export const DEFAULT_LED_SIGNAGE_CONFIG: LedSignageConfig = {
  message: 'METTU KARL COMPREHENSIVE SPECIALIZED HOSPITAL',
  colorPreset: 'amber_yellow',
  colorHex: '#ffb800',
  speed: 1.0,
  fontScale: 1.0,
  letterSpacing: 0.12,
  glowIntensity: 80,
  showGridDots: true,
  showScanlines: true,
  isPlaying: true,
  direction: 'rtl',
  offsetY: 0,
  updatedAt: '2026-11-11T00:00:00.000Z',
  updatedBy: 'System Default',
};

const STORAGE_KEY = 'mk_led_signage_config_v1';
const BROADCAST_CHANNEL_NAME = 'mk_led_signage_channel';

interface ApiSignagePayload {
  message: string;
  color_preset: string;
  color_hex: string;
  speed: number;
  font_scale: number;
  letter_spacing: number;
  glow_intensity: number;
  show_grid_dots: boolean;
  show_scanlines: boolean;
  is_playing: boolean;
  direction: ScrollDirection;
  offset_y: number;
  updated_at?: string;
  updated_by?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeIsoTimestamp(value?: string): string {
  if (!value) return new Date().toISOString();
  const trimmed = value.trim().replace(' ', 'T');
  if (/[Z+-]\d{2}:?\d{2}$/.test(trimmed) || trimmed.endsWith('Z')) {
    return trimmed;
  }
  return `${trimmed}Z`;
}

export function normalizeLedConfig(raw: Partial<LedSignageConfig>): LedSignageConfig {
  const cleanMsg =
    typeof raw.message === 'string' && raw.message.trim().length > 0
      ? raw.message.trim().slice(0, 300)
      : DEFAULT_LED_SIGNAGE_CONFIG.message;
  const hex =
    typeof raw.colorHex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(raw.colorHex)
      ? raw.colorHex
      : DEFAULT_LED_SIGNAGE_CONFIG.colorHex;

  return {
    message: cleanMsg,
    colorPreset: raw.colorPreset || 'custom',
    colorHex: hex,
    speed: clamp(Number(raw.speed ?? DEFAULT_LED_SIGNAGE_CONFIG.speed), 0.1, 5.0),
    fontScale: clamp(Number(raw.fontScale ?? DEFAULT_LED_SIGNAGE_CONFIG.fontScale), 0.55, 1.5),
    letterSpacing: clamp(
      Number(raw.letterSpacing ?? DEFAULT_LED_SIGNAGE_CONFIG.letterSpacing),
      0.02,
      0.28,
    ),
    glowIntensity: Math.round(
      clamp(Number(raw.glowIntensity ?? DEFAULT_LED_SIGNAGE_CONFIG.glowIntensity), 0, 100),
    ),
    showGridDots: raw.showGridDots ?? DEFAULT_LED_SIGNAGE_CONFIG.showGridDots,
    showScanlines: raw.showScanlines ?? DEFAULT_LED_SIGNAGE_CONFIG.showScanlines,
    isPlaying: raw.isPlaying ?? DEFAULT_LED_SIGNAGE_CONFIG.isPlaying,
    direction: raw.direction === 'ltr' ? 'ltr' : 'rtl',
    offsetY: Math.round(clamp(Number(raw.offsetY ?? 0), -40, 60)),
    updatedAt: normalizeIsoTimestamp(raw.updatedAt),
    updatedBy: raw.updatedBy || 'Admin',
    syncedRemote: raw.syncedRemote,
  };
}

function fromApiPayload(data: ApiSignagePayload): LedSignageConfig {
  return normalizeLedConfig({
    message: data.message,
    colorPreset: data.color_preset,
    colorHex: data.color_hex,
    speed: data.speed,
    fontScale: data.font_scale,
    letterSpacing: data.letter_spacing,
    glowIntensity: data.glow_intensity,
    showGridDots: data.show_grid_dots,
    showScanlines: data.show_scanlines,
    isPlaying: data.is_playing,
    direction: data.direction,
    offsetY: data.offset_y,
    updatedAt: normalizeIsoTimestamp(data.updated_at),
    updatedBy: data.updated_by || 'Admin',
    syncedRemote: true,
  });
}

function toApiPayload(cfg: LedSignageConfig): ApiSignagePayload {
  return {
    message: cfg.message,
    color_preset: cfg.colorPreset,
    color_hex: cfg.colorHex,
    speed: Number(cfg.speed.toFixed(2)),
    font_scale: Number(cfg.fontScale.toFixed(2)),
    letter_spacing: Number(cfg.letterSpacing.toFixed(2)),
    glow_intensity: Math.round(cfg.glowIntensity),
    show_grid_dots: cfg.showGridDots,
    show_scanlines: cfg.showScanlines,
    is_playing: cfg.isPlaying,
    direction: cfg.direction,
    offset_y: Math.round(cfg.offsetY),
  };
}

export function readCachedLedSignage(): LedSignageConfig {
  if (typeof window === 'undefined') return DEFAULT_LED_SIGNAGE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LED_SIGNAGE_CONFIG;
    return normalizeLedConfig(JSON.parse(raw) as Partial<LedSignageConfig>);
  } catch {
    return DEFAULT_LED_SIGNAGE_CONFIG;
  }
}

function writeCachedLedSignage(cfg: LedSignageConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      ch.postMessage(cfg);
      ch.close();
    }
  } catch {
    // Storage quota or privacy mode fallback
  }
}

export type SignageSyncReason =
  | 'synced'
  | 'demo_session'
  | 'unauthorized'
  | 'backend_unreachable';

/**
 * Returns true only when the browser holds a live FastAPI JWT (not an offline
 * fallback `.demo-sig` / `.demo-patient-sig` token).
 */
export function hasServerAuthSession(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  return (
    !token.includes('demo') &&
    !token.includes('registered')
  );
}

/** Value equality check used by polling subscribers to prevent animation re-renders. */
export function isSameLedConfig(a: LedSignageConfig, b: LedSignageConfig): boolean {
  return (
    a.message === b.message &&
    a.colorPreset === b.colorPreset &&
    a.colorHex === b.colorHex &&
    a.speed === b.speed &&
    a.fontScale === b.fontScale &&
    a.letterSpacing === b.letterSpacing &&
    a.glowIntensity === b.glowIntensity &&
    a.showGridDots === b.showGridDots &&
    a.showScanlines === b.showScanlines &&
    a.isPlaying === b.isPlaying &&
    a.direction === b.direction &&
    a.offsetY === b.offsetY &&
    a.updatedAt === b.updatedAt &&
    a.updatedBy === b.updatedBy &&
    a.syncedRemote === b.syncedRemote
  );
}

export async function fetchLedSignageWithStatus(): Promise<{
  config: LedSignageConfig;
  backendConnected: boolean;
}> {
  const local = readCachedLedSignage();
  try {
    const res = await apiClient.get<ApiSignagePayload>('/signage', {
      timeout: 3500,
      params: { _t: Date.now() },
    });
    if (res.data?.message) {
      const remote = fromApiPayload(res.data);
      const localEdited = local.syncedRemote === false && local.updatedBy !== 'System Default';
      const localTs = Date.parse(local.updatedAt) || 0;
      const remoteTs = Date.parse(remote.updatedAt) || 0;
      if (localEdited && (remote.updatedBy === 'System Default' || localTs > remoteTs)) {
        return { config: local, backendConnected: true };
      }
      if (!isSameLedConfig(local, remote)) {
        writeCachedLedSignage(remote);
      }
      return { config: remote, backendConnected: true };
    }
  } catch {
    // Graceful fallback when running standalone without backend
  }
  return { config: local, backendConnected: false };
}

export async function fetchLedSignageConfig(): Promise<LedSignageConfig> {
  const { config } = await fetchLedSignageWithStatus();
  return config;
}

export async function saveLedSignageConfig(draft: LedSignageConfig): Promise<{
  config: LedSignageConfig;
  syncedToServer: boolean;
  syncReason: SignageSyncReason;
}> {
  const normalized = normalizeLedConfig({
    ...draft,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin',
  });

  if (typeof window !== 'undefined' && !hasServerAuthSession()) {
    const hasToken = Boolean(localStorage.getItem('access_token'));
    writeCachedLedSignage({ ...normalized, syncedRemote: false });
    return {
      config: { ...normalized, syncedRemote: false },
      syncedToServer: false,
      syncReason: hasToken ? 'demo_session' : 'unauthorized',
    };
  }

  try {
    const res = await apiClient.put<ApiSignagePayload>('/signage', toApiPayload(normalized), {
      timeout: 5000,
    });
    if (res.data?.message) {
      const serverCfg = fromApiPayload(res.data);
      writeCachedLedSignage(serverCfg);
      return { config: serverCfg, syncedToServer: true, syncReason: 'synced' };
    }
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    writeCachedLedSignage({ ...normalized, syncedRemote: false });
    if (status === 401 || status === 403) {
      return {
        config: { ...normalized, syncedRemote: false },
        syncedToServer: false,
        syncReason: 'unauthorized',
      };
    }
    return {
      config: { ...normalized, syncedRemote: false },
      syncedToServer: false,
      syncReason: 'backend_unreachable',
    };
  }

  writeCachedLedSignage({ ...normalized, syncedRemote: false });
  return {
    config: { ...normalized, syncedRemote: false },
    syncedToServer: false,
    syncReason: 'backend_unreachable',
  };
}

export function subscribeLedSignage(onUpdate: (cfg: LedSignageConfig) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        onUpdate(normalizeLedConfig(JSON.parse(e.newValue) as Partial<LedSignageConfig>));
      } catch {
        // ignore malformed cache
      }
    }
  };
  window.addEventListener('storage', onStorage);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent) => {
      if (event.data) {
        onUpdate(normalizeLedConfig(event.data as Partial<LedSignageConfig>));
      }
    };
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    channel?.close();
  };
}
