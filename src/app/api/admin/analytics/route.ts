import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify administrative session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // 3. Query Quiz Starts: Total sessions created in date range
    const { count: startsCount, error: startsError } = await supabase
      .from('QuizSession')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', startDateStr)
      .lte('createdAt', endDateStr);

    if (startsError) {
      console.error('Supabase query error (starts):', startsError);
      return NextResponse.json({ error: startsError.message }, { status: 500 });
    }

    // 4. Query Quiz Completions: Total sessions completed in date range
    const { count: completionsCount, error: completionsError } = await supabase
      .from('QuizSession')
      .select('*', { count: 'exact', head: true })
      .not('completedAt', 'is', null)
      .gte('completedAt', startDateStr)
      .lte('completedAt', endDateStr);

    if (completionsError) {
      console.error('Supabase query error (completions):', completionsError);
      return NextResponse.json({ error: completionsError.message }, { status: 500 });
    }

    // 5. Query sessions for average duration calculation
    // We only select completedAt and createdAt to optimize data transfer size
    const { data: durationData, error: durationError } = await supabase
      .from('QuizSession')
      .select('createdAt, completedAt')
      .not('completedAt', 'is', null)
      .gte('completedAt', startDateStr)
      .lte('completedAt', endDateStr);

    if (durationError) {
      console.error('Supabase query error (durations):', durationError);
      return NextResponse.json({ error: durationError.message }, { status: 500 });
    }

    // 6. Calculate Average Completion Time (filtering out outliers > 30 minutes)
    let totalDurationMs = 0;
    let validSessionsCount = 0;
    const outlierLimitMs = 30 * 60 * 1000; // 30 minutes in milliseconds

    interface QuizSessionDuration {
      createdAt: string;
      completedAt: string | null;
    }

    if (durationData) {
      (durationData as unknown as QuizSessionDuration[]).forEach((session) => {
        if (!session.completedAt) return;
        const start = new Date(session.createdAt);
        const end = new Date(session.completedAt);
        const diffMs = end.getTime() - start.getTime();

        // Count as valid if difference is positive and does not exceed 30 minutes
        if (diffMs > 0 && diffMs <= outlierLimitMs) {
          totalDurationMs += diffMs;
          validSessionsCount++;
        }
      });
    }

    const avgCompletionTimeSec = validSessionsCount > 0
      ? Math.round(totalDurationMs / validSessionsCount / 1000)
      : 0;

    // Calculate Completion Rate: (Completions / Starts) * 100, capped at 100%
    const rawRate = startsCount && startsCount > 0 ? (completionsCount || 0) / startsCount * 100 : 0;
    const completionRate = Math.min(rawRate, 100);

    return NextResponse.json({
      starts: startsCount || 0,
      completions: completionsCount || 0,
      completionRate: parseFloat(completionRate.toFixed(1)),
      avgCompletionTimeSeconds: avgCompletionTimeSec,
      period: {
        startDate: startDateStr,
        endDate: endDateStr
      }
    });

  } catch (error: unknown) {
    console.error('API /api/admin/analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
