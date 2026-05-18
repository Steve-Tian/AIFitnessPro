/**
 * validate-helpers.js — 验证脚本公共 mock 环境
 * 从 validate.js 和 validate_core.js 中提取的共享逻辑
 */

const Module = require('module')

const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn
const originalRequire = Module.prototype.require

/**
 * 初始化全局 mock 环境（模拟微信小程序运行时）
 * @param {object} options
 * @param {boolean} options.useOriginalLog - 是否在 mock 方法中用 originalLog 代替覆盖后的 console.log
 * @param {function} options.onLog - 自定义日志输出
 */
function setupMockEnvironment(options = {}) {
  const log = options.onLog || ((...args) => originalLog('[LOG]', ...args))
  const errLog = options.onLog
    ? ((...args) => originalError('[ERROR]', ...args))
    : ((...args) => originalError('[ERROR]', ...args))
  const warnLog = options.onLog
    ? ((...args) => originalWarn('[WARN]', ...args))
    : ((...args) => originalWarn('[WARN]', ...args))

  global.console = {
    log: log,
    error: errLog,
    warn: warnLog
  }

  global.Page = (config) => config
  global.Component = (config) => config

  return { originalLog, originalError, originalWarn }
}

/**
 * 创建 mock 云数据库
 * @param {function} logFn - 日志函数
 */
function createMockDatabase(logFn) {
  const log = logFn || originalLog
  return {
    command: {},
    serverDate: () => new Date(),
    collection(name) {
      log(`✅ 访问集合: ${name}`)
      return {
        get: async () => {
          log(`✅ 获取集合数据: ${name}`)
          return { data: [] }
        },
        where(query) {
          return {
            get: async () => {
              log('✅ 查询条件:', query)
              return { data: [] }
            },
            update: async () => {
              log(`✅ 更新 ${name} 数据`)
              return { stats: { updated: 1 } }
            }
          }
        },
        add: async (payload) => {
          log(`✅ 添加数据到 ${name}:`, Object.keys(payload.data || {}).slice(0, 3))
          return { _id: 'mock-id-' + Date.now() }
        },
        doc(id) {
          return {
            get: async () => {
              log(`✅ 获取文档: ${id}`)
              return { data: {} }
            },
            update: async () => {
              log(`✅ 更新文档: ${id}`)
              return { stats: { updated: 1 } }
            }
          }
        }
      }
    }
  }
}

/**
 * 创建 mock wx-server-sdk
 */
function createMockWxServerSdk() {
  return {
    DYNAMIC_CURRENT_ENV: 'mock-env',
    init: () => {},
    getWXContext: () => ({
      OPENID: 'test-user-id',
      APPID: 'test-appid',
      UNIONID: 'test-unionid'
    }),
    database: createMockDatabase
  }
}

/**
 * 创建 mock wx 对象（客户端）
 * @param {function} logFn - 日志函数
 */
function createMockWx(logFn) {
  const log = logFn || originalLog
  return {
    cloud: {
      database: () => {
        log('✅ 云数据库连接模拟成功')
        return createMockDatabase(log)
      },
      callFunction: async ({ name, data }) => {
        log(`✅ 调用云函数: ${name}`, data ? `(参数: ${Object.keys(data)})` : '')
        if (name === 'genPlan') {
          return { result: { success: true, weeklyPlan: [{ type: 'push', title: '推日' }] } }
        }
        if (name === 'saveFeedback') {
          return { result: { success: true, message: '反馈保存成功' } }
        }
        if (name === 'unlockAchievement') {
          return { result: { success: true, unlocked: [], message: '暂无新成就' } }
        }
        if (name === 'getPlan') {
          return { result: { success: true, weeklyPlan: [{ type: 'push', title: '推日', workout: [] }] } }
        }
        return { result: { success: true } }
      }
    },
    showToast: (opts) => log(`📱 弹窗提示: ${opts.title}`),
    navigateTo: (opts) => log(`🧭 跳转页面: ${opts.url}`),
    reLaunch: (opts) => log(`🔄 重启应用: ${opts.url}`),
    switchTab: (opts) => log(`🔄 切换Tab: ${opts.url}`),
    clearStorageSync: () => log('✅ 清理本地缓存'),
    setKeepScreenOn: () => {}
  }
}

/**
 * 创建 mock getApp 返回值
 */
function createMockApp() {
  return {
    globalData: {
      openid: 'test-user-id-' + Date.now(),
      userInfo: {
        profile: {
          goal: 'muscle_gain',
          persona: 'coach',
          equipment: ['full_gym', 'dumbbell_only']
        },
        streak_days: 5,
        current_plan_id: 'test-plan-id'
      }
    }
  }
}

/**
 * 安装 require 拦截（拦截 wx-server-sdk）
 * @returns {function} 恢复函数
 */
function installRequireInterceptor() {
  const mockSdk = createMockWxServerSdk()
  Module.prototype.require = function patchedRequire(request) {
    if (request === 'wx-server-sdk') {
      return mockSdk
    }
    return originalRequire.apply(this, arguments)
  }
  return function restore() {
    Module.prototype.require = originalRequire
  }
}

module.exports = {
  originalLog,
  originalError,
  originalWarn,
  setupMockEnvironment,
  createMockDatabase,
  createMockWxServerSdk,
  createMockWx,
  createMockApp,
  installRequireInterceptor
}
