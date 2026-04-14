App({
  globalData: {
    openid: null,
    userInfo: null,
    currentWeeklyPlan: null,
    selectedWorkoutDay: null,
    pendingWorkoutDate: ''
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: 'cloud1-6g1a5yel097ba48d',
      traceUser: true
    })

    this.login()
  },

  async login() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'login' })
      this.globalData.openid = result.openid

      const db = wx.cloud.database()
      const { data } = await db.collection('users').where({
        _openid: result.openid
      }).get()

      if (data.length > 0 && data[0].onboarding_completed) {
        this.globalData.userInfo = data[0]
        if (this._userInfoReadyCallback) {
          this._userInfoReadyCallback(data[0])
        }
      } else {
        wx.reLaunch({ url: '/pages/onboarding/onboarding' })
      }
    } catch (err) {
      console.error('登录失败：', err)
    }
  }
})
