import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  autoMatchOnLoad,
  createMatch,
  deleteMatch,
  getInstallmentSuggestions,
  getMatchSuggestions,
  getMatchesByCompany,
  getSimpleSuggestions,
} from '../../services/matches'
import { getInvoicesByCompany } from '../../services/invoices'
import { getTransactionsByCompany } from '../../services/transactions'
import { invoiceKeys, matchKeys, transactionKeys } from '../../queries/queryKeys'

/**
 * Fetches match records for a specific company.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier used to fetch matches.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for company matches.
 */
export function useMatchesByCompanyQuery({ companyId, token }) {
  return useQuery({
    queryKey: matchKeys.byCompany(companyId),
    queryFn: () => getMatchesByCompany(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Fetches invoices that have not yet been matched for the current company.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier used to fetch unmatched invoices.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for unmatched invoices.
 */
export function useUnmatchedInvoicesQuery({ companyId, token }) {
  const filters = { isMatched: false }
  return useQuery({
    queryKey: invoiceKeys.byCompany(companyId, filters),
    queryFn: () => getInvoicesByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Fetches transactions that have not yet been matched for the current company.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier used to fetch unmatched transactions.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for unmatched transactions.
 */
export function useUnmatchedTransactionsQuery({ companyId, token }) {
  const filters = { isMatched: false }
  return useQuery({
    queryKey: transactionKeys.byCompany(companyId, filters),
    queryFn: () => getTransactionsByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Fetches suggestion candidates for matching a specific invoice.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.invoiceId - Invoice identifier used to get match suggestions.
 * @param {string} params.token - Authentication token for the request.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for match suggestions.
 */
export function useMatchSuggestionsQuery({ invoiceId, token, enabled = true }) {
  return useQuery({
    queryKey: matchKeys.suggestions(invoiceId),
    queryFn: () => getMatchSuggestions(invoiceId, token),
    enabled: Boolean(invoiceId) && Boolean(token) && enabled,
  })
}

/**
 * Creates a match and invalidates related caches so matching data stays fresh.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for match creation.
 */
export function useCreateMatchMutation({ companyId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createMatch(payload, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: matchKeys.byCompany(companyId) }),
        queryClient.invalidateQueries({ queryKey: matchKeys.simpleSuggestions(companyId) }),
        queryClient.invalidateQueries({ queryKey: matchKeys.installmentSuggestions(companyId) }),
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
      ])
    },
  })
}

/**
 * Deletes a match and refreshes related match, invoice, and transaction caches.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for match deletion.
 */
export function useDeleteMatchMutation({ companyId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (matchId) => deleteMatch(matchId, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: matchKeys.byCompany(companyId) }),
        queryClient.invalidateQueries({ queryKey: matchKeys.simpleSuggestions(companyId) }),
        queryClient.invalidateQueries({ queryKey: matchKeys.installmentSuggestions(companyId) }),
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
      ])
    },
  })
}

/**
 * Fetches simple match suggestions for the current company.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier used to fetch suggestions.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for simple match suggestions.
 */
export function useSimpleSuggestionsQuery({ companyId, token }) {
  return useQuery({
    queryKey: matchKeys.simpleSuggestions(companyId),
    queryFn: () => getSimpleSuggestions(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Fetches installment-based match suggestions for the current company.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier used to fetch suggestions.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for installment suggestions.
 */
export function useInstallmentSuggestionsQuery({ companyId, token }) {
  return useQuery({
    queryKey: matchKeys.installmentSuggestions(companyId),
    queryFn: () => getInstallmentSuggestions(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Runs an auto-match operation on load and invalidates caches after completion.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for auto-match.
 */
export function useAutoMatchOnLoadMutation({ companyId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ minConfidence }) => autoMatchOnLoad(companyId, minConfidence, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: matchKeys.byCompany(companyId) }),
        queryClient.invalidateQueries({ queryKey: matchKeys.simpleSuggestions(companyId) }),
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
      ])
    },
  })
}
