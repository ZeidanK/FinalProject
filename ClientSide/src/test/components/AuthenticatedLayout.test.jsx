import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'

const mockUser = { name: 'John Doe', email: 'john@test.com', role: 'business_owner' }

vi.mock('../../components/NotificationBell', () => ({
  default: () => <button aria-label="open notifications">Notifications</button>,
}))

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn(), token: 't1' }),
}))

vi.mock('../../context/useCompany', () => ({
  useCompany: () => ({ companies: [], activeCompanyId: null, activeCompanyName: '', setActiveCompanyId: vi.fn() }),
}))

describe('AuthenticatedLayout', () => {
  it('renders ReconFlow branding', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('ReconFlow')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('renders user info in sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@test.com')).toBeInTheDocument()
    expect(screen.getByText('Business Owner')).toBeInTheDocument()
  })

  it('renders nav items for business_owner role', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('Matches')).toBeInTheDocument()
    expect(screen.getByText('Anomalies')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Find Accountant')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('My Workspace')).not.toBeInTheDocument()
  })

  it('renders admin nav items for admin role', () => {
    mockUser.role = 'admin'
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Invoices')).not.toBeInTheDocument()
    mockUser.role = 'business_owner'
  })

  it('renders Logout button', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
})
