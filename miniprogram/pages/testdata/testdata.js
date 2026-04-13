// 用于测试的工具页面
Page({
  data: {
    testDataCreated: false
  },

  onLoad() {
    console.log('Test page loaded')
  },

  async createTestData() {
    try {
      wx.showLoading({ title: '创建测试数据...' })
      
      const db = wx.cloud.database()
      const app = getApp()
      const openid = app.globalData.openid
      
      if (!openid) {
        throw new Error('用户未登录')
      }
      
      // 创建一个测试计划
      const testPlan = {
        _id: `test_plan_${Date.now()}`,
        userId: openid,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        weeklyPlan: [
          {
            date: new Date().toISOString().split('T')[0],
            type: 'push',
            title: '推日',
            workout: [
              {
                name: '卧推',
                alias: '杠铃卧推',
                sets: 3,
                reps: 8,
                rest: 90
              },
              {
                name: '肩推',
                alias: '杠铃肩推',
                sets: 3,
                reps: 10,
                rest: 60
              }
            ]
          },
          {
            date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'pull',
            title: '拉日',
            workout: [
              {
                name: '引体向上',
                alias: '宽距引体',
                sets: 3,
                reps: 5,
                rest: 120
              }
            ]
          },
          {
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'legs',
            title: '腿日',
            workout: [
              {
                name: '深蹲',
                alias: '杠铃深蹲',
                sets: 4,
                reps: 6,
                rest: 180
              }
            ]
          },
          {
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'rest',
            title: '休息日',
            note: '充分恢复，为下周训练储备能量'
          },
          {
            date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'push',
            title: '推日',
            workout: [
              {
                name: '俯卧撑',
                alias: '宽距俯卧撑',
                sets: 3,
                reps: 15,
                rest: 60
              }
            ]
          },
          {
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'pull',
            title: '拉日',
            workout: [
              {
                name: '哑铃划船',
                alias: '单臂哑铃划船',
                sets: 3,
                reps: 10,
                rest: 90
              }
            ]
          },
          {
            date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'rest',
            title: '休息日',
            note: '周末休息，准备下周训练'
          }
        ],
        createdAt: db.serverDate()
      }
      
      // 保存计划到数据库
      await db.collection('plans').add({
        data: testPlan
      })
      
      // 更新用户当前计划
      await db.collection('users').where({ _openid: openid }).update({
        data: {
          current_plan_id: testPlan._id,
          updated_at: db.serverDate()
        }
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '测试数据创建成功！',
        icon: 'success'
      })
      
      this.setData({ testDataCreated: true })
      
      // 延迟跳转到首页，确保数据更新
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
      
    } catch (error) {
      wx.hideLoading()
      console.error('创建测试数据失败:', error)
      wx.showToast({
        title: '创建失败: ' + error.message,
        icon: 'none'
      })
    }
  }
})