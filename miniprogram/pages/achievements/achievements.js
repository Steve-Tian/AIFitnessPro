const app = getApp()

Page({
  data: {
    achievements: [],
    totalPoints: 0,
    loading: true,
    unlockedAchievementCount: 0
  },

  onLoad() {
    this.loadAchievements()
  },

  async loadAchievements() {
    this.setData({ loading: true })

    try {
      const openid = app.globalData.openid
      if (!openid) {
        this.setData({ loading: false })
        return
      }

      const db = wx.cloud.database()
      const userDoc = await db.collection('users').where({
        _openid: openid
      }).get()

      const user = userDoc.data.length > 0 ? userDoc.data[0] : null
      const userAchievements = (user && user.achievements) || []
      const totalPoints = (user && user.total_points) || 0

      const allAchievements = [
        {
          id: 'first_workout',
          name: '初次体验',
          description: '完成第一次训练',
          points: 10,
          icon: '💪',
          unlocked: userAchievements.includes('first_workout')
        },
        {
          id: 'week_streak',
          name: '一周连击',
          description: '连续打卡7天',
          points: 50,
          icon: '🔥',
          unlocked: userAchievements.includes('week_streak')
        },
        {
          id: 'month_streak',
          name: '月度强者',
          description: '连续打卡30天',
          points: 200,
          icon: '🏆',
          unlocked: userAchievements.includes('month_streak')
        },
        {
          id: 'perfect_rpe',
          name: '精准感知',
          description: '单次训练RPE达到10分',
          points: 30,
          icon: '🎯',
          unlocked: userAchievements.includes('perfect_rpe')
        },
        {
          id: 'heavy_lifter',
          name: '重装上阵',
          description: '累计训练时长超过50小时',
          points: 100,
          icon: '🏋️',
          unlocked: userAchievements.includes('heavy_lifter')
        },
        {
          id: 'diversity_master',
          name: '全面达人',
          description: '完成所有训练分类（推/拉/腿）',
          points: 80,
          icon: '💯',
          unlocked: userAchievements.includes('diversity_master')
        },
        {
          id: 'early_bird',
          name: '早起鸟儿',
          description: '早上6点前完成训练',
          points: 20,
          icon: '🌅',
          unlocked: userAchievements.includes('early_bird')
        }
      ]

      const unlockedCount = allAchievements.filter((a) => a.unlocked).length

      this.setData({
        achievements: allAchievements,
        totalPoints,
        unlockedAchievementCount: unlockedCount,
        loading: false
      })
    } catch (err) {
      console.error('加载成就失败：', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 检查新成就
  async checkNewAchievements() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'unlockAchievement'
      })

      if (result && result.success) {
        const unlocked = Array.isArray(result.unlocked) ? result.unlocked : []
        if (unlocked.length > 0) {
          wx.showToast({
            title: `解锁${unlocked.length}个新成就！`,
            icon: 'success'
          })
          this.loadAchievements()
        } else {
          wx.showToast({ title: '暂无新成就', icon: 'none' })
        }
      } else {
        wx.showToast({ title: (result && result.message) || '检查失败', icon: 'none' })
      }
    } catch (err) {
      console.error('检查成就失败：', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  }
})