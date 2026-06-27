import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useNotification } from '../context/useNotification'
import { useRealtime } from '../context/useRealtime'
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsInboxQuery,
} from '../hooks/queries/useNotificationsQueries'

const SEVERITY_COLORS = {
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
}

const COMPANY_TARGETS = new Set([
  'accountant',
  'anomaly',
  'invoice',
  'invoice_upload_job',
  'transaction_upload_job',
])

const formatRelativeTime = (dateStr) => {
  const timestamp = new Date(dateStr).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { companies, activeCompanyId, setActiveCompanyId } = useCompany()
  const { notify } = useNotification()
  const { connectionState, isConnected: isRealtimeConnected } = useRealtime()

  const isAccountant = user?.role === 'accountant' || user?.role === 'accountant_business_owner'
  const [selectedView, setSelectedView] = useState(isAccountant ? 'personal' : 'combined')
  const [anchorEl, setAnchorEl] = useState(null)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const open = Boolean(anchorEl)
  const view = isAccountant ? selectedView : 'combined'
  const queryCompanyId = activeCompanyId || undefined

  const inboxQuery = useNotificationsInboxQuery({
    token,
    userId: user?.id,
    view,
    companyId: queryCompanyId,
    isRealtimeConnected,
  })
  const markReadMutation = useMarkNotificationReadMutation({
    token,
    userId: user?.id,
    view,
    companyId: queryCompanyId,
  })
  const markAllReadMutation = useMarkAllNotificationsReadMutation({
    token,
    userId: user?.id,
    view,
    companyId: queryCompanyId,
  })

  const notifications = useMemo(
    () => inboxQuery.data?.pages?.flatMap((page) => page.items || []) || [],
    [inboxQuery.data],
  )
  const counts = inboxQuery.data?.pages?.[0]?.counts || {}
  const unreadCount = isAccountant
    ? Number(counts.personalUnread || 0) + Number(counts.companyUnread || 0)
    : Number(counts.visibleUnread || 0)
  const activeCompany = companies.find((company) => Number(company.id) === Number(activeCompanyId))

  useEffect(() => {
    if (!pendingNavigation) return
    if (pendingNavigation.companyId && Number(activeCompanyId) !== Number(pendingNavigation.companyId)) return
    const timer = globalThis.setTimeout(() => {
      navigate(pendingNavigation.link)
      setAnchorEl(null)
      setPendingNavigation(null)
    }, 0)
    return () => globalThis.clearTimeout(timer)
  }, [activeCompanyId, navigate, pendingNavigation])

  const handleOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget)
    inboxQuery.refetch()
  }, [inboxQuery])

  const handleClose = useCallback(() => setAnchorEl(null), [])

  const handleNotificationClick = useCallback((item) => {
    if (!item.isRead) markReadMutation.mutate(item.id)
    if (!item.link) return

    const targetCompanyId = item.companyId || item.targetCompanyId
    const requiresCompany = COMPANY_TARGETS.has(item.targetType)
    if (requiresCompany && targetCompanyId && Number(targetCompanyId) !== Number(activeCompanyId)) {
      const hasAccess = companies.some((company) => Number(company.id) === Number(targetCompanyId))
      if (!hasAccess) {
        notify({ message: 'This notification is no longer available because company access changed.', severity: 'warning' })
        return
      }
      setPendingNavigation({ link: item.link, companyId: targetCompanyId })
      setActiveCompanyId(targetCompanyId)
      return
    }

    navigate(item.link)
    setAnchorEl(null)
  }, [activeCompanyId, companies, markReadMutation, navigate, notify, setActiveCompanyId])

  const currentUnread = view === 'personal'
    ? Number(counts.personalUnread || 0)
    : view === 'company'
      ? Number(counts.companyUnread || 0)
      : Number(counts.visibleUnread || 0)
  const connectionTooltip = isRealtimeConnected
    ? 'Notifications'
    : connectionState === 'connecting' || connectionState === 'reconnecting'
      ? 'Notifications are reconnecting'
      : 'Notifications are offline and syncing periodically'

  return (
    <>
      <Tooltip title={connectionTooltip}>
        <IconButton color="inherit" onClick={handleOpen} aria-label="open notifications">
          <Box component="span" sx={{ position: 'relative', display: 'inline-flex' }}>
            <Badge badgeContent={unreadCount || null} color="error" max={99}>
              {unreadCount > 0 ? <NotificationsRoundedIcon /> : <NotificationsNoneRoundedIcon />}
            </Badge>
            {!isRealtimeConnected && (
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  left: -1,
                  bottom: -1,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: connectionState === 'connecting' || connectionState === 'reconnecting'
                    ? 'warning.main'
                    : 'error.main',
                  boxShadow: '0 0 0 2px rgba(8,14,28,0.95)',
                }}
              />
            )}
          </Box>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 340, sm: 400 },
              maxHeight: 560,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'rgba(12, 20, 38, 0.98)',
              border: '1px solid',
              borderColor: 'divider',
              backdropFilter: 'blur(12px)',
            },
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.4 }}>
          <Typography fontWeight={700}>Notifications</Typography>
          {currentUnread > 0 && (
            <Button
              size="small"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              sx={{ textTransform: 'none' }}
            >
              Mark this tab read
            </Button>
          )}
        </Stack>

        {isAccountant && (
          <Tabs
            value={selectedView}
            onChange={(_event, next) => setSelectedView(next)}
            variant="fullWidth"
            aria-label="notification views"
          >
            <Tab value="personal" label={`Global (${counts.personalUnread || 0})`} />
            <Tab
              value="company"
              disabled={!activeCompanyId}
              label={`${activeCompany?.name || 'Company'} (${counts.companyUnread || 0})`}
            />
          </Tabs>
        )}

        <Divider />
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {inboxQuery.isLoading && (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
          )}
          {inboxQuery.isError && (
            <Alert severity="error" sx={{ m: 2 }} action={<Button onClick={() => inboxQuery.refetch()}>Retry</Button>}>
              Notifications could not be loaded.
            </Alert>
          )}
          {!inboxQuery.isLoading && !inboxQuery.isError && notifications.length === 0 && (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <NotificationsNoneRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No notifications here</Typography>
            </Stack>
          )}
          {notifications.length > 0 && (
            <List disablePadding>
              {notifications.map((item, index) => (
                <Box key={item.id}>
                  <ListItemButton
                    alignItems="flex-start"
                    onClick={() => handleNotificationClick(item)}
                    sx={{
                      bgcolor: item.isRead ? 'transparent' : 'rgba(88,166,255,0.08)',
                      px: 2,
                      py: 1.25,
                      gap: 1.4,
                    }}
                  >
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.info,
                      mt: 0.8,
                      flexShrink: 0,
                    }} />
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={item.isRead ? 400 : 700}>{item.title}</Typography>}
                      secondary={(
                        <Stack spacing={0.35} sx={{ mt: 0.35 }}>
                          {item.body && <Typography variant="caption" color="text.secondary">{item.body}</Typography>}
                          <Typography variant="caption" color="text.disabled">
                            {[item.companyName, formatRelativeTime(item.createdAt)].filter(Boolean).join(' · ')}
                          </Typography>
                        </Stack>
                      )}
                    />
                    {item.link && <OpenInNewRoundedIcon sx={{ fontSize: 16, color: 'text.disabled', mt: 0.5 }} />}
                  </ListItemButton>
                  {index < notifications.length - 1 && <Divider sx={{ opacity: 0.3 }} />}
                </Box>
              ))}
            </List>
          )}
          {inboxQuery.hasNextPage && (
            <Button
              fullWidth
              onClick={() => inboxQuery.fetchNextPage()}
              disabled={inboxQuery.isFetchingNextPage}
              sx={{ my: 1, textTransform: 'none' }}
            >
              {inboxQuery.isFetchingNextPage ? 'Loading…' : 'Load older notifications'}
            </Button>
          )}
        </Box>
      </Popover>
    </>
  )
}
