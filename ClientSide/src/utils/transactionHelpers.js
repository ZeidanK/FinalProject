/**
 * Normalize and read a transaction type value from a transaction object.
 *
 * This helper supports multiple field shapes, including snake_case, camelCase,
 * and plain type properties.
 *
 * @param {object|null|undefined} transaction - Transaction object to inspect.
 * @returns {string|null} Normalized transaction type or null when unavailable.
 */
function readTransactionType(transaction) {
  if (!transaction || typeof transaction !== 'object') return null

  const rawType = transaction.transaction_type ?? transaction.transactionType ?? transaction.type
  if (rawType == null) return null

  const normalized = String(rawType).trim().toLowerCase()
  return normalized || null
}

/**
 * Normalize a transaction type and fall back to 'unknown'.
 *
 * @param {object} transaction - Transaction object containing a type field.
 * @returns {string} Normalized transaction type or 'unknown'.
 */
export function normalizeTransactionType(transaction) {
  return readTransactionType(transaction) || 'unknown'
}

/**
 * Get a sorted list of available transaction types for filtering.
 *
 * Always includes the 'all' option first.
 *
 * @param {Array<object>} transactions - List of transaction objects.
 * @returns {Array<string>} Sorted types with 'all' prefixed.
 */
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

/**
 * Filter transactions by a selected type.
 *
 * @param {Array<object>} transactions - List of transaction objects.
 * @param {string} selectedType - Selected type to filter by.
 * @returns {Array<object>} Filtered transaction list.
 */
export function filterTransactionsByType(transactions, selectedType) {
  if (!Array.isArray(transactions) || transactions.length === 0) return []
  if (!selectedType || selectedType === 'all') return transactions

  const normalizedSelectedType = String(selectedType).trim().toLowerCase()
  return transactions.filter((transaction) => normalizeTransactionType(transaction) === normalizedSelectedType)
}

/**
 * Format a transaction type label for display.
 *
 * @param {string} type - Raw transaction type value.
 * @returns {string} Formatted label suitable for UI display.
 */
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

export function exportTransactionsToCSV(transactions, filename = 'transactions.csv') {
  if (!transactions.length) return

  const headers = [
    'ID', 'Date', 'Posted Date', 'Vendor', 'Description',
    'Amount', 'Type', 'Category', 'Reference Number',
    'Charge Amount', 'Charge Currency', 'Exchange Rate',
    'Requires Invoice', 'Matched', 'Status',
  ]

  const rows = transactions.map((tx) => [
    tx.id ?? tx.transactionId ?? '',
    tx.transaction_date || tx.transactionDate || '',
    tx.posted_date || tx.postedDate || '',
    tx.vendor_name || tx.vendorName || '',
    tx.description || '',
    tx.chargeAmount ?? tx.charge_amount ?? tx.amount ?? 0,
    normalizeTransactionType(tx),
    tx.category || '',
    tx.reference_number || tx.referenceNumber || '',
    tx.charge_amount ?? tx.chargeAmount ?? '',
    tx.charge_currency ?? tx.chargeCurrency ?? '',
    tx.exchange_rate ?? tx.exchangeRate ?? '',
    tx.requiresInvoice === false ? 'No' : 'Yes',
    (tx.is_matched ?? tx.isMatched) ? 'Yes' : 'No',
    tx.status || 'confirmed',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell ?? '')
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(','),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}