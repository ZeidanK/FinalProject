import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlobalNotifications from '../../components/GlobalNotifications'

const mockQueue = []
const mockDismiss = vi.fn()

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({
    queue: mockQueue,
    dismiss: mockDismiss,
  }),
}))

describe('GlobalNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueue.length = 0
  })

  it('renders queued notifications', () => {
    mockQueue.push(
      { id: '1', message: 'File uploaded', severity: 'success', autoHideMs: 4000 },
      { id: '2', message: 'Error occurred', severity: 'error', autoHideMs: 6000 },
    )
    render(<GlobalNotifications />)
    expect(screen.getByText('File uploaded')).toBeInTheDocument()
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })

  it('renders nothing when queue is empty', () => {
    render(<GlobalNotifications />)
    expect(screen.queryByText('File uploaded')).not.toBeInTheDocument()
    expect(screen.queryByText('Error occurred')).not.toBeInTheDocument()
  })

  it('dismisses notification when notification box is clicked', async () => {
    mockQueue.push({ id: '1', message: 'File uploaded', severity: 'success', autoHideMs: 4000 })
    render(<GlobalNotifications />)
    fireEvent.click(screen.getByText('File uploaded'))
    expect(mockDismiss).toHaveBeenCalledWith('1')
  })
})
