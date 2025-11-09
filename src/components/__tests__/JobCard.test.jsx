import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobCard from '../JobCard'
import { renderWithProviders, mockJob } from '../../test/utils'

describe('JobCard Component', () => {
  let onEdit, onDelete, onUpdateStatus

  beforeEach(() => {
    onEdit = vi.fn()
    onDelete = vi.fn()
    onUpdateStatus = vi.fn()
  })

  describe('Rendering', () => {
    it('should render job card with all basic information', () => {
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText(/Recruiter: John Doe/i)).toBeInTheDocument()
    })

    it('should render edit and delete buttons', () => {
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should render all interview stages', () => {
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('Recruiter Screen')).toBeInTheDocument()
      expect(screen.getByText('Technical Screen')).toBeInTheDocument()
      expect(screen.getByText('On-site Rounds')).toBeInTheDocument()
      expect(screen.getByText('Final Decision')).toBeInTheDocument()
    })

    it('should render on-site rounds', () => {
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('Round 1')).toBeInTheDocument()
      expect(screen.getByText('Round 2')).toBeInTheDocument()
      expect(screen.getByText('Round 3')).toBeInTheDocument()
      expect(screen.getByText('Round 4')).toBeInTheDocument()
    })

    it('should render notes when present', () => {
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText(/Notes:/i)).toBeInTheDocument()
      expect(screen.getByText(/Test notes/i)).toBeInTheDocument()
    })

    it('should not render notes section when notes are empty', () => {
      const jobWithoutNotes = { ...mockJob, notes: '' }
      renderWithProviders(
        <JobCard
          job={jobWithoutNotes}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.queryByText(/Notes:/i)).not.toBeInTheDocument()
    })

    it('should render in light theme', () => {
      const { container } = renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="light"
        />
      )

      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Edit Functionality', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const editButton = screen.getAllByRole('button')[0]
      await user.click(editButton)

      expect(onEdit).toHaveBeenCalledWith(mockJob)
      expect(onEdit).toHaveBeenCalledTimes(1)
    })
  })

  describe('Delete Functionality', () => {
    it('should call onDelete with job id when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const deleteButton = screen.getAllByRole('button')[1]
      await user.click(deleteButton)

      expect(onDelete).toHaveBeenCalledWith(mockJob.id)
      expect(onDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Status Update Functionality', () => {
    it('should call onUpdateStatus when recruiter screen status changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      const recruiterScreenSelect = selects.find(select =>
        select.value === 'In Progress'
      )

      await user.selectOptions(recruiterScreenSelect, 'Completed')

      expect(onUpdateStatus).toHaveBeenCalledWith(mockJob.id, 'recruiterScreen', 'Completed')
    })

    it('should call onUpdateStatus when technical screen status changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      const technicalScreenSelect = selects.find(select =>
        select.value === 'Not Started' && select.parentElement.textContent.includes('Technical Screen')
      )

      await user.selectOptions(technicalScreenSelect, 'In Progress')

      expect(onUpdateStatus).toHaveBeenCalledWith(mockJob.id, 'technicalScreen', 'In Progress')
    })

    it('should call onUpdateStatus when onsite round 1 status changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      const round1Select = selects.find(select =>
        select.parentElement.textContent.includes('Round 1')
      )

      await user.selectOptions(round1Select, 'Scheduled')

      expect(onUpdateStatus).toHaveBeenCalledWith(mockJob.id, 'onsiteRound1', 'Scheduled')
    })

    it('should call onUpdateStatus for all onsite rounds', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')

      // Update each round
      for (let i = 1; i <= 4; i++) {
        const roundSelect = selects.find(select =>
          select.parentElement.textContent.includes(`Round ${i}`)
        )
        await user.selectOptions(roundSelect, 'Completed')
        expect(onUpdateStatus).toHaveBeenCalledWith(mockJob.id, `onsiteRound${i}`, 'Completed')
      }

      expect(onUpdateStatus).toHaveBeenCalledTimes(4)
    })

    it('should call onUpdateStatus when decision status changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      const decisionSelect = selects.find(select =>
        select.value === 'Pending'
      )

      await user.selectOptions(decisionSelect, 'Offer Extended')

      expect(onUpdateStatus).toHaveBeenCalledWith(mockJob.id, 'decision', 'Offer Extended')
    })
  })

  describe('Status Display', () => {
    it('should display correct status for In Progress', () => {
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should display correct status for Completed', () => {
      const completedJob = { ...mockJob, recruiterScreen: 'Completed' }
      renderWithProviders(
        <JobCard
          job={completedJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should display correct status for Rejected', () => {
      const rejectedJob = { ...mockJob, recruiterScreen: 'Rejected' }
      renderWithProviders(
        <JobCard
          job={rejectedJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('Rejected')).toBeInTheDocument()
    })

    it('should display all decision options', () => {
      const { container } = renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      const decisionSelect = selects.find(select => select.value === 'Pending')

      expect(within(decisionSelect).getByRole('option', { name: 'Pending' })).toBeInTheDocument()
      expect(within(decisionSelect).getByRole('option', { name: 'Offer Extended' })).toBeInTheDocument()
      expect(within(decisionSelect).getByRole('option', { name: 'Accepted' })).toBeInTheDocument()
      expect(within(decisionSelect).getByRole('option', { name: 'Rejected' })).toBeInTheDocument()
      expect(within(decisionSelect).getByRole('option', { name: 'Declined' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle job with very long company name', () => {
      const longNameJob = { ...mockJob, company: 'A'.repeat(100) }
      renderWithProviders(
        <JobCard
          job={longNameJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
    })

    it('should handle job with very long position name', () => {
      const longPositionJob = { ...mockJob, position: 'Senior Staff Software Engineering Manager Lead Architect' }
      renderWithProviders(
        <JobCard
          job={longPositionJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('Senior Staff Software Engineering Manager Lead Architect')).toBeInTheDocument()
    })

    it('should handle job with very long notes', () => {
      const longNotesJob = { ...mockJob, notes: 'N'.repeat(500) }
      renderWithProviders(
        <JobCard
          job={longNotesJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('N'.repeat(500))).toBeInTheDocument()
    })

    it('should handle special characters in company name', () => {
      const specialCharJob = { ...mockJob, company: 'Company & Co. (Ltd.)' }
      renderWithProviders(
        <JobCard
          job={specialCharJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText('Company & Co. (Ltd.)')).toBeInTheDocument()
    })

    it('should handle unicode characters in recruiter name', () => {
      const unicodeJob = { ...mockJob, recruiterName: '王小明' }
      renderWithProviders(
        <JobCard
          job={unicodeJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText(/Recruiter: 王小明/i)).toBeInTheDocument()
    })

    it('should handle empty recruiter name', () => {
      const emptyRecruiterJob = { ...mockJob, recruiterName: '' }
      renderWithProviders(
        <JobCard
          job={emptyRecruiterJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(screen.getByText(/Recruiter:/i)).toBeInTheDocument()
    })

    it('should handle rapid status changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      const recruiterScreenSelect = selects.find(select =>
        select.value === 'In Progress'
      )

      await user.selectOptions(recruiterScreenSelect, 'Completed')
      await user.selectOptions(recruiterScreenSelect, 'Rejected')
      await user.selectOptions(recruiterScreenSelect, 'Not Started')

      expect(onUpdateStatus).toHaveBeenCalledTimes(3)
    })

    it('should handle all status options for recruiter screen', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      const recruiterScreenSelect = selects.find(select =>
        select.value === 'In Progress'
      )

      const statuses = ['Not Started', 'In Progress', 'Completed', 'Rejected']

      for (const status of statuses) {
        await user.selectOptions(recruiterScreenSelect, status)
      }

      expect(onUpdateStatus).toHaveBeenCalledTimes(4)
    })

    it('should handle all status options for onsite rounds', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      const round1Select = selects.find(select =>
        select.parentElement.textContent.includes('Round 1')
      )

      const roundStatuses = ['Not Started', 'Scheduled', 'Completed', 'Passed', 'Failed']

      for (const status of roundStatuses) {
        await user.selectOptions(round1Select, status)
      }

      expect(onUpdateStatus).toHaveBeenCalledTimes(5)
    })

    it('should render with different index values', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithProviders(
          <JobCard
            job={mockJob}
            index={i}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateStatus={onUpdateStatus}
            theme="dark"
          />
        )

        expect(screen.getByText('Software Engineer')).toBeInTheDocument()
        unmount()
      }
    })

    it('should not call callbacks when not interacted with', () => {
      renderWithProviders(
        <JobCard
          job={mockJob}
          index={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          theme="dark"
        />
      )

      expect(onEdit).not.toHaveBeenCalled()
      expect(onDelete).not.toHaveBeenCalled()
      expect(onUpdateStatus).not.toHaveBeenCalled()
    })
  })
})
