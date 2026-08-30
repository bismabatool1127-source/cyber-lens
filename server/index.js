import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config.js';
import { getDb } from './db.js';
import { seedDatabase } from './seed.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { SeedThreatIntel, CompositeThreatIntel } from './services/threatIntel.js';
import { FeedThreatIntel } from './services/feedThreatIntel.js';
import { recordScan } from './services/recentScans.js';
import { createUrlRouter } from './routes/url.js';
import { createEmailRouter } from './routes/email.js';
import { createPhoneRouter } from './routes/phone.js';
import { createMetaRouter } from './routes/meta.js';
import { logger } from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const db = getDb();

  const domainCount = db.prepare('SELECT COUNT(*) AS n FROM domains').get().n;
  if (Number(domainCount) === 0) {
    const counts = seedDatabase(db);
    logger.info('Threat database empty - auto-seeded', counts);
  }

  const threatIntel = new CompositeThreatIntel([new SeedThreatIntel(db)]);

  let feed = null;
  if (config.feed.url) {
    feed = new FeedThreatIntel(config.feed);
    threatIntel.sources.push(feed);
    feed.start();
  }

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', globalLimiter);

  app.use('/api/scan/url', createUrlRouter({ threatIntel, recordScan }));
  app.use('/api/scan/email', createEmailRouter({ threatIntel, recordScan }));
  app.use('/api/scan/phone', createPhoneRouter({ threatIntel, recordScan }));
  app.use('/api', createMetaRouter());

  app.use(express.static(path.join(__dirname, '..', 'client')));
  app.use((req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'This page does not exist.' });
  });

  app.use(errorHandler);
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`Cyber-Lens is running on http://localhost:${config.port}`);
  });
}
