Page({
  data: {
    userInfo: null,
    weeklyPlan: null,
    rawData: null,
    debugInfo: ''
  },

  onLoad() {
    this.loadDebugInfo()
  },

  async loadDebugInfo() {
    try {
      // 获取用户信息
      const app = getApp()
      this.setData({
        userInfo: app.globalData.userInfo
      })

      console.log('Global user info:', app.globalData.userInfo)

      if (app.globalData.userInfo?.current_plan_id) {
        console.log('Attempting to load plan ID:', app.globalData.userInfo.current_plan_id)
        
        const db = wx.cloud.database()
        const doc = await db.collection('plans').doc(app.globalData.userInfo.current_plan_id).get()
        
        console.log('Raw document data:', doc)
        
        if (doc.data) {
          this.setData({
            rawData: JSON.stringify(doc.data, null, 2),
            weeklyPlan: doc.data.weeklyPlan
          })

          // 分析计划数据
          let analysis = `计划分析：
总天数: ${doc.data.weeklyPlan?.length || 0}

逐日分析:
`
          if (doc.data.weeklyPlan) {
            doc.data.weeklyPlan.forEach((day, index) => {
              analysis += `\n第${index + 1}天:
  日期: ${day.date}
  类型: ${day.type}
  标题: ${day.title}
  是否有workout: ${!!day.workout}
  workout长度: ${day.workout ? day.workout.length : 0}
  是否有note: ${!!day.note}
  note内容: ${day.note || '无'}
  数据结构: ${JSON.stringify(Object.keys(day))}
`
            })
          }

          this.setData({ debugInfo: analysis })
        }
      } else {
        this.setData({
          debugInfo: '用户没有 current_plan_id，需要先生成计划'
        })
      }
    } catch (error) {
      console.error('Debug load error:', error)
      this.setData({
        debugInfo: '加载失败: ' + error.message,
        rawData: JSON.stringify(error, null, 2)
      })
    }
  },

  async generatePlan() {
    try {
      wx.showLoading({ title: '生成中...' })
      const result = await wx.cloud.callFunction({ name: 'genPlan' })
      wx.hideLoading()
      
      if (result.result.success) {
        wx.showToast({ title: '生成成功', icon: 'success' })
        // 重新加载数据
        setTimeout(() => {
          this.loadDebugInfo()
        }, 1000)
      } else {
        wx.showToast({ title: '生成失败: ' + result.result.message, icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '生成失败: ' + error.message, icon: 'none' })
      console.error('Generate plan error:', error)
    }
  }
})