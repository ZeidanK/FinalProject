import { Alert, Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'

function LoginPage() {
  const location = useLocation()
  const successMessage = location.state?.registrationSuccess || ''

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        py: { xs: 5, md: 8 },
        background:
          'radial-gradient(circle at 8% 12%, rgba(88, 166, 255, 0.24), transparent 36%), radial-gradient(circle at 90% 0%, rgba(66, 130, 255, 0.2), transparent 30%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            background:
              'linear-gradient(150deg, rgba(14, 25, 45, 0.97), rgba(9, 17, 33, 0.97))',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack spacing={2}>
              <Typography variant="h4" sx={{ fontSize: { xs: '1.7rem', md: '2rem' } }}>
                Login
              </Typography>
              <Typography color="text.secondary">
                The full login form can be added next. This page is ready as the redirect
                target after registration.
              </Typography>

              {successMessage && <Alert severity="success">{successMessage}</Alert>}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                <Button component={RouterLink} to="/" variant="outlined" color="secondary">
                  Back to Home
                </Button>
                <Button component={RouterLink} to="/register" variant="contained">
                  Create Another Account
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default LoginPage
