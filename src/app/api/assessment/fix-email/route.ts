import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { verifyPdfToken } from '@/lib/pdfToken';
import { checkEmail } from '@/lib/emailCheck';
import { normaliseEmail } from '@/lib/emailTypo';

// "Wrong address? Fix it here": move the SAME Kit subscriber to the corrected email, then re-run the
// first-time results path. Kit automations are tag-driven: the "Trigger > X > Start" tag starts them,
// but anyone holding "Activity > Language Check-In > submitted" is sent to "Thanks for coming back"
// instead of their results, so that tag must be removed before the trigger tag is re-added.
const LANGUAGE_CHECKIN_TAG = 4522243;
const TRIGGER_TAGS: Record<string, number> = { 'Delayed': 3672935, 'At Risk': 3672943, 'On Track': 3672966 };
const KIT = 'https://api.convertkit.com/v3';

async function kit(method: string, path: string, body?: Record<string, unknown>, query = '') {
  const secret = process.env.CONVERTKIT_API_SECRET;
  const res = await fetch(`${KIT}${path}?api_secret=${secret}${query}`, {
    method,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: body ? JSON.stringify({ api_secret: secret, ...body }) : undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, json: (() => { try { return JSON.parse(text); } catch { return null; } })() };
}

export async function POST(req: Request) {
  // Needs the signed link secret so only the browser that just submitted can change the address.
  if (!process.env.PDF_LINK_SECRET || !process.env.CONVERTKIT_API_SECRET) {
    return NextResponse.json({ error: 'Not available right now.' }, { status: 503 });
  }
  if (!rateLimit(`fix-email:${getClientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  try {
    const { submissionId, exp, sig, newEmail: rawNew } = await req.json();
    if (!submissionId || !verifyPdfToken(String(submissionId), String(exp ?? ''), String(sig ?? ''))) {
      return NextResponse.json({ error: 'Link expired. Please contact us.' }, { status: 403 });
    }
    if (!rateLimit(`fix-email-sub:${submissionId}`, 3, 24 * 60 * 60_000)) {
      return NextResponse.json({ error: 'Too many changes. Please contact us.' }, { status: 429 });
    }
    const newEmail = normaliseEmail(String(rawNew ?? ''));
    const check = await checkEmail(newEmail);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: 400 });

    const submission = await prisma.submission.findUnique({ where: { id: String(submissionId) } });
    if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const oldEmail = submission.parentEmail;
    if (oldEmail === newEmail) return NextResponse.json({ success: true, unchanged: true });

    const label = `submission ${submission.id}`;
    // 1. find the existing subscriber by the old address
    const found = await kit('GET', '/subscribers', undefined, `&email_address=${encodeURIComponent(oldEmail)}`);
    const subscriberId = found.json?.subscribers?.[0]?.id as number | undefined;
    if (!found.ok || !subscriberId) {
      console.error(`email fix: Kit subscriber lookup failed for ${label}, status ${found.status}`);
      return NextResponse.json({ error: "We couldn't update that just now. Please contact us." }, { status: 502 });
    }
    // 2. change the email on that same subscriber (no duplicate, no second form subscribe)
    const upd = await kit('PUT', `/subscribers/${subscriberId}`, { email_address: newEmail });
    if (!upd.ok) {
      console.error(`email fix: Kit update failed for ${label}, status ${upd.status}: ${upd.text.slice(0, 200)}`);
      return NextResponse.json({ error: "We couldn't update that just now. Please contact us." }, { status: 502 });
    }
    await prisma.submission.update({ where: { id: submission.id }, data: { parentEmail: newEmail } });

    // 3. clear the repeat-taker tag, then re-add the trigger tag so the first-time results path runs
    const rm = await kit('DELETE', `/subscribers/${subscriberId}/tags/${LANGUAGE_CHECKIN_TAG}`);
    const triggerTag = TRIGGER_TAGS[submission.scoreStatus];
    const add = triggerTag
      ? await kit('POST', `/tags/${triggerTag}/subscribe`, { email: newEmail })
      : { ok: false, status: 0, text: 'no trigger tag for status' };
    console.log(JSON.stringify({ event: 'email_fix', submissionId: submission.id, tagRemoved: rm.ok, triggerAdded: add.ok }));
    if (!add.ok) console.error(`email fix: trigger tag failed for ${label}, status ${add.status}: ${add.text.slice(0, 200)}`);

    return NextResponse.json({ success: true, resent: add.ok });
  } catch (err) {
    console.error('API /assessment/fix-email Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
