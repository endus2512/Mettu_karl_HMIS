/**
 * Mettu Karl Referral Hospital — Real-Time Clinical Event Bus & WebSocket Push Hub.
 *
 * Provides:
 * 1. Live bidirectional WebSocket connection to FastAPI `/api/v1/events/ws`
 * 2. Instant audible chime/siren alerts for Code Blue & critical lab/triage alerts
 * 3. PostgreSQL backend synchronization for persistent alerts and reactions
 * 4. Offline resilience fallback to localStorage
 */
'use client';

import apiClient from '@/lib/api';

export type NotificationType =
  | 'code_blue'
  | 'code_red'
  | 'urgent_rx'
  | 'directive'
  | 'broadcast'
  | 'lab_panic'
  | 'mci_alert'
  | 'iomt_alarm'
  | 'staff_signup_alarm'
  | 'staff_first_login'
  | 'staff_login_blocked_alarm'
  | 'staff_impersonation_alarm'
  | 'staff_security_alarm'
  | 'staff_status_change'
  | 'custom';

export type ReactionType =
  | 'on_my_way'
  | 'at_bedside'
  | 'dispensed'
  | 'in_progress'
  | 'acknowledged'
  | 'custom_reply';

export interface NotificationReaction {
  type: ReactionType;
  label: {
    en: string;
    om: string;
    am: string;
  };
  responderName: string;
  responderRole: string;
  timestamp: string;
  replyNote?: string;
}

export interface HospitalNotification {
  id: string;
  senderName: string;
  senderRole: string;
  recipientRole: 'all' | 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'billing' | 'admin' | 'super_admin' | 'patient';
  recipientId?: string;
  recipientName?: string;
  title: {
    en: string;
    om: string;
    am: string;
  };
  message: {
    en: string;
    om: string;
    am: string;
  };
  type: NotificationType;
  channel: 'sms' | 'system' | 'both';
  timestamp: string;
  read: boolean;
  reaction?: NotificationReaction;
  backendId?: number;
}

const STORAGE_KEY = 'mkh_hospital_notifications_v3';
export const EVENT_NAME = 'mkh-notification-update';

// Default starter notifications for offline / initial boot
const DEFAULT_NOTIFICATIONS: HospitalNotification[] = [
  {
    id: 'notif-1',
    backendId: 1,
    senderName: 'Hospital Executive Administrator',
    senderRole: 'admin',
    recipientRole: 'doctor',
    recipientId: 'doc-1',
    recipientName: 'Dr. Bekele Tadesse',
    type: 'code_blue',
    channel: 'both',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
    title: {
      en: 'CODE BLUE: Urgent Trauma Resuscitation',
      om: 'KOODII CUQULIISA: Yaala Tasaa Hatattamaa',
      am: 'ኮድ ብሉ: አስቸኳይ የአደጋ ጊዜ ህክምና',
    },
    message: {
      en: 'Urgent resuscitation required at Emergency Bay 2. Crash cart #2 and anesthesia team dispatched.',
      om: 'Kutaa Tasaa Bay 2 tti yaalli hatattamaa barbaadameera. Gaariin qorichaa fi ogeeyyiin dhiyaataniiru.',
      am: 'በድንገተኛ ክፍል 2 አስቸኳይ ህክምና ይፈለጋል። የህክምና ጋሪና ቡድን ተሰማርቷል።',
    },
  },
  {
    id: 'notif-2',
    backendId: 2,
    senderName: 'Hospital Executive Administrator',
    senderRole: 'admin',
    recipientRole: 'pharmacist',
    recipientId: 'phm-1',
    recipientName: 'Pharm. Obsa Kuma',
    type: 'urgent_rx',
    channel: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    read: false,
    title: {
      en: 'Urgent Medication Clearance (Inpatient)',
      om: 'Qoricha Hatattamaa (Kutaa Ciisichaa)',
      am: 'አስቸኳይ የመድኃኒት አቅርቦት (ተኝቶ ታካሚ)',
    },
    message: {
      en: 'Immediate Ceftriaxone & IV Fluid clearance needed for Bed 8 (Surgical Inpatient Ward).',
      om: 'Siree 8 (Wardi Baqaqsaa) tiif qorichi Seefitiiraayiksoon fi Dhangala\'aan hatattamaan haa kennamu.',
      am: 'ለቀዶ ህክምና አልጋ 8 አስቸኳይ ሴፍትሪያክሶንና ፈሳሽ መድኃኒት ይፈለጋል።',
    },
  },
  {
    id: 'notif-3',
    backendId: 3,
    senderName: 'Hospital Executive Administrator',
    senderRole: 'admin',
    recipientRole: 'all',
    type: 'directive',
    channel: 'sms',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    read: true,
    title: {
      en: 'Executive Directive: EHSTG Quality Standards',
      om: 'Qajeelfama Bulchiinsaa: Istaandaardii EHSTG',
      am: 'የአስተዳደር መመሪያ: የEHSTG ጥራት ደረጃ',
    },
    message: {
      en: 'All duty clinicians: Please ensure all OPD and Inpatient vitals are synced to FHIR R4 before shift change.',
      om: "Ogeeyyii hundaaf: Xumura shiftii dura mallattooleen dhukkubsattootaa FHIR irratti galmaa'uu qaba.",
      am: 'ለህክምና ሰራተኞች በሙሉ: የስራ ሰዓት ከማለቁ በፊት የታካሚዎች መረጃ በሲስተሙ መመዝገቡን ያረጋግጡ።',
    },
    reaction: {
      type: 'acknowledged',
      label: {
        en: 'Acknowledged & Complied',
        om: 'Hubadheera, Hojiirra Ooleera',
        am: 'ተረድቻለሁ፣ ተፈፅሟል',
      },
      responderName: 'Dr. Bekele Tadesse',
      responderRole: 'doctor',
      timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
  },
];

/**
 * Web Audio API synthesizer for sub-second clinical sound alerts.
 */
export function playClinicalAudioAlert(severity: 'emergency' | 'critical' | 'info' | string): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (severity === 'emergency' || severity === 'code_blue') {
      // Dual-tone hospital emergency siren (880Hz / 659Hz)
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      osc1.frequency.setValueAtTime(659, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.6);
    } else {
      // Gentle harmonic chime for standard clinical notices (523Hz -> 659Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // AudioContext might be blocked until user gesture, ignore silently
  }
}

/**
 * Fetch all notifications currently stored in local cache.
 */
export function getAllNotifications(): HospitalNotification[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(raw) as HospitalNotification[];
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

/**
 * Add a new notification (called when Admin sends a message or broadcast).
 */
export function addNotification(
  item: Omit<HospitalNotification, 'id' | 'timestamp' | 'read'>
): HospitalNotification {
  const current = getAllNotifications();
  const newNotif: HospitalNotification = {
    ...item,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };

  const updated = [newNotif, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newNotif }));
    } catch {
      // ignore
    }
  }
  return newNotif;
}

let inFlightNotificationsSync: Promise<HospitalNotification[]> | null = null;
let lastNotificationsSyncAt = 0;
const NOTIFICATIONS_MIN_GAP_MS = 4000;

/**
 * Synchronize live notifications from the FastAPI PostgreSQL backend (deduplicated & throttled).
 */
export async function fetchLiveBackendNotifications(): Promise<HospitalNotification[]> {
  const now = Date.now();
  if (inFlightNotificationsSync) {
    return inFlightNotificationsSync;
  }
  if (now - lastNotificationsSyncAt < NOTIFICATIONS_MIN_GAP_MS) {
    return getAllNotifications();
  }

  inFlightNotificationsSync = (async () => {
    try {
      const res = await apiClient.get<{ items: Array<Record<string, unknown>>; total: number }>('/events/notifications');
      lastNotificationsSyncAt = Date.now();
      const items = res?.data?.items;
      if (Array.isArray(items)) {
        const liveItems: HospitalNotification[] = items.map((item) => {
          const idStr = String(item.id);
          const titleStr = String(item.title || 'Clinical Alert');
          const msgStr = String(item.message || '');
          const role = (item.target_role as HospitalNotification['recipientRole']) || 'all';

          let reactionObj: NotificationReaction | undefined;
          if (item.reaction_type) {
            reactionObj = {
              type: item.reaction_type as ReactionType,
              label: {
                en: String(item.reaction_type).replace(/_/g, ' '),
                om: String(item.reaction_type).replace(/_/g, ' '),
                am: String(item.reaction_type).replace(/_/g, ' '),
              },
              responderName: String(item.reaction_by || 'Clinician'),
              responderRole: 'staff',
              timestamp: String(item.reacted_at || new Date().toISOString()),
              replyNote: item.reaction_note ? String(item.reaction_note) : undefined,
            };
          }

          return {
            id: `backend-${idStr}`,
            backendId: Number(item.id),
            senderName: String(item.sender_name || 'Hospital Administration'),
            senderRole: String(item.sender_role || 'admin'),
            recipientRole: role,
            title: {
              en: titleStr,
              om: titleStr,
              am: titleStr,
            },
            message: {
              en: msgStr,
              om: msgStr,
              am: msgStr,
            },
            type: (item.category as NotificationType) || 'broadcast',
            channel: 'system',
            timestamp: String(item.created_at || new Date().toISOString()),
            read: Boolean(item.is_read),
            reaction: reactionObj,
          };
        });

        if (liveItems.length > 0 && typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(liveItems));
          window.dispatchEvent(new CustomEvent(EVENT_NAME));
          return liveItems;
        }
      }
    } catch {
      // Backend offline or token pending; fall back smoothly to cached items
    } finally {
      inFlightNotificationsSync = null;
    }
    return getAllNotifications();
  })();

  return inFlightNotificationsSync;
}

/**
 * Fetch notifications filtered for a specific role or username.
 */
export function getNotificationsForUser(userRole?: string, username?: string): HospitalNotification[] {
  const all = getAllNotifications();
  if (!userRole || userRole === 'admin' || userRole === 'super_admin') {
    return all;
  }

  return all.filter((n) => {
    if (n.recipientRole === 'all') return true;
    if (n.recipientRole === userRole) return true;
    if (username && n.recipientName && n.recipientName.toLowerCase().includes(username.toLowerCase())) {
      return true;
    }
    return false;
  });
}

/**
 * Submit clinical reaction to backend and local storage.
 */
export async function reactToNotification(
  id: string,
  reaction: {
    type: ReactionType;
    label: {
      en: string;
      om: string;
      am: string;
    };
    responderName: string;
    responderRole: string;
    replyNote?: string;
  }
): Promise<void> {
  // 1. Update local cache immediately for zero latency
  const current = getAllNotifications();
  const target = current.find((n) => n.id === id);
  const updated = current.map((n) => {
    if (n.id === id) {
      return {
        ...n,
        read: true,
        reaction: {
          ...reaction,
          timestamp: new Date().toISOString(),
        },
      };
    }
    return n;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }

  // 2. Post reaction to FastAPI PostgreSQL backend
  if (target?.backendId) {
    try {
      await apiClient.post(`/events/notifications/${target.backendId}/react`, {
        reaction_type: reaction.type,
        reaction_note: reaction.replyNote,
      });
    } catch {
      // Backend error logged, local state preserved
    }
  }
}

/**
 * Mark a notification as read in both local storage and database.
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  const current = getAllNotifications();
  const target = current.find((n) => n.id === id);
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }

  if (target?.backendId) {
    try {
      await apiClient.post(`/events/notifications/${target.backendId}/read`, {});
    } catch {
      // Ignore network failure
    }
  }
}

/**
 * Clear all notifications in local storage and backend.
 */
export async function clearAllNotifications(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
  try {
    await apiClient.post('/events/notifications/clear-all', {});
  } catch {
    // Ignore network failure
  }
}

/**
 * Global Real-Time WebSocket Connection to FastAPI `/api/v1/events/ws`.
 * Handles automatic reconnect, heartbeat pings, and live audio dispatch.
 */
let eventSocket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

export function connectClinicalEventBusWebSocket(
  token?: string,
  onEvent?: (event: Record<string, unknown>) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const host = window.location.hostname || '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  if (!isLocalHost) {
    // Cloud serverless deployments use DB-backed polling instead of stateful WS on port 8000
    return () => {};
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const port = '8000'; // FastAPI backend port
  const wsUrl = `${protocol}//${host}:${port}/api/v1/events/ws${token ? `?token=${token}` : ''}`;

  let cancelled = false;

  function connect() {
    if (cancelled) return;
    try {
      eventSocket = new WebSocket(wsUrl);

      eventSocket.onopen = () => {
        // Send heartbeat ping every 30 seconds
        const pingInterval = setInterval(() => {
          if (eventSocket?.readyState === WebSocket.OPEN) {
            eventSocket.send(JSON.stringify({ type: 'PING' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      eventSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'EMERGENCY_BROADCAST' || data.type === 'ADMIN_SECURITY_ALARM') {
            const p = data.payload || {};
            const isSecurityAlarm = data.type === 'ADMIN_SECURITY_ALARM';
            playClinicalAudioAlert('emergency');

            // Prepend to local notifications
            const current = getAllNotifications();
            const newNotif: HospitalNotification = {
              id: `${isSecurityAlarm ? 'sec' : 'ws'}-${p.id || Date.now()}`,
              backendId: p.id,
              senderName: p.sender_name || (isSecurityAlarm ? 'Security Guard' : 'Emergency Command'),
              senderRole: p.sender_role || 'admin',
              recipientRole: isSecurityAlarm ? 'admin' : 'all',
              title: {
                en: p.title || (isSecurityAlarm ? 'SECURITY ALARM' : 'CODE BLUE EMERGENCY'),
                om: p.title || (isSecurityAlarm ? 'AKEEKKACHIISA NAGEENYAA' : 'KOODII CUQULIISA'),
                am: p.title || (isSecurityAlarm ? 'የደህንነት ማንቂያ' : 'ኮድ ብሉ አስቸኳይ'),
              },
              message: {
                en: p.message || '',
                om: p.message || '',
                am: p.message || '',
              },
              type: (p.category as NotificationType) || (isSecurityAlarm ? 'staff_security_alarm' : 'code_blue'),
              channel: 'both',
              timestamp: p.timestamp || new Date().toISOString(),
              read: false,
            };
            const deduped = current.filter((item) => !newNotif.backendId || item.backendId !== newNotif.backendId);
            const updated = [newNotif, ...deduped];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newNotif }));
          } else if (data.type === 'CLINICAL_REACTION') {
            // Refresh list so reaction badges reflect across all workstations
            fetchLiveBackendNotifications();
          }

          if (onEvent) {
            onEvent(data);
          }
        } catch {
          // ignore parsing error
        }
      };

      eventSocket.onclose = () => {
        if (!cancelled && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 5000);
        }
      };

      eventSocket.onerror = () => {
        eventSocket?.close();
      };
    } catch {
      if (!cancelled && !reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, 5000);
      }
    }
  }

  connect();

  return () => {
    cancelled = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (eventSocket) {
      eventSocket.close();
      eventSocket = null;
    }
  };
}
