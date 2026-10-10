// Bosh sahifa (landing) — qora fon, to‘q sariq nur, shisha kartalar va animatsiyalar
import { icon, ribbon, imeiLabel, gauge } from '../ui.js';
import { auth } from '../api.js';
import { logoMark } from '../app.js';

export default function landing(el) {
  const logged = Boolean(auth.token);
  const start = logged ? '#/panel' : '#/royxat';
  const startTxt = logged ? 'Panelga o‘tish' : 'Ro‘yxatdan o‘tish';

  el.innerHTML = `
  <div class="land">
    <header class="l-top">
      <a class="logo" href="#/">${logoMark()}<span>Shaffof<b>Nasiya</b></span></a>
      <nav class="l-nav" aria-label="Bo‘limlar">
        <a href="#top" data-scroll class="on">Bosh sahifa</a>
        <a href="#imkoniyatlar" data-scroll>Imkoniyatlar</a>
        <a href="#narxlar" data-scroll>Narxlar</a>
        <a href="#savollar" data-scroll>Savollar</a>
      </nav>
      <div class="l-cta">
        <a class="btn ghost tg-link" href="#imkoniyatlar" data-scroll>${icon('tg')}<span>Telegram bot</span></a>
        ${logged ? '' : '<a class="btn ghost" href="#/kirish">Kirish</a>'}
        <a class="btn primary glow" href="${start}">${startTxt}</a>
      </div>
    </header>

    <section class="hero" id="top">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-copy">
        <a class="eyebrow-pill reveal" href="#imkoniyatlar" data-scroll>Nasiya savdo — bitta platformada <span>→</span></a>
        <h1 class="reveal d1"><span class="dim">Nasiya daftarini</span><br>raqamga aylantiring</h1>
        <p class="lead reveal d2">Har bir mijoz, IMEI, muddat va oylik to‘lov bir joyda. To‘lov kuni kelganda Telegram bot o‘zi eslatadi, panel esa qancha pul qaytishini aniq ko‘rsatadi.</p>
        <div class="hero-act reveal d3">
          <a class="btn primary lg glow shine" href="${start}">${startTxt}</a>
          <a class="btn ghost lg" href="#qanday" data-scroll>Qanday ishlaydi?</a>
        </div>
      </div>

      <div class="preview reveal d4" aria-hidden="true">
        <div class="beam"><i></i><b class="flare"></b></div>
        <div class="pv-top"><span class="pv-dots"><i></i><i></i><i></i></span><span class="pv-url">Shaffof Nasiya <em>›</em> Panel</span><span class="pv-icons"><i></i><i></i><i></i></span><span class="pv-btn">+ Yangi nasiya</span></div>
        <div class="pv-body">
          <aside class="pv-side">
            <span class="pv-search">${icon('search')} Qidirish</span>
            <span class="on">${icon('home')} Panel</span><span>${icon('list')} Savdolar <em>8</em></span><span>${icon('bell')} Xabarlar <em class="hot">6</em></span><span>${icon('chart')} Statistika</span>
            <small>SOZLAMALAR</small>
            <span>${icon('tg')} Telegram bot</span><span>${icon('gear')} Sozlamalar</span>
          </aside>
          <div class="pv-main">
            <div class="pv-h"><div><b>Umumiy holat</b><small>Bugungi nasiya savdolar xulosasi</small></div><span class="pv-chip">Shu oy ▾</span></div>
            <div class="pv-cards">
              <div class="pv-card hot"><div class="pc-h">${icon('cash')}<div><b>Undirilishi kerak</b><small>8 ta faol nasiya</small></div></div><b class="pv-num" data-count="54249000">54 249 000</b><span class="pv-foot">Batafsil <em>→</em></span></div>
              <div class="pv-card"><div class="pc-h">${icon('chart')}<div><b>Oktabr tushumi</b><small>Rejadan 100%</small></div></div><b class="pv-num" data-count="13718000">13 718 000</b><span class="pv-foot">Hisobot <em>→</em></span></div>
              <div class="pv-card"><div class="pc-h">${icon('alert')}<div><b>Kechikkan qarz</b><small>1 ta mijoz</small></div></div><b class="pv-num red" data-count="637000">637 000</b><span class="pv-foot">Qarzdorlar <em>→</em></span></div>
            </div>
            <div class="pv-row2">
              <div class="pv-box">
                <div class="pv-bh"><b>Bugun to‘lov kuni</b><span class="pv-add">5 ta</span></div>
                <div class="pv-list">
                  <div><i class="av">J</i><span><b>Jasur Valiyev</b><small>iPhone 15 · 4-oy</small></span><em>402 000</em></div>
                  <div><i class="av">D</i><span><b>Dilnoza Karimova</b><small>Galaxy S24 · 5-oy</small></span><em>906 000</em></div>
                  <div><i class="av">S</i><span><b>Sardor Rahimov</b><small>iPhone 13 · 1-oy</small></span><em>693 000</em></div>
                </div>
              </div>
              <div class="pv-box">
                <div class="pv-bh"><div><small>Tushum</small><b class="pv-big" data-count="22918000">22 918 000</b></div><span class="seg-mini"><i>Oylik</i><i class="on">6 oy</i></span></div>
                <div class="pv-bars">${[30, 44, 36, 58, 48, 92].map((h, i) => `<i class="${i === 5 ? 'hot' : ''}" style="--h:${h}%;--i:${i}">${i === 5 ? '<em>13 718 000</em>' : ''}</i>`).join('')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="brands" aria-label="Qo‘llab-quvvatlanadigan brendlar">
      <p class="reveal">Har qanday telefon brendi bilan ishlaydi</p>
      <div class="brand-row reveal d1">${['Apple', 'Samsung', 'Xiaomi', 'Honor', 'Vivo', 'Tecno', 'Realme', 'Google'].map((b) => `<span>${icon('phone')}${b}</span>`).join('')}</div>
    </section>

    <section class="sec" id="imkoniyatlar">
      <span class="tag reveal">Imkoniyatlar</span>
      <h2 class="reveal d1">Sotuvchining kundalik ishini<br>avtomatlashtiramiz</h2>
      <p class="sec-sub reveal d2">Qog‘oz daftar, Excel va eslab qolishga urinishlar o‘rniga — bitta tartibli tizim.</p>
      <div class="f3">
        <article class="fcard spot reveal">
          <div class="fvis">
            <div class="mini-pill">${icon('phone')} iPhone 15 · 128 GB <em class="ok">✓ IMEI to‘g‘ri</em></div>
            ${imeiLabel('356938035643809')}
          </div>
          <h3>To‘liq nasiya kartochkasi</h3>
          <p>Mijoz, ikki telefon raqami, pasport, model, rang, xotira va 15 xonali IMEI — nazorat raqami bilan tekshiriladi.</p>
        </article>
        <article class="fcard spot reveal d1">
          <div class="fvis tgvis">
            <div class="bubble b1">${icon('tg')}<div><b>Bugun to‘lov kuni (5)</b><span>Jasur Valiyev — 402 000 so‘m</span></div></div>
            <div class="bubble b2">${icon('alert')}<div><b>Kechikkan (1)</b><span>Gulnora E. — 30 kun, 637 000</span></div></div>
          </div>
          <h3>Telegram eslatmalar</h3>
          <p>Har kuni 09:00 da sizga hisobot. Mijozga — to‘lovdan 3 kun oldin va to‘lov kuni avtomatik xabar.</p>
        </article>
        <article class="fcard spot reveal d2">
          <div class="fvis">${gauge(76, 'oylik reja')}</div>
          <h3>Jonli statistika</h3>
          <p>Undirilishi kerak bo‘lgan summa, kechikkan qarz, oylik tushum va eng ko‘p sotilgan modellar.</p>
        </article>
      </div>
    </section>

    <section class="sec split" id="qanday">
      <div class="split-copy">
        <span class="tag reveal">Qanday ishlaydi</span>
        <h2 class="reveal d1">Daftardan raqamga — 3 qadamda</h2>
        <ol class="steps3">
          <li class="reveal d1"><span>01</span><div><b>Ro‘yxatdan o‘ting</b><p>Ism, do‘kon nomi va telefon raqam — bir daqiqa.</p></div></li>
          <li class="reveal d2"><span>02</span><div><b>Botni ulang</b><p>Sozlamalardagi QR-kodni skanerlang — hisobotlar Telegram’ga keladi.</p></div></li>
          <li class="reveal d3"><span>03</span><div><b>Savdoni kiriting</b><p>Narx va muddatni yozasiz — oylik to‘lov va jadval o‘zi tuziladi.</p></div></li>
        </ol>
        <a class="btn primary glow" href="${start}">${startTxt}</a>
      </div>
      <div class="cash reveal d2 spot" aria-hidden="true">
        <div class="cash-h"><div><small>Tushum</small><b data-count="22918000">22 918 000</b></div><span class="seg-mini"><i>Oylik</i><i class="on">6 oy</i></span></div>
        <div class="bars">${[28, 40, 34, 52, 46, 88].map((h, i) => `<div class="bar ${i === 5 ? 'hot' : ''}" style="--h:${h}%;--i:${i}">${i === 5 ? '<em>13 718 000</em>' : ''}</div>`).join('')}</div>
        <div class="bars-x"><span>May</span><span>Iyun</span><span>Iyul</span><span>Avg</span><span>Sen</span><span>Okt</span></div>
      </div>
    </section>

    <section class="sec split rev" id="mijoz">
      <div class="truth reveal spot" aria-hidden="true">
        <p class="truth-t">Haqiqiy narx</p>
        <div class="truth-row"><span>Naqd narx</span><b>12 000 000</b></div>
        <div class="truth-row"><span>Nasiyada jami</span><b>15 360 000</b></div>
        <div class="truth-bar"><i style="width:78%"></i><i class="over" style="width:22%"></i></div>
        <div class="truth-row over"><span>Ortiqcha to‘lov</span><b>+3 360 000 · 28%</b></div>
        <div class="truth-q"><small>1/3</small><p>Jami qancha to‘laysiz?</p><span>12 000 000</span><span class="sel">15 360 000 ✓</span><span>1 280 000</span></div>
      </div>
      <div class="split-copy">
        <span class="tag reveal">Moliyaviy savodxonlik</span>
        <h2 class="reveal d1">Mijoz nimaga imzo chekayotganini tushunadi</h2>
        <p class="sec-sub left reveal d2">Har bir nasiya uchun mijozga shaxsiy sahifa ochiladi: “oyiga atigi…” emas, naqd narx, umumiy summa va ortiqcha to‘lov ochiq ko‘rsatiladi.</p>
        <p class="sec-sub left reveal d3">Mijoz 3 ta savolga javob beradi va “tushunib imzoladi” belgisi qo‘yiladi. Nizolar kamayadi, do‘konga ishonch oshadi.</p>
      </div>
    </section>

    <section class="sec" id="narxlar">
      <span class="tag reveal">Narxlar</span>
      <h2 class="reveal d1">Do‘koningizga mos tarif</h2>
      <p class="sec-sub reveal d2">Kichik do‘kondan boshlang, o‘sganingizda Pro’ga o‘ting.</p>
      <div class="plans">
        <article class="plan hot reveal spot">
          <h3>Boshlang‘ich</h3><p class="plan-d">Bitta sotuvchi va kichik do‘kon uchun.</p>
          <p class="pp"><b>99$</b> / oy</p>
          <a class="btn light block" href="${start}">Boshlash</a>
          <ul><li>${icon('check')} 30 tagacha faol nasiya</li><li>${icon('check')} Telegram hisobotlar</li><li>${icon('check')} Statistika va grafiklar</li><li>${icon('check')} Mijoz sahifasi va QR</li></ul>
        </article>
        <article class="plan reveal d1 spot">
          <h3>Pro</h3><p class="plan-d">Faol savdo qiladigan do‘konlar uchun.</p>
          <p class="pp"><b>199$</b> / oy</p>
          <a class="btn ghost-line block" href="${start}">Pro’ni sinash</a>
          <ul><li>${icon('check')} Cheksiz nasiya</li><li>${icon('check')} Mijozlarga avtomatik eslatma</li><li>${icon('check')} Excel eksport</li><li>${icon('check')} Bir nechta sotuvchi (tez orada)</li></ul>
        </article>
      </div>
    </section>

    <section class="sec faq" id="savollar">
      <h2 class="reveal">Ko‘p beriladigan savollar</h2>
      <div class="faq-list">
        ${[
          ['Ma’lumotlarim qayerda saqlanadi?', 'MongoDB bulut bazasida. Har bir sotuvchi faqat o‘z savdolarini ko‘radi, parollar shifrlangan holda saqlanadi.'],
          ['Mijozga eslatma qanday boradi?', 'Savdo kartochkasidagi QR-kodni mijoz skanerlab, botda Start bosadi. Shundan keyin to‘lovdan 3 kun oldin va to‘lov kuni xabar keladi.'],
          ['IMEI noto‘g‘ri yozilsa nima bo‘ladi?', 'Tizim 15 xonali raqamni nazorat raqami bo‘yicha tekshiradi va xato bo‘lsa saqlashga ruxsat bermaydi. Bir telefon ikki marta nasiyaga chiqsa, ogohlantiradi.'],
          ['Mijoz qisman to‘lasa-chi?', 'Istalgan summani kiritasiz — tizim uni eng eski oydan boshlab taqsimlaydi. Xato bo‘lsa, oxirgi to‘lovni bir tugma bilan bekor qilasiz.'],
        ].map(([q, a], i) => `<details class="reveal" ${i === 0 ? 'open' : ''}><summary><span>0${i + 1}</span>${q}<i>${icon('plus')}</i></summary><p>${a}</p></details>`).join('')}
      </div>
    </section>

    <footer class="l-foot">
      <div class="foot-cta reveal">
        <a class="logo" href="#/">${logoMark()}<span>Shaffof<b>Nasiya</b></span></a>
        <p>Daftarni bugun raqamlashtiring — birinchi nasiyani kiritish 2 daqiqa oladi.</p>
        <a class="btn primary glow" href="${start}">${startTxt}</a>
      </div>
      <div class="foot-mark" aria-hidden="true">Shaffof</div>
      <div class="foot-line"><span>© 2026 Shaffof Nasiya</span><span>Toshkent telefon bozorlari sotuvchilari uchun</span></div>
    </footer>
  </div>`;

  el.querySelectorAll('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  // Menyu: qaysi bo‘lim ko‘rinayotganini belgilash
  const links = [...el.querySelectorAll('.l-nav a')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) links.forEach((l) => l.classList.toggle('on', l.getAttribute('href') === `#${e.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'imkoniyatlar', 'narxlar', 'savollar'].forEach((id) => { const s = el.querySelector('#' + id); if (s) io.observe(s); });
  }
}
