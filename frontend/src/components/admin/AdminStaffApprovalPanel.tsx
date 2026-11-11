/**
 * Mettu Karl Referral Hospital — Executive Staff Enrollment & Impersonation Guard Panel.
 *
 * Allows authenticated Administrators (ADMIN / SUPER_ADMIN) to review self-registered
 * staff enrollment requests, detect privileged-role/title impersonation alerts, assign
 * verified RBAC roles, approve accounts, or reject/block unauthorized applicants.
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/types';
import { useTranslation, type Language } from '@/lib/i18n';
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
} from 'lucide-react';

interface StaffEnrollmentRequest {
  id: number;
  username: string;
  email: string;
  full_name: string;
  staff_id?: string | null;
  department?: string | null;
  license_number?: string | null;
  role: UserRole;
  requested_role?: string | null;
  approval_status: 'pending' | 'approved' | 'rejected' | string;
  risk_flag?: string | null;
  rejection_reason?: string | null;
  requested_ip?: string | null;
  is_active: boolean;
  created_at: string;
  approved_at?: string | null;
}

const REQUEST_TO_DEFAULT_ROLE: Record<string, UserRole> = {
  doctor: 'doctor',
  specialist: 'doctor',
  consultant: 'doctor',
  nurse: 'nurse',
  paramedic: 'nurse',
  pharmacist: 'pharmacist',
  lab_tech: 'lab_tech',
  radiographer: 'lab_tech',
  technician: 'technician',
  biomedical: 'technician',
  receptionist: 'receptionist',
  billing: 'billing',
  auditor: 'billing',
  insurance_officer: 'insurance_officer',
  admin: 'admin',
  ict_admin: 'admin',
};

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; superAdminOnly?: boolean }> = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab_tech', label: 'Lab Technologist' },
  { value: 'technician', label: 'Technician / BioMed' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'billing', label: 'Billing Officer' },
  { value: 'insurance_officer', label: 'Insurance (CBHI)' },
  { value: 'admin', label: 'Administrator', superAdminOnly: true },
];

export function AdminStaffApprovalPanel(): React.ReactElement {
  const { user } = useAuth();
  const { language } = useTranslation();
  const lang: Language =
    language === 'om' || language === 'am' || language === 'en' ? language : 'en';

  const [requests, setRequests] = useState<StaffEnrollmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'pending' | 'flagged' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<Record<number, UserRole>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<StaffEnrollmentRequest[]>(
        '/auth/staff/requests?status_filter=all',
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setRequests(data);
      setSelectedRoles((prev) => {
        const next = { ...prev };
        for (const item of data) {
          if (!next[item.id]) {
            const mapped =
              REQUEST_TO_DEFAULT_ROLE[(item.requested_role || '').toLowerCase()] ||
              item.role ||
              'receptionist';
            // Non-super-admins cannot pre-select admin grants
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
  }, [isSuperAdmin]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

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

  const filteredRequests = useMemo(() => {
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

  async function handleApprove(item: StaffEnrollmentRequest): Promise<void> {
    const assignedRole = selectedRoles[item.id] || 'receptionist';
    setBusyId(item.id);
    try {
      const res = await apiClient.post<StaffEnrollmentRequest>(
        `/auth/staff/requests/${item.id}/approve`,
        { assigned_role: assignedRole },
      );
      setRequests((prev) => prev.map((r) => (r.id === item.id ? res.data : r)));
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
      className="bg-[#101624] border border-[#222b3d] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1c2536]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-white">
                {lang === 'om'
                  ? "Mirkaneessa Galmee Hojjettootaa & Eegumsa Fakkeessuu (Admin Guard)"
                  : lang === 'am'
                  ? 'የሰራተኞች ምዝገባ ማጽደቂያ እና የማንነት ማረጋገጫ'
                  : 'Staff Sign-Up Verification & Anti-Impersonation Guard'}
              </h2>
              {counts.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {counts.pending} PENDING
                </span>
              )}
              {counts.flagged > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {counts.flagged} RISK ALERTS
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'om'
                ? 'Namni haaraan hundi osoo Admin hin mirkaneessin seenuu hin danda’u; yaalii sobaa Admin/Doctor of fakkeessuu adda baasiitii cufi.'
                : 'All self-registered accounts stay locked until Admin approval. Privileged claims are flagged for impersonation audit.'}
            </p>
          </div>
        </div>

        {/* Filter & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-[#0a0f18] border border-[#1e2738] p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({counts.pending})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('flagged')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'flagged'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk Alerts ({counts.flagged})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({counts.total})
            </button>
          </div>

          <button
            type="button"
            onClick={() => void fetchRequests()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151e30] hover:bg-[#1c2840] border border-[#25334d] text-xs font-semibold text-slate-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{lang === 'om' ? 'Haaromsi' : 'Refresh'}</span>
          </button>
        </div>
      </div>

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

      {/* Requests List */}
      {isLoading && requests.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          {lang === 'om' ? 'Gaaffiiwwan fe’amaa jiru...' : 'Loading enrollment verification queue...'}
        </div>
      ) : filteredRequests.length === 0 ? (
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
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredRequests.map((item) => {
            const isPending = item.approval_status === 'pending';
            const isApproved = item.approval_status === 'approved';
            const isRejected = item.approval_status === 'rejected';
            const isBusy = busyId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${
                  item.risk_flag && isPending
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : isPending
                    ? 'bg-[#131b2c] border-amber-500/30'
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
                      Requested Role:{' '}
                      <strong className="text-amber-300">
                        {(item.requested_role || item.role).toUpperCase()}
                      </strong>
                    </span>
                    {item.department && <span>Dept: {item.department}</span>}
                    {item.license_number && (
                      <span className="font-mono text-cyan-300">
                        License: {item.license_number}
                      </span>
                    )}
                    {item.requested_ip && (
                      <span className="font-mono">IP: {item.requested_ip}</span>
                    )}
                    {!item.is_active && (
                      <span className="inline-flex items-center gap-1 text-rose-300 font-semibold">
                        <Lock className="w-3 h-3" />
                        Login Locked
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
                    {ROLE_OPTIONS.filter((opt) => !opt.superAdminOnly || isSuperAdmin).map(
                      (opt) => (
                        <option key={opt.value} value={opt.value}>
                          Grant: {opt.label}
                        </option>
                      ),
                    )}
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
                    placeholder="Rejection note (optional)..."
                    disabled={isBusy}
                    className="h-8 w-full sm:w-44 rounded-lg bg-[#090e18] border border-[#24324c] px-2.5 text-[11px] text-slate-200 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
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
    </div>
  );
}
