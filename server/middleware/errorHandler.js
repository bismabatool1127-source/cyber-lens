import { logger } from '../utils/logger.js';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function validationError(message) {
  return new ApiError(400, 'VALIDATION_ERROR', message);
}

/** Final Express error handler: friendly JSON, never leaks internals. */
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE', message: 'The submitted text is too long to analyze. Please shorten it and try again.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'INVALID_JSON', message: 'The request could not be read. Please try again.' });
  }
  logger.error('Unhandled error', err?.message);
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: "We couldn't complete the analysis right now. Please try again.",
  });
}
