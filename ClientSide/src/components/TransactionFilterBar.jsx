import PropTypes from 'prop-types'
import {
  Box, Button, CircularProgress, FormControl, InputAdornment, InputLabel,
  MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material'
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { formatTransactionTypeLabel } from '../utils/transactionHelpers'

export default function TransactionFilterBar({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  transactionTypeOptions,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  invoiceFilter,
  onInvoiceFilterChange,
  hasSelection,
  selectedCount,
  bulkDeleting,
  onBulkDelete,
  onDeleteAll,
  deletingAll,
  onExport,
  onExportAll,
  totalCount,
  loading,
}) {
  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={2}
        sx={{ minWidth: 0 }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Transaction Records {loading ? '' : `(${totalCount})`}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="Search vendor, description, amount, date..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={(e) => onTypeFilterChange(e.target.value)}>
              {transactionTypeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {formatTransactionTypeLabel(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} label="Category" onChange={(e) => onCategoryFilterChange(e.target.value)}>
              {categoryOptions.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat === 'all' ? 'All' : cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Invoice Required</InputLabel>
            <Select value={invoiceFilter} label="Invoice Required" onChange={(e) => onInvoiceFilterChange(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="required">Needs Invoice</MenuItem>
              <MenuItem value="not_required">No Invoice Needed</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={bulkDeleting ? <CircularProgress size={14} /> : <DeleteOutlineRoundedIcon />}
          onClick={onBulkDelete}
          disabled={!hasSelection || bulkDeleting}
        >
          {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedCount})`}
        </Button>
        <Button
          size="small"
          color="error"
          variant="contained"
          startIcon={deletingAll ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <DeleteForeverRoundedIcon />}
          onClick={onDeleteAll}
          disabled={totalCount === 0 || deletingAll}
        >
          {deletingAll ? 'Deleting...' : 'Delete All'}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadRoundedIcon />}
          onClick={onExport}
          disabled={totalCount === 0}
        >
          Export CSV
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<DownloadRoundedIcon />}
          onClick={onExportAll}
        >
          Export All
        </Button>
      </Stack>
    </Box>
  )
}

TransactionFilterBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  typeFilter: PropTypes.string.isRequired,
  onTypeFilterChange: PropTypes.func.isRequired,
  transactionTypeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  categoryFilter: PropTypes.string,
  onCategoryFilterChange: PropTypes.func,
  categoryOptions: PropTypes.arrayOf(PropTypes.string),
  invoiceFilter: PropTypes.string.isRequired,
  onInvoiceFilterChange: PropTypes.func.isRequired,
  hasSelection: PropTypes.bool,
  selectedCount: PropTypes.number,
  bulkDeleting: PropTypes.bool,
  onBulkDelete: PropTypes.func.isRequired,
  onDeleteAll: PropTypes.func.isRequired,
  deletingAll: PropTypes.bool,
  onExport: PropTypes.func.isRequired,
  onExportAll: PropTypes.func.isRequired,
  totalCount: PropTypes.number,
  loading: PropTypes.bool,
}
