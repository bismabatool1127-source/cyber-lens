const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { scroll: 'how-it-works', label: 'How It Works' },
  { scroll: 'features', label: 'Features' },
  { path: '/about', label: 'About' },
];

function scrollToSection(id) {
  const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth';
  const t0 = performance.now();
  const attempt = () => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior, block: 'start' });
      return;
    }
    if (performance.now() - t0 < 900) requestAnimationFrame(attempt);
  };
  attempt();
}

function goHomeThen(action) {
  if (location.hash === '#/' || location.hash === '' || location.hash === '#') {
    action();
  } else {
    location.hash = '#/';
    setTimeout(action, 60);
  }
}

export function initNav() {
  const list = document.getElementById('nav-links');
  const menu = document.getElementById('nav-menu');
  const toggle = document.getElementById('nav-toggle');
  const cta = document.getElementById('nav-cta');
  if (!list || !menu || !toggle) return;

  for (const link of NAV_LINKS) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'nav-link';
    a.textContent = link.label;
    if (link.path) {
      a.href = `#${link.path}`;
      a.dataset.path = link.path;
    } else {
      a.href = '#/';
      a.dataset.scroll = link.scroll;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        goHomeThen(() => scrollToSection(link.scroll));
      });
    }
    li.appendChild(a);
    list.appendChild(li);
  }

  cta?.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    goHomeThen(() => {
      scrollToSection('scanner-console');
      document.getElementById('url-input')?.focus({ preventScroll: true });
    });
  });

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
