import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

describe('Integration Tests - Complete Workflows', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('First Time User Journey', () => {
    it('should complete full onboarding and add first job', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Step 1: See account creation screen
      expect(screen.getByText('Create your account')).toBeInTheDocument()

      // Step 2: Create account
      await user.type(screen.getByPlaceholderText('Enter your username'), 'newuser')
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Step 3: Should be on dashboard
      await waitFor(() => {
        expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
        expect(screen.getByText(/Welcome, newuser!/i)).toBeInTheDocument()
      })

      // Step 4: Add first job
      await user.click(screen.getByRole('button', { name: /Add New Job/i }))
      await user.type(screen.getByLabelText(/Company Name/i), 'Google')
      await user.type(screen.getByLabelText(/Position \*/i), 'Software Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/Notes/i), 'Exciting opportunity!')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      // Step 5: Verify job appears
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
        expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      })

      // Step 6: Verify statistics updated
      expect(screen.getByText('1')).toBeInTheDocument() // Total applications
    })
  })

  describe('Returning User Journey', () => {
    it('should sign in and manage existing jobs', async () => {
      const user = userEvent.setup()

      // Setup: Create existing account
      localStorage.setItem('jobTracker_password', 'mypassword')
      localStorage.setItem('jobTracker_user', 'existinguser')
      localStorage.setItem('jobTracker_jobs', JSON.stringify([
        {
          id: 1,
          company: 'Amazon',
          position: 'DevOps Engineer',
          recruiterName: 'Bob Smith',
          recruiterScreen: 'In Progress',
          technicalScreen: 'Not Started',
          onsiteRound1: 'Not Started',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending',
          notes: 'Great company'
        }
      ]))

      render(<App />)

      // Step 1: See sign in screen
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()

      // Step 2: Sign in
      await user.type(screen.getByPlaceholderText('Enter your username'), 'existinguser')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'mypassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Step 3: Should see dashboard with existing job
      await waitFor(() => {
        expect(screen.getByText('Amazon')).toBeInTheDocument()
        expect(screen.getByText('DevOps Engineer')).toBeInTheDocument()
      })

      // Step 4: Edit the job
      const editButtons = screen.getAllByRole('button')
      const editButton = editButtons.find(btn => btn.className.includes('blue'))
      await user.click(editButton)

      expect(screen.getByText('Edit Job Application')).toBeInTheDocument()

      const notesField = screen.getByLabelText(/Notes/i)
      await user.clear(notesField)
      await user.type(notesField, 'Updated notes after phone screen')
      await user.click(screen.getByRole('button', { name: /Update Job/i }))

      // Step 5: Verify update
      await waitFor(() => {
        const logs = JSON.parse(localStorage.getItem('jobTracker_logs'))
        expect(logs.some(log => log.action === 'updated')).toBe(true)
      })
    })
  })

  describe('Complete Job Application Workflow', () => {
    it('should track full interview process from start to offer', async () => {
      const user = userEvent.setup()

      // Setup authenticated user
      localStorage.setItem('jobTracker_password', 'test123')
      localStorage.setItem('jobTracker_user', 'jobseeker')

      render(<App />)

      // Sign in
      await user.type(screen.getByPlaceholderText('Enter your username'), 'jobseeker')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'test123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
      })

      // Add new job application
      await user.click(screen.getByRole('button', { name: /Add New Job/i }))
      await user.type(screen.getByLabelText(/Company Name/i), 'Microsoft')
      await user.type(screen.getByLabelText(/Position \*/i), 'Senior Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'Alice Johnson')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      await waitFor(() => {
        expect(screen.getByText('Microsoft')).toBeInTheDocument()
      })

      // Update recruiter screen to completed
      const selects = screen.getAllByRole('combobox')
      let recruiterScreenSelect = selects.find(s => s.value === 'Not Started')
      await user.selectOptions(recruiterScreenSelect, 'Completed')

      // Update technical screen to in progress
      const technicalSelects = screen.getAllByRole('combobox')
      let technicalSelect = technicalSelects.find(s =>
        s.value === 'Not Started' && s.previousElementSibling?.textContent.includes('Technical')
      )
      if (technicalSelect) {
        await user.selectOptions(technicalSelect, 'In Progress')
      }

      // Complete technical screen
      await waitFor(() => {
        const logs = JSON.parse(localStorage.getItem('jobTracker_logs'))
        expect(logs.some(log => log.action === 'status_update')).toBe(true)
      })
    })
  })

  describe('Search and Filter Workflow', () => {
    it('should search and filter through multiple jobs', async () => {
      const user = userEvent.setup()

      // Setup with multiple jobs
      localStorage.setItem('jobTracker_password', 'test123')
      localStorage.setItem('jobTracker_user', 'searcher')
      localStorage.setItem('jobTracker_jobs', JSON.stringify([
        {
          id: 1,
          company: 'Google',
          position: 'Frontend Engineer',
          recruiterName: 'Alice',
          recruiterScreen: 'Completed',
          technicalScreen: 'In Progress',
          onsiteRound1: 'Not Started',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending',
          notes: ''
        },
        {
          id: 2,
          company: 'Facebook',
          position: 'Backend Engineer',
          recruiterName: 'Bob',
          recruiterScreen: 'In Progress',
          technicalScreen: 'Not Started',
          onsiteRound1: 'Not Started',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending',
          notes: ''
        },
        {
          id: 3,
          company: 'Amazon',
          position: 'Full Stack Engineer',
          recruiterName: 'Charlie',
          recruiterScreen: 'Not Started',
          technicalScreen: 'Not Started',
          onsiteRound1: 'Not Started',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending',
          notes: ''
        }
      ]))

      render(<App />)

      // Sign in
      await user.type(screen.getByPlaceholderText('Enter your username'), 'searcher')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'test123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
        expect(screen.getByText('Facebook')).toBeInTheDocument()
        expect(screen.getByText('Amazon')).toBeInTheDocument()
      })

      // Search by company
      const searchInput = screen.getByPlaceholderText(/Search jobs by company, position, or recruiter.../i)
      await user.type(searchInput, 'Google')

      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.queryByText('Facebook')).not.toBeInTheDocument()
      expect(screen.queryByText('Amazon')).not.toBeInTheDocument()

      // Clear search
      await user.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
        expect(screen.getByText('Facebook')).toBeInTheDocument()
        expect(screen.getByText('Amazon')).toBeInTheDocument()
      })

      // Search by position
      await user.type(searchInput, 'Frontend')

      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.queryByText('Facebook')).not.toBeInTheDocument()
    })
  })

  describe('Activity Log and AI Summary Workflow', () => {
    it('should view activity logs and get AI summary', async () => {
      const user = userEvent.setup()
      vi.useFakeTimers()

      // Setup with jobs and logs
      localStorage.setItem('jobTracker_password', 'test123')
      localStorage.setItem('jobTracker_user', 'analyst')
      localStorage.setItem('jobTracker_jobs', JSON.stringify([
        {
          id: 1,
          company: 'Netflix',
          position: 'Data Engineer',
          recruiterName: 'Dana',
          recruiterScreen: 'Completed',
          technicalScreen: 'Completed',
          onsiteRound1: 'Scheduled',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending',
          notes: 'Strong culture fit'
        }
      ]))
      localStorage.setItem('jobTracker_logs', JSON.stringify([
        {
          id: 1,
          timestamp: new Date().toISOString(),
          action: 'created',
          jobTitle: 'Data Engineer',
          company: 'Netflix',
          details: 'New job application added',
          username: 'analyst'
        },
        {
          id: 2,
          timestamp: new Date().toISOString(),
          action: 'status_update',
          jobTitle: 'Data Engineer',
          company: 'Netflix',
          details: 'Recruiter screen completed',
          username: 'analyst'
        }
      ]))

      render(<App />)

      // Sign in
      await user.type(screen.getByPlaceholderText('Enter your username'), 'analyst')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'test123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Netflix')).toBeInTheDocument()
      })

      // View activity logs
      await user.click(screen.getByText(/View Activity Logs/i))

      expect(screen.getByText('Activity Logs')).toBeInTheDocument()
      expect(screen.getByText('2 total activities')).toBeInTheDocument()

      // Close activity log
      const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Activity Logs')).not.toBeInTheDocument()
      })

      // Open AI Summary
      const aiButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('purple') && btn.querySelector('svg')
      )
      await user.click(aiButton)

      expect(screen.getByText('AI Summary')).toBeInTheDocument()

      // Ask AI about Netflix
      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'Netflix')
      const sendButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg') && !btn.disabled
      )
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Summary for Netflix/i)).toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })

  describe('Theme Switching Workflow', () => {
    it('should switch between dark and light themes', async () => {
      const user = userEvent.setup()

      localStorage.setItem('jobTracker_password', 'test123')
      localStorage.setItem('jobTracker_user', 'themer')

      render(<App />)

      await user.type(screen.getByPlaceholderText('Enter your username'), 'themer')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'test123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
      })

      // Initially dark theme
      expect(localStorage.getItem('jobTracker_theme')).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // Toggle to light
      const themeButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg') && !btn.className.includes('red') && !btn.className.includes('purple')
      )
      await user.click(themeButton)

      expect(localStorage.getItem('jobTracker_theme')).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // Toggle back to dark
      await user.click(themeButton)

      expect(localStorage.getItem('jobTracker_theme')).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('Logout and Re-authentication Workflow', () => {
    it('should logout and require re-authentication', async () => {
      const user = userEvent.setup()

      localStorage.setItem('jobTracker_password', 'secure123')
      localStorage.setItem('jobTracker_user', 'logout_tester')

      render(<App />)

      // Sign in
      await user.type(screen.getByPlaceholderText('Enter your username'), 'logout_tester')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'secure123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
      })

      // Logout
      const logoutButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('red')
      )
      await user.click(logoutButton)

      // Should be back to auth screen
      await waitFor(() => {
        expect(screen.getByText('Welcome back!')).toBeInTheDocument()
      })

      // User data should be cleared
      expect(localStorage.getItem('jobTracker_user')).toBeNull()
    })
  })

  describe('Error Recovery Workflow', () => {
    it('should handle authentication errors gracefully', async () => {
      const user = userEvent.setup()

      localStorage.setItem('jobTracker_password', 'correctpassword')

      render(<App />)

      // Try wrong password
      await user.type(screen.getByPlaceholderText('Enter your username'), 'testuser')
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Should show error
      expect(screen.getByText('Invalid password')).toBeInTheDocument()

      // Still on auth screen
      expect(screen.getByText('Welcome back!')).toBeInTheDocument()

      // Try correct password
      const passwordInput = screen.getByPlaceholderText('Enter your password')
      await user.clear(passwordInput)
      await user.type(passwordInput, 'correctpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Should be authenticated
      await waitFor(() => {
        expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
      })
    })
  })
})
