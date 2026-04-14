const {
  getExerciseById,
  getExerciseByKey,
  loadExerciseById,
  loadExerciseByKey,
  getExerciseRuntimeMeta,
  DEFAULT_EXERCISE_IMAGE
} = require('../../utils/exercise-library')

Page({
  data: {
    exercise: null,
    isRefreshing: false,
    sourceLabel: '内置种子库'
  },

  async onLoad(options) {
    const exerciseId = options.id || ''
    const exerciseName = options.name ? decodeURIComponent(options.name) : ''
    const fallbackExercise = getExerciseById(exerciseId) || getExerciseByKey(exerciseName)

    if (fallbackExercise) {
      this.setData({
        exercise: fallbackExercise,
        sourceLabel: fallbackExercise.sourceLabel || '内置种子库',
        isRefreshing: true
      })
      wx.setNavigationBarTitle({
        title: fallbackExercise.name_cn
      })
    }

    const exercise = await loadExerciseById(exerciseId) || await loadExerciseByKey(exerciseName)

    if (!exercise) {
      wx.showToast({ title: '动作详情不存在', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1200)
      return
    }

    const runtimeMeta = getExerciseRuntimeMeta()
    this.setData({
      exercise,
      isRefreshing: false,
      sourceLabel: exercise.sourceLabel || runtimeMeta.sourceLabel || '自有动作库'
    })
    wx.setNavigationBarTitle({
      title: exercise.name_cn
    })
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
