// Umumiy yordamchilar: formatlash, ikonlar, toast, modal, to‘lov tasmasi, IMEI yorlig‘i
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const num = (n) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
export const som = (n) => `${num(n)}\u00a0so‘m`;
export const digits = (s) => String(s || '').replace(/\D/g, '');
export const toInt = (s) => Number(digits(s)) || 0;

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];
const MONTHS_FULL = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
export function fdate(s, withYear = true) {
  if (!s) return '—';
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return `${d}-${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}
export const monthName = (ym) => MONTHS_FULL[Number(ym.slice(5, 7)) - 1];
export function ago(iso) {
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (sec < 60) return 'hozirgina';
  if (sec < 3600) return `${Math.floor(sec / 60)} daqiqa oldin`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} soat oldin`;
  return `${Math.floor(sec / 86400)} kun oldin`;
}
export function todayStr() {
  return new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10);
}
export function fphone(p) {
  const d = digits(p);
  if (d.length !== 12) return p || '';
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
}

// IMEI: 15 raqam + Luhn nazorati
export function imeiValid(imei) {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) { let d = +imei[i]; if (i % 2) { d *= 2; if (d > 9) d -= 9; } sum += d; }
  return sum % 10 === 0;
}
export const fimei = (s) => { const d = digits(s); return d.length === 15 ? `${d.slice(0, 2)} ${d.slice(2, 8)} ${d.slice(8, 14)} ${d.slice(14)}` : d; };

// Telefon qutisidagi kabi IMEI yorlig‘i (shtrix-kod bilan)
export function imeiLabel(imei, title = 'IMEI') {
  const d = digits(imei);
  let x = 0;
  const bars = [...(d || '000000000000000')].map((c, i) => {
    const w1 = 1 + ((+c + i) % 3), w2 = 1 + ((+c * 7 + i) % 3);
    const out = `<rect x="${x}" width="${w1}" height="34"/>`;
    x += w1 + w2 + 1;
    const out2 = `<rect x="${x}" width="${1 + (+c % 2)}" height="34"/>`;
    x += 3;
    return out + out2;
  }).join('');
  return `<div class="imei"><span class="imei-t">${esc(title)}</span><svg viewBox="0 0 ${x} 34" preserveAspectRatio="none" aria-hidden="true">${bars}</svg><code>${esc(fimei(d))}</code></div>`;
}

// To‘lov tasmasi: har oy bitta bo‘lak
const RB_TITLE = { paid: 'to‘langan', today: 'bugun', overdue: 'kechikkan', upcoming: 'kutilmoqda' };
export function ribbon(statuses, big = false) {
  const paid = statuses.filter((s) => s === 'paid').length;
  return `<div class="ribbon${big ? ' big' : ''}" role="img" aria-label="${statuses.length} oydan ${paid} tasi to‘langan">${statuses.map((s, i) => `<i class="rb-${s}" style="--i:${i}" title="${i + 1}-oy: ${RB_TITLE[s]}"></i>`).join('')}</div>`;
}

const BADGE = { active: ['Faol', 'b-active'], overdue: ['Kechikkan', 'b-overdue'], closed: ['Yopilgan', 'b-closed'], today: ['Bugun', 'b-today'] };
export function badge(status) { const [t, c] = BADGE[status] || [status, '']; return `<span class="badge ${c}">${t}</span>`; }

// Nasiya hisobi (server bilan bir xil formula)
export function plan({ cashPrice, markupPercent, totalPrice, downPayment, months }) {
  const roundK = (n) => Math.round(n / 1000) * 1000;
  const total = totalPrice ? roundK(totalPrice) : roundK(cashPrice * (1 + (markupPercent || 0) / 100));
  const remaining = Math.max(0, total - (downPayment || 0));
  const base = months ? Math.floor(remaining / months / 1000) * 1000 : 0;
  const last = months ? remaining - base * (months - 1) : 0;
  return { total, remaining, monthly: base, last, overpayment: total - cashPrice, percent: cashPrice ? Math.round(((total - cashPrice) / cashPrice) * 1000) / 10 : 0 };
}

// Ikonlar (inline SVG)
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  tg: '<path d="m21.5 4.5-19 7.3 6 2.2 2.3 6.5 3.4-4.2 5 3.7z"/><path d="m8.5 14 9-6.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
};
export const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

// Toast xabarlari
export function toast(msg, kind = 'ok') {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = `toast t-${kind}`;
  t.innerHTML = `${icon(kind === 'err' ? 'alert' : 'check')}<span>${esc(msg)}</span>`;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3800);
}

// Modal oyna: html + tugmalar. Promise qaytaradi.
export function modal({ title, body, actions = [], onOpen }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
      <div class="modal-h"><h3 id="m-title">${esc(title)}</h3><button class="icon-btn" data-close aria-label="Yopish">${icon('x')}</button></div>
      <div class="modal-b">${body}</div>
      <div class="modal-f">${actions.map((a, i) => `<button class="btn ${a.kind || ''}" data-i="${i}" type="button">${esc(a.label)}</button>`).join('')}</div>
    </div>`;
    const close = (v) => { wrap.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(null); });
    $$('[data-i]', wrap).forEach((b) => b.addEventListener('click', async () => {
      const a = actions[+b.dataset.i];
      if (a.handler) {
        b.disabled = true;
        try { const v = await a.handler(wrap); if (v !== false) close(v ?? true); } finally { b.disabled = false; }
      } else close(a.value ?? null);
    }));
    document.body.appendChild(wrap);
    onOpen?.(wrap);
    ($('input,select,textarea', wrap) || $('[data-i]', wrap))?.focus();
  });
}

export const confirmBox = (title, text, okLabel = 'Ha', kind = 'danger') =>
  modal({ title, body: `<p>${esc(text)}</p>`, actions: [{ label: 'Bekor qilish', kind: 'ghost', value: false }, { label: okLabel, kind, value: true }] });

// Pul maydonlari: yozganda 3 xonadan ajratadi
export function moneyInput(el, onChange) {
  const fmt = () => {
    const n = digits(el.value);
    el.value = n ? num(n) : '';
    onChange?.();
  };
  el.addEventListener('input', fmt);
  fmt();
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Nusxalandi'); }
  catch { prompt('Nusxalang:', text); }
}

export function qr(el, text, size = 168) {
  el.innerHTML = '';
  if (window.QRCode && text) new window.QRCode(el, { text, width: size, height: size, colorDark: '#0A0A0B', colorLight: '#ffffff' });
  else el.innerHTML = '<p class="muted small">QR yuklanmadi</p>';
}

// Yarim doira o‘lchagich (segmentli), animatsiya bilan yonadi
export function gauge(pct, label) {
  const n = 26, lit = Math.round((Math.max(0, Math.min(100, pct)) / 100) * n);
  const segs = Array.from({ length: n }, (_, i) => {
    const a = Math.PI * (i / (n - 1));
    const cx = 100 - Math.cos(a) * 78, cy = 100 - Math.sin(a) * 78;
    const deg = (a * 180) / Math.PI - 90;
    return `<rect class="g-seg ${i < lit ? 'on' : ''}" style="--i:${i}" x="${cx - 4}" y="${cy - 13}" width="8" height="26" rx="3" transform="rotate(${deg} ${cx} ${cy})"/>`;
  }).join('');
  return `<div class="gauge"><svg viewBox="0 0 200 112" role="img" aria-label="${esc(label)}: ${pct}%"><defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#FF8A3D"/><stop offset="1" stop-color="#FF4A12"/></linearGradient></defs>${segs}</svg><div class="g-val"><b data-count="${pct}" data-suffix="%">${pct}%</b><span>${esc(label)}</span></div></div>`;
}
