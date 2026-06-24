import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

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
