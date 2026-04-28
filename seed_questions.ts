import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Data extracted from the image
const questionsData = [
  // SCORED
  { code: 'Q37', video: 'Q37', text: 'Does your child say 4 meaningful words (not including "mum"/"dad")?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['15-16 mo'] },
  { code: 'Q38', video: 'Q38', text: 'When looking at pictures in a book, does your child touch, point or try to pick up the images?', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['15-16 mo'] },
  { code: 'Q39', video: 'Q39', text: 'When you ask your child to find a familiar object, will they go into another room for it?', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['15-16 mo', '17-18 mo'] },
  { code: 'Q40', video: 'Q40', text: 'Does your child tell you they want something by pointing to the item?', cat: 'Expressive', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['15-16 mo', '17-18 mo'] },
  { code: 'Q41', video: 'Q41', text: 'Does your child say 8 or more meaningful words (not including "mum"/"dad")?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['15-16 mo', '17-18 mo', '19-20 mo'] },
  { code: 'Q42', video: 'Q42', text: 'Does your child copy phrases that have two words (e.g. mum play, more bubble)?', cat: 'Expressive', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['15-16 mo', '17-18 mo', '19-20 mo'] },
  { code: 'Q43', video: 'Q43', text: 'During picture/book share, when you say "Show me the tree" or "Where\'s the cow?", does your child point to the correct picture?', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['17-18 mo', '19-20 mo'] },
  { code: 'Q44', video: 'Q44', text: 'Does your child say short phrases that represent different ideas together (e.g. "cat down", "more mum", "daddy gone")?', cat: 'Expressive', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['17-18 mo', '19-20 mo', '21-22 mo', '23-25 mo'] },
  { code: 'Q45', video: 'Q45', text: 'Can your child carry out at least three instructions WITHOUT gestural prompts? ("Get your jumper", "Open the door", etc.)', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['19-20 mo', '21-22 mo', '23-25 mo'] },
  { code: 'Q46', video: 'Q46', text: 'Does your child correctly name at least one picture when you point and say "what\'s this"?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['19-20 mo'] },
  { code: 'Q47', video: 'Q47', text: 'When you ask your child to point to body parts, do they correctly point to at least seven?', cat: 'Comprehension', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['21-22 mo'] },
  { code: 'Q48', video: 'Q48', text: 'Does your child use at least 2 pronoun words ("you, mine, I, me")?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['21-22 mo'] },
  { code: 'Q49', video: 'Q49', text: 'Does your child say 15 or more meaningful words?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['21-22 mo'] },
  { code: 'Q50', video: 'Q50', text: 'Does your child correctly name at least one picture when you point and say "what\'s this"?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['21-22 mo', '23-25 mo'] },
  { code: 'Q51', video: 'Q51', text: 'During picture/book share, does your child point to the correct picture when asked?', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['23-25 mo'] },
  { code: 'Q52', video: 'Q52', text: 'Does your child copy phrases that have two words?', cat: 'Expressive', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['23-25 mo'] },
  { code: 'Q53', video: 'Q53', text: 'Does your child use at least two pronoun words ("you", "mine", "I", "me")?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['25-28 mo'] },
  { code: 'Q54', video: 'Q54', text: 'Does your child correctly name at least one picture when asked "what\'s this"?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['25-28 mo', '28-31 mo'] },
  { code: 'Q55', video: 'Q55', text: 'Can your child carry out at least three instructions WITHOUT gestural prompts?', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['25-28 mo', '28-31 mo'] },
  { code: 'Q56', video: 'Q56', text: 'Can your child talk in sentences with 3-4 words? (e.g. "big car down", "give drink to teddy")', cat: 'Expressive', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['25-28 mo', '28-31 mo', '31-34 mo', '34-38 mo'] },
  { code: 'Q57', video: 'Q57', text: 'Can your child point to at least seven body parts?', cat: 'Comprehension', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['25-28 mo', '28-31 mo', '31-34 mo', '34-38 mo'] },
  { code: 'Q58', video: 'Q58', text: 'When looking at pictures in a book, does your child label or talk about actions happening? (e.g. "jumping, running, crying, hugging")', cat: 'Expressive', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['28-31 mo', '31-34 mo', '34-38 mo', '39-44 mo'] },
  { code: 'Q59', video: 'Q59', text: 'Give your child a verbal instruction such as "put the sock in the box" – can they follow through correctly WITHOUT gestural help?', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['25-28 mo', '28-31 mo', '31-34 mo', '34-38 mo', '39-44 mo'] },
  { code: 'Q60', video: 'Q60', text: 'Can your child tell you their first name or nickname if you ask "what\'s your name"?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['31-34 mo'] },
  { code: 'Q61', video: 'Q61', text: 'Does your child understand "up" and "down"?\n\nGet a ruler and a small toy car. Place the ruler on an angle against a tissue box. Show your child how to drive the car up and down the ruler, saying "up" and "down" as you do. After modelling it twice, ask "can you drive the car up?" and "can you drive the car down?" (without any pointing or gesture clues).', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['31-34 mo', '34-38 mo', '39-44 mo'] },
  { code: 'Q62', video: 'Q62', text: 'Can your child tell you their first and last name if you ask "what\'s your name"?', cat: 'Expressive', type: 'Scored', format: 'A', opts: ['Yes', 'Not yet'], scores: [10, 0], ages: ['34-38 mo', '39-44 mo'] },
  { code: 'Q63', video: 'Q63', text: 'Can your child follow instructions that have three steps, without repeating it, nor any support from gestures/pointing? For example, "Get the ball, sit down and touch your nose" OR "clap your hands, pat..."', cat: 'Comprehension', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['39-44 mo'] },
  { code: 'Q64', video: 'Q64', text: 'When your child says sentences, do they include all the little words to make it grammatically correct? (e.g. "I am eating a banana", "put it in the box", "is that mine", "daddy is cutting", "are you going too")', cat: 'Expressive', type: 'Scored', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [10, 5, 0], ages: ['39-44 mo'] },

  // BRIDGE
  { code: 'Q44_BRIDGE', video: 'Q44', text: 'Does your child say short phrases that represent different ideas together (e.g. "cat down", "more mum", "daddy gone")?', cat: 'Expressive', type: 'Comm Stage Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['15-16 mo'] },
  { code: 'Q43_BRIDGE', video: 'Q43', text: 'During picture/book share, when you say "Show me the tree" or "Where\'s the cow?", does your child point to the correct picture?', cat: 'Comprehension', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['15-16 mo'] },
  { code: 'Q42_BRIDGE', video: 'Q42', text: 'Does your child copy phrases that have two words (e.g. mum play, more bubble)?', cat: 'Expressive', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['15-16 mo'] },
  { code: 'Q45_BRIDGE', video: 'Q45', text: 'Can your child carry out at least three instructions WITHOUT gestural prompts? ("Get your jumper", "Open the door", etc.)', cat: 'Comprehension', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['17-18 mo'] },
  { code: 'Q46_BRIDGE', video: 'Q46', text: 'Does your child correctly name at least one picture when you point and say "what\'s this"?', cat: 'Expressive', type: 'Bridge', format: 'A', opts: ['Yes', 'Not yet'], scores: [0, 0], ages: ['17-18 mo'] },
  { code: 'Q47_BRIDGE', video: 'Q47', text: 'When you ask your child to point to body parts, do they correctly point to at least seven?', cat: 'Comprehension', type: 'Bridge', format: 'A', opts: ['Yes', 'Not yet'], scores: [0, 0], ages: ['19-20 mo'] },
  { code: 'Q48_BRIDGE', video: 'Q48', text: 'Does your child use at least 2 pronoun words ("you, mine, I, me")?', cat: 'Expressive', type: 'Bridge', format: 'A', opts: ['Yes', 'Not yet'], scores: [0, 0], ages: ['19-20 mo'] },
  { code: 'Q49_BRIDGE', video: 'Q49', text: 'Does your child say 15 or more meaningful words?', cat: 'Expressive', type: 'Bridge', format: 'A', opts: ['Yes', 'Not yet'], scores: [0, 0], ages: ['19-20 mo'] },
  { code: 'Q56_BRIDGE', video: 'Q56', text: 'Can your child talk in sentences with 3-4 words? (e.g. "big car down", "give drink to teddy")', cat: 'Expressive', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['21-22 mo'] },
  { code: 'Q59_BRIDGE', video: 'Q59', text: 'Give your child a verbal instruction such as "put the sock in the box" – can they follow through correctly WITHOUT gestural help?', cat: 'Comprehension', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['21-22 mo'] },
  { code: 'Q53_BRIDGE', video: 'Q53', text: 'Does your child use at least two pronoun words ("you", "mine", "I", "me")?', cat: 'Expressive', type: 'Bridge', format: 'A', opts: ['Yes', 'Not yet'], scores: [0, 0], ages: ['23-25 mo'] },
  { code: 'Q58_BRIDGE', video: 'Q58', text: 'When looking at pictures in a book, does your child label or talk about actions happening? (e.g. "jumping, running, crying, hugging")', cat: 'Expressive', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['23-25 mo', '25-28 mo'] },
  { code: 'Q61_BRIDGE', video: 'Q61', text: 'Does your child understand "up" and "down"?', cat: 'Comprehension', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['25-28 mo', '28-31 mo'] },
  { code: 'Q60_BRIDGE', video: 'Q60', text: 'Can your child tell you their first name or nickname if you ask "what\'s your name"?', cat: 'Expressive', type: 'Bridge', format: 'A', opts: ['Yes', 'Not yet'], scores: [0, 0], ages: ['28-31 mo'] },
  { code: 'Q63_BRIDGE', video: 'Q63', text: 'Can your child follow instructions that have three steps, without repeating it, nor any support from gestures/pointing?', cat: 'Comprehension', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['31-34 mo', '34-38 mo'] },
  { code: 'Q64a_BRIDGE', video: 'New', text: 'Does your child ask questions like "what\'s that?", "where\'s teddy?" or "why"?', cat: 'Expressive', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['31-34 mo'] },
  { code: 'Q64_BRIDGE', video: 'Q64', text: 'When your child says sentences, do they include all the little words to make it grammatically correct? (e.g. "I am eating a banana", "put it in the box", "is that mine", "daddy is cutting", "are you going too")', cat: 'Expressive', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['34-38 mo'] },
  { code: 'Q64b_BRIDGE', video: 'New', text: 'Without your giving help by pointing or repeating, does your child follow three directions that are unrelated to one another? Give all three directions before your child starts. For example, you may ask your child, "Clap your hands, walk to the door, and sit down," or "Give..."', cat: 'Comprehension', type: 'Bridge', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['39-44 mo'] },
  { code: 'Q64c_BRIDGE', video: 'New', text: 'Does your child name at least three items from a common category? For example, if you say to your child, "Tell me some things that you can eat," does your child answer with something like "cookies, eggs, and cereal"? Or if you say, "Tell me the names of some animals," does your child answer with something like "cow, dog, and elephant"?', cat: 'Expressive', type: 'Bridge', format: 'A', opts: ['Yes', 'Not yet'], scores: [0, 0], ages: ['39-44 mo'] },
  { code: 'Q64d_BRIDGE', video: 'New', text: 'When your child talks to you, do they mostly put two or more words together? (e.g. "more milk", "daddy come", "mum sit", "red car")', cat: 'Expressive', type: 'Comm Stage', format: 'B', opts: ['Always/Mostly', 'Sometimes', 'Rarely/Not Yet'], scores: [0, 0, 0], ages: ['25-28 mo', '28-31 mo'] },
];

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
      where: { id: seq.title.replace(' ', '_') }, // fake unique id
      update: { minMonths: seq.min, maxMonths: seq.max },
      create: { id: seq.title.replace(' ', '_'), title: seq.title, minMonths: seq.min, maxMonths: seq.max }
    });
  }

  console.log('Seeding Questions...');
  for (const q of questionsData) {
    const existing = await prisma.question.findUnique({ where: { internalCode: q.code } });
    let created;
    if (existing) {
      // update
      created = await prisma.question.update({
        where: { id: existing.id },
        data: {
          text: q.text,
          category: q.cat,
          questionType: q.type,
          // keep videoUrl if exists, or maybe set to null since we don't have exact URLs yet
        }
      });
      console.log(`Updated ${q.code}`);
    } else {
      created = await prisma.question.create({
        data: {
          text: q.text,
          internalCode: q.code,
          category: q.cat,
          questionType: q.type,
          options: {
            create: q.opts.map((optText, i) => ({
              text: optText,
              weight: q.scores[i] || 0
            }))
          }
        }
      });
      console.log(`Created ${q.code}`);
    }

    // Assign to sequences
    for (const ageStr of q.ages) {
      // Find matching sequence
      const seqTitle = ageStr.replace('mo', 'months').trim();
      const sequence = await prisma.questionSequence.findFirst({ where: { title: seqTitle } });
      if (sequence) {
        // Upsert placement
        const exists = await prisma.sequencePlacement.findUnique({
          where: { sequenceId_questionId: { sequenceId: sequence.id, questionId: created.id } }
        });
        if (!exists) {
          const count = await prisma.sequencePlacement.count({ where: { sequenceId: sequence.id } });
          await prisma.sequencePlacement.create({
            data: {
              sequenceId: sequence.id,
              questionId: created.id,
              order: count // append
            }
          });
          console.log(`  Assigned ${q.code} to ${seqTitle}`);
        }
      }
    }
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
