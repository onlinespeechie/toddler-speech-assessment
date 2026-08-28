import crypto from 'crypto';

const PDF_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function sign(submissionId: string, exp: number, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${submissionId}.${exp}`).digest('hex');
}

// Returns null if PDF_LINK_SECRET isn't configured, so the caller can fall back gracefully
// instead of minting a link that will always fail verification.
export function signPdfUrl(submissionId: string): { exp: number; sig: string } | null {
  const secret = process.env.PDF_LINK_SECRET;
  if (!secret) return null;
  const exp = Date.now() + PDF_LINK_TTL_MS;
  return { exp, sig: sign(submissionId, exp, secret) };
}

// ponytail: fails OPEN (allows the request) when PDF_LINK_SECRET isn't set, matching this
// route's previous unauthenticated behavior, so it doesn't break in prod before the secret is
// configured. Set PDF_LINK_SECRET in Vercel to actually enforce the expiring-link check.
export function verifyPdfToken(submissionId: string, expParam: string | null, sigParam: string | null): boolean {
  const secret = process.env.PDF_LINK_SECRET;
  if (!secret) {
    console.warn('⚠️ [PDF Link] PDF_LINK_SECRET is not set — serving without link verification');
    return true;
  }
  if (!expParam || !sigParam) return false;

  const exp = Number(expParam);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const expected = sign(submissionId, exp, secret);
  const expectedBuf = Buffer.from(expected);
  const givenBuf = Buffer.from(sigParam);
  if (expectedBuf.length !== givenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}
