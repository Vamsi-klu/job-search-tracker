import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
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

  it('should render job information', () => {
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
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
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

    // Find edit button (usually has blue/primary styling)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])

    expect(onEdit).toHaveBeenCalledWith(mockJob)
  })

  it('should call onDelete when delete button is clicked', async () => {
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

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1])

    expect(onDelete).toHaveBeenCalledWith(mockJob.id)
  })

  it('should render all status dropdowns', () => {
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
    expect(selects.length).toBeGreaterThan(0)
  })

  it('should call onUpdateStatus when dropdown changes', async () => {
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
    await user.selectOptions(selects[0], 'Completed')

    expect(onUpdateStatus).toHaveBeenCalled()
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

  it('should render interview stages', () => {
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
    expect(screen.getByText('Final Decision')).toBeInTheDocument()
  })
})
