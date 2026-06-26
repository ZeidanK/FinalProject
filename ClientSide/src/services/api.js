import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function registerUser(payload) {
  const response = await apiRequest(URLS.auth.register, {
    method: 'POST',
    body: payload,
  })
  return response
}

export async function loginUser(payload) {
  const response = await apiRequest(URLS.auth.login, {
    method: 'POST',
    body: payload,
  })
  return response
}

export async function validateSession(token) {
  const response = await apiRequest(URLS.auth.validate, {
    method: 'POST',
    token,
  })
  return response
}

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'

export function saveAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export function getStoredAuthSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const userRaw = localStorage.getItem(AUTH_USER_KEY)

  if (!token || !userRaw) {
    return null
  }

  try {
    return { token, user: JSON.parse(userRaw) }
  } catch {
    clearAuthSession()
    return null
  }
}

// ─── Dashboard helpers (local transforms, not network calls) ────────────────

export function mapDashboardStatsToKpis(raw) {
  if (raw == null || typeof raw !== 'object') {
    return [
      { title: 'Open Runs', value: 0, subtitle: 'Invoices pending processing' },
      { title: 'Pending Matches', value: 0, subtitle: 'Awaiting review' },
      { title: 'Exceptions', value: 0, subtitle: 'Require attention' },
      { title: 'Total Matches', value: 0, subtitle: 'Successfully matched' },
    ]
  }

  const stats = raw?.stats ?? raw

  const safeNumber = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  const openRuns = safeNumber(stats?.processingInvoices)
  const pendingMatches = safeNumber(stats?.unmatchedTransactions)
  const exceptions = safeNumber(stats?.openAnomalies)
  const totalMatches = safeNumber(stats?.totalMatches)

  return [
    { title: 'Open Runs', value: openRuns, subtitle: 'Invoices pending processing' },
    { title: 'Pending Matches', value: pendingMatches, subtitle: 'Awaiting review' },
    { title: 'Exceptions', value: exceptions, subtitle: 'Require attention' },
    { title: 'Total Matches', value: totalMatches, subtitle: 'Successfully matched' },
  ]
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function getUserById(userId, token) {
  const response = await apiRequest(URLS.users.byId(userId), { token })
  return response
}

export async function updateUser(userId, payload, token) {
  const response = await apiRequest(URLS.users.byId(userId), {
    method: 'PUT',
    body: payload,
    token,
  })
  return response
}

export async function changePassword(userId, payload, token) {
  const response = await apiRequest(URLS.users.changePassword(userId), {
    method: 'PATCH',
    body: payload,
    token,
  })
  return response
}

export async function uploadProfilePicture(userId, file, token) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiRequest(URLS.users.profilePicture(userId), {
    method: 'POST',
    body: formData,
    token,
  })
  return response
}

export async function updateUserVisibility(userId, isPublic, token) {
  const response = await apiRequest(URLS.users.visibility(userId), {
    method: 'PATCH',
    body: { isPublic },
    token,
  })
  return response
}

// ─── Companies ──────────────────────────────────────────────────────────────

export async function getCompaniesByUser(userId, token) {
  const response = await apiRequest(URLS.companies.byUser(userId), { token })
  return response
}

export async function getCompanyById(companyId, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), { token })
  return response
}

export async function createCompany(payload, token) {
  const response = await apiRequest(URLS.companies.base, {
    method: 'POST',
    body: payload,
    token,
  })
  return response
}

export async function updateCompany(companyId, payload, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), {
    method: 'PUT',
    body: payload,
    token,
  })
  return response
}

export async function deleteCompany(companyId, token) {
  const response = await apiRequest(URLS.companies.byId(companyId), {
    method: 'DELETE',
    token,
  })
  return response
}

// ─── Accountants ─────────────────────────────────────────────────────────────

export async function getPublicAccountants(companyId, token) {
  const response = await apiRequest(URLS.accountants.base, {
    token,
    query: companyId ? { companyId } : {},
  })
  return response
}

export async function sendAccountantRequest(accountantId, companyId, token) {
  const response = await apiRequest(URLS.accountants.sendRequest(accountantId), {
    method: 'POST',
    body: { companyId },
    token,
  })
  return response
}

export async function getAccountantRequests(accountantId, token) {
  const response = await apiRequest(URLS.accountants.requests(accountantId), { token })
  return response
}

export async function getAccountantCompanies(accountantId, token) {
  const response = await apiRequest(URLS.accountants.companies(accountantId), { token })
  return response
}

export async function respondToRequest(requestId, accept, token) {
  const response = await apiRequest(URLS.accountants.respondToRequest(requestId), {
    method: 'PATCH',
    body: { accept },
    token,
  })
  return response
}

export async function disconnectAccountant(accountantId, companyId, token) {
  const url = `${URLS.accountants.base}/${accountantId}/connection?companyId=${companyId}`
  const response = await apiRequest(url, {
    method: 'DELETE',
    token,
  })
  return response
}

// ─── Invoices ───────────────────────────────────────────────────────────────

export async function getInvoicesByCompany(companyId, filters, token) {
  const nextFilters = filters || {}
  const response = await apiRequest(URLS.invoices.byCompany(companyId), {
    query: nextFilters,
    token,
  })
  return response
}

export async function getInvoiceById(invoiceId, token) {
  const response = await apiRequest(URLS.invoices.byId(invoiceId), { token })
  return response
}

export async function createInvoice(payload, autoMatch, token) {
  const shouldAutoMatch = autoMatch ?? false
  const response = await apiRequest(URLS.invoices.base, {
    method: 'POST',
    body: payload,
    query: shouldAutoMatch ? { autoMatch: true } : {},
    token,
  })
  return response
}

export async function updateInvoice(invoiceId, payload, token) {
  const response = await apiRequest(URLS.invoices.byId(invoiceId), {
    method: 'PUT',
    body: payload,
    token,
  })
  return response
}

export async function deleteInvoice(invoiceId, token) {
  const response = await apiRequest(URLS.invoices.byId(invoiceId), {
    method: 'DELETE',
    token,
  })
  return response
}

export async function bulkDeleteInvoices(ids, token) {
  const response = await apiRequest(URLS.invoices.bulkDelete, {
    method: 'DELETE',
    body: { ids },
    token,
  })
  return response
}

export async function updateInvoiceStatus(invoiceId, status, token) {
  const response = await apiRequest(URLS.invoices.status(invoiceId), {
    method: 'PATCH',
    body: { status },
    token,
  })
  return response
}

export async function uploadInvoicePdf(file, companyId, token) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('companyId', String(companyId))
  const response = await apiRequest(URLS.invoices.uploadPdf, {
    method: 'POST',
    body: formData,
    token,
  })
  return response
}

export async function downloadInvoicePdf(invoiceId, token) {
  const response = await fetch(URLS.invoices.download(invoiceId), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`
    try {
      const data = await response.json()
      message = data?.message || message
    } catch {
      // Keep fallback message if body is not JSON.
    }

    const error = new Error(message)
    error.status = response.status
    throw error
  }

  const blob = await response.blob()
  const fileName = parseFileName(response.headers.get('content-disposition'))
  const contentType = response.headers.get('content-type') || 'application/pdf'

  return { blob, fileName, contentType }
}

const parseFileName = (contentDisposition) => {
  if (!contentDisposition) return 'invoice.pdf'

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      return encodedMatch[1]
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1] || 'invoice.pdf'
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactionsByCompany(companyId, filters, token) {
  const nextFilters = filters || {}
  const response = await apiRequest(URLS.transactions.byCompany(companyId), {
    query: nextFilters,
    token,
  })
  return response
}

export async function getTransactionById(transactionId, token) {
  const response = await apiRequest(URLS.transactions.byId(transactionId), { token })
  return response
}

export async function createTransaction(payload, token) {
  const response = await apiRequest(URLS.transactions.base, {
    method: 'POST',
    body: payload,
    token,
  })
  return response
}

export async function createTransactionsBulk(payload, token) {
  const response = await apiRequest(URLS.transactions.bulk, {
    method: 'POST',
    body: payload,
    token,
  })
  return response
}

export async function importExcelTransactions(payload, token) {
  const response = await apiRequest(URLS.transactions.importExcel, {
    method: 'POST',
    body: payload,
    token,
  })
  return response
}

export async function deleteTransaction(transactionId, token) {
  const response = await apiRequest(URLS.transactions.byId(transactionId), {
    method: 'DELETE',
    token,
  })
  return response
}

export async function bulkDeleteTransactions(ids, token) {
  const response = await apiRequest(URLS.transactions.bulkDelete, {
    method: 'DELETE',
    body: { ids },
    token,
  })
  return response
}

export async function previewExcel(file, companyId, token) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('companyId', companyId)
  const response = await apiRequest(URLS.transactions.previewExcel, {
    method: 'POST',
    body: formData,
    token,
  })
  return response
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function getMatchesByCompany(companyId, token) {
  const response = await apiRequest(URLS.matches.byCompany(companyId), { token })
  return response
}

export async function getMatchById(matchId, token) {
  const response = await apiRequest(URLS.matches.byId(matchId), { token })
  return response
}

export async function getMatchSuggestions(invoiceId, token) {
  const response = await apiRequest(URLS.matches.suggestions(invoiceId), { token })
  return response
}

export async function createMatch(payload, token) {
  const response = await apiRequest(URLS.matches.base, {
    method: 'POST',
    body: payload,
    token,
  })
  return response
}

export async function deleteMatch(matchId, token) {
  const response = await apiRequest(URLS.matches.byId(matchId), {
    method: 'DELETE',
    token,
  })
  return response
}

export async function autoMatchInvoice(invoiceId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatch(invoiceId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })
  return response
}

export async function autoMatchBatch(companyId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatchBatch(companyId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })
  return response
}

export async function autoMatchOnLoad(companyId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatchOnLoad(companyId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })
  return response
}

export async function getSimpleSuggestions(companyId, token) {
  const response = await apiRequest(URLS.matches.simpleSuggestions(companyId), { token })
  return response
}

export async function getInstallmentSuggestions(companyId, token) {
  const response = await apiRequest(URLS.matches.installmentSuggestions(companyId), { token })
  return response
}

// ─── Bank Accounts ────────────────────────────────────────────────────────────

export async function getBankAccountsByCompany(companyId, token) {
  const response = await apiRequest(URLS.bankAccounts.byCompany(companyId), { token })
  return response
}

export async function getBankAccountById(accountId, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), { token })
  return response
}

export async function createBankAccount(payload, token) {
  const response = await apiRequest(URLS.bankAccounts.base, {
    method: 'POST',
    body: payload,
    token,
  })
  return response
}

export async function updateBankAccount(accountId, payload, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), {
    method: 'PUT',
    body: payload,
    token,
  })
  return response
}

export async function deleteBankAccount(accountId, token) {
  const response = await apiRequest(URLS.bankAccounts.byId(accountId), {
    method: 'DELETE',
    token,
  })
  return response
}

// ─── Anomalies ───────────────────────────────────────────────────────────────

export async function getAnomaliesByCompany(companyId, filters, token) {
  const nextFilters = filters || {}
  const response = await apiRequest(URLS.anomalies.byCompany(companyId), { query: nextFilters, token })
  return response
}

export async function getAnomalyById(anomalyId, token) {
  const response = await apiRequest(URLS.anomalies.byId(anomalyId), { token })
  return response
}

export async function getAnomalyStats(companyId, token) {
  const response = await apiRequest(URLS.anomalies.stats(companyId), { token })
  return response
}

export async function resolveAnomaly(anomalyId, payload, token) {
  const response = await apiRequest(URLS.anomalies.resolve(anomalyId), {
    method: 'PATCH',
    body: payload,
    token,
  })
  return response
}

export async function deleteTransactionFileUpload(fileUploadId, token) {
  const response = await apiRequest(URLS.anomalies.fileUpload(fileUploadId), {
    method: 'DELETE',
    token,
  })
  return response
}

export async function keepDuplicateInvoice(invoiceId, token) {
  const response = await apiRequest(URLS.anomalies.keepInvoice(invoiceId), {
    method: 'POST',
    token,
  })
  return response
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAdminStats(token) {
  const response = await apiRequest(URLS.admin.stats, { token })
  return response
}

export async function getAdminUsers(token) {
  const response = await apiRequest(URLS.admin.users, { token })
  return response
}

export async function getAdminLogs(token) {
  const response = await apiRequest(URLS.admin.logs, { token })
  return response
}

export async function getAdminAuditLogs(token) {
  const response = await apiRequest(URLS.admin.auditLogs, { token })
  return response
}

export async function toggleAdminUserActive(userId, isActive, token) {
  const response = await apiRequest(URLS.admin.toggleUserActive(userId), {
    method: 'PATCH',
    body: { isActive },
    token,
  })
  return response
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(token) {
  const response = await apiRequest(URLS.notifications.mine, { token })
  return response
}

export async function getMyNotifications(token) {
  const response = await apiRequest(URLS.notifications.mine, { token })
  return response
}

export async function markNotificationRead(notificationId, token) {
  const response = await apiRequest(URLS.notifications.markRead(notificationId), {
    method: 'PATCH',
    token,
  })
  return response
}

export async function markAllNotificationsRead(token) {
  const response = await apiRequest(URLS.notifications.markAllRead, {
    method: 'PATCH',
    token,
  })
  return response
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function getFinancialSummary(companyId, token) {
  const response = await apiRequest(URLS.reports.financial(companyId), { token })
  return response
}

export async function getDashboardReport(companyId, token) {
  const response = await apiRequest(URLS.reports.dashboard(companyId), { token })
  return response
}

export async function getReconciliationReport(companyId, token) {
  const response = await apiRequest(URLS.reports.reconciliation(companyId), { token })
  return response
}

export async function getVatReport(companyId, token) {
  const response = await apiRequest(URLS.reports.vat(companyId), { token })
  return response
}

// ─── Upload Jobs ──────────────────────────────────────────────────────────────

export async function getUploadJobs(companyId, token) {
  const response = await apiRequest(URLS.uploadJobs.byCompany(companyId), { token })
  return response
}

export async function getMyUploadJobs(companyId, token) {
  const response = await apiRequest(URLS.uploadJobs.my(companyId), { token })
  return response
}

export async function getUploadJobStatus(uploadJobId, token) {
  const response = await apiRequest(URLS.uploadJobs.status(uploadJobId), { token })
  return response
}

export async function deleteUploadJob(uploadJobId, token) {
  const response = await apiRequest(URLS.uploadJobs.byId(uploadJobId), {
    method: 'DELETE',
    token,
  })
  return response
}

export async function deleteUploadJobsByCompany(companyId, token) {
  const response = await apiRequest(URLS.uploadJobs.byCompany(companyId), {
    method: 'DELETE',
    token,
  })
  return response
}

export async function markUploadJobVerified(uploadJobId, token) {
  const response = await apiRequest(URLS.uploadJobs.verify(uploadJobId), {
    method: 'PATCH',
    token,
  })
  return response
}

export async function downloadUploadJobPdf(uploadJobId, token) {
  const response = await fetch(URLS.uploadJobs.download(uploadJobId), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`
    try {
      const data = await response.json()
      message = data?.message || message
    } catch {
      // Keep fallback message if body is not JSON.
    }

    const error = new Error(message)
    error.status = response.status
    throw error
  }

  const blob = await response.blob()
  const fileName = parseFileName(response.headers.get('content-disposition'))
  const contentType = response.headers.get('content-type') || 'application/pdf'

  return { blob, fileName, contentType }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardStats({ companyId, token }) {
  const response = await apiRequest(URLS.reports.dashboard(companyId), { token })
  return response
}

export async function getRecentActivity({ companyId, token }) {
  const [invoices, matches, anomalies] = await Promise.allSettled([
    getInvoicesByCompany(companyId, {}, token),
    getMatchesByCompany(companyId, token),
    getAnomaliesByCompany(companyId, {}, token),
  ])

  const invoiceItems = invoices.status === 'fulfilled' ? invoices.value || [] : []
  const matchItems = matches.status === 'fulfilled' ? matches.value || [] : []
  const anomalyItems = anomalies.status === 'fulfilled' ? anomalies.value || [] : []

  const combined = [
    ...invoiceItems.slice(0, 5).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      date: invoice.createdAt || invoice.created_at,
      text: `Invoice #${invoice.invoiceNumber || invoice.id} ${invoice.status || ''}`.trim(),
    })),
    ...matchItems.slice(0, 5).map((match) => ({
      id: `match-${match.id}`,
      date: match.createdAt || match.created_at,
      text: `Match ${match.invoiceId || ''} → ${match.transactionId || ''}`.trim(),
    })),
    ...anomalyItems.slice(0, 5).map((anomaly) => ({
      id: `anomaly-${anomaly.id}`,
      date: anomaly.createdAt || anomaly.created_at,
      text: anomaly.title || anomaly.description || `Anomaly #${anomaly.id}`,
    })),
  ]

  return combined.sort((a, b) => {
    const da = a.date ? new Date(a.date) : new Date(0)
    const db = b.date ? new Date(b.date) : new Date(0)
    return db - da
  })
}
