/**
 * Mettu Karl Referral Hospital — Executive Security Alarms, Enrollment Verification & Anti-Impersonation Guard.
 *
 * Allows authenticated Administrators (ADMIN / SUPER_ADMIN) to:
 * 1. Receive immediate real-time Security Alarms when new staff sign up, when any Doctor / Nurse /
 *    Pharmacist / Staff logs in for the FIRST time, or when a blocked/impersonator attempt occurs.
 * 2. Inspect full applicant identity (Name, Staff ID, Phone, Email, Role, Dept, License #, IP)
 *    and immediately Allow/Grant RBAC permissions, Block/Suspend, or Acknowledge alarms.
 * 3. Manage the self-registered enrollment approval queue (Pending / Risk Alerts / All).
 */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/types';
import { useTranslation, type Language } from '@/lib/i18n';
import { playClinicalAudioAlert } from '@/lib/notifications';
import { MorphingArrowButton } from '@/components/admin/MorphingArrowButton';
import {
  REQUEST_TO_DEFAULT_ROLE,
  STAFF_ROLE_GROUPS,
  STAFF_ROLE_OPTIONS,
  resolveStaffRoleGroup,
  formatRelativeTimestamp,
  type StaffRoleGroupKey,
} from '@/lib/staffRoles';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  AlertTriangle,
  Clock,
  Lock,
  CheckCircle2,
  XCircle,
  BellRing,
  Volume2,
  VolumeX,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Layers,
} from 'lucide-react';

interface StaffEnrollmentRequest {
  id: number;
  username: string;
  email: string;
  full_name: string;
  staff_id?: string | null;
  department?: string | null;
  license_number?: string | null;
  phone_number?: string | null;
  role: UserRole;
  requested_role?: string | null;
  role_group?: StaffRoleGroupKey | string | null;
  approval_status: 'pending' | 'approved' | 'rejected' | string;
  risk_flag?: string | null;
  rejection_reason?: string | null;
  requested_ip?: string | null;
  is_active: boolean;
  created_at: string;
  approved_at?: string | null;
}

interface SecurityAlarmItem {
  id: number;
  title: string;
  message: string;
  severity: string;
  category: string;
  event_type: string;
  actor_name: string;
  actor_role: string;
  actor_user_id?: number | null;
  staff_id?: string | null;
  username?: string | null;
  email?: string | null;
  phone_number?: string | null;
  requested_role?: string | null;
  department?: string | null;
  license_number?: string | null;
  ip_address?: string | null;
  risk_flag?: string | null;
  role_group?: StaffRoleGroupKey | string | null;
  user_approval_status?: string | null;
  user_is_active?: boolean | null;
  user_current_role?: UserRole | null;
  is_read: boolean;
  created_at: string;
  reacted_at?: string | null;
  reaction_by?: string | null;
}

export function AdminStaffApprovalPanel(): React.ReactElement {
  const { user } = useAuth();
  const { language } = useTranslation();
  const lang: Language =
    language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const [requests, setRequests] = useState<StaffEnrollmentRequest[]>([]);
  const [alarms, setAlarms] = useState<SecurityAlarmItem[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [showAllAlarms, setShowAllAlarms] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [alarmRoles, setAlarmRoles] = useState<Record<number, UserRole>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'pending' | 'flagged' | 'all'>('pending');
  const [selectedRoleGroup, setSelectedRoleGroup] = useState<StaffRoleGroupKey | 'all'>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<Record<number, UserRole>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAlarmId, setBusyAlarmId] = useState<number | null>(null);
  const seenAlarmIdsRef = useRef<Set<number> | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchAlarms = useCallback(async () => {
    try {
      const res = await apiClient.get<SecurityAlarmItem[]>('/auth/staff/alarms?limit=30');
      const data = Array.isArray(res.data) ? res.data : [];
      setAlarms(data);

      setAlarmRoles((prev) => {
        const next = { ...prev };
        for (const alarm of data) {
          if (!next[alarm.id]) {
            const candidate =
              REQUEST_TO_DEFAULT_ROLE[(alarm.requested_role || '').toLowerCase()] ||
              (alarm.user_current_role as UserRole | undefined) ||
              REQUEST_TO_DEFAULT_ROLE[(alarm.actor_role || '').toLowerCase()] ||
              'receptionist';
            next[alarm.id] =
              !isSuperAdmin && (candidate === 'admin' || candidate === 'super_admin')
                ? 'receptionist'
                : candidate;
          }
        }
        return next;
      });

      const unread = data.filter((a) => !a.is_read);
      if (seenAlarmIdsRef.current === null) {
        seenAlarmIdsRef.current = new Set(unread.map((a) => a.id));
      } else {
        const arrived = unread.filter((a) => !seenAlarmIdsRef.current!.has(a.id));
        if (arrived.length > 0) {
          arrived.forEach((a) => seenAlarmIdsRef.current!.add(a.id));
          if (soundEnabled) {
            playClinicalAudioAlert('emergency');
          }
        }
      }
    } catch {
      // Offline / transient network tolerance
    }
  }, [isSuperAdmin, soundEnabled]);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqRes] = await Promise.all([
        apiClient.get<StaffEnrollmentRequest[]>('/auth/staff/requests?status_filter=all'),
        fetchAlarms(),
      ]);
      const data = Array.isArray(reqRes.data) ? reqRes.data : [];
      setRequests(data);
      setSelectedRoles((prev) => {
        const next = { ...prev };
        for (const item of data) {
          if (!next[item.id]) {
            const mapped =
              REQUEST_TO_DEFAULT_ROLE[(item.requested_role || '').toLowerCase()] ||
              item.role ||
              'receptionist';
            next[item.id] =
              !isSuperAdmin && (mapped === 'admin' || mapped === 'super_admin')
                ? 'receptionist'
                : mapped;
          }
        }
        return next;
      });
    } catch {
      // Keep quiet on initial unmounted errors; live view refreshes cleanly
    } finally {
      setIsLoading(false);
    }
  }, [fetchAlarms, isSuperAdmin]);

  useEffect(() => {
    void fetchRequests();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchRequests();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchRequests]);

  const unreadAlarms = useMemo(() => alarms.filter((a) => !a.is_read), [alarms]);
  const visibleAlarms = useMemo(() => {
    const base = showAllAlarms ? alarms : unreadAlarms.slice(0, 12);
    if (selectedRoleGroup === 'all') return base;
    return base.filter(
      (a) =>
        resolveStaffRoleGroup(a.role_group, a.requested_role || a.actor_role, a.risk_flag) ===
        selectedRoleGroup,
    );
  }, [alarms, unreadAlarms, showAllAlarms, selectedRoleGroup]);

  const chunkedAlarms = useMemo(() => {
    const buckets: Record<StaffRoleGroupKey, SecurityAlarmItem[]> = {
      doctor: [],
      nurse: [],
      pharmacist: [],
      lab_diag: [],
      support_finance: [],
      admin_security: [],
    };
    for (const alarm of visibleAlarms) {
      const groupKey = resolveStaffRoleGroup(
        alarm.role_group,
        alarm.requested_role || alarm.actor_role,
        alarm.risk_flag,
      );
      buckets[groupKey].push(alarm);
    }
    return STAFF_ROLE_GROUPS.map((meta) => ({
      meta,
      items: buckets[meta.key],
    })).filter((g) => g.items.length > 0);
  }, [visibleAlarms]);

  const counts = useMemo(() => {
    let pending = 0;
    let flagged = 0;
    let approved = 0;
    let rejected = 0;
    for (const r of requests) {
      if (r.approval_status === 'pending') pending++;
      else if (r.approval_status === 'approved') approved++;
      else if (r.approval_status === 'rejected') rejected++;
      if (r.risk_flag) flagged++;
    }
    return { pending, flagged, approved, rejected, total: requests.length };
  }, [requests]);

  const filteredByTabAndSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      if (filterTab === 'pending' && r.approval_status !== 'pending') return false;
      if (filterTab === 'flagged' && !r.risk_flag) return false;
      if (!q) return true;
      return (
        r.full_name.toLowerCase().includes(q) ||
        (r.staff_id || '').toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        (r.requested_role || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q)
      );
    });
  }, [requests, filterTab, searchQuery]);

  const roleChunkCounts = useMemo(() => {
    const map: Record<StaffRoleGroupKey, number> = {
      doctor: 0,
      nurse: 0,
      pharmacist: 0,
      lab_diag: 0,
      support_finance: 0,
      admin_security: 0,
    };
    for (const r of filteredByTabAndSearch) {
      const gKey = resolveStaffRoleGroup(r.role_group, r.requested_role || r.role, r.risk_flag);
      map[gKey]++;
    }
    return map;
  }, [filteredByTabAndSearch]);

  const filteredRequests = useMemo(() => {
    if (selectedRoleGroup === 'all') return filteredByTabAndSearch;
    return filteredByTabAndSearch.filter(
      (r) =>
        resolveStaffRoleGroup(r.role_group, r.requested_role || r.role, r.risk_flag) ===
        selectedRoleGroup,
    );
  }, [filteredByTabAndSearch, selectedRoleGroup]);

  const chunkedRequests = useMemo(() => {
    const buckets: Record<StaffRoleGroupKey, StaffEnrollmentRequest[]> = {
      doctor: [],
      nurse: [],
      pharmacist: [],
      lab_diag: [],
      support_finance: [],
      admin_security: [],
    };
    for (const req of filteredRequests) {
      const gKey = resolveStaffRoleGroup(req.role_group, req.requested_role || req.role, req.risk_flag);
      buckets[gKey].push(req);
    }
    return STAFF_ROLE_GROUPS.map((meta) => ({
      meta,
      items: buckets[meta.key],
    })).filter((g) => g.items.length > 0);
  }, [filteredRequests]);

  function toggleGroupCollapse(sectionKey: string): void {
    setCollapsedGroups((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }

  async function handleAckAlarm(alarmId: number): Promise<void> {
    setBusyAlarmId(alarmId);
    try {
      await apiClient.post(`/auth/staff/alarms/${alarmId}/ack`, {});
      setAlarms((prev) => prev.map((a) => (a.id === alarmId ? { ...a, is_read: true } : a)));
    } catch {
      // Ignore transient errors
    } finally {
      setBusyAlarmId(null);
    }
  }

  async function handleAlarmDecision(
    alarm: SecurityAlarmItem,
    decision: 'activate' | 'block',
  ): Promise<void> {
    if (!alarm.actor_user_id) return;
    setBusyAlarmId(alarm.id);
    const roleChoice = alarmRoles[alarm.id] || 'receptionist';
    try {
      await apiClient.post(`/auth/staff/${alarm.actor_user_id}/status`, {
        action: decision,
        assigned_role: roleChoice,
        reason:
          decision === 'block'
            ? `Blocked directly by Admin from Security Alarm #${alarm.id} (${alarm.event_type})`
            : undefined,
      });
      await fetchRequests();
      notifications.show({
        title:
          decision === 'activate'
            ? lang === 'om'
              ? 'Eeyyamni Kennameera'
              : 'Staff Access Allowed'
            : lang === 'om'
            ? 'Fayyadamaan Cufameera'
            : 'Staff Blocked Immediately',
        message: `${alarm.actor_name} (${alarm.staff_id || alarm.username || 'ID'}) -> ${
          decision === 'activate' ? roleChoice.toUpperCase() : 'BLOCKED'
        }`,
        color: decision === 'activate' ? 'teal' : 'red',
      });
    } catch (err: unknown) {
      let detail = 'Decision failed.';
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        detail = String(err.response.data.detail);
      }
      notifications.show({ title: 'Action Blocked', message: detail, color: 'red' });
    } finally {
      setBusyAlarmId(null);
    }
  }

  async function handleApprove(item: StaffEnrollmentRequest): Promise<void> {
    const assignedRole = selectedRoles[item.id] || 'receptionist';
    setBusyId(item.id);
    try {
      const res = await apiClient.post<StaffEnrollmentRequest>(
        `/auth/staff/requests/${item.id}/approve`,
        { assigned_role: assignedRole },
      );
      setRequests((prev) => prev.map((r) => (r.id === item.id ? res.data : r)));
      void fetchAlarms();
      notifications.show({
        title: lang === 'om' ? 'Hojjataan Mirkanaa’eera' : 'Staff Account Approved',
        message: `${item.full_name} (${item.staff_id || item.username}) -> ${assignedRole.toUpperCase()}`,
        color: 'teal',
      });
    } catch (err: unknown) {
      let detail = 'Approval failed.';
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        detail = String(err.response.data.detail);
      }
      notifications.show({
        title: lang === 'om' ? 'Eeyyamni Dhorkame' : 'Approval Blocked',
        message: detail,
        color: 'red',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(item: StaffEnrollmentRequest): Promise<void> {
    setBusyId(item.id);
    const reason =
      rejectReasons[item.id]?.trim() ||
      (item.risk_flag
        ? 'Unverified privileged role / impersonation risk rejected by Hospital Administration.'
        : 'Identity or license could not be verified by Hospital Administration.');
    try {
      const res = await apiClient.post<StaffEnrollmentRequest>(
        `/auth/staff/requests/${item.id}/reject`,
        { rejection_reason: reason },
      );
      setRequests((prev) => prev.map((r) => (r.id === item.id ? res.data : r)));
      void fetchAlarms();
      notifications.show({
        title: lang === 'om' ? 'Gaaffiin Kufaa Ta’eera' : 'Staff Request Rejected & Blocked',
        message: `${item.full_name} (${item.staff_id || item.username}) permanently locked.`,
        color: 'orange',
      });
    } catch (err: unknown) {
      let detail = 'Rejection failed.';
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        detail = String(err.response.data.detail);
      }
      notifications.show({
        title: 'Error',
        message: detail,
        color: 'red',
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      id="admin-staff-approval-queue"
      className={`bg-gradient-to-br from-white via-rose-50/40 to-amber-50/45 dark:from-[#172238] dark:via-[#1b2742] dark:to-[#162033] border-2 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${
        unreadAlarms.length > 0 || counts.pending > 0
          ? 'border-amber-400 dark:border-amber-400/65'
          : 'border-rose-200/80 dark:border-slate-600/60'
      } ${isMinimized ? 'p-4 sm:p-5' : 'p-4 sm:p-5 space-y-4'}`}
    >
      {/* Header Row */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
          isMinimized ? '' : 'pb-3 border-b border-amber-200 dark:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {lang === 'om'
                  ? "To'annoo Nageenyaa & Mirkaneessa Galmee (Admin Guard)"
                  : lang === 'am'
                  ? 'የሰራተኞች ማንቂያ፣ ምዝገባ ማጽደቂያ እና የማንነት ማረጋገጫ'
                  : 'Staff Sign-Up Verification & Security Guard'}
              </h2>
              {unreadAlarms.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-600/35 text-rose-800 dark:text-rose-200 border border-rose-400 flex items-center gap-1 animate-pulse">
                  <BellRing className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
                  {unreadAlarms.length} LIVE ALARMS
                </span>
              )}
              {counts.pending > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-400">
                  {counts.pending} PENDING
                </span>
              )}
              {counts.flagged > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 border border-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {counts.flagged} RISK ALERTS
                </span>
              )}
              {isMinimized && unreadAlarms.length === 0 && counts.pending === 0 && (
                <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
                  0 Pending • All Clear
                </span>
              )}
            </div>
            {!isMinimized && (
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                {lang === 'om'
                  ? 'Hojjetaan haaraan yoo galmaa’e ykn Doctor/Nurse/Pharmacy yeroo jalqabaaf seenuu yoo yaale battalumatti alarmii erga; Admin eyyamee ykn cufee to’ata.'
                  : 'All self-registered accounts stay locked until Admin approval. Live alarms notify Admin immediately on every new sign-up, first-time login, or blocked attempt.'}
              </p>
            )}
          </div>
        </div>

        {/* Filter, Sound & Minimize/Expand Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <MorphingArrowButton
            variant={soundEnabled ? 'rose' : 'neutral'}
            size="sm"
            icon={soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            label={soundEnabled ? 'Alarm ON' : 'Muted'}
            title={soundEnabled ? 'Mute alarm siren' : 'Enable alarm siren'}
            onClick={() => setSoundEnabled(!soundEnabled)}
          />

          {!isMinimized && (
            <>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#0a0f18] border border-slate-300 dark:border-[#1e2738] p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterTab('pending')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterTab === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-extrabold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  Pending ({counts.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('flagged')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterTab === 'flagged'
                      ? 'bg-rose-600 text-white font-extrabold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  Risk Alerts ({counts.flagged})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-teal-500 text-slate-950 font-extrabold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  All ({counts.total})
                </button>
              </div>

              <MorphingArrowButton
                variant="neutral"
                size="sm"
                disabled={isLoading}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                label={lang === 'om' ? 'Haaromsi' : 'Refresh'}
                onClick={() => void fetchRequests()}
              />
            </>
          )}

          <MorphingArrowButton
            variant="amber-soft"
            size="sm"
            isExpanded={!isMinimized}
            label={
              isMinimized
                ? lang === 'om'
                  ? 'Bani (Expand)'
                  : 'Expand'
                : lang === 'om'
                ? 'Xiqeessi (Minimize)'
                : 'Minimize'
            }
            onClick={() => setIsMinimized((prev) => !prev)}
          />
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Profession / Role Chunk Filter Pills (Doctors, Nurses, Pharmacy, etc.) */}
      <div
        id="admin-role-chunk-filters"
        className="flex flex-wrap items-center gap-1.5 pt-1"
      >
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-800 dark:text-slate-200 mr-1">
          <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{lang === 'om' ? 'Gahee Hojiin Qoodi:' : 'Group by Role:'}</span>
        </span>
        <button
          type="button"
          onClick={() => setSelectedRoleGroup('all')}
          className={`px-2.5 py-1 rounded-full text-xs font-extrabold border transition cursor-pointer ${
            selectedRoleGroup === 'all'
              ? 'bg-amber-500 text-slate-950 border-amber-500'
              : 'bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-[#222b3d] hover:border-amber-400'
          }`}
        >
          {lang === 'om' ? 'Hunda (Qoodamee)' : 'All Roles (Chunked)'} ({filteredByTabAndSearch.length})
        </button>
        {STAFF_ROLE_GROUPS.map((group) => {
          const count = roleChunkCounts[group.key];
          const isSelected = selectedRoleGroup === group.key;
          if (count === 0 && !isSelected) return null;
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => setSelectedRoleGroup(isSelected ? 'all' : group.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold border transition cursor-pointer ${
                isSelected
                  ? 'bg-teal-500 text-slate-950 border-teal-500'
                  : `${group.badgeClass} hover:brightness-110`
              }`}
            >
              {lang === 'om' ? group.labelOm : group.shortLabel} ({count})
            </button>
          );
        })}
      </div>

      {/* Live Real-Time Security Alarms Feed — Grouped by Role Chunk */}
      {(unreadAlarms.length > 0 || showAllAlarms) && (
        <div
          id="admin-live-security-alarms"
          className="rounded-xl border-2 border-rose-400/70 bg-rose-50 dark:bg-rose-950/20 p-3.5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                {lang === 'om'
                  ? `Alarmii Nageenyaa Battalaa — Gahee Hojiin Qoodame (${unreadAlarms.length} Haaraa)`
                  : `Real-Time Security & Sign-Up Alarms — Grouped by Role (${unreadAlarms.length} Unread)`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllAlarms(!showAllAlarms)}
              className="text-xs font-extrabold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
            >
              {showAllAlarms
                ? `Show Unread Only (${unreadAlarms.length})`
                : `View Alarm History (${alarms.length})`}
            </button>
          </div>

          {chunkedAlarms.length === 0 ? (
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-2">
              {lang === 'om'
                ? 'Garee kana keessa alarmiin haaraan hin jiru.'
                : 'No security alarms in this role group.'}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
              {chunkedAlarms.map(({ meta, items }) => {
                const collapseKey = `alarm:${meta.key}`;
                const isCollapsed = Boolean(collapsedGroups[collapseKey]);
                return (
                  <section
                    key={meta.key}
                    id={`alarm-chunk-${meta.key}`}
                    className={`rounded-xl border p-2.5 space-y-2 ${meta.accentClass}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapse(collapseKey)}
                      className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold border ${meta.badgeClass}`}>
                          {lang === 'om' ? meta.labelOm : meta.labelEn}
                        </span>
                        <span className="text-[11px] font-bold text-slate-300">
                          {items.length} {items.length === 1 ? 'Alarm' : 'Alarms'}
                        </span>
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-2">
                        {items.map((alarm) => {
                          const isEmergency = alarm.severity === 'emergency' || alarm.severity === 'critical';
                          const canManageTarget =
                            Boolean(alarm.actor_user_id) &&
                            alarm.username !== 'admin' &&
                            alarm.actor_user_id !== user?.id;
                          const isBusy = busyAlarmId === alarm.id;

                          return (
                            <div
                              key={alarm.id}
                              className={`rounded-lg border p-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 ${
                                alarm.is_read
                                  ? 'bg-[#0b101b] border-[#1f293d] opacity-80'
                                  : isEmergency
                                  ? 'bg-[#1b1122] border-rose-500/50'
                                  : 'bg-[#141a2b] border-amber-500/40'
                              }`}
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/25 text-rose-200 border border-rose-500/50">
                                    {alarm.event_type}
                                  </span>
                                  <span className="text-xs font-bold text-white">{alarm.actor_name}</span>
                                  {(alarm.staff_id || alarm.username) && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-teal-300">
                                      {alarm.staff_id || alarm.username}
                                    </span>
                                  )}
                                  {alarm.user_approval_status && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300 uppercase">
                                      {alarm.user_approval_status}
                                      {alarm.user_is_active ? ' / ACTIVE' : ' / LOCKED'}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    {formatRelativeTimestamp(alarm.created_at)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-slate-300">
                                  <span>
                                    Role:{' '}
                                    <strong className="text-amber-300 uppercase">
                                      {alarm.requested_role || alarm.actor_role}
                                    </strong>
                                  </span>
                                  {alarm.department && <span>Dept: {alarm.department}</span>}
                                  {alarm.license_number && (
                                    <span className="font-mono text-cyan-300">
                                      License: {alarm.license_number}
                                    </span>
                                  )}
                                  {alarm.phone_number && <span>Tel: {alarm.phone_number}</span>}
                                  {alarm.ip_address && (
                                    <span className="font-mono text-slate-400">IP: {alarm.ip_address}</span>
                                  )}
                                </div>
                              </div>

                              {/* Direct 1-Click Admin Alarm Actions */}
                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                {canManageTarget && (
                                  <>
                                    <select
                                      aria-label={`Alarm permission for ${alarm.actor_name}`}
                                      value={alarmRoles[alarm.id] || 'receptionist'}
                                      disabled={isBusy}
                                      onChange={(e) =>
                                        setAlarmRoles((prev) => ({
                                          ...prev,
                                          [alarm.id]: e.target.value as UserRole,
                                        }))
                                      }
                                      className="h-7 rounded-lg bg-[#090e18] border border-[#24324c] px-2 text-[11px] text-white"
                                    >
                                      {STAFF_ROLE_OPTIONS.filter((opt) => !opt.superAdminOnly || isSuperAdmin).map(
                                        (opt) => (
                                          <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleAlarmDecision(alarm, 'activate')}
                                      className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                      <UserCheck className="w-3 h-3" />
                                      <span>Allow</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleAlarmDecision(alarm, 'block')}
                                      className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    >
                                      <UserX className="w-3 h-3" />
                                      <span>Block</span>
                                    </button>
                                  </>
                                )}
                                {!alarm.is_read && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => void handleAckAlarm(alarm.id)}
                                    className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Acknowledge</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}

      {unreadAlarms.length === 0 && !showAllAlarms && alarms.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0a0f18] border border-[#1c2536] text-[11px] text-slate-400">
          <span>
            All recent security alarms acknowledged ({alarms.length} recorded in audit history).
          </span>
          <button
            type="button"
            onClick={() => setShowAllAlarms(true)}
            className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
          >
            Show Alarm Log
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            lang === 'om'
              ? 'Maqaa, Staff ID, ykn ga’ee barbaadi...'
              : 'Filter by Staff Name, Staff ID, Department, or Requested Role...'
          }
          className="w-full h-9 rounded-xl bg-[#0a0f18] border border-[#1e2738] pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Requests List — Chunked cleanly by Job Role (Doctors / Nurses / Pharmacy / Lab / Support / Risk) */}
      {isLoading && requests.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          {lang === 'om' ? 'Gaaffiiwwan fe’amaa jiru...' : 'Loading enrollment verification queue...'}
        </div>
      ) : chunkedRequests.length === 0 ? (
        <div className="py-6 px-4 rounded-xl bg-[#0b101a] border border-[#1a2233] text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
          <ShieldCheck className="w-6 h-6 text-teal-400" />
          <span>
            {filterTab === 'pending'
              ? lang === 'om'
                ? 'Gaaffiin hojjetaa haaraan eeyyama eegaa jiru hin jiru.'
                : 'No pending staff sign-up requests awaiting approval.'
              : lang === 'om'
              ? 'Ragaan walfakkaatu hin argamne.'
              : 'No matching enrollment records.'}
          </span>
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
          {chunkedRequests.map(({ meta, items }) => {
            const collapseKey = `req:${meta.key}`;
            const isCollapsed = Boolean(collapsedGroups[collapseKey]);
            const pendingInGroup = items.filter((it) => it.approval_status === 'pending').length;

            return (
              <section
                key={meta.key}
                id={`approval-chunk-${meta.key}`}
                className={`rounded-xl border p-3 space-y-2.5 ${meta.accentClass}`}
              >
                {/* Profession Folder Header */}
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(collapseKey)}
                  className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2 flex-wrap">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-300" />
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${meta.badgeClass}`}
                    >
                      {lang === 'om' ? meta.labelOm : meta.labelEn}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {items.length} {items.length === 1 ? 'Staff Request' : 'Staff Requests'}
                    </span>
                    {pendingInGroup > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {pendingInGroup} Pending
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </span>
                </button>

                {/* Simplified Profession Cards */}
                {!isCollapsed && (
                  <div className="space-y-2">
                    {items.map((item) => {
                      const isPending = item.approval_status === 'pending';
                      const isApproved = item.approval_status === 'approved';
                      const isRejected = item.approval_status === 'rejected';
                      const isBusy = busyId === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${
                            item.risk_flag && isPending
                              ? 'bg-rose-950/35 border-rose-500/45'
                              : isPending
                              ? 'bg-[#121a2b] border-amber-500/35'
                              : 'bg-[#0b101b] border-[#1b2436]'
                          }`}
                        >
                          {/* Identity & Security Context */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-white truncate">
                                {item.full_name}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-teal-300">
                                {item.staff_id || item.username}
                              </span>
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                                  <Clock className="w-3 h-3" />
                                  PENDING APPROVAL
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" />
                                  APPROVED ({item.role.toUpperCase()})
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-[10px] font-bold text-rose-300">
                                  <XCircle className="w-3 h-3" />
                                  REJECTED / BLOCKED
                                </span>
                              )}
                              {item.risk_flag && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/25 border border-rose-500/60 text-[10px] font-extrabold text-rose-200">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  {item.risk_flag}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                              <span>
                                Requested:{' '}
                                <strong className="text-amber-300">
                                  {(item.requested_role || item.role).toUpperCase()}
                                </strong>
                              </span>
                              {item.license_number && (
                                <span className="font-mono text-cyan-300">
                                  License: {item.license_number}
                                </span>
                              )}
                              {item.phone_number && <span>Tel: {item.phone_number}</span>}
                              {item.requested_ip && (
                                <span className="font-mono">IP: {item.requested_ip}</span>
                              )}
                              {!item.is_active && (
                                <span className="inline-flex items-center gap-1 text-rose-300 font-semibold">
                                  <Lock className="w-3 h-3" />
                                  Locked
                                </span>
                              )}
                            </div>

                            {item.rejection_reason && (
                              <p className="text-[11px] text-rose-300/90">
                                Rejection Note: {item.rejection_reason}
                              </p>
                            )}
                          </div>

                          {/* Admin Decision Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                            <select
                              aria-label={`Assign RBAC role for ${item.full_name}`}
                              value={selectedRoles[item.id] || 'receptionist'}
                              onChange={(e) =>
                                setSelectedRoles((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value as UserRole,
                                }))
                              }
                              disabled={isBusy}
                              className="h-8 rounded-lg bg-[#090e18] border border-[#24324c] px-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                            >
                              {STAFF_ROLE_OPTIONS.filter(
                                (opt) => !opt.superAdminOnly || isSuperAdmin,
                              ).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  Grant: {opt.label}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={rejectReasons[item.id] || ''}
                              onChange={(e) =>
                                setRejectReasons((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="Note (optional)..."
                              disabled={isBusy}
                              className="h-8 w-full sm:w-40 rounded-lg bg-[#090e18] border border-[#24324c] px-2.5 text-[11px] text-slate-200 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                            />

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleApprove(item)}
                                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{isApproved ? 'Update Role' : 'Approve'}</span>
                              </button>

                              {!isRejected && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleReject(item)}
                                  className="h-8 px-3 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>{isApproved ? 'Revoke' : 'Reject'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
