import { describe, it, expect } from 'vitest'
import {
  confidenceColor,
  confidenceLabel,
  toDateInput,
  mapExtractedToForm,
  mapSavedInvoiceToForm,
} from '../../utils/invoiceExtraction'

describe('confidenceColor', () => {
  it('returns success for score >= 0.9', () => {
    expect(confidenceColor(0.9)).toBe('success')
    expect(confidenceColor(1)).toBe('success')
  })

  it('returns warning for 0.7 <= score < 0.9', () => {
    expect(confidenceColor(0.7)).toBe('warning')
    expect(confidenceColor(0.89)).toBe('warning')
  })

  it('returns error for score < 0.7', () => {
    expect(confidenceColor(0.69)).toBe('error')
    expect(confidenceColor(0)).toBe('error')
  })
})

describe('confidenceLabel', () => {
  it('formats score as percentage', () => {
    expect(confidenceLabel(0.5)).toBe('50%')
    expect(confidenceLabel(1)).toBe('100%')
    expect(confidenceLabel(0.123)).toBe('12%')
  })

  it('returns "-" for null/undefined', () => {
    expect(confidenceLabel(null)).toBe('-')
    expect(confidenceLabel(undefined)).toBe('-')
  })
})

describe('toDateInput', () => {
  it('extracts YYYY-MM-DD from ISO string', () => {
    expect(toDateInput('2025-04-27T00:00:00')).toBe('2025-04-27')
  })

  it('returns date string as-is if already YYYY-MM-DD', () => {
    expect(toDateInput('2025-04-27')).toBe('2025-04-27')
  })

  it('handles Date objects', () => {
    expect(toDateInput(new Date('2025-04-27'))).toBe('2025-04-27')
  })

  it('returns empty string for null/undefined', () => {
    expect(toDateInput(null)).toBe('')
    expect(toDateInput(undefined)).toBe('')
  })

  it('returns first 10 chars for non-date string (no validation)', () => {
    expect(toDateInput('not-a-date')).toBe('not-a-date')
  })
})

describe('mapExtractedToForm', () => {
  it('returns default fields when ext is null/undefined', () => {
    const result = mapExtractedToForm(null)
    expect(result.vendorName.value).toBe('')
    expect(result.vendorName.confidence).toBe(0)
    expect(result.currency.value).toBe('USD')
    expect(result.lineItems).toEqual([])
    expect(result.paymentPlan.totalInstallments.value).toBe('')
  })

  it('maps extracted fields with confidence', () => {
    const ext = {
      vendorName: 'Acme Corp',
      invoiceNumber: 'INV-001',
      invoiceDate: '2025-04-27T00:00:00',
      totalAmount: 1500.50,
      extractionConfidence: 0.85,
    }
    const result = mapExtractedToForm(ext)
    expect(result.vendorName).toEqual({ value: 'Acme Corp', confidence: 0.85 })
    expect(result.invoiceNumber).toEqual({ value: 'INV-001', confidence: 0.85 })
    expect(result.invoiceDate).toEqual({ value: '2025-04-27', confidence: 0.85 })
    expect(result.totalAmount).toEqual({ value: 1500.50, confidence: 0.85 })
  })

  it('uses overallConfidence override when provided', () => {
    const ext = { vendorName: 'Acme Corp', extractionConfidence: 0.5 }
    const result = mapExtractedToForm(ext, 0.95)
    expect(result.vendorName.confidence).toBe(0.95)
  })

  it('sets 0 confidence for empty fields', () => {
    const ext = { vendorName: '', invoiceNumber: null }
    const result = mapExtractedToForm(ext, 0.9)
    expect(result.vendorName.confidence).toBe(0)
    expect(result.invoiceNumber.confidence).toBe(0)
  })

  it('maps line items with default confidence', () => {
    const ext = {
      lineItems: [
        { description: 'Item 1', quantity: 2, unitPrice: 10, totalAmount: 20 },
      ],
    }
    const result = mapExtractedToForm(ext)
    expect(result.lineItems).toHaveLength(1)
    expect(result.lineItems[0].description).toBe('Item 1')
    expect(result.lineItems[0].quantity).toBe(2)
    expect(result.lineItems[0].confidence).toBe(0.7)
  })

  it('handles nested paymentPlan', () => {
    const ext = {
      paymentPlan: {
        totalInstallments: 6,
        installmentAmount: 500,
        frequency: 'monthly',
      },
    }
    const result = mapExtractedToForm(ext)
    expect(result.paymentPlan.totalInstallments).toEqual({ value: 6, confidence: 0 })
    expect(result.paymentPlan.frequency).toEqual({ value: 'monthly', confidence: 0 })
  })
})

describe('mapSavedInvoiceToForm', () => {
  it('maps snake_case invoice to form', () => {
    const invoice = {
      vendor_name: 'Acme Corp',
      invoice_number: 'INV-001',
      total_amount: 1000,
      ai_extraction_confidence: 0.9,
    }
    const result = mapSavedInvoiceToForm(invoice)
    expect(result.vendorName.value).toBe('Acme Corp')
    expect(result.invoiceNumber.value).toBe('INV-001')
    expect(result.totalAmount.value).toBe(1000)
  })

  it('maps camelCase invoice to form', () => {
    const invoice = {
      vendorName: 'Beta Inc',
      invoiceNumber: 'INV-002',
      totalAmount: 2000,
      aiExtractionConfidence: 0.8,
    }
    const result = mapSavedInvoiceToForm(invoice)
    expect(result.vendorName.value).toBe('Beta Inc')
    expect(result.invoiceNumber.value).toBe('INV-002')
    expect(result.totalAmount.value).toBe(2000)
  })

  it('maps line items from both naming conventions', () => {
    const invoice = {
      line_items: [{ description: 'Item A', quantity: 1, unit_price: 50, total_amount: 50, ai_confidence_score: 0.95 }],
      ai_extraction_confidence: 0.95,
    }
    const result = mapSavedInvoiceToForm(invoice)
    expect(result.lineItems).toHaveLength(1)
    expect(result.lineItems[0].description).toBe('Item A')
    expect(result.lineItems[0].confidence).toBe(0.95)
  })
})
