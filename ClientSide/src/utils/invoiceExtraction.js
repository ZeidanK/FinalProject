/**
 * Utility functions for invoice extraction and confidence scoring
 */

export function confidenceColor(score) {
  if (score >= 0.9) return 'success'
  if (score >= 0.7) return 'warning'
  return 'error'
}

export function confidenceLabel(score) {
  if (score == null) return '-'
  return Math.round(score * 100) + '%'
}

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
