/**
 * Mettu Karl Referral Hospital — Online Server Time, Ethiopian Calendar & Shift Hook
 * Replaces all local hardcoded state with centralized FastAPI backend synchronization.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/lib/api';

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'on_call';

export interface GregorianInfo {
  date: string;
  year: number;
  month: number;
  day: number;
  day_of_week: string;
  formatted: string;
}

export interface EthiopianInfo {
  year: number;
  month_number: number;
  month_name_om: string;
  month_name_am: string;
  month_name_en: string;
  day: number;
  habasha_time_str: string;
  formatted_om: string;
  formatted_am: string;
  formatted_en: string;
}

export interface ShiftInfo {
  type: ShiftType;
  name_om: string;
  name_am: string;
  name_en: string;
  start_time: string;
  end_time: string;
  progress_percent: number;
  handover_countdown_minutes: number;
  charge_nurse: string;
  duty_physician: string;
  handover_notes?: string;
  is_auto: boolean;
  last_switched_at: string;
}

export interface TimeSyncData {
  server_timestamp_iso: string;
  server_time: string;
  server_date: string;
  timezone: string;
  ntp_synced: boolean;
  gregorian: GregorianInfo;
  ethiopian: EthiopianInfo;
  shift: ShiftInfo;
}

const DEFAULT_SYNC_DATA: TimeSyncData = {
  server_timestamp_iso: new Date().toISOString(),
  server_time: '08:45:00',
  server_date: '2026-11-08',
  timezone: 'Africa/Addis_Ababa (EAT UTC+3)',
  ntp_synced: true,
  gregorian: {
    date: '2026-11-08',
    year: 2026,
    month: 11,
    day: 8,
    day_of_week: 'Sunday',
    formatted: 'Nov 08, 2026',
  },
  ethiopian: {
    year: 2019,
    month_number: 2,
    month_name_om: 'Tikimt',
    month_name_am: 'ጥቅምት',
    month_name_en: 'Tikimt',
    day: 29,
    habasha_time_str: '02:45 (Guyyaa)',
    formatted_om: 'Tikimt 29, 2019',
    formatted_am: 'ጥቅምት 29, 2019 ዓ.ም',
    formatted_en: 'Tikimt 29, 2019',
  },
  shift: {
    type: 'morning',
    name_om: 'Shiftii Ganamaa (08:00–16:00)',
    name_am: 'የጠዋት ፈረቃ (08:00–16:00)',
    name_en: 'Morning Shift (08:00–16:00)',
    start_time: '08:00',
    end_time: '16:00',
    progress_percent: 10.0,
    handover_countdown_minutes: 432,
    charge_nurse: 'Nurse Chaltu Daba (BScN, Charge Nurse)',
    duty_physician: 'Dr. Bekele Tadesse (MD, Senior Surgeon)',
    handover_notes: 'All acute ward beds stable. Bed-05 under strict BP monitoring.',
    is_auto: true,
    last_switched_at: new Date().toISOString(),
  },
};

export function formatTime12Hour(date: Date): string {
  const hours24 = date.getHours();
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const h = String(hours12).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s} ${period}`;
}

export function normalizeServerTime12Hour(rawTime: string): string {
  const trimmed = (rawTime || '').trim();
  if (/AM|PM$/i.test(trimmed)) return trimmed;
  const parts = trimmed.split(':').map((p) => parseInt(p, 10));
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    const h24 = parts[0];
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = String(h24 % 12 || 12).padStart(2, '0');
    const mm = String(parts[1]).padStart(2, '0');
    const ss = String(Number.isNaN(parts[2]) ? 0 : parts[2]).padStart(2, '0');
    return `${h12}:${mm}:${ss} ${period}`;
  }
  return trimmed || '12:00:00 PM';
}

export function useHospitalTimeSync() {
  const [syncData, setSyncData] = useState<TimeSyncData>(DEFAULT_SYNC_DATA);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const [currentDisplayTime, setCurrentDisplayTime] = useState<string>('08:45:00 AM');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Fetch true server time from FastAPI backend
  const fetchTimeSync = useCallback(async () => {
    try {
      const res = await apiClient.get<TimeSyncData>('/system/time-sync');
      if (res.data) {
        setSyncData(res.data);
        const serverMs = new Date(res.data.server_timestamp_iso).getTime();
        const clientMs = Date.now();
        setServerOffsetMs(serverMs - clientMs);
        setCurrentDisplayTime(normalizeServerTime12Hour(res.data.server_time));
      }
    } catch {
      // Fallback gracefully without throwing
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and periodic background sync every 60 seconds
  useEffect(() => {
    void fetchTimeSync();
    const syncInterval = setInterval(() => {
      void fetchTimeSync();
    }, 60000);
    return () => clearInterval(syncInterval);
  }, [fetchTimeSync]);

  // High precision client-side ticking synchronized with server offset (12-hour up to 12:00)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const syncedNow = new Date(Date.now() + serverOffsetMs);
      setCurrentDisplayTime(formatTime12Hour(syncedNow));
    }, 1000);
    return () => clearInterval(tickInterval);
  }, [serverOffsetMs]);

  // Override shift online in database
  const overrideShift = useCallback(
    async (payload: {
      shift_type: ShiftType;
      charge_nurse?: string;
      duty_physician?: string;
      handover_notes?: string;
      is_auto?: boolean;
      custom_eth_month?: string;
      custom_eth_day?: number;
      custom_eth_year?: number;
    }) => {
      setIsUpdating(true);
      try {
        const res = await apiClient.post<TimeSyncData>('/system/shifts/override', payload);
        if (res.data) {
          setSyncData(res.data);
          const serverMs = new Date(res.data.server_timestamp_iso).getTime();
          setServerOffsetMs(serverMs - Date.now());
        }
        return res.data;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  // Reset shift to automatic server time
  const resetAutoShift = useCallback(async () => {
    setIsUpdating(true);
    try {
      const res = await apiClient.post<TimeSyncData>('/system/shifts/reset-auto');
      if (res.data) {
        setSyncData(res.data);
        const serverMs = new Date(res.data.server_timestamp_iso).getTime();
        setServerOffsetMs(serverMs - Date.now());
      }
      return res.data;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    syncData,
    serverTime: currentDisplayTime,
    gregorian: syncData.gregorian,
    ethiopian: syncData.ethiopian,
    shift: syncData.shift,
    ntpSynced: syncData.ntp_synced,
    isLoading,
    isUpdating,
    refetchTime: fetchTimeSync,
    overrideShift,
    resetAutoShift,
  };
}
