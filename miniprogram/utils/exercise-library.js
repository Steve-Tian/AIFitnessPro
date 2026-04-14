const bundledCatalog = require('../data/exercises.json')

const DEFAULT_EXERCISE_IMAGE = '/images/default_exercise.png'
const DEFAULT_EXERCISE_INSTRUCTIONS = [
  '先用轻重量或徒手完成起始姿势，确认关节和身体排列稳定',
  '按推荐节奏完成动作全程，保持核心收紧和目标肌群主动发力',
  '每次还原都控制速度，若出现明显疼痛或动作变形请立即降强度'
]

const CATEGORY_LABELS = {
  all: '全部',
  push: '推日',
  pull: '拉日',
  legs: '腿日'
}

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

const SOURCE_LABELS = {
  ExerciseDB: 'ExerciseDB 主源',
  Wger: 'Wger 补充源',
  'local-bundle': '内置种子库'
}

const ADDITIONAL_EXERCISES = [
  {
    id: 'diamond_push_up',
    name: '钻石俯卧撑',
    alias: ['窄距俯卧撑'],
    category: 'push',
    muscle: ['triceps', 'chest', 'front_delts'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    gifUrl: '',
    instructions: [
      '双手放在胸前下方，拇指与食指靠近呈钻石形',
      '身体保持一条直线，缓慢下放至胸部接近手背',
      '手掌发力推起，顶端收紧胸肌和三头肌'
    ],
    tips: ['肘部自然贴近身体两侧', '全程收紧核心，避免塌腰'],
    commonMistakes: ['手掌位置过宽，导致胸肌发力分散', '下放时塌腰或耸肩']
  },
  {
    id: 'pike_push_up',
    name: '派克俯卧撑',
    alias: ['Pike Push-up'],
    category: 'push',
    muscle: ['shoulders', 'triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    gifUrl: '',
    instructions: [
      '双手撑地，臀部抬高形成倒 V 字',
      '屈肘让头部向地面下方移动',
      '肩部发力推回起始位置'
    ],
    tips: ['重心略向前，让肩部更多发力', '动作全程避免耸肩'],
    commonMistakes: ['臀部塌陷，变成普通俯卧撑轨迹', '手肘外翻过大导致肩部不稳']
  },
  {
    id: 'superman_hold',
    name: '超人挺身',
    alias: ['Superman'],
    category: 'pull',
    muscle: ['back', 'glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    gifUrl: '',
    instructions: [
      '俯卧趴地，双手向前伸直',
      '同时抬起双臂和双腿，感受背部发力',
      '顶峰停顿 1 秒后缓慢放下'
    ],
    tips: ['动作幅度不必过大，重在控制', '颈部保持自然，不要抬头过度'],
    commonMistakes: ['抬头过高导致颈部受压', '依靠甩腿而不是背部主动发力']
  },
  {
    id: 'ytw_raise',
    name: '俯身Y-T-W',
    alias: ['YTW'],
    category: 'pull',
    muscle: ['rear_delts', 'rhomboids', 'back'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    gifUrl: '',
    instructions: [
      '微屈髋俯身，核心收紧',
      '双臂依次做 Y、T、W 三个轨迹抬举',
      '每个轨迹顶峰停顿后缓慢回到起始位置'
    ],
    tips: ['全程小重量或徒手控制', '肩胛骨主动后缩下沉'],
    commonMistakes: ['动作太快，肩后束无法充分收缩', '耸肩代偿导致斜方肌抢力']
  },
  {
    id: 'towel_curl',
    name: '毛巾弯举',
    alias: ['自阻弯举'],
    category: 'pull',
    muscle: ['biceps', 'forearms'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    gifUrl: '',
    instructions: [
      '双手握住毛巾两端，一侧向上弯举，另一侧提供阻力',
      '弯举至手肘完全屈曲，顶峰停顿',
      '缓慢下放并换边重复'
    ],
    tips: ['阻力保持均匀，不要突然放松', '肘部尽量固定在身体两侧'],
    commonMistakes: ['阻力忽大忽小，导致动作节奏失控', '身体后仰借力']
  },
  {
    id: 'bodyweight_squat',
    name: '徒手深蹲',
    alias: ['自重深蹲'],
    category: 'legs',
    muscle: ['quads', 'glutes', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    gifUrl: '',
    instructions: [
      '双脚与肩同宽站立，脚尖略向外',
      '屈髋屈膝下蹲至大腿接近平行地面',
      '脚跟发力站起，回到起始姿势'
    ],
    tips: ['膝盖方向与脚尖一致', '保持胸口打开，避免塌腰'],
    commonMistakes: ['膝盖内扣', '下蹲时脚跟离地']
  },
  {
    id: 'reverse_lunge',
    name: '反向弓步蹲',
    alias: ['后撤箭步蹲'],
    category: 'legs',
    muscle: ['glutes', 'quads', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    gifUrl: '',
    instructions: [
      '站立姿势开始，单腿向后撤一步',
      '前腿屈膝下蹲，后膝接近地面',
      '前脚发力回到起始位置，再换边'
    ],
    tips: ['前脚脚跟持续发力', '躯干保持稳定直立'],
    commonMistakes: ['步幅过小导致膝盖压力过大', '躯干前倾过多']
  },
  {
    id: 'standing_calf_raise',
    name: '站姿提踵',
    alias: ['自重提踵'],
    category: 'legs',
    muscle: ['calves'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    gifUrl: '',
    instructions: [
      '双脚与肩同宽站立，脚掌踩稳地面',
      '脚尖发力将脚跟抬至最高点',
      '缓慢下放，感受小腿拉伸'
    ],
    tips: ['顶峰停顿 1 秒', '下降过程尽量放慢'],
    commonMistakes: ['动作反弹过快', '身体左右摇晃']
  }
]

function sanitizeRemoteMedia(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.includes('example.com')) return ''
  return url
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

function getSourceLabel(provider) {
  return SOURCE_LABELS[provider] || '自有动作库'
}

function inferEnglishName(exercise) {
  const aliases = normalizeList(exercise.alias)
  const englishAlias = aliases.find((alias) => /[a-zA-Z]/.test(alias))
  if (englishAlias) {
    return englishAlias
  }

  return (exercise.id || '')
    .split('_')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function buildBundledRecord(exercise) {
  const muscles = normalizeList(exercise.muscle)
  const primaryMuscles = muscles.slice(0, 2)
  const secondaryMuscles = muscles.slice(2)
  const gifUrl = sanitizeRemoteMedia(exercise.gifUrl)
  const englishName = inferEnglishName(exercise)

  return {
    exercise_id: exercise.id,
    name_cn: exercise.name,
    name_en: englishName,
    aliases: normalizeList(exercise.alias),
    category: exercise.category,
    equipment_required: normalizeList(exercise.equipment),
    primary_muscles: primaryMuscles,
    secondary_muscles: secondaryMuscles,
    difficulty: exercise.difficulty,
    media: {
      muscle_map_url: '',
      gif_url: gifUrl,
      video_url: '',
      thumbnail_url: DEFAULT_EXERCISE_IMAGE
    },
    instructions: normalizeList(exercise.instructions),
    exercise_tips: normalizeList(exercise.tips),
    common_mistakes: normalizeList(exercise.commonMistakes),
    default_sets: 3,
    default_reps: 8,
    alternatives: [],
    tags: Array.from(new Set([exercise.category].concat(muscles).filter(Boolean))),
    source: {
      provider: 'local-bundle',
      source_id: exercise.id
    }
  }
}

function normalizeRecordShape(record) {
  if (!record || typeof record !== 'object') {
    return null
  }

  if (record.exercise_id) {
    return {
      ...record,
      aliases: normalizeList(record.aliases || record.alias),
      equipment_required: normalizeList(record.equipment_required),
      primary_muscles: normalizeList(record.primary_muscles),
      secondary_muscles: normalizeList(record.secondary_muscles),
      instructions: normalizeList(record.instructions),
      exercise_tips: normalizeList(record.exercise_tips || record.tips),
      common_mistakes: normalizeList(record.common_mistakes || record.commonMistakes),
      overview: record.overview || '',
      media: {
        muscle_map_url: record.media && record.media.muscle_map_url ? record.media.muscle_map_url : '',
        gif_url: record.media && record.media.gif_url ? record.media.gif_url : '',
        video_url: record.media && record.media.video_url ? record.media.video_url : '',
        thumbnail_url: record.media && record.media.thumbnail_url ? record.media.thumbnail_url : DEFAULT_EXERCISE_IMAGE
      }
    }
  }

  return buildBundledRecord(record)
}

function decorateRecord(record) {
  const normalizedRecord = normalizeRecordShape(record)
  if (!normalizedRecord) {
    return null
  }

  const primaryMuscles = translateLabels(normalizedRecord.primary_muscles, MUSCLE_LABELS)
  const secondaryMuscles = translateLabels(normalizedRecord.secondary_muscles, MUSCLE_LABELS)
  const equipmentLabels = translateLabels(normalizedRecord.equipment_required, EQUIPMENT_LABELS)
  const hasGif = Boolean(sanitizeRemoteMedia(normalizedRecord.media && normalizedRecord.media.gif_url))
  const hasVideo = Boolean(sanitizeRemoteMedia(normalizedRecord.media && normalizedRecord.media.video_url))
  const coverUrl = (normalizedRecord.media && normalizedRecord.media.thumbnail_url) || DEFAULT_EXERCISE_IMAGE
  const videoUrl = sanitizeRemoteMedia(normalizedRecord.media && normalizedRecord.media.video_url)
  const instructions = normalizeList(normalizedRecord.instructions)
  const exerciseTips = normalizeList(normalizedRecord.exercise_tips)
  const commonMistakes = normalizeList(normalizedRecord.common_mistakes)
  const provider = normalizedRecord.source && normalizedRecord.source.provider ? normalizedRecord.source.provider : 'local-bundle'
  const sourceLabel = getSourceLabel(provider)

  return {
    ...normalizedRecord,
    id: normalizedRecord.exercise_id,
    name: normalizedRecord.name_cn,
    alias: normalizedRecord.aliases && normalizedRecord.aliases.length ? normalizedRecord.aliases[0] : '',
    categoryLabel: CATEGORY_LABELS[normalizedRecord.category] || normalizedRecord.category || '动作',
    primaryMuscles,
    secondaryMuscles,
    primaryText: primaryMuscles.join(' / ') || '全身协调发力',
    secondaryText: secondaryMuscles.join(' / ') || '核心稳定与关节控制',
    targetSummary: primaryMuscles.length
      ? `主练 ${primaryMuscles.join('、')}${secondaryMuscles.length ? `，辅助 ${secondaryMuscles.join('、')}` : ''}`
      : '重点关注动作轨迹、核心稳定和离心控制',
    equipmentText: equipmentLabels.join(' / ') || '按现有器械完成',
    difficultyLabel: DIFFICULTY_LABELS[normalizedRecord.difficulty] || '常规难度',
    coverUrl,
    videoUrl,
    mediaUrl: hasGif ? normalizedRecord.media.gif_url : coverUrl,
    hasGif,
    hasVideo,
    sourceLabel,
    sourceProvider: provider,
    overviewText: normalizedRecord.overview || '',
    mediaStatus: hasGif || hasVideo ? '已同步媒体资源' : '待同步动图/视频',
    instructions: instructions.length ? instructions : DEFAULT_EXERCISE_INSTRUCTIONS,
    exercise_tips: exerciseTips,
    common_mistakes: commonMistakes,
    instructionSteps: buildInstructionSteps(instructions.length ? instructions : DEFAULT_EXERCISE_INSTRUCTIONS)
  }
}

const rawBundledExercises = Array.isArray(bundledCatalog.exercises)
  ? bundledCatalog.exercises.concat(ADDITIONAL_EXERCISES)
  : []

const bundledRecords = rawBundledExercises.map(buildBundledRecord)

const decoratedRecords = bundledRecords.map(decorateRecord).filter(Boolean)

let runtimeRecordsCache = null
let runtimeRecordsPromise = null
let runtimeMetaCache = {
  source: 'bundle',
  sourceLabel: getSourceLabel('local-bundle'),
  count: decoratedRecords.length
}

function getExerciseLibrary(options = {}) {
  const keyword = (options.keyword || '').trim().toLowerCase()
  const category = options.category || 'all'
  const records = Array.isArray(options.records) ? options.records : decoratedRecords

  return records.filter((record) => {
    const matchCategory = category === 'all' || record.category === category
    if (!matchCategory) {
      return false
    }

    if (!keyword) {
      return true
    }

    const haystack = [
      record.name_cn,
      record.name_en,
      ...(record.aliases || []),
      ...(record.primaryMuscles || []),
      ...(record.secondaryMuscles || []),
      ...(record.tags || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(keyword)
  })
}

function getExerciseById(id) {
  if (!id) return null
  return decoratedRecords.find((record) => record.exercise_id === id) || null
}

function getExerciseByKey(key) {
  if (!key) return null
  return decoratedRecords.find((record) => {
    return record.exercise_id === key
      || record.name_cn === key
      || record.name_en === key
      || (record.aliases || []).includes(key)
  }) || null
}

function createExerciseLookup(records) {
  const lookup = {}
  ;(Array.isArray(records) ? records : []).forEach((record) => {
    if (!record) return
    lookup[record.exercise_id] = record
    lookup[record.name_cn] = record
    lookup[record.name] = record
    if (record.name_en) {
      lookup[record.name_en] = record
    }
    normalizeList(record.aliases).forEach((alias) => {
      lookup[alias] = record
    })
  })

  return lookup
}

function mergeWorkoutExercise(workoutExercise, record) {
  const reference = record || {}
  const primaryMuscles = normalizeList(reference.primaryMuscles)
  const secondaryMuscles = normalizeList(reference.secondaryMuscles)
  const instructions = normalizeList(reference.instructions).length
    ? normalizeList(reference.instructions)
    : DEFAULT_EXERCISE_INSTRUCTIONS

  return {
    ...reference,
    ...workoutExercise,
    id: reference.exercise_id || reference.id || workoutExercise.id || '',
    name: workoutExercise.name || reference.name_cn || reference.name || '',
    alias: workoutExercise.alias || reference.alias || '',
    categoryLabel: reference.categoryLabel || CATEGORY_LABELS[reference.category] || '',
    mediaUrl: reference.mediaUrl || DEFAULT_EXERCISE_IMAGE,
    videoUrl: reference.videoUrl || '',
    hasMedia: Boolean(reference.hasGif),
    hasGif: Boolean(reference.hasGif),
    hasVideo: Boolean(reference.hasVideo),
    instructions,
    instructionSteps: buildInstructionSteps(instructions),
    tips: normalizeList(reference.exercise_tips),
    commonMistakes: normalizeList(reference.common_mistakes),
    primaryMuscles,
    secondaryMuscles,
    primaryMusclesText: primaryMuscles.join(' / ') || '全身协调发力',
    secondaryMusclesText: secondaryMuscles.join(' / ') || '核心稳定与关节控制',
    targetSummary: reference.targetSummary || '重点关注动作轨迹、核心稳定和离心控制',
    equipmentText: reference.equipmentText || '按现有器械完成',
    difficultyLabel: reference.difficultyLabel || '常规难度',
    summary: `${workoutExercise.sets || reference.default_sets || 3} 组 × ${workoutExercise.reps || reference.default_reps || 8} 次 · 休息 ${workoutExercise.rest || 90} 秒`
  }
}

function getCloudDatabase() {
  if (typeof wx === 'undefined' || !wx || !wx.cloud || typeof wx.cloud.database !== 'function') {
    return null
  }
  return wx.cloud.database()
}

async function fetchRuntimeRecords(forceRefresh) {
  if (!forceRefresh && Array.isArray(runtimeRecordsCache) && runtimeRecordsCache.length > 0) {
    return runtimeRecordsCache
  }

  if (!forceRefresh && runtimeRecordsPromise) {
    return runtimeRecordsPromise
  }

  runtimeRecordsPromise = (async () => {
    const db = getCloudDatabase()
    if (!db) {
      runtimeRecordsCache = decoratedRecords
      runtimeMetaCache = {
        source: 'bundle',
        sourceLabel: getSourceLabel('local-bundle'),
        count: runtimeRecordsCache.length
      }
      return runtimeRecordsCache
    }

    try {
      const result = await db.collection('exercises').get()
      const records = Array.isArray(result.data)
        ? result.data.map((record) => decorateRecord(record)).filter(Boolean)
        : []

      runtimeRecordsCache = records.length > 0 ? records : decoratedRecords
      runtimeMetaCache = {
        source: records.length > 0 ? 'cloud' : 'bundle',
        sourceLabel: records.length > 0 ? '云端动作库' : getSourceLabel('local-bundle'),
        count: runtimeRecordsCache.length
      }
      return runtimeRecordsCache
    } catch (error) {
      runtimeRecordsCache = decoratedRecords
      runtimeMetaCache = {
        source: 'bundle',
        sourceLabel: getSourceLabel('local-bundle'),
        count: runtimeRecordsCache.length
      }
      return runtimeRecordsCache
    } finally {
      runtimeRecordsPromise = null
    }
  })()

  return runtimeRecordsPromise
}

async function loadExerciseLibrary(options = {}) {
  const records = await fetchRuntimeRecords(Boolean(options.forceRefresh))
  return getExerciseLibrary({
    ...options,
    records
  })
}

async function loadExerciseById(id, options = {}) {
  const records = await fetchRuntimeRecords(Boolean(options.forceRefresh))
  return records.find((record) => record.exercise_id === id) || null
}

async function loadExerciseByKey(key, options = {}) {
  if (!key) return null
  const records = await fetchRuntimeRecords(Boolean(options.forceRefresh))
  return createExerciseLookup(records)[key] || null
}

async function enrichWorkoutExercises(workout, options = {}) {
  const records = await fetchRuntimeRecords(Boolean(options.forceRefresh))
  const lookup = createExerciseLookup(records)

  return (Array.isArray(workout) ? workout : []).map((exercise) => {
    const candidateKeys = [exercise && exercise.id, exercise && exercise.name, exercise && exercise.alias]
      .filter(Boolean)
    let reference = null

    candidateKeys.some((key) => {
      reference = lookup[key] || null
      return Boolean(reference)
    })

    return mergeWorkoutExercise(exercise, reference)
  })
}

function buildExerciseSeedRecords() {
  return bundledRecords.map((record) => ({
    ...record
  }))
}

function getExerciseRuntimeMeta() {
  return {
    ...runtimeMetaCache
  }
}

module.exports = {
  DEFAULT_EXERCISE_IMAGE,
  CATEGORY_LABELS,
  MUSCLE_LABELS,
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  sanitizeRemoteMedia,
  normalizeList,
  translateLabels,
  getExerciseLibrary,
  loadExerciseLibrary,
  getExerciseById,
  loadExerciseById,
  getExerciseByKey,
  loadExerciseByKey,
  enrichWorkoutExercises,
  mergeWorkoutExercise,
  fetchRuntimeRecords,
  buildExerciseSeedRecords,
  decorateRecord,
  getExerciseRuntimeMeta,
  getSourceLabel
}
