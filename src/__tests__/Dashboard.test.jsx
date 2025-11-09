import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
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

const themeState = { value: 'dark' }
const mockToggleTheme = vi.fn()
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: themeState.value, toggleTheme: mockToggleTheme })
}))

const renderDashboard = () =>
  render(<Dashboard onLogout={() => {}} />)

describe('Dashboard component', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('jobTracker_user', 'Test User')
    themeState.value = 'dark'
    logsAPI.getAll.mockClear()
    logsAPI.getAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'seed',
          timestamp: new Date().toISOString(),
          action: 'created',
          jobTitle: 'Seed',
          company: 'SeedCo',
          details: 'seed entry',
          username: 'seed'
        }
      ]
    })
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
    await user.click(screen.getByLabelText('Dismiss celebration'))
    await waitFor(() => expect(screen.queryByText('Milestone Reached')).toBeNull())
  })

  it('renders correctly in light theme', async () => {
    themeState.value = 'light'
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    renderDashboard()

    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())
    expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
    expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument()
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
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderDashboard()

    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())
    expect(screen.getByText(/View Activity Logs \(2\)/)).toBeInTheDocument()
    errorSpy.mockRestore()
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

  it('triggers failure celebration when a stage is rejected', async () => {
    const storedJob = {
      id: 5,
      company: 'Zeta',
      position: 'Lead',
      recruiterName: 'Remy',
      hiringManager: 'Kai',
      recruiterScreen: 'In Progress',
      technicalScreen: 'In Progress',
      onsiteRound1: 'Scheduled',
      onsiteRound2: 'Scheduled',
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

    const selects = document.querySelectorAll('select')
    const decisionSelect = selects[selects.length - 1]
    await user.selectOptions(decisionSelect, 'Rejected')

    expect(await screen.findByText('Needs Attention')).toBeInTheDocument()
  })

  it('stores offline log when log API fails', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    logsAPI.create.mockRejectedValueOnce(new Error('offline'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await user.click(screen.getByText('Add New Job'))
    await user.type(screen.getByPlaceholderText('Enter company name'), 'Offline Co')
    await user.type(screen.getByPlaceholderText('Enter position'), 'Tester')
    await user.type(screen.getByPlaceholderText('Enter recruiter name'), 'Lee')
    await user.click(screen.getByText(/Add Job/i))

    await waitFor(() => {
      const cached = JSON.parse(localStorage.getItem('jobTracker_logs'))
      expect(cached.length).toBeGreaterThan(0)
    })
    errorSpy.mockRestore()
  })

  it('sorts API logs from newest to oldest', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    const user = userEvent.setup()
    logsAPI.getAll.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'older',
          timestamp: '2024-01-01T10:00:00Z',
          action: 'updated',
          jobTitle: 'Old Job',
          company: 'OldCo',
          details: 'Older entry',
          username: 'casey'
        },
        {
          id: 'newer',
          timestamp: '2024-02-01T12:00:00Z',
          action: 'updated',
          jobTitle: 'New Job',
          company: 'NewCo',
          details: 'Newest entry',
          username: 'casey'
        }
      ]
    })

    renderDashboard()
    await waitFor(() => expect(screen.getByText(/View Activity Logs \(2\)/)).toBeInTheDocument())
    await user.click(screen.getByText(/View Activity Logs/))

    const entries = screen.getAllByTestId(/activity-log-entry-/)
    expect(entries[0]).toHaveTextContent('New Job')
    expect(entries[1]).toHaveTextContent('Old Job')
  })

  it('renders when no saved jobs exist', async () => {
    localStorage.removeItem('jobTracker_jobs')
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())
    expect(screen.getByText('Add New Job')).toBeInTheDocument()
  })

  it('ignores unsuccessful log responses', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    logsAPI.getAll.mockResolvedValueOnce({ success: false })
    renderDashboard()
    await waitFor(() => expect(screen.getByText(/View Activity Logs \(0\)/)).toBeInTheDocument())
  })

  it('handles API failures without local cache', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    logsAPI.getAll.mockRejectedValueOnce(new Error('offline'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderDashboard()
    await waitFor(() => expect(screen.getByText(/View Activity Logs \(0\)/)).toBeInTheDocument())
    errorSpy.mockRestore()
  })

  it('edits non-note fields without triggering note celebrations', async () => {
    const storedJob = {
      id: 7,
      company: 'NoNote',
      position: 'Analyst',
      recruiterName: 'Dev',
      hiringManager: 'Sky',
      recruiterScreen: 'Not Started',
      technicalScreen: 'Not Started',
      onsiteRound1: 'Not Started',
      onsiteRound2: 'Not Started',
      onsiteRound3: 'Not Started',
      onsiteRound4: 'Not Started',
      decision: 'Pending',
      notes: 'original',
      hiringManagerNotes: 'hm'
    }
    localStorage.setItem('jobTracker_jobs', JSON.stringify([storedJob]))

    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getByLabelText('Edit job'))
    await user.clear(screen.getByPlaceholderText('Enter position'))
    await user.type(screen.getByPlaceholderText('Enter position'), 'Senior Analyst')
    await user.click(screen.getByText(/Update Job/i))

    await waitFor(() => expect(logsAPI.create).toHaveBeenCalled())
    expect(screen.queryByText('Notes have been updated successfully.')).not.toBeInTheDocument()
  })

  it('exposes handlers for invalid operations and avoids side effects', async () => {
    let handlers
    render(<Dashboard onLogout={() => {}} onHandlersReady={(api) => { handlers = api }} />)
    await waitFor(() => {
      expect(handlers).toBeDefined()
    })
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())
    const initialCalls = logsAPI.create.mock.calls.length
    act(() => {
      handlers.handleDeleteJob(999)
    })
    act(() => {
      handlers.handleUpdateJobStatus(999, 'decision', 'Rejected')
    })
    expect(logsAPI.create.mock.calls.length).toBe(initialCalls)
  })

  it('does not celebrate neutral status updates', async () => {
    const storedJob = {
      id: 8,
      company: 'Theta',
      position: 'Intern',
      recruiterName: 'Neo',
      hiringManager: 'Eli',
      recruiterScreen: 'Not Started',
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

    const recruiterSelect = document.querySelectorAll('select')[0]
    await user.selectOptions(recruiterSelect, 'In Progress')
    await waitFor(() => expect(logsAPI.create).toHaveBeenCalled())
    expect(screen.queryByText('Milestone Reached')).not.toBeInTheDocument()
    expect(screen.queryByText('Needs Attention')).not.toBeInTheDocument()
  })

  it('closes the job form when cancel is pressed', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getByText('Add New Job'))
    expect(screen.getByTestId('job-form-modal')).toBeInTheDocument()
    await user.click(screen.getByText('Cancel'))
    await waitFor(() => expect(screen.queryByTestId('job-form-modal')).toBeNull())
  })

  it('closes the activity log modal via overlay click', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getByText(/View Activity Logs/))
    expect(screen.getByTestId('activity-log-modal')).toBeInTheDocument()
    await user.click(screen.getByTestId('activity-log-overlay'))
    await waitFor(() => expect(screen.queryByTestId('activity-log-modal')).toBeNull())
  })

  it('closes the AI summary modal through its close button', async () => {
    localStorage.setItem('jobTracker_jobs', JSON.stringify([]))
    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getByLabelText('Open AI summary'))
    expect(screen.getByTestId('ai-summary-overlay')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close AI summary'))
    await waitFor(() => expect(screen.queryByTestId('ai-summary-overlay')).toBeNull())
  })

  it('shows celebration after AI summary finishes generating output', async () => {
    const storedJob = {
      id: 20,
      company: 'Lambda',
      position: 'Architect',
      recruiterName: 'Dana',
      hiringManager: 'June',
      recruiterScreen: 'Completed',
      technicalScreen: 'Completed',
      onsiteRound1: 'Passed',
      onsiteRound2: 'Passed',
      onsiteRound3: 'Not Started',
      onsiteRound4: 'Not Started',
      decision: 'Pending',
      notes: 'Initial summary notes',
      hiringManagerNotes: ''
    }
    localStorage.setItem('jobTracker_jobs', JSON.stringify([storedJob]))
    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getByLabelText('Open AI summary'))
    await user.type(screen.getByPlaceholderText('Ask about a company or get a summary...'), 'Lambda')
    await user.click(screen.getByRole('button', { name: /submit summary query/i }))

    expect(await screen.findByText('Summary Generated')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Dismiss celebration'))
  })

  it('keeps other jobs intact when editing one entry', async () => {
    const jobs = [
      {
        id: 9,
        company: 'Prime',
        position: 'Lead',
        recruiterName: 'Ray',
        hiringManager: '',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: '',
        hiringManagerNotes: ''
      },
      {
        id: 10,
        company: 'Stay',
        position: 'Designer',
        recruiterName: 'Lee',
        hiringManager: 'Pat',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: '',
        hiringManagerNotes: ''
      }
    ]
    localStorage.setItem('jobTracker_jobs', JSON.stringify(jobs))

    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await user.click(screen.getAllByLabelText('Edit job')[0])
    await user.clear(screen.getByPlaceholderText('Enter recruiter name'))
    await user.type(screen.getByPlaceholderText('Enter recruiter name'), 'New Recruiter')
    await user.click(screen.getByText(/Update Job/i))

    await waitFor(() => expect(logsAPI.create).toHaveBeenCalled())
    const stored = JSON.parse(localStorage.getItem('jobTracker_jobs'))
    expect(stored.find(job => job.id === 10).company).toBe('Stay')
  })

  it('saves form without changes and logs default details', async () => {
    const storedJob = {
      id: 11,
      company: 'Idle',
      position: 'Engineer',
      recruiterName: 'Rae',
      hiringManager: '',
      recruiterScreen: 'Not Started',
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

    await user.click(screen.getByLabelText('Edit job'))
    await user.click(screen.getByText(/Update Job/i))

    await waitFor(() => expect(logsAPI.create).toHaveBeenCalled())
    const lastCall = logsAPI.create.mock.calls.at(-1)[0]
    expect(lastCall.details).toBe('Job details updated')
    expect(lastCall.metadata).toBeUndefined()
  })

  it('updates status while multiple jobs exist via handler API', async () => {
    const baseJobShape = {
      recruiterName: 'Alex',
      hiringManager: 'Jordan',
      recruiterScreen: 'Not Started',
      technicalScreen: 'Not Started',
      onsiteRound1: 'Not Started',
      onsiteRound2: 'Not Started',
      onsiteRound3: 'Not Started',
      onsiteRound4: 'Not Started',
      decision: 'Pending',
      notes: '',
      hiringManagerNotes: ''
    }
    const jobs = [
      { ...baseJobShape, id: 12, company: 'One', position: 'A' },
      { ...baseJobShape, id: 13, company: 'Two', position: 'B' }
    ]
    localStorage.setItem('jobTracker_jobs', JSON.stringify(jobs))
    let handlers
    render(<Dashboard onLogout={() => {}} onHandlersReady={(api) => { handlers = api }} />)

    await waitFor(() => {
      expect(handlers).toBeDefined()
    })
    await waitFor(() => expect(logsAPI.getAll).toHaveBeenCalled())

    await act(async () => {
      handlers.handleUpdateJobStatus(12, 'decision', 'Pending')
    })

    const stored = JSON.parse(localStorage.getItem('jobTracker_jobs'))
    expect(stored.length).toBe(2)
  })
})
