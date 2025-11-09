import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityLog from '../ActivityLog'
import { renderWithProviders, createMockLogs, createMockJobs } from '../../test/utils'

describe('ActivityLog Component', () => {
  let onClose

  beforeEach(() => {
    onClose = vi.fn()
  })

  describe('Rendering', () => {
    it('should render activity log modal', () => {
      const logs = createMockLogs(3)
      const jobs = createMockJobs(2)

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Activity Logs')).toBeInTheDocument()
    })

    it('should display total activities count', () => {
      const logs = createMockLogs(5)
      const jobs = createMockJobs(2)

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('5 total activities')).toBeInTheDocument()
    })

    it('should render all log entries', () => {
      const logs = createMockLogs(3)
      const jobs = createMockJobs(2)

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={jobs}
          onClose={onClose}
          theme="dark"
        />
      )

      logs.forEach(log => {
        expect(screen.getByText(log.details)).toBeInTheDocument()
      })
    })

    it('should display empty state when no logs', () => {
      renderWithProviders(
        <ActivityLog
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('No activity logs yet')).toBeInTheDocument()
    })
  })

  describe('Log Display', () => {
    it('should display job title and company for each log', () => {
      const logs = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          action: 'created',
          jobTitle: 'Engineer',
          company: 'Test Corp',
          details: 'Created application',
          username: 'testuser'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Engineer at Test Corp')).toBeInTheDocument()
    })

    it('should display username for each log', () => {
      const logs = createMockLogs(1)
      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText(/by testuser/i)).toBeInTheDocument()
    })

    it('should display formatted timestamp', () => {
      const logs = [
        {
          id: 1,
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
          action: 'created',
          jobTitle: 'Engineer',
          company: 'Test Corp',
          details: 'Created',
          username: 'testuser'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument()
    })

    it('should display "Just now" for very recent logs', () => {
      const logs = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          action: 'created',
          jobTitle: 'Engineer',
          company: 'Test Corp',
          details: 'Created',
          username: 'testuser'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Just now')).toBeInTheDocument()
    })
  })

  describe('Action Types', () => {
    it('should display created action', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          action: 'created',
          details: 'New job added'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('created')).toBeInTheDocument()
    })

    it('should display updated action', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          action: 'updated',
          details: 'Job updated'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('updated')).toBeInTheDocument()
    })

    it('should display deleted action', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          action: 'deleted',
          details: 'Job deleted'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('deleted')).toBeInTheDocument()
    })

    it('should display status_update action', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          action: 'status_update',
          details: 'Status changed'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('status update')).toBeInTheDocument()
    })
  })

  describe('Statistics', () => {
    it('should display statistics for all action types', () => {
      const logs = [
        { ...createMockLogs(1)[0], action: 'created' },
        { ...createMockLogs(1)[0], id: 2, action: 'updated' },
        { ...createMockLogs(1)[0], id: 3, action: 'deleted' },
        { ...createMockLogs(1)[0], id: 4, action: 'status_update' }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      // Check statistics are displayed
      const stats = screen.getAllByText('1')
      expect(stats.length).toBeGreaterThanOrEqual(4)
    })

    it('should count actions correctly', () => {
      const logs = [
        { ...createMockLogs(1)[0], id: 1, action: 'created' },
        { ...createMockLogs(1)[0], id: 2, action: 'created' },
        { ...createMockLogs(1)[0], id: 3, action: 'updated' }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      // Should show 2 for created and 1 for others
      const twoCount = screen.getAllByText('2')
      expect(twoCount.length).toBeGreaterThan(0)
    })

    it('should show 0 for actions with no logs', () => {
      const logs = [
        { ...createMockLogs(1)[0], action: 'created' }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const zeroCount = screen.getAllByText('0')
      expect(zeroCount.length).toBeGreaterThan(0)
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ActivityLog
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when clicking outside modal', async () => {
      const user = userEvent.setup()
      const { container } = renderWithProviders(
        <ActivityLog
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

    it('should not call onClose when clicking inside modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <ActivityLog
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const title = screen.getByText('Activity Logs')
      await user.click(title)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Theme Support', () => {
    it('should render in dark theme', () => {
      renderWithProviders(
        <ActivityLog
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Activity Logs')).toBeInTheDocument()
    })

    it('should render in light theme', () => {
      renderWithProviders(
        <ActivityLog
          logs={[]}
          jobs={[]}
          onClose={onClose}
          theme="light"
        />
      )

      expect(screen.getByText('Activity Logs')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very old timestamps', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          timestamp: new Date('2020-01-01').toISOString()
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText(/Jan \d+, 2020/i)).toBeInTheDocument()
    })

    it('should handle logs with very long details', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          details: 'A'.repeat(500)
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument()
    })

    it('should handle logs with special characters', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          company: 'Company & Co. <Ltd>',
          jobTitle: 'Sr. Engineer (Level 5)',
          details: 'Updated "status" & notes!'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Sr. Engineer (Level 5) at Company & Co. <Ltd>')).toBeInTheDocument()
      expect(screen.getByText('Updated "status" & notes!')).toBeInTheDocument()
    })

    it('should handle unicode characters', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          company: '会社',
          jobTitle: '工程师',
          username: '用户'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('工程师 at 会社')).toBeInTheDocument()
      expect(screen.getByText(/by 用户/i)).toBeInTheDocument()
    })

    it('should handle large number of logs efficiently', () => {
      const logs = createMockLogs(100)

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('100 total activities')).toBeInTheDocument()
    })

    it('should handle logs with null/undefined fields gracefully', () => {
      const logs = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          action: 'created',
          jobTitle: null,
          company: undefined,
          details: 'Test',
          username: 'test'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('should handle invalid timestamp', () => {
      const logs = [
        {
          ...createMockLogs(1)[0],
          timestamp: 'invalid-date'
        }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      // Should still render without crashing
      expect(screen.getByText('Activity Logs')).toBeInTheDocument()
    })

    it('should sort logs by timestamp (newest first)', () => {
      const logs = [
        { ...createMockLogs(1)[0], id: 1, timestamp: '2023-01-01T00:00:00.000Z', details: 'Old' },
        { ...createMockLogs(1)[0], id: 2, timestamp: '2023-12-31T23:59:59.999Z', details: 'New' }
      ]

      renderWithProviders(
        <ActivityLog
          logs={logs}
          jobs={[]}
          onClose={onClose}
          theme="dark"
        />
      )

      const logElements = screen.getAllByText(/Old|New/)
      // Assuming logs are displayed in order, first should be newer
      expect(logElements[0].textContent).toContain('New')
    })
  })
})
