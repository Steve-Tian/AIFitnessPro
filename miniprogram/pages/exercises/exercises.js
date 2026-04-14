const {
  getExerciseLibrary,
  loadExerciseLibrary,
  getExerciseRuntimeMeta,
  CATEGORY_LABELS
} = require('../../utils/exercise-library')

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
    exercises: [],
    isLoading: false,
    librarySourceLabel: '内置种子库'
  },

  async onLoad() {
    await this.applyFilters()
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 2 })
    }
  },

  async applyFilters() {
    const filterOptions = {
      category: this.data.selectedCategory,
      keyword: this.data.keyword
    }

    const seededExercises = getExerciseLibrary(filterOptions)
    this.setData({
      exercises: seededExercises,
      isLoading: true,
      librarySourceLabel: '内置种子库'
    })

    const exercises = await loadExerciseLibrary(filterOptions)
    const runtimeMeta = getExerciseRuntimeMeta()

    this.setData({
      exercises,
      isLoading: false,
      librarySourceLabel: runtimeMeta.sourceLabel || '自有动作库'
    })
  },

  handleKeywordInput(e) {
    this.setData({
      keyword: e.detail.value || ''
    }, async () => {
      await this.applyFilters()
    })
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category || 'all'
    this.setData({
      selectedCategory: category
    }, async () => {
      await this.applyFilters()
    })
  },

  openExerciseDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    wx.navigateTo({
      url: `/pages/exercise-detail/exercise-detail?id=${id}`
    })
  }
})
