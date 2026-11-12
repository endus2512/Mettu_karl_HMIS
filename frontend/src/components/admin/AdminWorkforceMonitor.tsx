/**
 * Mettu Karl Referral Hospital — Live Staff Workforce & Access Control Monitor.
 *
 * Allows Hospital Administrators to track all staff accounts (Doctors, Nurses,
 * Pharmacists, Lab Techs, Receptionists, Billing, etc.), monitor who is actively
 * working online right now vs offline/blocked, view first-login & last-seen
 * station telemetry, and grant/block/update roles immediately.
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/types';
import { useTranslation, type Language } from '@/lib/i18n';
import { STAFF_ROLE_OPTIONS, formatRelativeTimestamp } from '@/lib/staffRoles';
import {
  Activity,
  ShieldCheck,
  ShieldBan,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
  Lock,
  Radio,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface WorkforceMember {
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
  approval_status: string;
  risk_flag?: string | null;
  rejection_reason?: string | null;
  is_active: boolean;
  created_at: string;
  first_login_at?: string | null;
  last_login_at?: string | null;
  last_seen_at?: string | null;
  last_ip?: string | null;
  last_activity_path?: string | null;
  work_status: 'working_now' | 'recent' | 'offline' | 'blocked' | 'pending' | string;
  idle_seconds?: number | null;
}

interface WorkforceSummaryResponse {
  total_staff: number;
  working_now_count: number;
  recent_count: number;
  offline_count: number;
  blocked_count: number;
  pending_count: number;
  items: WorkforceMember[];
}

export function AdminWorkforceMonitor(): React.ReactElement {
  const { user } = useAuth();
  const { language } = useTranslation();
  const lang: Language =
    language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const [summary, setSummary] = useState<WorkforceSummaryResponse | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'working_now' | 'offline' | 'blocked'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleDrafts, setRoleDrafts] = useState<Record<number, UserRole>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchWorkforce = useCallback(async () => {
    try {
      const res = await apiClient.get<WorkforceSummaryResponse>('/auth/staff/workforce');
      const data = res.data;
      setSummary(data);
      setRoleDrafts((prev) => {
        const next = { ...prev };
        for (const item of data.items || []) {
          if (!next[item.id]) {
            next[item.id] = item.role;
          }
        }
        return next;
      });
    } catch {
      // Quietly preserve last known roster if offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWorkforce();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchWorkforce();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchWorkforce]);

  const filteredItems = useMemo(() => {
    const items = summary?.items || [];
    const q = searchQuery.trim().toLowerCase();
    return items.filter((m) => {
      if (statusFilter === 'working_now' && m.work_status !== 'working_now' && m.work_status !== 'recent') {
        return false;
      }
      if (statusFilter === 'offline' && m.work_status !== 'offline') return false;
      if (statusFilter === 'blocked' && m.work_status !== 'blocked') return false;
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (!q) return true;
      return (
        m.full_name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        (m.staff_id || '').toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q)
      );
    });
  }, [summary, statusFilter, roleFilter, searchQuery]);

  async function handleControl(
    member: WorkforceMember,
    action: 'block' | 'activate' | 'update_role',
  ): Promise<void> {
    setBusyId(member.id);
    const assignedRole = roleDrafts[member.id] || member.role;
    try {
      const res = await apiClient.post<WorkforceMember>(`/auth/staff/${member.id}/status`, {
        action,
        assigned_role: assignedRole,
        reason:
          action === 'block'
            ? 'Blocked / suspended from live Admin Workforce Control'
            : undefined,
      });
      setSummary((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((it) => (it.id === member.id ? res.data : it));
        return {
          ...prev,
          items: updatedItems,
          working_now_count: updatedItems.filter((it) => it.work_status === 'working_now').length,
          recent_count: updatedItems.filter((it) => it.work_status === 'recent').length,
          offline_count: updatedItems.filter((it) => it.work_status === 'offline').length,
          blocked_count: updatedItems.filter((it) => it.work_status === 'blocked').length,
          pending_count: updatedItems.filter((it) => it.work_status === 'pending').length,
        };
      });
      notifications.show({
        title:
          action === 'block'
            ? lang === 'om'
              ? 'Hojjetaan Cufameera'
              : 'Staff Access Blocked'
            : action === 'activate'
            ? lang === 'om'
              ? 'Hojjetaan Eeyyamameera'
              : 'Staff Access Activated'
            : 'Role Updated',
        message: `${member.full_name} (${member.staff_id || member.username}) -> ${res.data.role.toUpperCase()} [${res.data.work_status.toUpperCase()}]`,
        color: action === 'block' ? 'red' : 'teal',
      });
    } catch (err: unknown) {
      let detail = 'Control action failed.';
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        detail = String(err.response.data.detail);
      }
      notifications.show({
        title: 'Action Blocked',
        message: detail,
        color: 'red',
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      id="admin-workforce-monitor"
      className={`bg-[#101624] border border-[#222b3d] rounded-2xl shadow-lg transition-all ${
        isMinimized ? 'p-4' : 'p-4 sm:p-5 space-y-4'
      }`}
    >
      {/* Header Row */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
          isMinimized ? '' : 'pb-3 border-b border-[#1c2536]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-white">
                {lang === 'om'
                  ? "To'annoo Hojjettoota Hojirra Jiran (Live Workforce)"
                  : lang === 'am'
                  ? 'የነባር ሰራተኞች የስራ እንቅስቃሴ እና ፍቃድ መቆጣጠሪያ'
                  : 'Live Staff Workforce Activity & Access Control'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                {summary?.working_now_count ?? 0} WORKING
              </span>
              {(summary?.offline_count ?? 0) > 0 && isMinimized && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {summary?.offline_count} OFFLINE
                </span>
              )}
              {(summary?.blocked_count ?? 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {summary?.blocked_count} BLOCKED
                </span>
              )}
              {isMinimized && (
                <span className="text-[11px] font-mono text-slate-400">
                  ({summary?.total_staff ?? 0} Staff)
                </span>
              )}
            </div>
            {!isMinimized && (
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'om'
                  ? 'Hojjettoonni duraanii (Doctor, Nurse, Pharmacy...) yeroo ammaa hojjechaa jiraachuu fi dhiisuu isaanii hordofii, eyyami ykn cufi.'
                  : 'Monitor whether existing Doctors, Nurses, Pharmacists, Lab Techs & Staff are actively working or offline, and block or grant permissions anytime.'}
              </p>
            )}
          </div>
        </div>

        {/* Summary Counters + Refresh + Minimize/Expand */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isMinimized && (
            <>
              <div className="inline-flex rounded-xl bg-[#0a0f18] border border-[#1e2738] p-0.5 text-[11px] font-semibold">
                {(
                  [
                    ['all', `All (${summary?.total_staff ?? 0})`],
                    ['working_now', `Working (${(summary?.working_now_count ?? 0) + (summary?.recent_count ?? 0)})`],
                    ['offline', `Offline (${summary?.offline_count ?? 0})`],
                    ['blocked', `Blocked (${summary?.blocked_count ?? 0})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === key
                        ? key === 'blocked'
                          ? 'bg-rose-500 text-white font-bold'
                          : 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  void fetchWorkforce();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151e30] hover:bg-[#1c2840] border border-[#25334d] text-xs font-semibold text-slate-200 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{lang === 'om' ? 'Haaromsi' : 'Refresh'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#25334d] bg-[#151e30] hover:bg-[#1c2840] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span>
              {isMinimized
                ? lang === 'om'
                  ? 'Bani (Expand)'
                  : 'Expand'
                : lang === 'om'
                ? 'Xiqeessi (Minimize)'
                : 'Minimize'}
            </span>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'om'
                ? 'Maqaa, ID, kutaa ykn ga’ee hojjettootaa barbaadi...'
                : 'Search active or offline staff by Name, Username, Staff ID, or Department...'
            }
            className="w-full h-9 rounded-xl bg-[#0a0f18] border border-[#1e2738] pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <select
          aria-label="Filter workforce by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-xl bg-[#0a0f18] border border-[#1e2738] px-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="doctor">Doctors</option>
          <option value="nurse">Nurses</option>
          <option value="pharmacist">Pharmacists</option>
          <option value="lab_tech">Lab Techs</option>
          <option value="technician">Technicians</option>
          <option value="receptionist">Receptionists</option>
          <option value="billing">Billing / Insurance</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Workforce Directory Rows */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {isLoading && !summary ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Loading live staff workforce status...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No matching staff records found.
          </div>
        ) : (
          filteredItems.map((member) => {
            const isSelfOrRoot = member.username === 'admin' || member.id === user?.id;
            const isBlocked = member.work_status === 'blocked' || !member.is_active;
            const isWorking = member.work_status === 'working_now';
            const isRecent = member.work_status === 'recent';
            const isBusy = busyId === member.id;

            return (
              <div
                key={member.id}
                className={`rounded-xl border p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${
                  isBlocked
                    ? 'bg-rose-950/15 border-rose-500/35'
                    : isWorking
                    ? 'bg-emerald-950/15 border-emerald-500/35'
                    : 'bg-[#0b101b] border-[#1b2436]'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">{member.full_name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-teal-300">
                      {member.staff_id || member.username}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 uppercase">
                      {member.role}
                    </span>

                    {isWorking && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-[10px] font-bold text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        WORKING NOW
                      </span>
                    )}
                    {isRecent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-[10px] font-bold text-cyan-300">
                        <Clock className="w-3 h-3" />
                        RECENTLY ACTIVE
                      </span>
                    )}
                    {member.work_status === 'offline' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
                        OFFLINE / INACTIVE
                      </span>
                    )}
                    {member.work_status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                        PENDING APPROVAL
                      </span>
                    )}
                    {isBlocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-[10px] font-bold text-rose-300">
                        <Lock className="w-3 h-3" />
                        BLOCKED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    {member.last_activity_path && member.last_activity_path !== 'LOGGED_OUT' && (
                      <span className="font-mono text-emerald-300">
                        Station: {member.last_activity_path}
                      </span>
                    )}
                    <span>
                      Last Seen:{' '}
                      <strong className="text-slate-200">
                        {formatRelativeTimestamp(member.last_seen_at || member.last_login_at)}
                      </strong>
                    </span>
                    <span>
                      First Login:{' '}
                      <strong className="text-slate-300">
                        {formatRelativeTimestamp(member.first_login_at)}
                      </strong>
                    </span>
                    {member.last_ip && <span className="font-mono">IP: {member.last_ip}</span>}
                    {member.department && <span>Dept: {member.department}</span>}
                  </div>
                </div>

                {/* Live Access & Role Control Buttons */}
                {!isSelfOrRoot ? (
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <select
                      aria-label={`Change role for ${member.full_name}`}
                      value={roleDrafts[member.id] || member.role}
                      disabled={isBusy}
                      onChange={(e) =>
                        setRoleDrafts((prev) => ({
                          ...prev,
                          [member.id]: e.target.value as UserRole,
                        }))
                      }
                      className="h-8 rounded-lg bg-[#090e18] border border-[#24324c] px-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                      onClick={() => void handleControl(member, 'update_role')}
                      className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
                      Set Role
                    </button>

                    {isBlocked || member.work_status === 'pending' ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleControl(member, 'activate')}
                        className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isBlocked ? 'Unblock & Allow' : 'Approve & Allow'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleControl(member, 'block')}
                        className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Block Staff</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 shrink-0">
                    <ShieldBan className="w-3 h-3" />
                    PRIMARY ROOT ADMIN
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
        </>
      )}
    </div>
  );
}
