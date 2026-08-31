/** IntersectionObserver-based reveal-on-scroll. Returns a cleanup function. */
export function observeReveals(container) {
  const targets = container.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-visible'));
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  targets.forEach((t) => io.observe(t));
  return () => io.disconnect();
}
