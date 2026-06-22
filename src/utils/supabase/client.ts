import { createBrowserClient } from '@supabase/ssr';

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

export function createClient() {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const isUrlValid = url && (url.startsWith('http://') || url.startsWith('https://'));

  if (!isUrlValid || !anonKey || anonKey === 'undefined' || anonKey === 'your_anon_key_here') {
    // Return a dummy client during build-time prerendering or if config is invalid
    return {} as any;
  }

  return createBrowserClient(url, anonKey);
}



