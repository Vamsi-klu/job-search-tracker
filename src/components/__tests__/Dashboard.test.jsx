import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../Dashboard'
import { renderWithProviders, setupLocalStorage, createMockJobs, createMockLogs } from '../../test/utils'

describe('Dashboard Component', () => {
  let onLogout

  beforeEach(() => {
    onLogout = vi.fn()
    localStorage.clear()
    setupLocalStorage({ user: 'testuser' })
  })

  describe('Rendering', () => {
    it('should render dashboard with header', () => {
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText('Job Search Tracker')).toBeInTheDocument()
      expect(screen.getByText(/Welcome, testuser!/i)).toBeInTheDocument()
    })

    it('should render statistics cards', () => {
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText('Total Applications')).toBeInTheDocument()
      expect(screen.getByText('Activity Logs')).toBeInTheDocument()
    })

    it('should render Add New Job button', () => {
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByRole('button', { name: /Add New Job/i })).toBeInTheDocument()
    })

    it('should render search bar', () => {
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByPlaceholderText(/Search jobs by company, position, or recruiter.../i)).toBeInTheDocument()
    })

    it('should render theme toggle button', () => {
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.some(btn => btn.querySelector('svg'))).toBe(true)
    })

    it('should render logout button', () => {
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const logoutButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg') && btn.className.includes('red')
      )
      expect(logoutButton).toBeTruthy()
    })
  })

  describe('Load Data from LocalStorage', () => {
    it('should load jobs from localStorage on mount', () => {
      const jobs = createMockJobs(3)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText('3')).toBeInTheDocument() // Total applications
    })

    it('should load activity logs from localStorage on mount', () => {
      const logs = createMockLogs(5)
      setupLocalStorage({ logs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText('5')).toBeInTheDocument() // Total logs
    })

    it('should handle empty localStorage', () => {
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText(/No jobs found/i)).toBeInTheDocument()
    })
  })

  describe('Add Job Functionality', () => {
    it('should open job form when Add New Job is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      await user.click(screen.getByRole('button', { name: /Add New Job/i }))

      expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
    })

    it('should close job form when cancelled', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      await user.click(screen.getByRole('button', { name: /Add New Job/i }))
      await user.click(screen.getByRole('button', { name: /Cancel/i }))

      expect(screen.queryByText('Add New Job Application')).not.toBeInTheDocument()
    })

    it('should add new job and update statistics', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      await user.click(screen.getByRole('button', { name: /Add New Job/i }))

      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // Total applications
      })
    })

    it('should create activity log when adding job', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      await user.click(screen.getByRole('button', { name: /Add New Job/i }))
      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      await waitFor(() => {
        const logs = JSON.parse(localStorage.getItem('jobTracker_logs'))
        expect(logs).toHaveLength(1)
        expect(logs[0].action).toBe('created')
      })
    })
  })

  describe('Edit Job Functionality', () => {
    it('should open job form in edit mode when edit is clicked', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(1)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const editButtons = screen.getAllByRole('button')
      const editButton = editButtons.find(btn =>
        btn.className.includes('blue')
      )
      await user.click(editButton)

      expect(screen.getByText('Edit Job Application')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Company 1')).toBeInTheDocument()
    })

    it('should update job and create activity log', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(1)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const editButtons = screen.getAllByRole('button')
      const editButton = editButtons.find(btn =>
        btn.className.includes('blue')
      )
      await user.click(editButton)

      const companyInput = screen.getByLabelText(/Company Name/i)
      await user.clear(companyInput)
      await user.type(companyInput, 'Updated Company')
      await user.click(screen.getByRole('button', { name: /Update Job/i }))

      await waitFor(() => {
        expect(screen.getByText('Updated Company')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Job Functionality', () => {
    it('should delete job when delete button clicked', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(2)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText('2')).toBeInTheDocument() // Total applications

      const deleteButtons = screen.getAllByRole('button')
      const deleteButton = deleteButtons.find(btn =>
        btn.className.includes('red') && !btn.className.includes('logout')
      )
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // Reduced to 1
      })
    })

    it('should create activity log when deleting job', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(1)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const deleteButtons = screen.getAllByRole('button')
      const deleteButton = deleteButtons.find(btn =>
        btn.className.includes('red') && !btn.className.includes('logout')
      )
      await user.click(deleteButton)

      await waitFor(() => {
        const logs = JSON.parse(localStorage.getItem('jobTracker_logs'))
        expect(logs.some(log => log.action === 'deleted')).toBe(true)
      })
    })
  })

  describe('Search Functionality', () => {
    it('should filter jobs by company name', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(3)
      jobs[0].company = 'Google'
      jobs[1].company = 'Facebook'
      jobs[2].company = 'Amazon'
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const searchInput = screen.getByPlaceholderText(/Search jobs by company, position, or recruiter.../i)
      await user.type(searchInput, 'Google')

      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.queryByText('Facebook')).not.toBeInTheDocument()
      expect(screen.queryByText('Amazon')).not.toBeInTheDocument()
    })

    it('should filter jobs by position', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(2)
      jobs[0].position = 'Frontend Engineer'
      jobs[1].position = 'Backend Engineer'
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const searchInput = screen.getByPlaceholderText(/Search jobs by company, position, or recruiter.../i)
      await user.type(searchInput, 'Frontend')

      expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
      expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument()
    })

    it('should filter jobs by recruiter name', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(2)
      jobs[0].recruiterName = 'Alice Smith'
      jobs[1].recruiterName = 'Bob Johnson'
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const searchInput = screen.getByPlaceholderText(/Search jobs by company, position, or recruiter.../i)
      await user.type(searchInput, 'Alice')

      expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument()
      expect(screen.queryByText(/Bob Johnson/i)).not.toBeInTheDocument()
    })

    it('should be case-insensitive', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(1)
      jobs[0].company = 'Google'
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const searchInput = screen.getByPlaceholderText(/Search jobs by company, position, or recruiter.../i)
      await user.type(searchInput, 'google')

      expect(screen.getByText('Google')).toBeInTheDocument()
    })

    it('should show no results message when no matches', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(2)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const searchInput = screen.getByPlaceholderText(/Search jobs by company, position, or recruiter.../i)
      await user.type(searchInput, 'NonExistentCompany')

      expect(screen.getByText(/No jobs found/i)).toBeInTheDocument()
    })

    it('should clear search and show all jobs', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(3)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const searchInput = screen.getByPlaceholderText(/Search jobs by company, position, or recruiter.../i)
      await user.type(searchInput, 'Company 1')
      await user.clear(searchInput)

      expect(screen.getByText('Company 1')).toBeInTheDocument()
      expect(screen.getByText('Company 2')).toBeInTheDocument()
      expect(screen.getByText('Company 3')).toBeInTheDocument()
    })
  })

  describe('Activity Log Modal', () => {
    it('should open activity log modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      await user.click(screen.getByText(/View Activity Logs/i))

      expect(screen.getByText('Activity Logs')).toBeInTheDocument()
    })

    it('should display log count in button', () => {
      const logs = createMockLogs(5)
      setupLocalStorage({ logs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText(/View Activity Logs \(5\)/i)).toBeInTheDocument()
    })
  })

  describe('AI Summary Modal', () => {
    it('should open AI summary modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const aiButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('purple') && btn.querySelector('svg')
      )
      await user.click(aiButton)

      expect(screen.getByText('AI Summary')).toBeInTheDocument()
    })
  })

  describe('Logout Functionality', () => {
    it('should call onLogout when logout button clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const logoutButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('red')
      )
      await user.click(logoutButton)

      expect(onLogout).toHaveBeenCalled()
    })
  })

  describe('Theme Toggle', () => {
    it('should toggle theme when theme button clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const themeButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg') && !btn.className.includes('red') && !btn.className.includes('purple')
      )

      await user.click(themeButton)

      expect(localStorage.getItem('jobTracker_theme')).toBe('light')
    })
  })

  describe('Status Updates', () => {
    it('should update job status and create activity log', async () => {
      const user = userEvent.setup()
      const jobs = createMockJobs(1)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      const selects = screen.getAllByRole('combobox')
      const statusSelect = selects[0]

      await user.selectOptions(statusSelect, 'Completed')

      await waitFor(() => {
        const updatedJobs = JSON.parse(localStorage.getItem('jobTracker_jobs'))
        const logs = JSON.parse(localStorage.getItem('jobTracker_logs'))
        expect(logs.some(log => log.action === 'status_update')).toBe(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage jobs data', () => {
      localStorage.setItem('jobTracker_jobs', 'invalid json')

      // Should not crash
      expect(() => renderWithProviders(<Dashboard onLogout={onLogout} />)).not.toThrow()
    })

    it('should handle corrupted localStorage logs data', () => {
      localStorage.setItem('jobTracker_logs', 'invalid json')

      // Should not crash
      expect(() => renderWithProviders(<Dashboard onLogout={onLogout} />)).not.toThrow()
    })

    it('should handle very large number of jobs', () => {
      const jobs = createMockJobs(100)
      setupLocalStorage({ jobs })

      renderWithProviders(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should persist changes across rerenders', async () => {
      const user = userEvent.setup()
      const { rerender } = renderWithProviders(<Dashboard onLogout={onLogout} />)

      // Add a job
      await user.click(screen.getByRole('button', { name: /Add New Job/i }))
      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })

      // Rerender
      rerender(<Dashboard onLogout={onLogout} />)

      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })
  })
})
