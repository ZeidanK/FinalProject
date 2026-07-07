import { Alert, Box, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import { motion as _motion, AnimatePresence } from 'framer-motion'
import { useNotification } from '../context/useNotification'

const severityIcon = {
  success: CheckCircleRoundedIcon,
  error: ErrorRoundedIcon,
  warning: WarningAmberRoundedIcon,
  info: InfoRoundedIcon,
}

const severityBorder = {
  success: 'rgba(55, 214, 122, 0.3)',
  error: 'rgba(255, 107, 107, 0.3)',
  warning: 'rgba(251, 191, 36, 0.3)',
  info: 'rgba(129, 191, 255, 0.3)',
}

const severityIconColor = {
  success: '#37d67a',
  error: '#ff6b6b',
  warning: '#fbbf24',
  info: '#81bfff',
}

export default function GlobalNotifications() {
  const { queue, dismiss } = useNotification()

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.snackbar,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {queue.map((item) => {
          const Icon = severityIcon[item.severity] || InfoRoundedIcon
          const borderColor = severityBorder[item.severity] || severityBorder.info
          const iconColor = severityIconColor[item.severity] || severityIconColor.info

          return (
            <_motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ pointerEvents: 'auto' }}
            >
              <Box
                onClick={() => dismiss(item.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  minWidth: 320,
                  maxWidth: 420,
                  p: 1.5,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor,
                  background: 'rgba(14, 24, 45, 0.88)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: iconColor },
                }}
              >
                <Icon sx={{ fontSize: 22, color: iconColor, mt: 0.15, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, flex: 1 }}>
                  {item.message}
                </Typography>
              </Box>
            </_motion.div>
          )
        })}
      </AnimatePresence>
    </Box>
  )
}
