#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { buildExerciseSeedRecords } = require('../miniprogram/utils/exercise-library')

const OUTPUT_DIR = path.resolve(__dirname, 'output')
const NORMALIZED_OUTPUT = path.join(OUTPUT_DIR, 'exercises.normalized.json')
const REPORT_OUTPUT = path.join(OUTPUT_DIR, 'exercises.sync-report.json')
const MEDIA_OUTPUT_DIR = path.join(OUTPUT_DIR, 'exercise-media')
const DEFAULT_SYNC_ENV_FILE = path.resolve(__dirname, 'exercise-sync.env')

const SOURCE_PRIORITY = {
  ExerciseDB: 3,
  Wger: 2,
  'local-bundle': 1
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

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      return
    }

    const equalIndex = trimmed.indexOf('=')
    if (equalIndex === -1) {
      return
    }

    const key = trimmed.slice(0, equalIndex).trim()
    const rawValue = trimmed.slice(equalIndex + 1).trim()
    const unwrappedValue = rawValue.replace(/^['"]|['"]$/g, '')

    if (key && process.env[key] === undefined) {
      process.env[key] = unwrappedValue
    }
  })
}

loadEnvFile(process.env.EXERCISE_SYNC_ENV_FILE || DEFAULT_SYNC_ENV_FILE)

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//.test(value)
}

function toSlug(value, fallback) {
  const normalized = String(value || fallback || 'exercise')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || String(fallback || 'exercise')
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapBodyPartToCategory(value) {
  const normalized = String(value || '').toLowerCase()
  if (['chest', 'shoulders', 'triceps', 'pectorals'].includes(normalized)) return 'push'
  if (['back', 'biceps', 'forearms', 'lats'].includes(normalized)) return 'pull'
  if (['legs', 'glutes', 'hamstrings', 'quads', 'calves'].includes(normalized)) return 'legs'
  return 'push'
}

function mapDifficulty(value) {
  const normalized = String(value || '').toLowerCase()
  if (['easy', 'novice', 'beginner'].includes(normalized)) return 'beginner'
  if (['hard', 'advanced', 'expert'].includes(normalized)) return 'advanced'
  return 'intermediate'
}

function normalizeEquipment(value) {
  return normalizeList(value).map((item) => {
    const normalized = String(item).toLowerCase()
    if (normalized.includes('body')) return 'bodyweight'
    if (normalized.includes('dumbbell')) return 'dumbbell_only'
    if (normalized.includes('cable')) return 'cable'
    if (normalized.includes('barbell') || normalized.includes('bench')) return 'barbell_bench'
    return 'full_gym'
  })
}

function normalizeMuscles(value) {
  return normalizeList(value).map((item) => {
    return String(item)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z_]/g, '')
  }).filter(Boolean)
}

function extractNamedValues(value) {
  return normalizeList(value).map((item) => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item === 'number') return String(item)
    return item.name
      || item.name_en
      || item.name_original
      || item.english_name
      || item.full_name
      || item.exercise
      || ''
  }).filter(Boolean)
}

function dedupeStrings(values) {
  return Array.from(new Set(normalizeList(values).filter(Boolean)))
}

function pickLongerList(primary, secondary) {
  const a = normalizeList(primary)
  const b = normalizeList(secondary)
  if (a.length === 0) return b
  if (b.length === 0) return a
  return a.length >= b.length ? a : b
}

function pickLocalizedName(primary, secondary) {
  if (/[^\x00-\x7F]/.test(String(primary || ''))) return primary
  if (/[^\x00-\x7F]/.test(String(secondary || ''))) return secondary
  return primary || secondary || ''
}

function getHeaderValue(prefix, suffix, fallbackKey) {
  return process.env[`${prefix}_${suffix}`] || (fallbackKey ? process.env[fallbackKey] : '')
}

function getSourceHeaders(prefix) {
  const headers = {
    Accept: 'application/json'
  }

  const apiKey = getHeaderValue(prefix, 'API_KEY', 'EXERCISE_SOURCE_API_KEY')
  const host = getHeaderValue(prefix, 'HOST', 'EXERCISE_SOURCE_HOST')
  const authorization = getHeaderValue(prefix, 'AUTHORIZATION', 'EXERCISE_SOURCE_AUTHORIZATION')

  if (apiKey) {
    headers['X-API-Key'] = apiKey
  }

  if (host) {
    headers['X-API-Host'] = host
  }

  if (authorization) {
    headers.Authorization = authorization
  }

  return headers
}

async function requestJson(url, headers) {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`源接口请求失败: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

function getNextPageUrl(payload, currentUrl) {
  const nextValue = payload && (payload.next || (payload.links && payload.links.next))
  if (!nextValue) {
    return ''
  }

  if (isHttpUrl(nextValue)) {
    return nextValue
  }

  try {
    return new URL(nextValue, currentUrl).toString()
  } catch (error) {
    return ''
  }
}

async function downloadFile(url, targetPath, headers) {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`媒体下载失败: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  fs.writeFileSync(targetPath, Buffer.from(arrayBuffer))
}

function resolveMediaUrl(value, mediaBaseUrl) {
  if (!value) return ''
  if (isHttpUrl(value)) return value
  if (!mediaBaseUrl) return ''
  return `${mediaBaseUrl.replace(/\/$/, '')}/${String(value).replace(/^\//, '')}`
}

function normalizeSourcePayload(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload && payload.data)) return payload.data
  if (Array.isArray(payload && payload.results)) return payload.results
  if (Array.isArray(payload && payload.exercises)) return payload.exercises
  if (Array.isArray(payload && payload.items)) return payload.items
  return []
}

function buildSourceConfig(prefix, provider, fallbackUrlKey) {
  const url = process.env[`${prefix}_URL`] || (fallbackUrlKey ? process.env[fallbackUrlKey] : '')
  if (!url) return null

  return {
    prefix,
    provider,
    url,
    mediaBaseUrl: process.env[`${prefix}_MEDIA_BASE_URL`] || process.env.EXERCISE_SOURCE_MEDIA_BASE_URL || '',
    limit: Number(process.env[`${prefix}_LIMIT`] || process.env.EXERCISE_SYNC_LIMIT || 0),
    headers: getSourceHeaders(prefix)
  }
}

function getActiveSourceConfigs() {
  const configs = [
    buildSourceConfig('EXERCISEDB_SOURCE', 'ExerciseDB'),
    buildSourceConfig('WGER_SOURCE', 'Wger')
  ].filter(Boolean)

  if (configs.length > 0) {
    return configs
  }

  const legacy = buildSourceConfig('EXERCISE_SOURCE', process.env.EXERCISE_SOURCE_NAME || 'ExerciseDB', 'EXERCISE_SOURCE_URL')
  return legacy ? [legacy] : []
}

function normalizeExerciseDbExercise(sourceExercise, index, sourceConfig) {
  const sourceId = sourceExercise.exerciseId || sourceExercise.id || sourceExercise.exercise_id || `exercisedb_${index + 1}`
  const englishName = sourceExercise.name || sourceExercise.name_en || sourceExercise.englishName || sourceExercise.title || `Exercise ${index + 1}`
  const chineseName = sourceExercise.nameZh || sourceExercise.nameCN || sourceExercise.translatedName || sourceExercise.name_cn || englishName
  const targetMuscles = normalizeMuscles(sourceExercise.targetMuscles || sourceExercise.primaryMuscles || sourceExercise.target || sourceExercise.bodyParts)
  const secondaryMuscles = normalizeMuscles(sourceExercise.secondaryMuscles || sourceExercise.secondaryTargetMuscles || sourceExercise.synergists)
  const gifUrl = resolveMediaUrl(sourceExercise.gifUrl || sourceExercise.gif_url, sourceConfig.mediaBaseUrl)
  const videoUrl = resolveMediaUrl(sourceExercise.videoUrl || sourceExercise.video_url, sourceConfig.mediaBaseUrl)
  const imageUrl = resolveMediaUrl(sourceExercise.imageUrl || sourceExercise.thumbnailUrl || sourceExercise.thumbnail_url, sourceConfig.mediaBaseUrl)
  const bodyPart = normalizeList(sourceExercise.bodyParts || sourceExercise.bodyPart)[0]

  return {
    exercise_id: String(sourceId),
    name_cn: chineseName,
    name_en: englishName,
    aliases: normalizeList(sourceExercise.aliases || sourceExercise.alias || sourceExercise.keywords).slice(0, 8),
    category: mapBodyPartToCategory(bodyPart || targetMuscles[0]),
    equipment_required: normalizeEquipment(sourceExercise.equipments || sourceExercise.equipment),
    primary_muscles: targetMuscles.slice(0, 2),
    secondary_muscles: secondaryMuscles,
    difficulty: mapDifficulty(sourceExercise.difficulty || sourceExercise.level),
    overview: stripHtml(sourceExercise.overview || sourceExercise.description),
    media: {
      muscle_map_url: resolveMediaUrl(sourceExercise.muscleMapUrl || sourceExercise.muscle_map_url, sourceConfig.mediaBaseUrl),
      gif_url: gifUrl,
      video_url: videoUrl,
      thumbnail_url: imageUrl
    },
    instructions: normalizeList(sourceExercise.instructions).map(stripHtml),
    exercise_tips: normalizeList(sourceExercise.exerciseTips || sourceExercise.tips).map(stripHtml),
    common_mistakes: normalizeList(sourceExercise.commonMistakes).map(stripHtml),
    default_sets: Number(sourceExercise.defaultSets) || 3,
    default_reps: Number(sourceExercise.defaultReps) || 8,
    alternatives: normalizeList(sourceExercise.relatedExerciseIds || sourceExercise.alternatives),
    tags: Array.from(new Set(normalizeList(sourceExercise.keywords).concat(normalizeList(sourceExercise.bodyParts)).filter(Boolean))),
    source: {
      provider: sourceConfig.provider,
      source_id: String(sourceId)
    }
  }
}

function normalizeWgerExercise(sourceExercise, index, sourceConfig) {
  const sourceId = sourceExercise.id || sourceExercise.exercise_id || `wger_${index + 1}`
  const translations = normalizeList(sourceExercise.translations)
  const translatedNames = translations.map((item) => item && item.name).filter(Boolean)
  const englishName = sourceExercise.name_en || sourceExercise.name || translatedNames[0] || `Wger Exercise ${index + 1}`
  const chineseTranslation = translations.find((item) => {
    const code = String(item && (item.language || item.language_code || item.locale) || '').toLowerCase()
    return code.includes('zh')
  })
  const chineseName = sourceExercise.name_cn || (chineseTranslation && chineseTranslation.name) || englishName
  const description = stripHtml(sourceExercise.description || (chineseTranslation && chineseTranslation.description) || '')
  const primaryMuscles = normalizeMuscles(
    extractNamedValues(sourceExercise.muscles || sourceExercise.primary_muscles || sourceExercise.primaryMuscles)
  )
  const secondaryMuscles = normalizeMuscles(
    extractNamedValues(sourceExercise.muscles_secondary || sourceExercise.secondary_muscles || sourceExercise.secondaryMuscles)
  )
  const equipment = normalizeEquipment(
    extractNamedValues(sourceExercise.equipment || sourceExercise.equipments || sourceExercise.equipment_required)
  )
  const categoryLabel = sourceExercise.category && (sourceExercise.category.name || sourceExercise.category)
  const imageUrl = resolveMediaUrl(
    sourceExercise.image || sourceExercise.image_url || sourceExercise.thumbnailUrl || sourceExercise.thumbnail_url,
    sourceConfig.mediaBaseUrl
  )
  const videoUrl = resolveMediaUrl(sourceExercise.video || sourceExercise.video_url, sourceConfig.mediaBaseUrl)

  return {
    exercise_id: `wger_${sourceId}`,
    name_cn: chineseName,
    name_en: englishName,
    aliases: dedupeStrings(
      translatedNames.concat(normalizeList(sourceExercise.aliases || sourceExercise.alias))
    ).slice(0, 8),
    category: mapBodyPartToCategory(categoryLabel || primaryMuscles[0]),
    equipment_required: equipment,
    primary_muscles: primaryMuscles.slice(0, 2),
    secondary_muscles: secondaryMuscles,
    difficulty: mapDifficulty(sourceExercise.level || sourceExercise.difficulty),
    overview: description,
    media: {
      muscle_map_url: '',
      gif_url: '',
      video_url: videoUrl,
      thumbnail_url: imageUrl
    },
    instructions: description ? [description] : [],
    exercise_tips: [],
    common_mistakes: [],
    default_sets: Number(sourceExercise.defaultSets) || 3,
    default_reps: Number(sourceExercise.defaultReps) || 8,
    alternatives: [],
    tags: dedupeStrings(
      extractNamedValues(sourceExercise.muscles)
        .concat(extractNamedValues(sourceExercise.muscles_secondary))
        .concat(extractNamedValues(sourceExercise.equipment))
        .concat(normalizeList(categoryLabel))
    ),
    source: {
      provider: sourceConfig.provider,
      source_id: String(sourceId)
    }
  }
}

function normalizeSourceExercise(sourceExercise, index, sourceConfig) {
  if (sourceConfig.provider === 'Wger') {
    return normalizeWgerExercise(sourceExercise, index, sourceConfig)
  }
  return normalizeExerciseDbExercise(sourceExercise, index, sourceConfig)
}

function buildCanonicalKey(record) {
  return toSlug(record.name_en || record.name_cn || record.exercise_id, record.exercise_id)
}

function mergeMedia(primaryMedia, secondaryMedia) {
  const base = secondaryMedia || {}
  const override = primaryMedia || {}
  return {
    muscle_map_url: override.muscle_map_url || base.muscle_map_url || '',
    gif_url: override.gif_url || base.gif_url || '',
    video_url: override.video_url || base.video_url || '',
    thumbnail_url: override.thumbnail_url || base.thumbnail_url || ''
  }
}

function mergeExerciseRecords(preferredRecord, fallbackRecord) {
  const primary = preferredRecord || {}
  const secondary = fallbackRecord || {}
  return {
    exercise_id: primary.exercise_id || secondary.exercise_id,
    name_cn: pickLocalizedName(primary.name_cn, secondary.name_cn),
    name_en: primary.name_en || secondary.name_en || '',
    aliases: dedupeStrings(normalizeList(primary.aliases).concat(normalizeList(secondary.aliases))),
    category: primary.category || secondary.category || 'push',
    equipment_required: dedupeStrings(normalizeList(primary.equipment_required).concat(normalizeList(secondary.equipment_required))),
    primary_muscles: pickLongerList(primary.primary_muscles, secondary.primary_muscles).slice(0, 2),
    secondary_muscles: dedupeStrings(normalizeList(primary.secondary_muscles).concat(normalizeList(secondary.secondary_muscles))),
    difficulty: primary.difficulty || secondary.difficulty || 'intermediate',
    overview: primary.overview || secondary.overview || '',
    media: mergeMedia(primary.media, secondary.media),
    instructions: pickLongerList(primary.instructions, secondary.instructions),
    exercise_tips: dedupeStrings(normalizeList(primary.exercise_tips).concat(normalizeList(secondary.exercise_tips))),
    common_mistakes: dedupeStrings(normalizeList(primary.common_mistakes).concat(normalizeList(secondary.common_mistakes))),
    default_sets: primary.default_sets || secondary.default_sets || 3,
    default_reps: primary.default_reps || secondary.default_reps || 8,
    alternatives: dedupeStrings(normalizeList(primary.alternatives).concat(normalizeList(secondary.alternatives))),
    tags: dedupeStrings(normalizeList(primary.tags).concat(normalizeList(secondary.tags))),
    source: {
      provider: primary.source && primary.source.provider ? primary.source.provider : secondary.source && secondary.source.provider ? secondary.source.provider : 'ExerciseDB',
      source_id: primary.source && primary.source.source_id ? primary.source.source_id : secondary.source && secondary.source.source_id ? secondary.source.source_id : '',
      merged_from: dedupeStrings(
        [primary.source && primary.source.provider, secondary.source && secondary.source.provider].filter(Boolean)
      )
    }
  }
}

function getRecordPriority(record) {
  const provider = record && record.source ? record.source.provider : ''
  return SOURCE_PRIORITY[provider] || 0
}

function mergeSourceRecords(records) {
  const mergedMap = new Map()

  normalizeList(records).forEach((record) => {
    const key = buildCanonicalKey(record)
    if (!mergedMap.has(key)) {
      mergedMap.set(key, record)
      return
    }

    const existing = mergedMap.get(key)
    const existingPriority = getRecordPriority(existing)
    const incomingPriority = getRecordPriority(record)
    const preferred = incomingPriority > existingPriority ? record : existing
    const fallback = preferred === record ? existing : record
    mergedMap.set(key, mergeExerciseRecords(preferred, fallback))
  })

  return Array.from(mergedMap.values())
}

function buildCloudPath(exerciseId, type, originalUrl) {
  const extension = path.extname(originalUrl || '').replace('.', '') || (
    type === 'video'
      ? 'mp4'
      : type === 'thumbnail'
        ? 'jpg'
        : 'gif'
  )
  const prefix = (process.env.EXERCISE_CLOUD_PATH_PREFIX || 'exercise-media').replace(/^\/+|\/+$/g, '')
  return `${prefix}/${exerciseId}/${type}.${extension}`
}

function buildLocalMediaPath(exerciseId, type, originalUrl) {
  const extension = path.extname(originalUrl || '').replace('.', '') || (
    type === 'video'
      ? 'mp4'
      : type === 'thumbnail'
        ? 'jpg'
        : 'gif'
  )
  return path.join(MEDIA_OUTPUT_DIR, `${exerciseId}.${type}.${extension}`)
}

function safeReadWxCloud() {
  const candidates = [
    'wx-server-sdk',
    path.resolve(__dirname, '../cloudfunctions/genPlan/node_modules/wx-server-sdk'),
    path.resolve(__dirname, '../cloudfunctions/login/node_modules/wx-server-sdk')
  ]

  for (const candidate of candidates) {
    try {
      return require(candidate)
    } catch (error) {
      continue
    }
  }

  return null
}

async function uploadMediaToCloud(records) {
  const wxCloud = safeReadWxCloud()
  const cloudEnv = process.env.WECHAT_CLOUD_ENV
  const mediaBaseUrl = process.env.EXERCISE_MEDIA_BASE_URL || ''

  if (!wxCloud || !cloudEnv) {
    return { records, uploaded: 0 }
  }

  wxCloud.init({ env: cloudEnv })
  let uploaded = 0

  for (const record of records) {
    const exerciseId = record.exercise_id
    const media = { ...record.media }
    const localGif = buildLocalMediaPath(exerciseId, 'gif', media.gif_url)
    const localVideo = buildLocalMediaPath(exerciseId, 'video', media.video_url)
    const localThumb = buildLocalMediaPath(exerciseId, 'thumbnail', media.thumbnail_url)

    if (fs.existsSync(localGif)) {
      const cloudPath = buildCloudPath(exerciseId, 'gif', media.gif_url)
      await wxCloud.uploadFile({
        cloudPath,
        fileContent: fs.readFileSync(localGif)
      })
      media.gif_url = mediaBaseUrl ? `${mediaBaseUrl.replace(/\/$/, '')}/${cloudPath}` : cloudPath
      uploaded += 1
    }

    if (fs.existsSync(localVideo)) {
      const cloudPath = buildCloudPath(exerciseId, 'video', media.video_url)
      await wxCloud.uploadFile({
        cloudPath,
        fileContent: fs.readFileSync(localVideo)
      })
      media.video_url = mediaBaseUrl ? `${mediaBaseUrl.replace(/\/$/, '')}/${cloudPath}` : cloudPath
      uploaded += 1
    }

    if (fs.existsSync(localThumb)) {
      const cloudPath = buildCloudPath(exerciseId, 'thumbnail', media.thumbnail_url)
      await wxCloud.uploadFile({
        cloudPath,
        fileContent: fs.readFileSync(localThumb)
      })
      media.thumbnail_url = mediaBaseUrl ? `${mediaBaseUrl.replace(/\/$/, '')}/${cloudPath}` : cloudPath
      uploaded += 1
    }

    record.media = media
  }

  return { records, uploaded }
}

async function upsertExercisesToCloud(records) {
  const wxCloud = safeReadWxCloud()
  const cloudEnv = process.env.WECHAT_CLOUD_ENV
  if (!wxCloud || !cloudEnv) {
    return { synced: 0 }
  }

  wxCloud.init({ env: cloudEnv })
  const db = wxCloud.database()
  let synced = 0

  for (const record of records) {
    const existing = await db.collection('exercises').where({
      exercise_id: record.exercise_id
    }).get()

    if (existing.data && existing.data.length > 0) {
      await db.collection('exercises').doc(existing.data[0]._id).update({
        data: record
      })
    } else {
      await db.collection('exercises').add({
        data: record
      })
    }

    synced += 1
  }

  return { synced }
}

async function fetchRecordsFromSource(sourceConfig) {
  const records = []
  const limit = sourceConfig.limit > 0 ? sourceConfig.limit : Number.MAX_SAFE_INTEGER
  let pageUrl = sourceConfig.url

  while (pageUrl && records.length < limit) {
    const payload = await requestJson(pageUrl, sourceConfig.headers)
    const sourceExercises = normalizeSourcePayload(payload)
    sourceExercises.forEach((exercise) => {
      if (records.length < limit) {
        records.push(exercise)
      }
    })

    if (sourceExercises.length === 0) {
      break
    }

    pageUrl = getNextPageUrl(payload, pageUrl)
  }

  return records.map((exercise, index) => normalizeSourceExercise(exercise, index, sourceConfig))
}

async function buildNormalizedRecords() {
  const sourceConfigs = getActiveSourceConfigs()
  if (sourceConfigs.length === 0) {
    return {
      records: buildExerciseSeedRecords(),
      sources: ['local-bundle-seed'],
      sourceConfigs: []
    }
  }

  const sourceRecords = []
  for (const sourceConfig of sourceConfigs) {
    const records = await fetchRecordsFromSource(sourceConfig)
    sourceRecords.push(...records)
  }

  return {
    records: mergeSourceRecords(sourceRecords),
    sources: sourceConfigs.map((config) => config.provider),
    sourceConfigs
  }
}

async function main() {
  ensureDir(OUTPUT_DIR)
  ensureDir(MEDIA_OUTPUT_DIR)

  const { records, sources, sourceConfigs } = await buildNormalizedRecords()
  const shouldDownloadMedia = process.env.EXERCISE_DOWNLOAD_MEDIA === '1'
  const report = {
    source: sources.join(' + '),
    totalRecords: records.length,
    downloaded: 0,
    uploaded: 0,
    synced: 0,
    generatedAt: new Date().toISOString()
  }

  if (shouldDownloadMedia) {
    for (const record of records) {
      const matchingSource = sourceConfigs.find((config) => {
        return config.provider === (record.source && record.source.provider)
      })
      const sourceHeaders = matchingSource ? matchingSource.headers : { Accept: 'application/json' }
      const gifUrl = record.media && record.media.gif_url
      const videoUrl = record.media && record.media.video_url
      const thumbUrl = record.media && record.media.thumbnail_url

      if (isHttpUrl(gifUrl)) {
        await downloadFile(gifUrl, buildLocalMediaPath(record.exercise_id, 'gif', gifUrl), sourceHeaders)
        report.downloaded += 1
      }

      if (isHttpUrl(videoUrl)) {
        await downloadFile(videoUrl, buildLocalMediaPath(record.exercise_id, 'video', videoUrl), sourceHeaders)
        report.downloaded += 1
      }

      if (isHttpUrl(thumbUrl)) {
        await downloadFile(thumbUrl, buildLocalMediaPath(record.exercise_id, 'thumbnail', thumbUrl), sourceHeaders)
        report.downloaded += 1
      }
    }
  }

  const uploadResult = await uploadMediaToCloud(records)
  report.uploaded = uploadResult.uploaded

  const syncResult = await upsertExercisesToCloud(uploadResult.records)
  report.synced = syncResult.synced

  fs.writeFileSync(NORMALIZED_OUTPUT, JSON.stringify(uploadResult.records, null, 2))
  fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(report, null, 2))

  console.log(`动作内容同步完成: ${report.totalRecords} 条`)
  console.log(`- 来源: ${report.source}`)
  console.log(`- 下载媒体: ${report.downloaded}`)
  console.log(`- 上传媒体: ${report.uploaded}`)
  console.log(`- 写入数据库: ${report.synced}`)
  console.log(`- 标准化文件: ${NORMALIZED_OUTPUT}`)
  console.log(`- 同步报告: ${REPORT_OUTPUT}`)
}

if (require.main === module) {
  main().catch((error) => {
    console.error('动作内容同步失败:', error)
    process.exitCode = 1
  })
}

module.exports = {
  normalizeSourcePayload,
  getNextPageUrl,
  normalizeExerciseDbExercise,
  normalizeWgerExercise,
  normalizeSourceExercise,
  mergeExerciseRecords,
  mergeSourceRecords,
  buildNormalizedRecords,
  getActiveSourceConfigs,
  loadEnvFile,
  main
}
