/**
 * AIFitnessPro - 饮食建议模块
 * 基于用户画像 + 训练日/休息日 + 食谱库，输出每餐 2-3 个选项的每日饮食计划
 */

let cachedRecipes = null
function loadRecipes() {
  if (cachedRecipes) return cachedRecipes
  try {
    const data = require('../data/recipes.json')
    cachedRecipes = Array.isArray(data && data.recipes) ? data.recipes : []
  } catch (e) {
    console.warn('[nutrition] 食谱库加载失败，使用空库', e)
    cachedRecipes = []
  }
  return cachedRecipes
}

const GOAL_ALIAS = {
  muscle_gain: 'bulk',
  bulk: 'bulk',
  fat_loss: 'cut',
  cut: 'cut',
  strength: 'strength'
}

function normalizeGoal(goal) {
  return GOAL_ALIAS[goal] || 'strength'
}

class NutritionEngine {
  /**
   * @param {object} userProfile { gender, age, height, weight, goal, days_per_week }
   * @param {object} options { isTrainingDay: boolean }
   */
  constructor(userProfile, options = {}) {
    this.profile = userProfile || {}
    this.isTrainingDay = options.isTrainingDay !== false // 默认训练日
    this.macros = this.calculateMacros()
    // 兼容旧测试：foodDatabase 字段保留
    this.foodDatabase = this.initializeFoodDatabase()
  }

  normalizeGoal(goal) {
    return normalizeGoal(goal)
  }

  calculateBMR() {
    const { gender, age, height, weight } = this.profile
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5
    }
    return 10 * weight + 6.25 * height - 5 * age - 161
  }

  calculateTDEE(bmr) {
    const activityFactors = {
      3: 1.55,
      4: 1.65,
      5: 1.75
    }
    const factor = activityFactors[this.profile.days_per_week] || 1.55
    return bmr * factor
  }

  /**
   * 计算宏量目标（根据目标 + 训练日/休息日）
   */
  calculateMacros() {
    const bmr = this.calculateBMR()
    const tdee = this.calculateTDEE(bmr)
    const goal = normalizeGoal(this.profile.goal)

    let targetCalories = tdee
    switch (goal) {
      case 'bulk':
        targetCalories = tdee + 400
        break
      case 'cut':
        targetCalories = tdee - 400
        break
      case 'strength':
      default:
        targetCalories = tdee + 150
        break
    }

    // 休息日：减 200 kcal（需求 DESIGN.md §12.2）
    if (!this.isTrainingDay) {
      targetCalories -= 200
    }

    // 蛋白质固定按体重 * 系数，更精准
    const weight = Number(this.profile.weight) || 70
    const proteinPerKg = goal === 'cut' ? 2.2 : goal === 'bulk' ? 2.0 : 1.8
    const protein = Math.round(weight * proteinPerKg)
    const proteinCalories = protein * 4

    // 剩余热量按目标分配到碳水/脂肪
    const remaining = Math.max(targetCalories - proteinCalories, 0)
    const carbRatio = goal === 'cut' ? 0.50 : 0.60
    const fatRatio = 1 - carbRatio

    let carbCalories = remaining * carbRatio
    let fatCalories = remaining * fatRatio

    // 休息日再微调：碳水 -30g，脂肪对应微增
    if (!this.isTrainingDay) {
      carbCalories -= 30 * 4
      fatCalories += 10 * 9
    }

    return {
      calories: Math.round(targetCalories),
      protein,
      carbs: Math.max(0, Math.round(carbCalories / 4)),
      fat: Math.max(0, Math.round(fatCalories / 9)),
      goal,
      isTrainingDay: this.isTrainingDay
    }
  }

  /**
   * 按餐次分配宏量目标
   * 训练日 5 餐，休息日 4 餐
   */
  getMealSchedule() {
    if (this.isTrainingDay) {
      return [
        { type: 'breakfast', label: '早餐',       ratio: 0.22 },
        { type: 'pre_workout', label: '训练前加餐', ratio: 0.10 },
        { type: 'lunch',     label: '午餐',       ratio: 0.28 },
        { type: 'post_workout', label: '训练后加餐', ratio: 0.12 },
        { type: 'dinner',    label: '晚餐',       ratio: 0.28 }
      ]
    }
    return [
      { type: 'breakfast', label: '早餐', ratio: 0.28 },
      { type: 'lunch',     label: '午餐', ratio: 0.35 },
      { type: 'snack',     label: '加餐', ratio: 0.12 },
      { type: 'dinner',    label: '晚餐', ratio: 0.25 }
    ]
  }

  /**
   * 每餐返回 2-3 个食谱选项
   */
  generateDailyMealPlan() {
    const recipes = loadRecipes()
    const goal = normalizeGoal(this.profile.goal)
    const schedule = this.getMealSchedule()
    const totalCalories = this.macros.calories

    const meals = schedule.map((slot) => {
      const targetKcal = Math.round(totalCalories * slot.ratio)
      const candidates = recipes.filter((r) =>
        r.meal_type === slot.type &&
        (!Array.isArray(r.suitable_goals) || r.suitable_goals.includes(goal))
      )
      // 按 |calories - target| 升序取前 3 个
      const sorted = candidates
        .map((r) => ({ ...r, _diff: Math.abs((r.calories || 0) - targetKcal) }))
        .sort((a, b) => a._diff - b._diff)
        .slice(0, 3)
        .map((r) => {
          const { _diff, ...rest } = r
          return rest
        })

      return {
        mealType: slot.type,
        mealLabel: slot.label,
        targetCalories: targetKcal,
        options: sorted,
        selectedId: sorted.length > 0 ? sorted[0].id : ''
      }
    })

    return {
      date: this.formatToday(),
      isTrainingDay: this.isTrainingDay,
      targetCalories: this.macros.calories,
      targetMacros: {
        protein: this.macros.protein,
        carbs: this.macros.carbs,
        fat: this.macros.fat
      },
      meals
    }
  }

  formatToday() {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  /**
   * 根据用户选择返回当前进度（已摄入宏量）
   * @param {Array<{mealType, selectedId}>} selections
   */
  computeIntakeSummary(selections = []) {
    const recipes = loadRecipes()
    let calories = 0, protein = 0, carbs = 0, fat = 0
    selections.forEach((sel) => {
      const recipe = recipes.find((r) => r.id === sel.selectedId)
      if (!recipe) return
      calories += recipe.calories || 0
      const m = recipe.macros || {}
      protein += m.protein || 0
      carbs += m.carbs || 0
      fat += m.fat || 0
    })
    return {
      calories,
      protein,
      carbs,
      fat,
      caloriePercent: Math.min(100, Math.round(calories / Math.max(1, this.macros.calories) * 100)),
      proteinPercent: Math.min(100, Math.round(protein / Math.max(1, this.macros.protein) * 100)),
      carbPercent: Math.min(100, Math.round(carbs / Math.max(1, this.macros.carbs) * 100)),
      fatPercent: Math.min(100, Math.round(fat / Math.max(1, this.macros.fat) * 100))
    }
  }

  /**
   * 宏量摘要（含百分比）
   */
  getMacroSummary() {
    return {
      ...this.macros,
      proteinPercentage: Math.round((this.macros.protein * 4 / this.macros.calories) * 100),
      carbPercentage: Math.round((this.macros.carbs * 4 / this.macros.calories) * 100),
      fatPercentage: Math.round((this.macros.fat * 9 / this.macros.calories) * 100)
    }
  }

  /**
   * 饮食建议文本（兼容旧接口）
   */
  generateAdvice() {
    const summary = this.getMacroSummary()
    const mealPlan = this.generateDailyMealPlan()
    let advice = `【饮食建议】\n`
    advice += `目标热量: ${summary.calories} kcal/天 (${this.isTrainingDay ? '训练日' : '休息日'})\n`
    advice += `蛋白质: ${summary.protein}g (${summary.proteinPercentage}%)\n`
    advice += `碳水化合物: ${summary.carbs}g (${summary.carbPercentage}%)\n`
    advice += `脂肪: ${summary.fat}g (${summary.fatPercentage}%)\n\n`
    advice += `【今日推荐】\n`
    mealPlan.meals.forEach((meal) => {
      const top = meal.options[0]
      if (top) {
        advice += `${meal.mealLabel}: ${top.name} (${top.calories} kcal)\n`
      }
    })
    return advice
  }

  /**
   * 饮食小贴士（按目标和训练日返回）
   */
  getTips() {
    const goal = normalizeGoal(this.profile.goal)
    const base = [
      '训练后 30 分钟内补充蛋白+快碳，肌肉合成效率最高。',
      '每餐优先吃蛋白质（肉蛋豆奶），再吃蔬菜和主食，饱腹更持久。',
      '每天喝水 2-3L，训练日额外补 500ml。'
    ]
    const goalTips = {
      bulk: ['增肌期不怕多吃一点，但优先选干净碳水（糙米、红薯、燕麦）。'],
      cut: ['减脂期蛋白质一定要足够，不然掉肌肉。', '煎炸食物替换成蒸煮烤。'],
      strength: ['力量训练期重点在恢复，睡前可适量酪蛋白或希腊酸奶。']
    }
    return base.concat(goalTips[goal] || [])
  }

  // === 旧接口兼容（保留但不再主推，避免历史调用爆炸） ===
  initializeFoodDatabase() {
    return {
      proteins: [
        { name: '鸡胸肉', calories: 110, protein: 24, carbs: 0, fat: 1, serving: '100g' },
        { name: '瘦牛肉', calories: 135, protein: 22, carbs: 0, fat: 5, serving: '100g' },
        { name: '三文鱼', calories: 180, protein: 20, carbs: 0, fat: 10, serving: '100g' },
        { name: '鸡蛋', calories: 155, protein: 13, carbs: 1, fat: 11, serving: '2个' }
      ],
      carbs: [
        { name: '糙米', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, serving: '100g' },
        { name: '红薯', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: '100g' },
        { name: '燕麦片', calories: 389, protein: 17, carbs: 66, fat: 7, serving: '100g' }
      ],
      fats: [
        { name: '牛油果', calories: 160, protein: 2, carbs: 9, fat: 15, serving: '100g' },
        { name: '坚果混合', calories: 607, protein: 20, carbs: 20, fat: 54, serving: '100g' }
      ],
      vegetables: [
        { name: '西兰花', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving: '100g' },
        { name: '菠菜', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: '100g' }
      ]
    }
  }
}

module.exports = { NutritionEngine, normalizeGoal }
