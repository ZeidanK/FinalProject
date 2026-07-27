import { createContext, useCallback, useContext, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', message: '' })
  const resolveRef = useRef(null)

  const confirm = useCallback((message, title = 'Confirm') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({ open: true, title, message })
    })
  }, [])

  const handleClose = () => {
    resolveRef.current?.(false)
    setState({ open: false })
  }

  const handleConfirm = () => {
    resolveRef.current?.(true)
    setState({ open: false })
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={state.open}
        onClose={handleClose}
        maxWidth="xs"
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
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
          }}
        >
          {state.title}
        </DialogTitle>
        <DialogContent
          sx={{
            px: 3,
            '&.MuiDialogContent-root': {
              paddingTop: 3,
              paddingBottom: 3,
            },
          }}
        >
          <DialogContentText sx={{ textAlign: 'center' }}>{state.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleConfirm} color="error" variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

ConfirmProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return ctx
}
