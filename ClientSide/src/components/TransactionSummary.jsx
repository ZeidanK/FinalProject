import { Stack } from '@mui/material'
import { useTransactionSummaryQuery } from '../hooks/queries/useTransactionsQueries'
import TransactionSummaryCards from './TransactionSummaryCards'
import TransactionCharts from './TransactionCharts'
import TransactionSummaryVendors from './TransactionSummaryVendors'

export default function TransactionSummary({ companyId, token }) {
  const { data, isLoading } = useTransactionSummaryQuery({ companyId, token })
  const summary = data

  return (
    <Stack spacing={3}>
      <TransactionSummaryCards overall={summary?.overall} loading={isLoading} />
      <TransactionCharts byCategory={summary?.byCategory} monthly={summary?.monthly} loading={isLoading} />
      <TransactionSummaryVendors topVendors={summary?.topVendors} status={summary?.status} loading={isLoading} />
    </Stack>
  )
}
