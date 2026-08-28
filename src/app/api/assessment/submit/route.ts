import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  if (!rateLimit(`submit:${getClientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const { parentName, parentEmail, childFirstName, childDoB, totalScore, finalTag, answers, sessionId } = body;

    if (!parentName || !parentEmail || !childDoB) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Precise age calculation in months and days
    const now = new Date();
    const dob = new Date(childDoB);
    
    let ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + now.getMonth() - dob.getMonth();
    let ageDays = now.getDate() - dob.getDate();
    
    if (ageDays < 0) {
      ageMonths--;
      // get days in the previous month
      const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      ageDays += daysInPrevMonth;
    }
    
    const recommendations: string[] = [];
    const expressiveCodes = ['Q37', 'Q40', 'Q41', 'Q42', 'Q44', 'Q45', 'Q46', 'Q47', 'Q48', 'Q49', 'Q50', 'Q51', 'Q52', 'Q53', 'Q55', 'Q56', 'Q58', 'Q60', 'Q62', 'Q64'];
    const comprehensionCodes = ['Q38', 'Q39', 'Q43', 'Q54', 'Q57', 'Q59', 'Q61', 'Q63'];

    interface QuizAnswer {
      questionId: string;
      questionText: string;
      questionCode: string | null;
      weight: number;
      text: string;
    }

    function getCategory(code: string | null) {
      if (!code) return null;
      if (expressiveCodes.includes(code)) return 'Expressive';
      if (comprehensionCodes.includes(code)) return 'Comprehension';
      return null;
    }

    // 1. Scoring Thresholds (Output 1)
    let output1 = 'On Track';
    const score = typeof totalScore === 'number' ? totalScore : 0;
    
    const inRange = (minM: number, minD: number, maxM: number, maxD: number) => {
      if (ageMonths < minM || ageMonths > maxM) return false;
      if (ageMonths === minM && ageDays < minD) return false;
      if (ageMonths === maxM && ageDays > maxD) return false;
      return true;
    };

    if (inRange(15, 0, 16, 31)) {
      if (score <= 20) output1 = 'Delayed'; else if (score <= 30) output1 = 'At Risk';
    } else if (inRange(17, 0, 18, 31)) {
      if (score <= 15) output1 = 'Delayed'; else if (score <= 30) output1 = 'At Risk';
    } else if (inRange(19, 0, 20, 31)) {
      if (score <= 20) output1 = 'Delayed'; else if (score <= 35) output1 = 'At Risk';
    } else if (inRange(21, 0, 22, 31)) {
      if (score <= 15) output1 = 'Delayed'; else if (score <= 30) output1 = 'At Risk';
    } else if (inRange(23, 0, 25, 15)) {
      if (score <= 25) output1 = 'Delayed'; else if (score <= 40) output1 = 'At Risk';
    } else if (inRange(25, 16, 28, 15)) {
      if (score <= 25) output1 = 'Delayed'; else if (score <= 40) output1 = 'At Risk';
    } else if (inRange(28, 16, 31, 15)) {
      if (score <= 30) output1 = 'Delayed'; else if (score <= 44) output1 = 'At Risk';
    } else if (inRange(31, 16, 34, 15)) {
      if (score <= 25) output1 = 'Delayed'; else if (score <= 35) output1 = 'At Risk';
    } else if (inRange(34, 16, 38, 31)) {
      if (score <= 30) output1 = 'Delayed'; else if (score <= 44) output1 = 'At Risk';
    } else if (inRange(39, 0, 44, 31)) {
      if (score <= 25) output1 = 'Delayed'; else if (score <= 35) output1 = 'At Risk';
    }

    let answersToSave: { questionId: string; questionText: string; value: string }[] = [];
    let commStage = "ENGAGER";
    let speechClarityConcern = false;

    const userAnswers = (answers || []) as QuizAnswer[];

    if (answers && Array.isArray(answers)) {
      let expressiveTotal = 0;
      let comprehensionTotal = 0;

      answersToSave = userAnswers.map((a: QuizAnswer) => {
        const cat = getCategory(a.questionCode);
        if (cat === 'Expressive') expressiveTotal += (a.weight || 0);
        if (cat === 'Comprehension') comprehensionTotal += (a.weight || 0);
        return {
          questionId: a.questionId || 'Unknown',
          questionText: a.questionText || 'Unknown',
          value: a.text || 'Unknown'
        };
      });

      if (expressiveTotal > 0 || comprehensionTotal > 0) {
        recommendations.push(`Sub-totals - Expressive: ${expressiveTotal}, Comprehension: ${comprehensionTotal}`);
      }

      // 2. Speech Clarity (Output 2)
      const icsAnswers = userAnswers.filter((a: QuizAnswer) => a.questionCode?.startsWith('ICS'));
      if (icsAnswers.length > 0) {
        const icsSum = icsAnswers.reduce((sum: number, a: QuizAnswer) => sum + (a.weight || 0), 0);
        const icsAvg = icsSum / icsAnswers.length; // Use actual length instead of hardcoded 7
        
        const ics3 = icsAnswers.find((a: QuizAnswer) => a.questionCode === 'ICS-3');
        const ics3Score = ics3 ? (ics3.weight || 0) : 5; // Default to 'Always' if missing

        if (icsAvg <= 4.0 || ics3Score <= 3) {
          recommendations.push("SPEECH CLARITY CONCERN");
          speechClarityConcern = true;
        }
      }

      // 3. Early Concern Flag (Q38, Q39, Q40)
      const q38 = userAnswers.find((a: QuizAnswer) => a.questionCode === 'Q38');
      const q39 = userAnswers.find((a: QuizAnswer) => a.questionCode === 'Q39');
      const q40 = userAnswers.find((a: QuizAnswer) => a.questionCode === 'Q40');

      const isRarelyAnswer = (ans: QuizAnswer | undefined) => ans && (ans.text?.includes('Rarely') || ans.text?.includes('Not Yet') || ans.weight === 0);

      if (isRarelyAnswer(q38) && isRarelyAnswer(q39) && isRarelyAnswer(q40)) {
        recommendations.push("EARLY COMMUNICATION CONCERN");
      }

      // 4. Comm Stage Waterfall (Output 3)
      commStage = "ENGAGER"; // Default fallback
      const hasVal = (code: string, values: string[]) => {
        const found = userAnswers.find((a: QuizAnswer) => a.questionCode && a.questionCode.split('_')[0] === code);
        if (!found) return false;
        return values.some(v => found.text && found.text.toLowerCase().replace(/\s+/g, '') === v.toLowerCase().replace(/\s+/g, ''));
      };

      const isAlwaysMostly = (code: string) => hasVal(code, ['Always/Mostly', 'Always / Mostly', 'Always', 'Mostly']);
      const isSometimes = (code: string) => hasVal(code, ['Sometimes', 'sometimes']);
      const isAlwaysMostlyOrNormally = (code: string) => isAlwaysMostly(code) || isSometimes(code);
      const isYes = (code: string) => hasVal(code, ['Yes', 'yes']);

      // 1. CONVERSATIONALIST
      if (
        isAlwaysMostly('Q56') || // 3-4 word sentences
        isAlwaysMostly('Q64') || // grammatically correct sentences
        isAlwaysMostly('Q67')    // asks what/where/why questions
      ) {
        commStage = "CONVERSATIONALIST";
      }
      // 2. PHRASE USER
      else if (
        isSometimes('Q56') || // 3-4 word sentences (sometimes)
        isSometimes('Q64') || // grammatically correct sentences (sometimes)
        isAlwaysMostlyOrNormally('Q44') || // short phrases, different ideas
        isAlwaysMostlyOrNormally('Q42') || // copies 2-word phrases
        isAlwaysMostlyOrNormally('Q52') || // copies 2-word phrases
        isAlwaysMostlyOrNormally('Q66')    // puts 2+ words together
      ) {
        commStage = "PHRASE USER";
      }
      // 3. SINGLE WORD USER
      else if (
        isYes('Q41') || // 8+ words
        isYes('Q49') || // 15+ words
        isYes('Q37') || // 4+ words
        isYes('Q46') || // names at least 1 picture
        isYes('Q50') || // names at least 1 picture
        isYes('Q54') || // names at least 1 picture
        isYes('Q60') || // tells own name
        isYes('Q62') || // tells own name
        isAlwaysMostlyOrNormally('Q58') // labels actions in pictures
      ) {
        commStage = "SINGLE WORD USER";
      }
      // 4. ENGAGER
      else {
        commStage = "ENGAGER";
      }

      // 4. Engager Sub-Flag (Early Communication Concern)
      if (commStage === "ENGAGER") {
        const isRarely = (code: string) => {
          const found = userAnswers.find((a: QuizAnswer) => a.questionCode && a.questionCode.split('_')[0] === code);
          if (!found) return null;
          const text = (found.text || '').toLowerCase();
          return text.includes('rarely') || text.includes('not yet');
        };

        const r38 = isRarely('Q38');
        const r39 = isRarely('Q39');
        const r40 = isRarely('Q40');

        const engagerChecks = [r38, r39, r40].filter(v => v !== null);
        if (engagerChecks.length > 0 && engagerChecks.every(v => v === true)) {
          commStage = "ENGAGER (EARLY COMMUNICATION CONCERN)";
        }
      }

      recommendations.push(commStage);
    }

    const submission = await prisma.submission.create({
      data: {
        parentName,
        parentEmail,
        childFirstName: childFirstName || null,
        childDob: new Date(childDoB),
        totalScore: score,
        scoreStatus: output1,
        speechClarity: speechClarityConcern ? "SPEECH CLARITY CONCERN" : "NO CONCERN",
        communicationStage: commStage,
        answers: {
          create: answersToSave
        }
      }
    });

    if (sessionId) {
      try {
        await prisma.quizSession.update({
          where: { id: sessionId },
          data: {
            completedAt: new Date(),
            submissionId: submission.id
          }
        });
      } catch (err) {
        console.error("Failed to update QuizSession for sessionId:", sessionId, err);
      }
    }

    // --- ConvertKit CRM Sync ---
    // Reliability note: each call below gets its own retry-with-backoff, and the three
    // independent tag calls run in parallel instead of sequentially, so a single slow/flaky
    // ConvertKit request can no longer block or silently swallow the others. Each failure is
    // logged individually (with the submission id + email) rather than one generic error, so a
    // partial sync failure is actually diagnosable in Vercel logs afterward.
    try {
      const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
      const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;

      if (CONVERTKIT_API_KEY && CONVERTKIT_FORM_ID) {
        type CkResult = { ok: boolean; label: string; error?: unknown };

        async function ckFetchWithRetry(
          label: string,
          url: string,
          payload: Record<string, unknown>,
          retries = 2
        ): Promise<CkResult> {
          let lastError: unknown = null;
          for (let attempt = 0; attempt <= retries; attempt++) {
            try {
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify(payload)
              });
              if (res.ok) return { ok: true, label };
              lastError = await res.text();
              console.error(
                `ConvertKit ${label} failed for ${parentEmail} (submission ${submission.id}), attempt ${attempt + 1}/${retries + 1}, status ${res.status}:`,
                lastError
              );
            } catch (err) {
              lastError = err;
              console.error(
                `ConvertKit ${label} threw for ${parentEmail} (submission ${submission.id}), attempt ${attempt + 1}/${retries + 1}:`,
                err
              );
            }
            if (attempt < retries) {
              const delayMs = 300 * Math.pow(3, attempt); // 300ms, then 900ms
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          }
          return { ok: false, label, error: lastError };
        }

        const ckEndpoint = `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`;
        const subscribePayload = {
          api_key: CONVERTKIT_API_KEY,
          email: parentEmail,
          first_name: parentName,
          fields: {
            childs_date_of_birth: childDoB,
            child_first_name: childFirstName || '',
            childs_first_name: childFirstName || '',
            overall_score: output1,
            speech_clarity: speechClarityConcern ? "SPEECH CLARITY CONCERN" : "NO CONCERN",
            comm_stage: commStage
          }
        };

        const subscribeResult = await ckFetchWithRetry('form subscribe', ckEndpoint, subscribePayload);

        // --- Tagging Logic (score, comm stage, speech clarity) - independent, run in parallel ---
        let tagId: number | null = null;
        if (output1 === 'Delayed') tagId = 3672935;
        else if (output1 === 'At Risk') tagId = 3672943;
        else if (output1 === 'On Track') tagId = 3672966;

        let stageTagId: number | null = null;
        if (commStage === 'ENGAGER' || commStage === 'ENGAGER (EARLY COMMUNICATION CONCERN)') stageTagId = 3672938;
        else if (commStage === 'SINGLE WORD USER') stageTagId = 3673005;
        else if (commStage === 'PHRASE USER') stageTagId = 3719653;
        else if (commStage === 'CONVERSATIONALIST') stageTagId = 3719655;

        const tagCalls: Promise<CkResult>[] = [];

        if (tagId) {
          tagCalls.push(ckFetchWithRetry(
            `score tag (${output1})`,
            `https://api.convertkit.com/v3/tags/${tagId}/subscribe`,
            { api_key: CONVERTKIT_API_KEY, email: parentEmail }
          ));
        }
        if (stageTagId) {
          tagCalls.push(ckFetchWithRetry(
            `comm stage tag (${commStage})`,
            `https://api.convertkit.com/v3/tags/${stageTagId}/subscribe`,
            { api_key: CONVERTKIT_API_KEY, email: parentEmail }
          ));
        }
        if (speechClarityConcern) {
          tagCalls.push(ckFetchWithRetry(
            'speech clarity tag',
            `https://api.convertkit.com/v3/tags/20536350/subscribe`,
            { api_key: CONVERTKIT_API_KEY, email: parentEmail }
          ));
        }

        const tagResults = await Promise.allSettled(tagCalls);

        const failedLabels = [
          ...(subscribeResult.ok ? [] : [subscribeResult.label]),
          ...tagResults
            .map((r) => (r.status === 'fulfilled' ? r.value : { ok: false, label: 'tag call (rejected)' } as CkResult))
            .filter((r) => !r.ok)
            .map((r) => r.label)
        ];

        if (failedLabels.length > 0) {
          console.error(
            `ConvertKit sync partially failed for ${parentEmail} (submission ${submission.id}) after retries: ${failedLabels.join(', ')}`
          );
        }
      } else {
        console.warn('ConvertKit API Key or Form ID is missing. Please add CONVERTKIT_FORM_ID to .env. Skipping ConvertKit sync.');
      }
    } catch (crmError) {
      console.error('ConvertKit Sync failed:', crmError);
    }
    return NextResponse.json({
      success: true,
      submission: submission,
    });

  } catch (error) {
    console.error('API /assessment/submit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
