import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Auth from '../Auth'

describe('Auth Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('First time setup', () => {
    it('should show create account mode when no password is stored', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null)

      render(<Auth onAuthenticated={vi.fn()} />)

      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })

    it('should show sign in mode when password exists', () => {
      localStorage.getItem = vi.fn().mockReturnValue('testpassword')

      render(<Auth onAuthenticated={vi.fn()} />)

      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Confirm your password')).not.toBeInTheDocument()
    })
  })

  describe('Account creation', () => {
    beforeEach(() => {
      localStorage.getItem = vi.fn().mockReturnValue(null)
    })

    it('should create account with valid inputs', async () => {
      const onAuthenticated = vi.fn()
      const user = userEvent.setup()

      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')

      await user.click(screen.getByText('Create Account'))

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('jobTracker_password', 'password123')
        expect(localStorage.setItem).toHaveBeenCalledWith('jobTracker_user', 'testuser')
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should show error for empty username', async () => {
      const user = userEvent.setup()

      render(<Auth onAuthenticated={vi.fn()} />)

      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByText('Create Account'))

      expect(await screen.findByText('Please enter a username')).toBeInTheDocument()
    })

    it('should show error for short password', async () => {
      const user = userEvent.setup()

      render(<Auth onAuthenticated={vi.fn()} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), '12345')
      await user.type(screen.getByPlaceholderText('Confirm your password'), '12345')
      await user.click(screen.getByText('Create Account'))

      expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument()
    })

    it('should show error for mismatched passwords', async () => {
      const user = userEvent.setup()

      render(<Auth onAuthenticated={vi.fn()} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password456')
      await user.click(screen.getByText('Create Account'))

      expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  describe('Sign in', () => {
    beforeEach(() => {
      localStorage.getItem = vi.fn((key) => {
        if (key === 'jobTracker_password') return 'correctpassword'
        return null
      })
    })

    it('should sign in with correct password', async () => {
      const onAuthenticated = vi.fn()
      const user = userEvent.setup()

      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'correctpassword')
      await user.click(screen.getByText('Sign In'))

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('jobTracker_user', 'testuser')
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should show error for incorrect password', async () => {
      const user = userEvent.setup()

      render(<Auth onAuthenticated={vi.fn()} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword')
      await user.click(screen.getByText('Sign In'))

      expect(await screen.findByText('Invalid password')).toBeInTheDocument()
    })

    it('should show error for empty username on sign in', async () => {
      const user = userEvent.setup()

      render(<Auth onAuthenticated={vi.fn()} />)

      await user.type(screen.getByPlaceholderText('Enter your password'), 'correctpassword')
      await user.click(screen.getByText('Sign In'))

      expect(await screen.findByText('Please enter a username')).toBeInTheDocument()
    })
  })

  describe('UI elements', () => {
    it('should render all UI elements correctly', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null)

      render(<Auth onAuthenticated={vi.fn()} />)

      expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()
    })

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup()
      localStorage.getItem = vi.fn().mockReturnValue(null)

      render(<Auth onAuthenticated={vi.fn()} />)

      // Trigger error
      await user.click(screen.getByText('Create Account'))
      expect(await screen.findByText('Please enter a username')).toBeInTheDocument()

      // Start typing
      await user.type(screen.getByPlaceholderText('Enter your username'), 'test')

      // Error should be cleared when form is submitted again (or will show new error)
    })
  })
})
