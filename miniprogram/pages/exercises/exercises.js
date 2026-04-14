const { getExerciseLibrary, CATEGORY_LABELS } = require('../../utils/exercise-library')

Page({
  data: {
    categories: [
      { id: 'all', label: CATEGORY_LABELS.all },
      { id: 'push', label: CATEGORY_LABELS.push },
      { id: 'pull', label: CATEGORY_LABELS.pull },
      { id: 'legs', label: CATEGORY_LABELS.legs }
    ],
    selectedCategory: 'all',
    keyword: '',
    exercises: []
  },

  onLoad() {
    this.applyFilters()
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 2 })
    }
  },

  applyFilters() {
    const exercises = getExerciseLibrary({
      category: this.data.selectedCategory,
      keyword: this.data.keyword
    })

    this.setData({ exercises })
  },

  handleKeywordInput(e) {
    this.setData({
      keyword: e.detail.value || ''
    }, () => this.applyFilters())
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category || 'all'
    this.setData({
      selectedCategory: category
    }, () => this.applyFilters())
  },

  openExerciseDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    wx.navigateTo({
      url: `/pages/exercise-detail/exercise-detail?id=${id}`
    })
  }
})
