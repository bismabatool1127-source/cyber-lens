import { Router } from 'express';
import { analyzeUrl } from '../analyzers/urlAnalyzer.js';
import { parseUrl } from '../utils/urlParser.js';
import { validationError } from '../middleware/errorHandler.js';
import { urlScanLimiter } from '../middleware/rateLimiter.js';
import { redactDomain } from '../utils/sanitizer.js';

export function createUrlRouter({ threatIntel, recordScan }) {
  const router = Router();

  router.post('/', urlScanLimiter, (req, res, next) => {
    try {
      const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
      if (!url) throw validationError('Please enter a URL to analyze.');
      if (url.length > 2048) throw validationError('This URL is too long to analyze.');

      const parsed = parseUrl(url);
      if (!parsed) throw validationError('Please enter a valid URL.');

      const result = analyzeUrl(url, threatIntel);
      recordScan({
        type: 'url',
        classification: result.classification,
        riskScore: result.riskScore,
        targetSummary: redactDomain(parsed.hostname),
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
