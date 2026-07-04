import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfidenceFieldRow from '../../components/ConfidenceFieldRow'

describe('ConfidenceFieldRow', () => {
  it('renders label and value', () => {
    render(<ConfidenceFieldRow label="Total" value={100} onChange={vi.fn()} />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
  })

  it('calls onChange when value changes', async () => {
    const onChange = vi.fn()
    render(<ConfidenceFieldRow label="Amount" value="" onChange={onChange} />)
    const input = screen.getByRole('spinbutton')
    await userEvent.type(input, '50')
    expect(onChange).toHaveBeenCalled()
  })

  it('disables input when disabled is true', () => {
    render(<ConfidenceFieldRow label="Amount" value={50} onChange={vi.fn()} disabled={true} />)
    expect(screen.getByRole('spinbutton')).toBeDisabled()
  })

  it('shows confidence chip', () => {
    render(<ConfidenceFieldRow label="Total" value={200} confidence={0.95} onChange={vi.fn()} />)
    expect(screen.getByText(/high|95/i)).toBeInTheDocument()
  })
})
