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
  // Group entries by slug so we delete once then insert all images for each exercise
  const bySlug = new Map<string, ExerciseMediaEntry[]>();
  for (const entry of mediaCatalog) {
    const list = bySlug.get(entry.slug) ?? [];
    list.push(entry);
    bySlug.set(entry.slug, list);
  }

  let seeded = 0;
  for (const [slug, entries] of bySlug) {
    const exercise = await prisma.exercise.findUnique({ where: { slug } });
    if (!exercise) continue;

    await prisma.exerciseMedia.deleteMany({ where: { exerciseId: exercise.id } });
    await prisma.exerciseMedia.createMany({
      data: entries.map((e) => ({
        exerciseId: exercise.id,
        mediaType: e.mediaType,
        url: e.url,
        source: e.source,
        license: e.license,
        sortOrder: e.sortOrder,
      })),
    });
    seeded += entries.length;
  }
  return seeded;
}
