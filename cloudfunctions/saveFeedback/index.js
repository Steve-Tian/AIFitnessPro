const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

function normalizeExerciseKey(value) {
  return String(value || '').trim().toLowerCase()
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function formatDateKey(input) {
  if (!input) return ''
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function diffInDays(previousDate, nextDate) {
  const previous = previousDate instanceof Date ? previousDate : new Date(previousDate)
  const next = nextDate instanceof Date ? nextDate : new Date(nextDate)
  if (Number.isNaN(previous.getTime()) || Number.isNaN(next.getTime())) {
    return null
  }

  const previousStart = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate())
  const nextStart = new Date(next.getFullYear(), next.getMonth(), next.getDate())
  return Math.round((nextStart.getTime() - previousStart.getTime()) / (24 * 60 * 60 * 1000))
}

function buildExerciseAdjustment(feedback) {
  const currentSets = Number(feedback.sets) || 3
  const currentReps = Number(feedback.reps) || 8
  const currentRest = Number(feedback.rest) || 90
  const equipment = Array.isArray(feedback.equipment) ? feedback.equipment : []
  const isBodyweight = equipment.includes('bodyweight')
  const rpe = Number(feedback.rpe) || 8

  let loadAdjustment = 0
  let setDelta = 0
  let repDelta = 0
  let restDelta = 0
  let recommendation = '本次难度合适，下次保持当前训练量。'
  let trend = 'stable'

  if (rpe >= 9) {
    loadAdjustment = -0.05
    setDelta = -1
    repDelta = -2
    restDelta = 15
    trend = 'hard'
    recommendation = isBodyweight
      ? '本动作反馈偏难，下次已减少 1 组、减少 2 次并延长休息。'
      : '本动作反馈偏难，下次建议重量降低约 5%，并减少 1 组、减少 2 次。'
  } else if (rpe <= 7) {
    loadAdjustment = 0.05
    setDelta = isBodyweight ? 1 : 0
    repDelta = isBodyweight ? 2 : 1
    restDelta = -15
    trend = 'easy'
    recommendation = isBodyweight
      ? '本动作反馈偏轻松，下次已增加组数/次数并缩短休息。'
      : '本动作反馈偏轻松，下次建议重量提高约 5%，并小幅增加训练量。'
  }

  return {
    exerciseKey: normalizeExerciseKey(feedback.exerciseName || feedback.exerciseAlias),
    exerciseName: feedback.exerciseName || feedback.exerciseAlias || '',
    aliases: [feedback.exerciseAlias].filter(Boolean),
    lastRpe: rpe,
    averageRpe: rpe,
    feedbackCount: 1,
    loadAdjustment,
    setDelta,
    repDelta,
    restDelta,
    nextSets: clampNumber(currentSets + setDelta, 2, 6),
    nextReps: clampNumber(currentReps + repDelta, 6, 15),
    nextRest: clampNumber(currentRest + restDelta, 45, 180),
    recommendation,
    trend
  }
}

function mergeExerciseAdjustments(previousEntry, nextEntry, updatedAt) {
  if (!previousEntry) {
    return {
      ...nextEntry,
      updatedAt
    }
  }

  const previousCount = Number(previousEntry.feedbackCount) || 0
  const nextCount = previousCount + 1
  const previousAverage = Number(previousEntry.averageRpe) || Number(previousEntry.lastRpe) || nextEntry.lastRpe
  const averageRpe = ((previousAverage * previousCount) + nextEntry.lastRpe) / nextCount

  return {
    exerciseKey: nextEntry.exerciseKey,
    exerciseName: nextEntry.exerciseName,
    aliases: Array.from(new Set([]
      .concat(Array.isArray(previousEntry.aliases) ? previousEntry.aliases : [])
      .concat(Array.isArray(nextEntry.aliases) ? nextEntry.aliases : [])
      .filter(Boolean))),
    lastRpe: nextEntry.lastRpe,
    averageRpe: Number(averageRpe.toFixed(2)),
    feedbackCount: nextCount,
    loadAdjustment: nextEntry.loadAdjustment,
    setDelta: nextEntry.setDelta,
    repDelta: nextEntry.repDelta,
    restDelta: nextEntry.restDelta,
    nextSets: nextEntry.nextSets,
    nextReps: nextEntry.nextReps,
    nextRest: nextEntry.nextRest,
    recommendation: nextEntry.recommendation,
    trend: nextEntry.trend,
    updatedAt
  }
}

function applyExerciseAdjustmentToPlan(plan, workoutDate, adjustmentsMap) {
  if (!plan || !Array.isArray(plan.weeklyPlan) || !adjustmentsMap || typeof adjustmentsMap !== 'object') {
    return plan
  }

  const currentWorkoutDate = formatDateKey(workoutDate)
  const updatedWeeklyPlan = plan.weeklyPlan.map((day) => {
    const dayDate = formatDateKey(day && day.date)
    if (!Array.isArray(day && day.workout) || !dayDate || !currentWorkoutDate || dayDate <= currentWorkoutDate) {
      return day
    }

    const updatedWorkout = day.workout.map((exercise) => {
      const keys = [exercise && exercise.name, exercise && exercise.alias]
        .map((value) => normalizeExerciseKey(value))
        .filter(Boolean)

      const adjustment = keys.map((key) => adjustmentsMap[key]).find(Boolean)
      if (!adjustment) {
        return exercise
      }

      return {
        ...exercise,
        sets: adjustment.nextSets,
        reps: adjustment.nextReps,
        rest: adjustment.nextRest,
        loadAdjustment: adjustment.loadAdjustment,
        adaptiveNote: adjustment.recommendation,
        difficultyTrend: adjustment.trend
      }
    })

    return {
      ...day,
      workout: updatedWorkout,
      adaptive_notes: updatedWorkout
        .filter((exercise) => exercise.adaptiveNote)
        .map((exercise) => ({
          exerciseName: exercise.name,
          note: exercise.adaptiveNote
        }))
    }
  })

  return {
    ...plan,
    weeklyPlan: updatedWeeklyPlan
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    const { planId, exerciseIndex, rpe, completedAt, dayType, workoutDate, exerciseFeedback } = event

    // 验证参数
    if (!planId || typeof exerciseIndex !== 'number' || exerciseIndex < 0 || !rpe) {
      return { success: false, message: '参数不完整' }
    }

    if (rpe < 6 || rpe > 10) {
      return { success: false, message: 'RPE评分应在6-10之间' }
    }

    // 获取当前计划和用户信息
    const planDoc = await db.collection('plans').doc(planId).get()
    const userDoc = await db.collection('users').where({ _openid: OPENID }).get()

    if (!planDoc.data || userDoc.data.length === 0) {
      return { success: false, message: '计划或用户不存在' }
    }

    const plan = planDoc.data
    const user = userDoc.data[0]
    if (plan.userId !== OPENID) {
      return { success: false, message: '无权操作该训练计划' }
    }

    // 计算下次训练强度调整
    let intensityAdjustment = 0
    if (rpe >= 9) {
      // RPE 9-10：太难了，下次降低重量
      intensityAdjustment = -0.05 // 降低5%
    } else if (rpe <= 7) {
      // RPE 6-7：太轻松，下次增加重量
      intensityAdjustment = 0.05 // 增加5%
    }
    // RPE 8：刚好，保持不变

    const completedAtDate = completedAt ? new Date(completedAt) : new Date()
    const normalizedCompletedAt = Number.isNaN(completedAtDate.getTime()) ? new Date() : completedAtDate
    const normalizedWorkoutDate = workoutDate || formatDateKey(normalizedCompletedAt)
    const normalizedExerciseFeedback = Array.isArray(exerciseFeedback)
      ? exerciseFeedback
        .filter((item) => item && item.exerciseName && item.rpe)
        .map((item) => ({
          exerciseName: item.exerciseName,
          exerciseAlias: item.exerciseAlias || '',
          rpe: Number(item.rpe),
          sets: Number(item.sets) || 3,
          reps: Number(item.reps) || 8,
          rest: Number(item.rest) || 90,
          equipment: Array.isArray(item.equipment) ? item.equipment : [],
          completedAt: normalizedCompletedAt
        }))
      : []

    // 记录本次训练反馈
    const feedbackRecord = {
      _id: `feedback_${Date.now()}_${OPENID}`,
      planId,
      userId: OPENID,
      exerciseIndex,
      rpe,
      completedAt: normalizedCompletedAt,
      dayType: dayType || '',
      workoutDate: normalizedWorkoutDate,
      intensityAdjustment,
      exerciseFeedback: normalizedExerciseFeedback
    }

    // 保存到反馈集合
    await db.collection('feedback').add({
      data: feedbackRecord
    })

    // 更新用户连续打卡天数
    const today = formatDateKey(normalizedCompletedAt)
    const lastTrainingDate = formatDateKey(user.last_training_date)
    
    let newStreak = user.streak_days || 0
    if (!lastTrainingDate) {
      newStreak = 1
    } else if (lastTrainingDate === today) {
      newStreak = user.streak_days || 1
    } else {
      const dayGap = diffInDays(user.last_training_date, normalizedCompletedAt)
      if (dayGap === 1) {
        newStreak += 1
      } else {
        newStreak = 1
      }
    }

    await db.collection('users').where({ _openid: OPENID }).update({
      data: {
        streak_days: newStreak,
        last_training_date: normalizedCompletedAt,
        exercise_adjustments: (() => {
          const currentAdjustments = user.exercise_adjustments && typeof user.exercise_adjustments === 'object'
            ? { ...user.exercise_adjustments }
            : {}

          normalizedExerciseFeedback.forEach((item) => {
            const nextAdjustment = buildExerciseAdjustment(item)
            const key = nextAdjustment.exerciseKey
            currentAdjustments[key] = mergeExerciseAdjustments(currentAdjustments[key], nextAdjustment, normalizedCompletedAt)
          })

          return currentAdjustments
        })(),
        updated_at: db.serverDate()
      }
    })

    // 更新计划中的完成状态
    if (!plan.session_feedback) {
      plan.session_feedback = []
    }
    
    plan.session_feedback.push(feedbackRecord)
    const currentAdjustments = user.exercise_adjustments && typeof user.exercise_adjustments === 'object'
      ? { ...user.exercise_adjustments }
      : {}
    normalizedExerciseFeedback.forEach((item) => {
      const nextAdjustment = buildExerciseAdjustment(item)
      currentAdjustments[nextAdjustment.exerciseKey] = mergeExerciseAdjustments(
        currentAdjustments[nextAdjustment.exerciseKey],
        nextAdjustment,
        normalizedCompletedAt
      )
    })
    const updatedPlan = applyExerciseAdjustmentToPlan(plan, normalizedWorkoutDate, currentAdjustments)

    await db.collection('plans').doc(planId).update({
      data: {
        session_feedback: plan.session_feedback,
        weeklyPlan: updatedPlan.weeklyPlan,
        updated_at: db.serverDate()
      }
    })

    return {
      success: true,
      message: '反馈提交成功！',
      adjustment: intensityAdjustment,
      newStreak,
      exerciseAdjustments: normalizedExerciseFeedback.map((item) => buildExerciseAdjustment(item)),
      updatedWeeklyPlan: updatedPlan.weeklyPlan
    }
  } catch (err) {
    console.error('保存反馈失败：', err)
    return {
      success: false,
      message: err.message || '提交失败，请稍后重试'
    }
  }
}
