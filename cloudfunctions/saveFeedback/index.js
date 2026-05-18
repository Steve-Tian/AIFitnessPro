const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const { formatDateKey, diffInDays } = require('../shared/date-utils')

/**
 * 统一响应格式
 */
function ok(data = {}, message = 'OK') {
  return { success: true, message, ...data }
}
function fail(message = 'Error', extra = {}) {
  return { success: false, message, ...extra }
}

function normalizeExerciseKey(value) {
  return String(value || '').trim().toLowerCase()
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * 重量按 2.5kg 档位取整（需求 DESIGN.md §9.1）
 */
function roundToPlate(kg) {
  if (!Number.isFinite(kg) || kg <= 0) return 0
  return Math.round(kg / 2.5) * 2.5
}

/**
 * 组序疲劳衰减因子（需求 DESIGN.md §9.1）
 * 后半程组次（如 4 组中的第 3-4 组）对"太重"反馈权重降低 50%
 * @param {number} setIndex 当前组号（1-based）
 * @param {number} totalSets 总组数
 * @returns {number} 权重系数 [0.5, 1.0]
 */
function fatigueWeightForSet(setIndex, totalSets) {
  if (!totalSets || totalSets < 2) return 1
  const s = Number(setIndex) || 1
  // 前半程全权重；后半程线性降到 0.5
  if (s <= totalSets / 2) return 1
  const ratio = (s - totalSets / 2) / (totalSets - totalSets / 2) // 0..1
  return Math.max(0.5, 1 - 0.5 * ratio)
}

/**
 * 构建单动作下次推荐调整
 * feedback 可带 setIndex（反映是在哪一组触发的），用于疲劳衰减
 */
function buildExerciseAdjustment(feedback) {
  const currentSets = Number(feedback.sets) || 3
  const currentReps = Number(feedback.reps) || 8
  const currentRest = Number(feedback.rest) || 90
  const currentWeight = Number(feedback.currentWeight) || 0
  const setIndex = Number(feedback.setIndex) || Math.ceil(currentSets / 2)
  const equipment = Array.isArray(feedback.equipment) ? feedback.equipment : []
  const isBodyweight = equipment.includes('bodyweight')
  const rpe = Number(feedback.rpe) || 8

  let loadAdjustment = 0
  let setDelta = 0
  let repDelta = 0
  let restDelta = 0
  let recommendation = '本次难度合适，下次保持当前训练量。'
  let trend = 'stable'

  // 组序疲劳衰减：后半程的"太重"反馈权重下降，避免正常疲劳被当成超负荷
  const fatigueWeight = fatigueWeightForSet(setIndex, currentSets)

  if (rpe >= 9) {
    // 应用疲劳衰减：后半程反馈"太重"时，下调幅度打折
    loadAdjustment = -0.1 * fatigueWeight
    setDelta = fatigueWeight >= 0.8 ? -1 : 0
    repDelta = Math.round(-2 * fatigueWeight)
    restDelta = Math.round(15 * fatigueWeight)
    trend = fatigueWeight >= 0.8 ? 'hard' : 'hard_late'
    recommendation = isBodyweight
      ? (fatigueWeight >= 0.8
        ? '本动作明显偏难，下次减少组数/次数并延长休息。'
        : '后半程略吃力（属正常疲劳），下次微调即可。')
      : (fatigueWeight >= 0.8
        ? '本动作反馈偏难，下次建议重量降低约 10%，并减少 1 组。'
        : `后半程略吃力（属正常疲劳），下次重量微降约 ${Math.round(Math.abs(loadAdjustment) * 100)}%。`)
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

  // 计算下次推荐重量（2.5kg 档位取整）
  const nextWeight = currentWeight > 0
    ? roundToPlate(currentWeight * (1 + loadAdjustment))
    : 0

  return {
    exerciseKey: normalizeExerciseKey(feedback.exerciseName || feedback.exerciseAlias),
    exerciseName: feedback.exerciseName || feedback.exerciseAlias || '',
    aliases: [feedback.exerciseAlias].filter(Boolean),
    lastRpe: rpe,
    averageRpe: rpe,
    feedbackCount: 1,
    fatigueWeight,
    loadAdjustment,
    setDelta,
    repDelta,
    restDelta,
    nextSets: clampNumber(currentSets + setDelta, 2, 6),
    nextReps: clampNumber(currentReps + repDelta, 6, 15),
    nextRest: clampNumber(currentRest + restDelta, 45, 180),
    nextWeight,
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
    fatigueWeight: nextEntry.fatigueWeight,
    loadAdjustment: nextEntry.loadAdjustment,
    setDelta: nextEntry.setDelta,
    repDelta: nextEntry.repDelta,
    restDelta: nextEntry.restDelta,
    nextSets: nextEntry.nextSets,
    nextReps: nextEntry.nextReps,
    nextRest: nextEntry.nextRest,
    nextWeight: nextEntry.nextWeight,
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
        recommendedWeight: adjustment.nextWeight || exercise.recommendedWeight,
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

  if (!OPENID) {
    return fail('登录态无效')
  }

  try {
    const { planId, exerciseIndex, rpe, completedAt, dayType, workoutDate, exerciseFeedback } = event

    // 参数校验
    if (typeof planId !== 'string' || !planId) {
      return fail('参数不完整：planId')
    }
    if (typeof exerciseIndex !== 'number' || exerciseIndex < 0) {
      return fail('参数不完整：exerciseIndex')
    }
    if (typeof rpe !== 'number' || rpe < 6 || rpe > 10) {
      return fail('RPE评分应在6-10之间')
    }

    // 获取当前计划和用户信息
    const planDoc = await db.collection('plans').doc(planId).get().catch((err) => {
      console.error('获取计划失败：', err)
      return null
    })
    if (!planDoc || !planDoc.data) {
      return fail('计划不存在')
    }

    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (!userRes.data || userRes.data.length === 0) {
      return fail('用户不存在')
    }

    const plan = planDoc.data
    const user = userRes.data[0]
    if (plan.userId !== OPENID) {
      return fail('无权操作该训练计划')
    }

    // 本次整体强度调整（兼容旧字段）
    let intensityAdjustment = 0
    if (rpe >= 9) intensityAdjustment = -0.05
    else if (rpe <= 7) intensityAdjustment = 0.05

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
          setIndex: Number(item.setIndex) || Math.ceil((Number(item.sets) || 3) / 2),
          currentWeight: Number(item.currentWeight) || 0,
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

    await db.collection('feedback').add({ data: feedbackRecord })

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

    // 合并每动作反馈的跨次调整
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

    await db.collection('users').where({ _openid: OPENID }).update({
      data: {
        streak_days: newStreak,
        last_training_date: normalizedCompletedAt,
        exercise_adjustments: currentAdjustments,
        updated_at: db.serverDate()
      }
    })

    // 更新计划中的完成状态
    if (!plan.session_feedback) {
      plan.session_feedback = []
    }
    plan.session_feedback.push(feedbackRecord)
    const updatedPlan = applyExerciseAdjustmentToPlan(plan, normalizedWorkoutDate, currentAdjustments)

    await db.collection('plans').doc(planId).update({
      data: {
        session_feedback: plan.session_feedback,
        weeklyPlan: updatedPlan.weeklyPlan,
        updated_at: db.serverDate()
      }
    })

    return ok({
      adjustment: intensityAdjustment,
      newStreak,
      exerciseAdjustments: normalizedExerciseFeedback.map((item) => buildExerciseAdjustment(item)),
      updatedWeeklyPlan: updatedPlan.weeklyPlan
    }, '反馈提交成功！')
  } catch (err) {
    console.error('保存反馈失败：', err)
    return fail(err.message || '提交失败，请稍后重试')
  }
}

// 导出内部工具，便于 Jest 单元测试
exports.__internals = {
  buildExerciseAdjustment,
  mergeExerciseAdjustments,
  fatigueWeightForSet,
  roundToPlate
}
