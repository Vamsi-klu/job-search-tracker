import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import JobCard from '../components/JobCard'

const job = {
  id: 1,
  company: 'Acme',
  position: 'Engineer',
  recruiterName: 'Riley',
  hiringManager: 'Harper',
  recruiterScreen: 'Not Started',
  technicalScreen: 'Not Started',
  onsiteRound1: 'Not Started',
  onsiteRound2: 'Not Started',
  onsiteRound3: 'Not Started',
  onsiteRound4: 'Not Started',
  decision: 'Pending',
  notes: 'Candidate notes',
  hiringManagerNotes: 'HM feedback'
}

describe('JobCard', () => {
  it('renders recruiter, hiring manager, and notes', () => {
    render(
      <JobCard
        job={job}
        index={0}
        onEdit={() => {}}
        onDelete={() => {}}
        onUpdateStatus={() => {}}
        theme="dark"
      />
    )

    expect(screen.getByText(/Recruiter: Riley/)).toBeInTheDocument()
    expect(screen.getByText(/Hiring Manager: Harper/)).toBeInTheDocument()
    expect(screen.getByText(/Candidate Notes/)).toBeInTheDocument()
    expect(screen.getByText('Candidate notes')).toBeInTheDocument()
    expect(screen.getByText(/Hiring Manager Notes/)).toBeInTheDocument()
  })

  it('fires callbacks for status change and delete', async () => {
    const onDelete = vi.fn()
    const onUpdateStatus = vi.fn()
    const user = userEvent.setup()

    render(
      <JobCard
        job={job}
        index={0}
        onEdit={() => {}}
        onDelete={onDelete}
        onUpdateStatus={onUpdateStatus}
        theme="dark"
      />
    )

    const allSelects = document.querySelectorAll('select')
    const decisionSelect = allSelects[allSelects.length - 1]
    await user.selectOptions(decisionSelect, 'Accepted')

    expect(onUpdateStatus).toHaveBeenCalledWith(job.id, 'decision', 'Accepted')

    const deleteButton = screen.getByLabelText('Delete job')
    await user.click(deleteButton)
    expect(onDelete).toHaveBeenCalledWith(job.id)
  })
})
