import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import { vi } from 'vitest'

const ThemeConsumer = () => {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.removeItem('jobTracker_theme')
  })

  it('defaults to dark theme and toggles across modes', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await user.click(screen.getByText('toggle'))

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('jobTracker_theme')).toBe('light')

    await user.click(screen.getByText('toggle'))
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
  })

  it('hydrates theme from localStorage', () => {
    localStorage.setItem('jobTracker_theme', 'light')
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
  })

  it('throws when useTheme is used outside the provider', () => {
    const BrokenConsumer = () => {
      useTheme()
      return null
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<BrokenConsumer />)).toThrow('useTheme must be used within ThemeProvider')
    consoleSpy.mockRestore()
  })
})
