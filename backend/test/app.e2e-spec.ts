import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
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
});
