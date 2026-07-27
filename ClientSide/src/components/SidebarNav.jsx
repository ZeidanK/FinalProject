import { useCallback, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import HubRoundedIcon from '@mui/icons-material/HubRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded'
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded'
import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import LogoMark from './LogoMark'
import { NavLink, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

const sidebarWidth = 264
const sidebarCollapsedWidth = 72

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: <DashboardRoundedIcon />, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { label: 'Invoices', to: '/invoices', icon: <ReceiptLongRoundedIcon />, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { label: 'Transactions', to: '/transactions', icon: <AccountBalanceRoundedIcon />, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { label: 'Matches', to: '/matches', icon: <HubRoundedIcon />, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { label: 'Anomalies', to: '/anomalies', icon: <ErrorOutlineRoundedIcon />, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { label: 'Reports', to: '/reports', icon: <AssessmentRoundedIcon />, roles: ['accountant', 'business_owner', 'accountant_business_owner'] },
  { label: 'My Workspace', to: '/accountant-workspace', icon: <WorkspacesRoundedIcon />, roles: ['accountant', 'accountant_business_owner'] },
  { label: 'Find Accountant', to: '/find-accountant', icon: <PersonSearchRoundedIcon />, roles: ['business_owner', 'accountant_business_owner'] },
  { label: 'Admin', to: '/admin', icon: <AdminPanelSettingsRoundedIcon />, roles: ['admin'] },
  { label: 'Profile', to: '/profile', icon: <PersonRoundedIcon />, roles: ['accountant', 'business_owner', 'accountant_business_owner', 'admin'] },
]

export { sidebarWidth, sidebarCollapsedWidth }

function NavItem({ item, collapsed, onNavigate }) {
  const theme = useTheme()
  return (
    <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
      <Button
        component={NavLink}
        to={item.to}
        onClick={onNavigate}
        sx={{
          justifyContent: collapsed ? 'center' : 'flex-start',
          minWidth: collapsed ? 44 : '100%',
          width: collapsed ? 44 : '100%',
          height: collapsed ? 44 : 40,
          px: collapsed ? 0 : 1.5,
          py: 0.8,
          borderRadius: 2,
          color: theme.palette.text.secondary,
          backgroundColor: 'transparent',
          transition: 'all 0.2s ease',
          '&.active': {
            color: '#fff',
            background: 'rgba(129, 191, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(129, 191, 255, 0.15)',
            '& .MuiButton-startIcon': { color: theme.palette.primary.light },
          },
          '&:hover:not(.active)': {
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#fff',
          },
          ...(collapsed ? { '& .MuiButton-startIcon': { marginLeft: 0, marginRight: 0 } } : {}),
        }}
        startIcon={
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: collapsed ? 0 : 22,
            mr: collapsed ? 0 : 1,
          }}>
            {item.icon}
          </Box>
        }
      >
        {!collapsed && (
          <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
            {item.label}
          </Typography>
        )}
      </Button>
    </Tooltip>
  )
}

NavItem.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  collapsed: PropTypes.bool,
  onNavigate: PropTypes.func,
}

export default function SidebarNav({ user, onLogout, onNavigate, onCloseMobile }) {
  const theme = useTheme()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = useCallback(() => {
    onLogout()
    navigate('/login', { replace: true })
  }, [onLogout, navigate])

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!user?.role) return true
    return item.roles.includes(user.role)
  })

  const getRoleLabel = () => {
    if (!user?.role) return 'Unknown'
    if (user.role === 'admin') return 'Administrator'
    if (user.role === 'business_owner') return 'Business Owner'
    if (user.role === 'accountant_business_owner') return 'Owner + Accountant'
    if (user.role === 'accountant') return 'Accountant'
    return user.role
  }

  const w = collapsed ? sidebarCollapsedWidth : sidebarWidth

  return (
    <Box
      sx={{
        width: w,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10, 17, 33, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(129, 191, 255, 0.08)',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo area */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'space-between'}
        sx={{ px: collapsed ? 1 : 2, py: 1.5, minHeight: 64 }}
      >
        {!collapsed && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <LogoMark sx={{ width: 28, height: 28 }} />
            <Typography fontWeight={800} fontSize="1.05rem" sx={{ letterSpacing: '-0.02em' }}>
              ReconFlow
            </Typography>
          </Stack>
        )}
        <IconButton size="small" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => { if (onCloseMobile) onCloseMobile(); else setCollapsed(!collapsed) }} sx={{ color: theme.palette.text.secondary }}>
          {collapsed ? <KeyboardDoubleArrowRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
        </IconButton>
      </Stack>

      {/* User card */}
      {!collapsed && (
          <Stack
            spacing={1}
            sx={{
              mx: 1.5,
              mb: 1,
              p: 1.2,
              borderRadius: 2.5,
              border: '1px solid rgba(129, 191, 255, 0.1)',
              background: 'rgba(129, 191, 255, 0.04)',
            }}
          >
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, color: '#041229', fontSize: 14, fontWeight: 800 }}>
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email || ''}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={getRoleLabel()}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              fontWeight: 600,
              bgcolor: 'rgba(88,166,255,0.12)',
              border: '1px solid rgba(88,166,255,0.3)',
              color: '#cde7ff',
              fontSize: '0.65rem',
            }}
          />
        </Stack>
      )}

      {/* Nav items */}
      <Stack spacing={0.3} sx={{ px: collapsed ? 1 : 1.5, alignItems: collapsed ? 'center' : 'stretch', flex: 1, overflow: 'auto', py: 0.5 }}>
        {visibleItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </Stack>

      {/* Bottom actions */}
      <Stack spacing={0.5} sx={{ px: collapsed ? 1 : 1.5, alignItems: collapsed ? 'center' : 'stretch', pb: 1.5 }}>
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right" arrow>
          <Button
            onClick={handleLogout}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              minWidth: collapsed ? 44 : '100%',
              width: collapsed ? 44 : '100%',
              height: collapsed ? 44 : 40,
              px: collapsed ? 0 : 1.5,
              borderRadius: 1.5,
              color: theme.palette.text.secondary,
              '&:hover': { backgroundColor: 'rgba(255,82,82,0.08)', color: '#f87171' },
              ...(collapsed ? { '& .MuiButton-startIcon': { marginLeft: 0, marginRight: 0 } } : {}),
            }}
            startIcon={
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: collapsed ? 0 : 22, mr: collapsed ? 0 : 1 }}>
                <LogoutRoundedIcon fontSize="small" />
              </Box>
            }
          >
            {!collapsed && (
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                Logout
              </Typography>
            )}
          </Button>
        </Tooltip>
      </Stack>
    </Box>
  )
}

SidebarNav.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
  onCloseMobile: PropTypes.func,
}
