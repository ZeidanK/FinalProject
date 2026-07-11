import PropTypes from 'prop-types'
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, IconButton, LinearProgress,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

const typeColors = {
  credit: 'success',
  debit: 'error',
}

export default function TransactionImportPreview({
  uploadedFiles,
  parsedRows,
  validCount,
  invalidCount,
  importing,
  clearingDecision,
  onClear,
  onImport,
  onRemoveRow,
}) {
  if (parsedRows.length === 0) return null

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3.5,
        border: '1px solid rgba(129, 191, 255, 0.12)',
        background: 'rgba(14, 24, 45, 0.65)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <FileUploadRoundedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Import Preview
            </Typography>
            <Chip
              label={
                uploadedFiles.length === 1
                  ? uploadedFiles[0].name
                  : `${uploadedFiles.length} files uploaded`
              }
              size="small"
              variant="outlined"
            />
            <Chip label={`${validCount} valid`} size="small" color="success" variant="outlined" />
            {invalidCount > 0 && (
              <Chip label={`${invalidCount} invalid`} size="small" color="error" variant="outlined" />
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={onClear}
              disabled={importing || clearingDecision}
            >
              {clearingDecision ? 'Clearing...' : 'Clear'}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={onImport}
              disabled={importing || clearingDecision || validCount === 0}
              startIcon={importing ? <CircularProgress size={16} /> : <CheckCircleRoundedIcon />}
            >
              {importing ? 'Importing…' : `Import ${validCount} Transaction(s)`}
            </Button>
          </Stack>
        </Stack>

        {importing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <TableContainer sx={{ width: '100%', maxWidth: '100%', maxHeight: 400, overflowX: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                <TableCell padding="checkbox" />
                <TableCell>Date</TableCell>
                <TableCell sx={{ width: { xs: 140, md: 180 } }}>Vendor</TableCell>
                <TableCell sx={{ width: { xs: 180, md: 260 } }}>Description</TableCell>
                <TableCell align="center">Amount</TableCell>
                <TableCell align="center" sx={{ width: 96 }}>Type</TableCell>
                <TableCell sx={{ width: { xs: 140, md: 180 } }}>Category</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parsedRows.map((row) => (
                <TableRow key={row._rowId} hover sx={{ opacity: row._valid ? 1 : 0.5 }}>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => onRemoveRow(row._rowId)}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.transactionDate || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                      {row.vendorName || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                      {row.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600} color={row.transactionType === 'credit' ? 'success.main' : 'error.main'}>
                      {row.transactionType === 'credit' ? '+' : '−'}
                      {Math.abs(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={row.transactionType} size="small" color={typeColors[row.transactionType] || 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {row.category || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {row._valid ? (
                      <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'success.main' }} />
                    ) : (
                      <ErrorRoundedIcon fontSize="small" sx={{ color: 'error.main' }} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

TransactionImportPreview.propTypes = {
  uploadedFiles: PropTypes.array.isRequired,
  parsedRows: PropTypes.array.isRequired,
  validCount: PropTypes.number.isRequired,
  invalidCount: PropTypes.number.isRequired,
  importing: PropTypes.bool,
  clearingDecision: PropTypes.bool,
  onClear: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  onRemoveRow: PropTypes.func.isRequired,
}
