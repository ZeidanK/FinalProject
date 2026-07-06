import { useEffect, useMemo, useState } from 'react'
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
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import SectionHeader from '../components/SectionHeader'
import AnimatedBackground from '../components/AnimatedBackground'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useConfirm } from '../components/ConfirmContext'
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

const cardSx = {
  borderRadius: 3.5,
  border: '1px solid rgba(129, 191, 255, 0.12)',
  background: 'rgba(14, 24, 45, 0.65)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
}

const sectionHeader = (icon, title) => (
  <SectionHeader icon={icon} title={title} />
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

const passwordFieldMeta = {
  current: { label: 'Current Password', formKey: 'currentPassword' },
  new: { label: 'New Password', formKey: 'newPassword' },
  confirm: { label: 'Confirm New Password', formKey: 'confirmPassword' },
}

/**
 * ProfilePage is the user settings page where profile data, password changes,
 * company management, and company selection are handled.
 *
 * The page supports business owners and accountants with separate sections
 * for managing companies and choosing an active company.
 *
 * @returns {JSX.Element} Profile page content.
 */
export default function ProfilePage() {
  const { user, token, updateUser: updateAuthUser } = useAuth()
  const {
    refreshCompanies,
    companies,
    loadingCompanies: loadingCompaniesFromContext,
  } = useCompany()
  const location = useLocation()
  const requiresCompanySetup = Boolean(location.state?.noCompany)

  // ── Profile state ──────────────────────────────────────────
  const [profile, setProfile] = useState(null)
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
  const [editingCompanyId, setEditingCompanyId] = useState(null)
  const [companyForm, setCompanyForm] = useState({ ...emptyCompanyForm })
  const [addingCompany, setAddingCompany] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [deletingCompanyId, setDeletingCompanyId] = useState(null)
  const [companyMsg, setCompanyMsg] = useState(null)

  const { confirm } = useConfirm()

  const isBusinessOwner = useMemo(
    () => user?.role === 'business_owner' || user?.role === 'accountant_business_owner',
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

  // ── Profile picture helpers ────────────────────────────────
  /**
   * Handle a new profile picture file selection and generate a preview.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event.
   */
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
  /**
   * Validate and persist edited profile information and optional profile picture.
   * Updates auth context with new values and refreshes the profile query.
   */
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
      // Upload picture first, if changed
      let newPicture = null
      if (profilePicFile) {
        const picRes = await uploadProfilePictureMutation.mutateAsync(profilePicFile)
        newPicture = picRes.profilePicture
      }

      await updateProfileMutation.mutateAsync({
        name: parsed.data.name,
        phone: parsed.data.phone?.trim() ? parsed.data.phone.trim() : null,
      })

      // Update auth context so sidebar reflects changes
      const updates = { name: profileForm.name.trim() }
      if (newPicture) updates.profilePicture = newPicture
      updateAuthUser(updates)

      setProfilePicFile(null)
      setProfilePicPreview(null)
      setEditingProfile(false)
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
      await profileQuery.refetch()
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Change password ────────────────────────────────────────
  /**
   * Validate the password change form and perform a password update request.
   */
  const handleChangePassword = async () => {
    const parsed = passwordChangeSchema.safeParse(passwordForm)
    if (!parsed.success) {
      setPasswordMsg({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Password form is invalid.',
      })
      return
    }

    setSavingPassword(true)
    setPasswordMsg(null)

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' })
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' })
    } finally {
      setSavingPassword(false)
    }
  }

  // ── Company CRUD ───────────────────────────────────────────
  /**
   * Prepare the UI for editing an existing company record.
   *
   * @param {object} company - Company record to edit.
   */
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

  /**
   * Reset the form and switch the company section into add-new mode.
   */
  const startAddCompany = () => {
    setEditingCompanyId(null)
    setAddingCompany(true)
    setCompanyForm({ ...emptyCompanyForm })
    setCompanyMsg(null)
  }

  /**
   * Cancel any active company edit or create flow and reset form state.
   */
  const cancelCompanyEdit = () => {
    setEditingCompanyId(null)
    setAddingCompany(false)
    setCompanyMsg(null)
  }

  /**
   * Create or update a company record after validating the company form.
   */
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

  /**
   * Delete a company record and refresh the company list after confirmation.
   *
   * @param {object} company - Company record to delete.
   */
  const handleDeleteCompany = async (company) => {
    if (!company?.id) return

    const confirmed = await confirm(
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

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <AnimatedBackground density="low" />
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, py: 3, width: '100%', position: 'relative', zIndex: 1 }}
      >
      <Box>
        {requiresCompanySetup && (
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            No active company could be resolved. Create or assign a company below to continue.
          </Alert>
        )}

        {/* ── Page title ─────────────────────────────────── */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #cde7ff 0%, #58a6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Profile & Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your personal information, security, and business settings
          </Typography>
        </Box>

        {/* ══════════════════════════════════════════════════
            SECTION A — Profile Info  |  SECTION B — Change Password (side-by-side)
           ══════════════════════════════════════════════════ */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Section A */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card elevation={0} sx={{ ...cardSx, height: 'fit-content' }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                {sectionHeader(
                  <EditRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />,
                  'Personal Information',
                )}

                {loadingProfile ? (
                  <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <Skeleton variant="circular" width={100} height={100} />
                    <Skeleton variant="rounded" height={52} />
                    <Skeleton variant="rounded" height={52} />
                  </Stack>
                ) : (
                  <>
                    <Collapse in={!!profileMsg}>
                      {profileMsg && (
                        <Alert
                          severity={profileMsg.type}
                          sx={{ mb: 2.5, borderRadius: 2 }}
                          onClose={() => setProfileMsg(null)}
                        >
                          {profileMsg.text}
                        </Alert>
                      )}
                    </Collapse>

                    {/* Avatar + Upload - centered */}
                    <Stack
                      direction="row"
                      spacing={3}
                      alignItems="center"
                      sx={{ mb: 4, justifyContent: 'center' }}
                    >
                      <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                          src={avatarSrc}
                          sx={{
                            width: 100,
                            height: 100,
                            fontSize: '2.5rem',
                            bgcolor: 'primary.main',
                            color: '#041229',
                            fontWeight: 800,
                            boxShadow: '0 8px 24px rgba(88, 166, 255, 0.25)',
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
                              bottom: -6,
                              right: -6,
                              bgcolor: 'primary.main',
                              color: '#041229',
                              '&:hover': { bgcolor: 'primary.light' },
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
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
                      <Stack spacing={0.75} alignItems="center">
                        <Typography variant="h5" fontWeight={800} textAlign="center">
                          {profile?.name}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {profile?.email}
                        </Typography>
                        <Chip
                          label={roleLabel}
                          size="small"
                          sx={{
                            mt: 0.5,
                            bgcolor: 'rgba(88, 166, 255, 0.16)',
                            border: '1px solid',
                            borderColor: 'rgba(129, 191, 255, 0.38)',
                            color: '#cde7ff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            px: 1,
                          }}
                        />
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 3, borderColor: 'divider' }} />

                    {/* Editable fields */}
                    {editingProfile ? (
                      <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                          label="Full Name"
                          fullWidth
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, name: e.target.value }))
                          }
                          sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                        />
                        <TextField
                          label="Phone"
                          fullWidth
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((p) => ({ ...p, phone: e.target.value }))
                          }
                          sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                        />
                        <TextField
                          label="Email"
                          fullWidth
                          value={profile?.email || ''}
                          disabled
                          helperText="Email cannot be changed"
                          sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                        />
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1 }}>
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
                            sx={{ borderRadius: 2 }}
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
                            sx={{ borderRadius: 2 }}
                          >
                            Save Changes
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack spacing={2} sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1.5,
                            px: 2,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography color="text.secondary" sx={{ minWidth: 100, fontWeight: 500 }}>
                            Name
                          </Typography>
                          <Typography fontWeight={700} fontSize="1.05rem">
                            {profile?.name}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1.5,
                            px: 2,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography color="text.secondary" sx={{ minWidth: 100, fontWeight: 500 }}>
                            Phone
                          </Typography>
                          <Typography fontWeight={700} fontSize="1.05rem">
                            {profile?.phone || '—'}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1.5,
                            px: 2,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography color="text.secondary" sx={{ minWidth: 100, fontWeight: 500 }}>
                            Email
                          </Typography>
                          <Typography fontWeight={700} fontSize="1.05rem">
                            {profile?.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button
                            variant="contained"
                            startIcon={<EditRoundedIcon />}
                            onClick={() => setEditingProfile(true)}
                            sx={{ borderRadius: 2, px: 4, py: 1.2, fontWeight: 700 }}
                          >
                            Edit Profile
                          </Button>
                        </Box>
                      </Stack>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Section B */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card elevation={0} sx={{ ...cardSx, height: 'fit-content' }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                {sectionHeader(
                  <LockResetRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />,
                  'Change Password',
                )}

                <Collapse in={!!passwordMsg}>
                  {passwordMsg && (
                    <Alert
                      severity={passwordMsg.type}
                      sx={{ mb: 2.5, borderRadius: 2 }}
                      onClose={() => setPasswordMsg(null)}
                    >
                      {passwordMsg.text}
                    </Alert>
                  )}
                </Collapse>

                <Stack spacing={2.5} sx={{ mt: 1 }}>
                  {['current', 'new', 'confirm'].map((key) => {
                    const { label, formKey } = passwordFieldMeta[key]
                    return (
                      <Box key={key}>
                        <TextField
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
                          sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                        />
                        {key === 'new' && <PasswordStrengthMeter password={passwordForm.newPassword} />}
                      </Box>
                    )
                  })}

                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={
                        savingPassword ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <LockResetRoundedIcon />
                        )
                      }
                      disabled={savingPassword}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.3,
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: '0 4px 14px rgba(88, 166, 255, 0.35)',
                        '&:hover': {
                          boxShadow: '0 6px 20px rgba(88, 166, 255, 0.5)',
                        },
                      }}
                      onClick={handleChangePassword}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ══════════════════════════════════════════════════
            SECTION C — Business Info (business_owner roles)
           ══════════════════════════════════════════════════ */}
        {isBusinessOwner && (
          <Box>
            <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                {sectionHeader(
                  <BusinessRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />,
                  'My Companies',
                )}

                <Collapse in={!!companyMsg}>
                  {companyMsg && (
                    <Alert
                      severity={companyMsg.type}
                      sx={{ mb: 2.5, borderRadius: 2 }}
                      onClose={() => setCompanyMsg(null)}
                    >
                      {companyMsg.text}
                    </Alert>
                  )}
                </Collapse>

                {loadingCompanies ? (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Skeleton variant="rounded" height={90} sx={{ borderRadius: 2.5 }} />
                    <Skeleton variant="rounded" height={90} sx={{ borderRadius: 2.5 }} />
                  </Stack>
                ) : (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    {companies.length === 0 && !addingCompany && (
                      <Box
                        sx={{
                          textAlign: 'center',
                          py: 6,
                          px: 3,
                          borderRadius: 2.5,
                          border: '2px dashed',
                          borderColor: 'divider',
                          bgcolor: 'rgba(255,255,255,0.01)',
                        }}
                      >
                        <BusinessRoundedIcon
                          sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }}
                        />
                        <Typography color="text.secondary" sx={{ mb: 2.5, fontSize: '1.05rem' }}>
                          No companies yet
                        </Typography>
                        {!addingCompany && !editingCompanyId && (
                          <Button
                            variant="contained"
                            startIcon={<AddBusinessRoundedIcon />}
                            onClick={startAddCompany}
                            sx={{ borderRadius: 2, px: 3, py: 1.1, fontWeight: 700 }}
                          >
                            Add Your First Company
                          </Button>
                        )}
                      </Box>
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
                          <CompanyCard
                            company={c}
                            onEdit={() => startEditCompany(c)}
                            onDelete={() => handleDeleteCompany(c)}
                            deleting={deletingCompanyId === c.id}
                          />
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

                    {!addingCompany && !editingCompanyId && companies.length > 0 && (
                      <Button
                        variant="outlined"
                        startIcon={<AddBusinessRoundedIcon />}
                        sx={{ mt: 1 }}
                        onClick={startAddCompany}
                      >
                        Add Company
                      </Button>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Container>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

/**
 * CompanyCard renders a compact summary view for a company record.
 *
 * @param {object} props
 * @param {object} props.company - Company data object.
 * @param {Function} props.onEdit - Handler for edit action.
 * @param {Function} props.onDelete - Handler for delete action.
 * @param {boolean} props.deleting - Whether the company is currently being deleted.
 * @returns {JSX.Element} Company card markup.
 */
function CompanyCard({ company, onEdit, onDelete, deleting }) {
  const c = company
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(14, 22, 40, 0.5)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'rgba(88, 166, 255, 0.4)',
          bgcolor: 'rgba(88, 166, 255, 0.04)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} fontSize="1.05rem">
            {c.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {c.registrationNumber || c.registration_number
              ? `Reg: ${c.registrationNumber || c.registration_number}`
              : 'No registration number'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[c.city, c.state, c.country].filter(Boolean).join(', ') || 'No address'}
            {c.currency ? <>&nbsp;·&nbsp;{c.currency || 'USD'}</> : ''}
          </Typography>
          {(c.email || c.phone) && (
            <Typography variant="body2" color="text.secondary">
              {[c.email, c.phone].filter(Boolean).join(' · ')}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ ml: 2, flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={onEdit}
            sx={{
              color: 'primary.main',
              '&:hover': { bgcolor: 'rgba(88, 166, 255, 0.12)' },
            }}
          >
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={onDelete}
            disabled={deleting}
            sx={{ '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.12)' } }}
          >
            {deleting ? <CircularProgress size={16} /> : <DeleteOutlineRoundedIcon fontSize="small" />}
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  )
}

CompanyCard.propTypes = {
  company: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    registrationNumber: PropTypes.string,
    registration_number: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    country: PropTypes.string,
    currency: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
}

CompanyCard.defaultProps = {
  deleting: false,
}

/**
 * CompanyForm renders the create/edit company input form.
 *
 * @param {object} props
 * @param {object} props.form - Current form field values.
 * @param {Function} props.setForm - Setter for form state.
 * @param {boolean} props.saving - Loading state for the save action.
 * @param {Function} props.onSave - Callback when the save button is clicked.
 * @param {Function} props.onCancel - Callback when the cancel button is clicked.
 * @param {boolean} props.isNew - Whether the form is creating a new company.
 * @returns {JSX.Element} Company form markup.
 */
function CompanyForm({ form, setForm, saving, onSave, onCancel, isNew }) {
  /**
   * Create an onChange handler for the company form field.
   *
   * @param {string} field - Field key to update.
   * @returns {Function} Change handler for the field.
   */
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

CompanyForm.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string,
    registrationNumber: PropTypes.string,
    street: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    postalCode: PropTypes.string,
    country: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    website: PropTypes.string,
    taxId: PropTypes.string,
    vatNumber: PropTypes.string,
    currency: PropTypes.string,
  }).isRequired,
  setForm: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isNew: PropTypes.bool,
}

CompanyForm.defaultProps = {
  isNew: false,
}