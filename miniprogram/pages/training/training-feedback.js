/**
 * training-feedback.js — RPE/反馈相关工具
 * 包含：RPE 选项构建、训练总结构建
 */

function buildRpeOptions(selectedValue) {
  return [6, 7, 8, 9, 10].map((value) => ({
    value,
    active: value === selectedValue,
    className: value === selectedValue ? 'rpe-btn active' : 'rpe-btn'
  }))
}

/**
 * 根据反馈 draft 和计划构建训练总结（用于总结页）
 */
function buildTrainingSummary(pageData, sessionStartedAt, cloudResult) {
  const plan = Array.isArray(pageData.plan) ? pageData.plan : []
  const drafts = Array.isArray(pageData.exerciseFeedbackDrafts) ? pageData.exerciseFeedbackDrafts : []
  const app = getApp()
  const user = app.globalData.userInfo || {}
  const weight = Number(user.profile && user.profile.weight) || 70
  const startedAt = sessionStartedAt || Date.now()
  const durationMs = Math.max(0, Date.now() - startedAt)
  const durationMin = Math.round(durationMs / 60000) || 1

  let totalSets = 0
  let totalReps = 0
  let totalVolume = 0
  const perExercise = []
  plan.forEach((exercise, idx) => {
    const draft = drafts.find((d) => d.exerciseIndex === idx)
    const sets = Number((draft && draft.sets) || exercise.sets || 3)
    const reps = Number((draft && draft.reps) || exercise.reps || 8)
    const estimatedWeight = Number(exercise.recommendedWeight || exercise.weight || 0)
    totalSets += sets
    totalReps += sets * reps
    totalVolume += sets * reps * estimatedWeight
    perExercise.push({
      name: exercise.name,
      sets, reps,
      rpe: draft ? draft.rpe : null
    })
  })

  // MET 取 5.5（力量训练）→ kcal = MET × 体重kg × 时长h × 1.05
  const kcal = Math.round(5.5 * weight * (durationMin / 60) * 1.05)

  return {
    workoutDate: pageData.currentWorkoutDate,
    dayType: pageData.currentDayType,
    durationMin,
    totalExercises: plan.length,
    completedExercises: perExercise.length,
    totalSets,
    totalReps,
    totalVolume: Math.round(totalVolume),
    estimatedKcal: kcal,
    perExercise,
    newStreak: cloudResult.newStreak || (user.streak_days || 0),
    unlockedAchievements: Array.isArray(cloudResult.unlockedAchievements) ? cloudResult.unlockedAchievements : []
  }
}

module.exports = {
  buildRpeOptions,
  buildTrainingSummary
}
