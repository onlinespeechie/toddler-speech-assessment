import { promises as dns } from 'dns';
import disposable from 'disposable-email-domains';
import { normaliseEmail } from './emailTypo';

// Server-only. Blocks: bad format, disposable/junk domains, domains that cannot receive mail.
// Fails open: a DNS error or timeout never blocks a parent.
export type EmailCheck = { ok: true } | { ok: false; reason: 'format' | 'disposable' | 'junk' | 'no_mx'; message: string };

const DISPOSABLE = new Set<string>(disposable);
// Real domains that parents don't use: they have working mail servers, so DNS can't catch them.
const JUNK_DOMAINS = new Set(['meow.com', 'no.com', 'az.com', 'example.com', 'example.org', 'example.net']);
const JUNK_ADDRESSES = new Set(['hello@gmail.com']);

const DNS_TIMEOUT_MS = 2500;
// ponytail: per-instance cache, resets on cold start; fine at quiz volume.
const mxCache = new Map<string, { value: boolean; at: number }>();
const CACHE_MS = 60 * 60_000;

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('dns timeout')), DNS_TIMEOUT_MS))]);
}

// true = can receive mail, or we couldn't tell (fail open)
async function domainCanReceiveMail(domain: string): Promise<boolean> {
  const hit = mxCache.get(domain);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  let value = true;
  try {
    const mx = await withTimeout(dns.resolveMx(domain));
    // null MX ("0 .") means the domain explicitly accepts no mail
    value = mx.some((r) => r.exchange && r.exchange !== '.');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENODATA' || code === 'ENOTFOUND') {
      // no MX: mail falls back to the A/AAAA record
      try {
        const a = await withTimeout(dns.resolve4(domain));
        value = a.length > 0;
      } catch (e2) {
        const c2 = (e2 as NodeJS.ErrnoException).code;
        value = !(c2 === 'ENODATA' || c2 === 'ENOTFOUND');
      }
    } // any other error or timeout: stay true
  }
  mxCache.set(domain, { value, at: Date.now() });
  return value;
}

export async function checkEmail(raw: string): Promise<EmailCheck> {
  const email = normaliseEmail(raw);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, reason: 'format', message: 'Please enter a valid email address.' };
  }
  const domain = email.split('@')[1];
  if (JUNK_ADDRESSES.has(email) || JUNK_DOMAINS.has(domain)) {
    console.log(JSON.stringify({ event: 'email_junk_blocked', domain }));
    return { ok: false, reason: 'junk', message: 'Please use your own email address so we can send your results.' };
  }
  if (DISPOSABLE.has(domain)) {
    console.log(JSON.stringify({ event: 'email_disposable_blocked', domain }));
    return { ok: false, reason: 'disposable', message: "Please use a permanent email address so we can send your results." };
  }
  if (!(await domainCanReceiveMail(domain))) {
    console.log(JSON.stringify({ event: 'email_mx_failed', domain }));
    return { ok: false, reason: 'no_mx', message: "That email address can't receive email. Please check it." };
  }
  return { ok: true };
}
