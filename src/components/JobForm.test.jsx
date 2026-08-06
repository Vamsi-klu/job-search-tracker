import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobForm from './JobForm'

describe('JobForm Component', () => {
  let mockOnSave
  let mockOnClose

  beforeEach(() => {
    mockOnSave = vi.fn()
    mockOnClose = vi.fn()
  })

  describe('Component Rendering - New Job', () => {
    it('should render empty form for new job', () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter company name')).toHaveValue('')
      expect(screen.getByPlaceholderText('Enter position')).toHaveValue('')
      expect(screen.getByPlaceholderText('Enter recruiter name')).toHaveValue('')
      expect(screen.getByPlaceholderText('Enter hiring manager name')).toHaveValue('')
    })

    it('should render all required fields with asterisks', () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Company Name *')).toBeInTheDocument()
      expect(screen.getByText('Position *')).toBeInTheDocument()
      expect(screen.getByText('Recruiter Name *')).toBeInTheDocument()
    })

    it('should render hiring manager field without asterisk (optional)', () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Hiring Manager')).toBeInTheDocument()
      expect(screen.queryByText('Hiring Manager *')).not.toBeInTheDocument()
    })
  })

  describe('Component Rendering - Edit Job', () => {
    it('should render form with existing job data', () => {
      const existingJob = {
        company: 'Google',
        position: 'Senior Engineer',
        recruiterName: 'John Doe',
        hiringManager: 'Jane Smith',
        recruiterScreen: 'Completed',
        technicalScreen: 'In Progress',
        onsiteRound1: 'Scheduled',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: 'Great company culture'
      }

      render(
        <JobForm
          job={existingJob}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Edit Job Application')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Google')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Senior Engineer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Great company culture')).toBeInTheDocument()
    })

    it('should render form without hiring manager when not provided', () => {
      const existingJob = {
        company: 'Microsoft',
        position: 'Developer',
        recruiterName: 'Bob Smith',
        hiringManager: '',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: ''
      }

      render(
        <JobForm
          job={existingJob}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const hiringManagerInput = screen.getByPlaceholderText('Enter hiring manager name')
      expect(hiringManagerInput).toHaveValue('')
    })
  })

  describe('Hiring Manager Field', () => {
    it('should allow hiring manager field to be empty', async () => {
      const user = userEvent.setup()

      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      // Fill only required fields
      await user.type(screen.getByPlaceholderText('Enter company name'), 'Amazon')
      await user.type(screen.getByPlaceholderText('Enter position'), 'SDE II')
      await user.type(screen.getByPlaceholderText('Enter recruiter name'), 'Alice Johnson')

      const submitButton = screen.getByText('Add Job')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            company: 'Amazon',
            position: 'SDE II',
            recruiterName: 'Alice Johnson',
            hiringManager: ''
          })
        )
      })
    })

    it('should save hiring manager when provided', async () => {
      const user = userEvent.setup()

      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText('Enter company name'), 'Meta')
      await user.type(screen.getByPlaceholderText('Enter position'), 'Staff Engineer')
      await user.type(screen.getByPlaceholderText('Enter recruiter name'), 'Carol White')
      await user.type(screen.getByPlaceholderText('Enter hiring manager name'), 'David Brown')

      const submitButton = screen.getByText('Add Job')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            company: 'Meta',
            position: 'Staff Engineer',
            recruiterName: 'Carol White',
            hiringManager: 'David Brown'
          })
        )
      })
    })

    it('should update hiring manager field when typing', async () => {
      const user = userEvent.setup()

      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const hiringManagerInput = screen.getByPlaceholderText('Enter hiring manager name')
      await user.type(hiringManagerInput, 'Emily Davis')

      expect(hiringManagerInput).toHaveValue('Emily Davis')
    })

    it('should clear hiring manager field when editing', async () => {
      const user = userEvent.setup()
      const existingJob = {
        company: 'Apple',
        position: 'iOS Developer',
        recruiterName: 'Frank Wilson',
        hiringManager: 'Grace Lee',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: ''
      }

      render(
        <JobForm
          job={existingJob}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const hiringManagerInput = screen.getByDisplayValue('Grace Lee')
      await user.clear(hiringManagerInput)

      expect(hiringManagerInput).toHaveValue('')
    })
  })

  describe('Form Validation', () => {
    it('should require company name', async () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const companyInput = screen.getByPlaceholderText('Enter company name')
      expect(companyInput).toBeRequired()
    })

    it('should require position', async () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const positionInput = screen.getByPlaceholderText('Enter position')
      expect(positionInput).toBeRequired()
    })

    it('should require recruiter name', async () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const recruiterInput = screen.getByPlaceholderText('Enter recruiter name')
      expect(recruiterInput).toBeRequired()
    })

    it('should not require hiring manager', async () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const hiringManagerInput = screen.getByPlaceholderText('Enter hiring manager name')
      expect(hiringManagerInput).not.toBeRequired()
    })
  })

  describe('Interview Stages', () => {
    it('should render all interview stage selects with default values', () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(7) // 2 screens + 4 rounds + 1 decision
    })

    it('should allow changing recruiter screen status', async () => {
      const user = userEvent.setup()

      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const recruiterScreenSelect = screen.getAllByRole('combobox')[0]
      await user.selectOptions(recruiterScreenSelect, 'Completed')

      expect(recruiterScreenSelect).toHaveValue('Completed')
    })

    it('should allow changing all onsite round statuses', async () => {
      const user = userEvent.setup()

      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')

      // Onsite rounds are at indices 2-5
      await user.selectOptions(selects[2], 'Scheduled')
      await user.selectOptions(selects[3], 'Completed')
      await user.selectOptions(selects[4], 'Passed')
      await user.selectOptions(selects[5], 'Failed')

      expect(selects[2]).toHaveValue('Scheduled')
      expect(selects[3]).toHaveValue('Completed')
      expect(selects[4]).toHaveValue('Passed')
      expect(selects[5]).toHaveValue('Failed')
    })
  })

  describe('Form Submission', () => {
    it('should submit form with all filled data', async () => {
      const user = userEvent.setup()

      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      await user.type(screen.getByPlaceholderText('Enter company name'), 'Netflix')
      await user.type(screen.getByPlaceholderText('Enter position'), 'Senior SWE')
      await user.type(screen.getByPlaceholderText('Enter recruiter name'), 'Harry Potter')
      await user.type(screen.getByPlaceholderText('Enter hiring manager name'), 'Hermione Granger')
      await user.type(screen.getByPlaceholderText('Add any additional notes...'), 'Exciting role!')

      const submitButton = screen.getByText('Add Job')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          company: 'Netflix',
          position: 'Senior SWE',
          recruiterName: 'Harry Potter',
          hiringManager: 'Hermione Granger',
          recruiterScreen: 'Not Started',
          technicalScreen: 'Not Started',
          onsiteRound1: 'Not Started',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending',
          notes: 'Exciting role!'
        })
      })
    })

    it('should update existing job on submit', async () => {
      const user = userEvent.setup()
      const existingJob = {
        id: 123,
        company: 'Stripe',
        position: 'Backend Engineer',
        recruiterName: 'Ron Weasley',
        hiringManager: 'Luna Lovegood',
        recruiterScreen: 'Completed',
        technicalScreen: 'In Progress',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: 'Initial notes'
      }

      render(
        <JobForm
          job={existingJob}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const hiringManagerInput = screen.getByDisplayValue('Luna Lovegood')
      await user.clear(hiringManagerInput)
      await user.type(hiringManagerInput, 'Neville Longbottom')

      const submitButton = screen.getByText('Update Job')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            hiringManager: 'Neville Longbottom'
          })
        )
      })
    })
  })

  describe('Form Actions', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when X button is clicked', () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const closeButtons = screen.getAllByRole('button')
      const xButton = closeButtons.find(btn => btn.className.includes('p-2'))

      if (xButton) {
        fireEvent.click(xButton)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })

    it('should show correct button text for new job', () => {
      render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Add Job')).toBeInTheDocument()
    })

    it('should show correct button text for editing job', () => {
      const existingJob = {
        company: 'Test Co',
        position: 'Developer',
        recruiterName: 'Test Recruiter',
        hiringManager: '',
        recruiterScreen: 'Not Started',
        technicalScreen: 'Not Started',
        onsiteRound1: 'Not Started',
        onsiteRound2: 'Not Started',
        onsiteRound3: 'Not Started',
        onsiteRound4: 'Not Started',
        decision: 'Pending',
        notes: ''
      }

      render(
        <JobForm
          job={existingJob}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Update Job')).toBeInTheDocument()
    })
  })

  describe('Theme Support', () => {
    it('should apply dark theme classes', () => {
      const { container } = render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="dark"
        />
      )

      const formContainer = container.querySelector('.bg-dark-card')
      expect(formContainer).toBeInTheDocument()
    })

    it('should apply light theme classes', () => {
      const { container } = render(
        <JobForm
          job={null}
          onSave={mockOnSave}
          onClose={mockOnClose}
          theme="light"
        />
      )

      const formContainer = container.querySelector('.bg-white')
      expect(formContainer).toBeInTheDocument()
    })
  })
})
