// Animatsiyalar: scroll paytida paydo bo‘lish, raqamlarning sanab chiqishi
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');

export function enhance(root) {
  reveal(root);
  countUps(root);
}

function reveal(root) {
  const els = root.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window) || reduced()) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((e) => io.observe(e));
}

function countUps(root) {
  root.querySelectorAll('[data-count]').forEach((el) => countTo(el, Number(el.dataset.count) || 0, el.dataset.suffix || '', 0));
}

// Raqamni joriy qiymatidan (yoki from dan) yangisiga sanab o‘tkazadi; qayta chaqirilsa eskisi to‘xtaydi
export function countTo(el, target, suffix = '', from = Number(el.textContent.replace(/\D/g, '')) || 0) {
  const run = (el._countRun = (el._countRun || 0) + 1);
  if (reduced() || from === target) { el.textContent = fmt(target) + suffix; return; }
  const start = performance.now(), dur = 1100;
  const tick = (now) => {
    if (run !== el._countRun) return;
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(from + (target - from) * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Sichqoncha ortidan ergashuvchi yorug‘lik (kartalarda)
export function spotlight(root) {
  root.querySelectorAll('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
      // -1…1 oralig‘ida: CSS dagi 3D qiyshayish uchun (.db-card)
      if (!reduced()) {
        el.style.setProperty('--rx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
        el.style.setProperty('--ry', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
      }
    });
  });
}
