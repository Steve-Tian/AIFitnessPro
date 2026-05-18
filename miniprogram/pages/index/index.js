const app = getApp()

const { PERSONA_LABEL } = require('../../utils/shared')

/**
 * 分页查询云数据库集合（绕过小程序端 .get() 默认 20 条限制）
 */
async function queryAll(collection, where = {}) {
  const MAX_LIMIT = 20
  const { data: firstPage } = await collection.where(where).limit(MAX_LIMIT).get()
  if (firstPage.length < MAX_LIMIT) return firstPage

  let results = firstPage
  let offset = MAX_LIMIT
  while (true) {
    const { data: page } = await collection.where(where).skip(offset).limit(MAX_LIMIT).get()
    results = results.concat(page)
    if (page.length < MAX_LIMIT) break
    offset += MAX_LIMIT
  }
  return results
}

function getWelcomeLabel(user) {
  const persona = user && user.profile ? user.profile.persona : ''
  return PERSONA_LABEL[persona] || '健身伙伴'
}

function cacheWeeklyPlan(plan) {
  app.globalData.currentWeeklyPlan = Array.isArray(plan) ? plan : null
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
      const currentUser = app.globalData.userInfo
      
      if (!currentUser || !currentUser.current_plan_id) {
        cacheWeeklyPlan(null)
        this.setData({ weeklyPlan: null })
        return
      }

      if (Array.isArray(app.globalData.currentWeeklyPlan) && app.globalData.currentWeeklyPlan.length > 0) {
        this.setData({ weeklyPlan: app.globalData.currentWeeklyPlan })
        return
      }

      const { result } = await wx.cloud.callFunction({
        name: 'getPlan',
        data: {
          planId: currentUser.current_plan_id
        }
      })

      if (result && result.success && Array.isArray(result.weeklyPlan)) {
        cacheWeeklyPlan(result.weeklyPlan)
        this.setData({ weeklyPlan: result.weeklyPlan })
      } else {
        cacheWeeklyPlan(null)
        this.setData({ weeklyPlan: null })
      }
    } catch (err) {
      console.error('Load plan error:', err)
      cacheWeeklyPlan(null)
      this.setData({ weeklyPlan: null })
    }
  },

  async generatePlan() {
    if (this.data.generatingPlan) return
    if (!app.globalData.userInfo) {
      wx.showToast({ title: '用户信息加载中，请稍后重试', icon: 'none' })
      return
    }

    this.setData({ generatingPlan: true })

    try {
      const { result } = await wx.cloud.callFunction({ name: 'genPlan' })
      
      if (result && result.success) {
        wx.showToast({ title: '计划生成成功！', icon: 'success' })
        cacheWeeklyPlan(result.weeklyPlan)
        this.setData({ 
          weeklyPlan: result.weeklyPlan,
          generatingPlan: false 
        })
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          current_plan_id: result.planId
        }
      } else {
        wx.showToast({ title: (result && result.message) || '生成失败', icon: 'none' })
        this.setData({ generatingPlan: false })
      }
    } catch (err) {
      console.error('Generate plan error:', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      this.setData({ generatingPlan: false })
    }
  },

  async resetAllData() {
    const { confirm } = await new Promise((resolve) => {
      wx.showModal({
        title: '确认重置',
        content: '将删除你的所有数据（用户信息、训练计划、反馈记录），回到初始引导流程。此操作不可撤销。',
        confirmText: '确认重置',
        confirmColor: '#e53e3e',
        success: resolve,
        fail: () => resolve({ confirm: false })
      })
    })
    if (!confirm) return

    wx.showLoading({ title: '正在重置...' })
    try {
      const db = wx.cloud.database()
      const openid = app.globalData.openid
      if (!openid) {
        wx.hideLoading()
        wx.showToast({ title: '用户信息未就绪', icon: 'none' })
        return
      }

      const users = await queryAll(db.collection('users'), { _openid: openid })
      for (const doc of users) {
        await db.collection('users').doc(doc._id).remove()
      }

      const plans = await queryAll(db.collection('plans'), { _openid: openid })
      for (const doc of plans) {
        await db.collection('plans').doc(doc._id).remove()
      }

      try {
        const feedbackDocs = await queryAll(db.collection('feedback'), { _openid: openid })
        for (const doc of feedbackDocs) {
          await db.collection('feedback').doc(doc._id).remove()
        }
      } catch (e) { /* feedback 集合可能不存在 */ }

      try {
        const achievementLogs = await queryAll(db.collection('achievement_logs'), { _openid: openid })
        for (const doc of achievementLogs) {
          await db.collection('achievement_logs').doc(doc._id).remove()
        }
      } catch (e) { /* achievement_logs 集合可能不存在 */ }

      app.globalData.userInfo = null
      app.globalData.currentWeeklyPlan = null
      app.globalData.selectedWorkoutDay = null
      app.globalData.pendingWorkoutDate = ''

      wx.hideLoading()
      wx.showToast({ title: '已重置', icon: 'success', duration: 1500 })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/onboarding/onboarding' })
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      console.error('重置失败：', err)
      wx.showToast({ title: '重置失败，请重试', icon: 'none' })
    }
  },

  goAchievements() {
    wx.navigateTo({ url: '/pages/achievements/achievements' })
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
      wx.showToast({ title: day.note || '当前无可用训练内容', icon: 'none' })
      return
    }

    app.globalData.selectedWorkoutDay = {
      date: day.date,
      type: day.type,
      title: day.title,
      workout: day.workout,
      warmup: day.warmup || [],
      cooldown: day.cooldown || [],
      adaptive_notes: day.adaptive_notes || []
    }
    app.globalData.pendingWorkoutDate = day.date || ''
    cacheWeeklyPlan(weeklyPlan)

    wx.switchTab({ url: '/pages/training/training' })
  }
})
