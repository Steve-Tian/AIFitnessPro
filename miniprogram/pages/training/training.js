const app = getApp()

const {
  PREP_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_IMAGE,
  FALLBACK_EXERCISE_DETAILS,
  pickEncouragement
} = require('./training-constants')

const {
  getExerciseLibrary,
  resolveExerciseDetails,
  enrichWorkoutPlan,
  buildTrainingExercise,
  buildSupportPlanItems,
  buildAdaptiveNotes,
  formatDateKey,
  resolveWorkoutDayFromPlan
} = require('./training-exercise')

const {
  buildSessionUiState,
  isResumeSnapshotUsable,
  cloudDocToResumeSnapshot,
  pickNewerResumeSnapshot
} = require('./training-resume')

const {
  buildRpeOptions,
  buildTrainingSummary
} = require('./training-feedback')

Page({
  data: {
    currentExerciseIndex: 0,
    currentSet: 1,
    totalSets: 3,
    countdown: PREP_COUNTDOWN_SECONDS,
    isCountingDown: false,
    isResting: false,
    exercise: {
      name: '',
      alias: '',
      summary: '',
      categoryLabel: '',
      hasMedia: false,
      mediaUrl: DEFAULT_EXERCISE_IMAGE,
      targetSummary: '',
      primaryMuscles: [],
      secondaryMuscles: [],
      primaryMusclesText: '',
      secondaryMusclesText: '',
      instructionSteps: [],
      tips: [],
      commonMistakes: [],
      hasSecondaryMuscles: false,
      hasTips: false,
      hasCommonMistakes: false,
      equipmentText: '',
      difficultyLabel: ''
    },
    plan: [],
    warmup: [],
    cooldown: [],
    adaptiveNotes: [],
    rpeValue: 6,
    showRPESelector: false,
    exerciseFeedbackDrafts: [],
    exerciseFeedbackValue: 8,
    showExerciseFeedbackSelector: false,
    exerciseFeedbackTarget: {
      exerciseIndex: -1,
      exerciseName: '',
      exerciseAlias: '',
      sets: 0,
      reps: 0,
      rest: 0,
      equipment: []
    },
    exerciseFeedbackOptions: buildRpeOptions(8),
    currentDayType: '',
    currentWorkoutDate: '',
    isLoading: true,
    loadError: '',
    progressPercent: 0,
    prepStatusLabel: '准备开始',
    actionButtonLabel: '开始',
    disabledButtonLabel: '进行中...',
    skipButtonLabel: '跳过当前动作',
    setSkipButtonLabel: '跳过本组',
    restSkipButtonLabel: '跳过休息',
    showTrainingBody: false,
    showRestTimer: false,
    showMediaArea: false,
    rpeOptions: buildRpeOptions(6),
    encouragementText: '',
    showEncouragement: false,
    stepChecks: [],
    stepCheckCount: 0,
    allStepsChecked: false,
    isDemoMode: false,
    minimalMode: false
  },

  async onLoad(options = {}) {
    wx.setKeepScreenOn({ keepScreenOn: true })

    this.setData({ minimalMode: this.getFeedbackMode() === 'minimal' })

    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 1 })
    }

    await this.checkUnfinishedSession()

    if (this.pendingResumeSnapshot && this.pendingResumeSnapshot.workoutDate) {
      app.globalData.pendingWorkoutDate = this.pendingResumeSnapshot.workoutDate
    }

    if (options.plan) {
      try {
        const nextState = {
          ...this.data,
          isLoading: true,
          loadError: ''
        }
        this.setData({
          isLoading: true,
          loadError: '',
          ...buildSessionUiState(nextState)
        })
        const resumeDate = (this.pendingResumeSnapshot && this.pendingResumeSnapshot.workoutDate) || ''
        await this.applySelectedWorkoutDay({
          workout: JSON.parse(options.plan),
          type: options.dayType || '',
          date: resumeDate || options.date || formatDateKey(new Date())
        })
      } catch (error) {
        console.error('初始化训练页失败：', error)
        this.setData({
          isLoading: false,
          loadError: '训练内容加载失败，请返回重试',
          ...buildSessionUiState({
            ...this.data,
            isLoading: false,
            loadError: '训练内容加载失败，请返回重试'
          })
        })
      }
    } else {
      await this.loadCurrentPlan()
    }
  },

  async onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 1 })
    }

    const selectedWorkoutDay = app.globalData.selectedWorkoutDay
    if (selectedWorkoutDay && Array.isArray(selectedWorkoutDay.workout) && selectedWorkoutDay.workout.length > 0) {
      try {
        const nextState = {
          ...this.data,
          isLoading: true,
          loadError: ''
        }
        this.setData({
          isLoading: true,
          loadError: '',
          ...buildSessionUiState(nextState)
        })
        await this.applySelectedWorkoutDay(selectedWorkoutDay)
      } catch (error) {
        console.error('读取选中训练失败：', error)
        this.setData({
          isLoading: false,
          loadError: '训练内容加载失败，请返回重试',
          ...buildSessionUiState({
            ...this.data,
            isLoading: false,
            loadError: '训练内容加载失败，请返回重试'
          })
        })
      }
      app.globalData.selectedWorkoutDay = null
      app.globalData.pendingWorkoutDate = ''
      return
    }

    if (!this.data.plan.length) {
      await this.loadCurrentPlan()
    }
  },

  async applySelectedWorkoutDay(day) {
    console.log('[training] applySelectedWorkoutDay called, exercises count:', Array.isArray(day.workout) ? day.workout.length : 0)
    let workout = []
    const exerciseLibrary = getExerciseLibrary()

    if (exerciseLibrary && typeof exerciseLibrary.enrichWorkoutExercises === 'function') {
      try {
        workout = await exerciseLibrary.enrichWorkoutExercises(day.workout)
        console.log('[training] enrichWorkoutExercises OK, count:', workout.length)
        if (workout.length > 0) {
          console.log('[training] first exercise motto:', workout[0].motto, 'detailedStepCards:', workout[0].detailedStepCards ? workout[0].detailedStepCards.length : 0)
        }
      } catch (error) {
        console.error('[training] enrichWorkoutExercises 失败：', error)
      }
    } else {
      console.warn('[training] exercise-library 不可用，走本地兜底')
    }

    if (!Array.isArray(workout) || workout.length === 0) {
      console.log('[training] 使用本地 enrichWorkoutPlan 兜底')
      workout = enrichWorkoutPlan(day.workout)
    }

    workout = workout.map((exercise) => buildTrainingExercise(exercise))
    const firstExercise = workout.length > 0 ? workout[0] : {}
    console.log('[training] 最终首个动作:', firstExercise.name, 'hasMotto:', firstExercise.hasMotto, 'motto:', firstExercise.motto, 'detailedStepCards:', firstExercise.detailedStepCards ? firstExercise.detailedStepCards.length : 0)
    const adaptiveNotesSource = Array.isArray(day.adaptive_notes) && day.adaptive_notes.length
      ? day.adaptive_notes
      : workout
        .filter((exercise) => exercise.adaptiveNote)
        .map((exercise) => ({
          exerciseName: exercise.name,
          note: exercise.adaptiveNote
        }))
    this.clearTimers()
    const nextState = {
      currentExerciseIndex: 0,
      currentSet: 1,
      totalSets: firstExercise && firstExercise.sets ? firstExercise.sets : 3,
      countdown: PREP_COUNTDOWN_SECONDS,
      isCountingDown: false,
      isResting: false,
      plan: workout,
      warmup: buildSupportPlanItems(day.warmup),
      cooldown: buildSupportPlanItems(day.cooldown),
      adaptiveNotes: buildAdaptiveNotes(adaptiveNotesSource),
      exercise: firstExercise,
      rpeValue: 6,
      showRPESelector: false,
      exerciseFeedbackDrafts: [],
      exerciseFeedbackValue: 8,
      showExerciseFeedbackSelector: false,
      exerciseFeedbackTarget: {
        exerciseIndex: -1,
        exerciseName: '',
        exerciseAlias: '',
        sets: 0,
        reps: 0,
        rest: 0,
        equipment: []
      },
      rpeOptions: buildRpeOptions(6),
      exerciseFeedbackOptions: buildRpeOptions(8),
      currentDayType: day.type || '',
      currentWorkoutDate: day.date || formatDateKey(new Date()),
      isLoading: false,
      loadError: ''
    }
    this.setData({
      ...nextState,
      ...buildSessionUiState(nextState)
    })

    if (this.pendingResumeSnapshot) {
      this.resumeFromSnapshot()
    }
  },

  startDemoSession() {
    const exerciseLibrary = getExerciseLibrary()
    let demoExercises = []

    if (exerciseLibrary && typeof exerciseLibrary.getExerciseLibrary === 'function') {
      demoExercises = exerciseLibrary.getExerciseLibrary().slice(0, 3)
    }

    if (!demoExercises.length) {
      demoExercises = Object.keys(FALLBACK_EXERCISE_DETAILS).slice(0, 3).map((name) => {
        const detail = FALLBACK_EXERCISE_DETAILS[name]
        return resolveExerciseDetails({
          name,
          ...detail,
          sets: 3,
          reps: 10,
          rest: 60
        })
      })
    }

    const workout = demoExercises.map((exercise) => {
      const merged = typeof exercise.exercise_id === 'string'
        ? resolveExerciseDetails({ name: exercise.name_cn || exercise.name, sets: 3, reps: 10, rest: 60 })
        : exercise
      return buildTrainingExercise(merged)
    })

    const firstExercise = workout[0] || {}
    this.clearTimers()
    const nextState = {
      currentExerciseIndex: 0,
      currentSet: 1,
      totalSets: firstExercise.sets || 3,
      countdown: PREP_COUNTDOWN_SECONDS,
      isCountingDown: false,
      isResting: false,
      plan: workout,
      warmup: [],
      cooldown: [],
      adaptiveNotes: [],
      exercise: firstExercise,
      rpeValue: 6,
      showRPESelector: false,
      exerciseFeedbackDrafts: [],
      exerciseFeedbackValue: 8,
      showExerciseFeedbackSelector: false,
      exerciseFeedbackTarget: {
        exerciseIndex: -1,
        exerciseName: '',
        exerciseAlias: '',
        sets: 0,
        reps: 0,
        rest: 0,
        equipment: []
      },
      rpeOptions: buildRpeOptions(6),
      exerciseFeedbackOptions: buildRpeOptions(8),
      currentDayType: 'demo',
      currentWorkoutDate: formatDateKey(new Date()),
      isLoading: false,
      loadError: '',
      isDemoMode: true
    }
    this.setData({
      ...nextState,
      ...buildSessionUiState(nextState)
    })
  },

  async loadCurrentPlan() {
    try {
      const loadingState = {
        ...this.data,
        isLoading: true,
        loadError: ''
      }
      this.setData({
        isLoading: true,
        loadError: '',
        ...buildSessionUiState(loadingState)
      })
      const currentUser = app.globalData.userInfo
      if (!currentUser || !currentUser.current_plan_id) {
        this.startDemoSession()
        return
      }

      const preferredDate = app.globalData.pendingWorkoutDate || ''
      const cachedPlan = app.globalData.currentWeeklyPlan
      const cachedDay = resolveWorkoutDayFromPlan(cachedPlan, preferredDate)

      if (cachedDay) {
        await this.applySelectedWorkoutDay({
          date: formatDateKey(cachedDay.date) || preferredDate || formatDateKey(new Date()),
          type: cachedDay.type || '',
          title: cachedDay.title || '',
          workout: cachedDay.workout,
          warmup: cachedDay.warmup || [],
          cooldown: cachedDay.cooldown || [],
          adaptive_notes: cachedDay.adaptive_notes || []
        })
        app.globalData.pendingWorkoutDate = ''
        return
      }

      const { result } = await wx.cloud.callFunction({
        name: 'getPlan',
        data: {
          planId: currentUser.current_plan_id
        }
      })

      if (result && result.success && Array.isArray(result.weeklyPlan)) {
        app.globalData.currentWeeklyPlan = result.weeklyPlan
        const selectedDay = resolveWorkoutDayFromPlan(result.weeklyPlan, preferredDate)

        if (selectedDay) {
          await this.applySelectedWorkoutDay({
            date: formatDateKey(selectedDay.date) || preferredDate || formatDateKey(new Date()),
            type: selectedDay.type || '',
            title: selectedDay.title || '',
            workout: selectedDay.workout,
            warmup: selectedDay.warmup || [],
            cooldown: selectedDay.cooldown || [],
            adaptive_notes: selectedDay.adaptive_notes || []
          })
          app.globalData.pendingWorkoutDate = ''
        } else {
          const nextState = {
            ...this.data,
            isLoading: false,
            loadError: '当前没有可执行的训练日'
          }
          this.setData({
            isLoading: false,
            loadError: '当前没有可执行的训练日',
            ...buildSessionUiState(nextState)
          })
        }
      } else if (result && result.message) {
        const nextState = {
          ...this.data,
          isLoading: false,
          loadError: result.message
        }
        this.setData({
          isLoading: false,
          loadError: result.message,
          ...buildSessionUiState(nextState)
        })
      } else {
        const nextState = {
          ...this.data,
          isLoading: false,
          loadError: '未找到本周训练计划'
        }
        this.setData({
          isLoading: false,
          loadError: '未找到本周训练计划',
          ...buildSessionUiState(nextState)
        })
      }
    } catch (err) {
      console.error('加载计划失败：', err)
      const nextState = {
        ...this.data,
        isLoading: false,
        loadError: '加载计划失败，请稍后重试'
      }
      this.setData({
        isLoading: false,
        loadError: '加载计划失败，请稍后重试',
        ...buildSessionUiState(nextState)
      })
    }
  },

  getCurrentExercise() {
    const { plan, currentExerciseIndex } = this.data
    return plan[currentExerciseIndex] || null
  },

  // ==================== 断点恢复机制 ====================

  async saveSessionCheckpoint(status = 'in_progress') {
    if (this.data.isDemoMode) return
    const openid = app.globalData.openid
    if (!openid) return

    const snapshot = {
      status,
      currentExerciseIndex: this.data.currentExerciseIndex,
      currentSet: this.data.currentSet,
      totalSets: this.data.totalSets,
      isResting: this.data.isResting,
      isCountingDown: this.data.isCountingDown,
      countdown: this.data.countdown,
      workoutDate: this.data.currentWorkoutDate,
      dayType: this.data.currentDayType,
      exerciseFeedbackDrafts: this.data.exerciseFeedbackDrafts || [],
      planLength: Array.isArray(this.data.plan) ? this.data.plan.length : 0,
      savedAt: Date.now()
    }

    app.setUserStorage('training_session_snapshot', snapshot)

    if (status === 'completed' || status === 'abandoned' ||
        (this.data.currentSet % 2 === 0)) {
      try {
        const db = wx.cloud.database()
        const _ = db.command
        const planId = app.globalData.userInfo && app.globalData.userInfo.current_plan_id || ''
        const docId = `${openid}_${snapshot.workoutDate}`
        await db.collection('training_logs').doc(docId).set({
          data: {
            _id: docId,
            userId: openid,
            planId,
            workoutDate: snapshot.workoutDate,
            dayType: snapshot.dayType,
            status: snapshot.status,
            clientSavedAt: snapshot.savedAt,
            resumePoint: {
              exerciseIndex: snapshot.currentExerciseIndex,
              set: snapshot.currentSet,
              totalSets: snapshot.totalSets,
              isResting: snapshot.isResting,
              isCountingDown: snapshot.isCountingDown,
              countdown: snapshot.countdown,
              planLength: snapshot.planLength
            },
            exerciseFeedbackDrafts: snapshot.exerciseFeedbackDrafts,
            updatedAt: db.serverDate()
          }
        }).catch(async (err) => {
          if ((err && err.errCode === -502005) || (err && /not exist/i.test(String(err.errMsg || '')))) {
            await db.collection('training_logs').add({
              data: {
                _id: docId,
                userId: openid,
                planId,
                workoutDate: snapshot.workoutDate,
                dayType: snapshot.dayType,
                status: snapshot.status,
                clientSavedAt: snapshot.savedAt,
                resumePoint: {
                  exerciseIndex: snapshot.currentExerciseIndex,
                  set: snapshot.currentSet,
                  totalSets: snapshot.totalSets,
                  isResting: snapshot.isResting,
                  isCountingDown: snapshot.isCountingDown,
                  countdown: snapshot.countdown,
                  planLength: snapshot.planLength
                },
                exerciseFeedbackDrafts: snapshot.exerciseFeedbackDrafts,
                createdAt: db.serverDate(),
                updatedAt: db.serverDate()
              }
            })
          } else {
            throw err
          }
        })
      } catch (err) {
        console.warn('[training] 云端断点保存失败（本地已保存）：', err)
      }
    }
  },

  clearSessionCheckpoint() {
    app.setUserStorage('training_session_snapshot', null)
  },

  async ensureOpenidReady(maxWaitMs = 4000) {
    const start = Date.now()
    while (!app.globalData.openid && Date.now() - start < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
  },

  async fetchCloudResumeSnapshot(localSnap) {
    const openid = app.globalData.openid
    if (!openid || !wx.cloud) return null
    const db = wx.cloud.database()
    let cloudDoc = null
    try {
      if (localSnap && localSnap.workoutDate) {
        const docId = `${openid}_${localSnap.workoutDate}`
        try {
          const res = await db.collection('training_logs').doc(docId).get()
          cloudDoc = res && res.data ? res.data : null
        } catch (e) {
          /* 文档不存在或无权访问 */
        }
      }
      if (!cloudDoc) {
        const { data: rows } = await db.collection('training_logs').where({
          userId: openid,
          status: 'in_progress'
        }).limit(20).get()
        if (rows && rows.length) {
          cloudDoc = rows.reduce((best, cur) =>
            (Number(cur.clientSavedAt || 0) > Number(best.clientSavedAt || 0) ? cur : best), rows[0])
        }
      }
    } catch (err) {
      console.warn('[training] 读取云端断点失败：', err)
      return null
    }
    return cloudDocToResumeSnapshot(cloudDoc)
  },

  async checkUnfinishedSession() {
    await this.ensureOpenidReady()

    const localSnap = app.getUserStorage('training_session_snapshot')
    const remoteSnap = await this.fetchCloudResumeSnapshot(localSnap)
    const merged = pickNewerResumeSnapshot(localSnap, remoteSnap)

    if (!merged) {
      return
    }

    if (remoteSnap && merged === remoteSnap) {
      app.setUserStorage('training_session_snapshot', {
        ...merged,
        savedAt: merged.savedAt || Date.now()
      })
    }

    const snapshot = merged

    if (!snapshot || snapshot.status === 'completed' || snapshot.status === 'abandoned') {
      return
    }

    if (Date.now() - (snapshot.savedAt || 0) > 24 * 3600 * 1000) {
      this.clearSessionCheckpoint()
      return
    }

    if (typeof snapshot.currentExerciseIndex === 'number' &&
        snapshot.planLength > 0 &&
        snapshot.currentExerciseIndex >= snapshot.planLength) {
      this.clearSessionCheckpoint()
      return
    }

    return new Promise((resolve) => {
      wx.showModal({
        title: '检测到未完成训练',
        content: `上次训练到第 ${Number(snapshot.currentExerciseIndex) + 1} 个动作第 ${snapshot.currentSet} 组，是否继续？`,
        confirmText: '继续',
        cancelText: '重新开始',
        success: (res) => {
          if (res.confirm) {
            this.pendingResumeSnapshot = snapshot
          } else {
            this.clearSessionCheckpoint()
          }
          resolve()
        },
        fail: () => resolve()
      })
    })
  },

  resumeFromSnapshot() {
    const snapshot = this.pendingResumeSnapshot
    if (!snapshot) return false
    this.pendingResumeSnapshot = null

    const plan = this.data.plan || []
    const safeIndex = Math.min(Math.max(0, Number(snapshot.currentExerciseIndex) || 0), Math.max(0, plan.length - 1))
    const targetExercise = plan[safeIndex] || {}
    const safeSet = Math.min(Math.max(1, Number(snapshot.currentSet) || 1), Number(targetExercise.sets) || 3)

    const isResting = Boolean(snapshot.isResting)
    const isCountingDown = Boolean(snapshot.isCountingDown)
    let countdown = typeof snapshot.countdown === 'number' ? snapshot.countdown : PREP_COUNTDOWN_SECONDS
    if (isResting || isCountingDown) {
      countdown = Math.max(0, Math.floor(countdown))
    }

    const stepChecks = this.buildStepChecks(targetExercise)
    const nextState = {
      ...this.data,
      currentExerciseIndex: safeIndex,
      currentSet: safeSet,
      totalSets: targetExercise.sets || 3,
      exercise: targetExercise,
      exerciseFeedbackDrafts: Array.isArray(snapshot.exerciseFeedbackDrafts) ? snapshot.exerciseFeedbackDrafts : [],
      currentDayType: snapshot.dayType || this.data.currentDayType,
      currentWorkoutDate: snapshot.workoutDate || this.data.currentWorkoutDate,
      isResting,
      isCountingDown,
      countdown,
      stepChecks,
      stepCheckCount: 0,
      allStepsChecked: false,
      loadError: '',
      isLoading: false
    }

    this.clearTimers()

    this.setData({
      currentExerciseIndex: safeIndex,
      currentSet: safeSet,
      totalSets: targetExercise.sets || 3,
      exercise: targetExercise,
      exerciseFeedbackDrafts: nextState.exerciseFeedbackDrafts,
      currentDayType: nextState.currentDayType,
      currentWorkoutDate: nextState.currentWorkoutDate,
      isResting,
      isCountingDown,
      countdown,
      stepChecks,
      stepCheckCount: 0,
      allStepsChecked: false,
      loadError: '',
      isLoading: false,
      ...buildSessionUiState(nextState)
    })

    if (isResting && countdown > 0) {
      this.startRestTimer(countdown)
    } else if (isCountingDown && countdown > 0) {
      this.startCountdown(countdown)
    }

    wx.showToast({ title: '已恢复上次进度', icon: 'none' })
    return true
  },

  clearTimers() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
    if (this.restInterval) {
      clearInterval(this.restInterval)
      this.restInterval = null
    }
    if (this.encouragementTimer) {
      clearTimeout(this.encouragementTimer)
      this.encouragementTimer = null
    }
  },

  showEncouragementMessage(category) {
    const text = pickEncouragement(category)
    this.setData({
      encouragementText: text,
      showEncouragement: true
    })
    if (this.encouragementTimer) {
      clearTimeout(this.encouragementTimer)
    }
    this.encouragementTimer = setTimeout(() => {
      this.setData({ showEncouragement: false })
      this.encouragementTimer = null
    }, 3000)
  },

  buildStepChecks(exercise) {
    const steps = Array.isArray(exercise.detailedStepCards) ? exercise.detailedStepCards : []
    return steps.filter((s) => s.isMotto).map((step, index) => ({
      index,
      label: step.label,
      checked: false
    }))
  },

  toggleStepCheck(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const checks = this.data.stepChecks.slice()
    if (checks[idx]) {
      checks[idx] = { ...checks[idx], checked: !checks[idx].checked }
    }
    const count = checks.filter((c) => c.checked).length
    const allChecked = count === checks.length && checks.length > 0
    this.setData({
      stepChecks: checks,
      stepCheckCount: count,
      allStepsChecked: allChecked
    })
    if (allChecked) {
      this.showEncouragementMessage('consistentGood')
    }
  },

  // ==================== 计时器与动作流程 ====================

  startExercise() {
    const exercise = this.getCurrentExercise()
    if (!exercise || !exercise.name) {
      wx.showToast({ title: '训练已完成！', icon: 'none' })
      return
    }

    if (!this.sessionStartedAt) {
      this.sessionStartedAt = Date.now()
    }

    this.clearTimers()
    this.showEncouragementMessage('exerciseStart')
    const stepChecks = this.buildStepChecks(exercise)
    const nextState = {
      ...this.data,
      totalSets: exercise.sets || 3,
      currentSet: 1,
      countdown: PREP_COUNTDOWN_SECONDS,
      exercise,
      isCountingDown: true,
      isResting: false,
      loadError: '',
      isLoading: false
    }
    this.setData({
      totalSets: exercise.sets || 3,
      currentSet: 1,
      countdown: PREP_COUNTDOWN_SECONDS,
      exercise,
      isCountingDown: true,
      isResting: false,
      stepChecks,
      stepCheckCount: 0,
      allStepsChecked: false,
      ...buildSessionUiState(nextState)
    })

    this.countdownInterval = setInterval(() => {
      this.setData({
        countdown: this.data.countdown - 1
      })

      if (this.data.countdown <= 0) {
        this.endCountdown()
      }
    }, 1000)
  },

  startCountdown(overrideSeconds) {
    const exercise = this.getCurrentExercise()
    if (!exercise || !exercise.name) return

    this.clearTimers()
    const initial = typeof overrideSeconds === 'number'
      ? Math.max(0, Math.floor(overrideSeconds))
      : PREP_COUNTDOWN_SECONDS
    const nextState = {
      ...this.data,
      isCountingDown: true,
      isResting: false,
      countdown: initial
    }
    this.setData({
      isCountingDown: true,
      isResting: false,
      countdown: initial,
      ...buildSessionUiState(nextState)
    })
    this.countdownInterval = setInterval(() => {
      this.setData({
        countdown: this.data.countdown - 1
      })

      if (this.data.countdown <= 0) {
        this.endCountdown()
      }
    }, 1000)
  },

  endCountdown() {
    const exercise = this.getCurrentExercise()
    if (!exercise || !exercise.name) {
      this.clearTimers()
      return
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
    const nextState = {
      ...this.data,
      isCountingDown: false,
      countdown: exercise.rest || 90
    }
    this.setData({
      isCountingDown: false,
      countdown: exercise.rest || 90,
      ...buildSessionUiState(nextState)
    })

    this.startRestTimer()
  },

  startRestTimer(overrideSeconds) {
    if (this.restInterval) {
      clearInterval(this.restInterval)
      this.restInterval = null
    }
    this.showEncouragementMessage('setComplete')
    const seconds = typeof overrideSeconds === 'number'
      ? Math.max(0, Math.floor(overrideSeconds))
      : this.data.countdown
    const nextState = {
      ...this.data,
      isResting: true,
      isCountingDown: false,
      countdown: seconds
    }
    this.setData({
      isResting: true,
      isCountingDown: false,
      countdown: seconds,
      ...buildSessionUiState(nextState)
    })
    this.restInterval = setInterval(() => {
      this.setData({
        countdown: this.data.countdown - 1
      })

      if (this.data.countdown <= 0) {
        this.endRest()
      }
    }, 1000)
  },

  endRest() {
    if (this.restInterval) {
      clearInterval(this.restInterval)
      this.restInterval = null
    }

    const nextSet = this.data.currentSet + 1
    const nextState = {
      ...this.data,
      isResting: false,
      currentSet: nextSet,
      countdown: PREP_COUNTDOWN_SECONDS
    }
    this.setData({
      isResting: false,
      currentSet: nextSet,
      countdown: PREP_COUNTDOWN_SECONDS,
      ...buildSessionUiState(nextState)
    })

    this.saveSessionCheckpoint('in_progress').catch(() => {})

    if (nextSet > this.data.totalSets) {
      this.nextExercise()
    } else {
      this.startCountdown()
    }
  },

  // ==================== 反馈与动作切换 ====================

  getFeedbackMode() {
    const user = app.globalData.userInfo
    return (user && user.feedback_mode) || 'standard'
  },

  nextExercise(options = {}) {
    const nextIndex = typeof options.nextIndex === 'number'
      ? options.nextIndex
      : this.data.currentExerciseIndex + 1

    const feedbackMode = this.getFeedbackMode()

    if (!options.skipFeedback && feedbackMode !== 'minimal') {
      const completedExercise = this.getCurrentExercise()
      if (completedExercise && completedExercise.name) {
        if (feedbackMode === 'rpe') {
          // RPE 模式：跳过单动作反馈，直接到整体 RPE 评分
          this.setData({ showRPESelector: true })
          return
        }
        // 标准模式：弹出单动作反馈选择器
        this.openExerciseFeedbackSelector(completedExercise, this.data.currentExerciseIndex, nextIndex)
        return
      }
    }

    this.advanceToExercise(nextIndex, { autoStart: Boolean(options.autoStart) })
  },

  advanceToExercise(nextIndex, options = {}) {
    if (nextIndex < this.data.plan.length) {
      const nextExercise = this.data.plan[nextIndex] || {}
      const shouldAutoStart = Boolean(options.autoStart)
      const stepChecks = this.buildStepChecks(nextExercise)
      this.showEncouragementMessage(nextIndex > 0 ? 'exerciseComplete' : 'exerciseStart')
      const nextState = {
        ...this.data,
        currentExerciseIndex: nextIndex,
        currentSet: 1,
        totalSets: nextExercise.sets || 3,
        countdown: PREP_COUNTDOWN_SECONDS,
        exercise: nextExercise,
        isCountingDown: shouldAutoStart,
        isResting: false
      }
      this.setData({
        currentExerciseIndex: nextIndex,
        currentSet: 1,
        totalSets: nextExercise.sets || 3,
        countdown: PREP_COUNTDOWN_SECONDS,
        exercise: nextExercise,
        isCountingDown: shouldAutoStart,
        stepChecks,
        stepCheckCount: 0,
        allStepsChecked: false,
        ...buildSessionUiState(nextState)
      })
      if (shouldAutoStart) {
        this.countdownInterval = setInterval(() => {
          this.setData({ countdown: this.data.countdown - 1 })
          if (this.data.countdown <= 0) {
            this.endCountdown()
          }
        }, 1000)
      }
    } else {
      this.clearTimers()
      this.showEncouragementMessage('workoutComplete')
      if (this.data.minimalMode) {
        this.setData({ rpeValue: 7 })
        this.submitFeedback()
      } else {
        this.showRPESelection()
      }
    }
  },

  openExerciseFeedbackSelector(exercise, exerciseIndex, nextIndex) {
    this.clearTimers()
    this.pendingNextExerciseIndex = nextIndex
    this.setData({
      showExerciseFeedbackSelector: true,
      exerciseFeedbackValue: 8,
      exerciseFeedbackOptions: buildRpeOptions(8),
      exerciseFeedbackTarget: {
        exerciseIndex,
        exerciseName: exercise.name || '',
        exerciseAlias: exercise.alias || '',
        sets: exercise.sets || 3,
        reps: exercise.reps || 8,
        rest: exercise.rest || 90,
        equipment: Array.isArray(exercise.equipment) ? exercise.equipment : []
      }
    })
  },

  showRPESelection() {
    this.setData({ showRPESelector: true })
  },

  hideRPESelector() {
    this.setData({ showRPESelector: false })
  },

  selectRPE(e) {
    const rpe = parseInt(e.currentTarget.dataset.rpe)
    this.setData({
      rpeValue: rpe,
      rpeOptions: buildRpeOptions(rpe)
    })
  },

  selectExerciseRPE(e) {
    const rpe = parseInt(e.currentTarget.dataset.rpe)
    this.setData({
      exerciseFeedbackValue: rpe,
      exerciseFeedbackOptions: buildRpeOptions(rpe)
    })
  },

  confirmExerciseFeedback() {
    const target = this.data.exerciseFeedbackTarget || {}
    const nextFeedback = {
      exerciseIndex: typeof target.exerciseIndex === 'number' ? target.exerciseIndex : this.data.currentExerciseIndex,
      exerciseName: target.exerciseName || '',
      exerciseAlias: target.exerciseAlias || '',
      rpe: this.data.exerciseFeedbackValue,
      sets: target.sets || 3,
      reps: target.reps || 8,
      rest: target.rest || 90,
      equipment: Array.isArray(target.equipment) ? target.equipment : []
    }
    const drafts = Array.isArray(this.data.exerciseFeedbackDrafts)
      ? this.data.exerciseFeedbackDrafts.filter((item) => item.exerciseIndex !== nextFeedback.exerciseIndex)
      : []
    drafts.push(nextFeedback)

    const nextIndex = typeof this.pendingNextExerciseIndex === 'number'
      ? this.pendingNextExerciseIndex
      : this.data.currentExerciseIndex + 1

    this.pendingNextExerciseIndex = null
    this.setData({
      showExerciseFeedbackSelector: false,
      exerciseFeedbackDrafts: drafts
    })

    this.advanceToExercise(nextIndex)
  },

  async submitFeedback() {
    this.setData({ showRPESelector: false })

    if (this.data.isDemoMode) {
      wx.showToast({ title: '演示完成！', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
      return
    }

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'saveFeedback',
        data: {
          planId: app.globalData.userInfo.current_plan_id,
          exerciseIndex: this.data.currentExerciseIndex,
          rpe: this.data.rpeValue,
          completedAt: new Date(),
          dayType: this.data.currentDayType,
          workoutDate: this.data.currentWorkoutDate || formatDateKey(new Date()),
          exerciseFeedback: this.data.exerciseFeedbackDrafts
        }
      })

      if (result.success) {
        wx.showToast({ title: '训练完成！', icon: 'success' })

        await this.saveSessionCheckpoint('completed').catch(() => {})
        this.clearSessionCheckpoint()

        const newStreak = typeof result.newStreak === 'number'
          ? result.newStreak
          : (app.globalData.userInfo.streak_days || 0)
        app.globalData.userInfo.streak_days = newStreak
        if (Array.isArray(result.updatedWeeklyPlan)) {
          app.globalData.currentWeeklyPlan = result.updatedWeeklyPlan
        }

        const summaryData = buildTrainingSummary(this.data, this.sessionStartedAt, result)
        app.globalData.lastTrainingSummary = summaryData

        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/training-summary/training-summary',
            fail: () => {
              wx.switchTab({ url: '/pages/index/index' })
            }
          })
        }, 1500)
      } else {
        wx.showToast({ title: result.message || '提交失败', icon: 'none' })
      }
    } catch (err) {
      console.error('提交反馈失败：', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    }
  },

  // ==================== 跳过与辅助 ====================

  skipCurrentExercise() {
    const exercise = this.getCurrentExercise()

    if (!exercise || !exercise.name) {
      wx.showToast({ title: '当前没有可跳过的训练内容', icon: 'none' })
      return
    }

    this.clearTimers()
    this.nextExercise({ skipFeedback: true, autoStart: true })
  },

  skipRestPeriod() {
    const exercise = this.getCurrentExercise()

    if (!exercise || !exercise.name || !this.data.isResting) {
      wx.showToast({ title: '当前不在休息阶段', icon: 'none' })
      return
    }

    this.endRest()
  },

  skipCurrentSet() {
    const exercise = this.getCurrentExercise()

    if (!exercise || !exercise.name || !this.data.isCountingDown) {
      wx.showToast({ title: '当前没有可跳过的训练组', icon: 'none' })
      return
    }

    this.endCountdown()
  },

  shortenRestPeriod(e) {
    const seconds = Number(e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.seconds)

    if (!this.data.isResting) {
      wx.showToast({ title: '当前不在休息阶段', icon: 'none' })
      return
    }

    if (!seconds || seconds < 1) {
      wx.showToast({ title: '跳过时长无效', icon: 'none' })
      return
    }

    const nextCountdown = this.data.countdown - seconds
    if (nextCountdown <= 0) {
      this.endRest()
      return
    }

    this.setData({
      countdown: nextCountdown
    })
  },

  skipExercise() {
    this.skipCurrentExercise()
  },

  handleMediaError() {
    const currentExerciseIndex = this.data.currentExerciseIndex
    const fallbackPath = DEFAULT_EXERCISE_IMAGE
    const updates = {
      'exercise.mediaUrl': fallbackPath
    }

    if (Array.isArray(this.data.plan) && this.data.plan[currentExerciseIndex]) {
      updates[`plan.${currentExerciseIndex}.mediaUrl`] = fallbackPath
    }

    this.setData(updates)
  },

  openExerciseDetail() {
    const exercise = this.data.exercise || {}
    if (!exercise.name) return

    const parts = []
    if (exercise.id || exercise.exercise_id) {
      parts.push(`id=${exercise.id || exercise.exercise_id}`)
    }
    parts.push(`name=${encodeURIComponent(exercise.name)}`)

    wx.navigateTo({
      url: `/pages/exercise-detail/exercise-detail?${parts.join('&')}`
    })
  },

  goBack() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onUnload() {
    this.clearTimers()
    wx.setKeepScreenOn({ keepScreenOn: false })
    if (this.data.plan && this.data.plan.length > 0 && !this.data.isDemoMode) {
      this.saveSessionCheckpoint('abandoned').catch((err) => {
        console.warn('[training] 保存断点失败：', err)
      })
    }
  }
})
