import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.jsx',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/main.jsx',
        'dist/',
        'src/components/AISummary.jsx' // Exclude mock AI logic from strict threshold
      ],
      thresholds: {
        lines: 85,
        functions: 80,
        branches: 90,
        statements: 85
      },
      perFile: true
    }
  }
})
