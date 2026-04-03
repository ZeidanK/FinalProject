import { useState } from 'react'
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import AuthShellLayout from '../components/AuthShellLayout'
import { useAuth } from '../context/useAuth'

function Login() {
  const navigate = useNavigate()
  const { login, logout } = useAuth()
  const location = useLocation()
  const successMessage = location.state?.registrationSuccess || ''
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const validate = () => {
    if (!formData.email.trim()) return 'Email is required.'
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return 'Please enter a valid email address.'
    if (!formData.password) return 'Password is required.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    const validationError = validate()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setSubmitting(true)
    logout()

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      })

      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShellLayout chipLabel="Access your account">
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.7rem', md: '2rem' } }}>
          Welcome back
        </Typography>

        <Typography color="text.secondary">
          Continue your reconciliation workflow with your secure account.
        </Typography>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <TextField
          required
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          autoComplete="email"
          fullWidth
        />

        <TextField
          required
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          autoComplete="current-password"
          fullWidth
        />

        <Button
          type="submit"
          size="large"
          variant="contained"
          disabled={submitting}
          sx={{ boxShadow: '0 14px 36px rgba(76, 151, 255, 0.35)' }}
        >
          {submitting ? 'Signing in...' : 'Log In'}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Need an account?{' '}
          <Button
            component={RouterLink}
            to="/register"
            variant="text"
            color="secondary"
            sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline' }}
          >
            Register
          </Button>
        </Typography>
      </Stack>
    </AuthShellLayout>
  )
}

export default Login
