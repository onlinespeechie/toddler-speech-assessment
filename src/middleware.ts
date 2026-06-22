import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');

  const loginPath = '/admin/login';
  const verifyPath = '/admin/verify-2fa';
  const setupPath = '/admin/setup-2fa';

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Ensure these exist and are valid URLs, to avoid middleware crash
  const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const isUrlValid = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

  if (!isUrlValid || !supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey === 'your_anon_key_here') {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 });
    }

    const urlDebug = supabaseUrl 
      ? `Detected (Length: ${supabaseUrl.length}, Starts with: "${supabaseUrl.slice(0, 8)}")` 
      : 'Not Detected';
    const keyDebug = supabaseAnonKey 
      ? `Detected (Length: ${supabaseAnonKey.length}, Starts with: "${supabaseAnonKey.slice(0, 8)}...")` 
      : 'Not Detected';

    return new NextResponse(
      `<html>
        <head>
          <title>Admin Panel Locked</title>
          <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Quicksand', sans-serif; background-color: #F1F1E6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box;">
          <div style="background: #ffffff; border: 2px solid #BCBCA7; padding: 40px; border-radius: 20px; box-shadow: -8px 8px 0px #BCBCA7; max-width: 520px; width: 100%; text-align: center; box-sizing: border-box;">
            <img src="https://onlinespeechie.com/wp-content/uploads/2024/03/os-logo-new.png" alt="Logo" style="height: 40px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 16px 0; font-size: 1.8rem; font-weight: 700; color: #333333;">Admin Panel Locked</h2>
            <p style="color: #666666; margin: 0 0 24px 0; line-height: 1.6; font-size: 1rem; font-weight: 500;">
              This administrative panel is locked because the required Supabase environment variables (<code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) are not configured on the live server.
            </p>

            <div style="background: #fef3c7; border: 2px solid #d97706; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 0.9rem; color: #78350f;">
              <strong style="display: block; margin-bottom: 8px;">Environment Variables Status (Debug):</strong>
              <div style="margin-bottom: 6px;">
                <span style="font-weight: 600;">NEXT_PUBLIC_SUPABASE_URL:</span> 
                <span style="font-family: monospace; background: rgba(255,255,255,0.5); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">${urlDebug}</span>
              </div>
              <div>
                <span style="font-weight: 600;">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span> 
                <span style="font-family: monospace; background: rgba(255,255,255,0.5); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">${keyDebug}</span>
              </div>
            </div>

            <div style="background: #fafaf5; border: 2px solid #BCBCA7; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 0.9rem; line-height: 1.5; color: #333333;">
              <strong>Required Steps:</strong>
              <ol style="margin: 8px 0 0 20px; padding: 0;">
                <li>Open your hosting provider's dashboard (e.g., Vercel).</li>
                <li>Go to your project's Environment Variables settings.</li>
                <li>Add the variables with their correct values from the Supabase settings.</li>
                <li>Redeploy or restart the server.</li>
              </ol>
            </div>
            <p style="font-size: 0.85rem; color: #888888; margin: 0; font-weight: 500;">Please configure these variables to unlock this page.</p>
          </div>
        </body>
      </html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
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
