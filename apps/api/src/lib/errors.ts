import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

/** Thrown by services when a requested resource doesn't exist. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// One place that turns known error types into HTTP responses, so route handlers
// stay focused on the happy path. Validation failures become 400s with the
// offending fields; missing resources become 404s.
export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Request validation failed',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: 'NotFound', message: error.message });
    }

    request.log.error(error);
    return reply.status(500).send({ error: 'InternalServerError', message: 'Something went wrong' });
  });
}
