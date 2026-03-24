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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/auth'

const ROLE_OPTIONS = [
  { label: 'Accountant', value: 'accountant' },
  { label: 'Business Owner', value: 'business_owner' },
  { label: 'Both', value: 'accountant_business_owner' },
]

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'business_owner',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
    if (!formData.name.trim()) {
      return 'Name is required.'
    }

    if (!formData.email.trim()) {
      return 'Email is required.'
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      return 'Please enter a valid email address.'
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long.'
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Password and confirmation must match.'
    }

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
                  label="Create your account"
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
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}

export default RegisterPage
































































































































































































































































































export default RegisterPage}  )    </Box>      </Container>        </Stack>          </Card>            </CardContent>              </Stack>                </Typography>                  </Button>                    Log in                  >                    sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline' }}                    color="secondary"                    variant="text"                    to="/login"                    component={RouterLink}                  <Button                  Already have an account?{' '}                <Typography variant="body2" color="text.secondary" textAlign="center">                </Button>                  {submitting ? 'Creating account...' : 'Create Account'}                >                  sx={{ boxShadow: '0 14px 36px rgba(76, 151, 255, 0.35)' }}                  disabled={submitting}                  variant="contained"                  size="large"                  type="submit"                <Button                </Stack>                  </ToggleButtonGroup>                    ))}                      </ToggleButton>                        {option.label}                      <ToggleButton key={option.value} value={option.value}>                    {ROLE_OPTIONS.map((option) => (                  >                    }}                      },                        borderColor: 'rgba(129, 191, 255, 0.6) !important',                        color: '#ecf5ff !important',                        bgcolor: 'rgba(88, 166, 255, 0.24) !important',                      '& .Mui-selected': {                      },                        py: 0.9,                        px: 1.2,                        textTransform: 'none',                        fontWeight: 700,                        color: '#c7dafc',                        border: '1px solid rgba(129, 191, 255, 0.28) !important',                        borderRadius: '999px !important',                      '& .MuiToggleButtonGroup-grouped': {                      gap: 1,                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },                      display: 'grid',                    sx={{                    onChange={handleRoleChange}                    exclusive                    value={formData.role}                  <ToggleButtonGroup                  </Typography>                    Select your role                  <Typography variant="body2" color="text.secondary">                <Stack spacing={1}>                </Stack>                  />                    fullWidth                    autoComplete="new-password"                    onChange={handleInputChange}                    value={formData.confirmPassword}                    type="password"                    name="confirmPassword"                    label="Confirm Password"                    required                  <TextField                  />                    fullWidth                    autoComplete="new-password"                    onChange={handleInputChange}                    value={formData.password}                    type="password"                    name="password"                    label="Password"                    required                  <TextField                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>                />                  fullWidth                  autoComplete="email"                  onChange={handleInputChange}                  value={formData.email}                  type="email"                  name="email"                  label="Email"                  required                <TextField                />                  fullWidth                  autoComplete="name"                  onChange={handleInputChange}                  value={formData.name}                  name="name"                  label="Full Name"                  required                <TextField                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}                </Typography>                  dark workspace style.                  Choose your role and start your reconciliation workflow with the same                <Typography color="text.secondary">                </Typography>                  Register in seconds                <Typography variant="h4" sx={{ fontSize: { xs: '1.7rem', md: '2rem' } }}>                />                  }}                    color: '#cde7ff',                    borderColor: 'rgba(129, 191, 255, 0.38)',                    border: '1px solid',                    bgcolor: 'rgba(88, 166, 255, 0.16)',                    fontWeight: 600,                    alignSelf: 'flex-start',                  sx={{                  label="Create your account"                <Chip              <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>          >            }}              boxShadow: '0 24px 54px rgba(0, 0, 0, 0.42)',                'linear-gradient(150deg, rgba(14, 25, 45, 0.97), rgba(9, 17, 33, 0.97))',              background:              borderColor: 'divider',              border: '1px solid',              borderRadius: 4,            sx={{            elevation={0}          <Card          </Stack>            </Button>              Back to Home            <Button component={RouterLink} to="/" variant="text" color="inherit">            </Stack>              </Typography>                ReconFlow              <Typography variant="h6" fontWeight={700}>              />                }}                  boxShadow: '0 10px 28px rgba(88, 166, 255, 0.42)',                  bgcolor: 'primary.main',                  borderRadius: '10px',                  height: 34,                  width: 34,                sx={{              <Box            <Stack direction="row" alignItems="center" spacing={1.2}>          <Stack direction="row" justifyContent="space-between" alignItems="center">        <Stack spacing={3}>      <Container maxWidth="sm">    >      }}          'radial-gradient(circle at 8% 12%, rgba(88, 166, 255, 0.24), transparent 36%), radial-gradient(circle at 90% 0%, rgba(66, 130, 255, 0.2), transparent 30%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',        background:        py: { xs: 5, md: 8 },        minHeight: '100vh',      sx={{    <Box  return (  }    }      setSubmitting(false)    } finally {      setErrorMessage(error.message)    } catch (error) {      })        },          registrationSuccess: 'Registration successful. You can now log in.',        state: {        replace: true,      navigate('/login', {      })        role: formData.role,        password: formData.password,        email: formData.email.trim(),        name: formData.name.trim(),      await registerUser({    try {    setSubmitting(true)    }      return      setErrorMessage(validationError)    if (validationError) {    const validationError = validate()    setErrorMessage('')    event.preventDefault()  const handleSubmit = async (event) => {  }    return ''    }      return 'Password and confirmation must match.'    if (formData.password !== formData.confirmPassword) {    }      return 'Password must be at least 6 characters long.'    if (formData.password.length < 6) {    }      return 'Please enter a valid email address.'    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {    }      return 'Email is required.'    if (!formData.email.trim()) {    }      return 'Name is required.'    if (!formData.name.trim()) {  const validate = () => {  }    setFormData((previous) => ({ ...previous, role }))    }      return    if (!role) {  const handleRoleChange = (event, role) => {  }    setFormData((previous) => ({ ...previous, [name]: value }))    const { name, value } = event.target  const handleInputChange = (event) => {  const [errorMessage, setErrorMessage] = useState('')  const [submitting, setSubmitting] = useState(false)  })    role: 'business_owner',    confirmPassword: '',    password: '',    email: '',    name: '',  const [formData, setFormData] = useState({  const navigate = useNavigate()function RegisterPage() {]  { label: 'Both', value: 'accountant_business_owner' },  { label: 'Business Owner', value: 'business_owner' },  { label: 'Accountant', value: 'accountant' },const ROLE_OPTIONS = [import { registerUser } from '../services/auth'import { Link as RouterLink, useNavigate } from 'react-router-dom'} from '@mui/material'  Typography,  ToggleButtonGroup,  ToggleButton,  TextField,  Stack,  Container,  Chip,  CardContent,  Card,  Button,  Box,  Alert,import {import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/auth'

const ROLE_OPTIONS = [
  { label: 'Accountant', value: 'accountant' },
  { label: 'Business Owner', value: 'business_owner' },
  { label: 'Both', value: 'accountant_business_owner' },
]

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'business_owner',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleRoleChange = (_, role) => {
    if (!role) {
      return
    }

    setFormData((previous) => ({ ...previous, role }))
  }

  const validate = () => {
    if (!formData.name.trim()) {
      return 'Name is required.'
    }

    if (!formData.email.trim()) {
      return 'Email is required.'
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      return 'Please enter a valid email address.'
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long.'
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Password and confirmation must match.'
    }

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
                  label="Create your account"
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
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}

export default RegisterPage
