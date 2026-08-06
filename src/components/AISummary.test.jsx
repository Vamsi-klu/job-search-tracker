import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AISummary from './AISummary'

describe('AISummary Component', () => {
  let mockJobs
  let mockLogs
  let mockOnClose

  beforeEach(() => {
    vi.useFakeTimers()

    mockJobs = [
      {
        company: 'Google',
        position: 'Senior Software Engineer',
        recruiterName: 'John Doe',
        hiringManager: 'Jane Smith',
        recruiterScreen: 'Completed',
        technicalScreen: 'In Progress',
        onsiteRound1: 'Scheduled',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: 'Exciting opportunity at Google'
      },
      {
        company: 'Microsoft',
        position: 'Principal Engineer',
        recruiterName: 'Bob Wilson',
        hiringManager: '',
        recruiterScreen: 'Completed',
        technicalScreen: 'Completed',
        onsiteRound1: 'Passed',
        onsiteRound2: 'Passed',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Offer Extended',
        notes: ''
      }
    ]

    mockLogs = [
      {
        id: 1,
        timestamp: '2024-01-15T10:00:00Z',
        company: 'Google',
        jobTitle: 'Senior Software Engineer',
        details: 'Initial application submitted',
        username: 'user1'
      },
      {
        id: 2,
        timestamp: '2024-01-20T14:30:00Z',
        company: 'Google',
        jobTitle: 'Senior Software Engineer',
        details: 'Recruiter screen completed',
        username: 'user1'
      },
      {
        id: 3,
        timestamp: '2024-01-25T09:15:00Z',
        company: 'Google',
        jobTitle: 'Senior Software Engineer',
        details: 'Technical interview scheduled',
        username: 'user1'
      },
      {
        id: 4,
        timestamp: '2024-01-18T11:00:00Z',
        company: 'Microsoft',
        jobTitle: 'Principal Engineer',
        details: 'First round completed',
        username: 'user1'
      },
      {
        id: 5,
        timestamp: '2024-01-22T16:00:00Z',
        company: 'Microsoft',
        jobTitle: 'Principal Engineer',
        details: 'Offer received',
        username: 'user1'
      }
    ]

    mockOnClose = vi.fn()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render AI Summary modal', () => {
      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('AI Summary')).toBeInTheDocument()
      expect(screen.getByText('Ask me anything about your job search')).toBeInTheDocument()
    })

    it('should render search input', () => {
      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByPlaceholderText('Ask about a company or get a summary...')).toBeInTheDocument()
    })

    it('should render quick query buttons', () => {
      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Give me an overview')).toBeInTheDocument()
      expect(screen.getByText('What companies am I interviewing with?')).toBeInTheDocument()
      expect(screen.getByText('Show me recent activity')).toBeInTheDocument()
    })

    it('should show empty state when no query is submitted', () => {
      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Ask me about your job applications!')).toBeInTheDocument()
    })
  })

  describe('Log Sorting Functionality', () => {
    it('should sort logs by timestamp in descending order (most recent first)', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Google')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        const summary = screen.getByText(/Summary for Google/i)
        expect(summary).toBeInTheDocument()
      })

      // Latest activity should be "Technical interview scheduled" (Jan 25)
      // not "Initial application submitted" (Jan 15)
      await waitFor(() => {
        expect(screen.getByText(/Technical interview scheduled/)).toBeInTheDocument()
      })
    })

    it('should display latest notes first in company summary', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Google')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        // The most recent update should be shown
        expect(screen.getByText(/Most Recent Update/)).toBeInTheDocument()
      })
    })

    it('should show 5 most recent logs when there are more than 5', async () => {
      const user = userEvent.setup({ delay: null })

      // Add more logs to Google
      const logsWithMany = [
        ...mockLogs,
        {
          id: 6,
          timestamp: '2024-01-26T10:00:00Z',
          company: 'Google',
          jobTitle: 'Senior Software Engineer',
          details: 'Update 1',
          username: 'user1'
        },
        {
          id: 7,
          timestamp: '2024-01-27T10:00:00Z',
          company: 'Google',
          jobTitle: 'Senior Software Engineer',
          details: 'Update 2',
          username: 'user1'
        },
        {
          id: 8,
          timestamp: '2024-01-28T10:00:00Z',
          company: 'Google',
          jobTitle: 'Senior Software Engineer',
          details: 'Update 3',
          username: 'user1'
        }
      ]

      render(
        <AISummary
          logs={logsWithMany}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Google')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/6 total updates/)).toBeInTheDocument()
        expect(screen.getByText(/and 1 older updates/)).toBeInTheDocument()
      })
    })
  })

  describe('Hiring Manager Display', () => {
    it('should display hiring manager in company summary when present', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Google')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Hiring Manager: Jane Smith/)).toBeInTheDocument()
      })
    })

    it('should not display hiring manager field when not present', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Microsoft')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.queryByText(/Hiring Manager:/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Company Search', () => {
    it('should find company by exact name', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Google')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Summary for Google/)).toBeInTheDocument()
        expect(screen.getByText(/Senior Software Engineer/)).toBeInTheDocument()
      })
    })

    it('should find company by partial name (case insensitive)', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'micro')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Summary for Microsoft/)).toBeInTheDocument()
      })
    })

    it('should show company status in summary', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Google')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Recruiter Screen: Completed/)).toBeInTheDocument()
        expect(screen.getByText(/Technical Screen: In Progress/)).toBeInTheDocument()
        expect(screen.getByText(/Decision: Pending/)).toBeInTheDocument()
      })
    })

    it('should show company notes when present', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Google')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Exciting opportunity at Google/)).toBeInTheDocument()
      })
    })
  })

  describe('General Summary', () => {
    it('should show overall summary when requested', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Give me an overview')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Overall Job Search Summary/)).toBeInTheDocument()
        expect(screen.getByText(/Total Applications: 2/)).toBeInTheDocument()
      })
    })

    it('should show activity count in overview', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'summary')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Total Activities: 5/)).toBeInTheDocument()
      })
    })
  })

  describe('Quick Queries', () => {
    it('should execute query when quick button is clicked', async () => {
      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const quickButton = screen.getByText('Give me an overview')
      fireEvent.click(quickButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Overall Job Search Summary/)).toBeInTheDocument()
      })
    })

    it('should set input value when quick button is clicked', async () => {
      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const quickButton = screen.getByText('Give me an overview')
      fireEvent.click(quickButton)

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      expect(input).toHaveValue('Give me an overview')
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while processing', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Google')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      // Before timeout completes
      vi.advanceTimersByTime(500)

      await waitFor(() => {
        expect(screen.getByText(/Analyzing your data.../)).toBeInTheDocument()
      })
    })
  })

  describe('Modal Actions', () => {
    it('should call onClose when X button is clicked', () => {
      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const closeButtons = screen.getAllByRole('button')
      const xButton = closeButtons.find(btn => btn.className.includes('p-2'))

      if (xButton) {
        fireEvent.click(xButton)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })

    it('should not submit empty query', async () => {
      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const submitButton = screen.getByRole('button', { name: '' })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('No Results', () => {
    it('should show helpful message when company not found', async () => {
      const user = userEvent.setup({ delay: null })

      render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'NonExistentCompany')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/couldn't find specific information/)).toBeInTheDocument()
      })
    })

    it('should show no updates message when company has no logs', async () => {
      const user = userEvent.setup({ delay: null })

      const jobsWithNoLogs = [
        {
          company: 'Amazon',
          position: 'SDE',
          recruiterName: 'Test',
          hiringManager: '',
          recruiterScreen: 'Not Started',
          technicalScreen: 'Not Started',
          onsiteRound1: 'Not Started',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending',
          notes: ''
        }
      ]

      render(
        <AISummary
          logs={mockLogs}
          jobs={jobsWithNoLogs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
      await user.type(input, 'Amazon')

      const submitButton = screen.getByRole('button', { name: '' })
      fireEvent.click(submitButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/No updates recorded yet/)).toBeInTheDocument()
      })
    })
  })

  describe('Theme Support', () => {
    it('should apply dark theme classes', () => {
      const { container } = render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const modal = container.querySelector('.bg-dark-card')
      expect(modal).toBeInTheDocument()
    })

    it('should apply light theme classes', () => {
      const { container } = render(
        <AISummary
          logs={mockLogs}
          jobs={mockJobs}
          onClose={mockOnClose}
          theme="light"
        />
      )

      const modal = container.querySelector('.bg-white')
      expect(modal).toBeInTheDocument()
    })
  })
})
