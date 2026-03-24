import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import { motion } from 'framer-motion'
import { getStoredAuthSession } from '../services/auth'

const kpis = [
  {
    title: 'Open Runs',
    value: '12',
    subtitle: 'Reconciliation batches in progress',
    icon: <TimelineRoundedIcon sx={{ color: '#a9d5ff' }} />,
  },
  {
    title: 'Pending Matches',
    value: '287',
    subtitle: 'Transactions awaiting review',
    icon: <HubRoundedIcon sx={{ color: '#a9d5ff' }} />,
  },
  {
    title: 'Exceptions',
    value: '18',
    subtitle: 'Items with anomalies detected',
    icon: <ErrorOutlineRoundedIcon sx={{ color: '#ffd0aa' }} />,
  },
  {
    title: 'Last Sync',
    value: '3m ago',
    subtitle: 'Bank and invoice data refreshed',
    icon: <TaskAltRoundedIcon sx={{ color: '#b7ffd2' }} />,
  },
]

const quickActions = [
  {
    title: 'Upload Invoices',
    text: 'Import the latest invoice files from your team.',
    icon: <UploadFileRoundedIcon sx={{ color: 'primary.main' }} />,
  },
  {
    title: 'Import Bank Statement',
    text: 'Bring in statement data and map account sources.',
    icon: <AccountBalanceRoundedIcon sx={{ color: 'primary.main' }} />,
  },
  {
    title: 'Start Matching',
    text: 'Run your configured matching rules and review output.',
    icon: <HubRoundedIcon sx={{ color: 'primary.main' }} />,
  },
]

const roleLabels = {
  accountant: 'Accountant',
  business_owner: 'Business Owner',
  accountant_business_owner: 'Accountant + Business Owner',
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
  const session = getStoredAuthSession()
  const user = session?.user

  return (
    <Box
      sx={{
        minHeight: '100vh',
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
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2} component={motion.div} variants={itemVariants}>
            {kpis.map((kpi) => (
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
                      {kpi.icon}
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
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography fontWeight={700}>March Reconciliation Batch</Typography>
                            <Typography variant="body2" color="text.secondary">
                              74% complete, 18 exceptions pending approval.
                            </Typography>
                          </Box>
                          <Button variant="contained">Resume Workflow</Button>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Typography variant="h6">Recent activity</Typography>
                    <Stack spacing={1.4}>
                      <Typography variant="body2" color="text.secondary">
                        12:04 PM - Bank statement import completed for account #2483.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        11:22 AM - Matching run completed: 92% auto-match confidence.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        10:10 AM - 5 anomalies flagged for manual review.
                      </Typography>
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
                        sx={{
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: 'rgba(129, 191, 255, 0.22)',
                          background: 'rgba(10, 18, 34, 0.75)',
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
