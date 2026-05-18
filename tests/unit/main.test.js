const path = require('path')

const nutritionModulePath = path.resolve(__dirname, '../../miniprogram/utils/nutrition.js')
const genPlanModulePath = path.resolve(__dirname, '../../cloudfunctions/genPlan/index.js')
const getPlanModulePath = path.resolve(__dirname, '../../cloudfunctions/getPlan/index.js')
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
      expect(macros.protein).toBeGreaterThanOrEqual(140)
      expect(macros.proteinPercentage).toBeGreaterThanOrEqual(15)
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
      expect(macros.protein).toBeGreaterThanOrEqual(120)
      expect(macros.proteinPercentage).toBeGreaterThanOrEqual(28)
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
      expect(result.weeklyPlan.find((day) => day.type === 'push').warmup.length).toBeGreaterThan(0)
      expect(result.weeklyPlan.find((day) => day.type === 'push').cooldown.length).toBeGreaterThan(0)

      const savedPlans = getCollectionDocs('plans')
      expect(savedPlans).toHaveLength(1)
      expect(savedPlans[0].daysPerWeek).toBe(3)
      expect(savedPlans[0].schedule.filter((day) => day !== 'rest')).toHaveLength(3)

      randomSpy.mockRestore()
    })

    test('genPlan applies stored exercise adjustments to future prescriptions', async () => {
      setCloudContext({ OPENID: 'adaptive-user' })
      setMockCollections({
        users: [{
          _id: 'user-1',
          _openid: 'adaptive-user',
          profile: {
            days_per_week: 3,
            equipment: ['full_gym', 'barbell_bench']
          },
          exercise_adjustments: {
            卧推: {
              exerciseName: '卧推',
              lastRpe: 9,
              averageRpe: 9,
              feedbackCount: 1,
              loadAdjustment: -0.05,
              setDelta: -1,
              repDelta: -2,
              restDelta: 15,
              recommendation: '本动作反馈偏难，下次建议重量降低约 5%，并减少 1 组、减少 2 次。',
              trend: 'hard',
              updatedAt: '2026-04-13T09:00:00.000Z'
            }
          }
        }],
        plans: []
      })

      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9)
      const genPlan = freshRequire(genPlanModulePath).main
      const result = await genPlan({}, {})
      const pushDay = result.weeklyPlan.find((day) => day.type === 'push')
      const benchPress = pushDay.workout.find((item) => item.name === '卧推')

      expect(benchPress.sets).toBe(2)
      expect(benchPress.reps).toBeGreaterThanOrEqual(6)
      expect(benchPress.rest).toBeGreaterThanOrEqual(105)
      expect(benchPress.adaptiveNote).toContain('降低约 5%')
      expect(pushDay.adaptive_notes.length).toBeGreaterThan(0)

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

    test('getPlan returns the current user plan through the cloud function', async () => {
      setCloudContext({ OPENID: 'plan-user' })
      setMockCollections({
        users: [{
          _id: 'user-1',
          _openid: 'plan-user',
          current_plan_id: 'plan-own'
        }],
        plans: [{
          _id: 'plan-own',
          userId: 'plan-user',
          weeklyPlan: [
            { date: '2026-04-14', type: 'push', workout: [{ name: '卧推', sets: 3, reps: 8, rest: 90 }] }
          ],
          schedule: ['push', 'rest', 'pull', 'rest', 'legs', 'rest', 'rest'],
          daysPerWeek: 3
        }]
      })

      const getPlan = freshRequire(getPlanModulePath).main
      const result = await getPlan({}, {})

      expect(result.success).toBe(true)
      expect(result.planId).toBe('plan-own')
      expect(result.weeklyPlan).toHaveLength(1)
      expect(result.daysPerWeek).toBe(3)
    })

    test('saveFeedback resets streak after a missed day', async () => {
      setCloudContext({ OPENID: 'streak-user' })
      setMockCollections({
        users: [{
          _id: 'user-1',
          _openid: 'streak-user',
          streak_days: 5,
          last_training_date: '2026-04-10T07:00:00.000Z'
        }],
        plans: [{
          _id: 'plan-own',
          userId: 'streak-user',
          weeklyPlan: []
        }],
        feedback: []
      })

      const saveFeedback = freshRequire(saveFeedbackModulePath).main
      const result = await saveFeedback({
        planId: 'plan-own',
        exerciseIndex: 0,
        rpe: 8,
        completedAt: '2026-04-13T09:00:00.000Z'
      }, {})

      expect(result.success).toBe(true)
      expect(result.newStreak).toBe(1)
      expect(getCollectionDocs('users')[0].streak_days).toBe(1)
    })

    test('saveFeedback stores per-exercise adjustments and updates later workouts in the current plan', async () => {
      setCloudContext({ OPENID: 'adaptive-user' })
      setMockCollections({
        users: [{
          _id: 'user-1',
          _openid: 'adaptive-user',
          streak_days: 2,
          last_training_date: '2026-04-13T07:00:00.000Z',
          exercise_adjustments: {}
        }],
        plans: [{
          _id: 'plan-own',
          userId: 'adaptive-user',
          weeklyPlan: [
            {
              date: '2026-04-14',
              type: 'push',
              workout: [
                { name: '卧推', alias: '杠铃卧推', sets: 3, reps: 8, rest: 90, equipment: ['barbell_bench'] }
              ]
            },
            {
              date: '2026-04-17',
              type: 'push',
              workout: [
                { name: '卧推', alias: '杠铃卧推', sets: 3, reps: 8, rest: 90, equipment: ['barbell_bench'] }
              ]
            }
          ]
        }],
        feedback: []
      })

      const saveFeedback = freshRequire(saveFeedbackModulePath).main
      const result = await saveFeedback({
        planId: 'plan-own',
        exerciseIndex: 0,
        rpe: 9,
        completedAt: '2026-04-14T09:00:00.000Z',
        workoutDate: '2026-04-14',
        exerciseFeedback: [{
          exerciseIndex: 0,
          exerciseName: '卧推',
          exerciseAlias: '杠铃卧推',
          rpe: 9,
          sets: 3,
          reps: 8,
          rest: 90,
          equipment: ['barbell_bench'],
          setIndex: 1
        }]
      }, {})

      expect(result.success).toBe(true)
      expect(result.exerciseAdjustments[0].loadAdjustment).toBe(-0.1)

      const updatedUser = getCollectionDocs('users')[0]
      expect(updatedUser.exercise_adjustments.卧推.nextSets).toBe(2)
      expect(updatedUser.exercise_adjustments.卧推.nextReps).toBe(6)

      const updatedPlan = getCollectionDocs('plans')[0]
      expect(updatedPlan.weeklyPlan[1].workout[0].sets).toBe(2)
      expect(updatedPlan.weeklyPlan[1].workout[0].reps).toBe(6)
      expect(updatedPlan.weeklyPlan[1].workout[0].adaptiveNote).toContain('降低约 10%')
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

  describe('Nutrition & Diet', () => {
    test('NutritionEngine differentiates training vs rest day calories', () => {
      const { NutritionEngine } = freshRequire(nutritionModulePath)
      const profile = { gender: 'male', age: 25, height: 175, weight: 70, goal: 'bulk', days_per_week: 4 }

      const trainingEngine = new NutritionEngine(profile, { isTrainingDay: true })
      const restEngine = new NutritionEngine(profile, { isTrainingDay: false })

      const tMacros = trainingEngine.getMacroSummary()
      const rMacros = restEngine.getMacroSummary()

      expect(tMacros.calories).toBeGreaterThan(rMacros.calories)
      expect(tMacros.carbs).toBeGreaterThan(rMacros.carbs)
    })

    test('NutritionEngine generates daily meal plan with options', () => {
      const { NutritionEngine } = freshRequire(nutritionModulePath)
      const profile = { gender: 'female', age: 28, height: 165, weight: 58, goal: 'cut', days_per_week: 3 }

      const engine = new NutritionEngine(profile, { isTrainingDay: true })
      const plan = engine.generateDailyMealPlan()

      expect(plan.meals.length).toBeGreaterThanOrEqual(4)
      plan.meals.forEach((meal) => {
        expect(meal.mealType).toBeTruthy()
        expect(meal.mealLabel).toBeTruthy()
        expect(meal.targetCalories).toBeGreaterThan(0)
      })
    })

    test('NutritionEngine.computeIntakeSummary aggregates selected recipes', () => {
      const { NutritionEngine } = freshRequire(nutritionModulePath)
      const profile = { gender: 'male', age: 30, height: 180, weight: 80, goal: 'strength', days_per_week: 4 }

      const engine = new NutritionEngine(profile, { isTrainingDay: true })
      const plan = engine.generateDailyMealPlan()

      const selections = plan.meals
        .filter((m) => m.options.length > 0)
        .map((m) => ({ mealType: m.mealType, selectedId: m.options[0].id }))

      const intake = engine.computeIntakeSummary(selections)
      expect(intake.calories).toBeGreaterThan(0)
      expect(intake.protein).toBeGreaterThan(0)
      expect(intake.caloriePercent).toBeGreaterThan(0)
      expect(intake.caloriePercent).toBeLessThanOrEqual(100)
    })
  })

  describe('Onboarding Validation', () => {
    test('validateStep rejects days_per_week outside 3-5', () => {
      const onboardingPath = path.resolve(__dirname, '../../miniprogram/pages/onboarding/onboarding.js')
      const page = createMiniProgramPage(onboardingPath)

      page.setData({ currentStep: 6, formData: { ...page.data.formData, days_per_week: 2 } })
      page.validateStep()
      expect(page.data.canProceed).toBe(false)

      page.setData({ currentStep: 6, formData: { ...page.data.formData, days_per_week: 6 } })
      page.validateStep()
      expect(page.data.canProceed).toBe(false)

      page.setData({ currentStep: 6, formData: { ...page.data.formData, days_per_week: 4 } })
      page.validateStep()
      expect(page.data.canProceed).toBe(true)
    })

    test('validateStep requires at least one equipment selected', () => {
      const onboardingPath = path.resolve(__dirname, '../../miniprogram/pages/onboarding/onboarding.js')
      const page = createMiniProgramPage(onboardingPath)

      page.setData({
        currentStep: 7,
        formData: {
          ...page.data.formData,
          equipment_full_gym: false,
          equipment_barbell: false,
          equipment_dumbbell: false,
          equipment_bodyweight: false
        }
      })
      page.validateStep()
      expect(page.data.canProceed).toBe(false)

      page.setData({ 'formData.equipment_bodyweight': true })
      page.validateStep()
      expect(page.data.canProceed).toBe(true)
    })
  })

  describe('Persona Engine Extended', () => {
    test('each persona has at least 30 templates across all categories', () => {
      const personaPath = path.resolve(__dirname, '../../miniprogram/utils/persona.js')
      const { PersonaEngine } = freshRequire(personaPath)
      const categories = ['warmup', 'during', 'finish', 'encouragement', 'correction']
      const styles = ['coach', 'buddy', 'comedian', 'beauty_coach']

      styles.forEach((style) => {
        const engine = new PersonaEngine(style)
        const templates = engine.templates[style] || {}
        const total = categories.reduce((sum, cat) => sum + (templates[cat] || []).length, 0)
        expect(total).toBeGreaterThanOrEqual(30)
      })
    })

    test('getRPEResponse returns string for all RPE ranges', () => {
      const personaPath = path.resolve(__dirname, '../../miniprogram/utils/persona.js')
      const { PersonaEngine } = freshRequire(personaPath)
      const engine = new PersonaEngine('coach')

      expect(typeof engine.getRPEResponse(10)).toBe('string')
      expect(typeof engine.getRPEResponse(8)).toBe('string')
      expect(typeof engine.getRPEResponse(6)).toBe('string')
    })
  })

  describe('Training summary share', () => {
    const summaryPagePath = path.resolve(__dirname, '../../miniprogram/pages/training-summary/training-summary.js')

    test('onShareAppMessage returns workout-specific title when summary exists', () => {
      setAppMock({
        globalData: {
          lastTrainingSummary: {
            workoutDate: '2026-04-17',
            dayType: 'push',
            durationMin: 42,
            totalExercises: 4,
            totalSets: 16,
            totalReps: 64,
            totalVolume: 1200,
            estimatedKcal: 180,
            perExercise: [{ name: '卧推', sets: 4, reps: 8 }],
            newStreak: 2,
            unlockedAchievements: []
          }
        }
      })
      const page = createMiniProgramPage(summaryPagePath)
      page.onLoad()
      expect(page.data.hasData).toBe(true)
      const share = page.onShareAppMessage()
      expect(share.path).toBe('/pages/index/index')
      expect(share.title).toContain('推日')
      expect(share.title).toContain('42')
    })

    test('saveSharePoster triggers canvas export and album save', () => {
      setAppMock({
        globalData: {
          lastTrainingSummary: {
            workoutDate: '2026-04-17',
            dayType: 'pull',
            durationMin: 30,
            totalExercises: 3,
            totalSets: 12,
            totalReps: 48,
            totalVolume: 0,
            estimatedKcal: 150,
            perExercise: [],
            newStreak: 0,
            unlockedAchievements: []
          }
        }
      })
      const page = createMiniProgramPage(summaryPagePath)
      page.onLoad()
      page.saveSharePoster()
      expect(wx.showLoading).toHaveBeenCalled()
      expect(wx.createCanvasContext).toHaveBeenCalled()
      expect(wx.canvasToTempFilePath).toHaveBeenCalled()
      expect(wx.saveImageToPhotosAlbum).toHaveBeenCalled()
      expect(wx.hideLoading).toHaveBeenCalled()
    })
  })
})
