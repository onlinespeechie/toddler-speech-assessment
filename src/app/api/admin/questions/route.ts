import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, options, videoUrl, internalCode, category } = body;

    if (!text || !Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or options' }, { status: 400 });
    }

    const newQuestion = await prisma.question.create({
      data: {
        text,
        internalCode: internalCode || null,
        category: category || null,
        videoUrl: videoUrl || null,
        options: {
          create: options.map((opt: any) => ({
            text: opt.text,
            weight: Number(opt.weight) || 0
          }))
        }
      },
      include: {
        options: true,
      }
    });

    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
