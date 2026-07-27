import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SnackbarAlert from '../../components/SnackbarAlert'

describe('SnackbarAlert', () => {
  it('renders message when open', () => {
    render(<SnackbarAlert open={true} message="Saved!" severity="success" onClose={vi.fn()} />)
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SnackbarAlert open={false} message="Saved!" severity="success" onClose={vi.fn()} />)
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<SnackbarAlert open={true} message="Error!" severity="error" onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
