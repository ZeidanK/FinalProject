import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import { motion } from 'framer-motion'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '../context/AuthContext'

const sidebarWidth = 272
const ALL_ROLES = ['accountant', 'business_owner', 'accountant_business_owner']

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <DashboardRoundedIcon fontSize="small" />,
    roles: ALL_ROLES,
  },
  {
    label: 'Invoices',
    to: '/invoices',
    icon: <ReceiptLongRoundedIcon fontSize="small" />,
    roles: ALL_ROLES,
  },
  {
    label: 'Transactions',
    to: '/transactions',
    icon: <AccountBalanceRoundedIcon fontSize="small" />,
    roles: ALL_ROLES,
  },
  {
    label: 'Matches',
    to: '/matches',
    icon: <HubRoundedIcon fontSize="small" />,
    roles: ALL_ROLES,
  },
  {
    label: 'Anomalies',
    to: '/anomalies',
    icon: <ErrorOutlineRoundedIcon fontSize="small" />,
    roles: ALL_ROLES,
  },
  {
    label: 'Reports',
    to: '/reports',
    icon: <AssessmentRoundedIcon fontSize="small" />,
    roles: ALL_ROLES,
  },
  {
    label: 'Profile',
    to: '/profile',
    icon: <PersonRoundedIcon fontSize="small" />,
    roles: ALL_ROLES,
  },
]

function SidebarContent({ onNavigate, user, onLogout }) {
  const navigate = useNavigate()

  const roleLabel = useMemo(() => {
    if (!user?.role) return 'Unknown role'
    if (user.role === 'accountant_business_owner') return 'Accountant + Business Owner'
    if (user.role === 'business_owner') return 'Business Owner'
    if (user.role === 'accountant') return 'Accountant'
    return user.role
  }, [user?.role])

  const handleLogout = () => {
    onLogout()
    navigate('/login', { replace: true })
  }

  const visibleNavItems = useMemo(() => {
    if (!user?.role) {
      return navItems
    }

    return navItems.filter((item) => item.roles.includes(user.role))
  }, [user?.role])

  return (
    <Stack
      sx={{
        height: '100%',
        p: 2,
        background:
          'linear-gradient(180deg, rgba(10, 17, 33, 0.98), rgba(8, 15, 28, 0.98))',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{
          px: 1,
          py: 1.2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'rgba(14, 24, 44, 0.72)',
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: '9px',
            bgcolor: 'primary.main',
            boxShadow: '0 8px 24px rgba(88, 166, 255, 0.42)',
          }}
        />
        <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>
          ReconFlow
        </Typography>
      </Stack>

      <Stack
        spacing={1.2}
        sx={{
          mt: 2,
          p: 1.2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(13, 22, 40, 0.72)',
        }}
      >
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', color: '#041229', fontWeight: 800 }}>
            {(user?.name || 'U').slice(0, 1).toUpperCase()}
          </Avatar>
          <Stack>
            <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
              {user?.name || 'Unknown User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email || 'No email'}
            </Typography>
          </Stack>
        </Stack>

        <Chip
          label={roleLabel}
          sx={{
            alignSelf: 'flex-start',
            bgcolor: 'rgba(88, 166, 255, 0.16)',
            border: '1px solid',
            borderColor: 'rgba(129, 191, 255, 0.38)',
            color: '#cde7ff',
            fontWeight: 700,
          }}
        />
      </Stack>

      <Stack spacing={0.8} sx={{ mt: 2.2 }}>
        {visibleNavItems.map((item) => (
          <Button
            key={item.to}
            component={NavLink}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            to={item.to}
            onClick={onNavigate}
            startIcon={item.icon}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              px: 1.4,
              py: 1,
              borderRadius: 2.2,
              color: '#dbe9ff',
              border: '1px solid transparent',
              '&.active': {
                borderColor: 'rgba(125, 211, 252, 0.44)',
                bgcolor: 'rgba(88, 166, 255, 0.2)',
              },
            }}
          >
            {item.label}
          </Button>
        ))}
      </Stack>

      <Box sx={{ flexGrow: 1 }} />

      <Button
        onClick={handleLogout}
        variant="outlined"
        color="secondary"
        startIcon={<LogoutRoundedIcon fontSize="small" />}
        sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2.2 }}
      >
        Logout
      </Button>
    </Stack>
  )
}

function AuthenticatedLayout() {
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleOpen = () => setMobileOpen(true)
  const handleClose = () => setMobileOpen(false)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 0% 5%, rgba(88, 166, 255, 0.22), transparent 34%), radial-gradient(circle at 100% 0%, rgba(66, 130, 255, 0.16), transparent 28%), linear-gradient(180deg, #070b14 0%, #091021 62%, #0b1324 100%)',
      }}
    >
      {isMobile && (
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backdropFilter: 'blur(12px)',
            bgcolor: 'rgba(8, 14, 28, 0.75)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleOpen} aria-label="open menu">
              <MenuRoundedIcon />
            </IconButton>
            <Typography sx={{ ml: 1 }} fontWeight={700}>
              ReconFlow
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box sx={{ display: 'flex', minHeight: isMobile ? 'calc(100vh - 64px)' : '100vh' }}>
        {!isMobile && (
          <Box
            component={motion.aside}
            initial={{ x: -22, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            sx={{
              width: sidebarWidth,
              flexShrink: 0,
              position: 'sticky',
              top: 0,
              height: '100vh',
              borderRight: '1px solid',
              borderColor: 'divider',
              overflow: 'auto',
            }}
          >
            <SidebarContent user={user} onLogout={logout} />
          </Box>
        )}

        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'transparent',
              backgroundImage: 'none',
            },
          }}
        >
          <SidebarContent onNavigate={handleClose} user={user} onLogout={logout} />
        </Drawer>

        <Box
          component={motion.main}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: 'easeOut' }}
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3.2 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default AuthenticatedLayout
