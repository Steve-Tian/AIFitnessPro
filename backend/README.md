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
