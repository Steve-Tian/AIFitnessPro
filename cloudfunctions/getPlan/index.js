const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    const userDoc = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (!userDoc.data.length) {
      return {
        success: false,
        message: '用户档案不存在，请先完成问卷'
      }
    }

    const user = userDoc.data[0]
    const planId = event && event.planId ? event.planId : user.current_plan_id

    if (!planId) {
      return {
        success: false,
        message: '请先生成训练计划'
      }
    }

    const planDoc = await db.collection('plans').doc(planId).get()
    const plan = planDoc.data

    if (!plan) {
      return {
        success: false,
        message: '未找到本周训练计划'
      }
    }

    if (plan.userId !== OPENID) {
      return {
        success: false,
        message: '无权访问该训练计划'
      }
    }

    return {
      success: true,
      planId,
      weeklyPlan: Array.isArray(plan.weeklyPlan) ? plan.weeklyPlan : [],
      schedule: Array.isArray(plan.schedule) ? plan.schedule : [],
      daysPerWeek: typeof plan.daysPerWeek === 'number' ? plan.daysPerWeek : 0
    }
  } catch (error) {
    console.error('获取计划失败：', error)
    return {
      success: false,
      message: error.message || '获取计划失败，请稍后重试'
    }
  }
}
