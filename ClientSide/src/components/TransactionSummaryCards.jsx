import { Grid, Skeleton } from '@mui/material'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import MetricCard from './MetricCard'
import { fmtShekel } from '../utils/formatters'

const cardDefs = (overall) => [
  {
    icon: <AccountBalanceWalletRoundedIcon sx={{ color: '#58a6ff' }} />,
    title: 'Total Amount',
    value: fmtShekel(overall?.totalAmount),
    subtitle: `${(overall?.totalCount || 0).toLocaleString()} transactions`,
    color: '#58a6ff',
  },
  {
    icon: <TrendingDownRoundedIcon sx={{ color: '#f59e0b' }} />,
    title: 'Total Debits',
    value: fmtShekel(overall?.totalDebits),
    color: '#f59e0b',
  },
  {
    icon: <TrendingUpRoundedIcon sx={{ color: '#37d67a' }} />,
    title: 'Total Credits',
    value: fmtShekel(overall?.totalCredits),
    color: '#37d67a',
  },
  {
    icon: <ReceiptLongRoundedIcon sx={{ color: '#a9d5ff' }} />,
    title: 'Transaction Count',
    value: (overall?.totalCount || 0).toLocaleString(),
    subtitle: overall?.totalCount === 1 ? '1 entry' : `${(overall?.totalCount || 0).toLocaleString()} entries`,
    color: '#a9d5ff',
  },
  {
    icon: <ShowChartRoundedIcon sx={{ color: '#ff9ff3' }} />,
    title: 'Average Amount',
    value: fmtShekel(overall?.avgAmount),
    color: '#ff9ff3',
  },
]

export default function TransactionSummaryCards({ overall, loading }) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <MetricCard icon={<Skeleton variant="rounded" width={32} height={32} />} value={<Skeleton variant="text" width="54%" height={44} />} />
          </Grid>
        ))}
      </Grid>
    )
  }

  if (!overall) return null

  return (
    <Grid container spacing={2}>
      {cardDefs(overall).map((def) => (
        <Grid key={def.title} size={{ xs: 12, sm: 6, md: 2.4 }}>
          <MetricCard icon={def.icon} title={def.title} value={def.value} subtitle={def.subtitle} color={def.color} />
        </Grid>
      ))}
    </Grid>
  )
}
