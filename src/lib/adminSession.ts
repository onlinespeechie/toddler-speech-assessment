// Admin logins expire after 7 days (agreed with Saffira): after that the admin must sign in again with the
// password and a 2FA code. Based on the time of the last password sign-in, which token refreshes don't change.
export const MAX_LOGIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Fails closed: a missing or unreadable sign-in time counts as expired.
export function isLoginTooOld(lastSignInAt: string | null | undefined, now: number = Date.now()): boolean {
  const signedInAt = lastSignInAt ? Date.parse(lastSignInAt) : NaN;
  if (Number.isNaN(signedInAt)) return true;
  return now - signedInAt > MAX_LOGIN_AGE_MS;
}
