import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded'
import FeedRoundedIcon from '@mui/icons-material/FeedRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import EmptyState from '../components/EmptyState'
import PageHeaderCard from '../components/PageHeaderCard'
import PageSectionLayout from '../components/PageSectionLayout'
import SnackbarAlert from '../components/SnackbarAlert'
import { useAuth } from '../context/useAuth'
import {
  useAdminAuditQuery,
  useAdminLogsQuery,
  useAdminStatsQuery,
  useAdminUsersQuery,
  useToggleAdminUserActiveMutation,
} from '../hooks/queries/useAdminQueries'
import { itemVariants } from '../utils/motionVariants'

const TAB_KEYS = {
  stats: 'stats',
  users: 'users',
  logs: 'logs',
  audit: 'audit',
}

const adminTabs = [
  { value: TAB_KEYS.stats, label: 'Stats', icon: <AdminPanelSettingsRoundedIcon fontSize="small" /> },
  { value: TAB_KEYS.users, label: 'Users', icon: <ManageAccountsRoundedIcon fontSize="small" /> },
  { value: TAB_KEYS.logs, label: 'System Logs', icon: <FeedRoundedIcon fontSize="small" /> },
  { value: TAB_KEYS.audit, label: 'Audit Logs', icon: <FactCheckRoundedIcon fontSize="small" /> },
]

const usersRoleOptions = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'business_owner', label: 'Business owner' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'accountant_business_owner', label: 'Accountant + business owner' },
]

const logLevelOptions = [
  { value: '', label: 'All levels' },
  { value: 'INFO', label: 'INFO' },
  { value: 'WARN', label: 'WARN' },
  { value: 'ERROR', label: 'ERROR' },
  { value: 'DEBUG', label: 'DEBUG' },
]

/**
 * Creates an empty paged result shape for table data.
 *
 * @returns {{totalCount: number, items: Array}} An empty paged result object.
 */
const createEmptyPaged = () => ({ totalCount: 0, items: [] })

/**
 * Normalizes a paged response object into a safe structure.
 *
 * @param {*} data - Raw response data from the server.
 * @returns {{totalCount: number, items: Array}} Normalized paged result.
 */
const normalizePagedResult = (data) => {
  if (!data || typeof data !== 'object') return createEmptyPaged()

  return {
    totalCount: Number.isFinite(Number(data.totalCount)) ? Number(data.totalCount) : 0,
    items: Array.isArray(data.items) ? data.items : [],
  }
}

/**
 * Formats a timestamp into a localized date and time string.
 *
 * @param {string|number|Date} value - Date input value.
 * @returns {string} Formatted date/time or '-' when the value is invalid.
 */
const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Truncates text to a maximum length and appends an ellipsis if needed.
 *
 * @param {*} text - Text to truncate.
 * @param {number} [maxLength=80] - Maximum length before truncation.
 * @returns {string} Truncated text or '-' when the input is empty.
 */
const truncateText = (text, maxLength = 80) => {
  if (!text) return '-'
  const normalized = String(text)
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}

/**
 * Returns the label for the user activation toggle button.
 *
 * @param {boolean} isUpdating - Whether the toggle action is currently running.
 * @param {boolean} isActive - Whether the user is currently active.
 * @returns {string} Button label for the current toggle state.
 */
const getToggleActionLabel = (isUpdating, isActive) => {
  if (isUpdating) return 'Updating'
  return isActive ? 'Deactivate' : 'Activate'
}

/**
 * Renders a tab panel only when the panel value matches the active tab.
 *
 * @param {Object} props - Component props.
 * @param {string} props.activeTab - The currently selected tab key.
 * @param {string} props.tabValue - The tab key for this panel.
 * @param {React.ReactNode} props.children - Panel contents.
 * @returns {JSX.Element|null} The rendered tab panel or null when inactive.
 */
function TabPanel({ activeTab, tabValue, children }) {
  if (activeTab !== tabValue) return null
  return <Box sx={{ pt: 2 }}>{children}</Box>
}

TabPanel.propTypes = {
  activeTab: PropTypes.string.isRequired,
  tabValue: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

/**
 * Wraps content in a styled card section for the admin portal layout.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Section content.
 * @returns {JSX.Element} The rendered section card.
 */
function SectionCard({ children }) {
  return (
    <Card
      component={motion.div}
      variants={itemVariants}
      elevation={0}
      sx={{
        borderRadius: 3.2,
        border: '1px solid',
        borderColor: 'divider',
        background: 'rgba(11, 19, 35, 0.72)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.4 } }}>{children}</CardContent>
    </Card>
  )
}

SectionCard.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * Admin portal page for monitoring system metrics, managing users, and reviewing logs.
 *
 * This page exposes tabs for platform stats, user management, system logs, and audit events.
 * Data is loaded via React Query hooks and table filters are applied locally.
 *
 * @returns {JSX.Element} The rendered admin portal page.
 */
function AdminPortalPage() {
  const { token } = useAuth()

  const [activeTab, setActiveTab] = useState(TAB_KEYS.stats)

  const [usersQuery, setUsersQuery] = useState({ page: 1, limit: 20, role: null, search: null })
  const [usersRoleInput, setUsersRoleInput] = useState('')
  const [usersSearchInput, setUsersSearchInput] = useState('')
  const [toggleLoadingUserId, setToggleLoadingUserId] = useState(null)

  const [logsQuery, setLogsQuery] = useState({ page: 1, limit: 50, level: null, category: null })
  const [logsLevelInput, setLogsLevelInput] = useState('')
  const [logsCategoryInput, setLogsCategoryInput] = useState('')

  const [auditQuery, setAuditQuery] = useState({ page: 1, limit: 50, companyId: null })
  const [auditCompanyInput, setAuditCompanyInput] = useState('')

  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  const statsQuery = useAdminStatsQuery({
    token,
    enabled: activeTab === TAB_KEYS.stats,
  })

  const usersResult = useAdminUsersQuery({
    token,
    query: usersQuery,
    enabled: activeTab === TAB_KEYS.users,
  })

  const logsResult = useAdminLogsQuery({
    token,
    query: logsQuery,
    enabled: activeTab === TAB_KEYS.logs,
  })

  const auditResult = useAdminAuditQuery({
    token,
    query: auditQuery,
    enabled: activeTab === TAB_KEYS.audit,
  })

  const toggleUserMutation = useToggleAdminUserActiveMutation({ token })

  const stats = statsQuery.data && typeof statsQuery.data === 'object' ? statsQuery.data : null
  const statsLoading = statsQuery.isLoading || statsQuery.isFetching
  const statsError = statsQuery.error?.message || ''

  const usersData = normalizePagedResult(usersResult.data)
  const usersLoading = usersResult.isLoading || usersResult.isFetching
  const usersError = usersResult.error?.message || ''

  const logsData = normalizePagedResult(logsResult.data)
  const logsLoading = logsResult.isLoading || logsResult.isFetching
  const logsError = logsResult.error?.message || ''

  const auditData = normalizePagedResult(auditResult.data)
  const auditLoading = auditResult.isLoading || auditResult.isFetching
  const auditError = auditResult.error?.message || ''

  const handleRefresh = useCallback(() => {
    if (activeTab === TAB_KEYS.stats) {
      statsQuery.refetch()
      return
    }

    if (activeTab === TAB_KEYS.users) {
      usersResult.refetch()
      return
    }

    if (activeTab === TAB_KEYS.logs) {
      logsResult.refetch()
      return
    }

    auditResult.refetch()
  }, [activeTab, auditResult, logsResult, statsQuery, usersResult])

  const activeTabLoading = useMemo(() => {
    if (activeTab === TAB_KEYS.stats) return statsLoading
    if (activeTab === TAB_KEYS.users) return usersLoading
    if (activeTab === TAB_KEYS.logs) return logsLoading
    return auditLoading
  }, [activeTab, statsLoading, usersLoading, logsLoading, auditLoading])

  const activeTabError = useMemo(() => {
    if (activeTab === TAB_KEYS.stats) return statsError
    if (activeTab === TAB_KEYS.users) return usersError
    if (activeTab === TAB_KEYS.logs) return logsError
    return auditError
  }, [activeTab, statsError, usersError, logsError, auditError])

  const statsCards = useMemo(
    () => [
      { label: 'Total users', value: stats?.totalUsers ?? 0 },
      { label: 'Active users', value: stats?.activeUsers ?? 0 },
      { label: 'Total companies', value: stats?.totalCompanies ?? 0 },
      { label: 'Active companies', value: stats?.activeCompanies ?? 0 },
      { label: 'Total invoices', value: stats?.totalInvoices ?? 0 },
      { label: 'Total transactions', value: stats?.totalTransactions ?? 0 },
      { label: 'Total matches', value: stats?.totalMatches ?? 0 },
      { label: 'Open anomalies', value: stats?.openAnomalies ?? 0 },
    ],
    [stats],
  )

  const handleUsersApplyFilters = () => {
    setUsersQuery((prev) => ({
      ...prev,
      page: 1,
      role: usersRoleInput || null,
      search: usersSearchInput.trim() || null,
    }))
  }

  const handleUsersResetFilters = () => {
    setUsersRoleInput('')
    setUsersSearchInput('')
    setUsersQuery((prev) => ({ ...prev, page: 1, role: null, search: null }))
  }

  const handleToggleUserActive = async (userId) => {
    setToggleLoadingUserId(userId)
    try {
      const result = await toggleUserMutation.mutateAsync({ userId })
      setSnack({
        open: true,
        message: result?.message || 'User status updated successfully.',
        severity: 'success',
      })
    } catch (error) {
      setSnack({
        open: true,
        message: error.message || 'Failed to update user status.',
        severity: 'error',
      })
    } finally {
      setToggleLoadingUserId(null)
    }
  }

  const handleLogsApplyFilters = () => {
    setLogsQuery((prev) => ({
      ...prev,
      page: 1,
      level: logsLevelInput || null,
      category: logsCategoryInput.trim() || null,
    }))
  }

  const handleLogsResetFilters = () => {
    setLogsLevelInput('')
    setLogsCategoryInput('')
    setLogsQuery((prev) => ({ ...prev, page: 1, level: null, category: null }))
  }

  const handleAuditApplyFilters = () => {
    const parsedCompanyId = Number(auditCompanyInput)
    const hasValidCompanyId =
      auditCompanyInput.trim() !== '' && Number.isFinite(parsedCompanyId) && parsedCompanyId > 0

    setAuditQuery((prev) => ({
      ...prev,
      page: 1,
      companyId: hasValidCompanyId ? parsedCompanyId : null,
    }))
  }

  const handleAuditResetFilters = () => {
    setAuditCompanyInput('')
    setAuditQuery((prev) => ({ ...prev, page: 1, companyId: null }))
  }

  return (
    <PageSectionLayout>
      <PageHeaderCard
        title="Admin Portal"
        description="Monitor platform activity and manage system-level operations."
        onRefresh={handleRefresh}
        refreshDisabled={activeTabLoading}
        variants={itemVariants}
      />

      {activeTabError && (
        <Alert component={motion.div} variants={itemVariants} severity="error">
          {activeTabError}
        </Alert>
      )}

      <SectionCard>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label="Admin portal tabs"
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {adminTabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
              sx={{ textTransform: 'none', alignItems: 'center' }}
            />
          ))}
        </Tabs>

        <TabPanel activeTab={activeTab} tabValue={TAB_KEYS.stats}>
          <Grid container spacing={1.6}>
            {statsLoading &&
              Array.from({ length: 8 }, (_, index) => index).map((index) => (
                <Grid key={`stats-skeleton-${index}`} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    elevation={0}
                    sx={{ borderRadius: 2.6, border: '1px solid', borderColor: 'divider' }}
                  >
                    <CardContent>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="rounded" height={30} sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}

            {!statsLoading && !stats && (
              <Grid size={{ xs: 12 }}>
                <EmptyState
                  title="No statistics available"
                  description="No admin statistics were returned by the server."
                />
              </Grid>
            )}

            {!statsLoading &&
              stats &&
              statsCards.map((card) => (
                <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2.6,
                      border: '1px solid',
                      borderColor: 'divider',
                      background: 'linear-gradient(145deg, rgba(17,30,56,0.9), rgba(8,16,30,0.8))',
                    }}
                  >
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {card.label}
                      </Typography>
                      <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                        {Number(card.value).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        <TabPanel activeTab={activeTab} tabValue={TAB_KEYS.users}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
              <TextField
                label="Search"
                placeholder="Name or email"
                value={usersSearchInput}
                onChange={(event) => setUsersSearchInput(event.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                select
                label="Role"
                value={usersRoleInput}
                onChange={(event) => setUsersRoleInput(event.target.value)}
                size="small"
                sx={{ minWidth: { md: 220 } }}
              >
                {usersRoleOptions.map((option) => (
                  <MenuItem key={option.value || 'all-roles'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                startIcon={<SearchRoundedIcon />}
                onClick={handleUsersApplyFilters}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearRoundedIcon />}
                onClick={handleUsersResetFilters}
              >
                Reset
              </Button>
            </Stack>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Email verified</TableCell>
                    <TableCell>Last login</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersLoading &&
                    Array.from({ length: 6 }, (_, index) => index).map((index) => (
                      <TableRow key={`user-loading-${index}`}>
                        <TableCell colSpan={9}>
                          <Skeleton variant="rounded" height={24} />
                        </TableCell>
                      </TableRow>
                    ))}

                  {!usersLoading && usersData.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <EmptyState
                          title="No users found"
                          description="Try adjusting role or search filters to find matching users."
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {!usersLoading &&
                    usersData.items.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          <Chip size="small" label={user.role || '-'} />
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={user.isActive ? 'success' : 'default'}
                            label={user.isActive ? 'Active' : 'Inactive'}
                          />
                        </TableCell>
                        <TableCell>{user.emailVerified ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{formatDateTime(user.lastLoginAt)}</TableCell>
                        <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={toggleLoadingUserId === user.id || usersLoading}
                            onClick={() => handleToggleUserActive(user.id)}
                            startIcon={
                              toggleLoadingUserId === user.id ? <AutorenewRoundedIcon /> : undefined
                            }
                          >
                            {getToggleActionLabel(toggleLoadingUserId === user.id, user.isActive)}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={usersData.totalCount}
              page={Math.max(usersQuery.page - 1, 0)}
              onPageChange={(_, newPage) =>
                setUsersQuery((prev) => ({
                  ...prev,
                  page: newPage + 1,
                }))
              }
              rowsPerPage={usersQuery.limit}
              onRowsPerPageChange={(event) =>
                setUsersQuery((prev) => ({
                  ...prev,
                  limit: Number(event.target.value),
                  page: 1,
                }))
              }
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </Stack>
        </TabPanel>

        <TabPanel activeTab={activeTab} tabValue={TAB_KEYS.logs}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
              <TextField
                select
                label="Level"
                value={logsLevelInput}
                onChange={(event) => setLogsLevelInput(event.target.value)}
                size="small"
                sx={{ minWidth: { md: 200 } }}
              >
                {logLevelOptions.map((option) => (
                  <MenuItem key={option.value || 'all-levels'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Category"
                placeholder="Category name"
                value={logsCategoryInput}
                onChange={(event) => setLogsCategoryInput(event.target.value)}
                size="small"
                fullWidth
              />
              <Button
                variant="contained"
                startIcon={<SearchRoundedIcon />}
                onClick={handleLogsApplyFilters}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearRoundedIcon />}
                onClick={handleLogsResetFilters}
              >
                Reset
              </Button>
            </Stack>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsLoading &&
                    Array.from({ length: 6 }, (_, index) => index).map((index) => (
                      <TableRow key={`logs-loading-${index}`}>
                        <TableCell colSpan={8}>
                          <Skeleton variant="rounded" height={24} />
                        </TableCell>
                      </TableRow>
                    ))}

                  {!logsLoading && logsData.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState
                          title="No system logs found"
                          description="No logs matched your current filter criteria."
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {!logsLoading &&
                    logsData.items.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>
                          <Chip size="small" label={log.level || '-'} />
                        </TableCell>
                        <TableCell>{log.category || '-'}</TableCell>
                        <TableCell>{truncateText(log.message, 90)}</TableCell>
                        <TableCell title={log.details || ''}>{truncateText(log.details, 90)}</TableCell>
                        <TableCell>{log.userId ?? '-'}</TableCell>
                        <TableCell>{log.ipAddress || '-'}</TableCell>
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={logsData.totalCount}
              page={Math.max(logsQuery.page - 1, 0)}
              onPageChange={(_, newPage) =>
                setLogsQuery((prev) => ({
                  ...prev,
                  page: newPage + 1,
                }))
              }
              rowsPerPage={logsQuery.limit}
              onRowsPerPageChange={(event) =>
                setLogsQuery((prev) => ({
                  ...prev,
                  limit: Number(event.target.value),
                  page: 1,
                }))
              }
              rowsPerPageOptions={[10, 20, 50, 100, 200]}
            />
          </Stack>
        </TabPanel>

        <TabPanel activeTab={activeTab} tabValue={TAB_KEYS.audit}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
              <TextField
                label="Company ID"
                placeholder="Optional company id"
                value={auditCompanyInput}
                onChange={(event) => setAuditCompanyInput(event.target.value)}
                size="small"
                sx={{ minWidth: { md: 260 } }}
              />
              <Button
                variant="contained"
                startIcon={<SearchRoundedIcon />}
                onClick={handleAuditApplyFilters}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearRoundedIcon />}
                onClick={handleAuditResetFilters}
              >
                Reset
              </Button>
            </Stack>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Old value</TableCell>
                    <TableCell>New value</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLoading &&
                    Array.from({ length: 6 }, (_, index) => index).map((index) => (
                      <TableRow key={`audit-loading-${index}`}>
                        <TableCell colSpan={9}>
                          <Skeleton variant="rounded" height={24} />
                        </TableCell>
                      </TableRow>
                    ))}

                  {!auditLoading && auditData.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <EmptyState
                          title="No audit logs found"
                          description="No audit events matched your current filters."
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {!auditLoading &&
                    auditData.items.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>
                          <Chip size="small" label={log.action || '-'} />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.2}>
                            <Typography variant="body2">{log.entityType || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Entity ID: {log.entityId ?? '-'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.2}>
                            <Typography variant="body2">{log.userName || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              User ID: {log.userId ?? '-'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{log.companyId ?? '-'}</TableCell>
                        <TableCell title={log.oldValue || ''}>{truncateText(log.oldValue, 80)}</TableCell>
                        <TableCell title={log.newValue || ''}>{truncateText(log.newValue, 80)}</TableCell>
                        <TableCell>{log.ipAddress || '-'}</TableCell>
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={auditData.totalCount}
              page={Math.max(auditQuery.page - 1, 0)}
              onPageChange={(_, newPage) =>
                setAuditQuery((prev) => ({
                  ...prev,
                  page: newPage + 1,
                }))
              }
              rowsPerPage={auditQuery.limit}
              onRowsPerPageChange={(event) =>
                setAuditQuery((prev) => ({
                  ...prev,
                  limit: Number(event.target.value),
                  page: 1,
                }))
              }
              rowsPerPageOptions={[10, 20, 50, 100, 200]}
            />
          </Stack>
        </TabPanel>
      </SectionCard>

      <SnackbarAlert
        open={snack.open}
        message={snack.message}
        severity={snack.severity}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
      />
    </PageSectionLayout>
  )
}

export default AdminPortalPage
