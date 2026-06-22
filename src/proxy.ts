import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');

  const loginPath = '/admin/login';
  const verifyPath = '/admin/verify-2fa';
  const setupPath = '/admin/setup-2fa';

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Ensure these exist, if they don't, gracefully let it fail on client init to avoid proxy crash
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If not configured yet, skip proxy to avoid breaking other parts of the app during setup
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  // 1. If user is NOT logged in:
  if (!user) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (pathname !== loginPath) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
    return supabaseResponse;
  }

  // 2. User is logged in. Get MFA assurance level.
  const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = mfaData?.currentLevel; // 'aal1' or 'aal2'

  // Retrieve enrolled factors
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const totpFactors = factorsData?.totp || [];
  const phoneFactors = factorsData?.phone || [];
  const verifiedFactors = [...totpFactors, ...phoneFactors].filter(f => f.status === 'verified');
  const hasVerifiedFactor = verifiedFactors.length > 0;

  // Determine redirection target if any
  let targetPath: string | null = null;

  if (currentLevel === 'aal2') {
    // User is fully authenticated.
    // If they attempt to visit login, verify, or setup pages, redirect them to /admin dashboard.
    if (!isApiRoute && (pathname === loginPath || pathname === verifyPath || pathname === setupPath)) {
      targetPath = '/admin';
    }
  } else {
    // currentLevel is 'aal1' (standard authentication)
    if (isApiRoute) {
      return NextResponse.json({ error: 'MFA Verification Required' }, { status: 403 });
    }
    if (hasVerifiedFactor) {
      if (pathname !== verifyPath) {
        targetPath = verifyPath;
      }
    } else {
      if (pathname !== setupPath) {
        targetPath = setupPath;
      }
    }
  }

  if (targetPath) {
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
