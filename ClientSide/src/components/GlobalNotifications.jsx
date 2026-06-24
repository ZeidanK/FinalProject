import { Alert, Snackbar, Stack } from '@mui/material'
import { useNotification } from '../context/useNotification'

/**
 * Renders all queued global notifications as stacked snackbars.
 *
 * @returns {JSX.Element|null}
 */
export default function GlobalNotifications() {
  const { queue, dismiss } = useNotification()

  if (!queue.length) return null

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      {queue.map((item) => (
        <Snackbar
          key={item.id}
          open
          autoHideDuration={item.autoHideMs}
          onClose={() => dismiss(item.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={item.severity}
            variant="filled"
            onClose={() => dismiss(item.id)}
            sx={{ width: '100%' }}
          >
            {item.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  )
}