import { MediaType, PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

type ExerciseMediaEntry = {
  slug: string;
  mediaType: MediaType;
  url: string;
  source: string;
  license: string;
  sortOrder: number;
};

const mediaPath = path.join(__dirname, 'data/exercise-media.json');
const mediaCatalog = JSON.parse(fs.readFileSync(mediaPath, 'utf8')) as ExerciseMediaEntry[];

export async function seedExerciseMedia(prisma: PrismaClient): Promise<number> {
  let seeded = 0;
  for (const entry of mediaCatalog) {
    const exercise = await prisma.exercise.findUnique({ where: { slug: entry.slug } });
    if (!exercise) continue;

    await prisma.exerciseMedia.deleteMany({ where: { exerciseId: exercise.id } });
    await prisma.exerciseMedia.create({
      data: {
        exerciseId: exercise.id,
        mediaType: entry.mediaType,
        url: entry.url,
        source: entry.source,
        license: entry.license,
        sortOrder: entry.sortOrder,
      },
    });
    seeded += 1;
  }
  return seeded;
}
