import { describe, it, expect } from 'vitest'
import {
  normalizeTransactionType,
  getTransactionTypes,
  filterTransactionsByType,
  formatTransactionTypeLabel,
} from '../../utils/transactionHelpers'

describe('normalizeTransactionType', () => {
  it('returns the transaction type from snake_case', () => {
    expect(normalizeTransactionType({ transaction_type: 'debit' })).toBe('debit')
  })

  it('returns the transaction type from camelCase', () => {
    expect(normalizeTransactionType({ transactionType: 'credit' })).toBe('credit')
  })

  it('returns the transaction type from plain type', () => {
    expect(normalizeTransactionType({ type: 'transfer' })).toBe('transfer')
  })

  it('prefers transaction_type over other fields', () => {
    expect(normalizeTransactionType({ transaction_type: 'debit', transactionType: 'credit', type: 'transfer' })).toBe('debit')
  })

  it('prefers transactionType when transaction_type is absent', () => {
    expect(normalizeTransactionType({ transactionType: 'credit', type: 'transfer' })).toBe('credit')
  })

  it('falls back to unknown for null/undefined', () => {
    expect(normalizeTransactionType(null)).toBe('unknown')
    expect(normalizeTransactionType(undefined)).toBe('unknown')
  })

  it('falls back to unknown for empty string', () => {
    expect(normalizeTransactionType({ transaction_type: '' })).toBe('unknown')
  })

  it('falls back to unknown for whitespace-only type', () => {
    expect(normalizeTransactionType({ transaction_type: '   ' })).toBe('unknown')
  })

  it('handles non-object gracefully', () => {
    expect(normalizeTransactionType('string')).toBe('unknown')
    expect(normalizeTransactionType(42)).toBe('unknown')
  })
})

describe('getTransactionTypes', () => {
  it('returns ["all"] for empty array', () => {
    expect(getTransactionTypes([])).toEqual(['all'])
  })

  it('returns ["all"] for non-array', () => {
    expect(getTransactionTypes(null)).toEqual(['all'])
    expect(getTransactionTypes(undefined)).toEqual(['all'])
  })

  it('returns sorted unique types with "all" first', () => {
    const transactions = [
      { transaction_type: 'debit' },
      { transaction_type: 'credit' },
      { transaction_type: 'debit' },
    ]
    expect(getTransactionTypes(transactions)).toEqual(['all', 'credit', 'debit'])
  })

  it('handles missing transaction types gracefully', () => {
    const transactions = [{ notype: true }]
    expect(getTransactionTypes(transactions)).toEqual(['all', 'unknown'])
  })
})

describe('filterTransactionsByType', () => {
  const transactions = [
    { transaction_type: 'debit' },
    { transaction_type: 'credit' },
    { transaction_type: 'transfer' },
  ]

  it('returns all transactions for "all"', () => {
    expect(filterTransactionsByType(transactions, 'all')).toEqual(transactions)
  })

  it('filters by matching type', () => {
    expect(filterTransactionsByType(transactions, 'debit')).toEqual([{ transaction_type: 'debit' }])
  })

  it('returns empty array for no match', () => {
    expect(filterTransactionsByType(transactions, 'refund')).toEqual([])
  })

  it('returns empty array for empty input', () => {
    expect(filterTransactionsByType([], 'debit')).toEqual([])
    expect(filterTransactionsByType(null, 'debit')).toEqual([])
  })

  it('performs case-insensitive matching', () => {
    expect(filterTransactionsByType(transactions, 'DEBIT')).toEqual([{ transaction_type: 'debit' }])
  })

  it('returns all when selectedType is empty', () => {
    expect(filterTransactionsByType(transactions, '')).toEqual(transactions)
  })
})

describe('formatTransactionTypeLabel', () => {
  it('returns "All" for "all"', () => {
    expect(formatTransactionTypeLabel('all')).toBe('All')
  })

  it('returns "All" for null/undefined', () => {
    expect(formatTransactionTypeLabel(null)).toBe('All')
    expect(formatTransactionTypeLabel(undefined)).toBe('All')
  })

  it('returns "Unknown" for "unknown"', () => {
    expect(formatTransactionTypeLabel('unknown')).toBe('Unknown')
  })

  it('capitalizes snake_case parts', () => {
    expect(formatTransactionTypeLabel('bank_transfer')).toBe('Bank Transfer')
  })

  it('capitalizes space-separated parts', () => {
    expect(formatTransactionTypeLabel('wire transfer')).toBe('Wire Transfer')
  })

  it('capitalizes hyphenated parts', () => {
    expect(formatTransactionTypeLabel('direct-deposit')).toBe('Direct Deposit')
  })

  it('returns non-standard type unchanged', () => {
    expect(formatTransactionTypeLabel('CUSTOM_TYPE')).toBe('Custom Type')
  })
})
