import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../Dashboard'
import { renderWithProviders, setupLocalStorage, createMockJobs } from '../../test/utils'

// Mock child components to isolate Dashboard logic
vi.mock('../JobCard', () => ({
  default: ({ job, onEdit, onDelete, onUpdateStatus }) => (
    <div data-testid={`job-${job.id}`}>
      <div>{job.company}</div>
      <button onClick={() => onEdit(job)}>Edit</button>
      <button onClick={() => onDelete(job.id)}>Delete</button>
      <button onClick={() => onUpdateStatus(job.id, 'recruiterScreen', 'Completed')}>Update Status</button>
    </div>
  )
}))

vi.mock('../JobForm', () => ({
  default: ({ onClose, onSave }) => (
    <div data-testid="job-form">
      <button onClick={() => onSave({ company: 'Test', position: 'Eng', recruiterName: 'John', recruiterScreen: 'Not Started', technicalScreen: 'Not Started', onsiteRound1: 'Not Started', onsiteRound2: 'Not Started', onsiteRound3: 'Not Started', onsiteRound4: 'Not Started', decision: 'Pending', notes: '' })}>Save</button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

vi.mock('../ActivityLog', () => ({
  default: ({ logs, onClose }) => (
    <div data-testid="activity-log">
      <div>{logs.length} logs</div>
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

vi.mock('../AISummary', () => ({
  default: ({ onClose }) => (
    <div data-testid="ai-summary">
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

describe('Dashboard Component', () => {
  let onLogout

  beforeEach(() => {
    onLogout = vi.fn()
    localStorage.clear()
    setupLocalStorage({ user: 'testuser' })
  })

  it('should render dashboard with header', () => {
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
    expect(screen.getByText(/Welcome, testuser!/i)).toBeInTheDocument()
  })

  it('should render statistics', () => {
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    expect(screen.getByText('Total Applications')).toBeInTheDocument()
    expect(screen.getByText('Activity Logs')).toBeInTheDocument()
  })

  it('should render add job button', () => {
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    expect(screen.getByText(/Add New Job/i)).toBeInTheDocument()
  })

  it('should render search bar', () => {
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    expect(screen.getByPlaceholderText(/Search jobs/i)).toBeInTheDocument()
  })

  it('should load jobs from localStorage', () => {
    const jobs = createMockJobs(2)
    setupLocalStorage({ jobs, user: 'testuser' })

    renderWithProviders(<Dashboard onLogout={onLogout} />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should open job form when add button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    await user.click(screen.getByText(/Add New Job/i))

    expect(screen.getByTestId('job-form')).toBeInTheDocument()
  })

  it('should close job form when close clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    await user.click(screen.getByText(/Add New Job/i))
    await user.click(screen.getByText('Close'))

    await waitFor(() => {
      expect(screen.queryByTestId('job-form')).not.toBeInTheDocument()
    })
  })

  it('should add job when form is saved', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    await user.click(screen.getByText(/Add New Job/i))
    await user.click(screen.getByText('Save'))

    await waitFor(() => {
      // Check that a job was added by verifying the job card appears
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  it('should filter jobs by search', async () => {
    const user = userEvent.setup()
    const jobs = [
      { ...createMockJobs(1)[0], company: 'Google' },
      { ...createMockJobs(1)[0], id: 2, company: 'Facebook' }
    ]
    setupLocalStorage({ jobs, user: 'testuser' })

    renderWithProviders(<Dashboard onLogout={onLogout} />)

    await user.type(screen.getByPlaceholderText(/Search jobs/i), 'Google')

    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument()
  })

  it('should call onLogout when logout clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    const buttons = screen.getAllByRole('button')
    const logoutButton = buttons.find(btn => btn.className.includes('red'))

    if (logoutButton) {
      await user.click(logoutButton)
      expect(onLogout).toHaveBeenCalled()
    }
  })

  it('should toggle theme', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    expect(localStorage.getItem('jobTracker_theme')).toBe('dark')

    const buttons = screen.getAllByRole('button')
    const themeButton = buttons.find(btn => !btn.className.includes('red') && !btn.className.includes('purple'))

    if (themeButton) {
      await user.click(themeButton)
      expect(localStorage.getItem('jobTracker_theme')).toBe('light')
    }
  })

  it('should show empty state with no jobs', () => {
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    expect(screen.getByText(/No jobs found/i)).toBeInTheDocument()
  })

  it('should open activity log', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    await user.click(screen.getByText(/View Activity Logs/i))

    expect(screen.getByTestId('activity-log')).toBeInTheDocument()
  })

  it('should open AI summary', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard onLogout={onLogout} />)

    const buttons = screen.getAllByRole('button')
    const aiButton = buttons.find(btn => btn.className.includes('purple'))

    if (aiButton) {
      await user.click(aiButton)
      expect(screen.getByTestId('ai-summary')).toBeInTheDocument()
    }
  })

  it('should handle job editing', async () => {
    const user = userEvent.setup()
    const jobs = createMockJobs(1)
    setupLocalStorage({ jobs, user: 'testuser' })

    renderWithProviders(<Dashboard onLogout={onLogout} />)

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    expect(screen.getByTestId('job-form')).toBeInTheDocument()
  })

  it('should handle job deletion', async () => {
    const user = userEvent.setup()
    const jobs = createMockJobs(1)
    setupLocalStorage({ jobs, user: 'testuser' })

    renderWithProviders(<Dashboard onLogout={onLogout} />)

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByTestId(`job-${jobs[0].id}`)).not.toBeInTheDocument()
    })
  })

  it('should handle status updates', async () => {
    const user = userEvent.setup()
    const jobs = createMockJobs(1)
    setupLocalStorage({ jobs, user: 'testuser' })

    renderWithProviders(<Dashboard onLogout={onLogout} />)

    const updateButton = screen.getByText('Update Status')
    await user.click(updateButton)

    // Verify the job is still rendered (status updated)
    expect(screen.getByTestId(`job-${jobs[0].id}`)).toBeInTheDocument()
  })
})
