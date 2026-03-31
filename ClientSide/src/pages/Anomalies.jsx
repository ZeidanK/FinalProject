import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import FeatureWorkspacePage from '../components/FeatureWorkspacePage'

const highlights = [
  {
    title: 'Risk Detection',
    text: 'Surface suspicious patterns and out-of-range records automatically.',
    icon: <ErrorOutlineRoundedIcon sx={{ color: '#ffd0aa' }} />,
  },
  {
    title: 'Triage Queue',
    text: 'Filter anomalies by severity, type, and operational status.',
    icon: <ManageSearchRoundedIcon sx={{ color: '#a9d5ff' }} />,
  },
  {
    title: 'Resolution Log',
    text: 'Document reviewer notes and mark anomalies as resolved.',
    icon: <VerifiedRoundedIcon sx={{ color: '#b7ffd2' }} />,
  },
]

function AnomaliesPage() {
  return (
    <FeatureWorkspacePage
      title="Anomalies"
      description="Monitor data quality issues and resolve exception cases quickly."
      statusLabel="Frontend Scaffold"
      highlights={highlights}
      emptyTitle="No anomalies to review"
      emptyDescription="When anomaly feeds are connected, this screen will show severity-based queues."
      emptyActionLabel="View Detection Rules"
    />
  )
}

export default AnomaliesPage
