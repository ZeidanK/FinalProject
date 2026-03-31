import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 5, md: 8 },
        background:
          'radial-gradient(circle at 8% 12%, rgba(88, 166, 255, 0.24), transparent 36%), radial-gradient(circle at 90% 0%, rgba(66, 130, 255, 0.2), transparent 30%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  bgcolor: 'primary.main',
                  boxShadow: '0 10px 28px rgba(88, 166, 255, 0.42)',
                }}
              />
              <Typography variant="h6" fontWeight={700}>
                ReconFlow
              </Typography>
            </Stack>

            <Button component={RouterLink} to="/" variant="text" color="inherit">
              Back to Home
            </Button>
          </Stack>

          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'linear-gradient(150deg, rgba(14, 25, 45, 0.97), rgba(9, 17, 33, 0.97))',
              boxShadow: '0 24px 54px rgba(0, 0, 0, 0.42)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
                <Chip
                  label="Access your account"
                  sx={{
                    alignSelf: 'flex-start',
                    fontWeight: 600,
                    bgcolor: 'rgba(88, 166, 255, 0.16)',
                    border: '1px solid',
                    borderColor: 'rgba(129, 191, 255, 0.38)',
                    color: '#cde7ff',
                  }}
                />

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
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}

export default Login
