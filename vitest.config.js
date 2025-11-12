import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.jsx',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/test/**',
        '**/__tests__/**',
        'dist/',
        '.eslintrc.cjs',
        'vite.config.js',
        'vitest.config.js',
        'tailwind.config.js',
        'postcss.config.js'
      ],
      all: true,
      lines: 95,
      functions: 95,
      branches: 95,
      statements: 95
    }
  }
})
