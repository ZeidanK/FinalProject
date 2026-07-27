import PropTypes from 'prop-types'
import { IconButton, Tooltip } from '@mui/material'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded'

export default function ViewToggle({ viewMode, onChange }) {
  return (
    <Tooltip title={`Switch to ${viewMode === 'card' ? 'table' : 'card'} view`}>
      <IconButton
        size="small"
        onClick={() => onChange(viewMode === 'card' ? 'table' : 'card')}
        sx={{ color: 'text.secondary' }}
        aria-label={`Switch to ${viewMode === 'card' ? 'table' : 'card'} view`}
      >
        {viewMode === 'card' ? <TableRowsRoundedIcon fontSize="small" /> : <GridViewRoundedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}

ViewToggle.propTypes = {
  viewMode: PropTypes.oneOf(['card', 'table']).isRequired,
  onChange: PropTypes.func.isRequired,
}
