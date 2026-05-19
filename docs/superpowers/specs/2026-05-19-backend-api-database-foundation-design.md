# Backend API and Database Foundation Design

> Date: 2026-05-19
> Plan: Plan 2 - Backend API and Database Foundation
> Approved direction: NestJS + PostgreSQL + Prisma

## Goal

Create the first independent backend foundation for AIFitnessPro so later Android work can rely on stable API boundaries, structured relational data, and testable health/user/profile endpoints.

This plan replaces the mini program's `_openid`-centered cloud function boundary with a unified `user_id` model. It does not implement production login, onboarding UI, training plan generation, workout sync, content admin, media upload, or AI features.

## Scope

Plan 2 builds:

- A new `backend/` service using NestJS.
- PostgreSQL local development through Docker Compose.
- Prisma schema and migrations for the first relational model.
- Health endpoint.
- Development identity boundary.
- Current-user and profile endpoints.
- Content foundation tables for exercises, exercise media, and recipes.
- Automated tests for health, development identity, profile reads, profile updates, and validation failures.

Plan 2 deliberately excludes:

- Phone, WeChat, Apple, or password login.
- JWT/session issuance.
- Android Retrofit integration.
- Training plan generation.
- Workout session sync APIs.
- Exercise or recipe admin UI.
- Seed import for the full exercise/recipe catalog.

## Architecture

The backend is a separate `backend/` project at the repository root. It uses NestJS modules with clear boundaries:

- `health`: service readiness endpoint.
- `dev-auth`: development-only user identity bootstrap.
- `users`: current-user and profile endpoints.
- `prisma`: database client provider and integration point.

Prisma owns the database schema and migrations. PostgreSQL stores durable application data. The Android app will later consume the API through versioned routes under `/v1`.

The first authentication boundary is intentionally temporary and explicit:

- `POST /v1/dev/users` creates or returns a development user.
- Authenticated development requests pass `X-Dev-User-Id: <uuid>`.
- Guards reject missing, malformed, or unknown development users.

This keeps Plan 2 unblocked while preserving a single replacement point for real authentication in Plan 3.

## API Design

### `GET /health`

Returns process and database health.

Success response:

```json
{
  "status": "ok",
  "service": "aifitnesspro-backend",
  "database": "ok"
}
```

If the database is unavailable, the endpoint returns HTTP 503 with:

```json
{
  "status": "error",
  "service": "aifitnesspro-backend",
  "database": "unavailable"
}
```

### `POST /v1/dev/users`

Creates or returns a development user for local Android/API testing.

Request body:

```json
{
  "deviceLabel": "Pixel 8 local",
  "externalId": "optional-local-device-key"
}
```

Rules:

- `deviceLabel` is required, trimmed, and limited to 80 characters.
- `externalId` is optional, trimmed, and limited to 120 characters.
- If `externalId` already exists in `users.dev_external_id`, return the existing user.
- If `externalId` is omitted, create a new user each time.

Success response:

```json
{
  "user": {
    "id": "uuid",
    "deviceLabel": "Pixel 8 local",
    "onboardingCompleted": false,
    "createdAt": "2026-05-19T00:00:00.000Z"
  }
}
```

### `GET /v1/users/me`

Requires `X-Dev-User-Id`.

Success response:

```json
{
  "user": {
    "id": "uuid",
    "deviceLabel": "Pixel 8 local",
    "onboardingCompleted": false,
    "profile": null,
    "settings": {
      "locale": "zh-CN",
      "unit": "metric"
    }
  }
}
```

### `PUT /v1/users/me/profile`

Requires `X-Dev-User-Id`.

Request body:

```json
{
  "gender": "male",
  "age": 25,
  "heightCm": 175,
  "weightKg": 70,
  "goal": "strength",
  "experience": "beginner",
  "daysPerWeek": 4,
  "equipment": ["full_gym", "dumbbell_only"],
  "persona": "coach"
}
```

Validation rules mirror the existing mini program onboarding constraints:

- `gender`: `male`, `female`, or `other`.
- `age`: integer from 16 to 65.
- `heightCm`: integer from 140 to 220.
- `weightKg`: number from 30 to 200.
- `goal`: `bulk`, `cut`, `strength`, or `fitness`.
- `experience`: `beginner`, `intermediate`, or `advanced`.
- `daysPerWeek`: integer from 3 to 5.
- `equipment`: non-empty array containing only `full_gym`, `barbell_bench`, `dumbbell_only`, `bodyweight`.
- `persona`: `coach`, `buddy`, `comedian`, or `beauty_coach`.

Success response returns the current user with profile and sets `onboardingCompleted` to `true`.

Validation failures return HTTP 400 with field-level errors. Missing or unknown development users return HTTP 401.

## Database Design

All primary keys are UUIDs. Timestamps use `created_at` and `updated_at`. User-facing state uses snake_case database columns and camelCase API responses.

### User Foundation

`users`

- `id`
- `dev_external_id`
- `device_label`
- `onboarding_completed`
- `active_plan_id`
- `created_at`
- `updated_at`

`user_profiles`

- `id`
- `user_id`
- `gender`
- `age`
- `height_cm`
- `weight_kg`
- `goal`
- `experience`
- `days_per_week`
- `equipment`
- `persona`
- `created_at`
- `updated_at`

`user_settings`

- `id`
- `user_id`
- `locale`
- `unit`
- `created_at`
- `updated_at`

`consent_logs`

- `id`
- `user_id`
- `privacy_version`
- `terms_version`
- `accepted_at`
- `source`

### Training Foundation

`training_plans`

- `id`
- `user_id`
- `status`
- `source`
- `start_date`
- `end_date`
- `created_at`
- `updated_at`

`plan_days`

- `id`
- `training_plan_id`
- `day_index`
- `scheduled_date`
- `day_type`
- `created_at`
- `updated_at`

`plan_exercises`

- `id`
- `plan_day_id`
- `exercise_id`
- `sort_order`
- `target_sets`
- `target_reps`
- `target_rest_seconds`
- `recommended_weight_kg`
- `created_at`
- `updated_at`

### Workout Foundation

`workout_sessions`

- `id`
- `user_id`
- `training_plan_id`
- `plan_day_id`
- `status`
- `started_at`
- `completed_at`
- `duration_seconds`
- `created_at`
- `updated_at`

`workout_sets`

- `id`
- `workout_session_id`
- `exercise_id`
- `set_index`
- `target_reps`
- `actual_reps`
- `weight_kg`
- `rpe`
- `completed_at`
- `created_at`

`exercise_feedback`

- `id`
- `user_id`
- `exercise_id`
- `workout_session_id`
- `rpe`
- `notes`
- `created_at`

`exercise_adjustments`

- `id`
- `user_id`
- `exercise_id`
- `average_rpe`
- `feedback_count`
- `next_sets`
- `next_reps`
- `next_rest_seconds`
- `next_weight_kg`
- `trend`
- `updated_at`

### Content Foundation

`exercises`

- `id`
- `slug`
- `name_cn`
- `aliases`
- `category`
- `primary_muscles`
- `equipment`
- `difficulty`
- `instructions`
- `common_mistakes`
- `safety_notes`
- `status`
- `created_at`
- `updated_at`

`exercise_media`

- `id`
- `exercise_id`
- `media_type`
- `url`
- `source`
- `license`
- `sort_order`
- `created_at`

`recipes`

- `id`
- `slug`
- `name`
- `meal_type`
- `suitable_goals`
- `ingredients`
- `calories`
- `protein_g`
- `carbs_g`
- `fat_g`
- `prep_time_minutes`
- `difficulty`
- `allergens`
- `status`
- `created_at`
- `updated_at`

## Data Migration Boundaries

The mini program collections remain historical references. Plan 2 does not import existing cloud data.

Mapping decisions:

- `_openid` becomes `users.id` for all new Android data.
- Mini program `users.profile` becomes `user_profiles`.
- Mini program `plans.weeklyPlan[]` becomes `training_plans`, `plan_days`, and `plan_exercises`.
- Mini program `training_logs` becomes `workout_sessions` and `workout_sets`.
- Mini program exercise and recipe JSON shapes inform `exercises`, `exercise_media`, and `recipes`.

## Error Handling

API errors use a stable JSON envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数不合法",
    "fields": {
      "age": "年龄需在 16-65 岁之间"
    }
  }
}
```

Initial error codes:

- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `NOT_FOUND`
- `DATABASE_UNAVAILABLE`
- `INTERNAL_ERROR`

## Testing Strategy

Plan 2 uses TDD for implementation.

Required tests:

- `GET /health` returns `status=ok` when the database is reachable.
- `POST /v1/dev/users` creates a user with default settings.
- `POST /v1/dev/users` returns an existing user for repeated `externalId`.
- `GET /v1/users/me` returns user, profile, and settings for a valid `X-Dev-User-Id`.
- `GET /v1/users/me` rejects missing or unknown development users.
- `PUT /v1/users/me/profile` creates or updates a profile and marks onboarding complete.
- `PUT /v1/users/me/profile` rejects invalid age, height, weight, daysPerWeek, equipment, and persona values.
- Prisma schema migration is exercised against a test PostgreSQL database.

## Success Criteria

Plan 2 is complete when:

1. `backend/` can install dependencies.
2. PostgreSQL starts locally with Docker Compose.
3. Prisma migration creates the foundation schema.
4. `GET /health` works against the local database.
5. Development user creation works.
6. Current-user and profile endpoints work.
7. Automated tests pass.
8. `docs/PROJECT_CONTEXT.md` names Plan 2's current status and next step.

## Risks

- Docker may not be running locally. If unavailable, tests that require PostgreSQL must report the blocker clearly.
- Production authentication is not included. The `dev-auth` module must be isolated so Plan 3 can replace it cleanly.
- Full content import is not included. The schema must still be capable of storing later exercise and recipe seed data.
