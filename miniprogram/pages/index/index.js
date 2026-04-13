const app = getApp()

Page({
  data: {
    userInfo: null,
    weeklyPlan: null,
    generatingPlan: false,
    showDebug: false,  // 添加调试开关
    debugInfo: ''      // 添加调试信息
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
      streakDays: streak
    })
  },

  async loadWeeklyPlan() {
    try {
      const db = wx.cloud.database()
      if (!app.globalData.userInfo?.current_plan_id) {
        this.setData({ weeklyPlan: null })
        return
      }

      console.log('尝试加载计划ID:', app.globalData.userInfo.current_plan_id)
      
      const result = await db.collection('plans').doc(app.globalData.userInfo.current_plan_id).get()
      console.log('数据库查询结果:', result)
      
      if (result.data && result.data.weeklyPlan) {
        console.log('加载到的计划数据:', result.data.weeklyPlan)
        this.setData({ 
          weeklyPlan: result.data.weeklyPlan,
          debugInfo: `成功加载计划，共${result.data.weeklyPlan.length}天`
        })
      } else {
        console.log('未找到计划数据')
        this.setData({ 
          weeklyPlan: null,
          debugInfo: '未找到计划数据或数据结构异常'
        })
      }
    } catch (err) {
      console.error('加载计划失败：', err)
      this.setData({ 
        weeklyPlan: null,
        debugInfo: '加载失败: ' + err.message
      })
    }
  },

  async generatePlan() {
    if (this.data.generatingPlan) return
    this.setData({ generatingPlan: true })

    try {
      console.log('调用genPlan云函数...')
      const { result } = await wx.cloud.callFunction({ name: 'genPlan' })
      console.log('云函数返回结果:', result)
      
      if (result.success) {
        wx.showToast({ title: '计划生成成功！', icon: 'success' })
        this.setData({ 
          weeklyPlan: result.weeklyPlan,
          generatingPlan: false,
          debugInfo: `生成成功，共${result.weeklyPlan.length}天计划`
        })
        
        // 更新全局状态
        app.globalData.userInfo.current_plan_id = result.planId
      } else {
        wx.showToast({ title: result.message || '生成失败', icon: 'none' })
        this.setData({ 
          generatingPlan: false,
          debugInfo: '生成失败: ' + result.message
        })
      }
    } catch (err) {
      console.error('调用云函数失败：', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      this.setData({ 
        generatingPlan: false,
        debugInfo: '网络错误: ' + err.message
      })
    }
  },

  toggleDebug() {
    this.setData({
      showDebug: !this.data.showDebug
    })
  }
})