const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

function ok(data = {}, message = 'OK') {
  return { success: true, message, ...data }
}
function fail(message = 'Error') {
  return { success: false, message }
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

    if (!userDoc.data.length) {
      return fail('用户档案不存在，请先完成问卷')
    }

    const user = userDoc.data[0]
    const planId = event && event.planId ? event.planId : user.current_plan_id

    if (!planId) {
      return fail('请先生成训练计划')
    }

    const planDoc = await db.collection('plans').doc(planId).get()
    const plan = planDoc.data

    if (!plan) {
      return fail('未找到本周训练计划')
    }

    if (plan.userId !== OPENID) {
      return fail('无权访问该训练计划')
    }

    return ok({
      planId,
      weeklyPlan: Array.isArray(plan.weeklyPlan) ? plan.weeklyPlan : [],
      schedule: Array.isArray(plan.schedule) ? plan.schedule : [],
      daysPerWeek: typeof plan.daysPerWeek === 'number' ? plan.daysPerWeek : 0
    })
  } catch (error) {
    console.error('获取计划失败：', error)
    return fail(error.message || '获取计划失败，请稍后重试')
  }
}
