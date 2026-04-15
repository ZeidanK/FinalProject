import { z } from 'zod'

/**
 * Shared schema for validating form email inputs.
 *
 * Trims whitespace and requires a valid email address.
 */
const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Please enter a valid email address.')

/**
 * Schema for login form validation.
 *
 * Requires an email and password.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
})

/**
 * Schema for registration form validation.
 *
 * Validates name, email, password, confirmation, and role selection.
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.'),
    email: emailSchema,
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
    role: z.enum(['accountant', 'business_owner', 'accountant_business_owner']),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password and confirmation must match.',
  })
