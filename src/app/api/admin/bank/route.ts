import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Ensure at least one Tag Question exists
    const tagQCount = await prisma.question.count({ where: { isTagQuestion: true } });
    if (tagQCount === 0) {
      await prisma.question.create({
        data: {
          text: "What is your primary concern regarding your child's communication?",
          isTagQuestion: true,
          options: {
            create: [
              { text: 'Speech Sounds / Clarity', weight: 0, tagValue: 'Speech Sounds' },
              { text: 'Understanding Instructions', weight: 0, tagValue: 'Receptive Language' },
              { text: 'Talking / Using Words', weight: 0, tagValue: 'Expressive Language' },
              { text: 'Social Interactions', weight: 0, tagValue: 'Pragmatic Language' }
            ]
          }
        }
      });
    }

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
