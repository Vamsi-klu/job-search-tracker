import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AISummary from '../AISummary'
import { renderWithProviders, createMockLogs, createMockJobs } from '../../test/utils'

describe('AISummary Component', () => {
  let onClose

  beforeEach(() => {
    onClose = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render AI Summary modal', () => {
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('AI Summary')).toBeInTheDocument()
      expect(screen.getByText('Ask me anything about your job search')).toBeInTheDocument()
    })

    it('should render quick query buttons', () => {
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Give me an overview')).toBeInTheDocument()
      expect(screen.getByText('What companies am I interviewing with?')).toBeInTheDocument()
      expect(screen.getByText('Show me recent activity')).toBeInTheDocument()
    })

    it('should render input field', () => {
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByPlaceholderText(/Ask about a company or get a summary.../i)).toBeInTheDocument()
    })

    it('should render send button', () => {
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should show initial placeholder message', () => {
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Ask me about your job applications!')).toBeInTheDocument()
    })
  })

  describe('Query Submission', () => {
    it('should accept text input', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText(/Ask about a company or get a summary.../i)
      await user.type(input, 'Test query')

      expect(input).toHaveValue('Test query')
    })

    it('should submit query on button click', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = createMockJobs(1)

      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText(/Ask about a company or get a summary.../i)
      await user.type(input, 'Company 1')

      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      // Should show loading state
      expect(screen.getByText('Analyzing your data...')).toBeInTheDocument()
    })

    it('should show loading state during query processing', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(1)}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'overview')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      expect(screen.getByText('Analyzing your data...')).toBeInTheDocument()
    })

    it('should not submit empty query', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      expect(sendButton).toBeDisabled()
    })

    it('should disable submit button during loading', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(1)}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'test')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      expect(sendButton).toBeDisabled()
    })
  })

  describe('Quick Queries', () => {
    it('should trigger query on quick query button click', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(2)}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.click(screen.getByText('Give me an overview'))

      expect(screen.getByText('Analyzing your data...')).toBeInTheDocument()
    })

    it('should populate input with quick query text', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(2)}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.click(screen.getByText('Give me an overview'))

      const input = screen.getByPlaceholderText(/Ask about a company or get a summary.../i)
      expect(input).toHaveValue('Give me an overview')
    })
  })

  describe('Company Query Results', () => {
    it('should show company summary when querying specific company', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = [
        {
          id: 1,
          company: 'Google',
          position: 'Software Engineer',
          recruiterName: 'John Doe',
          recruiterScreen: 'Completed',
          technicalScreen: 'In Progress',
          onsiteRound1: 'Not Started',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending',
          notes: 'Great opportunity'
        }
      ]
      const logs = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          action: 'created',
          jobTitle: 'Software Engineer',
          company: 'Google',
          details: 'Application created',
          username: 'test'
        }
      ]

      renderWithProviders(
        <AISummary
          logs={logs}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'Google')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Summary for Google/i)).toBeInTheDocument()
        expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument()
      })
    })

    it('should show current status for company', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = createMockJobs(1)
      jobs[0].company = 'TestCorp'

      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'TestCorp')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Current Status/i)).toBeInTheDocument()
      })
    })

    it('should show activity logs for company', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = createMockJobs(1)
      jobs[0].company = 'TestCorp'
      const logs = createMockLogs(2)
      logs.forEach(log => log.company = 'TestCorp')

      renderWithProviders(
        <AISummary
          logs={logs}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'TestCorp')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument()
      })
    })
  })

  describe('Overview Query Results', () => {
    it('should show overall summary for overview query', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = createMockJobs(3)
      const logs = createMockLogs(5)

      renderWithProviders(
        <AISummary
          logs={logs}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'overview')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Overall Job Search Summary/i)).toBeInTheDocument()
        expect(screen.getByText(/Total Applications: 3/i)).toBeInTheDocument()
      })
    })

    it('should show application breakdown', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = createMockJobs(2)

      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'summary')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Application Status Breakdown/i)).toBeInTheDocument()
      })
    })
  })

  describe('No Results', () => {
    it('should show helpful message when company not found', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(1)}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'NonExistentCompany')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/couldn't find specific information/i)).toBeInTheDocument()
      })
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const closeButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg') && btn.parentElement.textContent.includes('AI Summary')
      )
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when clicking outside modal', async () => {
      const user = userEvent.setup({ delay: null })
      const { container } = renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const backdrop = container.firstChild
      await user.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Theme Support', () => {
    it('should render in dark theme', () => {
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('AI Summary')).toBeInTheDocument()
    })

    it('should render in light theme', () => {
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="light"
        />
      )

      expect(screen.getByText('AI Summary')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long queries', async () => {
      const user = userEvent.setup({ delay: null })
      const longQuery = 'A'.repeat(500)

      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(1)}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), longQuery)
      const input = screen.getByPlaceholderText(/Ask about a company or get a summary.../i)

      expect(input).toHaveValue(longQuery)
    })

    it('should handle special characters in query', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(1)}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'Company & Co. <Ltd>')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/couldn't find specific information/i)).toBeInTheDocument()
      })
    })

    it('should handle unicode characters in query', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(1)}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), '公司名称')
      const input = screen.getByPlaceholderText(/Ask about a company or get a summary.../i)

      expect(input).toHaveValue('公司名称')
    })

    it('should handle case-insensitive company matching', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = createMockJobs(1)
      jobs[0].company = 'TestCompany'

      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'testcompany')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Summary for TestCompany/i)).toBeInTheDocument()
      })
    })

    it('should handle partial company name matching', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = createMockJobs(1)
      jobs[0].company = 'Google Inc.'

      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'Google')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Summary for Google Inc./i)).toBeInTheDocument()
      })
    })

    it('should handle multiple queries in sequence', async () => {
      const user = userEvent.setup({ delay: null })
      const jobs = createMockJobs(2)

      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      // First query
      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'overview')
      let sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Overall Job Search Summary/i)).toBeInTheDocument()
      })

      // Second query
      const input = screen.getByPlaceholderText(/Ask about a company or get a summary.../i)
      await user.clear(input)
      await user.type(input, 'Company 1')
      sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Summary for Company 1/i)).toBeInTheDocument()
      })
    })

    it('should handle empty jobs and logs arrays', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText(/Ask about a company or get a summary.../i), 'overview')
      const sendButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(sendButton)

      vi.advanceTimersByTime(1100)

      await waitFor(() => {
        expect(screen.getByText(/Overall Job Search Summary/i)).toBeInTheDocument()
        expect(screen.getByText(/Total Applications: 0/i)).toBeInTheDocument()
      })
    })

    it('should handle form submission via Enter key', async () => {
      const user = userEvent.setup({ delay: null })
      renderWithProviders(
        <AISummary
          logs={[]}
          jobs={createMockJobs(1)}
          onClose={onClose}
          theme="dark"
        />
      )

      const input = screen.getByPlaceholderText(/Ask about a company or get a summary.../i)
      await user.type(input, 'overview{Enter}')

      expect(screen.getByText('Analyzing your data...')).toBeInTheDocument()
    })
  })
})
