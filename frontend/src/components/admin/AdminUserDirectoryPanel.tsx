'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BookUser,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import apiClient from '@/lib/api';

export interface AdminDirectoryUser {
  id: number;
  account_type: 'staff' | 'patient';
  username: string;
  email: string;
  full_name: string;
  role: string;
  staff_id?: string | null;
  department?: string | null;
  license_number?: string | null;
  phone_number?: string | null;
  fayda_id?: string | null;
  patient_id?: number | null;
  mrn?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  city?: string | null;
  biography?: string | null;
  saved_password?: string | null;
  approval_status: 'pending' | 'approved' | 'rejected' | string;
  requested_role?: string | null;
  risk_flag?: string | null;
  rejection_reason?: string | null;
  is_active: boolean;
  is_locked: boolean;
  failed_attempts: number;
  created_at: string;
  approved_at?: string | null;
  first_login_at?: string | null;
  last_login_at?: string | null;
  last_seen_at?: string | null;
  last_ip?: string | null;
  last_activity_path?: string | null;
}

interface AdminDirectoryResponse {
  total_users: number;
  staff_count: number;
  patient_count: number;
  items: AdminDirectoryUser[];
}

interface RecoverySlip {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  staff_id?: string | null;
  fayda_id?: string | null;
  temporary_password: string;
  is_active: boolean;
  approval_status: string;
  lockout_cleared: boolean;
  message: string;
}

const ROLE_OPTIONS = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'technician', label: 'Lab / Radiology Tech' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'billing', label: 'Billing Officer' },
  { value: 'insurance_officer', label: 'Insurance Officer' },
  { value: 'admin', label: 'Hospital Admin' },
  { value: 'patient', label: 'Patient Portal' },
];

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function AdminUserDirectoryPanel() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [accountTab, setAccountTab] = useState<'all' | 'staff' | 'patient'>('all');
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<AdminDirectoryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(true);
  const [editForm, setEditForm] = useState<{
    username: string;
    new_password: string;
    full_name: string;
    email: string;
    phone_number: string;
    staff_id: string;
    department: string;
    license_number: string;
    fayda_id: string;
    mrn: string;
    birth_date: string;
    gender: string;
    city: string;
    role: string;
    is_active: boolean;
    approval_status: string;
    biography: string;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [resetActivate, setResetActivate] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);
  const [recoverySlip, setRecoverySlip] = useState<RecoverySlip | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (accountTab !== 'all') params.account_type = accountTab;
      if (searchText.trim()) params.search = searchText.trim();
      const res = await apiClient.get<AdminDirectoryResponse>('/auth/admin/directory', { params });
      setData(res.data);
    } catch {
      // keep existing state cleanly
    } finally {
      setLoading(false);
    }
  }, [accountTab, searchText]);

  useEffect(() => {
    void fetchDirectory();
  }, [fetchDirectory]);

  const copyValue = async (key: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedField(key);
      setTimeout(() => setCopiedField((prev) => (prev === key ? null : prev)), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const openEditor = (u: AdminDirectoryUser) => {
    setResetUserId(null);
    setEditingUserId(u.id);
    setShowEditPassword(true);
    setEditForm({
      username: u.username || '',
      new_password: u.saved_password || '',
      full_name: u.full_name || '',
      email: u.email || '',
      phone_number: u.phone_number || '',
      staff_id: u.staff_id || '',
      department: u.department || '',
      license_number: u.license_number || '',
      fayda_id: u.fayda_id || '',
      mrn: u.mrn || '',
      birth_date: u.birth_date || '',
      gender: u.gender || 'male',
      city: u.city || '',
      role: u.role || 'doctor',
      is_active: u.is_active,
      approval_status: u.approval_status || 'approved',
      biography: u.biography || '',
    });
  };

  const handleSaveEdit = async (u: AdminDirectoryUser) => {
    if (!editForm) return;
    const trimmedPw = editForm.new_password.trim();
    if (trimmedPw && trimmedPw.length < 6) {
      notifications.show({
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters.',
        color: 'amber',
      });
      return;
    }

    setSavingEdit(true);
    try {
      const payload: Record<string, unknown> = {
        username: editForm.username.trim(),
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone_number: editForm.phone_number.trim(),
        biography: editForm.biography.trim(),
        is_active: editForm.is_active,
        approval_status: editForm.approval_status,
      };
      if (trimmedPw && trimmedPw !== (u.saved_password || '')) {
        payload.new_password = trimmedPw;
      }
      if (u.role !== 'super_admin') {
        payload.role = editForm.role;
      }
      if (u.account_type === 'staff') {
        payload.staff_id = editForm.staff_id.trim();
        payload.department = editForm.department.trim();
        payload.license_number = editForm.license_number.trim();
      } else {
        payload.fayda_id = editForm.fayda_id.trim();
        payload.mrn = editForm.mrn.trim() || undefined;
        payload.birth_date = editForm.birth_date.trim() || undefined;
        payload.gender = editForm.gender || undefined;
        payload.city = editForm.city.trim();
      }

      const res = await apiClient.patch<AdminDirectoryUser>(`/auth/admin/users/${u.id}`, payload);
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) => (item.id === u.id ? res.data : item)),
            }
          : prev,
      );
      setEditingUserId(null);
      setEditForm(null);
      notifications.show({
        title: 'Credentials, Profile & Biography Saved',
        message: `${res.data.full_name} (${res.data.username}) updated cleanly.`,
        color: 'teal',
      });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Could not save profile changes.';
      notifications.show({
        title: 'Update Failed',
        message: detail,
        color: 'red',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetPassword = async (u: AdminDirectoryUser) => {
    if (resetPasswordInput.trim() && resetPasswordInput.trim().length < 6) {
      notifications.show({
        title: 'Password Too Short',
        message: 'Minimum password length is 6 characters (or leave blank to auto-generate).',
        color: 'amber',
      });
      return;
    }
    setResettingPw(true);
    try {
      const res = await apiClient.post<RecoverySlip>(`/auth/admin/users/${u.id}/reset-password`, {
        new_password: resetPasswordInput.trim() || undefined,
        clear_lockout: true,
        activate_account: resetActivate,
        reason: resetReason.trim() || 'Admin assisted forgotten username/password recovery',
      });
      setRecoverySlip(res.data);
      setResetUserId(null);
      setResetPasswordInput('');
      setResetReason('');
      setResetActivate(false);
      await fetchDirectory();
      notifications.show({
        title: 'Recovery Credentials Issued',
        message: `New password & saved username ready for ${res.data.full_name}.`,
        color: 'teal',
      });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to reset user password.';
      notifications.show({
        title: 'Password Reset Error',
        message: detail,
        color: 'red',
      });
    } finally {
      setResettingPw(false);
    }
  };

  const lockedCount = data?.items.filter((i) => i.is_locked).length ?? 0;

  return (
    <section
      id="user-directory-recovery"
      className="bg-gradient-to-br from-white via-amber-50/45 to-sky-50/55 dark:from-[#172238] dark:via-[#1b2742] dark:to-[#162033] border-2 border-amber-300/70 dark:border-amber-400/35 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      {/* Compact Header (Minimized by Default) */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
            <BookUser className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Staff &amp; Patient Directory, Biography &amp; Password Vault
              </h2>
              {data && (
                <>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 border border-indigo-400/40">
                    {data.staff_count} Staff
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-400/40">
                    {data.patient_count} Patients
                  </span>
                  {lockedCount > 0 && (
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-400/45">
                      {lockedCount} Locked
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
              View &amp; edit saved usernames, sign-up/login passwords, and full biographies for Staff &amp; Patients.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-300 hover:scale-[1.03] transition-all cursor-pointer self-start sm:self-auto"
        >
          <KeyRound className="w-4 h-4" />
          <span>{isMinimized ? 'Open Directory & Passwords' : 'Minimize'}</span>
          {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Directory & Recovery Console */}
      {!isMinimized && (
        <div className="border-t border-amber-200/70 dark:border-slate-700 p-4 sm:p-5 space-y-4 bg-slate-50/90 dark:bg-[#11192b]">
          {/* Active Password Recovery Slip Banner */}
          {recoverySlip && (
            <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-2.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-extrabold text-sm">
                  <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                  <span>Recovery Slip Ready — Share Directly with {recoverySlip.full_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecoverySlip(null)}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                  aria-label="Close recovery slip"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm">
                <div className="bg-white dark:bg-[#0d1422] border border-emerald-300 dark:border-emerald-500/35 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">Saved Username</p>
                    <p className="font-mono font-extrabold text-slate-900 dark:text-white">{recoverySlip.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue('slip-user', recoverySlip.username)}
                    className="p-1.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded cursor-pointer"
                    title="Copy Username"
                  >
                    {copiedField === 'slip-user' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-white dark:bg-[#0d1422] border border-emerald-300 dark:border-emerald-500/35 rounded-lg px-3 py-2">
                  <p className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">Staff / Fayda ID</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {recoverySlip.staff_id || recoverySlip.fayda_id || 'N/A'}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#0d1422] border border-emerald-300 dark:border-emerald-500/35 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">Saved Password</p>
                    <p className="font-mono font-extrabold text-amber-700 dark:text-amber-300">{recoverySlip.temporary_password}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue('slip-pw', recoverySlip.temporary_password)}
                    className="p-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedField === 'slip-pw' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'staff', 'patient'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAccountTab(tab)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    accountTab === tab
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-[#192338] text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-[#22304d] border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {tab === 'all' ? 'All Accounts' : tab === 'staff' ? 'Hospital Staff' : 'Patients'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-1 md:max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 dark:text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search name, username, Staff ID, Fayda, MRN, phone, or bio..."
                  className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#182238] pl-9 pr-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchDirectory()}
                disabled={loading}
                className="h-10 px-3.5 rounded-xl bg-white dark:bg-[#192338] hover:bg-sky-50 dark:hover:bg-[#22304d] border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-bold text-slate-800 dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Account Cards */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {data && data.items.length === 0 && (
              <div className="text-center py-8 text-sm font-semibold text-slate-600 dark:text-slate-300 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                No Staff or Patient records matched your search.
              </div>
            )}

            {data?.items.map((u) => {
              const isEditing = editingUserId === u.id && editForm !== null;
              const isResetting = resetUserId === u.id;
              const isPwShown = Boolean(revealedPasswords[u.id]);
              return (
                <div
                  key={u.id}
                  className="rounded-2xl border-2 border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#162034] p-4 space-y-3 shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-500/50 transition-all duration-200"
                >
                  {/* Summary Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            u.account_type === 'staff'
                              ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-400/40'
                              : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-400/40'
                          }`}
                        >
                          {u.account_type === 'staff' ? 'STAFF' : 'PATIENT'}
                        </span>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{u.full_name}</span>
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 uppercase">
                          {u.role.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                            u.is_active && u.approval_status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-400/40'
                              : u.approval_status === 'pending'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-400/40'
                                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-400/40'
                          }`}
                        >
                          {u.is_active ? u.approval_status.toUpperCase() : `BLOCKED (${u.approval_status})`}
                        </span>
                        {u.is_locked && (
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 border border-rose-400 inline-flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> LOCKED
                          </span>
                        )}
                      </div>

                      {/* Saved Username + Saved Password + Key IDs */}
                      <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <span className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-[#0d1526] border border-sky-200 dark:border-sky-500/35 rounded-lg px-2.5 py-1">
                          <span className="text-slate-600 dark:text-slate-300">Username:</span>
                          <code className="font-mono font-extrabold text-sky-800 dark:text-amber-300">{u.username}</code>
                          <button
                            type="button"
                            onClick={() => copyValue(`u-${u.id}`, u.username)}
                            className="text-slate-500 dark:text-slate-300 hover:text-amber-500 cursor-pointer"
                            title="Copy saved username"
                          >
                            {copiedField === `u-${u.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </span>

                        <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-[#191b2e] border border-amber-300 dark:border-amber-500/40 rounded-lg px-2.5 py-1">
                          <span className="text-slate-700 dark:text-slate-300">Password:</span>
                          {u.saved_password ? (
                            <>
                              <code className="font-mono font-extrabold text-amber-800 dark:text-amber-300">
                                {isPwShown ? u.saved_password : '••••••••'}
                              </code>
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedPasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                                }
                                className="text-amber-700 dark:text-amber-300 hover:opacity-80 cursor-pointer"
                                title={isPwShown ? 'Hide Password' : 'View Saved Password'}
                              >
                                {isPwShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyValue(`pw-${u.id}`, u.saved_password!)}
                                className="text-slate-600 dark:text-slate-300 hover:text-amber-500 cursor-pointer"
                                title="Copy saved password"
                              >
                                {copiedField === `pw-${u.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditor(u)}
                              className="text-xs font-bold text-amber-700 dark:text-amber-300 underline cursor-pointer"
                            >
                              Set / Sync on Next Login
                            </button>
                          )}
                        </span>

                        {u.staff_id && (
                          <span>
                            <span className="text-slate-500 dark:text-slate-400">Staff ID:</span>{' '}
                            <code className="font-mono font-bold text-slate-900 dark:text-white">{u.staff_id}</code>
                          </span>
                        )}
                        {u.fayda_id && (
                          <span>
                            <span className="text-slate-500 dark:text-slate-400">Fayda ID:</span>{' '}
                            <code className="font-mono font-bold text-slate-900 dark:text-white">{u.fayda_id}</code>
                          </span>
                        )}
                        {u.mrn && (
                          <span>
                            <span className="text-slate-500 dark:text-slate-400">MRN:</span>{' '}
                            <code className="font-mono font-bold text-slate-900 dark:text-white">{u.mrn}</code>
                          </span>
                        )}
                        {u.phone_number && (
                          <span>
                            <span className="text-slate-500 dark:text-slate-400">Phone:</span> {u.phone_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => (isEditing ? setEditingUserId(null) : openEditor(u))}
                        className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-400/40 inline-flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>{isEditing ? 'Close Edit' : 'View / Edit Bio & Credentials'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId(null);
                          setResetUserId(isResetting ? null : u.id);
                          setResetPasswordInput('');
                          setResetReason('');
                          setResetActivate(!u.is_active || u.approval_status !== 'approved');
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-400/40 inline-flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-all"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>{isResetting ? 'Cancel Reset' : 'Quick Reset Pw'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Read-Only Biography & Telemetry Strip */}
                  {!isEditing && (
                    <div className="rounded-xl bg-slate-50 dark:bg-[#0f1729] border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap font-semibold text-slate-600 dark:text-slate-300">
                        <span>
                          {u.account_type === 'staff'
                            ? `Dept: ${u.department || 'N/A'} | License: ${u.license_number || 'N/A'} | Email: ${u.email}`
                            : `Birth Date: ${u.birth_date || 'N/A'} | Gender: ${u.gender || 'N/A'} | City: ${u.city || 'N/A'} | Email: ${u.email}`}
                        </span>
                        <span>
                          Last Login: {formatDateTime(u.last_login_at)} | IP: {u.last_ip || 'N/A'}
                        </span>
                      </div>
                      <p className="text-slate-900 dark:text-slate-100 font-semibold leading-relaxed">
                        <span className="text-slate-600 dark:text-slate-300 font-extrabold">Biography / Notes: </span>
                        {u.biography ? (
                          u.biography
                        ) : (
                          <span className="italic font-normal text-slate-500 dark:text-slate-400">
                            No biography recorded yet — click &ldquo;View / Edit Bio &amp; Credentials&rdquo; to add details.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Inline Password Reset Form */}
                  {isResetting && (
                    <div className="rounded-xl border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-[#141c2e] p-3.5 space-y-3">
                      <p className="text-sm font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        Reset Password &amp; Clear Lockout for {u.full_name} ({u.username})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            New Password (leave empty to auto-generate Mkh#...)
                          </label>
                          <input
                            type="text"
                            value={resetPasswordInput}
                            onChange={(e) => setResetPasswordInput(e.target.value)}
                            placeholder="Optional custom password (min 6 chars)"
                            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            Recovery Reason / Admin Note
                          </label>
                          <input
                            type="text"
                            value={resetReason}
                            onChange={(e) => setResetReason(e.target.value)}
                            placeholder="e.g. Staff/Patient forgot credentials"
                            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 text-sm font-semibold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                        <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetActivate}
                            onChange={(e) => setResetActivate(e.target.checked)}
                            className="rounded border-slate-400"
                          />
                          <span>Also ensure account is Active &amp; Approved</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          disabled={resettingPw}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <KeyRound className="w-4 h-4" />
                          <span>{resettingPw ? 'Saving...' : 'Issue & Save Password'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Full Profile, Password & Biography Editor */}
                  {isEditing && editForm && (
                    <div className="rounded-xl border-2 border-indigo-300 dark:border-indigo-500/45 bg-indigo-50/50 dark:bg-[#131b2e] p-4 space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                        <div>
                          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Username</label>
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-mono font-bold text-sky-800 dark:text-amber-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                            Saved / Edit Password
                          </label>
                          <div className="relative">
                            <input
                              type={showEditPassword ? 'text' : 'password'}
                              value={editForm.new_password}
                              onChange={(e) => setEditForm({ ...editForm, new_password: e.target.value })}
                              placeholder="Enter or update password (min 6 chars)"
                              className="w-full h-10 rounded-xl border border-amber-400 dark:border-amber-500/60 bg-white dark:bg-[#0d1422] pl-3 pr-9 font-mono font-bold text-amber-800 dark:text-amber-300 focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEditPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 px-2.5 text-slate-500 dark:text-slate-300 hover:text-amber-500 cursor-pointer"
                              title={showEditPassword ? 'Hide password' : 'Show password'}
                            >
                              {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={editForm.phone_number}
                            onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Email</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {u.account_type === 'staff' ? (
                          <>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Staff ID</label>
                              <input
                                type="text"
                                value={editForm.staff_id}
                                onChange={(e) => setEditForm({ ...editForm, staff_id: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-mono font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Department</label>
                              <input
                                type="text"
                                value={editForm.department}
                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">License Number</label>
                              <input
                                type="text"
                                value={editForm.license_number}
                                onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-mono font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Fayda National ID</label>
                              <input
                                type="text"
                                value={editForm.fayda_id}
                                onChange={(e) => setEditForm({ ...editForm, fayda_id: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-mono font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">MRN</label>
                              <input
                                type="text"
                                value={editForm.mrn}
                                onChange={(e) => setEditForm({ ...editForm, mrn: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-mono font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">City / Woreda</label>
                              <input
                                type="text"
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Birth Date (YYYY-MM-DD)</label>
                              <input
                                type="text"
                                value={editForm.birth_date}
                                onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-mono font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Gender</label>
                              <select
                                value={editForm.gender}
                                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                              >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </>
                        )}

                        {u.role !== 'super_admin' && (
                          <div>
                            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Assigned Role</label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">Approval Status</label>
                          <select
                            value={editForm.approval_status}
                            onChange={(e) => setEditForm({ ...editForm, approval_status: e.target.value })}
                            className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending Review</option>
                            <option value="rejected">Rejected / Blocked</option>
                          </select>
                        </div>

                        <div className="flex items-end pb-2">
                          <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.is_active}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                              className="rounded border-slate-400"
                            />
                            <span>Account Active (Allowed to Log In)</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                          Complete Biography, Clinical Background &amp; Administrative Notes
                        </label>
                        <textarea
                          rows={3}
                          maxLength={2000}
                          value={editForm.biography}
                          onChange={(e) => setEditForm({ ...editForm, biography: e.target.value })}
                          placeholder="Enter staff qualifications/biography or patient background/clinical recovery notes..."
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#0d1422] px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none resize-y"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(null);
                            setEditForm(null);
                          }}
                          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(u)}
                          disabled={savingEdit}
                          className="px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
