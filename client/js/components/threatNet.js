import { el } from './el.js';

/**
 * Interactive threat-network visualization (Canvas 2D, lightweight).
 * Clearly labeled as a simulated model — it illustrates monitored activity,
 * it does not present fabricated data as real.
 */

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LABELS = [
  'Mail gateway', 'Web proxy', 'DNS resolver', 'Auth service', 'Endpoint 07',
  'Endpoint 12', 'Endpoint 21', 'Endpoint 33', 'Endpoint 44', 'Endpoint 56',
  'Backup node', 'API gateway', 'File server', 'IoT bridge', 'CDN edge',
  'Identity provider', 'Log collector', 'Payment relay', 'Endpoint 61', 'Endpoint 72',
  'Unknown relay', 'Phishing host', 'Botnet node', 'C2 beacon',
];

export function createThreatNet() {
  const canvas = el('canvas', { class: 'net-canvas', 'aria-hidden': 'true' });
  const tooltip = el('div', { class: 'net-tooltip', 'aria-hidden': 'true' });

  const panel = el('div', { class: 'net-panel glass' }, [
    canvas,
    tooltip,
    el('div', { class: 'net-caption' }, [
      el('span', {}, 'Simulated network model — illustrates what continuous observation looks like.'),
      el('div', { class: 'net-legend' }, [
        el('span', {}, [el('i', { style: 'background:#38bdf8' }), 'Monitored node']),
        el('span', {}, [el('i', { style: 'background:#fb7185' }), 'Threat indicator']),
        el('span', {}, [el('i', { style: 'background:#a5f3fc' }), 'Data in transit']),
      ]),
    ]),
  ]);

  const ctx = canvas.getContext('2d');
  if (!ctx) return panel;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const rand = mulberry32(7);

  const N = 24;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const threat = i >= N - 3;
    nodes.push({
      x: 0.06 + rand() * 0.88,
      y: 0.1 + rand() * 0.8,
      r: threat ? 5 : 3 + rand() * 2.5,
      threat,
      label: LABELS[i],
      phase: rand() * Math.PI * 2,
    });
  }

  const edges = [];
  for (let i = 1; i < N; i++) {
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < i; j++) {
      const d = (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    edges.push([i, best]);
    if (rand() < 0.3) edges.push([i, Math.floor(rand() * i)]);
  }

  const packets = Array.from({ length: 14 }, () => ({
    edge: Math.floor(rand() * edges.length),
    t: rand(),
    speed: 0.12 + rand() * 0.25,
  }));

  let rafId = null;
  let visible = true;
  let hovered = -1;
  let disposed = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reducedMotion) draw(0);
  }

  function draw(t) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    ctx.lineWidth = 1;
    for (const [a, b] of edges) {
      ctx.strokeStyle = nodes[a].threat || nodes[b].threat ? 'rgba(251,113,133,0.22)' : 'rgba(125,165,255,0.16)';
      ctx.beginPath();
      ctx.moveTo(nodes[a].x * w, nodes[a].y * h);
      ctx.lineTo(nodes[b].x * w, nodes[b].y * h);
      ctx.stroke();
    }

    if (!reducedMotion) {
      for (const p of packets) {
        const [a, b] = edges[p.edge];
        const x = (nodes[a].x + (nodes[b].x - nodes[a].x) * p.t) * w;
        const y = (nodes[a].y + (nodes[b].y - nodes[a].y) * p.t) * h;
        ctx.fillStyle = nodes[a].threat || nodes[b].threat ? 'rgba(251,113,133,0.8)' : 'rgba(165,243,252,0.85)';
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    nodes.forEach((node, i) => {
      const x = node.x * w;
      const y = node.y * h;
      const pulse = reducedMotion ? 0 : Math.sin(t * 0.002 + node.phase) * 0.5 + 0.5;

      if (node.threat) {
        ctx.fillStyle = `rgba(251,113,133,${0.12 + pulse * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, node.r + 7 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(251,113,133,0.95)';
      } else if (i === hovered) {
        ctx.fillStyle = 'rgba(103,232,249,0.95)';
      } else {
        ctx.fillStyle = 'rgba(56,189,248,0.8)';
      }
      ctx.beginPath();
      ctx.arc(x, y, node.r, 0, Math.PI * 2);
      ctx.fill();

      if (i === hovered) {
        ctx.strokeStyle = 'rgba(103,232,249,0.9)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, node.r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  function frame(t) {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    for (const p of packets) p.t = (p.t + p.speed / 60) % 1;
    draw(t);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  io.observe(canvas);

  if (!reducedMotion) rafId = requestAnimationFrame(frame);

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    hovered = -1;
    nodes.forEach((node, i) => {
      const dx = node.x * rect.width - mx;
      const dy = node.y * rect.height - my;
      if (dx * dx + dy * dy < 14 * 14) hovered = i;
    });
    if (hovered >= 0) {
      const node = nodes[hovered];
      tooltip.textContent = `${node.label} — ${node.threat ? 'threat indicator' : 'monitored'}`;
      tooltip.style.left = `${node.x * rect.width + 12}px`;
      tooltip.style.top = `${node.y * rect.height - 10}px`;
      tooltip.classList.add('visible');
    } else {
      tooltip.classList.remove('visible');
    }
    if (reducedMotion) draw(0);
  });

  canvas.addEventListener('pointerleave', () => {
    hovered = -1;
    tooltip.classList.remove('visible');
    if (reducedMotion) draw(0);
  });

  panel.destroy = () => {
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    ro.disconnect();
    io.disconnect();
  };

  return panel;
}
