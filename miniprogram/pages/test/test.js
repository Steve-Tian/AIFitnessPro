// 测试云函数的辅助文件
Page({
  data: {
    testResult: '',
    isTesting: false
  },

  onLoad() {
    console.log('测试页面加载')
  },

  async testGenPlan() {
    this.setData({ isTesting: true })
    
    try {
      console.log('开始调用 genPlan 云函数...')
      const result = await wx.cloud.callFunction({
        name: 'genPlan'
      })
      
      console.log('云函数返回结果:', result)
      
      this.setData({
        testResult: JSON.stringify(result, null, 2),
        isTesting: false
      })
      
      if (result.result.success) {
        wx.showToast({
          title: '云函数调用成功！',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '云函数返回错误',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('调用云函数失败:', error)
      this.setData({
        testResult: '错误: ' + error.message,
        isTesting: false
      })
      
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  }
})