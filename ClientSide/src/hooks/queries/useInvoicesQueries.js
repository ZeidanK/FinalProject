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

export function useInvoicesByCompanyQuery({ companyId, filters, token }) {
  return useQuery({
    queryKey: invoiceKeys.byCompany(companyId, filters),
    queryFn: () => getInvoicesByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useInvoiceByIdQuery({ invoiceId, token, enabled = true }) {
  return useQuery({
    queryKey: invoiceKeys.detail(invoiceId),
    queryFn: () => getInvoiceById(invoiceId, token),
    enabled: Boolean(invoiceId) && Boolean(token) && enabled,
  })
}

export function useUploadInvoicePdfMutation({ token }) {
  return useMutation({
    mutationFn: ({ file, companyId }) => uploadInvoicePdf(file, companyId, token),
  })
}

export function useCreateInvoiceMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payload, autoMatch }) => createInvoice(payload, autoMatch, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.byCompany(companyId, filters) })
    },
  })
}

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

export function useDeleteInvoiceMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId) => deleteInvoice(invoiceId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.byCompany(companyId, filters) })
    },
  })
}

export function useBulkDeleteInvoicesMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids) => bulkDeleteInvoices(ids, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.byCompany(companyId, filters) })
    },
  })
}
