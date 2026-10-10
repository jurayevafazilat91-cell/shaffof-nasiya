// Savdo tafsilotlari: jadval, to‘lov qabul qilish, mijoz havolasi va QR
import { api } from '../api.js';
import { $, esc, icon, num, som, fdate, fphone, ribbon, badge, imeiLabel, modal, confirmBox, toast, moneyInput, toInt, copyText, qr, todayStr, ago } from '../ui.js';

const ST_TXT = { paid: 'To‘langan', today: 'Bugun', overdue: 'Kechikkan', upcoming: 'Kutilmoqda' };

export async function payModal(sale) {
  const next = sale.next?.amount || 0;
  const options = [
    ['Oylik to‘lov', next],
    sale.overdueAmount ? ['Kechikkan hammasi', sale.overdueAmount] : null,
    ['To‘liq yopish', sale.remaining],
  ].filter(Boolean).filter(([, v], i, arr) => v > 0 && arr.findIndex(([, x]) => x === v) === i);
  return modal({
    title: `To‘lov qabul qilish`,
    body: `
      <p class="muted">${esc(sale.customer.fullName)} — ${esc(sale.device.brand)} ${esc(sale.device.model)}<br>Qolgan qarz: <b>${som(sale.remaining)}</b></p>
      <div class="quick">${options.map(([t, v]) => `<button type="button" class="chip" data-v="${v}">${t}<b>${num(v)}</b></button>`).join('')}</div>
      <label class="fld"><span>Summa (so‘m)</span><input id="pay-amt" inputmode="numeric" class="mono big-in" value="${next}"></label>
      <label class="fld"><span>Izoh</span><input id="pay-note" placeholder="Masalan: naqd, Click, Payme"></label>
      <p class="form-err" id="pay-err"></p>`,
    onOpen: (w) => {
      const inp = $('#pay-amt', w);
      moneyInput(inp);
      w.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { inp.value = b.dataset.v; inp.dispatchEvent(new Event('input')); }));
    },
    actions: [
      { label: 'Bekor qilish', kind: 'ghost', value: null },
      { label: 'Qabul qilish', kind: 'primary', handler: async (w) => {
        try {
          const r = await api('POST', `sales/${sale.id}/pay`, { amount: toInt($('#pay-amt', w).value), note: $('#pay-note', w).value });
          toast(r.status === 'closed' ? 'Nasiya to‘liq yopildi!' : `To‘lov qabul qilindi. Qoldi: ${num(r.remaining)} so‘m`);
          return r;
        } catch (e) { $('#pay-err', w).textContent = e.message; return false; }
      } },
    ],
  });
}

export default async function saleDetail(el, id, ctx, rid) {
  const s = await api('GET', `sales/${id}`);
  if (!ctx.isCurrent(rid)) return;
  const t = todayStr();
  const status = s.next && s.next.dueDate === t && s.status === 'active' ? 'today' : s.status;
  const publicUrl = `${location.origin}/#/m/${s.customerToken}`;

  el.innerHTML = `
  <div class="page">
    <a class="back" href="#/savdolar">← Savdolar</a>
    <header class="ph sale-h">
      <div>
        <p class="ph-date">${s.code} · ${fdate(s.startDate)} sotilgan</p>
        <h1>${esc(s.customer.fullName)} ${badge(status)}</h1>
        <p class="contact"><a href="tel:${esc(s.customer.phone)}">${icon('phone')}${fphone(s.customer.phone)}</a>${s.customer.phone2 ? `<a href="tel:${esc(s.customer.phone2)}">${fphone(s.customer.phone2)}</a>` : ''}</p>
      </div>
      <div class="ph-act">
        ${s.status !== 'closed' ? `<button class="btn primary" id="pay" type="button">${icon('cash')}<span>To‘lov qabul qilish</span></button>` : ''}
      </div>
    </header>

    <section class="card progress-card">
      <div class="pc-top">
        <div><small>To‘langan</small><b>${num(s.paidTotal)}</b></div>
        <div><small>Qoldi</small><b class="${s.overdueAmount ? 'red' : ''}">${num(s.remaining)}</b></div>
        <div><small>Keyingi to‘lov</small><b>${s.next ? num(s.next.amount) : '—'}</b><span>${s.next ? fdate(s.next.dueDate) : 'yopilgan'}</span></div>
        ${s.overdueAmount ? `<div class="late"><small>Kechikkan</small><b>${num(s.overdueAmount)}</b><span>${s.lateDays} kun</span></div>` : ''}
      </div>
      ${ribbon(s.ribbon, true)}
      <p class="muted small">${s.paidMonths} / ${s.months} oy to‘langan · ${s.progress}%</p>
    </section>

    <div class="grid-2">
      <section class="card">
        <div class="card-h"><h2>Telefon</h2></div>
        <div class="dev-line">${icon('phone')}<div><b>${esc(s.device.brand)} ${esc(s.device.model)}</b><span>${[s.device.memory, s.device.color, s.device.condition === 'b/u' ? 'ishlatilgan' : 'yangi'].filter(Boolean).map(esc).join(' · ')}</span></div></div>
        ${imeiLabel(s.device.imei, 'IMEI 1')}
        ${s.device.imei2 ? imeiLabel(s.device.imei2, 'IMEI 2') : ''}
      </section>
      <section class="card">
        <div class="card-h"><h2>Moliya</h2></div>
        <dl class="kv">
          <div><dt>Naqd narx</dt><dd>${som(s.cashPrice)}</dd></div>
          <div><dt>Nasiyada umumiy</dt><dd><b>${som(s.totalPrice)}</b></dd></div>
          <div><dt>Ustama</dt><dd class="accent-t">+${som(s.overpayment)} · ${s.markupPercent}%</dd></div>
          <div><dt>Boshlang‘ich to‘lov</dt><dd>${som(s.downPayment)}</dd></div>
          <div><dt>Oylik to‘lov</dt><dd>${som(s.monthlyPayment)}</dd></div>
          <div><dt>Muddat</dt><dd>${s.months} oy</dd></div>
        </dl>
      </section>
    </div>

    <section class="card">
      <div class="card-h"><h2>To‘lov jadvali</h2></div>
      <div class="sched">
        ${s.schedule.map((it) => `<div class="sr st-${it.status}">
          <span class="sn">${it.n}</span>
          <span class="sd">${fdate(it.dueDate)}</span>
          <span class="sa mono">${num(it.amount)}</span>
          <span class="sp">${it.paid > 0 && it.paid < it.amount ? `${num(it.paid)} to‘landi` : it.paidAt ? fdate(it.paidAt.slice(0, 10)) : ''}</span>
          <span class="ss">${ST_TXT[it.status]}</span>
        </div>`).join('')}
      </div>
    </section>

    <div class="grid-2">
      <section class="card tg-card">
        <div class="card-h"><h2>Mijoz uchun havola</h2>${s.customerLinked ? `<span class="badge b-active">${icon('tg')} Botga ulangan</span>` : '<span class="badge">Ulanmagan</span>'}</div>
        <p class="muted small">Mijoz QR-kodni skanerlasa, Telegram bot unga to‘lov kunlarini eslatadi.</p>
        <div class="qr-row">
          <div id="qr" class="qr"></div>
          <div class="qr-act">
            ${s.customerBotLink ? `<button class="btn soft sm" data-copy="${esc(s.customerBotLink)}" type="button">${icon('copy')}Bot havolasi</button>` : '<p class="warn small">Bot sozlanmagan (TELEGRAM_BOT_USERNAME).</p>'}
            <button class="btn soft sm" data-copy="${esc(publicUrl)}" type="button">${icon('link')}Haqiqiy narx sahifasi</button>
            <a class="btn ghost sm" href="#/m/${s.customerToken}" target="_blank" rel="noopener">Sahifani ochish</a>
          </div>
        </div>
        <p class="small ${s.customerConfirmedAt ? 'ok-t' : 'muted'}">${s.customerConfirmedAt ? `${icon('shield')} Mijoz shartlarni tushunib tasdiqladi (${ago(s.customerConfirmedAt)})` : 'Mijoz hali “haqiqiy narx” testini topshirmagan.'}</p>
      </section>
      <section class="card">
        <div class="card-h"><h2>Mijoz ma’lumotlari</h2><button class="icon-btn" id="edit" aria-label="Tahrirlash" type="button">${icon('edit')}</button></div>
        <dl class="kv">
          <div><dt>Pasport</dt><dd class="mono">${esc(s.customer.passport) || '—'}</dd></div>
          <div><dt>Manzil</dt><dd>${esc(s.customer.address) || '—'}</dd></div>
          <div><dt>Izoh</dt><dd>${esc(s.note) || '—'}</dd></div>
        </dl>
      </section>
    </div>

    <section class="card">
      <div class="card-h"><h2>To‘lovlar tarixi</h2>${s.payments.length ? `<button class="btn ghost sm" id="undo" type="button">${icon('undo')}Oxirgisini bekor qilish</button>` : ''}</div>
      ${s.payments.length ? `<ul class="pays">${[...s.payments].reverse().map((p) => `<li><b class="mono">+${num(p.amount)}</b><span>${fdate(p.date)}${p.note ? ' · ' + esc(p.note) : ''}</span></li>`).join('')}</ul>` : `<p class="muted small">Boshlang‘ich to‘lov: ${som(s.downPayment)}. Oylik to‘lovlar hali qabul qilinmagan.</p>`}
    </section>

    <div class="danger-zone"><button class="btn danger-soft" id="del" type="button">${icon('trash')}Savdoni o‘chirish</button></div>
  </div>`;

  if (s.customerBotLink || publicUrl) qr($('#qr', el), s.customerBotLink || publicUrl, 148);
  el.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.copy)));
  $('#pay', el)?.addEventListener('click', async () => { if (await payModal(s)) ctx.go(`#/savdo/${id}`); });
  $('#undo', el)?.addEventListener('click', async () => {
    if (!await confirmBox('To‘lovni bekor qilish', 'Oxirgi qabul qilingan to‘lov o‘chiriladi. Davom etasizmi?', 'Bekor qilish')) return;
    try { await api('POST', `sales/${id}/undo`); toast('To‘lov bekor qilindi'); ctx.go(`#/savdo/${id}`); } catch (e) { toast(e.message, 'err'); }
  });
  $('#del', el).addEventListener('click', async () => {
    if (!await confirmBox('Savdoni o‘chirish', `${s.customer.fullName} — ${s.device.model} nasiyasi butunlay o‘chiriladi. Buni qaytarib bo‘lmaydi.`, 'O‘chirish')) return;
    try { await api('DELETE', `sales/${id}`); toast('O‘chirildi'); ctx.go('#/savdolar'); } catch (e) { toast(e.message, 'err'); }
  });
  $('#edit', el).addEventListener('click', async () => {
    const r = await modal({
      title: 'Mijoz ma’lumotlari',
      body: `<label class="fld"><span>F.I.Sh.</span><input id="e-name" value="${esc(s.customer.fullName)}"></label>
        <label class="fld"><span>Telefon</span><input id="e-phone" value="${esc(s.customer.phone)}"></label>
        <label class="fld"><span>Qo‘shimcha telefon</span><input id="e-phone2" value="${esc(s.customer.phone2 || '')}"></label>
        <label class="fld"><span>Pasport</span><input id="e-pass" value="${esc(s.customer.passport)}"></label>
        <label class="fld"><span>Manzil</span><input id="e-addr" value="${esc(s.customer.address)}"></label>
        <label class="fld"><span>Izoh</span><textarea id="e-note" rows="2">${esc(s.note)}</textarea></label>
        <p class="muted small">Narx va muddatni o‘zgartirib bo‘lmaydi: kerak bo‘lsa savdoni o‘chirib, qayta kiriting.</p>
        <p class="form-err" id="e-err"></p>`,
      actions: [{ label: 'Bekor qilish', kind: 'ghost' }, { label: 'Saqlash', kind: 'primary', handler: async (w) => {
        try {
          return await api('PATCH', `sales/${id}`, { customer: { fullName: $('#e-name', w).value, phone: $('#e-phone', w).value, phone2: $('#e-phone2', w).value, passport: $('#e-pass', w).value, address: $('#e-addr', w).value }, note: $('#e-note', w).value });
        } catch (e) { $('#e-err', w).textContent = e.message; return false; }
      } }],
    });
    if (r) { toast('Saqlandi'); ctx.go(`#/savdo/${id}`); }
  });
}
