import * as fs from 'fs';
import * as path from 'path';
import { seedExerciseMedia } from '../prisma/seed-media';
import { PrismaService } from '../src/prisma/prisma.service';

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

const catalogPath = path.join(__dirname, '../prisma/data/exercise-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as ExerciseCatalogEntry[];

export async function seedTestExercises(prisma: PrismaService): Promise<void> {
  for (const exercise of catalog) {
    await prisma.exercise.upsert({
      where: { slug: exercise.slug },
      create: { ...exercise, status: 'published' },
      update: { ...exercise, status: 'published' },
    });
  }
  await seedExerciseMedia(prisma);
}
