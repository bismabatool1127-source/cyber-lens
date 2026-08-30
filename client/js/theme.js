const STORAGE_KEY = 'cyberlens-theme';

function systemPreference() {
  return window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark';
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const label = document.getElementById('theme-toggle-label');
  if (label) label.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  apply(saved === 'light' || saved === 'dark' ? saved : systemPreference());

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  });
}
