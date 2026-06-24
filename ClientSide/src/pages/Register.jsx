import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  InputAdornment, // Added missing component
  IconButton,     // Added missing component
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
// Added missing icon imports
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'

import AuthShellLayout from '../components/AuthShellLayout'
import { registerSchema } from '../schemas/auth'
import { useRegisterMutation } from '../hooks/queries/useAuthQueries'

/**
 * Available registration role options for the onboarding form.
 *
 * @type {{label: string, value: string}[]}
 */
const ROLE_OPTIONS = [
  { label: 'Accountant', value: 'accountant' },
  { label: 'Business Owner', value: 'business_owner' },
]

/**
 * RegisterPage renders the account creation form and handles registration logic.
 *
 * @returns {JSX.Element} The registration page layout.
 */
function RegisterPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('business_owner')

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: selectedRole,
    },
  })

  const registerMutation = useRegisterMutation()

  /**
   * Update the selected role field from the toggle button group.
   *
   * @param {React.MouseEvent} _event - Toggle button click event.
   * @param {string} role - Selected role value.
   */
  const handleRoleChange = (_event, role) => {
    if (!role) {
      return
    }

    setSelectedRole(role)
    setValue('role', role, { shouldDirty: true, shouldValidate: true })
  }

  /**
   * Validate the form values and call the register mutation.
   *
   * @param {object} formValues - Values from the registration form.
   */
  const onSubmit = async (formValues) => {
    setErrorMessage('')

    const parsed = registerSchema.safeParse(formValues)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string') {
          setError(field, { type: 'manual', message: issue.message })
        }
      }
      return
    }

    try {
      await registerMutation.mutateAsync({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role,
      })

      navigate('/login', {
        replace: true,
        state: {
          registrationSuccess: 'Registration successful. You can now log in.',
        },
      })
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <AuthShellLayout chipLabel="Create your account">
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
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
          error={Boolean(errors.name)}
          helperText={errors.name?.message || ' '}
          {...register('name')}
          autoComplete="name"
          fullWidth
        />

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

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            required
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            error={Boolean(errors.password)}
            helperText={errors.password?.message || ' '}
            {...register('password')}
            autoComplete="new-password"
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            required
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message || ' '}
            {...register('confirmPassword')}
            autoComplete="new-password"
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        <Stack spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Select your role
          </Typography>

          <ToggleButtonGroup
            value={selectedRole}
            exclusive
            onChange={handleRoleChange}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              width: '100%',
              maxWidth: 560,
              justifyContent: 'center',
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': {
                borderRadius: '999px !important',
                border: '1px solid rgba(129, 191, 255, 0.28) !important',
                color: '#c7dafc',
                fontWeight: 700,
                textTransform: 'none',
                px: 1.2,
                py: 0.9,
                width: '100%',
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
          disabled={isSubmitting || registerMutation.isPending}
          sx={{ boxShadow: '0 14px 36px rgba(76, 151, 255, 0.35)' }}
        >
          {isSubmitting || registerMutation.isPending ? 'Creating account...' : 'Create Account'}
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
