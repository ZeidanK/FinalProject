import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from '../../components/EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Nothing to show yet." />)
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('Nothing to show yet.')).toBeInTheDocument()
  })

  it('renders action button when actionLabel is provided', () => {
    render(<EmptyState title="Empty" description="desc" actionLabel="Add Item" />)
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument()
  })

  it('does not render action button when actionLabel is omitted', () => {
    render(<EmptyState title="Empty" description="desc" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onAction when button is clicked', async () => {
    const onAction = vi.fn()
    render(<EmptyState title="Empty" description="desc" actionLabel="Go" onAction={onAction} />)
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('renders custom icon instead of default', () => {
    render(<EmptyState title="Empty" description="desc" icon={() => <span data-testid="custom-icon" />} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})
