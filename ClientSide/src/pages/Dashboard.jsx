import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
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

const roleLabels = {
  accountant: 'Accountant',
  business_owner: 'Business Owner',
  accountant_business_owner: 'Accountant + Business Owner',
}

const kpiIcons = {
  'Open Runs': <TimelineRoundedIcon sx={{ color: '#a9d5ff' }} />,
  'Pending Matches': <HubRoundedIcon sx={{ color: '#a9d5ff' }} />,
  Exceptions: <ErrorOutlineRoundedIcon sx={{ color: '#ffd0aa' }} />,
  'Total Matches': <TaskAltRoundedIcon sx={{ color: '#b7ffd2' }} />,
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      staggerChildren: 0.09,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
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

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const kpis = useMemo(() => mapDashboardStatsToKpis(stats), [stats])

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        background:
          'radial-gradient(circle at 0% 5%, rgba(88, 166, 255, 0.25), transparent 34%), radial-gradient(circle at 100% 0%, rgba(66, 130, 255, 0.16), transparent 28%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          spacing={3}
        >
          <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'linear-gradient(135deg, rgba(14, 25, 45, 0.98), rgba(9, 17, 33, 0.97))',
              boxShadow: '0 24px 54px rgba(0, 0, 0, 0.42)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
                spacing={2.5}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', color: '#041229', fontWeight: 800 }}>
                    {(user?.name || 'U').slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Stack spacing={0.3}>
                    <Typography variant="h5" sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' } }}>
                      Welcome back, {user?.name || 'User'}
                    </Typography>
                    <Typography color="text.secondary">
                      Role: {roleLabels[user?.role] || user?.role || 'Unknown'}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Chip
                    label="Workspace Active"
                    sx={{
                      bgcolor: 'rgba(88, 166, 255, 0.16)',
                      border: '1px solid',
                      borderColor: 'rgba(129, 191, 255, 0.38)',
                      color: '#cde7ff',
                      fontWeight: 700,
                    }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<RefreshRoundedIcon fontSize="small" />}
                    onClick={loadDashboard}
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                  >
                    {loading ? 'Refreshing...' : 'Refresh KPIs'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {errorMessage && (
            <Alert
              severity="warning"
              component={motion.div}
              variants={itemVariants}
              sx={{ borderRadius: 2.5 }}
            >
              {errorMessage} Showing fallback KPI values until data is available.
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

          <Grid container spacing={2} component={motion.div} variants={itemVariants}>
            {loading
              ? [1, 2, 3, 4].map((index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        background:
                          'linear-gradient(155deg, rgba(12, 22, 40, 0.98), rgba(8, 15, 29, 0.98))',
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1.1}>
                          <Skeleton variant="rounded" width={32} height={32} />
                          <Skeleton variant="text" width="42%" />
                          <Skeleton variant="text" width="54%" height={44} />
                          <Skeleton variant="text" width="76%" />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              : kpis.map((kpi) => (
                  <Grid key={kpi.title} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        background:
                          'linear-gradient(155deg, rgba(12, 22, 40, 0.98), rgba(8, 15, 29, 0.98))',
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1}>
                          {kpiIcons[kpi.title]}
                          <Typography variant="body2" color="text.secondary">
                            {kpi.title}
                          </Typography>
                          <Typography variant="h4">{kpi.value}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {kpi.subtitle}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }} component={motion.div} variants={itemVariants}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background:
                    'linear-gradient(155deg, rgba(13, 23, 42, 0.98), rgba(9, 16, 31, 0.98))',
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
                  <Stack spacing={2}>
                    <Typography variant="h6">Continue where you left off</Typography>
                    {stats && (stats.processingInvoices > 0 || stats.unmatchedTransactions > 0 || stats.openAnomalies > 0) ? (
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: 'rgba(125, 211, 252, 0.38)',
                          bgcolor: 'rgba(11, 20, 37, 0.7)',
                        }}
                      >
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
                      </Card>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        All caught up — no pending items right now.
                      </Typography>
                    )}

                    <Typography variant="h6">Recent activity</Typography>
                    <Stack spacing={1.4}>
                      {activity.length > 0 ? (
                        activity.map((item) => {
                          const activityKey = item.id || `${item.date || 'no-date'}-${item.text}`
                          return (
                            <Typography key={activityKey} variant="body2" color="text.secondary">
                              {item.date ? new Date(item.date).toLocaleDateString() + ' — ' : ''}
                              {item.text}
                            </Typography>
                          )
                        })
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No recent activity to display.
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }} component={motion.div} variants={itemVariants}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background:
                    'linear-gradient(155deg, rgba(13, 23, 42, 0.98), rgba(9, 16, 31, 0.98))',
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
                  <Stack spacing={1.6}>
                    <Typography variant="h6">Quick actions</Typography>
                    {quickActions.map((action) => (
                      <Card
                        key={action.title}
                        elevation={0}
                        onClick={() => navigate(action.path)}
                        sx={{
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: 'rgba(129, 191, 255, 0.22)',
                          background: 'rgba(10, 18, 34, 0.75)',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s, background 0.2s',
                          '&:hover': {
                            borderColor: 'rgba(129, 191, 255, 0.5)',
                            background: 'rgba(14, 24, 44, 0.85)',
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
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}

export default DashboardPage
