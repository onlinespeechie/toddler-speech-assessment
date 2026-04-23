import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sequences = await prisma.questionSequence.findMany({
      orderBy: { minMonths: 'asc' },
      include: {
        placements: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                options: {
                  orderBy: { weight: 'desc' }
                }
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(sequences);
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
