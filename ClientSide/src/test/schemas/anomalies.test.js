import { describe, it, expect } from 'vitest'
import { resolveAnomalySchema } from '../../schemas/anomalies'

describe('resolveAnomalySchema', () => {
  it('accepts valid resolution notes', () => {
    const result = resolveAnomalySchema.safeParse({ resolutionNotes: 'This was a duplicate entry.' })
    expect(result.success).toBe(true)
  })

  it('trims whitespace from notes', () => {
    const result = resolveAnomalySchema.safeParse({ resolutionNotes: '  resolved  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.resolutionNotes).toBe('resolved')
    }
  })

  it('accepts empty string', () => {
    const result = resolveAnomalySchema.safeParse({ resolutionNotes: '' })
    expect(result.success).toBe(true)
  })

  it('rejects notes exceeding 1000 characters', () => {
    const result = resolveAnomalySchema.safeParse({ resolutionNotes: 'x'.repeat(1001) })
    expect(result.success).toBe(false)
  })

  it('accepts notes at exactly 1000 characters', () => {
    const result = resolveAnomalySchema.safeParse({ resolutionNotes: 'x'.repeat(1000) })
    expect(result.success).toBe(true)
  })
})
