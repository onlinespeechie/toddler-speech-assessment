import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Tag Question logic removed. ICS section will be handled separately.

    const questions = await prisma.question.findMany({
      orderBy: { id: 'desc' },
      include: {
        options: {
          orderBy: { id: 'asc' }
        },
        placements: true // Just so we know how many places it is used
      }
    });
    
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
