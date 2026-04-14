#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { buildExerciseSeedRecords } = require('../miniprogram/utils/exercise-library')

const OUTPUT_DIR = path.resolve(__dirname, 'output')
const NORMALIZED_OUTPUT = path.join(OUTPUT_DIR, 'exercises.normalized.json')
const REPORT_OUTPUT = path.join(OUTPUT_DIR, 'exercises.sync-report.json')
const MEDIA_OUTPUT_DIR = path.join(OUTPUT_DIR, 'exercise-media')

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

function mapBodyPartToCategory(value) {
  const normalized = String(value || '').toLowerCase()
  if (['chest', 'shoulders', 'triceps'].includes(normalized)) return 'push'
  if (['back', 'biceps', 'forearms'].includes(normalized)) return 'pull'
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

function getSourceHeaders() {
  const headers = {
    Accept: 'application/json'
  }

  if (process.env.EXERCISE_SOURCE_API_KEY) {
    headers['X-API-Key'] = process.env.EXERCISE_SOURCE_API_KEY
  }

  if (process.env.EXERCISE_SOURCE_HOST) {
    headers['X-API-Host'] = process.env.EXERCISE_SOURCE_HOST
  }

  if (process.env.EXERCISE_SOURCE_AUTHORIZATION) {
    headers.Authorization = process.env.EXERCISE_SOURCE_AUTHORIZATION
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

async function downloadFile(url, targetPath, headers) {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`媒体下载失败: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  fs.writeFileSync(targetPath, Buffer.from(arrayBuffer))
}

function resolveMediaUrl(value) {
  if (!value) return ''
  if (isHttpUrl(value)) return value

  const baseUrl = process.env.EXERCISE_SOURCE_MEDIA_BASE_URL || ''
  if (!baseUrl) return ''
  return `${baseUrl.replace(/\/$/, '')}/${String(value).replace(/^\//, '')}`
}

function normalizeSourceExercise(sourceExercise, index) {
  const sourceId = sourceExercise.exerciseId || sourceExercise.id || sourceExercise.exercise_id || `source_${index + 1}`
  const englishName = sourceExercise.name || sourceExercise.name_en || sourceExercise.englishName || sourceExercise.title || `Exercise ${index + 1}`
  const chineseName = sourceExercise.nameZh || sourceExercise.nameCN || sourceExercise.translatedName || sourceExercise.name_cn || englishName
  const targetMuscles = normalizeMuscles(sourceExercise.targetMuscles || sourceExercise.primaryMuscles || sourceExercise.target || sourceExercise.bodyParts)
  const secondaryMuscles = normalizeMuscles(sourceExercise.secondaryMuscles)
  const gifUrl = resolveMediaUrl(sourceExercise.gifUrl || sourceExercise.gif_url)
  const videoUrl = resolveMediaUrl(sourceExercise.videoUrl || sourceExercise.video_url)
  const imageUrl = resolveMediaUrl(sourceExercise.imageUrl || sourceExercise.thumbnailUrl || sourceExercise.thumbnail_url)
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
    media: {
      muscle_map_url: '',
      gif_url: gifUrl,
      video_url: videoUrl,
      thumbnail_url: imageUrl
    },
    instructions: normalizeList(sourceExercise.instructions),
    exercise_tips: normalizeList(sourceExercise.exerciseTips || sourceExercise.tips),
    common_mistakes: normalizeList(sourceExercise.commonMistakes),
    default_sets: Number(sourceExercise.defaultSets) || 3,
    default_reps: Number(sourceExercise.defaultReps) || 8,
    alternatives: normalizeList(sourceExercise.relatedExerciseIds || sourceExercise.alternatives),
    tags: Array.from(new Set(normalizeList(sourceExercise.keywords).concat(normalizeList(sourceExercise.bodyParts)).filter(Boolean))),
    source: {
      provider: process.env.EXERCISE_SOURCE_NAME || 'ExerciseDB',
      source_id: String(sourceId)
    }
  }
}

function buildCloudPath(exerciseId, type, originalUrl) {
  const extension = path.extname(originalUrl || '').replace('.', '') || (type === 'video' ? 'mp4' : 'gif')
  const prefix = (process.env.EXERCISE_CLOUD_PATH_PREFIX || 'exercise-media').replace(/^\/+|\/+$/g, '')
  return `${prefix}/${exerciseId}/${type}.${extension}`
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
    const localGif = path.join(MEDIA_OUTPUT_DIR, `${exerciseId}.gif`)
    const localThumb = path.join(MEDIA_OUTPUT_DIR, `${exerciseId}.jpg`)

    if (fs.existsSync(localGif)) {
      const cloudPath = buildCloudPath(exerciseId, 'gif', media.gif_url)
      await wxCloud.uploadFile({
        cloudPath,
        fileContent: fs.readFileSync(localGif)
      })
      media.gif_url = mediaBaseUrl ? `${mediaBaseUrl.replace(/\/$/, '')}/${cloudPath}` : cloudPath
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

async function main() {
  ensureDir(OUTPUT_DIR)
  ensureDir(MEDIA_OUTPUT_DIR)

  const sourceUrl = process.env.EXERCISE_SOURCE_URL
  const headers = getSourceHeaders()
  let normalizedRecords = []

  if (sourceUrl) {
    const payload = await requestJson(sourceUrl, headers)
    const sourceExercises = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : []

    const limit = Number(process.env.EXERCISE_SYNC_LIMIT) || sourceExercises.length
    normalizedRecords = sourceExercises.slice(0, limit).map(normalizeSourceExercise)
  } else {
    normalizedRecords = buildExerciseSeedRecords()
  }

  const shouldDownloadMedia = process.env.EXERCISE_DOWNLOAD_MEDIA === '1'
  const report = {
    source: sourceUrl || 'local-bundle-seed',
    totalRecords: normalizedRecords.length,
    downloaded: 0,
    uploaded: 0,
    synced: 0,
    generatedAt: new Date().toISOString()
  }

  if (shouldDownloadMedia) {
    for (const record of normalizedRecords) {
      const gifUrl = record.media && record.media.gif_url
      const thumbUrl = record.media && record.media.thumbnail_url

      if (isHttpUrl(gifUrl)) {
        await downloadFile(gifUrl, path.join(MEDIA_OUTPUT_DIR, `${record.exercise_id}.gif`), headers)
        report.downloaded += 1
      }

      if (isHttpUrl(thumbUrl)) {
        await downloadFile(thumbUrl, path.join(MEDIA_OUTPUT_DIR, `${record.exercise_id}.jpg`), headers)
        report.downloaded += 1
      }
    }
  }

  const uploadResult = await uploadMediaToCloud(normalizedRecords)
  report.uploaded = uploadResult.uploaded

  const syncResult = await upsertExercisesToCloud(uploadResult.records)
  report.synced = syncResult.synced

  fs.writeFileSync(NORMALIZED_OUTPUT, JSON.stringify(uploadResult.records, null, 2))
  fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(report, null, 2))

  console.log(`动作内容同步完成: ${report.totalRecords} 条`)
  console.log(`- 下载媒体: ${report.downloaded}`)
  console.log(`- 上传媒体: ${report.uploaded}`)
  console.log(`- 写入数据库: ${report.synced}`)
  console.log(`- 标准化文件: ${NORMALIZED_OUTPUT}`)
  console.log(`- 同步报告: ${REPORT_OUTPUT}`)
}

main().catch((error) => {
  console.error('动作内容同步失败:', error)
  process.exitCode = 1
})
