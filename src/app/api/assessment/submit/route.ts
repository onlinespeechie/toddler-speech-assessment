import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parentName, parentEmail, childDoB, totalScore, finalTag } = body;

    if (!parentName || !parentEmail || !childDoB || typeof totalScore !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Tag logic (Old score-based generic fallback, but we now save finalTag explicitly too)
    let tag = 'Review Recommended';
    if (totalScore >= 20) {
      tag = 'Advanced Development';
    } else if (totalScore > 10) {
      tag = 'On Track';
    }

    // Create Contact and Submission in one go
    const contact = await prisma.contact.create({
      data: {
        parentName,
        parentEmail,
        childDoB: new Date(childDoB),
        submissions: {
          create: {
            totalScore,
            tag,
            finalTag: finalTag || null,
          }
        }
      },
      include: {
        submissions: true,
      }
    });

    return NextResponse.json({
      success: true,
      submission: contact.submissions[0],
    });

  } catch (error) {
    console.error('API /assessment/submit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
