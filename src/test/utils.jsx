import { render } from '@testing-library/react'
import { ThemeProvider } from '../contexts/ThemeContext'

/**
 * Custom render function that includes all providers
 */
export function renderWithProviders(ui, { theme = 'dark', ...options } = {}) {
  localStorage.setItem('jobTracker_theme', theme)

  function Wrapper({ children }) {
    return <ThemeProvider>{children}</ThemeProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Mock job data for testing
 */
export const mockJob = {
  id: 1,
  company: 'Test Company',
  recruiterName: 'John Doe',
  position: 'Software Engineer',
  recruiterScreen: 'In Progress',
  technicalScreen: 'Not Started',
  onsiteRound1: 'Not Started',
  onsiteRound2: 'Not Started',
  onsiteRound3: 'Not Started',
  onsiteRound4: 'Not Started',
  decision: 'Pending',
  notes: 'Test notes',
  createdAt: '2023-01-01T00:00:00.000Z'
}

/**
 * Mock activity log for testing
 */
export const mockLog = {
  id: 1,
  timestamp: '2023-01-01T00:00:00.000Z',
  action: 'created',
  jobTitle: 'Software Engineer',
  company: 'Test Company',
  details: 'New job application added',
  username: 'testuser'
}

/**
 * Setup localStorage with test data
 */
export function setupLocalStorage(data = {}) {
  const defaults = {
    password: 'testpass123',
    user: 'testuser',
    jobs: [],
    logs: [],
    theme: 'dark'
  }

  const merged = { ...defaults, ...data }

  if (merged.password) {
    localStorage.setItem('jobTracker_password', merged.password)
  }
  if (merged.user) {
    localStorage.setItem('jobTracker_user', merged.user)
  }
  if (merged.jobs) {
    localStorage.setItem('jobTracker_jobs', JSON.stringify(merged.jobs))
  }
  if (merged.logs) {
    localStorage.setItem('jobTracker_logs', JSON.stringify(merged.logs))
  }
  if (merged.theme) {
    localStorage.setItem('jobTracker_theme', merged.theme)
  }

  return merged
}

/**
 * Create multiple mock jobs for testing
 */
export function createMockJobs(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    ...mockJob,
    id: i + 1,
    company: `Company ${i + 1}`,
    position: `Position ${i + 1}`,
    recruiterName: `Recruiter ${i + 1}`
  }))
}

/**
 * Create multiple mock logs for testing
 */
export function createMockLogs(count = 5) {
  const actions = ['created', 'updated', 'deleted', 'status_update']
  return Array.from({ length: count }, (_, i) => ({
    ...mockLog,
    id: i + 1,
    action: actions[i % actions.length],
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    details: `Action ${i + 1}`
  }))
}
