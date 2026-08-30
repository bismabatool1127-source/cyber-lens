import { routePaths } from '../router.js';

const LINK_LABELS = {
  '/': 'Home',
  '/url': 'URL Scanner',
  '/email': 'Email Scanner',
  '/phone': 'Phone Scanner',
  '/about': 'About',
};

export function initNav() {
  const list = document.getElementById('nav-links');
  const menu = document.getElementById('nav-menu');
  const toggle = document.getElementById('nav-toggle');
  if (!list || !menu || !toggle) return;

  for (const path of routePaths()) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'nav-link';
    a.href = `#${path}`;
    a.textContent = LINK_LABELS[path] ?? path;
    a.dataset.path = path;
    li.appendChild(a);
    list.appendChild(li);
  }

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  menu.addEventListener('click', (e) => {
    if (e.target instanceof HTMLAnchorElement) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

export function setActiveNav(path) {
  for (const a of document.querySelectorAll('.nav-link')) {
    if (a.dataset.path === path) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}
