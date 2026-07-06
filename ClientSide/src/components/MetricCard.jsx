import PropTypes from 'prop-types'
import { Card, CardContent, Stack, Typography } from '@mui/material'

const cardSx = {
  height: '100%',
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  background: 'linear-gradient(155deg, rgba(12, 22, 40, 0.98), rgba(8, 15, 29, 0.98))',
  transition: 'border-color 0.25s, box-shadow 0.25s',
  '&:hover': {
    borderColor: 'rgba(129, 191, 255, 0.4)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
}

export default function MetricCard({ icon, title, value, subtitle, color }) {
  return (
    <Card elevation={0} sx={cardSx}>
      <CardContent>
        <Stack spacing={1.1}>
          {icon && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {icon}
              <Typography variant="caption" sx={{ color: color || 'text.secondary', fontWeight: 600 }}>
                {title}
              </Typography>
            </Stack>
          )}
          <Typography variant="h4" sx={{ color: color || 'text.primary', fontWeight: 700 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

MetricCard.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subtitle: PropTypes.string,
  color: PropTypes.string,
}
