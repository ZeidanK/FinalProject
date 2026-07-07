import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthShellLayout from '../components/AuthShellLayout'
import { useAuth } from '../context/useAuth'
import { loginSchema } from '../schemas/auth'
import { useLoginWithSessionMutation } from '../hooks/queries/useAuthQueries'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import GoogleIcon from '@mui/icons-material/Google'
import MicrosoftIcon from '@mui/icons-material/Microsoft'

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
}

function Login() {
  const navigate = useNavigate()
  const { login, logout } = useAuth()
  const location = useLocation()
  const successMessage = location.state?.registrationSuccess || ''
  const [errorMessage, setErrorMessage] = useState('')
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: '', password: '' },
  })

  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useLoginWithSessionMutation(login)

  const onSubmit = async (formValues) => {
    setErrorMessage('')
    const parsed = loginSchema.safeParse(formValues)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string') setError(field, { type: 'manual', message: issue.message })
      }
      return
    }
    logout()
    try {
      await loginMutation.mutateAsync({ email: parsed.data.email, password: parsed.data.password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Login failed. Please try again.')
    }
  }

  const disabled = isSubmitting || loginMutation.isPending

  return (
    <AuthShellLayout chipLabel="Access your account">
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
        <motion.div custom={0} variants={itemVariants} initial="hidden" animate="visible">
          <Typography variant="h4" sx={{ fontSize: { xs: '1.7rem', md: '2rem' }, fontWeight: 700 }}>
            Welcome back
          </Typography>
        </motion.div>

        <motion.div custom={1} variants={itemVariants} initial="hidden" animate="visible">
          <Typography color="text.secondary">
            Continue your reconciliation workflow with your secure account.
          </Typography>
        </motion.div>

        {successMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Alert severity="success">{successMessage}</Alert>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Alert severity="error">{errorMessage}</Alert>
          </motion.div>
        )}

        <Stack spacing={2.5}>
          <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible">
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

          <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible">
            <TextField
              required
              label="Password"
              type={showPassword ? 'text' : 'password'}
              error={Boolean(errors.password)}
              helperText={errors.password?.message || ' '}
              {...register('password')}
              autoComplete="current-password"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end" sx={{ mr: -1 }}>
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </motion.div>

          <motion.div custom={4} variants={itemVariants} initial="hidden" animate="visible">
            <Button
              component={RouterLink}
              to="/forgot-password"
              variant="text"
              color="inherit"
              size="small"
              sx={{ alignSelf: 'flex-end', textTransform: 'none', fontWeight: 500, opacity: 0.7 }}
            >
              Forgot password?
            </Button>
          </motion.div>
        </Stack>

        <motion.div custom={5} variants={itemVariants} initial="hidden" animate="visible">
          <Button
            type="submit"
            size="large"
            variant="contained"
            fullWidth
            disabled={disabled}
            sx={{ boxShadow: '0 14px 36px rgba(76, 151, 255, 0.35)' }}
          >
            {disabled ? 'Signing in...' : 'Log In'}
          </Button>
        </motion.div>

        <motion.div custom={6} variants={itemVariants} initial="hidden" animate="visible">
          <Divider sx={{ my: 0 }}>
            <Typography variant="caption" color="text.disabled">
              or continue with
            </Typography>
          </Divider>
        </motion.div>

        <motion.div custom={7} variants={itemVariants} initial="hidden" animate="visible">
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              disabled={disabled}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Google
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<MicrosoftIcon />}
              disabled={disabled}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Microsoft
            </Button>
          </Stack>
        </motion.div>

        <motion.div custom={8} variants={itemVariants} initial="hidden" animate="visible">
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Need an account?{' '}
            <Button
              component={RouterLink}
              to="/register"
              variant="text"
              color="secondary"
              sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', fontWeight: 600 }}
            >
              Register
            </Button>
          </Typography>
        </motion.div>
      </Stack>
    </AuthShellLayout>
  )
}

export default Login
