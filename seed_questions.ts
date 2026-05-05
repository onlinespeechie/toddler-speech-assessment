import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

const ageSequences = [
  { title: '15-16 months', min: 15, max: 16 },
  { title: '17-18 months', min: 17, max: 18 },
  { title: '19-20 months', min: 19, max: 20 },
  { title: '21-22 months', min: 21, max: 22 },
  { title: '23-25 months', min: 23, max: 25 },
  { title: '25-28 months', min: 25, max: 28 },
  { title: '28-31 months', min: 28, max: 31 },
  { title: '31-34 months', min: 31, max: 34 },
  { title: '34-38 months', min: 34, max: 38 },
  { title: '39-44 months', min: 39, max: 44 }
];

async function main() {
  console.log('Seeding Sequences...');
  for (const seq of ageSequences) {
    await prisma.questionSequence.upsert({
      where: { id: seq.title.replace(' ', '_') },
      update: { minMonths: seq.min, maxMonths: seq.max },
      create: { id: seq.title.replace(' ', '_'), title: seq.title, minMonths: seq.min, maxMonths: seq.max }
    });
  }

  // Clear old placements to avoid ghost mappings
  await prisma.sequencePlacement.deleteMany({});
  
  const rawData = fs.readFileSync('questions_data_v2.tsv', 'utf-8');
  const lines = rawData.split('\n').filter(l => l.trim().length > 0);
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < 11) continue;
    
    let code = cols[0].trim();
    const video = cols[1].trim();
    const text = cols[2].trim().replace(/^"|"$/g, '');
    const cat = cols[3].trim();
    const type = cols[4].trim();
    const format = cols[5].trim();
    const opt1 = cols[6].trim();
    const opt2 = cols[7].trim();
    const opt3 = cols[8].trim();
    const scoringRaw = cols[9].trim();
    const agesRaw = cols[10].trim();
    
    // Parse scores
    let s1 = 0, s2 = 0, s3 = 0;
    if (scoringRaw !== 'N/A') {
      if (format === 'A') {
        s1 = 10;
        s2 = 0;
      } else if (format === 'B') {
        const parts = scoringRaw.split('/').map(p => parseInt(p.trim()) || 0);
        if (parts.length === 3) {
          s1 = parts[0]; s2 = parts[1]; s3 = parts[2];
        }
      }
    }
    
    // Explicit Comm Stage overrides
    let finalType = type;
    if (code === 'Q44' || code === 'Q64d') {
      s1 = 0; s2 = 0; s3 = 0;
      finalType = 'Comm Stage';
    }
    
    const optionsToCreate = [];
    if (opt1) optionsToCreate.push({ text: opt1, weight: s1 });
    if (opt2) optionsToCreate.push({ text: opt2, weight: s2 });
    if (opt3) optionsToCreate.push({ text: opt3, weight: s3 });
    
    // Check if question exists
    let q = await prisma.question.findUnique({ where: { internalCode: code }, include: { options: true } });
    if (!q) {
      q = await prisma.question.create({
        data: {
          text,
          internalCode: code,
          category: cat,
          questionType: finalType,
          videoUrl: video.startsWith('http') ? video : null,
          options: {
            create: optionsToCreate
          }
        },
        include: { options: true }
      });
      console.log(`Created ${code}`);
    } else {
      // Update question text and category
      await prisma.question.update({
        where: { id: q.id },
        data: { text, category: cat }
      });
      
      // Update weights if the previous row was unscored and this row has weights
      if (s1 > 0 || s2 > 0 || s3 > 0) {
        for (let idx = 0; idx < q.options.length; idx++) {
          const opt = q.options[idx];
          const newWeight = idx === 0 ? s1 : idx === 1 ? s2 : s3;
          if (newWeight > opt.weight) {
            await prisma.option.update({ where: { id: opt.id }, data: { weight: newWeight } });
          }
        }
      }
    }
    
    // Assign to sequences
    const isScoredRow = !type.includes('Bridge') && !type.includes('Comm Stage');
    const ages = agesRaw.replace(/mo/g, '').split(',').map(a => a.trim() + ' months');
    for (const ageStr of ages) {
      const sequence = await prisma.questionSequence.findFirst({ where: { title: ageStr } });
      if (sequence) {
        const exists = await prisma.sequencePlacement.findUnique({
          where: { sequenceId_questionId: { sequenceId: sequence.id, questionId: q.id } }
        });
        if (!exists) {
          const count = await prisma.sequencePlacement.count({ where: { sequenceId: sequence.id } });
          await prisma.sequencePlacement.create({
            data: {
              sequenceId: sequence.id,
              questionId: q.id,
              order: count,
              isScored: isScoredRow,
              questionType: type
            }
          });
          console.log(`  Assigned ${code} to ${ageStr} (isScored: ${isScoredRow})`);
        } else {
          // Update isScored and questionType if it was previously false but is true in this row
          if (isScoredRow && !exists.isScored) {
            await prisma.sequencePlacement.update({
              where: { id: exists.id },
              data: { isScored: true, questionType: type }
            });
            console.log(`  Updated ${code} in ${ageStr} to isScored: true`);
          }
        }
      }
    }
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
