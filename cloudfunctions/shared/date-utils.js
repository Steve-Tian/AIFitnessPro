/**
 * date-utils.js — 云函数共享日期工具
 * 统一 padNumber / formatDateKey / diffInDays 等重复定义
 */

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

function diffInDays(previousDate, nextDate) {
  const previous = previousDate instanceof Date ? previousDate : new Date(previousDate)
  const next = nextDate instanceof Date ? nextDate : new Date(nextDate)
  if (Number.isNaN(previous.getTime()) || Number.isNaN(next.getTime())) {
    return null
  }

  const previousStart = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate())
  const nextStart = new Date(next.getFullYear(), next.getMonth(), next.getDate())
  return Math.round((nextStart.getTime() - previousStart.getTime()) / (24 * 60 * 60 * 1000))
}

module.exports = {
  padNumber,
  formatDateKey,
  diffInDays
}
