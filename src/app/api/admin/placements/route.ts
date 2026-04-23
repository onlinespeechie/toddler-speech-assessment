import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sequenceId, questionId } = body;

    if (!sequenceId || !questionId) {
      return NextResponse.json({ error: 'Missing Sequence ID or Question ID' }, { status: 400 });
    }

    const existing = await prisma.sequencePlacement.findUnique({
      where: {
        sequenceId_questionId: { sequenceId, questionId }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Question is already assigned to this sequence.' }, { status: 400 });
    }

    // Determine current max order for this sequence
    const maxPlacement = await prisma.sequencePlacement.findFirst({
      where: { sequenceId },
      orderBy: { order: 'desc' }
    });
    
    const newOrder = maxPlacement ? maxPlacement.order + 1 : 0;

    const placement = await prisma.sequencePlacement.create({
      data: {
        sequenceId,
        questionId,
        order: newOrder
      }
    });

    return NextResponse.json(placement);
  } catch (error: any) {
    console.error('Placement create error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
