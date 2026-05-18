const app = getApp()

const DAY_TYPE_LABELS = {
  push: '推日',
  pull: '拉日',
  legs: '腿日',
  upper: '上肢',
  lower: '下肢',
  full: '全身'
}

const SHARE_CANVAS_W = 375
const SHARE_CANVAS_H = 480

Page({
  data: {
    hasData: false,
    workoutDate: '',
    dayTypeLabel: '',
    durationMin: 0,
    totalExercises: 0,
    totalSets: 0,
    totalReps: 0,
    totalVolume: 0,
    estimatedKcal: 0,
    perExercise: [],
    newStreak: 0,
    unlockedAchievements: [],
    highlights: []
  },

  onLoad() {
    const summary = app.globalData.lastTrainingSummary
    if (!summary) {
      this.setData({ hasData: false })
      return
    }

    const rawPer = Array.isArray(summary.perExercise) ? summary.perExercise : []
    const perExercise = rawPer.map((row, i) => ({
      ...row,
      _rowKey: `${(row && row.name) || 'ex'}_${i}`
    }))

    // 构建进步亮点（与上次同动作对比）
    const highlights = this.buildHighlights(perExercise, summary)

    this.setData({
      hasData: true,
      workoutDate: summary.workoutDate || '',
      dayTypeLabel: DAY_TYPE_LABELS[summary.dayType] || summary.dayType || '训练',
      durationMin: summary.durationMin || 0,
      totalExercises: summary.totalExercises || 0,
      totalSets: summary.totalSets || 0,
      totalReps: summary.totalReps || 0,
      totalVolume: summary.totalVolume || 0,
      estimatedKcal: summary.estimatedKcal || 0,
      perExercise,
      newStreak: summary.newStreak || 0,
      unlockedAchievements: Array.isArray(summary.unlockedAchievements) ? summary.unlockedAchievements : [],
      highlights
    })
  },

  /**
   * 构建进步亮点
   * 对比当前训练与上次同动作的反馈，找出正向变化
   */
  buildHighlights(perExercise, summary) {
    const highlights = []
    const user = app.globalData.userInfo || {}
    const adjustments = user.exercise_adjustments || {}

    // 连续打卡亮点
    const streak = summary.newStreak || user.streak_days || 0
    if (streak >= 3) {
      highlights.push({ type: 'streak', text: `连续训练第 ${streak} 天` })
    }

    // 每个动作与上次对比
    perExercise.forEach((ex) => {
      const name = (ex && ex.name) || ''
      if (!name) return

      const key = name.trim().toLowerCase()
      const adj = adjustments[key]

      if (adj && adj.trend === 'easy' && adj.loadAdjustment > 0) {
        const delta = adj.nextWeight - (Number(adj.nextWeight) / (1 + adj.loadAdjustment))
        if (delta > 0) {
          highlights.push({
            type: 'weight_up',
            text: `${name}比上次重了 ${delta.toFixed(1)}kg`
          })
        } else {
          highlights.push({
            type: 'progress',
            text: `${name}反馈轻松，下次加重`
          })
        }
      }
    })

    // 容量亮点
    const totalVol = summary.totalVolume || 0
    if (totalVol >= 10000) {
      highlights.push({ type: 'volume', text: `总训练量突破 ${Math.round(totalVol / 1000)}吨` })
    }

    return highlights.slice(0, 5)
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  goTraining() {
    wx.switchTab({ url: '/pages/training/training' })
  },

  goAchievements() {
    wx.navigateTo({ url: '/pages/achievements/achievements' })
  },

  onShareAppMessage() {
    const d = this.data
    if (!d.hasData) {
      return {
        title: 'AIFitnessPro — 一起科学训练',
        path: '/pages/index/index'
      }
    }
    return {
      title: `刚练完 ${d.dayTypeLabel}，${d.durationMin} 分钟 · AIFitnessPro`,
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    const d = this.data
    if (!d.hasData) {
      return { title: 'AIFitnessPro — 科学训练与饮食助手' }
    }
    return {
      title: `${d.dayTypeLabel} ${d.durationMin} 分钟训练打卡 · AIFitnessPro`
    }
  },

  saveSharePoster() {
    if (!this.data.hasData) {
      wx.showToast({ title: '暂无训练数据', icon: 'none' })
      return
    }
    wx.showLoading({ title: '生成中...', mask: true })
    this._drawSharePoster((err, tempPath) => {
      wx.hideLoading()
      if (err || !tempPath) {
        wx.showToast({ title: '生成失败，请重试', icon: 'none' })
        return
      }
      wx.saveImageToPhotosAlbum({
        filePath: tempPath,
        success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
        fail: (e) => {
          const msg = (e && e.errMsg) || ''
          if (msg.indexOf('auth deny') !== -1 || msg.indexOf('authorize') !== -1) {
            wx.showModal({
              title: '需要相册权限',
              content: '保存分享图需要授权写入相册，请在设置中开启。',
              confirmText: '去设置',
              success: (r) => {
                if (r.confirm) wx.openSetting({})
              }
            })
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' })
          }
        }
      })
    })
  },

  _drawSharePoster(done) {
    const d = this.data
    const ctx = wx.createCanvasContext('summaryShareCanvas', this)
    const W = SHARE_CANVAS_W
    const H = SHARE_CANVAS_H

    const grd = ctx.createLinearGradient(0, 0, W, H)
    grd.addColorStop(0, '#667eea')
    grd.addColorStop(1, '#764ba2')
    ctx.setFillStyle(grd)
    ctx.fillRect(0, 0, W, H)

    ctx.setFillStyle('#ffffff')
    ctx.setFontSize(26)
    ctx.setTextAlign('center')
    ctx.fillText('训练完成', W / 2, 72)

    ctx.setFontSize(16)
    ctx.setFillStyle('rgba(255,255,255,0.92)')
    ctx.fillText(`${d.workoutDate} · ${d.dayTypeLabel}`, W / 2, 108)

    ctx.setFontSize(18)
    ctx.setFillStyle('#ffffff')
    ctx.fillText(`${d.durationMin} 分钟 · ${d.totalExercises} 个动作 · ${d.totalSets} 组`, W / 2, 168)
    ctx.fillText(`约 ${d.estimatedKcal} 千卡`, W / 2, 200)

    let y = 238
    if (d.totalVolume > 0) {
      ctx.fillText(`总训练量 ${d.totalVolume} kg`, W / 2, y)
      y += 32
    }
    if (d.newStreak > 0) {
      ctx.fillText(`连续打卡 ${d.newStreak} 天`, W / 2, y)
      y += 32
    }

    ctx.setFontSize(13)
    ctx.setFillStyle('rgba(255,255,255,0.78)')
    ctx.fillText('AIFitnessPro · 科学训练', W / 2, H - 36)

    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'summaryShareCanvas',
        width: W,
        height: H,
        destWidth: W * 2,
        destHeight: H * 2,
        success: (res) => done(null, res.tempFilePath),
        fail: (e) => done(e || new Error('canvasToTempFilePath failed'))
      }, this)
    })
  }
})
