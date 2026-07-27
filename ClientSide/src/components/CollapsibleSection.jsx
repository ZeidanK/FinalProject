import PropTypes from 'prop-types'
import { Box, CardContent, Collapse, IconButton, Stack, Typography } from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import { motion } from 'framer-motion'
import { cardBaseSx } from '../utils/sharedStyles'
import { itemVariants } from '../utils/motionVariants'

export default function CollapsibleSection({ title, count, open, onToggle, children, countColor }) {
  return (
    <Box
      component={motion.div}
      variants={itemVariants}
      sx={cardBaseSx}
    >
      <CardContent sx={{ pb: open ? 0 : 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <IconButton
              size="small"
              onClick={onToggle}
              aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'rgba(255,255,255,0.02)',
              }}
            >
              {open ? (
                <KeyboardArrowUpRoundedIcon fontSize="small" />
              ) : (
                <KeyboardArrowDownRoundedIcon fontSize="small" />
              )}
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700} sx={{ userSelect: 'none' }}>
              {title} ({count})
            </Typography>
          </Stack>
          {countColor && (
            <Typography variant="caption" sx={{ color: countColor }}>
              {count} item{count !== 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>
        <Collapse in={open} timeout="auto" unmountOnExit>
          {children}
        </Collapse>
      </CardContent>
    </Box>
  )
}

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node,
  countColor: PropTypes.string,
}
