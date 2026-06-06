import { useState, useEffect, useCallback } from 'react'
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
import { getUserById, updateUserVisibility } from '../services/users'
import {
  getAccountantRequests,
  getAccountantCompanies,
  respondToRequest,
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
  const { setActiveCompanyId, activeCompanyId } = useCompany()

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
      await Promise.all([loadRequests(), loadCompanies()])
    } catch (err) {
      setRequestsError(err.message || 'Failed to respond to request.')
    } finally {
      setRespondingId(null)
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
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(14, 22, 40, 0.5)',
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
            <Stack spacing={1.5}>
              {companies.map((c) => (
                <Box
                  key={c.id}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor:
                      Number(activeCompanyId) === Number(c.id) ? 'primary.main' : 'divider',
                    bgcolor: 'rgba(14, 22, 40, 0.5)',
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
                      <Chip
                        label={c.accessLevel || c.access_level || 'Full Access'}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(55, 214, 122, 0.14)',
                          border: '1px solid',
                          borderColor: 'rgba(55, 214, 122, 0.38)',
                          color: '#b3ffd0',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          textTransform: 'capitalize',
                        }}
                      />
                      {Number(activeCompanyId) === Number(c.id) ? (
                        <Chip label="Active" size="small" color="primary" variant="filled" />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setActiveCompanyId(c.id)}
                        >
                          Set Active
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
