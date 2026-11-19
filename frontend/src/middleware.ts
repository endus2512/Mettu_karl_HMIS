import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function cleanToken(raw?: string | null): string | null {
  if (!raw) return null;
  let token = raw.trim();
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1);
  }
  if (token.includes('%')) {
    try {
      token = decodeURIComponent(token);
    } catch {
      // ignore
    }
  }
  return token || null;
}

// Lightweight payload decoder for JWT (runs in Next.js Edge Runtime without Node crypto)
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const cleaned = cleanToken(token);
    if (!cleaned) return null;
    const parts = cleaned.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = padLen < 4 ? base64 + '='.repeat(padLen) : base64;
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr =
      typeof TextDecoder !== 'undefined'
        ? new TextDecoder().decode(bytes)
        : decodeURIComponent(
            Array.from(bytes, (b) => `%${b.toString(16).padStart(2, '0')}`).join(''),
          );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Protected paths requiring staff authentication
const STAFF_PROTECTED_PREFIXES = [
  '/dashboard',
  '/portal',
  '/patients',
  '/accounting',
  '/analytics',
  '/assets',
  '/audit',
  '/billing',
  '/blood-bank',
  '/crm',
  '/dietary',
  '/efda',
  '/ems',
  '/fayda',
  '/hrm',
  '/infection',
  '/insurance',
  '/iomt',
  '/laboratory',
  '/mci',
  '/mortuary',
  '/ot',
  '/pacs',
  '/pharmacy',
  '/power',
  '/procurement',
  '/queue',
  '/scanner',
  '/sms-ussd',
  '/telemed',
  '/wards',
  '/academic',
];

const PATIENT_PROTECTED_PREFIXES = ['/patient-portal'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract auth token from HttpOnly cookie or Authorization header
  const rawCookie = request.cookies.get('access_token')?.value;
  const rawHeader = request.headers.get('authorization');
  const headerToken = rawHeader?.startsWith('Bearer ') ? rawHeader.slice(7) : null;
  const token = cleanToken(rawCookie) || cleanToken(headerToken);

  const isPatientRoute = PATIENT_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isStaffRoute = STAFF_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // If visiting login pages while already authenticated, redirect directly to role workstation
  if (token && (pathname === '/login' || pathname === '/patient-login')) {
    const payload = decodeJwtPayload(token);
    if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
      const userRole = (payload.role || '').toLowerCase().trim();
      if (userRole === 'patient') {
        return NextResponse.redirect(new URL('/patient-portal', request.url));
      } else if (
        userRole === 'admin' ||
        userRole === 'super_admin' ||
        userRole === 'superadmin' ||
        userRole === 'administrator' ||
        userRole === 'director' ||
        userRole === 'auditor' ||
        userRole === 'ict_admin'
      ) {
        return NextResponse.redirect(new URL('/portal/admin', request.url));
      } else if (userRole === 'doctor' || userRole === 'physician') {
        return NextResponse.redirect(new URL('/portal/doctor', request.url));
      } else if (userRole === 'nurse') {
        return NextResponse.redirect(new URL('/portal/nurse', request.url));
      } else if (userRole === 'pharmacist' || userRole === 'pharmacy') {
        return NextResponse.redirect(new URL('/portal/pharmacy', request.url));
      } else if (userRole === 'technician' || userRole === 'lab_tech' || userRole === 'lab_technician') {
        return NextResponse.redirect(new URL('/portal/lab', request.url));
      } else if (userRole === 'billing' || userRole === 'insurance_officer' || userRole === 'cashier') {
        return NextResponse.redirect(new URL('/portal/billing', request.url));
      } else if (userRole === 'receptionist' || userRole === 'reception' || userRole === 'triage') {
        return NextResponse.redirect(new URL('/portal/reception', request.url));
      } else {
        return NextResponse.redirect(new URL('/portal/admin', request.url));
      }
    }
  }

  // Enforce authentication on protected patient routes
  if (isPatientRoute) {
    if (!token) {
      const loginUrl = new URL('/patient-login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayload(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      const loginUrl = new URL('/patient-login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('access_token');
      return res;
    }
  }

  // Enforce authentication & RBAC on protected staff routes
  if (isStaffRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = decodeJwtPayload(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('access_token');
      return res;
    }

    const userRole = (payload.role || '').toLowerCase().trim();
    const isAdmin =
      userRole === 'admin' ||
      userRole === 'super_admin' ||
      userRole === 'superadmin' ||
      userRole === 'administrator' ||
      userRole === 'director' ||
      userRole === 'ict_admin' ||
      userRole === 'auditor';

    // Patients cannot access staff portals or clinical records (prevent IDOR & horizontal privilege escalation)
    if (userRole === 'patient') {
      return NextResponse.redirect(new URL('/patient-portal', request.url));
    }

    // Admin-only routes
    if (pathname.startsWith('/portal/admin') || pathname.startsWith('/audit')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // Add secure HTTP response headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes proxied to FastAPI)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, icons/
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
};
