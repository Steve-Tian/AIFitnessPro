import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { seedExerciseMedia } from './seed-media';

const prisma = new PrismaClient();

type ExerciseCatalogEntry = {
  slug: string;
  nameCn: string;
  aliases: string[];
  category: string;
  primaryMuscles: string[];
  equipment: string[];
  difficulty: string;
  instructions: string[];
  commonMistakes: string[];
  safetyNotes: string[];
};

const catalogPath = path.join(__dirname, 'data/exercise-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as ExerciseCatalogEntry[];

async function main() {
  console.log('Seeding exercises...');
  for (const exercise of catalog as ExerciseCatalogEntry[]) {
    await prisma.exercise.upsert({
      where: { slug: exercise.slug },
      create: { ...exercise, status: 'published' },
      update: { ...exercise, status: 'published' },
    });
  }
  console.log(`Seeded ${catalog.length} exercises.`);

  const mediaCount = await seedExerciseMedia(prisma);
  console.log(`Seeded media for ${mediaCount} core exercises.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
