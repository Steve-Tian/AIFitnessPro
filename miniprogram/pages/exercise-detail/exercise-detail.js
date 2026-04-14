const { getExerciseById, getExerciseByKey, DEFAULT_EXERCISE_IMAGE } = require('../../utils/exercise-library')

Page({
  data: {
    exercise: null
  },

  onLoad(options) {
    const exerciseId = options.id || ''
    const exerciseName = options.name ? decodeURIComponent(options.name) : ''
    const exercise = getExerciseById(exerciseId) || getExerciseByKey(exerciseName)

    if (!exercise) {
      wx.showToast({ title: '动作详情不存在', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1200)
      return
    }

    this.setData({ exercise })
    wx.setNavigationBarTitle({
      title: exercise.name_cn
    })
  },

  previewMedia() {
    const exercise = this.data.exercise
    if (!exercise) return

    const previewUrl = exercise.hasGif ? exercise.mediaUrl : exercise.coverUrl || DEFAULT_EXERCISE_IMAGE
    wx.previewImage({
      current: previewUrl,
      urls: [previewUrl]
    })
  }
})
