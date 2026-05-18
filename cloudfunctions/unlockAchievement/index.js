const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const { formatDateKey } = require('../shared/date-utils')

function ok(data = {}, message = 'OK') {
  return { success: true, message, ...data }
}
function fail(message = 'Error') {
  return { success: false, message }
}

/**
 * 分页查询云数据库集合（绕过 .get() 默认 20 条限制）
 */
async function queryAll(collection, where = {}, pageSize = 100) {
  let offset = 0
  let results = []
  let hasNextPage = true

  while (hasNextPage) {
    const pageResult = await collection.where(where).skip(offset).limit(pageSize).get()
    const pageData = Array.isArray(pageResult.data) ? pageResult.data : []
    results = results.concat(pageData)
    hasNextPage = pageData.length === pageSize
    offset += pageSize
  }

  return results
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
      const feedbacks = await queryAll(db.collection('feedback'), { userId: userData._openid })
      return feedbacks.some((fb) => fb.rpe === 10)
    }
  },
  'heavy_lifter': {
    id: 'heavy_lifter',
    name: '重装上阵',
    description: '累计训练时长超过50小时',
    points: 100,
    condition: async (userData, db) => {
      const feedbacks = await queryAll(db.collection('feedback'), { userId: userData._openid })
      // 按每条反馈的实际完成时间累加（单次训练按 45 分钟估算，但限制每自然日只算一次）
      const trainedDates = new Set()
      feedbacks.forEach((fb) => {
        const dateKey = formatDateKey(fb.completedAt) || fb.workoutDate
        if (dateKey) trainedDates.add(dateKey)
      })
      const totalMinutes = trainedDates.size * 45
      return totalMinutes >= 50 * 60
    }
  },
  'diversity_master': {
    id: 'diversity_master',
    name: '全面达人',
    description: '完成所有训练分类（推/拉/腿）',
    points: 80,
    condition: async (userData, db) => {
      const feedbacks = await queryAll(db.collection('feedback'), { userId: userData._openid })
      
      const categories = new Set()

      // 第一遍：直接从 feedback.dayType 提取分类
      const planIdsToFetch = new Set()
      for (const feedback of feedbacks) {
        if (feedback.dayType && feedback.dayType !== 'rest') {
          categories.add(feedback.dayType)
        } else if (feedback.planId) {
          planIdsToFetch.add(feedback.planId)
        }
      }

      // 批量预取所有需要的 plan 文档（替代 N+1 串行查询）
      if (planIdsToFetch.size > 0) {
        const planCache = new Map()
        // 云数据库批量查询用 _id in 方式，每次最多 20 条
        const planIdArray = Array.from(planIdsToFetch)
        for (let i = 0; i < planIdArray.length; i += 20) {
          const batch = planIdArray.slice(i, i + 20)
          const { data: planDocs } = await db.collection('plans').where({
            _id: db.command.in(batch)
          }).get()
          planDocs.forEach((doc) => planCache.set(doc._id, doc))
        }

        // 第二遍：从预取的 plan 中匹配 dayType
        for (const feedback of feedbacks) {
          if ((feedback.dayType && feedback.dayType !== 'rest') || !feedback.planId) continue

          const plan = planCache.get(feedback.planId)
          if (!plan || !Array.isArray(plan.weeklyPlan)) continue

          const completedDate = feedback.workoutDate || formatDateKey(feedback.completedAt)
          if (!completedDate) continue

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
      const feedbacks = await queryAll(db.collection('feedback'), { userId: userData._openid })
      
      for (const feedback of feedbacks) {
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

  if (!OPENID) {
    return fail('未获取到用户身份，请重新登录')
  }

  try {
    const userDoc = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (userDoc.data.length === 0) {
      return fail('用户不存在')
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

      return ok(
        { unlocked: unlockedAchievements },
        `恭喜解锁 ${unlockedAchievements.length} 个新成就！`
      )
    } else {
      return ok({ unlocked: [] }, '暂无新成就解锁')
    }
  } catch (err) {
    console.error('检查成就失败：', err)
    return fail(err.message || '检查成就失败，请稍后重试')
  }
}
