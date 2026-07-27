import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MatchActionBar from '../../components/MatchActionBar'

describe('MatchActionBar', () => {
  const baseProps = {
    onClear: vi.fn(),
    onCreateMatch: vi.fn(),
    matchBusy: false,
    canCreate: true,
  }

  it('renders nothing when no selection', () => {
    const { container } = render(
      <MatchActionBar {...baseProps} selectedInvoice={null} selectedTransaction={null} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows selected invoice and transaction', () => {
    render(
      <MatchActionBar
        {...baseProps}
        selectedInvoice={{ id: 1, invoice_number: 'INV-001' }}
        selectedTransaction={{ id: 2, vendor_name: 'Vendor A' }}
      />,
    )
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('Vendor A')).toBeInTheDocument()
  })

  it('disables create button when canCreate is false', () => {
    render(
      <MatchActionBar
        {...baseProps}
        canCreate={false}
        selectedInvoice={{ id: 1 }}
        selectedTransaction={{ id: 2 }}
      />,
    )
    expect(screen.getByRole('button', { name: /create match/i })).toBeDisabled()
  })

  it('calls onCreateMatch when button clicked', async () => {
    const onCreateMatch = vi.fn()
    render(
      <MatchActionBar
        {...baseProps}
        onCreateMatch={onCreateMatch}
        selectedInvoice={{ id: 1, invoice_number: 'INV-001' }}
        selectedTransaction={{ id: 2, vendor_name: 'Vendor A' }}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /create match/i }))
    expect(onCreateMatch).toHaveBeenCalledTimes(1)
  })

  it('calls onClear when clear button clicked', async () => {
    const onClear = vi.fn()
    render(
      <MatchActionBar
        {...baseProps}
        onClear={onClear}
        selectedInvoice={{ id: 1 }}
        selectedTransaction={{ id: 2 }}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('shows matching text when busy', () => {
    render(
      <MatchActionBar
        {...baseProps}
        matchBusy
        selectedInvoice={{ id: 1 }}
        selectedTransaction={{ id: 2 }}
      />,
    )
    expect(screen.getByText(/matching/i)).toBeInTheDocument()
  })
})
