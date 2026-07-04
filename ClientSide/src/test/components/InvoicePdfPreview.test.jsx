import { render, screen } from '@testing-library/react'
import InvoicePdfPreview from '../../components/InvoicePdfPreview'

vi.mock('react-pdf', () => ({
  Document: ({ children }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ pageNumber }) => <div data-testid="pdf-page">Page {pageNumber}</div>,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}))

describe('InvoicePdfPreview', () => {
  it('renders PDF Preview header', () => {
    render(<InvoicePdfPreview />)
    expect(screen.getByText('PDF Preview')).toBeInTheDocument()
  })

  it('renders non-PDF alert when file is not a PDF', () => {
    render(<InvoicePdfPreview fileType="image/png" fileName="photo.png" />)
    expect(screen.getByText('This attachment is not a PDF file, so inline preview is unavailable.')).toBeInTheDocument()
  })

  it('shows error when no token and no local file', async () => {
    render(<InvoicePdfPreview open={true} fileType="application/pdf" invoiceId={1} />)
    expect(await screen.findByText('No invoice file is available to preview.')).toBeInTheDocument()
  })
})
