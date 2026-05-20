import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXERCISES = [
  {
    slug: 'bench_press',
    nameCn: '卧推',
    aliases: ['杠铃卧推'],
    category: 'compound',
    primaryMuscles: ['chest', 'triceps', 'anterior_deltoid'],
    equipment: ['full_gym', 'barbell_bench'],
    difficulty: 'intermediate',
    instructions: ['平躺卧推凳', '双手握杠略宽于肩宽', '缓慢下放至胸口', '发力推起至锁定'],
    commonMistakes: ['手腕折弯', '背部过度拱起'],
    safetyNotes: ['建议使用保护者', '下放速度不宜过快'],
  },
  {
    slug: 'shoulder_press',
    nameCn: '肩上推举',
    aliases: ['军事推举'],
    category: 'compound',
    primaryMuscles: ['deltoids', 'triceps'],
    equipment: ['full_gym', 'barbell_bench'],
    difficulty: 'intermediate',
    instructions: ['坐姿，杠铃于肩前', '推起至手臂伸直', '缓慢下放至肩位'],
    commonMistakes: ['腰部过度后仰'],
    safetyNotes: ['避免颈部前探'],
  },
  {
    slug: 'push_up',
    nameCn: '俯卧撑',
    aliases: ['标准俯卧撑'],
    category: 'compound',
    primaryMuscles: ['chest', 'triceps', 'anterior_deltoid'],
    equipment: ['full_gym', 'barbell_bench', 'dumbbell_only', 'bodyweight'],
    difficulty: 'beginner',
    instructions: ['双手撑地略宽于肩', '身体成一条直线', '屈肘下降至胸口接近地面', '推起'],
    commonMistakes: ['臀部下沉', '颈部前伸'],
    safetyNotes: ['保持核心收紧'],
  },
  {
    slug: 'tricep_extension',
    nameCn: '哑铃三头肌伸展',
    aliases: ['三头伸展'],
    category: 'isolation',
    primaryMuscles: ['triceps'],
    equipment: ['full_gym', 'dumbbell_only'],
    difficulty: 'beginner',
    instructions: ['单手持哑铃手臂上举', '屈肘使哑铃下落至后脑', '伸直手臂推起'],
    commonMistakes: ['肘部外展过大'],
    safetyNotes: ['选择适合重量，控制动作'],
  },
  {
    slug: 'pull_up',
    nameCn: '引体向上',
    aliases: ['单杠引体'],
    category: 'compound',
    primaryMuscles: ['latissimus_dorsi', 'biceps'],
    equipment: ['full_gym', 'bodyweight'],
    difficulty: 'intermediate',
    instructions: ['双手正握单杠', '悬挂核心收紧', '拉起至下巴过杠', '缓慢下放'],
    commonMistakes: ['借助甩动惯性'],
    safetyNotes: ['可使用辅助带减轻难度'],
  },
  {
    slug: 'dumbbell_row',
    nameCn: '哑铃划船',
    aliases: ['单臂哑铃划船'],
    category: 'compound',
    primaryMuscles: ['latissimus_dorsi', 'rhomboids', 'biceps'],
    equipment: ['full_gym', 'dumbbell_only'],
    difficulty: 'beginner',
    instructions: ['单手扶凳另一手持哑铃', '背部平行地面', '拉起哑铃至腰侧', '缓慢下放'],
    commonMistakes: ['身体旋转过大'],
    safetyNotes: ['保持背部平直'],
  },
  {
    slug: 'bicep_curl',
    nameCn: '弯举',
    aliases: ['二头弯举', '哑铃弯举'],
    category: 'isolation',
    primaryMuscles: ['biceps'],
    equipment: ['full_gym', 'dumbbell_only'],
    difficulty: 'beginner',
    instructions: ['站立双手持哑铃', '肘部贴近躯干', '弯曲肘部上举至顶端', '缓慢下放'],
    commonMistakes: ['借助身体晃动', '肘部离开躯干'],
    safetyNotes: ['控制动作节奏'],
  },
  {
    slug: 'squat',
    nameCn: '深蹲',
    aliases: ['杠铃深蹲', '徒手深蹲'],
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: ['full_gym', 'barbell_bench', 'dumbbell_only', 'bodyweight'],
    difficulty: 'intermediate',
    instructions: ['双脚与肩同宽站立', '背部挺直核心收紧', '屈髋屈膝下蹲至大腿平行地面', '发力站起'],
    commonMistakes: ['膝盖内扣', '身体过度前倾'],
    safetyNotes: ['初学者先练徒手深蹲'],
  },
  {
    slug: 'deadlift',
    nameCn: '硬拉',
    aliases: ['杠铃硬拉'],
    category: 'compound',
    primaryMuscles: ['hamstrings', 'glutes', 'erector_spinae'],
    equipment: ['full_gym', 'barbell_bench'],
    difficulty: 'advanced',
    instructions: ['双脚与髋同宽站于杠铃前', '屈髋弯腰正握杠铃', '背部平直发力站起', '控制下放'],
    commonMistakes: ['背部弯曲', '杠铃离开身体'],
    safetyNotes: ['不建议初学者使用大重量'],
  },
  {
    slug: 'lunge',
    nameCn: '弓步蹲',
    aliases: ['分腿蹲'],
    category: 'compound',
    primaryMuscles: ['quadriceps', 'glutes'],
    equipment: ['full_gym', 'barbell_bench', 'dumbbell_only', 'bodyweight'],
    difficulty: 'beginner',
    instructions: ['站立向前迈出一大步', '前腿弯曲至大腿平行地面', '后腿接近地面', '发力回位'],
    commonMistakes: ['前膝超过脚尖过多'],
    safetyNotes: ['保持躯干直立'],
  },
];

async function main() {
  console.log('Seeding exercises...');
  for (const exercise of EXERCISES) {
    await prisma.exercise.upsert({
      where: { slug: exercise.slug },
      create: { ...exercise, status: 'published' },
      update: { ...exercise, status: 'published' },
    });
  }
  console.log(`Seeded ${EXERCISES.length} exercises.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
