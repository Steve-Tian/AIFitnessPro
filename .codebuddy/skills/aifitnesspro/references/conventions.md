# AIFitnessPro — Coding Conventions Reference

## Cloud Function Return Format

All cloud functions MUST use the unified return format:

```javascript
// Success
return { success: true, data: { ... } }

// Or using the ok() helper (defined in each cloud function):
function ok(data = {}) {
  return { success: true, ...data }
}

// Failure
return { success: false, message: 'Error description' }

// Or using the fail() helper:
function fail(message) {
  return { success: false, message }
}
```

**Never** throw raw errors or return non-standard formats. Every return path must go through `ok()` or `fail()`.

## Cloud Function Structure

Every cloud function follows this pattern:

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function ok(data = {}) { return { success: true, ...data } }
function fail(message) { return { success: false, message } }

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()
    // ... business logic ...
    return ok({ /* result data */ })
  } catch (err) {
    return fail(err.message || 'Unknown error')
  }
}
```

## Data Isolation

### Local Storage Key Namespacing

All `wx.setStorageSync` / `wx.getStorageSync` keys MUST be prefixed with `${openid}_`:

```javascript
// Correct
const key = `${openid}_training_state`
wx.setStorageSync(key, state)

// Wrong — will cause cross-user data leakage
wx.setStorageSync('training_state', state)
```

### Global Cache Clear

The `clearUserGlobalCache()` method in `app.js` handles user logout/switch by clearing all openid-prefixed keys.

### Cloud Database Queries

Always filter by `_openid` or `userId` matching the authenticated user:

```javascript
const { OPENID } = cloud.getWXContext()
const result = await db.collection('users').where({ _openid: OPENID }).get()
```

## Feedback Mode System

Three feedback modes controlled by `user.feedback_mode`:

| Mode | Value | Behavior |
|------|-------|----------|
| Standard | `'standard'` | 3-button feedback (too light / just right / too heavy) after each set |
| RPE | `'rpe'` | 1-10 RPE scale after each set |
| Minimal | `'minimal'` | No per-set feedback; auto-submit RPE=7 at workout end |

Detection in training.js:

```javascript
getFeedbackMode() {
  const user = app.globalData.userInfo
  return (user && user.feedback_mode) || 'standard'
}
```

## Persona System

### Supported Personas (4 styles)

| Persona | Code | Tone |
|---------|------|------|
| Hardcore Coach | `'coach'` | Direct, commanding |
| Warm Buddy | `'buddy'` | Relaxed, supportive |
| Comedic Roaster | `'comedian'` | Teasing, humorous |
| Zen Master | `'zen'` | Calm, philosophical |

### Scene Types (5 scenes)

| Scene | Code | When |
|-------|------|------|
| Warmup | `'warmup'` | Before training starts |
| During | `'during'` | During exercise execution |
| Finish | `'finish'` | After exercise completes |
| RPE | `'rpe'` | During RPE feedback |
| Streak | `'streak'` | Streak milestone |

Usage:

```javascript
const engine = new PersonaEngine('coach')
const msg = engine.getRandomMessage('warmup')
const rpeResponse = engine.getRPEResponse(8)
const streakMsg = engine.getStreakMessage(7)
```

## Nutrition Engine

### BMR Calculation (Mifflin-St Jeor)

```javascript
// Male
BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
// Female
BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
```

### TDEE Multipliers

| Activity Level | Multiplier |
|---------------|------------|
| Sedentary | BMR × 1.2 |
| Light | BMR × 1.375 |
| Moderate (training 3-5 days) | BMR × 1.55 |
| Heavy | BMR × 1.725 |

### Goal-Based Calorie Adjustment

| Goal | Adjustment |
|------|-----------|
| Muscle gain (bulk) | TDEE + 300~500 kcal |
| Fat loss (cut) | TDEE - 300~500 kcal |
| Strength | TDEE + 100~300 kcal |

### Macro Split

| Goal | Protein | Carbs (of remaining) | Fat (of remaining) |
|------|---------|---------------------|-------------------|
| Bulk | weight × 2.0g | 60% | 40% |
| Cut | weight × 2.2g | 50% | 50% |
| Strength | weight × 1.8g | 60% | 40% |

## File Naming & Organization

### Page Files

Each page directory contains exactly 4 files:
```
pages/<name>/
├── <name>.js      # Page logic
├── <name>.json    # Page configuration
├── <name>.wxml    # Template
└── <name>.wxss    # Styles
```

### Page JSON Config

Minimal page config:
```json
{
  "usingComponents": {}
}
```

If the page uses custom components, add them to `usingComponents`.

### Utility Modules

Utility modules export a class or object:
```javascript
class SomeEngine {
  constructor(profile) { ... }
  method() { ... }
}
module.exports = { SomeEngine }
```

## Error Handling Patterns

### Cloud Functions

```javascript
exports.main = async (event, context) => {
  try {
    // Validate inputs
    if (!event.requiredField) return fail('Missing required field')
    
    // Business logic
    const result = await someAsyncOperation()
    return ok({ result })
  } catch (err) {
    console.error('Function error:', err)
    return fail(err.message || 'Unknown error')
  }
}
```

### Frontend Pages

```javascript
wx.cloud.callFunction({
  name: 'genPlan',
  data: { profile }
}).then(res => {
  if (res.result.success) {
    // Handle success
  } else {
    wx.showToast({ title: res.result.message, icon: 'none' })
  }
}).catch(err => {
  console.error('Cloud function error:', err)
  wx.showToast({ title: '操作失败，请重试', icon: 'none' })
})
```

## Recipe Data Schema

Each recipe in `recipes.json` follows this structure:

```json
{
  "id": "breakfast_001",
  "name": "鸡蛋全麦面包牛奶",
  "meal_type": "breakfast",
  "suitable_goals": ["muscle_gain", "strength"],
  "ingredients": [
    { "name": "鸡蛋", "amount": "2个", "protein": 12, "carbs": 1, "fat": 10, "calories": 140 },
    { "name": "全麦面包", "amount": "2片", "protein": 6, "carbs": 24, "fat": 2, "calories": 138 }
  ],
  "calories": 418,
  "macros": { "protein": 18, "carbs": 25, "fat": 12 },
  "cooking_tip": "鸡蛋水煮8分钟口感最佳",
  "tags": ["高蛋白", "快手"]
}
```

Meal types: `breakfast`, `lunch`, `dinner`, `pre_workout`, `post_workout`, `snack`

## Exercise Data Schema

Each exercise in `exercises.json` follows this structure:

```json
{
  "id": "bench_press",
  "name": "杠铃卧推",
  "category": "chest",
  "muscle": ["chest", "triceps", "anterior_deltoid"],
  "equipment": "barbell",
  "difficulty": "intermediate",
  "instructions": ["下背保持中立", "杠铃下放至乳头水平线", "肩胛骨收紧后缩"],
  "common_mistakes": ["臀部离开凳面", "手腕过度后翻"],
  "default_sets": 4,
  "default_reps": 10,
  "alternatives": ["dumbbell_press", "incline_bench_press"]
}
```

## UI Color Palette

| Usage | Color | Hex |
|-------|-------|-----|
| Primary / Selected Tab | Purple | `#6C5CE7` |
| Unselected Tab | Gray | `#8E8EA0` |
| Background | Light Gray | `#F5F6FA` |
| Navigation Bar | White | `#FFFFFF` |
| Text | Black | Default |

## Git Conventions

- Branch: `main` is the development branch
- No CI/CD pipeline — deployment is manual via WeChat Developer Tools
- Cloud functions uploaded individually via right-click → "Upload Cloud Function"
- Mini program code uploaded via toolbar → "Upload"
