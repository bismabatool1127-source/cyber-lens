export function showToast(message, type = 'info', duration = 5000) {
  const region = document.getElementById('toast-region');
  if (!region) return;

  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : ''}`;
  toast.textContent = message;
  region.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}
