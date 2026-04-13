const db = wx.cloud.database()

const api = {
  async getUser(openid) {
    const { data } = await db.collection('users').where({
      _openid: openid
    }).get()
    return data.length > 0 ? data[0] : null
  },

  async updateUser(docId, updates) {
    return db.collection('users').doc(docId).update({
      data: {
        ...updates,
        updated_at: db.serverDate()
      }
    })
  }
}

module.exports = api
