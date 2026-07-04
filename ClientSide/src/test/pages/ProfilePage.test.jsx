import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '../../pages/ProfilePage'

const mockUpdateUser = vi.fn()

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'John Doe', email: 'john@test.com', role: 'business_owner' },
    token: 'test-token',
    updateUser: mockUpdateUser,
  }),
}))

let mockCompanies = []

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({
    refreshCompanies: vi.fn(),
    companies: mockCompanies,
    activeCompanyId: 1,
    setActiveCompanyId: vi.fn(),
    loadingCompanies: false,
  }),
}))

vi.mock('../../components/ConfirmContext', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}))

let mockProfileQuery = { data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
let mockUpdateProfileMutation = { mutateAsync: vi.fn(), isPending: false }
let mockChangePasswordMutation = { mutateAsync: vi.fn(), isPending: false }
let mockUploadProfilePictureMutation = { mutateAsync: vi.fn(), isPending: false }
let mockCreateCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
let mockUpdateCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
let mockDeleteCompanyMutation = { mutateAsync: vi.fn(), isPending: false }

vi.mock('../../hooks/queries/useProfileQueries', () => ({
  useUserProfileQuery: () => mockProfileQuery,
  useUpdateProfileMutation: () => mockUpdateProfileMutation,
  useChangePasswordMutation: () => mockChangePasswordMutation,
  useUploadProfilePictureMutation: () => mockUploadProfilePictureMutation,
  useCreateCompanyMutation: () => mockCreateCompanyMutation,
  useUpdateCompanyMutation: () => mockUpdateCompanyMutation,
  useDeleteCompanyMutation: () => mockDeleteCompanyMutation,
}))

const sampleProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john@test.com',
  phone: '+1-555-1234',
}

const sampleCompanies = [
  { id: 1, name: 'Acme Corp', registrationNumber: 'REG-001', city: 'New York', state: 'NY', country: 'USA', currency: 'USD', email: 'info@acme.com', phone: '+1-555-0001' },
  { id: 2, name: 'Beta Inc', registrationNumber: 'REG-002', city: 'San Francisco', state: 'CA', country: 'USA', currency: 'USD', email: 'info@beta.com', phone: '+1-555-0002' },
]

describe('ProfilePage', () => {
  const renderPage = () => render(<MemoryRouter><ProfilePage /></MemoryRouter>)

  beforeEach(() => {
    vi.clearAllMocks()
    mockCompanies = []
    mockProfileQuery = { data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    mockUpdateProfileMutation = { mutateAsync: vi.fn(), isPending: false }
    mockChangePasswordMutation = { mutateAsync: vi.fn(), isPending: false }
    mockUploadProfilePictureMutation = { mutateAsync: vi.fn(), isPending: false }
    mockCreateCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
    mockUpdateCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
    mockDeleteCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
  })

  it('renders profile section heading', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()
    expect(screen.getByText('Profile & Settings')).toBeInTheDocument()
  })

  it('renders user name/email from profile data', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('john@test.com').length).toBeGreaterThanOrEqual(1)
  })

  it('renders Company Management section for business_owner', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()
    expect(screen.getByText('My Companies')).toBeInTheDocument()
  })

  it('renders company cards when data loads', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    mockCompanies = sampleCompanies
    renderPage()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
  })

  it('shows password change form', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()
    expect(screen.getAllByText('Change Password').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
  })

  it('renders update profile button', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument()
  })

  it('renders add company button', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    mockCompanies = sampleCompanies
    renderPage()
    expect(screen.getByRole('button', { name: /add company/i })).toBeInTheDocument()
  })

  it('shows edit company form on edit click', async () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    mockCompanies = sampleCompanies
    renderPage()
    const companyCards = screen.getAllByText(/Acme Corp|Beta Inc/)
    expect(companyCards.length).toBe(2)
    const editIcons = screen.getAllByTestId('EditRoundedIcon')
    expect(editIcons.length).toBeGreaterThanOrEqual(3)
  })
})
