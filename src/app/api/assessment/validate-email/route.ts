import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { checkEmail } from '@/lib/emailCheck';

// Used for the on-blur check in the quiz form. The submit route runs the same check again.
export async function POST(req: Request) {
  if (!rateLimit(`validate-email:${getClientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ ok: true }); // fail open
  }
  try {
    const { email } = await req.json();
    return NextResponse.json(await checkEmail(String(email ?? '')));
  } catch {
    return NextResponse.json({ ok: true });
  }
}
