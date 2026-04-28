import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const icsData = [
  { code: 'ICS-1', text: 'Do you understand your child?' },
  { code: 'ICS-2', text: 'Do immediate members of your family understand your child?' },
  { code: 'ICS-3', text: 'Do extended members of your family understand your child?' },
  { code: 'ICS-4', text: "Do your child's friends understand your child?" },
  { code: 'ICS-5', text: 'Do other acquaintances understand your child?' },
  { code: 'ICS-6', text: "Do your child's teachers understand your child?" },
  { code: 'ICS-7', text: 'Do strangers understand your child?' },
];

const optionsData = [
  { text: 'Always', weight: 5 },
  { text: 'Usually', weight: 4 },
  { text: 'Sometimes', weight: 3 },
  { text: 'Rarely', weight: 2 },
  { text: 'Never', weight: 1 },
];

async function main() {
  console.log('Seeding ICS Sequence...');
  const sequence = await prisma.questionSequence.upsert({
    where: { id: 'ICS_SEQUENCE' },
    update: { minMonths: 0, maxMonths: 999 }, // Always available
    create: { id: 'ICS_SEQUENCE', title: 'Speech Clarity (ICS)', minMonths: 0, maxMonths: 999 }
  });

  // Clear existing ICS placements
  await prisma.sequencePlacement.deleteMany({
    where: { sequenceId: sequence.id }
  });

  console.log('Seeding ICS Questions...');
  for (let i = 0; i < icsData.length; i++) {
    const qData = icsData[i];
    
    let q = await prisma.question.findUnique({ where: { internalCode: qData.code } });
    if (!q) {
      q = await prisma.question.create({
        data: {
          text: qData.text,
          internalCode: qData.code,
          category: 'Speech Clarity',
          questionType: 'ICS',
          options: {
            create: optionsData
          }
        }
      });
      console.log(`Created ${qData.code}`);
    } else {
      // update text if needed
      await prisma.question.update({
        where: { id: q.id },
        data: { text: qData.text }
      });
      console.log(`Updated ${qData.code}`);
    }

    // Assign to ICS Sequence
    await prisma.sequencePlacement.create({
      data: {
        sequenceId: sequence.id,
        questionId: q.id,
        order: i
      }
    });
  }

  console.log('ICS Seeding Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
