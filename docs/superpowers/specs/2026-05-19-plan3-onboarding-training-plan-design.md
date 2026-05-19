# Plan 3 Design: Onboarding + Training Plan Generation

> Date: 2026-05-19
> Plan scope: Auth / Onboarding / Training plan generation (partial — dev auth continues, production auth deferred)
> Builds on: Plan 1 (Android shell), Plan 2 (backend foundation), Plan 3 slice (Android API client)

## Decision

Continue Plan 3 with the **end-to-end flow first** approach: punch through the complete user path from Onboarding → Profile submission → Plan generation → Home screen today card, using DataStore JSON for local plan caching (Room migration deferred to Plan 4). Dev auth (`X-Dev-User-Id`) continues; production auth is out of scope.

## User Flow

```
Privacy consent (existing)
    ↓
OnboardingScreen (new — 6 steps)
  Step 1: Goal        (single-select card)
  Step 2: Experience  (single-select card)
  Step 3: Equipment   (multi-select chip)
  Step 4: Body data   (gender + age + height + weight — combined page)
  Step 5: Days/week   (single-select: 3 / 4 / 5)
  Step 6: Persona     (single-select card)
    ↓
PUT /v1/users/me/profile  (existing API)
    ↓
POST /v1/plans/generate   (new)
  → backend: synchronously returns rule-generated 28-day plan
  → backend: fire-and-forget Claude API call to append day notes
    ↓
Android stores plan JSON in DataStore
    ↓
HomeScreen: today's workout card
```

## Architecture

| Layer | New additions |
|-------|---------------|
| Android UI | `OnboardingScreen` (6 steps), `HomeScreen` today card |
| Android data | `OnboardingViewModel`, `PlanRepository` (DataStore JSON) |
| Backend | `plans` module: `POST /v1/plans/generate`, `GET /v1/plans/active` |
| Backend async | Claude API call to append `dayNote` per plan day |

## Android: Onboarding UI

### Screen structure

`OnboardingScreen` is a single Composable with `currentStep: Int` state. Top progress bar (6 slots), bottom "Next" / "Finish" button.

| Step | Content | Input type |
|------|---------|------------|
| 1 | Goal (bulk / cut / strength / fitness) | Single-select large card |
| 2 | Experience (beginner / intermediate / advanced) | Single-select large card |
| 3 | Equipment (full_gym / barbell_bench / dumbbell_only / bodyweight) | Multi-select chip, ≥1 required |
| 4 | Body data: gender + age + height + weight | Combined page — gender radio + number inputs |
| 5 | Days per week (3 / 4 / 5) | Single-select |
| 6 | Persona (coach / buddy / comedian / beauty_coach) | Single-select large card |

### State management

Single `OnboardingViewModel` shared across all steps, holding `OnboardingFormState` data class. Selections are in-memory only — if user kills the app and returns, `onboardingCompleted == false` means restart from step 1. No DataStore write until profile submission succeeds.

### Validation (matches backend DTO)

- Age: 16–65
- Height: 140–220 cm
- Weight: 30–200 kg
- Equipment: at least 1 selected

Step 4 "Next" button is disabled when any body-data field is invalid. Inline error text shown per field. Other steps block "Next" only if nothing is selected.

### Navigation logic

After privacy consent, if `onboardingCompleted == false`, navigate to `OnboardingScreen` instead of main tabs. On successful profile submission + plan generation, replace navigation stack with main tabs (`HomeScreen`). Back navigation within onboarding steps is allowed (step -- on back press).

### Submission sequence (in ViewModel)

1. `PUT /v1/users/me/profile` with full form state
2. On 200: `POST /v1/plans/generate`
3. On 200: write plan JSON to DataStore, navigate to main tabs
4. On any error: show inline error banner, stay on final step

## Backend: Plans Module

### New endpoints

```
POST /v1/plans/generate    requires X-Dev-User-Id
GET  /v1/plans/active      requires X-Dev-User-Id
```

### POST /v1/plans/generate

No request body required (profile is already in DB). Steps:

1. Load user's `UserProfile` from DB — reject with `400` if profile incomplete.
2. Run rule engine to build 28-day plan structure.
3. Write `TrainingPlan` + `PlanDay[]` + `PlanExercise[]` to DB, status = `active`. Set any previous active plan to `archived`.
4. Fire-and-forget Claude API call to append `dayNote` per training day (failures are silent — day notes are optional).
5. Return full plan with days and exercises (day notes may be null initially).

### Rule engine logic

| daysPerWeek | Cycle |
|-------------|-------|
| 3 | Push / Pull / Legs |
| 4 | Push / Pull / Legs / Full Body |
| 5 | Push / Pull / Legs / Push / Pull |

- Rest days fill remaining days in each week.
- 28 days = 4 weeks, cycle repeats.
- Exercises selected from `exercises` table filtered by user's `equipment` and `experience`. Minimum 3 exercises per training day.
- `targetSets`, `targetReps`, `targetRestSeconds` assigned by experience level:
  - beginner: 3 sets × 10 reps × 90s rest
  - intermediate: 4 sets × 8 reps × 90s rest
  - advanced: 5 sets × 5 reps × 120s rest

### Claude async day notes

After plan is written to DB, spawn a background task (async function, no queue infrastructure needed at this scale):

- Prompt: provide user goal, experience, and the day's exercise list; ask for one motivational Chinese sentence (≤ 30 characters).
- On success: `UPDATE plan_days SET day_note = ? WHERE id = ?` for each day.
- On failure: swallow error, leave `dayNote` null.

### GET /v1/plans/active

Returns the user's current `active` plan with all `plan_days` and `plan_exercises` (joined with exercise `nameCn`). Returns `404` with `NOT_FOUND` if no active plan exists.

### Response shape (both endpoints)

```json
{
  "plan": {
    "id": "uuid",
    "status": "active",
    "startDate": "2026-05-19",
    "days": [
      {
        "dayIndex": 0,
        "dayType": "push",
        "scheduledDate": "2026-05-19",
        "dayNote": null,
        "exercises": [
          {
            "exerciseId": "uuid",
            "nameCn": "卧推",
            "targetSets": 4,
            "targetReps": 8,
            "targetRestSeconds": 90,
            "recommendedWeightKg": null
          }
        ]
      }
    ]
  }
}
```

### Database

No new migrations needed — `training_plans`, `plan_days`, `plan_exercises`, and `exercises` tables exist from Plan 2. The rule engine requires at least some seed exercises to exist in the `exercises` table; a minimal seed script (core 10 exercises) must be added to unblock plan generation in dev.

## Android: PlanRepository + HomeScreen

### PlanRepository

```
PlanRepository
  ├── generateAndCache(userId)   → POST /v1/plans/generate → DataStore write
  ├── getActivePlan()            → DataStore read (Flow<ActivePlan?>)
  └── refreshFromRemote()        → GET /v1/plans/active → DataStore overwrite
```

Plan JSON stored as a single serialized string under key `active_plan_json`. Deserialized to `ActivePlan` data class on read.

### HomeScreen today card

`HomeViewModel` subscribes to `PlanRepository.getActivePlan()`, finds today's `PlanDay` by matching `scheduledDate` to current date.

States:
- **Loading**: "正在生成你的训练计划…" skeleton card
- **Rest day**: "今日休息，好好恢复" card
- **Training day**: card showing `dayType`, exercise count, estimated duration, first 3 exercise names, "开始训练" button
- **No plan**: prompt to complete onboarding (edge case — should not normally appear post-onboarding)

"开始训练" navigates to existing `TrainingScreen` (Plan 4 implements the full session loop; this plan only wires the entry point).

Estimated duration: `sum(targetSets × (targetReps × 4s + targetRestSeconds))` per exercise, rounded to nearest 5 minutes.

### Offline behavior

If `getActivePlan()` returns a cached plan, HomeScreen renders without network access. `refreshFromRemote()` is called on HomeScreen resume to silently pick up AI day notes; failures are ignored.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Profile submission 400 (validation) | Show field errors on final onboarding step |
| Profile submission network failure | Show banner "网络异常，请重试", stay on step |
| Plan generation 400 (incomplete profile) | Show banner, allow user to go back and fix |
| Plan generation network failure | Show banner "计划生成失败，请重试" with retry button |
| HomeScreen plan refresh failure | Silently use cached plan |
| No exercises in DB for rule engine | Return 503 with `INTERNAL_ERROR`; dev seed script prevents this |

## Testing

**Backend:**
- e2e test: `POST /v1/plans/generate` with valid user + profile → returns 28 days, correct cycle structure
- e2e test: `GET /v1/plans/active` returns same plan
- e2e test: second `POST /v1/plans/generate` archives old plan, returns new active plan
- Unit test: rule engine cycle expansion for 3/4/5 days per week

**Android:**
- Unit test: `OnboardingViewModel` — form validation, step transitions, submission sequence
- Unit test: `PlanRepository` — DataStore read/write, today-day resolution logic
- Unit test: `HomeViewModel` — state derivation from plan data

## Scope Boundaries

**In scope:**
- Onboarding UI (6 steps, validation, submission)
- `PUT /v1/users/me/profile` connection from Android
- `POST /v1/plans/generate` (rule engine + Claude async notes)
- `GET /v1/plans/active`
- `PlanRepository` with DataStore cache
- HomeScreen today card
- Minimal exercise seed (core 10 exercises for dev)

**Out of scope:**
- Production authentication
- Room database (deferred to Plan 4)
- Full exercise library (Plan 5)
- Workout session loop (Plan 4)
- Push notifications
