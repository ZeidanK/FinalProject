import { render, screen } from '@testing-library/react'
import RecentActivityTimeline from '../../components/RecentActivityTimeline'

const sampleItems = [
  { id: 1, date: '2026-07-01', text: 'Invoice INV-001 processed' },
  { id: 2, date: '2026-07-02', text: 'Match: INV-001 matched to TX-100 with score 92%' },
  { id: 3, date: '2026-07-03', text: 'Anomaly detected: Duplicate invoice INV-002' },
]

describe('RecentActivityTimeline', () => {
  it('renders loading state', () => {
    const { container } = render(<RecentActivityTimeline loading={true} />)
    const boxes = container.querySelectorAll('[class*="MuiBox-root"]')
    expect(boxes.length).toBeGreaterThanOrEqual(3)
  })

  it('renders empty alert when no items', () => {
    render(<RecentActivityTimeline items={[]} />)
    expect(screen.getByText('No recent activity to display.')).toBeInTheDocument()
  })

  it('renders activity items with categories', () => {
    render(<RecentActivityTimeline items={sampleItems} />)
    expect(screen.getByText('Invoice INV-001 processed')).toBeInTheDocument()
    expect(screen.getByText('Match: INV-001 matched to TX-100 with score 92%')).toBeInTheDocument()
    expect(screen.getByText('Anomaly detected: Duplicate invoice INV-002')).toBeInTheDocument()
  })

  it('assigns correct category chips', () => {
    render(<RecentActivityTimeline items={sampleItems} />)
    expect(screen.getByText('Invoice')).toBeInTheDocument()
    expect(screen.getByText('Match')).toBeInTheDocument()
    expect(screen.getByText('Anomaly')).toBeInTheDocument()
  })

  it('renders activity chip for uncategorized text', () => {
    const items = [{ id: 4, date: '2026-07-04', text: 'User logged in' }]
    render(<RecentActivityTimeline items={items} />)
    expect(screen.getByText('Activity')).toBeInTheDocument()
  })
})
