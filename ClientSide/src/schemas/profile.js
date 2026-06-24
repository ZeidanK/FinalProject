import { z } from 'zod'

/**
 * Schema for updating user profile details.
 *
 * Validates name and optional phone number.
 */
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty.'),
  phone: z.string().trim().max(30, 'Phone must be at most 30 characters.').optional().or(z.literal('')),
})

/**
 * Schema for changing a user's password.
 *
 * Requires current password, a new password, and confirmation match.
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'New passwords do not match.',
  })

/**
 * Schema for validating company details.
 *
 * Ensures the company name and email are present with proper format.
 */
export const companySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required.'),
  email: z.string().email('Email must contain @').trim().min(1, 'Email is required.'),
})
