import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Auth from '../Auth'

describe('Auth Component', () => {
  let onAuthenticated

  beforeEach(() => {
    onAuthenticated = vi.fn()
    localStorage.clear()
  })

  describe('First Time User - Account Creation', () => {
    it('should render account creation form when no password exists', () => {
      render(<Auth onAuthenticated={onAuthenticated} />)

      expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should successfully create account with valid inputs', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(localStorage.getItem('jobTracker_password')).toBe('password123')
        expect(localStorage.getItem('jobTracker_user')).toBe('testuser')
        expect(onAuthenticated).toHaveBeenCalledTimes(1)
      })
    })

    it('should show error when username is empty', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Please enter a username')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })

    it('should show error when username is only whitespace', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), '   ')
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Please enter a username')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })

    it('should show error when password is too short', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'pass')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'pass')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })

    it('should show error when password is exactly 5 characters', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'pass5')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'pass5')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })

    it('should accept password with exactly 6 characters', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'pass12')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'pass12')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password456')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })

    it('should clear error when form is resubmitted with valid data', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      // First submission with error
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Please enter a username')).toBeInTheDocument()
      })

      // Second submission with valid data
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.queryByText('Please enter a username')).not.toBeInTheDocument()
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should handle special characters in username', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'test@user.com')
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(localStorage.getItem('jobTracker_user')).toBe('test@user.com')
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should handle special characters in password', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'p@$$w0rd!')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'p@$$w0rd!')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(localStorage.getItem('jobTracker_password')).toBe('p@$$w0rd!')
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })
  })

  describe('Returning User - Sign In', () => {
    beforeEach(() => {
      localStorage.setItem('jobTracker_password', 'existingpass123')
    })

    it('should render sign in form when password exists', () => {
      render(<Auth onAuthenticated={onAuthenticated} />)

      expect(screen.getByText('Welcome back!')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Confirm your password')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should successfully sign in with correct password', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'existingpass123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(localStorage.getItem('jobTracker_user')).toBe('testuser')
        expect(onAuthenticated).toHaveBeenCalledTimes(1)
      })
    })

    it('should show error with incorrect password', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })

    it('should show error when username is empty on sign in', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your password'), 'existingpass123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Please enter a username')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })

    it('should handle form submission via Enter key', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      const usernameInput = screen.getByPlaceholderText('Enter your username')
      const passwordInput = screen.getByPlaceholderText('Enter your password')

      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'existingpass123{Enter}')

      await waitFor(() => {
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should be case-sensitive for password', async () => {
      const user = userEvent.setup()
      localStorage.setItem('jobTracker_password', 'Password123')
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })
  })

  describe('UI Elements', () => {
    it('should render all icons', () => {
      render(<Auth onAuthenticated={onAuthenticated} />)

      // Sparkles icon should be present
      const sparklesIcon = screen.getByRole('heading', { name: /job search tracker/i }).parentElement.querySelector('svg')
      expect(sparklesIcon).toBeInTheDocument()
    })

    it('should have password input type for security', () => {
      localStorage.setItem('jobTracker_password', 'test')
      render(<Auth onAuthenticated={onAuthenticated} />)

      const passwordInput = screen.getByPlaceholderText('Enter your password')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should have text input for username', () => {
      render(<Auth onAuthenticated={onAuthenticated} />)

      const usernameInput = screen.getByPlaceholderText('Enter your username')
      expect(usernameInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long username', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      const longUsername = 'a'.repeat(100)
      await user.type(screen.getByPlaceholderText('Enter your username'), longUsername)
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(localStorage.getItem('jobTracker_user')).toBe(longUsername)
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should handle very long password', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      const longPassword = 'a'.repeat(100)
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), longPassword)
      await user.type(screen.getByPlaceholderText('Confirm your password'), longPassword)
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(localStorage.getItem('jobTracker_password')).toBe(longPassword)
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should handle empty password on sign in', async () => {
      const user = userEvent.setup()
      localStorage.setItem('jobTracker_password', 'test123')
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument()
        expect(onAuthenticated).not.toHaveBeenCalled()
      })
    })

    it('should handle password with only spaces', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Create a password'), '      ')
      await user.type(screen.getByPlaceholderText('Confirm your password'), '      ')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should handle unicode characters in username', async () => {
      const user = userEvent.setup()
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), '用户名')
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(localStorage.getItem('jobTracker_user')).toBe('用户名')
        expect(onAuthenticated).toHaveBeenCalled()
      })
    })

    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup()
      localStorage.setItem('jobTracker_password', 'test123')
      render(<Auth onAuthenticated={onAuthenticated} />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'test123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)

      await waitFor(() => {
        // Should only call once even with multiple clicks
        expect(onAuthenticated).toHaveBeenCalledTimes(1)
      })
    })
  })
})
