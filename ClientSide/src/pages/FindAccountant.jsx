import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useSearchParams } from 'react-router-dom'
import {
  getPublicAccountants,
  sendAccountantRequest,
  disconnectAccountant,
} from '../services/accountants'

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
  : ''

const cardSx = {
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3.5,
  background:
    'linear-gradient(135deg, rgba(14, 22, 40, 0.92) 0%, rgba(10, 17, 33, 0.96) 100%)',
}

export default function FindAccountant() {
  const { token } = useAuth()
  const { activeCompanyId } = useCompany()
  const [searchParams] = useSearchParams()
  const targetAccountantId = Number(searchParams.get('accountantId')) || null
  const accountantRefs = useRef(new Map())
  const [highlightedAccountantId, setHighlightedAccountantId] = useState(null)
  const [targetUnavailable, setTargetUnavailable] = useState(false)

  const [accountants, setAccountants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const [sendMsg, setSendMsg] = useState(null)
  const [search, setSearch] = useState('')
  const [disconnectTarget, setDisconnectTarget] = useState(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await getPublicAccountants(activeCompanyId || null, token)
      setAccountants(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load accountants.')
    } finally {
      setLoading(false)
    }
  }, [token, activeCompanyId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!targetAccountantId || loading) return undefined
    const exists = accountants.some((accountant) => Number(accountant.id) === targetAccountantId)
    const element = accountantRefs.current.get(targetAccountantId)
    if (!exists || !element) {
      setTargetUnavailable(true)
      return undefined
    }

    setTargetUnavailable(false)
    setHighlightedAccountantId(targetAccountantId)
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.focus({ preventScroll: true })
    const timer = globalThis.setTimeout(() => setHighlightedAccountantId(null), 4000)
    return () => globalThis.clearTimeout(timer)
  }, [accountants, loading, targetAccountantId])

  const handleSendRequest = async (accountantId) => {
    if (!activeCompanyId) return
    setSendingId(accountantId)
    setSendMsg(null)
    try {
      await sendAccountantRequest(accountantId, activeCompanyId, token)
      setAccountants((prev) =>
        prev.map((a) =>
          a.id === accountantId ? { ...a, requestStatus: 'pending' } : a,
        ),
      )
      setSendMsg({ type: 'success', text: 'Request sent! The accountant will be notified.' })
    } catch (err) {
      setSendMsg({ type: 'error', text: err.message || 'Failed to send request.' })
    } finally {
      setSendingId(null)
    }
  }

  const handleDisconnect = async (accountantId) => {
    if (!activeCompanyId) return
    setSendingId(accountantId)
    setSendMsg(null)
    try {
      await disconnectAccountant(accountantId, activeCompanyId, token)
      setAccountants((prev) =>
        prev.map((a) =>
          a.id === accountantId ? { ...a, requestStatus: null } : a,
        ),
      )
      setSendMsg({ type: 'success', text: 'Accountant removed successfully.' })
    } catch (err) {
      setSendMsg({ type: 'error', text: err.message || 'Failed to remove accountant.' })
    } finally {
      setSendingId(null)
      setDisconnectTarget(null)
      setConfirmDialogOpen(false)
    }
  }

  const confirmDisconnect = (accountant) => {
    setDisconnectTarget(accountant)
    setConfirmDialogOpen(true)
  }

  const onConfirmDisconnect = () => {
    if (disconnectTarget) {
      handleDisconnect(disconnectTarget.id)
    }
  }

  const filtered = accountants.filter(
    (a) =>
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, py: 3, width: '100%' }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <PersonSearchRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={800}>
          Find an Accountant
        </Typography>
      </Stack>

      {sendMsg && (
        <Alert
          severity={sendMsg.type}
          sx={{ mb: 2 }}
          onClose={() => setSendMsg(null)}
        >
          {sendMsg.text}
        </Alert>
      )}

      {targetUnavailable && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This accountant is no longer available for the active company.
        </Alert>
      )}

      <TextField
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 3, maxWidth: 420 }}
        fullWidth
      />

      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} variant="rounded" height={96} />
          ))}
        </Stack>
      ) : error ? (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      ) : filtered.length === 0 ? (
        <Card elevation={0} sx={cardSx}>
          <CardContent>
            <Typography color="text.secondary" textAlign="center" py={4}>
              {search
                ? 'No accountants match your search.'
                : 'No public accountants are available at the moment.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Stack spacing={2}>
            {filtered.map((accountant) => (
              <Card
                key={accountant.id}
                ref={(node) => {
                  if (node) accountantRefs.current.set(Number(accountant.id), node)
                  else accountantRefs.current.delete(Number(accountant.id))
                }}
                tabIndex={-1}
                elevation={0}
                sx={{
                  ...cardSx,
                  borderColor: highlightedAccountantId === Number(accountant.id) ? 'primary.main' : 'divider',
                  boxShadow: highlightedAccountantId === Number(accountant.id) ? '0 0 0 3px rgba(88,166,255,0.22)' : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                  >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      src={
                        accountant.profilePicture
                          ? `${API_BASE}/${accountant.profilePicture}`
                          : undefined
                      }
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: 'primary.main',
                        color: '#041229',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                      }}
                    >
                      {(accountant.name || 'A')[0].toUpperCase()}
                    </Avatar>
                    <Stack spacing={0.25}>
                      <Typography fontWeight={700}>{accountant.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {accountant.email}
                      </Typography>
                      {accountant.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {accountant.phone}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>

                  <Box>
                    {accountant.requestStatus === 'active' ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label="Working Together"
                          color="success"
                          variant="outlined"
                          size="small"
                          onDelete={() => confirmDisconnect(accountant)}
                          deleteIcon={<CloseRoundedIcon />}
                          sx={{
                            fontWeight: 700,
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(255,255,255,0.8)',
                            },
                          }}
                        />
                      </Stack>
                    ) : accountant.requestStatus === 'pending' ? (
                      <Chip
                        label="Request Sent"
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          sendingId === accountant.id ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <SendRoundedIcon />
                          )
                        }
                        disabled={sendingId === accountant.id}
                        onClick={() => handleSendRequest(accountant.id)}
                      >
                        Send Request
                      </Button>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Confirm removal</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to remove{' '}
                <strong>{disconnectTarget?.name || 'this accountant'}</strong> from the
                working relationship? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={onConfirmDisconnect}
                color="error"
                variant="contained"
                disabled={sendingId === disconnectTarget?.id}
              >
                {sendingId === disconnectTarget?.id ? 'Removing...' : 'Remove'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  )
}
