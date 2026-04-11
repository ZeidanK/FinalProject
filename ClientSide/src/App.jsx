import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/Register'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import InvoicesPage from './pages/Invoices'
import MatchesPage from './pages/Matches'
import AnomaliesPage from './pages/Anomalies'
import ReportsPage from './pages/Reports'
import TransactionsPage from './pages/Transactions'
import ProfilePage from './pages/ProfilePage'
import AdminPortalPage from './pages/AdminPortal'
import TechStackPage from './pages/TechStackPage'
import AuthenticatedLayout from './components/AuthenticatedLayout'
import { useAuth } from './context/useAuth'
import { useCompany } from './context/useCompany'

const ROLE_RULES = {
  adminOnly: ['admin'],
  accountantOnly: ['accountant', 'accountant_business_owner'],
  ownerOnly: ['business_owner', 'accountant_business_owner'],
  all: ['accountant', 'business_owner', 'accountant_business_owner'],
}

/**
 * ProtectedRoute component
 *
 * Wraps children and redirects unauthenticated users to the login page.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The protected UI to render when authenticated.
 * @returns {React.ReactNode} The children when authenticated, otherwise a <Navigate> to /login.
 *
 * Notes:
 * - Uses useAuth() to determine authentication state.
 * - Uses react-router's <Navigate> with `replace` to avoid adding the login route to history.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth()

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

RoleRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
}

function CompanyRoute({ children }) {
  const location = useLocation()
  const { activeCompanyId, loadingCompanies, hasResolvedCompanies } = useCompany()

  if (loadingCompanies || !hasResolvedCompanies) {
    return <div>Resolving company access...</div>
  }

  if (!activeCompanyId) {
    return (
      <Navigate
        to="/profile"
        replace
        state={{
          noCompany: true,
          from: location.pathname,
        }}
      />
    )
  }

  return children
}

CompanyRoute.propTypes = {
  children: PropTypes.node.isRequired,
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tech-stack" element={<TechStackPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <CompanyRoute>
                <DashboardPage />
              </CompanyRoute>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={ROLE_RULES.adminOnly}>
                <AdminPortalPage />
              </RoleRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <CompanyRoute>
                <RoleRoute allowedRoles={ROLE_RULES.all}>
                  <InvoicesPage />
                </RoleRoute>
              </CompanyRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <CompanyRoute>
                <RoleRoute allowedRoles={ROLE_RULES.all}>
                  <TransactionsPage />
                </RoleRoute>
              </CompanyRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <CompanyRoute>
                <RoleRoute allowedRoles={ROLE_RULES.all}>
                  <MatchesPage />
                </RoleRoute>
              </CompanyRoute>
            }
          />
          <Route
            path="/anomalies"
            element={
              <CompanyRoute>
                <RoleRoute allowedRoles={ROLE_RULES.all}>
                  <AnomaliesPage />
                </RoleRoute>
              </CompanyRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <CompanyRoute>
                <RoleRoute allowedRoles={ROLE_RULES.all}>
                  <ReportsPage />
                </RoleRoute>
              </CompanyRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App