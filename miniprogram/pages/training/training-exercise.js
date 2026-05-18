/**
 * training-exercise.js — 动作详情解析与增强
 * 包含：动作详情索引构建、解析、热身/放松/自适应备注构建
 */

const {
  DEFAULT_EXERCISE_IMAGE,
  DEFAULT_EXERCISE_INSTRUCTIONS,
  MUSCLE_LABELS,
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  CATEGORY_LABELS,
  FALLBACK_EXERCISE_DETAILS
} = require('./training-constants')
const {
  formatDateKey,
  normalizeList,
  translateLabels,
  buildInstructionSteps,
  buildDetailedStepCards
} = require('../../utils/shared')

let cachedExerciseLibrary = null

function getExerciseLibrary() {
  if (cachedExerciseLibrary) {
    return cachedExerciseLibrary
  }

  try {
    cachedExerciseLibrary = require('../../utils/exercise-library')
  } catch (error) {
    console.error('动作内容库加载失败：', error)
    cachedExerciseLibrary = null
  }

  return cachedExerciseLibrary
}

function sanitizeGifUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.includes('example.com')) return ''
  return url
}

function buildExerciseDetailIndex() {
  const index = {}
  const lib = getExerciseLibrary()
  if (lib) {
    const lookup = typeof lib.createExerciseLookup === 'function'
      ? lib.createExerciseLookup(lib.getExerciseLibrary ? lib.getExerciseLibrary() : [])
      : {}
    Object.keys(lookup).forEach((key) => {
      const record = lookup[key]
      if (!record) return
      const entry = {
        name: record.name_cn || record.name || '',
        alias: Array.isArray(record.aliases) ? record.aliases : [],
        muscle: [...(record.primary_muscles || []), ...(record.secondary_muscles || [])],
        equipment: Array.isArray(record.equipment_required) ? record.equipment_required : [],
        difficulty: record.difficulty || '',
        category: record.category || '',
        motto: record.motto || '',
        instructions: Array.isArray(record.instructions) ? record.instructions : [],
        tips: Array.isArray(record.exercise_tips) ? record.exercise_tips : [],
        commonMistakes: Array.isArray(record.common_mistakes) ? record.common_mistakes : []
      }
      index[key] = entry
    })
    return index
  }

  // fallback: 使用 FALLBACK_EXERCISE_DETAILS
  Object.keys(FALLBACK_EXERCISE_DETAILS).forEach((name) => {
    const detail = FALLBACK_EXERCISE_DETAILS[name]
    const entry = { name, ...detail }
    index[name] = entry
    ;(detail.alias || []).forEach((alias) => {
      if (alias) index[alias] = entry
    })
  })

  return index
}

const EXERCISE_DETAIL_INDEX = buildExerciseDetailIndex()

function buildSupportPlanItems(items) {
  return normalizeList(items).map((item) => {
    const instructions = normalizeList(item && item.instructions)
    return {
      name: item && item.name ? item.name : '辅助动作',
      duration: item && item.duration ? item.duration : '',
      focusText: item && (item.focusText || item.targetText) ? (item.focusText || item.targetText) : '',
      instructionSteps: buildInstructionSteps(instructions)
    }
  })
}

function buildAdaptiveNotes(items) {
  return normalizeList(items).map((item) => ({
    exerciseName: item && item.exerciseName ? item.exerciseName : '动作',
    note: item && item.note ? item.note : ''
  })).filter((item) => item.note)
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

  const resolvedId = exercise.id || exercise.exercise_id || detail.id || ''

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
  const tips = Array.isArray(detail.tips) ? detail.tips : []
  const category = detail.category || exercise.category || ''
  const hasMedia = Boolean(sanitizeGifUrl(exercise.gifUrl || detail.gifUrl))
  const motto = exercise.motto || detail.motto || ''

  const detailedStepCards = buildDetailedStepCards(instructions, tips, commonMistakes, motto)

  return {
    ...detail,
    ...exercise,
    id: resolvedId,
    exercise_id: resolvedId,
    alias,
    gifUrl: hasMedia ? sanitizeGifUrl(exercise.gifUrl || detail.gifUrl) : '',
    mediaUrl: hasMedia ? sanitizeGifUrl(exercise.gifUrl || detail.gifUrl) : DEFAULT_EXERCISE_IMAGE,
    hasMedia,
    motto,
    instructions,
    instructionSteps,
    detailedStepCards,
    tips,
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

function buildTrainingExercise(exercise) {
  const nextExercise = exercise || {}
  const secondaryMuscles = Array.isArray(nextExercise.secondaryMuscles) ? nextExercise.secondaryMuscles : []
  const tips = Array.isArray(nextExercise.tips) ? nextExercise.tips : []
  const commonMistakes = Array.isArray(nextExercise.commonMistakes) ? nextExercise.commonMistakes : []
  const equipment = Array.isArray(nextExercise.equipment) ? nextExercise.equipment : []
  const detailedStepCards = Array.isArray(nextExercise.detailedStepCards) ? nextExercise.detailedStepCards : []
  const motto = nextExercise.motto || ''
  const hasMotto = Boolean(motto)

  return {
    ...nextExercise,
    secondaryMuscles,
    tips,
    commonMistakes,
    equipment,
    detailedStepCards,
    motto,
    hasMotto,
    hasSecondaryMuscles: secondaryMuscles.length > 0,
    hasTips: tips.length > 0,
    hasCommonMistakes: commonMistakes.length > 0,
    hasAdaptiveNote: Boolean(nextExercise.adaptiveNote),
    hasDetailedSteps: detailedStepCards.length > 0
  }
}

function resolveWorkoutDayFromPlan(weeklyPlan, preferredDate) {
  const days = Array.isArray(weeklyPlan) ? weeklyPlan : []
  if (!days.length) return null

  const normalizedPreferredDate = formatDateKey(preferredDate)
  if (normalizedPreferredDate) {
    const matchedDay = days.find((day) => {
      return formatDateKey(day && day.date) === normalizedPreferredDate
        && Array.isArray(day.workout)
        && day.workout.length > 0
    })

    if (matchedDay) {
      return matchedDay
    }
  }

  const todayKey = formatDateKey(new Date())
  const todayWorkout = days.find((day) => {
    return formatDateKey(day && day.date) === todayKey
      && Array.isArray(day.workout)
      && day.workout.length > 0
  })

  if (todayWorkout) {
    return todayWorkout
  }

  return days.find((day) => Array.isArray(day.workout) && day.workout.length > 0) || null
}

module.exports = {
  getExerciseLibrary,
  sanitizeGifUrl,
  resolveExerciseDetails,
  enrichWorkoutPlan,
  buildTrainingExercise,
  buildSupportPlanItems,
  buildAdaptiveNotes,
  buildInstructionSteps,
  formatDateKey,
  resolveWorkoutDayFromPlan
}
