import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Please enter a valid email address.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
})

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
