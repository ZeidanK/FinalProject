import { useState } from 'react'
import {
  Alert,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import AuthShellLayout from '../components/AuthShellLayout'
import { registerUser } from '../services/auth'

const ROLE_OPTIONS = [
  { label: 'Accountant', value: 'accountant' },
  { label: 'Business Owner', value: 'business_owner' },
  { label: 'Both', value: 'accountant_business_owner' },
]

function RegisterPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'business_owner',
  })

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleRoleChange = (_event, role) => {
    if (!role) {
      return
    }

    setFormData((previous) => ({ ...previous, role }))
  }

  const validate = () => {
    if (!formData.name.trim()) return 'Name is required.'
    if (!formData.email.trim()) return 'Email is required.'
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return 'Please enter a valid email address.'
    if (formData.password.length < 6) return 'Password must be at least 6 characters long.'
    if (formData.password !== formData.confirmPassword) return 'Password and confirmation must match.'
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
    try {
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      })

      navigate('/login', {
        replace: true,
        state: {
          registrationSuccess: 'Registration successful. You can now log in.',
        },
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShellLayout chipLabel="Create your account">
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.7rem', md: '2rem' } }}>
          Register in seconds
        </Typography>

        <Typography color="text.secondary">
          Choose your role and start your reconciliation workflow with the same
          dark workspace style.
        </Typography>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <TextField
          required
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          autoComplete="name"
          fullWidth
        />

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

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            required
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            autoComplete="new-password"
            fullWidth
          />

          <TextField
            required
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            autoComplete="new-password"
            fullWidth
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Select your role
          </Typography>

          <ToggleButtonGroup
            value={formData.role}
            exclusive
            onChange={handleRoleChange}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': {
                borderRadius: '999px !important',
                border: '1px solid rgba(129, 191, 255, 0.28) !important',
                color: '#c7dafc',
                fontWeight: 700,
                textTransform: 'none',
                px: 1.2,
                py: 0.9,
              },
              '& .Mui-selected': {
                bgcolor: 'rgba(88, 166, 255, 0.24) !important',
                color: '#ecf5ff !important',
                borderColor: 'rgba(129, 191, 255, 0.6) !important',
              },
            }}
          >
            {ROLE_OPTIONS.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Button
          type="submit"
          size="large"
          variant="contained"
          disabled={submitting}
          sx={{ boxShadow: '0 14px 36px rgba(76, 151, 255, 0.35)' }}
        >
          {submitting ? 'Creating account...' : 'Create Account'}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Already have an account?{' '}
          <Button
            component={RouterLink}
            to="/login"
            variant="text"
            color="secondary"
            sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline' }}
          >
            Log in
          </Button>
        </Typography>
      </Stack>
    </AuthShellLayout>
  )
}

export default RegisterPage