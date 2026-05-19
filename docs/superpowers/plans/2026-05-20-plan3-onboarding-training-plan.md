# Plan 3: Onboarding + Training Plan Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete user path from onboarding form through training plan generation to HomeScreen today card, using dev auth throughout.

**Architecture:** Six-step mixed onboarding wizard (goal/experience/equipment as step cards, body data combined page, days, persona) → profile API → NestJS rule engine generates 28-day PPL plan + async Claude day notes → DataStore plan cache → HomeScreen today card. No Room, no production auth.

**Tech Stack:** Kotlin + Jetpack Compose + DataStore + kotlinx-serialization (Android); NestJS + Prisma + PostgreSQL + @anthropic-ai/sdk (backend); JUnit4 + kotlinx-coroutines-test (Android tests); Jest + ts-jest (backend tests).

---

## File Structure

### Backend (new/modified)

```
backend/prisma/schema.prisma                          MODIFY — add dayNote to PlanDay
backend/prisma/migrations/0002_add_plan_day_note/     CREATE — migration SQL
backend/prisma/seed.ts                                CREATE — 10-exercise seed script
backend/src/plans/plan-rule-engine.ts                 CREATE — pure cycle builder + constants
backend/src/plans/plans.service.ts                    CREATE — generate + getActive
backend/src/plans/plans.controller.ts                 CREATE — POST generate, GET active
backend/src/plans/plan-presenter.ts                   CREATE — DB → API response shape
backend/src/plans/claude-notes.service.ts             CREATE — fire-and-forget day notes
backend/src/plans/plans.module.ts                     CREATE — NestJS module
backend/src/app.module.ts                             MODIFY — import PlansModule
backend/test/seed-helpers.ts                          CREATE — exercise seeding for e2e tests
backend/test/app.e2e-spec.ts                          MODIFY — add plan generation tests
backend/test/jest-unit.json                           CREATE — unit test config
backend/.env.example                                  MODIFY — add ANTHROPIC_API_KEY
backend/package.json                                  MODIFY — add test:unit, seed scripts, @anthropic-ai/sdk
```

### Android (new/modified)

```
android/app/src/main/java/.../core/api/ProfileApi.kt           CREATE — upsertProfile interface
android/app/src/main/java/.../core/api/PlanApi.kt              CREATE — generatePlan, getActivePlan interfaces
android/app/src/main/java/.../core/api/PlanModels.kt           CREATE — ApiActivePlan, ApiPlanDay, ApiPlanExercise
android/app/src/main/java/.../core/api/ApiModels.kt            MODIFY — add UpsertProfileRequest
android/app/src/main/java/.../core/api/AIFitnessApiClient.kt   MODIFY — implement ProfileApi + PlanApi
android/app/src/main/java/.../core/plan/PlanRepository.kt      CREATE — DataStore plan cache
android/app/src/main/java/.../feature/onboarding/OnboardingScreen.kt   CREATE — 6-step wizard
android/app/src/main/java/.../feature/home/HomeScreen.kt       MODIFY — today card UI
android/app/src/main/java/.../navigation/AppNavHost.kt         MODIFY — add planRepository param
android/app/src/main/java/.../AIFitnessProApp.kt               MODIFY — onboarding routing
android/app/src/main/java/.../MainActivity.kt                  MODIFY — wire PlanRepository + apiClient
android/app/src/test/.../core/api/AIFitnessApiClientTest.kt    MODIFY — add profile + plan tests
android/app/src/test/.../core/plan/PlanRepositoryTest.kt       CREATE — DataStore + today-day tests
```

---

## Task 1: Backend — Add dayNote Migration and Exercise Seed

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/0002_add_plan_day_note/migration.sql`
- Create: `backend/prisma/seed.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Add dayNote field to PlanDay in schema**

In `backend/prisma/schema.prisma`, find the `model PlanDay` block and add `dayNote` after `dayType`:

```prisma
model PlanDay {
  id             String          @id @default(uuid()) @db.Uuid
  trainingPlanId String          @map("training_plan_id") @db.Uuid
  dayIndex       Int             @map("day_index")
  scheduledDate  DateTime?       @map("scheduled_date") @db.Date
  dayType        String          @map("day_type")
  dayNote        String?         @map("day_note")
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")
  trainingPlan   TrainingPlan    @relation(fields: [trainingPlanId], references: [id], onDelete: Cascade)
  exercises      PlanExercise[]
  sessions       WorkoutSession[]

  @@index([trainingPlanId])
  @@unique([trainingPlanId, dayIndex])
  @@map("plan_days")
}
```

- [ ] **Step 2: Create migration directory and SQL**

```bash
mkdir -p backend/prisma/migrations/0002_add_plan_day_note
```

Create `backend/prisma/migrations/0002_add_plan_day_note/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "plan_days" ADD COLUMN "day_note" TEXT;
```

- [ ] **Step 3: Apply migration**

```bash
cd backend
npm run prisma:migrate
```

Expected: `0002_add_plan_day_note` applied successfully, `plan_days` table now has `day_note` column.

- [ ] **Step 4: Regenerate Prisma client**

```bash
cd backend
npm run prisma:generate
```

Expected: Prisma client regenerated with `dayNote` field on `PlanDay`.

- [ ] **Step 5: Create seed script**

Create `backend/prisma/seed.ts`:

```typescript
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
```

- [ ] **Step 6: Add seed + test:unit scripts to package.json**

In `backend/package.json`, add to the `"scripts"` block and add a top-level `"prisma"` key. The final `scripts` and new `prisma` key:

```json
"scripts": {
  "build": "nest build",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "test": "jest --config test/jest-e2e.json --runInBand",
  "test:unit": "jest --config test/jest-unit.json --runInBand",
  "seed": "prisma db seed",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate deploy",
  "prisma:migrate:dev": "prisma migrate dev",
  "prisma:reset": "prisma migrate reset --force"
},
"prisma": {
  "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
},
```

- [ ] **Step 7: Create unit test jest config**

Create `backend/test/jest-unit.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": "\\.test\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

- [ ] **Step 8: Run seed and verify**

```bash
cd backend
npm run seed
```

Expected output:
```
Seeding exercises...
Seeded 10 exercises.
```

- [ ] **Step 9: Commit**

```bash
cd backend
git add prisma/schema.prisma prisma/migrations/0002_add_plan_day_note prisma/seed.ts package.json test/jest-unit.json
git commit -m "chore: add dayNote migration and exercise seed data"
```

---

## Task 2: Backend — Plan Rule Engine (Unit Tested)

**Files:**
- Create: `backend/src/plans/plan-rule-engine.ts`
- Create: `backend/src/plans/plan-rule-engine.test.ts`

- [ ] **Step 1: Write failing unit tests**

Create `backend/src/plans/plan-rule-engine.test.ts`:

```typescript
import { buildPlanBlueprint, EXERCISE_SLUGS_BY_DAY_TYPE, TARGETS_BY_EXPERIENCE } from './plan-rule-engine';

describe('buildPlanBlueprint', () => {
  const startDate = new Date('2026-05-20');

  it('always returns exactly 28 days', () => {
    expect(buildPlanBlueprint(3, startDate)).toHaveLength(28);
    expect(buildPlanBlueprint(4, startDate)).toHaveLength(28);
    expect(buildPlanBlueprint(5, startDate)).toHaveLength(28);
  });

  it('assigns 3 training days per week for daysPerWeek=3', () => {
    const days = buildPlanBlueprint(3, startDate);
    const week1 = days.filter(d => d.dayIndex < 7);
    expect(week1.filter(d => d.dayType !== 'rest')).toHaveLength(3);
    expect(week1.filter(d => d.dayType === 'rest')).toHaveLength(4);
  });

  it('assigns 4 training days per week for daysPerWeek=4', () => {
    const days = buildPlanBlueprint(4, startDate);
    const week1 = days.filter(d => d.dayIndex < 7);
    expect(week1.filter(d => d.dayType !== 'rest')).toHaveLength(4);
    expect(week1.filter(d => d.dayType === 'rest')).toHaveLength(3);
  });

  it('assigns 5 training days per week for daysPerWeek=5', () => {
    const days = buildPlanBlueprint(5, startDate);
    const week1 = days.filter(d => d.dayIndex < 7);
    expect(week1.filter(d => d.dayType !== 'rest')).toHaveLength(5);
    expect(week1.filter(d => d.dayType === 'rest')).toHaveLength(2);
  });

  it('cycles push/pull/legs for daysPerWeek=3', () => {
    const days = buildPlanBlueprint(3, startDate);
    const training = days.filter(d => d.dayType !== 'rest');
    expect(training[0].dayType).toBe('push');
    expect(training[1].dayType).toBe('pull');
    expect(training[2].dayType).toBe('legs');
    expect(training[3].dayType).toBe('push');
    expect(training[11].dayType).toBe('legs');
  });

  it('cycles push/pull/legs/full_body for daysPerWeek=4', () => {
    const days = buildPlanBlueprint(4, startDate);
    const training = days.filter(d => d.dayType !== 'rest');
    expect(training[0].dayType).toBe('push');
    expect(training[1].dayType).toBe('pull');
    expect(training[2].dayType).toBe('legs');
    expect(training[3].dayType).toBe('full_body');
    expect(training[4].dayType).toBe('push');
  });

  it('cycles push/pull/legs/push/pull for daysPerWeek=5', () => {
    const days = buildPlanBlueprint(5, startDate);
    const training = days.filter(d => d.dayType !== 'rest');
    expect(training[0].dayType).toBe('push');
    expect(training[1].dayType).toBe('pull');
    expect(training[2].dayType).toBe('legs');
    expect(training[3].dayType).toBe('push');
    expect(training[4].dayType).toBe('pull');
    expect(training[5].dayType).toBe('push');
  });

  it('sets scheduledDate in YYYY-MM-DD format from startDate', () => {
    const days = buildPlanBlueprint(3, new Date('2026-05-20'));
    expect(days[0].scheduledDate).toBe('2026-05-20');
    expect(days[1].scheduledDate).toBe('2026-05-21');
    expect(days[27].scheduledDate).toBe('2026-06-16');
  });

  it('assigns dayIndex 0 through 27 in order', () => {
    const days = buildPlanBlueprint(3, startDate);
    days.forEach((d, i) => expect(d.dayIndex).toBe(i));
  });
});

describe('EXERCISE_SLUGS_BY_DAY_TYPE', () => {
  it('has entries for push, pull, legs, full_body', () => {
    expect(EXERCISE_SLUGS_BY_DAY_TYPE.push.length).toBeGreaterThan(0);
    expect(EXERCISE_SLUGS_BY_DAY_TYPE.pull.length).toBeGreaterThan(0);
    expect(EXERCISE_SLUGS_BY_DAY_TYPE.legs.length).toBeGreaterThan(0);
    expect(EXERCISE_SLUGS_BY_DAY_TYPE.full_body.length).toBeGreaterThan(0);
  });
});

describe('TARGETS_BY_EXPERIENCE', () => {
  it('has entries for beginner, intermediate, advanced', () => {
    expect(TARGETS_BY_EXPERIENCE.beginner.sets).toBe(3);
    expect(TARGETS_BY_EXPERIENCE.intermediate.sets).toBe(4);
    expect(TARGETS_BY_EXPERIENCE.advanced.sets).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

```bash
cd backend
npm run test:unit -- --testPathPattern=plan-rule-engine
```

Expected: FAIL — `Cannot find module './plan-rule-engine'`.

- [ ] **Step 3: Implement the rule engine**

Create `backend/src/plans/plan-rule-engine.ts`:

```typescript
export type TrainingDayType = 'push' | 'pull' | 'legs' | 'full_body';
export type DayType = TrainingDayType | 'rest';

export interface PlanDayBlueprint {
  dayIndex: number;
  dayType: DayType;
  scheduledDate: string;
}

const CYCLES: Record<3 | 4 | 5, TrainingDayType[]> = {
  3: ['push', 'pull', 'legs'],
  4: ['push', 'pull', 'legs', 'full_body'],
  5: ['push', 'pull', 'legs', 'push', 'pull'],
};

export function buildPlanBlueprint(daysPerWeek: 3 | 4 | 5, startDate: Date): PlanDayBlueprint[] {
  const trainingCycle = CYCLES[daysPerWeek];
  const result: PlanDayBlueprint[] = [];
  let cycleIndex = 0;

  for (let dayIndex = 0; dayIndex < 28; dayIndex++) {
    const posInWeek = dayIndex % 7;
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const scheduledDate = date.toISOString().split('T')[0];

    if (posInWeek < daysPerWeek) {
      result.push({
        dayIndex,
        dayType: trainingCycle[cycleIndex % trainingCycle.length],
        scheduledDate,
      });
      cycleIndex++;
    } else {
      result.push({ dayIndex, dayType: 'rest', scheduledDate });
    }
  }

  return result;
}

export const EXERCISE_SLUGS_BY_DAY_TYPE: Record<TrainingDayType, string[]> = {
  push: ['bench_press', 'shoulder_press', 'push_up', 'tricep_extension'],
  pull: ['pull_up', 'dumbbell_row', 'bicep_curl'],
  legs: ['squat', 'deadlift', 'lunge'],
  full_body: ['push_up', 'pull_up', 'squat'],
};

export const TARGETS_BY_EXPERIENCE: Record<string, { sets: number; reps: number; restSeconds: number }> = {
  beginner: { sets: 3, reps: 10, restSeconds: 90 },
  intermediate: { sets: 4, reps: 8, restSeconds: 90 },
  advanced: { sets: 5, reps: 5, restSeconds: 120 },
};
```

- [ ] **Step 4: Run tests and verify GREEN**

```bash
cd backend
npm run test:unit -- --testPathPattern=plan-rule-engine
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/plans/plan-rule-engine.ts src/plans/plan-rule-engine.test.ts
git commit -m "feat: add plan rule engine"
```

---

## Task 3: Backend — Plans Module with e2e Tests

**Files:**
- Create: `backend/src/plans/plan-presenter.ts`
- Create: `backend/src/plans/claude-notes.service.ts` (stub only — full implementation in Task 4)
- Create: `backend/src/plans/plans.service.ts`
- Create: `backend/src/plans/plans.controller.ts`
- Create: `backend/src/plans/plans.module.ts`
- Modify: `backend/src/app.module.ts`
- Create: `backend/test/seed-helpers.ts`
- Modify: `backend/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing e2e tests**

Create `backend/test/seed-helpers.ts`:

```typescript
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
```

Append these tests to `backend/test/app.e2e-spec.ts` inside the existing `describe` block (after the existing profile tests). First update the `beforeAll` to seed exercises and add `exercise` cleanup to the `beforeEach`. The full updated header of `app.e2e-spec.ts`:

```typescript
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app';
import { seedTestExercises } from './seed-helpers';

describe('AIFitnessPro backend foundation', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await seedTestExercises(prisma);
  });

  beforeEach(async () => {
    await prisma.exerciseAdjustment.deleteMany();
    await prisma.exerciseFeedback.deleteMany();
    await prisma.workoutSet.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.planExercise.deleteMany();
    await prisma.planDay.deleteMany();
    await prisma.trainingPlan.deleteMany();
    await prisma.consentLog.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });
```

Then append the new plan tests inside the `describe` block:

```typescript
  // --- Plan generation tests ---

  it('POST /v1/plans/generate creates a 28-day plan and returns it', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Plan device', externalId: 'plan-gen-device' })
      .expect(201);
    const userId = userRes.body.user.id;

    await request(app.getHttpServer())
      .put('/v1/users/me/profile')
      .set('X-Dev-User-Id', userId)
      .send({
        gender: 'male', age: 25, heightCm: 175, weightKg: 70,
        goal: 'strength', experience: 'beginner', daysPerWeek: 3,
        equipment: ['full_gym'], persona: 'coach',
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/v1/plans/generate')
      .set('X-Dev-User-Id', userId)
      .expect(201);

    expect(response.body.plan.status).toBe('active');
    expect(response.body.plan.days).toHaveLength(28);

    const trainingDays = response.body.plan.days.filter((d: { dayType: string }) => d.dayType !== 'rest');
    expect(trainingDays).toHaveLength(12); // 3 per week × 4 weeks
    expect(trainingDays[0].dayType).toBe('push');
    expect(trainingDays[1].dayType).toBe('pull');
    expect(trainingDays[2].dayType).toBe('legs');
    expect(trainingDays[0].exercises.length).toBeGreaterThan(0);
    expect(trainingDays[0].exercises[0]).toMatchObject({
      nameCn: expect.any(String),
      targetSets: 3,
      targetReps: 10,
      targetRestSeconds: 90,
    });
  });

  it('POST /v1/plans/generate archives the previous active plan', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Archive device', externalId: 'archive-plan-device' })
      .expect(201);
    const userId = userRes.body.user.id;

    await request(app.getHttpServer())
      .put('/v1/users/me/profile')
      .set('X-Dev-User-Id', userId)
      .send({
        gender: 'female', age: 28, heightCm: 168, weightKg: 60,
        goal: 'fitness', experience: 'intermediate', daysPerWeek: 4,
        equipment: ['full_gym'], persona: 'buddy',
      })
      .expect(200);

    const first = await request(app.getHttpServer())
      .post('/v1/plans/generate')
      .set('X-Dev-User-Id', userId)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/v1/plans/generate')
      .set('X-Dev-User-Id', userId)
      .expect(201);

    expect(second.body.plan.id).not.toBe(first.body.plan.id);
    expect(second.body.plan.status).toBe('active');
  });

  it('POST /v1/plans/generate returns 400 when profile is missing', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'No profile device', externalId: 'no-profile-device' })
      .expect(201);
    const userId = userRes.body.user.id;

    const response = await request(app.getHttpServer())
      .post('/v1/plans/generate')
      .set('X-Dev-User-Id', userId)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /v1/plans/active returns the current active plan', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Active plan device', externalId: 'active-plan-device' })
      .expect(201);
    const userId = userRes.body.user.id;

    await request(app.getHttpServer())
      .put('/v1/users/me/profile')
      .set('X-Dev-User-Id', userId)
      .send({
        gender: 'male', age: 30, heightCm: 180, weightKg: 80,
        goal: 'bulk', experience: 'advanced', daysPerWeek: 5,
        equipment: ['full_gym'], persona: 'coach',
      })
      .expect(200);

    const generated = await request(app.getHttpServer())
      .post('/v1/plans/generate')
      .set('X-Dev-User-Id', userId)
      .expect(201);

    const active = await request(app.getHttpServer())
      .get('/v1/plans/active')
      .set('X-Dev-User-Id', userId)
      .expect(200);

    expect(active.body.plan.id).toBe(generated.body.plan.id);
    expect(active.body.plan.days).toHaveLength(28);
  });

  it('GET /v1/plans/active returns 404 when no active plan exists', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'No plan device', externalId: 'no-plan-device' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/plans/active')
      .set('X-Dev-User-Id', userRes.body.user.id)
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });
```

- [ ] **Step 2: Run tests and verify RED**

```bash
cd backend
npm test
```

Expected: FAIL — `POST /v1/plans/generate` and `GET /v1/plans/active` routes do not exist.

- [ ] **Step 3: Add plan presenter**

Create `backend/src/plans/plan-presenter.ts`:

```typescript
import { Exercise, PlanDay, PlanExercise, TrainingPlan } from '@prisma/client';

type PlanWithDays = TrainingPlan & {
  days: (PlanDay & {
    exercises: (PlanExercise & { exercise: Exercise })[];
  })[];
};

export function presentPlan(plan: PlanWithDays) {
  return {
    id: plan.id,
    status: plan.status,
    startDate: plan.startDate?.toISOString().split('T')[0] ?? null,
    days: plan.days.map(day => ({
      dayIndex: day.dayIndex,
      dayType: day.dayType,
      scheduledDate: day.scheduledDate?.toISOString().split('T')[0] ?? null,
      dayNote: day.dayNote ?? null,
      exercises: day.exercises
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(pe => ({
          exerciseId: pe.exerciseId,
          nameCn: pe.exercise.nameCn,
          targetSets: pe.targetSets,
          targetReps: pe.targetReps,
          targetRestSeconds: pe.targetRestSeconds,
          recommendedWeightKg: pe.recommendedWeightKg ? Number(pe.recommendedWeightKg) : null,
        })),
    })),
  };
}
```

- [ ] **Step 4: Add Claude notes stub**

Create `backend/src/plans/claude-notes.service.ts` (stub — full implementation in Task 4):

```typescript
import { Injectable } from '@nestjs/common';

export interface DayNoteInput {
  id: string;
  dayType: string;
  exercises: string[];
}

@Injectable()
export class ClaudeNotesService {
  appendDayNotes(_days: DayNoteInput[]): void {
    // Stub — full implementation added in Task 4
  }
}
```

- [ ] **Step 5: Add plans service**

Create `backend/src/plans/plans.service.ts`:

```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Exercise, PlanDay, PlanExercise, TrainingPlan } from '@prisma/client';
import {
  buildPlanBlueprint,
  EXERCISE_SLUGS_BY_DAY_TYPE,
  TARGETS_BY_EXPERIENCE,
  TrainingDayType,
} from './plan-rule-engine';
import { ClaudeNotesService } from './claude-notes.service';
import { PrismaService } from '../prisma/prisma.service';

type PlanWithDays = TrainingPlan & {
  days: (PlanDay & {
    exercises: (PlanExercise & { exercise: Exercise })[];
  })[];
};

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly claudeNotes: ClaudeNotesService,
  ) {}

  async generate(userId: string): Promise<PlanWithDays> {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '请先完成个人信息填写' });
    }

    await this.prisma.trainingPlan.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'archived' },
    });

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 27);

    const blueprint = buildPlanBlueprint(profile.daysPerWeek as 3 | 4 | 5, startDate);
    const targets = TARGETS_BY_EXPERIENCE[profile.experience] ?? TARGETS_BY_EXPERIENCE['beginner'];

    const allExercises = await this.prisma.exercise.findMany({
      where: { status: 'published', equipment: { hasSome: profile.equipment } },
    });

    const exercisesByDayType: Record<string, typeof allExercises> = {};
    for (const [dayType, slugs] of Object.entries(EXERCISE_SLUGS_BY_DAY_TYPE)) {
      exercisesByDayType[dayType] = allExercises
        .filter(e => slugs.includes(e.slug))
        .slice(0, 3);
    }

    const plan = await this.prisma.trainingPlan.create({
      data: { userId, status: 'active', source: 'rule_engine', startDate, endDate },
    });

    const createdDays: PlanWithDays['days'] = [];

    for (const dayBlueprint of blueprint) {
      const exForDay =
        dayBlueprint.dayType !== 'rest'
          ? (exercisesByDayType[dayBlueprint.dayType] ?? [])
          : [];

      const day = await this.prisma.planDay.create({
        data: {
          trainingPlanId: plan.id,
          dayIndex: dayBlueprint.dayIndex,
          dayType: dayBlueprint.dayType,
          scheduledDate: new Date(dayBlueprint.scheduledDate),
          exercises: {
            create: exForDay.map((ex, i) => ({
              exerciseId: ex.id,
              sortOrder: i,
              targetSets: targets.sets,
              targetReps: targets.reps,
              targetRestSeconds: targets.restSeconds,
            })),
          },
        },
        include: { exercises: { include: { exercise: true } } },
      });

      createdDays.push(day);
    }

    this.claudeNotes.appendDayNotes(
      createdDays
        .filter(d => d.dayType !== 'rest')
        .map(d => ({
          id: d.id,
          dayType: d.dayType,
          exercises: d.exercises.map(e => e.exercise.nameCn),
        })),
    );

    return { ...plan, days: createdDays };
  }

  async getActive(userId: string): Promise<PlanWithDays> {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { userId, status: 'active' },
      include: {
        days: {
          include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } } },
          orderBy: { dayIndex: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: '没有激活的训练计划' });
    }

    return plan;
  }
}
```

- [ ] **Step 6: Add plans controller**

Create `backend/src/plans/plans.controller.ts`:

```typescript
import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { presentPlan } from './plan-presenter';
import { PlansService } from './plans.service';

@Controller('v1/plans')
@UseGuards(DevAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(@CurrentUser() user: User) {
    const plan = await this.plansService.generate(user.id);
    return { plan: presentPlan(plan) };
  }

  @Get('active')
  async getActive(@CurrentUser() user: User) {
    const plan = await this.plansService.getActive(user.id);
    return { plan: presentPlan(plan) };
  }
}
```

- [ ] **Step 7: Add plans module**

Create `backend/src/plans/plans.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ClaudeNotesService } from './claude-notes.service';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  controllers: [PlansController],
  providers: [PlansService, ClaudeNotesService],
})
export class PlansModule {}
```

- [ ] **Step 8: Register PlansModule in AppModule**

Replace the contents of `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DevAuthGuard } from './dev-auth/dev-auth.guard';
import { DevUsersController } from './dev-auth/dev-users.controller';
import { DevUsersService } from './dev-auth/dev-users.service';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [HealthController, DevUsersController, UsersController],
  providers: [HealthService, DevUsersService, DevAuthGuard, UsersService],
})
export class AppModule {}
```

- [ ] **Step 9: Run tests and verify GREEN**

```bash
cd backend
npm test
```

Expected: all existing tests + new plan generation tests PASS.

- [ ] **Step 10: Commit**

```bash
cd backend
git add src/plans/ src/app.module.ts test/seed-helpers.ts test/app.e2e-spec.ts
git commit -m "feat: add plan generation API"
```

---

## Task 4: Backend — Claude Async Day Notes

**Files:**
- Modify: `backend/package.json` (add @anthropic-ai/sdk dependency)
- Modify: `backend/.env.example`
- Modify: `backend/src/plans/claude-notes.service.ts`

- [ ] **Step 1: Install Anthropic SDK**

```bash
cd backend
npm install @anthropic-ai/sdk
```

Expected: `@anthropic-ai/sdk` appears in `backend/package.json` dependencies and `package-lock.json` updated.

- [ ] **Step 2: Add ANTHROPIC_API_KEY to env example**

In `backend/.env.example`, append:

```env
ANTHROPIC_API_KEY=""
```

- [ ] **Step 3: Replace claude-notes.service.ts stub with full implementation**

Replace the full contents of `backend/src/plans/claude-notes.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

export interface DayNoteInput {
  id: string;
  dayType: string;
  exercises: string[];
}

@Injectable()
export class ClaudeNotesService {
  private readonly logger = new Logger(ClaudeNotesService.name);
  private readonly client: Anthropic | null;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  appendDayNotes(days: DayNoteInput[]): void {
    if (!this.client) return;
    void this.generateNotes(days);
  }

  private async generateNotes(days: DayNoteInput[]): Promise<void> {
    for (const day of days) {
      try {
        const message = await this.client!.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 60,
          messages: [
            {
              role: 'user',
              content: `你是中文健身教练。为以下训练日生成一句激励语（不超过20个中文字符，只输出激励语本身）：\n训练类型：${day.dayType}\n动作：${day.exercises.join('、')}`,
            },
          ],
        });

        const block = message.content[0];
        const note = block.type === 'text' ? block.text.trim() : null;
        if (note) {
          await this.prisma.planDay.update({
            where: { id: day.id },
            data: { dayNote: note },
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to generate day note for ${day.id}: ${String(error)}`);
      }
    }
  }
}
```

- [ ] **Step 4: Run existing tests to confirm nothing broken**

```bash
cd backend
npm test
```

Expected: all tests PASS (Claude notes are skipped when `ANTHROPIC_API_KEY` is not set).

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/plans/claude-notes.service.ts .env.example package.json package-lock.json
git commit -m "feat: add Claude async day notes service"
```

---

## Task 5: Android — API Interfaces, Models, and Client Extensions

**Files:**
- Create: `android/app/src/main/java/com/aifitnesspro/android/core/api/ProfileApi.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/core/api/PlanApi.kt`
- Create: `android/app/src/main/java/com/aifitnesspro/android/core/api/PlanModels.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/core/api/ApiModels.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/core/api/AIFitnessApiClient.kt`
- Modify: `android/app/src/test/java/com/aifitnesspro/android/core/api/AIFitnessApiClientTest.kt`

- [ ] **Step 1: Add failing unit tests for new client methods**

In `android/app/src/test/java/com/aifitnesspro/android/core/api/AIFitnessApiClientTest.kt`, append these tests inside the existing class. First read the existing file and append:

```kotlin
    @Test
    fun upsertProfileReturnsUserOnSuccess() = runTest {
        val transport = FakeTransport(
            statusCode = 200,
            body = """{"user":{"id":"u1","deviceLabel":"Pixel","onboardingCompleted":true,"createdAt":"2026-05-20T00:00:00Z"}}"""
        )
        val client = AIFitnessApiClient(transport)

        val result = client.upsertProfile(
            devUserId = "u1",
            request = UpsertProfileRequest(
                gender = "male", age = 25, heightCm = 175, weightKg = 70.0,
                goal = "strength", experience = "beginner", daysPerWeek = 3,
                equipment = listOf("full_gym"), persona = "coach"
            )
        )

        assertEquals("u1", result.id)
        assertEquals(true, result.onboardingCompleted)
        assertEquals("PUT", transport.lastRequest.method)
        assertEquals("v1/users/me/profile", transport.lastRequest.path)
        assertEquals("u1", transport.lastRequest.headers["X-Dev-User-Id"])
    }

    @Test
    fun generatePlanReturnsPlanOnSuccess() = runTest {
        val planJson = """{"plan":{"id":"p1","status":"active","startDate":"2026-05-20","days":[]}}"""
        val transport = FakeTransport(statusCode = 201, body = planJson)
        val client = AIFitnessApiClient(transport)

        val result = client.generatePlan("u1")

        assertEquals("p1", result.id)
        assertEquals("active", result.status)
        assertEquals("POST", transport.lastRequest.method)
        assertEquals("v1/plans/generate", transport.lastRequest.path)
    }

    @Test
    fun getActivePlanReturnsPlanOnSuccess() = runTest {
        val planJson = """{"plan":{"id":"p2","status":"active","startDate":"2026-05-20","days":[]}}"""
        val transport = FakeTransport(statusCode = 200, body = planJson)
        val client = AIFitnessApiClient(transport)

        val result = client.getActivePlan("u1")

        assertEquals("p2", result.id)
        assertEquals("GET", transport.lastRequest.method)
        assertEquals("v1/plans/active", transport.lastRequest.path)
    }
```

Also add a `FakeTransport` that tracks `lastRequest` if the existing test file uses a different fake. Read the existing `AIFitnessApiClientTest.kt` first and confirm the fake transport pattern used, then add the `lastRequest` tracking field if missing.

The existing fake in `AIFitnessApiClientTest.kt` probably looks like:

```kotlin
private class FakeTransport(
    private val statusCode: Int,
    private val body: String
) : ApiTransport {
    lateinit var lastRequest: ApiRequest

    override suspend fun execute(request: ApiRequest): ApiResponse {
        lastRequest = request
        return ApiResponse(statusCode = statusCode, body = body)
    }
}
```

Verify that `lastRequest` field exists; add it if not.

- [ ] **Step 2: Run Android unit tests and verify RED**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:testDebugUnitTest 2>&1 | tail -30
```

Expected: FAIL — `upsertProfile`, `generatePlan`, `getActivePlan`, `UpsertProfileRequest`, `ApiActivePlan` not found.

- [ ] **Step 3: Add ProfileApi interface**

Create `android/app/src/main/java/com/aifitnesspro/android/core/api/ProfileApi.kt`:

```kotlin
package com.aifitnesspro.android.core.api

interface ProfileApi {
    suspend fun upsertProfile(devUserId: String, request: UpsertProfileRequest): ApiUser
}
```

- [ ] **Step 4: Add plan models**

Create `android/app/src/main/java/com/aifitnesspro/android/core/api/PlanModels.kt`:

```kotlin
package com.aifitnesspro.android.core.api

import kotlinx.serialization.Serializable

@Serializable
data class ApiPlanExercise(
    val exerciseId: String,
    val nameCn: String,
    val targetSets: Int,
    val targetReps: Int,
    val targetRestSeconds: Int,
    val recommendedWeightKg: Double? = null
)

@Serializable
data class ApiPlanDay(
    val dayIndex: Int,
    val dayType: String,
    val scheduledDate: String?,
    val dayNote: String? = null,
    val exercises: List<ApiPlanExercise> = emptyList()
)

@Serializable
data class ApiActivePlan(
    val id: String,
    val status: String,
    val startDate: String?,
    val days: List<ApiPlanDay> = emptyList()
)

@Serializable
internal data class PlanEnvelope(val plan: ApiActivePlan)
```

- [ ] **Step 5: Add PlanApi interface**

Create `android/app/src/main/java/com/aifitnesspro/android/core/api/PlanApi.kt`:

```kotlin
package com.aifitnesspro.android.core.api

interface PlanApi {
    suspend fun generatePlan(devUserId: String): ApiActivePlan
    suspend fun getActivePlan(devUserId: String): ApiActivePlan
}
```

- [ ] **Step 6: Add UpsertProfileRequest to ApiModels**

In `android/app/src/main/java/com/aifitnesspro/android/core/api/ApiModels.kt`, add after the existing `CreateDevelopmentUserRequest` class:

```kotlin
@Serializable
data class UpsertProfileRequest(
    val gender: String,
    val age: Int,
    val heightCm: Int,
    val weightKg: Double,
    val goal: String,
    val experience: String,
    val daysPerWeek: Int,
    val equipment: List<String>,
    val persona: String
)
```

- [ ] **Step 7: Extend AIFitnessApiClient to implement ProfileApi and PlanApi**

Replace the full class declaration line in `AIFitnessApiClient.kt` — change:

```kotlin
class AIFitnessApiClient(
    private val transport: ApiTransport,
    private val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }
) : DevelopmentApi {
```

to:

```kotlin
class AIFitnessApiClient(
    private val transport: ApiTransport,
    private val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }
) : DevelopmentApi, ProfileApi, PlanApi {
```

Then append these three methods before the private `decodeOrThrow` method:

```kotlin
    override suspend fun upsertProfile(devUserId: String, request: UpsertProfileRequest): ApiUser {
        val response = transport.execute(
            ApiRequest(
                method = "PUT",
                path = "v1/users/me/profile",
                headers = mapOf(
                    "Content-Type" to "application/json; charset=utf-8",
                    "X-Dev-User-Id" to devUserId
                ),
                body = json.encodeToString(request)
            )
        )
        return decodeOrThrow<UserEnvelope>(response).user
    }

    override suspend fun generatePlan(devUserId: String): ApiActivePlan {
        val response = transport.execute(
            ApiRequest(
                method = "POST",
                path = "v1/plans/generate",
                headers = mapOf(
                    "Content-Type" to "application/json; charset=utf-8",
                    "X-Dev-User-Id" to devUserId
                ),
                body = "{}"
            )
        )
        return decodeOrThrow<PlanEnvelope>(response).plan
    }

    override suspend fun getActivePlan(devUserId: String): ApiActivePlan {
        val response = transport.execute(
            ApiRequest(
                method = "GET",
                path = "v1/plans/active",
                headers = mapOf("X-Dev-User-Id" to devUserId)
            )
        )
        return decodeOrThrow<PlanEnvelope>(response).plan
    }
```

- [ ] **Step 8: Run tests and verify GREEN**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:testDebugUnitTest 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
cd android
git add app/src/main/java/com/aifitnesspro/android/core/api/ \
        app/src/test/java/com/aifitnesspro/android/core/api/
git commit -m "feat: add Android profile and plan API client"
```

---

## Task 6: Android — PlanRepository with DataStore

**Files:**
- Create: `android/app/src/main/java/com/aifitnesspro/android/core/plan/PlanRepository.kt`
- Create: `android/app/src/test/java/com/aifitnesspro/android/core/plan/PlanRepositoryTest.kt`

- [ ] **Step 1: Write failing unit tests**

Create `android/app/src/test/java/com/aifitnesspro/android/core/plan/PlanRepositoryTest.kt`:

```kotlin
package com.aifitnesspro.android.core.plan

import com.aifitnesspro.android.core.api.ApiActivePlan
import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.api.ApiPlanExercise
import com.aifitnesspro.android.core.api.PlanApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PlanRepositoryTest {

    @Test
    fun getActivePlanReturnsNullWhenNoPlanStored() = runTest {
        val store = InMemoryPlanStore()
        val repo = PlanRepository(store = store, api = FakePlanApi())

        assertNull(repo.getActivePlan().first())
    }

    @Test
    fun generateAndCacheSavesPlanToStore() = runTest {
        val plan = makePlan("plan-1")
        val store = InMemoryPlanStore()
        val repo = PlanRepository(store = store, api = FakePlanApi(generatedPlan = plan))

        repo.generateAndCache("user-1")

        assertEquals("plan-1", repo.getActivePlan().first()?.id)
    }

    @Test
    fun refreshFromRemoteUpdatesCachedPlan() = runTest {
        val initial = makePlan("plan-old")
        val updated = makePlan("plan-new")
        val store = InMemoryPlanStore()
        store.savePlan(initial)
        val repo = PlanRepository(store = store, api = FakePlanApi(activePlan = updated))

        repo.refreshFromRemote("user-1")

        assertEquals("plan-new", repo.getActivePlan().first()?.id)
    }

    @Test
    fun refreshFromRemoteKeepsCachedPlanOnNetworkError() = runTest {
        val initial = makePlan("plan-cached")
        val store = InMemoryPlanStore()
        store.savePlan(initial)
        val repo = PlanRepository(store = store, api = ThrowingPlanApi())

        repo.refreshFromRemote("user-1")

        assertEquals("plan-cached", repo.getActivePlan().first()?.id)
    }

    @Test
    fun findTodayDayReturnsDayMatchingDate() {
        val days = listOf(
            makeDay(dayIndex = 0, scheduledDate = "2026-05-20", dayType = "push"),
            makeDay(dayIndex = 1, scheduledDate = "2026-05-21", dayType = "pull"),
            makeDay(dayIndex = 2, scheduledDate = "2026-05-22", dayType = "rest"),
        )
        val plan = ApiActivePlan(id = "p1", status = "active", startDate = "2026-05-20", days = days)

        val today = findTodayDay(plan, "2026-05-21")

        assertEquals("pull", today?.dayType)
    }

    @Test
    fun findTodayDayReturnsNullWhenNoMatch() {
        val plan = ApiActivePlan(id = "p1", status = "active", startDate = "2026-05-20", days = emptyList())
        assertNull(findTodayDay(plan, "2026-06-30"))
    }
}

private fun makePlan(id: String) = ApiActivePlan(
    id = id, status = "active", startDate = "2026-05-20", days = emptyList()
)

private fun makeDay(dayIndex: Int, scheduledDate: String, dayType: String) = ApiPlanDay(
    dayIndex = dayIndex, dayType = dayType, scheduledDate = scheduledDate
)

private class InMemoryPlanStore : PlanStore {
    private val flow = MutableStateFlow<ApiActivePlan?>(null)

    override fun getPlan() = flow

    override suspend fun savePlan(plan: ApiActivePlan) {
        flow.value = plan
    }
}

private class FakePlanApi(
    private val generatedPlan: ApiActivePlan = makePlan("generated"),
    private val activePlan: ApiActivePlan = makePlan("active")
) : PlanApi {
    override suspend fun generatePlan(devUserId: String) = generatedPlan
    override suspend fun getActivePlan(devUserId: String) = activePlan
}

private class ThrowingPlanApi : PlanApi {
    override suspend fun generatePlan(devUserId: String): ApiActivePlan = throw RuntimeException("network error")
    override suspend fun getActivePlan(devUserId: String): ApiActivePlan = throw RuntimeException("network error")
}
```

- [ ] **Step 2: Run tests and verify RED**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:testDebugUnitTest 2>&1 | tail -20
```

Expected: FAIL — `PlanRepository`, `PlanStore`, `findTodayDay` not found.

- [ ] **Step 3: Implement PlanRepository**

Create `android/app/src/main/java/com/aifitnesspro/android/core/plan/PlanRepository.kt`:

```kotlin
package com.aifitnesspro.android.core.plan

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.aifitnesspro.android.core.api.ApiActivePlan
import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.api.PlanApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.planDataStore by preferencesDataStore(name = "active_plan")

interface PlanStore {
    fun getPlan(): Flow<ApiActivePlan?>
    suspend fun savePlan(plan: ApiActivePlan)
}

class DataStorePlanStore(private val context: Context) : PlanStore {
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    override fun getPlan(): Flow<ApiActivePlan?> = context.planDataStore.data.map { prefs ->
        prefs[KEY_PLAN_JSON]?.let { runCatching { json.decodeFromString<ApiActivePlan>(it) }.getOrNull() }
    }

    override suspend fun savePlan(plan: ApiActivePlan) {
        context.planDataStore.edit { prefs ->
            prefs[KEY_PLAN_JSON] = json.encodeToString(plan)
        }
    }

    companion object {
        private val KEY_PLAN_JSON = stringPreferencesKey("plan_json")
    }
}

class PlanRepository(
    private val store: PlanStore,
    private val api: PlanApi
) {
    fun getActivePlan(): Flow<ApiActivePlan?> = store.getPlan()

    suspend fun generateAndCache(devUserId: String) {
        val plan = api.generatePlan(devUserId)
        store.savePlan(plan)
    }

    suspend fun refreshFromRemote(devUserId: String) {
        runCatching { api.getActivePlan(devUserId) }.onSuccess { store.savePlan(it) }
    }
}

fun findTodayDay(plan: ApiActivePlan, todayDate: String): ApiPlanDay? =
    plan.days.find { it.scheduledDate == todayDate }
```

- [ ] **Step 4: Run tests and verify GREEN**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:testDebugUnitTest 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
cd android
git add app/src/main/java/com/aifitnesspro/android/core/plan/ \
        app/src/test/java/com/aifitnesspro/android/core/plan/
git commit -m "feat: add Android plan repository"
```

---

## Task 7: Android — OnboardingScreen (6-Step Wizard)

**Files:**
- Create: `android/app/src/main/java/com/aifitnesspro/android/feature/onboarding/OnboardingScreen.kt`

- [ ] **Step 1: Create OnboardingScreen**

Create `android/app/src/main/java/com/aifitnesspro/android/feature/onboarding/OnboardingScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.onboarding

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.aifitnesspro.android.core.api.UpsertProfileRequest

data class OnboardingFormState(
    val goal: String = "",
    val experience: String = "",
    val equipment: List<String> = emptyList(),
    val gender: String = "",
    val age: String = "",
    val heightCm: String = "",
    val weightKg: String = "",
    val daysPerWeek: Int = 0,
    val persona: String = ""
) {
    private val ageInt get() = age.toIntOrNull() ?: -1
    private val heightInt get() = heightCm.toIntOrNull() ?: -1
    private val weightDouble get() = weightKg.toDoubleOrNull() ?: -1.0

    fun isStepValid(step: Int): Boolean = when (step) {
        1 -> goal.isNotBlank()
        2 -> experience.isNotBlank()
        3 -> equipment.isNotEmpty()
        4 -> gender.isNotBlank() && ageInt in 16..65 && heightInt in 140..220 && weightDouble in 30.0..200.0
        5 -> daysPerWeek in 3..5
        6 -> persona.isNotBlank()
        else -> false
    }

    fun toRequest() = UpsertProfileRequest(
        gender = gender,
        age = ageInt,
        heightCm = heightInt,
        weightKg = weightDouble,
        goal = goal,
        experience = experience,
        daysPerWeek = daysPerWeek,
        equipment = equipment,
        persona = persona
    )
}

@Composable
fun OnboardingScreen(onComplete: suspend (OnboardingFormState) -> Unit) {
    var step by rememberSaveable { mutableIntStateOf(1) }
    var goal by rememberSaveable { mutableStateOf("") }
    var experience by rememberSaveable { mutableStateOf("") }
    var equipment by rememberSaveable { mutableStateOf(listOf<String>()) }
    var gender by rememberSaveable { mutableStateOf("") }
    var age by rememberSaveable { mutableStateOf("") }
    var heightCm by rememberSaveable { mutableStateOf("") }
    var weightKg by rememberSaveable { mutableStateOf("") }
    var daysPerWeek by rememberSaveable { mutableIntStateOf(0) }
    var persona by rememberSaveable { mutableStateOf("") }
    var submitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val formState = OnboardingFormState(
        goal = goal, experience = experience, equipment = equipment,
        gender = gender, age = age, heightCm = heightCm, weightKg = weightKg,
        daysPerWeek = daysPerWeek, persona = persona
    )
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        LinearProgressIndicator(
            progress = { step / 6f },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text("步骤 $step / 6", style = MaterialTheme.typography.labelMedium)
        Spacer(modifier = Modifier.height(24.dp))

        when (step) {
            1 -> StepGoal(selected = goal, onSelect = { goal = it })
            2 -> StepExperience(selected = experience, onSelect = { experience = it })
            3 -> StepEquipment(selected = equipment, onToggle = { item ->
                equipment = if (equipment.contains(item)) equipment - item else equipment + item
            })
            4 -> StepBodyData(
                gender = gender, age = age, heightCm = heightCm, weightKg = weightKg,
                onGender = { gender = it }, onAge = { age = it },
                onHeightCm = { heightCm = it }, onWeightKg = { weightKg = it }
            )
            5 -> StepDaysPerWeek(selected = daysPerWeek, onSelect = { daysPerWeek = it })
            6 -> StepPersona(selected = persona, onSelect = { persona = it })
        }

        errorMessage?.let {
            Spacer(modifier = Modifier.height(12.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            if (step > 1) {
                OutlinedButton(
                    onClick = { step--; errorMessage = null },
                    modifier = Modifier.weight(1f),
                    enabled = !submitting
                ) { Text("上一步") }
            }
            Button(
                onClick = {
                    if (step < 6) {
                        step++
                        errorMessage = null
                    } else {
                        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launch {
                            submitting = true
                            errorMessage = null
                            try {
                                onComplete(formState)
                            } catch (e: Exception) {
                                errorMessage = e.message ?: "提交失败，请重试"
                                submitting = false
                            }
                        }
                    }
                },
                modifier = Modifier.weight(1f),
                enabled = formState.isStepValid(step) && !submitting
            ) {
                Text(when {
                    submitting -> "提交中…"
                    step == 6 -> "完成"
                    else -> "下一步"
                })
            }
        }
    }
}

@Composable
private fun StepGoal(selected: String, onSelect: (String) -> Unit) {
    val options = listOf(
        "strength" to "增肌力量", "cut" to "减脂塑形", "bulk" to "增肌增重", "fitness" to "综合健康"
    )
    StepCardGroup(title = "你的训练目标是什么？", options = options, selected = selected, onSelect = onSelect)
}

@Composable
private fun StepExperience(selected: String, onSelect: (String) -> Unit) {
    val options = listOf(
        "beginner" to "新手（< 1年）", "intermediate" to "进阶（1–3年）", "advanced" to "高阶（3年以上）"
    )
    StepCardGroup(title = "你的训练经验？", options = options, selected = selected, onSelect = onSelect)
}

@Composable
private fun StepEquipment(selected: List<String>, onToggle: (String) -> Unit) {
    val options = listOf(
        "full_gym" to "完整健身房", "barbell_bench" to "杠铃+卧推凳",
        "dumbbell_only" to "仅哑铃", "bodyweight" to "徒手"
    )
    Column {
        Text("你能用到哪些器械？", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("可多选", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(16.dp))
        options.forEach { (key, label) ->
            val isSelected = selected.contains(key)
            OutlinedButton(
                onClick = { onToggle(key) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                border = BorderStroke(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                )
            ) { Text(label) }
        }
    }
}

@Composable
private fun StepBodyData(
    gender: String, age: String, heightCm: String, weightKg: String,
    onGender: (String) -> Unit, onAge: (String) -> Unit,
    onHeightCm: (String) -> Unit, onWeightKg: (String) -> Unit
) {
    Column {
        Text("基本体测信息", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        Text("性别", style = MaterialTheme.typography.labelLarge)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("male" to "男", "female" to "女", "other" to "其他").forEach { (key, label) ->
                FilterChip(selected = gender == key, onClick = { onGender(key) }, label = { Text(label) })
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = age, onValueChange = onAge,
            label = { Text("年龄（16–65岁）") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            isError = age.isNotBlank() && (age.toIntOrNull() ?: -1) !in 16..65,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = heightCm, onValueChange = onHeightCm,
            label = { Text("身高（140–220cm）") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            isError = heightCm.isNotBlank() && (heightCm.toIntOrNull() ?: -1) !in 140..220,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = weightKg, onValueChange = onWeightKg,
            label = { Text("体重（30–200kg）") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            isError = weightKg.isNotBlank() && (weightKg.toDoubleOrNull() ?: -1.0) !in 30.0..200.0,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun StepDaysPerWeek(selected: Int, onSelect: (Int) -> Unit) {
    val options = listOf(3 to "每周3天", 4 to "每周4天", 5 to "每周5天")
    Column {
        Text("每周训练几天？", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        options.forEach { (days, label) ->
            val isSelected = selected == days
            OutlinedButton(
                onClick = { onSelect(days) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                border = BorderStroke(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                )
            ) { Text(label) }
        }
    }
}

@Composable
private fun StepPersona(selected: String, onSelect: (String) -> Unit) {
    val options = listOf(
        "coach" to "严格教练 🎯", "buddy" to "训练搭档 💪",
        "comedian" to "幽默段子手 😄", "beauty_coach" to "美丽导师 ✨"
    )
    StepCardGroup(title = "选择你喜欢的陪伴风格", options = options, selected = selected, onSelect = onSelect)
}

@Composable
private fun StepCardGroup(
    title: String,
    options: List<Pair<String, String>>,
    selected: String,
    onSelect: (String) -> Unit
) {
    Column {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        options.forEach { (key, label) ->
            val isSelected = selected == key
            OutlinedButton(
                onClick = { onSelect(key) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                border = BorderStroke(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                ),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                )
            ) { Text(label) }
        }
    }
}
```

- [ ] **Step 2: Build to verify compilation**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:assembleDebug 2>&1 | tail -20
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```bash
cd android
git add app/src/main/java/com/aifitnesspro/android/feature/onboarding/
git commit -m "feat: add onboarding screen"
```

---

## Task 8: Android — HomeScreen Today Card

**Files:**
- Modify: `android/app/src/main/java/com/aifitnesspro/android/feature/home/HomeScreen.kt`

- [ ] **Step 1: Replace HomeScreen with today card implementation**

Replace the full contents of `android/app/src/main/java/com/aifitnesspro/android/feature/home/HomeScreen.kt`:

```kotlin
package com.aifitnesspro.android.feature.home

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aifitnesspro.android.core.api.ApiPlanDay
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.plan.findTodayDay
import java.time.LocalDate

@Composable
fun HomeScreen(
    planRepository: PlanRepository,
    devUserId: String?
) {
    val plan by planRepository.getActivePlan().collectAsState(initial = null)
    val todayDate = remember { LocalDate.now().toString() }
    val todayDay = plan?.let { findTodayDay(it, todayDate) }

    LaunchedEffect(devUserId) {
        if (devUserId != null) {
            runCatching { planRepository.refreshFromRemote(devUserId) }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        Text("今日训练", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        when {
            plan == null -> NoPlanCard()
            todayDay == null || todayDay.dayType == "rest" -> RestDayCard()
            else -> TodayWorkoutCard(day = todayDay)
        }
    }
}

@Composable
private fun NoPlanCard() {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text("正在准备你的训练计划…", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "完成个人信息填写后，计划将自动生成并显示在这里。",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun RestDayCard() {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text("今日休息 🛌", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("好好恢复，明天继续！", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun TodayWorkoutCard(day: ApiPlanDay) {
    val dayLabel = when (day.dayType) {
        "push" -> "Push 推力日"
        "pull" -> "Pull 拉力日"
        "legs" -> "Legs 腿日"
        "full_body" -> "全身训练日"
        else -> day.dayType
    }
    val estimatedMinutes = estimateDuration(day)
    val previewNames = day.exercises.take(3).map { it.nameCn }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text("Day ${day.dayIndex + 1} · $dayLabel", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                "${day.exercises.size} 个动作 · 预计 $estimatedMinutes 分钟",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (previewNames.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(previewNames.joinToString(" / "), style = MaterialTheme.typography.bodyMedium)
            }
            day.dayNote?.let { note ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(note, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
                Text("开始训练")
            }
        }
    }
}

private fun estimateDuration(day: ApiPlanDay): Int {
    val totalSeconds = day.exercises.sumOf { ex ->
        ex.targetSets * (ex.targetReps * 4 + ex.targetRestSeconds)
    }
    val minutes = (totalSeconds / 60)
    return ((minutes + 4) / 5) * 5 // round up to nearest 5
}
```

- [ ] **Step 2: Build to verify compilation**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:assembleDebug 2>&1 | tail -20
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```bash
cd android
git add app/src/main/java/com/aifitnesspro/android/feature/home/HomeScreen.kt
git commit -m "feat: add HomeScreen today workout card"
```

---

## Task 9: Android — Wire Routing, AppNavHost, MainActivity

**Files:**
- Modify: `android/app/src/main/java/com/aifitnesspro/android/navigation/AppNavHost.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/AIFitnessProApp.kt`
- Modify: `android/app/src/main/java/com/aifitnesspro/android/MainActivity.kt`

- [ ] **Step 1: Update AppNavHost to accept planRepository**

Replace the full contents of `android/app/src/main/java/com/aifitnesspro/android/navigation/AppNavHost.kt`:

```kotlin
package com.aifitnesspro.android.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.session.ApiConnectionState
import com.aifitnesspro.android.feature.exercise.ExerciseLibraryScreen
import com.aifitnesspro.android.feature.home.HomeScreen
import com.aifitnesspro.android.feature.profile.ProfileScreen
import com.aifitnesspro.android.feature.training.TrainingScreen

@Composable
fun AppNavHost(
    apiConnectionState: ApiConnectionState,
    planRepository: PlanRepository
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: AppDestination.Home.route
    val devUserId = (apiConnectionState as? ApiConnectionState.Connected)?.user?.id

    Scaffold(
        bottomBar = {
            NavigationBar {
                AppDestination.bottomTabs.forEach { destination ->
                    NavigationBarItem(
                        selected = currentRoute == destination.route,
                        onClick = {
                            if (currentRoute != destination.route) {
                                navController.navigate(destination.route) {
                                    popUpTo(AppDestination.Home.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        label = { Text(destination.label) },
                        icon = { Text(destination.label.take(1)) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = AppDestination.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(AppDestination.Home.route) {
                HomeScreen(planRepository = planRepository, devUserId = devUserId)
            }
            composable(AppDestination.Training.route) { TrainingScreen() }
            composable(AppDestination.Exercise.route) { ExerciseLibraryScreen() }
            composable(AppDestination.Profile.route) {
                ProfileScreen(apiConnectionState = apiConnectionState)
            }
        }
    }
}
```

- [ ] **Step 2: Update AIFitnessProApp for onboarding routing**

Replace the full contents of `android/app/src/main/java/com/aifitnesspro/android/AIFitnessProApp.kt`:

```kotlin
package com.aifitnesspro.android

import androidx.compose.runtime.*
import com.aifitnesspro.android.core.api.AIFitnessApiClient
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.session.ApiConnectionState
import com.aifitnesspro.android.core.session.ApiSessionRepository
import com.aifitnesspro.android.core.settings.ConsentRepository
import com.aifitnesspro.android.core.settings.ConsentState
import com.aifitnesspro.android.feature.consent.ConsentScreen
import com.aifitnesspro.android.feature.onboarding.OnboardingScreen
import com.aifitnesspro.android.navigation.AppNavHost
import kotlinx.coroutines.launch

private const val PRIVACY_VERSION = "2026-05-18"
private const val TERMS_VERSION = "2026-05-18"

@Composable
fun AIFitnessProApp(
    consentRepository: ConsentRepository,
    apiSessionRepository: ApiSessionRepository,
    apiClient: AIFitnessApiClient,
    planRepository: PlanRepository
) {
    val scope = rememberCoroutineScope()
    val consent by consentRepository.consentState.collectAsState(initial = ConsentState.Empty)
    var apiConnectionState by remember { mutableStateOf<ApiConnectionState>(ApiConnectionState.Idle) }
    var onboardingCompleted by remember { mutableStateOf(false) }

    if (consent.isCurrent(PRIVACY_VERSION, TERMS_VERSION)) {
        LaunchedEffect(apiSessionRepository) {
            apiConnectionState = ApiConnectionState.Connecting
            apiConnectionState = runCatching {
                val user = apiSessionRepository.ensureDevelopmentUser()
                onboardingCompleted = user.onboardingCompleted
                ApiConnectionState.Connected(user)
            }.getOrElse { error ->
                ApiConnectionState.Failed(error.message ?: "无法连接本地后端")
            }
        }

        val connected = apiConnectionState as? ApiConnectionState.Connected
        if (connected != null && !onboardingCompleted) {
            OnboardingScreen(
                onComplete = { formState ->
                    apiClient.upsertProfile(connected.user.id, formState.toRequest())
                    planRepository.generateAndCache(connected.user.id)
                    onboardingCompleted = true
                }
            )
        } else {
            AppNavHost(
                apiConnectionState = apiConnectionState,
                planRepository = planRepository
            )
        }
    } else {
        ConsentScreen(
            privacyVersion = PRIVACY_VERSION,
            termsVersion = TERMS_VERSION,
            onAccept = {
                scope.launch { consentRepository.accept(PRIVACY_VERSION, TERMS_VERSION) }
            },
            onDecline = {}
        )
    }
}
```

- [ ] **Step 3: Update MainActivity to wire PlanRepository and pass apiClient**

Replace the full contents of `android/app/src/main/java/com/aifitnesspro/android/MainActivity.kt`:

```kotlin
package com.aifitnesspro.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.aifitnesspro.android.core.api.AIFitnessApiClient
import com.aifitnesspro.android.core.api.ApiConfig
import com.aifitnesspro.android.core.api.HttpUrlConnectionTransport
import com.aifitnesspro.android.core.plan.DataStorePlanStore
import com.aifitnesspro.android.core.plan.PlanRepository
import com.aifitnesspro.android.core.session.AndroidDeviceIdentityProvider
import com.aifitnesspro.android.core.session.ApiSessionRepository
import com.aifitnesspro.android.core.session.DataStoreApiSessionStore
import com.aifitnesspro.android.core.settings.ConsentRepository
import com.aifitnesspro.android.core.ui.AIFitnessProTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val consentRepository = ConsentRepository(applicationContext)
        val apiClient = AIFitnessApiClient(
            transport = HttpUrlConnectionTransport(ApiConfig.backendBaseUrl)
        )
        val apiSessionRepository = ApiSessionRepository(
            api = apiClient,
            store = DataStoreApiSessionStore(applicationContext),
            deviceIdentity = AndroidDeviceIdentityProvider(applicationContext).get()
        )
        val planRepository = PlanRepository(
            store = DataStorePlanStore(applicationContext),
            api = apiClient
        )
        setContent {
            AIFitnessProTheme {
                AIFitnessProApp(
                    consentRepository = consentRepository,
                    apiSessionRepository = apiSessionRepository,
                    apiClient = apiClient,
                    planRepository = planRepository
                )
            }
        }
    }
}
```

- [ ] **Step 4: Run all Android unit tests**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:testDebugUnitTest 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 5: Build debug APK**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:assembleDebug 2>&1 | tail -10
```

Expected: BUILD SUCCESSFUL. APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 6: Commit**

```bash
cd android
git add app/src/main/java/com/aifitnesspro/android/
git commit -m "feat: wire onboarding routing and plan repository"
```

---

## Task 10: Final Verification and Context Update

**Files:**
- Modify: `docs/PROJECT_CONTEXT.md`
- Modify: `docs/superpowers/plans/2026-05-20-plan3-onboarding-training-plan.md`

- [ ] **Step 1: Run backend full test suite**

```bash
cd backend
npm test
```

Expected: all e2e tests PASS (health + dev user + current user + profile + plan generation).

- [ ] **Step 2: Run backend unit tests**

```bash
cd backend
npm run test:unit
```

Expected: all plan rule engine tests PASS.

- [ ] **Step 3: Run backend build**

```bash
cd backend
npm run build
```

Expected: TypeScript build passes.

- [ ] **Step 4: Run Android tests**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:testDebugUnitTest 2>&1 | tail -10
```

Expected: all tests PASS.

- [ ] **Step 5: Build Android APK**

```bash
cd android
ANDROID_HOME=/Users/steve/Library/Android/sdk JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ./gradlew :app:assembleDebug 2>&1 | tail -10
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: Update PROJECT_CONTEXT.md**

Replace section 3 (`当前开发阶段`) and update sections 4–12 in `docs/PROJECT_CONTEXT.md`:

```
当前开发阶段：Plan 3 - Onboarding + Training Plan Generation implemented.

当前运行状态：Plan 1 (Android shell) + Plan 2 (backend foundation) + Plan 3 (API client slice) 已合并 main；Plan 3 onboarding + plan generation 已在当前 worktree 实现：6 步 Onboarding 向导、PUT profile 连接、后端 PPL 规则引擎 + Claude 异步备注、DataStore 计划缓存、HomeScreen 今日计划卡片。
```

Update 当前未完成事项 to:
```
- 生产认证（X-Dev-User-Id 开发身份仍在使用）。
- Room 数据库（训练 Session 本地存储，Plan 4）。
- 训练 Session 循环（Plan 4）。
- 动作库 70+ 条内容与媒体（Plan 5）。
- 营养、成就、账号注销（Plan 6）。
- 国内应用市场提交（Plan 7）。
```

Update 下一步开发任务 to:
```
1. 手动烟测：启动后端，安装 debug APK，走完 Onboarding，验证 HomeScreen 今日计划卡片。
2. 将 Plan 3 分支合并到 main。
3. 继续 Plan 4：原生训练 Session 循环（状态机、组/次/重量记录、休息计时器、完成摘要）。
```

- [ ] **Step 7: Commit context update**

```bash
git add docs/PROJECT_CONTEXT.md docs/superpowers/plans/2026-05-20-plan3-onboarding-training-plan.md
git commit -m "docs: update context after Plan 3 onboarding and plan generation"
```

---

## Final Verification Gate

Before claiming Plan 3 complete, all of the following must pass:

```bash
# Backend
cd backend && npm test && npm run test:unit && npm run build

# Android
cd android && \
  ANDROID_HOME=/Users/steve/Library/Android/sdk \
  JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
  ./gradlew :app:testDebugUnitTest :app:assembleDebug
```

Manual smoke test (requires Docker + AVD):
1. `cd backend && docker compose up -d postgres && npm run prisma:migrate && npm run seed && npm start`
2. Start AVD `AIFitnessPro_API35`, install `app-debug.apk`
3. Accept privacy consent
4. Complete all 6 onboarding steps
5. Verify HomeScreen shows today's workout card with exercise list
6. Verify rest day shows rest card (check a rest-day date if needed)

## Known Deliberate Exclusions

- Production authentication (X-Dev-User-Id dev auth continues)
- Room database (DataStore JSON blob for plan cache — migration to Room in Plan 4)
- Full workout session loop (Plan 4)
- Exercise library content beyond core 10 seed (Plan 5)
- Push notifications
- Nutrition and achievements (Plan 6)
