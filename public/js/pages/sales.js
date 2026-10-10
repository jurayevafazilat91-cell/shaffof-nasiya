// Savdolar ro‘yxati: qidiruv, filtr, Excel’ga eksport
import { api } from '../api.js';
import { $, esc, icon, num, fdate, fphone, ribbon, badge, todayStr } from '../ui.js';

const FILTERS = [['all', 'Hammasi'], ['active', 'Faol'], ['today', 'Bugun'], ['overdue', 'Kechikkan'], ['closed', 'Yopilgan']];
let state = { q: '', filter: 'all' };

export default async function salesList(el, param, ctx, id) {
  // #/savdolar/overdue kabi havoladan filtr, yon menyudagi qidiruvdan so‘z
  if (param && FILTERS.some(([k]) => k === param)) state.filter = param;
  try { const q = sessionStorage.getItem('sn_q'); if (q !== null) { state.q = q; sessionStorage.removeItem('sn_q'); } } catch { /* */ }
  el.innerHTML = `
  <div class="page">
    <header class="ph">
      <div><h1>Savdolar</h1><p class="muted" id="cnt"></p></div>
      <div class="ph-act">
        <button class="btn ghost" id="csv" type="button">${icon('download')}<span>Excel</span></button>
        <a class="btn primary" href="#/yangi">${icon('plus')}<span>Yangi nasiya</span></a>
      </div>
    </header>
    <div class="toolbar">
      <label class="search">${icon('search')}<input id="q" type="search" placeholder="Ism, telefon yoki IMEI bo‘yicha qidirish" value="${esc(state.q)}" aria-label="Qidirish"></label>
      <div class="chips" role="tablist">${FILTERS.map(([k, t]) => `<button class="chip ${state.filter === k ? 'on' : ''}" data-f="${k}" type="button" role="tab" aria-selected="${state.filter === k}">${t}</button>`).join('')}</div>
    </div>
    <div id="list"></div>
  </div>`;

  let items = [];
  const load = async () => {
    const qs = new URLSearchParams({ q: state.q, filter: state.filter });
    const r = await api('GET', `sales?${qs}`);
    if (!ctx.isCurrent(id)) return;
    items = r.items;
    $('#cnt', el).textContent = `Jami ${r.total} ta savdo${state.q || state.filter !== 'all' ? `, topildi: ${items.length}` : ''}`;
    $('#list', el).innerHTML = items.length ? table(items) : `<div class="empty">${icon('book')}<h3>${r.total ? 'Hech narsa topilmadi' : 'Hali savdo yo‘q'}</h3><p>${r.total ? 'Qidiruv yoki filtrni o‘zgartiring.' : 'Birinchi nasiyani kiriting — jadval o‘zi tuziladi.'}</p>${r.total ? '' : '<a class="btn primary" href="#/yangi">Yangi nasiya</a>'}</div>`;
  };

  let timer;
  $('#q', el).addEventListener('input', (e) => { state.q = e.target.value; clearTimeout(timer); timer = setTimeout(load, 250); });
  el.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.f;
    el.querySelectorAll('[data-f]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    load();
  }));
  $('#csv', el).addEventListener('click', () => exportCsv(items));
  await load();
}

function table(items) {
  const t = todayStr();
  return `<div class="tbl" role="table" aria-label="Savdolar">
    <div class="tr th" role="row"><span>Mijoz</span><span>Telefon</span><span>Oylik</span><span>Qoldi</span><span>Jadval</span><span>Holat</span></div>
    ${items.map((s) => {
      const isToday = s.next && s.next.dueDate === t && s.status === 'active';
      return `<a class="tr" role="row" href="#/savdo/${s.id}">
        <span class="c-cust"><b>${esc(s.customer.fullName)}</b><small>${s.code} · ${fphone(s.customer.phone)}</small></span>
        <span class="c-dev"><b>${esc(s.device.brand)} ${esc(s.device.model)}</b><small class="mono">IMEI …${esc(s.device.imei.slice(-6))}</small></span>
        <span class="c-num"><b>${num(s.monthlyPayment)}</b><small>${s.months} oy</small></span>
        <span class="c-num"><b class="${s.status === 'overdue' ? 'red' : ''}">${num(s.remaining)}</b><small>${s.next ? 'keyingi: ' + fdate(s.next.dueDate, false) : 'to‘langan'}</small></span>
        <span class="c-rb">${ribbon(s.ribbon)}<small>${s.paidMonths}/${s.months} oy</small></span>
        <span class="c-st">${badge(isToday ? 'today' : s.status)}</span>
      </a>`;
    }).join('')}
  </div>`;
}

// Excel ochadigan CSV (UTF-8 BOM bilan, o‘zbek harflari buzilmaydi)
function exportCsv(items) {
  const head = ['Kod', 'Mijoz', 'Telefon', 'Pasport', 'Brend', 'Model', 'Xotira', 'Rang', 'IMEI', 'IMEI 2', 'Naqd narx', 'Umumiy narx', 'Boshlang‘ich', 'Oylik', 'Muddat (oy)', 'Boshlangan', 'To‘langan', 'Qoldi', 'Kechikkan', 'Holat'];
  const st = { active: 'Faol', overdue: 'Kechikkan', closed: 'Yopilgan' };
  const rowsArr = items.map((s) => [s.code, s.customer.fullName, s.customer.phone, s.customer.passport, s.device.brand, s.device.model, s.device.memory, s.device.color,
    `="${s.device.imei}"`, s.device.imei2 ? `="${s.device.imei2}"` : '', s.cashPrice, s.totalPrice, s.downPayment, s.monthlyPayment, s.months, s.startDate, s.paidTotal, s.remaining, s.overdueAmount, st[s.status]]);
  const csv = [head, ...rowsArr].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nasiya-savdolar-${todayStr()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
