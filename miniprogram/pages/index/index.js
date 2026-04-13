const app = getApp()

Page({
  data: {
    userInfo: null,
    streakDays: 0
  },

  applyUser(user) {
    const streak = user && typeof user.streak_days === 'number' ? user.streak_days : 0
    this.setData({
      userInfo: user || null,
      streakDays: streak
    })
  },

  onLoad() {
    if (app.globalData.userInfo) {
      this.applyUser(app.globalData.userInfo)
    } else {
      app._userInfoReadyCallback = (userInfo) => {
        this.applyUser(userInfo)
      }
    }
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.applyUser(app.globalData.userInfo)
    }
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 0 })
    }
  }
})
