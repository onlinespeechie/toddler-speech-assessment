import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { orderedIds } = body; // These are placement IDs now!

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Execute sequential updates in a transaction
    const updatePromises = orderedIds.map((id: string, index: number) => {
      return prisma.sequencePlacement.update({
        where: { id },
        data: { order: index }
      });
    });

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
