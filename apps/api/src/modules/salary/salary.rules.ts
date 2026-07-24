import { BadRequestError } from '../../lib/errors.js';

/** Raised when a salary update violates a business rule. Maps to HTTP 400. */
export class SalaryUpdateError extends BadRequestError {}

/**
 * A new salary revision must take effect on or after the current salary did
 * (revisions are chronological, and the "current" projection is the newest one)
 * and cannot be in the future (we don't model scheduled/future-dated changes).
 */
export function assertValidEffectiveDate(
  effectiveOn: Date,
  currentEffectiveOn: Date,
  now: Date,
): void {
  if (effectiveOn.getTime() > now.getTime()) {
    throw new SalaryUpdateError('Effective date cannot be in the future');
  }
  if (effectiveOn.getTime() < currentEffectiveOn.getTime()) {
    throw new SalaryUpdateError(
      'Effective date must be on or after the current salary’s effective date',
    );
  }
}
