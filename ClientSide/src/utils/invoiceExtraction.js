/**
 * Utility functions for invoice extraction and confidence scoring.
 */

/**
 * Get a UI color token based on a confidence score.
 *
 * @param {number} score - Confidence score between 0 and 1.
 * @returns {'success'|'warning'|'error'} Color token for the score.
 */
export function confidenceColor(score) {
  if (score >= 0.9) return 'success'
  if (score >= 0.7) return 'warning'
  return 'error'
}

/**
 * Return a CSS border-left color based on confidence score.
 *
 * @param {number|null|undefined} score - Confidence score between 0 and 1.
 * @returns {string} CSS color value.
 */
export function confidenceBorderColor(score) {
  if (score == null) return 'transparent'
  if (score >= 0.9) return '#37d67a'
  if (score >= 0.7) return '#f59e0b'
  return '#f87171'
}

/**
 * List of top-level form field keys whose confidence is tracked.
 * @type {string[]}
 */
const TRACKED_FIELDS = [
  'vendorName', 'invoiceNumber', 'invoiceDate', 'dueDate',
  'totalAmount', 'subtotal', 'vatAmount', 'currency',
  'vatRate', 'vendorTaxId', 'lastFourDigitsCard',
]

const FULL_CONFIDENCE_FIELDS = [
  'vendorName',
  'invoiceNumber',
  'invoiceDate',
  'totalAmount',
  'subtotal',
  'vatAmount',
  'currency',
  'vendorTaxId',
  'lastFourDigitsCard',
]

/**
 * Find fields in the form data whose confidence is below a threshold.
 *
 * @param {object} formData - The invoice form data with { value, confidence } shapes.
 * @param {number} [threshold=0.9] - Confidence threshold below which a field is flagged.
 * @returns {{ field: string, label: string, confidence: number }[]} Array of low-confidence fields.
 */
export function lowConfidenceFields(formData, threshold) {
  if (threshold == null) threshold = 0.9
  if (!formData) return []
  const result = []
  for (const key of TRACKED_FIELDS) {
    const field = formData[key]
    if (field && field.confidence != null && field.confidence < threshold) {
      result.push({
        field: key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, function (s) { return s.toUpperCase() }),
        confidence: field.confidence,
      })
    }
  }
  return result
}

/**
 * Format a confidence score as a percentage string.
 *
 * @param {number|null|undefined} score - Confidence score between 0 and 1.
 * @returns {string} Percentage string or '-' when no score is available.
 */
export function confidenceLabel(score) {
  if (score == null) return '-'
  return Math.round(score * 100) + '%'
}

/**
 * Calculate the full invoice confidence shown in the verification modal header.
 *
 * @param {object|null|undefined} formData - Invoice form data with { value, confidence } fields.
 * @returns {number|null} Average confidence across the modal summary fields.
 */
export function invoiceFullConfidence(formData) {
  if (!formData) return null

  let total = 0
  for (const key of FULL_CONFIDENCE_FIELDS) {
    const confidence = Number(formData[key]?.confidence)
    total += Number.isFinite(confidence) ? confidence : 0
  }

  return total / FULL_CONFIDENCE_FIELDS.length
}

/**
 * Normalize a date value into an HTML date input string (YYYY-MM-DD).
 *
 * @param {*} value - Date string or date object to normalize.
 * @returns {string} Date input value or empty string.
 */
export function toDateInput(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.includes('T') ? value.split('T')[0] : value.slice(0, 10)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/**
 * Map extracted invoice AI data to the form field shape expected by the UI.
 *
 * @param {object|null|undefined} ext - Extracted invoice data from the AI service.
 * @param {number|null|undefined} [overallConfidence] - Override confidence score.
 * @returns {object} Form-compatible invoice field values and confidence metadata.
 */
export function mapExtractedToForm(ext, overallConfidence) {
  if (!ext)
    return {
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
      paymentPlan: {
        totalInstallments: { value: '', confidence: 0 },
        installmentAmount: { value: '', confidence: 0 },
        frequency: { value: '', confidence: 0 },
        currentInstallment: { value: '', confidence: 0 },
        description: { value: '', confidence: 0 },
      },
      lineItems: [],
    }

  var c =
    overallConfidence != null
      ? overallConfidence
      : ext.extractionConfidence != null
        ? ext.extractionConfidence
        : 0

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
    lastFourDigitsCard: {
      value: ext.lastFourDigitsCard || '',
      confidence: fieldConf(ext.lastFourDigitsCard),
    },
    subtotal: { value: ext.subtotal != null ? ext.subtotal : '', confidence: fieldConf(ext.subtotal) },
    vatAmount: {
      value: ext.vatAmount != null ? ext.vatAmount : '',
      confidence: fieldConf(ext.vatAmount),
    },
    totalAmount: {
      value: ext.totalAmount != null ? ext.totalAmount : '',
      confidence: fieldConf(ext.totalAmount),
    },
    paymentPlan: {
      totalInstallments: {
        value: ext.paymentPlan?.totalInstallments ?? '',
        confidence: fieldConf(ext.paymentPlan?.totalInstallments),
      },
      installmentAmount: {
        value: ext.paymentPlan?.installmentAmount ?? '',
        confidence: fieldConf(ext.paymentPlan?.installmentAmount),
      },
      frequency: {
        value: ext.paymentPlan?.frequency || '',
        confidence: fieldConf(ext.paymentPlan?.frequency),
      },
      currentInstallment: {
        value: ext.paymentPlan?.currentInstallment ?? '',
        confidence: fieldConf(ext.paymentPlan?.currentInstallment),
      },
      description: {
        value: ext.paymentPlan?.description || '',
        confidence: fieldConf(ext.paymentPlan?.description),
      },
    },
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

/**
 * Converts a saved invoice record from the API into invoice form values.
 * Supports both snake_case and camelCase payload formats.
 *
 * @param {Object} invoice - Saved invoice payload.
 * @returns {Object} Normalized form data for invoice verification and viewing.
 */
export function mapSavedInvoiceToForm(invoice) {
  const rawConfidence = invoice?.ai_extraction_confidence ?? invoice?.aiExtractionConfidence ?? null
  const parsedConfidence = rawConfidence == null ? null : Number(rawConfidence)
  const confidence = Number.isFinite(parsedConfidence) ? parsedConfidence : null
  const lineItems = invoice?.lineItems || invoice?.line_items || []

  const form = mapExtractedToForm(
    {
      vendorName: invoice?.vendor_name ?? invoice?.vendorName ?? '',
      invoiceNumber: invoice?.invoice_number ?? invoice?.invoiceNumber ?? '',
      invoiceDate: toDateInput(invoice?.invoice_date ?? invoice?.invoiceDate),
      dueDate: toDateInput(invoice?.due_date ?? invoice?.dueDate),
      totalAmount: invoice?.total_amount ?? invoice?.totalAmount ?? 0,
      subtotal: invoice?.subtotal ?? 0,
      vatRate: invoice?.vat_rate ?? invoice?.vatRate ?? null,
      vatAmount: invoice?.vat_amount ?? invoice?.vatAmount ?? null,
      currency: invoice?.currency ?? 'USD',
      vendorTaxId: invoice?.vendor_tax_id ?? invoice?.vendorTaxId ?? '',
      lastFourDigitsCard: invoice?.last_four_digits_card ?? invoice?.lastFourDigitsCard ?? '',
      paymentPlan: {
        totalInstallments:
          invoice?.paymentPlanTotalInstallments ?? invoice?.payment_plan_total_installments ?? null,
        installmentAmount:
          invoice?.paymentPlanInstallmentAmount ?? invoice?.payment_plan_installment_amount ?? null,
        frequency: invoice?.paymentPlanFrequency ?? invoice?.payment_plan_frequency ?? null,
        currentInstallment:
          invoice?.paymentPlanCurrentInstallment ?? invoice?.payment_plan_current_installment ?? null,
        description: invoice?.paymentPlanDescription ?? invoice?.payment_plan_description ?? null,
      },
      lineItems: lineItems.map((li, idx) => ({
        description: li?.description || '',
        quantity: li?.quantity ?? 1,
        unitPrice: li?.unit_price ?? li?.unitPrice ?? 0,
        totalAmount: li?.total_amount ?? li?.totalAmount ?? 0,
        aiConfidenceScore: li?.ai_confidence_score ?? li?.aiConfidenceScore ?? null,
        lineNumber: li?.line_number ?? li?.lineNumber ?? idx + 1,
      })),
      extractionConfidence: confidence,
    },
    confidence,
  )

  if (confidence != null) {
    for (const key of TRACKED_FIELDS) {
      if (form[key]) {
        form[key] = { ...form[key], confidence }
      }
    }

    if (form.paymentPlan) {
      form.paymentPlan = Object.fromEntries(
        Object.entries(form.paymentPlan).map(([key, field]) => [
          key,
          field ? { ...field, confidence } : field,
        ]),
      )
    }
  }

  form.lineItems = form.lineItems.map((item, idx) => {
    const rawLineConfidence =
      lineItems[idx]?.ai_confidence_score ??
      lineItems[idx]?.aiConfidenceScore ??
      confidence
    const parsedLineConfidence = rawLineConfidence == null ? null : Number(rawLineConfidence)
    const lineConfidence = Number.isFinite(parsedLineConfidence) ? parsedLineConfidence : null

    return { ...item, confidence: lineConfidence }
  })

  return form
}
