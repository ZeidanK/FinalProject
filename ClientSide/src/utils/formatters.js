export const fmtAmount = (v) =>
  (Number(v) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const fmtCurrency = (v, currency = 'USD') => {
  try {
    return (Number(v) || 0).toLocaleString(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } catch {
    return `${currency} ${fmtAmount(v)}`
  }
}

export const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

export const toDateInput = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.includes('T') ? value.split('T')[0] : value.slice(0, 10)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export const fmtMonth = (d) => {
  if (!d) return null
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
