import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded'
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { getUserById, updateUser, changePassword, uploadProfilePicture } from '../services/users'
import { getCompaniesByUser, createCompany, updateCompany } from '../services/companies'

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

const sectionHeader = (icon, title) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
    {icon}
    <Typography variant="h6" fontWeight={700}>
      {title}
    </Typography>
  </Stack>
)

const emptyCompanyForm = {
  name: '',
  registrationNumber: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
  email: '',
  phone: '',
  website: '',
  taxId: '',
  vatNumber: '',
  currency: 'USD',
}

export default function ProfilePage() {
  const { user, token, updateUser: updateAuthUser } = useAuth()

  // ── Profile state ──────────────────────────────────────────
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [profilePicFile, setProfilePicFile] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  // ── Password state ─────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(null)

  // ── Companies state ────────────────────────────────────────
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [editingCompanyId, setEditingCompanyId] = useState(null)
  const [companyForm, setCompanyForm] = useState({ ...emptyCompanyForm })
  const [addingCompany, setAddingCompany] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyMsg, setCompanyMsg] = useState(null)

  const isBusinessOwner = useMemo(
    () => user?.role === 'business_owner' || user?.role === 'accountant_business_owner',
    [user?.role],
  )

  const isAccountant = useMemo(
    () => user?.role === 'accountant' || user?.role === 'accountant_business_owner',
    [user?.role],
  )

  const roleLabel = useMemo(() => {
    if (!user?.role) return 'Unknown'
    if (user.role === 'accountant_business_owner') return 'Accountant + Business Owner'
    if (user.role === 'business_owner') return 'Business Owner'
    if (user.role === 'accountant') return 'Accountant'
    return user.role
  }, [user?.role])

  // ── Load profile and companies ─────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.id || !token) return
    try {
      const data = await getUserById(user.id, token)
      setProfile(data)
      setProfileForm({ name: data.name || '', phone: data.phone || '' })
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoadingProfile(false)
    }
  }, [user?.id, token])

  const fetchCompanies = useCallback(async () => {
    if (!user?.id || !token) return
    try {
      const data = await getCompaniesByUser(user.id, token)
      setCompanies(data || [])
    } catch (err) {
      console.error('Failed to load companies:', err)
    } finally {
      setLoadingCompanies(false)
    }
  }, [user?.id, token])

  useEffect(() => {
    fetchProfile()
    fetchCompanies()
  }, [fetchProfile, fetchCompanies])

  // ── Profile picture helpers ────────────────────────────────
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfilePicFile(file)
    const reader = new FileReader()
    reader.onload = () => setProfilePicPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const avatarSrc = useMemo(() => {
    if (profilePicPreview) return profilePicPreview
    if (profile?.profilePicture) return `${API_BASE}/${profile.profilePicture}`
    return undefined
  }, [profilePicPreview, profile?.profilePicture])

  // ── Save profile ───────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty.' })
      return
    }

    setSavingProfile(true)
    setProfileMsg(null)

    try {
      // Upload picture first, if changed
      let newPicture = null
      if (profilePicFile) {
        const picRes = await uploadProfilePicture(user.id, profilePicFile, token)
        newPicture = picRes.profilePicture
      }

      await updateUser(user.id, {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || null,
      }, token)

      // Update auth context so sidebar reflects changes
      const updates = { name: profileForm.name.trim() }
      if (newPicture) updates.profilePicture = newPicture
      updateAuthUser(updates)

      setProfilePicFile(null)
      setProfilePicPreview(null)
      setEditingProfile(false)
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
      fetchProfile()
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All fields are required.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setSavingPassword(true)
    setPasswordMsg(null)

    try {
      await changePassword(user.id, { currentPassword, newPassword }, token)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' })
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' })
    } finally {
      setSavingPassword(false)
    }
  }

  // ── Company CRUD ───────────────────────────────────────────
  const startEditCompany = (company) => {
    setEditingCompanyId(company.id)
    setAddingCompany(false)
    setCompanyForm({
      name: company.name || '',
      registrationNumber: company.registrationNumber || company.registration_number || '',
      street: company.street || '',
      city: company.city || '',
      state: company.state || '',
      postalCode: company.postalCode || company.postal_code || '',
      country: company.country || 'USA',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      taxId: company.taxId || company.tax_id || '',
      vatNumber: company.vatNumber || company.vat_number || '',
      currency: company.currency || 'USD',
    })
    setCompanyMsg(null)
  }

  const startAddCompany = () => {
    setEditingCompanyId(null)
    setAddingCompany(true)
    setCompanyForm({ ...emptyCompanyForm })
    setCompanyMsg(null)
  }

  const cancelCompanyEdit = () => {
    setEditingCompanyId(null)
    setAddingCompany(false)
    setCompanyMsg(null)
  }

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim()) {
      setCompanyMsg({ type: 'error', text: 'Company name is required.' })
      return
    }

    setSavingCompany(true)
    setCompanyMsg(null)

    try {
      if (addingCompany) {
        await createCompany(
          { ...companyForm, createdByUserId: user.id },
          token,
        )
        setCompanyMsg({ type: 'success', text: 'Company created successfully.' })
      } else {
        await updateCompany(editingCompanyId, companyForm, token)
        setCompanyMsg({ type: 'success', text: 'Company updated successfully.' })
      }
      setEditingCompanyId(null)
      setAddingCompany(false)
      fetchCompanies()
    } catch (err) {
      setCompanyMsg({ type: 'error', text: err.message || 'Failed to save company.' })
    } finally {
      setSavingCompany(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  }
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32 } },
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <motion.div variants={container} initial="hidden" animate="show">
        {/* ── Page title ─────────────────────────────────── */}
        <motion.div variants={item}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>
            Profile &amp; Settings
          </Typography>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            SECTION A — Profile Info
           ══════════════════════════════════════════════════ */}
        <motion.div variants={item}>
          <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              {sectionHeader(
                <EditRoundedIcon sx={{ color: 'primary.main' }} />,
                'Personal Information',
              )}

              {loadingProfile ? (
                <Stack spacing={2}>
                  <Skeleton variant="circular" width={80} height={80} />
                  <Skeleton variant="rounded" height={48} />
                  <Skeleton variant="rounded" height={48} />
                </Stack>
              ) : (
                <>
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

                  {/* Avatar + Upload */}
                  <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={avatarSrc}
                        sx={{
                          width: 80,
                          height: 80,
                          fontSize: '2rem',
                          bgcolor: 'primary.main',
                          color: '#041229',
                          fontWeight: 800,
                        }}
                      >
                        {(profile?.name || 'U')[0].toUpperCase()}
                      </Avatar>
                      {editingProfile && (
                        <IconButton
                          component="label"
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            bgcolor: 'primary.main',
                            color: '#041229',
                            '&:hover': { bgcolor: 'primary.light' },
                          }}
                        >
                          <PhotoCameraRoundedIcon fontSize="small" />
                          <input
                            type="file"
                            hidden
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleProfilePicChange}
                          />
                        </IconButton>
                      )}
                    </Box>
                    <Stack>
                      <Typography variant="h6" fontWeight={700}>
                        {profile?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {profile?.email}
                      </Typography>
                      <Chip
                        label={roleLabel}
                        size="small"
                        sx={{
                          mt: 0.5,
                          alignSelf: 'flex-start',
                          bgcolor: 'rgba(88, 166, 255, 0.16)',
                          border: '1px solid',
                          borderColor: 'rgba(129, 191, 255, 0.38)',
                          color: '#cde7ff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Stack>
                  </Stack>

                  {/* Editable fields */}
                  {editingProfile ? (
                    <Stack spacing={2}>
                      <TextField
                        label="Full Name"
                        fullWidth
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                      <TextField
                        label="Phone"
                        fullWidth
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((p) => ({ ...p, phone: e.target.value }))
                        }
                      />
                      <TextField
                        label="Email"
                        fullWidth
                        value={profile?.email || ''}
                        disabled
                        helperText="Email cannot be changed"
                      />
                      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<CloseRoundedIcon />}
                          onClick={() => {
                            setEditingProfile(false)
                            setProfilePicFile(null)
                            setProfilePicPreview(null)
                            setProfileForm({
                              name: profile?.name || '',
                              phone: profile?.phone || '',
                            })
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={
                            savingProfile ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <SaveRoundedIcon />
                            )
                          }
                          disabled={savingProfile}
                          onClick={handleSaveProfile}
                        >
                          Save Changes
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={2}>
                        <Typography color="text.secondary" sx={{ minWidth: 100 }}>
                          Name
                        </Typography>
                        <Typography fontWeight={600}>{profile?.name}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <Typography color="text.secondary" sx={{ minWidth: 100 }}>
                          Phone
                        </Typography>
                        <Typography fontWeight={600}>
                          {profile?.phone || '—'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <Typography color="text.secondary" sx={{ minWidth: 100 }}>
                          Email
                        </Typography>
                        <Typography fontWeight={600}>{profile?.email}</Typography>
                      </Stack>
                      <Button
                        variant="outlined"
                        startIcon={<EditRoundedIcon />}
                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                        onClick={() => setEditingProfile(true)}
                      >
                        Edit Profile
                      </Button>
                    </Stack>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            SECTION B — Change Password
           ══════════════════════════════════════════════════ */}
        <motion.div variants={item}>
          <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              {sectionHeader(
                <LockResetRoundedIcon sx={{ color: 'primary.main' }} />,
                'Change Password',
              )}

              <Collapse in={!!passwordMsg}>
                {passwordMsg && (
                  <Alert
                    severity={passwordMsg.type}
                    sx={{ mb: 2 }}
                    onClose={() => setPasswordMsg(null)}
                  >
                    {passwordMsg.text}
                  </Alert>
                )}
              </Collapse>

              <Stack spacing={2} sx={{ maxWidth: 420 }}>
                {['current', 'new', 'confirm'].map((key) => {
                  const label =
                    key === 'current'
                      ? 'Current Password'
                      : key === 'new'
                        ? 'New Password'
                        : 'Confirm New Password'
                  const formKey =
                    key === 'current'
                      ? 'currentPassword'
                      : key === 'new'
                        ? 'newPassword'
                        : 'confirmPassword'
                  return (
                    <TextField
                      key={key}
                      label={label}
                      type={showPasswords[key] ? 'text' : 'password'}
                      fullWidth
                      value={passwordForm[formKey]}
                      onChange={(e) =>
                        setPasswordForm((p) => ({ ...p, [formKey]: e.target.value }))
                      }
                      slotProps={{
                        input: {
                          endAdornment: (
                            <IconButton
                              size="small"
                              onClick={() =>
                                setShowPasswords((p) => ({ ...p, [key]: !p[key] }))
                              }
                              edge="end"
                            >
                              {showPasswords[key] ? (
                                <VisibilityOffRoundedIcon fontSize="small" />
                              ) : (
                                <VisibilityRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
                          ),
                        },
                      }}
                    />
                  )
                })}

                <Button
                  variant="contained"
                  startIcon={
                    savingPassword ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <LockResetRoundedIcon />
                    )
                  }
                  disabled={savingPassword}
                  sx={{ alignSelf: 'flex-start' }}
                  onClick={handleChangePassword}
                >
                  Change Password
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            SECTION C — Business Info (business_owner roles)
           ══════════════════════════════════════════════════ */}
        {isBusinessOwner && (
          <motion.div variants={item}>
            <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                {sectionHeader(
                  <BusinessRoundedIcon sx={{ color: 'primary.main' }} />,
                  'My Companies',
                )}

                <Collapse in={!!companyMsg}>
                  {companyMsg && (
                    <Alert
                      severity={companyMsg.type}
                      sx={{ mb: 2 }}
                      onClose={() => setCompanyMsg(null)}
                    >
                      {companyMsg.text}
                    </Alert>
                  )}
                </Collapse>

                {loadingCompanies ? (
                  <Stack spacing={2}>
                    <Skeleton variant="rounded" height={80} />
                    <Skeleton variant="rounded" height={80} />
                  </Stack>
                ) : (
                  <>
                    {companies.length === 0 && !addingCompany && (
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        No companies yet. Add your first company below.
                      </Typography>
                    )}

                    {companies.map((c) => (
                      <Box key={c.id}>
                        {editingCompanyId === c.id ? (
                          <CompanyForm
                            form={companyForm}
                            setForm={setCompanyForm}
                            saving={savingCompany}
                            onSave={handleSaveCompany}
                            onCancel={cancelCompanyEdit}
                          />
                        ) : (
                          <CompanyCard company={c} onEdit={() => startEditCompany(c)} />
                        )}
                      </Box>
                    ))}

                    {addingCompany && (
                      <CompanyForm
                        form={companyForm}
                        setForm={setCompanyForm}
                        saving={savingCompany}
                        onSave={handleSaveCompany}
                        onCancel={cancelCompanyEdit}
                        isNew
                      />
                    )}

                    {!addingCompany && !editingCompanyId && (
                      <Button
                        variant="outlined"
                        startIcon={<AddBusinessRoundedIcon />}
                        sx={{ mt: 2 }}
                        onClick={startAddCompany}
                      >
                        Add Company
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            SECTION D — Accountant: Assigned Companies
           ══════════════════════════════════════════════════ */}
        {isAccountant && (
          <motion.div variants={item}>
            <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                {sectionHeader(
                  <BusinessRoundedIcon sx={{ color: 'secondary.main' }} />,
                  'Assigned Companies',
                )}

                {loadingCompanies ? (
                  <Stack spacing={2}>
                    <Skeleton variant="rounded" height={60} />
                    <Skeleton variant="rounded" height={60} />
                  </Stack>
                ) : companies.length === 0 ? (
                  <Typography color="text.secondary">
                    No companies assigned to you yet.
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
                          borderColor: 'divider',
                          bgcolor: 'rgba(14, 22, 40, 0.5)',
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Stack>
                            <Typography fontWeight={700}>{c.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {[c.city, c.country].filter(Boolean).join(', ') || 'No location'}
                              {' · '}
                              {c.currency || 'USD'}
                            </Typography>
                          </Stack>
                          <Chip
                            label={c.accessLevel || c.access_level || 'view_only'}
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
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Container>
  )
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

function CompanyCard({ company, onEdit }) {
  const c = company
  return (
    <Box
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(14, 22, 40, 0.5)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack spacing={0.5}>
          <Typography fontWeight={700}>{c.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {c.registrationNumber || c.registration_number
              ? `Reg: ${c.registrationNumber || c.registration_number}`
              : 'No registration number'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[c.city, c.state, c.country].filter(Boolean).join(', ') || 'No address'}
            {' · '}
            {c.currency || 'USD'}
          </Typography>
          {(c.email || c.phone) && (
            <Typography variant="body2" color="text.secondary">
              {[c.email, c.phone].filter(Boolean).join(' · ')}
            </Typography>
          )}
        </Stack>
        <IconButton size="small" onClick={onEdit}>
          <EditRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  )
}

function CompanyForm({ form, setForm, saving, onSave, onCancel, isNew }) {
  const handleChange = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'primary.main',
        bgcolor: 'rgba(88, 166, 255, 0.04)',
      }}
    >
      <Typography fontWeight={700} sx={{ mb: 2 }}>
        {isNew ? 'New Company' : 'Edit Company'}
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Company Name *"
            fullWidth
            value={form.name}
            onChange={handleChange('name')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Registration Number"
            fullWidth
            value={form.registrationNumber}
            onChange={handleChange('registrationNumber')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Street"
            fullWidth
            value={form.street}
            onChange={handleChange('street')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="City"
            fullWidth
            value={form.city}
            onChange={handleChange('city')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="State"
            fullWidth
            value={form.state}
            onChange={handleChange('state')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Postal Code"
            fullWidth
            value={form.postalCode}
            onChange={handleChange('postalCode')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Country"
            fullWidth
            value={form.country}
            onChange={handleChange('country')}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 0.5 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Email"
            fullWidth
            value={form.email}
            onChange={handleChange('email')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Phone"
            fullWidth
            value={form.phone}
            onChange={handleChange('phone')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Website"
            fullWidth
            value={form.website}
            onChange={handleChange('website')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Tax ID"
            fullWidth
            value={form.taxId}
            onChange={handleChange('taxId')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="VAT Number"
            fullWidth
            value={form.vatNumber}
            onChange={handleChange('vatNumber')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Currency"
            fullWidth
            value={form.currency}
            onChange={handleChange('currency')}
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2.5 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<CloseRoundedIcon />}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveRoundedIcon />
            )
          }
          disabled={saving}
          onClick={onSave}
        >
          {isNew ? 'Create Company' : 'Save Changes'}
        </Button>
      </Stack>
    </Box>
  )
}
