/** Minimal hash router. Pages export render(container) and optional destroy(). */

const routes = new Map();
let current = null;
let onChange = null;

export function registerRoute(path, page) {
  routes.set(path, page);
}

export function setRouteChangeListener(listener) {
  onChange = listener;
}

export function routePaths() {
  return [...routes.keys()];
}

function currentPath() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '' ? '/' : hash;
}

export function navigate(path) {
  window.location.hash = path;
}

async function render() {
  const path = currentPath();
  const page = routes.get(path) ?? routes.get('/');
  const container = document.getElementById('main');
  if (!container || !page) return;

  if (current?.destroy) current.destroy();
  container.innerHTML = '';
  current = page;
  onChange?.(path);
  await page.render(container);
  container.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  render();
}
