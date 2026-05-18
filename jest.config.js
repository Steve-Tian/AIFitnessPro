module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'miniprogram/utils/**/*.js',
    'cloudfunctions/**/index.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/.codebuddy/**'
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html']
}
