const { cloudEnv } = require('./config')

App({
  globalData: {
    openid: null,
    userInfo: null,
    currentWeeklyPlan: null,
    selectedWorkoutDay: null,
    pendingWorkoutDate: '',
    lastTrainingSummary: null,
    cloudEnv
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: cloudEnv,
      traceUser: true
    })

    this.login()
  },

  /**
   * 以 openid 命名空间隔离的本地存储（避免共享设备串号）
   */
  getUserStorage(key) {
    const openid = this.globalData.openid
    if (!openid) return null
    try {
      return wx.getStorageSync(`u_${openid}_${key}`) || null
    } catch (e) {
      return null
    }
  },

  setUserStorage(key, value) {
    const openid = this.globalData.openid
    if (!openid) return
    try {
      wx.setStorageSync(`u_${openid}_${key}`, value)
    } catch (e) {
      console.warn('setUserStorage 失败：', e)
    }
  },

  clearUserGlobalCache() {
    this.globalData.userInfo = null
    this.globalData.currentWeeklyPlan = null
    this.globalData.selectedWorkoutDay = null
    this.globalData.pendingWorkoutDate = ''
    this.globalData.lastTrainingSummary = null
  },

  async login() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'login' })
      const newOpenid = result && result.openid
      if (!newOpenid) {
        console.error('登录未返回 openid')
        return
      }

      // 用户切换检测：若 openid 变了就清空内存缓存
      if (this.globalData.openid && this.globalData.openid !== newOpenid) {
        this.clearUserGlobalCache()
      }
      this.globalData.openid = newOpenid

      const db = wx.cloud.database()
      const { data } = await db.collection('users').where({
        _openid: newOpenid
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
