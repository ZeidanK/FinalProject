const normalizeBaseUrl = (value) => {
  if (!value) return '/api'
  return value.endsWith('/') ? value.slice(0, -1) : value
}

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || '/api')

const buildApiPath = (path = '') => `${API_BASE_URL}${path}`

export const APP_CONFIG = {
  apiBaseUrl: API_BASE_URL,
}

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
  },
  companies: {
    base: buildApiPath('/Companies'),
    byId: (id) => buildApiPath(`/Companies/${id}`),
    byUser: (userId) => buildApiPath(`/Companies/user/${userId}`),
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
}
