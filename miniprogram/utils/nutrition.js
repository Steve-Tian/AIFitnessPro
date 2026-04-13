/**
 * AIFitnessPro - 饮食建议模块
 * 根据用户目标（增肌/减脂/力量）生成宏量营养素建议与智能食谱推荐
 */

class NutritionEngine {
  constructor(userProfile) {
    this.profile = userProfile
    this.macros = this.calculateMacros()
    this.foodDatabase = this.initializeFoodDatabase()
  }

  /**
   * 计算基础代谢率 (BMR) - Mifflin-St Jeor 公式
   * @returns {number} BMR值
   */
  calculateBMR() {
    const { gender, age, height, weight } = this.profile
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161
    }
  }

  /**
   * 根据活动水平调整TDEE
   * @param {number} bmr - 基础代谢率
   * @returns {number} 总消耗热量
   */
  calculateTDEE(bmr) {
    // 根据训练频率估算活动系数
    const activityFactors = {
      3: 1.55, // 每周训练3天
      4: 1.65, // 每周训练4天
      5: 1.75  // 每周训练5天
    }
    const factor = activityFactors[this.profile.days_per_week] || 1.55
    return bmr * factor
  }

  /**
   * 计算宏量营养素目标
   * @returns {object} 宏量营养素对象
   */
  calculateMacros() {
    const bmr = this.calculateBMR()
    const tdee = this.calculateTDEE(bmr)

    let targetCalories = tdee
    let proteinRatio = 0.25 // 25% 蛋白质
    let fatRatio = 0.25     // 25% 脂肪
    let carbRatio = 0.50    // 50% 碳水

    // 根据目标调整热量和宏量比例
    switch (this.profile.goal) {
      case 'muscle_gain':
        targetCalories *= 1.15 // 增肌：15%热量盈余
        proteinRatio = 0.30    // 增加蛋白质比例
        break
      case 'fat_loss':
        targetCalories *= 0.85 // 减脂：15%热量缺口
        proteinRatio = 0.35    // 增加蛋白质比例
        carbRatio = 0.40       // 降低碳水比例
        break
      case 'strength':
        // 力量训练维持TDEE，优化宏量比例
        proteinRatio = 0.28
        fatRatio = 0.28
        carbRatio = 0.44
        break
    }

    const proteinCalories = targetCalories * proteinRatio
    const fatCalories = targetCalories * fatRatio
    const carbCalories = targetCalories * carbRatio

    return {
      calories: Math.round(targetCalories),
      protein: Math.round(proteinCalories / 4), // 蛋白质每克4卡
      carbs: Math.round(carbCalories / 4),      // 碳水每克4卡
      fat: Math.round(fatCalories / 9)          // 脂肪每克9卡
    }
  }

  /**
   * 初始化食物数据库
   * @returns {object} 食物数据库
   */
  initializeFoodDatabase() {
    return {
      proteins: [
        { name: '鸡胸肉', calories: 110, protein: 24, carbs: 0, fat: 1, serving: '100g' },
        { name: '瘦牛肉', calories: 135, protein: 22, carbs: 0, fat: 5, serving: '100g' },
        { name: '三文鱼', calories: 180, protein: 20, carbs: 0, fat: 10, serving: '100g' },
        { name: '鸡蛋', calories: 155, protein: 13, carbs: 1, fat: 11, serving: '2个' },
        { name: '希腊酸奶', calories: 59, protein: 10, carbs: 3, fat: 0, serving: '100g' },
        { name: '豆腐', calories: 76, protein: 8, carbs: 2, fat: 4, serving: '100g' },
        { name: '虾', calories: 99, protein: 24, carbs: 0, fat: 0, serving: '100g' },
        { name: '金枪鱼罐头', calories: 132, protein: 24, carbs: 0, fat: 1, serving: '100g' }
      ],
      carbs: [
        { name: '燕麦片', calories: 389, protein: 17, carbs: 66, fat: 7, serving: '100g' },
        { name: '糙米', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, serving: '100g' },
        { name: '红薯', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: '100g' },
        { name: '香蕉', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: '100g' },
        { name: '全麦面包', calories: 247, protein: 13, carbs: 41, fat: 3.2, serving: '100g' },
        { name: '藜麦', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, serving: '100g' },
        { name: '意大利面', calories: 131, protein: 5, carbs: 25, fat: 1, serving: '100g' },
        { name: '红薯粉条', calories: 335, protein: 0.9, carbs: 82, fat: 0.1, serving: '100g' }
      ],
      fats: [
        { name: '牛油果', calories: 160, protein: 2, carbs: 9, fat: 15, serving: '100g' },
        { name: '坚果混合', calories: 607, protein: 20, carbs: 20, fat: 54, serving: '100g' },
        { name: '橄榄油', calories: 884, protein: 0, carbs: 0, fat: 100, serving: '100ml' },
        { name: '花生酱', calories: 588, protein: 25, carbs: 20, fat: 50, serving: '100g' },
        { name: '杏仁', calories: 579, protein: 21, carbs: 22, fat: 50, serving: '100g' },
        { name: '核桃', calories: 654, protein: 15, carbs: 14, fat: 65, serving: '100g' },
        { name: '亚麻籽', calories: 534, protein: 18, carbs: 29, fat: 42, serving: '100g' },
        { name: '奇亚籽', calories: 486, protein: 17, carbs: 42, fat: 31, serving: '100g' }
      ],
      vegetables: [
        { name: '西兰花', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving: '100g' },
        { name: '菠菜', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: '100g' },
        { name: '胡萝卜', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, serving: '100g' },
        { name: '黄瓜', calories: 15, protein: 0.6, carbs: 3.6, fat: 0.1, serving: '100g' },
        { name: '西红柿', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: '100g' },
        { name: '洋葱', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, serving: '100g' },
        { name: '蘑菇', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, serving: '100g' },
        { name: '芦笋', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, serving: '100g' }
      ]
    }
  }

  /**
   * 生成一日三餐建议
   * @returns {object} 三餐搭配
   */
  generateDailyMealPlan() {
    const breakfast = this.selectMeal('breakfast')
    const lunch = this.selectMeal('lunch')
    const dinner = this.selectMeal('dinner')

    return {
      breakfast,
      lunch,
      dinner,
      totalCalories: Math.round(breakfast.calories + lunch.calories + dinner.calories),
      totalProtein: Math.round(breakfast.protein + lunch.protein + dinner.protein),
      totalCarbs: Math.round(breakfast.carbs + lunch.carbs + dinner.carbs),
      totalFat: Math.round(breakfast.fat + lunch.fat + dinner.fat)
    }
  }

  /**
   * 选择特定餐次的搭配
   * @param {string} mealType - 餐次类型 (breakfast/lunch/dinner)
   * @returns {object} 餐次搭配详情
   */
  selectMeal(mealType) {
    let targetCalories, targetProtein, targetCarbs, targetFat

    // 根据餐次分配宏量目标
    switch (mealType) {
      case 'breakfast':
        targetCalories = this.macros.calories * 0.30
        targetProtein = this.macros.protein * 0.30
        targetCarbs = this.macros.carbs * 0.35
        targetFat = this.macros.fat * 0.25
        break
      case 'lunch':
        targetCalories = this.macros.calories * 0.40
        targetProtein = this.macros.protein * 0.40
        targetCarbs = this.macros.carbs * 0.40
        targetFat = this.macros.fat * 0.30
        break
      case 'dinner':
        targetCalories = this.macros.calories * 0.30
        targetProtein = this.macros.protein * 0.30
        targetCarbs = this.macros.carbs * 0.25
        targetFat = this.macros.fat * 0.45
        break
    }

    // 随机选择食物组合，尽量接近目标值
    const proteinChoice = this.getRandomFood('proteins', targetProtein * 4)
    const carbChoice = this.getRandomFood('carbs', targetCarbs * 4)
    const fatChoice = this.getRandomFood('fats', targetFat * 9)
    const vegChoice = this.getRandomFood('vegetables', 100) // 蔬菜按份量选择

    return {
      mealType,
      foods: [proteinChoice, carbChoice, fatChoice, vegChoice],
      calories: Math.round(proteinChoice.calories + carbChoice.calories + fatChoice.calories + vegChoice.calories),
      protein: Math.round(proteinChoice.protein + carbChoice.protein + fatChoice.protein + vegChoice.protein),
      carbs: Math.round(proteinChoice.carbs + carbChoice.carbs + fatChoice.carbs + vegChoice.carbs),
      fat: Math.round(proteinChoice.fat + carbChoice.fat + fatChoice.fat + vegChoice.fat)
    }
  }

  /**
   * 随机选择食物（按热量目标）
   * @param {string} foodGroup - 食物组 (proteins/carbs/fats/vegetables)
   * @param {number} targetCalories - 目标热量
   * @returns {object} 食物选择
   */
  getRandomFood(foodGroup, targetCalories) {
    const foods = this.foodDatabase[foodGroup]
    if (!foods || foods.length === 0) return { name: '未知', calories: 0, protein: 0, carbs: 0, fat: 0, serving: '0g' }

    // 找到最接近目标热量的食物
    let closestFood = foods[0]
    let minDiff = Math.abs(closestFood.calories - targetCalories)

    for (let i = 1; i < foods.length; i++) {
      const diff = Math.abs(foods[i].calories - targetCalories)
      if (diff < minDiff) {
        minDiff = diff
        closestFood = foods[i]
      }
    }

    return closestFood
  }

  /**
   * 获取宏量营养素建议摘要
   * @returns {object} 宏量营养素摘要
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
   * 生成饮食建议文本
   * @returns {string} 建议文本
   */
  generateAdvice() {
    const summary = this.getMacroSummary()
    const mealPlan = this.generateDailyMealPlan()

    let advice = `【饮食建议】\n`
    advice += `目标热量: ${summary.calories} kcal/天\n`
    advice += `蛋白质: ${summary.protein}g (${summary.proteinPercentage}%)\n`
    advice += `碳水化合物: ${summary.carbs}g (${summary.carbPercentage}%)\n`
    advice += `脂肪: ${summary.fat}g (${summary.fatPercentage}%)\n\n`

    advice += `【今日推荐搭配】\n`
    advice += `早餐: ${mealPlan.breakfast.foods.map(f => f.name).join(' + ')} (${Math.round(mealPlan.breakfast.calories)} kcal)\n`
    advice += `午餐: ${mealPlan.lunch.foods.map(f => f.name).join(' + ')} (${Math.round(mealPlan.lunch.calories)} kcal)\n`
    advice += `晚餐: ${mealPlan.dinner.foods.map(f => f.name).join(' + ')} (${Math.round(mealPlan.dinner.calories)} kcal)\n`
    advice += `总计: ${Math.round(mealPlan.totalCalories)} kcal\n`

    return advice
  }
}

module.exports = { NutritionEngine }