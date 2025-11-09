import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobForm from '../JobForm'
import { renderWithProviders, mockJob } from '../../test/utils'

describe('JobForm Component', () => {
  let onSave, onClose

  beforeEach(() => {
    onSave = vi.fn()
    onClose = vi.fn()
  })

  describe('Rendering - New Job', () => {
    it('should render form with title for new job', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
    })

    it('should render all required form fields', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Position \*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Recruiter Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Recruiter Screen/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Technical Screen/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Final Decision/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument()
    })

    it('should render all onsite round fields', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Round 1')).toBeInTheDocument()
      expect(screen.getByText('Round 2')).toBeInTheDocument()
      expect(screen.getByText('Round 3')).toBeInTheDocument()
      expect(screen.getByText('Round 4')).toBeInTheDocument()
    })

    it('should have default values for new job', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByLabelText(/Company Name/i)).toHaveValue('')
      expect(screen.getByLabelText(/Position \*/i)).toHaveValue('')
      expect(screen.getByLabelText(/Recruiter Name/i)).toHaveValue('')
      expect(screen.getByLabelText(/Notes/i)).toHaveValue('')
    })

    it('should render Add Job button for new job', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByRole('button', { name: /Add Job/i })).toBeInTheDocument()
    })

    it('should render Cancel button', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })

    it('should render close button', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const closeButtons = screen.getAllByRole('button')
      expect(closeButtons.some(btn => btn.querySelector('svg'))).toBe(true)
    })
  })

  describe('Rendering - Edit Job', () => {
    it('should render form with title for editing', () => {
      renderWithProviders(
        <JobForm
          job={mockJob}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Edit Job Application')).toBeInTheDocument()
    })

    it('should populate form with job data', () => {
      renderWithProviders(
        <JobForm
          job={mockJob}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByLabelText(/Company Name/i)).toHaveValue('Test Company')
      expect(screen.getByLabelText(/Position \*/i)).toHaveValue('Software Engineer')
      expect(screen.getByLabelText(/Recruiter Name/i)).toHaveValue('John Doe')
      expect(screen.getByLabelText(/Notes/i)).toHaveValue('Test notes')
    })

    it('should render Update Job button when editing', () => {
      renderWithProviders(
        <JobForm
          job={mockJob}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByRole('button', { name: /Update Job/i })).toBeInTheDocument()
    })
  })

  describe('Form Submission - New Job', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Software Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')
      await user.type(screen.getByLabelText(/Notes/i), 'Test notes')

      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Test Company',
          position: 'Software Engineer',
          recruiterName: 'John Doe',
          notes: 'Test notes'
        })
      )
    })

    it('should not submit without required company name', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Position \*/i), 'Software Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should not submit without required position', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should not submit without required recruiter name', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Software Engineer')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should submit with default status values', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Software Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          recruiterScreen: 'Not Started',
          technicalScreen: 'Not Started',
          onsiteRound1: 'Not Started',
          onsiteRound2: 'Not Started',
          onsiteRound3: 'Not Started',
          onsiteRound4: 'Not Started',
          decision: 'Pending'
        })
      )
    })

    it('should submit with selected status values', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Software Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')

      const selects = screen.getAllByRole('combobox')
      await user.selectOptions(selects[0], 'In Progress')
      await user.selectOptions(selects[1], 'Completed')

      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          recruiterScreen: 'In Progress',
          technicalScreen: 'Completed'
        })
      )
    })

    it('should submit with all onsite rounds set', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Software Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe')

      const selects = screen.getAllByRole('combobox')

      // Set onsite rounds (assuming they are in the select list)
      const roundSelects = selects.slice(2, 6) // rounds 1-4
      for (let i = 0; i < roundSelects.length; i++) {
        await user.selectOptions(roundSelects[i], 'Completed')
      }

      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          onsiteRound1: 'Completed',
          onsiteRound2: 'Completed',
          onsiteRound3: 'Completed',
          onsiteRound4: 'Completed'
        })
      )
    })
  })

  describe('Form Submission - Edit Job', () => {
    it('should submit updated job data', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={mockJob}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const companyInput = screen.getByLabelText(/Company Name/i)
      await user.clear(companyInput)
      await user.type(companyInput, 'Updated Company')

      await user.click(screen.getByRole('button', { name: /Update Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Updated Company'
        })
      )
    })

    it('should preserve unchanged fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={mockJob}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const companyInput = screen.getByLabelText(/Company Name/i)
      await user.clear(companyInput)
      await user.type(companyInput, 'Updated Company')

      await user.click(screen.getByRole('button', { name: /Update Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 'Software Engineer',
          recruiterName: 'John Doe',
          notes: 'Test notes'
        })
      )
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'))
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.click(screen.getByRole('button', { name: /Cancel/i }))

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when clicking outside modal', async () => {
      const user = userEvent.setup()
      const { container } = renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      // Click on backdrop
      const backdrop = container.firstChild
      await user.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })

    it('should not call onClose when clicking inside modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const title = screen.getByText('Add New Job Application')
      await user.click(title)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Theme Support', () => {
    it('should render in light theme', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="light"
        />
      )

      expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
    })

    it('should render in dark theme', () => {
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long company name', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const longName = 'A'.repeat(200)
      await user.type(screen.getByLabelText(/Company Name/i), longName)
      await user.type(screen.getByLabelText(/Position \*/i), 'Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'Recruiter')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          company: longName
        })
      )
    })

    it('should handle special characters in all text fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Company & Co. <Ltd>')
      await user.type(screen.getByLabelText(/Position \*/i), 'Sr. Engineer (Level 5)')
      await user.type(screen.getByLabelText(/Recruiter Name/i), "O'Brien")
      await user.type(screen.getByLabelText(/Notes/i), 'Notes with "quotes" & symbols!')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Company & Co. <Ltd>',
          position: 'Sr. Engineer (Level 5)',
          recruiterName: "O'Brien",
          notes: 'Notes with "quotes" & symbols!'
        })
      )
    })

    it('should handle multiline notes', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const multilineNotes = 'Line 1\nLine 2\nLine 3'
      await user.type(screen.getByLabelText(/Company Name/i), 'Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'Recruiter')
      await user.type(screen.getByLabelText(/Notes/i), multilineNotes)
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: multilineNotes
        })
      )
    })

    it('should handle empty notes field', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'Recruiter')
      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: ''
        })
      )
    })

    it('should handle rapid form changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const companyInput = screen.getByLabelText(/Company Name/i)

      await user.type(companyInput, 'Company 1')
      await user.clear(companyInput)
      await user.type(companyInput, 'Company 2')
      await user.clear(companyInput)
      await user.type(companyInput, 'Company 3')

      expect(companyInput).toHaveValue('Company 3')
    })

    it('should handle form submission via Enter key in text input', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.type(screen.getByLabelText(/Company Name/i), 'Test Company')
      await user.type(screen.getByLabelText(/Position \*/i), 'Software Engineer')
      await user.type(screen.getByLabelText(/Recruiter Name/i), 'John Doe{Enter}')

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled()
      })
    })

    it('should not allow Enter key in textarea', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const notesField = screen.getByLabelText(/Notes/i)
      await user.type(notesField, 'Line 1{Enter}Line 2')

      expect(notesField).toHaveValue('Line 1\nLine 2')
      expect(onSave).not.toHaveBeenCalled()
    })

    it('should handle all status dropdowns correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm
          job={null}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      const selects = screen.getAllByRole('combobox')

      // Test each select has correct options
      expect(selects.length).toBeGreaterThan(0)

      for (const select of selects) {
        const options = within(select).getAllByRole('option')
        expect(options.length).toBeGreaterThan(0)
      }
    })

    it('should handle job with null notes', async () => {
      const user = userEvent.setup()
      const jobWithNullNotes = { ...mockJob, notes: null }

      renderWithProviders(
        <JobForm
          job={jobWithNullNotes}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.click(screen.getByRole('button', { name: /Update Job/i }))

      expect(onSave).toHaveBeenCalled()
    })

    it('should handle job with undefined fields', async () => {
      const user = userEvent.setup()
      const minimalJob = {
        company: 'Test',
        position: 'Engineer',
        recruiterName: 'Recruiter'
      }

      renderWithProviders(
        <JobForm
          job={minimalJob}
          onSave={onSave}
          onClose={onClose}
          theme="dark"
        />
      )

      await user.click(screen.getByRole('button', { name: /Update Job/i }))

      expect(onSave).toHaveBeenCalled()
    })
  })
})
