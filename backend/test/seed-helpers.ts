import { PrismaService } from '../src/prisma/prisma.service';

export async function seedTestExercises(prisma: PrismaService): Promise<void> {
  const exercises = [
    {
      slug: 'bench_press', nameCn: '卧推', aliases: ['杠铃卧推'], category: 'compound',
      primaryMuscles: ['chest'], equipment: ['full_gym', 'barbell_bench'],
      difficulty: 'intermediate', instructions: ['下放', '推起'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'shoulder_press', nameCn: '肩上推举', aliases: [], category: 'compound',
      primaryMuscles: ['deltoids'], equipment: ['full_gym', 'barbell_bench'],
      difficulty: 'intermediate', instructions: ['推起', '下放'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'push_up', nameCn: '俯卧撑', aliases: [], category: 'compound',
      primaryMuscles: ['chest'], equipment: ['full_gym', 'barbell_bench', 'dumbbell_only', 'bodyweight'],
      difficulty: 'beginner', instructions: ['下降', '推起'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'tricep_extension', nameCn: '哑铃三头肌伸展', aliases: [], category: 'isolation',
      primaryMuscles: ['triceps'], equipment: ['full_gym', 'dumbbell_only'],
      difficulty: 'beginner', instructions: ['屈肘', '伸直'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'pull_up', nameCn: '引体向上', aliases: [], category: 'compound',
      primaryMuscles: ['latissimus_dorsi'], equipment: ['full_gym', 'bodyweight'],
      difficulty: 'intermediate', instructions: ['拉起', '下放'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'dumbbell_row', nameCn: '哑铃划船', aliases: [], category: 'compound',
      primaryMuscles: ['latissimus_dorsi'], equipment: ['full_gym', 'dumbbell_only'],
      difficulty: 'beginner', instructions: ['拉起', '下放'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'bicep_curl', nameCn: '弯举', aliases: [], category: 'isolation',
      primaryMuscles: ['biceps'], equipment: ['full_gym', 'dumbbell_only'],
      difficulty: 'beginner', instructions: ['上举', '下放'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'squat', nameCn: '深蹲', aliases: [], category: 'compound',
      primaryMuscles: ['quadriceps'], equipment: ['full_gym', 'barbell_bench', 'dumbbell_only', 'bodyweight'],
      difficulty: 'intermediate', instructions: ['下蹲', '站起'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'deadlift', nameCn: '硬拉', aliases: [], category: 'compound',
      primaryMuscles: ['hamstrings'], equipment: ['full_gym', 'barbell_bench'],
      difficulty: 'advanced', instructions: ['站起', '下放'], commonMistakes: [], safetyNotes: [],
    },
    {
      slug: 'lunge', nameCn: '弓步蹲', aliases: [], category: 'compound',
      primaryMuscles: ['quadriceps'], equipment: ['full_gym', 'barbell_bench', 'dumbbell_only', 'bodyweight'],
      difficulty: 'beginner', instructions: ['迈步', '回位'], commonMistakes: [], safetyNotes: [],
    },
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { slug: ex.slug },
      create: { ...ex, status: 'published' },
      update: { ...ex, status: 'published' },
    });
  }
}
