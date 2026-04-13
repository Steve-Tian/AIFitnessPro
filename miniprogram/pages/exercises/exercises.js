Page({
  data: {
    groups: ['胸', '背', '肩', '腿', '手臂', '核心']
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 2 })
    }
  }
})
