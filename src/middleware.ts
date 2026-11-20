import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'pb_session_token';

// Simple decode function for middleware routing checks
function decodeSession(token: string): { userId: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payload = parts[0];
    const decoded = atob(payload);
    const [userId, role] = decoded.split(':');
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isParticipantPath = pathname.startsWith('/participant');
  const isJudgePath = pathname.startsWith('/judge');
  const isAdminPath = pathname.startsWith('/admin');

  if (!isParticipantPath && !isJudgePath && !isAdminPath) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? decodeSession(token) : null;

  // 1. Participant Portal Access Rule
  if (isParticipantPath) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/participant/login';
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'PARTICIPANT') {
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      url.searchParams.set('portal', 'Participant Portal');
      url.searchParams.set('role', session.role);
      return NextResponse.redirect(url);
    }
  }

  // 2. Judge Portal Access Rule
  if (isJudgePath) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/judge/login';
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'JUDGE') {
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      url.searchParams.set('portal', 'Judge Portal');
      url.searchParams.set('role', session.role);
      return NextResponse.redirect(url);
    }
  }

  // 3. Admin Portal Access Rule
  if (isAdminPath) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/admin/login';
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }
    const adminRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'CHALLENGE_MANAGER',
      'PARTICIPANT_MANAGER',
      'JUDGE_MANAGER',
      'RESULTS_MANAGER',
      'VOTING_MANAGER',
    ];
    if (!adminRoles.includes(session.role)) {
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      url.searchParams.set('portal', 'Admin Portal');
      url.searchParams.set('role', session.role);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/participant/:path*', '/judge/:path*', '/admin/:path*'],
};
