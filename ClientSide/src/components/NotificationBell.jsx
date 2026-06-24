import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/useAuth'
import { useRealtime } from '../context/useRealtime'
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../hooks/queries/useNotificationsQueries'
import { notificationKeys } from '../queries/queryKeys'

const SEVERITY_COLORS = {
  success: '#4ade80',
  error:   '#f87171',
  warning: '#fbbf24',
  info:    '#60a5fa',
}

const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

/**
 * Bell icon for the app header showing unread notification count.
 * Opens a popover listing all notifications with read/mark-all actions.
 *
 * @returns {JSX.Element}
 */
export default function NotificationBell() {
  const { token } = useAuth()
  const { subscribe: subscribeRealtime } = useRealtime()
  const queryClient = useQueryClient()

  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const { data: notifications = [], isLoading } = useNotificationsQuery({ token })
  const markReadMutation = useMarkNotificationReadMutation({ token })
  const markAllReadMutation = useMarkAllNotificationsReadMutation({ token })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Invalidate the notifications cache whenever a realtime event arrives.
  useEffect(() => {
    const unsub1 = subscribeRealtime('notificationEvent', () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    })
    const unsub2 = subscribeRealtime('uploadJobUpdated', (job) => {
      const status = (job?.status || job?.Status || '').toLowerCase()
      if (status === 'completed' || status === 'failed') {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      }
    })
    return () => { unsub1(); unsub2() }
  }, [subscribeRealtime, queryClient])

  const handleOpen = useCallback((e) => setAnchorEl(e.currentTarget), [])
  const handleClose = useCallback(() => setAnchorEl(null), [])

  const handleMarkRead = useCallback(
    (id) => markReadMutation.mutate(id),
    [markReadMutation],
  )

  const handleMarkAll = useCallback(() => markAllReadMutation.mutate(), [markAllReadMutation])

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleOpen}
          aria-label="open notifications"
          size="medium"
        >
          <Badge
            badgeContent={unreadCount || null}
            color="error"
            max={99}
          >
            {unreadCount > 0
              ? <NotificationsRoundedIcon />
              : <NotificationsNoneRoundedIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 520,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgba(12, 20, 38, 0.97)',
            border: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(12px)',
          },
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, flexShrink: 0 }}
        >
          <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
            Notifications
            {unreadCount > 0 && (
              <Typography
                component="span"
                sx={{
                  ml: 1,
                  px: 0.8,
                  py: 0.1,
                  borderRadius: 1,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: 'error.main',
                  color: '#fff',
                }}
              >
                {unreadCount} new
              </Typography>
            )}
          </Typography>

          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAll}
              disabled={markAllReadMutation.isPending}
              sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'primary.light' }}
            >
              Mark all read
            </Button>
          )}
        </Stack>

        <Divider />

        {/* Body */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {isLoading && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress size={24} />
            </Stack>
          )}

          {!isLoading && notifications.length === 0 && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 5 }}>
              <NotificationsNoneRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Stack>
          )}

          {!isLoading && notifications.length > 0 && (
            <List disablePadding>
              {notifications.map((n, idx) => (
                <Box key={n.id}>
                  <ListItem
                    alignItems="flex-start"
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    sx={{
                      cursor: n.isRead ? 'default' : 'pointer',
                      bgcolor: n.isRead ? 'transparent' : 'rgba(88,166,255,0.06)',
                      transition: 'background 0.15s',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.04)',
                      },
                      px: 2,
                      py: 1.2,
                      gap: 1.5,
                    }}
                  >
                    {/* Severity dot */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: SEVERITY_COLORS[n.severity] ?? SEVERITY_COLORS.info,
                        flexShrink: 0,
                        mt: 0.75,
                      }}
                    />

                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={n.isRead ? 400 : 700}
                          sx={{ lineHeight: 1.4, color: n.isRead ? 'text.secondary' : 'text.primary' }}
                        >
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.3} sx={{ mt: 0.3 }}>
                          {n.body && (
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                              {n.body}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.disabled">
                            {formatRelativeTime(n.createdAt)}
                          </Typography>
                        </Stack>
                      }
                    />

                    {!n.isRead && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          flexShrink: 0,
                          mt: 0.9,
                        }}
                      />
                    )}
                  </ListItem>
                  {idx < notifications.length - 1 && <Divider sx={{ opacity: 0.3 }} />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  )
}
