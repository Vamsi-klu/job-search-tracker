import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Dashboard from '../components/Dashboard'
import { logsAPI } from '../services/api'

vi.mock('../services/api', () => {
  const logsAPI = {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    create: vi.fn().mockResolvedValue({ success: true })
  }
  return { logsAPI }
})

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() })
}))

const renderDashboard = () =>
  render(<Dashboard onLogout={() => {}} />)

describe('Dashboard component', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('jobTracker_user', 'Test User')
    logsAPI.getAll.mockClear()
    logsAPI.create.mockClear()
  })

  it('loads persisted jobs and shows celebration when status reaches success state', async () => {
    const storedJob = {
      id: 1,
      company: 'Acme',
      position: 'Engineer',
      recruiterName: 'Riley',
      hiringManager: 'Harper',
      recruiterScreen: 'Completed',
      technicalScreen: 'Completed',
      onsiteRound1: 'Passed',
      onsiteRound2: 'Passed',
      onsiteRound3: 'Not Started',
      onsiteRound4: 'Not Started',
      decision: 'Pending',
      notes: '',
      hiringManagerNotes: ''
    }
    localStorage.setItem('jobTracker_jobs', JSON.stringify([storedJob]))

    const user = userEvent.setup()
    renderDashboard()

    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())
    expect(screen.getByText('Engineer')).toBeInTheDocument()

    const selects = document.querySelectorAll('select')
    const decisionSelect = selects[selects.length - 1]
    await user.selectOptions(decisionSelect, 'Accepted')

    expect(await screen.findByText('Milestone Reached')).toBeInTheDocument()
  })

  it('adds a new job with notes and triggers notes celebration + log save', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))

    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalledTimes(1))

    await user.click(screen.getByText('Add New Job'))
    await user.type(screen.getByPlaceholderText('Enter company name'), 'Beta Corp')
    await user.type(screen.getByPlaceholderText('Enter position'), 'Manager')
    await user.type(screen.getByPlaceholderText('Enter recruiter name'), 'Sam')
    await user.type(screen.getByPlaceholderText('Pipeline context, reminders, preparation steps...'), 'Initial notes')

    await user.click(screen.getByText(/Add Job/i))

    await waitFor(() => expect(logsAPI.create).toHaveBeenCalled())
    expect(await screen.findByText('Notes Added')).toBeInTheDocument()
  })

  it('allows editing notes on an existing job', async () => {
    const storedJob = {
      id: 2,
      company: 'Beta',
      position: 'Manager',
      recruiterName: 'Taylor',
      hiringManager: 'Jordan',
      recruiterScreen: 'Not Started',
      technicalScreen: 'Not Started',
      onsiteRound1: 'Scheduled',
      onsiteRound2: 'Not Started',
      onsiteRound3: 'Not Started',
      onsiteRound4: 'Not Started',
      decision: 'Pending',
      notes: 'Initial',
      hiringManagerNotes: 'HM initial'
    }
    localStorage.setItem('jobTracker_jobs', JSON.stringify([storedJob]))

    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getByLabelText('Edit job'))
    const noteArea = screen.getByPlaceholderText('Pipeline context, reminders, preparation steps...')
    await user.clear(noteArea)
    await user.type(noteArea, 'Updated note')

    await user.click(screen.getByText(/Update Job/i))

    await waitFor(() => expect(logsAPI.create).toHaveBeenCalled())
    expect(await screen.findByText('Notes have been updated successfully.')).toBeInTheDocument()
  })

  it('deletes a job and shows failure celebration', async () => {
    const storedJob = {
      id: 3,
      company: 'Gamma',
      position: 'Designer',
      recruiterName: 'Devon',
      hiringManager: 'Casey',
      recruiterScreen: 'In Progress',
      technicalScreen: 'Not Started',
      onsiteRound1: 'Not Started',
      onsiteRound2: 'Not Started',
      onsiteRound3: 'Not Started',
      onsiteRound4: 'Not Started',
      decision: 'Pending',
      notes: '',
      hiringManagerNotes: ''
    }
    localStorage.setItem('jobTracker_jobs', JSON.stringify([storedJob]))

    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getByLabelText('Delete job'))

    await waitFor(() => expect(logsAPI.create).toHaveBeenCalled())
    expect(await screen.findByText('Application Removed')).toBeInTheDocument()
  })

  it('filters jobs using search input', async () => {
    const storedJob = {
      id: 4,
      company: 'Delta',
      position: 'Scientist',
      recruiterName: 'Morgan',
      hiringManager: 'Sky',
      recruiterScreen: 'Completed',
      technicalScreen: 'Completed',
      onsiteRound1: 'Passed',
      onsiteRound2: 'Passed',
      onsiteRound3: 'Passed',
      onsiteRound4: 'Passed',
      decision: 'Offer Extended',
      notes: '',
      hiringManagerNotes: ''
    }
    localStorage.setItem('jobTracker_jobs', JSON.stringify([storedJob]))

    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.type(screen.getByPlaceholderText(/Search jobs/i), 'non-existent')
    expect(screen.getByText(/No jobs found/)).toBeInTheDocument()
  })

  it('falls back to localStorage logs when API fails', async () => {
    const localLogs = [
      { id: 1, action: 'created', jobTitle: 'Engineer', company: 'Fallback', details: 'cached', timestamp: new Date().toISOString(), username: 'alex' },
      { id: 2, action: 'updated', jobTitle: 'Engineer', company: 'Fallback', details: 'cached', timestamp: new Date().toISOString(), username: 'alex' }
    ]
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    localStorage.setItem('jobTracker_logs', JSON.stringify(localLogs))

    logsAPI.getAll.mockRejectedValueOnce(new Error('network'))
    renderDashboard()

    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())
    expect(screen.getByText(/View Activity Logs \(2\)/)).toBeInTheDocument()
  })

  it('opens activity log and AI summary modals', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getByText(/View Activity Logs/))
    expect(screen.getAllByText('Activity Logs').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /AI Summary/i }))
    expect(screen.getAllByText('AI Summary').length).toBeGreaterThan(0)
  })
})
