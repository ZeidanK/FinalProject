import { useMemo } from 'react'
import { Breadcrumbs, Typography, useTheme } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded'

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  transactions: 'Transactions',
  matches: 'Matches',
  anomalies: 'Anomalies',
  reports: 'Reports',
  profile: 'Profile',
  admin: 'Admin Portal',
  'accountant-workspace': 'My Workspace',
  'find-accountant': 'Find Accountant',
  'tech-stack': 'Tech Stack',
}

const IGNORE_SEGMENTS = new Set(['app', 'portal'])

export default function BreadcrumbsNav({ sx }) {
  const location = useLocation()
  const theme = useTheme()

  const paths = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    if (segments.length <= 1) return null

    return segments
      .filter((s) => !IGNORE_SEGMENTS.has(s.toLowerCase()))
      .map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        return { href, label, isLast: index === segments.length - 1 }
      })
  }, [location.pathname])

  if (!paths || paths.length <= 1) return null

  return (
    <Breadcrumbs
      separator={<NavigateNextRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />}
      aria-label="breadcrumb"
      sx={{
        mb: 2,
        px: 1.5,
        py: 0.6,
        borderRadius: 2,
        background: 'rgba(129, 191, 255, 0.04)',
        display: 'inline-flex',
        ...sx,
      }}
    >
      <Typography
        component={Link}
        to="/dashboard"
        variant="caption"
        sx={{
          color: theme.palette.text.secondary,
          textDecoration: 'none',
          '&:hover': { color: theme.palette.primary.main, textDecoration: 'underline' },
          fontWeight: 500,
        }}
      >
        Home
      </Typography>
      {paths.map((path) =>
        path.isLast ? (
          <Typography key={path.href} variant="caption" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            {path.label}
          </Typography>
        ) : (
          <Typography
            key={path.href}
            component={Link}
            to={path.href}
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              textDecoration: 'none',
              '&:hover': { color: theme.palette.primary.main, textDecoration: 'underline' },
              fontWeight: 500,
            }}
          >
            {path.label}
          </Typography>
        ),
      )}
    </Breadcrumbs>
  )
}
