# AIFitnessPro — Architecture Reference

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | WeChat Mini Program (WXML/WXSS/JS) | Native, no framework |
| Backend | WeChat Cloud Development | Cloud Functions + Cloud Database + Cloud Storage |
| Cloud SDK | wx-server-sdk ~2.6.3 | All cloud functions use same version |
| Cloud Env | cloud1-6g1a5yel097ba48d | Configured in `miniprogram/config.js` |
| Base Library | 3.15.2 | WeChat Mini Program base library version |
| Testing | Jest ^30.3.0 | 42 tests, run via `npm test` |
| AppID | wx0b39a8a84f0a810f | Test/production AppID |

## Page Architecture

### Registered Pages (9 total)

| Page Path | Function | Tab Page |
|-----------|----------|----------|
| `pages/index/index` | Home — training plan overview | Yes (首页) |
| `pages/training/training` | Training session — timer, RPE, breakpoint resume | Yes (训练) |
| `pages/exercises/exercises` | Exercise library list | Yes (动作库) |
| `pages/exercise-detail/exercise-detail` | Exercise detail (GIF + instructions) | No |
| `pages/diet/diet` | Diet advice — train/rest day toggle | Yes (饮食) |
| `pages/profile/profile` | User center — stats, settings, achievements | Yes (我的) |
| `pages/onboarding/onboarding` | New user 9-step survey | No |
| `pages/training-summary/training-summary` | Post-workout summary | No |
| `pages/achievements/achievements` | Achievement wall | No |

### Custom TabBar

5 tabs with custom implementation (`custom-tab-bar/`):
- Selected color: `#6C5CE7` (purple)
- Unselected color: `#8E8EA0`
- Background: `#FFFFFF`

## Module Architecture

### Frontend Utility Modules (`miniprogram/utils/`)

| Module | Size | Responsibility |
|--------|------|----------------|
| `persona.js` | 29KB | PersonaEngine — 4 styles (coach/buddy/comedian/zen) × 5 scenes (warmup/during/finish/rpe/streak), 34+ templates per persona |
| `exercise-library.js` | 26KB | Cloud-first + local-fallback exercise loading, 8 supplementary exercises |
| `nutrition.js` | 10KB | NutritionEngine — BMR/TDEE calculation, train/rest day differentiation, daily meal plan generation |
| `api.js` | 0.4KB | Cloud database CRUD wrapper (getUser/updateUser) |

### Cloud Functions (`cloudfunctions/`)

| Function | Size | Responsibility |
|----------|------|----------------|
| `genPlan` | 20KB | Personalized 7-day training plan generator. PPL split + 4-week periodization |
| `saveFeedback` | 13KB | Training feedback collection + adaptive adjustment with set-order fatigue decay |
| `unlockAchievement` | 6KB | Achievement system + points unlock (7 achievements) |
| `getPlan` | 1.5KB | Read user's current training plan |
| `login` | 0.5KB | User login, get openid |

### Data Files (`miniprogram/data/`)

| File | Size | Content |
|------|------|---------|
| `exercises.json` | 19KB | ~48 exercises (bundle seed) |
| `recipes.json` | 84KB | 150 recipes across 6 meal types |

## Cloud Database Collections

### Core Collections (5)

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User profiles | `_openid`, `profile`, `streak_days`, `achievements[]`, `total_points`, `feedback_mode` |
| `plans` | Training plans | `userId`, `weeklyPlan[]`, `session_feedback[]`, `cycleNumber`, `weekNumber` |
| `feedback` | Training feedback | `planId`, `exerciseIndex`, `rpe`, `intensityAdjustment` |
| `achievement_logs` | Achievement unlock records | `userId`, `achievementId`, `pointsAwarded` |
| `training_logs` | Breakpoint resume + session state | `status` (in_progress/completed/abandoned), `resume_point`, `mode` |

### Design-Phase Collections (Not Yet Implemented)

| Collection | Purpose | Status |
|------------|---------|--------|
| `exercises` | Cloud exercise metadata | Scripts ready, needs `exercise:sync` execution |
| `user_exercise_profiles` | Per-user per-exercise recommendations | ML-upgrade fields reserved |
| `warmup_cooldowns` | Warmup/cooldown sequences | Logic embedded in training.js |
| `achievements` | Achievement definitions | Hardcoded in unlockAchievement function |
| `meal_recipes` | Cloud recipe library | Currently local-only (recipes.json) |
| `daily_diet_plans` | Daily diet plan + user selections | Not implemented |
| `mottos` | Persona motto library | Logic embedded in persona.js |
| `user_motto_logs` | User motto usage tracking | De-dup logic in persona.js |

## Core Data Flows

### 1. User Registration Flow

```
App Launch → check onboarding_completed
  → false: navigateTo onboarding (9 steps)
    → step 9 complete: wx.cloud.callFunction('login')
    → then: wx.cloud.callFunction('genPlan', { profile })
    → save plan to 'plans' collection
    → update user: onboarding_completed = true, current_plan_id
  → true: load existing plan from 'plans' collection
```

### 2. Training Session Flow

```
Enter Training Page
  → check for incomplete training_logs (breakpoint resume)
  → if exists: show resume dialog
  → load today's workout from plan
  → show warmup sequence
  → for each exercise:
    → for each set:
      → start timer → user completes → record actual weight×reps
      → if not minimal mode: show feedback selector (3-button or RPE)
      → if feedback ≠ skip: call saveFeedback for instant adjustment
      → show rest timer with persona encouragement
    → exercise complete: show persona message
  → show cooldown sequence
  → training complete:
    → if minimal mode: auto-submit RPE=7
    → else: show RPE selection
    → navigate to training-summary
    → call unlockAchievement
```

### 3. Adaptive Feedback Engine

**Instant Adjustment (within same workout)**:
- Too light → next set weight +5% (rounded to 2.5kg increments)
- Just right → maintain
- Too heavy → next set weight -10%, reps target unchanged

**Set-Order Fatigue Decay**:
- For later sets (e.g., sets 3-4 of 4), "too heavy" feedback weight reduced by 50%
- Rationale: cumulative fatigue is expected, not a signal to reduce

**Cross-Session Adjustment (next time same exercise)**:
- ≥80% sets "too light" → weight +5%~+10%
- ≥60% sets "just right" → weight +2.5% (progressive overload)
- ≥50% sets "too heavy" → maintain
- ≥80% sets "too heavy" → weight -5%

**Minimal Mode Inference**:
- actual_reps ≥ planned_reps → "just right"
- actual_reps < planned_reps × 0.7 → "too heavy"
- actual_reps > planned_reps × 1.3 → "too light"

### 4. Periodization Framework

4-week cycle with intensity multipliers:

| Week | Phase | Multiplier | RPE Target |
|------|-------|-----------|------------|
| 1 | Adaptation | 1.0x | 6-7 |
| 2 | Progression | 1.1x | 7-8 |
| 3 | Peak | 1.15x | 8-9 |
| 4 | Deload | 0.6x | 5-6 |

After cycle completion:
- ≥80% training days completed → next cycle base weight +5%
- 50-80% → maintain
- <50% → prompt survey (reduce frequency/volume?)

## Periodization Strategy

### Split Matching by Days Per Week

| Days/Week | Split | Daily Focus |
|-----------|-------|-------------|
| 3 | PPL | Push: chest+shoulders+triceps; Pull: back+biceps; Legs: quads+hamstrings+glutes |
| 4 | Upper/Lower | Upper A: chest+back; Lower A: legs+core; Upper B: shoulders+arms; Lower B: glutes+posterior chain |
| 5 | Bro Split Modified | Chest / Back / Shoulders / Legs / Arms+Weak Point |
