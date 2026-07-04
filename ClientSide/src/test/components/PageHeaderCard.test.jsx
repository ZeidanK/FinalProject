import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageHeaderCard from '../../components/PageHeaderCard'

describe('PageHeaderCard', () => {
  it('renders title and description', () => {
    render(<PageHeaderCard title="Dashboard" description="Overview of your data" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview of your data')).toBeInTheDocument()
  })

  it('renders refresh button when onRefresh is provided', () => {
    render(<PageHeaderCard title="T" description="D" onRefresh={vi.fn()} />)
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
  })

  it('does not render refresh button when onRefresh is omitted', () => {
    render(<PageHeaderCard title="T" description="D" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRefresh when refresh button is clicked', async () => {
    const onRefresh = vi.fn()
    render(<PageHeaderCard title="T" description="D" onRefresh={onRefresh} />)
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('disables refresh button when refreshDisabled is true', () => {
    render(<PageHeaderCard title="T" description="D" onRefresh={vi.fn()} refreshDisabled={true} />)
    expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled()
  })
})
