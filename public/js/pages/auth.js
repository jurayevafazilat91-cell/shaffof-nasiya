// Kirish va ro‘yxatdan o‘tish
import { api, auth } from '../api.js';
import { $, esc, icon } from '../ui.js';
import { logoMark } from '../app.js';

export default function authPage(el, mode, ctx) {
  const reg = mode === 'register';
  el.innerHTML = `
  <div class="auth-wrap">
    <div class="auth-side" aria-hidden="true"><div class="hero-grid"></div><div class="beam small"><i></i></div>
      <a class="logo light" href="#/">${logoMark()}<span>Shaffof<b>Nasiya</b></span></a>
      <p class="auth-pitch">Har bir nasiya — mijoz, IMEI, muddat va to‘lov jadvali bilan. Ertalab bot kim to‘lashi kerakligini o‘zi aytadi.</p>
      <div class="auth-stats"><div><b>15</b><span>xonali IMEI tekshiruvi</span></div><div><b>09:00</b><span>kunlik Telegram hisobot</span></div></div>
    </div>
    <div class="auth-main">
      <a class="logo mobile-only" href="#/">${logoMark()}<span>Shaffof<b>Nasiya</b></span></a>
      <h1 class="reveal">${reg ? 'Do‘koningizni ro‘yxatdan o‘tkazing' : 'Xush kelibsiz'}</h1>
      <p class="muted">${reg ? 'Bepul. Karta talab qilinmaydi.' : 'Telefon raqamingiz va parolingiz bilan kiring.'}</p>
      <form id="f" novalidate>
        ${reg ? `
        <label class="fld"><span>Ismingiz</span><input name="name" autocomplete="name" placeholder="Ali Karimov" required></label>
        <label class="fld"><span>Do‘kon nomi</span><input name="shopName" placeholder="Malika, A-12 do‘kon" required></label>` : ''}
        <label class="fld"><span>Telefon raqam</span>
          <div class="pre"><em>+998</em><input name="phone" inputmode="tel" autocomplete="tel" placeholder="90 123 45 67" required></div>
        </label>
        <label class="fld"><span>Parol</span><input name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'Kamida 6 ta belgi' : '••••••'}" required></label>
        <p class="form-err" id="err" role="alert"></p>
        <button class="btn primary lg block" type="submit">${reg ? 'Hisob yaratish' : 'Kirish'}</button>
      </form>
      <p class="switch-auth">${reg ? 'Hisobingiz bormi? <a href="#/kirish">Kirish</a>' : 'Hisobingiz yo‘qmi? <a href="#/royxat">Ro‘yxatdan o‘tish</a>'}</p>
    </div>
  </div>`;

  const f = $('#f', el);
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = f.querySelector('button[type=submit]');
    const data = Object.fromEntries(new FormData(f));
    $('#err', el).textContent = '';
    btn.disabled = true;
    try {
      const r = await api('POST', reg ? 'auth/register' : 'auth/login', data);
      auth.set(r.token);
      auth.saveSeller(r.seller);
      ctx.go('#/panel');
    } catch (ex) {
      $('#err', el).innerHTML = `${icon('alert')} ${esc(ex.message)}`;
    } finally { btn.disabled = false; }
  });
}
