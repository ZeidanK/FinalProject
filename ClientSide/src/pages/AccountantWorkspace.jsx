import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useSearchParams } from 'react-router-dom'
import { getUserById, updateUserVisibility } from '../services/users'
import {
  getAccountantRequests,
  getAccountantCompanies,
  respondToRequest,
  disconnectAccountant,
} from '../services/accountants'

const cardSx = {
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3.5,
  background:
    'linear-gradient(135deg, rgba(14, 22, 40, 0.92) 0%, rgba(10, 17, 33, 0.96) 100%)',
}

const sectionHeader = (icon, title) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
    {icon}
    <Typography variant="h6" fontWeight={700}>
      {title}
    </Typography>
  </Stack>
)

export default function AccountantWorkspace() {
  const { user, token } = useAuth()
  const { setActiveCompanyId, activeCompanyId, refreshCompanies } = useCompany()
  const [searchParams] = useSearchParams()
  const requestTargetId = Number(searchParams.get('requestId')) || null
  const companyTargetId = Number(searchParams.get('companyId')) || null
  const requestRefs = useRef(new Map())
  const companyRefs = useRef(new Map())
  const [highlightTarget, setHighlightTarget] = useState(null)
  const [deepLinkMessage, setDeepLinkMessage] = useState(null)

  // ── Visibility state ───────────────────────────────────────
  const [isPublic, setIsPublic] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [visibilityMsg, setVisibilityMsg] = useState(null)

  // ── Requests state ─────────────────────────────────────────
  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [requestsError, setRequestsError] = useState(null)
  const [respondingId, setRespondingId] = useState(null)

  // ── Companies state ────────────────────────────────────────
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [companiesError, setCompaniesError] = useState(null)
  const [workspaceMsg, setWorkspaceMsg] = useState(null)
  const [disconnectCompany, setDisconnectCompany] = useState(null)
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false)
  const [disconnectingCompanyId, setDisconnectingCompanyId] = useState(null)

  // ── Data loaders ───────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    if (!user?.id || !token) return
    setLoadingRequests(true)
    setRequestsError(null)
    try {
      const data = await getAccountantRequests(user.id, token)
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      setRequestsError(err.message || 'Failed to load requests.')
    } finally {
      setLoadingRequests(false)
    }
  }, [user?.id, token])

  const loadCompanies = useCallback(async () => {
    if (!user?.id || !token) return
    setLoadingCompanies(true)
    setCompaniesError(null)
    try {
      const data = await getAccountantCompanies(user.id, token)
      setCompanies(Array.isArray(data) ? data : [])
    } catch (err) {
      setCompaniesError(err.message || 'Failed to load companies.')
    } finally {
      setLoadingCompanies(false)
    }
  }, [user?.id, token])

  useEffect(() => {
    if (!user?.id || !token) return
    setLoadingProfile(true)
    getUserById(user.id, token)
      .then((data) => setIsPublic(Boolean(data?.isPublic)))
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [user?.id, token])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  useEffect(() => {
    const targetId = requestTargetId || companyTargetId
    if (!targetId) return undefined
    const isRequest = Boolean(requestTargetId)
    if ((isRequest && loadingRequests) || (!isRequest && loadingCompanies)) return undefined

    const collection = isRequest ? requests : companies
    const element = (isRequest ? requestRefs : companyRefs).current.get(targetId)
    if (!collection.some((item) => Number(item.id) === targetId) || !element) {
      setDeepLinkMessage(isRequest
        ? 'This work request is no longer pending or is no longer available.'
        : 'This company is no longer available in your workspace.')
      return undefined
    }

    setDeepLinkMessage(null)
    setHighlightTarget(`${isRequest ? 'request' : 'company'}-${targetId}`)
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.focus({ preventScroll: true })
    const timer = globalThis.setTimeout(() => setHighlightTarget(null), 4000)
    return () => globalThis.clearTimeout(timer)
  }, [companies, companyTargetId, loadingCompanies, loadingRequests, requestTargetId, requests])

  // ── Handlers ───────────────────────────────────────────────
  const handleToggleVisibility = async (e) => {
    const newValue = e.target.checked
    setTogglingVisibility(true)
    setVisibilityMsg(null)
    try {
      await updateUserVisibility(user.id, newValue, token)
      setIsPublic(newValue)
      setVisibilityMsg({
        type: 'success',
        text: newValue
          ? 'You are now public. Business owners can find and send you work requests.'
          : 'You are now private. Only your existing partners can work with you.',
      })
    } catch (err) {
      setVisibilityMsg({ type: 'error', text: err.message || 'Failed to update visibility.' })
    } finally {
      setTogglingVisibility(false)
    }
  }

  const handleRespond = async (requestId, accept) => {
    setRespondingId(requestId)
    setRequestsError(null)
    try {
      await respondToRequest(requestId, accept, token)
      await Promise.all([loadRequests(), loadCompanies(), refreshCompanies()])
    } catch (err) {
      setRequestsError(err.message || 'Failed to respond to request.')
    } finally {
      setRespondingId(null)
    }
  }

  const confirmDisconnect = (company) => {
    setDisconnectCompany(company)
    setConfirmDisconnectOpen(true)
  }

  const closeDisconnectDialog = () => {
    setConfirmDisconnectOpen(false)
    setDisconnectCompany(null)
  }

  const handleDisconnectCompany = async () => {
    if (!user?.id || !token || !disconnectCompany) return

    setDisconnectingCompanyId(disconnectCompany.id)
    setCompaniesError(null)
    setWorkspaceMsg(null)

    try {
      await disconnectAccountant(user.id, disconnectCompany.id, token)
      setCompanies((prev) => prev.filter((c) => Number(c.id) !== Number(disconnectCompany.id)))
      await refreshCompanies()
      setWorkspaceMsg({
        type: 'success',
        text: `${disconnectCompany.name} was removed from your workspace.`,
      })
    } catch (err) {
      setCompaniesError(err.message || 'Failed to remove the company.')
    } finally {
      setDisconnectingCompanyId(null)
      closeDisconnectDialog()
    }
  }

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, py: 3, width: '100%' }}
    >
      <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>
        My Workspace
      </Typography>

      {deepLinkMessage && <Alert severity="info" sx={{ mb: 2 }}>{deepLinkMessage}</Alert>}

      {/* ══════════════════════════════════════════════════
          SECTION A — Availability toggle
         ══════════════════════════════════════════════════ */}
      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {sectionHeader(
            <LockOpenRoundedIcon sx={{ color: 'primary.main' }} />,
            'Availability',
          )}

          <Collapse in={!!visibilityMsg}>
            {visibilityMsg && (
              <Alert
                severity={visibilityMsg.type}
                sx={{ mb: 2 }}
                onClose={() => setVisibilityMsg(null)}
              >
                {visibilityMsg.text}
              </Alert>
            )}
          </Collapse>

          {loadingProfile ? (
            <Skeleton variant="rounded" height={48} width={340} />
          ) : (
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPublic}
                    onChange={handleToggleVisibility}
                    disabled={togglingVisibility}
                    color="primary"
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {isPublic ? (
                      <LockOpenRoundedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    ) : (
                      <LockRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    )}
                    <Typography fontWeight={600}>
                      {isPublic
                        ? 'Public — Business owners can find you'
                        : 'Private — Hidden from the directory'}
                    </Typography>
                    {togglingVisibility && <CircularProgress size={16} />}
                  </Stack>
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>
                {isPublic
                  ? 'You appear in the accountant directory. Business owners can send you work requests.'
                  : 'You are hidden from the directory. You can still manage companies you have already accepted.'}
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════
          SECTION B — Incoming work requests
         ══════════════════════════════════════════════════ */}
      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {sectionHeader(
            <WorkspacesRoundedIcon sx={{ color: 'primary.main' }} />,
            'Incoming Requests',
          )}

          {requestsError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRequestsError(null)}>
              {requestsError}
            </Alert>
          )}

          {loadingRequests ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={72} />
              <Skeleton variant="rounded" height={72} />
            </Stack>
          ) : requests.length === 0 ? (
            <Typography color="text.secondary">No pending requests at this time.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {requests.map((req) => (
                <Box
                  key={req.id}
                  ref={(node) => {
                    if (node) requestRefs.current.set(Number(req.id), node)
                    else requestRefs.current.delete(Number(req.id))
                  }}
                  tabIndex={-1}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: highlightTarget === `request-${req.id}` ? 'primary.main' : 'divider',
                    bgcolor: 'rgba(14, 22, 40, 0.5)',
                    boxShadow: highlightTarget === `request-${req.id}` ? '0 0 0 3px rgba(88,166,255,0.22)' : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700}>{req.companyName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Requested by {req.requestedByName}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={
                          respondingId === req.id ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <CheckRoundedIcon />
                          )
                        }
                        disabled={respondingId === req.id}
                        onClick={() => handleRespond(req.id, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={
                          respondingId === req.id ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <CloseRoundedIcon />
                          )
                        }
                        disabled={respondingId === req.id}
                        onClick={() => handleRespond(req.id, false)}
                      >
                        Decline
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════
          SECTION C — Companies I work with
         ══════════════════════════════════════════════════ */}
      <Card elevation={0} sx={{ ...cardSx }}>
        <CardContent sx={{ p: 3 }}>
          {sectionHeader(
            <BusinessRoundedIcon sx={{ color: 'secondary.main' }} />,
            'Working With',
          )}

          {loadingCompanies ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={60} />
              <Skeleton variant="rounded" height={60} />
            </Stack>
          ) : companiesError ? (
            <Alert severity="error" variant="outlined">
              {companiesError}
            </Alert>
          ) : companies.length === 0 ? (
            <Typography color="text.secondary">
              You are not working with any companies yet. Accept incoming requests to get started.
            </Typography>
          ) : (
            <>
              {workspaceMsg && (
                <Alert
                  severity={workspaceMsg.type}
                  sx={{ mb: 2 }}
                  onClose={() => setWorkspaceMsg(null)}
                >
                  {workspaceMsg.text}
                </Alert>
              )}
              <Stack spacing={1.5}>
                {companies.map((c) => (
                  <Box
                    key={c.id}
                    ref={(node) => {
                      if (node) companyRefs.current.set(Number(c.id), node)
                      else companyRefs.current.delete(Number(c.id))
                    }}
                    tabIndex={-1}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: highlightTarget === `company-${c.id}`
                        || Number(activeCompanyId) === Number(c.id) ? 'primary.main' : 'divider',
                      bgcolor: 'rgba(14, 22, 40, 0.5)',
                      boxShadow: highlightTarget === `company-${c.id}` ? '0 0 0 3px rgba(88,166,255,0.22)' : 'none',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack spacing={0.5}>
                        <Typography fontWeight={700}>{c.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[c.city, c.country].filter(Boolean).join(', ') || 'No location'}
                          {' · '}
                          {c.currency || 'USD'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {Number(activeCompanyId) === Number(c.id) ? (
                        <Chip
                          label="Active"
                          size="small"
                          color="primary"
                          variant="filled"
                          onDelete={() => confirmDisconnect(c)}
                          deleteIcon={<CloseRoundedIcon />}
                          sx={{
                            fontWeight: 700,
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(255,255,255,0.8)',
                            },
                          }}
                        />
                      ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setActiveCompanyId(c.id, c.name)}
                          >
                            Set Active
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => confirmDisconnect(c)}
                          >
                            Remove
                          </Button>
                        </Stack>
                      )}
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmDisconnectOpen}
        onClose={closeDisconnectDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove{' '}
            <strong>{disconnectCompany?.name || 'this company'}</strong> from your workspace?
            This action will revoke the accountant relationship.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDisconnectDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDisconnectCompany}
            color="error"
            variant="contained"
            disabled={disconnectingCompanyId === disconnectCompany?.id}
          >
            {disconnectingCompanyId === disconnectCompany?.id ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
