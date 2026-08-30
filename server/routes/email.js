import { Router } from 'express';
import { analyzeEmail } from '../analyzers/emailAnalyzer.js';
import { parseSender } from '../analyzers/indicators/emailIndicators.js';
import { validationError } from '../middleware/errorHandler.js';
import { emailScanLimiter } from '../middleware/rateLimiter.js';
import { redactEmail } from '../utils/sanitizer.js';

export function createEmailRouter({ threatIntel, recordScan }) {
  const router = Router();

  router.post('/', emailScanLimiter, (req, res, next) => {
    try {
      const sender = typeof req.body?.sender === 'string' ? req.body.sender.trim() : '';
      const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
      const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';

      if (!sender) throw validationError("Please enter the sender's email address.");
      if (sender.length > 320) throw validationError('The sender address is too long.');
      if (subject.length > 1000) throw validationError('The subject is too long.');
      if (!body) throw validationError('Please paste the email message to analyze.');
      if (body.length > 50000) throw validationError('The email text is too long to analyze.');

      const result = analyzeEmail({ sender, subject, body }, threatIntel);
      recordScan({
        type: 'email',
        classification: result.classification,
        riskScore: result.riskScore,
        targetSummary: redactEmail(parseSender(sender).address || sender),
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
