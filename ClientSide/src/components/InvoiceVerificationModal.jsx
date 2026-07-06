import { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { confidenceColor, confidenceLabel } from '../utils/invoiceExtraction'
import ConfidenceFieldRow from './ConfidenceFieldRow'
import InvoicePdfPreview from './InvoicePdfPreview'
import ModalShell from './ModalShell'

/**
 * Supported currency codes used in the invoice verification form.
 * @type {string[]}
 */
const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS']

/**
 * Shared styling for editable text fields in the verification modal.
 * @type {import('@mui/material').SxProps}
 */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.04)',
  },
}

/**
 * Render a field label with an attached confidence badge.
 *
 * @param {{label: string, confidence?: number}} props
 * @param {string} props.label - Display label text.
 * @param {number} [props.confidence] - Confidence score used to color the badge.
 * @returns {JSX.Element}
 */
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

/**
 * Modal for reviewing and correcting extracted invoice fields with a PDF preview.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {function(): void} props.onClose - Close callback invoked when the modal is dismissed.
 * @param {function(object): void} props.onSave - Save callback invoked with the current form state.
 * @param {object} [props.initialData] - Extracted invoice field values with optional confidence metadata.
 * @param {string} [props.fileName] - Name of the invoice file displayed in the header.
 * @param {string} [props.fileType] - MIME type of the invoice file.
 * @param {number} [props.invoiceId] - Invoice identifier used for PDF preview rendering.
 * @param {string} [props.token] - Authorization token used by the PDF preview component.
 * @param {File} [props.localFile] - Local file selected for preview when the invoice is not remote.
 * @param {string} [props.extractionMethod] - Method used to extract invoice data, shown as a badge.
 * @param {boolean} [props.saving] - Whether the save action is currently in progress.
 * @param {boolean} [props.readOnly] - Whether invoice fields should be view-only.
 * @returns {JSX.Element}
 */
export default function InvoiceVerificationModal(props) {
  const open = props.open
  const onClose = props.onClose
  const onSave = props.onSave
  const initialData = props.initialData
  const fileName = props.fileName
  const fileType = props.fileType
  const invoiceId = props.invoiceId
  const uploadJobId = props.uploadJobId
  const token = props.token
  const localFile = props.localFile
  const extractionMethod = props.extractionMethod
  const saving = props.saving
  const readOnly = Boolean(props.readOnly)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [activeTab, setActiveTab] = useState('pdf')

  const [form, setForm] = useState(function () {
    return initialData ? structuredClone(initialData) : {}
  })

  /**
   * Update a single top-level form field or nested payment plan field.
   * Automatically recalculates VAT and total amount when related fields change.
   *
   * @param {string} field - Field name or nested paymentPlan path.
   * @param {string|number} value - New field value.
   */
  const updateField = useCallback(function (field, value) {
    setForm(function (prev) {
      const next = { ...prev}

      if (field.startsWith('paymentPlan.')) {
        const subfield = field.split('.')[1]
        next.paymentPlan = { ...prev.paymentPlan }
        next.paymentPlan[subfield] = { ...prev.paymentPlan?.[subfield], value: value }
        return next
      }

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

  /**
   * Update a field value on a specific line item and recalculate line total when needed.
   *
   * @param {number} index - Zero-based line item index.
   * @param {string} key - Line item field key.
   * @param {string|number} value - New value for the field.
   */
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

  /**
   * Append a new blank line item to the invoice form.
   */
  const addLineItem = useCallback(function () {
    setForm(function (prev) {
      return { ...prev, lineItems: prev.lineItems.concat([
          { id: Date.now(), description: '', quantity: 1, unitPrice: 0, totalAmount: 0, confidence: null }
        ])}
    })
  }, [])

  /**
   * Remove a line item from the invoice form by index.
   *
   * @param {number} index - Zero-based index of the line item to remove.
   */
  const removeLineItem = useCallback(function (index) {
    setForm(function (prev) {
      return { ...prev, lineItems: prev.lineItems.filter(function (_, i) { return i !== index })}
    })
  }, [])

  /**
   * Persist the current verification form values by invoking the save callback.
   */
  const handleSave = useCallback(function () {
    if (readOnly) return
    onSave(form)
  }, [form, onSave, readOnly])

  /**
   * Compute an aggregate confidence score for the invoice fields.
   * Returns 0 when there is no extracted initial data.
   */
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

  /**
   * Close the modal and reset the active mobile tab to the PDF preview.
   */
  const handleClose = useCallback(function () {
    setActiveTab('pdf')
    onClose()
  }, [onClose])

  const formContent = (
    <Stack spacing={3} sx={{ pb: 0.5 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel label="Vendor Name" confidence={form.vendorName?.confidence} />
          <TextField
            fullWidth size="small" sx={fieldSx}
            disabled={readOnly}
            value={(form.vendorName?.value) || ''}
            onChange={function (e) { updateField('vendorName', e.target.value) }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel label="Invoice Number" confidence={form.invoiceNumber?.confidence} />
          <TextField
            fullWidth size="small" sx={fieldSx}
            disabled={readOnly}
            value={(form.invoiceNumber?.value) || ''}
            onChange={function (e) { updateField('invoiceNumber', e.target.value) }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel label="Invoice Date" confidence={form.invoiceDate?.confidence} />
          <TextField
            fullWidth size="small" type="date" sx={fieldSx}
            disabled={readOnly}
            value={(form.invoiceDate?.value) || ''}
            onChange={function (e) { updateField('invoiceDate', e.target.value) }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel label="Due Date" confidence={form.dueDate?.confidence} />
          <TextField
            fullWidth size="small" type="date" sx={fieldSx}
            disabled={readOnly}
            value={(form.dueDate?.value) || ''}
            onChange={function (e) { updateField('dueDate', e.target.value) }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel label="Currency" confidence={form.currency?.confidence} />
          <TextField
            fullWidth size="small" select sx={fieldSx}
            disabled={readOnly}
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
            disabled={readOnly}
            value={form.vatRate?.value == null ? '' : form.vatRate.value}
            onChange={function (e) { updateField('vatRate', e.target.value) }}
            slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel label="Vendor Tax ID" confidence={form.vendorTaxId?.confidence} />
          <TextField
            fullWidth size="small" sx={fieldSx}
            disabled={readOnly}
            value={(form.vendorTaxId?.value) || ''}
            onChange={function (e) { updateField('vendorTaxId', e.target.value) }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel label="Last 4 Digits Card" confidence={form.lastFourDigitsCard?.confidence} />
          <TextField
            fullWidth size="small" sx={fieldSx}
            disabled={readOnly}
            slotProps={{ htmlInput: { maxLength: 4 } }}
            value={(form.lastFourDigitsCard?.value) || ''}
            onChange={function (e) { updateField('lastFourDigitsCard', e.target.value) }}
            placeholder="e.g., 1234"
          />
        </Grid>

        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>Payment Plan</Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel
            label="Total Installments"
            confidence={form.paymentPlan?.totalInstallments?.confidence}
          />
          <TextField
            fullWidth size="small" type="number" sx={fieldSx}
            disabled={readOnly}
            value={form.paymentPlan?.totalInstallments?.value ?? ''}
            onChange={function (e) { updateField('paymentPlan.totalInstallments', e.target.value) }}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel
            label="Installment Amount"
            confidence={form.paymentPlan?.installmentAmount?.confidence}
          />
          <TextField
            fullWidth size="small" type="number" sx={fieldSx}
            disabled={readOnly}
            value={form.paymentPlan?.installmentAmount?.value ?? ''}
            onChange={function (e) { updateField('paymentPlan.installmentAmount', e.target.value) }}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel label="Frequency" confidence={form.paymentPlan?.frequency?.confidence} />
          <TextField
            fullWidth size="small" sx={fieldSx}
            disabled={readOnly}
            value={(form.paymentPlan?.frequency?.value) || ''}
            onChange={function (e) { updateField('paymentPlan.frequency', e.target.value) }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FieldLabel
            label="Current Installment"
            confidence={form.paymentPlan?.currentInstallment?.confidence}
          />
          <TextField
            fullWidth size="small" type="number" sx={fieldSx}
            disabled={readOnly}
            value={form.paymentPlan?.currentInstallment?.value ?? ''}
            onChange={function (e) { updateField('paymentPlan.currentInstallment', e.target.value) }}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FieldLabel
            label="Description"
            confidence={form.paymentPlan?.description?.confidence}
          />
          <TextField
            fullWidth size="small" multiline minRows={2} sx={fieldSx}
            disabled={readOnly}
            value={(form.paymentPlan?.description?.value) || ''}
            onChange={function (e) { updateField('paymentPlan.description', e.target.value) }}
          />
        </Grid>
      </Grid>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>Line Items</Typography>
          {!readOnly ? (
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={addLineItem}>
              Add Row
            </Button>
          ) : null}
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
                          disabled={readOnly}
                          value={item.description}
                          onChange={function (e) { updateLineItem(idx, 'description', e.target.value) }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small" variant="standard" type="number"
                          disabled={readOnly}
                          value={item.quantity}
                          onChange={function (e) { updateLineItem(idx, 'quantity', e.target.value) }}
                          slotProps={{ htmlInput: { min: 0, step: 1, style: { textAlign: 'right' } } }}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small" variant="standard" type="number"
                          disabled={readOnly}
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
                        {!readOnly ? (
                          <IconButton size="small" aria-label="Remove line item" onClick={function () { removeLineItem(idx) }}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {readOnly ? 'No line items available.' : 'No line items extracted. Click "Add Row" to add manually.'}
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
          <ConfidenceFieldRow
            label="Subtotal"
            value={form.subtotal?.value}
            confidence={form.subtotal?.confidence}
            onChange={(value) => updateField('subtotal', value)}
            fieldSx={fieldSx}
            disabled={readOnly}
          />

          <ConfidenceFieldRow
            label="VAT Amount"
            value={form.vatAmount?.value}
            confidence={form.vatAmount?.confidence}
            onChange={(value) => updateField('vatAmount', value)}
            fieldSx={fieldSx}
            disabled={readOnly}
          />

          <ConfidenceFieldRow
            label="Total Amount"
            value={form.totalAmount?.value}
            confidence={form.totalAmount?.confidence}
            onChange={(value) => updateField('totalAmount', value)}
            fieldSx={fieldSx}
            disabled={readOnly}
            labelVariant="subtitle1"
            labelColor="text.primary"
            labelFontWeight={700}
            rowSx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
            inputWeight={700}
          />
        </Stack>
      </Box>
    </Stack>
  )

  const pdfContent = (
    <InvoicePdfPreview
      open={open}
      invoiceId={invoiceId}
      uploadJobId={uploadJobId}
      token={token}
      fileName={fileName}
      fileType={fileType}
      localFile={localFile}
    />
  )

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      title={(
        <Stack spacing={0.5}>
          <Typography variant="h6">{readOnly ? 'Invoice Details' : 'Verify Extracted Data'}</Typography>
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
      )}
      headerAction={(
        <IconButton aria-label="Close" onClick={handleClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      )}
      actions={(
        <>
          <Button onClick={handleClose} color="inherit">
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly ? (
            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Confirm'}
            </Button>
          ) : null}
        </>
      )}
    >
      {isMobile ? (
        <Stack spacing={1.5}>
          <Tabs
            value={activeTab}
            onChange={function (_, nextTab) { setActiveTab(nextTab) }}
            variant="fullWidth"
            sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab value="pdf" label="PDF" />
            <Tab value="form" label="Form" />
          </Tabs>

          {activeTab === 'pdf' ? pdfContent : null}

          {activeTab === 'form' ? (
            <Box sx={{ maxHeight: '65vh', overflowY: 'auto', pr: 0.25 }}>
              {formContent}
            </Box>
          ) : null}
        </Stack>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {pdfContent}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ maxHeight: '72vh', overflowY: 'auto', pr: 0.5 }}>
              {formContent}
            </Box>
          </Grid>
        </Grid>
      )}
    </ModalShell>
  )
}

InvoiceVerificationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  fileName: PropTypes.string,
  fileType: PropTypes.string,
  invoiceId: PropTypes.number,
  uploadJobId: PropTypes.number,
  token: PropTypes.string,
  localFile: PropTypes.instanceOf(File),
  extractionMethod: PropTypes.string,
  saving: PropTypes.bool,
  readOnly: PropTypes.bool,
}
