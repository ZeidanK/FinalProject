import { z } from 'zod'

/**
 * Schema for updating user profile details.
 *
 * Validates name and optional phone number.
 */
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty.'),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone must be at most 30 characters.')
    .optional(),
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
 * Schema for accountant-specific profile fields.
 */
export const accountantProfileSchema = z.object({
  bio: z.string().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(100).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  location: z.string().max(255).optional(),
  website: z.string().max(500).optional(),
})

/**
 * Schema for validating company details.
 *
 * Ensures the company name and email are present with proper format.
 */
export const companySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required.'),
  email: z.string().email('Invalid email address.').trim(),
})
