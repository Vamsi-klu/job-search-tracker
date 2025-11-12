import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import '@testing-library/jest-dom/vitest'

// Mock child components
vi.mock('../components/Auth', () => ({
  default: ({ onAuthenticated }) => (
    <div data-testid="auth">
      <button onClick={() => onAuthenticated('testuser')}>Login</button>
    </div>
  )
}))

vi.mock('../components/Dashboard', () => ({
  default: ({ onLogout }) => (
    <div data-testid="dashboard">
      <button onClick={onLogout}>Logout</button>
    </div>
  )
}))

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render auth component when not authenticated', () => {
    render(<App />)

    expect(screen.getByTestId('auth')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
  })

  it('should show dashboard after successful authentication', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      expect(screen.queryByTestId('auth')).not.toBeInTheDocument()
    })
  })

  it('should return to auth screen after logout', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Login
    await user.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })

    // Logout
    await user.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toBeInTheDocument()
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
    })
  })

  it('should restore authenticated state from localStorage', () => {
    localStorage.setItem('jobTracker_user', 'testuser')

    render(<App />)

    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })

  it('should handle authentication state updates', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByTestId('auth')).toBeInTheDocument()

    await user.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })

    // The user state is managed by App component
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })
})
