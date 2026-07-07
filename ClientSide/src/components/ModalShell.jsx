import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Dialog, DialogActions, DialogContent, DialogTitle, Zoom } from '@mui/material'

const Transition = forwardRef(function Transition(props, ref) {
  return <Zoom ref={ref} {...props} />
})

export default function ModalShell({ open, onClose, maxWidth, title, headerAction, children, actions }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      TransitionComponent={Transition}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            border: '1px solid rgba(129, 191, 255, 0.12)',
            background: 'rgba(14, 24, 45, 0.92)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(129, 191, 255, 0.08)',
          pb: 2,
        }}
      >
        {title}
        {headerAction}
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3, borderColor: 'rgba(129, 191, 255, 0.08)' }}>
        {children}
      </DialogContent>

      {actions ? (
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(129, 191, 255, 0.08)' }}>
          {actions}
        </DialogActions>
      ) : null}
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
