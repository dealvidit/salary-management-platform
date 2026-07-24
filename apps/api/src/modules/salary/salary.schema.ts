import { z } from 'zod';

// A salary update is recorded in minor units so money stays integer end to end;
// the client converts the typed amount using the employee's currency.
export const createRevisionBody = z.object({
  amountMinor: z.number().int().positive(),
  effectiveOn: z.coerce.date(),
  reason: z.string().trim().min(1).max(200),
});

export type CreateRevisionInput = z.infer<typeof createRevisionBody>;
