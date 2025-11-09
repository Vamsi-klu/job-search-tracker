import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../App'

vi.mock('../components/Auth', () => ({
  default: ({ onAuthenticated }) => (
    <button onClick={() => {
      localStorage.setItem('jobTracker_user', 'mock-user')
      onAuthenticated()
    }}>
      MockAuth
    </button>
  )
}))

vi.mock('../components/Dashboard', () => ({
  default: ({ onLogout }) => (
    <div>
      <span>MockDashboard</span>
      <button onClick={() => {
        onLogout()
      }}>Logout</button>
    </div>
  )
}))

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders auth flow then dashboard after authentication', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => expect(screen.getByText('MockAuth')).toBeInTheDocument())
    await user.click(screen.getByText('MockAuth'))

    expect(await screen.findByText('MockDashboard')).toBeInTheDocument()
  })

  it('loads dashboard when user already authenticated and supports logout', async () => {
    localStorage.setItem('jobTracker_user', 'existing-user')
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('MockDashboard')).toBeInTheDocument()
    await user.click(screen.getByText('Logout'))
    expect(localStorage.getItem('jobTracker_user')).toBeNull()
    await waitFor(() => expect(screen.getByText('MockAuth')).toBeInTheDocument())
  })
})
