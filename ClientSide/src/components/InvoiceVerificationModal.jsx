import { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Chip,
  Collapse,
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
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import { confidenceColor, confidenceLabel, confidenceBorderColor, invoiceFullConfidence, lowConfidenceFields } from '../utils/invoiceExtraction'
import ConfidenceFieldRow from './ConfidenceFieldRow'
import InvoicePdfPreview from './InvoicePdfPreview'
import ModalShell from './ModalShell'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS']

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.04)',
  },
}

function FieldLabel({ label, confidence }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: confidence == null ? 'transparent' : confidenceBorderColor(confidence),
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      {confidence != null && confidence < 0.9 ? (
        <Chip
          label={confidenceLabel(confidence)}
          size="small"
          color={confidenceColor(confidence)}
        />
      ) : null}
    </Stack>
  )
}

FieldLabel.propTypes = {
  label: PropTypes.string.isRequired,
  confidence: PropTypes.number,
}

function SectionCard({ title, icon, children, defaultExpanded, collapsible }) {
  const [expanded, setExpanded] = useState(defaultExpanded !== false)

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'rgba(43,54,81,0.5)',
        borderRadius: 2.5,
        bgcolor: 'rgba(255,255,255,0.015)',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: collapsible ? '1px solid rgba(43,54,81,0.3)' : 'none',
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
          '&:hover': collapsible ? { bgcolor: 'rgba(255,255,255,0.02)' } : {},
        }}
        onClick={collapsible ? function () { setExpanded(function (v) { return !v }) } : undefined}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {icon || null}
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            {title}
          </Typography>
        </Stack>
        {collapsible ? (
          <IconButton size="small" sx={{ color: 'text.disabled' }}>
            {expanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
          </IconButton>
        ) : null}
      </Stack>
      {collapsible ? (
        <Collapse in={expanded}>
          <Box sx={{ p: 2 }}>{children}</Box>
        </Collapse>
      ) : (
        <Box sx={{ p: 2 }}>{children}</Box>
      )}
    </Box>
  )
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  defaultExpanded: PropTypes.bool,
  collapsible: PropTypes.bool,
}

function GridField({ size, confidence, children, ...rest }) {
  return (
    <Grid size={size} sx={{ borderLeft: 3, borderColor: confidence == null ? 'transparent' : confidenceBorderColor(confidence), pl: 1.5 }} {...rest}>
      {children}
    </Grid>
  )
}

GridField.propTypes = {
  size: PropTypes.object.isRequired,
  confidence: PropTypes.number,
  children: PropTypes.node,
}

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

  const updateField = useCallback(function (field, value) {
    setForm(function (prev) {
      const next = { ...prev }

      if (field.startsWith('paymentPlan.')) {
        const subfield = field.split('.')[1]
        next.paymentPlan = { ...prev.paymentPlan }
        next.paymentPlan[subfield] = { ...prev.paymentPlan?.[subfield], value: value }
        return next
      }

      next[field] = { ...prev[field], value: value }

      if (field === 'vatRate') {
        const sub = Number.parseFloat(next.subtotal?.value) || 0
        const rate = Number.parseFloat(value) || 0
        if (sub > 0 && rate > 0) {
          const vat = +(sub * rate / 100).toFixed(2)
          next.vatAmount = { ...next.vatAmount, value: vat }
          next.totalAmount = { ...next.totalAmount, value: +(sub + vat).toFixed(2) }
        }
      }

      if (field === 'subtotal' || field === 'vatAmount') {
        const s = Number.parseFloat(field === 'subtotal' ? value : (next.subtotal?.value)) || 0
        const v = Number.parseFloat(field === 'vatAmount' ? value : (next.vatAmount?.value)) || 0
        next.totalAmount = { ...next.totalAmount, value: +(s + v).toFixed(2) }
      }

      return next
    })
  }, [])

  const updateLineItem = useCallback(function (index, key, value) {
    setForm(function (prev) {
      const items = prev.lineItems.slice()
      items[index] = { ...items[index] }
      items[index][key] = value
      if (key === 'quantity' || key === 'unitPrice') {
        const qty = key === 'quantity' ? (Number.parseFloat(value) || 0) : (Number.parseFloat(items[index].quantity) || 0)
        const up = key === 'unitPrice' ? (Number.parseFloat(value) || 0) : (Number.parseFloat(items[index].unitPrice) || 0)
        items[index].totalAmount = +(qty * up).toFixed(2)
      }
      return { ...prev, lineItems: items }
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
      return { ...prev, lineItems: prev.lineItems.filter(function (_, i) { return i !== index }) }
    })
  }, [])

  const handleSave = useCallback(function () {
    if (readOnly) return
    onSave(form)
  }, [form, onSave, readOnly])

  const overallConfidence = useMemo(function () {
    return invoiceFullConfidence(initialData) ?? 0
  }, [initialData])

  const flaggedFields = useMemo(function () {
    return lowConfidenceFields(form)
  }, [form])

  const lineItems = form.lineItems || []

  const hasPaymentData = useMemo(function () {
    const pp = form.paymentPlan
    if (!pp) return false
    return (
      (pp.totalInstallments?.value != null && pp.totalInstallments?.value !== '') ||
      (pp.installmentAmount?.value != null && pp.installmentAmount?.value !== '') ||
      (pp.frequency?.value != null && pp.frequency?.value !== '') ||
      (pp.currentInstallment?.value != null && pp.currentInstallment?.value !== '') ||
      (pp.description?.value != null && pp.description?.value !== '')
    )
  }, [form.paymentPlan])

  const handleClose = useCallback(function () {
    setActiveTab('pdf')
    onClose()
  }, [onClose])

  const needsReviewColor = flaggedFields.length > 0 ? 'warning' : 'success'
  const needsReviewIcon = flaggedFields.length > 0
    ? <WarningAmberRoundedIcon sx={{ fontSize: 18, color: 'warning.main' }} />
    : <TaskAltRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />

  const formContent = (
    <Stack spacing={2}>
      {flaggedFields.length > 0 ? (
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderRadius: 2,
            bgcolor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberRoundedIcon sx={{ fontSize: 18, color: 'warning.main' }} />
            <Typography variant="body2" fontWeight={600} color="warning.main">
              {flaggedFields.length} field{flaggedFields.length > 1 ? 's' : ''} need{flaggedFields.length === 1 ? 's' : ''} review
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.75 }}>
            {flaggedFields.map(function (f) {
              return (
                <Chip
                  key={f.field}
                  label={f.label + ' (' + confidenceLabel(f.confidence) + ')'}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )
            })}
          </Stack>
        </Box>
      ) : initialData ? (
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderRadius: 2,
            bgcolor: 'rgba(55,214,122,0.08)',
            border: '1px solid rgba(55,214,122,0.2)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <TaskAltRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
            <Typography variant="body2" fontWeight={600} color="success.main">
              All fields have high confidence
            </Typography>
          </Stack>
        </Box>
      ) : null}

      <SectionCard title="Basic Information">
        <Grid container spacing={2}>
          <GridField size={{ xs: 12, sm: 6 }} confidence={form.vendorName?.confidence}>
            <FieldLabel label="Vendor Name" confidence={form.vendorName?.confidence} />
            <TextField
              fullWidth size="small" sx={fieldSx}
              disabled={readOnly}
              value={form.vendorName?.value || ''}
              onChange={function (e) { updateField('vendorName', e.target.value) }}
            />
          </GridField>

          <GridField size={{ xs: 12, sm: 6 }} confidence={form.invoiceNumber?.confidence}>
            <FieldLabel label="Invoice Number" confidence={form.invoiceNumber?.confidence} />
            <TextField
              fullWidth size="small" sx={fieldSx}
              disabled={readOnly}
              value={form.invoiceNumber?.value || ''}
              onChange={function (e) { updateField('invoiceNumber', e.target.value) }}
            />
          </GridField>

          <GridField size={{ xs: 12, sm: 6 }} confidence={form.invoiceDate?.confidence}>
            <FieldLabel label="Invoice Date" confidence={form.invoiceDate?.confidence} />
            <TextField
              fullWidth size="small" type="date" sx={fieldSx}
              disabled={readOnly}
              value={form.invoiceDate?.value || ''}
              onChange={function (e) { updateField('invoiceDate', e.target.value) }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </GridField>

          <GridField size={{ xs: 12, sm: 6 }} confidence={form.dueDate?.confidence}>
            <FieldLabel label="Due Date" confidence={form.dueDate?.confidence} />
            <TextField
              fullWidth size="small" type="date" sx={fieldSx}
              disabled={readOnly}
              value={form.dueDate?.value || ''}
              onChange={function (e) { updateField('dueDate', e.target.value) }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </GridField>
        </Grid>
      </SectionCard>

      <SectionCard title="Financial Details">
        <Grid container spacing={2}>
          <GridField size={{ xs: 12, sm: 6 }} confidence={form.currency?.confidence}>
            <FieldLabel label="Currency" confidence={form.currency?.confidence} />
            <TextField
              fullWidth size="small" select sx={fieldSx}
              disabled={readOnly}
              value={form.currency?.value || 'USD'}
              onChange={function (e) { updateField('currency', e.target.value) }}
            >
              {CURRENCIES.map(function (c) {
                return <MenuItem key={c} value={c}>{c}</MenuItem>
              })}
            </TextField>
          </GridField>

          <GridField size={{ xs: 12, sm: 6 }} confidence={form.vatRate?.confidence}>
            <FieldLabel label="VAT Rate (%)" confidence={form.vatRate?.confidence} />
            <TextField
              fullWidth size="small" type="number" sx={fieldSx}
              disabled={readOnly}
              value={form.vatRate?.value == null ? '' : form.vatRate.value}
              onChange={function (e) { updateField('vatRate', e.target.value) }}
              slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
            />
          </GridField>

          <GridField size={{ xs: 12, sm: 6 }} confidence={form.vendorTaxId?.confidence}>
            <FieldLabel label="Vendor Tax ID" confidence={form.vendorTaxId?.confidence} />
            <TextField
              fullWidth size="small" sx={fieldSx}
              disabled={readOnly}
              value={form.vendorTaxId?.value || ''}
              onChange={function (e) { updateField('vendorTaxId', e.target.value) }}
            />
          </GridField>

          <GridField size={{ xs: 12, sm: 6 }} confidence={form.lastFourDigitsCard?.confidence}>
            <FieldLabel label="Last 4 Digits Card" confidence={form.lastFourDigitsCard?.confidence} />
            <TextField
              fullWidth size="small" sx={fieldSx}
              disabled={readOnly}
              slotProps={{ htmlInput: { maxLength: 4 } }}
              value={form.lastFourDigitsCard?.value || ''}
              onChange={function (e) { updateField('lastFourDigitsCard', e.target.value) }}
              placeholder="e.g., 1234"
            />
          </GridField>
        </Grid>
      </SectionCard>

      <SectionCard
        title="Payment Plan"
        icon={<ExpandMoreRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
        collapsible
        defaultExpanded={hasPaymentData}
      >
        <Grid container spacing={2}>
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
              value={form.paymentPlan?.frequency?.value || ''}
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
              value={form.paymentPlan?.description?.value || ''}
              onChange={function (e) { updateField('paymentPlan.description', e.target.value) }}
            />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard
        title="Line Items"
        icon={<AddRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
      >
        <Stack spacing={1.5}>
          {!readOnly ? (
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={addLineItem} sx={{ alignSelf: 'flex-start' }}>
              Add Row
            </Button>
          ) : null}
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '35%' }}>Description</TableCell>
                  <TableCell align="right" sx={{ width: '15%' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ width: '20%' }}>Unit Price</TableCell>
                  <TableCell align="right" sx={{ width: '20%' }}>Total</TableCell>
                  <TableCell align="center" sx={{ width: '10%' }}>Conf.</TableCell>
                  {!readOnly ? <TableCell sx={{ width: 50 }} /> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.length > 0 ? (
                  lineItems.map(function (item, idx) {
                    return (
                      <TableRow
                        key={item.id == null ? idx : item.id}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(88,166,255,0.04)' },
                          '&:nth-of-type(even)': { bgcolor: 'rgba(255,255,255,0.01)' },
                        }}
                      >
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
                        {!readOnly ? (
                          <TableCell>
                            <IconButton size="small" aria-label="Remove line item" onClick={function () { removeLineItem(idx) }}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={readOnly ? 5 : 6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {readOnly ? 'No line items available.' : 'No line items extracted. Click "Add Row" to add manually.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </SectionCard>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'rgba(43,54,81,0.5)',
          borderRadius: 2.5,
          bgcolor: 'rgba(255,255,255,0.02)',
          p: 2,
        }}
      >
        <Typography variant="overline" sx={{ color: 'text.secondary', mb: 1.5, display: 'block' }}>
          Summary
        </Typography>
        <Stack spacing={1.5}>
          <ConfidenceFieldRow
            label="Subtotal"
            value={form.subtotal?.value}
            confidence={form.subtotal?.confidence}
            onChange={function (v) { updateField('subtotal', v) }}
            fieldSx={fieldSx}
            disabled={readOnly}
          />

          <ConfidenceFieldRow
            label="VAT Amount"
            value={form.vatAmount?.value}
            confidence={form.vatAmount?.confidence}
            onChange={function (v) { updateField('vatAmount', v) }}
            fieldSx={fieldSx}
            disabled={readOnly}
          />

          <ConfidenceFieldRow
            label="Total Amount"
            value={form.totalAmount?.value}
            confidence={form.totalAmount?.confidence}
            onChange={function (v) { updateField('totalAmount', v) }}
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
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6">
              {readOnly ? 'Invoice Details' : 'Verify Extracted Data'}
            </Typography>
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                borderRadius: 1.5,
                bgcolor: confidenceColor(overallConfidence) === 'success'
                  ? 'rgba(55,214,122,0.15)'
                  : confidenceColor(overallConfidence) === 'warning'
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(248,113,113,0.15)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color={confidenceColor(overallConfidence) + '.main'}
              >
                {confidenceLabel(overallConfidence)}
              </Typography>
            </Box>
          </Stack>
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
          {activeTab === 'pdf' ? pdfContent : formContent}
        </Stack>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {pdfContent}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {formContent}
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
