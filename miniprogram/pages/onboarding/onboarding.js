const EQUIPMENT_KEYS = [
  'equipment_full_gym',
  'equipment_barbell',
  'equipment_dumbbell',
  'equipment_bodyweight'
]

const EQUIPMENT_MAP = {
  equipment_full_gym: 'full_gym',
  equipment_barbell: 'barbell_bench',
  equipment_dumbbell: 'dumbbell_only',
  equipment_bodyweight: 'bodyweight'
}

Page({
  data: {
    currentStep: 0,
    totalSteps: 9,
    canProceed: false,
    submitting: false,
    formData: {
      gender: '',
      age: 25,
      height: 175,
      weight: 70,
      goal: '',
      experience: '',
      days_per_week: 0,
      equipment_full_gym: false,
      equipment_barbell: false,
      equipment_dumbbell: false,
      equipment_bodyweight: false,
      persona: ''
    }
  },

  onSelect(e) {
    const { field, value } = e.currentTarget.dataset
    this.setData({
      [`formData.${field}`]: value
    }, () => this.validateStep())
  },

  onSliderChange(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({ [`formData.${field}`]: value }, () => this.validateStep())
  },

  onToggleEquipment(e) {
    const { key } = e.currentTarget.dataset
    const current = this.data.formData[key]
    this.setData({
      [`formData.${key}`]: !current
    }, () => this.validateStep())
  },

  validateStep() {
    const { currentStep, formData } = this.data
    let valid = false

    switch (currentStep) {
      case 0: valid = !!formData.gender; break
      case 1: valid = formData.age >= 16 && formData.age <= 65; break
      case 2: valid = formData.height >= 140 && formData.height <= 220; break
      case 3: valid = formData.weight >= 30 && formData.weight <= 200; break
      case 4: valid = !!formData.goal; break
      case 5: valid = !!formData.experience; break
      case 6: valid = formData.days_per_week >= 3; break
      case 7:
        valid = EQUIPMENT_KEYS.some(k => formData[k])
        break
      case 8: valid = !!formData.persona; break
    }

    this.setData({ canProceed: valid })
  },

  nextStep() {
    if (!this.data.canProceed) return

    if (this.data.currentStep < this.data.totalSteps - 1) {
      this.setData({ currentStep: this.data.currentStep + 1, canProceed: false }, () => {
        this.validateStep()
      })
    } else {
      this.submitProfile()
    }
  },

  prevStep() {
    if (this.data.currentStep > 0) {
      this.setData({ currentStep: this.data.currentStep - 1 }, () => {
        this.validateStep()
      })
    }
  },

  buildEquipmentArray() {
    return EQUIPMENT_KEYS
      .filter(k => this.data.formData[k])
      .map(k => EQUIPMENT_MAP[k])
  },

  async submitProfile() {
    if (this.data.submitting) return
    this.setData({ submitting: true })

    const { formData } = this.data
    const profile = {
      gender: formData.gender,
      age: formData.age,
      height: formData.height,
      weight: formData.weight,
      goal: formData.goal,
      experience: formData.experience,
      days_per_week: formData.days_per_week,
      equipment: this.buildEquipmentArray(),
      persona: formData.persona
    }

    try {
      const db = wx.cloud.database()
      const app = getApp()

      const { data: existing } = await db.collection('users').where({
        _openid: app.globalData.openid
      }).get()

      const userDoc = {
        profile,
        onboarding_completed: true,
        streak_days: 0,
        current_plan_id: null,
        updated_at: db.serverDate()
      }

      if (existing.length > 0) {
        await db.collection('users').doc(existing[0]._id).update({
          data: userDoc
        })
      } else {
        userDoc.created_at = db.serverDate()
        await db.collection('users').add({ data: userDoc })
      }

      const { data: users } = await db.collection('users').where({
        _openid: app.globalData.openid
      }).get()
      if (users.length > 0) {
        app.globalData.userInfo = users[0]
      }

      wx.showToast({ title: '设置完成！', icon: 'success', duration: 2000 })
      setTimeout(() => {
        wx.clearStorageSync()
        wx.reLaunch({ url: '/pages/index/index' })
      }, 2000)
    } catch (err) {
      console.error('保存失败：', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      this.setData({ submitting: false })
    }
  }
})
