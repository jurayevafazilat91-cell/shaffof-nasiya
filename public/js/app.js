// Router va ilova qobig‘i: yon menyu, yuqori panel, pastki menyu (mobil), xabarlar
import { api, auth } from './api.js';
import { $, $$, icon, esc, toast } from './ui.js';
import { enhance, spotlight } from './animate.js';
import landing from './pages/landing.js';
import authPage from './pages/auth.js';
import dashboard from './pages/dashboard.js';
import statsPage from './pages/stats.js';
import salesList from './pages/sales.js';
import newSale from './pages/new-sale.js';
import saleDetail from './pages/sale.js';
import notificationsPage from './pages/notifications.js';
import settingsPage from './pages/settings.js';
import publicPage from './pages/public.js';

const root = document.getElementById('root');
const APP = ['panel', 'savdolar', 'yangi', 'savdo', 'xabarlar', 'sozlamalar', 'statistika'];
const TITLES = { panel: 'Panel', savdolar: 'Savdolar', yangi: 'Yangi nasiya', savdo: 'Savdo', xabarlar: 'Xabarlar', sozlamalar: 'Sozlamalar', statistika: 'Statistika' };
let pollTimer = null;
let lastUnread = null;
let renderId = 0;

const routes = {
  '': landing,
  kirish: (el) => authPage(el, 'login', ctx),
  royxat: (el) => authPage(el, 'register', ctx),
  panel: dashboard, statistika: statsPage, savdolar: salesList, yangi: newSale, savdo: saleDetail,
  xabarlar: notificationsPage, sozlamalar: settingsPage, m: publicPage,
};

export const ctx = {
  go: (hash) => { if (location.hash === hash) render(); else location.hash = hash; },
  refreshBell,
  get seller() { return auth.seller(); },
  isCurrent: (id) => id === renderId,
};

function parse() {
  const [name = '', param] = location.hash.replace(/^#\/?/, '').split('/');
  return { name, param: param ? decodeURIComponent(param) : undefined };
}

export function logoMark() {
  return `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lgm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8A3D"/><stop offset="1" stop-color="#E8430E"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#lgm)"/><path d="M9 9h10a4 4 0 0 1 0 8h-6a4 4 0 0 0 0 8h10" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="23" cy="9" r="2.2" fill="#fff"/></svg>`;
}

// Yon menyu: asosiy bo‘limlar va "Sozlamalar" guruhi
const NAV_MAIN = [
  ['panel', 'home', 'Panel', ''],
  ['savdolar', 'list', 'Savdolar', 'cnt-sales'],
  ['xabarlar', 'bell', 'Xabarlar', 'cnt-notes'],
  ['statistika', 'chart', 'Statistika', ''],
];
const NAV_SETTINGS = [
  ['sozlamalar', 'tg', 'Telegram bot', 'tg'],
  ['sozlamalar', 'gear', 'Sozlamalar', ''],
];
const TABS = [['panel', 'home', 'Panel'], ['savdolar', 'list', 'Savdolar'], ['yangi', 'plus', 'Yangi'], ['xabarlar', 'bell', 'Xabarlar'], ['sozlamalar', 'gear', 'Sozlamalar']];

function navLink([k, ic, t, extra]) {
  const badge = extra === 'cnt-sales' ? '<em class="nb" data-cnt="sales" hidden></em>'
    : extra === 'cnt-notes' ? '<em class="nb hot dot-count" hidden></em>'
    : extra === 'tg' ? '<em class="nb-dot" data-tg hidden></em>' : '';
  return `<a href="#/${k}" data-k="${k}${extra === 'tg' ? '-tg' : ''}">${icon(ic)}<span>${t}</span>${badge}</a>`;
}

function mountShell(active) {
  if (!$('#shell')) {
    root.className = 'app';
    root.innerHTML = `
      <div id="shell">
        <aside class="side" aria-label="Yon menyu">
          <a class="logo" href="#/panel">${logoMark()}<span>Shaffof<b>Nasiya</b></span></a>
          <form class="side-search" id="side-search" role="search">
            ${icon('search')}<input id="side-q" type="search" placeholder="Qidirish" aria-label="Mijoz, telefon yoki IMEI qidirish">
          </form>
          <nav class="side-nav" aria-label="Asosiy menyu">
            ${NAV_MAIN.map(navLink).join('')}
            <small class="side-label">SOZLAMALAR</small>
            ${NAV_SETTINGS.map(navLink).join('')}
          </nav>
          <div class="side-foot">
            <div class="shop"><span class="avatar" id="sh-av"></span><div><b id="sh-shop"></b><small id="sh-name"></small></div></div>
            <button class="side-out" id="logout" type="button">${icon('out')}<span>Chiqish</span></button>
          </div>
        </aside>

        <div class="main-col">
          <header class="topbar">
            <a class="logo m-logo" href="#/panel">${logoMark()}<span>Shaffof<b>Nasiya</b></span></a>
            <nav class="crumb-pill" aria-label="Joylashuv"><a href="#/panel">Shaffof Nasiya</a><em>›</em><span id="crumb">Panel</span></nav>
            <div class="top-act">
              <a class="circle-btn" href="#/xabarlar" aria-label="Xabarlar">${icon('bell')}<em class="dot-count" hidden></em></a>
              <a class="circle-btn hide-m" href="#/sozlamalar" aria-label="Telegram bot">${icon('tg')}</a>
              <a class="circle-btn hide-m avatar-btn" href="#/sozlamalar" aria-label="Profil" id="top-av"></a>
              <a class="btn primary new-btn" href="#/yangi">${icon('plus')}<span>Yangi nasiya</span></a>
            </div>
          </header>
          <main id="main" tabindex="-1"></main>
        </div>

        <nav class="tabbar" aria-label="Pastki menyu">
          ${TABS.map(([k, ic, t]) => `<a href="#/${k}" data-tab="${k}" class="${k === 'yangi' ? 'tab-fab' : ''}">${icon(ic)}<span>${t}</span>${k === 'xabarlar' ? '<em class="dot-count" hidden></em>' : ''}</a>`).join('')}
        </nav>
      </div>`;

    $('#logout').addEventListener('click', () => { auth.clear(); stopPoll(); location.hash = '#/kirish'; });
    $('#side-search').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('#side-q').value.trim();
      try { sessionStorage.setItem('sn_q', q); } catch { /* */ }
      $('#side-q').value = '';
      ctx.go('#/savdolar');
    });
    startPoll();
    api('GET', 'me').then((me) => { auth.saveSeller(me); fillSeller(me); }).catch(() => {});
  }
  fillSeller(auth.seller() || {});
  $('#crumb').textContent = TITLES[active] || '';
  const navKey = active === 'savdo' ? 'savdolar' : active;
  $$('.side-nav a').forEach((a) => a.classList.toggle('on', a.dataset.k === navKey));
  $$('[data-tab]').forEach((a) => a.classList.toggle('on', a.dataset.tab === navKey));
  $('.new-btn').classList.toggle('on', active === 'yangi');
}

function fillSeller(s) {
  if (!$('#sh-shop')) return;
  const initial = (s.shopName || s.name || '?').trim().charAt(0).toUpperCase();
  $('#sh-shop').textContent = s.shopName || '';
  $('#sh-name').textContent = s.name || '';
  $('#sh-av').textContent = initial;
  $('#top-av').textContent = initial;
  const tgDot = $('[data-tg]');
  if (tgDot) tgDot.hidden = Boolean(s.telegramConnected);
}

async function refreshBell() {
  if (!auth.token) return;
  try {
    const { unread, items, activeSales } = await api('GET', 'notifications');
    $$('.dot-count').forEach((el) => { el.hidden = !unread; el.textContent = unread > 99 ? '99+' : unread; });
    const sc = $('[data-cnt="sales"]');
    if (sc) { sc.hidden = !activeSales; sc.textContent = activeSales; }
    if (lastUnread !== null && unread > lastUnread && items[0]) toast(items[0].text, 'info');
    lastUnread = unread;
  } catch { /* jim */ }
}
function startPoll() { stopPoll(); pollTimer = setInterval(refreshBell, 60000); }
function stopPoll() { clearInterval(pollTimer); pollTimer = null; lastUnread = null; }

async function render() {
  const id = ++renderId;
  const { name, param } = parse();
  if (APP.includes(name) && !auth.token) { location.hash = '#/kirish'; return; }
  if ((name === 'kirish' || name === 'royxat') && auth.token) { location.hash = '#/panel'; return; }
  const view = routes[name] || landing;

  if (APP.includes(name)) {
    mountShell(name);
    const main = $('#main');
    document.title = `${TITLES[name]} — Shaffof Nasiya`;
    main.innerHTML = '<div class="loading" aria-label="Yuklanmoqda"><span></span><span></span><span></span></div>';
    try { await view(main, param, ctx, id); }
    catch (e) { if (id === renderId) main.innerHTML = `<div class="empty">${icon('alert')}<h3>Xatolik</h3><p>${esc(e.message)}</p><button class="btn" onclick="location.reload()">Qayta yuklash</button></div>`; }
    if (id === renderId) { enhance(main); spotlight(main); main.focus({ preventScroll: true }); refreshBell(); }
  } else {
    stopPoll();
    root.className = 'bare';
    root.innerHTML = '';
    document.title = 'Shaffof Nasiya — telefon do‘konlari uchun raqamli nasiya daftari';
    await view(root, param, ctx, id);
    enhance(root);
    spotlight(root);
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();
