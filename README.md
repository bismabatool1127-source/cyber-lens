# CYBER-LENS — Your Digital Security Guard

A web-based, AI-hackathon MVP that helps ordinary users examine suspicious **URLs**, **emails** and **phone numbers** *before* trusting them.

Cyber-Lens follows one principle: **Detect → Explain → Recommend.** Every scan produces a risk level (LOW RISK / SUSPICIOUS / HIGH RISK), a 0–100 risk score, the indicators that were detected, plain-language reasons, and a recommended action. A LOW RISK result means *"no known threat detected"* — never "100% safe".

## Quick start

Requirements: **Node.js 24+** (uses the built-in `node:sqlite`).

```bash
npm install
npm start          # seeds the threat DB automatically on first run
# open http://localhost:3000
```

Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm start` | Run the app (server + static frontend on one port) |
| `npm run dev` | Same, with auto-restart on server changes |
| `npm run seed` | (Re)load the curated demo threat database |
| `npm test` | Run the full unit + API test suite |

Optional configuration lives in `.env` (see `.env.example`): port, DB path, live-feed URL/refresh interval, rate limits.

## What it does

- **URL Scanner** — validates syntax, safely normalizes defanged input (`hxxp://`, `[.]`), checks ~15 structural indicators (IP-literal hosts, punycode/homograph encoding, brand typosquatting via Levenshtein distance, credential-harvesting paths, suspicious TLDs, double extensions, non-standard ports, …) and matches the URL/domain against threat intelligence.
- **Email Scanner** — analyzes the sender (free-mail-for-brand, disposable domains, lookalike domains, display-name mismatch, known malicious senders), social-engineering language (urgency, fear, sensitive-information requests, generic greetings, caps abuse, attachment lures), known phishing phrases, and **every link in the body through the same URL engine**.
- **Phone Scanner** — E.164 normalization with a small country table, length/premium-rate/vanity checks, and known-risk number matching. Intentionally lightweight.

### Hybrid analysis (not a database lookup)

An item is never called safe just because it is absent from a database. Each scan combines deterministic rule-based indicators with threat-intelligence matching, and the centralized **risk engine** (`server/services/riskEngine.js`) turns weighted indicators into the standardized, explainable result.

### Threat intelligence

`server/services/threatIntel.js` defines a small lookup interface with two sources, composed in priority order:

1. **Seed database** — ~50 curated demo records in SQLite (`server/data/threat-seed.json`, all fabricated for demonstration).
2. **Live feed** — the public OpenPhish phishing-URL feed, refreshed every 6 h, cached to disk, capped in memory. If the feed is unreachable the app silently degrades to seed + cache. Setting `FEED_URL=` disables it entirely.

Adding a commercial threat-intel API later means writing one new class with the same lookup methods — no analyzer changes.

## Architecture

```
server/
  index.js            Express app: middleware, routes, static frontend
  config.js           env-driven configuration
  db.js               node:sqlite (DatabaseSync), schema init
  seed.js             idempotent seeder for the demo threat DB
  middleware/         error handler (friendly JSON errors), rate limiters
  routes/             /api/scan/url | /api/scan/email | /api/scan/phone | /api/recent-scans | /api/health
  analyzers/          urlAnalyzer, emailAnalyzer, phoneAnalyzer + indicator catalogs
  services/           riskEngine (central scoring), threatIntel, feedThreatIntel, recentScans
  utils/              url parsing/defanging, levenshtein, hashing, redaction
client/
  index.html + css/   token-based design system, dark & light themes, responsive
  js/                 hash router, fetch wrapper, pages, shared components (ResultCard, …)
tests/                node:test unit + API smoke tests (no extra dev deps)
```

Design choices for a 4-day hackathon: one Node process serves API + static UI (no CORS/proxy config), no build step, no framework, no auth, no microservices. Dependencies: `express`, `helmet`, `compression`, `express-rate-limit`.

## API

All scan endpoints return the same explainable shape:

```json
{
  "classification": "HIGH",
  "riskScore": 100,
  "confidence": "high",
  "reasons": ["This exact link matches a known malicious record in threat intelligence", "…"],
  "recommendation": "Do not open this link or enter any personal information.",
  "indicators": [{ "name": "known-malicious-url", "weight": 95, "triggered": true, "detail": "…" }]
}
```

Email scans additionally return `extractedUrls` (each analyzed by the URL engine, displayed defanged). Errors are always `{ "error": "CODE", "message": "friendly sentence" }` — never stack traces.

## Security & privacy

- Submitted links, emails and phone numbers are analyzed **in memory only** — never persisted. The dashboard keeps at most 10 redacted summaries (e.g. `pay***.tk`, `+92***223`) in RAM.
- The server **never opens, fetches or executes** user-submitted URLs or content.
- All user input is treated as untrusted; the UI only ever inserts it as text (no HTML injection), and extracted links are displayed defanged (`hxxp://…[.]…`) and non-clickable.
- Helmet security headers, per-scanner rate limits, body-size caps, and sanitized error responses.

## Demo scenarios for judges

1. `https://www.wikipedia.org` → LOW RISK, "no known threat detected".
2. `http://paypa1-secure-login.tk/webscr/login.php` → HIGH RISK (known-malicious + typosquat + credential path).
3. `http://paypa1-verify-account.xyz:8080/login` → SUSPICIOUS/HIGH from structural indicators alone (not in any database).
4. The phishing email sample in `tests/emailAnalyzer.test.js` → HIGH with detected-links panel.
5. `+92 300 1112223` (demo record) → HIGH; `+44 20 7946 0018` → LOW with "Format is valid".
6. Any URL currently listed in the live OpenPhish feed → HIGH via live threat intel.

## Deploy (free, 24/7)

The repo ships a Render Blueprint (`render.yaml`).

1. Sign in at https://dashboard.render.com with your GitHub account.
2. **New → Web Service**, choose the `cyber-lens` repository (Render reads `render.yaml` automatically).
3. Click **Create Web Service** — the app is live at `https://cyber-lens.onrender.com` (exact URL shown in the dashboard) after ~2 minutes.

The free instance sleeps when idle; the first request after a long idle takes ~30 s. Every push to `main` redeploys automatically.

## Limitations & future work

- Punycode domains are flagged but not decoded to their visual form.
- The phone scanner is deliberately simple (format + premium ranges + known records).
- Future: real commercial threat-intel APIs, IDN homograph decoding, SPF/DKIM checks for emails, browser extension.

Built for the AI Hackathon organized by Alkhidmat Foundation Pakistan, Bano Qabil and Alibaba Cloud.
