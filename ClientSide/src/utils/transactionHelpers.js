function readTransactionType(transaction) {
  if (!transaction || typeof transaction !== 'object') return null

  const rawType = transaction.transaction_type ?? transaction.transactionType ?? transaction.type
  if (rawType == null) return null

  const normalized = String(rawType).trim().toLowerCase()
  return normalized || null
}

export function normalizeTransactionType(transaction) {
  return readTransactionType(transaction) || 'unknown'
}

export function getTransactionTypes(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return ['all']

  const types = new Set()

  for (const transaction of transactions) {
    const normalizedType = normalizeTransactionType(transaction)
    types.add(normalizedType)
  }

  const sortedTypes = Array.from(types).sort((a, b) => a.localeCompare(b))
  return ['all', ...sortedTypes]
}

export function filterTransactionsByType(transactions, selectedType) {
  if (!Array.isArray(transactions) || transactions.length === 0) return []
  if (!selectedType || selectedType === 'all') return transactions

  const normalizedSelectedType = String(selectedType).trim().toLowerCase()
  return transactions.filter((transaction) => normalizeTransactionType(transaction) === normalizedSelectedType)
}

export function formatTransactionTypeLabel(type) {
  if (!type || type === 'all') return 'All'
  if (type === 'unknown') return 'Unknown'

  if (/^[a-z0-9 _-]+$/i.test(type)) {
    return type
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
  }

  return type
}