import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing existing data...')
  await prisma.submission.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.sequencePlacement.deleteMany()
  await prisma.option.deleteMany()
  await prisma.question.deleteMany()
  await prisma.questionSequence.deleteMany()

  console.log('Seeding 5 age-bracket sequences...')

  const brackets = [
    { title: '3 to 9 months', min: 3, max: 9 },
    { title: '10 to 18 months', min: 10, max: 18 },
    { title: '19 to 24 months', min: 19, max: 24 },
    { title: '25 to 36 months', min: 25, max: 36 },
    { title: '37 to 48 months', min: 37, max: 48 },
  ]

  const savedSequences = [];
  for (const b of brackets) {
    const seq = await prisma.questionSequence.create({
      data: {
        title: b.title,
        minMonths: b.min,
        maxMonths: b.max,
      }
    });
    savedSequences.push(seq);
  }

  console.log('Creating Universal Questions in Bank...')
  // Create 3 universal questions
  for (let i = 0; i < 5; i++) {
    const q = await prisma.question.create({
      data: {
        text: `Universal Sample Check - Bank Q${i + 1}`,
        options: {
          create: [
            { text: 'Consistently', weight: 10 },
            { text: 'Sometimes', weight: 5 },
            { text: 'Not yet', weight: 0 },
          ]
        }
      }
    });

    // Randomly assign it to a few sequences to demonstrate sharing!
    await prisma.sequencePlacement.create({
      data: { questionId: q.id, sequenceId: savedSequences[0].id, order: i }
    });
    
    // Assign some questions to multiple groups
    if (i % 2 === 0) {
      await prisma.sequencePlacement.create({
        data: { questionId: q.id, sequenceId: savedSequences[1].id, order: i }
      });
    }
  }

  console.log('Dummy seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
