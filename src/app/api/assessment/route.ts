import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { childDoB } = body;

    if (!childDoB) {
      return NextResponse.json({ error: 'Missing Date of Birth' }, { status: 400 });
    }

    // Precise age calculation in months (day-of-month anniversary)
    const now = new Date();
    const dob = new Date(childDoB);
    
    let ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) {
      ageMonths--;
    }

    if (ageMonths < 15 || ageMonths > 44) {
      return NextResponse.json({ 
        error: 'Oops! The Online Speechie Screener is only for children aged 15 to 44 months (1 year 3 months to 3 years 8 months)',
        outOfRange: true,
        calculated_age_months: ageMonths
      }, { status: 400 });
    }

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

    // Fetch the ICS Sequence
    const icsSequence = await prisma.questionSequence.findUnique({
      where: { id: 'ICS_SEQUENCE' },
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

    return NextResponse.json({
      ageMonths,
      sequence,
      icsSequence
    });

  } catch (error) {
    console.error('API /assessment Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
