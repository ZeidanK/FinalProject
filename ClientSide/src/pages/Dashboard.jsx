import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import RecentActivityTimeline from '../components/RecentActivityTimeline'
import MetricCard from '../components/MetricCard'
import DashboardChart from '../components/DashboardChart'
import GlassCard from '../components/GlassCard'
import RevealOnScroll from '../components/RevealOnScroll'
import AnimatedBackground from '../components/AnimatedBackground'
import useAnimatedCounter from '../hooks/useAnimatedCounter'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { getDashboardStats, getRecentActivity, mapDashboardStatsToKpis } from '../services/dashboard'

const quickActions = [
  {
    title: 'Upload Invoices',
    text: 'Import the latest invoice files from your team.',
    icon: <UploadFileRoundedIcon sx={{ color: 'primary.main' }} />,
    path: '/invoices',
  },
  {
    title: 'Import Bank Statement',
    text: 'Bring in statement data and map account sources.',
    icon: <AccountBalanceRoundedIcon sx={{ color: 'primary.main' }} />,
    path: '/transactions',
  },
  {
    title: 'Start Matching',
    text: 'Run your configured matching rules and review output.',
    icon: <HubRoundedIcon sx={{ color: 'primary.main' }} />,
    path: '/matches',
  },
]

const kpiIcons = {
  'Pending Matches': <HubRoundedIcon sx={{ color: '#a9d5ff' }} />,
  'Pending Invoice Matches': <UploadFileRoundedIcon sx={{ color: '#a9d5ff' }} />,
  Exceptions: <ErrorOutlineRoundedIcon sx={{ color: '#ffd0aa' }} />,
  'Total Matches': <TaskAltRoundedIcon sx={{ color: '#b7ffd2' }} />,
}

const kpiColors = {
  'Pending Matches': '#a9d5ff',
  'Pending Invoice Matches': '#a9d5ff',
  Exceptions: '#ffd0aa',
  'Total Matches': '#b7ffd2',
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.09 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

function AnimatedKPIValue({ value, color }) {
  const animated = useAnimatedCounter({ end: Number(value) || 0, duration: 800, enabled: true })
  return <Typography variant="h4" sx={{ color: color || 'text.primary', fontWeight: 700 }}>{animated}</Typography>
}

function DashboardPage() {
  const { user, token } = useAuth()
  const { activeCompanyId } = useCompany()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const [data, activityItems] = await Promise.all([
        getDashboardStats({ companyId: activeCompanyId, token }),
        getRecentActivity({ companyId: activeCompanyId, token }).catch(() => []),
      ])
      setStats(data || null)
      setActivity(activityItems)
    } catch (error) {
      setStats(null)
      setActivity([])
      setErrorMessage(error.message || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [activeCompanyId, token])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const kpis = useMemo(() => mapDashboardStatsToKpis(stats), [stats])

  return (
    <Box
      sx={{
        py: { xs: 2, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100%',
      }}
    >
      <AnimatedBackground density="medium" />
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, width: '100%', position: 'relative', zIndex: 1 }}
      >
        <Stack component={motion.div} variants={containerVariants} initial="hidden" animate="show" spacing={3}>
          <GlassCard variant="elevated" motionProps={{ variants: itemVariants }}>
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', color: '#041229', fontWeight: 800 }}>
                    {(user?.name || 'U').slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Stack spacing={0.3}>
                    <Typography variant="h5" sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' } }}>
                      Welcome back, {user?.name || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Here's your reconciliation overview.
                    </Typography>
                  </Stack>
                </Stack>
                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon fontSize="small" />}
                  onClick={loadDashboard}
                  disabled={loading}
                  sx={{ textTransform: 'none', borderColor: 'rgba(129,191,255,0.25)', '&:hover': { borderColor: 'rgba(129,191,255,0.5)' } }}
                >
                  {loading ? 'Refreshing...' : 'Refresh KPIs'}
                </Button>
              </Stack>
            </CardContent>
          </GlassCard>

          {errorMessage && (
            <Alert severity="warning" component={motion.div} variants={itemVariants} sx={{ borderRadius: 2.5 }}>
              {errorMessage}
            </Alert>
          )}

          {!loading && !stats && !errorMessage && (
            <EmptyState
              title="Dashboard data is not ready"
              description="Ensure the server is running and the report endpoint is available."
              actionLabel="Retry"
              onAction={loadDashboard}
            />
          )}

          <RevealOnScroll>
            <Grid container spacing={2} component={motion.div} variants={itemVariants}>
              {loading
                ? [1, 2, 3, 4].map((i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                      <MetricCard
                        icon={<Skeleton variant="rounded" width={32} height={32} />}
                        value={<Skeleton variant="text" width="54%" height={44} />}
                      />
                    </Grid>
                  ))
                : kpis.filter((kpi) => kpi.title !== 'Open Runs').map((kpi) => (
                    <Grid key={kpi.title} size={{ xs: 12, sm: 6, md: 3 }}>
                      <MetricCard
                        icon={kpiIcons[kpi.title]}
                        title={kpi.title}
                        value={<AnimatedKPIValue value={kpi.value} color={kpiColors[kpi.title]} />}
                        subtitle={kpi.subtitle}
                        color={kpiColors[kpi.title]}
                      />
                    </Grid>
                  ))}
            </Grid>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }} component={motion.div} variants={itemVariants}>
                <DashboardChart />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} component={motion.div} variants={itemVariants}>
              <GlassCard variant="elevated" sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
                  <Stack spacing={1.6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TrendingUpRoundedIcon color="primary" fontSize="small" />
                      <Typography variant="h6">Quick actions</Typography>
                    </Stack>
                    {quickActions.map((action) => (
                      <Card
                        key={action.title}
                        elevation={0}
                        onClick={() => navigate(action.path)}
                        sx={{
                          borderRadius: 2.5,
                          border: '1px solid rgba(129, 191, 255, 0.15)',
                          background: 'rgba(10, 18, 34, 0.5)',
                          backdropFilter: 'blur(8px)',
                          cursor: 'pointer',
                          transition: 'all 0.25s',
                          '&:hover': {
                            borderColor: 'rgba(129, 191, 255, 0.4)',
                            background: 'rgba(14, 24, 44, 0.7)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={0.8}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {action.icon}
                              <Typography fontWeight={700}>{action.title}</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {action.text}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
          </RevealOnScroll>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }} component={motion.div} variants={itemVariants}>
              <GlassCard variant="elevated" sx={{ height: '100%' }}>
                <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Continue where you left off</Typography>
                    {stats && (stats.processingInvoices > 0 || stats.unmatchedTransactions > 0 || stats.openAnomalies > 0) ? (
                      <GlassCard variant="default" sx={{ borderRadius: 2.5, border: '1px solid rgba(125, 211, 252, 0.25)' }}>
                        <CardContent>
                          <Stack spacing={1}>
                            {stats.processingInvoices > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {stats.processingInvoices} invoice{stats.processingInvoices === 1 ? '' : 's'} currently processing
                              </Typography>
                            )}
                            {stats.unmatchedTransactions > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {stats.unmatchedTransactions} transaction{stats.unmatchedTransactions === 1 ? '' : 's'} awaiting match review
                              </Typography>
                            )}
                            {stats.openAnomalies > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {stats.openAnomalies} open anomal{stats.openAnomalies === 1 ? 'y' : 'ies'} to resolve
                                {stats.criticalAnomalies > 0 && ` (${stats.criticalAnomalies} critical)`}
                              </Typography>
                            )}
                          </Stack>
                        </CardContent>
                      </GlassCard>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        All caught up — no pending items right now.
                      </Typography>
                    )}

                    <Typography variant="h6">Recent activity</Typography>
                    <RecentActivityTimeline items={activity} loading={loading} />
                  </Stack>
                </CardContent>
              </GlassCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} component={motion.div} variants={itemVariants}>
              <GlassCard variant="glow" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <CardContent>
                  <Stack spacing={1} alignItems="center" textAlign="center">
                    <TaskAltRoundedIcon sx={{ color: '#b7ffd2', fontSize: 48 }} />
                    <Typography variant="h6">Match Rate</Typography>
                    <Typography variant="h3" color="primary.main" fontWeight={700}>
                      {stats ? `${Math.round(((stats.totalMatches || 0) / ((stats.totalMatches || 0) + (stats.unmatchedTransactions || 0) + (stats.unmatchedInvoices || 0) || 1)) * 100)}%` : '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall reconciliation match rate
                    </Typography>
                  </Stack>
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}

export default DashboardPage
