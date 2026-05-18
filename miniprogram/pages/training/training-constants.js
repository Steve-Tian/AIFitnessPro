/**
 * training-constants.js — 训练页常量定义
 * 包含：标签映射、动作详情兜底数据、鼓励话术、倒计时默认值
 */

const {
  MUSCLE_LABELS,
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  CATEGORY_LABELS
} = require('../../utils/shared')

const PREP_COUNTDOWN_SECONDS = 10
const DEFAULT_EXERCISE_IMAGE = '/images/default_exercise.png'
const DEFAULT_EXERCISE_INSTRUCTIONS = [
  '先用轻重量或徒手完成起始姿势，确认关节和身体排列稳定',
  '按推荐节奏完成动作全程，保持核心收紧和目标肌群主动发力',
  '每次还原都控制速度，若出现明显疼痛或动作变形请立即降强度'
]

const FALLBACK_EXERCISE_DETAILS = {
  '钻石俯卧撑': {
    alias: ['窄距俯卧撑'],
    muscle: ['triceps', 'chest', 'front_delts'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    motto: '钻石手型 · 肘贴身侧 · 夹臂推起',
    instructions: [
      '双手放在胸前下方，拇指与食指靠近呈钻石形（菱形），指尖朝前',
      '身体从头到脚保持一条直线，收紧核心和臀部',
      '肘部贴近身体两侧，缓慢下放至胸部接近手背，停顿 1 秒',
      '手掌均匀发力推起，顶端收紧胸肌内侧和三头肌'
    ],
    tips: ['肘部自然贴近身体两侧而非外翻', '全程收紧核心避免塌腰'],
    commonMistakes: ['手掌位置过宽变成普通俯卧撑', '下放时塌腰或耸肩']
  },
  '派克俯卧撑': {
    alias: ['Pike Push-up'],
    muscle: ['shoulders', 'triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    motto: '倒V撑地 · 头冲地面 · 肩部主推',
    instructions: [
      '双手撑地略宽于肩，双脚向手方向走近，臀部抬高形成倒 V 字型',
      '头部位于双臂之间，眼睛看向脚尖方向',
      '屈肘让头部向地面方向下沉，肘部朝斜后方弯曲',
      '肩部发力推回起始位置，回到倒 V 型'
    ],
    tips: ['重心略向前让肩部承受更多负荷', '全程避免耸肩'],
    commonMistakes: ['臀部塌陷变成普通俯卧撑轨迹', '手肘外翻过大导致肩部不稳']
  },
  '超人挺身': {
    alias: ['Superman'],
    muscle: ['back', 'glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    motto: '趴平伸展 · 背臀发力 · 顶峰停顿',
    instructions: [
      '俯卧趴在地面上，双手向前伸直过头，双腿伸直并拢',
      '同时抬起双臂和双腿离开地面 10-15 厘米，感受背部和臀部同时发力',
      '在最高点停顿 1-2 秒，充分挤压竖脊肌',
      '缓慢放下四肢回到地面，不要一下摔下来'
    ],
    tips: ['动作幅度不必过大，重在控制和停顿', '颈部保持自然延长线'],
    commonMistakes: ['抬头过高导致颈部受压', '依靠甩腿而不是背部主动发力']
  },
  '俯身Y-T-W': {
    alias: ['YTW'],
    muscle: ['rear_delts', 'rhomboids', 'back'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    motto: '三字轨迹 · 肩胛后缩 · 慢举慢放',
    instructions: [
      '俯卧或微屈髋俯身站立，核心收紧，手臂自然下垂',
      'Y 轨迹：双臂向头部斜上方 45° 抬举成 Y 字，拇指朝天',
      'T 轨迹：双臂向身体两侧水平抬举成 T 字，挤压肩胛骨',
      'W 轨迹：双臂屈肘向后拉成 W 字型，肩胛骨完全后缩下沉'
    ],
    tips: ['每个轨迹顶峰停顿 1-2 秒', '肩胛骨主动后缩下沉'],
    commonMistakes: ['动作太快肩后束无法充分收缩', '耸肩代偿导致斜方肌抢力']
  },
  '自阻弯举': {
    alias: ['自阻弯举'],
    muscle: ['biceps', 'forearms'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    motto: '毛巾对拉 · 均匀阻力 · 肘固不动',
    instructions: [
      '站直，单手握毛巾一端垂于体侧，另一手在下方握住毛巾另一端',
      '上方手肘固定在体侧不动，下方手施加稳定向下阻力',
      '上方手臂发力弯举对抗下方阻力，在顶部挤压二头肌 1 秒',
      '缓慢放下回到起始位，全程保持下方手的持续阻力'
    ],
    tips: ['阻力保持均匀，不要突然放松', '肘部尽量固定在身体两侧'],
    commonMistakes: ['阻力忽大忽小导致动作节奏失控', '身体后仰借力']
  },
  '自重深蹲': {
    alias: ['自重深蹲'],
    muscle: ['quads', 'glutes', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    motto: '脚跟踩实 · 膝跟脚尖 · 蹲深站稳',
    instructions: [
      '双脚与肩同宽或略宽，脚尖微微外展 15-30°，挺胸收腹',
      '屈髋屈膝同步下蹲，膝盖沿脚尖方向打开，重心落在全脚掌',
      '下蹲至大腿与地面平行或略低，停顿 1 秒保持稳定',
      '脚跟蹬地发力站起，顶端收紧臀部和核心'
    ],
    tips: ['膝盖方向与脚尖一致', '保持胸口打开，避免塌腰'],
    commonMistakes: ['膝盖内扣', '下蹲时脚跟离地']
  },
  '后撤箭步蹲': {
    alias: ['后撤箭步蹲'],
    muscle: ['glutes', 'quads', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    motto: '后撤一步 · 双膝九十 · 前跟蹬起',
    instructions: [
      '双脚并拢站立，挺胸收腹，双手叉腰或自然下垂',
      '一脚向后迈出一大步，前腿膝盖弯曲至 90°，后膝接近但不触地',
      '前脚脚跟发力蹬起回到站立位，全程保持躯干稳定',
      '换另一侧重复，两侧交替进行'
    ],
    tips: ['前脚脚跟持续发力', '躯干保持稳定直立'],
    commonMistakes: ['步幅过小导致膝盖压力过大', '躯干前倾过多']
  },
  '自重提踵': {
    alias: ['自重提踵'],
    muscle: ['calves'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    motto: '踮到最高 · 停顿两秒 · 慢放拉伸',
    instructions: [
      '双脚与肩同宽站立，脚尖朝前，可单手扶墙保持平衡',
      '缓慢踮起脚尖至最高点，小腿肌肉充分收缩',
      '在最高点停顿 1-2 秒，感受小腿后侧紧张',
      '缓慢放下脚跟至地面，拉伸小腿后侧'
    ],
    tips: ['顶峰停顿 1-2 秒是刺激关键', '下降过程尽量放慢'],
    commonMistakes: ['动作反弹过快像跳跃', '身体左右摇晃']
  }
}

const ENCOURAGEMENT_MESSAGES = {
  exerciseStart: [
    '准备好了吗？开干！💪',
    '新动作，新挑战，上！',
    '专注当下，感受每一寸肌肉！',
    '启动！保持节奏最重要'
  ],
  setComplete: [
    '漂亮！一组拿下 ✅',
    '稳住，下一组继续！',
    '节奏很棒，保持住！',
    '休息片刻，蓄力再战'
  ],
  exerciseComplete: [
    '动作完成！向下一个进发 🎯',
    '太棒了，又一个动作搞定！',
    '进步看得见，继续加油！'
  ],
  workoutComplete: [
    '训练全部完成！你是冠军！🏆',
    '完美收官！今天的你比昨天更强',
    '辛苦了！记得拉伸和补充营养'
  ],
  consistentGood: [
    '连续好几组都很稳，状态在线！🌟',
    '保持这个感觉，你正在巅峰状态！',
    '稳定输出，这就是实力！'
  ]
}

function pickEncouragement(category) {
  const pool = ENCOURAGEMENT_MESSAGES[category] || ENCOURAGEMENT_MESSAGES.exerciseStart
  return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
  PREP_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_IMAGE,
  DEFAULT_EXERCISE_INSTRUCTIONS,
  MUSCLE_LABELS,
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  CATEGORY_LABELS,
  FALLBACK_EXERCISE_DETAILS,
  ENCOURAGEMENT_MESSAGES,
  pickEncouragement
}
