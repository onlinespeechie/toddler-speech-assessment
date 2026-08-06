import { NextResponse } from 'next/server';
import crypto from 'crypto';

function hashData(value?: string) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { leadId, email, phone, clientIp, userAgent, testEventCode } = await request.json();
    const PIXEL_ID = '320483099619378';
    const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
    const activeTestCode = testEventCode || process.env.META_TEST_EVENT_CODE;

    if (!ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Missing CAPI Token' }, { status: 500 });
    }

    const payload: Record<string, any> = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          event_id: String(leadId), // Same ID used on client for deduplication
          action_source: 'website',
          user_data: {
            em: email ? [hashData(email)] : undefined,
            ph: phone ? [hashData(phone)] : undefined,
            client_ip_address: clientIp || undefined,
            client_user_agent: userAgent || undefined,
          },
        },
      ],
    };

    if (activeTestCode) {
      payload.test_event_code = activeTestCode;
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    return NextResponse.json({ success: true, metaResponse: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send CAPI event' }, { status: 500 });
  }
}
