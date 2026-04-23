import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { childDoB } = body;

    if (!childDoB) {
      return NextResponse.json({ error: 'Missing Date of Birth' }, { status: 400 });
    }

    // Calculate age in months roughly
    const now = new Date();
    const dob = new Date(childDoB);
    let ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) {
      ageMonths--;
    }

    if (ageMonths < 0) ageMonths = 0;

    // Fetch the appropriate QuestionSequence
    const sequence = await prisma.questionSequence.findFirst({
      where: {
        minMonths: { lte: ageMonths },
        maxMonths: { gte: ageMonths },
      },
      include: {
        placements: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: { options: true }
            }
          }
        }
      }
    });

    if (!sequence) {
      return NextResponse.json({ 
        error: 'No question sequence found for the given age bracket',
        ageMonths 
      }, { status: 404 });
    }

    const tagQuestion = await prisma.question.findFirst({
      where: { isTagQuestion: true },
      include: { options: true }
    });

    return NextResponse.json({
      ageMonths,
      sequence,
      tagQuestion
    });

  } catch (error) {
    console.error('API /assessment Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
