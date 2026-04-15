import PropTypes from 'prop-types'
import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { motion } from 'framer-motion'

const headerCardSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'divider',
  background: 'linear-gradient(135deg, rgba(14,25,45,0.98), rgba(9,17,33,0.97))',
  boxShadow: '0 24px 54px rgba(0,0,0,0.42)',
}

/**
 * Render a page header card with title, description, and a refresh action.
 *
 * @param {object} props
 * @param {string} props.title - Header title text.
 * @param {string} props.description - Header description text.
 * @param {function(): void} props.onRefresh - Callback invoked when the refresh button is clicked.
 * @param {boolean} [props.refreshDisabled] - Whether the refresh button should be disabled.
 * @param {object} [props.variants] - Framer Motion variants for animated rendering.
 * @returns {JSX.Element}
 */
export default function PageHeaderCard({ title, description, onRefresh, refreshDisabled, variants }) {
  return (
    <Card component={motion.div} variants={variants} elevation={0} sx={headerCardSx}>
      <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
              {title}
            </Typography>
            <Typography color="text.secondary">{description}</Typography>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={onRefresh}
            disabled={refreshDisabled}
          >
            Refresh
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

PageHeaderCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
  refreshDisabled: PropTypes.bool,
  variants: PropTypes.object,
}
