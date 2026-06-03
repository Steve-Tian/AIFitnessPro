import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
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

  it('GET /health returns service and database health', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      service: 'aifitnesspro-backend',
      database: 'ok',
    });
  });

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
    expect(trainingDays).toHaveLength(12);
    expect(trainingDays[0].dayType).toBe('push');
    expect(trainingDays[1].dayType).toBe('pull');
    expect(trainingDays[2].dayType).toBe('legs');
    expect(trainingDays[0].exercises.length).toBeGreaterThan(0);
    expect(trainingDays[0].exercises[0]).toMatchObject({
      nameCn: expect.any(String),
      targetSets: 3,
      targetReps: expect.any(Number),
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

  it('POST /v1/workouts/sessions/sync upserts a completed workout session with sets', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Workout sync device', externalId: 'workout-sync-device' })
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

    const generated = await request(app.getHttpServer())
      .post('/v1/plans/generate')
      .set('X-Dev-User-Id', userId)
      .expect(201);

    const trainingDay = generated.body.plan.days.find((day: { dayType: string }) => day.dayType !== 'rest');
    const exercise = trainingDay.exercises[0];
    const sessionId = '11111111-1111-4111-8111-111111111111';
    const setId = '22222222-2222-4222-8222-222222222222';

    const response = await request(app.getHttpServer())
      .post('/v1/workouts/sessions/sync')
      .set('X-Dev-User-Id', userId)
      .send({
        session: {
          id: sessionId,
          trainingPlanId: generated.body.plan.id,
          planDayIndex: trainingDay.dayIndex,
          status: 'completed',
          startedAt: '2026-05-20T08:00:00.000Z',
          completedAt: '2026-05-20T09:00:00.000Z',
          durationSeconds: 3600,
        },
        sets: [
          {
            id: setId,
            exerciseId: exercise.exerciseId,
            setIndex: 1,
            targetReps: exercise.targetReps,
            actualReps: exercise.targetReps,
            weightKg: 40,
            completedAt: '2026-05-20T08:15:00.000Z',
          },
        ],
      })
      .expect(200);

    expect(response.body.session).toMatchObject({
      id: sessionId,
      status: 'completed',
      durationSeconds: 3600,
    });
    expect(response.body.session.sets).toHaveLength(1);
    expect(response.body.session.sets[0]).toMatchObject({
      exerciseId: exercise.exerciseId,
      setIndex: 1,
      actualReps: exercise.targetReps,
      weightKg: 40,
    });

    const stored = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: { sets: true },
    });
    expect(stored?.userId).toBe(userId);
    expect(stored?.sets).toHaveLength(1);
  });

  it('POST /v1/workouts/sessions/sync stores exercise RPE feedback', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Workout feedback device', externalId: 'workout-feedback-device' })
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

    const generated = await request(app.getHttpServer())
      .post('/v1/plans/generate')
      .set('X-Dev-User-Id', userId)
      .expect(201);

    const trainingDay = generated.body.plan.days.find((day: { dayType: string }) => day.dayType !== 'rest');
    const exercise = trainingDay.exercises[0];
    const sessionId = '33333333-3333-4333-8333-333333333333';
    const setId = '44444444-4444-4444-8444-444444444444';

    await request(app.getHttpServer())
      .post('/v1/workouts/sessions/sync')
      .set('X-Dev-User-Id', userId)
      .send({
        session: {
          id: sessionId,
          trainingPlanId: generated.body.plan.id,
          planDayIndex: trainingDay.dayIndex,
          status: 'completed',
          startedAt: '2026-05-21T08:00:00.000Z',
          completedAt: '2026-05-21T09:00:00.000Z',
          durationSeconds: 1800,
        },
        sets: [
          {
            id: setId,
            exerciseId: exercise.exerciseId,
            setIndex: 1,
            targetReps: exercise.targetReps,
            actualReps: exercise.targetReps,
            weightKg: 50,
            completedAt: '2026-05-21T08:20:00.000Z',
          },
        ],
        feedback: [{ exerciseId: exercise.exerciseId, rpe: 8 }],
      })
      .expect(200);

    const feedback = await prisma.exerciseFeedback.findMany({
      where: { workoutSessionId: sessionId },
    });
    expect(feedback).toHaveLength(1);
    expect(feedback[0].rpe).toBe(8);

    const adjustment = await prisma.exerciseAdjustment.findUnique({
      where: {
        userId_exerciseId: { userId, exerciseId: exercise.exerciseId },
      },
    });
    expect(adjustment?.feedbackCount).toBe(1);
    expect(Number(adjustment?.averageRpe)).toBe(8);
  });

  it('POST /v1/workouts/sessions/sync rejects invalid exercise id', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Invalid workout device', externalId: 'invalid-workout-device' })
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

    const generated = await request(app.getHttpServer())
      .post('/v1/plans/generate')
      .set('X-Dev-User-Id', userId)
      .expect(201);

    const trainingDay = generated.body.plan.days.find((day: { dayType: string }) => day.dayType !== 'rest');

    const response = await request(app.getHttpServer())
      .post('/v1/workouts/sessions/sync')
      .set('X-Dev-User-Id', userId)
      .send({
        session: {
          id: '33333333-3333-4333-8333-333333333333',
          trainingPlanId: generated.body.plan.id,
          planDayIndex: trainingDay.dayIndex,
          status: 'completed',
        },
        sets: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            exerciseId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            setIndex: 1,
            actualReps: 10,
          },
        ],
      })
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /v1/exercises returns published exercise summaries', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Exercise list device', externalId: 'exercise-list-device' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/exercises')
      .set('X-Dev-User-Id', userRes.body.user.id)
      .expect(200);

    expect(response.body.exercises.length).toBeGreaterThanOrEqual(70);
    expect(response.body.exercises[0]).toMatchObject({
      slug: expect.any(String),
      nameCn: expect.any(String),
      category: expect.any(String),
      difficulty: expect.any(String),
    });
  });

  it('GET /v1/exercises filters by category and keyword', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Exercise filter device', externalId: 'exercise-filter-device' })
      .expect(201);
    const userId = userRes.body.user.id;

    const pushResponse = await request(app.getHttpServer())
      .get('/v1/exercises?category=push')
      .set('X-Dev-User-Id', userId)
      .expect(200);

    expect(pushResponse.body.exercises.length).toBeGreaterThan(0);
    expect(pushResponse.body.exercises.every((item: { category: string }) => item.category === 'push')).toBe(true);

    const searchResponse = await request(app.getHttpServer())
      .get(`/v1/exercises?q=${encodeURIComponent('卧推')}`)
      .set('X-Dev-User-Id', userId)
      .expect(200);

    expect(searchResponse.body.exercises.some((item: { slug: string }) => item.slug === 'bench_press')).toBe(true);
  });

  it('GET /v1/exercises/:slug returns exercise detail', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Exercise detail device', externalId: 'exercise-detail-device' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/exercises/bench_press')
      .set('X-Dev-User-Id', userRes.body.user.id)
      .expect(200);

    expect(response.body.exercise).toMatchObject({
      slug: 'bench_press',
      nameCn: expect.any(String),
      instructions: expect.any(Array),
      commonMistakes: expect.any(Array),
      safetyNotes: expect.any(Array),
      previewMediaUrl: expect.stringContaining('raw.githubusercontent.com'),
      previewMediaType: 'image',
      media: expect.arrayContaining([
        expect.objectContaining({
          mediaType: 'image',
          source: 'free-exercise-db',
          license: 'Unlicense',
        }),
      ]),
    });
  });

  it('GET /v1/exercises returns preview media for core exercises', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Exercise media device', externalId: 'exercise-media-device' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/exercises')
      .set('X-Dev-User-Id', userRes.body.user.id)
      .expect(200);

    const withMedia = response.body.exercises.filter(
      (item: { previewMediaUrl: string | null }) => item.previewMediaUrl,
    );
    expect(withMedia.length).toBeGreaterThanOrEqual(30);
  });

  it('GET /v1/exercises/:slug returns 404 for unknown slug', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/v1/dev/users')
      .send({ deviceLabel: 'Exercise missing device', externalId: 'exercise-missing-device' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/exercises/not-a-real-exercise')
      .set('X-Dev-User-Id', userRes.body.user.id)
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
