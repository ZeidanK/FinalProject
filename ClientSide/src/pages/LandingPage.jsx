import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import LogoMark from '../components/LogoMark'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import FindInPageRoundedIcon from '@mui/icons-material/FindInPageRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import { Link as RouterLink } from 'react-router-dom'

const steps = [
  {
    title: 'Upload',
    text: 'Import invoices as PDFs or images. Our AI automatically extracts amounts, dates, vendors, and VAT details in seconds.',
    icon: <UploadFileRoundedIcon sx={{ color: 'primary.main' }} />,
  },
  {
    title: 'Match',
    text: 'Invoices are intelligently matched to bank and credit card transactions using AI-powered confidence scoring.',
    icon: <HubRoundedIcon sx={{ color: 'primary.main' }} />,
  },
  {
    title: 'Review',
    text: 'Anomalies and exceptions are flagged automatically. Review, approve, or correct matches with a single click.',
    icon: <FindInPageRoundedIcon sx={{ color: 'primary.main' }} />,
  },
  {
    title: 'Report',
    text: 'Generate VAT summaries, reconciliation reports, and compliance exports ready for filing.',
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
        <Container
          maxWidth={false}
          disableGutters
          sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%' }}
        >
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
              <LogoMark />
              <Typography variant="h6" fontWeight={700}>
                ReconFlow
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to="/login" variant="text" color="inherit">
                Log In
              </Button>
              <Button component={RouterLink} to="/register" variant="contained">
                Register
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, py: { xs: 5, md: 8 }, width: '100%' }}
      >
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
                label="Financial Reconciliation Platform"
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
                Match invoices to transactions.
                <br />
                Automatically.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  maxWidth: 620,
                  color: 'text.secondary',
                  fontSize: { xs: '1rem', md: '1.07rem' },
                }}
              >
                ReconFlow uses AI to extract invoice data, match it to your bank
                and credit card movements, detect anomalies, and generate
                tax-ready reports — so accountants and business owners can close
                the books faster with full confidence.
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
                  Start Now
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
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
                  Sign In
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
                {/* Mini dashboard illustration */}
                <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                  {/* Title bar */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AccountBalanceWalletRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                      <Typography variant="caption" sx={{ color: '#a8b7d6', fontWeight: 700, letterSpacing: 0.5 }}>
                        RECONFLOW DASHBOARD
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#37d67a' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#58a6ff' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2b3651' }} />
                    </Stack>
                  </Stack>

                  {/* KPI row */}
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {[
                      { label: 'Invoices', value: '1,248', icon: <ReceiptLongRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} /> },
                      { label: 'Matched', value: '1,134', icon: <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#37d67a' }} /> },
                      { label: 'Exceptions', value: '23', icon: <NotificationsActiveRoundedIcon sx={{ fontSize: 16, color: '#ffa857' }} /> },
                    ].map((kpi) => (
                      <Grid key={kpi.label} size={{ xs: 4 }}>
                        <Box
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'rgba(43, 54, 81, 0.7)',
                            bgcolor: 'rgba(7, 11, 20, 0.5)',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.3 }}>
                            {kpi.icon}
                            <Typography variant="caption" sx={{ color: '#a8b7d6', fontSize: 10 }}>
                              {kpi.label}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#edf4ff' }}>
                            {kpi.value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Divider sx={{ borderColor: 'rgba(43, 54, 81, 0.5)', mb: 1.5 }} />

                  {/* Recent matches table */}
                  <Typography variant="caption" sx={{ color: '#a8b7d6', fontWeight: 700, mb: 1, display: 'block', letterSpacing: 0.3 }}>
                    RECENT MATCHES
                  </Typography>
                  <Stack spacing={0.8}>
                    {[
                      { invoice: 'INV-2024-0847', vendor: 'Office Depot', amount: '₪ 3,420', confidence: 98, status: 'Matched' },
                      { invoice: 'INV-2024-0846', vendor: 'AWS Services', amount: '₪ 12,750', confidence: 95, status: 'Matched' },
                      { invoice: 'INV-2024-0845', vendor: 'Bezeq Intl.', amount: '₪ 890', confidence: 72, status: 'Review' },
                    ].map((row) => (
                      <Stack
                        key={row.invoice}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          px: 1.2,
                          py: 0.8,
                          borderRadius: 1.5,
                          bgcolor: 'rgba(14, 22, 40, 0.7)',
                          border: '1px solid',
                          borderColor: 'rgba(43, 54, 81, 0.4)',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                          <ReceiptLongRoundedIcon sx={{ fontSize: 14, color: '#58a6ff', flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" sx={{ color: '#edf4ff', fontWeight: 600, display: 'block', lineHeight: 1.3, fontSize: 11 }}>
                              {row.invoice}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6b7fa3', fontSize: 10 }}>
                              {row.vendor}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="caption" sx={{ color: '#edf4ff', fontWeight: 600, mx: 1, fontSize: 11, flexShrink: 0 }}>
                          {row.amount}
                        </Typography>
                        <Stack alignItems="flex-end" spacing={0.2} sx={{ flexShrink: 0 }}>
                          <LinearProgress
                            variant="determinate"
                            value={row.confidence}
                            sx={{
                              width: 40,
                              height: 3,
                              borderRadius: 2,
                              bgcolor: 'rgba(43, 54, 81, 0.6)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: row.confidence >= 90 ? '#37d67a' : '#ffa857',
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ fontSize: 9, color: row.status === 'Matched' ? '#37d67a' : '#ffa857', fontWeight: 700 }}>
                            {row.confidence}% · {row.status}
                          </Typography>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderTop: '1px solid',
                    borderColor: 'rgba(43, 54, 81, 0.5)',
                    bgcolor: 'rgba(7, 14, 28, 0.5)',
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
                    <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                  <Typography variant="caption" sx={{ color: '#d3e9ff', fontWeight: 700 }}>
                    All systems operational · Last sync 2 min ago
                  </Typography>
                </Stack>
              </Card>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 5, md: 7 } }}>
          <Typography variant="h4" sx={{ mb: 2.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            How it works
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
              Why finance teams choose ReconFlow
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                <Typography color="text.secondary">AI-powered invoice data extraction</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <SpeedRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                <Typography color="text.secondary">Automatic transaction matching</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShieldRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                <Typography color="text.secondary">Real-time anomaly detection</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <AssessmentRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                <Typography color="text.secondary">One-click VAT & compliance reports</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default LandingPage