const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    const { planId, exerciseIndex, rpe, completedAt } = event

    // 验证参数
    if (!planId || typeof exerciseIndex !== 'number' || !rpe) {
      return { success: false, message: '参数不完整' }
    }

    if (rpe < 6 || rpe > 10) {
      return { success: false, message: 'RPE评分应在6-10之间' }
    }

    // 获取当前计划和用户信息
    const planDoc = await db.collection('plans').doc(planId).get()
    const userDoc = await db.collection('users').where({ _openid: OPENID }).get()

    if (!planDoc.data || userDoc.data.length === 0) {
      return { success: false, message: '计划或用户不存在' }
    }

    const plan = planDoc.data
    const user = userDoc.data[0]

    // 计算下次训练强度调整
    let intensityAdjustment = 0
    if (rpe >= 9) {
      // RPE 9-10：太难了，下次降低重量
      intensityAdjustment = -0.05 // 降低5%
    } else if (rpe <= 7) {
      // RPE 6-7：太轻松，下次增加重量
      intensityAdjustment = 0.05 // 增加5%
    }
    // RPE 8：刚好，保持不变

    // 记录本次训练反馈
    const feedbackRecord = {
      _id: `feedback_${Date.now()}_${OPENID}`,
      planId,
      userId: OPENID,
      exerciseIndex,
      rpe,
      completedAt: completedAt || db.serverDate(),
      intensityAdjustment
    }

    // 保存到反馈集合
    await db.collection('feedback').add({
      data: feedbackRecord
    })

    // 更新用户连续打卡天数
    const today = new Date().toDateString()
    const lastTrainingDate = user.last_training_date ? new Date(user.last_training_date).toDateString() : null
    
    let newStreak = user.streak_days || 0
    if (lastTrainingDate !== today) {
      // 如果不是同一天，则增加打卡天数
      newStreak += 1
    }

    await db.collection('users').where({ _openid: OPENID }).update({
      data: {
        streak_days: newStreak,
        last_training_date: db.serverDate(),
        updated_at: db.serverDate()
      }
    })

    // 更新计划中的完成状态
    if (!plan.session_feedback) {
      plan.session_feedback = []
    }
    
    plan.session_feedback.push(feedbackRecord)
    
    await db.collection('plans').doc(planId).update({
      data: {
        session_feedback: plan.session_feedback,
        updated_at: db.serverDate()
      }
    })

    return {
      success: true,
      message: '反馈提交成功！',
      adjustment: intensityAdjustment,
      newStreak
    }
  } catch (err) {
    console.error('保存反馈失败：', err)
    return {
      success: false,
      message: err.message || '提交失败，请稍后重试'
    }
  }
}