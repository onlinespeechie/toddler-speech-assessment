import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parentName, parentEmail, childFirstName, childDoB, totalScore, finalTag, answers } = body;

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
    
    // For ConvertKit, we can still send the integer ageMonths
    let calculatedAge = ageMonths;

    let recommendations: string[] = [];
    const expressiveCodes = ['Q37', 'Q40', 'Q41', 'Q42', 'Q44', 'Q45', 'Q46', 'Q47', 'Q48', 'Q49', 'Q50', 'Q51', 'Q52', 'Q53', 'Q55', 'Q56', 'Q58', 'Q60', 'Q62', 'Q64'];
    const comprehensionCodes = ['Q38', 'Q39', 'Q43', 'Q54', 'Q57', 'Q59', 'Q61', 'Q63'];

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

    let answersToSave: any[] = [];
    let commStage = "ENGAGER";
    let speechClarityConcern = false;

    if (answers && Array.isArray(answers)) {
      let expressiveTotal = 0;
      let comprehensionTotal = 0;

      answersToSave = answers.map((a: any) => {
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
      const icsAnswers = answers.filter((a: any) => a.questionCode?.startsWith('ICS'));
      if (icsAnswers.length > 0) {
        const icsSum = icsAnswers.reduce((sum: number, a: any) => sum + (a.weight || 0), 0);
        const icsAvg = icsSum / icsAnswers.length; // Use actual length instead of hardcoded 7
        
        const ics3 = icsAnswers.find((a: any) => a.questionCode === 'ICS-3');
        const ics3Score = ics3 ? (ics3.weight || 0) : 5; // Default to 'Always' if missing

        if (icsAvg <= 4.0 || ics3Score <= 3) {
          recommendations.push("SPEECH CLARITY CONCERN");
          speechClarityConcern = true;
        }
      }

      // 3. Early Concern Flag (Q38, Q39, Q40)
      const q38 = answers.find((a: any) => a.questionCode === 'Q38');
      const q39 = answers.find((a: any) => a.questionCode === 'Q39');
      const q40 = answers.find((a: any) => a.questionCode === 'Q40');

      const isRarely = (ans: any) => ans && (ans.text?.includes('Rarely') || ans.text?.includes('Not Yet') || ans.weight === 0);

      if (isRarely(q38) && isRarely(q39) && isRarely(q40)) {
        recommendations.push("EARLY COMMUNICATION CONCERN");
      }

      // 4. Comm Stage Waterfall (Output 3)
      commStage = "ENGAGER"; // Default fallback
      const hasVal = (code: string, values: string[]) => {
        const found = answers.find((a: any) => a.questionCode && a.questionCode.split('_')[0] === code);
        if (!found) return false;
        return values.some(v => found.text && found.text.includes(v));
      };

      // Step 1: Conversationalist
      const q56_present = answers.some((a: any) => a.questionCode?.split('_')[0] === 'Q56');
      if (q56_present) {
        const q56_AM = hasVal('Q56', ['Always/Mostly', 'Always / Mostly']);
        const q44_AM = hasVal('Q44', ['Always/Mostly', 'Always / Mostly']);
        const q44_Some = hasVal('Q44', ['Sometimes']);
        
        let supp1 = 0;
        if (hasVal('Q64', ['Always/Mostly', 'Always / Mostly', 'Sometimes'])) supp1++;
        if (hasVal('Q58', ['Always/Mostly', 'Always / Mostly'])) supp1++;
        if (hasVal('Q48', ['Yes']) || hasVal('Q53', ['Yes'])) supp1++;
        if (hasVal('Q60', ['Yes']) || hasVal('Q62', ['Yes'])) supp1++;
        if (hasVal('Q67', ['Always/Mostly', 'Always / Mostly'])) supp1++;

        if (q56_AM && q44_AM) {
          commStage = "CONVERSATIONALIST"; // High confidence
        } else if (q56_AM && q44_Some && supp1 >= 2) {
          commStage = "CONVERSATIONALIST"; // Borderline saved by supporting
        }
      }

      // Step 2: Phrase User
      if (commStage === "ENGAGER") {
        let prim2 = 0;
        if (hasVal('Q42', ['Always/Mostly', 'Always / Mostly']) || hasVal('Q52', ['Always/Mostly', 'Always / Mostly'])) prim2++;
        if (hasVal('Q44', ['Always/Mostly', 'Always / Mostly', 'Sometimes'])) prim2++;
        if (hasVal('Q66', ['Always/Mostly', 'Always / Mostly'])) prim2++;

        let supp2 = 0;
        if (hasVal('Q48', ['Yes']) || hasVal('Q53', ['Yes'])) supp2++;
        if (hasVal('Q49', ['Yes'])) supp2++;
        if (hasVal('Q45', ['Always/Mostly', 'Always / Mostly', 'Sometimes']) || hasVal('Q55', ['Always/Mostly', 'Always / Mostly', 'Sometimes'])) supp2++;

        if (prim2 >= 2) {
          commStage = "PHRASE USER";
        } else if (prim2 === 1 && supp2 >= 2) {
          commStage = "PHRASE USER";
        }
      }

      // Step 3: Single Word User
      if (commStage === "ENGAGER") {
        let prim3 = 0;
        if (hasVal('Q41', ['Yes'])) prim3++;
        if (hasVal('Q49', ['Yes'])) prim3++;

        let supp3 = 0;
        if (hasVal('Q46', ['Yes']) || hasVal('Q50', ['Yes']) || hasVal('Q54', ['Yes'])) supp3++;
        if (hasVal('Q43', ['Always/Mostly', 'Always / Mostly', 'Sometimes'])) supp3++;
        if (hasVal('Q47', ['Yes']) || hasVal('Q57', ['Yes'])) supp3++;
        if (hasVal('Q40', ['Always/Mostly', 'Always / Mostly'])) supp3++;

        const q37_Yes = hasVal('Q37', ['Yes']);

        if (prim3 >= 1) {
          commStage = "SINGLE WORD USER";
        } else if (q37_Yes && supp3 >= 2) {
          commStage = "SINGLE WORD USER";
        }
      }

      // Step 4: Engager Sub-Flag
      if (commStage === "ENGAGER") {
        const isRarely = (code: string) => {
          const found = answers.find((a: any) => a.questionCode && a.questionCode.split('_')[0] === code);
          if (!found) return null;
          return found.text?.includes('Rarely') || found.text?.includes('Not Yet') || found.text?.includes('Not yet');
        };

        const r40 = isRarely('Q40');
        const r38 = isRarely('Q38');
        const r39 = isRarely('Q39');
        
        const engagerChecks = [r40, r38, r39].filter(v => v !== null);
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

    // --- ConvertKit CRM Sync ---
    try {
      const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
      const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;
      
      if (CONVERTKIT_API_KEY && CONVERTKIT_FORM_ID) {
        const ckEndpoint = `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`;
        
        const payload = {
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

        const ckResponse = await fetch(ckEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload)
        });

        if (!ckResponse.ok) {
          const errorData = await ckResponse.text();
          console.error('ConvertKit API error:', errorData);
        }

        // --- Tagging Logic ---
        let tagId = null;
        if (output1 === 'Delayed') tagId = 3672935;
        else if (output1 === 'At Risk') tagId = 3672943;
        else if (output1 === 'On Track') tagId = 3672966;

        if (tagId) {
          const tagEndpoint = `https://api.convertkit.com/v3/tags/${tagId}/subscribe`;
          const tagPayload = {
            api_key: CONVERTKIT_API_KEY,
            email: parentEmail
          };

          const tagResponse = await fetch(tagEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(tagPayload)
          });

          if (!tagResponse.ok) {
            const tagErrorData = await tagResponse.text();
            console.error('ConvertKit Tagging API error:', tagErrorData);
          }
        }

        // --- Communication Stage Tagging Logic ---
        let stageTagId = null;
        if (commStage === 'ENGAGER' || commStage === 'ENGAGER (EARLY COMMUNICATION CONCERN)') stageTagId = 3672938;
        else if (commStage === 'SINGLE WORD USER') stageTagId = 3673005;
        else if (commStage === 'PHRASE USER') stageTagId = 3719653;
        else if (commStage === 'CONVERSATIONALIST') stageTagId = 3719655;

        if (stageTagId) {
          const stageTagEndpoint = `https://api.convertkit.com/v3/tags/${stageTagId}/subscribe`;
          const tagPayload = {
            api_key: CONVERTKIT_API_KEY,
            email: parentEmail
          };
          
          const stageTagResponse = await fetch(stageTagEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(tagPayload)
          });

          if (!stageTagResponse.ok) {
            const stageTagErrorData = await stageTagResponse.text();
            console.error('ConvertKit Stage Tagging API error:', stageTagErrorData);
          }
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
