const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { internalCode: { contains: '_BRIDGE' } },
        { internalCode: { contains: '_COMM_STAGE' } }
      ]
    }
  });

  for (const q of questions) {
    if (q.internalCode) {
      const newCode = q.internalCode.replace('_BRIDGE', '').replace('_COMM_STAGE', '');
      console.log(`Updating ${q.internalCode} to ${newCode}`);
      await prisma.question.update({
        where: { id: q.id },
        data: { internalCode: newCode }
      });
    }
  }
  console.log('Cleanup complete');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
