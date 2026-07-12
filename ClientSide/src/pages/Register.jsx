import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'

import AuthShellLayout from '../components/AuthShellLayout'
import { registerSchema } from '../schemas/auth'
import { useRegisterMutation } from '../hooks/queries/useAuthQueries'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'

const ROLE_OPTIONS = [
  { label: 'Accountant', value: 'accountant', icon: <AccountBalanceRoundedIcon /> },
  { label: 'Business Owner', value: 'business_owner', icon: <BusinessCenterRoundedIcon /> },
]

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
}

function RegisterPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('business_owner')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: selectedRole,
    },
  })

  const passwordValue = watch('password')
  const confirmPasswordValue = watch('confirmPassword')
  const passwordsMatch = passwordValue && confirmPasswordValue && passwordValue === confirmPasswordValue
  const passwordsMismatch = confirmPasswordValue && !passwordsMatch

  const registerMutation = useRegisterMutation()

  const handleRoleChange = (_event, role) => {
    if (!role) return
    setSelectedRole(role)
    setValue('role', role, { shouldDirty: true, shouldValidate: true })
  }

  const onSubmit = async (formValues) => {
    setErrorMessage('')
    if (!acceptedTerms) {
      setErrorMessage('You must accept the terms and conditions to register.')
      return
    }
    try {
      await registerMutation.mutateAsync({
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
        role: formValues.role,
      })
      navigate('/login', {
        replace: true,
        state: { registrationSuccess: 'Registration successful. You can now log in.' },
      })
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const disabled = isSubmitting || registerMutation.isPending

  return (
    <AuthShellLayout chipLabel="Create your account">
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
        <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible">
          <Typography variant="h4" sx={{ fontSize: { xs: '1.7rem', md: '2rem' }, fontWeight: 700 }}>
            Get started free
          </Typography>
        </motion.div>

        <motion.div custom={1} variants={itemVariants} initial="hidden" animate="visible">
          <Typography color="text.secondary">
            Choose your role and start reconciling in minutes.
          </Typography>
        </motion.div>

        {errorMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Alert severity="error">{errorMessage}</Alert>
          </motion.div>
        )}

        <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible">
          <TextField
            required
            label="Full Name"
            error={Boolean(errors.name)}
            helperText={errors.name?.message || ' '}
            {...register('name')}
            autoComplete="name"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </motion.div>

        <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible">
          <TextField
            required
            label="Email"
            type="email"
            error={Boolean(errors.email)}
            helperText={errors.email?.message || ' '}
            {...register('email')}
            autoComplete="email"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </motion.div>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <motion.div custom={4} variants={itemVariants} initial="hidden" animate="visible" style={{ flex: 1 }}>
            <TextField
              required
              label="Password"
              type={showPassword ? 'text' : 'password'}
              error={Boolean(errors.password)}
              helperText={errors.password?.message || ' '}
              {...register('password')}
              autoComplete="new-password"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <PasswordStrengthMeter password={passwordValue || ''} />
          </motion.div>

          <motion.div custom={5} variants={itemVariants} initial="hidden" animate="visible" style={{ flex: 1 }}>
            <TextField
              required
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              error={passwordsMismatch || Boolean(errors.confirmPassword)}
              helperText={
                passwordsMismatch
                  ? 'Passwords do not match'
                  : errors.confirmPassword?.message || ' '
              }
              {...register('confirmPassword')}
              autoComplete="new-password"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </motion.div>
        </Stack>

        <motion.div custom={6} variants={itemVariants} initial="hidden" animate="visible">
          <Stack spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" textAlign="center">
              I am a...
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
                gap: 1,
                '& .MuiToggleButtonGroup-grouped': {
                  borderRadius: '12px !important',
                  border: '1px solid',
                  borderColor: 'divider',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 1.5,
                  py: 1.2,
                  width: '100%',
                  gap: 0.8,
                  transition: 'all 0.2s ease',
                },
                '& .Mui-selected': {
                  bgcolor: 'rgba(88, 166, 255, 0.16) !important',
                  color: 'primary.light',
                  borderColor: 'primary.main',
                },
              }}
            >
              {ROLE_OPTIONS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
                  {option.icon}
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </motion.div>

        <motion.div custom={7} variants={itemVariants} initial="hidden" animate="visible">
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                I agree to the{' '}
                <Button
                  component={RouterLink}
                  to="/terms"
                  variant="text"
                  size="small"
                  sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', fontSize: 'inherit', textTransform: 'none' }}
                >
                  Terms of Service
                </Button>{' '}
                and{' '}
                <Button
                  component={RouterLink}
                  to="/privacy"
                  variant="text"
                  size="small"
                  sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', fontSize: 'inherit', textTransform: 'none' }}
                >
                  Privacy Policy
                </Button>
              </Typography>
            }
          />
        </motion.div>

        <motion.div custom={8} variants={itemVariants} initial="hidden" animate="visible">
          <Button
            type="submit"
            size="large"
            variant="contained"
            fullWidth
            disabled={disabled}
            sx={{ boxShadow: '0 14px 36px rgba(76, 151, 255, 0.35)' }}
          >
            {disabled ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} color="inherit" />
                <span>Creating account...</span>
              </Stack>
            ) : (
              'Create Account'
            )}
          </Button>
        </motion.div>

        <motion.div custom={9} variants={itemVariants} initial="hidden" animate="visible">
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Already have an account?{' '}
            <Button
              component={RouterLink}
              to="/login"
              variant="text"
              color="secondary"
              sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', fontWeight: 600 }}
            >
              Log in
            </Button>
          </Typography>
        </motion.div>
      </Stack>
    </AuthShellLayout>
  )
}

export default RegisterPage
