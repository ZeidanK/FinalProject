import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkDeleteInvoices,
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoicesByCompany,
  updateInvoice,
  uploadInvoicePdf,
} from '../../services/invoices'
import { invoiceKeys } from '../../queries/queryKeys'

/**
 * Fetches invoices for a specific company with optional query filters.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.companyId - Company identifier for invoice retrieval.
 * @param {Object} [params.filters] - Optional filters to narrow invoice results.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for invoices by company.
 */
export function useInvoicesByCompanyQuery({ companyId, filters, token }) {
  return useQuery({
    queryKey: invoiceKeys.byCompany(companyId, filters),
    queryFn: () => getInvoicesByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

/**
 * Fetches a single invoice by its identifier.
 *
 * @param {Object} params - Query parameters.
 * @param {string|number} params.invoiceId - Invoice identifier.
 * @param {string} params.token - Authentication token for the request.
 * @param {boolean} [params.enabled=true] - Whether the query should be enabled.
 * @returns {import('@tanstack/react-query').UseQueryResult} React Query result for invoice details.
 */
export function useInvoiceByIdQuery({ invoiceId, token, enabled = true }) {
  return useQuery({
    queryKey: invoiceKeys.detail(invoiceId),
    queryFn: () => getInvoiceById(invoiceId, token),
    enabled: Boolean(invoiceId) && Boolean(token) && enabled,
  })
}

/**
 * Uploads a PDF representation of an invoice.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for PDF upload.
 */
export function useUploadInvoicePdfMutation({ token }) {
  return useMutation({
    mutationFn: ({ file, companyId }) => uploadInvoicePdf(file, companyId, token),
  })
}

/**
 * Creates a new invoice and invalidates the invoice list cache.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {Object} [params.filters] - Invoice list filters used to refetch the list after creation.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for invoice creation.
 */
export function useCreateInvoiceMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payload, autoMatch }) => createInvoice(payload, autoMatch, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.byCompany(companyId, filters) })
    },
  })
}

/**
 * Updates an existing invoice and invalidates affected invoice queries.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {Object} [params.filters] - Invoice list filters used to refetch the list after update.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for invoice updates.
 */
export function useUpdateInvoiceMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, payload }) => updateInvoice(invoiceId, payload, token),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoiceKeys.byCompany(companyId, filters) }),
        queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) }),
      ])
    },
  })
}

/**
 * Deletes an invoice and refreshes the associated company invoice list cache.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {Object} [params.filters] - Invoice list filters used to refetch the list after deletion.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for invoice deletion.
 */
export function useDeleteInvoiceMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId) => deleteInvoice(invoiceId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.byCompany(companyId, filters) })
    },
  })
}

/**
 * Deletes multiple invoices in bulk and refreshes the company invoice list cache.
 *
 * @param {Object} params - Mutation parameters.
 * @param {string|number} params.companyId - Company identifier used for cache invalidation.
 * @param {Object} [params.filters] - Invoice list filters used to refetch the list after bulk deletion.
 * @param {string} params.token - Authentication token for the request.
 * @returns {import('@tanstack/react-query').UseMutationResult} React Query mutation result for bulk invoice deletion.
 */
export function useBulkDeleteInvoicesMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids) => bulkDeleteInvoices(ids, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.byCompany(companyId, filters) })
    },
  })
}
