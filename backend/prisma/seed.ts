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

  await seedAchievements(prisma);
  console.log('Seeded achievements.');
}

async function seedAchievements(prisma: PrismaClient) {
  const achievements = [
    { slug: 'first_workout', nameCn: '初出茅庐', descCn: '完成第一次训练', iconEmoji: '🏋️', sortOrder: 0 },
    { slug: 'three_in_a_row', nameCn: '三连胜', descCn: '连续 3 天完成训练', iconEmoji: '🔥', sortOrder: 1 },
    { slug: 'week_warrior', nameCn: '周周突破', descCn: '连续 7 天完成训练', iconEmoji: '⚡', sortOrder: 2 },
    { slug: 'ten_sessions', nameCn: '十战老兵', descCn: '累计完成 10 次训练', iconEmoji: '💪', sortOrder: 3 },
    { slug: 'thirty_sessions', nameCn: '月度王者', descCn: '累计完成 30 次训练', iconEmoji: '👑', sortOrder: 4 },
    { slug: 'century', nameCn: '百战不殆', descCn: '累计完成 100 次训练', iconEmoji: '🏆', sortOrder: 5 },
  ];
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { slug: a.slug },
      create: a,
      update: a,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
