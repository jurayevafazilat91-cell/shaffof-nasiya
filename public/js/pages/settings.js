// Sozlamalar: profil, parol, Telegram bot ulash
import { api, auth } from '../api.js';
import { $, esc, icon, toast, qr, copyText, fphone } from '../ui.js';

export default async function settingsPage(el, _p, ctx, id) {
  const me = await api('GET', 'me');
  if (!ctx.isCurrent(id)) return;
  auth.saveSeller(me);
  el.innerHTML = `
  <div class="page narrow">
    <header class="ph"><div><h1>Sozlamalar</h1><p class="muted">${esc(me.shopName)} · ${fphone(me.phone)}</p></div></header>

    <section class="card tg-connect ${me.telegramConnected ? 'on' : ''}">
      <div class="card-h"><h2>${icon('tg')} Telegram bot</h2>${me.telegramConnected ? '<span class="badge b-active">Ulangan</span>' : '<span class="badge b-today">Ulanmagan</span>'}</div>
      ${me.telegramLink ? `
        <div class="qr-row">
          <div id="qr" class="qr"></div>
          <div>
            <p>${me.telegramConnected ? 'Bot ulangan. Har kuni soat 09:00 da bugungi, kechikkan va yaqinlashayotgan to‘lovlar ro‘yxati keladi.' : 'QR-kodni telefon kamerasi bilan skanerlang yoki tugmani bosing, so‘ng botda <b>Start</b> ni bosing.'}</p>
            <p class="muted small">Botdagi buyruqlar: /bugun, /qarzdorlar, /statistika</p>
            <div class="row-btns">
              <a class="btn primary" href="${esc(me.telegramLink)}" target="_blank" rel="noopener">${icon('tg')}<span>${me.telegramConnected ? 'Botni ochish' : 'Telegramda ulash'}</span></a>
              ${me.telegramConnected ? `<button class="btn soft" id="test" type="button">Sinov xabari</button><button class="btn ghost" id="unlink" type="button">Uzish</button>` : `<button class="btn ghost" id="check" type="button">Tekshirish</button>`}
            </div>
          </div>
        </div>` : '<p class="warn">Bot hali sozlanmagan. Vercel’da TELEGRAM_BOT_TOKEN va TELEGRAM_BOT_USERNAME o‘zgaruvchilarini qo‘shing.</p>'}
    </section>

    <section class="card">
      <div class="card-h"><h2>Profil</h2></div>
      <form id="pf" class="fgrid">
        <label class="fld"><span>Ismingiz</span><input name="name" value="${esc(me.name)}"></label>
        <label class="fld"><span>Do‘kon nomi</span><input name="shopName" value="${esc(me.shopName)}"></label>
        <div class="span2"><button class="btn primary" type="submit">Saqlash</button></div>
      </form>
    </section>

    <section class="card">
      <div class="card-h"><h2>Parolni o‘zgartirish</h2></div>
      <form id="pw" class="fgrid">
        <label class="fld"><span>Joriy parol</span><input name="password" type="password" autocomplete="current-password"></label>
        <label class="fld"><span>Yangi parol</span><input name="newPassword" type="password" autocomplete="new-password" placeholder="Kamida 6 ta belgi"></label>
        <div class="span2"><button class="btn soft" type="submit">Parolni yangilash</button></div>
      </form>
    </section>

    <div class="danger-zone"><button class="btn danger-soft" id="out" type="button">${icon('out')}Hisobdan chiqish</button></div>
  </div>`;

  if (me.telegramLink) qr($('#qr', el), me.telegramLink, 150);
  $('#test', el)?.addEventListener('click', async () => { try { await api('POST', 'me/telegram-test'); toast('Xabar yuborildi — Telegram’ni tekshiring'); } catch (e) { toast(e.message, 'err'); } });
  $('#check', el)?.addEventListener('click', () => ctx.go('#/sozlamalar'));
  $('#unlink', el)?.addEventListener('click', async () => { await api('POST', 'me/telegram-unlink'); toast('Bot uzildi'); ctx.go('#/sozlamalar'); });
  $('#pf', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('PATCH', 'me', Object.fromEntries(new FormData(e.target))); auth.saveSeller(r); toast('Profil saqlandi'); ctx.go('#/sozlamalar'); location.reload(); }
    catch (ex) { toast(ex.message, 'err'); }
  });
  $('#pw', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('PATCH', 'me', Object.fromEntries(new FormData(e.target))); toast('Parol yangilandi'); e.target.reset(); }
    catch (ex) { toast(ex.message, 'err'); }
  });
  $('#out', el).addEventListener('click', () => { auth.clear(); location.hash = '#/kirish'; location.reload(); });
}
