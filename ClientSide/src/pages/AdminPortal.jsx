import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  Tooltip,
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
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded'
import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useTheme } from '@mui/material/styles'
import EmptyState from '../components/EmptyState'
import MetricCard from '../components/MetricCard'
import GlassCard from '../components/GlassCard'
import AnimatedBackground from '../components/AnimatedBackground'
import PageHeaderCard from '../components/PageHeaderCard'
import PageSectionLayout from '../components/PageSectionLayout'
import { useNotification } from '../context/useNotification'
import { useAuth } from '../context/useAuth'
import {
  useClearAdminAuditLogsMutation,
  useClearAdminLogsMutation,
  useDeleteAdminAuditLogMutation,
  useDeleteAdminLogMutation,
  useAdminAuditQuery,
  useAdminLogsQuery,
  useAdminStatsQuery,
  useAdminUsersQuery,
  useToggleAdminUserBanMutation,
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
]

const logCategoryOptions = [
  { value: '', label: 'All categories' },
  { value: 'api', label: 'API' },
  { value: 'security', label: 'Security' },
  { value: 'upload', label: 'Uploads' },
  { value: 'matching', label: 'Matching' },
  { value: 'realtime', label: 'Realtime' },
  { value: 'jobs', label: 'Background jobs' },
  { value: 'exception', label: 'Exceptions' },
  { value: 'ai', label: 'AI extraction' },
  { value: 'database', label: 'Database' },
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

const isNoisyAuditAction = (action) => {
  const normalized = String(action || '').toLowerCase()
  return normalized.includes('/api/realtime/') || normalized.includes('/api/notifications')
}

const parseLogDetails = (details) => {
  if (!details || typeof details !== 'string') return null

  try {
    return JSON.parse(details)
  } catch {
    return null
  }
}

const formatSystemCategory = (category) => {
  const match = logCategoryOptions.find((option) => option.value === category)
  return match?.label || category || '-'
}

const getSystemLogLevelColor = (level) => {
  if (level === 'ERROR') return 'error'
  if (level === 'WARN') return 'warning'
  return 'default'
}

const formatSystemContext = (details, fallbackDetails) => {
  if (!details) return fallbackDetails || '-'

  const statusCode = Number(details.statusCode)
  const path = String(details.path || '').toLowerCase()

  if (path.includes('/auth/login')) {
    return statusCode === 401
      ? 'Login request to the authentication service failed because the credentials were rejected.'
      : 'Login request to the authentication service failed.'
  }

  if (path.includes('/auth')) return 'Authentication request failed.'
  if (path.includes('/admin')) return 'Admin-only request failed.'
  if (path.includes('/users')) return 'User account request failed.'
  if (path.includes('/invoices/upload-pdf')) return 'Invoice PDF upload or extraction request failed.'
  if (path.includes('/invoices')) return 'Invoice request failed.'
  if (path.includes('/transactions/import-excel')) return 'Transaction Excel import failed.'
  if (path.includes('/transactions/preview-excel')) return 'Transaction Excel preview failed.'
  if (path.includes('/transactions')) return 'Transaction request failed.'
  if (path.includes('/matches') || path.includes('auto-match')) return 'Matching request failed.'
  if (path.includes('/uploadjobs')) return 'Background upload job request failed.'
  if (path.includes('/realtime')) return 'Realtime delivery request failed.'
  if (path.includes('/companies')) return 'Company request failed.'
  if (path.includes('/bankaccounts')) return 'Bank account request failed.'
  if (path.includes('/anomalies')) return 'Anomaly request failed.'
  if (path.includes('/reports')) return 'Report request failed.'

  if (statusCode === 401) return 'A request was blocked because the user was not authenticated.'
  if (statusCode === 403) return 'A request was blocked because the user does not have permission.'
  if (statusCode === 404) return 'A request failed because the requested record or route was not found.'
  if (statusCode >= 500) return 'A backend error happened while processing the request.'

  return 'A backend request failed.'
}

const formatSystemLog = (log) => {
  const details = parseLogDetails(log.details)
  const message = String(log.message || '').trim()

  if (message && !message.startsWith('HTTP ')) {
    return {
      summary: message,
      detail: formatSystemContext(details, log.details),
    }
  }

  if (!details) {
    return {
      summary: message || 'System event recorded',
      detail: log.details || '-',
    }
  }

  const statusCode = Number(details.statusCode)
  const path = String(details.path || '')

  if (statusCode === 401 && path.toLowerCase().includes('/auth/login')) {
    return {
      summary: 'Login attempt failed',
      detail: formatSystemContext(details),
    }
  }

  if (statusCode === 401) {
    return {
      summary: 'Unauthorized request was blocked',
      detail: formatSystemContext(details),
    }
  }

  if (statusCode === 403) {
    return {
      summary: 'Access was denied',
      detail: formatSystemContext(details),
    }
  }

  if (statusCode === 404) {
    return {
      summary: 'Requested resource was not found',
      detail: formatSystemContext(details),
    }
  }

  if (statusCode >= 500) {
    return {
      summary: 'Server error occurred',
      detail: formatSystemContext(details),
    }
  }

  return {
    summary: 'API request failed',
    detail: formatSystemContext(details),
  }
}

const splitAuditAction = (action) => {
  const normalized = String(action || '').trim()
  const [method = '', ...pathParts] = normalized.split(/\s+/)
  return {
    method: method.toUpperCase(),
    path: pathParts.join(' '),
  }
}

const formatEntityName = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return 'record'

  return normalized
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
}

const formatAuditAction = (log) => {
  const action = String(log?.action || '').trim()
  const normalizedAction = action.toLowerCase()
  const { method, path } = splitAuditAction(action)
  const normalizedPath = path.toLowerCase()
  const entityName = formatEntityName(log?.entityType)

  if (normalizedAction === 'auth.login') {
    return {
      label: 'User signed in',
      description: 'A user successfully logged in to the system.',
    }
  }

  if (normalizedAction === 'auth.register') {
    return {
      label: 'User registered',
      description: 'A new user account was created.',
    }
  }

  if (normalizedPath.includes('/api/invoices/upload-pdf')) {
    return {
      label: 'Uploaded invoice PDF',
      description: 'An invoice file was uploaded for processing.',
    }
  }

  if (normalizedPath.includes('/api/invoices') && method === 'POST') {
    return {
      label: 'Created invoice',
      description: 'A new invoice record was added.',
    }
  }

  if (normalizedPath.includes('/api/invoices') && (method === 'PUT' || method === 'PATCH')) {
    return {
      label: 'Updated invoice',
      description: 'Invoice details or status were changed.',
    }
  }

  if (normalizedPath.includes('/api/invoices') && method === 'DELETE') {
    return {
      label: 'Deleted invoice',
      description: 'An invoice record was removed.',
    }
  }

  if (normalizedPath.includes('/api/transactions/import-excel')) {
    return {
      label: 'Imported transactions',
      description: 'Transactions were imported from an Excel file.',
    }
  }

  if (normalizedPath.includes('/api/transactions/preview-excel')) {
    return {
      label: 'Previewed transaction import',
      description: 'A transaction Excel file was checked before import.',
    }
  }

  if (normalizedPath.includes('/api/transactions') && method === 'POST') {
    return {
      label: 'Created transaction',
      description: 'A new transaction record was added.',
    }
  }

  if (normalizedPath.includes('/api/transactions') && method === 'DELETE') {
    return {
      label: 'Deleted transaction',
      description: 'A transaction record was removed.',
    }
  }

  if (normalizedPath.includes('/api/uploadjobs/company') && method === 'DELETE') {
    return {
      label: 'Deleted company upload jobs',
      description: 'Upload history was cleared for a company.',
    }
  }

  if (normalizedPath.includes('/api/matches/auto-match')) {
    return {
      label: 'Ran automatic matching',
      description: 'The system matched invoices and transactions automatically.',
    }
  }

  if (normalizedPath.includes('/api/matches') && method === 'POST') {
    return {
      label: 'Created match',
      description: 'An invoice and transaction were matched.',
    }
  }

  if (normalizedPath.includes('/api/matches') && method === 'DELETE') {
    return {
      label: 'Deleted match',
      description: 'A match between records was removed.',
    }
  }

  if (normalizedPath.includes('/api/anomalies') && method === 'POST') {
    return {
      label: 'Created anomaly',
      description: 'A new anomaly was recorded.',
    }
  }

  if (normalizedPath.includes('/api/anomalies') && method === 'PATCH') {
    return {
      label: 'Updated anomaly',
      description: 'An anomaly was resolved or changed.',
    }
  }

  if (normalizedPath.includes('/api/companies') && method === 'POST') {
    return {
      label: 'Created company',
      description: 'A new company was added.',
    }
  }

  if (normalizedPath.includes('/api/companies') && method === 'PUT') {
    return {
      label: 'Updated company',
      description: 'Company details were changed.',
    }
  }

  if (normalizedPath.includes('/api/companies') && method === 'DELETE') {
    return {
      label: 'Deleted company',
      description: 'A company was removed.',
    }
  }

  if (normalizedPath.includes('/api/bankaccounts') && method === 'POST') {
    return {
      label: 'Created bank account',
      description: 'A bank account was added.',
    }
  }

  if (normalizedPath.includes('/api/bankaccounts') && method === 'PUT') {
    return {
      label: 'Updated bank account',
      description: 'Bank account details were changed.',
    }
  }

  if (normalizedPath.includes('/api/bankaccounts') && method === 'DELETE') {
    return {
      label: 'Deleted bank account',
      description: 'A bank account was removed.',
    }
  }

  if (normalizedPath.includes('/api/accountants') && method === 'POST') {
    return {
      label: 'Sent accountant request',
      description: 'A company access request was sent to an accountant.',
    }
  }

  if (normalizedPath.includes('/api/accountants') && method === 'PATCH') {
    return {
      label: 'Updated accountant request',
      description: 'An accountant access request was accepted or rejected.',
    }
  }

  if (normalizedPath.includes('/api/accountants') && method === 'DELETE') {
    return {
      label: 'Disconnected accountant',
      description: 'An accountant was removed from a company.',
    }
  }

  if (normalizedPath.includes('/api/users') && method === 'PATCH') {
    return {
      label: 'Updated user account',
      description: 'A user setting, password, or visibility was changed.',
    }
  }

  if (normalizedPath.includes('/api/users') && method === 'DELETE') {
    return {
      label: 'Deleted user account',
      description: 'A user account was removed.',
    }
  }

  if (method === 'POST') {
    return {
      label: `Created ${entityName}`,
      description: `A ${entityName} record was added.`,
    }
  }

  if (method === 'PUT' || method === 'PATCH') {
    return {
      label: `Updated ${entityName}`,
      description: `A ${entityName} record was changed.`,
    }
  }

  if (method === 'DELETE') {
    return {
      label: `Deleted ${entityName}`,
      description: `A ${entityName} record was removed.`,
    }
  }

  return {
    label: action || 'Audit event',
    description: 'A user action was recorded.',
  }
}

/**
 * Returns the label for the user ban toggle button.
 *
 * @param {boolean} isUpdating - Whether the toggle action is currently running.
 * @param {boolean} isBanned - Whether the user is currently banned.
 * @returns {string} Button label for the current toggle state.
 */
const getBanActionLabel = (isUpdating, isBanned) => {
  if (isUpdating) return 'Updating'
  return isBanned ? 'Unban' : 'Ban'
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
    <GlassCard variant="default" motionProps={{ variants: itemVariants }}>
      <CardContent sx={{ p: { xs: 2, md: 2.4 } }}>{children}</CardContent>
    </GlassCard>
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
  const { token, user: currentUser } = useAuth()
  const theme = useTheme()

  const [activeTab, setActiveTab] = useState(TAB_KEYS.stats)

  const [usersQuery, setUsersQuery] = useState({ page: 1, limit: 20, role: null, search: null })
  const [usersRoleInput, setUsersRoleInput] = useState('')
  const [usersSearchInput, setUsersSearchInput] = useState('')
  const [toggleLoadingUserId, setToggleLoadingUserId] = useState(null)
  const [pendingToggleUser, setPendingToggleUser] = useState(null)
  const [pendingClearLogsType, setPendingClearLogsType] = useState(null)
  const [pendingDeleteLog, setPendingDeleteLog] = useState(null)
  const [hiddenSystemLogIds, setHiddenSystemLogIds] = useState(() => new Set())
  const [hiddenAuditLogIds, setHiddenAuditLogIds] = useState(() => new Set())

  const [logsQuery, setLogsQuery] = useState({ page: 1, limit: 50, level: null, category: null })
  const [logsLevelInput, setLogsLevelInput] = useState('')
  const [logsCategoryInput, setLogsCategoryInput] = useState('')

  const [auditQuery, setAuditQuery] = useState({ page: 1, limit: 50, companyId: null })
  const [auditCompanyInput, setAuditCompanyInput] = useState('')

  const { notify } = useNotification()

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

  const toggleUserMutation = useToggleAdminUserBanMutation({ token })
  const clearLogsMutation = useClearAdminLogsMutation({ token })
  const clearAuditLogsMutation = useClearAdminAuditLogsMutation({ token })
  const deleteLogMutation = useDeleteAdminLogMutation({ token })
  const deleteAuditLogMutation = useDeleteAdminAuditLogMutation({ token })

  const stats = statsQuery.data && typeof statsQuery.data === 'object' ? statsQuery.data : null
  const statsLoading = statsQuery.isLoading || statsQuery.isFetching
  const statsError = statsQuery.error?.message || ''

  const usersData = normalizePagedResult(usersResult.data)
  const usersLoading = usersResult.isLoading || usersResult.isFetching
  const usersError = usersResult.error?.message || ''

  const logsData = normalizePagedResult(logsResult.data)
  const visibleSystemLogItems = useMemo(
    () => logsData.items.filter((log) => !hiddenSystemLogIds.has(String(log.id))),
    [hiddenSystemLogIds, logsData.items],
  )
  const logsLoading = logsResult.isLoading || logsResult.isFetching
  const logsError = logsResult.error?.message || ''

  const auditData = normalizePagedResult(auditResult.data)
  const visibleAuditItems = useMemo(
    () => auditData.items.filter((log) => !hiddenAuditLogIds.has(String(log.id)) && !isNoisyAuditAction(log.action)),
    [auditData.items, hiddenAuditLogIds],
  )
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

  const handleToggleUserBan = async (userId) => {
    if (String(userId) === String(currentUser?.id)) {
      notify({ message: 'You cannot ban your own admin account.', severity: 'warning' })
      return
    }

    setToggleLoadingUserId(userId)
    try {
      const result = await toggleUserMutation.mutateAsync({ userId })
      notify({ message: result?.message || 'User ban status updated successfully.', severity: 'success' })
    } catch (error) {
      notify({ message: error.message || 'Failed to update user ban status.', severity: 'error' })
    } finally {
      setToggleLoadingUserId(null)
    }
  }

  const handleToggleUserRequest = (user) => {
    if (String(user.id) === String(currentUser?.id)) {
      notify({ message: 'You cannot ban your own admin account.', severity: 'warning' })
      return
    }

    if (!user.isBanned) {
      setPendingToggleUser(user)
      return
    }

    handleToggleUserBan(user.id)
  }

  const handleConfirmBan = async () => {
    if (!pendingToggleUser) return
    const userId = pendingToggleUser.id
    setPendingToggleUser(null)
    await handleToggleUserBan(userId)
  }

  const handleLogsLevelChange = (value) => {
    setLogsLevelInput(value)
    setLogsQuery((prev) => ({
      ...prev,
      page: 1,
      level: value || null,
    }))
  }

  const handleLogsCategoryChange = (value) => {
    setLogsCategoryInput(value)
    setLogsQuery((prev) => ({
      ...prev,
      page: 1,
      category: value || null,
    }))
  }

  const handleLogsResetFilters = () => {
    setLogsLevelInput('')
    setLogsCategoryInput('')
    setHiddenSystemLogIds(new Set())
    setLogsQuery((prev) => ({ ...prev, page: 1, level: null, category: null }))
  }

  const handleClearLogsRequest = (type) => {
    setPendingClearLogsType(type)
  }

  const handleConfirmClearLogs = async () => {
    const type = pendingClearLogsType
    if (!type) return

    setPendingClearLogsType(null)

    try {
      const result =
        type === TAB_KEYS.logs
          ? await clearLogsMutation.mutateAsync()
          : await clearAuditLogsMutation.mutateAsync()

      if (type === TAB_KEYS.logs) {
        setLogsQuery((prev) => ({ ...prev, page: 1 }))
      } else {
        setAuditQuery((prev) => ({ ...prev, page: 1 }))
      }

      notify({ message: result?.message || 'Logs cleared.', severity: 'success' })
    } catch (error) {
      notify({ message: error.message || 'Failed to clear logs.', severity: 'error' })
    }
  }

  const handleDeleteLogRequest = (type, log) => {
    setPendingDeleteLog({ type, id: log.id })
  }

  const handleHideLog = (type, id) => {
    if (type === TAB_KEYS.logs) {
      setHiddenSystemLogIds((prev) => {
        const next = new Set(prev)
        next.add(String(id))
        return next
      })
    } else {
      setHiddenAuditLogIds((prev) => {
        const next = new Set(prev)
        next.add(String(id))
        return next
      })
    }
  }

  const handleConfirmDeleteLog = async () => {
    if (!pendingDeleteLog) return

    const { type, id } = pendingDeleteLog
    setPendingDeleteLog(null)

    try {
      const result =
        type === TAB_KEYS.logs
          ? await deleteLogMutation.mutateAsync({ id })
          : await deleteAuditLogMutation.mutateAsync({ id })

      notify({ message: result?.message || 'Log entry deleted.', severity: 'success' })
    } catch (error) {
      notify({ message: error.message || 'Failed to delete log entry.', severity: 'error' })
    }
  }

  const handleAuditCompanyInputChange = (value) => {
    const parsedCompanyId = Number(value)
    const hasValidCompanyId =
      value.trim() !== '' && Number.isFinite(parsedCompanyId) && parsedCompanyId > 0

    setAuditCompanyInput(value)
    setAuditQuery((prev) => ({
      ...prev,
      page: 1,
      companyId: hasValidCompanyId ? parsedCompanyId : null,
    }))
  }

  const handleAuditResetFilters = () => {
    setAuditCompanyInput('')
    setHiddenAuditLogIds(new Set())
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
                  <Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} />
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

            {!statsLoading && stats && (
              <>
                {statsCards.map((card) => (
                  <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard
                      title={card.label}
                      value={Number(card.value).toLocaleString()}
                    />
                  </Grid>
                ))}
                <Grid size={{ xs: 12, md: 6 }}>
                  <GlassCard variant="elevated">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Platform Activity</Typography>
                      <Box sx={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                          <BarChart data={[
                            { name: 'Users', active: stats?.activeUsers ?? 0, total: (stats?.totalUsers ?? 0) - (stats?.activeUsers ?? 0) },
                            { name: 'Companies', active: stats?.activeCompanies ?? 0, total: (stats?.totalCompanies ?? 0) - (stats?.activeCompanies ?? 0) },
                          ]} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis dataKey="name" stroke={theme.palette.text.disabled} tick={{ fontSize: 12 }} />
                            <YAxis stroke={theme.palette.text.disabled} tick={{ fontSize: 12 }} />
                            <RechartsTooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                            <Bar dataKey="active" fill={theme.palette.success.main} name="Active" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="total" fill={theme.palette.primary.main} name="Total" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </GlassCard>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <GlassCard variant="elevated">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Workload Summary</Typography>
                      <Box sx={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={[
                              { name: 'Invoices', value: stats?.totalInvoices ?? 0, color: theme.palette.primary.main },
                              { name: 'Transactions', value: stats?.totalTransactions ?? 0, color: theme.palette.info.main },
                              { name: 'Matches', value: stats?.totalMatches ?? 0, color: theme.palette.success.main },
                              { name: 'Anomalies', value: stats?.openAnomalies ?? 0, color: theme.palette.warning.main },
                            ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                              {[
                                { name: 'Invoices', value: stats?.totalInvoices ?? 0, color: theme.palette.primary.main },
                                { name: 'Transactions', value: stats?.totalTransactions ?? 0, color: theme.palette.info.main },
                                { name: 'Matches', value: stats?.totalMatches ?? 0, color: theme.palette.success.main },
                                { name: 'Anomalies', value: stats?.openAnomalies ?? 0, color: theme.palette.warning.main },
                              ].map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </GlassCard>
                </Grid>
              </>
            )}
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
                    usersData.items.map((user) => {
                      const isCurrentUser = String(user.id) === String(currentUser?.id)
                      const isToggleLoading = toggleLoadingUserId === user.id

                      return (
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
                              color={user.isBanned ? 'error' : user.isActive ? 'success' : 'default'}
                              label={user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
                            />
                          </TableCell>
                          <TableCell>{user.emailVerified ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{formatDateTime(user.lastLoginAt)}</TableCell>
                          <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                          <TableCell align="right">
                            <Tooltip
                              title={isCurrentUser ? 'You cannot deactivate your own admin account.' : ''}
                            >
                              <span>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={isCurrentUser || isToggleLoading || usersLoading}
                                  onClick={() => handleToggleUserRequest(user)}
                                  startIcon={isToggleLoading ? <AutorenewRoundedIcon /> : undefined}
                                >
                                  {getBanActionLabel(isToggleLoading, user.isBanned)}
                                </Button>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
                onChange={(event) => handleLogsLevelChange(event.target.value)}
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
                select
                label="Category"
                value={logsCategoryInput}
                onChange={(event) => handleLogsCategoryChange(event.target.value)}
                size="small"
                sx={{ minWidth: { md: 220 } }}
              >
                {logCategoryOptions.map((option) => (
                  <MenuItem key={option.value || 'all-categories'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearRoundedIcon />}
                onClick={handleLogsResetFilters}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepRoundedIcon />}
                disabled={clearLogsMutation.isPending || logsLoading}
                onClick={() => handleClearLogsRequest(TAB_KEYS.logs)}
              >
                Clear system logs
              </Button>
            </Stack>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Summary</TableCell>
                    <TableCell>Technical context</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsLoading &&
                    Array.from({ length: 6 }, (_, index) => index).map((index) => (
                      <TableRow key={`logs-loading-${index}`}>
                        <TableCell colSpan={9}>
                          <Skeleton variant="rounded" height={24} />
                        </TableCell>
                      </TableRow>
                    ))}

                  {!logsLoading && visibleSystemLogItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <EmptyState
                          title="No system health events found"
                          description="This is normal when there are no warnings or errors for the selected filters."
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {!logsLoading &&
                    visibleSystemLogItems.map((log) => {
                      const display = formatSystemLog(log)

                      return (
                        <TableRow key={log.id} hover>
                          <TableCell>{log.id}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={getSystemLogLevelColor(log.level)}
                              label={log.level || '-'}
                            />
                          </TableCell>
                          <TableCell>{formatSystemCategory(log.category)}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{display.summary}</Typography>
                          </TableCell>
                          <TableCell title={log.details || ''}>{truncateText(display.detail, 90)}</TableCell>
                          <TableCell>{log.userId ?? '-'}</TableCell>
                          <TableCell>{log.ipAddress || '-'}</TableCell>
                          <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                onClick={() => handleHideLog(TAB_KEYS.logs, log.id)}
                              >
                                Hide
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteSweepRoundedIcon />}
                                disabled={deleteLogMutation.isPending}
                                onClick={() => handleDeleteLogRequest(TAB_KEYS.logs, log)}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
                onChange={(event) => handleAuditCompanyInputChange(event.target.value)}
                size="small"
                sx={{ minWidth: { md: 260 } }}
              />
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearRoundedIcon />}
                onClick={handleAuditResetFilters}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepRoundedIcon />}
                disabled={clearAuditLogsMutation.isPending || auditLoading}
                onClick={() => handleClearLogsRequest(TAB_KEYS.audit)}
              >
                Clear audit logs
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
                    <TableCell>IP</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLoading &&
                    Array.from({ length: 6 }, (_, index) => index).map((index) => (
                      <TableRow key={`audit-loading-${index}`}>
                        <TableCell colSpan={8}>
                          <Skeleton variant="rounded" height={24} />
                        </TableCell>
                      </TableRow>
                    ))}

                  {!auditLoading && visibleAuditItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState
                          title="No audit logs found"
                          description="No audit events matched your current filters."
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {!auditLoading &&
                    visibleAuditItems.map((log) => {
                      const actionDisplay = formatAuditAction(log)

                      return (
                        <TableRow key={log.id} hover>
                          <TableCell>{log.id}</TableCell>
                          <TableCell>
                            <Stack spacing={0.35}>
                              <Chip
                                size="small"
                                label={actionDisplay.label}
                                sx={{ alignSelf: 'flex-start', maxWidth: 280 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {actionDisplay.description}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            {log.entityType || '-'}
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
                          <TableCell>{log.ipAddress || '-'}</TableCell>
                          <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                onClick={() => handleHideLog(TAB_KEYS.audit, log.id)}
                              >
                                Hide
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteSweepRoundedIcon />}
                                disabled={deleteAuditLogMutation.isPending}
                                onClick={() => handleDeleteLogRequest(TAB_KEYS.audit, log)}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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

      <Dialog
        open={Boolean(pendingClearLogsType)}
        onClose={() => setPendingClearLogsType(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Clear {pendingClearLogsType === TAB_KEYS.audit ? 'audit logs' : 'system logs'}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all{' '}
            {pendingClearLogsType === TAB_KEYS.audit ? 'audit log' : 'system log'} entries from the
            database. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingClearLogsType(null)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClearLogs}
            color="error"
            variant="contained"
            disabled={clearLogsMutation.isPending || clearAuditLogsMutation.isPending}
          >
            Clear logs
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingDeleteLog)}
        onClose={() => setPendingDeleteLog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Delete {pendingDeleteLog?.type === TAB_KEYS.audit ? 'audit log' : 'system log'} entry?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete log entry #{pendingDeleteLog?.id}. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDeleteLog(null)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteLog}
            color="error"
            variant="contained"
            disabled={deleteLogMutation.isPending || deleteAuditLogMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingToggleUser)}
        onClose={() => setPendingToggleUser(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Ban user?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently ban {pendingToggleUser?.name || pendingToggleUser?.email || 'this user'} from
            accessing the system. A banned user cannot log back in.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingToggleUser(null)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmBan} color="error" variant="contained">
            Ban
          </Button>
        </DialogActions>
      </Dialog>
    </PageSectionLayout>
  )
}

export default AdminPortalPage
