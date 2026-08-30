import { Router } from 'express';
import { analyzePhone } from '../analyzers/phoneAnalyzer.js';
import { validationError } from '../middleware/errorHandler.js';
import { phoneScanLimiter } from '../middleware/rateLimiter.js';
import { redactPhone } from '../utils/sanitizer.js';

export function createPhoneRouter({ threatIntel, recordScan }) {
  const router = Router();

  router.post('/', phoneScanLimiter, (req, res, next) => {
    try {
      const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
      if (!phone) throw validationError('Please enter a phone number to check.');
      if (phone.length > 30) throw validationError('The phone number is too long.');
      if (!/^[0-9+()\s.\-]+$/.test(phone)) throw validationError('Please enter a valid phone number (digits, spaces, +, - and parentheses only).');

      const result = analyzePhone(phone, threatIntel);
      recordScan({
        type: 'phone',
        classification: result.classification,
        riskScore: result.riskScore,
        targetSummary: redactPhone(result.normalized ?? phone),
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
