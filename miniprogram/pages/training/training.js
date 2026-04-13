const app = getApp()

Page({
  data: {
    currentExerciseIndex: 0,
    currentSet: 1,
    totalSets: 3,
    countdown: 10, // 倒计时秒数
    isCountingDown: false,
    isResting: false,
    exercise: {},
    plan: [],
    rpeValue: 6, // RPE评分（6-10）
    showRPESelector: false
  },

  onLoad(options) {
    // 从首页传入的计划数据
    if (options.plan) {
      this.setData({
        plan: JSON.parse(options.plan),
        exercise: this.getCurrentExercise()
      })
    } else {
      // 如果没有传入计划，尝试获取当前用户的计划
      this.loadCurrentPlan()
    }
  },

  async loadCurrentPlan() {
    try {
      const db = wx.cloud.database()
      if (!app.globalData.userInfo?.current_plan_id) {
        wx.showToast({ title: '请先生成训练计划', icon: 'none' })
        return
      }

      const { data } = await db.collection('plans').doc(app.globalData.userInfo.current_plan_id).get()
      if (data && data.weeklyPlan) {
        const today = new Date().toISOString().split('T')[0]
        const todayPlan = data.weeklyPlan.find(d => 
          new Date(d.date).toISOString().split('T')[0] === today
        )
        
        if (todayPlan && todayPlan.workout) {
          this.setData({
            plan: todayPlan.workout,
            exercise: todayPlan.workout[0]
          })
        } else {
          wx.showToast({ title: '今日无训练计划', icon: 'none' })
        }
      }
    } catch (err) {
      console.error('加载计划失败：', err)
      wx.showToast({ title: '加载计划失败', icon: 'none' })
    }
  },

  getCurrentExercise() {
    const { plan, currentExerciseIndex } = this.data
    return plan[currentExerciseIndex] || {}
  },

  // 开始当前动作
  startExercise() {
    const exercise = this.getCurrentExercise()
    if (!exercise) {
      wx.showToast({ title: '训练已完成！', icon: 'none' })
      return
    }

    this.setData({
      totalSets: exercise.sets || 3,
      currentSet: 1
    })

    // 开始倒计时
    this.startCountdown()
  },

  // 开始倒计时
  startCountdown() {
    const exercise = this.getCurrentExercise()
    if (!exercise) return

    this.setData({ isCountingDown: true })
    this.countdownInterval = setInterval(() => {
      this.setData({
        countdown: this.data.countdown - 1
      })

      if (this.data.countdown <= 0) {
        this.endCountdown()
      }
    }, 1000)
  },

  // 结束倒计时
  endCountdown() {
    clearInterval(this.countdownInterval)
    this.setData({
      isCountingDown: false,
      countdown: exercise.rest || 90
    })

    // 开始休息倒计时
    this.startRestTimer()
  },

  // 休息倒计时
  startRestTimer() {
    this.setData({ isResting: true })
    this.restInterval = setInterval(() => {
      this.setData({
        countdown: this.data.countdown - 1
      })

      if (this.data.countdown <= 0) {
        this.endRest()
      }
    }, 1000)
  },

  // 结束休息
  endRest() {
    clearInterval(this.restInterval)
    this.setData({
      isResting: false,
      currentSet: this.data.currentSet + 1
    })

    // 检查是否完成当前动作的所有组数
    if (this.data.currentSet > this.data.totalSets) {
      this.nextExercise()
    } else {
      // 继续下一组
      this.startCountdown()
    }
  },

  // 进入下一动作
  nextExercise() {
    const nextIndex = this.data.currentExerciseIndex + 1
    if (nextIndex < this.data.plan.length) {
      this.setData({
        currentExerciseIndex: nextIndex,
        currentSet: 1,
        countdown: 10,
        exercise: this.getCurrentExercise()
      })
      this.startExercise()
    } else {
      // 训练完成
      this.showRPESelection()
    }
  },

  // 显示RPE选择器
  showRPESelection() {
    this.setData({ showRPESelector: true })
  },

  // 隐藏RPE选择器
  hideRPESelector() {
    this.setData({ showRPESelector: false })
  },

  // 选择RPE评分
  selectRPE(e) {
    const rpe = parseInt(e.currentTarget.dataset.rpe)
    this.setData({ rpeValue: rpe })
  },

  // 提交训练反馈
  async submitFeedback() {
    this.setData({ showRPESelector: false })

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'saveFeedback',
        data: {
          planId: app.globalData.userInfo.current_plan_id,
          exerciseIndex: this.data.currentExerciseIndex,
          rpe: this.data.rpeValue,
          completedAt: new Date()
        }
      })

      if (result.success) {
        wx.showToast({ title: '训练完成！', icon: 'success' })
        
        // 更新连续打卡天数
        const newStreak = (app.globalData.userInfo.streak_days || 0) + 1
        app.globalData.userInfo.streak_days = newStreak
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({ title: result.message || '提交失败', icon: 'none' })
      }
    } catch (err) {
      console.error('提交反馈失败：', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    }
  },

  // 跳过当前动作
  skipExercise() {
    this.nextExercise()
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  onUnload() {
    // 清理定时器
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
    }
    if (this.restInterval) {
      clearInterval(this.restInterval)
    }
  }
})