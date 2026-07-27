import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FindAccountant from '../../pages/FindAccountant'
import { vi } from 'vitest'

const mockNotify = vi.fn()
const mockConfirm = vi.fn()
const mockSubscribe = vi.fn(() => vi.fn())

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ token: 'test-token' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ activeCompanyId: 1 }),
}))

vi.mock('../../context/useNotification', () => ({
  useNotification: () => ({ notify: mockNotify }),
}))

vi.mock('../../context/useRealtime', () => ({
  useRealtime: () => ({ subscribe: mockSubscribe }),
}))

vi.mock('../../components/ConfirmContext', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}))

const mockGetPaginated = vi.fn()
const mockGetReviews = vi.fn()
const mockSendRequest = vi.fn()
const mockDisconnect = vi.fn()
const mockCancelRequest = vi.fn()
const mockSubmitReview = vi.fn()

vi.mock('../../services/accountants', () => ({
  getPublicAccountantsPaginated: (...args) => mockGetPaginated(...args),
  getAccountantReviews: (...args) => mockGetReviews(...args),
  sendAccountantRequest: (...args) => mockSendRequest(...args),
  disconnectAccountant: (...args) => mockDisconnect(...args),
  cancelAccountantRequest: (...args) => mockCancelRequest(...args),
  submitAccountantReview: (...args) => mockSubmitReview(...args),
}))

const mockItems = [
  {
    id: 1,
    name: 'Bob Accountant',
    email: 'bob@example.com',
    phone: '555-0100',
    requestStatus: null,
    specialties: 'Tax Preparation, Bookkeeping',
    certifications: 'CPA',
    location: 'New York',
    yearsOfExperience: 8,
    averageRating: 4.5,
    reviewCount: 12,
    bio: 'Experienced CPA',
    hourlyRate: 150,
    profilePicture: null,
  },
  {
    id: 2,
    name: 'Carol CPA',
    email: 'carol@example.com',
    requestStatus: 'pending',
    specialties: '',
    certifications: '',
    location: null,
    yearsOfExperience: null,
    averageRating: null,
    reviewCount: 0,
    bio: null,
    hourlyRate: null,
    profilePicture: null,
  },
  {
    id: 3,
    name: 'Dave Books',
    email: 'dave@example.com',
    requestStatus: 'active',
    specialties: 'Auditing',
    certifications: 'CMA, EA',
    location: 'Chicago',
    yearsOfExperience: 12,
    averageRating: 4.8,
    reviewCount: 25,
    bio: 'Expert auditor',
    hourlyRate: 200,
    profilePicture: null,
  },
]

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FindAccountant />
      </MemoryRouter>
    </QueryClientProvider>,
  )

describe('FindAccountant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    mockConfirm.mockResolvedValue(true)
    mockGetReviews.mockResolvedValue([])
    mockCancelRequest.mockResolvedValue({})
    mockSubmitReview.mockResolvedValue({})
  })

  it('shows loading skeletons while fetching', () => {
    mockGetPaginated.mockReturnValue(new Promise(() => {}))
    renderPage()
    const skeletons = document.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('renders accountant cards when data loads', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    expect(await screen.findByText('Bob Accountant')).toBeInTheDocument()
    expect(screen.getByText('Carol CPA')).toBeInTheDocument()
    expect(screen.getByText('Dave Books')).toBeInTheDocument()
  })

  it('shows total count near filters', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    expect(await screen.findByText(/3 accountants found/)).toBeInTheDocument()
  })

  it('shows error state with retry button', async () => {
    mockGetPaginated.mockRejectedValue(new Error('Network error'))
    renderPage()
    expect(await screen.findByText('Failed to load accountants')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('shows empty state when no accountants', async () => {
    mockGetPaginated.mockResolvedValue({ items: [], totalCount: 0, page: 1, limit: 10 })
    renderPage()
    expect(await screen.findByText(/No public accountants available/)).toBeInTheDocument()
  })

  it('shows empty search result message', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    await screen.findByText('Bob Accountant')
    const searchInput = screen.getByPlaceholderText(/Search by name, email, or location/)
    await userEvent.type(searchInput, 'zzzzzz')
    await waitFor(() => {
      expect(mockGetPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'zzzzzz' }),
        expect.any(String),
      )
    })
  })

  it('renders Send Request button for accountants with no status', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    expect(await screen.findByText('Send Request')).toBeInTheDocument()
  })

  it('renders Request Sent chip for pending accountants', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    expect(await screen.findByText('Request Sent')).toBeInTheDocument()
  })

  it('renders Working Together chip for active accountants', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    const chip = await screen.findByText('Working Together')
    expect(chip).toBeInTheDocument()
  })

  it('sends request on button click', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    mockSendRequest.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Bob Accountant')
    const sendBtn = screen.getAllByText('Send Request')[0]
    await userEvent.click(sendBtn)
    expect(mockSendRequest).toHaveBeenCalledWith(1, 1, 'test-token')
  })

  it('shows success notification after sending request', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    mockSendRequest.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Bob Accountant')
    const sendBtn = screen.getAllByText('Send Request')[0]
    await userEvent.click(sendBtn)
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success' }),
      )
    })
  })

  it('shows error notification on send failure', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    mockSendRequest.mockRejectedValue(new Error('Send failed'))
    renderPage()
    await screen.findByText('Bob Accountant')
    const sendBtn = screen.getAllByText('Send Request')[0]
    await userEvent.click(sendBtn)
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' }),
      )
    })
  })

  it('opens disconnect confirmation dialog', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    await screen.findByText('Dave Books')
    const deleteIcon = document.querySelector('.MuiChip-deleteIcon')
    await userEvent.click(deleteIcon)
    expect(mockConfirm).toHaveBeenCalled()
  })

  it('disconnects accountant when confirmed', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    mockDisconnect.mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Dave Books')
    const card = screen.getByText('Dave Books').closest('.MuiCard-root')
    const deleteIcon = card.querySelector('.MuiChip-deleteIcon')
    await userEvent.click(deleteIcon)
    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalledWith(3, 1, 'test-token')
    })
  })

  it('opens detail dialog on card click', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    await screen.findByText('Bob Accountant')
    const card = screen.getByText('Bob Accountant').closest('.MuiCard-root')
    await userEvent.click(card)
    expect(await screen.findByText('Experienced CPA')).toBeInTheDocument()
  })

  it('displays specialties chips on cards', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 3, page: 1, limit: 10 })
    renderPage()
    expect(await screen.findByText('Tax Preparation')).toBeInTheDocument()
    expect(screen.getByText('Bookkeeping')).toBeInTheDocument()
  })

  it('renders pagination controls', async () => {
    mockGetPaginated.mockResolvedValue({ items: mockItems, totalCount: 50, page: 1, limit: 10 })
    renderPage()
    await screen.findByText('Bob Accountant')
    const pagination = document.querySelector('.MuiTablePagination-root')
    expect(pagination).toBeInTheDocument()
    expect(pagination.textContent).toMatch(/50/)
  })
})
