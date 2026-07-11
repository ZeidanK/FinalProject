import PropTypes from 'prop-types'
import {
  Box, Button, CircularProgress, FormControl, InputAdornment, InputLabel,
  MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material'
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
  invoiceFilter,
  onInvoiceFilterChange,
  hasSelection,
  selectedCount,
  bulkDeleting,
  onBulkDelete,
  onExport,
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
          variant="outlined"
          startIcon={<DownloadRoundedIcon />}
          onClick={onExport}
          disabled={totalCount === 0}
        >
          Export CSV
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
  invoiceFilter: PropTypes.string.isRequired,
  onInvoiceFilterChange: PropTypes.func.isRequired,
  hasSelection: PropTypes.bool,
  selectedCount: PropTypes.number,
  bulkDeleting: PropTypes.bool,
  onBulkDelete: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  totalCount: PropTypes.number,
  loading: PropTypes.bool,
}
