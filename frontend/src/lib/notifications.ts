/**
 * Mettu Karl Referral Hospital — Live In-App Executive Notification & Reaction Hub.
 *
 * Allows Hospital Administrator to dispatch urgent alerts, directives, Code Blue calls,
 * and broadcasts to Doctors, Nurses, Pharmacists, Technicians, and Patients.
 * Recipients instantly receive notifications, view them in real time, and react
 * (e.g., "On My Way", "At Bedside", "Dispensed", "Acknowledged", or write a reply note).
 */
'use client';

export type NotificationType = 'code_blue' | 'urgent_rx' | 'directive' | 'broadcast' | 'custom';

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
  recipientRole: 'all' | 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'billing' | 'patient';
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
}

const STORAGE_KEY = 'mkh_hospital_notifications_v2';
const EVENT_NAME = 'mkh-notification-update';

// Default starter notifications so users immediately see realistic clinical alerts
const DEFAULT_NOTIFICATIONS: HospitalNotification[] = [
  {
    id: 'notif-1',
    senderName: 'Hospital Executive Administrator',
    senderRole: 'admin',
    recipientRole: 'doctor',
    recipientId: 'doc-1',
    recipientName: 'Dr. Bekele Tadesse',
    type: 'code_blue',
    channel: 'both',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    read: false,
    title: {
      en: '🚨 CODE BLUE: Urgent Trauma Resuscitation',
      om: '🚨 KOODII CUQULIISA: Yaala Tasaa Hatattamaa',
      am: '🚨 ኮድ ብሉ: አስቸኳይ የአደጋ ጊዜ ህክምና',
    },
    message: {
      en: 'Urgent resuscitation required at Emergency Bay 2. Crash cart #2 and anesthesia team dispatched.',
      om: 'Kutaa Tasaa Bay 2 tti yaalli hatattamaa barbaadameera. Gaariin qorichaa fi ogeeyyiin dhiyaataniiru.',
      am: 'በድንገተኛ ክፍል 2 አስቸኳይ ህክምና ይፈለጋል። የህክምና ጋሪና ቡድን ተሰማርቷል።',
    },
  },
  {
    id: 'notif-2',
    senderName: 'Hospital Executive Administrator',
    senderRole: 'admin',
    recipientRole: 'pharmacist',
    recipientId: 'phm-1',
    recipientName: 'Pharm. Obsa Kuma',
    type: 'urgent_rx',
    channel: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    read: false,
    title: {
      en: '💊 Urgent Medication Clearance (Inpatient)',
      om: '💊 Qoricha Hatattamaa (Kutaa Ciisichaa)',
      am: '💊 አስቸኳይ የመድኃኒት አቅርቦት (ተኝቶ ታካሚ)',
    },
    message: {
      en: 'Immediate Ceftriaxone & IV Fluid clearance needed for Bed 8 (Surgical Inpatient Ward).',
      om: 'Siree 8 (Wardi Baqaqsaa) tiif qorichi Seefitiiraayiksoon fi Dhangala\'aan hatattamaan haa kennamu.',
      am: 'ለቀዶ ህክምና አልጋ 8 አስቸኳይ ሴፍትሪያክሶንና ፈሳሽ መድኃኒት ይፈለጋል።',
    },
  },
  {
    id: 'notif-3',
    senderName: 'Hospital Executive Administrator',
    senderRole: 'admin',
    recipientRole: 'all',
    type: 'directive',
    channel: 'sms',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1h 15m ago
    read: true,
    title: {
      en: '📋 Executive Directive: EHSTG Quality Standards',
      om: '📋 Qajeelfama Bulchiinsaa: Istaandaardii EHSTG',
      am: '📋 የአስተዳደር መመሪያ: የEHSTG ጥራት ደረጃ',
    },
    message: {
      en: 'All duty clinicians: Please ensure all OPD and Inpatient vitals are synced to FHIR R4 before shift change.',
      om: 'Ogeeyyii hundaaf: Xumura shiftii dura mallattooleen dhukkubsattootaa FHIR irratti galmaa\'uu qaba.',
      am: 'ለህክምና ሰራተኞች በሙሉ: የስራ ሰዓት ከማለቁ በፊት የታካሚዎች መረጃ በሲስተሙ መመዝገቡን ያረጋግጡ።',
    },
    reaction: {
      type: 'acknowledged',
      label: {
        en: '👍 Acknowledged & Complied',
        om: '👍 Hubadheera, Hojiirra Ooleera',
        am: '👍 ተረድቻለሁ፣ ተፈፅሟል',
      },
      responderName: 'Dr. Bekele Tadesse',
      responderRole: 'doctor',
      timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
  },
  {
    id: 'notif-4',
    senderName: 'Hospital Executive Administrator',
    senderRole: 'admin',
    recipientRole: 'patient',
    recipientId: 'pat-1',
    recipientName: 'Tolosa Dinsa',
    type: 'custom',
    channel: 'sms',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 mins ago
    read: false,
    title: {
      en: '🏥 Pharmacy Dispensing Notice',
      om: '🏥 Beeksisa Kenniinsa Qorichaa',
      am: '🏥 የመድኃኒት መውሰጃ ማሳወቂያ',
    },
    message: {
      en: 'Dear Tolosa, your prescribed discharge medications are prepared and ready at Pharmacy Counter 1.',
      om: 'Kabajamoo Tolosaa, qorichi keessan qophaa\'ee Farmaasii Kaawuntarii 1 tti qophii ta\'eera.',
      am: 'ክቡር ቶሎሳ፣ የታዘዘልዎት መድኃኒት ተዘጋጅቶ በፋርማሲ መስኮት 1 ዝግጁ ሆኗል።',
    },
  },
];

/**
 * Fetch all stored notifications, falling back to defaults.
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
 * Fetch notifications filtered for a specific role or username.
 */
export function getNotificationsForUser(userRole?: string, username?: string): HospitalNotification[] {
  const all = getAllNotifications();
  if (!userRole || userRole === 'admin' || userRole === 'super_admin') {
    return all;
  }

  return all.filter((n) => {
    // 1. Matches broadcast to all
    if (n.recipientRole === 'all') return true;
    // 2. Matches user role (e.g. doctor, nurse, pharmacist, patient)
    if (n.recipientRole === userRole) return true;
    // 3. Matches recipient username/id
    if (username && n.recipientName && n.recipientName.toLowerCase().includes(username.toLowerCase())) {
      return true;
    }
    return false;
  });
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

/**
 * Mark a notification as read.
 */
export function markNotificationAsRead(id: string): void {
  const current = getAllNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch {
      // ignore
    }
  }
}

/**
 * React to a notification (e.g. "On My Way", "At Bedside", "Dispensed", "Acknowledged").
 */
export function reactToNotification(
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
): void {
  const current = getAllNotifications();
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch {
      // ignore
    }
  }
}

/**
 * Clear all notifications.
 */
export function clearAllNotifications(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch {
      // ignore
    }
  }
}
