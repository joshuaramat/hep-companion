import { z } from 'zod';

/**
 * Schema for exercise suggestions with enhanced citation requirements
 */
export const GPTResponseSchema = z.object({
  exercises: z.array(z.object({
    name: z.string().min(1, 'Exercise name is required'),
    sets: z.number().positive('Sets must be a positive number'),
    reps: z.string().min(1, 'Reps are required'), // String to allow for ranges like "8-12"
    notes: z.string().optional(),
    evidence_source: z.string().min(1, 'Evidence source is required'), // NEW: citation requirement
  })).min(1, 'At least one exercise is required').max(10, 'Maximum 10 exercises allowed'),
  clinical_notes: z.string().min(1, 'Clinical notes are required'),
  citations: z.array(z.string()).min(1, 'At least one citation is required'), // NEW: reference list
  confidence_level: z.enum(['high', 'medium', 'low']).optional(),
});

export type GPTResponse = z.infer<typeof GPTResponseSchema>; 