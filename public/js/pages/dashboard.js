// Panel ("Umumiy holat"): 3 ta asosiy karta, bugungi to‘lovlar, tushum grafigi,
// kechikkanlar, yaqin to‘lovlar va oylik reja. Barcha ma’lumot /api/stats dan.
import { api } from '../api.js';
import { $, $$, esc, icon, num, som, fdate, monthName, gauge } from '../ui.js';
import { enhance, countTo } from '../animate.js';

const WEEK_LABELS = ['1–7', '8–14', '15–21', '22–28', '29–31'];
const initial = (name) => String(name || '?').trim().charAt(0).toUpperCase();
const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export default async function dashboard(el, _p, ctx, id) {
  const st = await api('GET', 'stats');
  if (!ctx.isCurrent(id)) return;
  const s = ctx.seller || {};
  const t = st.totals;
  const last = st.chart.length - 1;
  const cur = st.chart[last];
  const curPct = pctOf(cur.collected, cur.expected);

  el.innerHTML = `
  <div class="page dash">
    ${!s.telegramConnected ? `<a class="callout slim" href="#/sozlamalar">${icon('tg')}<div><b>Telegram botni ulang</b><span>Har kuni 09:00 da to‘lov kuni kelgan mijozlar ro‘yxati Telegram’ingizga keladi.</span></div><em>Ulash →</em></a>` : ''}

    <header class="db-head">
      <div>
        <h1>Umumiy holat</h1>
        <p>Bugungi nasiya savdolar xulosasi · ${fdate(st.today)}</p>
      </div>
      <label class="period" title="Oy tushumi kartasi uchun davr">
        <select id="period" aria-label="Davr">
          ${st.chart.map((m, i) => ({ m, i })).reverse().map(({ m, i }) => `<option value="${i}" ${i === last ? 'selected' : ''}>${i === last ? 'Shu oy' : monthName(m.month)}</option>`).join('')}
        </select>
        ${icon('down', 'caret')}
      </label>
    </header>

    <section class="db-cards">
      <article class="db-card hot spot">
        <div class="dc-h"><span class="dc-ic">${icon('cash')}</span><div><b>Undirilishi kerak</b><small>${t.active} ta faol nasiya</small></div></div>
        <p class="dc-num" data-count="${t.outstanding}">${num(t.outstanding)}</p>
        <a class="dc-foot" href="#/savdolar/active"><span>Batafsil</span><em>→</em></a>
        <span class="kpi-glow" aria-hidden="true"></span>
      </article>
      <article class="db-card spot">
        <div class="dc-h"><span class="dc-ic">${icon('chart')}</span><div><b id="m-title">${monthName(cur.month)} tushumi</b><small id="m-sub">${cur.expected ? `Rejadan ${curPct}%` : 'Bu oyga reja yo‘q'}</small></div></div>
        <p class="dc-num" id="m-num" data-count="${cur.collected}">${num(cur.collected)}</p>
        <a class="dc-foot" href="#/statistika"><span>Hisobot</span><em>→</em></a>
      </article>
      <article class="db-card spot">
        <div class="dc-h"><span class="dc-ic">${icon('alert')}</span><div><b>Kechikkan qarz</b><small>${t.overdueSales} ta mijoz</small></div></div>
        <p class="dc-num ${t.overdueAmount ? 'red' : ''}" data-count="${t.overdueAmount}">${num(t.overdueAmount)}</p>
        <a class="dc-foot" href="#/savdolar/overdue"><span>Qarzdorlar</span><em>→</em></a>
      </article>
    </section>

    <section class="db-row2">
      <article class="db-box">
        <div class="db-bh"><h2>Bugun to‘lov kuni</h2><span class="db-pill">${st.todayList.length} ta</span></div>
        ${list(st.todayList, 'today')}
      </article>
      <article class="db-box spot" id="cash">${cashMarkup()}</article>
    </section>

    <section class="db-row3">
      <article class="db-box">
        <div class="db-bh"><h2>Kechikkanlar</h2><span class="db-pill red">${st.overdueList.length} ta</span></div>
        ${list(st.overdueList, 'overdue')}
      </article>
      <article class="db-box">
        <div class="db-bh"><h2>Yaqin 7 kunda</h2><span class="db-pill dim">${st.soonList.length} ta</span></div>
        ${list(st.soonList, 'soon')}
      </article>
      <article class="db-box">
        <div class="db-bh"><h2>Oylik reja</h2><a class="db-link" href="#/statistika">Statistika →</a></div>
        ${cur.expected ? gauge(curPct > 100 ? 100 : curPct, 'shu oy rejadan yig‘ildi') : `<div class="empty sm">${icon('clock')}<p>Bu oyga reja yo‘q.</p></div>`}
        ${st.topModels.length ? `<ol class="db-models">${st.topModels.slice(0, 3).map((m, i) => `<li><span>${i + 1}</span><b>${esc(m.name)}</b><em>${m.count} ta</em></li>`).join('')}</ol>` : ''}
      </article>
    </section>
  </div>`;

  // Davr tanlash: "oy tushumi" kartasi va grafikdagi ajratilgan ustun
  const sel = $('#period', el);
  sel.addEventListener('change', () => {
    const i = Number(sel.value);
    const m = st.chart[i];
    $('#m-title', el).textContent = `${monthName(m.month)} tushumi`;
    $('#m-sub', el).textContent = m.expected ? `Rejadan ${pctOf(m.collected, m.expected)}%` : 'Bu oyga reja yo‘q';
    countTo($('#m-num', el), m.collected);
    cash.setHot(i);
  });

  const cash = wireCash($('#cash', el), st);
}

// ---------- Tushum grafigi (Oylik / 6 oy) — statistika sahifasida ham ishlatiladi ----------
export function cashMarkup() {
  return `
    <div class="db-bh cash-h">
      <div><small>Tushum</small><p class="cash-total" data-total></p></div>
      <div class="seg-mini" role="tablist" aria-label="Davr">
        <button type="button" role="tab" data-mode="month">Oylik</button>
        <button type="button" role="tab" data-mode="m6" class="on">6 oy</button>
      </div>
    </div>
    <div class="db-chart" data-chart></div>
    <p class="cash-note" data-note></p>`;
}

export function wireCash(box, st) {
  let mode = 'm6';
  let hot = st.chart.length - 1;
  const todayWeek = Math.min(4, Math.floor((Number(st.today.slice(8, 10)) - 1) / 7));

  const draw = () => {
    const isM6 = mode === 'm6';
    const values = isM6 ? st.chart.map((m) => m.collected) : st.weeks;
    const labels = isM6 ? st.chart.map((m) => monthName(m.month).slice(0, 3)) : WEEK_LABELS;
    const hi = isM6 ? hot : todayWeek;
    const max = Math.max(1, ...values);
    const total = values.reduce((a, v) => a + v, 0);
    countTo($('[data-total]', box), total);
    $('[data-note]', box).textContent = isM6 ? 'Oxirgi 6 oy: boshlang‘ich va oylik to‘lovlar' : `${monthName(st.today)}: haftalar bo‘yicha`;
    $('[data-chart]', box).innerHTML = `
      <div class="db-bars">${values.map((v, i) => `
        <div class="db-bar ${i === hi ? 'hot' : ''}" style="--h:${v ? Math.max(4, (v / max) * 100) : 2}%;--i:${i}" tabindex="0" aria-label="${labels[i]}: ${num(v)} so‘m">
          <em>${num(v)}</em>
        </div>`).join('')}</div>
      <div class="db-x">${labels.map((l, i) => `<span class="${i === hi ? 'on' : ''}">${l}</span>`).join('')}</div>`;
    $$('[data-mode]', box).forEach((b) => { b.classList.toggle('on', b.dataset.mode === mode); b.setAttribute('aria-selected', b.dataset.mode === mode); });
  };

  $$('[data-mode]', box).forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; draw(); }));
  draw();
  enhance(box);
  return { setHot(i) { hot = i; if (mode === 'm6') draw(); } };
}

// ---------- Ro‘yxatlar ----------
function list(items, kind) {
  if (!items.length) {
    const msg = { today: 'Bugun to‘lov kuni kelgan mijoz yo‘q.', overdue: 'Kechikkan to‘lov yo‘q. Ajoyib!', soon: 'Yaqin 7 kunda to‘lov yo‘q.' }[kind];
    return `<div class="empty sm">${icon(kind === 'overdue' ? 'shield' : 'clock')}<p>${msg}</p></div>`;
  }
  const shown = items.slice(0, 5);
  const more = items.length - shown.length;
  const href = { today: '#/savdolar/today', overdue: '#/savdolar/overdue', soon: '#/savdolar/active' }[kind];
  return `<div class="db-list">${shown.map((s, i) => `
    <a class="db-li" href="#/savdo/${s.id}" style="--i:${i}">
      <i class="av ${kind === 'overdue' ? 'red' : ''}">${esc(initial(s.customer.fullName))}</i>
      <span class="li-main"><b>${esc(s.customer.fullName)}</b><small>${esc(s.device.model)} · ${kind === 'soon' ? fdate(s.next.dueDate, false) : `${s.next ? s.next.n : s.months}-oy`}</small></span>
      <span class="li-amt">${kind === 'overdue'
        ? `<em class="red">${num(s.overdueAmount)}</em><small>${s.lateDays} kun</small>`
        : `<em>${num(s.next.amount)}</em>`}</span>
    </a>`).join('')}</div>
    ${more > 0 ? `<a class="db-more" href="${href}">Yana ${more} ta →</a>` : ''}`;
}
