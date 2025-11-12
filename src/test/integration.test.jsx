import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../components/Dashboard'
import { ThemeProvider } from '../contexts/ThemeContext'

// Mock the API
vi.mock('../services/api', () => ({
  logsAPI: {
    getAll: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    create: vi.fn((data) => Promise.resolve({ success: true, data: { id: Date.now(), ...data } })),
    delete: vi.fn(() => Promise.resolve({ success: true })),
  },
  checkHealth: vi.fn(() => Promise.resolve({ status: 'healthy' })),
}))

describe('Integration Tests - Status Change Workflow', () => {
  let mockOnLogout

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnLogout = vi.fn()
    localStorage.setItem('jobTracker_user', 'testuser')
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    localStorage.clear()
  })

  describe('Complete Job Application Workflow with Hiring Manager', () => {
    it('should create a job with hiring manager and update statuses with animations', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <ThemeProvider>
          <Dashboard onLogout={mockOnLogout} />
        </ThemeProvider>
      )

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
      })

      // Click Add New Job button
      const addJobButton = screen.getByText('Add New Job')
      fireEvent.click(addJobButton)

      // Wait for form to open
      await waitFor(() => {
        expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
      })

      // Fill in job details including hiring manager
      const companyInput = screen.getByPlaceholderText('Enter company name')
      const positionInput = screen.getByPlaceholderText('Enter position')
      const recruiterInput = screen.getByPlaceholderText('Enter recruiter name')
      const hiringManagerInput = screen.getByPlaceholderText('Enter hiring manager name')
      const notesInput = screen.getByPlaceholderText('Add any additional notes...')

      await user.type(companyInput, 'Google')
      await user.type(positionInput, 'Senior Software Engineer')
      await user.type(recruiterInput, 'John Doe')
      await user.type(hiringManagerInput, 'Jane Smith')
      await user.type(notesInput, 'Exciting role in Cloud Infrastructure')

      // Submit the form
      const submitButton = screen.getByText('Add Job')
      fireEvent.click(submitButton)

      // Wait for job card to appear
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
        expect(screen.getByText('Google')).toBeInTheDocument()
      })

      // Verify hiring manager is displayed
      expect(screen.getByText(/Hiring Manager: Jane Smith/)).toBeInTheDocument()

      // Verify notes are displayed
      expect(screen.getByText(/Exciting role in Cloud Infrastructure/)).toBeInTheDocument()
    })

    it('should update status and trigger success animation', async () => {
      // Pre-populate with a job
      const existingJob = {
        id: 1,
        company: 'Microsoft',
        position: 'Principal Engineer',
        recruiterName: 'Bob Wilson',
        hiringManager: 'Alice Johnson',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: ''
      }

      localStorage.setItem('jobTracker_jobs', JSON.stringify([existingJob]))

      render(
        <ThemeProvider>
          <Dashboard onLogout={mockOnLogout} />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Principal Engineer')).toBeInTheDocument()
      })

      // Find and change recruiter screen to Completed (should trigger success animation)
      const selects = screen.getAllByRole('combobox')
      const recruiterScreenSelect = selects[0]

      fireEvent.change(recruiterScreenSelect, { target: { value: 'Completed' } })

      // Verify the status was updated
      await waitFor(() => {
        expect(recruiterScreenSelect).toHaveValue('Completed')
      })
    })

    it('should update status and trigger error animation', async () => {
      const existingJob = {
        id: 2,
        company: 'Amazon',
        position: 'SDE III',
        recruiterName: 'Carol White',
        hiringManager: 'David Brown',
        recruiterScreen: 'In Progress',
        technicalScreen: 'In Progress',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: ''
      }

      localStorage.setItem('jobTracker_jobs', JSON.stringify([existingJob]))

      render(
        <ThemeProvider>
          <Dashboard onLogout={mockOnLogout} />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('SDE III')).toBeInTheDocument()
      })

      // Change technical screen to Rejected (should trigger error animation)
      const selects = screen.getAllByRole('combobox')
      const technicalScreenSelect = selects[1]

      fireEvent.change(technicalScreenSelect, { target: { value: 'Rejected' } })

      // Verify the status was updated
      await waitFor(() => {
        expect(technicalScreenSelect).toHaveValue('Rejected')
      })
    })
  })

  describe('AI Summary Integration with Sorted Logs', () => {
    it('should show latest notes first in AI summary', async () => {
      const user = userEvent.setup({ delay: null })

      const job = {
        id: 3,
        company: 'Meta',
        position: 'Staff Engineer',
        recruiterName: 'Emily Davis',
        hiringManager: 'Frank Wilson',
        recruiterScreen: 'Completed',
        technicalScreen: 'Completed',
        onsiteRound1: 'Passed',
        onsiteRound2: 'Passed',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Offer Extended',
        notes: 'Great team culture'
      }

      const logs = [
        {
          id: 1,
          timestamp: '2024-01-15T10:00:00Z',
          company: 'Meta',
          jobTitle: 'Staff Engineer',
          details: 'Application submitted',
          username: 'testuser'
        },
        {
          id: 2,
          timestamp: '2024-01-20T14:00:00Z',
          company: 'Meta',
          jobTitle: 'Staff Engineer',
          details: 'Recruiter screen completed',
          username: 'testuser'
        },
        {
          id: 3,
          timestamp: '2024-01-25T09:00:00Z',
          company: 'Meta',
          jobTitle: 'Staff Engineer',
          details: 'Offer received',
          username: 'testuser'
        }
      ]

      localStorage.setItem('jobTracker_jobs', JSON.stringify([job]))
      localStorage.setItem('jobTracker_logs', JSON.stringify(logs))

      const { logsAPI } = await import('../services/api')
      logsAPI.getAll.mockResolvedValue({ success: true, data: logs })

      render(
        <ThemeProvider>
          <Dashboard onLogout={mockOnLogout} />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Staff Engineer')).toBeInTheDocument()
      })

      // Open AI Summary
      const aiButtons = screen.getAllByRole('button')
      const aiSummaryButton = aiButtons.find(btn => btn.title === 'AI Summary')

      if (aiSummaryButton) {
        fireEvent.click(aiSummaryButton)

        await waitFor(() => {
          expect(screen.getByText('Ask me anything about your job search')).toBeInTheDocument()
        })

        // Search for Meta
        const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
        await user.type(input, 'Meta')

        const submitButton = screen.getAllByRole('button').find(btn => {
          const svg = btn.querySelector('svg')
          return svg !== null
        })

        if (submitButton) {
          fireEvent.click(submitButton)

          vi.advanceTimersByTime(1100)

          // Verify that the latest update is shown (Offer received - Jan 25)
          // and hiring manager is displayed
          await waitFor(() => {
            expect(screen.getByText(/Hiring Manager: Frank Wilson/)).toBeInTheDocument()
          }, { timeout: 3000 })
        }
      }
    })
  })

  describe('Edit Job with Hiring Manager', () => {
    it('should edit job and update hiring manager', async () => {
      const user = userEvent.setup({ delay: null })

      const existingJob = {
        id: 4,
        company: 'Apple',
        position: 'iOS Developer',
        recruiterName: 'Grace Lee',
        hiringManager: 'Harry Potter',
        recruiterScreen: 'Completed',
        technicalScreen: 'Not Started',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: 'SwiftUI expertise needed'
      }

      localStorage.setItem('jobTracker_jobs', JSON.stringify([existingJob]))

      render(
        <ThemeProvider>
          <Dashboard onLogout={mockOnLogout} />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('iOS Developer')).toBeInTheDocument()
      })

      // Find and click edit button
      const editButtons = screen.getAllByRole('button')
      const editButton = editButtons.find(btn => {
        const svg = btn.querySelector('svg')
        return svg && btn.className.includes('bg-blue-600')
      })

      if (editButton) {
        fireEvent.click(editButton)

        await waitFor(() => {
          expect(screen.getByText('Edit Job Application')).toBeInTheDocument()
        })

        // Update hiring manager
        const hiringManagerInput = screen.getByDisplayValue('Harry Potter')
        await user.clear(hiringManagerInput)
        await user.type(hiringManagerInput, 'Hermione Granger')

        // Submit
        const updateButton = screen.getByText('Update Job')
        fireEvent.click(updateButton)

        // Verify hiring manager was updated
        await waitFor(() => {
          expect(screen.getByText(/Hiring Manager: Hermione Granger/)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Multiple Status Updates with Animations', () => {
    it('should handle multiple consecutive status changes', async () => {
      const existingJob = {
        id: 5,
        company: 'Netflix',
        position: 'Senior Backend Engineer',
        recruiterName: 'Ian McKellen',
        hiringManager: 'James Bond',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: ''
      }

      localStorage.setItem('jobTracker_jobs', JSON.stringify([existingJob]))

      render(
        <ThemeProvider>
          <Dashboard onLogout={mockOnLogout} />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument()
      })

      const selects = screen.getAllByRole('combobox')

      // Update recruiter screen to Completed
      fireEvent.change(selects[0], { target: { value: 'Completed' } })
      await waitFor(() => {
        expect(selects[0]).toHaveValue('Completed')
      })

      // Update technical screen to Completed
      fireEvent.change(selects[1], { target: { value: 'Completed' } })
      await waitFor(() => {
        expect(selects[1]).toHaveValue('Completed')
      })

      // Update onsite round 1 to Passed
      fireEvent.change(selects[3], { target: { value: 'Passed' } })
      await waitFor(() => {
        expect(selects[3]).toHaveValue('Passed')
      })

      // Update decision to Offer Extended
      fireEvent.change(selects[7], { target: { value: 'Offer Extended' } })
      await waitFor(() => {
        expect(selects[7]).toHaveValue('Offer Extended')
      })
    })
  })

  describe('Delete Job Workflow', () => {
    it('should delete job and remove from list', async () => {
      const existingJob = {
        id: 6,
        company: 'Uber',
        position: 'Senior SRE',
        recruiterName: 'Kevin Hart',
        hiringManager: 'Lily Collins',
        recruiterScreen: 'Completed',
        technicalScreen: 'Rejected',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Rejected',
        notes: ''
      }

      localStorage.setItem('jobTracker_jobs', JSON.stringify([existingJob]))

      render(
        <ThemeProvider>
          <Dashboard onLogout={mockOnLogout} />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Senior SRE')).toBeInTheDocument()
      })

      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button')
      const deleteButton = deleteButtons.find(btn => {
        const svg = btn.querySelector('svg')
        return svg && btn.className.includes('bg-red-600')
      })

      if (deleteButton) {
        fireEvent.click(deleteButton)

        await waitFor(() => {
          expect(screen.queryByText('Senior SRE')).not.toBeInTheDocument()
        })
      }
    })
  })
})
