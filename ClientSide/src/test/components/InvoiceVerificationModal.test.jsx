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
})
