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

/**
 * Fetch the current status of a single background upload job.
 *
 * @param {string|number} jobId - Upload job identifier.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<import('../models/uploadJob').UploadJobRow>} Job status row.
 */
export async function getUploadJobStatus(jobId, token) {
  return apiRequest(URLS.uploadJobs.byId(jobId), { token })
}

/**
 * Fetch recent upload jobs for the current user, optionally filtered by company / status.
 *
 * @param {string} token - JWT bearer token.
 * @param {object} [opts]
 * @param {string|number} [opts.companyId]
 * @param {string} [opts.status]
 * @param {number} [opts.take]
 * @returns {Promise<Array>} Array of job rows.
 */
export async function getMyUploadJobs(token, { companyId, status, take } = {}) {
  return apiRequest(URLS.uploadJobs.mine, {
    token,
    query: { companyId, status, take },
  })
}

/**
 * Delete a background upload job and its stored file.
 *
 * @param {string|number} jobId - Upload job identifier.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<any>}
 */
export async function deleteUploadJob(jobId, token)
{
  return apiRequest(URLS.uploadJobs.byId(jobId), {
    method: 'DELETE',
    token,
  })
}

/**
 * Delete all upload jobs for a company.
 *
 * @param {string|number} companyId - Company identifier.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<any>}
 */
export async function deleteUploadJobsByCompany(companyId, token)
{
  return apiRequest(URLS.uploadJobs.byCompany(companyId), {
    method: 'DELETE',
    token,
  })
}

/**
 * Mark a background upload job as verified (user confirmed the extracted data).
 *
 * @param {string|number} jobId - Upload job identifier.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<any>}
 */
export async function markUploadJobVerified(jobId, token) {
  return apiRequest(URLS.uploadJobs.verified(jobId), {
    method: 'PATCH',
    token,
  })
}

/**
 * Download the original PDF file associated with an upload job.
 *
 * @param {string|number} jobId - Upload job identifier.
 * @param {string} token - JWT bearer token.
 * @returns {Promise<{blob: Blob, fileName: string, contentType: string}>}
 */
export async function downloadUploadJobPdf(jobId, token) {
  const response = await fetch(URLS.uploadJobs.download(jobId), {
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
