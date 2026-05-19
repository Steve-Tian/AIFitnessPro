# Backend API and Database Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the independent NestJS + PostgreSQL + Prisma backend foundation for AIFitnessPro with migrations and testable health/user/profile endpoints.

**Architecture:** Add a new `backend/` service at the repository root. Use NestJS modules for `health`, `dev-auth`, `users`, and `prisma`; use Prisma migrations for PostgreSQL schema ownership; use Supertest/Jest e2e tests to prove the API contract.

**Tech Stack:** Node.js, TypeScript, NestJS, Prisma, PostgreSQL, Docker Compose, Jest, Supertest.

---

## File Structure

Create the backend under `backend/` so the Android app and historical mini program remain untouched.

```text
backend/
  .env.example
  .gitignore
  docker-compose.yml
  nest-cli.json
  package.json
  tsconfig.json
  tsconfig.build.json
  prisma/
    schema.prisma
    migrations/
      0001_backend_foundation/
        migration.sql
  src/
    app.module.ts
    main.ts
    common/
      errors/api-error.filter.ts
      errors/api-error.ts
      validation/validation-exception.factory.ts
    dev-auth/
      current-user.decorator.ts
      dev-auth.guard.ts
      dev-users.controller.ts
      dev-users.dto.ts
      dev-users.service.ts
      user-presenter.ts
    health/
      health.controller.ts
      health.service.ts
    prisma/
      prisma.module.ts
      prisma.service.ts
    users/
      profile.dto.ts
      users.controller.ts
      users.service.ts
  test/
    app.e2e-spec.ts
    jest-e2e.json
    test-app.ts
```

Responsibilities:

- `prisma/schema.prisma`: source of truth for Plan 2 relational schema.
- `prisma/migrations/0001_backend_foundation/migration.sql`: generated/checked migration for PostgreSQL.
- `src/prisma/*`: Nest provider wrapping Prisma lifecycle and database access.
- `src/common/errors/*`: consistent JSON error envelope.
- `src/common/validation/*`: field-level validation error formatting.
- `src/health/*`: `GET /health`.
- `src/dev-auth/*`: temporary development identity boundary and user creation.
- `src/users/*`: current-user read and profile upsert.
- `test/*`: e2e test harness against the Nest app.

## Task 1: Scaffold Backend Tooling

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/nest-cli.json`
- Create: `backend/.gitignore`
- Create: `backend/.env.example`
- Create: `backend/docker-compose.yml`

- [x] **Step 1: Add backend package manifest**

Create `backend/package.json`:

```json
{
  "name": "aifitnesspro-backend",
  "version": "0.1.0",
  "private": true,
  "description": "AIFitnessPro independent backend API",
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest --config test/jest-e2e.json --runInBand",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:reset": "prisma migrate reset --force"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@types/supertest": "^6.0.0",
    "jest": "^29.7.0",
    "prisma": "^5.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.4.0"
  }
}
```

- [x] **Step 2: Add TypeScript config**

Create `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strict": true,
    "skipLibCheck": true,
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*.ts", "test/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Create `backend/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [x] **Step 3: Add Nest CLI config**

Create `backend/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [x] **Step 4: Add backend ignores and local env example**

Create `backend/.gitignore`:

```gitignore
node_modules/
dist/
.env
.env.local
coverage/
```

Create `backend/.env.example`:

```env
DATABASE_URL="postgresql://aifitnesspro:aifitnesspro@127.0.0.1:5432/aifitnesspro?schema=public"
PORT=8000
```

- [x] **Step 5: Add PostgreSQL Docker Compose**

Create `backend/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: aifitnesspro-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: aifitnesspro
      POSTGRES_PASSWORD: aifitnesspro
      POSTGRES_DB: aifitnesspro
    volumes:
      - aifitnesspro_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aifitnesspro -d aifitnesspro"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  aifitnesspro_postgres_data:
```

- [x] **Step 6: Install dependencies**

Run:

```bash
cd backend
npm install
```

Expected: dependencies install and `backend/package-lock.json` is created.

- [x] **Step 7: Commit tooling scaffold**

```bash
git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json backend/.gitignore backend/.env.example backend/docker-compose.yml
git commit -m "chore: scaffold backend tooling"
```

## Task 2: Add Prisma Schema and Initial Migration

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/0001_backend_foundation/migration.sql`

- [x] **Step 1: Add Prisma schema**

Create `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Gender {
  male
  female
  other
}

enum Goal {
  bulk
  cut
  strength
  fitness
}

enum Experience {
  beginner
  intermediate
  advanced
}

enum Persona {
  coach
  buddy
  comedian
  beauty_coach
}

enum UnitSystem {
  metric
}

enum PlanStatus {
  draft
  active
  completed
  archived
}

enum WorkoutStatus {
  not_started
  in_progress
  resting
  paused
  completed
  abandoned
}

enum ContentStatus {
  draft
  published
  archived
}

enum MediaType {
  image
  gif
  video
}

model User {
  id                  String               @id @default(uuid()) @db.Uuid
  devExternalId       String?              @unique @map("dev_external_id")
  deviceLabel         String               @map("device_label")
  onboardingCompleted Boolean              @default(false) @map("onboarding_completed")
  activePlanId        String?              @map("active_plan_id") @db.Uuid
  createdAt           DateTime             @default(now()) @map("created_at")
  updatedAt           DateTime             @updatedAt @map("updated_at")
  profile             UserProfile?
  settings            UserSettings?
  consentLogs         ConsentLog[]
  trainingPlans       TrainingPlan[]
  workoutSessions     WorkoutSession[]
  exerciseFeedback    ExerciseFeedback[]
  exerciseAdjustments ExerciseAdjustment[]

  @@map("users")
}

model UserProfile {
  id          String     @id @default(uuid()) @db.Uuid
  userId      String     @unique @map("user_id") @db.Uuid
  gender      Gender
  age         Int
  heightCm    Int        @map("height_cm")
  weightKg    Decimal    @map("weight_kg") @db.Decimal(5, 2)
  goal        Goal
  experience  Experience
  daysPerWeek Int        @map("days_per_week")
  equipment   String[]
  persona     Persona
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model UserSettings {
  id        String     @id @default(uuid()) @db.Uuid
  userId    String     @unique @map("user_id") @db.Uuid
  locale    String     @default("zh-CN")
  unit      UnitSystem  @default(metric)
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model ConsentLog {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  privacyVersion String   @map("privacy_version")
  termsVersion   String   @map("terms_version")
  acceptedAt     DateTime @default(now()) @map("accepted_at")
  source         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("consent_logs")
}

model TrainingPlan {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  status    PlanStatus @default(draft)
  source    String
  startDate DateTime? @map("start_date") @db.Date
  endDate   DateTime? @map("end_date") @db.Date
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  days      PlanDay[]
  sessions  WorkoutSession[]

  @@index([userId])
  @@map("training_plans")
}

model PlanDay {
  id             String          @id @default(uuid()) @db.Uuid
  trainingPlanId String          @map("training_plan_id") @db.Uuid
  dayIndex       Int             @map("day_index")
  scheduledDate  DateTime?       @map("scheduled_date") @db.Date
  dayType        String          @map("day_type")
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")
  trainingPlan   TrainingPlan    @relation(fields: [trainingPlanId], references: [id], onDelete: Cascade)
  exercises      PlanExercise[]
  sessions       WorkoutSession[]

  @@index([trainingPlanId])
  @@unique([trainingPlanId, dayIndex])
  @@map("plan_days")
}

model PlanExercise {
  id                String    @id @default(uuid()) @db.Uuid
  planDayId         String    @map("plan_day_id") @db.Uuid
  exerciseId        String    @map("exercise_id") @db.Uuid
  sortOrder         Int       @map("sort_order")
  targetSets        Int       @map("target_sets")
  targetReps        Int       @map("target_reps")
  targetRestSeconds Int       @map("target_rest_seconds")
  recommendedWeightKg Decimal? @map("recommended_weight_kg") @db.Decimal(5, 2)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  planDay           PlanDay   @relation(fields: [planDayId], references: [id], onDelete: Cascade)
  exercise          Exercise  @relation(fields: [exerciseId], references: [id])

  @@index([planDayId])
  @@unique([planDayId, sortOrder])
  @@map("plan_exercises")
}

model WorkoutSession {
  id             String         @id @default(uuid()) @db.Uuid
  userId         String         @map("user_id") @db.Uuid
  trainingPlanId String?        @map("training_plan_id") @db.Uuid
  planDayId      String?        @map("plan_day_id") @db.Uuid
  status         WorkoutStatus
  startedAt      DateTime?      @map("started_at")
  completedAt    DateTime?      @map("completed_at")
  durationSeconds Int?          @map("duration_seconds")
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  trainingPlan   TrainingPlan?  @relation(fields: [trainingPlanId], references: [id], onDelete: SetNull)
  planDay        PlanDay?       @relation(fields: [planDayId], references: [id], onDelete: SetNull)
  sets           WorkoutSet[]
  feedback       ExerciseFeedback[]

  @@index([userId])
  @@map("workout_sessions")
}

model WorkoutSet {
  id               String         @id @default(uuid()) @db.Uuid
  workoutSessionId String         @map("workout_session_id") @db.Uuid
  exerciseId       String         @map("exercise_id") @db.Uuid
  setIndex         Int            @map("set_index")
  targetReps       Int?           @map("target_reps")
  actualReps       Int?           @map("actual_reps")
  weightKg         Decimal?       @map("weight_kg") @db.Decimal(5, 2)
  rpe              Int?
  completedAt      DateTime?      @map("completed_at")
  createdAt        DateTime       @default(now()) @map("created_at")
  workoutSession   WorkoutSession @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
  exercise         Exercise       @relation(fields: [exerciseId], references: [id])

  @@index([workoutSessionId])
  @@unique([workoutSessionId, exerciseId, setIndex])
  @@map("workout_sets")
}

model ExerciseFeedback {
  id               String          @id @default(uuid()) @db.Uuid
  userId           String          @map("user_id") @db.Uuid
  exerciseId       String          @map("exercise_id") @db.Uuid
  workoutSessionId String?         @map("workout_session_id") @db.Uuid
  rpe              Int
  notes            String?
  createdAt        DateTime        @default(now()) @map("created_at")
  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise         Exercise        @relation(fields: [exerciseId], references: [id])
  workoutSession   WorkoutSession? @relation(fields: [workoutSessionId], references: [id], onDelete: SetNull)

  @@index([userId, exerciseId])
  @@map("exercise_feedback")
}

model ExerciseAdjustment {
  id              String    @id @default(uuid()) @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  exerciseId      String    @map("exercise_id") @db.Uuid
  averageRpe      Decimal   @default(0) @map("average_rpe") @db.Decimal(4, 2)
  feedbackCount   Int       @default(0) @map("feedback_count")
  nextSets        Int?      @map("next_sets")
  nextReps        Int?      @map("next_reps")
  nextRestSeconds Int?      @map("next_rest_seconds")
  nextWeightKg    Decimal?  @map("next_weight_kg") @db.Decimal(5, 2)
  trend           String?
  updatedAt       DateTime  @updatedAt @map("updated_at")
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise        Exercise  @relation(fields: [exerciseId], references: [id])

  @@unique([userId, exerciseId])
  @@map("exercise_adjustments")
}

model Exercise {
  id             String               @id @default(uuid()) @db.Uuid
  slug           String               @unique
  nameCn         String               @map("name_cn")
  aliases        String[]
  category       String
  primaryMuscles String[]             @map("primary_muscles")
  equipment      String[]
  difficulty     String
  instructions   String[]
  commonMistakes String[]             @map("common_mistakes")
  safetyNotes    String[]             @map("safety_notes")
  status         ContentStatus        @default(draft)
  createdAt      DateTime             @default(now()) @map("created_at")
  updatedAt      DateTime             @updatedAt @map("updated_at")
  media          ExerciseMedia[]
  planExercises  PlanExercise[]
  workoutSets    WorkoutSet[]
  feedback       ExerciseFeedback[]
  adjustments    ExerciseAdjustment[]

  @@map("exercises")
}

model ExerciseMedia {
  id          String    @id @default(uuid()) @db.Uuid
  exerciseId  String    @map("exercise_id") @db.Uuid
  mediaType   MediaType @map("media_type")
  url         String
  source      String
  license     String
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  exercise    Exercise  @relation(fields: [exerciseId], references: [id], onDelete: Cascade)

  @@index([exerciseId])
  @@map("exercise_media")
}

model Recipe {
  id              String        @id @default(uuid()) @db.Uuid
  slug            String        @unique
  name            String
  mealType        String        @map("meal_type")
  suitableGoals   String[]      @map("suitable_goals")
  ingredients     Json
  calories        Int
  proteinG        Decimal       @map("protein_g") @db.Decimal(6, 2)
  carbsG          Decimal       @map("carbs_g") @db.Decimal(6, 2)
  fatG            Decimal       @map("fat_g") @db.Decimal(6, 2)
  prepTimeMinutes Int?          @map("prep_time_minutes")
  difficulty      String?
  allergens       String[]
  status          ContentStatus @default(draft)
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@map("recipes")
}
```

- [x] **Step 2: Generate migration SQL**

Run:

```bash
cd backend
cp .env.example .env
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate:dev -- --name backend_foundation
```

Expected:

- Docker starts `aifitnesspro-postgres`.
- Prisma creates `backend/prisma/migrations/<timestamp>_backend_foundation/migration.sql`.

- [x] **Step 3: Rename migration directory for stable plan naming**

Rename the generated migration directory to:

```text
backend/prisma/migrations/0001_backend_foundation
```

Expected: `backend/prisma/migrations/0001_backend_foundation/migration.sql` exists.

- [x] **Step 4: Verify migration deploys cleanly**

Run:

```bash
cd backend
npm run prisma:reset
npm run prisma:migrate
```

Expected: Prisma resets the local database and applies `0001_backend_foundation` without errors.

- [x] **Step 5: Commit database foundation**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat: add backend database foundation"
```

## Task 3: Add Nest App Shell and Health Endpoint

**Files:**
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`
- Create: `backend/src/prisma/prisma.module.ts`
- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/src/health/health.controller.ts`
- Create: `backend/src/health/health.service.ts`
- Create: `backend/test/jest-e2e.json`
- Create: `backend/test/test-app.ts`
- Create: `backend/test/app.e2e-spec.ts`

- [ ] **Step 1: Write failing health test**

Create `backend/test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

Create `backend/test/test-app.ts`:

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}
```

Create `backend/test/app.e2e-spec.ts`:

```ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './test-app';

describe('AIFitnessPro backend foundation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns service and database health', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      service: 'aifitnesspro-backend',
      database: 'ok',
    });
  });
});
```

- [ ] **Step 2: Run health test and verify RED**

Run:

```bash
cd backend
npm test -- --runTestsByPath test/app.e2e-spec.ts
```

Expected: FAIL because `../src/app.module` or `GET /health` does not exist.

- [ ] **Step 3: Add Prisma provider**

Create `backend/src/prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

Create `backend/src/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 4: Add health module code**

Create `backend/src/health/health.service.ts`:

```ts
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type HealthResponse = {
  status: 'ok';
  service: 'aifitnesspro-backend';
  database: 'ok';
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'aifitnesspro-backend',
        database: 'ok',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'aifitnesspro-backend',
        database: 'unavailable',
      });
    }
  }
}
```

Create `backend/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { HealthResponse, HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): Promise<HealthResponse> {
    return this.healthService.getHealth();
  }
}
```

- [ ] **Step 5: Add app module and entrypoint**

Create `backend/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
```

Create `backend/src/main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT || 8000);
  await app.listen(port);
}

void bootstrap();
```

- [ ] **Step 6: Run health test and verify GREEN**

Run:

```bash
cd backend
npm test -- --runTestsByPath test/app.e2e-spec.ts
```

Expected: PASS for health test.

- [ ] **Step 7: Commit health endpoint**

```bash
git add backend/src backend/test
git commit -m "feat: add backend health endpoint"
```

## Task 4: Add Error Envelope and Development User Creation

**Files:**
- Create: `backend/src/common/errors/api-error.ts`
- Create: `backend/src/common/errors/api-error.filter.ts`
- Modify: `backend/src/main.ts`
- Modify: `backend/test/test-app.ts`
- Create: `backend/src/dev-auth/dev-users.dto.ts`
- Create: `backend/src/dev-auth/dev-users.service.ts`
- Create: `backend/src/dev-auth/dev-users.controller.ts`
- Create: `backend/src/dev-auth/user-presenter.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing development user tests**

Append to `backend/test/app.e2e-spec.ts` inside the existing `describe` block:

```ts
  it('POST /v1/dev/users creates a development user with default settings', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Pixel 8 local', externalId: 'pixel-8-local' })
      .expect(201);

    expect(response.body.user).toMatchObject({
      deviceLabel: 'Pixel 8 local',
      onboardingCompleted: false,
    });
    expect(response.body.user.id).toEqual(expect.any(String));
    expect(response.body.user.createdAt).toEqual(expect.any(String));
  });

  it('POST /v1/dev/users returns the existing development user for repeated externalId', async () => {
    const first = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Pixel 8 local', externalId: 'stable-device' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Updated label', externalId: 'stable-device' })
      .expect(201);

    expect(second.body.user.id).toBe(first.body.user.id);
    expect(second.body.user.deviceLabel).toBe('Pixel 8 local');
  });

  it('POST /v1/dev/users rejects missing deviceLabel with error envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ externalId: 'missing-label' })
      .expect(400);

    expect(response.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: '请求参数不合法',
    });
    expect(response.body.error.fields.deviceLabel).toEqual(expect.any(String));
  });
```

- [ ] **Step 2: Run dev user tests and verify RED**

Run:

```bash
cd backend
npm test -- --runTestsByPath test/app.e2e-spec.ts
```

Expected: FAIL because `/v1/dev/users` and the error envelope do not exist.

- [ ] **Step 3: Add API error filter**

Create `backend/src/common/errors/api-error.ts`:

```ts
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
};
```

Create `backend/src/common/errors/api-error.filter.ts`:

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorBody, ApiErrorCode } from './api-error';

type ErrorResponse = {
  code?: ApiErrorCode;
  message?: string;
  fields?: Record<string, string>;
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body = this.formatHttpException(status, raw);
      response.status(status).json(body);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务暂时不可用',
      },
    } satisfies ApiErrorBody);
  }

  private formatHttpException(status: number, raw: string | object): ApiErrorBody {
    if (typeof raw === 'object' && raw !== null && 'code' in raw) {
      const error = raw as ErrorResponse;
      return {
        error: {
          code: error.code || this.defaultCode(status),
          message: error.message || this.defaultMessage(status),
          ...(error.fields ? { fields: error.fields } : {}),
        },
      };
    }

    return {
      error: {
        code: this.defaultCode(status),
        message: this.defaultMessage(status),
      },
    };
  }

  private defaultCode(status: number): ApiErrorCode {
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHENTICATED';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return 'DATABASE_UNAVAILABLE';
    return 'INTERNAL_ERROR';
  }

  private defaultMessage(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return '请求参数不合法';
    if (status === HttpStatus.UNAUTHORIZED) return '请先登录';
    if (status === HttpStatus.NOT_FOUND) return '资源不存在';
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return '数据库暂时不可用';
    return '服务暂时不可用';
  }
}
```

- [ ] **Step 4: Add validation exception factory**

Create `backend/src/common/validation/validation-exception.factory.ts`:

```ts
import { BadRequestException, ValidationError } from '@nestjs/common';

export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  const fields: Record<string, string> = {};

  for (const error of errors) {
    if (error.constraints) {
      fields[error.property] = Object.values(error.constraints)[0];
    }
  }

  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: '请求参数不合法',
    fields,
  });
}
```

Modify `backend/src/main.ts` and `backend/test/test-app.ts` so the `ValidationPipe` includes:

```ts
exceptionFactory: validationExceptionFactory,
```

and both files register:

```ts
app.useGlobalFilters(new ApiErrorFilter());
```

with imports:

```ts
import { ApiErrorFilter } from './common/errors/api-error.filter';
import { validationExceptionFactory } from './common/validation/validation-exception.factory';
```

Use `../src/common/...` import paths in `backend/test/test-app.ts`.

- [ ] **Step 5: Add development user DTO and presenter**

Create `backend/src/dev-auth/dev-users.dto.ts`:

```ts
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDevUserDto {
  @IsString({ message: '设备名称不能为空' })
  @MinLength(1, { message: '设备名称不能为空' })
  @MaxLength(80, { message: '设备名称不能超过 80 个字符' })
  deviceLabel!: string;

  @IsOptional()
  @IsString({ message: '外部设备标识必须是字符串' })
  @MaxLength(120, { message: '外部设备标识不能超过 120 个字符' })
  externalId?: string;
}
```

Create `backend/src/dev-auth/user-presenter.ts`:

```ts
import { User, UserProfile, UserSettings } from '@prisma/client';

type UserWithRelations = User & {
  profile?: UserProfile | null;
  settings?: UserSettings | null;
};

export function presentUser(user: UserWithRelations) {
  return {
    id: user.id,
    deviceLabel: user.deviceLabel,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt.toISOString(),
    ...(user.profile !== undefined
      ? {
          profile: user.profile
            ? {
                gender: user.profile.gender,
                age: user.profile.age,
                heightCm: user.profile.heightCm,
                weightKg: Number(user.profile.weightKg),
                goal: user.profile.goal,
                experience: user.profile.experience,
                daysPerWeek: user.profile.daysPerWeek,
                equipment: user.profile.equipment,
                persona: user.profile.persona,
              }
            : null,
        }
      : {}),
    ...(user.settings
      ? {
          settings: {
            locale: user.settings.locale,
            unit: user.settings.unit,
          },
        }
      : {}),
  };
}
```

- [ ] **Step 6: Add development user service and controller**

Create `backend/src/dev-auth/dev-users.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDevUserDto } from './dev-users.dto';

@Injectable()
export class DevUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrGet(dto: CreateDevUserDto) {
    const deviceLabel = dto.deviceLabel.trim();
    const externalId = dto.externalId?.trim() || undefined;

    if (externalId) {
      const existing = await this.prisma.user.findUnique({
        where: { devExternalId: externalId },
        include: { settings: true },
      });
      if (existing) return existing;
    }

    return this.prisma.user.create({
      data: {
        deviceLabel,
        devExternalId: externalId,
        settings: {
          create: {
            locale: 'zh-CN',
            unit: 'metric',
          },
        },
      },
      include: { settings: true },
    });
  }
}
```

Create `backend/src/dev-auth/dev-users.controller.ts`:

```ts
import { Body, Controller, Post } from '@nestjs/common';
import { CreateDevUserDto } from './dev-users.dto';
import { DevUsersService } from './dev-users.service';
import { presentUser } from './user-presenter';

@Controller('v1/dev/users')
export class DevUsersController {
  constructor(private readonly devUsersService: DevUsersService) {}

  @Post()
  async create(@Body() dto: CreateDevUserDto) {
    const user = await this.devUsersService.createOrGet(dto);
    return { user: presentUser(user) };
  }
}
```

Modify `backend/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { DevUsersController } from './dev-auth/dev-users.controller';
import { DevUsersService } from './dev-auth/dev-users.service';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, DevUsersController],
  providers: [HealthService, DevUsersService],
})
export class AppModule {}
```

- [ ] **Step 7: Run development user tests and verify GREEN**

Run:

```bash
cd backend
npm test -- --runTestsByPath test/app.e2e-spec.ts
```

Expected: PASS for health and development user tests.

- [ ] **Step 8: Commit development user foundation**

```bash
git add backend/src backend/test
git commit -m "feat: add development user API"
```

## Task 5: Add Development Auth Guard and Current User Endpoint

**Files:**
- Create: `backend/src/dev-auth/current-user.decorator.ts`
- Create: `backend/src/dev-auth/dev-auth.guard.ts`
- Create: `backend/src/users/users.service.ts`
- Create: `backend/src/users/users.controller.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing current-user tests**

Append to `backend/test/app.e2e-spec.ts`:

```ts
  it('GET /v1/users/me returns the current development user', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Pixel 8 current user', externalId: 'current-user-device' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('X-Dev-User-Id', created.body.user.id)
      .expect(200);

    expect(response.body.user).toMatchObject({
      id: created.body.user.id,
      deviceLabel: 'Pixel 8 current user',
      onboardingCompleted: false,
      profile: null,
      settings: {
        locale: 'zh-CN',
        unit: 'metric',
      },
    });
  });

  it('GET /v1/users/me rejects missing development user header', async () => {
    const response = await request(app.getHttpServer()).get('/v1/users/me').expect(401);

    expect(response.body.error).toMatchObject({
      code: 'UNAUTHENTICATED',
      message: '请先登录',
    });
  });

  it('GET /v1/users/me rejects unknown development user id', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('X-Dev-User-Id', '00000000-0000-0000-0000-000000000000')
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
```

- [ ] **Step 2: Run current-user tests and verify RED**

Run:

```bash
cd backend
npm test -- --runTestsByPath test/app.e2e-spec.ts
```

Expected: FAIL because `/v1/users/me` and auth guard do not exist.

- [ ] **Step 3: Add current user decorator and guard**

Create `backend/src/dev-auth/current-user.decorator.ts`:

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
```

Create `backend/src/dev-auth/dev-auth.guard.ts`:

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: unknown }>();
    const rawUserId = request.headers['x-dev-user-id'];
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    if (!userId) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: '请先登录' });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: '请先登录' });
    }

    request.user = user;
    return true;
  }
}
```

- [ ] **Step 4: Add users service and controller**

Create `backend/src/users/users.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: true,
        settings: true,
      },
    });
  }
}
```

Create `backend/src/users/users.controller.ts`:

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { presentUser } from '../dev-auth/user-presenter';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(DevAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    const currentUser = await this.usersService.getCurrentUser(user.id);
    return { user: presentUser(currentUser) };
  }
}
```

Modify `backend/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { DevAuthGuard } from './dev-auth/dev-auth.guard';
import { DevUsersController } from './dev-auth/dev-users.controller';
import { DevUsersService } from './dev-auth/dev-users.service';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, DevUsersController, UsersController],
  providers: [HealthService, DevUsersService, DevAuthGuard, UsersService],
})
export class AppModule {}
```

- [ ] **Step 5: Run current-user tests and verify GREEN**

Run:

```bash
cd backend
npm test -- --runTestsByPath test/app.e2e-spec.ts
```

Expected: PASS for health, development user, and current-user tests.

- [ ] **Step 6: Commit current-user endpoint**

```bash
git add backend/src backend/test
git commit -m "feat: add current user API"
```

## Task 6: Add Profile Upsert Endpoint and Validation

**Files:**
- Create: `backend/src/users/profile.dto.ts`
- Modify: `backend/src/users/users.service.ts`
- Modify: `backend/src/users/users.controller.ts`
- Modify: `backend/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing profile tests**

Append to `backend/test/app.e2e-spec.ts`:

```ts
  it('PUT /v1/users/me/profile creates a profile and marks onboarding complete', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Profile device', externalId: 'profile-device' })
      .expect(201);

    const profile = {
      gender: 'male',
      age: 25,
      heightCm: 175,
      weightKg: 70,
      goal: 'strength',
      experience: 'beginner',
      daysPerWeek: 4,
      equipment: ['full_gym', 'dumbbell_only'],
      persona: 'coach',
    };

    const response = await request(app.getHttpServer())
      .put('/v1/users/me/profile')
      .set('X-Dev-User-Id', created.body.user.id)
      .send(profile)
      .expect(200);

    expect(response.body.user).toMatchObject({
      id: created.body.user.id,
      onboardingCompleted: true,
      profile,
    });
  });

  it('PUT /v1/users/me/profile updates an existing profile', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Update profile device', externalId: 'update-profile-device' })
      .expect(201);

    await request(app.getHttpServer())
      .put('/v1/users/me/profile')
      .set('X-Dev-User-Id', created.body.user.id)
      .send({
        gender: 'female',
        age: 28,
        heightCm: 168,
        weightKg: 62,
        goal: 'fitness',
        experience: 'intermediate',
        daysPerWeek: 3,
        equipment: ['bodyweight'],
        persona: 'buddy',
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .put('/v1/users/me/profile')
      .set('X-Dev-User-Id', created.body.user.id)
      .send({
        gender: 'female',
        age: 29,
        heightCm: 168,
        weightKg: 61.5,
        goal: 'cut',
        experience: 'intermediate',
        daysPerWeek: 5,
        equipment: ['bodyweight', 'dumbbell_only'],
        persona: 'beauty_coach',
      })
      .expect(200);

    expect(response.body.user.profile).toMatchObject({
      age: 29,
      weightKg: 61.5,
      goal: 'cut',
      daysPerWeek: 5,
      persona: 'beauty_coach',
    });
  });

  it('PUT /v1/users/me/profile rejects invalid onboarding fields', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Invalid profile device', externalId: 'invalid-profile-device' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .put('/v1/users/me/profile')
      .set('X-Dev-User-Id', created.body.user.id)
      .send({
        gender: 'male',
        age: 12,
        heightCm: 120,
        weightKg: 20,
        goal: 'strength',
        experience: 'beginner',
        daysPerWeek: 2,
        equipment: [],
        persona: 'coach',
      })
      .expect(400);

    expect(response.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: '请求参数不合法',
    });
    expect(response.body.error.fields).toMatchObject({
      age: expect.any(String),
      heightCm: expect.any(String),
      weightKg: expect.any(String),
      daysPerWeek: expect.any(String),
      equipment: expect.any(String),
    });
  });
```

- [ ] **Step 2: Run profile tests and verify RED**

Run:

```bash
cd backend
npm test -- --runTestsByPath test/app.e2e-spec.ts
```

Expected: FAIL because `PUT /v1/users/me/profile` does not exist.

- [ ] **Step 3: Add profile DTO**

Create `backend/src/users/profile.dto.ts`:

```ts
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  Max,
  Min,
} from 'class-validator';

export enum ProfileGender {
  male = 'male',
  female = 'female',
  other = 'other',
}

export enum ProfileGoal {
  bulk = 'bulk',
  cut = 'cut',
  strength = 'strength',
  fitness = 'fitness',
}

export enum ProfileExperience {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced',
}

export enum ProfilePersona {
  coach = 'coach',
  buddy = 'buddy',
  comedian = 'comedian',
  beauty_coach = 'beauty_coach',
}

export enum ProfileEquipment {
  full_gym = 'full_gym',
  barbell_bench = 'barbell_bench',
  dumbbell_only = 'dumbbell_only',
  bodyweight = 'bodyweight',
}

export class UpsertProfileDto {
  @IsEnum(ProfileGender, { message: '请选择有效性别' })
  gender!: ProfileGender;

  @IsInt({ message: '年龄必须是整数' })
  @Min(16, { message: '年龄需在 16-65 岁之间' })
  @Max(65, { message: '年龄需在 16-65 岁之间' })
  age!: number;

  @IsInt({ message: '身高必须是整数' })
  @Min(140, { message: '身高需在 140-220cm 之间' })
  @Max(220, { message: '身高需在 140-220cm 之间' })
  heightCm!: number;

  @IsNumber({}, { message: '体重必须是数字' })
  @Min(30, { message: '体重需在 30-200kg 之间' })
  @Max(200, { message: '体重需在 30-200kg 之间' })
  weightKg!: number;

  @IsEnum(ProfileGoal, { message: '请选择有效目标' })
  goal!: ProfileGoal;

  @IsEnum(ProfileExperience, { message: '请选择有效训练经验' })
  experience!: ProfileExperience;

  @IsInt({ message: '每周训练天数必须是整数' })
  @Min(3, { message: '每周训练天数需在 3-5 天之间' })
  @Max(5, { message: '每周训练天数需在 3-5 天之间' })
  daysPerWeek!: number;

  @IsArray({ message: '器械必须是数组' })
  @ArrayNotEmpty({ message: '请至少选择一种器械' })
  @IsEnum(ProfileEquipment, { each: true, message: '包含无效器械类型' })
  equipment!: ProfileEquipment[];

  @IsEnum(ProfilePersona, { message: '请选择有效陪伴风格' })
  persona!: ProfilePersona;
}
```

- [ ] **Step 4: Add profile upsert service method**

Modify `backend/src/users/users.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProfileDto } from './profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: true,
        settings: true,
      },
    });
  }

  async upsertProfile(userId: string, dto: UpsertProfileDto) {
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        gender: dto.gender,
        age: dto.age,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        goal: dto.goal,
        experience: dto.experience,
        daysPerWeek: dto.daysPerWeek,
        equipment: dto.equipment,
        persona: dto.persona,
      },
      update: {
        gender: dto.gender,
        age: dto.age,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        goal: dto.goal,
        experience: dto.experience,
        daysPerWeek: dto.daysPerWeek,
        equipment: dto.equipment,
        persona: dto.persona,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return this.getCurrentUser(userId);
  }
}
```

- [ ] **Step 5: Add profile endpoint**

Modify `backend/src/users/users.controller.ts`:

```ts
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../dev-auth/current-user.decorator';
import { DevAuthGuard } from '../dev-auth/dev-auth.guard';
import { presentUser } from '../dev-auth/user-presenter';
import { UpsertProfileDto } from './profile.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(DevAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    const currentUser = await this.usersService.getCurrentUser(user.id);
    return { user: presentUser(currentUser) };
  }

  @Put('me/profile')
  async upsertProfile(@CurrentUser() user: User, @Body() dto: UpsertProfileDto) {
    const currentUser = await this.usersService.upsertProfile(user.id, dto);
    return { user: presentUser(currentUser) };
  }
}
```

- [ ] **Step 6: Run profile tests and verify GREEN**

Run:

```bash
cd backend
npm test -- --runTestsByPath test/app.e2e-spec.ts
```

Expected: PASS for all e2e tests.

- [ ] **Step 7: Commit profile endpoint**

```bash
git add backend/src backend/test
git commit -m "feat: add user profile API"
```

## Task 7: Add Test Database Cleanup and Full Verification

**Files:**
- Modify: `backend/test/app.e2e-spec.ts`
- Modify: `backend/README.md`

- [ ] **Step 1: Add database cleanup helper to tests**

Modify the top of `backend/test/app.e2e-spec.ts`:

```ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app';

describe('AIFitnessPro backend foundation', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
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

Keep the existing test cases below this header.

- [ ] **Step 2: Run full backend tests**

Run:

```bash
cd backend
npm test
```

Expected: all backend e2e tests pass.

- [ ] **Step 3: Run backend build**

Run:

```bash
cd backend
npm run build
```

Expected: NestJS TypeScript build passes.

- [ ] **Step 4: Add backend README**

Create `backend/README.md`:

```markdown
# AIFitnessPro Backend

Independent API service for the AIFitnessPro Android app.

## Stack

- NestJS
- PostgreSQL
- Prisma
- Jest/Supertest

## Local Setup

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run prisma:generate
npm run prisma:migrate
npm test
npm run build
```

## Development Identity

Plan 2 uses a temporary development identity boundary:

```bash
curl -X POST http://127.0.0.1:8000/v1/dev/users \
  -H "Content-Type: application/json" \
  -d '{"deviceLabel":"Pixel 8 local","externalId":"pixel-8-local"}'
```

Use the returned user id in `X-Dev-User-Id` for current-user/profile endpoints.
Production authentication will replace this guard in Plan 3.
```

- [ ] **Step 5: Commit verification cleanup and docs**

```bash
git add backend/test/app.e2e-spec.ts backend/README.md
git commit -m "test: verify backend foundation"
```

## Task 8: Update Project Context

**Files:**
- Modify: `docs/PROJECT_CONTEXT.md`
- Modify: `docs/superpowers/plans/2026-05-19-backend-api-database-foundation.md`

- [ ] **Step 1: Mark completed plan tasks**

As tasks complete, update this plan file's checkboxes from `[ ]` to `[x]`.

- [ ] **Step 2: Update project memory**

Update `docs/PROJECT_CONTEXT.md` with:

```markdown
当前开发阶段：Plan 2 - Backend API and Database Foundation implemented / verification complete.

当前运行状态：Android Plan 1 已合并；Plan 2 后端基础已实现，包含 NestJS 服务、PostgreSQL Docker Compose、Prisma schema/migration、health/dev user/current user/profile API 和自动化测试。
```

Also update:

- 本轮完成内容
- 本轮修改文件
- 新增功能
- 修复问题
- 当前未完成事项
- 已知 bug 或风险
- 当前暂停点
- 下一步开发任务
- 下一个 AI 会话应该从哪里继续
- 建议 git commit message

- [ ] **Step 3: Run final verification**

Run:

```bash
cd backend
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 4: Commit context update**

```bash
git add docs/PROJECT_CONTEXT.md docs/superpowers/plans/2026-05-19-backend-api-database-foundation.md
git commit -m "docs: update context after backend foundation"
```

## Final Verification Gate

Before claiming Plan 2 complete, run:

```bash
cd backend
docker compose ps
npm run prisma:migrate
npm test
npm run build
```

Expected:

- PostgreSQL service is running and healthy.
- Prisma migration deploys.
- Jest e2e tests pass.
- NestJS build passes.

## Known Deliberate Exclusions

- Production authentication.
- Android networking integration.
- Training plan generation.
- Workout sync APIs.
- Exercise and recipe seed import.
- Content admin UI.

These are covered by later roadmap plans.
