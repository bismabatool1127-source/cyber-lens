import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { FeedThreatIntel } from '../server/services/feedThreatIntel.js';
import { urlHash } from '../server/utils/urlHash.js';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberlens-feed-'));
const cachePath = path.join(tmpDir, 'cache.txt');

const FEED_URLS = ['http://evil-feed-domain.example/login', 'https://another-bad.example/phish'];
let server;
let serverUrl;

before(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/feed.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(FEED_URLS.join('\n') + '\n');
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  serverUrl = `http://127.0.0.1:${server.address().port}/feed.txt`;
});

after(() => {
  server?.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('feed refresh loads entries and answers lookups', async () => {
  const feed = new FeedThreatIntel({ url: serverUrl, refreshMs: 60_000, maxEntries: 100, cachePath });
  await feed.refresh();
  assert.ok(feed.lookupUrl(urlHash('http://evil-feed-domain.example/login')));
  assert.ok(feed.lookupDomain('another-bad.example'));
  assert.equal(feed.lookupUrl(urlHash('https://clean.example/')), null);
  assert.ok(fs.existsSync(cachePath));
  feed.stop();
});

test('cache file restores entries on startup', () => {
  const feed = new FeedThreatIntel({ url: serverUrl, refreshMs: 60_000, maxEntries: 100, cachePath });
  feed.loadCache();
  assert.ok(feed.lookupUrl(urlHash('http://evil-feed-domain.example/login')));
});

test('unreachable feed degrades gracefully', async () => {
  const feed = new FeedThreatIntel({
    url: 'http://127.0.0.1:1/feed.txt',
    refreshMs: 60_000,
    maxEntries: 100,
    cachePath: path.join(tmpDir, 'none.txt'),
  });
  await feed.refresh(); // must not throw
  assert.equal(feed.lookupUrl(urlHash('http://anything.example/')), null);
});
