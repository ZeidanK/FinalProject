import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import SectionHeader from '../components/SectionHeader'
import AnimatedBackground from '../components/AnimatedBackground'
import GlassCard from '../components/GlassCard'
import CompanyCard from '../components/CompanyCard'
import CompanyForm from '../components/CompanyForm'
import { APP_CONFIG } from '../scripts/config'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useConfirm } from '../components/ConfirmContext'
import {
  useAccountantProfileMutation,
  useChangePasswordMutation,
  useCreateCompanyMutation,
  useDeleteAccountMutation,
  useDeleteCompanyMutation,
  useUpdateCompanyMutation,
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
  useUserProfileQuery,
} from '../hooks/queries/useProfileQueries'
import {
  getAccountantSpecialties,
  addAccountantSpecialty,
  removeAccountantSpecialty,
  getAccountantCertifications,
  addAccountantCertification,
  removeAccountantCertification,
} from '../services/accountants'
import { companySchema, passwordChangeSchema, profileUpdateSchema, accountantProfileSchema } from '../schemas/profile'

const getProfilePictureUrl = (path) => {
  if (!path) return undefined
  return `${APP_CONFIG.apiBaseUrl.replace(/\/api\/?$/, '')}/${path}`
}

const createEmptyCompanyForm = () => ({
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
})

const PASSWORD_FIELDS = [
  { key: 'current', label: 'Current Password', formKey: 'currentPassword' },
  { key: 'new', label: 'New Password', formKey: 'newPassword' },
  { key: 'confirm', label: 'Confirm New Password', formKey: 'confirmPassword' },
]

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
  const { user, token, updateUser: updateAuthUser, logout } = useAuth()
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

  const isAccountant = useMemo(
    () => user?.role === 'accountant' || user?.role === 'accountant_business_owner',
    [user?.role],
  )

  // ── Accountant profile state ──────────────────────────────
  const [editingAccountantProfile, setEditingAccountantProfile] = useState(false)
  const [accountantProfileForm, setAccountantProfileForm] = useState({
    bio: '',
    yearsOfExperience: null,
    hourlyRate: null,
    location: '',
    website: '',
  })
  const [savingAccountantProfile, setSavingAccountantProfile] = useState(false)
  const [accountantProfileMsg, setAccountantProfileMsg] = useState(null)
  const [specialties, setSpecialties] = useState([])
  const [certifications, setCertifications] = useState([])
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [certInput, setCertInput] = useState('')
  const [addingSpecialty, setAddingSpecialty] = useState(false)
  const [addingCert, setAddingCert] = useState(false)

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

  // ── Delete account state ───────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // ── Companies state ────────────────────────────────────────
  const [editingCompanyId, setEditingCompanyId] = useState(null)
  const [companyForm, setCompanyForm] = useState(() => createEmptyCompanyForm())
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
  const deleteAccountMutation = useDeleteAccountMutation({ token })
  const accountantProfileMutation = useAccountantProfileMutation({ userId: user?.id, token })

  const navigate = useNavigate()

  const loadingProfile = profileQuery.isLoading || profileQuery.isFetching
  const loadingCompanies = loadingCompaniesFromContext

  useEffect(() => {
    if (!profileQuery.data) return
    setProfile(profileQuery.data)
    setProfileForm({
      name: profileQuery.data.name || '',
      phone: profileQuery.data.phone || '',
    })
    if (isAccountant) {
      setAccountantProfileForm({
        bio: profileQuery.data.bio || '',
        yearsOfExperience: profileQuery.data.yearsOfExperience ?? null,
        hourlyRate: profileQuery.data.hourlyRate ?? null,
        location: profileQuery.data.location || '',
        website: profileQuery.data.website || '',
      })
    }
  }, [profileQuery.data, isAccountant])

  useEffect(() => {
    if (!user?.id || !token || !isAccountant) return
    getAccountantSpecialties(user.id, token).then((data) => {
      setSpecialties(Array.isArray(data) ? data : [])
    }).catch(() => {})
    getAccountantCertifications(user.id, token).then((data) => {
      setCertifications(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [user?.id, token, isAccountant])

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
    if (profile?.profilePicture) return getProfilePictureUrl(profile.profilePicture)
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

  // ── Accountant profile handlers ────────────────────────────
  const handleSaveAccountantProfile = async () => {
    const parsed = accountantProfileSchema.safeParse(accountantProfileForm)
    if (!parsed.success) {
      setAccountantProfileMsg({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Profile data is invalid.',
      })
      return
    }

    setSavingAccountantProfile(true)
    setAccountantProfileMsg(null)

    try {
      await accountantProfileMutation.mutateAsync({
        bio: parsed.data.bio || null,
        yearsOfExperience: parsed.data.yearsOfExperience ?? null,
        hourlyRate: parsed.data.hourlyRate ?? null,
        location: parsed.data.location || null,
        website: parsed.data.website || null,
      })
      setEditingAccountantProfile(false)
      setAccountantProfileMsg({ type: 'success', text: 'Accountant profile updated.' })
    } catch (err) {
      setAccountantProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setSavingAccountantProfile(false)
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
      setAccountantProfileMsg({ type: 'error', text: err.message || 'Failed to add specialty.' })
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
      setAccountantProfileMsg({ type: 'error', text: err.message || 'Failed to remove specialty.' })
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
      setAccountantProfileMsg({ type: 'error', text: err.message || 'Failed to add certification.' })
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
      setAccountantProfileMsg({ type: 'error', text: err.message || 'Failed to remove certification.' })
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

  // ── Delete account ─────────────────────────────────────────
  /**
   * Open the delete account confirmation dialog.
   */
  const handleOpenDeleteDialog = () => {
    setDeletePassword('')
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  /**
   * Confirm and execute account deletion after password verification.
   */
  const handleConfirmDelete = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Please enter your password.')
      return
    }

    setDeletingAccount(true)
    setDeleteError(null)

    try {
      await deleteAccountMutation.mutateAsync(user.id)
      setDeleteDialogOpen(false)
      logout()
      navigate('/login')
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.')
    } finally {
      setDeletingAccount(false)
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
    setCompanyForm(createEmptyCompanyForm())
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
            component="h1"
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
            <GlassCard sx={{ height: '100%' }} role="region" aria-label="Personal Information">
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <SectionHeader
                  icon={<EditRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
                  title="Personal Information"
                />

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
                            aria-label="Upload profile picture"
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
                            aria-label="Cancel editing profile"
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
                            aria-label="Save profile changes"
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
                            aria-label="Edit profile"
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
            </GlassCard>
          </Grid>

          {/* Section B */}
          <Grid size={{ xs: 12, md: 5 }}>
            <GlassCard sx={{ height: '100%' }} role="region" aria-label="Change Password">
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <SectionHeader
                  icon={<LockResetRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
                  title="Change Password"
                />

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
                  {PASSWORD_FIELDS.map(({ key, label, formKey }) => (
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
                                aria-label={showPasswords[key] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
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
                  ))}

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

                <Divider sx={{ my: 3 }} />

                {/* ═══ Delete Account ═══ */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DeleteForeverRoundedIcon sx={{ color: 'error.main', fontSize: 22 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="error.main">
                      Delete Account
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Permanently remove your account and all associated data.
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteForeverRoundedIcon />}
                      onClick={handleOpenDeleteDialog}
                      sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>

        {/* ══════════════════════════════════════════════════
            SECTION C — Accountant Profile (accountant roles)
           ══════════════════════════════════════════════════ */}
        {isAccountant && (
          <Box sx={{ mb: 3 }}>
            <GlassCard role="region" aria-label="Accountant Profile">
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <SectionHeader
                  icon={<BusinessRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
                  title="Accountant Profile"
                />

                <Collapse in={!!accountantProfileMsg}>
                  {accountantProfileMsg && (
                    <Alert
                      severity={accountantProfileMsg.type}
                      sx={{ mb: 2.5, borderRadius: 2 }}
                      onClose={() => setAccountantProfileMsg(null)}
                    >
                      {accountantProfileMsg.text}
                    </Alert>
                  )}
                </Collapse>

                {loadingProfile ? (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Skeleton variant="rounded" height={56} />
                    <Skeleton variant="rounded" height={56} />
                  </Stack>
                ) : editingAccountantProfile ? (
                  <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField
                      label="Bio"
                      multiline
                      minRows={2}
                      maxRows={5}
                      fullWidth
                      value={accountantProfileForm.bio}
                      onChange={(e) =>
                        setAccountantProfileForm((p) => ({ ...p, bio: e.target.value }))
                      }
                      sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                    />
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Years of Experience"
                        type="number"
                        value={accountantProfileForm.yearsOfExperience ?? ''}
                        onChange={(e) =>
                          setAccountantProfileForm((p) => ({
                            ...p,
                            yearsOfExperience: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        sx={{ width: 200, '& .MuiInputBase-root': { borderRadius: 2 } }}
                        inputProps={{ min: 0, max: 100 }}
                      />
                      <TextField
                        label="Hourly Rate"
                        type="number"
                        value={accountantProfileForm.hourlyRate ?? ''}
                        onChange={(e) =>
                          setAccountantProfileForm((p) => ({
                            ...p,
                            hourlyRate: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        sx={{ width: 200, '& .MuiInputBase-root': { borderRadius: 2 } }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <TextField
                        label="Location"
                        fullWidth
                        value={accountantProfileForm.location}
                        onChange={(e) =>
                          setAccountantProfileForm((p) => ({ ...p, location: e.target.value }))
                        }
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                      />
                    </Stack>
                    <TextField
                      label="Website"
                      fullWidth
                      value={accountantProfileForm.website}
                      onChange={(e) =>
                        setAccountantProfileForm((p) => ({ ...p, website: e.target.value }))
                      }
                      sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                    />

                    <Divider sx={{ borderColor: 'divider' }} />

                    {/* Specialties */}
                    <Typography fontWeight={700}>Specialties</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
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
                    <Typography fontWeight={700} sx={{ mt: 1 }}>Certifications</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                      />
                      <IconButton
                        color="secondary"
                        onClick={handleAddCertification}
                        disabled={addingCert || !certInput.trim()}
                      >
                        {addingCert ? <CircularProgress size={20} /> : <AddRoundedIcon />}
                      </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CloseRoundedIcon />}
                        onClick={() => {
                          setEditingAccountantProfile(false)
                          setAccountantProfileForm({
                            bio: profile?.bio || '',
                            yearsOfExperience: profile?.yearsOfExperience ?? null,
                            hourlyRate: profile?.hourlyRate ?? null,
                            location: profile?.location || '',
                            website: profile?.website || '',
                          })
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={
                          savingAccountantProfile ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <SaveRoundedIcon />
                          )
                        }
                        disabled={savingAccountantProfile}
                        onClick={handleSaveAccountantProfile}
                        sx={{ borderRadius: 2 }}
                      >
                        Save Changes
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography color="text.secondary" sx={{ minWidth: 100, fontWeight: 500 }}>Bio</Typography>
                      <Typography fontWeight={700} textAlign="right" sx={{ maxWidth: 500, wordBreak: 'break-word' }}>
                        {profile?.bio || '—'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: 'divider' }}>
                        <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Experience</Typography>
                        <Typography fontWeight={700}>{profile?.yearsOfExperience ?? '—'}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: 'divider' }}>
                        <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Hourly Rate</Typography>
                        <Typography fontWeight={700}>
                          {profile?.hourlyRate != null ? `$${Number(profile.hourlyRate).toFixed(2)}` : '—'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: 'divider' }}>
                        <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Location</Typography>
                        <Typography fontWeight={700}>{profile?.location || '—'}</Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: 'divider' }}>
                      <Typography color="text.secondary" sx={{ minWidth: 100, fontWeight: 500 }}>Website</Typography>
                      <Typography fontWeight={700}>{profile?.website || '—'}</Typography>
                    </Box>

                    {specialties.length > 0 && (
                      <>
                        <Typography fontWeight={700} sx={{ mt: 1 }}>Specialties</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {specialties.map((s) => (
                            <Chip key={s} label={s} size="small" color="primary" variant="outlined" />
                          ))}
                        </Stack>
                      </>
                    )}

                    {certifications.length > 0 && (
                      <>
                        <Typography fontWeight={700} sx={{ mt: 1 }}>Certifications</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {certifications.map((c) => (
                            <Chip key={c} label={c} size="small" color="secondary" variant="outlined" />
                          ))}
                        </Stack>
                      </>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<EditRoundedIcon />}
                        onClick={() => setEditingAccountantProfile(true)}
                        sx={{ borderRadius: 2, px: 4, py: 1.2, fontWeight: 700 }}
                      >
                        Edit Profile
                      </Button>
                    </Box>
                  </Stack>
                )}
              </CardContent>
            </GlassCard>
          </Box>
        )}

        {/* ══════════════════════════════════════════════════
            SECTION D — Business Info (business_owner roles)
           ══════════════════════════════════════════════════ */}
        {isBusinessOwner && (
          <Box>
            <GlassCard sx={{ mb: 3 }} role="region" aria-label="My Companies">
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <SectionHeader
                  icon={<BusinessRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
                  title="My Companies"
                />

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
            </GlassCard>
          </Box>
        )}
      </Box>
    </Container>

      {/* ═══ Delete Account Confirmation Dialog ═══ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deletingAccount && setDeleteDialogOpen(false)}
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
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteForeverRoundedIcon color="error" />
            <Typography fontWeight={700}>Delete Account</Typography>
          </Box>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This action is permanent and cannot be undone. Enter your password to confirm.
          </Typography>
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            error={Boolean(deleteError)}
            helperText={deleteError}
            sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
            slotProps={{
              input: {
                autoFocus: true,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingAccount}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deletingAccount || !deletePassword.trim()}
            color="error"
            variant="contained"
            startIcon={
              deletingAccount ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteForeverRoundedIcon />
              )
            }
          >
            {deletingAccount ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

