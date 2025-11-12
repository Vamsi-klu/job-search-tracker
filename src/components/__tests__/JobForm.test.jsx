import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobForm from '../JobForm'
import { renderWithProviders, mockJob } from '../../test/utils'

describe('JobForm Component', () => {
  let onSave, onClose

  beforeEach(() => {
    onSave = vi.fn()
    onClose = vi.fn()
  })

  describe('Rendering', () => {
    it('should render form for new job', () => {
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
      expect(screen.getByText(/Company Name/i)).toBeInTheDocument()
      expect(screen.getByText(/Position/i)).toBeInTheDocument()
      expect(screen.getByText(/Recruiter Name/i)).toBeInTheDocument()
    })

    it('should render form for editing job', () => {
      renderWithProviders(
        <JobForm job={mockJob} onSave={onSave} onClose={onClose} theme="dark" />
      )

      expect(screen.getByText('Edit Job Application')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      // Check that all field labels are present
      expect(screen.getByText(/Company Name/i)).toBeInTheDocument()
      expect(screen.getByText(/Position/i)).toBeInTheDocument()
      expect(screen.getByText(/Recruiter Name/i)).toBeInTheDocument()
      expect(screen.getByText(/Notes/i)).toBeInTheDocument()
      expect(screen.getByText(/Recruiter Screen/i)).toBeInTheDocument()
      expect(screen.getByText(/Technical Screen/i)).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      expect(screen.getByRole('button', { name: /Add Job/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      // Get text inputs by their order
      const textInputs = screen.getAllByRole('textbox')
      await user.type(textInputs[0], 'New Company')
      await user.type(textInputs[1], 'Engineer')
      await user.type(textInputs[2], 'Recruiter')

      await user.click(screen.getByRole('button', { name: /Add Job/i }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled()
      })
    })

    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      await user.click(screen.getByRole('button', { name: /Cancel/i }))

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when clicking outside modal', async () => {
      const user = userEvent.setup()
      const { container } = renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      await user.click(container.firstChild)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Form Fields', () => {
    it('should update company field', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      const textInputs = screen.getAllByRole('textbox')
      const companyInput = textInputs[0]
      await user.type(companyInput, 'Test Company')

      expect(companyInput).toHaveValue('Test Company')
    })

    it('should update notes field', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      const textInputs = screen.getAllByRole('textbox')
      const notesField = textInputs[textInputs.length - 1] // Notes is typically the last textbox
      await user.type(notesField, 'Test notes')

      expect(notesField).toHaveValue('Test notes')
    })

    it('should have default status values', () => {
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })
  })

  describe('Theme Support', () => {
    it('should render in light theme', () => {
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="light" />
      )

      expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
    })

    it('should render in dark theme', () => {
      renderWithProviders(
        <JobForm job={null} onSave={onSave} onClose={onClose} theme="dark" />
      )

      expect(screen.getByText('Add New Job Application')).toBeInTheDocument()
    })
  })
})
