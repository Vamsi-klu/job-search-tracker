import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../ThemeContext'

// Test component to access theme context
function TestComponent() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  describe('ThemeProvider', () => {
    it('should provide default theme as dark when no localStorage value exists', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(localStorage.getItem('jobTracker_theme')).toBe('dark')
    })

    it('should load theme from localStorage if it exists', () => {
      localStorage.setItem('jobTracker_theme', 'light')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })

    it('should add dark class to documentElement when theme is dark', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove dark class from documentElement when theme is light', () => {
      localStorage.setItem('jobTracker_theme', 'light')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should toggle theme from dark to light', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')

      await user.click(screen.getByRole('button', { name: /toggle theme/i }))

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
      expect(localStorage.getItem('jobTracker_theme')).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should toggle theme from light to dark', async () => {
      const user = userEvent.setup()
      localStorage.setItem('jobTracker_theme', 'light')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')

      await user.click(screen.getByRole('button', { name: /toggle theme/i }))

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(localStorage.getItem('jobTracker_theme')).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should toggle theme multiple times', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })

      // Dark -> Light
      await user.click(button)
      expect(screen.getByTestId('theme')).toHaveTextContent('light')

      // Light -> Dark
      await user.click(button)
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')

      // Dark -> Light
      await user.click(button)
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })

    it('should persist theme changes to localStorage', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByRole('button', { name: /toggle theme/i }))

      expect(localStorage.getItem('jobTracker_theme')).toBe('light')
    })

    it('should update documentElement class when theme changes', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Initially dark
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // Toggle to light
      await user.click(screen.getByRole('button', { name: /toggle theme/i }))
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // Toggle back to dark
      await user.click(screen.getByRole('button', { name: /toggle theme/i }))
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useTheme must be used within ThemeProvider')

      console.error = originalError
    })

    it('should provide theme and toggleTheme function', () => {
      const TestComponent = () => {
        const context = useTheme()

        return (
          <div>
            <div data-testid="has-theme">{typeof context.theme}</div>
            <div data-testid="has-toggle">{typeof context.toggleTheme}</div>
          </div>
        )
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('has-theme')).toHaveTextContent('string')
      expect(screen.getByTestId('has-toggle')).toHaveTextContent('function')
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid theme value in localStorage', () => {
      localStorage.setItem('jobTracker_theme', 'invalid')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should still render with invalid value
      expect(screen.getByTestId('theme')).toHaveTextContent('invalid')
    })

    it('should handle corrupted localStorage', () => {
      // Set invalid JSON
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => null),
          setItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    it('should handle rapid theme toggles', async () => {
      const user = userEvent.setup()
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      const button = screen.getByRole('button', { name: /toggle theme/i })

      // Rapid clicks
      await user.click(button)
      await user.click(button)
      await user.click(button)
      await user.click(button)

      // Should end up at dark after even number of clicks
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    it('should work with multiple children components', () => {
      const Child1 = () => {
        const { theme } = useTheme()
        return <div data-testid="child1">{theme}</div>
      }

      const Child2 = () => {
        const { theme } = useTheme()
        return <div data-testid="child2">{theme}</div>
      }

      render(
        <ThemeProvider>
          <Child1 />
          <Child2 />
        </ThemeProvider>
      )

      expect(screen.getByTestId('child1')).toHaveTextContent('dark')
      expect(screen.getByTestId('child2')).toHaveTextContent('dark')
    })

    it('should maintain theme across component rerenders', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByRole('button', { name: /toggle theme/i }))
      expect(screen.getByTestId('theme')).toHaveTextContent('light')

      // Rerender
      rerender(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })

    it('should handle localStorage quota exceeded error', async () => {
      const user = userEvent.setup()

      // Mock setItem to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should not crash
      await user.click(screen.getByRole('button', { name: /toggle theme/i }))

      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('Nested Providers', () => {
    it('should use the innermost provider', () => {
      localStorage.setItem('jobTracker_theme', 'dark')

      const TestComponentInner = () => {
        const { theme } = useTheme()
        return <div data-testid="inner-theme">{theme}</div>
      }

      render(
        <ThemeProvider>
          <div data-testid="outer">
            <ThemeProvider>
              <TestComponentInner />
            </ThemeProvider>
          </div>
        </ThemeProvider>
      )

      expect(screen.getByTestId('inner-theme')).toHaveTextContent('dark')
    })
  })
})
