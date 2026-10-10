// Yangi nasiya: mijoz, telefon, IMEI, shartlar va jonli hisob-kitob
import { api } from '../api.js';
import { $, esc, icon, num, som, digits, toInt, imeiValid, fimei, plan, moneyInput, todayStr, toast, confirmBox, fdate } from '../ui.js';

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Poco', 'Honor', 'Huawei', 'Vivo', 'Oppo', 'Realme', 'Tecno', 'Infinix', 'Google', 'OnePlus', 'Nokia'];
const MEMS = ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];
const TERMS = [3, 6, 9, 12, 18, 24];

export default function newSale(el, _p, ctx) {
  el.innerHTML = `
  <div class="page">
    <header class="ph"><div><h1>Yangi nasiya</h1><p class="muted">Barcha maydonlarni to‘ldiring. Jadval avtomatik tuziladi.</p></div></header>
    <form id="sf" class="ns" novalidate>
      <div class="ns-main">
        <section class="card form-card">
          <h2><span class="step">1</span>Mijoz</h2>
          <div class="fgrid">
            <label class="fld span2"><span>F.I.Sh. *</span><input name="fullName" placeholder="Valiyev Jasur Akmalovich" required></label>
            <label class="fld"><span>Telefon raqam *</span><div class="pre"><em>+998</em><input name="phone" inputmode="tel" placeholder="93 555 44 33" required></div></label>
            <label class="fld"><span>Qo‘shimcha raqam</span><div class="pre"><em>+998</em><input name="phone2" inputmode="tel" placeholder="Qarindoshi yoki ish joyi"></div></label>
            <label class="fld"><span>Pasport seriya va raqami</span><input name="passport" placeholder="AD 1234567" style="text-transform:uppercase"></label>
            <label class="fld"><span>Manzil</span><input name="address" placeholder="Toshkent, Chilonzor tumani"></label>
          </div>
        </section>

        <section class="card form-card">
          <h2><span class="step">2</span>Telefon</h2>
          <div class="fgrid">
            <label class="fld"><span>Brend *</span><input name="brand" list="brands" placeholder="Apple" required><datalist id="brands">${BRANDS.map((b) => `<option value="${b}">`).join('')}</datalist></label>
            <label class="fld"><span>Model *</span><input name="model" placeholder="iPhone 15 Pro" required></label>
            <label class="fld"><span>Xotira</span><select name="memory"><option value="">Tanlang</option>${MEMS.map((m) => `<option>${m}</option>`).join('')}</select></label>
            <label class="fld"><span>Rang</span><input name="color" placeholder="Qora"></label>
            <div class="fld span2"><span>Holati</span>
              <div class="seg" role="radiogroup"><label><input type="radio" name="condition" value="yangi" checked><span>Yangi</span></label><label><input type="radio" name="condition" value="b/u"><span>Ishlatilgan (b/u)</span></label></div>
            </div>
            <label class="fld span2"><span>IMEI * <small class="muted">— telefonda *#06# tering</small></span>
              <div class="imei-in"><input name="imei" inputmode="numeric" maxlength="17" placeholder="15 xonali raqam" class="mono" required><em id="imei-st" class="imei-st"></em></div>
            </label>
            <label class="fld span2"><span>IMEI 2 <small class="muted">(ikki SIM-kartali telefon)</small></span>
              <div class="imei-in"><input name="imei2" inputmode="numeric" maxlength="17" placeholder="Ixtiyoriy" class="mono"><em id="imei2-st" class="imei-st"></em></div>
            </label>
          </div>
        </section>

        <section class="card form-card">
          <h2><span class="step">3</span>Nasiya shartlari</h2>
          <div class="fgrid">
            <label class="fld"><span>Naqd narx (so‘m) *</span><input name="cashPrice" inputmode="numeric" placeholder="3 000 000" class="mono" required></label>
            <div class="fld"><span>Narx usuli</span>
              <div class="seg"><label><input type="radio" name="mode" value="percent" checked><span>Ustama %</span></label><label><input type="radio" name="mode" value="total"><span>Umumiy narx</span></label></div>
            </div>
            <label class="fld" id="w-pct"><span>Ustama foizi (%)</span><input name="markupPercent" inputmode="decimal" value="28" class="mono"></label>
            <label class="fld" id="w-tot" hidden><span>Nasiyadagi umumiy narx (so‘m)</span><input name="totalPrice" inputmode="numeric" class="mono" placeholder="3 840 000"></label>
            <label class="fld"><span>Boshlang‘ich to‘lov (so‘m)</span><input name="downPayment" inputmode="numeric" placeholder="0" class="mono"></label>
            <div class="fld span2"><span>Muddat (oy) *</span>
              <div class="terms">${TERMS.map((m) => `<button type="button" class="chip ${m === 12 ? 'on' : ''}" data-m="${m}">${m}</button>`).join('')}<input name="months" inputmode="numeric" value="12" class="mono term-in" aria-label="Muddat, oy"></div>
            </div>
            <label class="fld"><span>Savdo sanasi</span><input name="startDate" type="date" value="${todayStr()}"></label>
            <label class="fld span2"><span>Izoh</span><textarea name="note" rows="2" placeholder="Masalan: kafil — akasi, +998 90 ..."></textarea></label>
          </div>
        </section>
      </div>

      <aside class="ns-side">
        <div class="card sum-card" id="sum"></div>
        <p class="form-err" id="err" role="alert"></p>
        <button class="btn primary lg block" type="submit" id="save">${icon('check')}<span>Nasiyani saqlash</span></button>
      </aside>
    </form>
  </div>`;

  const f = $('#sf', el);
  const g = (n) => f.elements.namedItem(n);
  ['cashPrice', 'totalPrice', 'downPayment'].forEach((n) => moneyInput(g(n), update));
  ['markupPercent', 'months', 'startDate'].forEach((n) => g(n).addEventListener('input', update));
  f.querySelectorAll('input[name=mode]').forEach((r) => r.addEventListener('change', () => {
    const tot = f.querySelector('input[name=mode]:checked').value === 'total';
    $('#w-pct', el).hidden = tot; $('#w-tot', el).hidden = !tot; update();
  }));
  f.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { g('months').value = b.dataset.m; update(); }));

  const imeiCheck = (name, stId) => {
    const inp = g(name), st = $('#' + stId, el);
    const run = () => {
      const d = digits(inp.value).slice(0, 15);
      inp.value = fimei(d);
      if (!d) { st.textContent = ''; st.className = 'imei-st'; return; }
      if (d.length < 15) { st.textContent = `${d.length}/15`; st.className = 'imei-st'; return; }
      const ok = imeiValid(d);
      st.innerHTML = ok ? `${icon('check')} To‘g‘ri` : `${icon('alert')} Xato raqam`;
      st.className = `imei-st ${ok ? 'ok' : 'bad'}`;
    };
    inp.addEventListener('input', run);
  };
  imeiCheck('imei', 'imei-st');
  imeiCheck('imei2', 'imei2-st');

  function values() {
    const total = f.querySelector('input[name=mode]:checked').value === 'total';
    return {
      cashPrice: toInt(g('cashPrice').value),
      markupPercent: total ? undefined : Number(String(g('markupPercent').value).replace(',', '.')) || 0,
      totalPrice: total ? toInt(g('totalPrice').value) : undefined,
      downPayment: toInt(g('downPayment').value),
      months: Math.max(0, Math.min(36, toInt(g('months').value))),
    };
  }

  function update() {
    const v = values();
    f.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', +b.dataset.m === v.months));
    const box = $('#sum', el);
    if (!v.cashPrice || !v.months) {
      box.innerHTML = `<p class="sum-t">Haqiqiy narx</p><p class="muted small">Naqd narx va muddatni kiriting — hisob shu yerda chiqadi.</p>`;
      return;
    }
    const p = plan(v);
    const cashPct = p.total ? Math.round((v.cashPrice / p.total) * 100) : 100;
    const start = g('startDate').value || todayStr();
    box.innerHTML = `
      <p class="sum-t">Haqiqiy narx</p>
      <div class="sum-big"><small>Mijoz jami to‘laydi</small><b>${num(p.total)}</b><span>so‘m</span></div>
      <div class="truth-bar"><i style="width:${cashPct}%"></i><i class="over" style="width:${100 - cashPct}%"></i></div>
      <dl class="sum-dl">
        <div><dt>Naqd narx</dt><dd>${som(v.cashPrice)}</dd></div>
        <div class="over"><dt>Ortiqcha to‘lov (ustama)</dt><dd>+${som(p.overpayment)} · ${p.percent}%</dd></div>
        <div><dt>Boshlang‘ich to‘lov</dt><dd>${som(v.downPayment)}</dd></div>
        <div><dt>Nasiyaga qoladi</dt><dd>${som(p.remaining)}</dd></div>
        <div class="hl"><dt>Oylik to‘lov</dt><dd>${som(p.monthly)}${p.last !== p.monthly ? `<small>oxirgi oy: ${num(p.last)}</small>` : ''}</dd></div>
        <div><dt>Muddat</dt><dd>${v.months} oy</dd></div>
      </dl>
      <p class="muted small">Birinchi to‘lov: <b>${fdate(addMonth(start, 1))}</b> · oxirgisi: <b>${fdate(addMonth(start, v.months))}</b></p>
      ${p.remaining <= 0 ? '<p class="warn">Boshlang‘ich to‘lov umumiy narxdan katta.</p>' : ''}`;
  }
  update();

  async function submit(force = false) {
    const v = values();
    const body = {
      customer: { fullName: g('fullName').value, phone: g('phone').value, phone2: g('phone2').value, passport: g('passport').value, address: g('address').value },
      device: { brand: g('brand').value, model: g('model').value, memory: g('memory').value, color: g('color').value, condition: f.querySelector('input[name=condition]:checked').value, imei: digits(g('imei').value), imei2: digits(g('imei2').value) },
      ...v, startDate: g('startDate').value, note: g('note').value, force,
    };
    const btn = $('#save', el);
    $('#err', el).textContent = '';
    btn.disabled = true;
    try {
      const sale = await api('POST', 'sales', body);
      toast(`Saqlandi: ${sale.code}`);
      ctx.go(`#/savdo/${sale.id}`);
    } catch (e) {
      if (e.status === 409 && await confirmBox('Takroriy IMEI', e.message, 'Baribir saqlash', 'primary')) return submit(true);
      $('#err', el).innerHTML = `${icon('alert')} ${esc(e.message)}`;
    } finally { btn.disabled = false; }
  }
  f.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
}

function addMonth(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, last));
  return t.toISOString().slice(0, 10);
}
