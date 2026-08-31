import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  port: intEnv('PORT', 3000),
  dbPath: process.env.DB_PATH || (process.env.VERCEL ? ':memory:' : path.join(__dirname, 'data', 'cyberlens.db')),
  dataDir: path.join(__dirname, 'data'),
  feed: Object.freeze({
    url: process.env.FEED_URL ?? 'https://openphish.com/feed.txt',
    refreshMs: intEnv('FEED_REFRESH_MS', 6 * 60 * 60 * 1000),
    maxEntries: intEnv('FEED_MAX_ENTRIES', 5000),
    cachePath: process.env.FEED_CACHE_PATH || (process.env.VERCEL ? '/tmp/threat-feed-cache.txt' : path.join(__dirname, 'data', 'threat-feed-cache.txt')),
  }),
  rateLimit: Object.freeze({
    windowMs: intEnv('RATE_LIMIT_WINDOW_MS', 60_000),
    globalMax: intEnv('RATE_LIMIT_MAX', 60),
    scanMax: intEnv('SCAN_RATE_LIMIT_MAX', 20),
  }),
});
