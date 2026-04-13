Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'home' },
      { pagePath: '/pages/training/training', text: '训练', icon: 'training' },
      { pagePath: '/pages/exercises/exercises', text: '动作库', icon: 'exercises' },
      { pagePath: '/pages/diet/diet', text: '饮食', icon: 'diet' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'profile' }
    ]
  },

  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    }
  }
})
