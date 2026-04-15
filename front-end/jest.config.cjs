module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/env.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|svg)$': '<rootDir>/tests/fileMock.js',
    '^.+config/env\\.js$': '<rootDir>/tests/mocks/envConfig.js',
  },
  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/App.jsx',
    '!src/**/*.config.js',
    '!src/pages/**',
    '!src/components/**',
    '!src/AIInsightsTab/**',
    '!src/assets/**',
    '!src/data/**',
    '!src/api/**',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
