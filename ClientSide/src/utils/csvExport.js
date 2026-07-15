export function exportMatchesCSV(matches, filename = 'matched-items.csv') {
  if (!matches.length) return

  const escapeCsvValue = (value) => {
    const str = value === null || value === undefined ? '' : String(value)
    const safe = typeof str === 'string' && /^[=+\-@]/.test(str) ? `'${str}` : str
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }

  const headers = [
    'Match ID', 'Invoice ID', 'Invoice Number', 'Invoice Vendor',
    'Transaction ID', 'Transaction Vendor', 'Transaction Description',
    'Matched Amount', 'Match Method', 'Match Type', 'Confidence',
    'Installment #', 'Installment Note',
    'Matched By', 'Created At', 'Updated At',
  ]

  const rows = matches.map((m) => [
    m.id ?? '',
    m.invoice_id ?? m.invoiceId ?? '',
    m.invoice_number ?? m.invoiceNumber ?? '',
    m.vendor_name ?? m.vendorName ?? '',
    m.transaction_id ?? m.transactionId ?? '',
    m.transaction_vendor_name ?? m.transactionVendorName ?? '',
    m.transaction_description ?? m.transactionDescription ?? '',
    m.matched_amount ?? m.matchedAmount ?? '',
    m.match_method ?? m.matchMethod ?? '',
    m.match_type ?? m.matchType ?? '',
    m.match_confidence ?? m.matchConfidence ?? '',
    m.installment_number ?? m.installmentNumber ?? '',
    m.installment_note ?? m.installmentNote ?? '',
    m.matched_by_name ?? m.matchedByName ?? '',
    m.created_at ?? m.createdAt ?? '',
    m.updated_at ?? m.updatedAt ?? '',
  ])

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\r\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
