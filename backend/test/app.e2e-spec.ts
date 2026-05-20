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
});
