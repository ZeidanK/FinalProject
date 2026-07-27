import { describe, it, expect } from 'vitest'
import { profileUpdateSchema, passwordChangeSchema, companySchema } from '../../schemas/profile'

describe('profileUpdateSchema', () => {
  it('accepts valid name and optional phone', () => {
    expect(profileUpdateSchema.safeParse({ name: 'John Doe', phone: '+1234567890' }).success).toBe(true)
    expect(profileUpdateSchema.safeParse({ name: 'John Doe' }).success).toBe(true)
    expect(profileUpdateSchema.safeParse({ name: 'John Doe', phone: '' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = profileUpdateSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects overly long phone', () => {
    const result = profileUpdateSchema.safeParse({ name: 'John', phone: 'x'.repeat(31) })
    expect(result.success).toBe(false)
  })

  it('trims name', () => {
    const result = profileUpdateSchema.safeParse({ name: '  John  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('John')
    }
  })
})

describe('passwordChangeSchema', () => {
  it('accepts valid password change', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty current password', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: '',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short new password', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: '12345',
      confirmPassword: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched new passwords', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })
})

describe('companySchema', () => {
  it('accepts valid company data', () => {
    const result = companySchema.safeParse({ name: 'My Company', email: 'company@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects empty company name', () => {
    const result = companySchema.safeParse({ name: '', email: 'company@example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid company email', () => {
    const result = companySchema.safeParse({ name: 'My Company', email: 'not-email' })
    expect(result.success).toBe(false)
  })

  it('trims name', () => {
    const result = companySchema.safeParse({ name: '  Company  ', email: 'test@test.com' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Company')
    }
  })
})
