import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import { motion } from 'framer-motion'
import { itemVariants } from '../utils/motionVariants'
import { cardBaseSx } from '../utils/sharedStyles'

const ROWS_OPTIONS = [10, 25, 50, 100]

export default function DataTable({
  title,
  icon: Icon,
  color,
  count,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  loading,
  emptyMessage,
  columns,
  rows,
  selectedId,
  onSelect,
  onSort,
  sortColumn,
  sortDirection,
  onEdit,
  onEditLabel,
  editingId,
  renderActions,
  defaultPageSize = 25,
  getRowStyle,
}) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize)

  const totalRows = rows.length
  const pageCount = Math.max(1, Math.ceil(totalRows / rowsPerPage))
  const paginatedRows = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage)

  const handleRowsPerPageChange = (e) => {
    const val = Number(e.target.value)
    setRowsPerPage(val)
    setPage(0)
  }

  return (
    <Card component={motion.div} variants={itemVariants} elevation={0} sx={cardBaseSx}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {Icon && <Icon sx={{ color, fontSize: 20 }} />}
            <Typography variant="subtitle2" fontWeight={700}>
              {title}
            </Typography>
            <Chip label={count} size="small" sx={{ bgcolor: `${color}1A`, color, fontWeight: 600 }} />
          </Stack>
          {totalRows > 0 && (
            <IconButton size="small" onClick={() => setPage(0)} aria-label="Reset pagination" sx={{ color: 'text.secondary' }}>
              <RestartAltRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {onSearchChange && (
          <TextField
            placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`}
            size="small"
            fullWidth
            value={searchValue || ''}
            onChange={(e) => { onSearchChange(e.target.value); setPage(0) }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { fontSize: '0.85rem' },
              },
            }}
            sx={{ mb: 1.5 }}
          />
        )}

        <TableContainer sx={{ maxHeight: 480, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.05)' }}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ bgcolor: 'rgba(14,24,45,0.9)' }}>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      bgcolor: 'rgba(14,24,45,0.9)',
                      borderBottom: '1px solid rgba(129,191,255,0.08)',
                      color: 'text.secondary',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: 0.3,
                      whiteSpace: 'nowrap',
                      minWidth: col.minWidth || 80,
                      width: col.width,
                    }}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortColumn === col.key}
                        direction={sortColumn === col.key ? sortDirection : 'asc'}
                        onClick={() => onSort?.(col.key)}
                        sx={{ '&.Mui-active': { color: 'primary.main' } }}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    {columns.map((col) => (
                      <TableCell key={col.key} sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <Box sx={{ height: 20, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 4, borderBottom: 'none' }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage || 'No items.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const id = row.id ?? row._id
                  const isSelected = selectedId === id
                  return (
                    <TableRow
                      key={id}
                      hover
                      selected={isSelected}
                      onClick={() => onSelect?.(id)}
                      sx={{
                        cursor: onSelect ? 'pointer' : 'default',
                        bgcolor: isSelected ? `${color}12` : 'transparent',
                        '&:hover': { bgcolor: isSelected ? `${color}18` : 'rgba(255,255,255,0.03)' },
                        '&.Mui-selected': { bgcolor: `${color}12` },
                        '& td': { borderBottom: '1px solid rgba(255,255,255,0.03)' },
                        ...(getRowStyle?.(row) || {}),
                      }}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          sx={{
                            color: isSelected ? '#fff' : 'inherit',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            maxWidth: col.maxWidth || 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {col.render ? col.render(row) : (row[col.key] ?? '\u2014')}
                        </TableCell>
                      ))}
                      {renderActions && (
                        <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {renderActions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalRows > 0 && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">Rows:</Typography>
              <TextField
                select
                size="small"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                sx={{ width: 70 }}
                slotProps={{ select: { sx: { fontSize: '0.8rem', py: 0.5 } } }}
              >
                {ROWS_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt} sx={{ fontSize: '0.8rem' }}>{opt}</MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" color="text.secondary">
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, totalRows)} of {totalRows}
              </Typography>
            </Stack>
            <Pagination
              count={pageCount}
              page={page + 1}
              onChange={(_, p) => setPage(p - 1)}
              size="small"
              siblingCount={0}
              boundaryCount={1}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

DataTable.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.string,
  count: PropTypes.number.isRequired,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    sortable: PropTypes.bool,
    render: PropTypes.func,
    minWidth: PropTypes.number,
    maxWidth: PropTypes.number,
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  })).isRequired,
  rows: PropTypes.array.isRequired,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func,
  onSort: PropTypes.func,
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onEdit: PropTypes.func,
  onEditLabel: PropTypes.string,
  editingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  renderActions: PropTypes.func,
  defaultPageSize: PropTypes.number,
  getRowStyle: PropTypes.func,
}
