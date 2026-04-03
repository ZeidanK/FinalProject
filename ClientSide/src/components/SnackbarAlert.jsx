import PropTypes from 'prop-types'
import { Alert, Snackbar } from '@mui/material'

export default function SnackbarAlert({ open, message, severity, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

SnackbarAlert.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']).isRequired,
  onClose: PropTypes.func.isRequired,
}
