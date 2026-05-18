---
name: aifitnesspro
description: This skill should be used when developing, debugging, or extending the AIFitnessPro WeChat Mini Program. It covers architecture decisions, coding conventions, cloud function patterns, data models, and the feedback/adaptation engine. Trigger when the user mentions AIFitnessPro, cloud functions (genPlan/saveFeedback/unlockAchievement/getPlan/login), training session logic, persona engine, nutrition engine, or WeChat Mini Program development in the context of this project.
---

# AIFitnessPro — Project Development Skill

## Overview

AIFitnessPro is a WeChat native Mini Program with Cloud Development, providing adaptive training plans + workout buddy emotional support + structured diet advice for male users aged 20-40. This skill encodes all project conventions, architecture decisions, and development patterns so any CodeBuddy instance can work on this project consistently.

## Architecture Summary

**Stack**: WeChat Mini Program + Cloud Development (Cloud Functions + Cloud Database + Cloud Storage)

**Core Data Flow**:
```
User Registration → onboarding (9-step survey) → genPlan cloud function → 7-day PPL training plan
                                              ↓
Training Session → RPE Feedback → saveFeedback cloud function → Adaptive intensity adjustment
                                              ↓
Training Complete → training-summary → unlockAchievement cloud function → Achievement/Points
                                              ↓
Diet Advice ← NutritionEngine (BMR/TDEE calc) ← User Profile
                                              ↓
Buddy Talk ← PersonaEngine (4 styles × 5 scenes) ← User-chosen persona
```

**Key Modules**: See `references/architecture.md` for full module relationships and data models.

## Coding Conventions

All code in this project follows specific conventions for cloud function return format, error handling, data isolation, and naming. See `references/conventions.md` for complete rules.

**Critical Rules (quick reference)**:

1. **Cloud functions** must use `ok(data)` / `fail(msg)` return format — never throw raw errors
2. **Data isolation**: all local storage keys prefixed with `${openid}_` to prevent cross-user data leakage
3. **Feedback modes**: `standard` (3-button), `rpe` (1-10 scale), `minimal` (no feedback, auto RPE=7)
4. **Periodization**: 4-week cycle — Adaptation(1.0x) → Progression(1.1x) → Peak(1.15x) → Deload(0.6x)
5. **Fatigue decay**: later sets in same exercise have "too heavy" feedback weight reduced by 50%

## Module Completion Status

| Module | Status | Notes |
|--------|--------|-------|
| User Profile & 9-step Survey | 100% | days_per_week 3-5 limit, equipment required validation |
| Plan Engine (PPL) | 100% | genPlan cloud function, 4-week periodization |
| Training Session | 95% | Screen on, RPE feedback, breakpoint resume (local+cloud) |
| Exercise Library | 70% | ~48 exercises; GIF/video URLs empty — needs `exercise:sync` |
| Persona Engine | 100% | 4 styles × 5 scenes, 34+ templates per persona |
| Diet Module | 95% | 150 recipes, train/rest day toggle, NutritionEngine |
| Training Summary | 90% | Stats + achievement banner; missing share card & trend chart |
| Achievement System | 95% | 7 achievements + points, unified ok/fail returns |
| Adaptive Feedback | 95% | saveFeedback with set-order fatigue decay weighting |
| Cloud Function Consistency | 100% | 5 functions unified ok()/fail() return format |
| Test Suite | 90% | 42 tests passing |

## Common Development Tasks

### Adding a New Cloud Function

1. Create directory under `cloudfunctions/<name>/`
2. Add `index.js` with `exports.main = async (event, context) => { ... }`
3. Add `package.json` with `"wx-server-sdk": "~2.6.3"` dependency
4. Use `ok(data)` / `fail(msg)` for all return paths
5. Get openid via `const { OPENID } = cloud.getWXContext()`
6. Register in `miniprogram/app.js` if needed for global state

### Adding a New Page

1. Create 4 files under `miniprogram/pages/<name>/`: `.js`, `.json`, `.wxml`, `.wxss`
2. Register page path in `miniprogram/app.json` pages array
3. If Tab page, also add to `tabBar.list` in app.json
4. Import `getApp()` for global data access
5. Use `wx.cloud.callFunction()` for cloud function calls

### Modifying Training Logic

The training page (`miniprogram/pages/training/training.js`) is the largest file (~60KB). When modifying:
- Feedback mode logic: search for `getFeedbackMode()`, `minimalMode`, `rpeValue`
- Breakpoint resume: search for `resumeTraining`, `saveTrainingState`, `training_logs`
- Timer logic: search for `startTimer`, `clearTimers`, `restTimer`
- Persona messages: search for `showEncouragementMessage`, `PersonaEngine`

### Running Tests

```bash
npm test                    # All 42 tests
npm run validate            # Full module validation with mocks
npm run validate:core       # Core module validation (no Page dependency)
npm run exercise:sync       # Sync exercise catalog from ExerciseDB/Wger
```

## Known Issues & TODO

- **training.js is 60KB**: should be split into focused modules (timer, feedback, resume, minimal)
- **Exercise GIF/video URLs empty**: need to configure ExerciseDB/Wger API keys and run `npm run exercise:sync`
- **Share card not implemented**: needs Canvas drawing + `wx.canvasToTempFilePath`
- **No久未训练召回**: needs subscription message template
- **validate.js & validate_core.js have ~80% code duplication**: should extract common mocks to `tests/helpers/`

## Resources

### references/

- `architecture.md` — Full data flow, module relationships, cloud database schemas, and cloud function specs
- `conventions.md` — Coding style, naming conventions, return format rules, data isolation patterns

### scripts/

- `validate.sh` — One-command validation script replacing the duplicated validate.js/validate_core.js
