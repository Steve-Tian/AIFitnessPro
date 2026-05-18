const { NutritionEngine } = require('../../utils/nutrition')
const { formatDateKey } = require('../../utils/shared')

const app = getApp()

Page({
  data: {
    isLoading: true,
    hasProfile: false,
    isTrainingDay: true,
    dateKey: '',
    goalLabel: '',
    target: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    intake: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      caloriePercent: 0,
      proteinPercent: 0,
      carbPercent: 0,
      fatPercent: 0
    },
    meals: [],
    tips: [],
    errorText: ''
  },

  onLoad() {
    const flags = this.computeTrainingDayFlag()
    this.setData(flags)
    this.buildPlan(flags)
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 3 })
    }
    const flags = this.computeTrainingDayFlag()
    this.setData(flags)
    this.buildPlan(flags)
  },

  computeTrainingDayFlag() {
    const today = formatDateKey(new Date())
    const weekly = (app.globalData && app.globalData.currentWeeklyPlan) || null
    let isTrainingDay = false
    if (Array.isArray(weekly)) {
      const match = weekly.find((day) => formatDateKey(day && day.date) === today)
      if (match && Array.isArray(match.workout) && match.workout.length > 0) {
        isTrainingDay = true
      }
    } else {
      isTrainingDay = true
    }
    return { isTrainingDay, dateKey: today }
  },

  buildPlan(flags) {
    const isTrainingDay = flags ? flags.isTrainingDay : this.data.isTrainingDay
    const dateKey = flags ? flags.dateKey : this.data.dateKey

    const user = app.globalData && app.globalData.userInfo
    if (!user || !user.profile) {
      this.setData({
        isLoading: false,
        hasProfile: false,
        errorText: '请先完成问卷生成个人画像'
      })
      return
    }

    let engine
    try {
      engine = new NutritionEngine(user.profile, { isTrainingDay })
    } catch (err) {
      console.error('[diet] NutritionEngine 初始化失败：', err)
      this.setData({
        isLoading: false,
        hasProfile: false,
        errorText: '饮食计算失败，请稍后重试'
      })
      return
    }

    const macros = engine.getMacroSummary()
    const plan = engine.generateDailyMealPlan()
    const tips = engine.getTips()

    const goalLabel = ({ bulk: '增肌', cut: '减脂', strength: '力量' })[macros.goal] || '力量'

    // 读取本地持久化的餐次选择（按日期）
    const storageKey = `diet_selections_${dateKey}`
    const savedSelections = (app.getUserStorage && app.getUserStorage(storageKey)) || []

    const meals = plan.meals.map((meal) => {
      const saved = savedSelections.find((s) => s.mealType === meal.mealType)
      const selectedId = saved ? saved.selectedId : meal.selectedId
      return {
        ...meal,
        selectedId,
        options: meal.options.map((opt) => ({
          ...opt,
          isSelected: opt.id === selectedId,
          ingredientsText: (opt.ingredients || []).map((i) => `${i.name} ${i.amount}${i.unit || ''}`).join(' + ')
        }))
      }
    })

    const intake = engine.computeIntakeSummary(meals.map((m) => ({ mealType: m.mealType, selectedId: m.selectedId })))

    this.engine = engine
    this.setData({
      isLoading: false,
      hasProfile: true,
      errorText: '',
      goalLabel,
      target: {
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat
      },
      intake,
      meals,
      tips
    })
  },

  /**
   * 选择一个食谱
   */
  onSelectRecipe(e) {
    const { mealType, recipeId } = e.currentTarget.dataset
    const meals = this.data.meals.map((meal) => {
      if (meal.mealType !== mealType) return meal
      return {
        ...meal,
        selectedId: recipeId,
        options: meal.options.map((opt) => ({
          ...opt,
          isSelected: opt.id === recipeId
        }))
      }
    })
    // 重新算摄入
    const intake = this.engine.computeIntakeSummary(
      meals.map((m) => ({ mealType: m.mealType, selectedId: m.selectedId }))
    )
    this.setData({ meals, intake })

    // 持久化选择
    const storageKey = `diet_selections_${this.data.dateKey}`
    if (app.setUserStorage) {
      app.setUserStorage(storageKey, meals.map((m) => ({
        mealType: m.mealType,
        selectedId: m.selectedId
      })))
    }

    wx.showToast({ title: '已选好', icon: 'success', duration: 800 })
  },

  /**
   * 切换训练日/休息日（手动覆盖）
   */
  onToggleTrainingDay() {
    const toggled = !this.data.isTrainingDay
    const flags = { isTrainingDay: toggled, dateKey: this.data.dateKey }
    this.setData(flags)
    this.buildPlan(flags)
  },

  onGoOnboarding() {
    wx.reLaunch({ url: '/pages/onboarding/onboarding' })
  }
})
