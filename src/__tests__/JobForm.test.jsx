import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import JobForm from '../components/JobForm'

const baseJob = {
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
  notes: 'Original notes',
  hiringManagerNotes: 'HM notes'
}

describe('JobForm', () => {
  it('prefills fields when editing a job', () => {
    render(
      <JobForm
        job={baseJob}
        onSave={() => {}}
        onClose={() => {}}
        theme="dark"
      />
    )

    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Engineer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Riley')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original notes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('HM notes')).toBeInTheDocument()
  })

  it('submits updated values', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(
      <JobForm
        job={baseJob}
        onSave={onSave}
        onClose={() => {}}
        theme="dark"
      />
    )

    await user.clear(screen.getByDisplayValue('Acme'))
    await user.type(screen.getByPlaceholderText('Enter company name'), 'Beta Corp')
    await user.click(screen.getByText(/Update Job/i))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ company: 'Beta Corp' })
    )
  })

  it('invokes onClose when cancel button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<JobForm job={baseJob} onSave={() => {}} onClose={onClose} theme="dark" />)

    await user.click(screen.getByText(/Cancel/i))
    expect(onClose).toHaveBeenCalled()
  })

  it('creates new job with custom stage selections', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<JobForm onSave={onSave} onClose={() => {}} theme="dark" />)

    await user.type(screen.getByPlaceholderText('Enter company name'), 'Omega')
    await user.type(screen.getByPlaceholderText('Enter position'), 'Director')
    await user.type(screen.getByPlaceholderText('Enter recruiter name'), 'Jamie')
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Completed')
    await user.selectOptions(screen.getAllByRole('combobox')[1], 'Rejected')
    await user.click(screen.getByText(/Add Job/i))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        company: 'Omega',
        recruiterScreen: 'Completed',
        technicalScreen: 'Rejected'
      })
    )
  })
})
