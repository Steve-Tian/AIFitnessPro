const path = require('path')

const nutritionModulePath = path.resolve(__dirname, '../../miniprogram/utils/nutrition.js')
const genPlanModulePath = path.resolve(__dirname, '../../cloudfunctions/genPlan/index.js')
const saveFeedbackModulePath = path.resolve(__dirname, '../../cloudfunctions/saveFeedback/index.js')
const unlockAchievementModulePath = path.resolve(__dirname, '../../cloudfunctions/unlockAchievement/index.js')

describe('AIFitnessPro - Unit Tests', () => {
  describe('Nutrition Engine', () => {
    test('supports onboarding bulk goal aliases when calculating macros', () => {
      const { NutritionEngine } = freshRequire(nutritionModulePath)

      const engine = new NutritionEngine({
        gender: 'male',
        age: 25,
        height: 175,
        weight: 70,
        goal: 'bulk',
        days_per_week: 4
      })

      const macros = engine.getMacroSummary()

      expect(macros.calories).toBeGreaterThan(2800)
      expect(macros.proteinPercentage).toBeGreaterThanOrEqual(30)
    })

    test('supports onboarding cut goal aliases when calculating macros', () => {
      const { NutritionEngine } = freshRequire(nutritionModulePath)

      const engine = new NutritionEngine({
        gender: 'female',
        age: 28,
        height: 165,
        weight: 58,
        goal: 'cut',
        days_per_week: 3
      })

      const macros = engine.getMacroSummary()

      expect(macros.calories).toBeLessThan(2200)
      expect(macros.proteinPercentage).toBeGreaterThanOrEqual(35)
    })
  })

  describe('Persona Engine', () => {
    test('supports legacy bro persona values', () => {
      const { PersonaEngine } = freshRequire(path.resolve(__dirname, '../../miniprogram/utils/persona.js'))
      const engine = new PersonaEngine('bro')

      expect(engine.style).toBe('buddy')
      expect(engine.getRandomMessage('warmup')).toBeTruthy()
    })

    test('supports legacy roast persona values', () => {
      const { PersonaEngine } = freshRequire(path.resolve(__dirname, '../../miniprogram/utils/persona.js'))
      const engine = new PersonaEngine('roast')

      expect(engine.style).toBe('comedian')
      expect(engine.getRandomMessage('during')).toBeTruthy()
    })
  })

  describe('Cloud Functions', () => {
    test('genPlan supports bodyweight users and respects a 3-day schedule', async () => {
      setCloudContext({ OPENID: 'bodyweight-user' })
      setMockCollections({
        users: [{
          _id: 'user-1',
          _openid: 'bodyweight-user',
          profile: {
            days_per_week: 3,
            equipment: ['bodyweight']
          }
        }],
        plans: []
      })

      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9)
      const genPlan = freshRequire(genPlanModulePath).main

      const result = await genPlan({}, {})

      expect(result.success).toBe(true)
      expect(result.weeklyPlan).toHaveLength(7)
      expect(result.weeklyPlan.filter((day) => day.type !== 'rest')).toHaveLength(3)
      expect(result.weeklyPlan.find((day) => day.type === 'pull').workout.length).toBeGreaterThan(0)
      expect(result.weeklyPlan.find((day) => day.type === 'legs').workout.length).toBeGreaterThan(0)

      const savedPlans = getCollectionDocs('plans')
      expect(savedPlans).toHaveLength(1)
      expect(savedPlans[0].daysPerWeek).toBe(3)
      expect(savedPlans[0].schedule.filter((day) => day !== 'rest')).toHaveLength(3)

      randomSpy.mockRestore()
    })

    test('saveFeedback rejects plans that do not belong to the current user', async () => {
      setCloudContext({ OPENID: 'safe-user' })
      setMockCollections({
        users: [{
          _id: 'user-1',
          _openid: 'safe-user',
          streak_days: 2
        }],
        plans: [{
          _id: 'plan-foreign',
          userId: 'another-user',
          weeklyPlan: []
        }],
        feedback: []
      })

      const saveFeedback = freshRequire(saveFeedbackModulePath).main
      const result = await saveFeedback({
        planId: 'plan-foreign',
        exerciseIndex: 0,
        rpe: 8,
        completedAt: '2026-04-13T09:00:00.000Z'
      }, {})

      expect(result.success).toBe(false)
      expect(result.message).toContain('无权')
      expect(getCollectionDocs('feedback')).toHaveLength(0)
    })

    test('unlockAchievement only counts training types the user actually completed', async () => {
      setCloudContext({ OPENID: 'achievement-user' })
      setMockCollections({
        users: [{
          _id: 'user-1',
          _openid: 'achievement-user',
          streak_days: 1,
          achievements: [],
          total_points: 0
        }],
        feedback: [{
          _id: 'fb-1',
          userId: 'achievement-user',
          planId: 'plan-1',
          dayType: 'push',
          workoutDate: '2026-04-13',
          completedAt: '2026-04-13T05:30:00.000Z',
          rpe: 8
        }],
        plans: [{
          _id: 'plan-1',
          userId: 'achievement-user',
          weeklyPlan: [
            { date: '2026-04-13', type: 'push' },
            { date: '2026-04-14', type: 'pull' },
            { date: '2026-04-15', type: 'legs' }
          ]
        }],
        achievement_logs: []
      })

      const unlockAchievement = freshRequire(unlockAchievementModulePath).main
      const result = await unlockAchievement({}, {})

      expect(result.success).toBe(true)
      expect(result.unlocked.map((item) => item.id)).toContain('first_workout')
      expect(result.unlocked.map((item) => item.id)).not.toContain('diversity_master')
    })
  })
})
