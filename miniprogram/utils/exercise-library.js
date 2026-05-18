const bundledCatalog = require('../data/exercises.json')
const {
  MUSCLE_LABELS,
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  CATEGORY_LABELS,
  normalizeList,
  translateLabels,
  buildInstructionSteps,
  buildDetailedStepCards
} = require('./shared')

const DEFAULT_EXERCISE_IMAGE = '/images/default_exercise.png'
const DEFAULT_EXERCISE_INSTRUCTIONS = [
  '先用轻重量或徒手完成起始姿势，确认关节和身体排列稳定',
  '按推荐节奏完成动作全程，保持核心收紧和目标肌群主动发力',
  '每次还原都控制速度，若出现明显疼痛或动作变形请立即降强度'
]

const SOURCE_LABELS = {
  ExerciseDB: 'ExerciseDB 主源',
  Wger: 'Wger 补充源',
  'cloud-library': '云端动作库',
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
    motto: '钻石手型 · 肘贴身侧 · 夹臂推起',
    instructions: [
      '双手放在胸前下方，拇指与食指靠近呈钻石形（菱形），指尖朝前',
      '身体从头到脚保持一条直线，收紧核心和臀部',
      '肘部贴近身体两侧，缓慢下放至胸部接近手背，停顿 1 秒',
      '手掌均匀发力推起，顶端收紧胸肌内侧和三头肌'
    ],
    tips: ['肘部自然贴近身体两侧而非外翻', '全程收紧核心避免塌腰', '做不了可以先从跪姿开始'],
    commonMistakes: ['手掌位置过宽变成普通俯卧撑', '下放时塌腰或耸肩', '肘部外翻减弱三头刺激']
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
    motto: '倒V撑地 · 头冲地面 · 肩部主推',
    instructions: [
      '双手撑地略宽于肩，双脚向手方向走近，臀部抬高形成倒 V 字型',
      '头部位于双臂之间，眼睛看向脚尖方向',
      '屈肘让头部向地面方向下沉，肘部朝斜后方弯曲',
      '肩部发力推回起始位置，回到倒 V 型'
    ],
    tips: ['重心略向前让肩部承受更多负荷', '全程避免耸肩', '脚越靠近手难度越大'],
    commonMistakes: ['臀部塌陷变成普通俯卧撑轨迹', '手肘外翻过大导致肩部不稳', '颈部过度伸展']
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
    motto: '趴平伸展 · 背臀发力 · 顶峰停顿',
    instructions: [
      '俯卧趴在地面上，双手向前伸直过头，双腿伸直并拢',
      '同时抬起双臂和双腿离开地面 10-15 厘米，感受背部和臀部同时发力',
      '在最高点停顿 1-2 秒，充分挤压竖脊肌',
      '缓慢放下四肢回到地面，不要一下摔下来'
    ],
    tips: ['动作幅度不必过大，重在控制和停顿', '颈部保持自然延长线，不要抬头看前方', '可以增加停顿时间来增加难度'],
    commonMistakes: ['抬头过高导致颈部受压', '依靠甩腿而非背部主动发力', '没有顶峰停顿就放下']
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
    motto: '三字轨迹 · 肩胛后缩 · 慢举慢放',
    instructions: [
      '俯卧或微屈髋俯身站立，核心收紧，手臂自然下垂',
      'Y 轨迹：双臂向头部斜上方 45° 抬举成 Y 字，拇指朝天',
      'T 轨迹：双臂向身体两侧水平抬举成 T 字，挤压肩胛骨',
      'W 轨迹：双臂屈肘向后拉成 W 字型，肩胛骨完全后缩下沉'
    ],
    tips: ['每个轨迹顶峰停顿 1-2 秒', '全程小重量或徒手控制', '肩胛骨主动后缩下沉是发力关键'],
    commonMistakes: ['动作太快肩后束无法充分收缩', '耸肩代偿导致斜方肌抢力', '三个轨迹混在一起没有区分']
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
    motto: '毛巾对拉 · 均匀阻力 · 肘固不动',
    instructions: [
      '双手握住毛巾两端，一只脚踩住毛巾中间（或对侧手提供阻力）',
      '弯举侧的手肘固定在身体一侧，以肘关节为轴向上弯举',
      '弯举至手肘完全屈曲，顶峰停顿挤压肱二头肌 1 秒',
      '缓慢下放回到起始位置，保持阻力不突然松开'
    ],
    tips: ['阻力保持均匀，不要突然放松', '肘部尽量固定在身体两侧', '可以调节踩踏位置来改变阻力大小'],
    commonMistakes: ['阻力忽大忽小导致动作节奏失控', '身体后仰借力', '肘部前后移动']
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
    motto: '脚跟踩实 · 膝跟脚尖 · 蹲深站稳',
    instructions: [
      '双脚与肩同宽或略宽站立，脚尖外展约 15°-30°，双手前伸或抱胸保持平衡',
      '挺胸收核心，屈髋屈膝同时向下坐，想象身后有把椅子',
      '下蹲至大腿与地面平行或更低，膝盖方向始终与脚尖一致',
      '脚跟发力站起回到初始位置，站直时臀部微微收紧'
    ],
    tips: ['膝盖方向与脚尖一致是保护膝盖的关键', '保持胸口打开不要弓背', '脚跟始终踩实地面'],
    commonMistakes: ['膝盖内扣（膝外翻）', '下蹲时脚跟离地', '身体过度前倾弓背']
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
    motto: '后撤一步 · 双膝九十 · 前跟蹬起',
    instructions: [
      '自然站立，双手叉腰或自然下垂，挺胸收核心',
      '一条腿向正后方撤出一大步，前脚脚掌踩稳地面',
      '双膝同时弯曲下蹲，前腿和后腿都弯至约 90°，后膝接近但不触地',
      '前脚脚跟发力蹬地站起回到初始位置，换另一条腿重复'
    ],
    tips: ['前脚脚跟持续发力是关键', '躯干保持稳定直立不前倾', '后撤比前跨对膝盖更友好'],
    commonMistakes: ['步幅过小导致前膝压力过大', '躯干前倾过多失去平衡', '后膝撞击地面']
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
    motto: '踮到最高 · 停顿两秒 · 慢放拉伸',
    instructions: [
      '双脚与肩同宽站立，可以扶墙保持平衡（站在台阶边缘效果更好）',
      '呼气，脚尖发力将脚跟抬至最高点，充分收缩小腿',
      '在顶峰位置停顿 1-2 秒，感受小腿完全收紧',
      '吸气以 2-3 秒速度缓慢下放，让脚跟低于台阶平面充分拉伸'
    ],
    tips: ['顶峰停顿 1-2 秒是刺激关键', '下降过程尽量放慢', '可以单腿进行增加难度'],
    commonMistakes: ['动作反弹过快像跳跃', '身体左右摇晃', '没有做到最大活动范围']
  }
]

function sanitizeRemoteMedia(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.includes('example.com')) return ''
  return url
}

function buildHeroHighlights(primaryMuscles, commonMistakes) {
  const highlights = []

  if (primaryMuscles.length > 0) {
    highlights.push(`主练 ${primaryMuscles.join(' / ')}`)
  }

  normalizeList(commonMistakes).slice(0, 2).forEach((item) => {
    highlights.push(`避免 ${item}`)
  })

  return highlights.slice(0, 3)
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
    motto: exercise.motto || '',
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
      motto: record.motto || '',
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
  const provider = normalizedRecord.source && normalizedRecord.source.provider
    ? normalizedRecord.source.provider
    : normalizedRecord._id
      ? 'cloud-library'
      : 'local-bundle'
  const sourceLabel = getSourceLabel(provider)
  const motto = normalizedRecord.motto || ''
  const detailedStepCards = buildDetailedStepCards(instructions.length ? instructions : DEFAULT_EXERCISE_INSTRUCTIONS, exerciseTips, commonMistakes, motto)

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
    motto,
    coverUrl,
    videoUrl,
    mediaUrl: hasGif ? normalizedRecord.media.gif_url : coverUrl,
    hasGif,
    hasVideo,
    sourceLabel,
    sourceProvider: provider,
    overviewText: normalizedRecord.overview || '',
    mediaLabel: hasVideo ? '视频示范' : (hasGif ? 'GIF 示范' : '口诀 + 步骤'),
    mediaNoteText: hasVideo
      ? '先直接看视频动作轨迹，再开始练。'
      : hasGif
        ? '优先照着 GIF 轨迹练，不必先读长步骤。'
        : motto
          ? '记住口诀「' + motto + '」，跟着下方步骤练。'
          : '参考下方详细步骤进行训练。',
    mediaStatus: hasGif || hasVideo ? '已同步媒体资源' : '待同步动图/视频',
    instructions: instructions.length ? instructions : DEFAULT_EXERCISE_INSTRUCTIONS,
    exercise_tips: exerciseTips,
    common_mistakes: commonMistakes,
    instructionSteps: buildInstructionSteps(instructions.length ? instructions : DEFAULT_EXERCISE_INSTRUCTIONS),
    detailedStepCards,
    heroHighlights: buildHeroHighlights(primaryMuscles, commonMistakes),
    muscleMapUrl: sanitizeRemoteMedia(normalizedRecord.media && normalizedRecord.media.muscle_map_url)
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
  const motto = reference.motto || workoutExercise.motto || ''

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
    motto,
    instructions,
    instructionSteps: buildInstructionSteps(instructions),
    detailedStepCards: buildDetailedStepCards(instructions, normalizeList(reference.exercise_tips), normalizeList(reference.common_mistakes), motto),
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
  try {
    if (typeof wx === 'undefined' || !wx || !wx.cloud || typeof wx.cloud.database !== 'function') {
      return null
    }
    return wx.cloud.database()
  } catch (err) {
    console.warn('云数据库不可用：', err.message || err)
    return null
  }
}

async function queryCloudExerciseById(id) {
  if (!id) return null
  const db = getCloudDatabase()
  if (!db) return null

  try {
    const result = await db.collection('exercises').where({
      exercise_id: id
    }).get()

    if (Array.isArray(result.data) && result.data.length > 0) {
      return decorateRecord(result.data[0])
    }
  } catch (error) {
    return null
  }

  return null
}

async function queryCloudExerciseByKey(key) {
  if (!key) return null
  const db = getCloudDatabase()
  if (!db) return null

  const candidateQueries = [
    { exercise_id: key },
    { name_cn: key },
    { name_en: key }
  ]

  for (const query of candidateQueries) {
    try {
      const result = await db.collection('exercises').where(query).get()
      if (Array.isArray(result.data) && result.data.length > 0) {
        return decorateRecord(result.data[0])
      }
    } catch (error) {
      continue
    }
  }

  return null
}

async function queryAllCloudExercises(db) {
  const collection = db.collection('exercises')

  if (collection && typeof collection.limit === 'function' && typeof collection.skip === 'function') {
    const pageSize = 20
    let offset = 0
    let results = []
    let hasNextPage = true

    while (hasNextPage) {
      const pageResult = await collection.skip(offset).limit(pageSize).get()
      const pageData = Array.isArray(pageResult.data) ? pageResult.data : []
      results = results.concat(pageData)
      hasNextPage = pageData.length === pageSize
      offset += pageSize
    }

    return results
  }

  const result = await collection.get()
  return Array.isArray(result.data) ? result.data : []
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
      const cloudRecords = await queryAllCloudExercises(db)
      const records = Array.isArray(cloudRecords)
        ? cloudRecords.map((record) => decorateRecord(record)).filter(Boolean)
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
  const cloudRecord = await queryCloudExerciseById(id)
  if (cloudRecord) {
    return cloudRecord
  }
  const records = await fetchRuntimeRecords(Boolean(options.forceRefresh))
  return records.find((record) => record.exercise_id === id) || null
}

async function loadExerciseByKey(key, options = {}) {
  if (!key) return null
  const cloudRecord = await queryCloudExerciseByKey(key)
  if (cloudRecord) {
    return cloudRecord
  }
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
  queryCloudExerciseById,
  queryCloudExerciseByKey,
  buildExerciseSeedRecords,
  decorateRecord,
  getExerciseRuntimeMeta,
  getSourceLabel
}
