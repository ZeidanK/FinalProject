import { z } from 'zod'

/**
 * Validation schema for resolving an anomaly.
 *
 * Ensures resolution notes are a trimmed string with a maximum length of 1000 characters.
 */
export const resolveAnomalySchema = z.object({
  resolutionNotes: z
    .string()
    .max(1000, 'Resolution notes can be up to 1000 characters.')
    .transform((value) => value.trim()),
})
