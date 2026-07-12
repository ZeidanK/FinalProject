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
  IconButton,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { motion } from 'framer-motion'
import AnimatedBackground from '../components/AnimatedBackground'
import SectionHeader from '../components/SectionHeader'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useSearchParams } from 'react-router-dom'
import { getUserById, updateUser, updateUserVisibility } from '../services/users'
import {
  getAccountantRequests,
  getAccountantCompanies,
  respondToRequest,
  disconnectAccountant,
  getAccountantSpecialties,
  addAccountantSpecialty,
  removeAccountantSpecialty,
  getAccountantCertifications,
  addAccountantCertification,
  removeAccountantCertification,
} from '../services/accountants'

const cardSx = {
  borderRadius: 3.5,
  border: '1px solid rgba(129, 191, 255, 0.12)',
  background: 'rgba(14, 24, 45, 0.65)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
}

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

  // ── Profile state ──────────────────────────────────────────
  const [profileData, setProfileData] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)
  const [specialties, setSpecialties] = useState([])
  const [certifications, setCertifications] = useState([])
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [certInput, setCertInput] = useState('')
  const [addingSpecialty, setAddingSpecialty] = useState(false)
  const [addingCert, setAddingCert] = useState(false)

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
    Promise.all([
      getUserById(user.id, token),
      getAccountantSpecialties(user.id, token),
      getAccountantCertifications(user.id, token),
    ])
      .then(([userData, specialtiesData, certsData]) => {
        setProfileData(userData)
        setIsPublic(Boolean(userData?.isPublic))
        setSpecialties(Array.isArray(specialtiesData) ? specialtiesData : [])
        setCertifications(Array.isArray(certsData) ? certsData : [])
      })
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

  // ── Profile handlers ────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileData || !token) return
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      await updateUser(user.id, {
        bio: profileData.bio,
        yearsOfExperience: profileData.yearsOfExperience,
        hourlyRate: profileData.hourlyRate,
        location: profileData.location,
        website: profileData.website,
      }, token)
      setProfileMsg({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAddSpecialty = async () => {
    const s = specialtyInput.trim()
    if (!s || !token) return
    setAddingSpecialty(true)
    try {
      await addAccountantSpecialty(user.id, s, token)
      setSpecialties((prev) => [...prev, s])
      setSpecialtyInput('')
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to add specialty.' })
    } finally {
      setAddingSpecialty(false)
    }
  }

  const handleRemoveSpecialty = async (specialty) => {
    if (!token) return
    try {
      await removeAccountantSpecialty(user.id, specialty, token)
      setSpecialties((prev) => prev.filter((s) => s !== specialty))
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to remove specialty.' })
    }
  }

  const handleAddCertification = async () => {
    const c = certInput.trim()
    if (!c || !token) return
    setAddingCert(true)
    try {
      await addAccountantCertification(user.id, c, token)
      setCertifications((prev) => [...prev, c])
      setCertInput('')
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to add certification.' })
    } finally {
      setAddingCert(false)
    }
  }

  const handleRemoveCertification = async (cert) => {
    if (!token) return
    try {
      await removeAccountantCertification(user.id, cert, token)
      setCertifications((prev) => prev.filter((c) => c !== cert))
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to remove certification.' })
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
    <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <AnimatedBackground density="low" />
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, py: 3, width: '100%', position: 'relative', zIndex: 1 }}
      >
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>
            My Workspace
          </Typography>
        </motion.div>

      {deepLinkMessage && <Alert severity="info" sx={{ mb: 2 }}>{deepLinkMessage}</Alert>}

      {/* ══════════════════════════════════════════════════
          SECTION A — Availability toggle
         ══════════════════════════════════════════════════ */}
      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <SectionHeader
            icon={<LockOpenRoundedIcon sx={{ color: 'primary.main' }} />}
            title="Availability"
          />

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
          SECTION D — Profile (accountant bio, rate, etc.)
         ══════════════════════════════════════════════════ */}
      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <SectionHeader
            icon={<BusinessRoundedIcon sx={{ color: 'primary.main' }} />}
            title="Profile"
          />

          <Collapse in={!!profileMsg}>
            {profileMsg && (
              <Alert
                severity={profileMsg.type}
                sx={{ mb: 2 }}
                onClose={() => setProfileMsg(null)}
              >
                {profileMsg.text}
              </Alert>
            )}
          </Collapse>

          {loadingProfile ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          ) : (
            <>
              <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                  label="Bio"
                  multiline
                  minRows={2}
                  maxRows={5}
                  value={profileData?.bio || ''}
                  onChange={(e) => setProfileData((p) => ({ ...p, bio: e.target.value }))}
                  size="small"
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Years of Experience"
                    type="number"
                    value={profileData?.yearsOfExperience ?? ''}
                    onChange={(e) => setProfileData((p) => ({ ...p, yearsOfExperience: e.target.value ? Number(e.target.value) : null }))}
                    size="small"
                    sx={{ width: 200 }}
                    inputProps={{ min: 0, max: 100 }}
                  />
                  <TextField
                    label="Hourly Rate"
                    type="number"
                    value={profileData?.hourlyRate ?? ''}
                    onChange={(e) => setProfileData((p) => ({ ...p, hourlyRate: e.target.value ? Number(e.target.value) : null }))}
                    size="small"
                    sx={{ width: 200 }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    label="Location"
                    value={profileData?.location || ''}
                    onChange={(e) => setProfileData((p) => ({ ...p, location: e.target.value }))}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </Stack>
                <TextField
                  label="Website"
                  value={profileData?.website || ''}
                  onChange={(e) => setProfileData((p) => ({ ...p, website: e.target.value }))}
                  size="small"
                />
                <Box>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    startIcon={profileSaving ? <CircularProgress size={16} /> : undefined}
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </Box>
              </Stack>

              {/* Specialties */}
              <Typography fontWeight={700} sx={{ mb: 1 }}>Specialties</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                {specialties.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    onDelete={() => handleRemoveSpecialty(s)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  placeholder="Add a specialty"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  size="small"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); } }}
                />
                <IconButton
                  color="primary"
                  onClick={handleAddSpecialty}
                  disabled={addingSpecialty || !specialtyInput.trim()}
                >
                  {addingSpecialty ? <CircularProgress size={20} /> : <AddRoundedIcon />}
                </IconButton>
              </Stack>

              {/* Certifications */}
              <Typography fontWeight={700} sx={{ mt: 3, mb: 1 }}>Certifications</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                {certifications.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    onDelete={() => handleRemoveCertification(c)}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  placeholder="Add a certification"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  size="small"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCertification(); } }}
                />
                <IconButton
                  color="secondary"
                  onClick={handleAddCertification}
                  disabled={addingCert || !certInput.trim()}
                >
                  {addingCert ? <CircularProgress size={20} /> : <AddRoundedIcon />}
                </IconButton>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════
          SECTION B — Incoming work requests
         ══════════════════════════════════════════════════ */}
      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <SectionHeader
            icon={<WorkspacesRoundedIcon sx={{ color: 'primary.main' }} />}
            title="Incoming Requests"
          ></SectionHeader>

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
          <SectionHeader
            icon={<BusinessRoundedIcon sx={{ color: 'secondary.main' }} />}
            title="Working With"
          />

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
    </Box>
  )
}
