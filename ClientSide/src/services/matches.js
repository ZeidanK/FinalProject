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
