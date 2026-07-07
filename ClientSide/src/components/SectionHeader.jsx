import PropTypes from 'prop-types'
import { Stack, Typography } from '@mui/material'

export default function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent={action ? 'space-between' : 'flex-start'} spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon && icon}
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {action && action}
    </Stack>
  )
}

SectionHeader.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
}
