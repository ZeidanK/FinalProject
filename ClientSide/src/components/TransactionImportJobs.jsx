import PropTypes from 'prop-types'
import { Alert, CircularProgress, LinearProgress, Stack, Typography } from '@mui/material'

export default function TransactionImportJobs({ jobs }) {
  if (jobs.length === 0) return null

  return (
    <Stack spacing={1}>
      {jobs.map((job) => (
        <Alert
          key={job.jobId}
          severity="info"
          variant="outlined"
          icon={<CircularProgress size={16} />}
        >
          <Stack spacing={0.5}>
            <Typography variant="body2">
              Importing <strong>{job.fileName}</strong> in the background…
            </Typography>
            <LinearProgress
              variant={job.progress > 0 ? 'determinate' : 'indeterminate'}
              value={job.progress}
              sx={{ borderRadius: 1 }}
            />
          </Stack>
        </Alert>
      ))}
    </Stack>
  )
}

TransactionImportJobs.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      jobId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      fileName: PropTypes.string,
      progress: PropTypes.number,
      status: PropTypes.string,
    }),
  ).isRequired,
}
