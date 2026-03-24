import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import { Link as RouterLink } from 'react-router-dom'
import heroImage from '../assets/hero.png'

const steps = [
  {
    title: 'Upload',
    text: 'Bring in invoice and statement files quickly from your finance team.',
    icon: <UploadFileRoundedIcon sx={{ color: 'primary.main' }} />,
  },
  {
    title: 'Send',
    text: 'Share requests and supporting data with stakeholders in one flow.',
    icon: <SendRoundedIcon sx={{ color: 'primary.main' }} />,
  },
  {
    title: 'Compare',
    text: 'Review differences and align records before reconciliation closes.',
    icon: <CompareArrowsRoundedIcon sx={{ color: 'primary.main' }} />,
  },
  {
    title: 'Report',
    text: 'Track status and progress through clear reconciliation dashboards.',
    icon: <AssessmentRoundedIcon sx={{ color: 'primary.main' }} />,
  },
]

function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        background:
          'radial-gradient(circle at 8% 12%, rgba(88, 166, 255, 0.28), transparent 40%), radial-gradient(circle at 85% 0%, rgba(66, 130, 255, 0.18), transparent 36%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
        color: 'text.primary',
        overflowX: 'clip',
        '@media (prefers-reduced-motion: no-preference)': {
          '@keyframes drift': {
            '0%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-7px)' },
            '100%': { transform: 'translateY(0px)' },
          },
          '@keyframes revealUp': {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(120deg, rgba(88, 166, 255, 0.12), transparent 35%, rgba(48, 70, 140, 0.1) 80%)',
          maskImage: 'radial-gradient(circle at 20% 20%, black, transparent 65%)',
        }}
      />

      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'transparent',
          color: 'text.primary',
          py: 1,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              justifyContent: 'space-between',
              px: { xs: 1.5, sm: 2 },
              py: 1,
              mt: 1,
              borderRadius: 999,
              border: '1px solid',
              borderColor: 'divider',
              backdropFilter: 'blur(12px)',
              bgcolor: 'rgba(10, 16, 32, 0.65)',
            }}
          >
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

            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to="/login" variant="text" color="inherit">
                Log In
              </Button>
              <Button component={RouterLink} to="/register" variant="contained">
                Try for Free
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack
              spacing={2.5}
              sx={{
                '@media (prefers-reduced-motion: no-preference)': {
                  animation: 'revealUp 700ms ease-out both',
                },
              }}
            >
              <Chip
                label="Reconciliation Management"
                sx={{
                  alignSelf: 'flex-start',
                  fontWeight: 600,
                  bgcolor: 'rgba(88, 166, 255, 0.16)',
                  border: '1px solid',
                  borderColor: 'rgba(129, 191, 255, 0.38)',
                  color: '#cde7ff',
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.1rem', sm: '2.8rem', md: '3.5rem' },
                  maxWidth: 760,
                }}
              >
                It is not rocket science.
                <br />
                Not with us anyway.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  maxWidth: 620,
                  color: 'text.secondary',
                  fontSize: { xs: '1rem', md: '1.07rem' },
                }}
              >
                Create a clean pre-login experience for accountants and business teams.
                Start with a clear value proposition, show your workflow in simple steps,
                and guide visitors into authentication when they are ready.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  component={RouterLink}
                  to="/register"
                  size="large"
                  variant="contained"
                  sx={{
                    boxShadow: '0 14px 36px rgba(76, 151, 255, 0.35)',
                  }}
                >
                  Start Free Trial
                </Button>
                <Button
                  size="large"
                  variant="outlined"
                  color="secondary"
                  sx={{
                    borderWidth: 1.5,
                    borderColor: 'rgba(125, 211, 252, 0.55)',
                    color: '#c8efff',
                    '&:hover': {
                      borderWidth: 1.5,
                      borderColor: 'secondary.main',
                      bgcolor: 'rgba(125, 211, 252, 0.08)',
                    },
                  }}
                >
                  Talk to Sales
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                position: 'relative',
                '@media (prefers-reduced-motion: no-preference)': {
                  animation: 'revealUp 860ms ease-out 120ms both',
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: -10,
                  borderRadius: 6,
                  background:
                    'linear-gradient(145deg, rgba(89, 160, 255, 0.25), rgba(125, 211, 252, 0.12))',
                  filter: 'blur(18px)',
                  opacity: 0.75,
                  pointerEvents: 'none',
                }}
              />

              <Card
                elevation={0}
                sx={{
                  position: 'relative',
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'rgba(132, 170, 230, 0.34)',
                  background:
                    'linear-gradient(160deg, rgba(15, 26, 47, 0.9) 0%, rgba(8, 14, 28, 0.88) 100%)',
                  boxShadow: '0 26px 64px rgba(0, 0, 0, 0.45)',
                  '@media (prefers-reduced-motion: no-preference)': {
                    animation: 'drift 6s ease-in-out infinite',
                  },
                }}
              >
                <Box
                  component="img"
                  src={heroImage}
                  alt="ReconFlow dashboard preview"
                  sx={{
                    width: '100%',
                    height: { xs: 280, sm: 360, md: 420 },
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                    filter: 'saturate(1.08) contrast(1.03)',
                  }}
                />

                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(5, 10, 19, 0.08) 30%, rgba(5, 10, 19, 0.78) 100%)',
                  }}
                />

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    px: 1.2,
                    py: 0.8,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: 'rgba(145, 183, 244, 0.34)',
                    bgcolor: 'rgba(7, 14, 28, 0.72)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      bgcolor: 'success.main',
                      fontSize: 12,
                    }}
                  >
                    OK
                  </Avatar>
                  <Typography variant="caption" sx={{ color: '#d3e9ff', fontWeight: 700 }}>
                    Reconciliation runs updated in real-time
                  </Typography>
                </Stack>
              </Card>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 5, md: 7 } }}>
          <Typography variant="h4" sx={{ mb: 2.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Reconciliation in four clear steps
          </Typography>
          <Grid container spacing={2}>
            {steps.map((step) => (
              <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    background:
                      'linear-gradient(160deg, rgba(14, 24, 42, 0.95), rgba(11, 20, 36, 0.96))',
                    transition: 'transform 180ms ease, border-color 180ms ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'rgba(122, 188, 255, 0.65)',
                    },
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.2}>
                      <Box sx={{ opacity: 0.95 }}>{step.icon}</Box>
                      <Typography variant="h6" fontWeight={700}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.text}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Card
          elevation={0}
          sx={{
            mt: { xs: 4, md: 6 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            background:
              'linear-gradient(140deg, rgba(13, 23, 42, 0.96), rgba(10, 18, 33, 0.96))',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Why teams choose this approach
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
            >
              <Typography color="text.secondary">Fast onboarding for finance users</Typography>
              <Typography color="text.secondary">Simple workflow communication</Typography>
              <Typography color="text.secondary">Clear progress visibility</Typography>
              <Typography color="text.secondary">Built for gradual rollout</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default LandingPage