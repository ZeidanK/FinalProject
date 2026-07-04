import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlobalNotifications from '../../components/GlobalNotifications'

const mockDismiss = vi.fn()
const mockQueue = [
  { id: '1', message: 'File uploaded', severity: 'success', autoHideMs: 4000 },
  { id: '2', message: 'Error occurred', severity: 'error', autoHideMs: 6000 },
]

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({
    queue: mockQueue,
    dismiss: mockDismiss,
  }),
}))

describe('GlobalNotifications', () => {
  it('renders queued notifications', () => {
    render(<GlobalNotifications />)
    expect(screen.getByText('File uploaded')).toBeInTheDocument()
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })

  it('renders nothing when queue is empty', () => {
    mockQueue.length = 0
    const { container } = render(<GlobalNotifications />)
    expect(container.firstChild).toBeNull()
    mockQueue.push(
      { id: '1', message: 'File uploaded', severity: 'success', autoHideMs: 4000 },
      { id: '2', message: 'Error occurred', severity: 'error', autoHideMs: 6000 }
    )
  })

  it('dismisses notification when close is clicked', async () => {
    render(<GlobalNotifications />)
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    await userEvent.click(closeButtons[0])
    expect(mockDismiss).toHaveBeenCalledWith('1')
  })
})
