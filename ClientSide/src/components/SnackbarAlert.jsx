import PropTypes from 'prop-types'
import { Alert, Snackbar } from '@mui/material'

/**
 * Render a temporary snackbar alert for user feedback messages.
 *
 * @param {object} props
 * @param {boolean} props.open - Controls whether the snackbar is visible.
 * @param {string} props.message - Alert message text.
 * @param {'error'|'warning'|'info'|'success'} props.severity - Alert severity level.
 * @param {function(object, string): void} props.onClose - Callback triggered when the snackbar closes.
 * @returns {JSX.Element}
 */
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
