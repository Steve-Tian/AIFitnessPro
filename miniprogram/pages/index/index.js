const app = getApp()

const PERSONA_LABEL = {
  coach: '硬核教练',
  buddy: '暖男兄弟',
  bro: '暖男兄弟',
  comedian: '幽默毒舌',
  roast: '幽默毒舌',
  beauty_coach: '美女教练'
}

function getWelcomeLabel(user) {
  const persona = user && user.profile ? user.profile.persona : ''
  return PERSONA_LABEL[persona] || '健身伙伴'
}

Page({
  data: {
    userInfo: null,
    streakDays: 0,
    welcomeLabel: '健身伙伴',
    weeklyPlan: null,
    generatingPlan: false
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

  applyUser(user) {
    const streak = user && typeof user.streak_days === 'number' ? user.streak_days : 0
    this.setData({
      userInfo: user || null,
      streakDays: streak,
      welcomeLabel: getWelcomeLabel(user)
    })
  },

  async loadWeeklyPlan() {
    try {
      const db = wx.cloud.database()
      
      if (!app.globalData.userInfo?.current_plan_id) {
        this.setData({ weeklyPlan: null })
        return
      }
      
      const result = await db.collection('plans').doc(app.globalData.userInfo.current_plan_id).get()
      
      if (result.data && result.data.weeklyPlan) {
        this.setData({ weeklyPlan: result.data.weeklyPlan })
      } else {
        this.setData({ weeklyPlan: null })
      }
    } catch (err) {
      console.error('Load plan error:', err)
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
      console.error('Generate plan error:', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      this.setData({ generatingPlan: false })
    }
  },

  openPlanDay(e) {
    const { index } = e.currentTarget.dataset
    const weeklyPlan = Array.isArray(this.data.weeklyPlan) ? this.data.weeklyPlan : []
    const day = weeklyPlan[index]

    if (!day) {
      wx.showToast({ title: '训练计划加载中，请稍后重试', icon: 'none' })
      return
    }

    if (day.type === 'rest' || !Array.isArray(day.workout) || day.workout.length === 0) {
      wx.showToast({ title: day.note || '休息日无需进入训练', icon: 'none' })
      return
    }

    app.globalData.selectedWorkoutDay = {
      date: day.date,
      type: day.type,
      title: day.title,
      workout: day.workout
    }

    wx.switchTab({ url: '/pages/training/training' })
  }
})
