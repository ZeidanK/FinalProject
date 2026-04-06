import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkDeleteTransactions,
  createTransactionsBulk,
  deleteTransaction,
  getTransactionById,
  getTransactionsByCompany,
  previewExcel,
} from '../../services/transactions'
import { createBankAccount, getBankAccountsByCompany } from '../../services/bankAccounts'
import { transactionKeys } from '../../queries/queryKeys'

export function useTransactionsByCompanyQuery({ companyId, token, filters }) {
  return useQuery({
    queryKey: transactionKeys.byCompany(companyId, filters),
    queryFn: () => getTransactionsByCompany(companyId, filters, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useTransactionDetailsQuery({ transactionId, token, enabled = true }) {
  return useQuery({
    queryKey: transactionKeys.detail(transactionId),
    queryFn: () => getTransactionById(transactionId, token),
    enabled: Boolean(transactionId) && Boolean(token) && enabled,
  })
}

export function useBankAccountsByCompanyQuery({ companyId, token }) {
  return useQuery({
    queryKey: transactionKeys.bankAccounts(companyId),
    queryFn: () => getBankAccountsByCompany(companyId, token),
    enabled: Boolean(companyId) && Boolean(token),
  })
}

export function useCreateBankAccountMutation({ companyId, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createBankAccount(payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.bankAccounts(companyId) })
    },
  })
}

export function useCreateTransactionsBulkMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createTransactionsBulk(payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(companyId, filters) })
    },
  })
}

export function useDeleteTransactionMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactionId) => deleteTransaction(transactionId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(companyId, filters) })
    },
  })
}

export function useBulkDeleteTransactionsMutation({ companyId, filters, token }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids) => bulkDeleteTransactions(ids, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: transactionKeys.byCompany(companyId, filters) })
    },
  })
}

export function usePreviewExcelMutation({ token }) {
  return useMutation({
    mutationFn: ({ file, companyId }) => previewExcel(file, companyId, token),
  })
}
