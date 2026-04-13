const app = getApp()

Page({
  data: {
    userInfo: null,
    streakDays: 0,
    weeklyPlan: null,
    generatingPlan: false
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
      this.loadWeeklyPlan()
    } else {
      app._userInfoReadyCallback = (userInfo) => {
        this.applyUser(userInfo)
        this.loadWeeklyPlan()
      }
    }
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.applyUser(app.globalData.userInfo)
      this.loadWeeklyPlan()
    }
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 0 })
    }
  },

  async loadWeeklyPlan() {
    try {
      const db = wx.cloud.database()
      if (!app.globalData.userInfo?.current_plan_id) {
        this.setData({ weeklyPlan: null })
        return
      }

      console.log('尝试加载计划ID:', app.globalData.userInfo.current_plan_id)
      
      const { data } = await db.collection('plans').doc(app.globalData.userInfo.current_plan_id).get()
      console.log('从数据库获取的数据:', data)
      
      if (data && data.weeklyPlan) {
        this.setData({ weeklyPlan: data.weeklyPlan })
      } else {
        console.log('未找到计划数据，计划ID可能已过期或不存在')
        this.setData({ weeklyPlan: null })
      }
    } catch (err) {
      console.error('加载计划失败：', err)
      // 如果计划不存在，设置为空值，让用户可以重新生成
      this.setData({ weeklyPlan: null })
    }
  },

  async generatePlan() {
    if (this.data.generatingPlan) return
    this.setData({ generatingPlan: true })

    try {
      const { result } = await wx.cloud.callFunction({ name: 'genPlan' })
      
      if (result.success) {
        wx.showToast({ title: '计划生成成功！', icon: 'success' })
        this.setData({ 
          weeklyPlan: result.weeklyPlan,
          generatingPlan: false 
        })
        
        // 更新全局状态
        app.globalData.userInfo.current_plan_id = result.planId
      } else {
        wx.showToast({ title: result.message || '生成失败', icon: 'none' })
        this.setData({ generatingPlan: false })
      }
    } catch (err) {
      console.error('调用云函数失败：', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      this.setData({ generatingPlan: false })
    }
  }
})
