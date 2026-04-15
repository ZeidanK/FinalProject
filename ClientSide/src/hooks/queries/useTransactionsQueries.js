import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkDeleteTransactions,
  createTransactionsBulk,
  deleteTransaction,
  getTransactionById,
  getTransactionsByCompany,
  previewExcel,
} from '../../services/transactions'
import { transactionKeys } from '../../queries/queryKeys'

/**
 * Fetches transactions for a specified company using optional filters.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier for transaction retrieval.
 * @param {Object} [params.filters] - Optional filters to narrow transaction results.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for company transactions.
 */
export function useTransactionsByCompanyQuery({ companyId, token, filters }) {
  return useQuery({
    queryKey: transactionKeys.byCompany(companyId, filters),
    queryFn: () => getTransactionsByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Fetches details for a single transaction.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.transactionId - Transaction identifier.
 * @param {string} params.token - Authentication token for the request.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for transaction details.
 */
export function useTransactionDetailsQuery({ transactionId, token, enabled = true }) {
  return useQuery({
    queryKey: transactionKeys.detail(transactionId),
    queryFn: () => getTransactionById(transactionId, token),
    enabled: Boolean(transactionId) && Boolean(token) && enabled,
  })
}

/**
 * Creates multiple transactions in bulk and invalidates the company transaction cache.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {Object} [params.filters] - Filters used to refetch the transaction list after creation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for bulk transaction creation.
 */
export function useCreateTransactionsBulkMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createTransactionsBulk(payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(companyId, filters) })
    },
  })
}

/**
 * Deletes a transaction and refreshes the cached transaction list.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {Object} [params.filters] - Filters used to refetch the transaction list after deletion.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for single transaction deletion.
 */
export function useDeleteTransactionMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactionId) => deleteTransaction(transactionId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(companyId, filters) })
    },
  })
}

/**
 * Deletes multiple transactions in bulk and refreshes the company transaction cache.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {Object} [params.filters] - Filters used to refetch the transaction list after bulk deletion.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for bulk transaction deletion.
 */
export function useBulkDeleteTransactionsMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids) => bulkDeleteTransactions(ids, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(companyId, filters) })
    },
  })
}

/**
 * Previews an Excel file upload and returns parsed transaction preview data.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for Excel preview.
 */
export function usePreviewExcelMutation({ token }) {
  return useMutation({
    mutationFn: ({ file, companyId }) => previewExcel(file, companyId, token),
  })
}
