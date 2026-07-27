import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnomalyDetailsModal from '../../components/AnomalyDetailsModal'

const openAnomaly = {
  id: 42,
  anomalyType: 'amount_mismatch',
  title: 'Amount mismatch on INV-001',
  description: 'The invoice amount does not match the transaction.',
  relatedItemsCount: 2,
  relatedItems: [
    { itemType: 'invoice', entityId: 101, label: 'INV-001', amount: 1000 },
    { itemType: 'transaction', entityId: 201, label: 'TXN-001', amount: 950 },
  ],
  status: 'open',
  detectionMethod: 'rule_based',
  detectionConfidence: 0.95,
  suggestedAction: 'Review the amounts',
  createdAt: '2025-06-01T10:00:00Z',
}

const resolvedAnomaly = {
  id: 43,
  anomalyType: 'duplicate',
  title: 'Duplicate invoice INV-002',
  description: 'This invoice appears to be a duplicate.',
  relatedItemsCount: 3,
  relatedItems: [],
  status: 'resolved',
  detectionMethod: 'rule_based',
  detectionConfidence: 0.98,
  suggestedAction: 'Remove duplicate',
  resolvedAt: '2025-06-05T10:00:00Z',
  resolutionNotes: 'Confirmed duplicate, kept original.',
  createdAt: '2025-06-02T10:00:00Z',
}

const dismissedAnomaly = {
  id: 44,
  anomalyType: 'missing_link',
  title: 'Missing link for TXN-003',
  description: null,
  relatedItemsCount: 1,
  relatedItems: [],
  status: 'dismissed',
  detectionMethod: 'rule_based',
  detectionConfidence: null,
  suggestedAction: null,
  resolvedAt: '2025-06-06T10:00:00Z',
  resolutionNotes: '',
  createdAt: '2025-06-03T10:00:00Z',
}

const duplicateAnomaly = {
  id: 45,
  anomalyType: 'duplicate',
  title: 'Duplicate invoices detected',
  description: 'Multiple invoices appear to be duplicates.',
  relatedItemsCount: 3,
  relatedItems: [
    { itemType: 'invoice', entityId: 301, label: 'INV-301', amount: 500 },
    { itemType: 'invoice', entityId: 302, label: 'INV-302', amount: 500 },
    { itemType: 'invoice', entityId: 303, label: 'INV-303', amount: 500 },
  ],
  status: 'open',
  detectionMethod: 'hash_match',
  detectionConfidence: 0.99,
  suggestedAction: 'Keep one invoice and remove duplicates.',
  createdAt: '2025-06-04T10:00:00Z',
}

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onResolve: vi.fn(),
  onDismiss: vi.fn(),
  onKeepItem: vi.fn(),
  onViewInvoice: vi.fn(),
}

describe('AnomalyDetailsModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<AnomalyDetailsModal {...defaultProps} open={false} />)
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('renders title when open', () => {
    render(<AnomalyDetailsModal {...defaultProps} />)
    expect(screen.getByText('Anomaly Details')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    render(<AnomalyDetailsModal {...defaultProps} loading={true} />)
    expect(screen.getByText('Anomaly Details')).toBeInTheDocument()
    expect(screen.queryByText('Amount mismatch on INV-001')).not.toBeInTheDocument()
  })

  it('shows error alert', () => {
    render(<AnomalyDetailsModal {...defaultProps} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows info when no anomaly data', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={null} />)
    expect(screen.getByText('No anomaly details available.')).toBeInTheDocument()
  })

  it('renders anomaly details for open anomaly', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} />)
    expect(screen.getByText(openAnomaly.title)).toBeInTheDocument()
    expect(screen.getByText(openAnomaly.description)).toBeInTheDocument()
    expect(screen.getByText('Unresolved')).toBeInTheDocument()
    expect(screen.getAllByText('Amount Mismatch').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/95%/)).toBeInTheDocument()
    expect(screen.getByText('01/06/2025')).toBeInTheDocument()
  })

  it('renders resolution form for open anomalies', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} />)
    expect(screen.getByLabelText('Resolution Notes')).toBeInTheDocument()
  })

  it('shows Dismiss and Resolve buttons for open anomalies', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} />)
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument()
  })

  it('hides Resolve button for duplicate anomaly needing decision', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={duplicateAnomaly} />)
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument()
  })

  it('shows related records for anomalies with related items', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} />)
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('TXN-001')).toBeInTheDocument()
    expect(screen.getAllByText('Related Records').length).toBeGreaterThanOrEqual(1)
  })

  it('shows View and Keep This buttons for related invoices in open duplicate', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={duplicateAnomaly} />)
    const viewButtons = screen.getAllByRole('button', { name: /view/i })
    expect(viewButtons.length).toBe(3)
    const keepButtons = screen.getAllByRole('button', { name: /keep this/i })
    expect(keepButtons.length).toBe(3)
  })

  it('calls onViewInvoice when View is clicked', async () => {
    const onViewInvoice = vi.fn()
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={duplicateAnomaly} onViewInvoice={onViewInvoice} />)
    const viewButtons = screen.getAllByRole('button', { name: /view/i })
    await userEvent.click(viewButtons[0])
    expect(onViewInvoice).toHaveBeenCalledWith(duplicateAnomaly.relatedItems[0])
  })

  it('calls onKeepItem when Keep This is clicked', async () => {
    const onKeepItem = vi.fn()
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={duplicateAnomaly} onKeepItem={onKeepItem} />)
    const keepButtons = screen.getAllByRole('button', { name: /keep this/i })
    await userEvent.click(keepButtons[0])
    expect(onKeepItem).toHaveBeenCalledWith(duplicateAnomaly.relatedItems[0])
  })

  it('calls onResolve with notes when Resolve is clicked', async () => {
    const onResolve = vi.fn()
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} onResolve={onResolve} />)
    const input = screen.getByLabelText('Resolution Notes')
    await userEvent.type(input, 'Checked and confirmed mismatch.')
    const resolveBtn = screen.getByRole('button', { name: /resolve/i })
    await userEvent.click(resolveBtn)
    expect(onResolve).toHaveBeenCalledWith('Checked and confirmed mismatch.')
  })

  it('calls onResolve with null when Resolve is clicked with empty notes', async () => {
    const onResolve = vi.fn()
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} onResolve={onResolve} />)
    const resolveBtn = screen.getByRole('button', { name: /resolve/i })
    await userEvent.click(resolveBtn)
    expect(onResolve).toHaveBeenCalledWith('')
  })

  it('calls onDismiss with notes when Dismiss is clicked', async () => {
    const onDismiss = vi.fn()
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} onDismiss={onDismiss} />)
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
    await userEvent.click(dismissBtn)
    expect(onDismiss).toHaveBeenCalledWith('')
  })

  it('renders resolved anomaly details without actions', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={resolvedAnomaly} />)
    expect(screen.getByText('Duplicate invoice INV-002')).toBeInTheDocument()
    expect(screen.getByText('Resolved')).toBeInTheDocument()
    expect(screen.getByText('Confirmed duplicate, kept original.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument()
  })

  it('renders dismissed anomaly details without actions', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={dismissedAnomaly} />)
    expect(screen.getByText('Missing link for TXN-003')).toBeInTheDocument()
    expect(screen.getByText('Dismissed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument()
  })

  it('disables buttons when resolveBusy is true', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} resolveBusy={true} />)
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /resolving/i })).toBeDisabled()
  })

  it('disables buttons when cleanupBusy is true', () => {
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={duplicateAnomaly} cleanupBusy={true} />)
    const keepButtons = screen.getAllByRole('button', { name: /keep this/i })
    keepButtons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('does not block onClose when no busy operation', async () => {
    const onClose = vi.fn()
    render(<AnomalyDetailsModal {...defaultProps} selectedAnomaly={openAnomaly} onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
