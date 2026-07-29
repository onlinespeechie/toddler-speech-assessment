import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Verify administrative session (bypass in local development)
    if (process.env.NODE_ENV !== 'development') {
      const supabase = await createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2. Parse query parameters for date filtering
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');

    // Default to last 7 days if no range is specified
    const startDate = startStr ? new Date(startStr) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = endStr ? new Date(endStr) : new Date();

    // Ensure the end date covers the entire day if it doesn't contain time (ISO formats)
    if (endStr && !endStr.includes('T')) {
      endDate.setHours(23, 59, 59, 999);
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // 3. Query all QuizSessions in the date range using Prisma
    const sessions = await prisma.quizSession.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        completedAt: true,
        currentStep: true,
        sequenceLength: true
      }
    });

    // 4. Initialize and calculate funnel steps
    const funnelSteps = [
      { name: 'Arrived at Quiz', count: 0 },
      { name: 'Submitted DOB', count: 0 },
      { name: 'Answered Question 1', count: 0 },
      { name: 'Answered Question 2', count: 0 },
      { name: 'Answered Question 3', count: 0 },
      { name: 'Answered Question 4', count: 0 },
      { name: 'Answered Question 5', count: 0 },
      { name: 'Answered Question 6', count: 0 },
      { name: 'Answered Question 7', count: 0 },
      { name: 'Answered Question 8', count: 0 },
      { name: 'Answered Question 9', count: 0 },
      { name: 'Answered Question 10', count: 0 },
      { name: 'Answered Question 11', count: 0 },
      { name: 'Answered Question 12', count: 0 },
      { name: 'Reached Contact Details', count: 0 },
      { name: 'Submitted Email & Name', count: 0 },
    ];

    interface DbQuizSession {
      createdAt: string;
      completedAt: string | null;
      currentStep: number;
      sequenceLength: number | null;
    }

    let totalDurationMs = 0;
    let validSessionsCount = 0;
    const outlierLimitMs = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (sessions) {
      (sessions as unknown as DbQuizSession[]).forEach(session => {
        const isCompleted = session.completedAt !== null;
        const currentStep = session.currentStep || 0;
        const seqLength = session.sequenceLength || 11; // default fallback

        // Step 0: Arrived at Quiz
        funnelSteps[0].count++;

        // Step 1: Submitted DOB
        if (currentStep >= 1 || isCompleted) {
          funnelSteps[1].count++;
        }

        // Steps 2-13: Questions 1-12
        for (let q = 1; q <= 12; q++) {
          const stepNum = q + 1;
          if (isCompleted || currentStep >= stepNum || currentStep >= seqLength + 1) {
            funnelSteps[stepNum].count++;
          }
        }

        // Step 14: Reached Contact Details
        if (currentStep >= seqLength + 1 || isCompleted) {
          funnelSteps[14].count++;
        }

        // Step 15: Submitted Email & Name
        if (isCompleted) {
          funnelSteps[15].count++;

          // Average completion time calculation
          const start = new Date(session.createdAt);
          const end = new Date(session.completedAt!);
          const diffMs = end.getTime() - start.getTime();
          if (diffMs > 0 && diffMs <= outlierLimitMs) {
            totalDurationMs += diffMs;
            validSessionsCount++;
          }
        }
      });
    }

    const startsCount = funnelSteps[1].count;
    const completionsCount = funnelSteps[15].count;

    const avgCompletionTimeSec = validSessionsCount > 0
      ? Math.round(totalDurationMs / validSessionsCount / 1000)
      : 0;

    const rawRate = startsCount > 0 ? (completionsCount / startsCount) * 100 : 0;
    const completionRate = Math.min(rawRate, 100);

    const totalArrived = funnelSteps[0].count;
    const funnel = funnelSteps.map(step => ({
      ...step,
      percentage: totalArrived > 0 ? parseFloat(((step.count / totalArrived) * 100).toFixed(1)) : 0
    }));

    return NextResponse.json({
      starts: startsCount,
      completions: completionsCount,
      completionRate: parseFloat(completionRate.toFixed(1)),
      avgCompletionTimeSeconds: avgCompletionTimeSec,
      period: {
        startDate: startDateStr,
        endDate: endDateStr
      },
      funnel
    });

  } catch (error: unknown) {
    console.error('API /api/admin/analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
