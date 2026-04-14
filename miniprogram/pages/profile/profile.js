const app = getApp()

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
    daysText: '--'
  },

  applyUser(user) {
    const f = formatProfile(user)
    this.setData({
      userInfo: user,
      avatarChar: f.avatarChar,
      goalText: f.goalText,
      experienceText: f.experienceText,
      daysText: f.daysText
    })
  },

  onLoad() {
    if (app.globalData.userInfo) {
      this.applyUser(app.globalData.userInfo)
    } else {
      app._userInfoReadyCallback = (userInfo) => {
        this.applyUser(userInfo)
      }
    }
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.applyUser(app.globalData.userInfo)
    }
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) {
      tabBar.setData({ selected: 4 })
    }
  }
})
