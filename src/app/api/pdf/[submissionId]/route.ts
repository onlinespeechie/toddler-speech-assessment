import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToStream } from '@react-pdf/renderer';
import { ReportDocument } from '@/lib/pdfReport';
import React from 'react';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
    }

    const submissionData = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { contact: true }
    });

    if (!submissionData) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // @ts-ignore - The types for renderToStream can be tricky with React 19 but functionally it streams buffers perfectly
    const stream = await renderToStream(React.createElement(ReportDocument, { data: submissionData }));
    
    // Convert Node Readable stream to Web ReadableStream for Next.js App Router
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      }
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Speechie-Report-${submissionId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
