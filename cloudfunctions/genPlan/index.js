const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 训练动作库（按肌群分类）
const EXERCISE_LIBRARY = {
  push: [
    { name: '卧推', alias: ['杠铃卧推'], equipment: ['full_gym', 'barbell_bench'], muscle: 'chest' },
    { name: '哑铃飞鸟', alias: ['飞鸟'], equipment: ['dumbbell_only'], muscle: 'chest' },
    { name: '肩推', alias: ['杠铃肩推', '哑铃肩推'], equipment: ['full_gym', 'barbell_bench', 'dumbbell_only'], muscle: 'shoulders' },
    { name: '侧平举', alias: ['哑铃侧平举'], equipment: ['dumbbell_only'], muscle: 'shoulders' },
    { name: '俯卧撑', alias: ['宽距俯卧撑'], equipment: ['bodyweight'], muscle: 'chest' },
    { name: '臂屈伸', alias: ['双杠臂屈伸'], equipment: ['full_gym'], muscle: 'triceps' }
  ],
  pull: [
    { name: '引体向上', alias: ['宽距引体'], equipment: ['full_gym'], muscle: 'back' },
    { name: '杠铃划船', alias: ['划船'], equipment: ['full_gym', 'barbell_bench'], muscle: 'back' },
    { name: '哑铃划船', alias: ['单臂哑铃划船'], equipment: ['dumbbell_only'], muscle: 'back' },
    { name: '面拉', alias: ['绳索面拉'], equipment: ['full_gym', 'cable'], muscle: 'rear_delts' },
    { name: '杠铃弯举', alias: ['弯举'], equipment: ['barbell_bench'], muscle: 'biceps' },
    { name: '哑铃锤式弯举', alias: ['锤式弯举'], equipment: ['dumbbell_only'], muscle: 'biceps' }
  ],
  legs: [
    { name: '深蹲', alias: ['杠铃深蹲'], equipment: ['full_gym', 'barbell_bench'], muscle: 'quads' },
    { name: '硬拉', alias: ['罗马尼亚硬拉'], equipment: ['full_gym', 'barbell_bench'], muscle: 'hamstrings' },
    { name: '保加利亚分腿蹲', alias: ['分腿蹲'], equipment: ['dumbbell_only'], muscle: 'quads' },
    { name: '臀桥', alias: ['杠铃臀桥'], equipment: ['full_gym', 'barbell_bench'], muscle: 'glutes' },
    { name: '弓步蹲', alias: ['哑铃弓步'], equipment: ['dumbbell_only'], muscle: 'quads' },
    { name: '小腿提踵', alias: ['提踵'], equipment: ['dumbbell_only'], equipment: ['dumbbell_only'], muscle: 'calves' }
  ]
}

// 根据用户设备筛选可用动作
function filterExercisesByEquipment(exercises, userEquipment) {
  return exercises.filter(ex => ex.equipment.some(eq => userEquipment.includes(eq)))
}

// 生成单日训练计划
function generateDayWorkout(dayType, userEquipment, dayIndex) {
  const availableExercises = filterExercisesByEquipment(EXERCISE_LIBRARY[dayType], userEquipment)
  if (availableExercises.length < 4) {
    throw new Error(`设备 ${userEquipment.join(',')} 无法满足${dayType}日训练需求`)
  }

  // 随机选取4-6个动作（避免重复）
  const selectedExercises = []
  const shuffled = [...availableExercises].sort(() => Math.random() - 0.5)
  
  for (const ex of shuffled) {
    if (selectedExercises.length >= (Math.random() > 0.5 ? 4 : 5)) break
    if (!selectedExercises.find(se => se.muscle === ex.muscle)) {
      selectedExercises.push({
        name: ex.name,
        alias: ex.alias[0],
        sets: 3 + dayIndex % 2, // 渐进超负荷：奇数天增加组数
        reps: 8 + (dayIndex % 3) * 2, // 渐进超负荷：循环递增次数
        rest: 90 + (dayIndex % 2) * 30 // 休息时间微调
      })
    }
  }

  return selectedExercises
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    // 获取用户档案
    const userDoc = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (userDoc.data.length === 0) {
      return { success: false, message: '用户档案不存在，请先完成问卷' }
    }

    const profile = userDoc.data[0].profile
    
    // 生成7天计划（3天Push/Pull/Legs循环 + 休息日）
    const weeklyPlan = []
    const schedule = ['push', 'pull', 'legs', 'rest', 'push', 'pull', 'rest']
    
    for (let i = 0; i < 7; i++) {
      const dayType = schedule[i]
      
      if (dayType === 'rest') {
        weeklyPlan.push({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          type: 'rest',
          title: '休息日',
          note: '充分恢复，为下周训练储备能量'
        })
      } else {
        const workout = generateDayWorkout(dayType, profile.equipment, i)
        weeklyPlan.push({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          type: dayType,
          title: `${dayType === 'push' ? '推' : dayType === 'pull' ? '拉' : '腿'}日`,
          workout,
          focus_muscles: Array.from(new Set(workout.map(w => w.name.includes('胸') ? 'chest' : w.name.includes('背') ? 'back' : 'legs')))
        })
      }
    }

    // 存储到数据库
    const planId = `plan_${Date.now()}`
    await db.collection('plans').add({
      data: {
        _id: planId,
        userId: OPENID,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        weeklyPlan,
        createdAt: db.serverDate()
      }
    })

    // 更新用户当前计划
    await db.collection('users').where({ _openid: OPENID }).update({
      data: {
        current_plan_id: planId,
        updated_at: db.serverDate()
      }
    })

    return {
      success: true,
      planId,
      weeklyPlan,
      message: '本周训练计划生成成功！'
    }
  } catch (err) {
    console.error('生成计划失败：', err)
    return {
      success: false,
      message: err.message || '生成计划失败，请稍后重试'
    }
  }
}