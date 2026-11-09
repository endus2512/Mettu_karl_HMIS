/**
 * Offline-First PWA & Edge Data Synchronization Engine.
 *
 * Utilizes browser IndexedDB to provide reliable zero-connectivity operations
 * across peripheral outreach health posts, ambulances, and remote wards.
 * Automatically buffers registrations, vitals observations, and prescriptions
 * into an outbox, and syncs idempotently with Mettu Karl central server on reconnection.
 */
import apiClient from '@/lib/api';

const DB_NAME = 'MettuKarl_EdgeSync_DB';
const DB_VERSION = 1;
const OUTBOX_STORE = 'outbox';
const CACHED_PATIENTS_STORE = 'cached_patients';

export interface OfflinePatientData {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  phone_number?: string;
  kebele?: string;
  woreda?: string;
  mrn?: string;
}

export interface OfflineObservationData {
  patient_mrn: string;
  vital_type: string;
  value: string;
  unit?: string;
}

export interface OfflinePrescriptionData {
  patient_mrn: string;
  medications: Array<{
    name: string;
    dosage: string;
    quantity: number;
    route?: string;
  }>;
}

export interface OutboxItem {
  temp_id: string;
  entity_type: 'patient' | 'observation' | 'prescription';
  payload: any;
  created_at: string;
  status: 'pending' | 'syncing' | 'failed';
  retry_count: number;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
  resolutions?: Array<{
    temp_id: string;
    permanent_id: number;
    entity_type: string;
    status: string;
    message: string;
  }>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const store = db.createObjectStore(OUTBOX_STORE, { keyPath: 'temp_id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('entity_type', 'entity_type', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
      if (!db.objectStoreNames.contains(CACHED_PATIENTS_STORE)) {
        const pStore = db.createObjectStore(CACHED_PATIENTS_STORE, { keyPath: 'id' });
        pStore.createIndex('mrn', 'mrn', { unique: false });
        pStore.createIndex('phone_number', 'phone_number', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dispatchSyncEvent(type: 'change' | 'synced', detail?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`mkh-offline-${type}`, { detail }));
  }
}

/**
 * Queue a patient registration offline in local outbox.
 */
export async function queueOfflinePatient(data: OfflinePatientData): Promise<string> {
  const db = await openDB();
  const temp_id = `OFFLINE-PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const item: OutboxItem = {
    temp_id,
    entity_type: 'patient',
    payload: {
      ...data,
      temp_id,
      created_offline_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
    status: 'pending',
    retry_count: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const req = store.add(item);
    req.onsuccess = () => {
      dispatchSyncEvent('change');
      resolve(temp_id);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Queue an observation / vital signs measurement offline.
 */
export async function queueOfflineObservation(data: OfflineObservationData): Promise<string> {
  const db = await openDB();
  const temp_id = `OFFLINE-OBS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const item: OutboxItem = {
    temp_id,
    entity_type: 'observation',
    payload: {
      ...data,
      temp_id,
      recorded_offline_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
    status: 'pending',
    retry_count: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const req = store.add(item);
    req.onsuccess = () => {
      dispatchSyncEvent('change');
      resolve(temp_id);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Queue a prescription order offline.
 */
export async function queueOfflinePrescription(data: OfflinePrescriptionData): Promise<string> {
  const db = await openDB();
  const temp_id = `OFFLINE-RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const item: OutboxItem = {
    temp_id,
    entity_type: 'prescription',
    payload: {
      ...data,
      temp_id,
      prescribed_offline_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
    status: 'pending',
    retry_count: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const req = store.add(item);
    req.onsuccess = () => {
      dispatchSyncEvent('change');
      resolve(temp_id);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve all pending outbox items awaiting synchronization.
 */
export async function getPendingOutboxItems(): Promise<OutboxItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OUTBOX_STORE, 'readonly');
      const store = tx.objectStore(OUTBOX_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []).filter((i: OutboxItem) => i.status === 'pending' || i.status === 'failed');
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Retrieve pending count for badges.
 */
export async function getPendingCount(): Promise<number> {
  const items = await getPendingOutboxItems();
  return items.length;
}

/**
 * Trigger edge batch synchronization to Mettu Karl central server.
 */
export async function triggerEdgeBatchSync(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Network offline. Transactions remain safely buffered in IndexedDB.',
    };
  }

  const items = await getPendingOutboxItems();
  if (items.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      message: 'All edge data is up to date with Mettu Karl central server.',
    };
  }

  const patients = items.filter(i => i.entity_type === 'patient').map(i => i.payload);
  const observations = items.filter(i => i.entity_type === 'observation').map(i => i.payload);
  const prescriptions = items.filter(i => i.entity_type === 'prescription').map(i => i.payload);

  const batchPayload = {
    station_id: typeof window !== 'undefined' ? localStorage.getItem('station_id') || 'CLINIC-EDGE-METTU' : 'CLINIC-EDGE-METTU',
    station_name: 'Mettu Karl Edge Health Station',
    batch_timestamp: new Date().toISOString(),
    patients,
    observations,
    prescriptions,
  };

  try {
    const res = await apiClient.post('/sync/edge-batch', batchPayload);
    const data = res.data;

    // Remove synced items from IndexedDB
    const db = await openDB();
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    for (const item of items) {
      store.delete(item.temp_id);
    }

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });

    dispatchSyncEvent('change');
    dispatchSyncEvent('synced', data);

    return {
      success: true,
      syncedCount: items.length,
      message: `Successfully synchronized ${items.length} records with central database.`,
      resolutions: data.resolutions,
    };
  } catch (error: any) {
    return {
      success: false,
      syncedCount: 0,
      message: error?.response?.data?.detail || error.message || 'Synchronization failed.',
    };
  }
}

/**
 * Cache patients locally for offline search capability.
 */
export async function cachePatientsLocally(patients: any[]): Promise<void> {
  if (!patients || patients.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(CACHED_PATIENTS_STORE, 'readwrite');
    const store = tx.objectStore(CACHED_PATIENTS_STORE);
    for (const p of patients) {
      store.put(p);
    }
  } catch {
    // Non-blocking caching
  }
}

/**
 * Search patients locally in IndexedDB when offline.
 */
export async function searchOfflinePatients(query: string): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CACHED_PATIENTS_STORE, 'readonly');
      const store = tx.objectStore(CACHED_PATIENTS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const q = query.trim().toLowerCase();
        if (!q) {
          resolve(all.slice(0, 20));
          return;
        }
        const filtered = all.filter(p =>
          (p.first_name && p.first_name.toLowerCase().includes(q)) ||
          (p.last_name && p.last_name.toLowerCase().includes(q)) ||
          (p.mrn && p.mrn.toLowerCase().includes(q)) ||
          (p.phone_number && p.phone_number.includes(q))
        );
        resolve(filtered);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
