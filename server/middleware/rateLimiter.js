import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

const disabled = config.env === 'test';

function make(windowMs, max, message) {
  if (disabled) return (_req, _res, next) => next();
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({ error: 'RATE_LIMITED', message }),
  });
}

export const globalLimiter = make(
  config.rateLimit.windowMs,
  config.rateLimit.globalMax,
  'Too many requests from this device. Please wait a moment and try again.'
);

// One limiter per scanner so heavy use of one scanner never blocks the others.
export const urlScanLimiter = make(
  config.rateLimit.windowMs,
  config.rateLimit.scanMax,
  'Too many URL scans in a short time. Please wait a moment and try again.'
);

export const emailScanLimiter = make(
  config.rateLimit.windowMs,
  Math.max(5, Math.floor(config.rateLimit.scanMax / 2)),
  'Too many email scans in a short time. Please wait a moment and try again.'
);

export const phoneScanLimiter = make(
  config.rateLimit.windowMs,
  config.rateLimit.scanMax,
  'Too many phone checks in a short time. Please wait a moment and try again.'
);

export const metaLimiter = make(
  config.rateLimit.windowMs,
  Math.max(10, Math.floor(config.rateLimit.globalMax / 2)),
  'Too many requests from this device. Please wait a moment and try again.'
);
