/**
 * AIFitnessPro - 单元测试套件
 * 使用 Jest 框架进行模块级测试
 */

// Mock 微信小程序 API
global.wx = {
  cloud: {
    database: () => ({
      collection: () => ({
        where: () => ({
          get: () => Promise.resolve({ data: [] }),
          add: () => Promise.resolve({ _id: 'mock-id' }),
          update: () => Promise.resolve({})
        }),
        doc: () => ({
          get: () => Promise.resolve({ data: {} }),
          update: () => Promise.resolve({})
        })
      })
    }),
    callFunction: ({ name, data }) => {
      if (name === 'genPlan') {
        return Promise.resolve({ result: { success: true, weeklyPlan: [] } })
      }
      if (name === 'saveFeedback') {
        return Promise.resolve({ result: { success: true, message: 'ok' } })
      }
      return Promise.resolve({ result: {} })
    }
  },
  showToast: jest.fn(),
  navigateTo: jest.fn(),
  reLaunch: jest.fn()
}

global.getApp = () => ({
  globalData: {
    openid: 'mock-openid',
    userInfo: { profile: { goal: 'muscle_gain' } }
  }
})

// Mock 云函数上下文
global.cloud = {
  init: jest.fn(),
  getWXContext: () => ({ OPENID: 'mock-openid' }),
  database: () => ({
    collection: () => ({
      where: () => ({
        get: () => Promise.resolve({ data: [] }),
        add: () => Promise.resolve({ _id: 'mock-id' }),
        update: () => Promise.resolve({})
      }),
      doc: () => ({
        get: () => Promise.resolve({ data: {} }),
        update: () => Promise.resolve({})
      })
    }),
    serverDate: () => new Date()
  })
}

describe('AIFitnessPro - Unit Tests', () => {
  describe('Persona Engine', () => {
    const { PersonaEngine } = require('../miniprogram/utils/persona.js')

    test('should generate random message by category', () => {
      const engine = new PersonaEngine('coach')
      const message = engine.getRandomMessage('warmup')
      expect(typeof message).toBe('string')
      expect(message.length).toBeGreaterThan(0)
    })

    test('should return different messages for different styles', () => {
      const coach = new PersonaEngine('coach')
      const buddy = new PersonaEngine('buddy')
      
      const coachMsg = coach.getRandomMessage('during')
      const buddyMsg = buddy.getRandomMessage('during')
      
      expect(coachMsg).not.toBe(buddyMsg)
    })

    test('should generate RPE-based response', () => {
      const engine = new PersonaEngine('coach')
      const highRPE = engine.getRPEResponse(10)
      const lowRPE = engine.getRPEResponse(6)
      const perfectRPE = engine.getRPEResponse(8)
      
      expect(typeof highRPE).toBe('string')
      expect(typeof lowRPE).toBe('string')
      expect(typeof perfectRPE).toBe('string')
    })
  })

  describe('Nutrition Engine', () => {
    const { NutritionEngine } = require('../miniprogram/utils/nutrition.js')

    const mockProfile = {
      gender: 'male',
      age: 25,
      height: 175,
      weight: 70,
      goal: 'muscle_gain',
      days_per_week: 4
    }

    test('should calculate BMR correctly', () => {
      const engine = new NutritionEngine(mockProfile)
      const bmr = engine.calculateBMR()
      
      // Mifflin-St Jeor for male: 10*weight + 6.25*height - 5*age + 5
      expect(bmr).toBeCloseTo(10 * 70 + 6.25 * 175 - 5 * 25 + 5, -1)
    })

    test('should calculate macros based on goal', () => {
      const engine = new NutritionEngine(mockProfile)
      const macros = engine.getMacroSummary()
      
      expect(macros.calories).toBeGreaterThan(0)
      expect(macros.protein).toBeGreaterThan(0)
      expect(macros.carbs).toBeGreaterThan(0)
      expect(macros.fat).toBeGreaterThan(0)
      
      // For muscle gain, protein should be higher
      expect(macros.proteinPercentage).toBeGreaterThanOrEqual(25)
    })

    test('should generate daily meal plan', () => {
      const engine = new NutritionEngine(mockProfile)
      const mealPlan = engine.generateDailyMealPlan()
      
      expect(mealPlan.breakfast).toHaveProperty('foods')
      expect(mealPlan.lunch).toHaveProperty('foods')
      expect(mealPlan.dinner).toHaveProperty('foods')
      expect(mealPlan.totalCalories).toBeGreaterThan(0)
    })
  })

  describe('Cloud Functions', () => {
    test('should handle genPlan function', async () => {
      const genPlan = require('../cloudfunctions/genPlan/index.js').main
      
      const result = await genPlan(
        { /* event */ }, 
        { /* context */ }
      )
      
      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')
    })

    test('should handle saveFeedback function', async () => {
      const saveFeedback = require('../cloudfunctions/saveFeedback/index.js').main
      
      const result = await saveFeedback(
        { planId: 'test', exerciseIndex: 0, rpe: 8 }, 
        { /* context */ }
      )
      
      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')
    })

    test('should handle unlockAchievement function', async () => {
      const unlockAchievement = require('../cloudfunctions/unlockAchievement/index.js').main
      
      const result = await unlockAchievement(
        { /* event */ }, 
        { /* context */ }
      )
      
      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')
    })
  })
})