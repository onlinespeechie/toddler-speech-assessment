import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await prisma.quizSession.create({
      data: {
        currentStep: 0,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('API /assessment/session POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, currentStep } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    if (typeof currentStep !== 'number') {
      return NextResponse.json({ error: 'currentStep must be a number' }, { status: 400 });
    }

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        currentStep,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('API /assessment/session PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
