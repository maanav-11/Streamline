import { z } from 'zod';

export const createStreamSchema = z.object({
  name: z.string().min(2, 'Stream name must be at least 2 characters'),
  description: z.string().optional(),
});

export const ingestDataSchema = z.object({
  value: z.number({ required_error: 'Numeric value is required' }),
  label: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
