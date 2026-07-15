import { useState, useEffect, useRef } from 'react'
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
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
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
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import GitHubIcon from '@mui/icons-material/GitHub'
import TwitterIcon from '@mui/icons-material/Twitter'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import { Link as RouterLink } from 'react-router-dom'

const steps = [
  { title: 'Upload', text: 'Import invoices as PDFs or images. Our AI automatically extracts amounts, dates, vendors, and VAT details in seconds.', icon: <UploadFileRoundedIcon /> },
  { title: 'Match', text: 'Invoices are intelligently matched to bank and credit card transactions using AI-powered confidence scoring.', icon: <HubRoundedIcon /> },
  { title: 'Review', text: 'Anomalies and exceptions are flagged automatically. Review, approve, or correct matches with a single click.', icon: <FindInPageRoundedIcon /> },
  { title: 'Report', text: 'Generate reconciliation and payables-aging reports that make unresolved financial activity easy to review.', icon: <AssessmentRoundedIcon /> },
]

const testimonials = [
  { name: 'Sarah Chen', role: 'CFO, TechStart Inc.', avatar: 'S', text: 'ReconFlow cut our monthly close from 5 days to under 2 hours. The AI matching is eerily accurate.' },
  { name: 'James Miller', role: 'Accounting Partner, Miller & Co.', avatar: 'J', text: 'We now handle 3x the clients without hiring. The automated reconciliation is a game-changer.' },
  { name: 'Elena Rodriguez', role: 'Business Owner, Casa Verde', avatar: 'E', text: 'I used to dread invoice matching. Now it just happens. I only log in to approve matches.' },
]

const pricingPlans = [
  {
    name: 'Invoice Essentials', price: '$29', period: '/month', desc: 'For small businesses digitizing invoice review',
    features: ['AI PDF invoice extraction', 'Manual field verification', 'Excel/CSV transaction import', 'Single-company workspace', 'Dashboard and basic reports'],
    cta: 'Start Free Trial', popular: false,
  },
  {
    name: 'Reconciliation Pro', price: '$79', period: '/month', desc: 'For accountants and teams handling active reconciliation',
    features: ['Advanced match suggestions', 'Installment payment matching', 'Duplicate invoice detection', 'Duplicate transaction-file alerts', 'Realtime upload job notifications', 'Aging and reconciliation reports'],
    cta: 'Start Free Trial', popular: true,
  },
  {
    name: 'Firm Operations', price: '$199', period: '/month', desc: 'For firms managing users, companies, and audit visibility',
    features: ['Multi-company accountant access', 'Admin portal and user controls', 'Activity and audit logs', 'Hybrid Gemini/local-model extraction', 'Background upload queues', 'System health and notification retention'],
    cta: 'Contact Sales', popular: false,
  },
]

function AnimatedCounter({ target, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let start = 0
    const duration = 2000
    const step = Math.max(1, Math.floor(target / 60))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(start)
    }, duration / (target / step))
    return () => clearInterval(timer)
  }, [visible, target])

  return <span ref={ref} sx={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{count.toLocaleString()}{suffix}</span>
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <IconButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200, bgcolor: 'primary.main', color: '#fff', boxShadow: '0 4px 16px rgba(88,166,255,0.35)', '&:hover': { bgcolor: 'primary.dark' } }}>
      <KeyboardArrowUpRoundedIcon />
    </IconButton>
  )
}

function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', overflowX: 'clip' }}>
      {/* Background gradient orbs */}
      <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle at 8% 12%, rgba(88,166,255,0.15), transparent 40%), radial-gradient(circle at 85% 0%, rgba(66,130,255,0.1), transparent 36%), radial-gradient(circle at 50% 80%, rgba(125,211,252,0.06), transparent 40%)',
      }} />

      {/* Navbar */}
      <AppBar position="fixed" elevation={0} sx={{
        bgcolor: scrolled ? 'rgba(7,11,20,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid' : '1px solid transparent',
        borderColor: scrolled ? 'divider' : 'transparent',
        transition: 'all 0.3s ease',
        zIndex: 1100,
      }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 56, md: 64 } }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LogoMark sx={{ width: 28, height: 28 }} />
              <Typography fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>ReconFlow</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Button component={RouterLink} to="/tech-stack" variant="text" color="inherit" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Tech</Button>
              <Button component={RouterLink} to="/login" variant="text" color="inherit">Log In</Button>
              <Button component={RouterLink} to="/register" variant="contained" size="small">Register</Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* ===== HERO ===== */}
        <Container maxWidth="xl" sx={{ pt: { xs: 12, md: 16 }, pb: { xs: 6, md: 10 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3} sx={{ animation: 'slideUp 0.7s ease-out both' }}>
                <Chip label="AI-Powered Financial Reconciliation Platform" sx={{ alignSelf: 'flex-start', fontWeight: 600, bgcolor: 'rgba(88,166,255,0.14)', border: '1px solid rgba(129,191,255,0.35)', color: '#cde7ff', backdropFilter: 'blur(4px)' }} />
                <Typography variant="h1" sx={{ fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.8rem' }, maxWidth: 780, lineHeight: 1.08 }}>
                  Match invoices to transactions. <Box component="span" sx={{ background: 'linear-gradient(135deg, #58a6ff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Automatically.</Box>
                </Typography>
                <Typography variant="body1" sx={{ maxWidth: 640, color: 'text.secondary', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7 }}>
                  ReconFlow uses AI to extract invoice data, match it to your bank and credit card movements, detect anomalies, and generate integrity-focused reports — so accountants and business owners can close the books faster with full confidence.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button component={RouterLink} to="/register" size="large" variant="contained" sx={{ boxShadow: '0 14px 36px rgba(76,151,255,0.35)', px: 4, py: 1.4, fontSize: '1rem' }}>Start Free Trial</Button>
                  <Button component={RouterLink} to="/login" size="large" variant="outlined" color="secondary" sx={{ borderWidth: 1.5, borderColor: 'rgba(125,211,252,0.5)', color: '#c8efff', px: 4, '&:hover': { borderWidth: 1.5, borderColor: 'secondary.main', bgcolor: 'rgba(125,211,252,0.08)' } }}>Sign In</Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ animation: 'slideUp 0.9s ease-out 0.15s both' }}>
                <Box sx={{ position: 'absolute', inset: -10, borderRadius: 6, background: 'linear-gradient(145deg, rgba(89,160,255,0.2), rgba(125,211,252,0.08))', filter: 'blur(18px)', opacity: 0.7, pointerEvents: 'none' }} />
                <Card elevation={0} sx={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(132,170,230,0.3)', background: 'linear-gradient(160deg, rgba(15,26,47,0.92) 0%, rgba(8,14,28,0.9) 100%)', boxShadow: '0 26px 64px rgba(0,0,0,0.45)' }}>
                  <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccountBalanceWalletRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: '#a8b7d6', fontWeight: 700, letterSpacing: 0.5 }}>RECONFLOW DASHBOARD</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#37d67a' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#58a6ff' }} />
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2b3651' }} />
                      </Stack>
                    </Stack>
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      {[{ label: 'Invoices', value: '1,248', icon: <ReceiptLongRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} /> },
                        { label: 'Matched', value: '1,134', icon: <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#37d67a' }} /> },
                        { label: 'Exceptions', value: '23', icon: <NotificationsActiveRoundedIcon sx={{ fontSize: 16, color: '#ffa857' }} /> },
                      ].map((kpi) => (
                        <Grid key={kpi.label} size={{ xs: 4 }}>
                          <Box sx={{ p: 1.2, borderRadius: 2, border: '1px solid rgba(43,54,81,0.7)', bgcolor: 'rgba(7,11,20,0.5)' }}>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.3 }}>{kpi.icon}<Typography variant="caption" sx={{ color: '#a8b7d6', fontSize: 10 }}>{kpi.label}</Typography></Stack>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#edf4ff' }}>{kpi.value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    <Divider sx={{ borderColor: 'rgba(43,54,81,0.5)', mb: 1.5 }} />
                    <Typography variant="caption" sx={{ color: '#a8b7d6', fontWeight: 700, mb: 1, display: 'block', letterSpacing: 0.3 }}>RECENT MATCHES</Typography>
                    <Stack spacing={0.8}>
                      {[{ invoice: 'INV-2024-0847', vendor: 'Office Depot', amount: '₪ 3,420', confidence: 98, status: 'Matched' },
                        { invoice: 'INV-2024-0846', vendor: 'AWS Services', amount: '₪ 12,750', confidence: 95, status: 'Matched' },
                        { invoice: 'INV-2024-0845', vendor: 'Bezeq Intl.', amount: '₪ 890', confidence: 72, status: 'Review' },
                      ].map((row) => (
                        <Stack key={row.invoice} direction="row" alignItems="center" justifyContent="space-between"
                          sx={{ px: 1.2, py: 0.8, borderRadius: 1.5, bgcolor: 'rgba(14,22,40,0.7)', border: '1px solid rgba(43,54,81,0.4)' }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                            <ReceiptLongRoundedIcon sx={{ fontSize: 14, color: '#58a6ff', flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="caption" sx={{ color: '#edf4ff', fontWeight: 600, display: 'block', lineHeight: 1.3, fontSize: 11 }}>{row.invoice}</Typography>
                              <Typography variant="caption" sx={{ color: '#6b7fa3', fontSize: 10 }}>{row.vendor}</Typography>
                            </Box>
                          </Stack>
                          <Typography variant="caption" sx={{ color: '#edf4ff', fontWeight: 600, mx: 1, fontSize: 11, flexShrink: 0 }}>{row.amount}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 1, borderTop: '1px solid rgba(43,54,81,0.5)', bgcolor: 'rgba(7,14,28,0.5)' }}>
                    <Avatar sx={{ width: 22, height: 22, bgcolor: 'success.main', fontSize: 12 }}><CheckCircleRoundedIcon sx={{ fontSize: 14 }} /></Avatar>
                    <Typography variant="caption" sx={{ color: '#d3e9ff', fontWeight: 700 }}>All systems operational · Last sync 2 min ago</Typography>
                  </Stack>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* ===== STATS COUNTER ===== */}
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'rgba(255,255,255,0.01)', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="xl">
            <Grid container spacing={3} justifyContent="center">
              {[
                { target: 50000, suffix: '+', label: 'Invoices Processed' },
                { target: 12000, suffix: '+', label: 'Successful Matches' },
                { target: 99.9, suffix: '%', label: 'AI Accuracy Rate' },
                { target: 890, suffix: '+', label: 'Active Businesses' },
              ].map((stat) => (
                <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                  <Stack spacing={0.5} alignItems="center">
                    <Typography variant="h3" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #58a6ff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontVariantNumeric: 'tabular-nums' }}>
                      <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ===== HOW IT WORKS ===== */}
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 10 } }}>
          <Stack spacing={1.5} sx={{ mb: 5, textAlign: 'center' }}>
            <Chip label="Workflow" sx={{ alignSelf: 'center', fontWeight: 600, bgcolor: 'rgba(88,166,255,0.14)', border: '1px solid rgba(129,191,255,0.35)', color: '#cde7ff' }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' } }}>How it works</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>Four simple steps to transform your reconciliation workflow from hours to minutes.</Typography>
          </Stack>
          <Grid container spacing={2.5}>
            {steps.map((step, i) => (
              <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(160deg, rgba(14,24,42,0.95), rgba(11,20,36,0.96))', transition: 'transform 0.2s ease, border-color 0.2s ease', '&:hover': { transform: 'translateY(-6px)', borderColor: 'rgba(122,188,255,0.6)' } }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(88,166,255,0.12)', color: 'primary.main' }}>{step.icon}</Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={`0${i + 1}`} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                        <Typography variant="h6" fontWeight={700}>{step.title}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{step.text}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* ===== WHY RECONFLOW ===== */}
        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'rgba(255,255,255,0.01)', borderTop: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="xl">
            <Stack spacing={1.5} sx={{ mb: 5, textAlign: 'center' }}>
              <Chip label="Why ReconFlow" sx={{ alignSelf: 'center', fontWeight: 600, bgcolor: 'rgba(88,166,255,0.14)', border: '1px solid rgba(129,191,255,0.35)', color: '#cde7ff' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' } }}>Why finance teams choose ReconFlow</Typography>
            </Stack>
            <Grid container spacing={2.5}>
              {[
                { icon: <AutoAwesomeRoundedIcon />, title: 'AI-Powered Extraction', text: 'Upload PDF invoices and our AI extracts vendor, amounts, dates, VAT, and line items with 99%+ accuracy.' },
                { icon: <SpeedRoundedIcon />, title: 'Lightning-Fast Matching', text: 'Match thousands of invoices to bank transactions in seconds using intelligent confidence scoring.' },
                { icon: <ShieldRoundedIcon />, title: 'Real-Time Anomaly Detection', text: 'Duplicates, amount mismatches, and missing links are flagged instantly for review.' },
                { icon: <HubRoundedIcon />, title: 'Multi-Currency Support', text: 'Handle invoices and transactions in any currency with automatic conversion and reporting.' },
                { icon: <AssessmentRoundedIcon />, title: 'Comprehensive Reports', text: 'Generate reconciliation and payables-aging reports with one click. Export to CSV.' },
                { icon: <CheckCircleRoundedIcon />, title: 'Audit-Ready Trail', text: 'Every match, edit, and anomaly resolution is logged for complete audit transparency.' },
              ].map((feature) => (
                <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(160deg, rgba(14,24,42,0.92), rgba(10,18,34,0.94))', transition: 'transform 0.2s ease', '&:hover': { transform: 'translateY(-3px)' } }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={1.5}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(88,166,255,0.12)', color: 'primary.main' }}>{feature.icon}</Box>
                        <Typography variant="h6" fontWeight={700}>{feature.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{feature.text}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ===== TESTIMONIALS ===== */}
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 10 } }}>
          <Stack spacing={1.5} sx={{ mb: 5, textAlign: 'center' }}>
            <Chip label="Testimonials" sx={{ alignSelf: 'center', fontWeight: 600, bgcolor: 'rgba(88,166,255,0.14)', border: '1px solid rgba(129,191,255,0.35)', color: '#cde7ff' }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' } }}>Trusted by finance professionals</Typography>
          </Stack>
          <Grid container spacing={3}>
            {testimonials.map((t) => (
              <Grid key={t.name} size={{ xs: 12, md: 4 }}>
                <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', background: 'linear-gradient(160deg, rgba(14,24,42,0.92), rgba(10,18,34,0.94))' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={0.5}>
                        {[1,2,3,4,5].map((s) => <StarRoundedIcon key={s} sx={{ color: '#f59e0b', fontSize: 18 }} />)}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.7 }}>&ldquo;{t.text}&rdquo;</Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: '#041229', fontWeight: 800, fontSize: 16 }}>{t.avatar}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{t.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* ===== PRICING ===== */}
        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'rgba(255,255,255,0.01)', borderTop: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="xl">
            <Stack spacing={1.5} sx={{ mb: 5, textAlign: 'center' }}>
              <Chip label="Pricing" sx={{ alignSelf: 'center', fontWeight: 600, bgcolor: 'rgba(88,166,255,0.14)', border: '1px solid rgba(129,191,255,0.35)', color: '#cde7ff' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' } }}>Simple, transparent pricing</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540, mx: 'auto' }}>Start free. No credit card required. Upgrade as you grow.</Typography>
            </Stack>
            <Grid container spacing={2.5} justifyContent="center">
              {pricingPlans.map((plan) => (
                <Grid key={plan.name} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card elevation={0} sx={{
                    height: '100%', borderRadius: 3, border: plan.popular ? '2px solid rgba(88,166,255,0.5)' : '1px solid', borderColor: plan.popular ? 'primary.main' : 'divider',
                    background: plan.popular ? 'linear-gradient(160deg, rgba(14,30,55,0.96), rgba(10,20,40,0.96))' : 'linear-gradient(160deg, rgba(14,24,42,0.92), rgba(10,18,34,0.94))',
                    position: 'relative',
                  }}>
                    {plan.popular && <Box sx={{ position: 'absolute', top: 12, right: 12 }}><Chip label="Popular" size="small" color="primary" sx={{ fontWeight: 700 }} /></Box>}
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Typography variant="h5" fontWeight={700}>{plan.name}</Typography>
                        <Stack direction="row" alignItems="baseline" spacing={0.5}>
                          <Typography variant="h3" fontWeight={800} sx={{ fontSize: '2.2rem' }}>{plan.price}</Typography>
                          <Typography variant="body2" color="text.secondary">{plan.period}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{plan.desc}</Typography>
                      </Stack>
                      <Stack spacing={1} sx={{ mb: 3, flex: 1 }}>
                        {plan.features.map((f) => (
                          <Stack key={f} direction="row" spacing={1} alignItems="center">
                            <CheckCircleRoundedIcon sx={{ color: '#37d67a', fontSize: 16 }}/>
                            <Typography variant="body2">{f}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <Button variant={plan.popular ? 'contained' : 'outlined'} size="large" fullWidth
                        component={RouterLink} to="/register"
                        sx={{ mt: 'auto' }}>
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ===== CTA ===== */}
        <Box sx={{ py: { xs: 8, md: 12 }, background: 'linear-gradient(135deg, rgba(88,166,255,0.08) 0%, rgba(125,211,252,0.04) 50%, transparent 100%)', borderTop: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="xl">
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Chip label="Get Started" sx={{ fontWeight: 600, bgcolor: 'rgba(88,166,255,0.14)', border: '1px solid rgba(129,191,255,0.35)', color: '#cde7ff' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, maxWidth: 700 }}>
                Ready to close the books faster?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>Join thousands of businesses using ReconFlow to automate their financial reconciliation. Start free, no credit card needed.</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button component={RouterLink} to="/register" size="large" variant="contained" sx={{ px: 5, py: 1.5, fontSize: '1.05rem', boxShadow: '0 14px 36px rgba(76,151,255,0.35)' }}>Start Free Trial</Button>
                <Button component={RouterLink} to="/tech-stack" size="large" variant="outlined" sx={{ px: 5, py: 1.5, fontSize: '1.05rem' }}>View Technology</Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* ===== FOOTER ===== */}
        <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: { xs: 4, md: 5 } }}>
          <Container maxWidth="xl">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <LogoMark sx={{ width: 24, height: 24 }} />
                  <Typography fontWeight={800}>ReconFlow</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
                  AI-powered invoice-to-transaction matching for accountants and business owners.
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.06 }}>Product</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {['Features', 'Pricing', 'Integrations', 'Changelog'].map((l) => (
                    <Typography key={l} variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main', cursor: 'pointer' } }}>{l}</Typography>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.06 }}>Company</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {['About', 'Blog', 'Careers', 'Contact'].map((l) => (
                    <Typography key={l} variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main', cursor: 'pointer' } }}>{l}</Typography>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.06 }}>Legal</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {['Privacy', 'Terms', 'Security', 'GDPR'].map((l) => (
                    <Typography key={l} variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main', cursor: 'pointer' } }}>{l}</Typography>
                  ))}
                </Stack>
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">&copy; {new Date().getFullYear()} ReconFlow. All rights reserved.</Typography>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" sx={{ color: 'text.secondary' }}><GitHubIcon fontSize="small" /></IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}><TwitterIcon fontSize="small" /></IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}><LinkedInIcon fontSize="small" /></IconButton>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>

      <ScrollToTop />
    </Box>
  )
}

export default LandingPage
