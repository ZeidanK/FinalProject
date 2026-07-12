import PropTypes from 'prop-types'
import { Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

export default function CompanyCard({ company, onEdit, onDelete, deleting }) {
  const c = company
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(14, 22, 40, 0.5)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'rgba(88, 166, 255, 0.4)',
          bgcolor: 'rgba(88, 166, 255, 0.04)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} fontSize="1.05rem">
            {c.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {c.registrationNumber || c.registration_number
              ? `Reg: ${c.registrationNumber || c.registration_number}`
              : 'No registration number'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[c.city, c.state, c.country].filter(Boolean).join(', ') || 'No address'}
            {c.currency ? <>&nbsp;·&nbsp;{c.currency}</> : ''}
          </Typography>
          {(c.email || c.phone) && (
            <Typography variant="body2" color="text.secondary">
              {[c.email, c.phone].filter(Boolean).join(' · ')}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ ml: 2, flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={onEdit}
            aria-label={`Edit ${c.name || 'company'}`}
            sx={{
              color: 'primary.main',
              '&:hover': { bgcolor: 'rgba(88, 166, 255, 0.12)' },
            }}
          >
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Delete ${c.name || 'company'}`}
            sx={{ '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.12)' } }}
          >
            {deleting ? <CircularProgress size={16} /> : <DeleteOutlineRoundedIcon fontSize="small" />}
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  )
}

CompanyCard.propTypes = {
  company: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    registrationNumber: PropTypes.string,
    registration_number: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    country: PropTypes.string,
    currency: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
}

CompanyCard.defaultProps = {
  deleting: false,
}
