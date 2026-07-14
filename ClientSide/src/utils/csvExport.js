export function exportMatchesCSV(matches, filename = 'matched-items.csv') {
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
    (m.transaction_description ?? m.transactionDescription ?? '').replace(/,/g, ' '),
    m.matched_amount ?? m.matchedAmount ?? '',
    m.match_method ?? m.matchMethod ?? '',
    m.match_type ?? m.matchType ?? '',
    m.match_confidence ?? m.matchConfidence ?? '',
    m.installment_number ?? m.installmentNumber ?? '',
    (m.installment_note ?? m.installmentNote ?? '').replace(/,/g, ' '),
    m.matched_by_name ?? m.matchedByName ?? '',
    m.created_at ?? m.createdAt ?? '',
    m.updated_at ?? m.updatedAt ?? '',
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
