const {
  getExerciseById,
  getExerciseByKey,
  loadExerciseById,
  loadExerciseByKey,
  getExerciseRuntimeMeta,
  DEFAULT_EXERCISE_IMAGE
} = require('../../utils/exercise-library')

function buildMinimalExercise(name) {
  return {
    exercise_id: '',
    name_cn: name || '未知动作',
    name_en: '',
    motto: '',
    categoryLabel: '',
    difficultyLabel: '常规难度',
    equipmentText: '按现有器械完成',
    primaryMuscles: [],
    secondaryMuscles: [],
    primaryText: '全身协调发力',
    secondaryText: '核心稳定与关节控制',
    targetSummary: '重点关注动作轨迹、核心稳定和离心控制',
    overviewText: '',
    hasGif: false,
    hasVideo: false,
    coverUrl: DEFAULT_EXERCISE_IMAGE,
    mediaUrl: DEFAULT_EXERCISE_IMAGE,
    mediaLabel: '口诀 + 步骤',
    mediaNoteText: '参考下方详细步骤进行训练。',
    mediaStatus: '待同步动图/视频',
    sourceLabel: '内置种子库',
    muscleMapUrl: '',
    heroHighlights: [],
    detailedStepCards: [
      { label: '起始位', text: '先用轻重量或徒手完成起始姿势，确认关节和身体排列稳定', isMotto: false },
      { label: '动作路径', text: '按推荐节奏完成动作全程，保持核心收紧和目标肌群主动发力', isMotto: false },
      { label: '顶峰发力', text: '每次还原都控制速度，若出现明显疼痛或动作变形请立即降强度', isMotto: false }
    ],
    instructionSteps: [],
    common_mistakes: []
  }
}

Page({
  data: {
    exercise: null,
    isLoading: true,
    loadError: '',
    isRefreshing: false,
    sourceLabel: '内置种子库'
  },

  async onLoad(options = {}) {
    const exerciseId = options.id || ''
    const exerciseName = options.name ? decodeURIComponent(options.name) : ''

    let fallbackExercise = null
    try {
      fallbackExercise = getExerciseById(exerciseId) || getExerciseByKey(exerciseName)
    } catch (err) {
      console.warn('本地动作库查询失败', err)
    }

    if (fallbackExercise) {
      this.setData({
        exercise: fallbackExercise,
        isLoading: false,
        loadError: '',
        sourceLabel: fallbackExercise.sourceLabel || '内置种子库',
        isRefreshing: true
      })
      wx.setNavigationBarTitle({ title: fallbackExercise.name_cn || '动作详情' })
    } else if (exerciseName) {
      const minimal = buildMinimalExercise(exerciseName)
      this.setData({
        exercise: minimal,
        isLoading: false,
        loadError: '',
        sourceLabel: '内置种子库',
        isRefreshing: true
      })
      wx.setNavigationBarTitle({ title: exerciseName })
    }

    try {
      const cloudExercise = await loadExerciseById(exerciseId) || await loadExerciseByKey(exerciseName)

      if (cloudExercise) {
        const merged = this.mergeWithFallback(cloudExercise, fallbackExercise)
        const runtimeMeta = getExerciseRuntimeMeta()
        this.setData({
          exercise: merged,
          isLoading: false,
          loadError: '',
          isRefreshing: false,
          sourceLabel: merged.sourceLabel || runtimeMeta.sourceLabel || '自有动作库'
        })
        wx.setNavigationBarTitle({ title: merged.name_cn })
      } else {
        const best = fallbackExercise || this.data.exercise
        this.setData({
          exercise: best || null,
          isLoading: false,
          isRefreshing: false,
          loadError: best ? '' : '动作详情加载失败，请稍后重试'
        })
        if (!best) {
          wx.showToast({ title: '动作详情不存在', icon: 'none' })
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error == null ? '' : error)
      console.warn('动作云端详情加载失败，已使用本地数据', errMsg)
      const best = fallbackExercise || this.data.exercise
      this.setData({
        exercise: best || null,
        isLoading: false,
        isRefreshing: false,
        loadError: best ? '' : '动作详情加载失败，请稍后重试'
      })
    }
  },

  mergeWithFallback(cloudExercise, fallbackExercise) {
    if (!fallbackExercise) return cloudExercise
    const cloud = cloudExercise || {}
    const local = fallbackExercise || {}
    return {
      ...local,
      ...cloud,
      motto: cloud.motto || local.motto || '',
      detailedStepCards: (cloud.detailedStepCards && cloud.detailedStepCards.length) ? cloud.detailedStepCards : local.detailedStepCards || [],
      instructionSteps: (cloud.instructionSteps && cloud.instructionSteps.length) ? cloud.instructionSteps : local.instructionSteps || [],
      heroHighlights: (cloud.heroHighlights && cloud.heroHighlights.length) ? cloud.heroHighlights : local.heroHighlights || [],
      common_mistakes: (cloud.common_mistakes && cloud.common_mistakes.length) ? cloud.common_mistakes : local.common_mistakes || [],
      mediaLabel: cloud.mediaLabel || local.mediaLabel || '口诀 + 步骤',
      mediaNoteText: cloud.mediaNoteText || local.mediaNoteText || '参考下方详细步骤进行训练。'
    }
  },

  previewMedia() {
    const exercise = this.data.exercise
    if (!exercise || exercise.hasVideo) return

    const previewUrl = exercise.hasGif ? exercise.mediaUrl : exercise.coverUrl || DEFAULT_EXERCISE_IMAGE
    wx.previewImage({
      current: previewUrl,
      urls: [previewUrl]
    })
  }
})
