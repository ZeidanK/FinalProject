import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '../../pages/ProfilePage'

const mockUpdateUser = vi.fn()
const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

let mockUseAuth = {}

vi.mock('../../context/useAuth', () => ({
  useAuth: () => mockUseAuth,
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

let mockConfirm = vi.fn()

vi.mock('../../components/ConfirmContext', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}))

vi.mock('../../services/accountants', () => ({
  getAccountantSpecialties: vi.fn().mockResolvedValue([]),
  getAccountantReviews: vi.fn().mockResolvedValue([]),
  addAccountantSpecialty: vi.fn().mockResolvedValue({}),
  removeAccountantSpecialty: vi.fn().mockResolvedValue({}),
  getAccountantCertifications: vi.fn().mockResolvedValue([]),
  addAccountantCertification: vi.fn().mockResolvedValue({}),
  removeAccountantCertification: vi.fn().mockResolvedValue({}),
}))

let mockProfileQuery = { data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
let mockUpdateProfileMutation = { mutateAsync: vi.fn(), isPending: false }
let mockChangePasswordMutation = { mutateAsync: vi.fn(), isPending: false }
let mockUploadProfilePictureMutation = { mutateAsync: vi.fn(), isPending: false }
let mockAccountantProfileMutation = { mutateAsync: vi.fn(), isPending: false }
let mockCreateCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
let mockUpdateCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
let mockDeleteCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
let mockDeleteAccountMutation = { mutateAsync: vi.fn(), isPending: false }

vi.mock('../../hooks/queries/useProfileQueries', () => ({
  useUserProfileQuery: () => mockProfileQuery,
  useUpdateProfileMutation: () => mockUpdateProfileMutation,
  useChangePasswordMutation: () => mockChangePasswordMutation,
  useUploadProfilePictureMutation: () => mockUploadProfilePictureMutation,
  useAccountantProfileMutation: () => mockAccountantProfileMutation,
  useCreateCompanyMutation: () => mockCreateCompanyMutation,
  useUpdateCompanyMutation: () => mockUpdateCompanyMutation,
  useDeleteCompanyMutation: () => mockDeleteCompanyMutation,
  useDeleteAccountMutation: () => mockDeleteAccountMutation,
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
    mockUseAuth = {
      user: { id: 1, name: 'John Doe', email: 'john@test.com', role: 'business_owner' },
      token: 'test-token',
      updateUser: mockUpdateUser,
      logout: mockLogout,
    }
    mockCompanies = []
    mockConfirm = vi.fn()
    mockProfileQuery = { data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }
    mockUpdateProfileMutation = { mutateAsync: vi.fn(), isPending: false }
    mockChangePasswordMutation = { mutateAsync: vi.fn(), isPending: false }
    mockUploadProfilePictureMutation = { mutateAsync: vi.fn(), isPending: false }
    mockAccountantProfileMutation = { mutateAsync: vi.fn(), isPending: false }
    mockCreateCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
    mockUpdateCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
    mockDeleteCompanyMutation = { mutateAsync: vi.fn(), isPending: false }
    mockDeleteAccountMutation = { mutateAsync: vi.fn(), isPending: false }
  })

  // ── Basic rendering ──────────────────────────────────────────

  it('renders personal information section heading', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
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

  // ── Loading state ────────────────────────────────────────────

  it('shows skeleton loaders when profile is loading', () => {
    mockProfileQuery = { ...mockProfileQuery, isLoading: true, isFetching: true }
    const { container } = render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThanOrEqual(2)
  })

  // ── Empty company list ───────────────────────────────────────

  it('shows empty company state with CTA when no companies exist', () => {
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    mockCompanies = []
    renderPage()
    expect(screen.getByText(/no companies yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add your first company/i })).toBeInTheDocument()
  })

  // ── Profile edit flow ────────────────────────────────────────

  it('enters edit mode and shows name/phone fields', async () => {
    const user = userEvent.setup()
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()

    await user.click(screen.getByRole('button', { name: /edit profile/i }))

    expect(screen.getByLabelText('Full Name')).toBeVisible()
    expect(screen.getByLabelText('Phone')).toBeVisible()
    expect(screen.getByRole('button', { name: /cancel editing profile/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /save profile changes/i })).toBeVisible()
  })

  it('saves profile changes and calls mutation', async () => {
    const user = userEvent.setup()
    mockUpdateProfileMutation.mutateAsync.mockResolvedValue({})
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()

    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    const nameInput = screen.getByLabelText('Full Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Doe')
    await user.click(screen.getByRole('button', { name: /save profile changes/i }))

    await waitFor(() => {
      expect(mockUpdateProfileMutation.mutateAsync).toHaveBeenCalledWith({
        name: 'Jane Doe',
        phone: '+1-555-1234',
      })
    })
    expect(mockUpdateUser).toHaveBeenCalled()
  })

  it('cancels editing and restores original values', async () => {
    const user = userEvent.setup()
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()

    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    const nameInput = screen.getByLabelText('Full Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Changed Name')
    await user.click(screen.getByRole('button', { name: /cancel editing profile/i }))

    expect(mockUpdateProfileMutation.mutateAsync).not.toHaveBeenCalled()
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1)
  })

  // ── Password change flow ─────────────────────────────────────

  it('changes password successfully', async () => {
    const user = userEvent.setup()
    mockChangePasswordMutation.mutateAsync.mockResolvedValue({})
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()

    await user.type(screen.getByLabelText('Current Password'), 'oldPass123')
    await user.type(screen.getByLabelText('New Password'), 'newPass456')
    await user.type(screen.getByLabelText('Confirm New Password'), 'newPass456')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(mockChangePasswordMutation.mutateAsync).toHaveBeenCalledWith({
        currentPassword: 'oldPass123',
        newPassword: 'newPass456',
      })
    })
  })

  it('shows validation error when new passwords do not match', async () => {
    const user = userEvent.setup()
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()

    await user.type(screen.getByLabelText('Current Password'), 'oldPass123')
    await user.type(screen.getByLabelText('New Password'), 'newPass456')
    await user.type(screen.getByLabelText('Confirm New Password'), 'differentPass')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(screen.getByText(/new passwords do not match/i)).toBeInTheDocument()
    })
    expect(mockChangePasswordMutation.mutateAsync).not.toHaveBeenCalled()
  })

  // ── Delete account flow ──────────────────────────────────────

  it('opens delete account dialog and confirms deletion', async () => {
    const user = userEvent.setup()
    mockDeleteAccountMutation.mutateAsync.mockResolvedValue({})
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()

    await user.click(screen.getByRole('button', { name: /delete account/i }))
    expect(screen.getByText(/enter your password to confirm/i)).toBeInTheDocument()

    const passwordInput = screen.getByLabelText('Password')
    await user.type(passwordInput, 'myPassword123')
    await user.click(screen.getByRole('button', { name: /delete my account/i }))

    await waitFor(() => {
      expect(mockDeleteAccountMutation.mutateAsync).toHaveBeenCalled()
    })
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('closes delete account dialog on cancel', async () => {
    const user = userEvent.setup()
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()

    await user.click(screen.getByRole('button', { name: /delete account/i }))
    expect(screen.getByLabelText('Password')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    await waitFor(() => {
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    })
  })

  // ── Error state ──────────────────────────────────────────────

  it('shows error alert when profile save fails', async () => {
    const user = userEvent.setup()
    mockUpdateProfileMutation.mutateAsync.mockRejectedValue(new Error('Network error'))
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    renderPage()

    await user.click(screen.getByRole('button', { name: /edit profile/i }))
    await user.click(screen.getByRole('button', { name: /save profile changes/i }))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  // ── Role-based rendering ─────────────────────────────────────

  it('hides company management section for accountant role', () => {
    mockUseAuth = {
      user: { id: 2, name: 'Jane', email: 'jane@test.com', role: 'accountant' },
      token: 'test-token',
      updateUser: mockUpdateUser,
      logout: mockLogout,
    }
    mockProfileQuery = { ...mockProfileQuery, data: { id: 2, name: 'Jane', email: 'jane@test.com', phone: '' } }
    renderPage()
    expect(screen.queryByText('My Companies')).not.toBeInTheDocument()
  })

  // ── Company CRUD ─────────────────────────────────────────────

  it('deletes a company after confirmation', async () => {
    const user = userEvent.setup()
    mockConfirm = vi.fn().mockResolvedValue(true)
    mockDeleteCompanyMutation.mutateAsync.mockResolvedValue({})
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    mockCompanies = sampleCompanies
    renderPage()

    const deleteButtons = screen.getAllByRole('button', { name: /^delete (?!account)/i })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    })
    expect(mockDeleteCompanyMutation.mutateAsync).toHaveBeenCalled()
  })

  it('does not delete company when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    mockConfirm = vi.fn().mockResolvedValue(false)
    mockProfileQuery = { ...mockProfileQuery, data: sampleProfile }
    mockCompanies = sampleCompanies
    renderPage()

    const deleteButtons = screen.getAllByRole('button', { name: /^delete (?!account)/i })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
    })
    expect(mockDeleteCompanyMutation.mutateAsync).not.toHaveBeenCalled()
  })
})
