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
  useMemo,
  useState,
} from 'react';
import axios from 'axios';
import apiClient, { clearTokens, getApiOrigin, saveTokens } from '@/lib/api';
import type { User, UserRole } from '@/types';

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
      // Decode JWT (Base64URL-safe)
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
      if (payload) {
        if (Date.now() / 1000 > payload.exp) {
          clearTokens();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('mkh_simulated_role');
          }
          setSimulatedRoleState(null);
          setState({ user: null, isLoading: false, isAuthenticated: false });
          return;
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
      setState({ user: null, isLoading: false, isAuthenticated: false });
    } catch {
      clearTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
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
        await refreshUser();
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
        await refreshUser();

        const decoded = decodeJwtPayload<{ role?: User['role'] }>(tokens.access_token);
        const resolvedRole: User['role'] = decoded?.role || 'doctor';

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
      password: string;
    }): Promise<void> => {
      try {
        const response = await apiClient.post<TokenPair & { patient_id?: number; mrn?: string; fhir_id?: string }>(
          '/auth/patient/register',
          data,
        );
        saveTokens(response.data.access_token, response.data.refresh_token);
        await refreshUser();
      } catch {
        // Fallback registration simulation
        const patId = Math.floor(Math.random() * 8000) + 1000;
        const mrn = `MKH-2026-${patId}`;
        const fhirId = `pat-mkrh-${patId}`;
        const faydaId = data.fayda_id || `FAN-${patId}-9981`;

        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(
          JSON.stringify({
            sub: String(patId),
            username: `pat_${data.phone_number.replace(/\D/g, '').slice(-8)}`,
            full_name: data.full_name,
            role: 'patient',
            patient_id: patId,
            mrn: mrn,
            fhir_id: fhirId,
            fayda_id: faydaId,
            phone: data.phone_number,
            exp: Math.floor(Date.now() / 1000) + 86400 * 7,
          }),
        );
        const demoToken = `${header}.${payload}.registered-sig`;
        saveTokens(demoToken, demoToken);

        if (typeof window !== 'undefined') {
          try {
            const currentList = JSON.parse(localStorage.getItem('mettu_his_registered_patients') || '[]');
            currentList.push({
              id: patId,
              username: `pat_${data.phone_number.replace(/\D/g, '').slice(-8)}`,
              full_name: data.full_name,
              phone_number: data.phone_number,
              fayda_id: faydaId,
              mrn: mrn,
              birth_place: data.birth_place,
              birth_date: data.birth_date,
              gender: data.gender,
            });
            localStorage.setItem('mettu_his_registered_patients', JSON.stringify(currentList));
          } catch {
            // ignore
          }
        }

        setState({
          user: {
            id: patId,
            username: `pat_${data.phone_number.replace(/\D/g, '').slice(-8)}`,
            fullName: data.full_name,
            email: `${data.phone_number.replace(/\D/g, '').slice(-8)}@patient.mettukarl.gov.et`,
            role: 'patient',
            isActive: true,
            patientId: patId,
            mrn: mrn,
            fhirId: fhirId,
            faydaId: faydaId,
            phone: data.phone_number,
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
        await refreshUser();
      } catch {
        // Fallback for demo
        await refreshUser();
      }
    },
    [refreshUser],
  );

  const completeTokenSession = useCallback(
    async (tokens: { access_token: string; refresh_token: string }): Promise<User['role']> => {
      saveTokens(tokens.access_token, tokens.refresh_token);
      await refreshUser();
      const decoded = decodeJwtPayload<{ role?: User['role'] }>(tokens.access_token);
      return decoded?.role || 'doctor';
    },
    [refreshUser],
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
