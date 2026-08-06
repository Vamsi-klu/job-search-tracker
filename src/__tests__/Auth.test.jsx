import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Auth from '../components/Auth'

describe('Auth component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows create-account flow when no password exists and enforces validation', async () => {
    const user = userEvent.setup()
    render(<Auth onAuthenticated={vi.fn()} />)

    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Enter your username'), 'alex')
    await user.type(screen.getByPlaceholderText('Create a password'), 'short')
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'different')
    await user.click(screen.getByRole('button', { name: /Create Account/i }))

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('Create a password'))
    await user.type(screen.getByPlaceholderText('Create a password'), 'longen')
    await user.click(screen.getByRole('button', { name: /Create Account/i }))
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
  })

  it('creates account and stores credentials when valid', async () => {
    const onAuthenticated = vi.fn()
    const user = userEvent.setup()
    render(<Auth onAuthenticated={onAuthenticated} />)

    await user.type(screen.getByPlaceholderText('Enter your username'), 'alex')
    await user.type(screen.getByPlaceholderText('Create a password'), 'longen')
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'longen')
    await user.click(screen.getByRole('button', { name: /Create Account/i }))

    expect(localStorage.getItem('jobTracker_user')).toBe('alex')
    expect(localStorage.getItem('jobTracker_password')).toBe('longen')
    expect(onAuthenticated).toHaveBeenCalled()
  })

  it('handles signin success and failure', async () => {
    localStorage.setItem('jobTracker_password', 'secret')
    const onAuthenticated = vi.fn()
    const user = userEvent.setup()

    render(<Auth onAuthenticated={onAuthenticated} />)

    await user.type(screen.getByPlaceholderText('Enter your username'), 'jordan')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(screen.getByText('Invalid password')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('Enter your password'))
    await user.type(screen.getByPlaceholderText('Enter your password'), 'secret')
    await user.click(screen.getByRole('button', { name: /Sign In/i }))

    expect(localStorage.getItem('jobTracker_user')).toBe('jordan')
    expect(onAuthenticated).toHaveBeenCalled()
  })

  it('prevents submission when username is missing', async () => {
    const user = userEvent.setup()
    render(<Auth onAuthenticated={() => {}} />)

    await user.click(screen.getByRole('button', { name: /Create Account/i }))
    expect(screen.getByText('Please enter a username')).toBeInTheDocument()
  })
})
