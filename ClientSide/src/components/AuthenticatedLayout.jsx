import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import { motion } from 'framer-motion'
import LogoMark from './LogoMark'
import SidebarNav, { sidebarWidth } from './SidebarNav'
import BreadcrumbsNav from './BreadcrumbsNav'
import { Outlet, useLocation } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import NotificationBell from './NotificationBell'
import CommandPalette from './CommandPalette'
import PageTransitionWrapper from './PageTransitionWrapper'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function ScrollToTopFab() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <IconButton
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      sx={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 1200,
        bgcolor: 'primary.main', color: '#fff',
        boxShadow: '0 4px 16px rgba(88,166,255,0.35)',
        '&:hover': { bgcolor: 'primary.dark' },
        width: 40, height: 40,
      }}
    >
      <KeyboardArrowUpRoundedIcon />
    </IconButton>
  )
}

function AuthenticatedLayout() {
  const { user, logout } = useAuth()
  const { companies, activeCompanyId, activeCompanyName } = useCompany()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleOpen = useCallback(() => setMobileOpen(true), [])
  const handleClose = useCallback(() => setMobileOpen(false), [])

  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const isAccountant = user?.role === 'accountant' || user?.role === 'accountant_business_owner'
  const activeCompany = activeCompanyId && Array.isArray(companies)
    ? companies.find((c) => String(c.id ?? c.companyId) === String(activeCompanyId))
    : null
  const displayedCompanyName = activeCompany?.name || activeCompany?.companyName || activeCompanyName

  const sidebar = (
    <SidebarNav
      user={user}
      onLogout={logout}
      onNavigate={isMobile ? handleClose : undefined}
      onCloseMobile={isMobile ? handleClose : undefined}
    />
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <ScrollToTop />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Desktop sidebar */}
        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{
            display: { xs: 'none', md: 'block' },
            flexShrink: 0,
            height: '100vh',
            position: { md: 'sticky' },
            top: 0,
          }}
        >
          {sidebar}
        </Box>

        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          {sidebar}
        </Drawer>

        {/* Main content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top bar */}
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              backdropFilter: 'blur(12px)',
              bgcolor: 'rgba(7,11,20,0.7)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Toolbar sx={{ minHeight: { xs: 48, md: 56 } }}>
              {isMobile && (
                <IconButton edge="start" color="inherit" onClick={handleOpen} aria-label="Open menu" sx={{ mr: 0.5 }}>
                  <MenuRoundedIcon />
                </IconButton>
              )}
              {isMobile && (
                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mr: 1 }}>
                  <LogoMark sx={{ width: 24, height: 24 }} />
                  <Typography fontWeight={700} fontSize="0.95rem">ReconFlow</Typography>
                </Stack>
              )}

              {isAccountant && displayedCompanyName && (
                <Typography variant="body2" sx={{ color: 'text.secondary', ml: 2, display: { xs: 'none', sm: 'block' } }}>
                  Working with: <span style={{ color: theme.palette.primary.light, fontWeight: 700 }}>{displayedCompanyName}</span>
                </Typography>
              )}

              <Box sx={{ flexGrow: 1 }} />
              <NotificationBell />
            </Toolbar>
          </AppBar>

          {/* Page content with transitions */}
          <Box
            component={motion.main}
            sx={{
              flex: 1,
              overflowX: 'hidden',
              px: { xs: 1.5, sm: 2.5, md: 3, xl: 4 },
              py: { xs: 1.5, md: 2 },
            }}
          >
            <BreadcrumbsNav />
            <PageTransitionWrapper>
              <Outlet />
            </PageTransitionWrapper>
          </Box>
        </Box>
      </Box>

      <ScrollToTopFab />

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </Box>
  )
}

export default AuthenticatedLayout
