const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function ok(data = {}, message = 'OK') {
  return { success: true, message, ...data }
}
function fail(message = 'Error') {
  return { success: false, message }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  if (!wxContext || !wxContext.OPENID) {
    return fail('登录态无效')
  }
  return ok({
    openid: wxContext.OPENID,
    appid: wxContext.APPID || '',
    unionid: wxContext.UNIONID || ''
  })
}
