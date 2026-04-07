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

export function useMatchesByCompanyQuery({ companyId, token }) {
  return useQuery({
    queryKey: matchKeys.byCompany(companyId),
    queryFn: () => getMatchesByCompany(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useUnmatchedInvoicesQuery({ companyId, token }) {
  const filters = { isMatched: false }
  return useQuery({
    queryKey: invoiceKeys.byCompany(companyId, filters),
    queryFn: () => getInvoicesByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useUnmatchedTransactionsQuery({ companyId, token }) {
  const filters = { isMatched: false }
  return useQuery({
    queryKey: transactionKeys.byCompany(companyId, filters),
    queryFn: () => getTransactionsByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useMatchSuggestionsQuery({ invoiceId, token, enabled = true }) {
  return useQuery({
    queryKey: matchKeys.suggestions(invoiceId),
    queryFn: () => getMatchSuggestions(invoiceId, token),
    enabled: Boolean(invoiceId) && Boolean(token) && enabled,
  })
}

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

export function useSimpleSuggestionsQuery({ companyId, token }) {
  return useQuery({
    queryKey: matchKeys.simpleSuggestions(companyId),
    queryFn: () => getSimpleSuggestions(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useInstallmentSuggestionsQuery({ companyId, token }) {
  return useQuery({
    queryKey: matchKeys.installmentSuggestions(companyId),
    queryFn: () => getInstallmentSuggestions(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

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
