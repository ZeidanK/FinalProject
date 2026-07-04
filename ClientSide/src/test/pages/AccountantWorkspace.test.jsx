import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AccountantWorkspace from '../../pages/AccountantWorkspace'

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Test Accountant' }, token: 'test-token' }),
}))

const mockSetActiveCompanyId = vi.fn()
const mockRefreshCompanies = vi.fn()

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({
    setActiveCompanyId: (...args) => mockSetActiveCompanyId(...args),
    activeCompanyId: 2,
    refreshCompanies: mockRefreshCompanies,
  }),
}))

const mockRequests = [
  { id: 10, companyName: 'Acme Corp', requestedByName: 'Alice Owner', createdAt: '2025-03-01T12:00:00Z' },
  { id: 11, companyName: 'Beta Inc', requestedByName: 'Bob CEO', createdAt: '2025-03-02T12:00:00Z' },
]

const mockCompanies = [
  { id: 2, name: 'Gamma LLC', city: 'New York', country: 'USA', currency: 'USD' },
  { id: 3, name: 'Delta Co', city: 'London', country: 'UK', currency: 'GBP' },
]

const mockGetUserById = vi.fn()
const mockUpdateUserVisibility = vi.fn()
const mockGetAccountantRequests = vi.fn()
const mockGetAccountantCompanies = vi.fn()
const mockRespondToRequest = vi.fn()
const mockDisconnectAccountant = vi.fn()

vi.mock('../../services/users', () => ({
  getUserById: (...args) => mockGetUserById(...args),
  updateUserVisibility: (...args) => mockUpdateUserVisibility(...args),
}))

vi.mock('../../services/accountants', () => ({
  getAccountantRequests: (...args) => mockGetAccountantRequests(...args),
  getAccountantCompanies: (...args) => mockGetAccountantCompanies(...args),
  respondToRequest: (...args) => mockRespondToRequest(...args),
  disconnectAccountant: (...args) => mockDisconnectAccountant(...args),
}))

describe('AccountantWorkspace', () => {
  const renderPage = () => render(<MemoryRouter><AccountantWorkspace /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserById.mockResolvedValue({ isPublic: true })
    mockGetAccountantRequests.mockResolvedValue(mockRequests)
    mockGetAccountantCompanies.mockResolvedValue(mockCompanies)
  })

  it('renders the page heading', async () => {
    renderPage()
    expect(await screen.findByText('My Workspace')).toBeInTheDocument()
  })

  it('renders Availability section', async () => {
    renderPage()
    expect(await screen.findByText('Availability')).toBeInTheDocument()
  })

  it('shows public status when profile is public', async () => {
    renderPage()
    expect(await screen.findByText(/Public — Business owners can find you/)).toBeInTheDocument()
  })

  it('shows private status when profile is private', async () => {
    mockGetUserById.mockResolvedValue({ isPublic: false })
    renderPage()
    expect(await screen.findByText(/Private — Hidden from the directory/)).toBeInTheDocument()
  })

  it('renders Incoming Requests section', async () => {
    renderPage()
    expect(await screen.findByText('Incoming Requests')).toBeInTheDocument()
  })

  it('shows request cards', async () => {
    renderPage()
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
  })

  it('shows requested by names', async () => {
    renderPage()
    expect(await screen.findByText(/Requested by Alice Owner/)).toBeInTheDocument()
  })

  it('shows empty message when no requests', async () => {
    mockGetAccountantRequests.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/No pending requests at this time/)).toBeInTheDocument()
  })

  it('shows error alert on requests failure', async () => {
    mockGetAccountantRequests.mockRejectedValue(new Error('Requests error'))
    renderPage()
    expect(await screen.findByText('Requests error')).toBeInTheDocument()
  })

  it('renders Accept and Decline buttons for requests', async () => {
    renderPage()
    const acceptBtns = await screen.findAllByText('Accept')
    const declineBtns = await screen.findAllByText('Decline')
    expect(acceptBtns.length).toBeGreaterThanOrEqual(1)
    expect(declineBtns.length).toBeGreaterThanOrEqual(1)
  })

  it('calls respondToRequest on Accept', async () => {
    mockRespondToRequest.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Acme Corp')
    const acceptBtn = screen.getAllByText('Accept')[0]
    await userEvent.click(acceptBtn)
    expect(mockRespondToRequest).toHaveBeenCalledWith(10, true, 'test-token')
  })

  it('calls respondToRequest on Decline', async () => {
    mockRespondToRequest.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Acme Corp')
    const declineBtn = screen.getAllByText('Decline')[0]
    await userEvent.click(declineBtn)
    expect(mockRespondToRequest).toHaveBeenCalledWith(10, false, 'test-token')
  })

  it('renders Working With section', async () => {
    renderPage()
    expect(await screen.findByText('Working With')).toBeInTheDocument()
  })

  it('shows company cards', async () => {
    renderPage()
    expect(await screen.findByText('Gamma LLC')).toBeInTheDocument()
    expect(screen.getByText('Delta Co')).toBeInTheDocument()
  })

  it('shows Active chip for the active company', async () => {
    renderPage()
    const activeChips = await screen.findAllByText('Active')
    expect(activeChips.length).toBeGreaterThanOrEqual(1)
  })

  it('shows Set Active and Remove for non-active companies', async () => {
    renderPage()
    const setActiveBtns = await screen.findAllByText('Set Active')
    const removeBtns = await screen.findAllByText('Remove')
    expect(setActiveBtns.length).toBeGreaterThanOrEqual(1)
    expect(removeBtns.length).toBeGreaterThanOrEqual(1)
  })

  it('opens disconnect confirmation dialog', async () => {
    renderPage()
    await screen.findByText('Gamma LLC')
    const removeBtn = screen.getAllByRole('button', { name: 'Remove' })[0]
    await userEvent.click(removeBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Confirm removal')).toBeInTheDocument()
  })

  it('shows workspace message after disconnect', async () => {
    mockDisconnectAccountant.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Gamma LLC')
    const removeBtn = screen.getAllByRole('button', { name: 'Remove' })[0]
    await userEvent.click(removeBtn)
    const dialog = screen.getByRole('dialog')
    const confirmRemove = within(dialog).getByRole('button', { name: 'Remove' })
    await userEvent.click(confirmRemove)
    expect(await screen.findByText(/was removed from your workspace/)).toBeInTheDocument()
  })

  it('sets active company when Set Active is clicked', async () => {
    renderPage()
    await screen.findByText('Delta Co')
    const setActiveBtns = screen.getAllByText('Set Active')
    await userEvent.click(setActiveBtns[0])
    expect(mockSetActiveCompanyId).toHaveBeenCalled()
  })
})
