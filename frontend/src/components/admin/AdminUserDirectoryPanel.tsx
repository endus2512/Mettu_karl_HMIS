'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BookUser,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
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

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    username: string;
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
    setEditForm({
      username: u.username || '',
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
        title: 'Profile & Biography Updated',
        message: `${res.data.full_name} (${res.data.username}) saved cleanly.`,
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
      className="bg-[#101624] border border-[#222b3d] rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Compact Header (Minimized by Default) */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <BookUser className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Staff &amp; Patient Directory, Biography &amp; Credential Recovery
              </h2>
              {data && (
                <>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {data.staff_count} Staff
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {data.patient_count} Patients
                  </span>
                  {lockedCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {lockedCount} Locked
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Look up forgotten usernames, inspect &amp; edit Staff/Patient biographies, and reset forgotten passwords.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#172033] hover:bg-[#1f2b44] text-amber-300 border border-amber-500/30 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{isMinimized ? 'Open Directory & Recovery' : 'Minimize'}</span>
          {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Directory & Recovery Console */}
      {!isMinimized && (
        <div className="border-t border-[#1e293b] p-4 space-y-4 bg-[#0b101b]">
          {/* Active Password Recovery Slip Banner */}
          {recoverySlip && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Recovery Slip Ready — Share Directly with {recoverySlip.full_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecoverySlip(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Close recovery slip"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-[#090d16] border border-emerald-500/25 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Saved Username</p>
                    <p className="font-mono font-bold text-white">{recoverySlip.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue('slip-user', recoverySlip.username)}
                    className="p-1 text-emerald-300 hover:bg-emerald-500/20 rounded cursor-pointer"
                    title="Copy Username"
                  >
                    {copiedField === 'slip-user' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="bg-[#090d16] border border-emerald-500/25 rounded-lg px-3 py-2">
                  <p className="text-[10px] uppercase text-slate-400">Staff / Fayda ID</p>
                  <p className="font-mono font-semibold text-slate-200">
                    {recoverySlip.staff_id || recoverySlip.fayda_id || 'N/A'}
                  </p>
                </div>
                <div className="bg-[#090d16] border border-emerald-500/25 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">New Temporary Password</p>
                    <p className="font-mono font-bold text-amber-300">{recoverySlip.temporary_password}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue('slip-pw', recoverySlip.temporary_password)}
                    className="p-1 text-amber-300 hover:bg-amber-500/20 rounded cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedField === 'slip-pw' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'staff', 'patient'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAccountTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    accountTab === tab
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-[#151d2f] text-slate-300 hover:bg-[#1e2942] border border-[#25314d]'
                  }`}
                >
                  {tab === 'all' ? 'All Accounts' : tab === 'staff' ? 'Hospital Staff' : 'Patients'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-1 md:max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search name, username, Staff ID, Fayda, MRN, phone, or bio..."
                  className="w-full h-9 rounded-lg border border-[#25314d] bg-[#101726] pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchDirectory()}
                disabled={loading}
                className="h-9 px-3 rounded-lg bg-[#151d2f] hover:bg-[#1e2942] border border-[#25314d] text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Account Cards */}
          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {data && data.items.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-[#25314d] rounded-xl">
                No Staff or Patient records matched your search.
              </div>
            )}

            {data?.items.map((u) => {
              const isEditing = editingUserId === u.id && editForm !== null;
              const isResetting = resetUserId === u.id;
              return (
                <div
                  key={u.id}
                  className="rounded-xl border border-[#212b42] bg-[#101624] p-3.5 space-y-2.5"
                >
                  {/* Summary Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            u.account_type === 'staff'
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {u.account_type === 'staff' ? 'STAFF' : 'PATIENT'}
                        </span>
                        <span className="text-sm font-bold text-white">{u.full_name}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 uppercase">
                          {u.role.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            u.is_active && u.approval_status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : u.approval_status === 'pending'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {u.is_active ? u.approval_status.toUpperCase() : `BLOCKED (${u.approval_status})`}
                        </span>
                        {u.is_locked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> LOCKED
                          </span>
                        )}
                      </div>

                      {/* Saved Username + Key IDs */}
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-300">
                        <span className="inline-flex items-center gap-1.5 bg-[#090e18] border border-[#25314d] rounded-md px-2 py-0.5">
                          <span className="text-slate-400">Username:</span>
                          <code className="font-mono font-bold text-amber-300">{u.username}</code>
                          <button
                            type="button"
                            onClick={() => copyValue(`u-${u.id}`, u.username)}
                            className="text-slate-400 hover:text-amber-300 cursor-pointer"
                            title="Copy saved username"
                          >
                            {copiedField === `u-${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>
                        {u.staff_id && (
                          <span>
                            <span className="text-slate-500">Staff ID:</span>{' '}
                            <code className="font-mono text-slate-200">{u.staff_id}</code>
                          </span>
                        )}
                        {u.fayda_id && (
                          <span>
                            <span className="text-slate-500">Fayda ID:</span>{' '}
                            <code className="font-mono text-slate-200">{u.fayda_id}</code>
                          </span>
                        )}
                        {u.mrn && (
                          <span>
                            <span className="text-slate-500">MRN:</span>{' '}
                            <code className="font-mono text-slate-200">{u.mrn}</code>
                          </span>
                        )}
                        {u.phone_number && (
                          <span>
                            <span className="text-slate-500">Phone:</span> {u.phone_number}
                          </span>
                        )}
                        {u.email && (
                          <span>
                            <span className="text-slate-500">Email:</span> {u.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => (isEditing ? setEditingUserId(null) : openEditor(u))}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#172136] hover:bg-[#1f2d49] text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Close Edit' : 'View / Edit Bio & Profile'}</span>
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
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{isResetting ? 'Cancel Reset' : 'Reset Password'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Read-Only Biography & Telemetry Strip */}
                  {!isEditing && (
                    <div className="rounded-lg bg-[#0b101b] border border-[#1a2234] px-3 py-2 text-[11px] space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-slate-400">
                        <span>
                          {u.account_type === 'staff'
                            ? `Dept: ${u.department || 'N/A'} | License: ${u.license_number || 'N/A'}`
                            : `Birth Date: ${u.birth_date || 'N/A'} | Gender: ${u.gender || 'N/A'} | City: ${u.city || 'N/A'}`}
                        </span>
                        <span>
                          Last Login: {formatDateTime(u.last_login_at)} | IP: {u.last_ip || 'N/A'}
                        </span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        <span className="text-slate-400 font-semibold">Biography / Notes: </span>
                        {u.biography ? (
                          u.biography
                        ) : (
                          <span className="italic text-slate-500">
                            No biography recorded yet — click &ldquo;View / Edit Bio &amp; Profile&rdquo; to add details.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Inline Password Reset Form */}
                  {isResetting && (
                    <div className="rounded-xl border border-amber-500/30 bg-[#0c111e] p-3 space-y-2.5">
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        Reset Forgotten Password &amp; Clear Lockout for {u.full_name} ({u.username})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            New Password (leave empty to auto-generate Mkh#...)
                          </label>
                          <input
                            type="text"
                            value={resetPasswordInput}
                            onChange={(e) => setResetPasswordInput(e.target.value)}
                            placeholder="Optional custom password (min 6 chars)"
                            className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            Recovery Reason / Admin Note
                          </label>
                          <input
                            type="text"
                            value={resetReason}
                            onChange={(e) => setResetReason(e.target.value)}
                            placeholder="e.g. Staff/Patient forgot credentials"
                            className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resetActivate}
                            onChange={(e) => setResetActivate(e.target.checked)}
                            className="rounded border-slate-600"
                          />
                          <span>Also ensure account is Active &amp; Approved</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          disabled={resettingPw}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{resettingPw ? 'Issuing...' : 'Issue New Password'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Full Profile & Biography Editor */}
                  {isEditing && editForm && (
                    <div className="rounded-xl border border-indigo-500/30 bg-[#0c111e] p-3.5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Username</label>
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 font-mono text-amber-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={editForm.phone_number}
                            onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                            className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Email</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {u.account_type === 'staff' ? (
                          <>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Staff ID</label>
                              <input
                                type="text"
                                value={editForm.staff_id}
                                onChange={(e) => setEditForm({ ...editForm, staff_id: e.target.value })}
                                className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 font-mono text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Department</label>
                              <input
                                type="text"
                                value={editForm.department}
                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">License Number</label>
                              <input
                                type="text"
                                value={editForm.license_number}
                                onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                                className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 font-mono text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Fayda National ID</label>
                              <input
                                type="text"
                                value={editForm.fayda_id}
                                onChange={(e) => setEditForm({ ...editForm, fayda_id: e.target.value })}
                                className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 font-mono text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">MRN</label>
                              <input
                                type="text"
                                value={editForm.mrn}
                                onChange={(e) => setEditForm({ ...editForm, mrn: e.target.value })}
                                className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 font-mono text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">City / Woreda</label>
                              <input
                                type="text"
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Birth Date (YYYY-MM-DD)</label>
                              <input
                                type="text"
                                value={editForm.birth_date}
                                onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                                className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 font-mono text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Gender</label>
                              <select
                                value={editForm.gender}
                                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-white focus:border-indigo-500 focus:outline-none"
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
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Assigned Role</label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-white focus:border-indigo-500 focus:outline-none"
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
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">Approval Status</label>
                          <select
                            value={editForm.approval_status}
                            onChange={(e) => setEditForm({ ...editForm, approval_status: e.target.value })}
                            className="w-full h-9 rounded-lg border border-[#25314d] bg-[#080c15] px-2.5 text-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending Review</option>
                            <option value="rejected">Rejected / Blocked</option>
                          </select>
                        </div>

                        <div className="flex items-end pb-1.5">
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.is_active}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                              className="rounded border-slate-600"
                            />
                            <span>Account Active (Allowed to Log In)</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          Complete Biography, Clinical Background &amp; Administrative Notes
                        </label>
                        <textarea
                          rows={3}
                          maxLength={2000}
                          value={editForm.biography}
                          onChange={(e) => setEditForm({ ...editForm, biography: e.target.value })}
                          placeholder="Enter staff qualifications/biography or patient background/clinical recovery notes..."
                          className="w-full rounded-lg border border-[#25314d] bg-[#080c15] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none resize-y"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(null);
                            setEditForm(null);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#182135] text-slate-300 hover:bg-[#222f4b] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(u)}
                          disabled={savingEdit}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
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
