import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SuggestionPanel from '../../components/SuggestionPanel'

describe('SuggestionPanel', () => {
  it('renders nothing when suggestions are empty', () => {
    const { container } = render(<SuggestionPanel suggestions={[]} onSelect={() => {}} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders suggestion items with confidence', () => {
    const suggestions = [
      {
        id: 1,
        matchScore: 85,
        description: 'Test transaction',
        amount: 500,
      },
    ]
    render(<SuggestionPanel suggestions={suggestions} onSelect={() => {}} />)
    expect(screen.getByText('AI Suggestions')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('Test transaction')).toBeInTheDocument()
  })

  it('calls onSelect when select button clicked', async () => {
    const onSelect = vi.fn()
    const suggestions = [
      {
        id: 1,
        matchScore: 85,
        description: 'Test transaction',
        amount: 500,
      },
    ]
    render(<SuggestionPanel suggestions={suggestions} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /select/i }))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('handles camelCase field names', () => {
    const suggestions = [
      {
        transactionId: 5,
        matchConfidence: 0.9,
        transactionDescription: 'Camel txn',
        transactionAmount: 300,
      },
    ]
    render(<SuggestionPanel suggestions={suggestions} onSelect={() => {}} />)
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('Camel txn')).toBeInTheDocument()
  })
})
