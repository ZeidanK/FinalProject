import { describe, it, expect } from 'vitest'
import { unwrapEnvelope } from '../../services/unwrapEnvelope'

describe('unwrapEnvelope', () => {
  it('extracts data from envelope with success field', () => {
    const result = unwrapEnvelope({ success: true, data: { id: 1, name: 'test' } })
    expect(result).toEqual({ id: 1, name: 'test' })
  })

  it('extracts data from envelope with code field', () => {
    const result = unwrapEnvelope({ code: 200, data: ['item1', 'item2'] })
    expect(result).toEqual(['item1', 'item2'])
  })

  it('returns response as-is when not an envelope', () => {
    const response = { id: 1, name: 'test' }
    expect(unwrapEnvelope(response)).toBe(response)
  })

  it('returns response as-is for null/undefined', () => {
    expect(unwrapEnvelope(null)).toBeNull()
    expect(unwrapEnvelope(undefined)).toBeUndefined()
  })

  it('returns response as-is for non-objects', () => {
    expect(unwrapEnvelope('string')).toBe('string')
    expect(unwrapEnvelope(42)).toBe(42)
  })

  it('returns data even when it is null or falsey', () => {
    const result = unwrapEnvelope({ success: true, data: null })
    expect(result).toBeNull()
  })
})
