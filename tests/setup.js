const DEFAULT_APP_STATE = {
  globalData: {
    openid: 'mock-openid',
    userInfo: {
      _openid: 'mock-openid',
      streak_days: 0,
      current_plan_id: null,
      profile: {}
    }
  }
}

const DEFAULT_CLOUD_CONTEXT = {
  OPENID: 'mock-openid',
  APPID: 'mock-appid',
  UNIONID: 'mock-unionid'
}

function clone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

function mergeObjects(base, patch) {
  const output = clone(base)
  if (!patch || typeof patch !== 'object') {
    return output
  }

  Object.keys(patch).forEach((key) => {
    const patchValue = patch[key]
    if (
      patchValue &&
      typeof patchValue === 'object' &&
      !Array.isArray(patchValue) &&
      output[key] &&
      typeof output[key] === 'object' &&
      !Array.isArray(output[key])
    ) {
      output[key] = mergeObjects(output[key], patchValue)
      return
    }

    output[key] = clone(patchValue)
  })

  return output
}

function setByPath(target, path, value) {
  const parts = path.split('.')
  let cursor = target

  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    if (!cursor[key] || typeof cursor[key] !== 'object') {
      cursor[key] = {}
    }
    cursor = cursor[key]
  }

  cursor[parts[parts.length - 1]] = clone(value)
}

function matchesQuery(doc, query = {}) {
  return Object.entries(query).every(([key, value]) => doc && doc[key] === value)
}

let appState
let cloudState
let lastRegisteredPage = null

function resetAppState() {
  appState = clone(DEFAULT_APP_STATE)
}

function resetCloudState() {
  cloudState = {
    context: clone(DEFAULT_CLOUD_CONTEXT),
    collections: {},
    callFunctionHandlers: {}
  }
}

function ensureCollection(name) {
  if (!cloudState.collections[name]) {
    cloudState.collections[name] = []
  }

  return cloudState.collections[name]
}

function createDatabaseApi() {
  return {
    command: {},
    serverDate: () => new Date('2026-04-13T08:00:00.000Z'),
    collection(name) {
      return {
        where(query = {}) {
          return {
            async get() {
              const docs = ensureCollection(name).filter((doc) => matchesQuery(doc, query))
              return { data: clone(docs) }
            },
            async update({ data }) {
              let updated = 0
              const docs = ensureCollection(name)
              docs.forEach((doc, index) => {
                if (matchesQuery(doc, query)) {
                  docs[index] = { ...doc, ...clone(data) }
                  updated += 1
                }
              })
              return { stats: { updated } }
            }
          }
        },
        async add({ data }) {
          const docs = ensureCollection(name)
          const nextDoc = clone(data)
          if (!nextDoc._id) {
            nextDoc._id = `${name}-${docs.length + 1}`
          }
          docs.push(nextDoc)
          return { _id: nextDoc._id }
        },
        doc(id) {
          return {
            async get() {
              const doc = ensureCollection(name).find((item) => item._id === id)
              return { data: doc ? clone(doc) : null }
            },
            async update({ data }) {
              const docs = ensureCollection(name)
              const index = docs.findIndex((item) => item._id === id)
              if (index === -1) {
                return { stats: { updated: 0 } }
              }
              docs[index] = { ...docs[index], ...clone(data) }
              return { stats: { updated: 1 } }
            }
          }
        }
      }
    }
  }
}

function instantiatePage(config) {
  const instance = {
    data: clone(config.data || {}),
    setData(updates, callback) {
      Object.entries(updates).forEach(([key, value]) => {
        setByPath(this.data, key, value)
      })

      if (typeof callback === 'function') {
        callback()
      }
    },
    getTabBar: jest.fn(() => null)
  }

  Object.keys(config).forEach((key) => {
    if (key === 'data') {
      return
    }

    const value = config[key]
    instance[key] = typeof value === 'function' ? value.bind(instance) : clone(value)
  })

  return instance
}

function freshRequire(modulePath) {
  let loadedModule
  jest.isolateModules(() => {
    loadedModule = require(modulePath)
  })
  return loadedModule
}

function createPage(modulePath) {
  lastRegisteredPage = null
  freshRequire(modulePath)

  if (!lastRegisteredPage) {
    throw new Error(`Page was not registered for module: ${modulePath}`)
  }

  return instantiatePage(lastRegisteredPage)
}

const mockWxServerSdk = {
  DYNAMIC_CURRENT_ENV: 'test-env',
  init: jest.fn(),
  getWXContext: jest.fn(() => clone(cloudState.context)),
  database: jest.fn(() => createDatabaseApi())
}

jest.doMock('wx-server-sdk', () => mockWxServerSdk, { virtual: true })

global.Page = jest.fn((config) => {
  lastRegisteredPage = config
  return config
})

global.Component = jest.fn((config) => config)

global.getApp = jest.fn(() => appState)

global.wx = {
  cloud: {
    init: jest.fn(),
    database: jest.fn(() => createDatabaseApi()),
    callFunction: jest.fn(async ({ name, data }) => {
      const handler = cloudState.callFunctionHandlers[name]
      if (!handler) {
        return { result: {} }
      }
      return handler({ name, data })
    })
  },
  showToast: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  reLaunch: jest.fn(),
  switchTab: jest.fn(),
  setNavigationBarTitle: jest.fn(),
  previewImage: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  clearStorageSync: jest.fn(),
  getSystemInfoSync: () => ({
    SDKVersion: '3.0.0',
    version: '8.0.0'
  })
}

global.setAppMock = (patch) => {
  appState = mergeObjects(DEFAULT_APP_STATE, patch)
  return appState
}

global.getAppMock = () => appState

global.setCloudContext = (patch) => {
  cloudState.context = mergeObjects(DEFAULT_CLOUD_CONTEXT, patch)
  return cloudState.context
}

global.setMockCollections = (collections) => {
  cloudState.collections = {}
  Object.keys(collections || {}).forEach((name) => {
    cloudState.collections[name] = clone(collections[name])
  })
}

global.getCollectionDocs = (name) => clone(ensureCollection(name))

global.setCallFunctionHandlers = (handlers) => {
  cloudState.callFunctionHandlers = { ...handlers }
}

global.createMiniProgramPage = createPage
global.freshRequire = freshRequire

beforeEach(() => {
  jest.restoreAllMocks()
  resetAppState()
  resetCloudState()
  lastRegisteredPage = null

  global.Page.mockImplementation((config) => {
    lastRegisteredPage = config
    return config
  })
  global.Component.mockImplementation((config) => config)
  global.getApp.mockImplementation(() => appState)

  mockWxServerSdk.init.mockClear()
  mockWxServerSdk.getWXContext.mockImplementation(() => clone(cloudState.context))
  mockWxServerSdk.database.mockImplementation(() => createDatabaseApi())

  global.wx.cloud.init.mockClear()
  global.wx.cloud.database.mockImplementation(() => createDatabaseApi())
  global.wx.cloud.callFunction.mockClear()
  global.wx.cloud.callFunction.mockImplementation(async ({ name, data }) => {
    const handler = cloudState.callFunctionHandlers[name]
    if (!handler) {
      return { result: {} }
    }
    return handler({ name, data })
  })

  global.wx.showToast.mockClear()
  global.wx.navigateTo.mockClear()
  global.wx.navigateBack.mockClear()
  global.wx.reLaunch.mockClear()
  global.wx.switchTab.mockClear()
  global.wx.setNavigationBarTitle.mockClear()
  global.wx.previewImage.mockClear()
  global.wx.showLoading.mockClear()
  global.wx.hideLoading.mockClear()
  global.wx.clearStorageSync.mockClear()

  jest.useRealTimers()
})
