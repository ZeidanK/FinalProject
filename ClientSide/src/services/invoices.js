import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

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

export function getInvoicesByCompany(companyId, filters = {}, token) {
  return apiRequest(URLS.invoices.byCompany(companyId), {
    query: filters,
    token,
  })
}

export function getInvoiceById(invoiceId, token) {
  return apiRequest(URLS.invoices.byId(invoiceId), { token })
}

export function createInvoice(payload, autoMatch = false, token) {
  return apiRequest(URLS.invoices.base, {
    method: 'POST',
    body: payload,
    query: autoMatch ? { autoMatch: true } : {},
    token,
  })
}

export function updateInvoice(invoiceId, payload, token) {
  return apiRequest(URLS.invoices.byId(invoiceId), {
    method: 'PUT',
    body: payload,
    token,
  })
}

export function updateInvoiceStatus(invoiceId, status, token) {
  return apiRequest(URLS.invoices.status(invoiceId), {
    method: 'PATCH',
    body: { status },
    token,
  })
}

export function uploadInvoicePdf(file, companyId, token) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('companyId', String(companyId))

  return apiRequest(URLS.invoices.uploadPdf, {
    method: 'POST',
    body: formData,
    token,
  })
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
