import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import React from 'react'

// Cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
  const createMotionComponent = (tag) => {
    return ({ children, ...props }) => {
      const cleanProps = { ...props }
      delete cleanProps.initial
      delete cleanProps.animate
      delete cleanProps.exit
      delete cleanProps.transition
      delete cleanProps.whileHover
      delete cleanProps.whileTap
      return React.createElement(tag, cleanProps, children)
    }
  }

  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      form: createMotionComponent('form'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      p: createMotionComponent('p'),
      input: createMotionComponent('input'),
    },
    AnimatePresence: ({ children }) => children,
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
