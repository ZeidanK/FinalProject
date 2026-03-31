import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getInvoicesByCompany(companyId, filters = {}, token) {
  return apiRequest(URLS.invoices.byCompany(companyId), {
    query: filters,
    token,
  })
}

export function getInvoiceById(invoiceId, token) {
  return apiRequest(URLS.invoices.byId(invoiceId), { token })
}

export function createInvoice(payload, token) {
  return apiRequest(URLS.invoices.base, {
    method: 'POST',
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
