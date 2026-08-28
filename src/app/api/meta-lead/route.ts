import { NextResponse } from 'next/server';
import crypto from 'crypto';

function hashData(value?: string) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { 
      leadId, 
      email, 
      phone, 
      clientIp: bodyClientIp, 
      userAgent: bodyUserAgent, 
      testEventCode,
      eventName,
      customData,
      custom_data
    } = body;
    const PIXEL_ID = '320483099619378';
    const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
    const activeTestCode = testEventCode || process.env.META_TEST_EVENT_CODE;

    const clientIp = bodyClientIp || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
    const userAgent = bodyUserAgent || request.headers.get('user-agent') || undefined;
    const targetEventName = eventName || body.event_name || 'Lead';
    const targetCustomData = customData || custom_data || undefined;

    if (!ACCESS_TOKEN) {
      console.warn('⚠️ [Meta CAPI Warning] META_CAPI_ACCESS_TOKEN is missing in environment variables');
      return NextResponse.json({ 
        error: 'Missing META_CAPI_ACCESS_TOKEN in environment variables', 
        eventId: leadId 
      }, { status: 400 });
    }

    const eventItem: Record<string, any> = {
      event_name: targetEventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: String(leadId || 'completed'), // Same ID used on client for deduplication
      action_source: 'website',
      user_data: {
        em: email ? [hashData(email)] : undefined,
        ph: phone ? [hashData(phone)] : undefined,
        client_ip_address: clientIp,
        client_user_agent: userAgent,
      },
    };

    if (targetCustomData) {
      eventItem.custom_data = targetCustomData;
    }

    const payload: Record<string, any> = {
      data: [eventItem],
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

    if (!res.ok) {
      console.error('❌ [Meta CAPI Error Response]:', data);
      return NextResponse.json({ 
        error: 'Meta Graph API returned an error', 
        eventId: leadId, 
        metaResponse: data 
      }, { status: res.status });
    }

    console.log(`✅ [Meta CAPI Success] Event sent for leadId: ${leadId}`, data);
    return NextResponse.json({ success: true, eventId: leadId, metaResponse: data });
  } catch (error: any) {
    console.error('❌ [Meta CAPI Server Exception]:', error);
    return NextResponse.json({ 
      error: 'Failed to send CAPI event', 
      message: error?.message || String(error) 
    }, { status: 500 });
  }
}
