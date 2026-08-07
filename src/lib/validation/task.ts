import { z } from 'zod';

import { TASK_PRIORITIES, TASK_STATUSES } from '@/types/database';

/**
 * Task validation — TODO 4.
 *
 * Compare this with `supabase/schema.sql`:
 *
 *   SQL   title text not null check (char_length(title) between 3 and 120)
 *   Zod   title: z.string().trim().min(3).max(120)
 *
 * The same rule, written twice, on purpose:
 *
 *   Zod's job      → a friendly red message under the input.  (UX)
 *   The database's → make it impossible.                       (security)
 *
 * With only Zod, anyone can bypass your form with curl. With only the
 * constraint, users get a raw Postgres error in their face.
 * VALIDATE AT EVERY BOUNDARY.
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be 120 characters or fewer'),

  // Optional, but an untouched <textarea> gives you '' rather than undefined,
  // so allow the empty string explicitly and convert it to null on the way in.
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be 2000 characters or fewer')
    .optional()
    .or(z.literal('')),

  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
});

/**
 * THE SCHEMA IS THE TYPE.
 *
 * One line, and TypeScript knows the exact shape. You never hand-write an
 * `interface` that can quietly drift away from your validation. Change the
 * schema and every file that is now wrong lights up red.
 *
 * One source of truth.
 */
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
