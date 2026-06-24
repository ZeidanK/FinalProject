/**
 * Key factories for notification-related React Query caches.
 */
export const notificationKeys = {
  all: ['notifications'],
  mine: (take) => [...notificationKeys.all, 'mine', take],
}

/**
 * Key factories for anomaly-related React Query caches.
 *
 * @type {{all: string[], byCompany: function(string|number): Array, list: function(string|number, any): Array, stats: function(string|number): Array, detail: function(string|number): Array}}
 */
export const anomalyKeys = {
  all: ['anomalies'],
  byCompany: (companyId) => [...anomalyKeys.all, 'company', companyId],
  list: (companyId, filters) => [...anomalyKeys.byCompany(companyId), 'list', filters],
  stats: (companyId) => [...anomalyKeys.byCompany(companyId), 'stats'],
  detail: (anomalyId) => [...anomalyKeys.all, 'detail', anomalyId],
}

/**
 * Key factories for admin dashboard React Query caches.
 *
 * @type {{all: string[], stats: function(): Array, users: function(any): Array, logs: function(any): Array, audit: function(any): Array}}
 */
export const adminKeys = {
  all: ['admin'],
  stats: () => [...adminKeys.all, 'stats'],
  users: (query) => [...adminKeys.all, 'users', query],
  logs: (query) => [...adminKeys.all, 'logs', query],
  audit: (query) => [...adminKeys.all, 'audit', query],
}

/**
 * Key factories for profile-related React Query caches.
 *
 * @type {{all: string[], user: function(string|number): Array, companies: function(string|number): Array}}
 */
export const profileKeys = {
  all: ['profile'],
  user: (userId) => [...profileKeys.all, 'user', userId],
  companies: (userId) => [...profileKeys.all, 'companies', userId],
}

/**
 * Key factories for transaction-related React Query caches.
 *
 * @type {{all: string[], byCompany: function(string|number, any): Array, detail: function(string|number): Array}}
 */
export const transactionKeys = {
  all: ['transactions'],
  byCompany: (companyId, filters) => [...transactionKeys.all, 'company', companyId, filters],
  detail: (transactionId) => [...transactionKeys.all, 'detail', transactionId],
}

/**
 * Key factories for invoice-related React Query caches.
 *
 * @type {{all: string[], byCompany: function(string|number, any): Array, detail: function(string|number): Array}}
 */
export const invoiceKeys = {
  all: ['invoices'],
  byCompany: (companyId, filters) => [...invoiceKeys.all, 'company', companyId, filters],
  detail: (invoiceId) => [...invoiceKeys.all, 'detail', invoiceId],
}

/**
 * Key factories for match-related React Query caches.
 *
 * @type {{all: string[], byCompany: function(string|number): Array, suggestions: function(string|number): Array, simpleSuggestions: function(string|number): Array, installmentSuggestions: function(string|number): Array}}
 */
export const matchKeys = {
  all: ['matches'],
  byCompany: (companyId) => [...matchKeys.all, 'company', companyId],
  suggestions: (invoiceId) => [...matchKeys.all, 'suggestions', invoiceId],
  simpleSuggestions: (companyId) => [...matchKeys.all, 'simple-suggestions', companyId],
  installmentSuggestions: (companyId) => [...matchKeys.all, 'installment-suggestions', companyId],
}
