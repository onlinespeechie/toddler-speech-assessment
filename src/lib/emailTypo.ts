import spell, { POPULAR_DOMAINS, POPULAR_TLDS } from '@zootools/email-spell-checker';

// Client-safe: no Node imports. Suggests a corrected address; never blocks.
const DOMAINS = [
  ...POPULAR_DOMAINS,
  'gmail.com', 'hotmail.com', 'outlook.com', 'outlook.com.au', 'live.com.au',
  'icloud.com', 'yahoo.com', 'yahoo.com.au', 'bigpond.com', 'optusnet.com.au',
];
const TLDS = [...new Set([...POPULAR_TLDS, 'com.au', 'edu.au', 'gov.au', 'net.au'])];
// Library guesses outlook.co for outlook.ck, so pin the known wrong endings.
const FIXED: Record<string, string> = { 'outlook.ck': 'outlook.com', 'gmail.com.au': 'gmail.com' };

export function normaliseEmail(raw: string): string {
  const t = raw.trim();
  const at = t.lastIndexOf('@');
  return at < 0 ? t : t.slice(0, at + 1) + t.slice(at + 1).toLowerCase();
}

export function suggestEmail(email: string): string | null {
  const e = normaliseEmail(email);
  const domain = e.split('@')[1];
  if (domain && FIXED[domain]) return `${e.split('@')[0]}@${FIXED[domain]}`;
  const s = spell.run({ email: e, domains: DOMAINS, topLevelDomains: TLDS });
  return s ? s.full : null;
}
