import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'
import FeatureWorkspacePage from '../components/FeatureWorkspacePage'

const highlights = [
  {
    title: 'Dashboard Snapshot',
    text: 'Track reconciliation progress, exceptions, and completion pace.',
    icon: <QueryStatsRoundedIcon sx={{ color: '#a9d5ff' }} />,
  },
  {
    title: 'VAT Reporting',
    text: 'Generate period-based VAT summaries for financial review.',
    icon: <PaidRoundedIcon sx={{ color: '#b7ffd2' }} />,
  },
  {
    title: 'Reconciliation Export',
    text: 'Prepare report packages for audit and leadership checkpoints.',
    icon: <AssessmentRoundedIcon sx={{ color: '#a9d5ff' }} />,
  },
]

function ReportsPage() {
  return (
    <FeatureWorkspacePage
      title="Reports"
      description="Generate business-facing visibility from reconciliation activity."
      statusLabel="Frontend Scaffold"
      highlights={highlights}
      emptyTitle="No reports generated yet"
      emptyDescription="Connect report endpoints and date filters to enable scheduled and on-demand reporting."
      emptyActionLabel="Create First Report"
    />
  )
}

export default ReportsPage
