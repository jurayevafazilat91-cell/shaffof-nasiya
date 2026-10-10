// Mijoz sahifasi: haqiqiy narx, jadval va "tushunib imzolash" testi
import { api } from '../api.js';
import { $, esc, icon, num, som, fdate, ribbon } from '../ui.js';
import { logoMark } from '../app.js';

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

export default async function publicPage(el, token) {
  el.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
  let d;
  try { d = await api('GET', `public/${encodeURIComponent(token || '')}`); }
  catch (e) { el.innerHTML = `<div class="pub"><div class="empty">${icon('alert')}<h3>Sahifa topilmadi</h3><p>${esc(e.message)}</p></div></div>`; return; }

  const cashPct = Math.round((d.cashPrice / d.totalPrice) * 100);
  const questions = [
    { key: 'total', q: 'Telefon uchun jami qancha to‘laysiz?', a: d.totalPrice, opts: [d.totalPrice, d.cashPrice, d.monthlyPayment] },
    { key: 'overpayment', q: 'Naqd narxdan qancha ortiqcha to‘laysiz?', a: d.overpayment, opts: [d.overpayment, 0, d.monthlyPayment] },
    { key: 'months', q: 'Necha oy to‘laysiz?', a: d.months, opts: [d.months, Math.max(1, d.months - 3), d.months + 6], unit: 'oy' },
  ].map((x) => ({ ...x, opts: shuffle([...new Set(x.opts)]) }));

  el.innerHTML = `
  <div class="pub">
    <header class="pub-h"><a class="logo" href="#/">${logoMark()}<span>Shaffof<b>Nasiya</b></span></a><span class="muted small">${esc(d.shopName)}</span></header>
    <h1>Salom, ${esc(d.customerName)}!</h1>
    <p class="muted">${esc(d.device.brand)} ${esc(d.device.model)}${d.device.memory ? ' · ' + esc(d.device.memory) : ''} · IMEI …${esc(d.device.imeiTail)}</p>

    <section class="truth big">
      <p class="truth-t">Haqiqiy narx</p>
      <div class="truth-row"><span>Naqd narx</span><b>${som(d.cashPrice)}</b></div>
      <div class="truth-row"><span>Nasiyada jami</span><b>${som(d.totalPrice)}</b></div>
      <div class="truth-bar"><i style="width:${cashPct}%"></i><i class="over" style="width:${100 - cashPct}%"></i></div>
      <div class="truth-row over"><span>Ortiqcha to‘lov</span><b>+${som(d.overpayment)} · ${d.markupPercent}%</b></div>
      <div class="truth-row"><span>Oylik to‘lov</span><b>${som(d.monthlyPayment)} × ${d.months} oy</b></div>
    </section>

    <section class="card">
      <div class="card-h"><h2>To‘lov jadvali</h2><span class="muted small">Qoldi: <b>${som(d.remaining)}</b></span></div>
      ${ribbon(d.schedule.map((s) => s.status), true)}
      <div class="sched">${d.schedule.map((it) => `<div class="sr st-${it.status}"><span class="sn">${it.n}</span><span class="sd">${fdate(it.dueDate)}</span><span class="sa mono">${num(it.amount)}</span><span class="ss">${{ paid: 'To‘langan', today: 'Bugun', overdue: 'Kechikkan', upcoming: 'Kutilmoqda' }[it.status]}</span></div>`).join('')}</div>
    </section>

    ${d.botLink ? `<a class="btn tg lg block" href="${esc(d.botLink)}" target="_blank" rel="noopener">${icon('tg')}<span>Telegram’da eslatmalarni yoqish</span></a>` : ''}

    <section class="card quiz" id="quiz">
      ${d.confirmedAt ? doneHtml() : `
        <div class="card-h"><h2>Tushunib imzolash</h2><span class="muted small">3 ta savol</span></div>
        <p class="muted small">Shartlarni to‘g‘ri tushunganingizni tekshiring. Bu sizni ham, sotuvchini ham kelishmovchilikdan himoya qiladi.</p>
        ${questions.map((x, i) => `<fieldset class="qz"><legend>${i + 1}. ${x.q}</legend>${x.opts.map((o) => `<label><input type="radio" name="${x.key}" value="${o}"><span>${x.unit ? `${o} ${x.unit}` : som(o)}</span></label>`).join('')}</fieldset>`).join('')}
        <p class="form-err" id="qerr"></p>
        <button class="btn primary lg block" id="qok" type="button">Tasdiqlash</button>`}
    </section>
    <p class="pub-foot muted small">Savollar bo‘yicha: ${esc(d.shopName)}, ${esc(d.sellerPhone)}</p>
  </div>`;

  $('#qok', el)?.addEventListener('click', async () => {
    const pick = (n) => Number(el.querySelector(`input[name=${n}]:checked`)?.value);
    const body = { total: pick('total'), overpayment: pick('overpayment'), months: pick('months') };
    if (Object.values(body).some((v) => !Number.isFinite(v))) { $('#qerr', el).textContent = 'Barcha savollarga javob bering.'; return; }
    try { await api('POST', `public/${encodeURIComponent(token)}/confirm`, body); $('#quiz', el).innerHTML = doneHtml(); }
    catch (e) { $('#qerr', el).textContent = e.message; }
  });
}

const doneHtml = () => `<div class="done">${icon('shield')}<div><b>Tasdiqlandi</b><p>Siz nasiya shartlarini tushunib qabul qildingiz.</p></div></div>`;
