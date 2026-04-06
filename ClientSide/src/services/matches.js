import { URLS } from '../scripts/config'
import { apiRequest } from './httpClient'
import { unwrapEnvelope } from './unwrapEnvelope'

export async function getMatchesByCompany(companyId, token) {
  const response = await apiRequest(URLS.matches.byCompany(companyId), { token })
  return unwrapEnvelope(response)
}

export async function getMatchById(matchId, token) {
  const response = await apiRequest(URLS.matches.byId(matchId), { token })
  return unwrapEnvelope(response)
}

export async function getMatchSuggestions(invoiceId, token) {
  const response = await apiRequest(URLS.matches.suggestions(invoiceId), { token })
  return unwrapEnvelope(response)
}

export async function createMatch(payload, token) {
  const response = await apiRequest(URLS.matches.base, {
    method: 'POST',
    body: payload,
    token,
  })

  return unwrapEnvelope(response)
}

export async function deleteMatch(matchId, token) {
  const response = await apiRequest(URLS.matches.byId(matchId), {
    method: 'DELETE',
    token,
  })

  return unwrapEnvelope(response)
}

export async function autoMatchInvoice(invoiceId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatch(invoiceId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })

  return unwrapEnvelope(response)
}

export async function autoMatchBatch(companyId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatchBatch(companyId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })

  return unwrapEnvelope(response)
}

export async function autoMatchOnLoad(companyId, minConfidence, token) {
  const nextMinConfidence = minConfidence ?? 70
  const response = await apiRequest(URLS.matches.autoMatchOnLoad(companyId), {
    method: 'POST',
    query: { minConfidence: nextMinConfidence },
    token,
  })

  return unwrapEnvelope(response)
}
