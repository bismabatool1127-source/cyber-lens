import { Router } from 'express';
import { listScans } from '../services/recentScans.js';
import { scanStats } from '../services/scanStats.js';
import { metaLimiter } from '../middleware/rateLimiter.js';

export function createMetaRouter({ db = null, feed = null } = {}) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  router.get('/recent-scans', metaLimiter, (_req, res) => {
    res.json({ scans: listScans() });
  });

  router.get('/stats', metaLimiter, (_req, res) => {
    let seedRecords = null;
    if (db) {
      try {
        const rows = db
          .prepare(
            "SELECT (SELECT COUNT(*) FROM urls) + (SELECT COUNT(*) FROM domains) + (SELECT COUNT(*) FROM phones) + (SELECT COUNT(*) FROM email_indicators) AS n"
          )
          .get();
        seedRecords = Number(rows?.n) || 0;
      } catch {
        seedRecords = null;
      }
    }
    res.json({
      scans: scanStats(),
      threatIntel: {
        seedRecords,
        feedEntries: feed ? feed.urlHashes.size : 0,
        feedLastSync: feed ? feed.lastSync : null,
      },
    });
  });

  return router;
}
