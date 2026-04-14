const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function formatDateKey(input) {
  if (!input) return ''
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input
  }

  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

// 成就定义
const ACHIEVEMENTS = {
  'first_workout': {
    id: 'first_workout',
    name: '初次体验',
    description: '完成第一次训练',
    points: 10,
    condition: (userData) => userData.streak_days >= 1
  },
  'week_streak': {
    id: 'week_streak',
    name: '一周连击',
    description: '连续打卡7天',
    points: 50,
    condition: (userData) => userData.streak_days >= 7
  },
  'month_streak': {
    id: 'month_streak',
    name: '月度强者',
    description: '连续打卡30天',
    points: 200,
    condition: (userData) => userData.streak_days >= 30
  },
  'perfect_rpe': {
    id: 'perfect_rpe',
    name: '精准感知',
    description: '单次训练RPE达到10分',
    points: 30,
    condition: async (userData, db) => {
      const feedbacks = await db.collection('feedback').where({
        userId: userData._openid,
        rpe: 10
      }).get()
      return feedbacks.data.length > 0
    }
  },
  'heavy_lifter': {
    id: 'heavy_lifter',
    name: '重装上阵',
    description: '累计训练时长超过50小时',
    points: 100,
    condition: async (userData, db) => {
      const feedbacks = await db.collection('feedback').where({
        userId: userData._openid
      }).get()
      
      // 简单估算：每次训练平均45分钟
      const totalMinutes = feedbacks.data.length * 45
      return totalMinutes >= 50 * 60
    }
  },
  'diversity_master': {
    id: 'diversity_master',
    name: '全面达人',
    description: '完成所有训练分类（推/拉/腿）',
    points: 80,
    condition: async (userData, db) => {
      const feedbacks = await db.collection('feedback').where({
        userId: userData._openid
      }).get()
      
      const categories = new Set()
      const planCache = new Map()
      for (const feedback of feedbacks.data) {
        if (feedback.dayType && feedback.dayType !== 'rest') {
          categories.add(feedback.dayType)
          continue
        }

        if (!feedback.planId) {
          continue
        }

        let plan = planCache.get(feedback.planId)
        if (!plan) {
          const planDoc = await db.collection('plans').doc(feedback.planId).get()
          plan = planDoc.data || null
          planCache.set(feedback.planId, plan)
        }

        if (!plan || !Array.isArray(plan.weeklyPlan)) {
          continue
        }

        const completedDate = feedback.workoutDate || formatDateKey(feedback.completedAt)
        if (!completedDate) {
          continue
        }

        const matchedDay = plan.weeklyPlan.find(day => (
          day &&
          day.type &&
          day.type !== 'rest' &&
          day.date === completedDate
        ))

        if (matchedDay) {
          categories.add(matchedDay.type)
        }
      }
      
      return ['push', 'pull', 'legs'].every(type => categories.has(type))
    }
  },
  'early_bird': {
    id: 'early_bird',
    name: '早起鸟儿',
    description: '早上6点前完成训练',
    points: 20,
    condition: async (userData, db) => {
      const feedbacks = await db.collection('feedback').where({
        userId: userData._openid
      }).get()
      
      for (const feedback of feedbacks.data) {
        if (feedback.completedAt) {
          const hour = new Date(feedback.completedAt).getHours()
          if (hour < 6) return true
        }
      }
      return false
    }
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    // 获取用户数据
    const userDoc = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (userDoc.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userDoc.data[0]

    // 检查所有成就
    const unlockedAchievements = []
    const userAchievements = user.achievements || []

    for (const achievementId in ACHIEVEMENTS) {
      const achievement = ACHIEVEMENTS[achievementId]
      
      // 跳过已解锁的成就
      if (userAchievements.includes(achievement.id)) {
        continue
      }

      // 检查成就条件
      let isUnlocked = false
      if (typeof achievement.condition === 'function') {
        if (achievement.condition.length > 1) {
          // 异步条件检查
          isUnlocked = await achievement.condition(user, db)
        } else {
          // 同步条件检查
          isUnlocked = achievement.condition(user)
        }
      }

      if (isUnlocked) {
        unlockedAchievements.push(achievement)
      }
    }

    if (unlockedAchievements.length > 0) {
      // 记录新解锁的成就
      const newAchievementIds = unlockedAchievements.map(a => a.id)
      
      // 更新用户成就列表
      await db.collection('users').where({ _openid: OPENID }).update({
        data: {
          achievements: Array.from(new Set(userAchievements.concat(newAchievementIds))),
          total_points: (user.total_points || 0) + unlockedAchievements.reduce((sum, a) => sum + a.points, 0),
          updated_at: db.serverDate()
        }
      })

      // 保存成就解锁记录
      for (const achievement of unlockedAchievements) {
        await db.collection('achievement_logs').add({
          data: {
            userId: OPENID,
            achievementId: achievement.id,
            unlockedAt: db.serverDate(),
            pointsAwarded: achievement.points
          }
        })
      }

      return {
        success: true,
        unlocked: unlockedAchievements,
        message: `恭喜解锁 ${unlockedAchievements.length} 个新成就！`
      }
    } else {
      return {
        success: true,
        unlocked: [],
        message: '暂无新成就解锁'
      }
    }
  } catch (err) {
    console.error('检查成就失败：', err)
    return {
      success: false,
      message: err.message || '检查成就失败，请稍后重试'
    }
  }
}
