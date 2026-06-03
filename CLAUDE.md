# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read these first

1. [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) — persistent project memory. [AGENTS.md](AGENTS.md) mandates reading it before any code change and updating it at the end of every stage. Plan summary, current pause point, next task, suggested commit message all live here.
2. [docs/android-app-product-plan.md](docs/android-app-product-plan.md) — the active product roadmap (Android-first).
3. [DESIGN.md](DESIGN.md) — original WeChat-miniprogram product design. Useful as domain reference (rule engine math, RPE feedback model, 70-exercise catalog, persona system), but the platform decisions in it are superseded by the Android plan.

The parent workspace [/Users/steve/Desktop/Smart Everything/CLAUDE.md](../CLAUDE.md) classifies AIFitnessPro as "微信小程序，不在本规范范围". That is now stale — the project pivoted to a native Android app + NestJS backend. **This file overrides the parent's stack rules for AIFitnessPro.**

## Active codebase vs legacy

| Path | Status | Notes |
|---|---|---|
| `android/` | **Active** | Kotlin + Jetpack Compose + Room + DataStore + Coil. Min SDK 26, target 35. |
| `backend/` | **Active** | NestJS 10 + Prisma 5 + PostgreSQL 16. Independent service for the Android app. |
| `miniprogram/`, `cloudfunctions/` | **Legacy** | WeChat mini-program + cloud functions. Not under active development. Don't add features here. |
| `scripts/sync_exercise_catalog.js`, `tests/` | Tooling | Exercise data sync from ExerciseDB + Wger ([EXERCISE_SYNC.md](EXERCISE_SYNC.md)) and root-level Jest tests for the legacy mini-program. |

When a request is ambiguous about "the app", default to the Android app + its backend.

## Commands

### Backend (`backend/`)

```bash
docker compose up -d postgres        # PostgreSQL 16 on :5432
npm install
npm run prisma:generate
npm run prisma:migrate                # prisma migrate deploy (use migrate:dev when authoring migrations)
npm run seed                          # prisma/seed.ts + seed-media.ts (70 exercises + core 30 media)
npm run start:dev                     # NestJS on :8000
npm test                              # e2e (test/jest-e2e.json, --runInBand)
npm run test:unit                     # unit (test/jest-unit.json, *.test.ts colocated)
npm test -- --testNamePattern="<name>"   # single e2e test
```

Both Jest configs set `rootDir: ".."` (the repo root for the test config, which actually means `backend/`). Run them from `backend/`.

### Android (`android/`)

```bash
export JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export GRADLE_USER_HOME=$HOME/.gradle
./gradlew :app:assembleDebug
./gradlew :app:testDebugUnitTest                                    # all unit tests
./gradlew :app:testDebugUnitTest --tests "*WorkoutStateMachineTest"  # one class
./gradlew :app:installDebug                                         # to AVD AIFitnessPro_API35 (Pixel 8 / API 35)
```

Debug builds pin `AIFITNESSPRO_API_BASE_URL = http://10.0.2.2:8000/` (emulator → host). Release uses `https://api.aifitnesspro.example/`.

### Legacy mini-program

`npm test` at the repo root runs Jest against `tests/**/*.test.js` (mini-program utils + cloud functions). Not run for Android/backend work.

## Backend architecture

NestJS module tree: `AppModule` → `PrismaModule`, `PlansModule`, `WorkoutsModule`, `ExercisesModule`, plus loose controllers for `health`, `dev-auth`, `users`. Module folders follow `*.controller.ts` / `*.service.ts` / `*.dto.ts` / `*-presenter.ts`. `presentXxx()` helpers shape Prisma rows into API responses — keep DTO↔presenter symmetry when adding fields.

- **Auth shim** — [DevAuthGuard](backend/src/dev-auth/dev-auth.guard.ts) reads `X-Dev-User-Id` and loads the user. Bootstrap a user via `POST /v1/dev/users` (see [backend/README.md](backend/README.md)). This is a Plan-2 placeholder; real auth comes later. Every authenticated controller decorates with `@UseGuards(DevAuthGuard)` and injects the user via `@CurrentUser()`.
- **Validation / errors** — global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform) + `ApiErrorFilter` + `validationExceptionFactory` in `src/common/`. Throw the typed errors / structured exceptions from there rather than raw `HttpException`.
- **Plan engine** — [src/plans/plan-rule-engine.ts](backend/src/plans/plan-rule-engine.ts) generates the 28-day PPL split from a `UserProfile`. It is the canonical source of progression math; keep [src/plans/plan-rule-engine.test.ts](backend/src/plans/plan-rule-engine.test.ts) green.
- **Workout sync** — single endpoint `POST /v1/workouts/sessions/sync` accepts a full session blob (status, sets, timestamps) from the Android offline queue and upserts via `WorkoutsService.syncSession`. Idempotency comes from the client-generated session id.
- **Exercise content** — `GET /v1/exercises` (list with filters) + `GET /v1/exercises/:slug` (detail with media). Source data lives in [prisma/data/exercise-catalog.json](backend/prisma/data/exercise-catalog.json) + `exercise-media.json`; reseed via `npm run seed`.

Schema is Prisma ([backend/prisma/schema.prisma](backend/prisma/schema.prisma)). Enum names map to lowercase snake-case strings — keep DTO unions aligned with the Prisma enum literals. Always go through Alembic-equivalent here: `prisma migrate dev` to author, `prisma migrate deploy` to apply. Don't hand-edit the database.

## Android architecture

Package `com.aifitnesspro.android`. Single-Activity Compose app:

- **`core/api`** — Retrofit-free `ApiClient` (kotlinx.serialization). Injects `X-Dev-User-Id` from DataStore.
- **`core/workout`** — pure-Kotlin **`WorkoutStateMachine`** drives the session loop (`NOT_STARTED → IN_PROGRESS ⇄ RESTING → COMPLETED`). Persistence in `local/` (Room: `WorkoutDatabase`, `WorkoutDao`, `WorkoutEntities`). **`WorkoutSessionRepository`** owns the in-progress snapshot; **`WorkoutSyncRepository`** flushes completed sessions to `POST /v1/workouts/sessions/sync`. The repo currently uses `fallbackToDestructiveMigration()` — schema bumps wipe local workout data.
- **`core/plan`**, **`core/exercise`**, **`core/session`**, **`core/settings`** — analogous repositories for plan fetch, exercise library, session id, persisted prefs.
- **`feature/<screen>`** — Compose screens (`home`, `training`, `exercise`, `workout`, `onboarding`, `profile`, `consent`). One screen per folder; screen-scoped ViewModels live alongside.
- **`navigation/AppNavHost.kt`** — Nav Compose graph. Tab destinations and parameterized routes (workout, exercise detail) are declared in [AppDestination.kt](android/app/src/main/java/com/aifitnesspro/android/navigation/AppDestination.kt). Use `AppDestination.workoutRoute(dayIndex)` rather than building route strings inline.

Important invariants:

- The state machine is the single source of truth for session progress. Tests in `WorkoutStateMachineTest` assert transitions — extend them when adding a transition.
- Coil loads media URLs from the backend's `previewMediaUrl`. The CDN domain (`media.aifitnesspro.dev`) is a placeholder; missing media must fall back to the "动图同步中" placeholder, not crash.
- Sessions with zero recorded sets are marked `synced` locally without hitting the API — see the empty-set skip in `WorkoutSyncRepository` and its test.

## Conventions

- Update [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) at the end of each work stage (sections 5–12). It is the project's persistent memory and the next session's entry point.
- API responses return resource-keyed objects (`{ session: ... }`, `{ exercises: [...] }`) — not a `{ success, data }` envelope. Keep this when adding endpoints.
- Soft delete by status enum, not row delete (see `ContentStatus`, `PlanStatus`).
- Don't add features to `miniprogram/` or `cloudfunctions/` unless explicitly asked.
- For exercise content updates, prefer regenerating [prisma/data/exercise-catalog.json](backend/prisma/data/exercise-catalog.json) via `npm run exercise:sync` ([EXERCISE_SYNC.md](EXERCISE_SYNC.md)) rather than hand-editing.
