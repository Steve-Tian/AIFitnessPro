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
    await page.onLoad({
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
    expect(wx.redirectTo).toHaveBeenCalledWith(expect.objectContaining({
      url: '/pages/training-summary/training-summary'
    }))

    page.onUnload()
    jest.useRealTimers()
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

  test('index page does not crash if user profile has not finished loading', async () => {
    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: null
      }
    })

    const page = createMiniProgramPage(indexPagePath)
    await page.generatePlan()

    expect(page.data.generatingPlan).toBe(false)
    expect(wx.showToast).toHaveBeenCalledWith(expect.objectContaining({
      title: '用户信息加载中，请稍后重试'
    }))
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

  test('training page can consume a selected workout day from global state', async () => {
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
          warmup: [{
            name: '髋踝动态活动',
            duration: '90 秒',
            focusText: '臀肌 / 小腿',
            instructions: ['做动态活动', '准备下肢发力']
          }],
          cooldown: [{
            name: '股四头肌拉伸',
            duration: '35 秒/侧',
            instructions: ['拉伸股四头肌']
          }],
          adaptive_notes: [{
            exerciseName: '徒手深蹲',
            note: '上次偏轻松，这次增加了次数。'
          }],
          workout: [
            {
              name: '徒手深蹲',
              alias: '自重深蹲',
              sets: 4,
              reps: 12,
              rest: 60,
              adaptiveNote: '上次偏轻松，这次增加了次数。',
              equipment: ['bodyweight']
            }
          ]
        }
      }
    })

    const page = createMiniProgramPage(trainingPagePath)
    await page.onShow()

    expect(page.data.currentDayType).toBe('legs')
    expect(page.data.currentWorkoutDate).toBe('2026-04-15')
    expect(page.data.exercise.name).toBe('徒手深蹲')
    expect(page.data.exercise.instructions.length).toBeGreaterThan(0)
    expect(page.data.exercise.instructionSteps.length).toBeGreaterThan(0)
    expect(page.data.exercise.tips.length).toBeGreaterThan(0)
    expect(page.data.exercise.commonMistakes.length).toBeGreaterThan(0)
    expect(page.data.exercise.mediaUrl).toBe('/images/default_exercise.png')
    expect(page.data.exercise.primaryMuscles).toContain('股四头肌')
    expect(page.data.warmup).toHaveLength(1)
    expect(page.data.cooldown).toHaveLength(1)
    expect(page.data.adaptiveNotes).toHaveLength(1)
    expect(page.data.exercise.hasAdaptiveNote).toBe(true)
    expect(getAppMock().globalData.selectedWorkoutDay).toBeNull()
  })

  test('training page supports custom skip options for set and rest phases', async () => {
    const page = createMiniProgramPage(trainingPagePath)
    await page.onLoad({
      plan: JSON.stringify([
        { name: '卧推', alias: '杠铃卧推', sets: 2, reps: 8, rest: 45 }
      ]),
      dayType: 'push',
      date: '2026-04-14'
    })

    expect(page.data.skipButtonLabel).toBe('跳过当前动作')

    page.startExercise()
    expect(page.data.isCountingDown).toBe(true)
    expect(page.data.setSkipButtonLabel).toBe('跳过本组')

    page.skipCurrentSet()
    expect(page.data.isResting).toBe(true)
    expect(page.data.countdown).toBe(45)
    expect(page.data.restSkipButtonLabel).toBe('跳过休息')

    page.shortenRestPeriod({
      currentTarget: {
        dataset: {
          seconds: 15
        }
      }
    })
    expect(page.data.countdown).toBe(30)

    page.skipRestPeriod()
    expect(page.data.currentSet).toBe(2)
    expect(page.data.isCountingDown).toBe(true)
  })

  test('training page can skip directly to the next exercise with dedicated action button', async () => {
    const page = createMiniProgramPage(trainingPagePath)
    await page.onLoad({
      plan: JSON.stringify([
        { name: '卧推', alias: '杠铃卧推', sets: 3, reps: 8, rest: 60 },
        { name: '徒手深蹲', alias: '自重深蹲', sets: 3, reps: 12, rest: 45 }
      ]),
      dayType: 'mixed',
      date: '2026-04-14'
    })

    expect(page.data.exercise.name).toBe('卧推')
    expect(page.data.skipButtonLabel).toBe('跳过当前动作')

    page.skipCurrentExercise()

    expect(page.data.currentExerciseIndex).toBe(1)
    expect(page.data.exercise.name).toBe('徒手深蹲')
    expect(page.data.isCountingDown).toBe(true)
  })

  test('training page can finish rest immediately when custom reduction exceeds remaining time', async () => {
    const page = createMiniProgramPage(trainingPagePath)
    await page.onLoad({
      plan: JSON.stringify([
        { name: '卧推', alias: '杠铃卧推', sets: 2, reps: 8, rest: 20 }
      ]),
      dayType: 'push',
      date: '2026-04-14'
    })

    page.startExercise()
    page.skipCurrentSet()
    expect(page.data.isResting).toBe(true)

    page.shortenRestPeriod({
      currentTarget: {
        dataset: {
          seconds: 30
        }
      }
    })

    expect(page.data.currentSet).toBe(2)
    expect(page.data.isCountingDown).toBe(true)
  })

  test('training page collects per-exercise feedback before final session feedback', async () => {
    setCallFunctionHandlers({
      saveFeedback: async ({ data }) => ({
        result: {
          success: true,
          newStreak: 2,
          updatedWeeklyPlan: []
        }
      })
    })

    jest.useFakeTimers()

    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: {
          _openid: 'test-user',
          current_plan_id: 'plan-test',
          streak_days: 1
        }
      }
    })

    const page = createMiniProgramPage(trainingPagePath)
    await page.onLoad({
      plan: JSON.stringify([
        { name: '卧推', alias: '杠铃卧推', sets: 1, reps: 8, rest: 45, equipment: ['barbell_bench'] }
      ]),
      dayType: 'push',
      date: '2026-04-14'
    })

    page.startExercise()
    page.endCountdown()
    page.skipRestPeriod()

    expect(page.data.showExerciseFeedbackSelector).toBe(true)

    page.selectExerciseRPE({
      currentTarget: {
        dataset: {
          rpe: 9
        }
      }
    })
    page.confirmExerciseFeedback()

    expect(page.data.showExerciseFeedbackSelector).toBe(false)
    expect(page.data.exerciseFeedbackDrafts).toHaveLength(1)
    expect(page.data.showRPESelector).toBe(true)

    await page.submitFeedback()
    jest.advanceTimersByTime(1500)

    expect(wx.cloud.callFunction).toHaveBeenCalledWith(expect.objectContaining({
      name: 'saveFeedback',
      data: expect.objectContaining({
        exerciseFeedback: [
          expect.objectContaining({
            exerciseName: '卧推',
            rpe: 9
          })
        ]
      })
    }))
    expect(wx.redirectTo).toHaveBeenCalledWith(expect.objectContaining({
      url: '/pages/training-summary/training-summary'
    }))
    jest.useRealTimers()
  })

  test('training page can recover a chosen workout day from cached weekly plan', async () => {
    setAppMock({
      globalData: {
        openid: 'test-user',
        userInfo: {
          _openid: 'test-user',
          current_plan_id: 'plan-test',
          streak_days: 1
        },
        currentWeeklyPlan: [
          {
            date: '2026-04-16',
            type: 'push',
            title: '推日',
            workout: [
              { name: '卧推', alias: '杠铃卧推', sets: 3, reps: 10, rest: 90 }
            ]
          },
          {
            date: '2026-04-17',
            type: 'rest',
            title: '休息日'
          }
        ],
        pendingWorkoutDate: '2026-04-16',
        selectedWorkoutDay: null
      }
    })

    const page = createMiniProgramPage(trainingPagePath)
    await page.onShow()

    expect(page.data.currentWorkoutDate).toBe('2026-04-16')
    expect(page.data.currentDayType).toBe('push')
    expect(page.data.exercise.name).toBe('卧推')
    expect(getAppMock().globalData.pendingWorkoutDate).toBe('')
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
      url: expect.stringContaining('/pages/exercise-detail/exercise-detail?id=bench_press')
    })
  })

  test('exercise library page prefers synced cloud exercise content when available', async () => {
    setMockCollections({
      exercises: [{
        _id: 'exercise-1',
        exercise_id: 'bench_press',
        name_cn: '云端杠铃卧推',
        name_en: 'Bench Press',
        aliases: ['卧推'],
        category: 'push',
        equipment_required: ['barbell_bench'],
        primary_muscles: ['chest'],
        secondary_muscles: ['triceps'],
        difficulty: 'intermediate',
        media: {
          gif_url: '',
          video_url: 'https://media.aifitnesspro.dev/bench_press.mp4',
          thumbnail_url: '/images/default_exercise.png'
        },
        instructions: ['云端步骤一', '云端步骤二'],
        exercise_tips: ['云端提示'],
        common_mistakes: ['云端错误']
      }]
    })

    const page = createMiniProgramPage(exercisesPagePath)
    await page.onLoad()

    expect(page.data.exercises).toHaveLength(1)
    expect(page.data.exercises[0].name_cn).toBe('云端杠铃卧推')
    expect(page.data.exercises[0].hasVideo).toBe(true)
    expect(page.data.librarySourceLabel).toBe('云端动作库')

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

  test('exercise detail page loads structured content package', async () => {
    const page = createMiniProgramPage(exerciseDetailPagePath)
    await page.onLoad({ id: 'bench_press' })

    expect(page.data.exercise.name_cn).toBe('杠铃卧推')
    expect(page.data.exercise.primaryMuscles).toContain('胸肌')
    expect(page.data.exercise.instructionSteps.length).toBeGreaterThan(0)
    expect(page.data.exercise.detailedStepCards.length).toBeGreaterThan(3)
    expect(page.data.exercise.heroHighlights.length).toBeGreaterThan(0)
    expect(page.data.sourceLabel).toBe('内置种子库')
    expect(wx.setNavigationBarTitle).toHaveBeenCalledWith({ title: '杠铃卧推' })
  })

  test('exercise detail page can open a cloud-only exercise by id without blank state', async () => {
    setMockCollections({
      exercises: [{
        _id: 'exercise-99',
        exercise_id: 'incline_dumbbell_press',
        name_cn: '上斜哑铃卧推',
        name_en: 'Incline Dumbbell Press',
        aliases: ['上斜推举'],
        category: 'push',
        equipment_required: ['dumbbell_only'],
        primary_muscles: ['chest'],
        secondary_muscles: ['front_delts', 'triceps'],
        difficulty: 'intermediate',
        media: {
          gif_url: 'https://media.aifitnesspro.dev/incline_dumbbell_press.gif',
          video_url: '',
          thumbnail_url: '/images/default_exercise.png'
        },
        instructions: [
          '将靠背调到约 30 度，双手持哑铃落在胸线两侧',
          '肩胛后收下沉，推起时让哑铃朝胸线上方汇合',
          '下放时保持前臂垂直地面，不要耸肩'
        ],
        exercise_tips: ['上胸主动发力，核心持续收紧'],
        common_mistakes: ['避免耸肩', '避免顶端互撞哑铃']
      }]
    })

    const page = createMiniProgramPage(exerciseDetailPagePath)
    await page.onLoad({ id: 'incline_dumbbell_press' })

    expect(page.data.exercise.name_cn).toBe('上斜哑铃卧推')
    expect(page.data.exercise.hasGif).toBe(true)
    expect(page.data.exercise.detailedStepCards.length).toBeGreaterThan(3)
    expect(page.data.loadError).toBe('')
    expect(page.data.sourceLabel).toBe('云端动作库')
  })

  test('exercise library page falls back to bundled exercises when cloud library is empty', async () => {
    setMockCollections({
      exercises: []
    })

    const page = createMiniProgramPage(exercisesPagePath)
    await page.onLoad()

    expect(page.data.exercises.length).toBeGreaterThan(10)
    expect(page.data.librarySourceLabel).toBe('内置种子库')
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
