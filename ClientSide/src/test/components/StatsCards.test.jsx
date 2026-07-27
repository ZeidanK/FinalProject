import { render, screen } from '@testing-library/react'
import StatsCards from '../../components/StatsCards'

describe('StatsCards', () => {
  it('renders all four stat cards', () => {
    render(
      <StatsCards
        unmatchedInvoices={5}
        unmatchedTransactions={3}
        totalMatches={12}
        totalMatchedFormatted="15,000.00"
      />,
    )
    expect(screen.getByText('Unmatched Invoices')).toBeInTheDocument()
    expect(screen.getByText('Unmatched Transactions')).toBeInTheDocument()
    expect(screen.getByText('Total Matches')).toBeInTheDocument()
    expect(screen.getByText('Total Matched')).toBeInTheDocument()
  })

  it('displays correct values', () => {
    render(
      <StatsCards
        unmatchedInvoices={5}
        unmatchedTransactions={3}
        totalMatches={12}
        totalMatchedFormatted="15,000.00"
      />,
    )
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('15,000.00')).toBeInTheDocument()
  })

  it('handles zero values', () => {
    render(
      <StatsCards
        unmatchedInvoices={0}
        unmatchedTransactions={0}
        totalMatches={0}
        totalMatchedFormatted="0.00"
      />,
    )
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(1)
  })
})
