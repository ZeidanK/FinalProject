import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import AuthShellLayout from '../components/AuthShellLayout'
import { useAuth } from '../context/useAuth'
import { loginSchema } from '../schemas/auth'
import { useLoginWithSessionMutation } from '../hooks/queries/useAuthQueries'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

/**
 * Login page component for user authentication.
 * Renders a login form, validates inputs, and performs session-based login.
 * Displays registration success or authentication error messages.
 * @returns {JSX.Element} The rendered login page.
 */
function Login() {
  const navigate = useNavigate()
  const { login, logout } = useAuth()
  const location = useLocation()
  const successMessage = location.state?.registrationSuccess || ''
  const [errorMessage, setErrorMessage] = useState('')
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const [showPassword, setShowPassword] = useState(false)

  /**
   * Login mutation hook bound to the auth context login action.
   * @type {import('@tanstack/react-query').UseMutationResult}
   */
  const loginMutation = useLoginWithSessionMutation(login)

  /**
   * Handles the login form submission.
   * Validates the form payload with the login schema before triggering the login mutation.
   * On successful login, navigates the user to the dashboard.
   * @param {Object} formValues - The raw form values from react-hook-form.
   */
  const onSubmit = async (formValues) => {
    setErrorMessage('')

    const parsed = loginSchema.safeParse(formValues)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string') {
          setError(field, { type: 'manual', message: issue.message })
        }
      }
      return
    }

    logout()

    try {
      await loginMutation.mutateAsync({
        email: parsed.data.email,
        password: parsed.data.password,
      })

      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Login failed. Please try again.')
    }
  }

  return (
    <AuthShellLayout chipLabel="Access your account">
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
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
          error={Boolean(errors.email)}
          helperText={errors.email?.message || ' '}
          {...register('email')}
          autoComplete="email"
          fullWidth
        />

        <TextField
          required
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          error={Boolean(errors.password)}
          helperText={errors.password?.message || ' '}
          {...register('password')}
          autoComplete="current-password"
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: -1 }}>
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'text.secondary' }}
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          type="submit"
          size="large"
          variant="contained"
          disabled={isSubmitting || loginMutation.isPending}
          sx={{ boxShadow: '0 14px 36px rgba(76, 151, 255, 0.35)' }}
        >
          {isSubmitting || loginMutation.isPending ? 'Signing in...' : 'Log In'}
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