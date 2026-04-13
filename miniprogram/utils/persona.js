/**
 * AIFitnessPro - 搭子话术系统
 * 支持三种人格风格：硬核教练、暖男兄弟、幽默毒舌
 */

class PersonaEngine {
  constructor(personaStyle = 'coach') {
    this.style = personaStyle
    this.templates = {
      coach: {
        warmup: [
          '热身到位了吗？记住：宁可慢一点，也不要受伤。',
          '动作质量永远比重量更重要，做好每一个细节。',
          '准备好了吗？专注，专注，再专注。'
        ],
        during: [
          '很好！继续保持这个节奏。',
          '动作标准！再来一组，别停！',
          '坚持住，这是突破的关键时刻！',
          '呼吸节奏不错，继续保持。'
        ],
        finish: [
          '干得漂亮！今天的训练很棒。',
          '完成度100%，继续保持这个势头。',
          '这次训练强度够了，回去好好恢复。'
        ],
        encouragement: [
          '做得好！',
          '标准动作！',
          '完美！',
          '就是这样！',
          '继续加油！'
        ],
        correction: [
          '注意姿势，别弓腰！',
          '控制动作节奏，慢一点。',
          '呼吸要配合动作。'
        ]
      },
      buddy: {
        warmup: [
          '嘿兄弟，今天准备搞点什么强度？',
          '热身舒服点了吗？待会儿一起冲！',
          '感觉怎么样？准备好开始了吗？'
        ],
        during: [
          '哇，这组动作真帅！',
          '厉害啊兄弟，继续保持！',
          '这状态不错，再加把劲！',
          '节奏掌握得很好，加油！'
        ],
        finish: [
          '兄弟你太猛了！',
          '今天又突破自己了，牛！',
          '完美收工，回去多吃点奖励自己！'
        ],
        encouragement: [
          '稳住！',
          '继续！',
          '兄弟你行的！',
          '加油！',
          '太棒了！'
        ],
        correction: [
          '慢点来，别急，安全第一。',
          '动作幅度可以再大一点。',
          '注意一下呼吸节奏哦。'
        ]
      },
      comedian: {
        warmup: [
          '听说今天有人要挑战自己的极限？',
          '热身完毕了吗？别一会儿哭着说累。',
          '准备好了？待会儿可能要怀疑人生。'
        ],
        during: [
          '哟，还挺能坚持嘛！',
          '看来你的铁还是有点料。',
          '这组动作勉强合格，下组加油。',
          '动作还行，就是有点像划水。'
        ],
        finish: [
          '居然没躺下？可以的。',
          '今天表现尚可，免得你尴尬。',
          '训练结束，可以回家晒朋友圈了。'
        ],
        encouragement: [
          '凑合吧。',
          '还行。',
          '勉强及格。',
          '可以的。',
          '还活着？'
        ],
        correction: [
          '兄弟，你是来旅游的吗？',
          '动作幅度像蚊子叮的。',
          '你这呼吸，像鱼缺氧。'
        ]
      },
      beauty_coach: {
        warmup: [
          '热身很重要哦，别偷懒～',
          '准备开始了吗？我会一直陪着你的！',
          '深呼吸，放松心情，我们开始吧！'
        ],
        during: [
          '很棒！继续保持这个节奏。',
          '动作很标准呢，给你点赞！',
          '看得出来你在努力，加油加油！',
          '呼吸要配合动作，慢慢来～'
        ],
        finish: [
          '今天完成得很不错呢！',
          '坚持就是胜利，为你骄傲！',
          '训练结束了，辛苦啦！'
        ],
        encouragement: [
          '加油！',
          '你可以的！',
          '坚持住！',
          '很棒！',
          '继续努力！'
        ],
        correction: [
          '注意一下姿势，保护好自己哦。',
          '动作幅度可以再大一点，慢慢来。',
          '呼吸节奏要掌握好，别着急。'
        ]
      }
    }
  }

  /**
   * 获取随机话术
   * @param {string} category - 话术类别 (warmup/during/finish/encouragement/correction)
   * @param {object} context - 上下文信息 (如动作名、RPE值、连续打卡天数等)
   * @returns {string} 个性化话术
   */
  getRandomMessage(category, context = {}) {
    const categoryTemplates = this.templates[this.style]?.[category] || []
    if (categoryTemplates.length === 0) {
      return '加油！'
    }

    // 根据上下文个性化
    const randomTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)]
    
    // 如果有上下文，可以进一步定制话术
    if (context.exerciseName) {
      // 简单的上下文替换（未来可扩展为更复杂的模板引擎）
      if (randomTemplate.includes('动作')) {
        return randomTemplate.replace('动作', context.exerciseName)
      }
    }

    return randomTemplate
  }

  /**
   * 根据RPE值调整鼓励话术强度
   * @param {number} rpe - RPE评分 (6-10)
   * @returns {string} RPE相关的鼓励话术
   */
  getRPEResponse(rpe) {
    if (rpe >= 9) {
      const responses = {
        coach: [
          '极限强度！下次可以考虑减重或减少组数。',
          '拼尽全力！记得充分恢复。',
          '高难度完成！进步就在这种时刻。'
        ],
        buddy: [
          '哇，这么猛？小心别拉伤！',
          '兄弟你这是要上天啊！',
          '这强度，佩服佩服！'
        ],
        comedian: [
          '玩命模式启动？注意身体。',
          '这么拼？确定不是在作死？',
          '极限挑战，佩服。'
        ]
      }
      return responses[this.style][Math.floor(Math.random() * responses[this.style].length)]
    } else if (rpe <= 7) {
      const responses = {
        coach: [
          '强度还可以再提升一点。',
          '下次可以尝试加重或增加组数。',
          '保持这个节奏，逐步提升。'
        ],
        buddy: [
          '轻松模式？可以再挑战一下。',
          '下次试试更高强度哦！',
          '稳扎稳打也不错！'
        ],
        comedian: [
          '这是在散步吗？',
          '强度像在养生。',
          '下次可以再猛一点。'
        ]
      }
      return responses[this.style][Math.floor(Math.random() * responses[this.style].length)]
    } else {
      const responses = {
        coach: [
          '完美强度！这就是进步的感觉。',
          '这个RPE很棒，继续保持。',
          '难度刚好，下次继续。'
        ],
        buddy: [
          '这感觉不错，刚刚好！',
          '强度正好，继续加油！',
          '完美掌控！'
        ],
        comedian: [
          '刚刚好，不多不少。',
          '标准答案，无可挑剔。',
          '这RPE，专业！'
        ]
      }
      return responses[this.style][Math.floor(Math.random() * responses[this.style].length)]
    }
  }

  /**
   * 根据连续打卡天数给予特殊话术
   * @param {number} streakDays - 连续打卡天数
   * @returns {string} 打卡相关话术
   */
  getStreakMessage(streakDays) {
    if (streakDays >= 30) {
      return {
        coach: '一个月连续训练，真正的战士！',
        buddy: '一个月了！你已经是个训练老手了！',
        comedian: '一个月？不会是在刷存在感吧？'
      }[this.style]
    } else if (streakDays >= 7) {
      return {
        coach: '一周连续训练，习惯正在形成。',
        buddy: '连续一周，你已经找到节奏了！',
        comedian: '一周了？看来是真的想练。',
      }[this.style]
    } else if (streakDays >= 3) {
      return {
        coach: '连续三天，良好开端。',
        buddy: '连续三天，状态不错！',
        comedian: '三天了？看来不是三分钟热度。',
      }[this.style]
    }
    return ''
  }
}

module.exports = { PersonaEngine }