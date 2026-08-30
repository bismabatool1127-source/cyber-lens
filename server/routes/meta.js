import { Router } from 'express';
import { listScans } from '../services/recentScans.js';
import { metaLimiter } from '../middleware/rateLimiter.js';

export function createMetaRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  router.get('/recent-scans', metaLimiter, (_req, res) => {
    res.json({ scans: listScans() });
  });

  return router;
}
