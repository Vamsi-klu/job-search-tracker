import { render, screen } from '@testing-library/react'
import ActivityLog from '../components/ActivityLog'
import { vi } from 'vitest'

const baseLog = {
  id: 1,
  action: 'created',
  jobTitle: 'Frontend Dev',
  company: 'Acme',
  details: 'New job added',
  timestamp: new Date().toISOString(),
  username: 'alex'
}

describe('ActivityLog', () => {
  it('renders empty state when no logs', () => {
    render(<ActivityLog logs={[]} jobs={[]} onClose={() => {}} theme="dark" />)
    expect(screen.getByText('No activity logs yet')).toBeInTheDocument()
  })

  it('renders activity entries with metadata chips', () => {
    const logs = [
      {
        ...baseLog,
        metadata: {
          field: 'decision',
          value: 'Offer Extended'
        }
      }
    ]

    render(<ActivityLog logs={logs} jobs={[]} onClose={() => {}} theme="dark" />)

    expect(screen.getByText('Frontend Dev at Acme')).toBeInTheDocument()
    expect(screen.getByText('New job added')).toBeInTheDocument()
    expect(screen.getByText(/field:/i)).toBeInTheDocument()
    expect(screen.getByText(/Offer Extended/)).toBeInTheDocument()
  })

  it('formats timeline entries across date ranges and aggregates stats', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-10T12:00:00Z'))
    const logs = [
      { ...baseLog, id: 1, action: 'created', timestamp: new Date().toISOString() },
      { ...baseLog, id: 2, action: 'updated', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), details: 'Updated recruiter' },
      { ...baseLog, id: 3, action: 'deleted', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), details: 'Deleted job' },
      { ...baseLog, id: 4, action: 'status_update', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), details: 'Status update' },
      { ...baseLog, id: 5, action: 'other', timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), details: 'Other action' }
    ]

    render(<ActivityLog logs={logs} jobs={[]} onClose={() => {}} theme="dark" />)

    expect(screen.getByText('Just now')).toBeInTheDocument()
    expect(screen.getByText('15 minutes ago')).toBeInTheDocument()
    expect(screen.getByText('3 hours ago')).toBeInTheDocument()
    expect(screen.getByText('5 days ago')).toBeInTheDocument()
    expect(screen.getByText('Other action')).toBeInTheDocument()
    expect(screen.getAllByText(/created/).length).toBeGreaterThan(0)

    vi.useRealTimers()
  })
})
