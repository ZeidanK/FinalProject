import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
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
import AccountantWorkspacePage from './pages/AccountantWorkspace'
import FindAccountantPage from './pages/FindAccountant'
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

/**
 * RoleRoute component
 *
 * Restricts access to child routes based on the user's role.
 * If the current user does not have an allowed role, it redirects to the dashboard.
 *
 * @param {object} props
 * @param {Array<string>} props.allowedRoles - Roles permitted to access the route.
 * @param {React.ReactNode} props.children - The protected UI to render when allowed.
 * @returns {React.ReactNode} The children when the user role is authorized, otherwise a redirect.
 */
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

/**
 * CompanyRoute component
 *
 * Ensures the user has an active company selected before rendering child routes.
 * While company resolution is in progress, it shows a loading placeholder.
 * If no company is available, it redirects the user to the landing page.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Route content that requires an active company.
 * @returns {React.ReactNode} The children when a company exists, otherwise a redirect.
 */
function CompanyRoute({ children }) {
  const location = useLocation()
  const { activeCompanyId, loadingCompanies, hasResolvedCompanies } = useCompany()
  const { user } = useAuth()

  if (loadingCompanies || !hasResolvedCompanies) {
    return <div>Resolving company access...</div>
  }

  if (!activeCompanyId) {
    const isPureAccountant = user?.role === 'accountant'
    // If companies haven't resolved (server error), redirect to landing page
    // Otherwise, let user access profile to create company
    const destination = hasResolvedCompanies 
      ? (isPureAccountant ? '/accountant-workspace' : '/profile')
      : '/'
    return (
      <Navigate
        to={destination}
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

/**
 * Root application router.
 *
 * Configures public and protected routes for the application and applies
 * authentication, role-based, and company-based access control.
 *
 * @returns {React.ReactElement} The top-level application router.
 */
function App() {
  const Router = import.meta.env.PROD ? HashRouter : BrowserRouter

  return (
    <Router>
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
            path="/accountant-workspace"
            element={
              <RoleRoute allowedRoles={ROLE_RULES.accountantOnly}>
                <AccountantWorkspacePage />
              </RoleRoute>
            }
          />
          <Route
            path="/find-accountant"
            element={
              <CompanyRoute>
                <RoleRoute allowedRoles={ROLE_RULES.ownerOnly}>
                  <FindAccountantPage />
                </RoleRoute>
              </CompanyRoute>
            }
          />
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
    </Router>
  )
}

export default App