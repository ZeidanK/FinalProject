import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'

export function getMatchesByCompany(companyId, token) {
  return apiRequest(URLS.matches.byCompany(companyId), { token })
}

export function getMatchById(matchId, token) {
  return apiRequest(URLS.matches.byId(matchId), { token })
}

export function getMatchSuggestions(invoiceId, token) {
  return apiRequest(URLS.matches.suggestions(invoiceId), { token })
}

export function createMatch(payload, token) {
  return apiRequest(URLS.matches.base, {
    method: 'POST',
    body: payload,
    token,
  })
}

export function deleteMatch(matchId, token) {
  return apiRequest(URLS.matches.byId(matchId), {
    method: 'DELETE',
    token,
  })
}

export function autoMatchInvoice(invoiceId, minConfidence = 70, token) {
  return apiRequest(URLS.matches.autoMatch(invoiceId), {
    method: 'POST',
    query: { minConfidence },
    token,
  })
}

export function autoMatchBatch(companyId, minConfidence = 70, token) {
  return apiRequest(URLS.matches.autoMatchBatch(companyId), {
    method: 'POST',
    query: { minConfidence },
    token,
  })
}

export function autoMatchOnLoad(companyId, minConfidence = 70, token) {
  return apiRequest(URLS.matches.autoMatchOnLoad(companyId), {
    method: 'POST',
    query: { minConfidence },
    token,
  })
}
