/**
 * shared.js — 前后端共享工具与常量
 * 统一 formatDateKey、标签映射等重复定义
 */

// ===== 日期工具 =====

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

// ===== 通用数据工具 =====

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }
  if (value) {
    return [value]
  }
  return []
}

function translateLabels(values, dictionary) {
  return normalizeList(values).map((value) => dictionary[value] || value)
}

function buildInstructionSteps(instructions) {
  return normalizeList(instructions).map((text, index) => ({
    label: `步骤 ${index + 1}`,
    text
  }))
}

function buildDetailedStepCards(instructions, exerciseTips, commonMistakes, motto) {
  const stepCards = []

  const mottoSegments = motto ? motto.split(/\s*·\s*/).filter(Boolean) : []
  const instructionList = normalizeList(instructions).slice(0, 4)

  instructionList.forEach((text, index) => {
    stepCards.push({
      label: mottoSegments[index] || ['起始位', '动作路径', '顶峰发力', '还原控制'][index] || `步骤 ${index + 1}`,
      text,
      isMotto: Boolean(mottoSegments[index])
    })
  })

  normalizeList(exerciseTips).slice(0, 2).forEach((text, index) => {
    stepCards.push({
      label: index === 0 ? '发力提醒' : '节奏提醒',
      text,
      isMotto: false
    })
  })

  normalizeList(commonMistakes).slice(0, 2).forEach((text) => {
    stepCards.push({
      label: '避免',
      text,
      isMotto: false
    })
  })

  return stepCards.slice(0, 8)
}

// ===== 标签映射常量 =====

const MUSCLE_LABELS = {
  chest: '胸肌',
  triceps: '肱三头肌',
  front_delts: '前三角',
  shoulders: '三角肌',
  rear_delts: '后三角',
  back: '背阔肌',
  rhomboids: '菱形肌',
  biceps: '肱二头肌',
  forearms: '前臂',
  quads: '股四头肌',
  hamstrings: '腘绳肌',
  glutes: '臀大肌',
  calves: '小腿',
  core: '核心'
}

const EQUIPMENT_LABELS = {
  full_gym: '综合器械',
  barbell_bench: '杠铃/卧推架',
  dumbbell_only: '哑铃',
  bodyweight: '徒手',
  cable: '绳索器械'
}

const DIFFICULTY_LABELS = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '进阶'
}

const CATEGORY_LABELS = {
  all: '全部',
  push: '推日',
  pull: '拉日',
  legs: '腿日'
}

const PERSONA_LABEL = {
  coach: '硬核教练',
  buddy: '暖男兄弟',
  bro: '暖男兄弟',
  comedian: '幽默毒舌',
  roast: '幽默毒舌',
  beauty_coach: '美女教练'
}

module.exports = {
  padNumber,
  formatDateKey,
  normalizeList,
  translateLabels,
  buildInstructionSteps,
  buildDetailedStepCards,
  MUSCLE_LABELS,
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  CATEGORY_LABELS,
  PERSONA_LABEL
}
