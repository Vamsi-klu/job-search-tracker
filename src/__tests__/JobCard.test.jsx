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
    const recruiterSelect = allSelects[0]
    const technicalSelect = allSelects[1]
    const onsiteSelect = allSelects[2]
    const decisionSelect = allSelects[allSelects.length - 1]
    await user.selectOptions(recruiterSelect, 'Completed')
    expect(onUpdateStatus).toHaveBeenCalledWith(job.id, 'recruiterScreen', 'Completed')
    await user.selectOptions(technicalSelect, 'Rejected')
    expect(onUpdateStatus).toHaveBeenCalledWith(job.id, 'technicalScreen', 'Rejected')
    await user.selectOptions(onsiteSelect, 'Passed')
    expect(onUpdateStatus).toHaveBeenCalledWith(job.id, 'onsiteRound1', 'Passed')
    await user.selectOptions(decisionSelect, 'Accepted')

    expect(onUpdateStatus).toHaveBeenCalledWith(job.id, 'decision', 'Accepted')

    const deleteButton = screen.getByLabelText('Delete job')
    await user.click(deleteButton)
    expect(onDelete).toHaveBeenCalledWith(job.id)
  })

  it('renders status pills for every mood', () => {
    const variedJob = {
      ...job,
      recruiterScreen: 'In Progress',
      technicalScreen: 'Rejected',
      onsiteRound1: 'Not Started',
      decision: 'Offer Extended'
    }

    render(
      <JobCard
        job={variedJob}
        index={0}
        onEdit={() => {}}
        onDelete={() => {}}
        onUpdateStatus={() => {}}
        theme="dark"
      />
    )

    expect(screen.getAllByText('Offer Extended').length).toBeGreaterThan(0)
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Not Started').length).toBeGreaterThan(0)
  })

  it('handles missing optional data and renders light theme states', () => {
    const minimalJob = {
      ...job,
      recruiterName: '',
      hiringManager: '',
      notes: '',
      hiringManagerNotes: '',
      decision: 'Declined'
    }

    render(
      <JobCard
        job={minimalJob}
        index={0}
        onEdit={() => {}}
        onDelete={() => {}}
        onUpdateStatus={() => {}}
        theme="light"
      />
    )

    expect(screen.getByText(/Recruiter: —/)).toBeInTheDocument()
    expect(screen.queryByText(/Hiring Manager:/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Declined').length).toBeGreaterThan(0)
  })

  it('renders note sections in light mode and handles undefined statuses', () => {
    const noteJob = {
      ...job,
      recruiterScreen: undefined,
      notes: 'Prep notes',
      hiringManagerNotes: 'HM context'
    }

    render(
      <JobCard
        job={noteJob}
        index={0}
        onEdit={() => {}}
        onDelete={() => {}}
        onUpdateStatus={() => {}}
        theme="light"
      />
    )

    expect(screen.getByText('Candidate Notes')).toBeInTheDocument()
    expect(screen.getByText('Hiring Manager Notes')).toBeInTheDocument()
  })
})
