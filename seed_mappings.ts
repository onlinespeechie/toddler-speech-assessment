import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mappings = [
  { age: '15-16 months', code: 'Q37', type: 'Scored' },
  { age: '15-16 months', code: 'Q38', type: 'Scored' },
  { age: '15-16 months', code: 'Q39', type: 'Scored' },
  { age: '15-16 months', code: 'Q40', type: 'Scored' },
  { age: '15-16 months', code: 'Q41', type: 'Scored' },
  { age: '15-16 months', code: 'Q42', type: 'Scored' },
  { age: '15-16 months', code: 'Q43', type: 'Bridge' },
  { age: '15-16 months', code: 'Q42', type: 'Bridge' },
  { age: '15-16 months', code: 'Q44', type: 'Comm Stage Bridge' },
  { age: '17-18 months', code: 'Q39', type: 'Scored' },
  { age: '17-18 months', code: 'Q40', type: 'Scored' },
  { age: '17-18 months', code: 'Q41', type: 'Scored' },
  { age: '17-18 months', code: 'Q42', type: 'Scored' },
  { age: '17-18 months', code: 'Q43', type: 'Scored' },
  { age: '17-18 months', code: 'Q44', type: 'Scored' },
  { age: '17-18 months', code: 'Q45', type: 'Bridge' },
  { age: '17-18 months', code: 'Q46', type: 'Bridge' },
  { age: '19-20 months', code: 'Q41', type: 'Scored' },
  { age: '19-20 months', code: 'Q42', type: 'Scored' },
  { age: '19-20 months', code: 'Q43', type: 'Scored' },
  { age: '19-20 months', code: 'Q44', type: 'Scored' },
  { age: '19-20 months', code: 'Q45', type: 'Scored' },
  { age: '19-20 months', code: 'Q46', type: 'Scored' },
  { age: '19-20 months', code: 'Q47', type: 'Bridge' },
  { age: '19-20 months', code: 'Q48', type: 'Bridge' },
  { age: '19-20 months', code: 'Q49', type: 'Bridge' },
  { age: '21-22 months', code: 'Q44', type: 'Scored' },
  { age: '21-22 months', code: 'Q45', type: 'Scored' },
  { age: '21-22 months', code: 'Q47', type: 'Scored' },
  { age: '21-22 months', code: 'Q48', type: 'Scored' },
  { age: '21-22 months', code: 'Q49', type: 'Scored' },
  { age: '21-22 months', code: 'Q50', type: 'Scored' },
  { age: '21-22 months', code: 'Q56', type: 'Bridge' },
  { age: '21-22 months', code: 'Q59', type: 'Bridge' },
  { age: '23-25 months', code: 'Q44', type: 'Scored' },
  { age: '23-25 months', code: 'Q45', type: 'Scored' },
  { age: '23-25 months', code: 'Q50', type: 'Scored' },
  { age: '23-25 months', code: 'Q51', type: 'Scored' },
  { age: '23-25 months', code: 'Q52', type: 'Scored' },
  { age: '23-25 months', code: 'Q56', type: 'Bridge' },
  { age: '23-25 months', code: 'Q53', type: 'Bridge' },
  { age: '23-25 months', code: 'Q58', type: 'Bridge' },
  { age: '25-28 months', code: 'Q53', type: 'Scored' },
  { age: '25-28 months', code: 'Q54', type: 'Scored' },
  { age: '25-28 months', code: 'Q55', type: 'Scored' },
  { age: '25-28 months', code: 'Q56', type: 'Scored' },
  { age: '25-28 months', code: 'Q57', type: 'Scored' },
  { age: '25-28 months', code: 'Q59', type: 'Scored' },
  { age: '25-28 months', code: 'Q61', type: 'Bridge' },
  { age: '25-28 months', code: 'Q58', type: 'Bridge' },
  { age: '25-28 months', code: 'Q66', type: 'Comm Stage' },
  { age: '28-31 months', code: 'Q54', type: 'Scored' },
  { age: '28-31 months', code: 'Q55', type: 'Scored' },
  { age: '28-31 months', code: 'Q56', type: 'Scored' },
  { age: '28-31 months', code: 'Q57', type: 'Scored' },
  { age: '28-31 months', code: 'Q58', type: 'Scored' },
  { age: '28-31 months', code: 'Q59', type: 'Scored' },
  { age: '28-31 months', code: 'Q61', type: 'Bridge' },
  { age: '28-31 months', code: 'Q60', type: 'Bridge' },
  { age: '28-31 months', code: 'Q66', type: 'Comm Stage' },
  { age: '31-34 months', code: 'Q56', type: 'Scored' },
  { age: '31-34 months', code: 'Q57', type: 'Scored' },
  { age: '31-34 months', code: 'Q58', type: 'Scored' },
  { age: '31-34 months', code: 'Q59', type: 'Scored' },
  { age: '31-34 months', code: 'Q60', type: 'Scored' },
  { age: '31-34 months', code: 'Q61', type: 'Scored' },
  { age: '31-34 months', code: 'Q63', type: 'Bridge' },
  { age: '31-34 months', code: 'Q67', type: 'Bridge' },
  { age: '34-38 months', code: 'Q56', type: 'Scored' },
  { age: '34-38 months', code: 'Q57', type: 'Scored' },
  { age: '34-38 months', code: 'Q58', type: 'Scored' },
  { age: '34-38 months', code: 'Q59', type: 'Scored' },
  { age: '34-38 months', code: 'Q61', type: 'Scored' },
  { age: '34-38 months', code: 'Q62', type: 'Scored' },
  { age: '34-38 months', code: 'Q63', type: 'Bridge' },
  { age: '34-38 months', code: 'Q64', type: 'Bridge' },
  { age: '39-44 months', code: 'Q58', type: 'Scored' },
  { age: '39-44 months', code: 'Q59', type: 'Scored' },
  { age: '39-44 months', code: 'Q61', type: 'Scored' },
  { age: '39-44 months', code: 'Q62', type: 'Scored' },
  { age: '39-44 months', code: 'Q63', type: 'Scored' },
  { age: '39-44 months', code: 'Q64', type: 'Scored' },
  { age: '39-44 months', code: 'Q68', type: 'Bridge' },
  { age: '39-44 months', code: 'Q65', type: 'Bridge' },
];

async function main() {
  console.log('Clearing old standard sequence placements...');
  
  // Do NOT clear ICS sequence placements!
  const icsSequence = await prisma.questionSequence.findUnique({ where: { id: 'ICS_SEQUENCE' } });
  
  if (icsSequence) {
    await prisma.sequencePlacement.deleteMany({
      where: { sequenceId: { not: 'ICS_SEQUENCE' } }
    });
  } else {
    await prisma.sequencePlacement.deleteMany({});
  }

  // Pre-fetch sequences and questions to avoid repeated queries
  const sequences = await prisma.questionSequence.findMany();
  const seqMap = new Map(sequences.map(s => [s.title, s.id]));
  
  const questions = await prisma.question.findMany();
  const qMap = new Map(questions.map(q => [q.internalCode, q.id]));

  for (const mapping of mappings) {
    const seqId = seqMap.get(mapping.age);
    const qId = qMap.get(mapping.code);

    if (!seqId) {
      console.warn(`Sequence ${mapping.age} not found for ${mapping.code}`);
      continue;
    }
    if (!qId) {
      console.warn(`Question ${mapping.code} not found for ${mapping.age}`);
      continue;
    }

    const isScored = mapping.type === 'Scored';
    
    // Get current count for order
    const count = await prisma.sequencePlacement.count({ where: { sequenceId: seqId } });

    const exists = await prisma.sequencePlacement.findUnique({
      where: { sequenceId_questionId: { sequenceId: seqId, questionId: qId } }
    });

    if (exists) {
      console.warn(`Already mapped ${mapping.code} to ${mapping.age}, skipping duplicate row.`);
      continue;
    }

    await prisma.sequencePlacement.create({
      data: {
        sequenceId: seqId,
        questionId: qId,
        order: count,
        isScored,
        questionType: mapping.type,
      }
    });

    console.log(`Mapped ${mapping.code} to ${mapping.age} (${mapping.type})`);
  }

  console.log('Mappings complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
