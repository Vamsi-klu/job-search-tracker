import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import AISummary from '../components/AISummary'

const baseJob = {
  id: 'job-1',
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
  decision: 'Offer Extended',
  notes: 'Candidate ready',
  hiringManagerNotes: 'Hire soon'
}

const logs = [
  {
    id: 1,
    jobId: 'job-1',
    company: 'Acme',
    action: 'updated',
    details: 'Notes tweaked',
    timestamp: new Date().toISOString(),
    username: 'alex',
    metadata: { notes: 'Latest candidate note', priority: 'High' }
  },
  {
    id: 2,
    jobId: 'job-1',
    company: '',
    action: 'status_update',
    details: 'Empty company log',
    timestamp: new Date().toISOString(),
    username: 'sam',
    metadata: {}
  }
]

const manyLogs = Array.from({ length: 6 }).map((_, idx) => ({
  id: idx + 1,
  jobId: 'job-1',
  company: 'Acme',
  action: 'status_update',
  details: `update-${idx}`,
  timestamp: new Date(Date.now() - idx * 3600 * 1000).toISOString(),
  username: 'alex'
}))

const multiCompanyLogs = [
  {
    id: 'log-1',
    jobId: 'job-1',
    company: 'Acme',
    action: 'created',
    details: 'Acme created',
    timestamp: new Date().toISOString(),
    username: 'sam'
  },
  {
    id: 'log-2',
    jobId: 'job-2',
    company: 'Beta',
    action: 'updated',
    details: 'Beta touched',
    timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    username: 'sam'
  },
  {
    id: 'log-3',
    jobId: 'job-3',
    company: '',
    action: 'updated',
    details: 'Missing company',
    timestamp: new Date(Date.now() - 7200 * 1000).toISOString(),
    username: 'sam'
  }
]

describe('AISummary', () => {

  it('generates company-specific summary and notifies completion', async () => {
    const onSummaryComplete = vi.fn()
    const user = userEvent.setup()

    render(
      <AISummary
        logs={logs}
        jobs={[baseJob]}
        onClose={() => {}}
        theme="dark"
        onSummaryComplete={onSummaryComplete}
        summaryDelay={0}
      />
    )

    const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
    await user.type(input, 'Acme')
    await user.click(screen.getByRole('button', { name: /submit summary query/i }))

    expect(await screen.findByText('Summary for Acme')).toBeInTheDocument()
    expect(screen.getByText(/Latest Notes/)).toBeInTheDocument()
    expect(onSummaryComplete).toHaveBeenCalled()
  })

  it('provides overview summary from quick query', async () => {
    const user = userEvent.setup()
    render(
      <AISummary
        logs={multiCompanyLogs}
        jobs={[baseJob, { ...baseJob, id: 'job-2', company: 'Beta', position: 'Lead', decision: 'Rejected' }]}
        onClose={() => {}}
        theme="dark"
        onSummaryComplete={() => {}}
        summaryDelay={0}
      />
    )

    const quickButton = screen.getByText('Give me an overview')
    await user.click(quickButton)

    expect(await screen.findByText('Overall Job Search Summary')).toBeInTheDocument()
    expect(screen.getByText('Highlights')).toBeInTheDocument()
    expect(screen.getAllByText('Beta').length).toBeGreaterThan(0)
  })

  it('shows helper message when no query has been asked', () => {
    render(
      <AISummary logs={[]} jobs={[]} onClose={() => {}} theme="dark" summaryDelay={0} />
    )
    expect(screen.getByText(/Ask me about your job applications/)).toBeInTheDocument()
  })

  it('shows fallback guidance when company is unknown', async () => {
    const user = userEvent.setup()
    render(
      <AISummary
        logs={logs}
        jobs={[baseJob]}
        onClose={() => {}}
        theme="dark"
        summaryDelay={0}
      />
    )

    await user.type(screen.getByPlaceholderText('Ask about a company or get a summary...'), 'Unknown Inc')
    await user.click(screen.getByRole('button', { name: /submit summary query/i }))

    expect(await screen.findByText(/I couldn't find specific information/)).toBeInTheDocument()
  })

  it('indicates additional updates when more than five logs exist', async () => {
    const user = userEvent.setup()
    render(
      <AISummary
        logs={manyLogs}
        jobs={[baseJob]}
        onClose={() => {}}
        theme="dark"
        summaryDelay={0}
      />
    )

    await user.type(screen.getByPlaceholderText('Ask about a company or get a summary...'), 'Acme')
    await user.click(screen.getByRole('button', { name: /submit summary query/i }))

    expect(await screen.findByText(/more updates/)).toBeInTheDocument()
  })

  it('renders activity placeholder when no logs exist for selected company', async () => {
    const user = userEvent.setup()
    const job = { ...baseJob }
    render(
      <AISummary
        logs={[]}
        jobs={[job]}
        onClose={() => {}}
        theme="dark"
        summaryDelay={0}
      />
    )

    await user.type(screen.getByPlaceholderText('Ask about a company or get a summary...'), 'Acme')
    await user.click(screen.getByRole('button', { name: /submit summary query/i }))

    expect(await screen.findByText(/No updates recorded yet/)).toBeInTheDocument()
  })

  it('handles overview query even when no activity exists', async () => {
    const user = userEvent.setup()
    render(
      <AISummary
        logs={[]}
        jobs={[{ ...baseJob, hiringManager: '' }]}
        onClose={() => {}}
        theme="dark"
        summaryDelay={0}
      />
    )

    await user.click(screen.getByText('Give me an overview'))
    expect(await screen.findByText('Overall Job Search Summary')).toBeInTheDocument()
    expect(screen.getByText(/No logged activity yet/)).toBeInTheDocument()
  })

  it('renders highlight sections for company summaries', async () => {
    const user = userEvent.setup()
    render(
      <AISummary
        logs={logs}
        jobs={[baseJob]}
        onClose={() => {}}
        theme="dark"
        summaryDelay={0}
      />
    )

    await user.type(screen.getByPlaceholderText('Ask about a company or get a summary...'), 'Acme')
    await user.click(screen.getByRole('button', { name: /submit summary query/i }))

    expect(await screen.findByText('Key Highlights')).toBeInTheDocument()
  })

  it('skips submission when the query is blank', async () => {
    const user = userEvent.setup()
    render(
      <AISummary
        logs={[]}
        jobs={[baseJob]}
        onClose={() => {}}
        theme="dark"
        summaryDelay={0}
      />
    )

    const input = screen.getByPlaceholderText('Ask about a company or get a summary...')
    await user.type(input, '{Enter}')
    expect(screen.getByText(/Ask me about your job applications/)).toBeInTheDocument()
  })

  it('omits note sections when no note data is available', async () => {
    const user = userEvent.setup()
    const blankJob = {
      ...baseJob,
      id: 'job-blank',
      company: 'BlankCo',
      notes: '',
      hiringManagerNotes: ''
    }
    render(
      <AISummary
        logs={[]}
        jobs={[blankJob]}
        onClose={() => {}}
        theme="dark"
        summaryDelay={0}
      />
    )

    await user.type(screen.getByPlaceholderText('Ask about a company or get a summary...'), 'BlankCo')
    await user.click(screen.getByRole('button', { name: /submit summary query/i }))

    expect(await screen.findByText('Summary for BlankCo')).toBeInTheDocument()
    expect(screen.queryByText(/Latest Notes/)).not.toBeInTheDocument()
  })

  it('renders summaries in light theme with placeholder author fields', async () => {
    const user = userEvent.setup()
    const sparseJob = {
      ...baseJob,
      id: 'job-light',
      company: 'LightCorp',
      recruiterName: '',
      hiringManager: ''
    }
    render(
      <AISummary
        logs={logs}
        jobs={[sparseJob]}
        onClose={() => {}}
        theme="light"
        summaryDelay={0}
      />
    )

    await user.type(screen.getByPlaceholderText('Ask about a company or get a summary...'), 'LightCorp')
    await user.click(screen.getByRole('button', { name: /submit summary query/i }))

    expect(await screen.findByText('Summary for LightCorp')).toBeInTheDocument()
    const recruiterLine = screen.getByText((_, node) =>
      node.tagName === 'P' && node.textContent.includes('Recruiter:')
    )
    expect(recruiterLine).toHaveTextContent('Recruiter: —')
    const hmLine = screen.getByText((_, node) =>
      node.tagName === 'P' && node.textContent.includes('Hiring Manager:')
    )
    expect(hmLine).toHaveTextContent('Hiring Manager: Not assigned')
  })
})
