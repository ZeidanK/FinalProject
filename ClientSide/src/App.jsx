import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/Register'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import { getStoredAuthSession } from './services/auth'
import AuthenticatedLayout from './components/AuthenticatedLayout'

function ProtectedRoute({ children }) {
  const session = getStoredAuthSession()

  if (!session) {
    return <Navigate to="/login" replace />
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App