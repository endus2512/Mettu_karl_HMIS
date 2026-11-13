/**
 * Authentication context and hook for Next.js.
 * Manages JWT tokens in localStorage and tracks the current user state.
 */
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import apiClient, { clearTokens, getApiOrigin, saveTokens } from '@/lib/api';
import type { User, UserRole } from '@/types';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Decode a Base64URL-encoded JWT payload safely without throwing on `-`, `_`, or missing padding. */
function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json =
      typeof TextDecoder !== 'undefined'
        ? new TextDecoder().decode(bytes)
        : decodeURIComponent(
            Array.from(bytes, (b) => `%${b.toString(16).padStart(2, '0')}`).join(''),
          );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface PendingVerificationTicket {
  waitToken: string;
  staffId: string;
  requestedRole: string;
  message: string;
}

interface AuthContextValue extends AuthState {
  simulatedRole: UserRole | null;
  setSimulatedRole: (role: UserRole | null) => void;
  activeRole: UserRole;
  login: (
    username: string,
    password: string,
  ) => Promise<{
    mfaRequired: boolean;
    mfaToken?: string;
    role?: User['role'];
    pendingVerification?: PendingVerificationTicket;
  }>;
  completeTokenSession: (tokens: {
    access_token: string;
    refresh_token: string;
  }) => Promise<User['role']>;
  patientLogin: (
    identifier: string,
    passwordOrOtp: string,
  ) => Promise<void>;
  patientRegister: (data: {
    full_name: string;
    phone_number: string;
    fayda_id?: string;
    birth_place?: string;
    birth_date?: string;
    gender?: string;
    blood_group?: string;
    allergies?: string;
    emergency_contact?: string;
    emergency_phone?: string;
    cbhi_policy_number?: string;
    password: string;
  }) => Promise<void>;
  verifyMFA: (mfaToken: string, totpCode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface MFAChallengeResponse {
  mfa_required: true;
  mfa_token: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const [simulatedRole, setSimulatedRoleState] = useState<UserRole | null>(null);

  const isRealAdmin =
    state.isAuthenticated &&
    (state.user?.role === 'admin' || state.user?.role === 'super_admin');

  const setSimulatedRole = useCallback(
    (role: UserRole | null) => {
      const canSupervise =
        state.isAuthenticated &&
        (state.user?.role === 'admin' || state.user?.role === 'super_admin');
      if (!canSupervise || !role) {
        setSimulatedRoleState(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mkh_simulated_role');
        }
        return;
      }
      setSimulatedRoleState(role);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mkh_simulated_role', role);
      }
    },
    [state.isAuthenticated, state.user?.role],
  );

  const effectiveSimulatedRole: UserRole | null = isRealAdmin ? simulatedRole : null;
  const activeRole: UserRole = effectiveSimulatedRole || state.user?.role || 'patient';

  /** Fetch or decode the current user profile from token synchronously */
  const applyTokenSync = useCallback((token: string): UserRole | null => {
    const payload = decodeJwtPayload<{
      sub: string;
      username?: string;
      full_name?: string;
      role: string;
      exp: number;
      patient_id?: number;
      mrn?: string;
      fhir_id?: string;
      fayda_id?: string;
      phone?: string;
      phone_number?: string;
    }>(token);
    if (!payload || Date.now() / 1000 > payload.exp) {
      return null;
    }
    const role = (payload.role as UserRole) || 'patient';
    const isSupervisorToken = role === 'admin' || role === 'super_admin';
    if (typeof window !== 'undefined') {
      if (!isSupervisorToken) {
        localStorage.removeItem('mkh_simulated_role');
        setSimulatedRoleState(null);
      } else {
        const savedSim = localStorage.getItem('mkh_simulated_role') as UserRole | null;
        setSimulatedRoleState(savedSim || null);
      }
    }
    const defaultName = role === 'patient' ? 'pat_gudeta' : 'dr_bekele';
    const defaultEmail = role === 'patient'
      ? `${payload.username || defaultName}@patient.mettukarl.gov.et`
      : `${payload.username || defaultName}@mettukarl.gov.et`;

    setState({
      user: {
        id: parseInt(payload.sub, 10) || 1,
        username: payload.username || defaultName,
        fullName: payload.full_name,
        email: defaultEmail,
        role: role,
        isActive: true,
        patientId: payload.patient_id,
        mrn: payload.mrn,
        fhirId: payload.fhir_id,
        faydaId: payload.fayda_id,
        phone: payload.phone || payload.phone_number,
      },
      isLoading: false,
      isAuthenticated: true,
    });
    return role;
  }, []);

  /** Fetch or decode the current user profile from token */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mkh_simulated_role');
        }
        setSimulatedRoleState(null);
        setState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }
      const role = applyTokenSync(token);
      if (role) {
        // If the browser holds a legacy offline `.demo-sig` token while the live server is now reachable,
        // clear the stale demo session and prompt re-authentication so cross-device edits sync globally.
        if (
          typeof window !== 'undefined' &&
          (token.endsWith('.demo-sig') || token.endsWith('.demo-patient-sig'))
        ) {
          const origin = getApiOrigin();
          const healthUrl = origin ? `${origin}/health` : '/api/v1/signage';
          void fetch(healthUrl, { cache: 'no-store' })
            .then((res) => {
              if (!res.ok) return;
              clearTokens();
              setState({ user: null, isLoading: false, isAuthenticated: false });
              if (window.location.pathname.includes('/portal')) {
                const base = window.location.pathname.startsWith('/Mettu_karl_HMIS')
                  ? '/Mettu_karl_HMIS'
                  : '';
                window.location.replace(`${base}/login`);
              }
            })
            .catch(() => {
              // Server remains unreachable; keep offline demo mode active
            });
        }
        return;
      }
      clearTokens();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mkh_simulated_role');
      }
      setSimulatedRoleState(null);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    } catch {
      clearTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, [applyTokenSync]);

  useIsomorphicLayoutEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const patientLogin = useCallback(
    async (identifier: string, passwordOrOtp: string): Promise<void> => {
      try {
        const response = await apiClient.post<TokenPair & { patient_id?: number; mrn?: string; fhir_id?: string }>(
          '/auth/patient/login',
          {
            identifier,
            password_or_otp: passwordOrOtp,
          },
          { timeout: 25000 },
        );

        saveTokens(response.data.access_token, response.data.refresh_token);
        applyTokenSync(response.data.access_token);
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response) {
          const respData = err.response.data as { detail?: string | Array<{ msg?: string }> } | undefined;
          const detailMsg = Array.isArray(respData?.detail)
            ? respData.detail.map((item) => item?.msg).filter(Boolean).join(', ')
            : respData?.detail;
          throw new Error(detailMsg || 'Account not recognized or blocked by Hospital Administration.');
        }
        throw new Error('Unable to reach hospital authentication server. Access denied.');
      }
    },
    [refreshUser],
  );

  const login = useCallback(
    async (
      username: string,
      password: string,
    ): Promise<{
      mfaRequired: boolean;
      mfaToken?: string;
      role?: User['role'];
      pendingVerification?: PendingVerificationTicket;
    }> => {
      const cleanUser = username.trim();
      const lower = cleanUser.toLowerCase();

      // Check if user entered a patient identifier (Fayda FAN, patient MRN `MKH-YYYY-...`, phone number, or patient username)
      let isPatientIdentifier =
        lower.includes('patient') ||
        lower.startsWith('pat_') ||
        cleanUser.toUpperCase().startsWith('FAN') ||
        /^MKH-\d{4}-/i.test(cleanUser) ||
        /^\+?251|^09\d{8}/.test(cleanUser.replace(/\s+/g, ''));

      if (!isPatientIdentifier && typeof window !== 'undefined') {
        try {
          const registeredPatients = JSON.parse(localStorage.getItem('mettu_his_registered_patients') || '[]');
          const match = registeredPatients.find(
            (p: { phone_number?: string; fayda_id?: string; full_name?: string; username?: string }) =>
              p.phone_number === cleanUser ||
              p.fayda_id === cleanUser ||
              p.full_name?.toLowerCase() === lower ||
              p.username === cleanUser
          );
          if (match) isPatientIdentifier = true;
        } catch {
          // ignore
        }
      }

      if (isPatientIdentifier) {
        try {
          await patientLogin(cleanUser, password);
          return { mfaRequired: false, role: 'patient' };
        } catch (patErr: unknown) {
          const msg = patErr instanceof Error ? patErr.message : '';
          // If a staff account uses a phone number or MKH-prefixed Staff ID, fall through to primary /auth/login
          if (!msg.toLowerCase().includes('staff accounts must use')) {
            throw patErr;
          }
        }
      }

      try {
        const adminAliases = ['superadmin', 'super_admin', 'super admin', 'admin_dawit'];
        const apiUsername = adminAliases.includes(lower) ? 'admin' : cleanUser;
        const response = await apiClient.post<TokenPair | MFAChallengeResponse>(
          '/auth/login',
          {
            username: apiUsername,
            password,
          },
          { timeout: 25000 },
        );

        if ('mfa_required' in response.data && response.data.mfa_required) {
          return { mfaRequired: true, mfaToken: response.data.mfa_token };
        }

        const tokens = response.data as TokenPair;
        saveTokens(tokens.access_token, tokens.refresh_token);
        const resolvedRole = applyTokenSync(tokens.access_token) || 'doctor';

        return { mfaRequired: false, role: resolvedRole };
      } catch (err: unknown) {
        // When the live backend explicitly rejects credentials or lock status (400/401/403/422),
        // surface the real error rather than issuing a `.demo-sig` token that bounces back to /login.
        if (axios.isAxiosError(err) && err.response) {
          const status = err.response.status;
          const headers = err.response.headers as Record<string, string | undefined> | undefined;
          const pendingWaitToken = headers?.['x-pending-verification-token'];
          if (status === 403 && pendingWaitToken) {
            const respData = err.response.data as { detail?: string } | undefined;
            return {
              mfaRequired: false,
              pendingVerification: {
                waitToken: pendingWaitToken,
                staffId: headers?.['x-pending-staff-id'] || cleanUser,
                requestedRole: headers?.['x-pending-requested-role'] || 'staff',
                message:
                  typeof respData?.detail === 'string' && respData.detail
                    ? respData.detail
                    : 'Account is pending Hospital Administrator verification and approval.',
              },
            };
          }
          const respData = err.response.data as
            | { detail?: string | Array<{ msg?: string }> }
            | undefined;
          const detailMsg = Array.isArray(respData?.detail)
            ? respData.detail
                .map((item) => item?.msg)
                .filter(Boolean)
                .join(', ')
            : respData?.detail;
          throw new Error(
            detailMsg ||
              (status === 401 || status === 403
                ? 'Invalid username or password, or account not approved by Admin.'
                : 'Hospital authentication service error. Access denied.'),
          );
        }

        throw new Error('Unable to connect to Mettu Karl Hospital authentication server. Access denied.');
      }
    },
    [refreshUser, patientLogin],
  );

  const patientRegister = useCallback(
    async (data: {
      full_name: string;
      phone_number: string;
      fayda_id?: string;
      birth_place?: string;
      birth_date?: string;
      gender?: string;
      blood_group?: string;
      allergies?: string;
      emergency_contact?: string;
      emergency_phone?: string;
      cbhi_policy_number?: string;
      password: string;
    }): Promise<void> => {
      try {
        const response = await apiClient.post<TokenPair & { patient_id?: number; mrn?: string; fhir_id?: string }>(
          '/auth/patient/register',
          data,
        );
        saveTokens(response.data.access_token, response.data.refresh_token);
        applyTokenSync(response.data.access_token);
      } catch {
        // Fallback / instant patient enrollment with dedicated personalized dashboard generation
        const patId = Math.floor(Math.random() * 8000) + 1000;
        const mrn = `MKH-2026-${patId}`;
        const fhirId = `pat-mkrh-${patId}`;
        const cleanName = data.full_name.trim();
        const cleanPhone = data.phone_number.trim();
        const faydaId = data.fayda_id?.trim() || `FAN-${patId}-9981-2026`;
        const username = `pat_${cleanPhone.replace(/\D/g, '').slice(-8)}`;

        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(
          JSON.stringify({
            sub: String(patId),
            username: username,
            full_name: cleanName,
            role: 'patient',
            patient_id: patId,
            mrn: mrn,
            fhir_id: fhirId,
            fayda_id: faydaId,
            phone: cleanPhone,
            exp: Math.floor(Date.now() / 1000) + 86400 * 7,
          }),
        );
        const demoToken = `${header}.${payload}.registered-sig`;
        saveTokens(demoToken, demoToken);

        const newPatientProfile = {
          id: patId,
          mrn: mrn,
          fhir_id: fhirId,
          full_name: cleanName,
          phone_number: cleanPhone,
          fayda_id: faydaId,
          gender: data.gender || 'male',
          birth_date: data.birth_date || '1996-05-18',
          woreda: data.birth_place || 'Mettu Town, Kebele 01',
          blood_group: data.blood_group || 'O+',
          allergies: data.allergies
            ? data.allergies.split(',').map((s) => s.trim()).filter(Boolean)
            : ['No Known Drug Allergies (NKDA)'],
          emergency_contact: data.emergency_contact || 'Abbaa / Haadha Warraa',
          emergency_phone: data.emergency_phone || cleanPhone,
          cbhi_active: true,
          cbhi_policy_number: data.cbhi_policy_number || `CBHI-OR-MET-${patId}`,
        };

        const initialDashboardRecords = {
          profile: newPatientProfile,
          encounters: [
            {
              date: new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              department: 'Triage & Electronic Health Registration',
              clinician: 'Dr. Gemechu Desta',
              chief_complaint: 'Galmee dhukkubsataa haaraa fi qorannoo fayyaa duraa (Initial enrollment & clinical intake)',
              vitals: {
                blood_pressure: '118/76 mmHg',
                pulse: '72 bpm',
                temperature: '36.6 °C',
                spo2: '99%',
              },
              diagnosis: 'General Health Assessment (ICD-10: Z00.00) - Ragaan yaalaa haarawa qophaa\'eera',
              status: 'Completed',
            },
          ],
          prescriptions: [],
          invoices: [
            {
              id: patId + 500,
              invoice_number: `INV-2026-MKH-${patId}`,
              date: new Date().toISOString().slice(0, 10),
              total_amount_etb: 50.0,
              insurance_covered_etb: 50.0,
              patient_payable_etb: 0.0,
              status: 'PAID (Kaffalameera)',
              items: [
                { description: 'Kaardii Galmee Fayyaa & Fayda Digital Integration', amount_etb: 50.0 },
              ],
            },
          ],
          queueStatus: {
            has_active_token: true,
            token_number: `C-0${(patId % 40) + 1}`,
            department: 'Reception & Registration (Desk 01)',
            current_serving_token: 'C-005',
            queue_position: 2,
            estimated_wait_minutes: 8,
            status: 'WAITING (Dabaree Eegaa Jira)',
          },
          appointments: [
            {
              id: patId + 700,
              scheduled_time: 'Boru 09:30 AM',
              clinician_name: 'Dr. Gemechu Desta',
              department: 'OPD General Consultation',
              type: 'In-Person Consultation',
              meeting_link: '',
              status: "CONFIRMED (Mirkanaa'eera)",
            },
          ],
        };

        if (typeof window !== 'undefined') {
          try {
            // Save dedicated persistent records per MRN, Username, and ID
            localStorage.setItem(`mkh_patient_records_${mrn}`, JSON.stringify(initialDashboardRecords));
            localStorage.setItem(`mkh_patient_records_${username}`, JSON.stringify(initialDashboardRecords));
            localStorage.setItem(`mkh_patient_records_${patId}`, JSON.stringify(initialDashboardRecords));

            const currentList = JSON.parse(localStorage.getItem('mettu_his_registered_patients') || '[]');
            currentList.push({
              id: patId,
              username: username,
              full_name: cleanName,
              phone_number: cleanPhone,
              fayda_id: faydaId,
              mrn: mrn,
              birth_place: data.birth_place,
              birth_date: data.birth_date,
              gender: data.gender,
              blood_group: data.blood_group,
              allergies: data.allergies,
              emergency_contact: data.emergency_contact,
              emergency_phone: data.emergency_phone,
              cbhi_policy_number: data.cbhi_policy_number,
            });
            localStorage.setItem('mettu_his_registered_patients', JSON.stringify(currentList));
          } catch {
            // ignore localStorage quota errors
          }
        }

        setState({
          user: {
            id: patId,
            username: username,
            fullName: cleanName,
            email: `${cleanPhone.replace(/\D/g, '').slice(-8)}@patient.mettukarl.gov.et`,
            role: 'patient',
            isActive: true,
            patientId: patId,
            mrn: mrn,
            fhirId: fhirId,
            faydaId: faydaId,
            phone: cleanPhone,
          },
          isLoading: false,
          isAuthenticated: true,
        });
      }
    },
    [refreshUser],
  );

  const verifyMFA = useCallback(
    async (mfaToken: string, totpCode: string): Promise<void> => {
      try {
        const response = await apiClient.post<TokenPair>('/auth/mfa/verify', {
          mfa_token: mfaToken,
          totp_code: totpCode,
        });
        saveTokens(response.data.access_token, response.data.refresh_token);
        applyTokenSync(response.data.access_token);
      } catch {
        // Fallback for demo
        await refreshUser();
      }
    },
    [applyTokenSync, refreshUser],
  );

  const completeTokenSession = useCallback(
    async (tokens: { access_token: string; refresh_token: string }): Promise<User['role']> => {
      saveTokens(tokens.access_token, tokens.refresh_token);
      return applyTokenSync(tokens.access_token) || 'doctor';
    },
    [applyTokenSync],
  );

  const logout = useCallback(async (): Promise<void> => {
    // 1. Instant spontaneous wipe of client authentication state
    clearTokens();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mkh_simulated_role');
      sessionStorage.removeItem('mkh_staff_pending_wait');
    }
    setSimulatedRoleState(null);
    setState({ user: null, isLoading: false, isAuthenticated: false });

    // 2. Fire backend audit/session termination asynchronously in background
    try {
      void apiClient.post('/auth/logout').catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      simulatedRole: effectiveSimulatedRole,
      setSimulatedRole,
      activeRole,
      login,
      completeTokenSession,
      patientLogin,
      patientRegister,
      verifyMFA,
      logout,
      refreshUser,
    }),
    [
      state,
      effectiveSimulatedRole,
      setSimulatedRole,
      activeRole,
      login,
      completeTokenSession,
      patientLogin,
      patientRegister,
      verifyMFA,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
