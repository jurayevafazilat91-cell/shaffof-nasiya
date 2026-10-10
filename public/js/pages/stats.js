// Statistika sahifasi: umumiy ko‘rsatkichlar, tushum grafigi, oylik reja va modellar
import { api } from '../api.js';
import { $, esc, icon, num, monthName, gauge } from '../ui.js';
import { cashMarkup, wireCash } from './dashboard.js';

export default async function statsPage(el, _p, ctx, id) {
  const st = await api('GET', 'stats');
  if (!ctx.isCurrent(id)) return;
  const t = st.totals;
  const cur = st.chart[st.chart.length - 1];
  const curPct = cur.expected ? Math.min(100, Math.round((cur.collected / cur.expected) * 100)) : 0;
  const maxModel = Math.max(1, ...st.topModels.map((m) => m.count));
  const maxSold = Math.max(1, ...st.chart.map((m) => m.sold));

  const tiles = [
    ['Jami savdolar', t.sales, ''], ['Faol nasiyalar', t.active, ''], ['Yopilganlar', t.closed, ''], ['Mijozlar botda', t.customersLinked, ''],
    ['Jami yig‘ilgan', t.collected, 'so‘m'], ['Undirilishi kerak', t.outstanding, 'so‘m'], ['Kechikkan qarz', t.overdueAmount, 'so‘m'], ['Kutilayotgan foyda', t.expectedProfit, 'so‘m'],
  ];

  el.innerHTML = `
  <div class="page dash">
    <header class="db-head"><div><h1>Statistika</h1><p>Do‘koningizning nasiya savdolari bo‘yicha to‘liq ko‘rsatkichlar</p></div></header>

    <section class="st-tiles">
      ${tiles.map(([l, v, u]) => `<article class="st-tile spot"><small>${l}</small><b class="${l === 'Kechikkan qarz' && v ? 'red' : ''}" data-count="${v}">${num(v)}</b>${u ? `<span>${u}</span>` : ''}</article>`).join('')}
    </section>

    <section class="db-row2 st-row">
      <article class="db-box spot" id="cash">${cashMarkup()}</article>
      <article class="db-box">
        <div class="db-bh"><h2>Oylik reja</h2></div>
        ${gauge(curPct, `${monthName(cur.month)}: rejadan yig‘ildi`)}
        <p class="cash-note center">Kutilgan ${num(cur.expected)} so‘mdan ${num(cur.collected)} so‘m yig‘ildi</p>
      </article>
    </section>

    <section class="db-row2 st-row2">
      <article class="db-box">
        <div class="db-bh"><h2>Eng ko‘p sotilgan modellar</h2></div>
        ${st.topModels.length ? `<div class="hbars">${st.topModels.map((m, i) => `<div class="hbar" style="--w:${(m.count / maxModel) * 100}%;--i:${i}"><span>${esc(m.name)}</span><i></i><em>${m.count} ta</em></div>`).join('')}</div>` : `<div class="empty sm">${icon('phone')}<p>Hali savdo yo‘q.</p></div>`}
      </article>
      <article class="db-box">
        <div class="db-bh"><h2>Oyma-oy sotuvlar soni</h2></div>
        <div class="hbars">${st.chart.map((m, i) => `<div class="hbar ${i === st.chart.length - 1 ? 'hot' : ''}" style="--w:${(m.sold / maxSold) * 100}%;--i:${i}"><span>${monthName(m.month)}</span><i></i><em>${m.sold} ta</em></div>`).join('')}</div>
      </article>
    </section>
  </div>`;

  wireCash($('#cash', el), st);
}
