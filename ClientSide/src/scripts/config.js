/**
 * Normalize a base URL.
 *
 * If a value is not provided, defaults to '/api'. If the value ends with a slash,
 * the trailing slash is removed to keep API paths consistent.
 *
 * @param {string} value - The raw value from environment configuration.
 * @returns {string} Normalized API base URL.
 */
const normalizeBaseUrl = (value) => {
  if (!value) return '/api'
  return value.endsWith('/') ? value.slice(0, -1) : value
}

const resolveApiBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (envBaseUrl) {
    return envBaseUrl
  }

  if (import.meta.env.DEV) {
    return '/api'
  }

  return '/cgroup4/test2/tar1/api'
}

const API_BASE_URL = normalizeBaseUrl(resolveApiBaseUrl())

/**
 * Build a full API path using the configured base URL.
 *
 * @param {string} [path=''] - Relative API route path.
 * @returns {string} Resolved full API endpoint URL.
 */
const buildApiPath = (path = '') => `${API_BASE_URL}${path}`

/**
 * Application-level runtime configuration.
 *
 * Exposes the normalized API base URL.
 */
export const APP_CONFIG = {
  apiBaseUrl: API_BASE_URL,
}

/**
 * Centralized API endpoint mappings.
 *
 * Each property returns a fully resolved backend route for the corresponding feature.
 */
export const URLS = {
  auth: {
    base: buildApiPath('/Auth'),
    register: buildApiPath('/Auth/register'),
    login: buildApiPath('/Auth/login'),
    validate: buildApiPath('/Auth/validate'),
  },
  users: {
    base: buildApiPath('/Users'),
    byId: (id) => buildApiPath(`/Users/${id}`),
    changePassword: (id) => buildApiPath(`/Users/${id}/password`),
    profilePicture: (id) => buildApiPath(`/Users/${id}/profile-picture`),
    visibility: (id) => buildApiPath(`/Users/${id}/visibility`),
  },
  companies: {
    base: buildApiPath('/Companies'),
    byId: (id) => buildApiPath(`/Companies/${id}`),
    byUser: (userId) => buildApiPath(`/Companies/user/${userId}`),
    grantAccess: (companyId) => buildApiPath(`/Companies/${companyId}/access`),
  },
  invoices: {
    base: buildApiPath('/Invoices'),
    byId: (id) => buildApiPath(`/Invoices/${id}`),
    bulkDelete: buildApiPath('/Invoices/bulk'),
    download: (id) => buildApiPath(`/Invoices/${id}/download`),
    byCompany: (companyId) => buildApiPath(`/Invoices/company/${companyId}`),
    status: (id) => buildApiPath(`/Invoices/${id}/status`),
    uploadPdf: buildApiPath('/Invoices/upload-pdf'),
  },
  bankAccounts: {
    base: buildApiPath('/BankAccounts'),
    byId: (id) => buildApiPath(`/BankAccounts/${id}`),
    byCompany: (companyId) => buildApiPath(`/BankAccounts/company/${companyId}`),
  },
  transactions: {
    base: buildApiPath('/Transactions'),
    byId: (id) => buildApiPath(`/Transactions/${id}`),
    byCompany: (companyId) => buildApiPath(`/Transactions/company/${companyId}`),
    bulk: buildApiPath('/Transactions/bulk'),
    bulkDelete: buildApiPath('/Transactions/bulk'),
    previewExcel: buildApiPath('/Transactions/preview-excel'),
    importExcel: buildApiPath('/Transactions/import-excel'),
  },
  matches: {
    base: buildApiPath('/Matches'),
    byId: (id) => buildApiPath(`/Matches/${id}`),
    byCompany: (companyId) => buildApiPath(`/Matches/company/${companyId}`),
    suggestions: (invoiceId) => buildApiPath(`/Matches/suggestions/${invoiceId}`),
    simpleSuggestions: (companyId) => buildApiPath(`/Matches/simple-suggestions/${companyId}`),
    installmentSuggestions: (companyId) => buildApiPath(`/Matches/installment-suggestions/${companyId}`),
    autoMatch: (invoiceId) => buildApiPath(`/Matches/auto-match/${invoiceId}`),
    autoMatchBatch: (companyId) => buildApiPath(`/Matches/auto-match-batch/${companyId}`),
    autoMatchOnLoad: (companyId) => buildApiPath(`/Matches/auto-match-on-load/${companyId}`),
  },
  anomalies: {
    base: buildApiPath('/Anomalies'),
    byId: (id) => buildApiPath(`/Anomalies/${id}`),
    byCompany: (companyId) => buildApiPath(`/Anomalies/company/${companyId}`),
    stats: (companyId) => buildApiPath(`/Anomalies/stats/${companyId}`),
    resolve: (id) => buildApiPath(`/Anomalies/${id}/resolve`),
    keepDuplicateInvoice: (id) => buildApiPath(`/Anomalies/${id}/duplicate-invoices/keep`),
    transactionFileUpload: (id) => buildApiPath(`/Anomalies/transaction-file-uploads/${id}`),
  },
  reports: {
    base: buildApiPath('/Reports'),
    dashboard: (companyId) => buildApiPath(`/Reports/dashboard/${companyId}`),
    vat: (companyId) => buildApiPath(`/Reports/vat/${companyId}`),
    reconciliation: (companyId) => buildApiPath(`/Reports/reconciliation/${companyId}`),
  },
  admin: {
    base: buildApiPath('/Admin'),
    stats: buildApiPath('/Admin/stats'),
    users: buildApiPath('/Admin/users'),
    toggleUser: (id) => buildApiPath(`/Admin/users/${id}/toggle`),
    logs: buildApiPath('/Admin/logs'),
    auditLogs: buildApiPath('/Admin/audit-logs'),
  },
  uploadJobs: {
    byId: (id) => buildApiPath(`/UploadJobs/${id}`),
    mine: buildApiPath('/UploadJobs/mine'),
    verified: (id) => buildApiPath(`/UploadJobs/${id}/verified`),
    download: (id) => buildApiPath(`/UploadJobs/${id}/download`),
  },
  accountants: {
    base: buildApiPath('/Accountants'),
    sendRequest: (id) => buildApiPath(`/Accountants/${id}/request`),
    requests: (id) => buildApiPath(`/Accountants/${id}/requests`),
    companies: (id) => buildApiPath(`/Accountants/${id}/companies`),
    respondToRequest: (requestId) => buildApiPath(`/Accountants/requests/${requestId}/respond`),
  },
}
