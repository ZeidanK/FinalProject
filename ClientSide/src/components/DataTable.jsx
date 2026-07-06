import PropTypes from 'prop-types'
import {
  Box,
  Checkbox,
  Chip,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'

const tableShellSx = {
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  overflow: 'hidden',
}

const rowSx = {
  bgcolor: 'rgba(255,255,255,0.02)',
  '&:last-child td': { borderBottom: 0 },
}

export default function DataTable({
  columns,
  rows,
  sortKey,
  sortDirection,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  hasSelection,
  loading,
  loadingRows = 5,
  emptyMessage = 'No data available.',
  emptyIcon,
  getRowId,
  rowActions,
  sx,
}) {
  if (loading) {
    return (
      <Stack spacing={1} sx={{ mt: 1 }}>
        {Array.from({ length: loadingRows }, (_, i) => (
          <Skeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        {emptyIcon || <InboxRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />}
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    )
  }

  return (
    <TableContainer sx={{ ...tableShellSx, ...sx }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
            {onToggleSelect && onToggleSelectAll && (
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={hasSelection && !allSelected}
                  onChange={onToggleSelectAll}
                />
              </TableCell>
            )}
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={col.align || 'left'}
                sortDirection={sortKey === col.key ? sortDirection : false}
                sx={{ whiteSpace: 'nowrap', ...(col.sx || {}) }}
              >
                {col.sortable !== false && onSort ? (
                  <TableSortLabel
                    active={sortKey === col.key}
                    direction={sortKey === col.key ? sortDirection : 'asc'}
                    onClick={() => onSort(col.key)}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
            {rowActions && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => {
            const rowId = getRowId ? getRowId(row) : row.id ?? idx
            const isSelected = selectedIds ? selectedIds.includes(rowId) : false

            return (
              <TableRow
                key={rowId}
                hover
                selected={isSelected}
                sx={rowSx}
              >
                {onToggleSelect && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => onToggleSelect(rowId)}
                    />
                  </TableCell>
                )}
                {columns.map((col) => {
                  const value = col.getValue ? col.getValue(row) : row[col.key]
                  return (
                    <TableCell key={col.key} align={col.align || 'left'} sx={{ ...(col.cellSx || {}) }}>
                      {col.render ? col.render(value, row) : value ?? '—'}
                    </TableCell>
                  )
                })}
                {rowActions && (
                  <TableCell align="center">
                    {typeof rowActions === 'function' ? rowActions(row) : rowActions}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const columnShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  align: PropTypes.string,
  sortable: PropTypes.bool,
  sx: PropTypes.object,
  cellSx: PropTypes.object,
  getValue: PropTypes.func,
  render: PropTypes.func,
})

DataTable.propTypes = {
  columns: PropTypes.arrayOf(columnShape).isRequired,
  rows: PropTypes.array,
  sortKey: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  onToggleSelect: PropTypes.func,
  onToggleSelectAll: PropTypes.func,
  allSelected: PropTypes.bool,
  hasSelection: PropTypes.bool,
  loading: PropTypes.bool,
  loadingRows: PropTypes.number,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.node,
  getRowId: PropTypes.func,
  rowActions: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  sx: PropTypes.object,
}
