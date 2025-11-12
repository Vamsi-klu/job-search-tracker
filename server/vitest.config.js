import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/test/**',
        '**/__tests__/**',
        'dist/',
        'vitest.config.js',
        'src/index.js' // Main entry point with server setup
      ],
      all: true,
      lines: 95,
      functions: 95,
      branches: 95,
      statements: 95
    }
  }
})
