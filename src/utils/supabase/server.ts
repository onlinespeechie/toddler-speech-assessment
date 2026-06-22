import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

export async function createClient() {
  const cookieStore = await cookies();
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const isUrlValid = url && (url.startsWith('http://') || url.startsWith('https://'));

  if (!isUrlValid || !anonKey || anonKey === 'undefined' || anonKey === 'your_anon_key_here') {
    // Return a dummy client during build-time prerendering or if config is invalid
    return {} as any;
  }



  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method can be called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

