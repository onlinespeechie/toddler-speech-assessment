import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parentName, parentEmail, childDoB, totalScore, finalTag, answers } = body;

    if (!parentName || !parentEmail || !childDoB) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Precise age calculation in months (day-of-month anniversary)
    const now = new Date();
    const dob = new Date(childDoB);
    let calculatedAge = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) {
      calculatedAge--;
    }

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
    
    if (calculatedAge >= 15 && calculatedAge <= 16) {
      if (score <= 20) output1 = 'Delayed'; else if (score <= 30) output1 = 'At Risk';
    } else if (calculatedAge >= 17 && calculatedAge <= 18) {
      if (score <= 15) output1 = 'Delayed'; else if (score <= 30) output1 = 'At Risk';
    } else if (calculatedAge >= 19 && calculatedAge <= 20) {
      if (score <= 20) output1 = 'Delayed'; else if (score <= 35) output1 = 'At Risk';
    } else if (calculatedAge >= 21 && calculatedAge <= 22) {
      if (score <= 15) output1 = 'Delayed'; else if (score <= 30) output1 = 'At Risk';
    } else if (calculatedAge >= 23 && calculatedAge <= 25) {
      if (score <= 25) output1 = 'Delayed'; else if (score <= 40) output1 = 'At Risk';
    } else if (calculatedAge >= 26 && calculatedAge <= 28) {
      if (score <= 25) output1 = 'Delayed'; else if (score <= 40) output1 = 'At Risk';
    } else if (calculatedAge >= 29 && calculatedAge <= 31) {
      if (score <= 30) output1 = 'Delayed'; else if (score <= 44) output1 = 'At Risk';
    } else if (calculatedAge >= 32 && calculatedAge <= 34) {
      if (score <= 25) output1 = 'Delayed'; else if (score <= 35) output1 = 'At Risk';
    } else if (calculatedAge >= 35 && calculatedAge <= 38) {
      if (score <= 30) output1 = 'Delayed'; else if (score <= 44) output1 = 'At Risk';
    } else if (calculatedAge >= 39 && calculatedAge <= 44) {
      if (score <= 25) output1 = 'Delayed'; else if (score <= 35) output1 = 'At Risk';
    }

    let answersToSave: any[] = [];

    if (answers && Array.isArray(answers)) {
      let expressiveTotal = 0;
      let comprehensionTotal = 0;

      answersToSave = answers.map((a: any) => {
        const cat = getCategory(a.questionCode);
        if (cat === 'Expressive') expressiveTotal += (a.weight || 0);
        if (cat === 'Comprehension') comprehensionTotal += (a.weight || 0);
        return {
          internalCode: a.questionCode || null,
          category: cat,
          weight: a.weight || 0,
          text: a.text || 'Unknown'
        };
      });

      if (expressiveTotal > 0 || comprehensionTotal > 0) {
        recommendations.push(`Sub-totals - Expressive: ${expressiveTotal}, Comprehension: ${comprehensionTotal}`);
      }

      // 2. Speech Clarity (Output 2)
      const icsAnswers = answers.filter((a: any) => a.questionCode?.startsWith('ICS'));
      if (icsAnswers.length > 0) {
        const icsSum = icsAnswers.reduce((sum: number, a: any) => sum + (a.weight || 0), 0);
        const icsAvg = icsSum / 7;
        if (icsAvg < 4.0) {
          recommendations.push("SPEECH CLARITY CONCERN");
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
      const hasVal = (code: string, values: string[]) => {
        const found = answers.find((a: any) => a.internalCode && a.internalCode.split('_')[0] === code);
        if (!found) return false;
        return values.some(v => found.text && found.text.includes(v));
      };

      let commStage = "ENGAGER"; // Default Step 4

      // Step 1: Conversationalist
      const q56_AM = hasVal('Q56', ['Always/Mostly']);
      const q44_AM = hasVal('Q44', ['Always/Mostly']);
      const q44_Some = hasVal('Q44', ['Sometimes']);
      
      let supp1 = 0;
      if (hasVal('Q64', ['Always/Mostly', 'Sometimes'])) supp1++;
      if (hasVal('Q58', ['Always/Mostly'])) supp1++;
      if (hasVal('Q48', ['Yes']) || hasVal('Q53', ['Yes'])) supp1++;
      if (hasVal('Q60', ['Yes']) || hasVal('Q62', ['Yes'])) supp1++;
      if (hasVal('Q64a', ['Always/Mostly'])) supp1++;

      if (q56_AM && q44_AM) {
        commStage = "CONVERSATIONALIST";
      } else if (q56_AM && q44_Some && supp1 >= 2) {
        commStage = "CONVERSATIONALIST";
      }

      // Step 2: Phrase User
      if (commStage === "ENGAGER") {
        let prim2 = 0;
        if (hasVal('Q42', ['Always/Mostly']) || hasVal('Q52', ['Always/Mostly'])) prim2++;
        if (hasVal('Q44', ['Always/Mostly', 'Sometimes'])) prim2++;
        if (hasVal('Q64d', ['Always/Mostly'])) prim2++;

        let supp2 = 0;
        if (hasVal('Q48', ['Yes']) || hasVal('Q53', ['Yes'])) supp2++;
        if (hasVal('Q49', ['Yes'])) supp2++;
        if (hasVal('Q45', ['Always/Mostly', 'Sometimes']) || hasVal('Q55', ['Always/Mostly', 'Sometimes'])) supp2++;

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
        if (hasVal('Q43', ['Always/Mostly', 'Sometimes'])) supp3++;
        if (hasVal('Q47', ['Yes']) || hasVal('Q57', ['Yes'])) supp3++;
        if (hasVal('Q40', ['Always/Mostly'])) supp3++;

        const q37_Yes = hasVal('Q37', ['Yes']);

        if (prim3 >= 1) {
          commStage = "SINGLE WORD USER";
        } else if (q37_Yes && supp3 >= 2) {
          commStage = "SINGLE WORD USER";
        }
      }

      recommendations.push(commStage);
    }

    const generatedTag = finalTag || output1;
    const finalCombinedTag = recommendations.length > 0 ? `${generatedTag} | ${recommendations.join(', ')}` : generatedTag;

    // Create Contact and Submission in one go
    const contact = await prisma.contact.create({
      data: {
        parentName,
        parentEmail,
        childDoB: new Date(childDoB),
        submissions: {
          create: {
            totalScore: score,
            tag: output1,
            finalTag: finalCombinedTag,
            answers: {
              create: answersToSave
            }
          }
        }
      },
      include: {
        submissions: true,
      }
    });

    // --- CRM Sync ---
    try {
      const crmEndpoint = process.env.CRM_API_URL || 'https://example.com/api/crm-sync';
      await fetch(crmEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentEmail,
          parentName,
          childDoB,
          calculatedAge,
          tag: finalCombinedTag
        })
      });
    } catch (crmError) {
      console.error('CRM Sync failed:', crmError);
    }

    return NextResponse.json({
      success: true,
      submission: contact.submissions[0],
    });

  } catch (error) {
    console.error('API /assessment/submit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
