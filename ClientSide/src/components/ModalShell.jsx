import PropTypes from 'prop-types'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

/**
 * A reusable dialog wrapper with consistent header, content, and action styling.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {function(): void} props.onClose - Callback invoked when the dialog requests to close.
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|false} [props.maxWidth] - Maximum dialog width.
 * @param {import('react').ReactNode} props.title - Dialog title node.
 * @param {import('react').ReactNode} [props.headerAction] - Optional element rendered next to the title.
 * @param {import('react').ReactNode} props.children - Content displayed inside the dialog body.
 * @param {import('react').ReactNode} [props.actions] - Action buttons rendered in the dialog footer.
 * @returns {JSX.Element}
 */
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
