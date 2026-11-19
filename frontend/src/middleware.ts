import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight payload decoder for JWT (runs in Next.js Edge Runtime without Node crypto)
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = padLen < 4 ? base64 + '='.repeat(padLen) : base64;
    const jsonStr = atob(padded);
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
  const cookieToken = request.cookies.get('access_token')?.value;
  const headerAuth = request.headers.get('authorization');
  const headerToken = headerAuth?.startsWith('Bearer ') ? headerAuth.slice(7) : null;
  const token = cookieToken || headerToken;

  const isPatientRoute = PATIENT_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isStaffRoute = STAFF_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // If visiting login pages while already authenticated, redirect to appropriate destination
  if (token && (pathname === '/login' || pathname === '/patient-login')) {
    const payload = decodeJwtPayload(token);
    if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
      const userRole = (payload.role || '').toLowerCase();
      if (userRole === 'patient') {
        return NextResponse.redirect(new URL('/patient-portal', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
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

    const userRole = (payload.role || '').toLowerCase();

    // Patients cannot access staff portals or clinical records (prevent IDOR & horizontal privilege escalation)
    if (userRole === 'patient') {
      return NextResponse.redirect(new URL('/patient-portal', request.url));
    }

    // Admin-only routes
    if (pathname.startsWith('/portal/admin') || pathname.startsWith('/audit')) {
      if (userRole !== 'super_admin' && userRole !== 'admin') {
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
