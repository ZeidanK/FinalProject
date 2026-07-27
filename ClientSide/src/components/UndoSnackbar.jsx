import PropTypes from 'prop-types'
import { Button, Slide, Snackbar, Stack, Typography } from '@mui/material'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'

function SlideTransition(props) {
  return <Slide {...props} direction="up" />
}

export default function UndoSnackbar({ pending, onUndo, onDismiss }) {
  if (!pending) return null

  return (
    <Snackbar
      open
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="body2" sx={{ color: '#fff' }}>
            {pending.message || 'Match created!'}
          </Typography>
        </Stack>
      }
      action={
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<UndoRoundedIcon fontSize="small" />}
            onClick={onUndo}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Undo
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={onDismiss}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Dismiss
          </Button>
        </Stack>
      }
    />
  )
}

UndoSnackbar.propTypes = {
  pending: PropTypes.shape({
    message: PropTypes.string,
    matchId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    data: PropTypes.object,
  }),
  onUndo: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
}
