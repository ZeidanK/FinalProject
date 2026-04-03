import { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { confidenceColor, confidenceLabel } from '../utils/invoiceExtraction'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS']

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.04)',
  },
}

function FieldLabel({ label, confidence }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <Chip
        label={confidenceLabel(confidence)}
        size="small"
        color={confidenceColor(confidence ?? 0)}
      />
    </Stack>
  )
}

FieldLabel.propTypes = {
  label: PropTypes.string.isRequired,
  confidence: PropTypes.number,
}

export default function InvoiceVerificationModal(props) {
  const open = props.open
  const onClose = props.onClose
  const onSave = props.onSave
  const initialData = props.initialData
  const fileName = props.fileName
  const extractionMethod = props.extractionMethod
  const saving = props.saving

  const [form, setForm] = useState(function () {
    return initialData ? structuredClone(initialData) : {}
  })

  const updateField = useCallback(function (field, value) {
    setForm(function (prev) {
      const next = { ...prev}
      next[field] = { ...prev[field], value: value}

      if (field === 'vatRate') {
        const sub = Number.parseFloat(next.subtotal?.value) || 0
        const rate = Number.parseFloat(value) || 0
        if (sub > 0 && rate > 0) {
          const vat = +(sub * rate / 100).toFixed(2)
          next.vatAmount = { ...next.vatAmount, value: vat}
          next.totalAmount = { ...next.totalAmount, value: +(sub + vat).toFixed(2)}
        }
      }

      if (field === 'subtotal' || field === 'vatAmount') {
        const s = Number.parseFloat(field === 'subtotal' ? value : (next.subtotal?.value)) || 0
        const v = Number.parseFloat(field === 'vatAmount' ? value : (next.vatAmount?.value)) || 0
        next.totalAmount = { ...next.totalAmount, value: +(s + v).toFixed(2)}
      }

      return next
    })
  }, [])

  const updateLineItem = useCallback(function (index, key, value) {
    setForm(function (prev) {
      const items = prev.lineItems.slice()
      items[index] = { ...items[index]}
      items[index][key] = value
      if (key === 'quantity' || key === 'unitPrice') {
        const qty = key === 'quantity' ? (Number.parseFloat(value) || 0) : (Number.parseFloat(items[index].quantity) || 0)
        const up = key === 'unitPrice' ? (Number.parseFloat(value) || 0) : (Number.parseFloat(items[index].unitPrice) || 0)
        items[index].totalAmount = +(qty * up).toFixed(2)
      }
      return { ...prev, lineItems: items}
    })
  }, [])

  const addLineItem = useCallback(function () {
    setForm(function (prev) {
      return { ...prev, lineItems: prev.lineItems.concat([
          { id: Date.now(), description: '', quantity: 1, unitPrice: 0, totalAmount: 0, confidence: null }
        ])}
    })
  }, [])

  const removeLineItem = useCallback(function (index) {
    setForm(function (prev) {
      return { ...prev, lineItems: prev.lineItems.filter(function (_, i) { return i !== index })}
    })
  }, [])

  const handleSave = useCallback(function () {
    onSave(form)
  }, [form, onSave])

  const overallConfidence = useMemo(function () {
    if (!initialData) return 0
    const fields = ['vendorName', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'subtotal', 'vatAmount', 'currency', 'vendorTaxId', 'lastFourDigitsCard']
    let total = 0
    for (const element of fields) {
      const f = initialData[element]
      total += (f?.confidence == null) ? 0 : f.confidence
    }
    return total / fields.length
  }, [initialData])

  const lineItems = form.lineItems || []

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6">Verify Extracted Data</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {fileName}
            </Typography>
            {extractionMethod ? (
              <Chip
                label={extractionMethod.toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
            ) : null}
            <Chip
              label={confidenceLabel(overallConfidence)}
              size="small"
              color={confidenceColor(overallConfidence)}
            />
          </Stack>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Vendor Name" confidence={form.vendorName?.confidence} />
              <TextField
                fullWidth size="small" sx={fieldSx}
                value={(form.vendorName?.value) || ''}
                onChange={function (e) { updateField('vendorName', e.target.value) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Invoice Number" confidence={form.invoiceNumber?.confidence} />
              <TextField
                fullWidth size="small" sx={fieldSx}
                value={(form.invoiceNumber?.value) || ''}
                onChange={function (e) { updateField('invoiceNumber', e.target.value) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Invoice Date" confidence={form.invoiceDate?.confidence} />
              <TextField
                fullWidth size="small" type="date" sx={fieldSx}
                value={(form.invoiceDate?.value) || ''}
                onChange={function (e) { updateField('invoiceDate', e.target.value) }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Due Date" confidence={form.dueDate?.confidence} />
              <TextField
                fullWidth size="small" type="date" sx={fieldSx}
                value={(form.dueDate?.value) || ''}
                onChange={function (e) { updateField('dueDate', e.target.value) }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Currency" confidence={form.currency?.confidence} />
              <TextField
                fullWidth size="small" select sx={fieldSx}
                value={(form.currency?.value) || 'USD'}
                onChange={function (e) { updateField('currency', e.target.value) }}
              >
                {CURRENCIES.map(function (c) {
                  return <MenuItem key={c} value={c}>{c}</MenuItem>
                })}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="VAT Rate (%)" confidence={form.vatRate?.confidence} />
              <TextField
                fullWidth size="small" type="number" sx={fieldSx}
                value={form.vatRate?.value == null ? '' : form.vatRate.value}
                onChange={function (e) { updateField('vatRate', e.target.value) }}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Vendor Tax ID" confidence={form.vendorTaxId?.confidence} />
              <TextField
                fullWidth size="small" sx={fieldSx}
                value={(form.vendorTaxId?.value) || ''}
                onChange={function (e) { updateField('vendorTaxId', e.target.value) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Last 4 Digits Card" confidence={form.lastFourDigitsCard?.confidence} />
              <TextField
                fullWidth size="small" sx={fieldSx}
                slotProps={{ htmlInput: { maxLength: 4 } }}
                value={(form.lastFourDigitsCard?.value) || ''}
                onChange={function (e) { updateField('lastFourDigitsCard', e.target.value) }}
                placeholder="e.g., 1234"
              />
            </Grid>
          </Grid>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>Line Items</Typography>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={addLineItem}>
                Add Row
              </Button>
            </Stack>
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <TableCell>Description</TableCell>
                    <TableCell align="right" sx={{ width: 90 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>Total</TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>Conf.</TableCell>
                    <TableCell sx={{ width: 50 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineItems.length > 0 ? (
                    lineItems.map(function (item, idx) {
                      return (
                        <TableRow key={item.id == null ? idx : item.id}>
                          <TableCell>
                            <TextField
                              fullWidth size="small" variant="standard"
                              value={item.description}
                              onChange={function (e) { updateLineItem(idx, 'description', e.target.value) }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small" variant="standard" type="number"
                              value={item.quantity}
                              onChange={function (e) { updateLineItem(idx, 'quantity', e.target.value) }}
                              slotProps={{ htmlInput: { min: 0, step: 1, style: { textAlign: 'right' } } }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small" variant="standard" type="number"
                              value={item.unitPrice}
                              onChange={function (e) { updateLineItem(idx, 'unitPrice', e.target.value) }}
                              slotProps={{ htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } } }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {Number(item.totalAmount || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {item.confidence == null ? null : (
                              <Chip
                                label={confidenceLabel(item.confidence)}
                                size="small"
                                color={confidenceColor(item.confidence)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={function () { removeLineItem(idx) }}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No line items extracted. Click &quot;Add Row&quot; to add manually.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={confidenceLabel(form.subtotal?.confidence)} size="small" color={confidenceColor((form.subtotal?.confidence) || 0)} />
                  <TextField
                    size="small" type="number" sx={({ ...fieldSx, width: 140})}
                    value={form.subtotal?.value == null ? '' : form.subtotal.value}
                    onChange={function (e) { updateField('subtotal', e.target.value) }}
                    slotProps={{ htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } } }}
                  />
                </Stack>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">VAT Amount</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={confidenceLabel(form.vatAmount?.confidence)} size="small" color={confidenceColor((form.vatAmount?.confidence) || 0)} />
                  <TextField
                    size="small" type="number" sx={({ ...fieldSx, width: 140})}
                    value={form.vatAmount?.value == null ? '' : form.vatAmount.value}
                    onChange={function (e) { updateField('vatAmount', e.target.value) }}
                    slotProps={{ htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } } }}
                  />
                </Stack>
              </Stack>

              <Stack
                direction="row" justifyContent="space-between" alignItems="center"
                sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="subtitle1" fontWeight={700}>Total Amount</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={confidenceLabel(form.totalAmount?.confidence)} size="small" color={confidenceColor((form.totalAmount?.confidence) || 0)} />
                  <TextField
                    size="small" type="number" sx={({ ...fieldSx, width: 140})}
                    value={form.totalAmount?.value == null ? '' : form.totalAmount.value}
                    onChange={function (e) { updateField('totalAmount', e.target.value) }}
                    slotProps={{ htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right', fontWeight: 700 } } }}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save & Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

InvoiceVerificationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  fileName: PropTypes.string,
  extractionMethod: PropTypes.string,
  saving: PropTypes.bool,
}
