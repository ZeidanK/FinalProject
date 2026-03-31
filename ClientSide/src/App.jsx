import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/Register'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import InvoicesPage from './pages/Invoices'
import MatchesPage from './pages/Matches'
import AnomaliesPage from './pages/Anomalies'
import ReportsPage from './pages/Reports'
import TransactionsPage from './pages/Transactions'
import AuthenticatedLayout from './components/AuthenticatedLayout'
import { useAuth } from './context/AuthContext'

const ROLE_RULES = {
  accountantOnly: ['accountant', 'accountant_business_owner'],
  ownerOnly: ['business_owner', 'accountant_business_owner'],
  all: ['accountant', 'business_owner', 'accountant_business_owner'],
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth()

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/invoices"
            element={
              <RoleRoute allowedRoles={ROLE_RULES.all}>
                <InvoicesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <RoleRoute allowedRoles={ROLE_RULES.all}>
                <TransactionsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <RoleRoute allowedRoles={ROLE_RULES.all}>
                <MatchesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/anomalies"
            element={
              <RoleRoute allowedRoles={ROLE_RULES.all}>
                <AnomaliesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleRoute allowedRoles={ROLE_RULES.all}>
                <ReportsPage />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App