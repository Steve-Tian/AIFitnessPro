const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const { formatDateKey } = require('../shared/date-utils')

function ok(data = {}, message = 'OK') {
  return { success: true, message, ...data }
}
function fail(message = 'Error') {
  return { success: false, message }
}

const MUSCLE_LABELS = {
  chest: '胸肌',
  triceps: '肱三头肌',
  front_delts: '前三角',
  shoulders: '三角肌',
  rear_delts: '后三角',
  back: '背部',
  rhomboids: '菱形肌',
  biceps: '肱二头肌',
  forearms: '前臂',
  quads: '股四头肌',
  hamstrings: '腘绳肌',
  glutes: '臀肌',
  calves: '小腿',
  core: '核心'
}

const DEFAULT_WARMUP_DURATION = '6-8 分钟'
const DEFAULT_COOLDOWN_DURATION = '5-8 分钟'

// 训练动作库（按肌群分类）
const EXERCISE_LIBRARY = {
  push: [
    { name: '卧推', alias: ['杠铃卧推'], equipment: ['full_gym', 'barbell_bench'], muscle: 'chest' },
    { name: '哑铃飞鸟', alias: ['飞鸟'], equipment: ['dumbbell_only'], muscle: 'chest' },
    { name: '肩推', alias: ['杠铃肩推', '哑铃肩推'], equipment: ['full_gym', 'barbell_bench', 'dumbbell_only'], muscle: 'shoulders' },
    { name: '侧平举', alias: ['哑铃侧平举'], equipment: ['dumbbell_only'], muscle: 'shoulders' },
    { name: '俯卧撑', alias: ['宽距俯卧撑'], equipment: ['bodyweight'], muscle: 'chest' },
    { name: '钻石俯卧撑', alias: ['窄距俯卧撑'], equipment: ['bodyweight'], muscle: 'triceps' },
    { name: '派克俯卧撑', alias: ['Pike Push-up'], equipment: ['bodyweight'], muscle: 'shoulders' },
    { name: '臂屈伸', alias: ['双杠臂屈伸'], equipment: ['full_gym'], muscle: 'triceps' }
  ],
  pull: [
    { name: '引体向上', alias: ['宽距引体'], equipment: ['full_gym'], muscle: 'back' },
    { name: '杠铃划船', alias: ['划船'], equipment: ['full_gym', 'barbell_bench'], muscle: 'back' },
    { name: '哑铃划船', alias: ['单臂哑铃划船'], equipment: ['dumbbell_only'], muscle: 'back' },
    { name: '面拉', alias: ['绳索面拉'], equipment: ['full_gym', 'cable'], muscle: 'rear_delts' },
    { name: '杠铃弯举', alias: ['弯举'], equipment: ['barbell_bench'], muscle: 'biceps' },
    { name: '哑铃锤式弯举', alias: ['锤式弯举'], equipment: ['dumbbell_only'], muscle: 'biceps' },
    { name: '超人挺身', alias: ['Superman'], equipment: ['bodyweight'], muscle: 'back' },
    { name: '俯身Y-T-W', alias: ['YTW'], equipment: ['bodyweight'], muscle: 'rear_delts' },
    { name: '毛巾弯举', alias: ['自阻弯举'], equipment: ['bodyweight'], muscle: 'biceps' }
  ],
  legs: [
    { name: '深蹲', alias: ['杠铃深蹲'], equipment: ['full_gym', 'barbell_bench'], muscle: 'quads' },
    { name: '硬拉', alias: ['罗马尼亚硬拉'], equipment: ['full_gym', 'barbell_bench'], muscle: 'hamstrings' },
    { name: '保加利亚分腿蹲', alias: ['分腿蹲'], equipment: ['dumbbell_only'], muscle: 'quads' },
    { name: '臀桥', alias: ['杠铃臀桥'], equipment: ['full_gym', 'barbell_bench'], muscle: 'glutes' },
    { name: '弓步蹲', alias: ['哑铃弓步'], equipment: ['dumbbell_only'], muscle: 'quads' },
    { name: '小腿提踵', alias: ['提踵'], equipment: ['dumbbell_only'], muscle: 'calves' },
    { name: '徒手深蹲', alias: ['自重深蹲'], equipment: ['bodyweight'], muscle: 'quads' },
    { name: '反向弓步蹲', alias: ['后撤箭步蹲'], equipment: ['bodyweight'], muscle: 'glutes' },
    { name: '站姿提踵', alias: ['自重提踵'], equipment: ['bodyweight'], muscle: 'calves' }
  ]
}

const WARMUP_LIBRARY = {
  push: [
    {
      name: '弹力带肩部激活',
      duration: '90 秒',
      focus: ['shoulders', 'rear_delts'],
      instructions: [
        '双手握带与肩同宽，向外拉开并保持肩胛下沉',
        '控制回到起点，连续完成 12-15 次'
      ]
    },
    {
      name: '俯身撑肩胛俯卧撑',
      duration: '60 秒',
      focus: ['chest', 'front_delts', 'core'],
      instructions: [
        '俯卧撑位锁肘，肩胛骨做前伸和后缩',
        '动作幅度均匀，完成 10-12 次'
      ]
    },
    {
      name: '空杠或徒手推举热身',
      duration: '2 组',
      focus: ['shoulders', 'triceps'],
      instructions: [
        '用极轻重量或徒手完成动作轨迹演练',
        '每组 8-10 次，找回肩胛和肘部路径'
      ]
    }
  ],
  pull: [
    {
      name: '悬垂肩胛下沉',
      duration: '60 秒',
      focus: ['back', 'rear_delts'],
      instructions: [
        '轻握单杠或拉力器，把肩胛向下向后收紧',
        '每次停顿 1 秒，完成 8-10 次'
      ]
    },
    {
      name: '猫牛式 + 胸椎旋转',
      duration: '90 秒',
      focus: ['back', 'core'],
      instructions: [
        '四点跪姿做猫牛式，随后加入胸椎旋转',
        '每侧完成 6-8 次，打开上背活动度'
      ]
    },
    {
      name: '轻重量划船热身',
      duration: '2 组',
      focus: ['back', 'biceps'],
      instructions: [
        '选择正式组 40%-50% 的重量',
        '每组 10 次，感受肩胛后缩和背阔肌发力'
      ]
    }
  ],
  legs: [
    {
      name: '髋踝动态活动',
      duration: '90 秒',
      focus: ['glutes', 'hamstrings', 'calves'],
      instructions: [
        '完成腿后摆、踝关节前移和深蹲底位停留',
        '每个动作 8-10 次，逐步打开下肢活动度'
      ]
    },
    {
      name: '徒手深蹲 + 臀桥激活',
      duration: '2 轮',
      focus: ['quads', 'glutes', 'core'],
      instructions: [
        '徒手深蹲 10 次，接臀桥 12 次',
        '重心放稳，唤醒臀腿发力顺序'
      ]
    },
    {
      name: '渐进热身组',
      duration: '2 组',
      focus: ['quads', 'hamstrings'],
      instructions: [
        '用正式重量的 40%-60% 完成动作演练',
        '每组 6-8 次，确认膝髋轨迹稳定'
      ]
    }
  ]
}

const COOLDOWN_LIBRARY = {
  chest: {
    name: '门框胸肌拉伸',
    duration: '40 秒/侧',
    instructions: [
      '前臂扶住门框，身体缓慢前移',
      '感受胸前和肩前侧被拉开，保持呼吸平稳'
    ]
  },
  shoulders: {
    name: '肩后侧抱臂拉伸',
    duration: '35 秒/侧',
    instructions: [
      '一臂横过胸前，另一只手轻压固定',
      '保持肩膀放松，不要耸肩'
    ]
  },
  triceps: {
    name: '头顶肱三头肌拉伸',
    duration: '35 秒/侧',
    instructions: [
      '单臂屈肘置于头后，另一手轻扶肘尖',
      '拉伸时核心保持收紧，避免腰椎代偿'
    ]
  },
  back: {
    name: '婴儿式背阔肌拉伸',
    duration: '45 秒',
    instructions: [
      '臀部后坐，双手向前延展',
      '呼气时继续向前够远，放松背阔肌'
    ]
  },
  rear_delts: {
    name: '穿针式胸椎放松',
    duration: '35 秒/侧',
    instructions: [
      '四点跪姿，一侧手臂穿过身体下方',
      '让肩后束和上背缓慢放松'
    ]
  },
  biceps: {
    name: '手掌后撑肱二头肌拉伸',
    duration: '30 秒/侧',
    instructions: [
      '手掌向后扶墙或撑凳，轻轻转开身体',
      '感受上臂前侧被拉长'
    ]
  },
  quads: {
    name: '站姿股四头肌拉伸',
    duration: '35 秒/侧',
    instructions: [
      '脚跟拉向臀部，膝盖保持并拢',
      '骨盆微收，避免腰部前顶'
    ]
  },
  hamstrings: {
    name: '坐姿腿后侧拉伸',
    duration: '40 秒/侧',
    instructions: [
      '单腿伸直，躯干向脚尖方向前倾',
      '背部保持平直，感受大腿后侧延展'
    ]
  },
  glutes: {
    name: '仰卧梨状肌拉伸',
    duration: '40 秒/侧',
    instructions: [
      '仰卧交叉单腿，双手抱住支撑腿',
      '把膝盖拉近胸前，放松臀部深层'
    ]
  },
  calves: {
    name: '台阶小腿拉伸',
    duration: '35 秒/侧',
    instructions: [
      '前脚掌踩台阶，脚跟缓慢下沉',
      '保持膝盖微屈，感受小腿后侧拉伸'
    ]
  },
  core: {
    name: '眼镜蛇式腹部放松',
    duration: '30 秒',
    instructions: [
      '俯卧撑起胸口，骨盆轻贴地面',
      '呼气放松腹部，避免耸肩'
    ]
  }
}

function normalizeExerciseKey(value) {
  return String(value || '').trim().toLowerCase()
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function buildAdjustmentLookup(adjustments) {
  const lookup = {}

  if (!adjustments || typeof adjustments !== 'object') {
    return lookup
  }

  Object.keys(adjustments).forEach((key) => {
    const entry = adjustments[key]
    if (!entry || typeof entry !== 'object') return

    const keys = [key, entry.exerciseName]
      .concat(Array.isArray(entry.aliases) ? entry.aliases : [])
      .map((item) => normalizeExerciseKey(item))
      .filter(Boolean)

    keys.forEach((normalizedKey) => {
      lookup[normalizedKey] = entry
    })
  })

  return lookup
}

function buildAdaptiveGuidance(exercise, adjustment) {
  const baseSets = exercise.sets
  const baseReps = exercise.reps
  const baseRest = exercise.rest
  const isBodyweight = Array.isArray(exercise.equipment) && exercise.equipment.includes('bodyweight')

  if (!adjustment) {
    return {
      ...exercise,
      loadAdjustment: 0,
      adaptiveNote: '',
      adjustmentSource: '',
      difficultyTrend: 'stable'
    }
  }

  const setDelta = Number(adjustment.setDelta) || 0
  const repDelta = Number(adjustment.repDelta) || 0
  const restDelta = Number(adjustment.restDelta) || 0
  const loadAdjustment = Number(adjustment.loadAdjustment) || 0
  const nextSets = clampNumber(baseSets + setDelta, 2, 6)
  const nextReps = clampNumber(baseReps + repDelta, 6, 15)
  const nextRest = clampNumber(baseRest + restDelta, 45, 180)

  let adaptiveNote = adjustment.recommendation || ''
  if (!adaptiveNote) {
    if (loadAdjustment < 0) {
      adaptiveNote = isBodyweight
        ? '上次反馈偏难，已降低组数/次数并延长休息。'
        : '上次反馈偏难，建议本次重量先下调约 5%，并降低训练量。'
    } else if (loadAdjustment > 0) {
      adaptiveNote = isBodyweight
        ? '上次反馈偏轻松，已增加训练量。'
        : '上次反馈偏轻松，建议本次重量提高约 5%，并小幅增加训练量。'
    }
  }

  return {
    ...exercise,
    sets: nextSets,
    reps: nextReps,
    rest: nextRest,
    loadAdjustment,
    adaptiveNote,
    adjustmentSource: adjustment.updatedAt || '',
    difficultyTrend: adjustment.trend || 'stable'
  }
}

function buildWarmup(dayType, workout) {
  const focusedMuscles = Array.from(new Set((Array.isArray(workout) ? workout : []).map((item) => item.muscle).filter(Boolean)))
  const template = Array.isArray(WARMUP_LIBRARY[dayType]) ? WARMUP_LIBRARY[dayType] : []

  return template.map((item) => ({
    ...item,
    type: 'warmup',
    focusText: item.focus.map((muscle) => MUSCLE_LABELS[muscle] || muscle).join(' / '),
    duration: item.duration || DEFAULT_WARMUP_DURATION
  }))
}

function buildCooldown(workout) {
  const focusedMuscles = Array.from(new Set((Array.isArray(workout) ? workout : []).map((item) => item.muscle).filter(Boolean)))
  const cooldown = focusedMuscles
    .map((muscle) => COOLDOWN_LIBRARY[muscle])
    .filter(Boolean)
    .slice(0, 3)
    .map((item) => ({
      ...item,
      type: 'cooldown',
      duration: item.duration || DEFAULT_COOLDOWN_DURATION
    }))

  if (cooldown.length > 0) {
    return cooldown
  }

  return [{
    name: '全身放松呼吸',
    duration: DEFAULT_COOLDOWN_DURATION,
    type: 'cooldown',
    instructions: [
      '平稳步行并做 4-6 次深呼吸',
      '结束后再做当天最紧张肌群的静态拉伸'
    ]
  }]
}

function buildAdaptiveNotes(workout) {
  return (Array.isArray(workout) ? workout : [])
    .filter((item) => item.adaptiveNote)
    .map((item) => ({
      exerciseName: item.name,
      note: item.adaptiveNote
    }))
}

// 周期化阶段配置（需求 DESIGN.md §6.2 四周循环）
const PHASE_CONFIG = {
  1: { name: '适应期', label: '适应', rpeTarget: '6-7', volumeMultiplier: 1.0, intensityMultiplier: 0.85, extraNote: '本周重点是适应动作和节奏，不要追求极限' },
  2: { name: '渐进期', label: '渐进', rpeTarget: '7-8', volumeMultiplier: 1.1, intensityMultiplier: 0.95, extraNote: '本周可以适当加重，挑战更高训练量' },
  3: { name: '冲击期', label: '冲击', rpeTarget: '8-9', volumeMultiplier: 1.15, intensityMultiplier: 1.05, extraNote: '本周冲击新高，全力以赴但注意动作质量' },
  4: { name: '减载周', label: '减载', rpeTarget: '5-6', volumeMultiplier: 0.6, intensityMultiplier: 0.75, extraNote: '减载恢复周，容量和强度都降低，让身体充分恢复' }
}

// 根据用户设备筛选可用动作
function filterExercisesByEquipment(exercises, userEquipment) {
  const equipment = Array.isArray(userEquipment) ? userEquipment : []
  return exercises.filter(ex => ex.equipment.some(eq => equipment.includes(eq)))
}

function buildWeeklySchedule(daysPerWeek) {
  const normalizedDays = Math.max(3, Math.min(Number(daysPerWeek) || 4, 5))
  const schedules = {
    3: ['push', 'rest', 'pull', 'rest', 'legs', 'rest', 'rest'],
    4: ['push', 'rest', 'pull', 'rest', 'legs', 'push', 'rest'],
    5: ['push', 'pull', 'legs', 'rest', 'push', 'pull', 'rest']
  }

  return schedules[normalizedDays]
}

// 生成单日训练计划（支持周期化阶段）
function generateDayWorkout(dayType, userEquipment, dayIndex, adjustmentLookup, phase) {
  const equipment = Array.isArray(userEquipment) ? userEquipment : []
  const availableExercises = filterExercisesByEquipment(EXERCISE_LIBRARY[dayType], userEquipment)
  if (availableExercises.length < 1) {
    throw new Error(`设备 ${equipment.join(',') || '未配置'} 无法满足${dayType}日训练需求`)
  }

  // 周期化参数
  const phaseConfig = PHASE_CONFIG[phase] || PHASE_CONFIG[1]
  const volMul = phaseConfig.volumeMultiplier
  const intMul = phaseConfig.intensityMultiplier

  // 随机选取动作
  const selectedExercises = []
  const shuffled = [...availableExercises].sort(() => Math.random() - 0.5)
  
  // 减载周只选2个动作，其他周2-3个
  const maxExercises = phase === 4 ? 2 : Math.min(Math.random() > 0.5 ? 2 : 3, shuffled.length)
  
  for (const ex of shuffled) {
    if (selectedExercises.length >= maxExercises) break
    if (!selectedExercises.find(se => se.muscle === ex.muscle)) {
      // 基础组数/次数，应用周期化调整
      const baseSets = 3 + dayIndex % 2
      const baseReps = 8 + (dayIndex % 3) * 2
      const baseRest = 90 + (dayIndex % 2) * 30

      selectedExercises.push({
        name: ex.name,
        alias: ex.alias[0],
        muscle: ex.muscle,
        equipment: ex.equipment,
        sets: Math.max(2, Math.round(baseSets * volMul)),
        reps: Math.max(6, Math.round(baseReps * intMul)),
        rest: Math.round(baseRest / intMul),
        phaseLabel: phaseConfig.label,
        rpeTarget: phaseConfig.rpeTarget
      })
    }
  }

  // 如果因为肌肉群限制导致没有选中任何动作，至少选择一个动作
  if (selectedExercises.length === 0 && shuffled.length > 0) {
    const firstExercise = shuffled[0]
    const baseSets = 3 + dayIndex % 2
    const baseReps = 8 + (dayIndex % 3) * 2
    const baseRest = 90 + (dayIndex % 2) * 30

    selectedExercises.push({
      name: firstExercise.name,
      alias: firstExercise.alias[0],
      muscle: firstExercise.muscle,
      equipment: firstExercise.equipment,
      sets: Math.max(2, Math.round(baseSets * volMul)),
      reps: Math.max(6, Math.round(baseReps * intMul)),
      rest: Math.round(baseRest / intMul),
      phaseLabel: phaseConfig.label,
      rpeTarget: phaseConfig.rpeTarget
    })
  }

  return selectedExercises.map((exercise) => {
    const adjustment = adjustmentLookup[normalizeExerciseKey(exercise.name)]
      || adjustmentLookup[normalizeExerciseKey(exercise.alias)]
      || null
    return buildAdaptiveGuidance(exercise, adjustment)
  })
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  if (!OPENID) {
    return fail('未获取到用户身份，请重新登录')
  }

  try {
    const userDoc = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (userDoc.data.length === 0) {
      return fail('用户档案不存在，请先完成问卷')
    }

    const user = userDoc.data[0]
    const profile = user.profile
    if (!profile || !Array.isArray(profile.equipment) || profile.equipment.length === 0) {
      return fail('用户器械信息不完整，请重新完成问卷')
    }
    const adjustmentLookup = buildAdjustmentLookup(user.exercise_adjustments)

    // 4周周期化计划（需求 DESIGN.md §6.2）
    const weeklyPlan = []
    const schedule = buildWeeklySchedule(profile.days_per_week)
    const startDate = new Date()
    const currentCycleWeek = ((user.cycle_week || 0) % 4) + 1 // 当前周期周次 1-4

    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const phase = (currentCycleWeek - 1 + weekOffset) % 4 + 1
      const phaseConfig = PHASE_CONFIG[phase]

      for (let i = 0; i < 7; i++) {
        const dayType = schedule[i]
        const dayOffset = weekOffset * 7 + i
        const currentDate = new Date(startDate)
        currentDate.setDate(currentDate.getDate() + dayOffset)
        
        if (dayType === 'rest') {
          weeklyPlan.push({
            date: formatDateKey(currentDate),
            type: 'rest',
            title: '休息日',
            note: '充分恢复，为下周训练储备能量',
            phase: phaseConfig.label
          })
        } else {
          const workout = generateDayWorkout(dayType, profile.equipment, dayOffset, adjustmentLookup, phase)
          weeklyPlan.push({
            date: formatDateKey(currentDate),
            type: dayType,
            title: `${dayType === 'push' ? '推' : dayType === 'pull' ? '拉' : '腿'}日`,
            phase: phaseConfig.label,
            phaseNote: phaseConfig.extraNote,
            workout,
            warmup: buildWarmup(dayType, workout),
            cooldown: buildCooldown(workout),
            adaptive_notes: buildAdaptiveNotes(workout),
            focus_muscles: Array.from(new Set(workout.map(w => w.muscle).filter(Boolean)))
          })
        }
      }
    }

    // 存储到数据库
    const planId = `plan_${Date.now()}_${OPENID.substring(0, 8)}`
    await db.collection('plans').add({
      data: {
        _id: planId,
        userId: OPENID,
        startDate: new Date(),
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        daysPerWeek: Number(profile.days_per_week) || 4,
        schedule,
        cycleWeek: currentCycleWeek,
        totalWeeks: 4,
        weeklyPlan,
        createdAt: db.serverDate()
      }
    })

    // 更新用户当前计划和周期
    await db.collection('users').where({ _openid: OPENID }).update({
      data: {
        current_plan_id: planId,
        cycle_week: currentCycleWeek,
        updated_at: db.serverDate()
      }
    })

    // 返回第一周数据（兼容前端只显示当前周）
    const firstWeekPlan = weeklyPlan.slice(0, 7)
    return ok({ planId, weeklyPlan: firstWeekPlan, fullWeeklyPlan: weeklyPlan, currentPhase: currentCycleWeek, phaseLabel: PHASE_CONFIG[currentCycleWeek].label }, '4周周期化训练计划生成成功！')
  } catch (err) {
    console.error('生成计划失败：', err)
    return fail(err.message || '生成计划失败，请稍后重试')
  }
}
