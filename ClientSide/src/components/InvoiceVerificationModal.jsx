import { useCallback, useEffect, useMemo, useState } from 'react'
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

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS']

function confidenceColor(score) {
  if (score >= 0.9) return 'success'
  if (score >= 0.7) return 'warning'
  return 'error'
}

function confidenceLabel(score) {
  if (score == null) return '-'
  return Math.round(score * 100) + '%'
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.04)',
  },
}

export function mapExtractedToForm(ext, overallConfidence) {
  if (!ext) return {
    vendorName: { value: '', confidence: 0 },
    invoiceNumber: { value: '', confidence: 0 },
    invoiceDate: { value: '', confidence: 0 },
    dueDate: { value: '', confidence: 0 },
    currency: { value: 'USD', confidence: 0 },
    vatRate: { value: '', confidence: 0 },
    vendorTaxId: { value: '', confidence: 0 },
    lastFourDigitsCard: { value: '', confidence: 0 },
    subtotal: { value: '', confidence: 0 },
    vatAmount: { value: '', confidence: 0 },
    totalAmount: { value: '', confidence: 0 },
    lineItems: [],
  }

  var c = overallConfidence != null ? overallConfidence : (ext.extractionConfidence != null ? ext.extractionConfidence : 0)

  function dateVal(d) {
    if (!d) return ''
    if (typeof d === 'string') {
      // Handle ISO datetime like "2025-04-27T00:00:00"
      if (d.indexOf('T') !== -1) return d.split('T')[0]
      // Already date-only
      if (d.length >= 10) return d.slice(0, 10)
    }
    return ''
  }

  function fieldConf(fieldValue) {
    // If field has a value, use overall confidence; if null/empty, confidence is 0
    return fieldValue != null && fieldValue !== '' ? c : 0
  }

  return {
    vendorName: { value: ext.vendorName || '', confidence: fieldConf(ext.vendorName) },
    invoiceNumber: { value: ext.invoiceNumber || '', confidence: fieldConf(ext.invoiceNumber) },
    invoiceDate: { value: dateVal(ext.invoiceDate), confidence: fieldConf(ext.invoiceDate) },
    dueDate: { value: dateVal(ext.dueDate), confidence: fieldConf(ext.dueDate) },
    currency: { value: ext.currency || 'USD', confidence: fieldConf(ext.currency) },
    vatRate: { value: ext.vatRate != null ? ext.vatRate : '', confidence: fieldConf(ext.vatRate) },
    vendorTaxId: { value: ext.vendorTaxId || '', confidence: fieldConf(ext.vendorTaxId) },
    lastFourDigitsCard: { value: ext.lastFourDigitsCard || '', confidence: fieldConf(ext.lastFourDigitsCard) },
    subtotal: { value: ext.subtotal != null ? ext.subtotal : '', confidence: fieldConf(ext.subtotal) },
    vatAmount: { value: ext.vatAmount != null ? ext.vatAmount : '', confidence: fieldConf(ext.vatAmount) },
    totalAmount: { value: ext.totalAmount != null ? ext.totalAmount : '', confidence: fieldConf(ext.totalAmount) },
    lineItems: (ext.lineItems || []).map(function (li, idx) {
      return {
        id: idx,
        description: li.description || '',
        quantity: li.quantity != null ? li.quantity : 1,
        unitPrice: li.unitPrice != null ? li.unitPrice : 0,
        totalAmount: li.totalAmount != null ? li.totalAmount : 0,
        confidence: li.aiConfidenceScore != null ? li.aiConfidenceScore : 0.7,
      }
    }),
  }
}

function FieldLabel({ label, confidence }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <Chip
        label={confidenceLabel(confidence)}
        size="small"
        color={confidenceColor(confidence != null ? confidence : 0)}
      />
    </Stack>
  )
}

export default function InvoiceVerificationModal(props) {
  var open = props.open
  var onClose = props.onClose
  var onSave = props.onSave
  var initialData = props.initialData
  var fileName = props.fileName
  var extractionMethod = props.extractionMethod
  var saving = props.saving

  const [form, setForm] = useState(function () {
    return initialData ? JSON.parse(JSON.stringify(initialData)) : {}
  })

  useEffect(function () {
    if (initialData) {
      setForm(JSON.parse(JSON.stringify(initialData)))
    }
  }, [initialData])

  var updateField = useCallback(function (field, value) {
    setForm(function (prev) {
      var next = Object.assign({}, prev)
      next[field] = Object.assign({}, prev[field], { value: value })

      if (field === 'vatRate') {
        var sub = parseFloat(next.subtotal && next.subtotal.value) || 0
        var rate = parseFloat(value) || 0
        if (sub > 0 && rate > 0) {
          var vat = +(sub * rate / 100).toFixed(2)
          next.vatAmount = Object.assign({}, next.vatAmount, { value: vat })
          next.totalAmount = Object.assign({}, next.totalAmount, { value: +(sub + vat).toFixed(2) })
        }
      }

      if (field === 'subtotal' || field === 'vatAmount') {
        var s = parseFloat(field === 'subtotal' ? value : (next.subtotal && next.subtotal.value)) || 0
        var v = parseFloat(field === 'vatAmount' ? value : (next.vatAmount && next.vatAmount.value)) || 0
        next.totalAmount = Object.assign({}, next.totalAmount, { value: +(s + v).toFixed(2) })
      }

      return next
    })
  }, [])

  var updateLineItem = useCallback(function (index, key, value) {
    setForm(function (prev) {
      var items = prev.lineItems.slice()
      items[index] = Object.assign({}, items[index])
      items[index][key] = value
      if (key === 'quantity' || key === 'unitPrice') {
        var qty = key === 'quantity' ? (parseFloat(value) || 0) : (parseFloat(items[index].quantity) || 0)
        var up = key === 'unitPrice' ? (parseFloat(value) || 0) : (parseFloat(items[index].unitPrice) || 0)
        items[index].totalAmount = +(qty * up).toFixed(2)
      }
      return Object.assign({}, prev, { lineItems: items })
    })
  }, [])

  var addLineItem = useCallback(function () {
    setForm(function (prev) {
      return Object.assign({}, prev, {
        lineItems: prev.lineItems.concat([
          { id: Date.now(), description: '', quantity: 1, unitPrice: 0, totalAmount: 0, confidence: null }
        ])
      })
    })
  }, [])

  var removeLineItem = useCallback(function (index) {
    setForm(function (prev) {
      return Object.assign({}, prev, {
        lineItems: prev.lineItems.filter(function (_, i) { return i !== index })
      })
    })
  }, [])

  var handleSave = useCallback(function () {
    onSave(form)
  }, [form, onSave])

  var overallConfidence = useMemo(function () {
    if (!initialData) return 0
    var fields = ['vendorName', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'subtotal', 'vatAmount', 'currency', 'vendorTaxId', 'lastFourDigitsCard']
    var total = 0
    for (var i = 0; i < fields.length; i++) {
      var f = initialData[fields[i]]
      total += (f && f.confidence != null) ? f.confidence : 0
    }
    return total / fields.length
  }, [initialData])

  var lineItems = form.lineItems || []

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
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
              <FieldLabel label="Vendor Name" confidence={form.vendorName && form.vendorName.confidence} />
              <TextField
                fullWidth size="small" sx={fieldSx}
                value={(form.vendorName && form.vendorName.value) || ''}
                onChange={function (e) { updateField('vendorName', e.target.value) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Invoice Number" confidence={form.invoiceNumber && form.invoiceNumber.confidence} />
              <TextField
                fullWidth size="small" sx={fieldSx}
                value={(form.invoiceNumber && form.invoiceNumber.value) || ''}
                onChange={function (e) { updateField('invoiceNumber', e.target.value) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Invoice Date" confidence={form.invoiceDate && form.invoiceDate.confidence} />
              <TextField
                fullWidth size="small" type="date" sx={fieldSx}
                value={(form.invoiceDate && form.invoiceDate.value) || ''}
                onChange={function (e) { updateField('invoiceDate', e.target.value) }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Due Date" confidence={form.dueDate && form.dueDate.confidence} />
              <TextField
                fullWidth size="small" type="date" sx={fieldSx}
                value={(form.dueDate && form.dueDate.value) || ''}
                onChange={function (e) { updateField('dueDate', e.target.value) }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Currency" confidence={form.currency && form.currency.confidence} />
              <TextField
                fullWidth size="small" select sx={fieldSx}
                value={(form.currency && form.currency.value) || 'USD'}
                onChange={function (e) { updateField('currency', e.target.value) }}
              >
                {CURRENCIES.map(function (c) {
                  return <MenuItem key={c} value={c}>{c}</MenuItem>
                })}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="VAT Rate (%)" confidence={form.vatRate && form.vatRate.confidence} />
              <TextField
                fullWidth size="small" type="number" sx={fieldSx}
                value={form.vatRate != null && form.vatRate.value != null ? form.vatRate.value : ''}
                onChange={function (e) { updateField('vatRate', e.target.value) }}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Vendor Tax ID" confidence={form.vendorTaxId && form.vendorTaxId.confidence} />
              <TextField
                fullWidth size="small" sx={fieldSx}
                value={(form.vendorTaxId && form.vendorTaxId.value) || ''}
                onChange={function (e) { updateField('vendorTaxId', e.target.value) }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldLabel label="Last 4 Digits Card" confidence={form.lastFourDigitsCard && form.lastFourDigitsCard.confidence} />
              <TextField
                fullWidth size="small" sx={fieldSx}
                inputProps={{ maxLength: 4 }}
                value={(form.lastFourDigitsCard && form.lastFourDigitsCard.value) || ''}
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
                        <TableRow key={item.id != null ? item.id : idx}>
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
                            {item.confidence != null ? (
                              <Chip
                                label={confidenceLabel(item.confidence)}
                                size="small"
                                color={confidenceColor(item.confidence)}
                              />
                            ) : null}
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
                  <Chip label={confidenceLabel(form.subtotal && form.subtotal.confidence)} size="small" color={confidenceColor((form.subtotal && form.subtotal.confidence) || 0)} />
                  <TextField
                    size="small" type="number" sx={Object.assign({}, fieldSx, { width: 140 })}
                    value={form.subtotal != null && form.subtotal.value != null ? form.subtotal.value : ''}
                    onChange={function (e) { updateField('subtotal', e.target.value) }}
                    slotProps={{ htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } } }}
                  />
                </Stack>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">VAT Amount</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={confidenceLabel(form.vatAmount && form.vatAmount.confidence)} size="small" color={confidenceColor((form.vatAmount && form.vatAmount.confidence) || 0)} />
                  <TextField
                    size="small" type="number" sx={Object.assign({}, fieldSx, { width: 140 })}
                    value={form.vatAmount != null && form.vatAmount.value != null ? form.vatAmount.value : ''}
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
                  <Chip label={confidenceLabel(form.totalAmount && form.totalAmount.confidence)} size="small" color={confidenceColor((form.totalAmount && form.totalAmount.confidence) || 0)} />
                  <TextField
                    size="small" type="number" sx={Object.assign({}, fieldSx, { width: 140 })}
                    value={form.totalAmount != null && form.totalAmount.value != null ? form.totalAmount.value : ''}
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
