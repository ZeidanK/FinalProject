import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import WarningRoundedIcon from '@mui/icons-material/WarningRounded'
import PropTypes from 'prop-types'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import {
  useChangePasswordMutation,
  useCreateCompanyMutation,
  useDeleteCompanyMutation,
  useUpdateCompanyMutation,
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
  useUserProfileQuery,
} from '../hooks/queries/useProfileQueries'
import { companySchema, passwordChangeSchema, profileUpdateSchema } from '../schemas/profile'

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
  : ''

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

const passwordFieldMeta = {
  current: { label: 'Current Password', formKey: 'currentPassword' },
  new: { label: 'New Password', formKey: 'newPassword' },
  confirm: { label: 'Confirm New Password', formKey: 'confirmPassword' },
}

/**
 * ProfilePage with sidebar navigation for managing profile, security, companies, and account deletion.
 */
export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, token, updateUser: updateAuthUser, logout } = useAuth()
  const {
    refreshCompanies,
    companies,
    activeCompanyId,
    setActiveCompanyId,
    loadingCompanies: loadingCompaniesFromContext,
  } = useCompany()
  const location = useLocation()

  // ── Navigation state ──────────────────────────────────────
  const [expandedSection, setExpandedSection] = useState('personal')

  // ── Profile state ─────────────────────────────────────────
  const [profile, setProfile] = useState(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [profilePicFile, setProfilePicFile] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  // ── Password state ────────────────────────────────────────
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

  // ── Companies state ───────────────────────────────────────
  const [editingCompanyId, setEditingCompanyId] = useState(null)
  const [companyForm, setCompanyForm] = useState({ ...emptyCompanyForm })
  const [addingCompany, setAddingCompany] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [deletingCompanyId, setDeletingCompanyId] = useState(null)
  const [companyMsg, setCompanyMsg] = useState(null)

  // ── Delete Account state ──────────────────────────────────
  const [deleteAccountStep, setDeleteAccountStep] = useState(null) // null, 'verify', 'confirm'
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('')
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('')
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState('')

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

  const profileQuery = useUserProfileQuery({
    userId: user?.id,
    token,
    enabled: Boolean(user?.id && token),
  })

  const updateProfileMutation = useUpdateProfileMutation({ userId: user?.id, token })
  const uploadProfilePictureMutation = useUploadProfilePictureMutation({ userId: user?.id, token })
  const changePasswordMutation = useChangePasswordMutation({ userId: user?.id, token })
  const createCompanyMutation = useCreateCompanyMutation({ userId: user?.id, token })
  const updateCompanyMutation = useUpdateCompanyMutation({ userId: user?.id, token })
  const deleteCompanyMutation = useDeleteCompanyMutation({ userId: user?.id, token })

  const loadingProfile = profileQuery.isLoading || profileQuery.isFetching
  const loadingCompanies = loadingCompaniesFromContext

  useEffect(() => {
    if (!profileQuery.data) return
    setProfile(profileQuery.data)
    setProfileForm({
      name: profileQuery.data.name || '',
      phone: profileQuery.data.phone || '',
    })
  }, [profileQuery.data])

  // ── Profile picture handlers ───────────────────────────────
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProfilePicFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setProfilePicPreview(event.target?.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    const parsed = profileUpdateSchema.safeParse(profileForm)
    if (!parsed.success) {
      setProfileMsg({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Profile data is invalid.',
      })
      return
    }

    setSavingProfile(true)
    setProfileMsg(null)

    try {
      await updateProfileMutation.mutateAsync({
        name: parsed.data.name,
        phone: parsed.data.phone,
      })

      if (profilePicFile) {
        const formData = new FormData()
        formData.append('file', profilePicFile)
        await uploadProfilePictureMutation.mutateAsync(formData)
      }

      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
      setEditingProfile(false)
      setProfilePicFile(null)
      setProfilePicPreview(null)
      await profileQuery.refetch()
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePassword = async () => {
    const parsed = passwordChangeSchema.safeParse(passwordForm)
    if (!parsed.success) {
      setPasswordMsg({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Password validation failed.',
      })
      return
    }

    setSavingPassword(true)
    setPasswordMsg(null)

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' })
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswords({ current: false, new: false, confirm: false })
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' })
    } finally {
      setSavingPassword(false)
    }
  }

  // ── Company handlers ──────────────────────────────────────
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
    const parsed = companySchema.safeParse(companyForm)
    if (!parsed.success) {
      setCompanyMsg({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Company data is invalid.',
      })
      return
    }

    setSavingCompany(true)
    setCompanyMsg(null)

    try {
      if (addingCompany) {
        await createCompanyMutation.mutateAsync({
          ...companyForm,
          name: parsed.data.name,
        })
        setCompanyMsg({ type: 'success', text: 'Company created successfully.' })
      } else {
        await updateCompanyMutation.mutateAsync({
          companyId: editingCompanyId,
          payload: { ...companyForm, name: parsed.data.name },
        })
        setCompanyMsg({ type: 'success', text: 'Company updated successfully.' })
      }
      setEditingCompanyId(null)
      setAddingCompany(false)
      await refreshCompanies()
    } catch (err) {
      setCompanyMsg({ type: 'error', text: err.message || 'Failed to save company.' })
    } finally {
      setSavingCompany(false)
    }
  }

  const handleDeleteCompany = async (company) => {
    if (!company?.id) return

    const confirmed = globalThis.window?.confirm(
      `Delete ${company.name || 'this company'}? This will remove it from active company lists.`,
    )

    if (!confirmed) return

    setDeletingCompanyId(company.id)
    setCompanyMsg(null)

    try {
      await deleteCompanyMutation.mutateAsync(company.id)
      setCompanyMsg({ type: 'success', text: 'Company deleted successfully.' })
      if (editingCompanyId === company.id) {
        setEditingCompanyId(null)
      }
      await refreshCompanies()
    } catch (err) {
      setCompanyMsg({ type: 'error', text: err.message || 'Failed to delete company.' })
    } finally {
      setDeletingCompanyId(null)
    }
  }

  // ── Delete Account handlers ────────────────────────────────
  const handleDeleteAccountOpen = () => {
    setDeleteAccountStep('verify')
    setDeleteAccountPassword('')
    setDeleteAccountConfirmText('')
    setDeleteAccountError('')
  }

  const handleVerifyDeletePassword = async () => {
    if (!deleteAccountPassword.trim()) {
      setDeleteAccountError('Please enter your password.')
      return
    }

    setDeletingAccount(true)
    setDeleteAccountError('')

    try {
      // Try to verify password by making a request to backend
      const response = await fetch(`${API_BASE}/api/Users/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deleteAccountPassword }),
      })

      if (!response.ok) {
        throw new Error('Password is incorrect.')
      }

      setDeleteAccountStep('confirm')
      setDeleteAccountPassword('')
    } catch (err) {
      setDeleteAccountError(err.message || 'Failed to verify password.')
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleConfirmDeleteAccount = async () => {
    if (deleteAccountConfirmText !== 'DELETE') {
      setDeleteAccountError('Please type "DELETE" to confirm.')
      return
    }

    setDeletingAccount(true)
    setDeleteAccountError('')

    try {
      const response = await fetch(`${API_BASE}/api/Users/${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete account.')
      }

      // Success - logout and redirect
      setDeleteAccountStep(null)
      setDeleteAccountPassword('')
      setDeleteAccountConfirmText('')
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setDeleteAccountError(err.message || 'Failed to delete account.')
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleDeleteAccountCancel = () => {
    setDeleteAccountStep(null)
    setDeleteAccountPassword('')
    setDeleteAccountConfirmText('')
    setDeleteAccountError('')
  }

  return (
    <Box sx={{ py: 4, px: 2, display: 'flex', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: 920 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
          Profile & Settings
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Manage your account information, security settings, company details, and account preferences from one place.
        </Typography>

        <Stack spacing={2}>
          <Accordion
            expanded={expandedSection === 'personal'}
            onChange={() => setExpandedSection(expandedSection === 'personal' ? false : 'personal')}
            sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography fontWeight={700}>Personal Information</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <PersonalInfoSection
                profile={profile}
                loading={loadingProfile}
                editing={editingProfile}
                form={profileForm}
                setForm={setProfileForm}
                profilePicPreview={profilePicPreview}
                saving={savingProfile}
                message={profileMsg}
                setMessage={setProfileMsg}
                onEdit={() => setEditingProfile(true)}
                onCancel={() => {
                  setEditingProfile(false)
                  setProfilePicFile(null)
                  setProfilePicPreview(null)
                  setProfileForm({
                    name: profile?.name || '',
                    phone: profile?.phone || '',
                  })
                }}
                onSave={handleSaveProfile}
                onProfilePicChange={handleProfilePicChange}
                roleLabel={roleLabel}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedSection === 'security'}
            onChange={() => setExpandedSection(expandedSection === 'security' ? false : 'security')}
            sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography fontWeight={700}>Security</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <SecuritySection
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                showPasswords={showPasswords}
                setShowPasswords={setShowPasswords}
                saving={savingPassword}
                message={passwordMsg}
                setMessage={setPasswordMsg}
                onSave={handleSavePassword}
              />
            </AccordionDetails>
          </Accordion>

          {isBusinessOwner && (
            <Accordion
              expanded={expandedSection === 'companies'}
              onChange={() => setExpandedSection(expandedSection === 'companies' ? false : 'companies')}
              sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  <Typography fontWeight={700}>My Companies</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <CompaniesSection
                  companies={companies}
                  loading={loadingCompanies}
                  editing={editingCompanyId}
                  adding={addingCompany}
                  form={companyForm}
                  setForm={setCompanyForm}
                  saving={savingCompany}
                  deleting={deletingCompanyId}
                  message={companyMsg}
                  setMessage={setCompanyMsg}
                  onEdit={startEditCompany}
                  onAdd={startAddCompany}
                  onCancel={cancelCompanyEdit}
                  onSave={handleSaveCompany}
                  onDelete={handleDeleteCompany}
                />
              </AccordionDetails>
            </Accordion>
          )}

          <Accordion
            expanded={expandedSection === 'danger'}
            onChange={() => setExpandedSection(expandedSection === 'danger' ? false : 'danger')}
            sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main' }} />
                <Typography fontWeight={700} color="error.main">
                  Danger Zone
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <DangerZoneSection
                onDeleteAccount={handleDeleteAccountOpen}
              />
            </AccordionDetails>
          </Accordion>
        </Stack>

        <DeleteAccountDialogs
          step={deleteAccountStep}
          password={deleteAccountPassword}
          setPassword={setDeleteAccountPassword}
          showPassword={showDeletePassword}
          setShowPassword={setShowDeletePassword}
          confirmText={deleteAccountConfirmText}
          setConfirmText={setDeleteAccountConfirmText}
          error={deleteAccountError}
          loading={deletingAccount}
          onVerify={handleVerifyDeletePassword}
          onConfirm={handleConfirmDeleteAccount}
          onCancel={handleDeleteAccountCancel}
        />
      </Box>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * PersonalInfoSection - Display and edit user profile information
 */
function PersonalInfoSection({
  profile,
  loading,
  editing,
  form,
  setForm,
  profilePicPreview,
  saving,
  message,
  setMessage,
  onEdit,
  onCancel,
  onSave,
  onProfilePicChange,
  roleLabel,
}) {
  const fileInputRef = useState(null)[1]

  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Personal Information
        </Typography>

        {message && (
          <Alert
            severity={message.type}
            sx={{ mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="circular" width={100} height={100} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Stack>
        ) : (
          <>
            {/* Profile Picture Section */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Avatar
                src={profilePicPreview || (profile?.profilePicture ? `${API_BASE}${profile.profilePicture}` : '')}
                sx={{ width: 100, height: 100, bgcolor: 'primary.main' }}
              >
                {profile?.name?.[0]?.toUpperCase()}
              </Avatar>
              {editing && (
                <Stack justifyContent="center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onProfilePicChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <Button
                    size="small"
                    startIcon={<PhotoCameraRoundedIcon />}
                    variant="outlined"
                    onClick={() => fileInputRef?.click()}
                  >
                    Upload Photo
                  </Button>
                </Stack>
              )}
            </Stack>

            {!editing ? (
              <>
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Name
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {profile?.name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Email
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {profile?.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Phone
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {profile?.phone || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Role
                    </Typography>
                    <Chip label={roleLabel} size="small" sx={{ bgcolor: 'rgba(88, 166, 255, 0.12)' }} />
                  </Box>
                </Stack>

                <Button
                  variant="outlined"
                  startIcon={<EditRoundedIcon />}
                  onClick={onEdit}
                >
                  Edit Profile
                </Button>
              </>
            ) : (
              <>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Full Name"
                      fullWidth
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Phone"
                      fullWidth
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Email"
                      fullWidth
                      value={profile?.email || ''}
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<CloseRoundedIcon />}
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />}
                    disabled={saving}
                    onClick={onSave}
                  >
                    Save Changes
                  </Button>
                </Stack>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

PersonalInfoSection.propTypes = {
  profile: PropTypes.object,
  loading: PropTypes.bool,
  editing: PropTypes.bool,
  form: PropTypes.object,
  setForm: PropTypes.func,
  profilePicPreview: PropTypes.string,
  saving: PropTypes.bool,
  message: PropTypes.object,
  setMessage: PropTypes.func,
  onEdit: PropTypes.func,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  onProfilePicChange: PropTypes.func,
  roleLabel: PropTypes.string,
}

/**
 * SecuritySection - Password change form
 */
function SecuritySection({
  passwordForm,
  setPasswordForm,
  showPasswords,
  setShowPasswords,
  saving,
  message,
  setMessage,
  onSave,
}) {
  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Security
        </Typography>

        {message && (
          <Alert
            severity={message.type}
            sx={{ mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <Stack spacing={2}>
          {['current', 'new', 'confirm'].map((fieldKey) => (
            <TextField
              key={fieldKey}
              label={passwordFieldMeta[fieldKey].label}
              type={showPasswords[fieldKey] ? 'text' : 'password'}
              fullWidth
              value={passwordForm[passwordFieldMeta[fieldKey].formKey]}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  [passwordFieldMeta[fieldKey].formKey]: e.target.value,
                }))
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton
                      edge="end"
                      onClick={() =>
                        setShowPasswords((p) => ({
                          ...p,
                          [fieldKey]: !p[fieldKey],
                        }))
                      }
                      sx={{ mr: -1 }}
                    >
                      {showPasswords[fieldKey] ? (
                        <VisibilityOffRoundedIcon fontSize="small" />
                      ) : (
                        <VisibilityRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                  ),
                },
              }}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <LockResetRoundedIcon />}
            disabled={saving}
            onClick={onSave}
          >
            Change Password
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

SecuritySection.propTypes = {
  passwordForm: PropTypes.object,
  setPasswordForm: PropTypes.func,
  showPasswords: PropTypes.object,
  setShowPasswords: PropTypes.func,
  saving: PropTypes.bool,
  message: PropTypes.object,
  setMessage: PropTypes.func,
  onSave: PropTypes.func,
}

/**
 * CompaniesSection - Manage user companies
 */
function CompaniesSection({
  companies,
  loading,
  editing,
  adding,
  form,
  setForm,
  saving,
  deleting,
  message,
  setMessage,
  onEdit,
  onAdd,
  onCancel,
  onSave,
  onDelete,
}) {
  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          My Companies
        </Typography>

        {message && (
          <Alert
            severity={message.type}
            sx={{ mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={100} />
            <Skeleton variant="rounded" height={100} />
          </Stack>
        ) : (
          <>
            {companies.length === 0 && !adding && (
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No companies yet. Add your first company below.
              </Typography>
            )}

            {companies.map((c) => (
              <Box key={c.id}>
                {editing === c.id ? (
                  <CompanyForm
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    onSave={onSave}
                    onCancel={onCancel}
                  />
                ) : (
                  <CompanyCard
                    company={c}
                    onEdit={() => onEdit(c)}
                    onDelete={() => onDelete(c)}
                    deleting={deleting === c.id}
                  />
                )}
              </Box>
            ))}

            {adding && (
              <CompanyForm
                form={form}
                setForm={setForm}
                saving={saving}
                onSave={onSave}
                onCancel={onCancel}
                isNew
              />
            )}

            {!adding && editing !== null && (
              <Button
                variant="outlined"
                startIcon={<AddBusinessRoundedIcon />}
                sx={{ mt: 2 }}
                onClick={onAdd}
              >
                Add Company
              </Button>
            )}

            {!adding && editing === null && (
              <Button
                variant="outlined"
                startIcon={<AddBusinessRoundedIcon />}
                sx={{ mt: 2 }}
                onClick={onAdd}
              >
                Add Company
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

CompaniesSection.propTypes = {
  companies: PropTypes.array,
  loading: PropTypes.bool,
  editing: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  adding: PropTypes.bool,
  form: PropTypes.object,
  setForm: PropTypes.func,
  saving: PropTypes.bool,
  deleting: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  message: PropTypes.object,
  setMessage: PropTypes.func,
  onEdit: PropTypes.func,
  onAdd: PropTypes.func,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
}

/**
 * DangerZoneSection - Delete account action
 */
function DangerZoneSection({ onDeleteAccount }) {
  return (
    <Card elevation={0} sx={{ bgcolor: 'rgba(239, 83, 80, 0.08)', border: '2px solid', borderColor: '#ef5350' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#ef5350' }}>
          Danger Zone
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Actions that disable your account while preserving data for possible reactivation.
        </Typography>

        <Stack spacing={2}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid #ef5350' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Delete Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This will soft-delete your account and preserve your data in case you need to reactivate it later.
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={onDeleteAccount}
            >
              Soft Delete Account
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

DangerZoneSection.propTypes = {
  onDeleteAccount: PropTypes.func,
}

/**
 * DeleteAccountDialogs - Multi-step delete account confirmation
 */
function DeleteAccountDialogs({
  step,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  confirmText,
  setConfirmText,
  error,
  loading,
  onVerify,
  onConfirm,
  onCancel,
}) {
  return (
    <>
      {/* Password Verification Dialog */}
      <Dialog open={step === 'verify'} onClose={onCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Verify Your Identity</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter your password to continue.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPassword('')}>
              {error}
            </Alert>
          )}
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    edge="end"
                    onClick={() => setShowPassword(!showPassword)}
                    sx={{ mr: -1 }}
                  >
                    {showPassword ? (
                      <VisibilityOffRoundedIcon fontSize="small" />
                    ) : (
                      <VisibilityRoundedIcon fontSize="small" />
                    )}
                  </IconButton>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onVerify}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <Dialog open={step === 'confirm'} onClose={onCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ef5350' }}>
          <WarningRoundedIcon /> Confirm Account Deactivation
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Your account will be disabled, but your data will remain intact for reactivation.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
            This will soft-delete:
          </Typography>
          <ul style={{ margin: '0 0 16px 0', paddingLeft: 20 }}>
            <li><Typography variant="body2">Your account record</Typography></li>
            <li><Typography variant="body2">Your profile settings and access</Typography></li>
            <li><Typography variant="body2">Your associations with companies</Typography></li>
            <li><Typography variant="body2">Your history and uploaded data</Typography></li>
          </ul>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 1 }}>
            Type <strong>"DELETE"</strong> to confirm:
          </Typography>
          <TextField
            fullWidth
            placeholder='Type "DELETE"'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={onConfirm}
            disabled={loading || confirmText !== 'DELETE'}
          >
            {loading ? <CircularProgress size={20} /> : 'Deactivate Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

DeleteAccountDialogs.propTypes = {
  step: PropTypes.oneOf([null, 'verify', 'confirm']),
  password: PropTypes.string,
  setPassword: PropTypes.func,
  showPassword: PropTypes.bool,
  setShowPassword: PropTypes.func,
  confirmText: PropTypes.string,
  setConfirmText: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool,
  onVerify: PropTypes.func,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
}

// ─────────────────────────────────────────────────────────────
// Company Sub-components (CompanyCard & CompanyForm)
// ─────────────────────────────────────────────────────────────

function CompanyCard({ company, onEdit, onDelete, deleting }) {
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
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={onEdit}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={onDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={16} /> : <DeleteOutlineRoundedIcon fontSize="small" />}
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  )
}

CompanyCard.propTypes = {
  company: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  deleting: PropTypes.bool,
}

function CompanyForm({ form, setForm, saving, onSave, onCancel, isNew }) {
  const [expandedSections, setExpandedSections] = useState({
    address: false,
    financial: false,
  })

  const handleChange = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const toggleSection = (section) => {
    setExpandedSections((p) => ({ ...p, [section]: !p[section] }))
  }

  return (
    <Box
      sx={{
        p: 3,
        mb: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'primary.main',
        bgcolor: 'rgba(88, 166, 255, 0.04)',
      }}
    >
      <Typography fontWeight={700} sx={{ mb: 2.5, fontSize: '1.1rem' }}>
        {isNew ? '+ Add New Company' : 'Edit Company'}
      </Typography>

      {/* Essential Information */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5, fontWeight: 600 }}>
          Essential Information
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Company Name"
              placeholder="Enter company name"
              fullWidth
              required
              value={form.name}
              onChange={handleChange('name')}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Email"
              placeholder="company@example.com"
              fullWidth
              required
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Phone"
              placeholder="+1 (555) 000-0000"
              fullWidth
              value={form.phone}
              onChange={handleChange('phone')}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Website"
              placeholder="https://example.com"
              fullWidth
              value={form.website}
              onChange={handleChange('website')}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Country"
              placeholder="USA"
              fullWidth
              value={form.country}
              onChange={handleChange('country')}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Currency"
              placeholder="USD"
              fullWidth
              value={form.currency}
              onChange={handleChange('currency')}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Address Details */}
      <Box sx={{ mb: 2 }}>
        <Box
          onClick={() => toggleSection('address')}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1,
            px: 1.5,
            borderRadius: 1,
            bgcolor: expandedSections.address ? 'rgba(88, 166, 255, 0.08)' : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(88, 166, 255, 0.08)',
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Address Details
          </Typography>
          <ExpandMoreRoundedIcon
            sx={{
              transform: expandedSections.address ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: 'text.secondary',
            }}
          />
        </Box>
        <Collapse in={expandedSections.address}>
          <Box sx={{ pt: 1.5, px: 1.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Street"
                  placeholder="123 Main Street"
                  fullWidth
                  value={form.street}
                  onChange={handleChange('street')}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="City"
                  placeholder="New York"
                  fullWidth
                  value={form.city}
                  onChange={handleChange('city')}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="State"
                  placeholder="NY"
                  fullWidth
                  value={form.state}
                  onChange={handleChange('state')}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Postal Code"
                  placeholder="10001"
                  fullWidth
                  value={form.postalCode}
                  onChange={handleChange('postalCode')}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Box>

      {/* Financial Details */}
      <Box sx={{ mb: 2.5 }}>
        <Box
          onClick={() => toggleSection('financial')}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1,
            px: 1.5,
            borderRadius: 1,
            bgcolor: expandedSections.financial ? 'rgba(88, 166, 255, 0.08)' : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(88, 166, 255, 0.08)',
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Financial & Tax Details
          </Typography>
          <ExpandMoreRoundedIcon
            sx={{
              transform: expandedSections.financial ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: 'text.secondary',
            }}
          />
        </Box>
        <Collapse in={expandedSections.financial}>
          <Box sx={{ pt: 1.5, px: 1.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Registration Number"
                  placeholder="e.g., REG-12345"
                  fullWidth
                  value={form.registrationNumber}
                  onChange={handleChange('registrationNumber')}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Tax ID"
                  placeholder="e.g., 12-3456789"
                  fullWidth
                  value={form.taxId}
                  onChange={handleChange('taxId')}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="VAT Number"
                  placeholder="e.g., VAT-12345"
                  fullWidth
                  value={form.vatNumber}
                  onChange={handleChange('vatNumber')}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Box>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
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

CompanyForm.propTypes = {
  form: PropTypes.object,
  setForm: PropTypes.func,
  saving: PropTypes.bool,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  isNew: PropTypes.bool,
}
