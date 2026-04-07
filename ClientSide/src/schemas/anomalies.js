import { z } from 'zod'

export const resolveAnomalySchema = z.object({
  resolutionNotes: z
    .string()
    .max(1000, 'Resolution notes can be up to 1000 characters.')
    .transform((value) => value.trim()),
})
