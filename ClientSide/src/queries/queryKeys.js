export const anomalyKeys = {
  all: ['anomalies'],
  byCompany: (companyId) => [...anomalyKeys.all, 'company', companyId],
  list: (companyId, filters) => [...anomalyKeys.byCompany(companyId), 'list', filters],
  stats: (companyId) => [...anomalyKeys.byCompany(companyId), 'stats'],
  detail: (anomalyId) => [...anomalyKeys.all, 'detail', anomalyId],
}

export const adminKeys = {
  all: ['admin'],
  stats: () => [...adminKeys.all, 'stats'],
  users: (query) => [...adminKeys.all, 'users', query],
  logs: (query) => [...adminKeys.all, 'logs', query],
  audit: (query) => [...adminKeys.all, 'audit', query],
}

export const profileKeys = {
  all: ['profile'],
  user: (userId) => [...profileKeys.all, 'user', userId],
  companies: (userId) => [...profileKeys.all, 'companies', userId],
}

export const transactionKeys = {
  all: ['transactions'],
  byCompany: (companyId, filters) => [...transactionKeys.all, 'company', companyId, filters],
  detail: (transactionId) => [...transactionKeys.all, 'detail', transactionId],
}

export const invoiceKeys = {
  all: ['invoices'],
  byCompany: (companyId, filters) => [...invoiceKeys.all, 'company', companyId, filters],
  detail: (invoiceId) => [...invoiceKeys.all, 'detail', invoiceId],
}

export const matchKeys = {
  all: ['matches'],
  byCompany: (companyId) => [...matchKeys.all, 'company', companyId],
  suggestions: (invoiceId) => [...matchKeys.all, 'suggestions', invoiceId],
  simpleSuggestions: (companyId) => [...matchKeys.all, 'simple-suggestions', companyId],
}
