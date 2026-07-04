import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '../../schemas/auth'

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from email', () => {
    const result = loginSchema.safeParse({ email: '  user@example.com  ', password: 'secret123' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'business_owner',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'business_owner',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: '12345',
      confirmPassword: '12345',
      role: 'business_owner',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different',
      role: 'business_owner',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid roles', () => {
    const base = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    }
    expect(registerSchema.safeParse({ ...base, role: 'accountant' }).success).toBe(true)
    expect(registerSchema.safeParse({ ...base, role: 'business_owner' }).success).toBe(true)
    expect(registerSchema.safeParse({ ...base, role: 'accountant_business_owner' }).success).toBe(true)
  })

  it('rejects invalid role', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'admin',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty confirmPassword', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: '',
      role: 'business_owner',
    })
    expect(result.success).toBe(false)
  })
})
