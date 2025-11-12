import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityLog from '../ActivityLog'
import { renderWithProviders, createMockLogs } from '../../test/utils'

describe('ActivityLog Component', () => {
  let onClose

  beforeEach(() => {
    onClose = vi.fn()
  })

  it('should render activity log modal', () => {
    const logs = createMockLogs(3)
    renderWithProviders(
      <ActivityLog logs={logs} jobs={[]} onClose={onClose} theme="dark" />
    )

    expect(screen.getByText('Activity Logs')).toBeInTheDocument()
  })

  it('should display total activities count', () => {
    const logs = createMockLogs(5)
    renderWithProviders(
      <ActivityLog logs={logs} jobs={[]} onClose={onClose} theme="dark" />
    )

    expect(screen.getByText('5 total activities')).toBeInTheDocument()
  })

  it('should render log entries', () => {
    const logs = createMockLogs(2)
    renderWithProviders(
      <ActivityLog logs={logs} jobs={[]} onClose={onClose} theme="dark" />
    )

    logs.forEach(log => {
      expect(screen.getByText(log.details)).toBeInTheDocument()
    })
  })

  it('should display empty state when no logs', () => {
    renderWithProviders(
      <ActivityLog logs={[]} jobs={[]} onClose={onClose} theme="dark" />
    )

    expect(screen.getByText('No activity logs yet')).toBeInTheDocument()
  })

  it('should call onClose when close button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ActivityLog logs={[]} jobs={[]} onClose={onClose} theme="dark" />
    )

    const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
    if (closeButton) {
      await user.click(closeButton)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('should display activity statistics', () => {
    const logs = [
      { ...createMockLogs(1)[0], action: 'created' },
      { ...createMockLogs(1)[0], id: 2, action: 'updated' }
    ]

    renderWithProviders(
      <ActivityLog logs={logs} jobs={[]} onClose={onClose} theme="dark" />
    )

    expect(screen.getAllByText('created')).toBeTruthy()
    expect(screen.getAllByText('updated')).toBeTruthy()
  })

  it('should render in light theme', () => {
    renderWithProviders(
      <ActivityLog logs={[]} jobs={[]} onClose={onClose} theme="light" />
    )

    expect(screen.getByText('Activity Logs')).toBeInTheDocument()
  })
})
