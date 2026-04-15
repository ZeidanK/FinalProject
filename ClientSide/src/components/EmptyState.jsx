import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import PropTypes from 'prop-types'

/**
 * Reusable empty-state card used to display a placeholder message.
 *
 * @param {object} props
 * @param {string} props.title - Heading text shown in the empty state.
 * @param {string} props.description - Supporting descriptive text.
 * @param {string} [props.actionLabel] - Optional label for the action button.
 * @param {function} [props.onAction] - Optional click handler for the action button.
 * @param {import('react').ReactNode} [props.icon] - Optional custom icon node.
 */
function EmptyState({ title, description, actionLabel, onAction, icon }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'rgba(129, 191, 255, 0.38)',
        background: 'rgba(11, 19, 35, 0.72)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
        <Stack spacing={1.25} alignItems="flex-start">
          {icon || <InboxRoundedIcon sx={{ color: '#a9d5ff' }} />}
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          {actionLabel && (
            <Button variant="contained" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  icon: PropTypes.node,
}

export default EmptyState
