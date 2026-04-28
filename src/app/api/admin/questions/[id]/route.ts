import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    
    // Check if it's a text update
    const { text, options, videoUrl, internalCode, category } = body;

    if (!text || !Array.isArray(options)) {
      return NextResponse.json({ error: 'Missing full payload' }, { status: 400 });
    }

    // Using transaction
    const [deletedOptions, updatedQuestion] = await prisma.$transaction([
      prisma.option.deleteMany({ where: { questionId: id } }),
      prisma.question.update({
        where: { id },
        data: {
          text,
          internalCode: internalCode || null,
          category: category || null,
          videoUrl: videoUrl !== undefined ? videoUrl : undefined,
          options: {
            create: options.map((opt: any) => ({
              text: opt.text || '',
              weight: Number(opt.weight) || 0,
              tagValue: opt.tagValue || null
            }))
          }
        },
        include: { options: true }
      })
    ]);
    
    return NextResponse.json(updatedQuestion);

  } catch (error: any) {
    console.error('Admin update error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.question.deleteMany({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
