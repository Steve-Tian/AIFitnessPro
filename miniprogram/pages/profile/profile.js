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

const GOAL_LABEL = {
  bulk: '增肌',
  cut: '减脂',
  strength: '力量提升'
}

const EXP_LABEL = {
  beginner: '纯新手',
  casual: '练过但不规律',
  intermediate: '规律训练半年+',
  advanced: '规律训练两年+'
}

const PERSONA_AVATAR = {
  coach: '教',
  buddy: '兄',
  bro: '兄',
  comedian: '趣',
  roast: '趣',
  beauty_coach: '美'
}

const PERSONA_OPTIONS = ['coach', 'buddy', 'comedian']
const FEEDBACK_MODE_OPTIONS = ['standard', 'rpe', 'minimal']

function personaFirstChar(profile) {
  if (!profile || !profile.persona) return '我'
  const p = String(profile.persona)
  if (!p.length) return '我'
  return PERSONA_AVATAR[p] || '我'
}

function formatProfile(userDoc) {
  const profile = userDoc && userDoc.profile
  if (!profile) {
    return { avatarChar: '我', goalText: '--', experienceText: '--', daysText: '--' }
  }
  return {
    avatarChar: personaFirstChar(profile),
    goalText: GOAL_LABEL[profile.goal] || '--',
    experienceText: EXP_LABEL[profile.experience] || '--',
    daysText: profile.days_per_week != null ? `${profile.days_per_week} 天/周` : '--'
  }
}

Page({
  data: {
    userInfo: null,
    avatarChar: '我',
    goalText: '--',
    experienceText: '--',
    daysText: '--',
    // 训练统计
    streakDays: 0,
    totalWorkouts: 0,
    totalVolume: 0,
    // 设置项
    personaLabel: '暖男兄弟',
    feedbackMode: 'standard',
    feedbackModeLabel: '标准三按钮',
    minimalMode: false,
    showPersonaPicker: false,
    showFeedbackModePicker: false
  },

  applyUser(user) {
    const f = formatProfile(user)
    const profile = user && user.profile
    const persona = profile ? profile.persona : ''
    const feedbackMode = (user && user.feedback_mode) || 'standard'

    this.setData({
      userInfo: user,
      avatarChar: f.avatarChar,
      goalText: f.goalText,
      experienceText: f.experienceText,
      daysText: f.daysText,
      streakDays: (user && user.streak_days) || 0,
      personaLabel: PERSONA_LABEL[persona] || '暖男兄弟',
      feedbackMode,
      feedbackModeLabel: this.getFeedbackModeLabel(feedbackMode),
      minimalMode: feedbackMode === 'minimal'
    })
  },

  getFeedbackModeLabel(mode) {
    const labels = {
      standard: '标准三按钮',
      rpe: 'RPE 数字评分',
      minimal: '极简模式'
    }
    return labels[mode] || '标准三按钮'
  },

  onLoad() {
    if (app.globalData.userInfo) {
      this.applyUser(app.globalData.userInfo)
      this.loadTrainingStats()
    } else {
      app._userInfoReadyCallback = (userInfo) => {
        this.applyUser(userInfo)
        this.loadTrainingStats()
      }
    }
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.applyUser(app.globalData.userInfo)
      this.loadTrainingStats()
    }
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 4 })
    }
  },

  async loadTrainingStats() {
    const openid = app.globalData.openid
    if (!openid) return

    try {
      const db = wx.cloud.database()
      const feedbackList = await queryAll(db.collection('feedback'), { _openid: openid })

      let totalVolume = 0

      feedbackList.forEach((fb) => {
        const exerciseFeedback = Array.isArray(fb.exerciseFeedback) ? fb.exerciseFeedback : []
        exerciseFeedback.forEach((ef) => {
          const sets = Number(ef.sets) || 3
          const reps = Number(ef.reps) || 8
          const weight = Number(ef.currentWeight) || 0
          totalVolume += sets * reps * weight
        })
      })

      this.setData({
        totalWorkouts: feedbackList.length,
        totalVolume: Math.round(totalVolume)
      })
    } catch (err) {
      console.warn('加载训练统计失败：', err)
    }
  },

  goAchievements() {
    wx.navigateTo({ url: '/pages/achievements/achievements' })
  },

  // ===== 设置功能 =====

  showPersonaOptions() {
    this.setData({ showPersonaPicker: true })
  },

  hidePersonaPicker() {
    this.setData({ showPersonaPicker: false })
  },

  async selectPersona(e) {
    const persona = e.currentTarget.dataset.value
    if (!persona || !app.globalData.userInfo) return

    this.setData({ showPersonaPicker: false })

    try {
      const db = wx.cloud.database()
      await db.collection('users').where({ _openid: app.globalData.openid }).update({
        data: {
          'profile.persona': persona,
          updated_at: db.serverDate()
        }
      })

      app.globalData.userInfo.profile.persona = persona
      this.setData({
        personaLabel: PERSONA_LABEL[persona] || persona,
        avatarChar: personaFirstChar(app.globalData.userInfo.profile)
      })
      wx.showToast({ title: '已切换搭子风格', icon: 'success' })
    } catch (err) {
      console.error('切换搭子风格失败：', err)
      wx.showToast({ title: '切换失败', icon: 'none' })
    }
  },

  showFeedbackModeOptions() {
    this.setData({ showFeedbackModePicker: true })
  },

  hideFeedbackModePicker() {
    this.setData({ showFeedbackModePicker: false })
  },

  async selectFeedbackMode(e) {
    const mode = e.currentTarget.dataset.value
    if (!mode || !app.globalData.userInfo) return

    this.setData({ showFeedbackModePicker: false })

    try {
      const db = wx.cloud.database()
      await db.collection('users').where({ _openid: app.globalData.openid }).update({
        data: {
          feedback_mode: mode,
          updated_at: db.serverDate()
        }
      })

      app.globalData.userInfo.feedback_mode = mode
      this.setData({
        feedbackMode: mode,
        feedbackModeLabel: this.getFeedbackModeLabel(mode),
        minimalMode: mode === 'minimal'
      })
      wx.showToast({ title: '已切换反馈模式', icon: 'success' })
    } catch (err) {
      console.error('切换反馈模式失败：', err)
      wx.showToast({ title: '切换失败', icon: 'none' })
    }
  },

  async retakeOnboarding() {
    const { confirm } = await new Promise((resolve) => {
      wx.showModal({
        title: '重新填写问卷',
        content: '将重新进入引导流程，可更新你的训练目标、器械等信息。当前训练计划不受影响。',
        confirmText: '继续',
        confirmColor: '#6C5CE7',
        success: resolve,
        fail: () => resolve({ confirm: false })
      })
    })
    if (!confirm) return
    wx.navigateTo({ url: '/pages/onboarding/onboarding' })
  },

  onSettingsPlaceholder(e) {
    const key = e.currentTarget.dataset.key
    const title = key === 'notify' ? '通知与提醒' : '账号与隐私'
    wx.showModal({
      title,
      content: '该功能即将上线，敬请期待。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  onAbout() {
    wx.showModal({
      title: '关于 AIFitnessPro',
      content: 'AI 辅助的健身训练小程序 v1.0\n\n训练计划、饮食建议与成就系统均为辅助参考，请根据自身情况量力而行。如有不适请及时就医。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
