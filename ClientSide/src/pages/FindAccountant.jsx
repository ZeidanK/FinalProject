import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Rating,
  Skeleton,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import WorkRoundedIcon from '@mui/icons-material/WorkRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AnimatedBackground from '../components/AnimatedBackground'
import SectionHeader from '../components/SectionHeader'
import GlassCard from '../components/GlassCard'
import EmptyState from '../components/EmptyState'
import ModalShell from '../components/ModalShell'
import { useAuth } from '../context/useAuth'
import { useCompany } from '../context/useCompany'
import { useNotification } from '../context/useNotification'
import { useConfirm } from '../components/ConfirmContext'
import { useSearchParams } from 'react-router-dom'
import {
  getPublicAccountantsPaginated,
  sendAccountantRequest,
  disconnectAccountant,
  submitAccountantReview,
} from '../services/accountants'
import { APP_CONFIG } from '../scripts/config'
import { accountantKeys } from '../queries/queryKeys'

const SKELETON_COUNT = 5

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'experience', label: 'Experience' },
  { value: 'rating', label: 'Rating' },
]

export default function FindAccountant() {
  const { user, token } = useAuth()
  const { activeCompanyId } = useCompany()
  const { notify } = useNotification()
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const searchInputRef = useRef(null)
  const debounceRef = useRef(null)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('ASC')
  const [detailAccountant, setDetailAccountant] = useState(null)

  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const targetAccountantId = useMemo(
    () => Number(searchParams.get('accountantId')) || null,
    [searchParams],
  )
  const highlightedRef = useRef(null)

  const queryKey = useMemo(
    () => ({
      companyId: activeCompanyId || null,
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch || undefined,
      sortBy,
      sortDirection,
    }),
    [activeCompanyId, page, rowsPerPage, debouncedSearch, sortBy, sortDirection],
  )

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: accountantKeys.list(queryKey),
    queryFn: () => getPublicAccountantsPaginated(queryKey, token),
    enabled: Boolean(token),
    placeholderData: (prev) => prev,
  })

  const { items = [], totalCount = 0 } = data || {}

  const sendMutation = useMutation({
    mutationFn: (accountantId) =>
      sendAccountantRequest(accountantId, activeCompanyId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountantKeys.all })
      notify({ message: 'Request sent! The accountant will be notified.', severity: 'success' })
    },
    onError: (err) => {
      notify({ message: err.message || 'Failed to send request.', severity: 'error' })
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (accountantId) =>
      disconnectAccountant(accountantId, activeCompanyId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountantKeys.all })
      notify({ message: 'Accountant removed successfully.', severity: 'success' })
    },
    onError: (err) => {
      notify({ message: err.message || 'Failed to remove accountant.', severity: 'error' })
    },
  })

  const reviewMutation = useMutation({
    mutationFn: ({ accountantId, companyId, rating, review }) =>
      submitAccountantReview(accountantId, companyId, rating, review, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountantKeys.all })
      notify({ message: 'Review submitted.', severity: 'success' })
      setReviewRating(0)
      setReviewText('')
    },
    onError: (err) => {
      notify({ message: err.message || 'Failed to submit review.', severity: 'error' })
    },
  })

  const handleSubmitReview = useCallback(() => {
    if (!detailAccountant || !activeCompanyId || reviewRating < 1) return
    setSubmittingReview(true)
    reviewMutation.mutate(
      {
        accountantId: detailAccountant.id,
        companyId: activeCompanyId,
        rating: reviewRating,
        review: reviewText.trim() || null,
      },
      { onSettled: () => setSubmittingReview(false) },
    )
  }, [detailAccountant, activeCompanyId, reviewRating, reviewText, reviewMutation])

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleChangePage = useCallback((_event, newPage) => {
    setPage(newPage)
  }, [])

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }, [])

  const toggleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'ASC' ? 'DESC' : 'ASC'))
        return prev
      }
      setSortDirection('ASC')
      return field
    })
    setPage(0)
  }, [])

  const handleSendRequest = useCallback(
    (accountantId) => {
      if (!activeCompanyId) return
      sendMutation.mutate(accountantId)
    },
    [activeCompanyId, sendMutation],
  )

  const handleDisconnect = useCallback(
    async (accountant) => {
      const confirmed = await confirm(
        `Are you sure you want to remove ${accountant.name} from the working relationship? This action cannot be undone.`,
        'Confirm removal',
      )
      if (confirmed && activeCompanyId) {
        disconnectMutation.mutate(accountant.id)
      }
    },
    [activeCompanyId, confirm, disconnectMutation],
  )

  const openDetail = useCallback((accountant) => {
    setDetailAccountant(accountant)
    setReviewRating(0)
    setReviewText('')
  }, [])

  const specialties = useMemo(
    () =>
      detailAccountant?.specialties
        ? detailAccountant.specialties.split(', ').filter(Boolean)
        : [],
    [detailAccountant],
  )

  const certifications = useMemo(
    () =>
      detailAccountant?.certifications
        ? detailAccountant.certifications.split(', ').filter(Boolean)
        : [],
    [detailAccountant],
  )

  const sortLabel = useMemo(
    () => SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Name',
    [sortBy],
  )

  const renderSkeletons = useMemo(
    () => (
      <Stack spacing={2}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={96} sx={{ borderRadius: 3 }} />
        ))}
      </Stack>
    ),
    [],
  )

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <AnimatedBackground density="low" />
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4, xl: 5 }, py: 3, width: '100%', position: 'relative', zIndex: 1 }}
      >
        <SectionHeader
          icon={<PersonSearchRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />}
          title="Find an Accountant"
          subtitle={
            !isLoading && data ? `${totalCount} accountant${totalCount !== 1 ? 's' : ''} found` : undefined
          }
        />

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <TextField
            inputRef={searchInputRef}
            placeholder="Search by name, email, or location..."
            value={search}
            onChange={handleSearchChange}
            size="small"
            sx={{ maxWidth: 360 }}
            fullWidth
          />
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
              Sort:
            </Typography>
            {SORT_OPTIONS.map((opt) => (
              <Tooltip key={opt.value} title={`Sort by ${opt.label}`}>
                <Chip
                  label={sortBy === opt.value ? `${sortLabel} ${sortDirection === 'ASC' ? '↑' : '↓'}` : opt.label}
                  variant={sortBy === opt.value ? 'filled' : 'outlined'}
                  color={sortBy === opt.value ? 'primary' : 'default'}
                  size="small"
                  onClick={() => toggleSort(opt.value)}
                  sx={{ fontWeight: sortBy === opt.value ? 700 : 400, cursor: 'pointer' }}
                />
              </Tooltip>
            ))}
          </Stack>
        </Stack>

        {isLoading && !data ? (
          renderSkeletons
        ) : isError ? (
          <EmptyState
            page="default"
            title="Failed to load accountants"
            description={error?.message || 'An unexpected error occurred.'}
            actionLabel="Retry"
            onAction={() => refetch()}
            icon={RefreshRoundedIcon}
          />
        ) : items.length === 0 ? (
          <EmptyState
            page="default"
            title={debouncedSearch ? 'No accountants match your search' : 'No public accountants available'}
            description={
              debouncedSearch
                ? 'Try adjusting your search terms or filters.'
                : 'No public accountants are available at the moment. Check back later.'
            }
            actionLabel={debouncedSearch ? 'Clear search' : undefined}
            onAction={debouncedSearch ? () => { setSearch(''); setDebouncedSearch(''); setPage(0) } : undefined}
          />
        ) : (
          <>
            <Stack spacing={2}>
              {items.map((accountant) => {
                const isHighlighted = targetAccountantId === Number(accountant.id)
                const isSending = sendMutation.isPending && sendMutation.variables === accountant.id
                const isDisconnecting = disconnectMutation.isPending && disconnectMutation.variables === accountant.id
                const specList = accountant.specialties
                  ? accountant.specialties.split(', ').filter(Boolean)
                  : []

                return (
                  <GlassCard
                    key={accountant.id}
                    variant="interactive"
                    onClick={() => openDetail(accountant)}
                    sx={{
                      borderColor: isHighlighted ? 'primary.main' : undefined,
                      boxShadow: isHighlighted ? '0 0 0 3px rgba(88,166,255,0.22)' : undefined,
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ p: 2.5 }}
                    >
                      <Avatar
                        src={
                          accountant.profilePicture
                            ? `${APP_CONFIG.serverBaseUrl}/${accountant.profilePicture}`
                            : undefined
                        }
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: 'primary.main',
                          color: '#041229',
                          fontWeight: 800,
                          fontSize: '1.3rem',
                        }}
                      >
                        {(accountant.name || 'A')[0].toUpperCase()}
                      </Avatar>

                      <Stack spacing={0.3} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>
                          {accountant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {accountant.email}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.3 }}>
                          {accountant.location && (
                            <Stack direction="row" spacing={0.3} alignItems="center">
                              <LocationOnRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {accountant.location}
                              </Typography>
                            </Stack>
                          )}
                          {accountant.yearsOfExperience != null && (
                            <Chip
                              icon={<WorkRoundedIcon sx={{ fontSize: 13 }} />}
                              label={`${accountant.yearsOfExperience} yr${accountant.yearsOfExperience !== 1 ? 's' : ''}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: 11 }}
                            />
                          )}
                          {accountant.averageRating != null && (
                            <Stack direction="row" spacing={0.3} alignItems="center">
                              <Rating
                                value={accountant.averageRating}
                                precision={0.1}
                                readOnly
                                size="small"
                                icon={<StarRoundedIcon sx={{ fontSize: 15 }} />}
                                emptyIcon={<StarRoundedIcon sx={{ fontSize: 15, opacity: 0.3 }} />}
                              />
                              <Typography variant="caption" color="text.secondary">
                                ({accountant.reviewCount})
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                        {specList.length > 0 && (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {specList.slice(0, 3).map((s) => (
                              <Chip key={s} label={s} size="small" sx={{ height: 20, fontSize: 10 }} />
                            ))}
                            {specList.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: '20px' }}>
                                +{specList.length - 3}
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </Stack>

                      <Box sx={{ flexShrink: 0 }}>
                        {accountant.requestStatus === 'active' ? (
                          <Chip
                            label="Working Together"
                            color="success"
                            variant="outlined"
                            size="small"
                            onDelete={() => handleDisconnect(accountant)}
                            deleteIcon={
                              isDisconnecting ? (
                                <CircularProgress size={12} color="inherit" />
                              ) : (
                                <CloseRoundedIcon />
                              )
                            }
                            sx={{ fontWeight: 700 }}
                          />
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
                              isSending ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <SendRoundedIcon />
                              )
                            }
                            disabled={isSending}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendRequest(accountant.id)
                            }}
                          >
                            Send Request
                          </Button>
                        )}
                      </Box>
                    </Stack>
                  </GlassCard>
                )
              })}
            </Stack>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 20, 50]}
              sx={{ mt: 2 }}
            />
          </>
        )}

        <ModalShell
          open={Boolean(detailAccountant)}
          onClose={() => setDetailAccountant(null)}
          maxWidth="sm"
          title={
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                src={
                  detailAccountant?.profilePicture
                    ? `${APP_CONFIG.serverBaseUrl}/${detailAccountant.profilePicture}`
                    : undefined
                }
                sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: '#041229', fontWeight: 800, fontSize: '1rem' }}
              >
                {(detailAccountant?.name || 'A')[0].toUpperCase()}
              </Avatar>
              <Stack>
                <Typography fontWeight={700}>{detailAccountant?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailAccountant?.email}
                </Typography>
              </Stack>
            </Stack>
          }
        >
          {detailAccountant && (
            <Stack spacing={2.5}>
              {detailAccountant.bio && (
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {detailAccountant.bio}
                </Typography>
              )}

              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                {detailAccountant.location && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationOnRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="body2">{detailAccountant.location}</Typography>
                  </Stack>
                )}
                {detailAccountant.yearsOfExperience != null && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <WorkRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="body2">{detailAccountant.yearsOfExperience} years of experience</Typography>
                  </Stack>
                )}
                {detailAccountant.averageRating != null && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Rating
                      value={detailAccountant.averageRating}
                      precision={0.1}
                      readOnly
                      size="small"
                      icon={<StarRoundedIcon sx={{ fontSize: 18 }} />}
                      emptyIcon={<StarRoundedIcon sx={{ fontSize: 18, opacity: 0.3 }} />}
                    />
                    <Typography variant="body2">
                      {detailAccountant.averageRating} ({detailAccountant.reviewCount} review{detailAccountant.reviewCount !== 1 ? 's' : ''})
                    </Typography>
                  </Stack>
                )}
                {detailAccountant.hourlyRate != null && (
                  <Typography variant="body2" color="primary">
                    ${Number(detailAccountant.hourlyRate).toFixed(2)} / hr
                  </Typography>
                )}
              </Stack>

              {detailAccountant.website && (
                <Typography variant="body2">
                  Website:{' '}
                  <Typography
                    component="a"
                    href={detailAccountant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {detailAccountant.website}
                  </Typography>
                </Typography>
              )}

              {specialties.length > 0 && (
                <Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                    <SchoolRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Specialties</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {specialties.map((s) => (
                      <Chip key={s} label={s} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {certifications.length > 0 && (
                <Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                    <SchoolRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="subtitle2" fontWeight={700}>Certifications</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {certifications.map((c) => (
                      <Chip key={c} label={c} size="small" color="success" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {['business_owner', 'accountant_business_owner', 'admin'].includes(user?.role) && activeCompanyId && (
                <Box sx={{ pt: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Submit a Review
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                    <Rating
                      value={reviewRating}
                      onChange={(_e, v) => setReviewRating(v || 0)}
                      size="small"
                      icon={<StarRoundedIcon sx={{ fontSize: 20 }} />}
                      emptyIcon={<StarRoundedIcon sx={{ fontSize: 20, opacity: 0.3 }} />}
                    />
                    {reviewRating > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {reviewRating} / 5
                      </Typography>
                    )}
                  </Stack>
                  <TextField
                    placeholder="Write your review (optional)"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    size="small"
                    multiline
                    minRows={2}
                    maxRows={4}
                    fullWidth
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewRating < 1}
                    startIcon={submittingReview ? <CircularProgress size={14} /> : undefined}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </Box>
              )}

              {detailAccountant.phone && (
                <Typography variant="body2" color="text.secondary">
                  Phone: {detailAccountant.phone}
                </Typography>
              )}

              {detailAccountant.requestStatus === 'active' && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<CloseRoundedIcon />}
                  onClick={() => {
                    setDetailAccountant(null)
                    handleDisconnect(detailAccountant)
                  }}
                >
                  Remove from company
                </Button>
              )}
            </Stack>
          )}
        </ModalShell>
      </Container>
    </Box>
  )
}
