import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FindAccountant from '../../pages/FindAccountant'

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ activeCompanyId: 1 }),
}))

const mockAccountants = [
  { id: 1, name: 'Bob Accountant', email: 'bob@example.com', phone: '555-0100', requestStatus: null },
  { id: 2, name: 'Carol CPA', email: 'carol@example.com', requestStatus: 'pending' },
  { id: 3, name: 'Dave Books', email: 'dave@example.com', requestStatus: 'active' },
]

const mockGetPublicAccountants = vi.fn()
const mockSendAccountantRequest = vi.fn()
const mockDisconnectAccountant = vi.fn()

vi.mock('../../services/accountants', () => ({
  getPublicAccountants: (...args) => mockGetPublicAccountants(...args),
  sendAccountantRequest: (...args) => mockSendAccountantRequest(...args),
  disconnectAccountant: (...args) => mockDisconnectAccountant(...args),
}))

describe('FindAccountant', () => {
  const renderPage = () => render(<MemoryRouter><FindAccountant /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page heading', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    renderPage()
    expect(await screen.findByText('Find an Accountant')).toBeInTheDocument()
  })

  it('shows loading skeletons while fetching', () => {
    mockGetPublicAccountants.mockReturnValue(new Promise(() => {}))
    renderPage()
    const searchBox = screen.getByPlaceholderText(/Search by name or email/)
    expect(searchBox).toBeInTheDocument()
  })

  it('renders accountant cards when data loads', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    renderPage()
    expect(await screen.findByText('Bob Accountant')).toBeInTheDocument()
    expect(screen.getByText('Carol CPA')).toBeInTheDocument()
    expect(screen.getByText('Dave Books')).toBeInTheDocument()
  })

  it('shows error alert on fetch failure', async () => {
    mockGetPublicAccountants.mockRejectedValue(new Error('Failed to load'))
    renderPage()
    expect(await screen.findByText('Failed to load')).toBeInTheDocument()
  })

  it('shows empty message when no accountants', async () => {
    mockGetPublicAccountants.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/No public accountants are available/)).toBeInTheDocument()
  })

  it('shows empty search result message', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    renderPage()
    await screen.findByText('Bob Accountant')
    const searchInput = screen.getByPlaceholderText(/Search by name or email/)
    await userEvent.type(searchInput, 'zzzzzz')
    expect(await screen.findByText(/No accountants match your search/)).toBeInTheDocument()
  })

  it('renders Send Request button for accountants with no status', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    renderPage()
    const buttons = await screen.findAllByText('Send Request')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Request Sent chip for pending accountants', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    renderPage()
    expect(await screen.findByText('Request Sent')).toBeInTheDocument()
  })

  it('renders Working Together chip for active accountants', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    renderPage()
    const chip = await screen.findByText('Working Together')
    expect(chip).toBeInTheDocument()
    expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-outlinedSuccess')
  })

  it('sends request on button click', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    mockSendAccountantRequest.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Bob Accountant')
    const sendBtn = screen.getAllByText('Send Request')[0]
    await userEvent.click(sendBtn)
    expect(mockSendAccountantRequest).toHaveBeenCalledWith(1, 1, 'test-token')
  })

  it('shows success message after sending request', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    mockSendAccountantRequest.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Bob Accountant')
    const sendBtn = screen.getAllByText('Send Request')[0]
    await userEvent.click(sendBtn)
    expect(await screen.findByText(/Request sent/)).toBeInTheDocument()
  })

  it('shows error message on send failure', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    mockSendAccountantRequest.mockRejectedValue(new Error('Send failed'))
    renderPage()
    await screen.findByText('Bob Accountant')
    const sendBtn = screen.getAllByText('Send Request')[0]
    await userEvent.click(sendBtn)
    expect(await screen.findByText('Send failed')).toBeInTheDocument()
  })

  it('opens disconnect confirmation dialog', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    renderPage()
    await screen.findByText('Dave Books')
    const deleteIcon = document.querySelector('.MuiChip-deleteIcon')
    await userEvent.click(deleteIcon)
    expect(await screen.findByText('Confirm removal')).toBeInTheDocument()
  })

  it('disconnects accountant when confirmed', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    mockDisconnectAccountant.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Dave Books')
    const deleteIcon = document.querySelector('.MuiChip-deleteIcon')
    await userEvent.click(deleteIcon)
    const removeBtn = await screen.findByText('Remove')
    await userEvent.click(removeBtn)
    expect(mockDisconnectAccountant).toHaveBeenCalledWith(3, 1, 'test-token')
  })

  it('cancels disconnect dialog', async () => {
    mockGetPublicAccountants.mockResolvedValue(mockAccountants)
    renderPage()
    await screen.findByText('Dave Books')
    const deleteIcon = document.querySelector('.MuiChip-deleteIcon')
    await userEvent.click(deleteIcon)
    const cancelBtn = await screen.findByRole('button', { name: 'Cancel' })
    await userEvent.click(cancelBtn)
    await waitFor(() => {
      expect(screen.queryByText('Confirm removal')).not.toBeInTheDocument()
    })
  })
})
