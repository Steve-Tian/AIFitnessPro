const path = require('path')

const trainingPagePath = path.resolve(__dirname, '../../miniprogram/pages/training/training.js')
const indexPagePath = path.resolve(__dirname, '../../miniprogram/pages/index/index.js')
const achievementsPagePath = path.resolve(__dirname, '../../miniprogram/pages/achievements/achievements.js')
const exercisesPagePath = path.resolve(__dirname, '../../miniprogram/pages/exercises/exercises.js')
const exerciseDetailPagePath = path.resolve(__dirname, '../../miniprogram/pages/exercise-detail/exercise-detail.js')
const personaModulePath = path.resolve(__dirname, '../../miniprogram/utils/persona.js')

describe('AIFitnessPro - Integration Tests', () => {
  test('training page can complete countdown flow and sync streak from saveFeedback', async () => {
    jest.useFakeTimers()

    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: {
          _openid: 'test-user',
          current_plan_id: 'plan-test',
          streak_days: 3,
          profile: {
            persona: 'coach'
          }
        }
      }
    })

    setCallFunctionHandlers({
      saveFeedback: async ({ data }) => ({
        result: {
          success: true,
          newStreak: 4,
          echoedDate: data.workoutDate
        }
      })
    })

    const page = createMiniProgramPage(trainingPagePath)
    page.onLoad({
      plan: JSON.stringify([
        { name: '卧推', alias: '杠铃卧推', sets: 2, reps: 8, rest: 60 }
      ]),
      dayType: 'push',
      date: '2026-04-13'
    })

    page.startExercise()
    expect(page.data.isCountingDown).toBe(true)
    expect(page.data.exercise.instructions.length).toBeGreaterThan(0)
    expect(page.data.exercise.instructionSteps.length).toBeGreaterThan(0)
    expect(page.data.exercise.summary).toContain('2 组 × 8 次')
    expect(page.data.exercise.mediaUrl).toBe('/images/default_exercise.png')
    expect(page.data.exercise.primaryMuscles).toContain('胸肌')
    expect(page.data.exercise.equipmentText).toContain('杠铃/卧推架')

    page.endCountdown()
    expect(page.data.isResting).toBe(true)
    expect(page.data.countdown).toBe(60)

    await page.submitFeedback()
    jest.advanceTimersByTime(1500)

    expect(getAppMock().globalData.userInfo.streak_days).toBe(4)
    expect(wx.cloud.callFunction).toHaveBeenCalledWith(expect.objectContaining({
      name: 'saveFeedback',
      data: expect.objectContaining({
        dayType: 'push',
        workoutDate: '2026-04-13'
      })
    }))
    expect(wx.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '训练完成！' }))
    expect(wx.switchTab).toHaveBeenCalledWith({ url: '/pages/index/index' })

    page.onUnload()
  })

  test('index page stores the newly generated plan in page and global state', async () => {
    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: {
          _openid: 'test-user',
          current_plan_id: null,
          streak_days: 2
        }
      }
    })

    setCallFunctionHandlers({
      genPlan: async () => ({
        result: {
          success: true,
          planId: 'new-plan',
          weeklyPlan: [
            { date: '2026-04-13', type: 'push', title: '推日', workout: [] }
          ]
        }
      })
    })

    const page = createMiniProgramPage(indexPagePath)
    await page.generatePlan()

    expect(page.data.generatingPlan).toBe(false)
    expect(page.data.weeklyPlan).toHaveLength(1)
    expect(getAppMock().globalData.userInfo.current_plan_id).toBe('new-plan')
    expect(wx.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '计划生成成功！' }))
  })

  test('index page maps stored persona values to friendly welcome text', () => {
    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: {
          _openid: 'test-user',
          streak_days: 2,
          profile: {
            persona: 'bro'
          }
        }
      }
    })

    const page = createMiniProgramPage(indexPagePath)
    page.onLoad()

    expect(page.data.welcomeLabel).toBe('暖男兄弟')
  })

  test('index page can open a selected training day through the tab page', () => {
    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: {
          _openid: 'test-user',
          current_plan_id: 'plan-test'
        }
      }
    })

    const page = createMiniProgramPage(indexPagePath)
    page.setData({
      weeklyPlan: [
        {
          date: '2026-04-13',
          type: 'push',
          title: '推日',
          workout: [
            { name: '卧推', alias: '杠铃卧推', sets: 3, reps: 8, rest: 90 }
          ]
        }
      ]
    })

    page.openPlanDay({
      currentTarget: {
        dataset: { index: 0 }
      }
    })

    expect(getAppMock().globalData.selectedWorkoutDay).toEqual(expect.objectContaining({
      date: '2026-04-13',
      type: 'push'
    }))
    expect(wx.switchTab).toHaveBeenCalledWith({ url: '/pages/training/training' })
  })

  test('training page can consume a selected workout day from global state', () => {
    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: {
          _openid: 'test-user',
          current_plan_id: 'plan-test',
          streak_days: 1
        },
        selectedWorkoutDay: {
          date: '2026-04-15',
          type: 'legs',
          title: '腿日',
          workout: [
            { name: '徒手深蹲', alias: '自重深蹲', sets: 4, reps: 12, rest: 60 }
          ]
        }
      }
    })

    const page = createMiniProgramPage(trainingPagePath)
    page.onShow()

    expect(page.data.currentDayType).toBe('legs')
    expect(page.data.currentWorkoutDate).toBe('2026-04-15')
    expect(page.data.exercise.name).toBe('徒手深蹲')
    expect(page.data.exercise.instructions.length).toBeGreaterThan(0)
    expect(page.data.exercise.instructionSteps.length).toBeGreaterThan(0)
    expect(page.data.exercise.tips.length).toBeGreaterThan(0)
    expect(page.data.exercise.commonMistakes.length).toBeGreaterThan(0)
    expect(page.data.exercise.mediaUrl).toBe('/images/default_exercise.png')
    expect(page.data.exercise.primaryMuscles).toContain('股四头肌')
    expect(getAppMock().globalData.selectedWorkoutDay).toBeNull()
  })

  test('training page back action returns to the index tab', () => {
    const page = createMiniProgramPage(trainingPagePath)
    page.goBack()

    expect(wx.switchTab).toHaveBeenCalledWith({ url: '/pages/index/index' })
  })

  test('training page can jump to exercise detail', () => {
    const page = createMiniProgramPage(trainingPagePath)
    page.setData({
      exercise: {
        id: 'bench_press',
        name: '卧推'
      }
    })

    page.openExerciseDetail()

    expect(wx.navigateTo).toHaveBeenCalledWith({
      url: '/pages/exercise-detail/exercise-detail?id=bench_press'
    })
  })

  test('exercise library page loads exercises and opens detail page', () => {
    const page = createMiniProgramPage(exercisesPagePath)
    page.onLoad()

    expect(page.data.exercises.length).toBeGreaterThan(10)
    expect(page.data.exercises[0].coverUrl).toBe('/images/default_exercise.png')

    page.openExerciseDetail({
      currentTarget: {
        dataset: {
          id: 'bench_press'
        }
      }
    })

    expect(wx.navigateTo).toHaveBeenCalledWith({
      url: '/pages/exercise-detail/exercise-detail?id=bench_press'
    })
  })

  test('exercise detail page loads structured content package', () => {
    const page = createMiniProgramPage(exerciseDetailPagePath)
    page.onLoad({ id: 'bench_press' })

    expect(page.data.exercise.name_cn).toBe('杠铃卧推')
    expect(page.data.exercise.primaryMuscles).toContain('胸肌')
    expect(page.data.exercise.instructionSteps.length).toBeGreaterThan(0)
    expect(wx.setNavigationBarTitle).toHaveBeenCalledWith({ title: '杠铃卧推' })
  })

  test('achievements page loads unlocked count and can trigger cloud refresh', async () => {
    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: {
          _openid: 'test-user'
        }
      }
    })

    setMockCollections({
      users: [{
        _id: 'user-1',
        _openid: 'test-user',
        achievements: ['first_workout', 'early_bird'],
        total_points: 30
      }]
    })

    const page = createMiniProgramPage(achievementsPagePath)
    await page.loadAchievements()

    expect(page.data.unlockedAchievementCount).toBe(2)
    expect(page.data.totalPoints).toBe(30)

    setCallFunctionHandlers({
      unlockAchievement: async () => ({
        result: {
          success: true,
          unlocked: []
        }
      })
    })

    await page.checkNewAchievements()

    expect(wx.cloud.callFunction).toHaveBeenCalledWith(expect.objectContaining({ name: 'unlockAchievement' }))
  })

  test('persona engine still differentiates message styles', () => {
    const { PersonaEngine } = freshRequire(personaModulePath)

    const coach = new PersonaEngine('coach')
    const buddy = new PersonaEngine('buddy')

    expect(coach.getRandomMessage('warmup')).toBeTruthy()
    expect(buddy.getRandomMessage('warmup')).toBeTruthy()
    expect(coach.getRandomMessage('during')).not.toEqual(buddy.getRandomMessage('during'))
  })
})
