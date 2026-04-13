const app = getApp()

Page({
  data: {
    userInfo: null,
    weeklyPlan: null,
    generatingPlan: false
  },

  onLoad() {
    console.log('Index page loaded')
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
    console.log('Index page shown')
    if (app.globalData.userInfo) {
      this.applyUser(app.globalData.userInfo)
      this.loadWeeklyPlan()
    }
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 0 })
    }
  },

  applyUser(user) {
    const streak = user && typeof user.streak_days === 'number' ? user.streak_days : 0
    this.setData({
      userInfo: user || null,
      streakDays: streak
    })
    console.log('User applied:', user)
  },

  async loadWeeklyPlan() {
    try {
      console.log('Loading weekly plan...')
      const db = wx.cloud.database()
      
      if (!app.globalData.userInfo?.current_plan_id) {
        console.log('No current_plan_id found')
        this.setData({ weeklyPlan: null })
        return
      }

      console.log('Plan ID:', app.globalData.userInfo.current_plan_id)
      
      const result = await db.collection('plans').doc(app.globalData.userInfo.current_plan_id).get()
      console.log('DB result:', result)
      
      if (result.data && result.data.weeklyPlan) {
        console.log('Weekly plan loaded:', result.data.weeklyPlan)
        this.setData({ weeklyPlan: result.data.weeklyPlan })
      } else {
        console.log('No plan data found')
        this.setData({ weeklyPlan: null })
      }
    } catch (err) {
      console.error('Load plan error:', err)
      this.setData({ weeklyPlan: null })
    }
  },

  async generatePlan() {
    console.log('Generate plan clicked')
    if (this.data.generatingPlan) return
    this.setData({ generatingPlan: true })

    try {
      const { result } = await wx.cloud.callFunction({ name: 'genPlan' })
      console.log('GenPlan result:', result)
      
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
      console.error('Generate plan error:', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      this.setData({ generatingPlan: false })
    }
  }
})