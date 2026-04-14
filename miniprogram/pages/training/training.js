const app = getApp()
const exerciseCatalog = require('../../data/exercises.json')

const PREP_COUNTDOWN_SECONDS = 10
const DEFAULT_EXERCISE_IMAGE = '/images/default_exercise.png'
const DEFAULT_EXERCISE_INSTRUCTIONS = [
  '先完成热身，再按推荐组数与次数执行动作',
  '全程保持核心收紧，优先保证动作标准',
  '若出现明显疼痛或动作变形，请立即降低强度'
]
const MUSCLE_LABELS = {
  chest: '胸肌',
  triceps: '肱三头肌',
  front_delts: '前三角',
  shoulders: '三角肌',
  rear_delts: '后三角',
  back: '背阔肌',
  rhomboids: '菱形肌',
  biceps: '肱二头肌',
  forearms: '前臂',
  quads: '股四头肌',
  hamstrings: '腘绳肌',
  glutes: '臀大肌',
  calves: '小腿',
  core: '核心'
}
const EQUIPMENT_LABELS = {
  full_gym: '综合器械',
  barbell_bench: '杠铃/卧推架',
  dumbbell_only: '哑铃',
  bodyweight: '徒手',
  cable: '绳索器械'
}
const DIFFICULTY_LABELS = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '进阶'
}
const CATEGORY_LABELS = {
  push: '推日',
  pull: '拉日',
  legs: '腿日'
}

const FALLBACK_EXERCISE_DETAILS = {
  '钻石俯卧撑': {
    alias: ['窄距俯卧撑'],
    muscle: ['triceps', 'chest', 'front_delts'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      '双手放在胸前下方，拇指与食指靠近呈钻石形',
      '身体保持一条直线，缓慢下放至胸部接近手背',
      '手掌发力推起，顶端收紧胸肌和三头肌'
    ],
    tips: ['肘部自然贴近身体两侧', '全程收紧核心，避免塌腰'],
    commonMistakes: ['手掌位置过宽，导致胸肌发力分散', '下放时塌腰或耸肩']
  },
  '派克俯卧撑': {
    alias: ['Pike Push-up'],
    muscle: ['shoulders', 'triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    instructions: [
      '双手撑地，臀部抬高形成倒 V 字',
      '屈肘让头部向地面下方移动',
      '肩部发力推回起始位置'
    ],
    tips: ['重心略向前，让肩部更多发力', '动作全程避免耸肩'],
    commonMistakes: ['臀部塌陷，变成普通俯卧撑轨迹', '手肘外翻过大导致肩部不稳']
  },
  '超人挺身': {
    alias: ['Superman'],
    muscle: ['back', 'glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      '俯卧趴地，双手向前伸直',
      '同时抬起双臂和双腿，感受背部发力',
      '顶峰停顿 1 秒后缓慢放下'
    ],
    tips: ['动作幅度不必过大，重在控制', '颈部保持自然，不要抬头过度'],
    commonMistakes: ['抬头过高导致颈部受压', '依靠甩腿而不是背部主动发力']
  },
  '俯身Y-T-W': {
    alias: ['YTW'],
    muscle: ['rear_delts', 'rhomboids', 'back'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      '微屈髋俯身，核心收紧',
      '双臂依次做 Y、T、W 三个轨迹抬举',
      '每个轨迹顶峰停顿后缓慢回到起始位置'
    ],
    tips: ['全程小重量或徒手控制', '肩胛骨主动后缩下沉'],
    commonMistakes: ['动作太快，肩后束无法充分收缩', '耸肩代偿导致斜方肌抢力']
  },
  '毛巾弯举': {
    alias: ['自阻弯举'],
    muscle: ['biceps', 'forearms'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      '双手握住毛巾两端，一侧向上弯举，另一侧提供阻力',
      '弯举至手肘完全屈曲，顶峰停顿',
      '缓慢下放并换边重复'
    ],
    tips: ['阻力保持均匀，不要突然放松', '肘部尽量固定在身体两侧'],
    commonMistakes: ['阻力忽大忽小，导致动作节奏失控', '身体后仰借力']
  },
  '徒手深蹲': {
    alias: ['自重深蹲'],
    muscle: ['quads', 'glutes', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      '双脚与肩同宽站立，脚尖略向外',
      '屈髋屈膝下蹲至大腿接近平行地面',
      '脚跟发力站起，回到起始姿势'
    ],
    tips: ['膝盖方向与脚尖一致', '保持胸口打开，避免塌腰'],
    commonMistakes: ['膝盖内扣', '下蹲时脚跟离地']
  },
  '反向弓步蹲': {
    alias: ['后撤箭步蹲'],
    muscle: ['glutes', 'quads', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      '站立姿势开始，单腿向后撤一步',
      '前腿屈膝下蹲，后膝接近地面',
      '前脚发力回到起始位置，再换边'
    ],
    tips: ['前脚脚跟持续发力', '躯干保持稳定直立'],
    commonMistakes: ['步幅过小导致膝盖压力过大', '躯干前倾过多']
  },
  '站姿提踵': {
    alias: ['自重提踵'],
    muscle: ['calves'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: [
      '双脚与肩同宽站立，脚掌踩稳地面',
      '脚尖发力将脚跟抬至最高点',
      '缓慢下放，感受小腿拉伸'
    ],
    tips: ['顶峰停顿 1 秒', '下降过程尽量放慢'],
    commonMistakes: ['动作反弹过快', '身体左右摇晃']
  }
}

function sanitizeGifUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.includes('example.com')) return ''
  return url
}

function buildExerciseDetailIndex() {
  const index = {}
  const exercises = Array.isArray(exerciseCatalog.exercises) ? exerciseCatalog.exercises : []

  exercises.forEach((exercise) => {
    index[exercise.name] = exercise
    ;(exercise.alias || []).forEach((alias) => {
      index[alias] = exercise
    })
  })

  Object.keys(FALLBACK_EXERCISE_DETAILS).forEach((name) => {
    const detail = FALLBACK_EXERCISE_DETAILS[name]
    index[name] = {
      name,
      ...detail
    }
    ;(detail.alias || []).forEach((alias) => {
      index[alias] = {
        name,
        ...detail
      }
    })
  })

  return index
}

const EXERCISE_DETAIL_INDEX = buildExerciseDetailIndex()

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function formatDateKey(input) {
  if (!input) return ''
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input
  }

  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }
  if (value) {
    return [value]
  }
  return []
}

function translateLabels(values, dictionary) {
  return normalizeList(values).map((value) => dictionary[value] || value)
}

function buildInstructionSteps(instructions) {
  return normalizeList(instructions).map((text, index) => ({
    label: `步骤 ${index + 1}`,
    text
  }))
}

function resolveExerciseDetails(exercise) {
  if (!exercise) return {}

  const candidates = []
  if (exercise.name) {
    candidates.push(exercise.name)
  }
  if (Array.isArray(exercise.alias)) {
    exercise.alias.forEach((alias) => {
      if (alias) {
        candidates.push(alias)
      }
    })
  } else if (exercise.alias) {
    candidates.push(exercise.alias)
  }
  const detail = candidates
    .map((key) => EXERCISE_DETAIL_INDEX[key])
    .find(Boolean) || {}

  const alias = typeof exercise.alias === 'string'
    ? exercise.alias
    : Array.isArray(detail.alias) && detail.alias.length
      ? detail.alias[0]
      : ''
  const rawMuscles = normalizeList(detail.muscle && detail.muscle.length ? detail.muscle : exercise.muscle)
  const muscleLabels = translateLabels(rawMuscles, MUSCLE_LABELS)
  const primaryMuscles = muscleLabels.slice(0, 2)
  const secondaryMuscles = muscleLabels.slice(2)
  const equipmentLabels = translateLabels(detail.equipment || exercise.equipment, EQUIPMENT_LABELS)
  const instructions = Array.isArray(exercise.instructions) && exercise.instructions.length
    ? exercise.instructions
    : Array.isArray(detail.instructions) && detail.instructions.length
      ? detail.instructions
      : DEFAULT_EXERCISE_INSTRUCTIONS
  const instructionSteps = buildInstructionSteps(instructions)
  const commonMistakes = Array.isArray(detail.commonMistakes) ? detail.commonMistakes : []
  const category = detail.category || exercise.category || ''
  const hasMedia = Boolean(sanitizeGifUrl(exercise.gifUrl || detail.gifUrl))

  return {
    ...detail,
    ...exercise,
    alias,
    gifUrl: hasMedia ? sanitizeGifUrl(exercise.gifUrl || detail.gifUrl) : '',
    mediaUrl: hasMedia ? sanitizeGifUrl(exercise.gifUrl || detail.gifUrl) : DEFAULT_EXERCISE_IMAGE,
    hasMedia,
    instructions,
    instructionSteps,
    tips: Array.isArray(detail.tips) ? detail.tips : [],
    commonMistakes,
    muscleLabels,
    primaryMuscles,
    secondaryMuscles,
    primaryMusclesText: primaryMuscles.join(' / ') || '全身协调发力',
    secondaryMusclesText: secondaryMuscles.join(' / ') || '核心稳定与关节控制',
    targetSummary: muscleLabels.length
      ? `主练 ${primaryMuscles.join('、')}${secondaryMuscles.length ? `，辅助 ${secondaryMuscles.join('、')}` : ''}`
      : '重点关注动作轨迹、核心稳定和离心控制',
    equipmentLabels,
    equipmentText: equipmentLabels.join(' / ') || '按现有器械完成',
    difficultyLabel: DIFFICULTY_LABELS[detail.difficulty || exercise.difficulty] || '常规难度',
    categoryLabel: CATEGORY_LABELS[category] || CATEGORY_LABELS[exercise.category] || '',
    summary: `${exercise.sets || 3} 组 × ${exercise.reps || 8} 次 · 休息 ${exercise.rest || 90} 秒`
  }
}

function enrichWorkoutPlan(workout) {
  return (Array.isArray(workout) ? workout : []).map((exercise) => resolveExerciseDetails(exercise))
}

Page({
  data: {
    currentExerciseIndex: 0,
    currentSet: 1,
    totalSets: 3,
    countdown: PREP_COUNTDOWN_SECONDS, // 倒计时秒数
    isCountingDown: false,
    isResting: false,
    exercise: {},
    plan: [],
    rpeValue: 6, // RPE评分（6-10）
    showRPESelector: false,
    currentDayType: '',
    currentWorkoutDate: ''
  },

  onLoad(options) {
    // 从首页传入的计划数据
    if (options.plan) {
      this.applySelectedWorkoutDay({
        workout: JSON.parse(options.plan),
        type: options.dayType || '',
        date: options.date || formatDateKey(new Date())
      })
    } else {
      // 如果没有传入计划，尝试获取当前用户的计划
      this.loadCurrentPlan()
    }
  },

  onShow() {
    const selectedWorkoutDay = app.globalData.selectedWorkoutDay
    if (selectedWorkoutDay && Array.isArray(selectedWorkoutDay.workout) && selectedWorkoutDay.workout.length > 0) {
      this.applySelectedWorkoutDay(selectedWorkoutDay)
      app.globalData.selectedWorkoutDay = null
      return
    }

    if (!this.data.plan.length) {
      this.loadCurrentPlan()
    }
  },

  applySelectedWorkoutDay(day) {
    const workout = enrichWorkoutPlan(day.workout)
    this.clearTimers()
    this.setData({
      currentExerciseIndex: 0,
      currentSet: 1,
      totalSets: workout[0]?.sets || 3,
      countdown: PREP_COUNTDOWN_SECONDS,
      isCountingDown: false,
      isResting: false,
      plan: workout,
      exercise: workout[0] || {},
      showRPESelector: false,
      currentDayType: day.type || '',
      currentWorkoutDate: day.date || formatDateKey(new Date())
    })
  },

  async loadCurrentPlan() {
    try {
      const db = wx.cloud.database()
      if (!app.globalData.userInfo?.current_plan_id) {
        wx.showToast({ title: '请先生成训练计划', icon: 'none' })
        return
      }

      const { data } = await db.collection('plans').doc(app.globalData.userInfo.current_plan_id).get()
      if (data && data.weeklyPlan) {
        const today = formatDateKey(new Date())
        const todayPlan = data.weeklyPlan.find(d => 
          formatDateKey(d.date) === today
        )
        
        if (todayPlan && todayPlan.workout) {
          this.applySelectedWorkoutDay({
            date: formatDateKey(todayPlan.date) || today,
            type: todayPlan.type || '',
            workout: todayPlan.workout
          })
        } else {
          wx.showToast({ title: '今日无训练计划', icon: 'none' })
        }
      }
    } catch (err) {
      console.error('加载计划失败：', err)
      wx.showToast({ title: '加载计划失败', icon: 'none' })
    }
  },

  getCurrentExercise() {
    const { plan, currentExerciseIndex } = this.data
    return plan[currentExerciseIndex] || null
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
  },

  // 开始当前动作
  startExercise() {
    const exercise = this.getCurrentExercise()
    if (!exercise || !exercise.name) {
      wx.showToast({ title: '训练已完成！', icon: 'none' })
      return
    }

    this.setData({
      totalSets: exercise.sets || 3,
      currentSet: 1,
      countdown: PREP_COUNTDOWN_SECONDS,
      exercise
    })

    // 开始倒计时
    this.startCountdown()
  },

  // 开始倒计时
  startCountdown() {
    const exercise = this.getCurrentExercise()
    if (!exercise || !exercise.name) return

    this.clearTimers()
    this.setData({
      isCountingDown: true,
      isResting: false,
      countdown: PREP_COUNTDOWN_SECONDS
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

  // 结束倒计时
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
    this.setData({
      isCountingDown: false,
      countdown: exercise.rest || 90
    })

    // 开始休息倒计时
    this.startRestTimer()
  },

  // 休息倒计时
  startRestTimer() {
    if (this.restInterval) {
      clearInterval(this.restInterval)
      this.restInterval = null
    }
    this.setData({ isResting: true, isCountingDown: false })
    this.restInterval = setInterval(() => {
      this.setData({
        countdown: this.data.countdown - 1
      })

      if (this.data.countdown <= 0) {
        this.endRest()
      }
    }, 1000)
  },

  // 结束休息
  endRest() {
    if (this.restInterval) {
      clearInterval(this.restInterval)
      this.restInterval = null
    }

    const nextSet = this.data.currentSet + 1
    this.setData({
      isResting: false,
      currentSet: nextSet,
      countdown: PREP_COUNTDOWN_SECONDS
    })

    // 检查是否完成当前动作的所有组数
    if (nextSet > this.data.totalSets) {
      this.nextExercise()
    } else {
      // 继续下一组
      this.startCountdown()
    }
  },

  // 进入下一动作
  nextExercise() {
    const nextIndex = this.data.currentExerciseIndex + 1
    if (nextIndex < this.data.plan.length) {
      const nextExercise = this.data.plan[nextIndex] || {}
      this.setData({
        currentExerciseIndex: nextIndex,
        currentSet: 1,
        totalSets: nextExercise.sets || 3,
        countdown: PREP_COUNTDOWN_SECONDS,
        exercise: nextExercise
      })
      this.startExercise()
    } else {
      // 训练完成
      this.clearTimers()
      this.showRPESelection()
    }
  },

  // 显示RPE选择器
  showRPESelection() {
    this.setData({ showRPESelector: true })
  },

  // 隐藏RPE选择器
  hideRPESelector() {
    this.setData({ showRPESelector: false })
  },

  // 选择RPE评分
  selectRPE(e) {
    const rpe = parseInt(e.currentTarget.dataset.rpe)
    this.setData({ rpeValue: rpe })
  },

  // 提交训练反馈
  async submitFeedback() {
    this.setData({ showRPESelector: false })

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'saveFeedback',
        data: {
          planId: app.globalData.userInfo.current_plan_id,
          exerciseIndex: this.data.currentExerciseIndex,
          rpe: this.data.rpeValue,
          completedAt: new Date(),
          dayType: this.data.currentDayType,
          workoutDate: this.data.currentWorkoutDate || formatDateKey(new Date())
        }
      })

      if (result.success) {
        wx.showToast({ title: '训练完成！', icon: 'success' })
        
        // 更新连续打卡天数
        const newStreak = typeof result.newStreak === 'number'
          ? result.newStreak
          : (app.globalData.userInfo.streak_days || 0)
        app.globalData.userInfo.streak_days = newStreak
        
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 1500)
      } else {
        wx.showToast({ title: result.message || '提交失败', icon: 'none' })
      }
    } catch (err) {
      console.error('提交反馈失败：', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    }
  },

  // 跳过当前动作
  skipExercise() {
    this.nextExercise()
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

    const query = exercise.id
      ? `id=${exercise.id}`
      : `name=${encodeURIComponent(exercise.name)}`

    wx.navigateTo({
      url: `/pages/exercise-detail/exercise-detail?${query}`
    })
  },

  // 返回
  goBack() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onUnload() {
    // 清理定时器
    this.clearTimers()
  }
})
