document.addEventListener('DOMContentLoaded', () => {
  const includes = document.querySelectorAll('[data-include]');
  includes.forEach(async (el) => {
    const url = el.getAttribute('data-include');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      const html = await res.text();
      el.innerHTML = html;
      // after injecting, set year if footer contains span
      const yearEl = document.getElementById('year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    } catch (e) {
      console.warn('Include failed', url, e);
    }
  });
  // fallback: ensure year is set once includes finish (in case injection was async)
  setTimeout(() => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }, 500);
});
