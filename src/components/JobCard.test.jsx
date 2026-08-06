import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobCard from './JobCard'

describe('JobCard Component', () => {
  let mockJob
  let mockOnEdit
  let mockOnDelete
  let mockOnUpdateStatus

  beforeEach(() => {
    vi.useFakeTimers()
    mockJob = {
      id: 1,
      company: 'Google',
      position: 'Senior Software Engineer',
      recruiterName: 'John Doe',
      hiringManager: 'Jane Smith',
      recruiterScreen: 'In Progress',
      technicalScreen: 'Not Started',
      onsiteRound1: 'Not Started',
      onsiteRound2: 'Not Started',
      onsiteRound3: 'Not Started',
      onsiteRound4: 'Not Started',
      decision: 'Pending',
      notes: 'Great opportunity!'
    }
    mockOnEdit = vi.fn()
    mockOnDelete = vi.fn()
    mockOnUpdateStatus = vi.fn()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render job card with all basic information', () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.getByText(/Recruiter: John Doe/)).toBeInTheDocument()
    })

    it('should render hiring manager field when present', () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText(/Hiring Manager: Jane Smith/)).toBeInTheDocument()
    })

    it('should not render hiring manager field when absent', () => {
      const jobWithoutHiringManager = { ...mockJob, hiringManager: '' }
      render(
        <JobCard
          job={jobWithoutHiringManager}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.queryByText(/Hiring Manager:/)).not.toBeInTheDocument()
    })

    it('should render notes when present', () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText(/Great opportunity!/)).toBeInTheDocument()
    })

    it('should not render notes section when notes are empty', () => {
      const jobWithoutNotes = { ...mockJob, notes: '' }
      render(
        <JobCard
          job={jobWithoutNotes}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.queryByText(/Notes:/)).not.toBeInTheDocument()
    })
  })

  describe('Status Change Animations', () => {
    it('should trigger success animation when status changes to Completed', async () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const recruiterScreenSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(recruiterScreenSelect, { target: { value: 'Completed' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'recruiterScreen', 'Completed')
    })

    it('should trigger success animation when status changes to Passed', async () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const onsiteSelect = screen.getAllByRole('combobox')[3] // First onsite round
      fireEvent.change(onsiteSelect, { target: { value: 'Passed' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'onsiteRound1', 'Passed')
    })

    it('should trigger success animation when decision changes to Accepted', async () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const decisionSelect = screen.getAllByRole('combobox')[7] // Decision dropdown
      fireEvent.change(decisionSelect, { target: { value: 'Accepted' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'decision', 'Accepted')
    })

    it('should trigger success animation when decision changes to Offer Extended', async () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const decisionSelect = screen.getAllByRole('combobox')[7]
      fireEvent.change(decisionSelect, { target: { value: 'Offer Extended' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'decision', 'Offer Extended')
    })

    it('should trigger error animation when status changes to Rejected', async () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const recruiterScreenSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(recruiterScreenSelect, { target: { value: 'Rejected' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'recruiterScreen', 'Rejected')
    })

    it('should trigger error animation when status changes to Failed', async () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const onsiteSelect = screen.getAllByRole('combobox')[3]
      fireEvent.change(onsiteSelect, { target: { value: 'Failed' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'onsiteRound1', 'Failed')
    })

    it('should trigger error animation when decision changes to Declined', async () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const decisionSelect = screen.getAllByRole('combobox')[7]
      fireEvent.change(decisionSelect, { target: { value: 'Declined' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'decision', 'Declined')
    })

    it('should not trigger animation for neutral status changes', async () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const recruiterScreenSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(recruiterScreenSelect, { target: { value: 'In Progress' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'recruiterScreen', 'In Progress')
    })
  })

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const editButton = screen.getAllByRole('button')[0]
      fireEvent.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockJob)
    })

    it('should call onDelete when delete button is clicked', () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const deleteButton = screen.getAllByRole('button')[1]
      fireEvent.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith(1)
    })

    it('should update technical screen status', () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const technicalScreenSelect = screen.getAllByRole('combobox')[1]
      fireEvent.change(technicalScreenSelect, { target: { value: 'Completed' } })

      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'technicalScreen', 'Completed')
    })

    it('should update all onsite rounds independently', () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const allSelects = screen.getAllByRole('combobox')

      // Onsite rounds are at indices 3, 4, 5, 6
      fireEvent.change(allSelects[3], { target: { value: 'Scheduled' } })
      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'onsiteRound1', 'Scheduled')

      fireEvent.change(allSelects[4], { target: { value: 'Completed' } })
      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'onsiteRound2', 'Completed')

      fireEvent.change(allSelects[5], { target: { value: 'Passed' } })
      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'onsiteRound3', 'Passed')

      fireEvent.change(allSelects[6], { target: { value: 'Failed' } })
      expect(mockOnUpdateStatus).toHaveBeenCalledWith(1, 'onsiteRound4', 'Failed')
    })
  })

  describe('Theme Support', () => {
    it('should apply dark theme classes', () => {
      const { container } = render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const card = container.firstChild
      expect(card).toHaveClass('bg-dark-card')
    })

    it('should apply light theme classes', () => {
      const { container } = render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="light"
        />
      )

      const card = container.firstChild
      expect(card).toHaveClass('bg-white')
    })
  })

  describe('Status Colors and Icons', () => {
    it('should display correct status for In Progress', () => {
      render(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      // Check that recruiter screen has In Progress status
      const selects = screen.getAllByRole('combobox')
      expect(selects[0]).toHaveValue('In Progress')
    })

    it('should display all status options correctly', () => {
      const completedJob = {
        ...mockJob,
        recruiterScreen: 'Completed',
        technicalScreen: 'Completed',
        decision: 'Offer Extended'
      }

      render(
        <JobCard
          job={completedJob}
          index={0}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onUpdateStatus={mockOnUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      expect(selects[0]).toHaveValue('Completed') // Recruiter Screen
      expect(selects[1]).toHaveValue('Completed') // Technical Screen
      expect(selects[7]).toHaveValue('Offer Extended') // Decision
    })
  })
})
