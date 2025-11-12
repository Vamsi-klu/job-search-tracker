export default {
  testEnvironment: 'node',
  transform: {},
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Exclude server entry point
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 87,
      functions: 93,
      lines: 82,
      statements: 82,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  verbose: true,
};
