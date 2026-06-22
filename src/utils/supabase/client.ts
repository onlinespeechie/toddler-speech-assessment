import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isUrlValid = url && (url.startsWith('http://') || url.startsWith('https://'));

  if (!isUrlValid || !anonKey || anonKey === 'undefined' || anonKey === 'your_anon_key_here') {
    // Return a dummy client during build-time prerendering or if config is invalid
    return {} as any;
  }

  return createBrowserClient(url, anonKey);
}


