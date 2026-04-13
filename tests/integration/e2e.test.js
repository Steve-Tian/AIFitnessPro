/**
 * AIFitnessPro - 集成测试套件
 * 测试完整的用户旅程（问卷→计划→训练→反馈→成就）
 */

// Mock 微信小程序环境
global.wx = {
  cloud: {
    database: () => ({
      collection: (name) => ({
        where: (query) => ({
          get: () => {
            if (name === 'users') {
              return Promise.resolve({ 
                data: [{ 
                  _openid: 'test-user', 
                  profile: { 
                    gender: 'male', 
                    age: 25, 
                    height: 175, 
                    weight: 70, 
                    goal: 'muscle_gain', 
                    days_per_week: 4,
                    equipment: ['full_gym', 'barbell_bench'],
                    persona: 'coach'
                  },
                  streak_days: 3,
                  current_plan_id: 'plan-test'
                }] 
              })
            }
            if (name === 'plans') {
              return Promise.resolve({ 
                data: [{
                  _id: 'plan-test',
                  weeklyPlan: [
                    {
                      date: new Date(),
                      type: 'push',
                      title: '推日',
                      workout: [
                        { name: '卧推', alias: '杠铃卧推', sets: 3, reps: 8, rest: 90 }
                      ]
                    }
                  ]
                }] 
              })
            }
            if (name === 'feedback') {
              return Promise.resolve({ data: [] })
            }
            if (name === 'achievement_logs') {
              return Promise.resolve({ data: [] })
            }
            return Promise.resolve({ data: [] })
          },
          add: (data) => {
            if (name === 'feedback') {
              return Promise.resolve({ _id: 'feedback-test' })
            }
            if (name === 'achievement_logs') {
              return Promise.resolve({ _id: 'log-test' })
            }
            return Promise.resolve({ _id: 'test-id' })
          },
          update: () => Promise.resolve({})
        }),
        doc: (id) => ({
          get: () => {
            if (name === 'plans' && id === 'plan-test') {
              return Promise.resolve({ 
                data: {
                  _id: 'plan-test',
                  weeklyPlan: [
                    {
                      date: new Date(),
                      type: 'push',
                      title: '推日',
                      workout: [
                        { name: '卧推', alias: '杠铃卧推', sets: 3, reps: 8, rest: 90 }
                      ]
                    }
                  ]
                } 
              })
            }
            return Promise.resolve({ data: {} })
          },
          update: () => Promise.resolve({})
        })
      })
    }),
    callFunction: ({ name, data }) => {
      if (name === 'genPlan') {
        return Promise.resolve({ 
          result: { 
            success: true, 
            planId: 'new-plan',
            weeklyPlan: [
              { date: new Date(), type: 'push', title: '推日', workout: [] }
            ],
            message: '计划生成成功'
          } 
        })
      }
      if (name === 'saveFeedback') {
        return Promise.resolve({ 
          result: { 
            success: true, 
            message: '反馈提交成功',
            adjustment: 0.05,
            newStreak: 4
          } 
        })
      }
      if (name === 'unlockAchievement') {
        return Promise.resolve({ 
          result: { 
            success: true, 
            unlocked: [],
            message: '暂无新成就解锁'
          } 
        })
      }
      return Promise.resolve({ result: {} })
    }
  },
  showToast: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  reLaunch: jest.fn(),
  getSystemInfoSync: () => ({
    SDKVersion: '3.0.0',
    version: '8.0.0'
  })
}

global.getApp = () => ({
  globalData: {
    openid: 'test-user',
    userInfo: { 
      _openid: 'test-user',
      profile: { 
        gender: 'male', 
        age: 25, 
        height: 175, 
        weight: 70, 
        goal: 'muscle_gain', 
        days_per_week: 4,
        equipment: ['full_gym', 'barbell_bench'],
        persona: 'coach'
      },
      streak_days: 3,
      current_plan_id: 'plan-test'
    }
  }
})

describe('AIFitnessPro - Integration Tests', () => {
  describe('End-to-End User Journey', () => {
    test('should complete full workout session flow', async () => {
      // 模拟训练页面加载
      const TrainingPage = require('../miniprogram/pages/training/training.js')
      const pageInstance = new (require('jest-mock-constructor')(Page))()
      
      // 初始化训练页面
      pageInstance.onLoad({ plan: JSON.stringify([
        { name: '卧推', alias: '杠铃卧推', sets: 3, reps: 8, rest: 90 }
      ]) })
      
      // 验证初始状态
      expect(pageInstance.data.currentExerciseIndex).toBe(0)
      expect(pageInstance.data.currentSet).toBe(1)
      expect(pageInstance.data.totalSets).toBe(3)
      
      // 模拟开始训练
      pageInstance.startExercise()
      
      // 验证倒计时开始
      expect(pageInstance.data.isCountingDown).toBe(true)
      
      // 模拟完成训练并提交反馈
      pageInstance.setData({ showRPESelector: true, rpeValue: 8 })
      await pageInstance.submitFeedback()
      
      // 验证反馈成功提交
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: '训练完成！' })
      )
    })

    test('should generate personalized plan from user profile', async () => {
      // 模拟首页加载
      const IndexPage = require('../miniprogram/pages/index/index.js')
      const pageInstance = new (require('jest-mock-constructor')(Page))()
      
      // 模拟生成计划
      await pageInstance.generatePlan()
      
      // 验证计划生成成功
      expect(pageInstance.data.generatingPlan).toBe(false)
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: '计划生成成功！' })
      )
      expect(pageInstance.data.weeklyPlan).toBeDefined()
    })

    test('should calculate nutrition based on user profile', () => {
      const { NutritionEngine } = require('../miniprogram/utils/nutrition.js')
      
      const profile = {
        gender: 'male',
        age: 25,
        height: 175,
        weight: 70,
        goal: 'muscle_gain',
        days_per_week: 4
      }
      
      const engine = new NutritionEngine(profile)
      const advice = engine.generateAdvice()
      
      // 验证生成了建议文本
      expect(advice).toContain('【饮食建议】')
      expect(advice).toContain('目标热量')
      expect(advice).toContain('蛋白质')
      expect(advice).toContain('碳水化合物')
      expect(advice).toContain('脂肪')
    })

    test('should handle achievement unlocking flow', async () => {
      // 模拟成就页面加载
      const AchievementsPage = require('../miniprogram/pages/achievements/achievements.js')
      const pageInstance = new (require('jest-mock-constructor')(Page))()
      
      // 模拟检查新成就
      await pageInstance.checkNewAchievements()
      
      // 验证调用了成就检查云函数
      expect(global.wx.cloud.callFunction).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'unlockAchievement' })
      )
    })

    test('should maintain consistent persona messaging', () => {
      const { PersonaEngine } = require('../miniprogram/utils/persona.js')
      
      const coach = new PersonaEngine('coach')
      const buddy = new PersonaEngine('buddy')
      
      // 验证不同风格的消息差异
      const coachWarmup = coach.getRandomMessage('warmup')
      const buddyWarmup = buddy.getRandomMessage('warmup')
      
      expect(coachWarmup).not.toBe(buddyWarmup)
      
      // 验证相同风格的消息一致性
      const coachMsg1 = coach.getRandomMessage('during')
      const coachMsg2 = coach.getRandomMessage('during')
      
      // 虽然是随机的，但都应该非空
      expect(coachMsg1).toBeTruthy()
      expect(coachMsg2).toBeTruthy()
    })
  })

  describe('Data Flow Validation', () => {
    test('should persist user data through cloud database', async () => {
      const db = global.wx.cloud.database()
      
      // 模拟用户数据写入
      const userCollection = db.collection('users')
      const whereClause = userCollection.where({ _openid: 'test-user' })
      
      const result = await whereClause.get()
      
      // 验证用户数据结构
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toHaveProperty('profile')
      expect(result.data[0]).toHaveProperty('streak_days')
      expect(result.data[0]).toHaveProperty('current_plan_id')
    })

    test('should track feedback and adjust training', async () => {
      const FeedbackFunction = require('../cloudfunctions/saveFeedback/index.js').main
      
      const eventData = {
        planId: 'plan-test',
        exerciseIndex: 0,
        rpe: 9, // 高RPE应触发强度下调
        completedAt: new Date()
      }
      
      const result = await FeedbackFunction(eventData, {})
      
      // 验证反馈处理成功
      expect(result.success).toBe(true)
      expect(result.adjustment).toBeLessThan(0) // 高RPE应返回负调整值
    })

    test('should validate plan generation rules', async () => {
      const PlanFunction = require('../cloudfunctions/genPlan/index.js').main
      
      const result = await PlanFunction({}, {})
      
      // 验证计划生成成功
      expect(result.success).toBe(true)
      expect(result.weeklyPlan).toHaveLength(7)
      
      // 验证包含休息日
      const restDays = result.weeklyPlan.filter(day => day.type === 'rest')
      expect(restDays).toHaveLength(2) // 7天中应该有2天休息
    })
  })
})