module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'miniprogram/utils/**/*.js',
    'cloudfunctions/**/index.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html']
}
