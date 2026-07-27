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

vi.mock('../../context/ThemeModeContext', () => ({
  useThemeMode: () => ({ mode: 'dark' }),
  ThemeModeProvider: ({ children }) => <>{children}</>,
}))

describe('AuthenticatedLayout', () => {
  const renderLayout = (path = '/') =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<div />} />
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
            <Route path="/reports" element={<div>Reports Content</div>} />
            <Route path="/profile" element={<div>Profile Content</div>} />
            <Route path="/find-accountant" element={<div>Find Accountant Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

  it('renders ReconFlow branding', () => {
    renderLayout('/dashboard')
    expect(screen.getAllByText('ReconFlow').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('renders user info in sidebar', () => {
    renderLayout()
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('john@test.com').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Business Owner').length).toBeGreaterThanOrEqual(1)
  })

  it('renders nav items for business_owner role', () => {
    renderLayout()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Invoices').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Transactions').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Matches').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Anomalies').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Reports').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Find Accountant').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('My Workspace')).not.toBeInTheDocument()
  })

  it('renders admin nav items for admin role', () => {
    mockUser.role = 'admin'
    renderLayout()
    expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Invoices')).not.toBeInTheDocument()
    mockUser.role = 'business_owner'
  })

  it('renders Logout button', () => {
    renderLayout()
    expect(screen.getAllByText('Logout').length).toBeGreaterThanOrEqual(1)
  })

  it.each([
    ['/dashboard', 'Dashboard'],
    ['/reports', 'Financial Integrity Reports'],
    ['/profile', 'Profile & Settings'],
    ['/find-accountant', 'Find an Accountant'],
  ])('renders shared header title for %s', (path, title) => {
    renderLayout(path)
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  })
})
