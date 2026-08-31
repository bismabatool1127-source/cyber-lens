import { el } from './el.js';
import { svgIcon } from './icons.js';
import { apiGet } from '../api.js';

/** Security dashboard — every number comes from the real API (no fabricated stats). */

function countUp(node, target) {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  if (reducedMotion || target === 0) {
    node.textContent = String(target);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const k = Math.min((now - start) / 800, 1);
    node.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(() => {
    node.textContent = String(target);
  }, 900);
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
}

function statCard(label, value, variant, icon) {
  const valueEl = el('div', { class: 'stat-value mono' }, '0');
  const card = el('article', { class: `stat-card glass ${variant}` }, [
    el('span', { class: 'stat-icon' }, svgIcon(icon, 20)),
    valueEl,
    el('p', { class: 'stat-label' }, label),
  ]);
  countUp(valueEl, value);
  return card;
}

function badgeFor(classification) {
  return el('span', { class: `badge badge-${classification}` }, classification === 'LOW' ? 'LOW RISK' : classification);
}

export function createDashboard() {
  const statsGrid = el('div', { class: 'dash-stats' });
  const distHolder = el('div');
  const recentHolder = el('div');
  const intelHolder = el('div');

  const panel = (title, icon, body) => el('div', { class: 'panel glass' }, [el('h3', { class: 'panel-title' }, [svgIcon(icon, 15), title]), body]);

  const section = el('section', { class: 'section', id: 'dashboard' }, [
    el('div', { class: 'section-head reveal' }, [
      el('p', { class: 'section-kicker' }, 'Security dashboard'),
      el('h2', { class: 'section-title' }, 'Live threat activity'),
      el('p', { class: 'section-sub' }, 'Every scan Cyber-Lens performs, classified in real time.'),
    ]),
    el('div', { class: 'reveal' }, statsGrid),
    el('div', { class: 'dash-columns reveal' }, [
      panel('Risk distribution & recent scans', 'pulse', el('div', {}, [distHolder, recentHolder])),
      panel('Threat intelligence', 'radar', intelHolder),
    ]),
    el('p', { class: 'dash-note' }, 'Live activity since this service instance started — counters reset on restart. Submissions themselves are never stored.'),
  ]);

  const load = async () => {
    statsGrid.replaceChildren();
    distHolder.replaceChildren();
    recentHolder.replaceChildren();
    intelHolder.replaceChildren();

    let stats = null;
    try {
      stats = await apiGet('/stats');
    } catch {
      /* handled below */
    }

    if (stats) {
      const { total, safe, suspicious, malicious } = stats.scans;
      statsGrid.append(
        statCard('Total scans', total, 'stat-total', 'radar'),
        statCard('Safe (low risk)', safe, 'stat-safe', 'shieldCheck'),
        statCard('Suspicious', suspicious, 'stat-suspicious', 'shieldAlert'),
        statCard('Malicious (high risk)', malicious, 'stat-malicious', 'shieldX')
      );

      const bar = el('div', { class: 'dist-bar', role: 'img', 'aria-label': `Risk distribution: ${safe} low risk, ${suspicious} suspicious, ${malicious} high risk` });
      if (total > 0) {
        for (const [cls, count] of [
          ['seg-safe', safe],
          ['seg-suspicious', suspicious],
          ['seg-malicious', malicious],
        ]) {
          if (count > 0) bar.appendChild(el('div', { class: `dist-seg ${cls}`, style: `width:${(count / total) * 100}%` }));
        }
      }
      distHolder.append(
        bar,
        el('ul', { class: 'dist-legend' }, [
          el('li', { class: 'legend-item' }, [el('span', { class: 'legend-swatch', style: 'background: var(--risk-low)' }), `Low risk `, el('span', { class: 'mono' }, String(safe))]),
          el('li', { class: 'legend-item' }, [el('span', { class: 'legend-swatch', style: 'background: var(--risk-suspicious)' }), `Suspicious `, el('span', { class: 'mono' }, String(suspicious))]),
          el('li', { class: 'legend-item' }, [el('span', { class: 'legend-swatch', style: 'background: var(--risk-high)' }), `High risk `, el('span', { class: 'mono' }, String(malicious))]),
        ])
      );

      const intel = stats.threatIntel || {};
      const feedLive = (intel.feedEntries || 0) > 0;
      intelHolder.appendChild(
        el('dl', { class: 'intel-rows' }, [
          el('div', { class: 'intel-row' }, [el('dt', {}, 'Curated threat records'), el('dd', {}, intel.seedRecords == null ? '—' : String(intel.seedRecords))]),
          el('div', { class: 'intel-row' }, [el('dt', {}, 'Live feed entries'), el('dd', {}, String(intel.feedEntries || 0))]),
          el('div', { class: 'intel-row' }, [
            el('dt', {}, 'Feed status'),
            el(
              'dd',
              { class: 'intel-live' },
              feedLive
                ? [el('span', { class: 'status-dot', 'aria-hidden': 'true' }), 'Active']
                : [el('span', { class: 'status-dot', style: 'animation:none;background:var(--text-muted);box-shadow:none', 'aria-hidden': 'true' }), 'Unavailable']
            ),
          ]),
          el('div', { class: 'intel-row' }, [
            el('dt', {}, 'Last feed sync'),
            el('dd', {}, intel.feedLastSync ? timeAgo(intel.feedLastSync) : '—'),
          ]),
        ])
      );
    } else {
      statsGrid.appendChild(el('p', { class: 'empty-state' }, 'Scan statistics are temporarily unavailable.'));
    }

    try {
      const { scans } = await apiGet('/recent-scans');
      if (!scans || scans.length === 0) {
        recentHolder.appendChild(
          el('p', { class: 'empty-state' }, 'No scans yet. Run your first analysis above — your latest results will appear here.')
        );
      } else {
        const list = el('ul', { class: 'recent-list' });
        for (const scan of scans) {
          list.appendChild(
            el('li', { class: 'recent-item' }, [
              el('span', { class: 'recent-item-type' }, [svgIcon(scan.type, 14), scan.type]),
              el('span', { class: 'recent-item-target' }, scan.targetSummary),
              badgeFor(scan.classification),
              el('span', { class: 'recent-item-time' }, timeAgo(scan.timestamp)),
            ])
          );
        }
        recentHolder.appendChild(list);
      }
    } catch {
      recentHolder.appendChild(el('p', { class: 'empty-state' }, 'Scan history is temporarily unavailable.'));
    }
  };

  load();

  const refresh = () => {
    if (section.isConnected) load();
  };
  window.addEventListener('scan:complete', refresh);
  window.addEventListener('focus', refresh);
  section.cleanup = () => {
    window.removeEventListener('scan:complete', refresh);
    window.removeEventListener('focus', refresh);
  };

  return section;
}
