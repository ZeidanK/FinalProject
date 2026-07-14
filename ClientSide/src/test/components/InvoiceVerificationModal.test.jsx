import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InvoiceVerificationModal from '../../components/InvoiceVerificationModal'

vi.mock('react-pdf', () => ({
  Document: ({ children }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ pageNumber }) => <div data-testid="pdf-page">Page {pageNumber}</div>,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}))

describe('InvoiceVerificationModal', () => {
  const baseProps = { open: true, onClose: vi.fn(), onSave: vi.fn() }

  it('renders title and close button', () => {
    render(<InvoiceVerificationModal {...baseProps} />)
    expect(screen.getByText('Verify Extracted Data')).toBeInTheDocument()
  })

  it('renders read-only title when readOnly is true', () => {
    render(<InvoiceVerificationModal {...baseProps} readOnly={true} />)
    expect(screen.getByText('Invoice Details')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<InvoiceVerificationModal {...baseProps} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders extraction method chip when provided', () => {
    render(<InvoiceVerificationModal {...baseProps} extractionMethod="gemini" />)
    expect(screen.getByText('GEMINI')).toBeInTheDocument()
  })

  it('renders initial data field values', () => {
    const initialData = { vendorName: { value: 'Acme Corp', confidence: 0.95 } }
    render(<InvoiceVerificationModal {...baseProps} initialData={initialData} />)
    const input = screen.getByDisplayValue('Acme Corp')
    expect(input).toBeInTheDocument()
  })

  it('calls onSave when Save & Confirm is clicked', async () => {
    const onSave = vi.fn()
    render(<InvoiceVerificationModal {...baseProps} onSave={onSave} />)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalled()
  })

  it('enables payment plan toggle when initial payment data exists', () => {
    const initialData = {
      paymentPlan: {
        totalInstallments: { value: 6, confidence: 0.9 },
        installmentAmount: { value: 100, confidence: 0.9 },
        frequency: { value: 'monthly', confidence: 0.9 },
        currentInstallment: { value: 1, confidence: 0.9 },
        description: { value: 'Monthly plan', confidence: 0.9 },
      },
    }

    render(<InvoiceVerificationModal {...baseProps} initialData={initialData} />)

    expect(screen.getByRole('switch', { name: /payment plan/i })).toBeChecked()
    expect(screen.getByText('Total Installments')).toBeInTheDocument()
  })

  it('clears and hides payment plan fields when toggled off', async () => {
    const onSave = vi.fn()
    const initialData = {
      paymentPlan: {
        totalInstallments: { value: 6, confidence: 0.9 },
        installmentAmount: { value: 100, confidence: 0.9 },
        frequency: { value: 'monthly', confidence: 0.9 },
        currentInstallment: { value: 1, confidence: 0.9 },
        description: { value: 'Monthly plan', confidence: 0.9 },
      },
    }

    render(<InvoiceVerificationModal {...baseProps} initialData={initialData} onSave={onSave} />)

    await userEvent.click(screen.getByRole('switch', { name: /payment plan/i }))

    expect(screen.getByRole('switch', { name: /payment plan/i })).not.toBeChecked()
    expect(screen.queryByText('Total Installments')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      paymentPlanEnabled: false,
      paymentPlan: expect.objectContaining({
        totalInstallments: expect.objectContaining({ value: '' }),
        installmentAmount: expect.objectContaining({ value: '' }),
        frequency: expect.objectContaining({ value: '' }),
        currentInstallment: expect.objectContaining({ value: '' }),
        description: expect.objectContaining({ value: '' }),
      }),
    }))
  })

  it('shows empty payment plan fields when toggled back on', async () => {
    const initialData = {
      paymentPlan: {
        totalInstallments: { value: 6, confidence: 0.9 },
        installmentAmount: { value: 100, confidence: 0.9 },
        frequency: { value: 'monthly', confidence: 0.9 },
        currentInstallment: { value: 1, confidence: 0.9 },
        description: { value: 'Monthly plan', confidence: 0.9 },
      },
    }

    render(<InvoiceVerificationModal {...baseProps} initialData={initialData} />)

    const toggle = screen.getByRole('switch', { name: /payment plan/i })
    await userEvent.click(toggle)
    await userEvent.click(toggle)

    expect(screen.getByText('Total Installments')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('6')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('monthly')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('Monthly plan')).not.toBeInTheDocument()
  })
})
