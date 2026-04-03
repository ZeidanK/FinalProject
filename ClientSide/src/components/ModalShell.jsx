import PropTypes from 'prop-types'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

export default function ModalShell({ open, onClose, maxWidth, title, headerAction, children, actions }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        {title}
        {headerAction}
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {children}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {actions}
      </DialogActions>
    </Dialog>
  )
}

ModalShell.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  title: PropTypes.node.isRequired,
  headerAction: PropTypes.node,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
}

ModalShell.defaultProps = {
  maxWidth: 'md',
  headerAction: null,
  actions: null,
}
