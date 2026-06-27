import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

/**
 * Parse the filename from a Content-Disposition header.
 *
 * @param {string|null} contentDisposition - Content-Disposition header value.
 * @returns {string} Parsed filename or a default fallback.
 */
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

/**
 * Fetch invoices associated with a company.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {object} filters - Optional query filters.
 * @param {boolean} autoVerify - Whether this upload may be automatically verified.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the invoice list endpoint.
 */
export async function getInvoicesByCompany(companyId, filters, token) {
  const nextFilters = filters || {}
  const response = await apiRequest(URLS.invoices.byCompany(companyId), {
    query: nextFilters,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Fetch a single invoice by its ID.
 *
 * @param {string|number} invoiceId - Invoice identifier.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the invoice detail endpoint.
 */
export async function getInvoiceById(invoiceId, token) {
  const response = await apiRequest(URLS.invoices.byId(invoiceId), { token })
  return unwrapEnvelope(response)
}

/**
 * Create a new invoice.
 *
 * @param {object} payload - Invoice data payload.
 * @param {boolean} [autoMatch=false] - Whether to auto-match the invoice after creation.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the create invoice endpoint.
 */
export async function createInvoice(payload, autoMatch, token) {
  const shouldAutoMatch = autoMatch ?? false
  const response = await apiRequest(URLS.invoices.base, {
    method: 'POST',
    body: payload,
    query: shouldAutoMatch ? { autoMatch: true } : {},
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Update an existing invoice.
 *
 * @param {string|number} invoiceId - Invoice identifier.
 * @param {object} payload - Updated invoice data.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the update invoice endpoint.
 */
export async function updateInvoice(invoiceId, payload, token) {
  const response = await apiRequest(URLS.invoices.byId(invoiceId), {
    method: 'PUT',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Delete an invoice.
 *
 * @param {string|number} invoiceId - Invoice identifier.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the delete invoice endpoint.
 */
export async function deleteInvoice(invoiceId, token) {
  const response = await apiRequest(URLS.invoices.byId(invoiceId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Delete multiple invoices in a single request.
 *
 * @param {Array<string|number>} ids - List of invoice IDs to delete.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the bulk delete endpoint.
 */
export async function bulkDeleteInvoices(ids, token) {
  const response = await apiRequest(URLS.invoices.bulkDelete, {
    method: 'DELETE',
    body: { ids },
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Update the status of an invoice.
 *
 * @param {string|number} invoiceId - Invoice identifier.
 * @param {string} status - New invoice status.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the update status endpoint.
 */
export async function updateInvoiceStatus(invoiceId, status, token) {
  const response = await apiRequest(URLS.invoices.status(invoiceId), {
    method: 'PATCH',
    body: { status },
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Upload a PDF file for a company invoice.
 *
 * @param {File} file - PDF file to upload.
 * @param {string|number} companyId - Company identifier.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<any>} Unwrapped response payload from the upload endpoint.
 */
export async function uploadInvoicePdf(file, companyId, autoVerify, token) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('companyId', String(companyId))
  formData.append('autoVerify', String(Boolean(autoVerify)))

  const response = await apiRequest(URLS.invoices.uploadPdf, {
    method: 'POST',
    body: formData,
    token,
  })

  return unwrapEnvelope(response)
}

/**
 * Download an invoice PDF from the server.
 *
 * @param {string|number} invoiceId - Invoice identifier.
 * @param {string} token - JWT token for authorization.
 * @returns {Promise<{blob: Blob, fileName: string, contentType: string}>} Blob and file metadata.
 * @throws {Error} When the download request fails.
 */
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
