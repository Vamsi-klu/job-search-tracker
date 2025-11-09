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
    metadata: { notes: 'Latest candidate note' }
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
        logs={logs}
        jobs={[baseJob]}
        onClose={() => {}}
        theme="dark"
        onSummaryComplete={() => {}}
        summaryDelay={0}
      />
    )

    const quickButton = screen.getByText('Give me an overview')
    await user.click(quickButton)

    expect(await screen.findByText('Overall Job Search Summary')).toBeInTheDocument()
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
})
